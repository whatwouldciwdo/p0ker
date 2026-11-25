import React from 'react';
import { SidePot } from '@p0ker/shared';

interface PotDisplayProps {
  pot: number;
  sidePots?: SidePot[];
  currentBet?: number;
}

export const PotDisplay: React.FC<PotDisplayProps> = ({ pot, sidePots = [] }) => {
  return (
    <div className="pot-display-wrapper fc-pot-wrapper fc6-pot-wrapper">
      <div className="fc6-pot-line">
        <span className="fc6-pot-label">TOTAL POT :</span>
        <span className="fc6-pot-amount">{pot.toLocaleString()}</span>
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
