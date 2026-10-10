import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, interval } from 'rxjs';
import { Market, Match, MatchEvent, MatchStats } from './models';
import { MARKETS, probabilities, remainingRates, toOdds } from './odds';
import { uid } from './storage';

/** Real milliseconds per tick, and match minutes that pass per tick (90' ≈ 3 real minutes). */
const TICK_MS = 1000;
const MINUTES_PER_TICK = 0.5;
const TARGET_LIVE = 7;
const TARGET_UPCOMING = 6;
/** How long a finished match stays on the board. */
const FINISHED_TTL = 90_000;

const LEAGUES: Record<string, [string, number][]> = {
  'Erovnuli Liga': [
    ['Dinamo Tbilisi', 1.25], ['Dinamo Batumi', 1.2], ['Torpedo Kutaisi', 1.05], ['Iberia 1999', 1.1],
    ['Dila Gori', 0.95], ['Samgurali', 0.9], ['Kolkheti Poti', 0.85], ['Telavi', 0.85],
  ],
  'Premier League': [
    ['Arsenal', 1.35], ['Man City', 1.4], ['Liverpool', 1.35], ['Chelsea', 1.15],
    ['Tottenham', 1.1], ['Newcastle', 1.1], ['Aston Villa', 1.05], ['Brighton', 1.0],
  ],
  'La Liga': [
    ['Real Madrid', 1.4], ['Barcelona', 1.35], ['Atlético', 1.15], ['Athletic Club', 1.05],
    ['Real Sociedad', 1.0], ['Sevilla', 0.95], ['Valencia', 0.9], ['Real Betis', 1.0],
  ],
  'Serie A': [
    ['Inter', 1.3], ['Napoli', 1.2], ['Milan', 1.15], ['Juventus', 1.15],
    ['Atalanta', 1.15], ['Roma', 1.05], ['Lazio', 1.0], ['Fiorentina', 0.95],
  ],
  Bundesliga: [
    ['Bayern', 1.45], ['Leverkusen', 1.3], ['Dortmund', 1.2], ['Leipzig', 1.15],
    ['Stuttgart', 1.05], ['Frankfurt', 1.0], ['Freiburg', 0.95], ['Wolfsburg', 0.9],
  ],
};

export const LEAGUE_NAMES = Object.keys(LEAGUES);

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/**
 * The simulated in-play feed. One RxJS interval advances every match; each
 * tick produces new immutable Match objects, re-prices all markets with the
 * Poisson model, and emits `finished$` when a match ends so bets can settle.
 */
@Injectable()
export class FeedStore {
  readonly matches = signal<Match[]>([]);
  /** Wall-clock time, refreshed every tick — drives countdowns. */
  readonly now = signal(Date.now());
  readonly finished$ = new Subject<Match>();

