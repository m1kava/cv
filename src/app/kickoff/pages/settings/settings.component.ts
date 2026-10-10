import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../../core/i18n';
import { formatOdds } from '../../core/odds';
import { AcceptChanges, Lang, SettingsStore } from '../../core/settings.store';
import { clearAll } from '../../core/storage';

@Component({
  selector: 'ko-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>{{ t('nav.settings') }}</h1>

    <section class="group">
      <h2>{{ t('settings.language') }}</h2>
      <div class="options">
        @for (l of langs; track l.id) {
          <button type="button" [class.on]="settings.lang() === l.id" (click)="settings.lang.set(l.id)">{{ l.label }}</button>
        }
      </div>
    </section>

    <section class="group">
      <h2>{{ t('settings.oddsFormat') }}</h2>
      <div class="options">
        @for (f of formats; track f) {
          <button type="button" [class.on]="settings.oddsFormat() === f" (click)="settings.oddsFormat.set(f)">
            {{ t('settings.' + f) }} <small>{{ sample(f) }}</small>
          </button>
        }
      </div>
    </section>

    <section class="group">
      <h2>{{ t('settings.oddsChanges') }}</h2>
      <div class="options options--stack">
        @for (a of accepts; track a) {
          <button type="button" [class.on]="settings.acceptChanges() === a" (click)="settings.acceptChanges.set(a)">
            {{ t('settings.accept.' + a) }}
          </button>
        }
      </div>
    </section>

    <section class="group danger">
      <h2>{{ t('settings.reset') }}</h2>
      <p>{{ t('settings.resetNote') }}</p>
      <button type="button" (click)="reset()">{{ t('settings.reset') }}</button>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 640px;
      }
      h1 {
        margin: 0 0 16px;
        font: 700 30px var(--font-display);
      }
      .group {
        margin-bottom: 14px;
        padding: 18px;
        border: 1px solid var(--k-line);
        border-radius: 16px;
        background: var(--k-panel);
      }
      h2 {
        margin: 0 0 12px;
        font: 600 15px var(--font-display);
      }
      .options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .options--stack {
        display: grid;
      }
      button {
        display: inline-flex;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 16px;
        border: 1px solid var(--k-line);
        border-radius: 12px;
        background: var(--k-panel-2);
        color: var(--k-muted);
        font: 600 14px var(--font);
        text-align: left;
        cursor: pointer;
      }
      button.on {
        border-color: var(--k-accent);
        color: var(--k-text);
      }
      small {
        color: var(--k-accent);
        font-family: var(--font-mono);
      }
      .danger p {
        margin: 0 0 12px;
        color: var(--k-muted);
        font-size: 13px;
      }
      .danger button {
        border-color: rgba(239, 68, 68, 0.5);
        color: #fca5a5;
      }
    `,
  ],
})
export class SettingsComponent {
  readonly settings = inject(SettingsStore);
  readonly t = inject(I18n).t;
  readonly langs: { id: Lang; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'ka', label: 'ქართული' },
  ];
  readonly formats = ['decimal', 'fractional', 'american'] as const;
  readonly accepts: AcceptChanges[] = ['any', 'higher', 'none'];

  sample(format: (typeof this.formats)[number]): string {
    return formatOdds(2.5, format);
  }

  reset(): void {
    clearAll();
    location.reload();
  }
}
