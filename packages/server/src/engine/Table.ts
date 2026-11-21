import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  PlayerAction,
  GamePhase,
  PlayerState,
  TableState,
  SidePot,
  WinnerInfo,
  CreateTableOptions,
  LobbyTable,
} from '@p0ker/shared';
import { Deck } from './Deck';
import { findWinners, evaluateHand } from './HandEvaluator';

// ─── Internal player representation ───────────────────────────────────────────

interface InternalPlayer {
  userId: string;
  username: string;
  seat: number;
  chips: number;
  bet: number;        // current round bet
  totalBet: number;   // cumulative bet this hand (for side pots)
  holeCards: Card[];
  status: 'active' | 'folded' | 'all-in' | 'sitting-out' | 'disconnected';
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  hasActed: boolean;
  isBot?: boolean;
}

// ─── Table class ───────────────────────────────────────────────────────────────

export class Table {
  readonly tableId: string;
  readonly opts: CreateTableOptions;
  private onStateChange: (state: TableState) => void;

  private players: Map<string, InternalPlayer> = new Map();
  private seatOrder: string[] = []; // userId in seat order

  private phase: GamePhase = 'waiting';
  private communityCards: Card[] = [];
  private pot: number = 0;
  private sidePots: SidePot[] = [];
  private currentPlayerUserId: string | null = null;
  private dealerUserId: string | null = null;
  private handNumber: number = 0;
  private deck: Deck | null = null;
  private winners: WinnerInfo[] | null = null;

  private turnTimer: ReturnType<typeof setTimeout> | null = null;
  private lastRaiseSize: number = 0;
  private currentBet: number = 0;

  readonly allowBots: boolean;

  constructor(
    tableId: string,
    opts: CreateTableOptions,
    onStateChange: (state: TableState) => void
  ) {
    this.tableId = tableId;
    this.opts = opts;
    this.allowBots = opts.allowBots !== false;
    this.onStateChange = onStateChange;

    if (this.allowBots && opts.initialBots && opts.initialBots > 0) {
      const count = Math.min(opts.initialBots, opts.maxPlayers - 1);
      for (let i = 0; i < count; i++) {
        this.addBot();
      }
    }
  }

  get id(): string {
    return this.tableId;
  }

  get minBuyIn(): number {
    return this.opts.minBuyIn;
  }

