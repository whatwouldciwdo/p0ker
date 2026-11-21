import React from 'react';
import { SidePot } from '@p0ker/shared';

interface PotDisplayProps {
  pot: number;
  sidePots?: SidePot[];
  currentBet?: number;
}

export const PotDisplay: React.FC<PotDisplayProps> = ({ pot, sidePots = [] }) => {
  return (
    <div className="pot-display-wrapper">
      <div className="pot-pill">
        <span className="pot-icon">🪙</span>
        <span className="pot-label">POT:</span>
        <span className="pot-amount">${pot.toLocaleString()}</span>
      </div>

      {sidePots.length > 0 && (
        <div className="side-pots">
          {sidePots.map((sp, idx) => (
            <div key={idx} className="side-pot-pill">
              Side {idx + 1}: ${sp.amount.toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PotDisplay;
