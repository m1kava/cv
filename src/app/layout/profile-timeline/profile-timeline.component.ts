import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EXPERIENCE } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SpotlightDirective } from '../../shared/spotlight.directive';
import { ScrollProgressDirective } from '../../shared/scroll-progress.directive';
import { formatDuration, formatMonth, monthsBetween } from '../../shared/date.utils';

/**
 * Experience as a horizontally-scrolling rail: the section is pinned and the
 * cards slide sideways as you scroll down. Falls back to a vertical stack on
 * narrow screens and when reduced motion is requested.
 */
@Component({
  selector: 'app-profile-timeline',
  standalone: true,
  imports: [IconComponent, RevealDirective, SpotlightDirective, ScrollProgressDirective],
  templateUrl: './profile-timeline.component.html',
  styleUrl: './profile-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileTimelineComponent {
  readonly jobs = EXPERIENCE.map((job, i) => ({
    ...job,
    index: i + 1,
    current: !job.end,
    period: `${formatMonth(job.start)} — ${job.end ? formatMonth(job.end) : 'Present'}`,
    duration: formatDuration(monthsBetween(job.start, job.end)),
  }));

  readonly count = this.jobs.length;
}
