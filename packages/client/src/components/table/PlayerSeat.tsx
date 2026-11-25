import React from 'react';
import { PlayerState } from '@p0ker/shared';
import Card from './Card';
import { PokerChipIcon, SeatPlusIcon } from '../icons/CasinoIcons';

interface PlayerSeatProps {
  player?: PlayerState | null;
  seatNumber: number;
  isActiveTurn: boolean;
  isMe: boolean;
  isWinner?: boolean;
  handNumber?: number;
  onSit?: (seatNumber: number) => void;
}

// Seat 5 & 6 frame the female Dealer Booth cleanly at top-center (50%, 6%)
const SEAT_COORDINATES: Record<number, { left: string; top: string; dx: number; dy: number }> = {
  1: { left: '50%', top: '89%', dx: 0, dy: -260 },     // Bottom Center
  2: { left: '22%', top: '81%', dx: 180, dy: -220 },   // Bottom Left
  3: { left: '9%', top: '52%', dx: 260, dy: -130 },    // Middle Left
  4: { left: '16%', top: '21%', dx: 210, dy: -45 },    // Top Left
  5: { left: '32%', top: '12%', dx: 110, dy: -20 },    // Top Center-Left
  6: { left: '68%', top: '12%', dx: -110, dy: -20 },   // Top Center-Right
  7: { left: '84%', top: '21%', dx: -210, dy: -45 },   // Top Right
  8: { left: '91%', top: '52%', dx: -260, dy: -130 },  // Middle Right
  9: { left: '78%', top: '81%', dx: -180, dy: -220 },  // Bottom Right
};

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  seatNumber,
  isActiveTurn,
  isMe,
  isWinner = false,
  handNumber = 0,
  onSit,
}) => {
  const coord = SEAT_COORDINATES[seatNumber] || { left: '50%', top: '50%', dx: 0, dy: -120 };

  if (!player) {
    return (
      <div
        className={`seat-container empty-seat-container seat-pos-${seatNumber}`}
        style={{ left: coord.left, top: coord.top }}
      >
        <button
          className="btn-sit-here"
          onClick={() => onSit && onSit(seatNumber)}
        >
          <SeatPlusIcon size={16} className="seat-icon" />
          <span className="seat-label">Seat {seatNumber}</span>
        </button>
      </div>
    );
  }

  const isFolded = player.status === 'folded';
  const isAllIn = player.status === 'all-in';
  const isDisconnected = player.status === 'disconnected';
  const avatarInitial = player.username.slice(0, 2).toUpperCase();

  // Staggered deal delay per seat so cards appear to be dealt clockwise from the female Dealer
  const seatDelayBase = ((seatNumber - 1) % 9) * 65;

  return (
    <div
      className={`seat-container player-seat seat-pos-${seatNumber} ${isActiveTurn ? 'active-turn' : ''} ${
        isFolded ? 'folded' : ''
      } ${isMe ? 'is-me' : ''} ${isWinner ? 'is-winner' : ''}`}
      style={{ left: coord.left, top: coord.top }}
    >
      {/* Button / Blind Badges (BTN instead of D so it isn't confused with the female Dealer) */}
      <div className="badge-bar">
        {player.isBot && <span className="badge badge-bot">AI</span>}
        {player.isDealer && (
          <span className="badge badge-dealer" title="Button (Urutan Blind)">
            BTN
          </span>
        )}
        {player.isSmallBlind && <span className="badge badge-blind">SB</span>}
        {player.isBigBlind && <span className="badge badge-blind">BB</span>}
      </div>

      {/* Hole Cards */}
      <div className={`player-cards ${isMe ? 'my-hole-cards' : ''}`}>
        {isFolded ? (
          <div className="folded-text">FOLD</div>
        ) : player.holeCards && player.holeCards.length === 2 ? (
          <>
            <Card
              key={`${handNumber}-${player.userId}-0-${player.holeCards[0].rank}-${player.holeCards[0].suit}`}
              card={player.holeCards[0]}
              size={isMe ? 'medium' : 'mini'}
              dealDelay={seatDelayBase}
              dealFromX={coord.dx}
              dealFromY={coord.dy}
              flipReveal
              fanAngle={-6}
              highlight={isWinner}
            />
            <Card
              key={`${handNumber}-${player.userId}-1-${player.holeCards[1].rank}-${player.holeCards[1].suit}`}
              card={player.holeCards[1]}
              size={isMe ? 'medium' : 'mini'}
              dealDelay={seatDelayBase + 150}
              dealFromX={coord.dx}
              dealFromY={coord.dy}
              flipReveal
              fanAngle={6}
              highlight={isWinner}
            />
          </>
        ) : player.status !== 'sitting-out' ? (
          <>
            <Card
              key={`${handNumber}-${player.userId}-back-0`}
              hidden
              mini
              dealDelay={seatDelayBase}
              dealFromX={coord.dx}
              dealFromY={coord.dy}
              fanAngle={-6}
            />
            <Card
              key={`${handNumber}-${player.userId}-back-1`}
              hidden
              mini
              dealDelay={seatDelayBase + 150}
              dealFromX={coord.dx}
              dealFromY={coord.dy}
              fanAngle={6}
            />
          </>
        ) : null}
      </div>

      {/* Avatar & Countdown Timer Ring */}
      <div className="avatar-wrapper">
        {isActiveTurn && (
          <svg className="timer-svg" viewBox="0 0 60 60">
            <circle className="timer-circle-bg" cx="30" cy="30" r="27" />
            <circle className="timer-circle-progress" cx="30" cy="30" r="27" />
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
        <div className="player-chips">${player.chips.toLocaleString()}</div>
        {isAllIn && <div className="allin-tag">ALL-IN</div>}
        {isDisconnected && <div className="dc-tag">OFFLINE</div>}
      </div>

      {/* Bet Chip in front of seat */}
      {player.bet > 0 && (
        <div className="seat-bet-chip" key={`bet-${player.bet}`}>
          <PokerChipIcon size={13} className="chip-icon" />
          <span className="chip-amt">${player.bet.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default PlayerSeat;
