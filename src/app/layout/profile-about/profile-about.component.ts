import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { PROFILE } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { ScrollProgressDirective } from '../../shared/scroll-progress.directive';
import { yearsSince } from '../../shared/date.utils';

@Component({
  selector: 'app-profile-about',
  standalone: true,
  imports: [IconComponent, ScrollProgressDirective],
  templateUrl: './profile-about.component.html',
  styleUrl: './profile-about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * "About" as a pinned chapter: while the astronaut floats in the WebGL scene,
 * the story plays out in beats that cross-fade as you scroll.
 */
export class ProfileAboutComponent {
  readonly profile = PROFILE;
  /** One beat per paragraph, plus the stats beat. */
  readonly beats = Array.from({ length: PROFILE.about.length + 1 }, (_, i) => i);
  readonly angularYears = yearsSince(PROFILE.angularSince);
  readonly webYears = yearsSince(PROFILE.careerSince);
  readonly localTime = signal('');

  private readonly timeFormat = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: PROFILE.timeZone,
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const update = () => this.localTime.set(this.timeFormat.format(new Date()));
      update();
      const timer = setInterval(update, 15_000);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }
}
