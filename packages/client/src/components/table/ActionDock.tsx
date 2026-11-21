import React, { useState, useEffect } from 'react';
import { PlayerAction } from '@p0ker/shared';

interface ActionDockProps {
  currentBet: number;
  myBet: number;
  myChips: number;
  bigBlind: number;
  pot: number;
  onAction: (action: PlayerAction, amount?: number) => void;
}

export const ActionDock: React.FC<ActionDockProps> = ({
  currentBet,
  myBet,
  myChips,
  bigBlind,
  pot,
  onAction,
}) => {
  const toCall = Math.max(0, currentBet - myBet);
  const canCheck = toCall === 0;

  const minRaise = Math.max(bigBlind, currentBet * 2);
  const maxRaise = myChips + myBet;

  const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);

  useEffect(() => {
    setRaiseAmount(Math.min(maxRaise, Math.max(minRaise, currentBet + bigBlind)));
  }, [currentBet, bigBlind, maxRaise, minRaise]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaiseAmount(Number(e.target.value));
  };

  const setPresetRaise = (fraction: number) => {
    let amt = Math.round(pot * fraction) + currentBet;
    amt = Math.max(minRaise, Math.min(amt, maxRaise));
    setRaiseAmount(amt);
  };

  return (
    <div className="action-dock-container">
      <div className="action-dock">
        {/* Raise controls */}
        {myChips > toCall && (
          <div className="raise-panel">
            <div className="presets-bar">
              <button
                type="button"
                className="btn-preset"
                onClick={() => setRaiseAmount(minRaise)}
              >
                Min
              </button>
              <button
                type="button"
                className="btn-preset"
                onClick={() => setPresetRaise(0.5)}
              >
                1/2 Pot
              </button>
              <button
                type="button"
                className="btn-preset"
                onClick={() => setPresetRaise(1.0)}
              >
                Pot
              </button>
              <button
                type="button"
                className="btn-preset"
                onClick={() => setRaiseAmount(maxRaise)}
              >
                Max
              </button>
            </div>

            <div className="slider-row">
              <input
                type="range"
                className="raise-slider"
                min={minRaise}
                max={maxRaise}
                step={bigBlind}
                value={raiseAmount}
                onChange={handleSliderChange}
              />
              <span className="raise-preview">${raiseAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="buttons-row">
          <button
            type="button"
            className="btn btn-action btn-fold"
            onClick={() => onAction('fold')}
          >
            Fold
          </button>

          {canCheck ? (
            <button
              type="button"
              className="btn btn-action btn-check"
              onClick={() => onAction('check')}
            >
              Check
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-action btn-call"
              onClick={() => onAction('call')}
            >
              Call ${toCall.toLocaleString()}
            </button>
          )}

          {myChips > toCall && raiseAmount > currentBet && (
            <button
              type="button"
              className="btn btn-action btn-raise"
              onClick={() => onAction('raise', raiseAmount)}
            >
              Raise to ${raiseAmount.toLocaleString()}
            </button>
          )}

          {myChips > 0 && (
            <button
              type="button"
              className="btn btn-action btn-allin"
              onClick={() => onAction('all-in')}
            >
              All-In (${myChips.toLocaleString()})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionDock;
