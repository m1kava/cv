import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PROFILE, SOCIAL_LINKS } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SpotlightDirective } from '../../shared/spotlight.directive';
import { StarfieldComponent } from '../../shared/starfield.component';
import { ProfileAboutComponent } from '../profile-about/profile-about.component';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { ProfileTimelineComponent } from '../profile-timeline/profile-timeline.component';
import { SkillsHelixComponent } from '../skills-helix/skills-helix.component';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    IconComponent,
    RevealDirective,
    SpotlightDirective,
    StarfieldComponent,
    ProfileCardComponent,
    ProfileAboutComponent,
    ProfileTimelineComponent,
    SkillsHelixComponent,
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  readonly profile = PROFILE;
  readonly socialLinks = SOCIAL_LINKS;
  readonly year = new Date().getFullYear();

  readonly navItems = [
    { label: 'About', href: '#about' },
    { label: 'Stack', href: '#skills' },
    { label: 'Experience', href: '#experience' },
    { label: 'Contact', href: '#contact' },
  ];
}
