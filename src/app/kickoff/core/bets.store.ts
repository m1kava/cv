import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeedStore } from './feed.store';
import { Bet, BetLeg, Match, Selection } from './models';
import { cashOutValue, settleLeg } from './odds';
import { load, save, uid } from './storage';
import { WalletStore } from './wallet.store';

/**
 * Placed bets: creation, settlement at full time, and cash-out. Bets are
 * persisted; because the simulated feed restarts on reload, bets still open
 * from a previous visit are voided and refunded — as a real book would do
 * for an abandoned event.
 */
@Injectable()
export class BetsStore {
  private readonly feed = inject(FeedStore);
  private readonly wallet = inject(WalletStore);

  readonly bets = signal<Bet[]>(load<Bet[]>('bets', [], Array.isArray));
  readonly open = computed(() => this.bets().filter((b) => b.status === 'open'));
  readonly settled = computed(() => this.bets().filter((b) => b.status !== 'open'));
  readonly inPlay = computed(() => this.open().reduce((sum, b) => sum + b.stake, 0));

  /** Live cash-out offer per open bet (null = unavailable right now). */
  readonly cashOut = computed(() => {
    this.feed.matches(); // re-evaluate on every feed tick
    return new Map(this.open().map((b) => [b.id, cashOutValue(b, (key) => this.feed.oddsFor(key))]));
  });

  constructor() {
    this.voidStale();
    effect(() => save('bets', this.bets()));
    this.feed.finished$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((m) => this.settle(m));
  }

  /** Place bets; the caller has already validated stake, balance and odds. */
  place(type: 'single' | 'acca', selections: Selection[], stake: number): Bet[] {
    const groups = type === 'acca' ? [selections] : selections.map((s) => [s]);
    const created: Bet[] = [];
    for (const legs of groups) {
      const odds = Math.round(legs.reduce((acc, l) => acc * l.odds, 1) * 100) / 100;
      const bet: Bet = {
        id: uid(),
        placedAt: Date.now(),
        type,
        stake,
        odds,
        legs: legs.map((l): BetLeg => ({ ...l, status: 'open' })),
        status: 'open',
        payout: 0,
      };
      if (!this.wallet.apply('bet', -stake, legs.map((l) => l.matchLabel).join(', '))) break;
      created.push(bet);
    }
    this.bets.update((all) => [...created, ...all]);
    return created;
  }

  cashOutBet(id: string): boolean {
    const value = this.cashOut().get(id);
    const bet = this.bets().find((b) => b.id === id);
    if (value == null || !bet) return false;
    this.wallet.apply('cashout', value, bet.legs.map((l) => l.matchLabel).join(', '));
    this.update(id, { status: 'cashed', payout: value, settledAt: Date.now() });
    return true;
  }

  private settle(match: Match): void {
    for (const bet of this.open()) {
      if (!bet.legs.some((l) => l.matchId === match.id)) continue;
      const legs = bet.legs.map((l) =>
        l.matchId === match.id && l.status === 'open'
          ? { ...l, status: settleLeg(l.marketId, l.outcomeId, match.score) ? ('won' as const) : ('lost' as const) }
          : l,
      );
      if (legs.some((l) => l.status === 'lost')) {
        this.update(bet.id, { legs, status: 'lost', payout: 0, settledAt: Date.now() });
      } else if (legs.every((l) => l.status !== 'open')) {
        const payout = Math.round(bet.stake * legs.reduce((acc, l) => acc * (l.status === 'won' ? l.odds : 1), 1) * 100) / 100;
        this.wallet.apply('win', payout, legs.map((l) => l.matchLabel).join(', '));
        this.update(bet.id, { legs, status: 'won', payout, settledAt: Date.now() });
      } else {
        this.update(bet.id, { legs });
      }
    }
  }

  private voidStale(): void {
    for (const bet of this.open()) {
      this.wallet.apply('refund', bet.stake, bet.legs.map((l) => l.matchLabel).join(', '));
      this.update(bet.id, {
        legs: bet.legs.map((l) => ({ ...l, status: l.status === 'open' ? 'void' : l.status })),
        status: 'void',
        payout: bet.stake,
        settledAt: Date.now(),
      });
    }
  }

  private update(id: string, patch: Partial<Bet>): void {
    this.bets.update((all) => all.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
}
