import React, { useEffect, useRef, useState } from 'react';
import { TableState, PlayerAction } from '@p0ker/shared';
import PlayerSeat from './PlayerSeat';
import CommunityCards from './CommunityCards';
import PotDisplay from './PotDisplay';
import ActionDock from './ActionDock';
import Card from './Card';
import { soundEngine } from '../../utils/soundEngine';
import {
  BotIcon,
  ChatIcon,
  ExitDoorIcon,
  HomeIcon,
  MenuBarsIcon,
  PawIcon,
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
  const [showHighHand, setShowHighHand] = useState(false);
  const [muted, setMuted] = useState(() => soundEngine.isMuted());
  const [volume, setVolume] = useState(() => Math.round(soundEngine.getVolume() * 100));
  const [handEpoch, setHandEpoch] = useState(0);
  const [turnSeconds, setTurnSeconds] = useState(15);

  const prevPhaseRef = useRef<string>(tableState.phase);
  const prevHoleSigRef = useRef<string>('');
  const prevCommCountRef = useRef<number>(tableState.communityCards.length);
  const prevPotRef = useRef<number>(tableState.pot);
  const prevMyTurnRef = useRef<boolean>(false);
  const prevWinnersLenRef = useRef<number>(tableState.winners?.length || 0);

  const me = tableState.players.find((p) => p.userId === myUserId);
  const myHoleSig = (me?.holeCards || []).map((c) => `${c.rank}${c.suit}`).join('-');

  const activePlayer = tableState.players.find(
    (p) => p.seat === tableState.currentPlayerSeat
  );
  const isMyTurn = Boolean(me && activePlayer && activePlayer.userId === myUserId);
  const highestBet = Math.max(0, ...tableState.players.map((p) => p.bet));

  useEffect(() => {
    if (!activePlayer) {
      setTurnSeconds(0);
      return;
    }
    setTurnSeconds(30);
    const id = setInterval(() => {
      setTurnSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [activePlayer?.userId, tableState.currentPlayerSeat, tableState.phase, tableState.pot]);

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
      soundEngine.playDealSequence(cardsToSound, 105, false);
    }
    prevPhaseRef.current = tableState.phase;
    prevHoleSigRef.current = myHoleSig;

    const commCount = tableState.communityCards.length;
    if (commCount > prevCommCountRef.current) {
      const newlyDealt = commCount - prevCommCountRef.current;
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
  const totalSeats = tableState.maxPlayers || 6;
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);
  const canAddBot =
    tableState.allowBots !== false &&
    tableState.players.length < totalSeats;
  const hasBots =
    tableState.allowBots !== false && tableState.players.some((p) => p.isBot);

  return (
    <div
      className="fc-table-canvas fc6-canvas"
      onPointerDown={() => soundEngine.unlock()}
    >
      {/* Matte Charcoal FigCraft Desktop HD Board (#11382) */}
      <div className="poker-table-wrapper fc6-board">
        {/* Top-Left Minimal Controls + High Hand Badge */}
        <div className="fc6-top-left">
          <div className="fc6-nav-icons">
            <button
              type="button"
              className={`fc6-icon-btn ${showSettings ? 'is-active' : ''}`}
              onClick={() => setShowSettings((v) => !v)}
              title="Settings"
            >
              <MenuBarsIcon size={20} />
            </button>

            <button
              type="button"
              className="fc6-icon-btn"
              onClick={onLeave}
              title="Kembali ke Lobi"
            >
              <HomeIcon size={19} />
            </button>

            <span className="fc6-table-meta" title={tableState.name}>
              {tableState.name} · ${tableState.smallBlind}/${tableState.bigBlind}
            </span>
          </div>

          <button
            type="button"
            className={`fc6-highhand-btn ${showHighHand ? 'is-active' : ''}`}
            onClick={() => setShowHighHand((v) => !v)}
          >
            <span className="fc6-highhand-icon">
              <PawIcon size={18} />
            </span>
            <span className="fc6-highhand-label">High Hand</span>
          </button>

          {/* High Hand Popover (matches #12364) */}
          {showHighHand && (
            <div className="fc6-highhand-popover">
              <div className="fc6-hh-header">
                <span>High Hand</span>
                <button
                  type="button"
                  className="fc6-hh-close"
                  onClick={() => setShowHighHand(false)}
                >
                  ✕
                </button>
              </div>
              <div className="fc6-hh-cards">
                {tableState.communityCards.length > 0 ? (
                  tableState.communityCards.slice(0, 5).map((c, i) => (
                    <Card key={i} card={c} size="mini" />
                  ))
                ) : (
                  <div className="fc6-hh-empty">Menunggu kartu board...</div>
                )}
              </div>
              <div className="fc6-hh-footer">
                <span className="fc6-hh-sub">Phase</span>
                <span className="fc6-hh-timer">{tableState.phase.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Minimal Controls */}
        <div className="fc6-top-right">
          {canAddBot && (
            <button
              type="button"
              className="fc6-pill-ctrl"
              onClick={onAddBot}
              title="Tambah Bot AI"
            >
              <BotIcon size={14} />
              <span>+ Bot</span>
            </button>
          )}
          {hasBots && (
            <button
              type="button"
              className="fc6-pill-ctrl fc6-pill-danger"
              onClick={onRemoveBot}
              title="Keluarkan 1 Bot AI"
            >
              - Bot
            </button>
          )}
          {tableState.allowBots === false && (
            <span className="fc6-pill-ctrl" title="Meja khusus manusia">
              <UsersIcon size={13} />
            </span>
          )}
          <button
            type="button"
            className={`fc6-icon-btn ${muted ? 'is-muted' : ''}`}
            onClick={handleToggleMute}
            title={muted ? 'Aktifkan suara' : 'Matikan suara'}
          >
            {muted ? <SoundOffIcon size={18} /> : <SoundOnIcon size={18} />}
          </button>
          <button
            type="button"
            className="fc6-icon-btn"
            onClick={onLeave}
            title="Keluar Meja"
          >
            <ExitDoorIcon size={20} />
          </button>
        </div>

        {/* Settings Drawer */}
        {showSettings && (
          <aside className="fc-settings-drawer fc6-settings-drawer">
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
                className="fc6-range-slider"
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
                className="fc6-btn fc6-btn-bet"
                style={{ width: '100%', height: '38px', marginTop: '6px' }}
                onClick={onAddBot}
              >
                + Tambah Bot AI
              </button>
            )}
          </aside>
        )}

        {/* Main Poker Arena */}
        <div className="poker-arena fc6-arena">
          <div className="poker-oval-felt fc6-oval-table">
            {/* Center Stage: TOTAL POT + 5 Community Cards */}
            <div className="table-center-stage fc6-center-stage">
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
                <div className="winner-banner fc6-winner-banner">
                  <div className="winner-trophy">
                    <TrophyIcon size={17} />
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
                  totalSeats={totalSeats}
                  player={player}
                  isActiveTurn={isTurn}
                  isMe={isThisMe}
                  isWinner={isWin}
                  handNumber={handEpoch}
                  turnSeconds={isTurn ? turnSeconds : 0}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom HUD: Chat + Balance Box (Left) & Action Dock (Right) */}
        <div className="fc6-bottom-hud">
          <div className="fc6-bottom-left">
            <button
              type="button"
              className={`fc6-chat-trigger ${showChat ? 'is-active' : ''}`}
              onClick={() => setShowChat((v) => !v)}
              title="Table Chat"
            >
              <ChatIcon size={20} />
              {chatMessages.length > 0 && !showChat && <span className="fc6-chat-dot" />}
            </button>

            {me && (
              <div className="fc6-balance-group">
                <div className="fc6-balance-box">
                  <PokerChipIcon size={20} variant="blue" />
                  <span className="fc6-balance-num">{me.chips.toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  className="fc6-balance-plus"
                  onClick={() => setShowSettings((v) => !v)}
                  title={`Blinds $${tableState.smallBlind}/$${tableState.bigBlind}`}
                >
                  +
                </button>
              </div>
            )}
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
          <aside className="chat-drawer fc6-chat-drawer">
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
