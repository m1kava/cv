import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CLIENT_PROJECTS, PROJECTS } from '../../data/cv.data';
import { IconComponent } from '../../shared/icon.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SpotlightDirective } from '../../shared/spotlight.directive';

/** "Selected work": featured client work, then the live demo projects hosted on this site. */
@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, IconComponent, RevealDirective, SpotlightDirective],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  readonly clients = CLIENT_PROJECTS;
  readonly projects = PROJECTS;
  /** Fixed pseudo-random candle heights for the chart preview. */
  readonly bars = [38, 52, 44, 60, 56, 72, 64, 80, 70, 88, 76, 92];
}
