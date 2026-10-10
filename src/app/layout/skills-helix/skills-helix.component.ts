import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SKILLS } from '../../data/cv.data';
import { ScrollProgressDirective } from '../../shared/scroll-progress.directive';

const CORE = ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Signals'];

/**
 * The "stack" chapter. While it is pinned, the WebGL universe forms a DNA
 * double helix and the camera flies along it, with each skill label riding a
 * strand (see UniverseComponent). This component supplies the copy and an
 * accessible skill list that becomes the visible fallback without WebGL.
 */
@Component({
  selector: 'app-skills-helix',
  standalone: true,
  imports: [ScrollProgressDirective],
  templateUrl: './skills-helix.component.html',
  styleUrl: './skills-helix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsHelixComponent {
  readonly skills = SKILLS;
  readonly core = SKILLS.filter((skill) => CORE.includes(skill)).length;
}
