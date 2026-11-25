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
  ExitDoorIcon,
  HomeIcon,
  MenuBarsIcon,
  PokerChipIcon,
  SoundOffIcon,
  SoundOnIcon,
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
  const [showSettings, setShowSettings] = useState(false);
  const [muted, setMuted] = useState(() => soundEngine.isMuted());
  const [volume, setVolume] = useState(() => Math.round(soundEngine.getVolume() * 100));
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

    const commCount = tableState.communityCards.length;
    if (commCount > prevCommCountRef.current) {
      const newlyDealt = commCount - prevCommCountRef.current;
      triggerDealingAnimation(newlyDealt * 150 + 450);
      soundEngine.playDealSequence(newlyDealt, 135, true);
    }
    prevCommCountRef.current = commCount;

    if (tableState.pot > prevPotRef.current) {
      soundEngine.playChipBet();
    }
    prevPotRef.current = tableState.pot;

    const winnersLen = tableState.winners?.length || 0;
    if (winnersLen > 0 && prevWinnersLenRef.current === 0) {
      soundEngine.playWin();
    }
    prevWinnersLenRef.current = winnersLen;

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

  const handleVolumeChange = (nextVal: number) => {
    soundEngine.unlock();
    setVolume(nextVal);
    soundEngine.setVolume(nextVal / 100);
    if (nextVal > 0 && muted) {
      soundEngine.setMuted(false);
      setMuted(false);
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
  const canAddBot =
    tableState.allowBots !== false &&
    tableState.players.length < (tableState.maxPlayers || 9);
  const hasBots =
    tableState.allowBots !== false && tableState.players.some((p) => p.isBot);

  return (
    <div
      className="poker-table-wrapper fc-table-shell"
      onPointerDown={() => soundEngine.unlock()}
    >
      {/* Top Compact Floating Controls (FigCraft Neumorphic Style) */}
      <header className="table-top-bar fc-top-bar">
        <div className="fc-top-left-cluster">
          <button
            type="button"
            className={`fc-neu-btn ${showSettings ? 'is-active' : ''}`}
            onClick={() => setShowSettings((v) => !v)}
            title="Settings"
          >
            <MenuBarsIcon size={17} />
          </button>

          <button
            type="button"
            className="fc-neu-btn"
            onClick={onLeave}
            title="Kembali ke Lobi"
          >
            <HomeIcon size={16} />
          </button>

          {canAddBot && (
            <button
              type="button"
              className="fc-neu-pill-btn fc-bot-add-btn"
              onClick={onAddBot}
              title="Tambah Bot AI ke meja"
            >
              <BotIcon size={15} />
              <span>+ Bot</span>
            </button>
          )}

          {hasBots && (
            <button
              type="button"
              className="fc-neu-pill-btn fc-bot-rem-btn"
              onClick={onRemoveBot}
              title="Keluarkan 1 Bot AI"
            >
              - Bot
            </button>
          )}

          {tableState.allowBots === false && (
            <span className="badge badge-human-only" title="Meja murni pemain manusia">
              <UsersIcon size={13} />
              <span>Manusia</span>
            </span>
          )}
        </div>

        <div className="table-meta fc-center-meta">
          <span className="room-title">{tableState.name}</span>
          <span className="blinds-badge">
            ${tableState.smallBlind} / ${tableState.bigBlind}
          </span>
          <span className={`phase-badge phase-${tableState.phase}`}>
            {tableState.phase.toUpperCase()}
          </span>
        </div>

        <div className="table-top-actions fc-top-right-cluster">
          <button
            type="button"
            className={`fc-neu-btn btn-sound-toggle ${muted ? 'is-muted' : ''}`}
            onClick={handleToggleMute}
            title={muted ? 'Aktifkan suara kartu' : 'Matikan suara kartu'}
          >
            {muted ? <SoundOffIcon size={16} /> : <SoundOnIcon size={16} />}
          </button>

          <button
            type="button"
            className="fc-neu-btn fc-exit-btn"
            onClick={onLeave}
            title="Keluar Meja"
          >
            <ExitDoorIcon size={17} />
          </button>
        </div>
      </header>

      {/* FigCraft Frosted Settings Drawer (Left Side) */}
      {showSettings && (
        <aside className="fc-settings-drawer">
          <div className="fc-settings-header">
            <h3>Settings</h3>
            <button
              type="button"
              className="fc-drawer-close"
              onClick={() => setShowSettings(false)}
            >
              ✕
            </button>
          </div>

          <div className="fc-settings-group">
            <div className="fc-settings-label-row">
              <span>Volume</span>
              <span className="fc-settings-val">{volume}%</span>
            </div>
            <input
              type="range"
              className="fc-raise-slider"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
            />
          </div>

          <div className="fc-settings-group fc-toggle-row">
            <span>Sound Effects</span>
            <button
              type="button"
              className={`fc-switch ${!muted ? 'is-on' : ''}`}
              onClick={handleToggleMute}
              aria-pressed={!muted}
            >
              <span className="fc-switch-knob" />
            </button>
          </div>

          <div className="fc-settings-group fc-toggle-row">
            <span>Chatbox</span>
            <button
              type="button"
              className={`fc-switch ${showChat ? 'is-on' : ''}`}
              onClick={() => setShowChat((v) => !v)}
              aria-pressed={showChat}
            >
              <span className="fc-switch-knob" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Poker Arena */}
      <div className="poker-arena">
        {/* The FigCraft Slate-Indigo Oval Table */}
        <div className="poker-oval-felt fc-oval-table">
          <div className="table-rail-inner fc-table-inner-bevel" />

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

      {/* Bottom Bar: Chat & Chip Balance (Left) + Action Dock (Right / Full Mobile) */}
      <div className="fc-bottom-hud">
        <div className="fc-bottom-left-hud">
          <button
            type="button"
            className={`fc-neu-btn fc-chat-fab ${showChat ? 'is-active' : ''}`}
            onClick={() => setShowChat((v) => !v)}
            title="Table Chat"
          >
            <ChatIcon size={17} />
            {chatMessages.length > 0 && !showChat && <span className="fc-chat-dot" />}
          </button>

          {me && (
            <div className="fc-my-chips-pill">
              <PokerChipIcon size={18} variant="blue" />
              <span className="fc-my-chips-val">${me.chips.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Player Action Dock (Only rendered when it's our turn) */}
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

      {/* Floating Chat Drawer */}
      {showChat && (
        <aside className="chat-drawer fc-chat-drawer">
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
    </div>
  );
};

export default PokerTable;
