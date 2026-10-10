import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { WorkPageComponent } from '../shell/work-page.component';
import { Match, OddsFeedService, Outcome } from './odds-feed.service';

interface Selection {
  matchId: number;
  outcome: Outcome;
  /** Price at the moment it was added (or last accepted). */
  odds: number;
}

interface PlacedBet {
  id: number;
  legs: number;
  stake: number;
  odds: number;
}

const LABEL: Record<Outcome, string> = { home: '1', draw: 'X', away: '2' };

@Component({
  selector: 'app-live-odds',
  standalone: true,
  imports: [DecimalPipe, WorkPageComponent],
  providers: [OddsFeedService],
  templateUrl: './live-odds.component.html',
  styleUrl: './live-odds.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveOddsComponent {
  readonly feed = inject(OddsFeedService);
  readonly outcomes: Outcome[] = ['home', 'draw', 'away'];
  readonly label = LABEL;

  readonly league = signal<string>('all');
  readonly query = signal('');
  readonly slip = signal<Selection[]>([]);
  readonly stake = signal(10);
  readonly placed = signal<PlacedBet[]>([]);
  readonly toast = signal('');

  readonly leagues = computed(() => {
    const counts = new Map<string, number>();
    for (const m of this.feed.matches()) counts.set(m.league, (counts.get(m.league) ?? 0) + 1);
    return [...counts].map(([name, count]) => ({ name, count }));
  });

  readonly groups = computed(() => {
    const q = this.query().trim().toLowerCase();
    const league = this.league();
    const groups = new Map<string, Match[]>();
    for (const m of this.feed.matches()) {
      if (league !== 'all' && m.league !== league) continue;
      if (q && !`${m.home} ${m.away}`.toLowerCase().includes(q)) continue;
      groups.set(m.league, [...(groups.get(m.league) ?? []), m]);
    }
    return [...groups].map(([name, matches]) => ({ name, matches }));
  });

  private readonly byId = computed(() => new Map(this.feed.matches().map((m) => [m.id, m])));

  /** Bet slip lines joined with the live market, so price changes show up instantly. */
  readonly lines = computed(() =>
    this.slip().map((s) => {
      const m = this.byId().get(s.matchId)!;
      const live = m.odds[s.outcome];
      return { ...s, match: m, live, changed: live !== s.odds, suspended: m.suspended };
    }),
  );

  readonly totalOdds = computed(() => this.lines().reduce((acc, l) => acc * l.live, 1));
  readonly potentialReturn = computed(() => this.totalOdds() * this.stake());
  readonly anyChanged = computed(() => this.lines().some((l) => l.changed));
  readonly canPlace = computed(
    () => this.lines().length > 0 && this.stake() > 0 && !this.anyChanged() && !this.lines().some((l) => l.suspended),
  );

  isPicked(matchId: number, outcome: Outcome): boolean {
    return this.slip().some((s) => s.matchId === matchId && s.outcome === outcome);
  }

  /** Alternating class names restart the CSS flash on every price tick. */
  oddClass(m: Match, o: Outcome): string {
    const move = m.move[o];
    return move ? `odd flash-${move}-${m.tick % 2}` : 'odd';
  }

  toggle(m: Match, outcome: Outcome): void {
    this.slip.update((slip) => {
      if (slip.some((s) => s.matchId === m.id && s.outcome === outcome)) {
        return slip.filter((s) => !(s.matchId === m.id && s.outcome === outcome));
      }
      // One selection per match: picking another outcome replaces it.
      return [...slip.filter((s) => s.matchId !== m.id), { matchId: m.id, outcome, odds: m.odds[outcome] }];
    });
  }

  remove(matchId: number): void {
    this.slip.update((slip) => slip.filter((s) => s.matchId !== matchId));
  }

  acceptChanges(): void {
    this.slip.set(this.lines().map(({ matchId, outcome, live }) => ({ matchId, outcome, odds: live })));
  }

  setStake(value: string): void {
    const stake = Number(value);
    this.stake.set(Number.isFinite(stake) && stake > 0 ? Math.min(stake, 10_000) : 0);
  }

  place(): void {
    if (!this.canPlace()) return;
    const bet: PlacedBet = { id: Date.now(), legs: this.slip().length, stake: this.stake(), odds: this.totalOdds() };
    this.placed.update((list) => [bet, ...list].slice(0, 5));
    this.slip.set([]);
    this.toast.set(`Bet placed at ${bet.odds.toFixed(2)} — demo only, no real money.`);
    setTimeout(() => this.toast.set(''), 3200);
  }

  readonly page = {
    title: 'Live Odds Board',
    description:
      'An in-play sports betting board fed by a simulated real-time stream: prices drift several times a second, goals swing the markets, and the bet slip reacts the moment a price you picked moves.',
    stack: ['Angular', 'Signals', 'RxJS', 'TypeScript', 'SCSS'],
    points: [
      'The feed is an RxJS pipeline (interval → filter → map) that emits ~7 market events per second; teardown is handled with takeUntilDestroyed.',
      'All state lives in signals and is updated immutably — only the match that changed gets a new object, so OnPush rows update surgically.',
      'Prices are derived from win/draw/win probabilities with a bookmaker margin; a goal re-weights them based on the score and the minute.',
      'The bet slip is a computed join of your selections with the live market, so changed or suspended prices are flagged instantly and must be accepted before placing.',
      'Price flashes restart on every tick by alternating between two identical CSS animations — no timers or manual DOM work.',
    ],
  };
}
