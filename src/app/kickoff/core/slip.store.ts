import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthStore } from './auth.store';
import { BetsStore } from './bets.store';
import { FeedStore } from './feed.store';
import { Match, MarketId, Selection, selectionKey } from './models';
import { SettingsStore } from './settings.store';
import { WalletStore } from './wallet.store';

export type SlipMode = 'single' | 'acca';
export type PlaceResult = 'ok' | 'auth' | 'changed' | 'suspended' | 'funds' | 'stake' | 'sameMatch' | 'empty';

/**
 * The bet slip: selections joined live with the feed, so every line knows its
 * current price, whether it moved, and whether it can still be backed.
 */
@Injectable()
export class SlipStore {
  private readonly feed = inject(FeedStore);
  private readonly bets = inject(BetsStore);
  private readonly wallet = inject(WalletStore);
  private readonly auth = inject(AuthStore);
  private readonly settings = inject(SettingsStore);

  readonly selections = signal<Selection[]>([]);
  readonly mode = signal<SlipMode>('single');
  readonly stake = signal(5);
  /** Mobile drawer state. */
  readonly open = signal(false);

  readonly keys = computed(() => new Set(this.selections().map((s) => s.key)));

  readonly lines = computed(() =>
    this.selections().map((s) => {
      const live = this.feed.oddsFor(s.key);
      return { ...s, live, unavailable: live == null, changed: live != null && live !== s.odds, up: live != null && live > s.odds };
    }),
  );

  readonly sameMatch = computed(() => {
    const ids = this.selections().map((s) => s.matchId);
    return new Set(ids).size !== ids.length;
  });

  readonly betCount = computed(() => (this.mode() === 'acca' ? (this.selections().length ? 1 : 0) : this.selections().length));
  readonly totalStake = computed(() => this.stake() * this.betCount());

  readonly totalOdds = computed(() =>
    this.lines().reduce((acc, l) => acc * (l.live ?? l.odds), 1),
  );

  readonly potentialReturn = computed(() =>
    this.mode() === 'acca'
      ? this.totalOdds() * this.stake()
      : this.lines().reduce((sum, l) => sum + (l.live ?? l.odds) * this.stake(), 0),
  );

  readonly anyChanged = computed(() => this.lines().some((l) => l.changed));

  /** Why the slip can't be placed right now (null = good to go). */
  readonly problem = computed<PlaceResult | null>(() => {
    if (!this.selections().length) return 'empty';
    if (this.mode() === 'acca' && this.sameMatch()) return 'sameMatch';
    if (this.lines().some((l) => l.unavailable)) return 'suspended';
    if (!(this.stake() >= 1)) return 'stake';
    if (this.auth.loggedIn() && this.totalStake() > this.wallet.balance()) return 'funds';
    return null;
  });

  has(matchId: string, marketId: MarketId, outcomeId: string): boolean {
    return this.keys().has(selectionKey(matchId, marketId, outcomeId));
  }

  toggle(match: Match, marketId: MarketId, outcomeId: string): void {
    const key = selectionKey(match.id, marketId, outcomeId);
    if (this.keys().has(key)) {
      this.selections.update((list) => list.filter((s) => s.key !== key));
      return;
    }
    const odds = this.feed.oddsFor(key);
    if (odds == null) return;
    this.selections.update((list) => [
      ...list,
      { key, matchId: match.id, marketId, outcomeId, odds, matchLabel: `${match.home} – ${match.away}` },
    ]);
  }

  remove(key: string): void {
    this.selections.update((list) => list.filter((s) => s.key !== key));
  }

  clear(): void {
    this.selections.set([]);
  }

  acceptChanges(): void {
    this.selections.set(this.lines().map(({ live, unavailable, changed, up, ...s }) => ({ ...s, odds: live ?? s.odds })));
  }

  setStake(value: number): void {
    this.stake.set(Number.isFinite(value) ? Math.min(Math.max(0, Math.round(value * 100) / 100), 5000) : 0);
  }

  place(): PlaceResult {
    if (!this.auth.loggedIn()) return 'auth';
    const problem = this.problem();
    if (problem) return problem;

    if (this.anyChanged()) {
      const rule = this.settings.acceptChanges();
      const allUp = this.lines().every((l) => !l.changed || l.up);
      if (rule === 'none' || (rule === 'higher' && !allUp)) return 'changed';
      this.acceptChanges();
    }

    const placed = this.bets.place(this.mode(), this.selections(), this.stake());
    if (!placed.length) return 'funds';
    this.clear();
    return 'ok';
  }
}
