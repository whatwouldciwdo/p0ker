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

  const canRaise = myChips > toCall && maxRaise > currentBet;
  const betLabel = currentBet === 0 ? 'BET' : 'RAISE';

  return (
    <div className="action-dock-container fc6-action-dock">
      {/* Top Row: Presets (MIN, 3/4, POT, MAX) + Thin Mint Slider + Readout Box */}
      {canRaise && (
        <div className="fc6-bet-controls">
          <div className="fc6-slider-column">
            <div className="fc6-presets-row">
              <button
                type="button"
                className="fc6-preset-pill"
                onClick={() => setRaiseAmount(minRaise)}
              >
                MIN
              </button>
              <button
                type="button"
                className="fc6-preset-pill"
                onClick={() => setPresetRaise(0.75)}
              >
                3/4
              </button>
              <button
                type="button"
                className="fc6-preset-pill"
                onClick={() => setPresetRaise(1.0)}
              >
                POT
              </button>
              <button
                type="button"
                className="fc6-preset-pill"
                onClick={() => setRaiseAmount(maxRaise)}
              >
                MAX
              </button>
            </div>

            <input
              type="range"
              className="fc6-range-slider"
              min={minRaise}
              max={maxRaise}
              step={bigBlind}
              value={raiseAmount}
              onChange={handleSliderChange}
            />
          </div>

          <div className="fc6-amount-box" title="Jumlah taruhan">
            <span>{raiseAmount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Bottom Row: FOLD | CHECK | CALL | BET/RAISE */}
      <div className="fc6-buttons-row">
        <button
          type="button"
          className="fc6-btn fc6-btn-fold"
          onClick={() => onAction('fold')}
        >
          FOLD
        </button>

        <button
          type="button"
          className="fc6-btn fc6-btn-slate"
          disabled={!canCheck}
          onClick={() => onAction('check')}
        >
          CHECK
        </button>

        <button
          type="button"
          className="fc6-btn fc6-btn-slate"
          disabled={canCheck}
          onClick={() => onAction('call')}
        >
          {canCheck ? 'CALL' : (
            <span className="fc6-btn-stack">
              <span>CALL</span>
              <span className="fc6-btn-sub">{toCall.toLocaleString()}</span>
            </span>
          )}
        </button>

        {canRaise && raiseAmount > currentBet ? (
          <button
            type="button"
            className="fc6-btn fc6-btn-bet"
            onClick={() => onAction('raise', raiseAmount)}
          >
            <span className="fc6-btn-stack">
              <span>{betLabel}</span>
              <span className="fc6-btn-sub">{raiseAmount.toLocaleString()}</span>
            </span>
          </button>
        ) : myChips > 0 ? (
          <button
            type="button"
            className="fc6-btn fc6-btn-bet"
            onClick={() => onAction('all-in')}
          >
            <span className="fc6-btn-stack">
              <span>ALL-IN</span>
              <span className="fc6-btn-sub">{myChips.toLocaleString()}</span>
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ActionDock;
