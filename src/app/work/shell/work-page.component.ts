import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';

/** Shared frame for every project page: back link, intro, the live app, and build notes. */
@Component({
  selector: 'app-work-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="top">
      <a class="top__back" routerLink="/" fragment="work"><span aria-hidden="true">←</span> Back to portfolio</a>
      <span class="top__tag">Live demo · simulated data</span>
    </header>

    <section class="intro">
      <p class="eyebrow">{{ kicker() }}</p>
      <h1 class="intro__title">{{ title() }}</h1>
      <p class="intro__text">{{ description() }}</p>
      <ul class="intro__stack" aria-label="Technologies">
        @for (tech of stack(); track tech) {
          <li class="chip">{{ tech }}</li>
        }
      </ul>
    </section>

    <section class="app" aria-label="Live demo">
      <ng-content />
    </section>

    <section class="notes" aria-labelledby="notes-title">
      <h2 id="notes-title">How it's built</h2>
      <ul>
        @for (point of points(); track point) {
          <li>{{ point }}</li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1240px;
        margin: 0 auto;
        padding: 20px 20px 80px;
      }
      .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 40px;
      }
      .top__back {
        color: var(--text-muted);
        text-decoration: none;
        font-size: 15px;
        &:hover {
          color: var(--cyan);
        }
      }
      .top__tag {
        color: var(--text-dim);
        font-family: var(--font-mono);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .intro {
        max-width: 760px;
        margin-bottom: 32px;
      }
      .intro__title {
        margin: 0 0 14px;
        font-family: var(--font-display);
        font-size: clamp(36px, 5vw, 60px);
        line-height: 1.02;
        letter-spacing: -0.04em;
      }
      .intro__text {
        margin: 0 0 18px;
        color: var(--text-muted);
        font-size: 17px;
      }
      .intro__stack {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .app {
        margin-bottom: 48px;
      }
      .notes {
        max-width: 760px;
        h2 {
          margin: 0 0 14px;
          font-family: var(--font-display);
          font-size: 24px;
        }
        ul {
          display: grid;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        li {
          position: relative;
          padding-left: 22px;
          color: var(--text-muted);
          &::before {
            content: '▹';
            position: absolute;
            left: 0;
            color: var(--cyan);
          }
        }
      }
    `,
  ],
})
export class WorkPageComponent {
  readonly kicker = input('Project');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly stack = input<string[]>([]);
  readonly points = input<string[]>([]);
}
