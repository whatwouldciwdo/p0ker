import React from 'react';
import { GamePhase } from '@p0ker/shared';

interface DealerBoothProps {
  phase: GamePhase;
  isDealing: boolean;
  handNumber: number;
  hasWinners: boolean;
}

const PHASE_LINES: Record<GamePhase, string> = {
  waiting: 'Menunggu pemain...',
  'pre-flop': 'Kartu dibagikan',
  flop: 'Flop dibuka!',
  turn: 'Kartu Turn!',
  river: 'Kartu River!',
  showdown: 'Showdown!',
};

export const DealerBooth: React.FC<DealerBoothProps> = ({
  phase,
  isDealing,
  handNumber,
  hasWinners,
}) => {
  const statusText = hasWinners
    ? 'Selamat pemenang!'
    : isDealing
    ? 'Membagikan kartu...'
    : PHASE_LINES[phase] || 'Siap bermain';

  return (
    <div className={`dealer-booth ${isDealing ? 'is-dealing' : ''}`} title="Dealer Kasino (Tidak ikut bermain)">
      <div className="dealer-avatar-frame">
        <div className="dealer-glow-ring" />
        <img
          src="/dealer-woman.jpg"
          alt="Casino Dealer"
          className="dealer-portrait"
          width={72}
          height={72}
          draggable={false}
        />
        <span className="dealer-role-pill">DEALER</span>
      </div>

      {/* Animated Card Shoe / Deck beside the dealer */}
      <div className={`dealer-deck-shoe ${isDealing ? 'dealing-shoe' : ''}`} aria-hidden="true">
        <div className="deck-card deck-card-3" />
        <div className="deck-card deck-card-2" />
        <div className="deck-card deck-card-1" />
      </div>

      {/* Live Dealer Status Bubble */}
      <div className="dealer-speech" key={`${phase}-${isDealing}-${hasWinners}-${handNumber}`}>
        <span className="dealer-name">Elena</span>
        <span className="dealer-sep">•</span>
        <span className="dealer-status">{statusText}</span>
      </div>
    </div>
  );
};

export default DealerBooth;
