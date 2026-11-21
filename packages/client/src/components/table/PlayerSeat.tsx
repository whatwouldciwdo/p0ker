import React from 'react';
import { PlayerState } from '@p0ker/shared';
import Card from './Card';

interface PlayerSeatProps {
  player?: PlayerState | null;
  seatNumber: number;
  isActiveTurn: boolean;
  isMe: boolean;
  onSit?: (seatNumber: number) => void;
}

const SEAT_COORDINATES: Record<number, { left: string; top: string }> = {
  1: { left: '50%', top: '88%' },   // Bottom Center
  2: { left: '23%', top: '80%' },   // Bottom Left
  3: { left: '10%', top: '50%' },   // Middle Left
  4: { left: '20%', top: '20%' },   // Top Left
  5: { left: '38%', top: '12%' },   // Top Center-Left
  6: { left: '62%', top: '12%' },   // Top Center-Right
  7: { left: '80%', top: '20%' },   // Top Right
  8: { left: '90%', top: '50%' },   // Middle Right
  9: { left: '77%', top: '80%' },   // Bottom Right
};

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  seatNumber,
  isActiveTurn,
  isMe,
  onSit,
}) => {
  const coord = SEAT_COORDINATES[seatNumber] || { left: '50%', top: '50%' };

  if (!player) {
    return (
      <div
        className="seat-container empty-seat-container"
        style={{ left: coord.left, top: coord.top }}
      >
        <button
          className="btn-sit-here"
          onClick={() => onSit && onSit(seatNumber)}
        >
          <span className="seat-icon">🪑</span>
          <span className="seat-label">Seat {seatNumber}</span>
        </button>
      </div>
    );
  }

  const isFolded = player.status === 'folded';
  const isAllIn = player.status === 'all-in';
  const isDisconnected = player.status === 'disconnected';

  const avatarInitial = player.username.slice(0, 2).toUpperCase();

  return (
    <div
      className={`seat-container player-seat ${isActiveTurn ? 'active-turn' : ''} ${
        isFolded ? 'folded' : ''
      } ${isMe ? 'is-me' : ''}`}
      style={{ left: coord.left, top: coord.top }}
    >
      {/* Dealer / Blind Badges */}
      <div className="badge-bar">
        {player.isDealer && <span className="badge badge-dealer">D</span>}
        {player.isSmallBlind && <span className="badge badge-blind">SB</span>}
        {player.isBigBlind && <span className="badge badge-blind">BB</span>}
      </div>

      {/* Hole Cards */}
      <div className="player-cards">
        {isFolded ? (
          <div className="folded-text">FOLD</div>
        ) : player.holeCards && player.holeCards.length === 2 ? (
          <>
            <Card card={player.holeCards[0]} mini />
            <Card card={player.holeCards[1]} mini />
          </>
        ) : player.status !== 'sitting-out' ? (
          <>
            <Card hidden mini />
            <Card hidden mini />
          </>
        ) : null}
      </div>

      {/* Avatar & Countdown Timer Ring */}
      <div className="avatar-wrapper">
        {isActiveTurn && (
          <svg className="timer-svg" viewBox="0 0 60 60">
            <circle
              className="timer-circle-bg"
              cx="30"
              cy="30"
              r="27"
            />
            <circle
              className="timer-circle-progress"
              cx="30"
              cy="30"
              r="27"
            />
          </svg>
        )}
        <div className="player-avatar">
          <span>{avatarInitial}</span>
        </div>
      </div>

      {/* Player info card */}
      <div className="player-card-info">
        <div className="player-name" title={player.username}>
          {player.username}
        </div>
        <div className="player-chips">
          ${player.chips.toLocaleString()}
        </div>
        {isAllIn && <div className="allin-tag">ALL-IN</div>}
        {isDisconnected && <div className="dc-tag">OFFLINE</div>}
      </div>

      {/* Bet Chip in front of seat */}
      {player.bet > 0 && (
        <div className="seat-bet-chip">
          <span className="chip-icon">🟡</span>
          <span className="chip-amt">${player.bet.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default PlayerSeat;
