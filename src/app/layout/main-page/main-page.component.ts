import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject } from '@angular/core';
import { PROFILE, SOCIAL_LINKS } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SpotlightDirective } from '../../shared/spotlight.directive';
import { startSmoothScroll } from '../../shared/smooth-scroll';
import { UniverseComponent } from '../../scene/universe.component';
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
    UniverseComponent,
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

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const stop = startSmoothScroll();
      destroyRef.onDestroy(() => stop?.());
    });
  }
}
