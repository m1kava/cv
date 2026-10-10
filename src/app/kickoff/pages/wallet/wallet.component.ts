import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../../core/auth.store';
import { BetsStore } from '../../core/bets.store';
import { I18n } from '../../core/i18n';
import { ToastStore } from '../../core/toast.store';
import { WalletStore } from '../../core/wallet.store';
import { LoginPromptComponent } from '../../shared/login-prompt.component';

@Component({
  selector: 'ko-wallet',
  standalone: true,
  imports: [DatePipe, DecimalPipe, LoginPromptComponent],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletComponent {
  readonly wallet = inject(WalletStore);
  readonly bets = inject(BetsStore);
  readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastStore);
  readonly t = inject(I18n).t;

  readonly amount = signal(20);
  readonly quick = [10, 20, 50, 100];

  /** Betting result so far: everything returned minus everything staked. */
  readonly profit = computed(() =>
    this.wallet
      .transactions()
      .filter((tx) => tx.kind === 'bet' || tx.kind === 'win' || tx.kind === 'cashout' || tx.kind === 'refund')
      .reduce((sum, tx) => sum + tx.amount, 0),
  );

  setAmount(value: number): void {
    this.amount.set(Number.isFinite(value) ? Math.max(0, Math.min(10_000, Math.round(value * 100) / 100)) : 0);
  }

  deposit(): void {
    if (this.amount() <= 0) return;
    this.wallet.apply('deposit', this.amount());
    this.toast.show(`${this.t('tx.deposit')}: ₾${this.amount().toFixed(2)}`, 'ok');
  }

  withdraw(): void {
    if (this.amount() <= 0) return;
    if (!this.wallet.apply('withdraw', -this.amount())) {
      this.toast.show(this.t('wallet.tooMuch'), 'warn');
      return;
    }
    this.toast.show(`${this.t('tx.withdraw')}: ₾${this.amount().toFixed(2)}`, 'ok');
  }
}
