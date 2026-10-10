import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../core/auth.store';
import { BetsStore } from '../core/bets.store';
import { FeedStore } from '../core/feed.store';
import { I18n } from '../core/i18n';
import { SettingsStore } from '../core/settings.store';
import { SlipStore } from '../core/slip.store';
import { ToastStore } from '../core/toast.store';
import { WalletStore } from '../core/wallet.store';
import { SlipComponent } from '../slip/slip.component';

/**
 * Root of the Kickoff app. All stores are provided here, so the simulated
 * feed starts when you enter /kickoff and stops (DestroyRef) when you leave.
 */
@Component({
  selector: 'ko-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DecimalPipe, SlipComponent],
  providers: [SettingsStore, I18n, ToastStore, FeedStore, WalletStore, AuthStore, BetsStore, SlipStore],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly t = inject(I18n).t;
  readonly settings = inject(SettingsStore);
  readonly auth = inject(AuthStore);
  readonly wallet = inject(WalletStore);
  readonly slip = inject(SlipStore);
  readonly bets = inject(BetsStore);
  readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  constructor() {
    // Tell the player when their bets settle, wherever they are in the app.
    inject(FeedStore)
      .finished$.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((match) => {
        const mine = this.bets.settled().filter(
          (b) => b.legs.some((l) => l.matchId === match.id) && b.settledAt && Date.now() - b.settledAt < 2000,
        );
        for (const bet of mine) {
          if (bet.status === 'won') this.toast.show(`🎉 ${this.t('bets.status.won')}: ₾${bet.payout.toFixed(2)}`, 'ok');
          else if (bet.status === 'lost') this.toast.show(`${this.t('bets.status.lost')}: ${bet.legs[0].matchLabel}`, 'warn');
        }
      });
  }

  toggleLang(): void {
    this.settings.lang.update((l) => (l === 'en' ? 'ka' : 'en'));
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/kickoff']);
  }
}
