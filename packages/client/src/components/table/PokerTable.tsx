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
  const [turnSeconds, setTurnSeconds] = useState(30);

  const prevPhaseRef = useRef<string>(tableState.phase);
  const prevHoleSigRef = useRef<string>('');
  const prevCommCountRef = useRef<number>(tableState.communityCards.length);
  const prevPotRef = useRef<number>(tableState.pot);
  const prevMyTurnRef = useRef<boolean>(false);
  const prevWinnersLenRef = useRef<number>(tableState.winners?.length || 0);
  const dealingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const me = tableState.players.find((p) => p.userId === myUserId);
  const myHoleSig = (me?.holeCards || []).map((c) => `${c.rank}${c.suit}`).join('-');

  const activePlayer = tableState.players.find(
    (p) => p.seat === tableState.currentPlayerSeat
  );
  const isMyTurn = Boolean(me && activePlayer && activePlayer.userId === myUserId);
  const highestBet = Math.max(0, ...tableState.players.map((p) => p.bet));

  // Turn countdown timer for the glowing FigCraft timer ring (bottom-left)
  useEffect(() => {
    if (!isMyTurn) {
      setTurnSeconds(0);
      return;
    }
    setTurnSeconds(30);
    const id = setInterval(() => {
      setTurnSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [isMyTurn, tableState.currentPlayerSeat, tableState.phase, tableState.pot]);

  const triggerDealingAnimation = (durationMs = 1000) => {
    setIsDealing(true);
    if (dealingTimeoutRef.current) clearTimeout(dealingTimeoutRef.current);
    dealingTimeoutRef.current = setTimeout(() => {
      setIsDealing(false);
    }, durationMs);
  };

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
    if (!nextMuted) soundEngine.playCardDeal(0);
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
      className="fc-table-canvas"
      onPointerDown={() => soundEngine.unlock()}
    >
      {/* Floating Rounded-Rectangle FigCraft Game Board (matches full table.png) */}
      <div className="poker-table-wrapper fc-game-board">
        {/* Top-Left 3-Petal Organic Cluster (Menu, Home, Bot) */}
        <div className="fc-corner-top-left">
          <div className="fc-petal-grid">
            <button
              type="button"
              className={`fc-petal-btn fc-petal-menu ${showSettings ? 'is-active' : ''}`}
              onClick={() => setShowSettings((v) => !v)}
              title="Settings"
            >
              <MenuBarsIcon size={18} />
            </button>

            <button
              type="button"
              className="fc-petal-btn fc-petal-home"
              onClick={onLeave}
              title="Kembali ke Lobi"
            >
              <HomeIcon size={17} />
            </button>

            <button
              type="button"
              className="fc-petal-btn fc-petal-bot"
              onClick={canAddBot ? onAddBot : handleToggleMute}
              title={canAddBot ? 'Tambah Bot AI' : muted ? 'Aktifkan Suara' : 'Matikan Suara'}
            >
              {canAddBot ? (
                <BotIcon size={17} />
              ) : muted ? (
                <SoundOffIcon size={16} />
              ) : (
                <SoundOnIcon size={16} />
              )}
            </button>
          </div>
          <span className="fc-petal-caption">
            {tableState.name}
          </span>
        </div>

        {/* Top-Right Organic Corner Exit Button + Sound Toggle */}
        <div className="fc-corner-top-right">
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
            <span className="badge badge-human-only" title="Meja khusus manusia">
              <UsersIcon size={13} />
            </span>
          )}
          <button
            type="button"
            className={`fc-neu-btn btn-sound-toggle ${muted ? 'is-muted' : ''}`}
            onClick={handleToggleMute}
            title={muted ? 'Aktifkan suara' : 'Matikan suara'}
          >
            {muted ? <SoundOffIcon size={16} /> : <SoundOnIcon size={16} />}
          </button>
          <button
            type="button"
            className="fc-petal-btn fc-petal-exit"
            onClick={onLeave}
            title="Keluar Meja"
          >
            <ExitDoorIcon size={19} />
          </button>
        </div>

        {/* Settings Drawer (Exact match for settings.png) */}
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

            {canAddBot && (
              <button
                type="button"
                className="fc-join-btn"
                style={{ width: '100%', marginTop: '4px' }}
                onClick={onAddBot}
              >
                + Tambah Bot AI
              </button>
            )}
          </aside>
        )}

        {/* Main Poker Arena */}
        <div className="poker-arena fc-arena-stage">
          {/* Borderless Soft-Beveled Slate-Indigo Oval Table */}
          <div className="poker-oval-felt fc-oval-table fc-oval-v5">
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

        {/* Bottom HUD: Corner Chat + Chip Balance + Timer Ring (Left) & Action Dock (Right) */}
        <div className="fc-bottom-hud fc-bottom-hud-v5">
          <div className="fc-bottom-left-hud">
            <button
              type="button"
              className={`fc-petal-btn fc-petal-chat ${showChat ? 'is-active' : ''}`}
              onClick={() => setShowChat((v) => !v)}
              title="Table Chat"
            >
              <ChatIcon size={17} />
              {chatMessages.length > 0 && !showChat && <span className="fc-chat-dot" />}
            </button>

            {me && (
              <div className="fc-my-chips-pill fc-chips-v5">
                <PokerChipIcon size={19} variant="blue" />
                <span className="fc-my-chips-val">${me.chips.toLocaleString()}</span>
                <span className="fc-chips-plus" title={`Blinds $${tableState.smallBlind}/$${tableState.bigBlind}`}>
                  +
                </span>
              </div>
            )}

            {/* Neon Circular Turn Timer (matches full table.png bottom center-left) */}
            <div className={`fc-turn-orb ${isMyTurn ? 'is-active' : ''}`} title="Waktu giliran">
              <span className="fc-turn-orb-num">
                {String(turnSeconds).padStart(2, '0')}
              </span>
            </div>
          </div>

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
    </div>
  );
};

export default PokerTable;
