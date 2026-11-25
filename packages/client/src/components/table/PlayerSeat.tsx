import React from 'react';
import { PlayerState } from '@p0ker/shared';
import Card from './Card';
import { PokerChipIcon } from '../icons/CasinoIcons';

interface PlayerSeatProps {
  player?: PlayerState | null;
  seatNumber: number;
  totalSeats?: number;
  isActiveTurn: boolean;
  isMe: boolean;
  isWinner?: boolean;
  handNumber?: number;
  turnSeconds?: number;
  onSit?: (seatNumber: number) => void;
}

interface SeatCoord {
  left: string;
  top: string;
  dx: number;
  dy: number;
  side: 'left' | 'right' | 'center';
  betPos: 'top' | 'bottom' | 'left' | 'right';
}

// Exact 6-Max positions matching FigCraft Desktop Full HD (#11382)
const SEAT_COORDS_6: Record<number, SeatCoord> = {
  1: { left: '50%', top: '96%', dx: 0, dy: -240, side: 'center', betPos: 'top' },      // Bottom Center
  2: { left: '12%', top: '76%', dx: 220, dy: -180, side: 'left', betPos: 'right' },   // Bottom Left
  3: { left: '13%', top: '24%', dx: 210, dy: -40, side: 'left', betPos: 'right' },    // Top Left
  4: { left: '50%', top: '4%', dx: 0, dy: 40, side: 'center', betPos: 'bottom' },     // Top Center
  5: { left: '87%', top: '24%', dx: -210, dy: -40, side: 'right', betPos: 'left' },   // Top Right
  6: { left: '88%', top: '76%', dx: -220, dy: -180, side: 'right', betPos: 'left' },  // Bottom Right
};

