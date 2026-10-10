import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../core/auth.store';
import { I18n } from '../core/i18n';
import { MARKET_BY_ID, formatOdds } from '../core/odds';
import { SettingsStore } from '../core/settings.store';
import { PlaceResult, SlipStore } from '../core/slip.store';
import { ToastStore } from '../core/toast.store';
import { outcomeLabel } from '../shared/odds-button.component';

const QUICK_STAKES = [2, 5, 10, 25];

@Component({
  selector: 'ko-slip',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './slip.component.html',
  styleUrl: './slip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlipComponent {
  readonly slip = inject(SlipStore);
  readonly auth = inject(AuthStore);
  private readonly settings = inject(SettingsStore);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);
  readonly t = this.i18n.t;
  readonly quick = QUICK_STAKES;

  readonly rows = computed(() =>
    this.slip.lines().map((l) => {
      const [home, away] = l.matchLabel.split(' – ');
      const market = MARKET_BY_ID.get(l.marketId)!;
      const label = market.outcomes.find((o) => o.id === l.outcomeId)!.label;
      return {
        ...l,
        pick: outcomeLabel(label, { home, away }, this.t),
        market: this.t(market.name),
        shownOdds: formatOdds(l.live ?? l.odds, this.settings.oddsFormat()),
        oldOdds: formatOdds(l.odds, this.settings.oddsFormat()),
      };
    }),
  );

  readonly message = computed(() => {
    const p = this.slip.problem();
    if (!p || p === 'empty') return this.slip.anyChanged() ? this.t('slip.changed') : '';
    return this.t(
      { sameMatch: 'slip.sameMatch', suspended: 'slip.suspended', stake: 'slip.min', funds: 'slip.funds' }[
        p as 'sameMatch' | 'suspended' | 'stake' | 'funds'
      ] ?? '',
    );
  });

  totalOddsLabel(): string {
    return formatOdds(this.slip.totalOdds(), this.settings.oddsFormat());
  }

  place(): void {
    const result: PlaceResult = this.slip.place();
    switch (result) {
      case 'ok':
        this.toast.show(this.t('slip.placed'), 'ok');
        this.slip.open.set(false);
        break;
      case 'auth':
        this.slip.open.set(false);
        void this.router.navigate(['/kickoff/login'], { queryParams: { next: this.router.url } });
        break;
      case 'changed':
        this.toast.show(this.t('slip.changed'), 'warn');
        break;
      default:
        if (this.message()) this.toast.show(this.message(), 'warn');
    }
  }
}
