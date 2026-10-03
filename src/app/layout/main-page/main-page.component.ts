import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PROFILE, SKILLS, SOCIAL_LINKS } from '../../data/cv.data';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { ProfileTimelineComponent } from '../profile-timeline/profile-timeline.component';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [ProfileCardComponent, ProfileTimelineComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  readonly profile = PROFILE;
  readonly skills = SKILLS;
  readonly telegram = SOCIAL_LINKS.find((link) => link.icon === 'telegram');
  readonly year = new Date().getFullYear();
}
