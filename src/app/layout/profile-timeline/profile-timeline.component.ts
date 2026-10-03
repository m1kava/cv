import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EXPERIENCE } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SpotlightDirective } from '../../shared/spotlight.directive';
import { formatDuration, formatMonth, monthsBetween } from '../../shared/date.utils';

@Component({
  selector: 'app-profile-timeline',
  standalone: true,
  imports: [IconComponent, RevealDirective, SpotlightDirective],
  templateUrl: './profile-timeline.component.html',
  styleUrl: './profile-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileTimelineComponent {
  readonly jobs = EXPERIENCE.map((job) => ({
    ...job,
    current: !job.end,
    period: `${formatMonth(job.start)} — ${job.end ? formatMonth(job.end) : 'Present'}`,
    duration: formatDuration(monthsBetween(job.start, job.end)),
  }));
}
