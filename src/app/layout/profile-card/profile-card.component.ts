import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EXPERIENCE, PROFILE, SOCIAL_LINKS } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { yearsSince } from '../../shared/date.utils';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  readonly profile = PROFILE;
  readonly socialLinks = SOCIAL_LINKS;
  readonly currentRole = EXPERIENCE[0];

  readonly stats = [
    { value: `${yearsSince(PROFILE.angularSince)}+`, label: 'Years with Angular' },
    { value: `${yearsSince(PROFILE.careerSince)}+`, label: 'Years in web development' },
    { value: `${EXPERIENCE.length}`, label: 'Companies & teams' },
  ];

  print(): void {
    window.print();
  }
}
