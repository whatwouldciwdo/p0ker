import React, { useEffect, useRef, useState } from 'react';
import { TableState, PlayerAction } from '@p0ker/shared';
import PlayerSeat from './PlayerSeat';
import CommunityCards from './CommunityCards';
import PotDisplay from './PotDisplay';
import ActionDock from './ActionDock';
import DealerBooth from './DealerBooth';
import { soundEngine } from '../../utils/soundEngine';
import {
  BotIcon,
  ChatIcon,
  LogOutIcon,
  SoundOffIcon,
  SoundOnIcon,
  SpadeEmblemIcon,
  TrophyIcon,
  UsersIcon,
} from '../icons/CasinoIcons';

interface PokerTableProps {
  tableState: TableState;
  myUserId: string;
  onAction: (action: PlayerAction, amount?: number) => void;
  onLeave: () => void;
  onSendChat?: (message: string) => void;
  onAddBot?: () => void;
  onRemoveBot?: () => void;
  chatMessages?: Array<{ username: string; message: string; timestamp: number }>;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  tableState,
  myUserId,
  onAction,
  onLeave,
  onSendChat,
  onAddBot,
  onRemoveBot,
  chatMessages = [],
}) => {
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [muted, setMuted] = useState(() => soundEngine.isMuted());
  const [isDealing, setIsDealing] = useState(false);
  const [handEpoch, setHandEpoch] = useState(0);

  const prevPhaseRef = useRef<string>(tableState.phase);
  const prevHoleSigRef = useRef<string>('');
  const prevCommCountRef = useRef<number>(tableState.communityCards.length);
  const prevPotRef = useRef<number>(tableState.pot);
  const prevMyTurnRef = useRef<boolean>(false);
  const prevWinnersLenRef = useRef<number>(tableState.winners?.length || 0);
  const dealingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const me = tableState.players.find((p) => p.userId === myUserId);
  const myHoleSig = (me?.holeCards || []).map((c) => `${c.rank}${c.suit}`).join('-');

  // Active turn check
  const activePlayer = tableState.players.find(
    (p) => p.seat === tableState.currentPlayerSeat
  );
  const isMyTurn = Boolean(me && activePlayer && activePlayer.userId === myUserId);

  // Current highest bet among players in this round
  const highestBet = Math.max(0, ...tableState.players.map((p) => p.bet));

  const triggerDealingAnimation = (durationMs = 1000) => {
    setIsDealing(true);
    if (dealingTimeoutRef.current) clearTimeout(dealingTimeoutRef.current);
    dealingTimeoutRef.current = setTimeout(() => {
      setIsDealing(false);
    }, durationMs);
  };

  // Sound & dealing animations driven by tableState transitions
  useEffect(() => {
    const enteredPreFlop =
      tableState.phase === 'pre-flop' && prevPhaseRef.current !== 'pre-flop';
    const holeCardsChanged =
      Boolean(myHoleSig) && myHoleSig !== prevHoleSigRef.current;

    // 1. New hand dealt -> deal hole cards sound + dealer animation
    if (enteredPreFlop || (tableState.phase === 'pre-flop' && holeCardsChanged)) {
      setHandEpoch((n) => n + 1);
      const activeCount = Math.max(
        2,
        tableState.players.filter((p) => p.status !== 'sitting-out').length
      );
      const cardsToSound = Math.min(activeCount * 2, 8);
      triggerDealingAnimation(cardsToSound * 110 + 400);
      soundEngine.playDealSequence(cardsToSound, 105, false);
    }
    prevPhaseRef.current = tableState.phase;
    prevHoleSigRef.current = myHoleSig;

    // 2. New community cards (Flop / Turn / River) -> flip sound + dealer animation
    const commCount = tableState.communityCards.length;
    if (commCount > prevCommCountRef.current) {
      const newlyDealt = commCount - prevCommCountRef.current;
      triggerDealingAnimation(newlyDealt * 150 + 450);
      soundEngine.playDealSequence(newlyDealt, 135, true);
    }
    prevCommCountRef.current = commCount;

    // 3. Pot increased -> chip clink
    if (tableState.pot > prevPotRef.current) {
      soundEngine.playChipBet();
    }
    prevPotRef.current = tableState.pot;

    // 4. Winners announced -> celebratory chime
    const winnersLen = tableState.winners?.length || 0;
    if (winnersLen > 0 && prevWinnersLenRef.current === 0) {
      soundEngine.playWin();
    }
    prevWinnersLenRef.current = winnersLen;

    // 5. Turn alert when it becomes our turn
    if (isMyTurn && !prevMyTurnRef.current) {
      soundEngine.playTurnAlert();
    }
    prevMyTurnRef.current = isMyTurn;
  }, [
    tableState.phase,
    myHoleSig,
    tableState.communityCards.length,
    tableState.pot,
    tableState.winners,
    tableState.players,
    isMyTurn,
  ]);

  useEffect(() => {
    return () => {
      if (dealingTimeoutRef.current) clearTimeout(dealingTimeoutRef.current);
    };
  }, []);

  const handleToggleMute = () => {
    soundEngine.unlock();
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playCardDeal(0);
    }
  };

  const handlePlayerAction = (action: PlayerAction, amount?: number) => {
    soundEngine.unlock();
    if (action === 'fold') soundEngine.playFold();
    else if (action === 'check') soundEngine.playCheck();
    else soundEngine.playChipBet();
    onAction(action, amount);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat?.(chatInput.trim());
    setChatInput('');
  };

  const winnerUserIds = new Set((tableState.winners || []).map((w) => w.userId));
  const totalSeats = tableState.maxPlayers || 9;
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  return (
    <div
      className="poker-table-wrapper"
      onPointerDown={() => soundEngine.unlock()}
    >
      {/* Top Header Bar */}
      <header className="table-top-bar">
        <div className="table-meta">
          <span className="room-title">
            <SpadeEmblemIcon size={17} />
            <span>{tableState.name}</span>
          </span>
          <span className="blinds-badge">
            Blinds: ${tableState.smallBlind} / ${tableState.bigBlind}
          </span>
          <span className={`phase-badge phase-${tableState.phase}`}>
            {tableState.phase.toUpperCase()}
          </span>
        </div>

        <div className="table-top-actions">
          {tableState.allowBots !== false &&
            tableState.players.length < (tableState.maxPlayers || 9) && (
              <button
                type="button"
                className="btn btn-primary btn-add-bot"
                onClick={onAddBot}
                title="Tambah Bot AI ke meja"
              >
                <BotIcon size={15} />
                <span>+ Bot</span>
              </button>
            )}

          {tableState.allowBots !== false && tableState.players.some((p) => p.isBot) && (
            <button
              type="button"
              className="btn btn-outline btn-remove-bot"
              onClick={onRemoveBot}
              title="Keluarkan 1 Bot AI"
            >
              - Bot
            </button>
          )}

          {tableState.allowBots === false && (
            <span className="badge badge-human-only" title="Meja murni pemain manusia">
              <UsersIcon size={13} />
              <span>Khusus Manusia</span>
            </span>
          )}

          <button
            type="button"
            className={`btn btn-secondary btn-icon-only btn-sound-toggle ${muted ? 'is-muted' : ''}`}
            onClick={handleToggleMute}
            title={muted ? 'Aktifkan suara kartu' : 'Matikan suara kartu'}
          >
            {muted ? <SoundOffIcon size={16} /> : <SoundOnIcon size={16} />}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-icon-only btn-chat-toggle"
            onClick={() => setShowChat(!showChat)}
            title="Buka Chat Meja"
          >
            <ChatIcon size={16} />
          </button>
          <button
            type="button"
            className="btn btn-danger btn-leave"
            onClick={onLeave}
          >
            <LogOutIcon size={14} />
            <span className="leave-label">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Poker Arena */}
      <div className="poker-arena">
        {/* The Oval Felt Table */}
        <div className="poker-oval-felt">
          {/* Rail Accent Ring */}
          <div className="table-rail-inner" />

          {/* Dedicated Female Casino Dealer (Non-playing) */}
          <DealerBooth
            phase={tableState.phase}
            isDealing={isDealing}
            handNumber={handEpoch}
            hasWinners={Boolean(tableState.winners && tableState.winners.length > 0)}
          />

          {/* Center Stage: Pot & Community Cards */}
          <div className="table-center-stage">
            <PotDisplay
              pot={tableState.pot}
              sidePots={tableState.sidePots}
              currentBet={highestBet}
            />

            <CommunityCards
              cards={tableState.communityCards}
              handNumber={handEpoch}
            />

            {/* Winner Announcement Banner */}
            {tableState.winners && tableState.winners.length > 0 && (
              <div className="winner-banner">
                <div className="winner-trophy">
                  <TrophyIcon size={18} />
                </div>
                <div className="winner-details">
                  {tableState.winners.map((w, idx) => (
                    <div key={idx} className="winner-line">
                      <span className="winner-name">{w.username}</span> wins{' '}
                      <span className="winner-amount">${w.amount.toLocaleString()}</span>
                      {w.hand && <span className="winner-hand"> ({w.hand})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Player Seats */}
          {seats.map((seatNum) => {
            const player = tableState.players.find((p) => p.seat === seatNum);
            const isTurn = Boolean(
              player && tableState.currentPlayerSeat === seatNum
            );
            const isThisMe = Boolean(player && player.userId === myUserId);
            const isWin = Boolean(player && winnerUserIds.has(player.userId));

            return (
              <PlayerSeat
                key={seatNum}
                seatNumber={seatNum}
                player={player}
                isActiveTurn={isTurn}
                isMe={isThisMe}
                isWinner={isWin}
                handNumber={handEpoch}
              />
            );
          })}
        </div>
      </div>

      {/* Floating Chat Drawer */}
      {showChat && (
        <aside className="chat-drawer">
          <div className="chat-header">
            <h4>Table Chat</h4>
            <button
              type="button"
              className="chat-close"
              onClick={() => setShowChat(false)}
            >
              ✕
            </button>
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="chat-empty">No messages yet. Say hello!</div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="chat-message-row">
                  <span className="chat-author">{msg.username}:</span>{' '}
                  <span className="chat-text">{msg.message}</span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendChat} className="chat-form">
            <input
              type="text"
              placeholder="Type message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              maxLength={120}
            />
            <button type="submit">Send</button>
          </form>
        </aside>
      )}

      {/* Player Action Dock (Only rendered if player is seated and it's their turn) */}
      {isMyTurn && me && (
        <ActionDock
          currentBet={highestBet}
          myBet={me.bet}
          myChips={me.chips}
          bigBlind={tableState.bigBlind}
          pot={tableState.pot}
          onAction={handlePlayerAction}
        />
      )}
    </div>
  );
};

export default PokerTable;
