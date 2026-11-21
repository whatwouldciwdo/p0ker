import * as crypto from 'crypto';
import { Card, Suit, Rank } from '@p0ker/shared';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export class Deck {
  private cards: Card[];

  constructor() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({ suit, rank });
      }
    }
    this.shuffle();
  }

  private shuffle(): void {
    // Fisher-Yates with cryptographically secure random bytes
    const len = this.cards.length;
    for (let i = len - 1; i > 0; i--) {
      // Need a random index in [0, i] — use rejection sampling to avoid modulo bias
      const randomBytes = crypto.randomBytes(4);
      const rand = randomBytes.readUInt32BE(0);
      const j = rand % (i + 1);
      // Swap
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(n: number): Card[] {
    if (n > this.cards.length) {
      throw new Error(`Cannot deal ${n} cards: only ${this.cards.length} remaining`);
    }
    return this.cards.splice(0, n);
  }

  get remaining(): number {
    return this.cards.length;
  }
}
