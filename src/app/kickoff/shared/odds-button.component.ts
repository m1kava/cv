import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18n } from '../core/i18n';
import { Match, MarketId, Outcome } from '../core/models';
import { formatOdds } from '../core/odds';
import { SettingsStore } from '../core/settings.store';
import { SlipStore } from '../core/slip.store';

@Component({
  selector: 'ko-odds',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [class]="flashClass()"
      [class.picked]="picked()"
      [class.wide]="wide()"
      [disabled]="locked()"
      [attr.aria-pressed]="picked()"
      [attr.aria-label]="ariaLabel()"
      (click)="slip.toggle(match(), marketId(), outcome().id)"
    >
      @if (showLabel()) {
        <span class="label">{{ label() }}</span>
      }
      <span class="price">
        @if (locked()) {
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 7V5a3 3 0 0 1 6 0v2h.5A1.5 1.5 0 0 1 13 8.5v5A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3 13.5v-5A1.5 1.5 0 0 1 4.5 7H5Zm1.5 0h3V5a1.5 1.5 0 0 0-3 0v2Z" fill="currentColor"/></svg>
        } @else {
          {{ price() }}
        }
      </span>
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        height: 42px;
        padding: 0 10px;
        border: 1px solid var(--k-line);
        border-radius: 10px;
        background: var(--k-panel-2);
        color: var(--k-text);
        font: 600 14px var(--font-mono);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      button.wide {
        justify-content: space-between;
      }
      button:hover:not(:disabled) {
        border-color: var(--k-accent);
      }
      button:disabled {
        cursor: not-allowed;
        color: var(--k-muted);
        opacity: 0.6;
      }
      button.picked {
        border-color: var(--k-accent);
        background: var(--k-accent);
        color: var(--k-accent-ink);
      }
      .label {
        overflow: hidden;
        color: var(--k-muted);
        font: 500 13px var(--font);
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .picked .label {
        color: inherit;
      }
      svg {
        width: 14px;
        height: 14px;
      }
      .up-0,
      .up-1 {
        animation: up-0 1.1s ease-out;
      }
      .up-1 {
        animation-name: up-1;
      }
      .down-0,
      .down-1 {
        animation: down-0 1.1s ease-out;
      }
      .down-1 {
        animation-name: down-1;
      }
      @keyframes up-0 { from { box-shadow: inset 0 0 0 2px var(--k-up); color: var(--k-up); } }
      @keyframes up-1 { from { box-shadow: inset 0 0 0 2px var(--k-up); color: var(--k-up); } }
      @keyframes down-0 { from { box-shadow: inset 0 0 0 2px var(--k-down); color: var(--k-down); } }
      @keyframes down-1 { from { box-shadow: inset 0 0 0 2px var(--k-down); color: var(--k-down); } }
    `,
  ],
})
export class OddsButtonComponent {
  readonly match = input.required<Match>();
  readonly marketId = input.required<MarketId>();
  readonly outcome = input.required<Outcome>();
  readonly showLabel = input(false);
  readonly wide = input(false);

  readonly slip = inject(SlipStore);
  private readonly settings = inject(SettingsStore);
  private readonly i18n = inject(I18n);

  readonly locked = computed(
    () => this.match().suspended || this.match().status === 'finished' || this.outcome().closed,
  );
  readonly picked = computed(() => this.slip.has(this.match().id, this.marketId(), this.outcome().id));
  readonly price = computed(() => formatOdds(this.outcome().odds, this.settings.oddsFormat()));
  readonly label = computed(() => outcomeLabel(this.outcome().label, this.match(), this.i18n.t));
  /** Alternating class names restart the flash animation on every tick. */
  readonly flashClass = computed(() => {
    const move = this.outcome().move;
    return move && !this.locked() ? `${move}-${this.match().tick % 2}` : '';
  });
  readonly ariaLabel = computed(
    () => `${this.label()} ${this.locked() ? this.i18n.t('suspended') : this.price()}`,
  );
}

/** Human label for an outcome: team names for 1/2, translated words for the rest. */
export function outcomeLabel(label: string, match: Pick<Match, 'home' | 'away'>, t: (k: string) => string): string {
  if (label === '1') return match.home;
  if (label === '2') return match.away;
  if (label === 'X') return t('outcome.draw');
  if (/^[0-9X]{2}$/.test(label)) return label;
  return t(`outcome.${label}`);
}
