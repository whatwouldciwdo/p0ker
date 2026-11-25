import React from 'react';
import { Card as CardType } from '@p0ker/shared';
import { SuitVectorIcon } from '../icons/CasinoIcons';

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

  const suitIconSize = resolvedSize === 'mini' ? 12 : resolvedSize === 'medium' ? 16 : 20;

  const style = {
    '--deal-delay': `${dealDelay}ms`,
    '--deal-x': `${dealFromX}px`,
    '--deal-y': `${dealFromY}px`,
    '--fan-angle': `${fanAngle}deg`,
  } as React.CSSProperties;

  if (hidden || !card) {
    return (
      <div
        className={`poker-card-scene fc-card-scene ${sizeClass} ${highlight ? 'card-highlight' : ''}`}
        style={style}
      >
        <div className="poker-card-inner is-dealt-back">
          <div className="poker-card card-back fc-card-back">
            <div className="card-back-frame fc-back-frame">
              <div className="card-back-pattern fc-back-pattern" />
              <div className="card-back-medallion fc-back-medallion">♠</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const suitClass = `fc-suit-${card.suit}`;

  return (
    <div
      className={`poker-card-scene fc-card-scene ${sizeClass} ${highlight ? 'card-highlight' : ''}`}
      style={style}
    >
      <div className={`poker-card-inner ${flipReveal ? 'is-flip-reveal' : 'is-dealt-face'}`}>
        {/* Back face shown briefly during 3D flip */}
        <div className="poker-card card-back fc-card-back card-flip-back">
          <div className="card-back-frame fc-back-frame">
            <div className="card-back-pattern fc-back-pattern" />
            <div className="card-back-medallion fc-back-medallion">♠</div>
          </div>
        </div>

        {/* FigCraft Glassmorphic 4-Color Neon Card Face */}
        <div className={`poker-card card-face fc-card-face card-flip-front ${suitClass}`}>
          <div className="card-gloss" />
          <div className="fc-card-top-suit">
            <SuitVectorIcon suit={card.suit} size={suitIconSize} />
          </div>
          <div className="fc-card-rank-wrap">
            <span className={`fc-card-rank ${card.rank === '10' ? 'is-ten' : ''}`}>
              {card.rank}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
