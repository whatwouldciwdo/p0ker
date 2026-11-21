import { Card } from '@p0ker/shared';

// pokersolver uses a specific card notation: rank + suit initial
// ranks: 2-9, T, J, Q, K, A
// suits: s (spades), h (hearts), d (diamonds), c (clubs)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Hand } = require('pokersolver');

function toPokerSolverNotation(card: Card): string {
  let rank: string = card.rank;
  if (rank === '10') rank = 'T';
  const suitMap: Record<string, string> = {
    spades: 's',
    hearts: 'h',
    diamonds: 'd',
    clubs: 'c',
  };
  return rank + suitMap[card.suit];
}

export interface HandResult {
  name: string;
  descr: string;
  score: number;
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards].map(toPokerSolverNotation);
  const hand = Hand.solve(allCards);
  return {
    name: hand.name as string,
    descr: hand.descr as string,
    score: hand.rank as number,
  };
}

export function findWinners(
  players: Array<{ id: string; cards: Card[] }>,
  communityCards: Card[]
): string[] {
  if (players.length === 0) return [];
  if (players.length === 1) return [players[0].id];

  const hands = players.map((p) => {
    const allCards = [...p.cards, ...communityCards].map(toPokerSolverNotation);
    const hand = Hand.solve(allCards);
    hand._playerId = p.id; // tag with player id
    return hand;
  });

  const winners: typeof hands = Hand.winners(hands);
  return winners.map((h: { _playerId: string }) => h._playerId);
}
