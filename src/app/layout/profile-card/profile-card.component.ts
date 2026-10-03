import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { PROFILE, SKILLS, SOCIAL_LINKS } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';

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
  /** Duplicated so the marquee can loop seamlessly. */
  readonly marquee = [...SKILLS, ...SKILLS];
  readonly typed = signal(PROFILE.taglines[0]);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      let timer: ReturnType<typeof setTimeout>;
      let phrase = 0;
      let length = this.typed().length;
      let deleting = true;

      const tick = (): void => {
        const text = PROFILE.taglines[phrase];
        length += deleting ? -1 : 1;
        this.typed.set(text.slice(0, length));

        let delay = deleting ? 40 : 85;
        if (!deleting && length === text.length) {
          deleting = true;
          delay = 2200;
        } else if (deleting && length === 0) {
          deleting = false;
          phrase = (phrase + 1) % PROFILE.taglines.length;
          delay = 300;
        }
        timer = setTimeout(tick, delay);
      };

      timer = setTimeout(tick, 2600);
      destroyRef.onDestroy(() => clearTimeout(timer));
    });
  }
}
