import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedStore } from '../core/feed.store';
import { I18n } from '../core/i18n';
import { Match } from '../core/models';
import { MARKETS } from '../core/odds';
import { OddsButtonComponent } from './odds-button.component';

export function countdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

@Component({
  selector: 'ko-match-row',
  standalone: true,
  imports: [RouterLink, OddsButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = match();
    <div class="row" [class.finished]="m.status === 'finished'">
      <a class="info" [routerLink]="['/kickoff/match', m.id]">
        <span class="status" [class.live]="m.status === 'live'">
          @switch (m.status) {
            @case ('live') { <i></i>{{ minute() }}' }
            @case ('upcoming') { {{ startsIn() }} }
            @default { {{ t('match.ft') }} }
          }
        </span>
        <span class="teams">
          <span class="team">{{ m.home }}</span>
          <b>{{ m.status === 'upcoming' ? '' : m.score[0] }}</b>
          <span class="team">{{ m.away }}</span>
          <b>{{ m.status === 'upcoming' ? '' : m.score[1] }}</b>
        </span>
        <span class="league">{{ m.league }}</span>
      </a>
      <div class="odds">
        @for (o of m.markets[0].outcomes; track o.id) {
          <ko-odds [match]="m" marketId="1x2" [outcome]="o" />
        }
      </div>
      <a class="more" [routerLink]="['/kickoff/match', m.id]" [attr.aria-label]="m.home + ' – ' + m.away">
        {{ t('lobby.more', { n: moreMarkets }) }} →
      </a>
    </div>
  `,
  styles: [
    `
      .row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(210px, 270px) 96px;
        gap: 14px;
        align-items: center;
        padding: 10px 14px;
        border-top: 1px solid var(--k-line);
      }
      .row.finished {
        opacity: 0.6;
      }
      .info {
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr);
        grid-template-rows: auto auto;
        column-gap: 10px;
        align-items: center;
        min-width: 0;
        color: inherit;
        text-decoration: none;
      }
      .status {
        grid-row: span 2;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--k-muted);
        font: 600 13px var(--font-mono);
      }
      .status.live {
        color: var(--k-live);
      }
      .status i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        animation: blink 1.4s ease-in-out infinite;
      }
      .teams {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 2px 10px;
        font-size: 14px;
      }
      .team {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .teams b {
        font-family: var(--font-mono);
        text-align: right;
      }
      .league {
        display: none;
      }
      .odds {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .more {
        color: var(--k-muted);
        font: 12px var(--font-mono);
        text-align: right;
        text-decoration: none;
      }
      .more:hover,
      .info:hover .team {
        color: var(--k-accent);
      }
      @keyframes blink {
        50% {
          opacity: 0.25;
        }
      }
      @media (max-width: 640px) {
        .row {
          grid-template-columns: minmax(0, 1fr);
          gap: 8px;
        }
        .more {
          display: none;
        }
      }
    `,
  ],
})
export class MatchRowComponent {
  readonly match = input.required<Match>();
  private readonly feed = inject(FeedStore);
  readonly t = inject(I18n).t;
  readonly moreMarkets = MARKETS.length - 1;

  readonly minute = computed(() => Math.max(1, Math.ceil(this.match().minute)));
  readonly startsIn = computed(() => countdown(this.match().kickoffAt - this.feed.now()));
}
