export type MatchStatus = 'upcoming' | 'live' | 'finished';

export type MarketId = '1x2' | 'dc' | 'ou15' | 'ou25' | 'ou35' | 'btts';

export interface Outcome {
  id: string;
  /** Translation key for the label (e.g. "home", "over"). */
  label: string;
  odds: number;
  /** Price direction since the last tick, for the flash animation. */
  move: 'up' | 'down' | null;
  /** True once the outcome is decided or no longer offered. */
  closed: boolean;
}

export interface Market {
  id: MarketId;
  outcomes: Outcome[];
}

export type EventKind = 'goal' | 'yellow' | 'red' | 'kickoff' | 'halftime' | 'fulltime';

export interface MatchEvent {
  minute: number;
  kind: EventKind;
  side?: 'home' | 'away';
}

export interface MatchStats {
  possession: number; // home %, away = 100 - home
  shots: [number, number];
  onTarget: [number, number];
  corners: [number, number];
  yellows: [number, number];
}

export interface Match {
  id: string;
  league: string;
  home: string;
  away: string;
  status: MatchStatus;
  /** Epoch ms when an upcoming match kicks off. */
  kickoffAt: number;
  /** Match minute (0–90) while live. */
  minute: number;
  score: [number, number];
  /** Pre-match scoring rates (expected goals over 90 minutes). */
  rates: [number, number];
  markets: Market[];
  stats: MatchStats;
  events: MatchEvent[];
  suspended: boolean;
  /** Bumped on every reprice so price flashes can restart. */
  tick: number;
  finishedAt?: number;
}

export interface Selection {
  /** `${matchId}:${marketId}:${outcomeId}` */
  key: string;
  matchId: string;
  marketId: MarketId;
  outcomeId: string;
  /** Price when the user picked it (or last accepted it). */
  odds: number;
  /** Denormalised for display after the match is gone. */
  matchLabel: string;
}

export type LegStatus = 'open' | 'won' | 'lost' | 'void';
export type BetStatus = 'open' | 'won' | 'lost' | 'cashed' | 'void';

export interface BetLeg extends Selection {
  status: LegStatus;
}

export interface Bet {
  id: string;
  placedAt: number;
  type: 'single' | 'acca';
  stake: number;
  odds: number;
  legs: BetLeg[];
  status: BetStatus;
  /** Amount returned to the wallet when settled or cashed out. */
  payout: number;
  settledAt?: number;
}

export type TxKind = 'deposit' | 'withdraw' | 'bet' | 'win' | 'cashout' | 'refund';

export interface Transaction {
  id: string;
  at: number;
  kind: TxKind;
  /** Signed: positive adds to the balance. */
  amount: number;
  balance: number;
  note?: string;
}

export const selectionKey = (matchId: string, marketId: MarketId, outcomeId: string): string =>
  `${matchId}:${marketId}:${outcomeId}`;
