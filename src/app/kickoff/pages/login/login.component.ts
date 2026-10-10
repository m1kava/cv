import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AutofocusDirective } from '../../../shared/autofocus.directive';
import { AuthStore } from '../../core/auth.store';
import { I18n } from '../../core/i18n';
import { ToastStore } from '../../core/toast.store';

@Component({
  selector: 'ko-login',
  standalone: true,
  imports: [AutofocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <p class="logo">kick<b>off</b></p>
      <h1>{{ t('auth.title') }}</h1>
      <form (submit)="$event.preventDefault(); submit(user.value, pass.value)" novalidate>
        <label>
          {{ t('auth.username') }}
          <input #user name="username" autocomplete="username" appAutofocus />
        </label>
        <label>
          {{ t('auth.password') }}
          <input #pass name="password" type="password" autocomplete="current-password" />
        </label>
        @if (error()) {
          <p class="error" role="alert">{{ t('auth.invalid') }}</p>
        }
        <button type="submit" class="primary">{{ t('auth.login') }}</button>
      </form>
      <div class="or"><span>or</span></div>
      <button type="button" class="demo" (click)="demo()">{{ t('auth.demo') }}</button>
      <p class="note">{{ t('auth.note') }}</p>
    </section>
  `,
  styles: [
    `
      :host {
        display: grid;
        place-items: start center;
        padding-top: 20px;
      }
      .card {
        width: min(420px, 100%);
        padding: 28px;
        border: 1px solid var(--k-line);
        border-radius: 20px;
        background: var(--k-panel);
      }
      .logo {
        margin: 0 0 6px;
        font: 700 22px var(--font-display);
      }
      .logo b {
        color: var(--k-accent);
      }
      h1 {
        margin: 0 0 20px;
        font: 700 26px var(--font-display);
      }
      form {
        display: grid;
        gap: 14px;
      }
      label {
        display: grid;
        gap: 6px;
        color: var(--k-muted);
        font-size: 13px;
      }
      input {
        height: 46px;
        padding: 0 14px;
        border: 1px solid var(--k-line);
        border-radius: 12px;
        background: var(--k-bg);
        color: var(--k-text);
        font: 15px var(--font);
      }
      input:focus {
        outline: none;
        border-color: var(--k-accent);
      }
      .error {
        margin: 0;
        color: #fca5a5;
        font-size: 13px;
      }
      button {
        height: 48px;
        border-radius: 12px;
        font: 700 15px var(--font);
        cursor: pointer;
      }
      .primary {
        border: 0;
        background: var(--k-accent);
        color: var(--k-accent-ink);
      }
      .demo {
        width: 100%;
        border: 1px solid var(--k-line);
        background: var(--k-panel-2);
        color: var(--k-text);
      }
      .or {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 10px;
        align-items: center;
        margin: 16px 0;
        color: var(--k-muted);
        font-size: 12px;
      }
      .or::before,
      .or::after {
        content: '';
        height: 1px;
        background: var(--k-line);
      }
      .note {
        margin: 16px 0 0;
        color: var(--k-muted);
        font-size: 12px;
        text-align: center;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastStore);
  readonly t = inject(I18n).t;
  readonly error = signal(false);

  submit(name: string, password: string): void {
    if (!this.auth.login(name, password)) {
      this.error.set(true);
      return;
    }
    this.done();
  }

  demo(): void {
    this.auth.loginDemo();
    this.done();
  }

  private done(): void {
    this.toast.show(`👋 ${this.auth.user()!.name}`, 'ok');
    const next = this.route.snapshot.queryParamMap.get('next');
    void this.router.navigateByUrl(next?.startsWith('/kickoff') ? next : '/kickoff');
  }
}
