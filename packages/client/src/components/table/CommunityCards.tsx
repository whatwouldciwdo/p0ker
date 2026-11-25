import React from 'react';
import { Card as CardType } from '@p0ker/shared';
import Card from './Card';

interface CommunityCardsProps {
  cards: CardType[];
  handNumber?: number;
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({
  cards,
  handNumber = 0,
}) => {
  const totalSlots = 5;
  const slots = Array.from({ length: totalSlots });

  return (
    <div className="community-cards-container">
      <div className="community-cards">
        {slots.map((_, index) => {
          const card = cards[index];
          // Flop (0,1,2) staggers nicely; Turn (3) & River (4) appear immediately on arrival
          const staggerDelay = index < 3 ? index * 130 : 40;
          // Slight horizontal offset so each card flies from top-center dealer
          const dealFromX = (2 - index) * 46;

          return (
            <div key={index} className={`card-slot ${card ? 'has-card' : 'empty-slot'}`}>
              {card ? (
                <Card
                  key={`${handNumber}-${index}-${card.rank}-${card.suit}`}
                  card={card}
                  dealDelay={staggerDelay}
                  dealFromX={dealFromX}
                  dealFromY={-115}
                  flipReveal
                />
              ) : (
                <div className="card-placeholder">
                  <span className="placeholder-suit">♠</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityCards;
