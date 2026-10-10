import { Bet, MarketId } from './models';

/** Bookmaker margin applied to fair prices. */
export const MARGIN = 1.06;
/** Share of the fair cash-out value we offer (the house keeps the rest). */
export const CASHOUT_FACTOR = 0.95;
const MAX_GOALS = 10;

export interface MarketDef {
  id: MarketId;
  /** Translation key for the market name. */
  name: string;
  outcomes: { id: string; label: string }[];
  /** Is this outcome a winner for a final score of h–a? */
  wins: (outcomeId: string, h: number, a: number) => boolean;
}

const total = (line: number): Pick<MarketDef, 'outcomes' | 'wins'> => ({
  outcomes: [
    { id: 'over', label: 'over' },
    { id: 'under', label: 'under' },
  ],
  wins: (o, h, a) => (o === 'over' ? h + a > line : h + a < line),
});

export const MARKETS: MarketDef[] = [
  {
    id: '1x2',
    name: 'market.1x2',
    outcomes: [
      { id: 'home', label: '1' },
      { id: 'draw', label: 'X' },
      { id: 'away', label: '2' },
    ],
    wins: (o, h, a) => (o === 'home' ? h > a : o === 'away' ? a > h : h === a),
  },
  {
    id: 'dc',
    name: 'market.dc',
    outcomes: [
      { id: '1x', label: '1X' },
      { id: '12', label: '12' },
      { id: 'x2', label: 'X2' },
    ],
    wins: (o, h, a) => (o === '1x' ? h >= a : o === 'x2' ? a >= h : h !== a),
  },
  { id: 'ou15', name: 'market.ou15', ...total(1.5) },
  { id: 'ou25', name: 'market.ou25', ...total(2.5) },
  { id: 'ou35', name: 'market.ou35', ...total(3.5) },
  {
    id: 'btts',
    name: 'market.btts',
    outcomes: [
      { id: 'yes', label: 'yes' },
      { id: 'no', label: 'no' },
    ],
    wins: (o, h, a) => (o === 'yes' ? h > 0 && a > 0 : h === 0 || a === 0),
  },
];

export const MARKET_BY_ID = new Map(MARKETS.map((m) => [m.id, m]));

/** Poisson distribution of goals; the last bucket holds "MAX_GOALS or more" so it sums to 1. */
function poisson(lambda: number): number[] {
  const out: number[] = [];
  let p = Math.exp(-lambda);
  let sum = 0;
  for (let k = 0; k < MAX_GOALS; k++) {
    out.push(p);
    sum += p;
    p = (p * lambda) / (k + 1);
  }
  out.push(Math.max(0, 1 - sum));
  return out;
}

/**
 * Probability of every outcome in every market, given the current score and
 * the remaining scoring rates. Remaining goals per side are modelled as
 * independent Poisson variables; the final-score grid drives all markets.
 */
export function probabilities(
  score: [number, number],
  remaining: [number, number],
): Map<string, number> {
  const ph = poisson(Math.max(remaining[0], 0));
  const pa = poisson(Math.max(remaining[1], 0));
  const result = new Map<string, number>();
  for (const market of MARKETS) {
    for (const outcome of market.outcomes) {
      let p = 0;
      for (let i = 0; i <= MAX_GOALS; i++) {
        for (let j = 0; j <= MAX_GOALS; j++) {
          if (market.wins(outcome.id, score[0] + i, score[1] + j)) p += ph[i] * pa[j];
        }
      }
      result.set(`${market.id}:${outcome.id}`, Math.min(1, p));
    }
  }
  return result;
}

/** Decimal odds from a probability, with margin; null when the outcome is effectively decided. */
export function toOdds(p: number): number | null {
  if (p < 0.004 || p > 0.985) return null;
  return Math.min(101, Math.max(1.01, Math.round((1 / (p * MARGIN)) * 100) / 100));
}

/** Expected goals left in the match for each side. */
export function remainingRates(rates: [number, number], minute: number): [number, number] {
  const left = Math.max(0, 90 - minute) / 90;
  return [rates[0] * left, rates[1] * left];
}

export function settleLeg(marketId: MarketId, outcomeId: string, score: [number, number]): boolean {
  return MARKET_BY_ID.get(marketId)!.wins(outcomeId, score[0], score[1]);
}

/**
 * Fair-value cash-out: stake × odds taken ÷ current odds of the unsettled legs,
 * minus a house cut. Returns null when any leg can't be priced right now
 * (suspended or lost) — no cash-out is offered then.
 */
export function cashOutValue(bet: Bet, currentOdds: (key: string) => number | null): number | null {
  if (bet.status !== 'open') return null;
  let current = 1;
  for (const leg of bet.legs) {
    if (leg.status === 'lost') return null;
    if (leg.status === 'won' || leg.status === 'void') continue;
    const odds = currentOdds(leg.key);
    if (odds == null) return null;
    current *= odds;
  }
  const value = ((bet.stake * bet.odds) / current) * CASHOUT_FACTOR;
  return Math.round(value * 100) / 100;
}

export type OddsFormat = 'decimal' | 'fractional' | 'american';

export function formatOdds(odds: number, format: OddsFormat): string {
  switch (format) {
    case 'american':
      return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
    case 'fractional': {
      const [n, d] = toFraction(odds - 1);
      return `${n}/${d}`;
    }
    default:
      return odds.toFixed(2);
  }
}

/** Closest simple fraction (denominator ≤ 20) — how bookmakers quote fractional odds. */
function toFraction(x: number): [number, number] {
  let best: [number, number] = [Math.round(x), 1];
  let err = Math.abs(x - best[0]);
  for (let d = 2; d <= 20; d++) {
    const n = Math.round(x * d);
    const e = Math.abs(x - n / d);
    if (e < err - 1e-9) {
      best = [n, d];
      err = e;
    }
  }
  const g = gcd(best[0], best[1]);
  return [best[0] / g, best[1] / g];
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a) || 1;
}
