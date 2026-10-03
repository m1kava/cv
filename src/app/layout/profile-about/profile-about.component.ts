import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { PROFILE } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SpotlightDirective } from '../../shared/spotlight.directive';
import { yearsSince } from '../../shared/date.utils';

@Component({
  selector: 'app-profile-about',
  standalone: true,
  imports: [IconComponent, RevealDirective, SpotlightDirective],
  templateUrl: './profile-about.component.html',
  styleUrl: './profile-about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAboutComponent {
  readonly profile = PROFILE;
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