  get name(): string {
    return this.opts.name;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  addPlayer(id: string, username: string, buyIn: number): { success: boolean; error?: string } {
    if (this.players.has(id)) {
      return { success: false, error: 'Already at the table' };
    }
    if (this.players.size >= this.opts.maxPlayers) {
      return { success: false, error: 'Table is full' };
    }
    if (buyIn < this.opts.minBuyIn) {
      return { success: false, error: `Minimum buy-in is ${this.opts.minBuyIn}` };
    }

    const seat = this.nextAvailableSeat();
    const player: InternalPlayer = {
      userId: id,
      username,
      seat,
      chips: buyIn,
      bet: 0,
      totalBet: 0,
      holeCards: [],
      status: 'active',
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      hasActed: false,
    };

    this.players.set(id, player);
    this.seatOrder.push(id);
    this.seatOrder.sort((a, b) => this.players.get(a)!.seat - this.players.get(b)!.seat);

    this.emit();

    // Auto-start if >= 2 active players and game is waiting
    if (this.phase === 'waiting' && this.activePlayers().length >= 2) {
      setTimeout(() => this.startRound(), 1000);
    }

    return { success: true };
  }

  removePlayer(id: string): number {
    if (!this.players.has(id)) return 0;

    const player = this.players.get(id)!;
    const remainingChips = player.chips;

    // If it's their turn, fold first
    if (this.currentPlayerUserId === id && this.phase !== 'waiting' && this.phase !== 'showdown') {
      this.applyFold(id);
    }

    this.players.delete(id);
    this.seatOrder = this.seatOrder.filter((uid) => uid !== id);

    // If dealer was removed, adjust
    if (this.dealerUserId === id) {
      this.dealerUserId = this.seatOrder.length > 0 ? this.seatOrder[0] : null;
    }

    this.emit();

    // If not enough players left during a hand, end it
    if (this.phase !== 'waiting' && this.activePlayers().length < 2) {
      this.endHandEarly();
    }

    return remainingChips;
  }

  addBot(): { success: boolean; error?: string } {
    if (!this.allowBots) {
      return { success: false, error: 'Meja ini khusus pemain manusia (bot tidak diizinkan)' };
    }
    if (this.players.size >= this.opts.maxPlayers) {
      return { success: false, error: 'Meja sudah penuh' };
    }

    const BOT_NAMES = ['🤖 Bot Budi', '🤖 Bot Sarah', '🤖 Bot Shark', '🤖 Bot Rex', '🤖 Bot Maya', '🤖 Bot Ace', '🤖 Bot Luna', '🤖 Bot Jack'];
    const usedNames = new Set(Array.from(this.players.values()).map((p) => p.username));
    const availableName = BOT_NAMES.find((n) => !usedNames.has(n)) || `🤖 Bot ${Math.floor(Math.random() * 100)}`;

    const botId = `bot-${uuidv4().slice(0, 8)}`;
    const buyIn = this.opts.minBuyIn * 2;
    const seat = this.nextAvailableSeat();

    const player: InternalPlayer = {
      userId: botId,
      username: availableName,
      seat,
      chips: buyIn,
      bet: 0,
      totalBet: 0,
      holeCards: [],
      status: 'active',
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      hasActed: false,
      isBot: true,
    };

    this.players.set(botId, player);
    this.seatOrder.push(botId);
    this.seatOrder.sort((a, b) => this.players.get(a)!.seat - this.players.get(b)!.seat);

    this.emit();

    if (this.phase === 'waiting' && this.activePlayers().length >= 2) {
      setTimeout(() => this.startRound(), 1000);
    }

    return { success: true };
  }

  removeBot(botId?: string): { success: boolean } {
    let targetId = botId;
    if (!targetId) {
      for (const p of this.players.values()) {
        if (p.isBot) {
          targetId = p.userId;
          break;
        }
      }
    }
    if (!targetId) return { success: false };
    this.removePlayer(targetId);
    return { success: true };
  }

  handleAction(playerId: string, action: PlayerAction, amount?: number): void {
    if (this.currentPlayerUserId !== playerId) return;
    if (this.phase === 'waiting' || this.phase === 'showdown') return;

    const player = this.players.get(playerId);
    if (!player || player.status !== 'active') return;

    this.clearTurnTimer();

    switch (action) {
      case 'fold':
        this.applyFold(playerId);
        break;
      case 'check':
        if (player.bet < this.currentBet) return; // can't check when there's a bet
        player.hasActed = true;
        break;
      case 'call':
        this.applyCall(player);
        break;
      case 'raise':
        if (amount === undefined) return;
        this.applyRaise(player, amount);
        break;
      case 'all-in':
        this.applyAllIn(player);
        break;
    }

    this.emit();
    this.advanceAction();
  }

  getStateForPlayer(playerId: string): TableState {
    const players: PlayerState[] = this.seatOrder.map((uid) => {
      const p = this.players.get(uid)!;
      const isMe = uid === playerId;
      const isShowdown = this.phase === 'showdown';

      let holeCards: Card[] | null = null;
      if (isMe) {
        holeCards = p.holeCards.length > 0 ? p.holeCards : null;
      } else if (isShowdown && (p.status === 'active' || p.status === 'all-in')) {
        holeCards = p.holeCards.length > 0 ? p.holeCards : null;
      }
      // For non-showdown opponents, holeCards = null but we signal hasCards via a convention
      // The PlayerState type doesn't have hasCards, so we encode: holeCards = [] means has cards but hidden

      return {
        userId: p.userId,
        username: p.username,
        seat: p.seat,
        chips: p.chips,
        bet: p.bet,
        totalBet: p.totalBet,
        holeCards: holeCards,
        status: p.status,
        isDealer: p.isDealer,
        isSmallBlind: p.isSmallBlind,
        isBigBlind: p.isBigBlind,
        hasActed: p.hasActed,
        isBot: p.isBot || false,
      };
    });

    const currentPlayer = this.currentPlayerUserId
      ? this.players.get(this.currentPlayerUserId)
      : null;
    const dealer = this.dealerUserId ? this.players.get(this.dealerUserId) : null;

    return {
      tableId: this.tableId,
      name: this.opts.name,
      phase: this.phase,
      players,
      communityCards: this.communityCards,
      pot: this.pot,
      sidePots: this.sidePots,
      currentPlayerSeat: currentPlayer?.seat ?? null,
      dealerSeat: dealer?.seat ?? null,
      smallBlind: this.opts.smallBlind,
      bigBlind: this.opts.bigBlind,
      minBuyIn: this.opts.minBuyIn,
      maxPlayers: this.opts.maxPlayers,
      timeoutSeconds: 30,
      winners: this.winners,
      allowBots: this.allowBots,
    };
  }

  startRound(): void {
    const active = this.activePlayers();
    if (active.length < 2) return;
    if (this.phase !== 'waiting') return;

    this.handNumber++;
    this.winners = null;
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.currentBet = 0;
    this.lastRaiseSize = this.opts.bigBlind;
    this.deck = new Deck();

    // Reset player state
    for (const p of this.players.values()) {
      p.bet = 0;
      p.totalBet = 0;
      p.holeCards = [];
      p.hasActed = false;
      if (p.status !== 'sitting-out' && p.status !== 'disconnected') {
        p.status = 'active';
      }
      p.isDealer = false;
      p.isSmallBlind = false;
      p.isBigBlind = false;
    }

    // Rotate dealer
    this.advanceDealer();

    // Determine SB and BB positions
    const activeSeatOrder = this.seatOrder.filter(
      (uid) => this.players.get(uid)!.status === 'active'
    );
    const dealerIdx = activeSeatOrder.indexOf(this.dealerUserId!);
    const sbIdx = (dealerIdx + 1) % activeSeatOrder.length;
    const bbIdx = (dealerIdx + 2) % activeSeatOrder.length;

    const sbPlayer = this.players.get(activeSeatOrder[sbIdx])!;
    const bbPlayer = this.players.get(activeSeatOrder[bbIdx])!;

    sbPlayer.isSmallBlind = true;
    bbPlayer.isBigBlind = true;

    // Post blinds
    this.postBlind(sbPlayer, this.opts.smallBlind);
    this.postBlind(bbPlayer, this.opts.bigBlind);
    this.currentBet = this.opts.bigBlind;
    this.lastRaiseSize = this.opts.bigBlind;

    // Deal hole cards
    for (const uid of activeSeatOrder) {
      const p = this.players.get(uid)!;
      p.holeCards = this.deck.deal(2);
    }

    // Pre-flop: action starts after BB
    const utg = activeSeatOrder[(bbIdx + 1) % activeSeatOrder.length];
    this.currentPlayerUserId = utg;
    this.phase = 'pre-flop';

    this.emit();
    this.startTurnTimer();
  }

  toLobbyTable(): LobbyTable {
    return {
      tableId: this.tableId,
      name: this.opts.name,
      playerCount: this.players.size,
      maxPlayers: this.opts.maxPlayers,
      smallBlind: this.opts.smallBlind,
      bigBlind: this.opts.bigBlind,
      minBuyIn: this.opts.minBuyIn,
      phase: this.phase,
      allowBots: this.allowBots,
    };
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  private activePlayers(): InternalPlayer[] {
    return Array.from(this.players.values()).filter(
      (p) => p.status !== 'folded' && p.status !== 'sitting-out' && p.status !== 'disconnected'
    );
  }

  private bettingActivePlayers(): InternalPlayer[] {
    // Players who can still act (not folded, not all-in)
    return Array.from(this.players.values()).filter((p) => p.status === 'active');
  }

  private nextAvailableSeat(): number {
    const usedSeats = new Set(Array.from(this.players.values()).map((p) => p.seat));
    for (let i = 1; i <= this.opts.maxPlayers; i++) {
      if (!usedSeats.has(i)) return i;
    }
    return this.opts.maxPlayers + 1;
  }

  private advanceDealer(): void {
    if (this.seatOrder.length === 0) return;

    const activeSeatOrder = this.seatOrder.filter(
      (uid) => this.players.get(uid)!.status === 'active'
    );
    if (activeSeatOrder.length === 0) return;

    if (!this.dealerUserId || !activeSeatOrder.includes(this.dealerUserId)) {
      this.dealerUserId = activeSeatOrder[0];
    } else {
      const idx = activeSeatOrder.indexOf(this.dealerUserId);
      this.dealerUserId = activeSeatOrder[(idx + 1) % activeSeatOrder.length];
    }
    this.players.get(this.dealerUserId)!.isDealer = true;
  }

  private postBlind(player: InternalPlayer, amount: number): void {
    const actual = Math.min(amount, player.chips);
    player.chips -= actual;
    player.bet += actual;
    player.totalBet += actual;
    this.pot += actual;
    if (player.chips === 0) {
      player.status = 'all-in';
    }
  }

  private applyFold(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    player.status = 'folded';
    player.hasActed = true;
  }

  private applyCall(player: InternalPlayer): void {
    const toCall = Math.min(this.currentBet - player.bet, player.chips);
    player.chips -= toCall;
    player.bet += toCall;
    player.totalBet += toCall;
    this.pot += toCall;
    player.hasActed = true;
    if (player.chips === 0) {
      player.status = 'all-in';
    }
  }

  private applyRaise(player: InternalPlayer, totalBetAmount: number): void {
    // totalBetAmount is the total they want to put in this round (player.bet already counted)
    const raiseAmount = totalBetAmount - player.bet; // new chips committed
    if (raiseAmount <= 0) return;

    const raiseSize = totalBetAmount - this.currentBet;
    const minRaise = Math.max(this.opts.bigBlind, this.lastRaiseSize);
    if (raiseSize < minRaise && player.chips > raiseAmount) {
      // sub-minimum raise only allowed if going all-in
      return;
    }

    const actual = Math.min(raiseAmount, player.chips);
    player.chips -= actual;
    player.bet += actual;
    player.totalBet += actual;
    this.pot += actual;

    if (player.chips === 0) {
      player.status = 'all-in';
    }

    this.lastRaiseSize = player.bet - this.currentBet;
    this.currentBet = player.bet;
    player.hasActed = true;

    // After a raise, all other active players need to act again
    for (const p of this.players.values()) {
      if (p.userId !== player.userId && p.status === 'active') {
        p.hasActed = false;
      }
    }
  }

  private applyAllIn(player: InternalPlayer): void {
    const chips = player.chips;
    player.totalBet += chips;
    player.bet += chips;
    this.pot += chips;
    player.chips = 0;
    player.status = 'all-in';
    player.hasActed = true;

    if (player.bet > this.currentBet) {
      // This all-in is a raise
      this.lastRaiseSize = player.bet - this.currentBet;
      this.currentBet = player.bet;
      // Others need to act again
      for (const p of this.players.values()) {
        if (p.userId !== player.userId && p.status === 'active') {
          p.hasActed = false;
        }
      }
    }
  }

  private isBettingRoundOver(): boolean {
    const active = this.bettingActivePlayers();
    if (active.length === 0) return true;
    // All active players must have acted and matched the current bet
    return active.every((p) => p.hasActed && p.bet === this.currentBet);
  }

  private advanceAction(): void {
    // Check if only one player remains (others folded)
    const nonFolded = Array.from(this.players.values()).filter((p) => p.status !== 'folded');
    if (nonFolded.length === 1) {
      this.endHandEarly();
      return;
    }

    if (this.isBettingRoundOver()) {
      this.advancePhase();
    } else {
      this.moveToNextPlayer();
      this.startTurnTimer();
    }
  }

  private moveToNextPlayer(): void {
    const activeSeatOrder = this.seatOrder.filter(
      (uid) => this.players.get(uid)!.status === 'active'
    );
    if (activeSeatOrder.length === 0) {
      this.currentPlayerUserId = null;
      return;
    }

    const currentIdx = this.currentPlayerUserId
      ? activeSeatOrder.indexOf(this.currentPlayerUserId)
      : -1;
    const nextIdx = (currentIdx + 1) % activeSeatOrder.length;
    this.currentPlayerUserId = activeSeatOrder[nextIdx];
  }

  private advancePhase(): void {
    // Collect bets into pot, reset bets
    this.collectBets();

    // Check if only one or zero active/all-in players — run out the board
    const stillIn = Array.from(this.players.values()).filter(
      (p) => p.status === 'active' || p.status === 'all-in'
    );

    switch (this.phase) {
      case 'pre-flop':
        this.phase = 'flop';
        this.communityCards = this.deck!.deal(3);
        break;
      case 'flop':
        this.phase = 'turn';
        this.communityCards.push(...this.deck!.deal(1));
        break;
      case 'turn':
        this.phase = 'river';
        this.communityCards.push(...this.deck!.deal(1));
        break;
      case 'river':
        this.phase = 'showdown';
        this.emit();
        this.resolveShowdown();
        return;
      default:
        return;
    }

    this.currentBet = 0;
    this.lastRaiseSize = this.opts.bigBlind;

    // Reset hasActed for all active players
    for (const p of this.players.values()) {
      if (p.status === 'active') {
        p.hasActed = false;
      }
    }

    // If everyone left is all-in, skip to next phase immediately
    const activeBettors = this.bettingActivePlayers();
    if (activeBettors.length <= 1) {
      this.emit();
      // Delay slightly so clients can see the board
      setTimeout(() => this.advancePhase(), 1200);
      return;
    }

    // Set current player: post-flop starts from first active after dealer
    this.setPostFlopFirstAction();
    this.emit();
    this.startTurnTimer();
  }

  private setPostFlopFirstAction(): void {
    const activeSeatOrder = this.seatOrder.filter(
      (uid) => this.players.get(uid)!.status === 'active'
    );
    if (activeSeatOrder.length === 0) {
      this.currentPlayerUserId = null;
      return;
    }

    // Start from player after dealer
    if (!this.dealerUserId) {
      this.currentPlayerUserId = activeSeatOrder[0];
      return;
    }
    const dealerSeatOrderIdx = this.seatOrder.indexOf(this.dealerUserId);
    // Find first active player after dealer in seatOrder
    for (let i = 1; i <= this.seatOrder.length; i++) {
      const uid = this.seatOrder[(dealerSeatOrderIdx + i) % this.seatOrder.length];
      if (activeSeatOrder.includes(uid)) {
        this.currentPlayerUserId = uid;
        return;
      }
    }
    this.currentPlayerUserId = activeSeatOrder[0];
  }

  private collectBets(): void {
    for (const p of this.players.values()) {
      p.bet = 0;
    }
    this.recalculateSidePots();
  }

  private recalculateSidePots(): void {
    // Build side pots based on totalBet of each player
    const players = Array.from(this.players.values()).filter(
      (p) => p.totalBet > 0 && p.status !== 'folded'
    );
    const allPlayers = Array.from(this.players.values()).filter((p) => p.totalBet > 0);

    if (players.length === 0) {
      this.sidePots = [];
      return;
    }

    const sortedByTotalBet = [...allPlayers].sort((a, b) => a.totalBet - b.totalBet);
    const sidePots: SidePot[] = [];
    let previousLevel = 0;

    for (const contributor of sortedByTotalBet) {
      const level = contributor.totalBet;
      if (level <= previousLevel) continue;

      const eligiblePlayerIds = Array.from(this.players.values())
        .filter((p) => p.totalBet >= level && p.status !== 'folded')
        .map((p) => p.userId);

      const amount =
        (level - previousLevel) *
        allPlayers.filter((p) => p.totalBet >= level).length;

      sidePots.push({ amount, eligiblePlayerIds });
      previousLevel = level;
    }

    // If only one side pot and no all-in, just use main pot (don't set side pots)
    const hasAllIn = Array.from(this.players.values()).some((p) => p.status === 'all-in');
    this.sidePots = hasAllIn ? sidePots : [];
    this.pot = sidePots.reduce((sum, sp) => sum + sp.amount, 0);
  }

  private endHandEarly(): void {
    const nonFolded = Array.from(this.players.values()).filter((p) => p.status !== 'folded');
    if (nonFolded.length === 1) {
      const winner = nonFolded[0];
      winner.chips += this.pot;
      this.winners = [
        {
          userId: winner.userId,
          username: winner.username,
          amount: this.pot,
        },
      ];
      this.pot = 0;
    }
    this.clearTurnTimer();
    this.phase = 'showdown';
    this.emit();
    setTimeout(() => this.resetToWaiting(), 3000);
  }

  private resolveShowdown(): void {
    this.clearTurnTimer();
    this.winners = [];

    const activePlayers = Array.from(this.players.values()).filter(
      (p) => p.status === 'active' || p.status === 'all-in'
    );

    if (this.sidePots.length > 0) {
      // Resolve each side pot separately
      for (const sidePot of this.sidePots) {
        const eligible = activePlayers.filter((p) =>
          sidePot.eligiblePlayerIds.includes(p.userId)
        );
        if (eligible.length === 0) continue;

        const winnerIds = findWinners(
          eligible.map((p) => ({ id: p.userId, cards: p.holeCards })),
          this.communityCards
        );

        const splitAmount = Math.floor(sidePot.amount / winnerIds.length);
        for (const winnerId of winnerIds) {
          const wp = this.players.get(winnerId)!;
          wp.chips += splitAmount;
          const result = evaluateHand(wp.holeCards, this.communityCards);
          const existing = this.winners!.find((w) => w.userId === winnerId);
          if (existing) {
            existing.amount += splitAmount;
          } else {
            this.winners!.push({
              userId: winnerId,
              username: wp.username,
              amount: splitAmount,
              hand: result.name,
            });
          }
        }
      }
    } else {
      // Simple main pot
      const winnerIds = findWinners(
        activePlayers.map((p) => ({ id: p.userId, cards: p.holeCards })),
        this.communityCards
      );

      const splitAmount = Math.floor(this.pot / winnerIds.length);
      for (const winnerId of winnerIds) {
        const wp = this.players.get(winnerId)!;
        wp.chips += splitAmount;
        const result = evaluateHand(wp.holeCards, this.communityCards);
        this.winners!.push({
          userId: winnerId,
          username: wp.username,
          amount: splitAmount,
          hand: result.name,
        });
      }
      this.pot = 0;
    }

    this.emit();
    setTimeout(() => this.resetToWaiting(), 5000);
  }

  private resetToWaiting(): void {
    // Remove broke players
    for (const [uid, p] of this.players.entries()) {
      if (p.chips <= 0 && p.status !== 'disconnected') {
        if (p.isBot) {
          p.chips = this.opts.minBuyIn * 2;
        } else {
          this.players.delete(uid);
          this.seatOrder = this.seatOrder.filter((id) => id !== uid);
        }
      }
    }

    // Reset state
    for (const p of this.players.values()) {
      p.bet = 0;
      p.totalBet = 0;
      p.holeCards = [];
      p.hasActed = false;
      p.isDealer = false;
      p.isSmallBlind = false;
      p.isBigBlind = false;
      if (p.status !== 'sitting-out' && p.status !== 'disconnected') {
        p.status = 'active';
      }
    }

    this.phase = 'waiting';
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.currentBet = 0;
    this.currentPlayerUserId = null;
    this.winners = null;

    this.emit();

    if (this.activePlayers().length >= 2) {
      setTimeout(() => this.startRound(), 3000);
    }
  }

  private decideBotAction(bot: InternalPlayer): { action: PlayerAction; amount?: number } {
    const toCall = Math.max(0, this.currentBet - bot.bet);
    const canCheck = toCall === 0;

    let handScore = 0; // 0 = weak, 1 = ok, 2 = strong, 3 = monster
    if (this.communityCards.length === 0) {
      // Pre-flop logic
      const c1 = bot.holeCards[0];
      const c2 = bot.holeCards[1];
      if (c1 && c2) {
        const isPair = c1.rank === c2.rank;
        const isSuited = c1.suit === c2.suit;
        const highRanks = ['10', 'J', 'Q', 'K', 'A'];
        const isHigh = highRanks.includes(c1.rank) || highRanks.includes(c2.rank);

        if (isPair && ['9', '10', 'J', 'Q', 'K', 'A'].includes(c1.rank)) handScore = 3;
        else if (isPair) handScore = 2;
        else if (highRanks.includes(c1.rank) && highRanks.includes(c2.rank)) handScore = 2;
        else if (isHigh || isSuited) handScore = 1;
        else handScore = 0;
      }
    } else {
      // Post-flop logic using HandEvaluator
      const evalResult = evaluateHand(bot.holeCards, this.communityCards);
      const name = evalResult.name.toLowerCase();
      if (
        name.includes('straight flush') ||
        name.includes('four of a kind') ||
        name.includes('full house') ||
        name.includes('flush') ||
        name.includes('straight')
      ) {
        handScore = 3;
      } else if (name.includes('three of a kind') || name.includes('two pair')) {
        handScore = 2;
      } else if (name.includes('pair')) {
        handScore = 1;
      } else {
        handScore = 0;
      }
    }

    const minRaise = Math.max(this.opts.bigBlind, this.currentBet * 2);

    if (handScore === 3) {
      // Monster hand: aggressive raise
      if (bot.chips > toCall && Math.random() < 0.75) {
        const raiseSize = Math.min(
          bot.chips + bot.bet,
          minRaise + Math.floor(this.opts.bigBlind * (1 + Math.random() * 2))
        );
        return { action: 'raise', amount: raiseSize };
      }
      return canCheck ? { action: 'check' } : { action: 'call' };
    }

    if (handScore === 2) {
      // Good hand
      if (bot.chips > toCall && Math.random() < 0.4 && toCall <= this.opts.bigBlind * 3) {
        return { action: 'raise', amount: minRaise };
      }
      return canCheck ? { action: 'check' } : { action: 'call' };
    }

    if (handScore === 1) {
      // Moderate hand: check if free, call small bet
      if (canCheck) return { action: 'check' };
      if (toCall <= this.opts.bigBlind * 2.5) {
        return { action: 'call' };
      }
      return Math.random() < 0.25 ? { action: 'call' } : { action: 'fold' };
    }

    // Weak hand: check if free, else fold (with 10% bluff call)
    if (canCheck) return { action: 'check' };
    if (toCall <= this.opts.smallBlind && Math.random() < 0.3) {
      return { action: 'call' };
    }
    return Math.random() < 0.1 ? { action: 'call' } : { action: 'fold' };
  }

  private triggerBotActionIfApplicable(): void {
    if (!this.currentPlayerUserId) return;
    const player = this.players.get(this.currentPlayerUserId);
    if (!player || !player.isBot || player.status !== 'active') return;

    const botId = player.userId;
    // Human-like thinking time: 1.2s - 2.4s
    const thinkTime = 1200 + Math.floor(Math.random() * 1200);

    setTimeout(() => {
      if (
        this.currentPlayerUserId === botId &&
        this.phase !== 'waiting' &&
        this.phase !== 'showdown'
      ) {
        const decision = this.decideBotAction(player);
        this.handleAction(botId, decision.action, decision.amount);
      }
    }, thinkTime);
  }

  private startTurnTimer(): void {
    this.clearTurnTimer();
    if (!this.currentPlayerUserId) return;
    const playerId = this.currentPlayerUserId;

    const player = this.players.get(playerId);
    if (player && player.isBot) {
      this.triggerBotActionIfApplicable();
      return;
    }

    this.turnTimer = setTimeout(() => {
      // Auto-fold
      if (this.currentPlayerUserId === playerId) {
        this.handleAction(playerId, 'fold');
      }
    }, 30000);
  }

  private clearTurnTimer(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }

  private emit(): void {
    // Emit a sanitized state; the caller/socket layer will call getStateForPlayer per player
    // Here we emit the full state (the socket handler will re-call getStateForPlayer)
    this.onStateChange(this.getStateForPlayer('__server__'));
  }
}
