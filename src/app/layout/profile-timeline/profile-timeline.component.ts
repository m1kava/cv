import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EXPERIENCE } from '../../data/cv.data';
import { formatYear } from '../../shared/date.utils';

@Component({
  selector: 'app-profile-timeline',
  standalone: true,
  templateUrl: './profile-timeline.component.html',
  styleUrl: './profile-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileTimelineComponent {
  readonly jobs = EXPERIENCE.map((job) => {
    const start = formatYear(job.start);
    const end = job.end ? formatYear(job.end) : 'Now';
    return { ...job, period: start === end ? start : `${start} — ${end}` };
  });
}
