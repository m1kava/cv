import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, interval, map } from 'rxjs';

export type Outcome = 'home' | 'draw' | 'away';
export type Move = 'up' | 'down' | null;

export interface Match {
  id: number;
  league: string;
  home: string;
  away: string;
  minute: number;
  score: [number, number];
  /** Underlying win/draw/win probabilities; odds are derived from these. */
  probs: Record<Outcome, number>;
  odds: Record<Outcome, number>;
  move: Record<Outcome, Move>;
  /** Bumped on every price change so the UI can restart its flash animation. */
  tick: number;
  goals: number;
  suspended: boolean;
}

const LEAGUES: Record<string, string[]> = {
  'Erovnuli Liga': ['Dinamo Tbilisi', 'Dinamo Batumi', 'Torpedo Kutaisi', 'Dila Gori', 'Samgurali', 'Iberia 1999'],
  'Premier League': ['Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Tottenham', 'Newcastle', 'Aston Villa', 'Brighton'],
  'La Liga': ['Real Madrid', 'Barcelona', 'Atlético', 'Sevilla', 'Valencia', 'Real Betis'],
  'Serie A': ['Inter', 'Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio'],
  Bundesliga: ['Bayern', 'Dortmund', 'Leverkusen', 'Leipzig'],
};

/** Bookmaker margin baked into the prices. */
const MARGIN = 1.065;
const OUTCOMES: Outcome[] = ['home', 'draw', 'away'];

function toOdds(probs: Record<Outcome, number>): Record<Outcome, number> {
  const odds = {} as Record<Outcome, number>;
  for (const o of OUTCOMES) {
    odds[o] = Math.max(1.01, Math.round((1 / (probs[o] * MARGIN)) * 100) / 100);
  }
  return odds;
}

function normalise(p: Record<Outcome, number>): Record<Outcome, number> {
  const total = p.home + p.draw + p.away;
  return { home: p.home / total, draw: p.draw / total, away: p.away / total };
}

/**
 * A simulated in-play odds feed. A fast RxJS stream emits one market event at
 * a time (price drift, goal, suspension) and a slower one runs the match
 * clock. State lives in a signal and is updated immutably — only the match
 * that changed gets a new object, so OnPush rows re-render surgically.
 */
@Injectable()
export class OddsFeedService {
  readonly matches = signal<Match[]>(this.seed());
  readonly paused = signal(false);
  /** Market events processed in the last second. */
  readonly rate = signal(0);

  private events = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const running = () => !this.paused();

    interval(140)
      .pipe(filter(running), map(() => this.randomEvent()), takeUntilDestroyed(destroyRef))
      .subscribe(() => this.events++);

    interval(1000)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        this.rate.set(this.events);
        this.events = 0;
      });

    interval(2500)
      .pipe(filter(running), takeUntilDestroyed(destroyRef))
      .subscribe(() =>
        this.matches.update((list) => list.map((m) => (m.minute < 90 ? { ...m, minute: m.minute + 1 } : m))),
      );
  }

  private randomEvent(): void {
    const list = this.matches();
    const index = Math.floor(Math.random() * list.length);
    const match = list[index];
    const roll = Math.random();

    let next: Match;
    if (match.suspended) {
      next = roll < 0.35 ? { ...match, suspended: false } : match;
    } else if (roll < 0.012 && match.minute < 90) {
      next = this.goal(match);
    } else if (roll < 0.03) {
      next = { ...match, suspended: true };
    } else {
      next = this.drift(match);
    }
    if (next !== match) {
      this.matches.update((all) => all.map((m, i) => (i === index ? next : m)));
    }
  }

  /** Small random walk on the probabilities — the everyday price movement. */
  private drift(match: Match): Match {
    const p = { ...match.probs };
    const target = OUTCOMES[Math.floor(Math.random() * 3)];
    p[target] *= 1 + (Math.random() - 0.5) * 0.12;
    return this.reprice(match, normalise(p));
  }

  private goal(match: Match): Match {
    const homeScores = Math.random() < match.probs.home / (match.probs.home + match.probs.away);
    const score: [number, number] = homeScores ? [match.score[0] + 1, match.score[1]] : [match.score[0], match.score[1] + 1];
    const lead = score[0] - score[1];
    const late = match.minute / 90;
    // The leading side becomes much more likely to win, more so late in the game.
    const swing = Math.min(0.85, 0.32 + Math.abs(lead) * 0.18 + late * 0.25);
    const probs =
      lead === 0
        ? normalise({ home: 0.32, draw: 0.36 + late * 0.3, away: 0.32 })
        : lead > 0
          ? normalise({ home: swing, draw: (1 - swing) * 0.6, away: (1 - swing) * 0.4 })
          : normalise({ home: (1 - swing) * 0.4, draw: (1 - swing) * 0.6, away: swing });
    return { ...this.reprice(match, probs), score, goals: match.goals + 1, suspended: true };
  }

  private reprice(match: Match, probs: Record<Outcome, number>): Match {
    const odds = toOdds(probs);
    const move = {} as Record<Outcome, Move>;
    for (const o of OUTCOMES) {
      move[o] = odds[o] > match.odds[o] ? 'up' : odds[o] < match.odds[o] ? 'down' : null;
    }
    return { ...match, probs, odds, move, tick: match.tick + 1 };
  }

  private seed(): Match[] {
    const matches: Match[] = [];
    let id = 1;
    for (const [league, teams] of Object.entries(LEAGUES)) {
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      for (let i = 0; i + 1 < shuffled.length; i += 2) {
        const strength = 0.25 + Math.random() * 0.25;
        const probs = normalise({ home: strength + 0.05, draw: 0.27, away: 0.5 - strength });
        const minute = 3 + Math.floor(Math.random() * 80);
        const score: [number, number] = [Math.floor(Math.random() * 2.4), Math.floor(Math.random() * 1.8)];
        matches.push({
          id: id++,
          league,
          home: shuffled[i],
          away: shuffled[i + 1],
          minute,
          score,
          probs,
          odds: toOdds(probs),
          move: { home: null, draw: null, away: null },
          tick: 0,
          goals: 0,
          suspended: false,
        });
      }
    }
    return matches;
  }
}
