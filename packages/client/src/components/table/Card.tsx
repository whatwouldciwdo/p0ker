import React from 'react';
import { Card as CardType } from '@p0ker/shared';

interface CardProps {
  card?: CardType | null;
  hidden?: boolean;
  mini?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const Card: React.FC<CardProps> = ({ card, hidden = false, mini = false }) => {
  if (hidden || !card) {
    return (
      <div className={`poker-card card-back ${mini ? 'card-mini' : ''}`}>
        <div className="card-pattern" />
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit] || card.suit;

  return (
    <div className={`poker-card card-face ${isRed ? 'card-red' : 'card-black'} ${mini ? 'card-mini' : ''}`}>
      <div className="card-corner top-left">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit">{symbol}</span>
      </div>
      <div className="card-center">
        <span className="center-symbol">{symbol}</span>
      </div>
      <div className="card-corner bottom-right">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit">{symbol}</span>
      </div>
    </div>
  );
};

export default Card;
