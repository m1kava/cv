import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CLIENT_PROJECTS, PROJECTS } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SpotlightDirective } from '../../shared/spotlight.directive';
import { WorkPreviewComponent } from '../../shared/work-preview/work-preview.component';

/** "Selected work": featured client work, then the live demo projects hosted on this site. */
@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, IconComponent, RevealDirective, SpotlightDirective, WorkPreviewComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  readonly clients = CLIENT_PROJECTS;
  readonly projects = PROJECTS;
}
