import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SKILL_GROUPS } from '../../data/cv.data';

@Component({
  selector: 'app-profile-skills',
  standalone: true,
  templateUrl: './profile-skills.component.html',
  styleUrl: './profile-skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSkillsComponent {
  readonly groups = SKILL_GROUPS;
}
