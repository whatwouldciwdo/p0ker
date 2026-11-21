// ─── Card Types ──────────────────────────────────────────────────────────────

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

// ─── Game Enums ───────────────────────────────────────────────────────────────

export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export type GamePhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

// ─── Player & Table State ─────────────────────────────────────────────────────

export interface PlayerState {
  userId: string;
  username: string;
  seat: number;
  chips: number;
  bet: number;
  totalBet: number;
  holeCards: Card[] | null; // null for opponents (hidden)
  status: 'active' | 'folded' | 'all-in' | 'sitting-out' | 'disconnected';
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  hasActed: boolean;
  isBot?: boolean;
  avatar?: string;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface WinnerInfo {
  userId: string;
  username: string;
  amount: number;
  hand?: string;      // e.g. "Full House"
  handCards?: Card[]; // best 5-card hand
}

export interface TableState {
  tableId: string;
  name: string;
  phase: GamePhase;
  players: PlayerState[];
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  currentPlayerSeat: number | null;
  dealerSeat: number | null;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxPlayers: number;
  timeoutSeconds: number;
  winners: WinnerInfo[] | null;
  allowBots?: boolean;
}

export interface LobbyTable {
  tableId: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  phase: GamePhase;
  allowBots?: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  username: string;
  chips: number;
}

// ─── Table Creation ───────────────────────────────────────────────────────────

export interface CreateTableOptions {
  name: string;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  minBuyIn: number;
  allowBots?: boolean;
  initialBots?: number;
}

// ─── Socket.io Typed Events ───────────────────────────────────────────────────

export interface ServerToClientEvents {
  // Table state
  'table:state': (state: TableState) => void;
  'game:state': (state: TableState) => void;
  'table:list': (tables: LobbyTable[]) => void;
  'lobby:tables': (tables: LobbyTable[]) => void;
  'table:created': (table: LobbyTable) => void;

  // Game events
  'game:action': (data: { userId: string; action: PlayerAction; amount?: number }) => void;
  'game:winners': (winners: WinnerInfo[]) => void;
  'game:start': () => void;
  'game:nextHand': () => void;

  // Player events
  'player:joined': (player: { userId: string; username: string; seat: number }) => void;
  'player:left': (data: { userId: string; seat: number }) => void;
  'player:disconnected': (data: { userId: string }) => void;

  // Chat
  'chat:message': (data: { userId: string; username: string; message: string; timestamp: number }) => void;

  // Notifications
  'toast': (message: string, type: 'info' | 'success' | 'error') => void;

  // Errors
  'error': (data: any) => void;
}

export interface ClientToServerEvents {
  // Lobby
  'lobby:getTables': () => void;
  'lobby:list': () => void;
  'lobby:createTable': (options: CreateTableOptions) => void;

  // Table
  'table:join': (data: any, buyIn?: number) => void;
  'table:leave': (data?: { tableId?: string }) => void;
  'table:addBot': (data?: { tableId?: string }) => void;
  'table:removeBot': (data?: { tableId?: string; botId?: string }) => void;
  'table:sitOut': () => void;
  'table:sitIn': () => void;
  'table:action': (data: any, amount?: number) => void;

  // Game actions
  'game:action': (data: any, amount?: number) => void;

  // Chat
  'chat:message': (data: { message: string }) => void;
  'table:chat': (data: any) => void;
}
