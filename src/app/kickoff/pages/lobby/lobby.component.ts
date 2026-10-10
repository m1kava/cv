import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FeedStore, LEAGUE_NAMES } from '../../core/feed.store';
import { I18n } from '../../core/i18n';
import { Match } from '../../core/models';
import { MatchRowComponent } from '../../shared/match-row.component';

@Component({
  selector: 'ko-lobby',
  standalone: true,
  imports: [MatchRowComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobbyComponent {
  readonly feed = inject(FeedStore);
  readonly t = inject(I18n).t;

  readonly league = signal<string>('all');
  readonly query = signal('');

  readonly leagues = computed(() => {
    const active = this.feed.matches().filter((m) => m.status !== 'finished');
    return LEAGUE_NAMES.map((name) => ({ name, count: active.filter((m) => m.league === name).length }));
  });

  private readonly visible = (list: Match[]) => {
    const q = this.query().trim().toLowerCase();
    const league = this.league();
    return list.filter(
      (m) =>
        (league === 'all' || m.league === league) &&
        (!q || `${m.home} ${m.away} ${m.league}`.toLowerCase().includes(q)),
    );
  };

  readonly sections = computed(() =>
    [
      { id: 'live', title: this.t('lobby.live'), matches: this.visible(this.feed.live()) },
      { id: 'upcoming', title: this.t('lobby.upcoming'), matches: this.visible(this.feed.upcoming()) },
      { id: 'finished', title: this.t('lobby.finished'), matches: this.visible(this.feed.finished()) },
    ].filter((s) => s.matches.length),
  );
}
