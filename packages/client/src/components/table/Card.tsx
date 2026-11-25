import React from 'react';
import { Card as CardType } from '@p0ker/shared';

interface CardProps {
  card?: CardType | null;
  hidden?: boolean;
  mini?: boolean;
  size?: 'mini' | 'medium' | 'normal';
  dealDelay?: number;
  dealFromX?: number;
  dealFromY?: number;
  flipReveal?: boolean;
  fanAngle?: number;
  highlight?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const ROYAL_EMBLEMS: Record<string, string> = {
  K: '♔',
  Q: '♕',
  J: '♘',
};

export const Card: React.FC<CardProps> = ({
  card,
  hidden = false,
  mini = false,
  size,
  dealDelay = 0,
  dealFromX = 0,
  dealFromY = -90,
  flipReveal = false,
  fanAngle = 0,
  highlight = false,
}) => {
  const resolvedSize = size || (mini ? 'mini' : 'normal');
  const sizeClass =
    resolvedSize === 'mini'
      ? 'card-mini'
      : resolvedSize === 'medium'
      ? 'card-medium'
      : '';

  const style = {
    '--deal-delay': `${dealDelay}ms`,
    '--deal-x': `${dealFromX}px`,
    '--deal-y': `${dealFromY}px`,
    '--fan-angle': `${fanAngle}deg`,
  } as React.CSSProperties;

  if (hidden || !card) {
    return (
      <div
        className={`poker-card-scene ${sizeClass} ${highlight ? 'card-highlight' : ''}`}
        style={style}
      >
        <div className="poker-card-inner is-dealt-back">
          <div className="poker-card card-back">
            <div className="card-back-frame">
              <div className="card-back-pattern" />
              <div className="card-back-medallion">♠</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit] || card.suit;
  const isAce = card.rank === 'A';
  const royalEmblem = ROYAL_EMBLEMS[card.rank];

  return (
    <div
      className={`poker-card-scene ${sizeClass} ${highlight ? 'card-highlight' : ''}`}
      style={style}
    >
      <div className={`poker-card-inner ${flipReveal ? 'is-flip-reveal' : 'is-dealt-face'}`}>
        {/* Back face shown briefly during 3D flip */}
        <div className="poker-card card-back card-flip-back">
          <div className="card-back-frame">
            <div className="card-back-pattern" />
            <div className="card-back-medallion">♠</div>
          </div>
        </div>

        {/* Front face */}
        <div
          className={`poker-card card-face card-flip-front ${
            isRed ? 'card-red' : 'card-black'
          } ${isAce ? 'card-ace' : ''} ${royalEmblem ? 'card-royal' : ''}`}
        >
          <div className="card-gloss" />
          <div className="card-inner-rim" />

          <div className="card-corner top-left">
            <span className="card-rank">{card.rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>

          <div className="card-center">
            {royalEmblem ? (
              <div className="royal-center-group">
                <span className="royal-crown">{royalEmblem}</span>
                <span className="royal-suit-sub">{symbol}</span>
              </div>
            ) : (
              <span className={`center-symbol ${isAce ? 'ace-symbol' : ''}`}>
                {symbol}
              </span>
            )}
          </div>

          <div className="card-corner bottom-right">
            <span className="card-rank">{card.rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
