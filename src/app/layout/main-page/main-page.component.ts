import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../core/theme.service';
import { PROFILE, SOCIAL_LINKS } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { ProfileSkillsComponent } from '../profile-skills/profile-skills.component';
import { ProfileTimelineComponent } from '../profile-timeline/profile-timeline.component';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [IconComponent, ProfileCardComponent, ProfileTimelineComponent, ProfileSkillsComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  readonly theme = inject(ThemeService);
  readonly profile = PROFILE;
  readonly socialLinks = SOCIAL_LINKS;
  readonly year = new Date().getFullYear();

  readonly navItems = [
    { label: 'About', href: '#about' },
    { label: 'Experience', href: '#experience' },
    { label: 'Skills', href: '#skills' },
    { label: 'Contact', href: '#contact' },
  ];

  print(): void {
    window.print();
  }
}
