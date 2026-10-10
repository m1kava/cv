import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedStore } from '../../core/feed.store';
import { I18n } from '../../core/i18n';
import { MARKETS } from '../../core/odds';
import { OddsButtonComponent } from '../../shared/odds-button.component';
import { countdown } from '../../shared/match-row.component';

const EVENT_ICON: Record<string, string> = {
  goal: '⚽',
  yellow: '🟨',
  red: '🟥',
  kickoff: '▶',
  halftime: '⏸',
  fulltime: '🏁',
};

@Component({
  selector: 'ko-match',
  standalone: true,
  imports: [RouterLink, DecimalPipe, OddsButtonComponent],
  templateUrl: './match.component.html',
  styleUrl: './match.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchComponent {
  /** Route param, bound via withComponentInputBinding. */
  readonly id = input.required<string>();

  private readonly feed = inject(FeedStore);
  readonly t = inject(I18n).t;
  readonly defs = MARKETS;
  readonly icon = EVENT_ICON;

  readonly match = computed(() => this.feed.byId().get(this.id()));
  readonly progress = computed(() => ((this.match()?.minute ?? 0) / 90) * 100);
  readonly startsIn = computed(() => {
    const m = this.match();
    return m ? countdown(m.kickoffAt - this.feed.now()) : '';
  });
  readonly events = computed(() => [...(this.match()?.events ?? [])].reverse());

  readonly stats = computed(() => {
    const s = this.match()?.stats;
    if (!s) return [];
    const row = (key: string, home: number, away: number, suffix = '') => ({
      label: this.t(key),
      home: `${home}${suffix}`,
      away: `${away}${suffix}`,
      share: home + away ? (home / (home + away)) * 100 : 50,
    });
    return [
      row('stats.possession', Math.round(s.possession), 100 - Math.round(s.possession), '%'),
      row('stats.shots', s.shots[0], s.shots[1]),
      row('stats.onTarget', s.onTarget[0], s.onTarget[1]),
      row('stats.corners', s.corners[0], s.corners[1]),
      row('stats.yellows', s.yellows[0], s.yellows[1]),
    ];
  });
}
