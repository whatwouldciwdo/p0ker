import React, { useState } from 'react';
import { TableState, PlayerAction } from '@p0ker/shared';
import PlayerSeat from './PlayerSeat';
import CommunityCards from './CommunityCards';
import PotDisplay from './PotDisplay';
import ActionDock from './ActionDock';

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

  const me = tableState.players.find((p) => p.userId === myUserId);
  const mySeat = me ? me.seat : null;

  // Active turn check
  const activePlayer = tableState.players.find(
    (p) => p.seat === tableState.currentPlayerSeat
  );
  const isMyTurn = Boolean(me && activePlayer && activePlayer.userId === myUserId);

  // Current highest bet among players in this round
  const highestBet = Math.max(0, ...tableState.players.map((p) => p.bet));

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat?.(chatInput.trim());
    setChatInput('');
  };

  // 9 seats configuration
  const totalSeats = tableState.maxPlayers || 9;
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  return (
    <div className="poker-table-wrapper">
      {/* Top Header Bar */}
      <header className="table-top-bar">
        <div className="table-meta">
          <span className="room-title">♠ {tableState.name}</span>
          <span className="blinds-badge">
            Blinds: ${tableState.smallBlind} / ${tableState.bigBlind}
          </span>
          <span className="phase-badge phase-{tableState.phase}">
            {tableState.phase.toUpperCase()}
          </span>
        </div>

        <div className="table-top-actions">
          {tableState.players.length < (tableState.maxPlayers || 9) && (
            <button
              type="button"
              className="btn btn-primary btn-add-bot"
              onClick={onAddBot}
              title="Tambah Bot AI ke meja"
            >
              🤖 + Bot
            </button>
          )}

          {tableState.players.some((p) => p.isBot) && (
            <button
              type="button"
              className="btn btn-outline btn-remove-bot"
              onClick={onRemoveBot}
              title="Keluarkan 1 Bot AI"
            >
              - Bot
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-chat-toggle"
            onClick={() => setShowChat(!showChat)}
          >
            💬
          </button>
          <button
            type="button"
            className="btn btn-danger btn-leave"
            onClick={onLeave}
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Poker Arena */}
      <div className="poker-arena">
        {/* The Oval Felt Table */}
        <div className="poker-oval-felt">
          {/* Rail Accent Ring */}
          <div className="table-rail-inner" />

          {/* Center Stage: Pot & Community Cards */}
          <div className="table-center-stage">
            <PotDisplay
              pot={tableState.pot}
              sidePots={tableState.sidePots}
              currentBet={highestBet}
            />

            <CommunityCards cards={tableState.communityCards} />

            {/* Winner Announcement Banner */}
            {tableState.winners && tableState.winners.length > 0 && (
              <div className="winner-banner">
                <div className="winner-trophy">🏆</div>
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

          {/* Player Seats (Fixed 9 Positions) */}
          {seats.map((seatNum) => {
            const player = tableState.players.find((p) => p.seat === seatNum);
            const isTurn = Boolean(
              player && tableState.currentPlayerSeat === seatNum
            );
            const isThisMe = Boolean(player && player.userId === myUserId);

            return (
              <PlayerSeat
                key={seatNum}
                seatNumber={seatNum}
                player={player}
                isActiveTurn={isTurn}
                isMe={isThisMe}
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
          onAction={onAction}
        />
      )}
    </div>
  );
};

export default PokerTable;
