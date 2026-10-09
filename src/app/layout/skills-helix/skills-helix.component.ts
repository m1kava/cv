import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SKILLS } from '../../data/cv.data';
import { RevealDirective } from '../../shared/reveal.directive';
import { ScrollProgressDirective } from '../../shared/scroll-progress.directive';

interface HelixNode {
  label: string;
  /** Angle around the vertical axis, in degrees. */
  angle: number;
  /** Vertical offset from the centre, in px. */
  y: number;
  core: boolean;
}

const CORE = new Set(['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Signals']);

/**
 * The tech stack as a rotating DNA-style helix. Each skill is a node spiralling
 * around a glowing central spine; the whole helix spins as the section is
 * pinned and scrolled, with a slow idle rotation on top.
 */
@Component({
  selector: 'app-skills-helix',
  standalone: true,
  imports: [RevealDirective, ScrollProgressDirective],
  templateUrl: './skills-helix.component.html',
  styleUrl: './skills-helix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsHelixComponent {
  private static readonly STEP_ANGLE = 55;
  private static readonly STEP_Y = 50;

  readonly nodes: HelixNode[] = SKILLS.map((label, i) => ({
    label,
    angle: i * SkillsHelixComponent.STEP_ANGLE,
    y: (i - (SKILLS.length - 1) / 2) * SkillsHelixComponent.STEP_Y,
    core: CORE.has(label),
  }));
}