// 9-Max positions matching FigCraft Desktop Full HD 9-hand (#11772)
const SEAT_COORDS_9: Record<number, SeatCoord> = {
  1: { left: '50%', top: '96%', dx: 0, dy: -260, side: 'center', betPos: 'top' },
  2: { left: '17%', top: '84%', dx: 180, dy: -220, side: 'left', betPos: 'right' },
  3: { left: '6%', top: '52%', dx: 260, dy: -130, side: 'left', betPos: 'right' },
  4: { left: '16%', top: '18%', dx: 210, dy: -45, side: 'left', betPos: 'right' },
  5: { left: '36%', top: '4%', dx: 110, dy: -20, side: 'left', betPos: 'bottom' },
  6: { left: '64%', top: '4%', dx: -110, dy: -20, side: 'right', betPos: 'bottom' },
  7: { left: '84%', top: '18%', dx: -210, dy: -45, side: 'right', betPos: 'left' },
  8: { left: '94%', top: '52%', dx: -260, dy: -130, side: 'right', betPos: 'left' },
  9: { left: '83%', top: '84%', dx: -180, dy: -220, side: 'right', betPos: 'left' },
};

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  seatNumber,
  totalSeats = 6,
  isActiveTurn,
  isMe,
  isWinner = false,
  handNumber = 0,
  turnSeconds = 0,
  onSit,
}) => {
  const map = totalSeats <= 6 ? SEAT_COORDS_6 : SEAT_COORDS_9;
  const coord = map[seatNumber] || {
    left: '50%',
    top: '50%',
    dx: 0,
    dy: -120,
    side: 'center' as const,
    betPos: 'top' as const,
  };

  if (!player) {
    return (
      <div
        className={`seat-container fc6-seat empty-seat-container seat-pos-${seatNumber} fc6-side-${coord.side}`}
        style={{ left: coord.left, top: coord.top }}
      >
        <button
          type="button"
          className="fc6-empty-plate"
          onClick={() => onSit && onSit(seatNumber)}
          title={`Duduk di Seat ${seatNumber}`}
        >
          <div className="fc6-empty-body">
            <span className="fc6-empty-dash">—</span>
            <span className="fc6-empty-num">{seatNumber}</span>
          </div>
          <span className="fc6-empty-plus">+</span>
        </button>
      </div>
    );
  }

  const isFolded = player.status === 'folded';
  const isAllIn = player.status === 'all-in';
  const isDisconnected = player.status === 'disconnected';
  const avatarInitial = player.username.slice(0, 2).toUpperCase();
  const seatDelayBase = ((seatNumber - 1) % 9) * 65;

  return (
    <div
      className={`seat-container fc6-seat player-seat seat-pos-${seatNumber} fc6-side-${coord.side} ${
        isActiveTurn ? 'active-turn' : ''
      } ${isFolded ? 'folded' : ''} ${isMe ? 'is-me' : ''} ${isWinner ? 'is-winner' : ''}`}
      style={{ left: coord.left, top: coord.top }}
    >
      {/* Hole Cards tucked directly behind the trapezoid plate */}
      <div className={`player-cards fc6-seat-cards ${isMe ? 'my-hole-cards' : ''}`}>
        {player.holeCards && player.holeCards.length === 2 ? (
          <>
            <Card
              key={`${handNumber}-${player.userId}-0-${player.holeCards[0].rank}-${player.holeCards[0].suit}`}
              card={player.holeCards[0]}
              size={isMe ? 'medium' : 'mini'}
              dealDelay={seatDelayBase}
              dealFromX={coord.dx}
              dealFromY={coord.dy}
              flipReveal
              fanAngle={0}
              highlight={isWinner}
            />
            <Card
              key={`${handNumber}-${player.userId}-1-${player.holeCards[1].rank}-${player.holeCards[1].suit}`}
              card={player.holeCards[1]}
              size={isMe ? 'medium' : 'mini'}
              dealDelay={seatDelayBase + 130}
              dealFromX={coord.dx}
              dealFromY={coord.dy}
              flipReveal
              fanAngle={0}
              highlight={isWinner}
            />
          </>
        ) : player.status !== 'sitting-out' && !isFolded ? (
          <>
            <Card
              key={`${handNumber}-${player.userId}-back-0`}
              hidden
              mini
              dealDelay={seatDelayBase}
              dealFromX={coord.dx}
              dealFromY={coord.dy}
              fanAngle={0}
            />
            <Card
              key={`${handNumber}-${player.userId}-back-1`}
              hidden
              mini
              dealDelay={seatDelayBase + 130}
              dealFromX={coord.dx}
              dealFromY={coord.dy}
              fanAngle={0}
            />
          </>
        ) : null}
      </div>

      {/* Active Turn Square Timer Badge (exact match to 15 badge in #11382) */}
      {isActiveTurn && (
        <div className="fc6-turn-badge" title="Waktu giliran">
          <svg className="fc6-turn-svg" viewBox="0 0 40 40">
            <rect className="fc6-turn-track" x="2.5" y="2.5" width="35" height="35" rx="7" />
            <rect className="fc6-turn-progress" x="2.5" y="2.5" width="35" height="35" rx="7" />
          </svg>
          <span className="fc6-turn-num">{String(turnSeconds || 15).padStart(2, '0')}</span>
        </div>
      )}

      {/* Trapezoid Dark Matte Plate */}
      <div className="fc6-plate">
        <div className="fc6-avatar-square">
          <span>{avatarInitial}</span>
          {player.isBot && <span className="fc6-bot-pip">AI</span>}
        </div>

        <div className="fc6-plate-info">
          <div className="fc6-plate-top">
            <span className="fc6-chip-val">{player.chips.toLocaleString()}</span>
            <PokerChipIcon size={13} variant="blue" className="fc6-plate-chip-ic" />
          </div>

          <div className={`fc6-plate-bottom ${isFolded ? 'is-folded' : ''}`}>
            {isFolded ? (
              <>
                <span className="fc6-status-fold">FOLD</span>
                <span className="fc6-seat-num">{seatNumber}</span>
              </>
            ) : isAllIn ? (
              <>
                <span className="fc6-status-allin">ALL-IN</span>
                <span className="fc6-seat-num">{seatNumber}</span>
              </>
            ) : isDisconnected ? (
              <>
                <span className="fc6-status-dc">OFFLINE</span>
                <span className="fc6-seat-num">{seatNumber}</span>
              </>
            ) : (
              <>
                <span className="fc6-seat-num">{seatNumber}</span>
                <span className="fc6-player-name" title={player.username}>
                  {player.username}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Felt Bet Cluster + Dealer / Blind Markers */}
      {(player.bet > 0 || player.isDealer || player.isSmallBlind || player.isBigBlind) && (
        <div className={`fc6-bet-cluster fc6-bet-${coord.betPos}`} key={`bet-${player.bet}`}>
          {player.isDealer && (
            <span className="fc6-marker fc6-marker-d" title="Dealer Button">
              D
            </span>
          )}
          {player.isSmallBlind && (
            <span className="fc6-marker fc6-marker-s" title="Small Blind">
              S
            </span>
          )}
          {player.isBigBlind && (
            <span className="fc6-marker fc6-marker-s" title="Big Blind">
              B
            </span>
          )}
          {player.bet > 0 && (
            <div className="fc6-bet-pill">
              <PokerChipIcon size={14} variant={player.bet >= 100 ? 'pink' : 'blue'} />
              <span>{player.bet.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerSeat;
