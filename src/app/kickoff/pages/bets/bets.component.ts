import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../../core/auth.store';
import { BetsStore } from '../../core/bets.store';
import { I18n } from '../../core/i18n';
import { Bet } from '../../core/models';
import { MARKET_BY_ID, formatOdds } from '../../core/odds';
import { SettingsStore } from '../../core/settings.store';
import { ToastStore } from '../../core/toast.store';
import { LoginPromptComponent } from '../../shared/login-prompt.component';
import { outcomeLabel } from '../../shared/odds-button.component';

@Component({
  selector: 'ko-bets',
  standalone: true,
  imports: [DatePipe, DecimalPipe, LoginPromptComponent],
  templateUrl: './bets.component.html',
  styleUrl: './bets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BetsComponent {
  readonly bets = inject(BetsStore);
  readonly auth = inject(AuthStore);
  private readonly settings = inject(SettingsStore);
  private readonly toast = inject(ToastStore);
  readonly t = inject(I18n).t;

  readonly tab = signal<'open' | 'settled'>('open');
  readonly list = computed(() => (this.tab() === 'open' ? this.bets.open() : this.bets.settled()));

  odds(value: number): string {
    return formatOdds(value, this.settings.oddsFormat());
  }

  pick(leg: Bet['legs'][number]): string {
    const [home, away] = leg.matchLabel.split(' – ');
    const def = MARKET_BY_ID.get(leg.marketId)!;
    const label = def.outcomes.find((o) => o.id === leg.outcomeId)!.label;
    return `${outcomeLabel(label, { home, away }, this.t)} · ${this.t(def.name)}`;
  }

  title(bet: Bet): string {
    return bet.type === 'acca' && bet.legs.length > 1 ? this.t('bets.acca', { n: bet.legs.length }) : this.t('bets.single');
  }

  cashOut(bet: Bet): void {
    const value = this.bets.cashOut().get(bet.id);
    if (value != null && this.bets.cashOutBet(bet.id)) {
      this.toast.show(`${this.t('bets.status.cashed')}: ₾${value.toFixed(2)}`, 'ok');
    }
  }
}
