import React, { useState, useEffect } from 'react';
import { PlayerAction } from '@p0ker/shared';
import { FoldArrowIcon, RaiseArrowIcon } from '../icons/CasinoIcons';

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

  const canRaise = myChips > toCall && maxRaise > currentBet;

  return (
    <div className="action-dock-container fc-action-dock-container">
      <div className="action-dock fc-action-dock">
        {/* Raise Slider & Presets */}
        {canRaise && (
          <div className="raise-panel fc-raise-panel">
            <div className="fc-raise-readout-row">
              <span className="fc-raise-value">${raiseAmount.toLocaleString()}</span>
            </div>

            <div className="slider-row fc-slider-row">
              <input
                type="range"
                className="raise-slider fc-raise-slider"
                min={minRaise}
                max={maxRaise}
                step={bigBlind}
                value={raiseAmount}
                onChange={handleSliderChange}
              />
            </div>

            <div className="presets-bar fc-presets-bar">
              <button
                type="button"
                className="btn-preset fc-preset-btn"
                onClick={() => setRaiseAmount(minRaise)}
              >
                MIN
              </button>
              <button
                type="button"
                className="btn-preset fc-preset-btn"
                onClick={() => setPresetRaise(0.5)}
              >
                1/2
              </button>
              <button
                type="button"
                className="btn-preset fc-preset-btn"
                onClick={() => setPresetRaise(1.0)}
              >
                POT
              </button>
              <button
                type="button"
                className="btn-preset fc-preset-btn"
                onClick={() => setRaiseAmount(maxRaise)}
              >
                MAX
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Buttons (FigCraft Coral Fold, Slate Check/Call, Sky Raise/All-In) */}
        <div className="buttons-row fc-buttons-row">
          <button
            type="button"
            className="btn btn-action btn-fold fc-btn-fold"
            onClick={() => onAction('fold')}
            title="Fold"
          >
            <FoldArrowIcon size={15} />
            <span>FOLD</span>
          </button>

          {canCheck ? (
            <button
              type="button"
              className="btn btn-action btn-check fc-btn-slate"
              onClick={() => onAction('check')}
            >
              CHECK
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-action btn-call fc-btn-slate"
              onClick={() => onAction('call')}
            >
              CALL ${toCall.toLocaleString()}
            </button>
          )}

          {canRaise && raiseAmount > currentBet ? (
            <button
              type="button"
              className="btn btn-action btn-raise fc-btn-raise"
              onClick={() => onAction('raise', raiseAmount)}
              title={`Raise to $${raiseAmount.toLocaleString()}`}
            >
              <span>RAISE</span>
              <RaiseArrowIcon size={15} />
            </button>
          ) : myChips > 0 ? (
            <button
              type="button"
              className="btn btn-action btn-allin fc-btn-raise"
              onClick={() => onAction('all-in')}
            >
              <span>ALL-IN</span>
              <RaiseArrowIcon size={15} />
            </button>
          ) : null}

          {canRaise && myChips > 0 && (
            <button
              type="button"
              className="btn btn-action btn-allin fc-btn-allin-pill"
              onClick={() => onAction('all-in')}
              title={`All-In ($${myChips.toLocaleString()})`}
            >
              ALL-IN
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionDock;
