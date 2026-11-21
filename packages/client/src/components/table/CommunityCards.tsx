import React from 'react';
import { Card as CardType } from '@p0ker/shared';
import Card from './Card';

interface CommunityCardsProps {
  cards: CardType[];
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards }) => {
  const totalSlots = 5;
  const slots = Array.from({ length: totalSlots });

  return (
    <div className="community-cards-container">
      <div className="community-cards">
        {slots.map((_, index) => {
          const card = cards[index];
          return (
            <div key={index} className={`card-slot ${card ? 'has-card' : 'empty-slot'}`}>
              {card ? (
                <Card card={card} />
              ) : (
                <div className="card-placeholder" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityCards;