  readonly byId = computed(() => new Map(this.matches().map((m) => [m.id, m])));
  readonly live = computed(() => this.matches().filter((m) => m.status === 'live'));
  readonly upcoming = computed(() =>
    this.matches()
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => a.kickoffAt - b.kickoffAt),
  );
  readonly finished = computed(() => this.matches().filter((m) => m.status === 'finished'));

  /** Suspension countdowns per match, in ticks. */
  private readonly suspendTicks = new Map<string, number>();

  constructor() {
    this.matches.set(this.seed());
    interval(TICK_MS)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.tick());
  }

  /** Live price of a selection, or null when it can't be backed right now. */
  oddsFor(key: string): number | null {
    const [matchId, marketId, outcomeId] = key.split(':');
    const match = this.byId().get(matchId);
    if (!match || match.status === 'finished' || match.suspended) return null;
    const outcome = match.markets.find((m) => m.id === marketId)?.outcomes.find((o) => o.id === outcomeId);
    return outcome && !outcome.closed ? outcome.odds : null;
  }

  // ---------------------------------------------------------------- tick

  private tick(): void {
    const now = Date.now();
    this.now.set(now);
    const finishedNow: Match[] = [];

    let next = this.matches()
      .filter((m) => !(m.status === 'finished' && now - (m.finishedAt ?? now) > FINISHED_TTL))
      .map((m) => {
        if (m.status === 'upcoming') {
          if (now >= m.kickoffAt) {
            return this.price({ ...m, status: 'live', minute: 0, events: [{ minute: 0, kind: 'kickoff' }] });
          }
          return this.drift(m);
        }
        if (m.status === 'live') {
          const advanced = this.advance(m);
          if (advanced.status === 'finished') finishedNow.push(advanced);
          return advanced;
        }
        return m;
      });

    next = this.topUp(next, now);
    this.matches.set(next);
    finishedNow.forEach((m) => this.finished$.next(m));
  }

  /** One tick of play: clock, chances, cards, possession and a re-price. */
  private advance(m: Match): Match {
    const prevMinute = m.minute;
    const minute = Math.min(90, m.minute + MINUTES_PER_TICK);
    const score: [number, number] = [...m.score];
    const stats = cloneStats(m.stats);
    const events = [...m.events];
    let suspendFor = Math.max(0, (this.suspendTicks.get(m.id) ?? 0) - 1);

    if (prevMinute < 45 && minute >= 45) events.push({ minute: 45, kind: 'halftime' });

    ([0, 1] as const).forEach((side) => {
      const perTick = (m.rates[side] / 90) * MINUTES_PER_TICK;
      // Shots happen ~8x as often as goals; some are on target.
      if (Math.random() < perTick * 8) {
        stats.shots[side]++;
        if (Math.random() < 0.38) stats.onTarget[side]++;
      }
      if (Math.random() < perTick * 3.5) stats.corners[side]++;
      if (Math.random() < perTick) {
        score[side]++;
        stats.shots[side]++;
        stats.onTarget[side]++;
        events.push({ minute: Math.ceil(minute), kind: 'goal', side: side ? 'away' : 'home' });
        suspendFor = 4;
      }
      if (Math.random() < 0.012) {
        stats.yellows[side]++;
        events.push({ minute: Math.ceil(minute), kind: 'yellow', side: side ? 'away' : 'home' });
      } else if (Math.random() < 0.0008) {
        events.push({ minute: Math.ceil(minute), kind: 'red', side: side ? 'away' : 'home' });
        suspendFor = Math.max(suspendFor, 3);
      }
    });

    // Possession drifts towards the stronger attack, with noise.
    const bias = (m.rates[0] / (m.rates[0] + m.rates[1])) * 100;
    stats.possession = clamp(stats.possession + (bias - stats.possession) * 0.05 + rand(-2, 2), 25, 75);

    // Occasional brief suspension, like a VAR check or a dangerous attack.
    if (!suspendFor && Math.random() < 0.01) suspendFor = 2;
    this.suspendTicks.set(m.id, suspendFor);

    if (minute >= 90) {
      events.push({ minute: 90, kind: 'fulltime' });
      this.suspendTicks.delete(m.id);
      return this.price({ ...m, minute: 90, score, stats, events, status: 'finished', suspended: false, finishedAt: Date.now() });
    }
    return this.price({ ...this.drift(m), minute, score, stats, events, suspended: suspendFor > 0 });
  }

  /** Small random walk on scoring rates, so prices move even without events. */
  private drift(m: Match): Match {
    const rates: [number, number] = [
      clamp(m.rates[0] * (1 + rand(-0.015, 0.015)), 0.4, 3.2),
      clamp(m.rates[1] * (1 + rand(-0.015, 0.015)), 0.3, 3),
    ];
    return m.status === 'upcoming' ? this.price({ ...m, rates }) : { ...m, rates };
  }

  /** Re-price every market from the score, minute and rates; record price moves. */
  private price(m: Match): Match {
    const p = probabilities(m.score, remainingRates(m.rates, m.minute));
    const markets: Market[] = MARKETS.map((def) => {
      const prev = m.markets.find((x) => x.id === def.id);
      return {
        id: def.id,
        outcomes: def.outcomes.map((o) => {
          const odds = m.status === 'finished' ? null : toOdds(p.get(`${def.id}:${o.id}`)!);
          const before = prev?.outcomes.find((x) => x.id === o.id);
          const value = odds ?? before?.odds ?? 1.01;
          const move = before && odds && !before.closed ? (odds > before.odds ? 'up' : odds < before.odds ? 'down' : null) : null;
          return { id: o.id, label: o.label, odds: value, move, closed: odds == null };
        }),
      };
    });
    return { ...m, markets, tick: m.tick + 1 };
  }

  // ---------------------------------------------------------------- schedule

  private topUp(list: Match[], now: number): Match[] {
    const busy = new Set(list.filter((m) => m.status !== 'finished').flatMap((m) => [m.home, m.away]));
    const out = [...list];
    const upcoming = out.filter((m) => m.status === 'upcoming').length;
    for (let i = upcoming; i < TARGET_UPCOMING; i++) {
      const latest = Math.max(now, ...out.filter((m) => m.status === 'upcoming').map((m) => m.kickoffAt));
      const match = this.create(busy, 'upcoming', latest + rand(25_000, 70_000));
      if (match) out.push(match);
    }
    return out;
  }

  private create(busy: Set<string>, status: 'upcoming' | 'live', kickoffAt: number, minute = 0): Match | null {
    const league = pick(LEAGUE_NAMES);
    const free = LEAGUES[league].filter(([team]) => !busy.has(team));
    if (free.length < 2) return null;
    const [home, away] = [...free].sort(() => Math.random() - 0.5);
    busy.add(home[0]);
    busy.add(away[0]);
    const rates: [number, number] = [1.45 * home[1] * rand(0.9, 1.1), 1.15 * away[1] * rand(0.9, 1.1)];

    const score: [number, number] = [0, 0];
    const events: MatchEvent[] = [];
    const stats: MatchStats = { possession: 50, shots: [0, 0], onTarget: [0, 0], corners: [0, 0], yellows: [0, 0] };
    if (status === 'live') {
      // Fast-forward a match already in progress so the board starts full.
      events.push({ minute: 0, kind: 'kickoff' });
      for (let t = 1; t <= minute; t++) {
        if (t === 45) events.push({ minute: 45, kind: 'halftime' });
        ([0, 1] as const).forEach((side) => {
          if (Math.random() < rates[side] / 90) {
            score[side]++;
            stats.onTarget[side]++;
            stats.shots[side]++;
            events.push({ minute: t, kind: 'goal', side: side ? 'away' : 'home' });
          }
          if (Math.random() < (rates[side] / 90) * 8) stats.shots[side]++;
          if (Math.random() < (rates[side] / 90) * 3.5) stats.corners[side]++;
          if (Math.random() < 0.024) {
            stats.yellows[side]++;
            events.push({ minute: t, kind: 'yellow', side: side ? 'away' : 'home' });
          }
        });
      }
      stats.onTarget = [Math.max(stats.onTarget[0], Math.round(stats.shots[0] * 0.35)), Math.max(stats.onTarget[1], Math.round(stats.shots[1] * 0.35))];
      stats.possession = Math.round((rates[0] / (rates[0] + rates[1])) * 100);
    }

    return this.price({
      id: uid(),
      league,
      home: home[0],
      away: away[0],
      status,
      kickoffAt,
      minute,
      score,
      rates,
      markets: [],
      stats,
      events,
      suspended: false,
      tick: 0,
    });
  }

  private seed(): Match[] {
    const now = Date.now();
    const busy = new Set<string>();
    const out: Match[] = [];
    for (let i = 0; i < TARGET_LIVE; i++) {
      const minute = Math.floor(rand(4, 84));
      const m = this.create(busy, 'live', now - minute * 2000, minute);
      if (m) out.push(m);
    }
    let at = now + rand(15_000, 30_000);
    for (let i = 0; i < TARGET_UPCOMING; i++) {
      const m = this.create(busy, 'upcoming', at);
      if (m) out.push(m);
      at += rand(25_000, 70_000);
    }
    return out;
  }
}


function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function cloneStats(s: MatchStats): MatchStats {
  return {
    possession: s.possession,
    shots: [...s.shots],
    onTarget: [...s.onTarget],
    corners: [...s.corners],
    yellows: [...s.yellows],
  };
}
