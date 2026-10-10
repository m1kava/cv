import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18n } from '../core/i18n';

/** Shown on account pages when nobody is logged in. */
@Component({
  selector: 'ko-login-prompt',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="prompt">
      <span aria-hidden="true">🔐</span>
      <p>{{ t('auth.required') }}</p>
      <a routerLink="/kickoff/login" [queryParams]="{ next: router.url }">{{ t('auth.login') }}</a>
    </div>
  `,
  styles: [
    `
      .prompt {
        display: grid;
        justify-items: center;
        gap: 10px;
        padding: 56px 20px;
        border: 1px dashed var(--k-line);
        border-radius: 18px;
        text-align: center;
      }
      span {
        font-size: 34px;
      }
      p {
        margin: 0;
        color: var(--k-muted);
      }
      a {
        padding: 10px 20px;
        border-radius: 12px;
        background: var(--k-accent);
        color: var(--k-accent-ink);
        font-weight: 700;
        text-decoration: none;
      }
    `,
  ],
})
export class LoginPromptComponent {
  readonly t = inject(I18n).t;
  readonly router = inject(Router);
}
