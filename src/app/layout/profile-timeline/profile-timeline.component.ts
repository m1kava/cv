import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'app-profile-timeline',
  standalone: true,
  imports: [],
  templateUrl: './profile-timeline.component.html',
  styleUrl: './profile-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileTimelineComponent {

}
