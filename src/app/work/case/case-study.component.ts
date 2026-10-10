import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WORK } from '../../data/work.data';
import { IconComponent } from '../../shared/icon.component';
import { WorkPreviewComponent } from '../../shared/work-preview/work-preview.component';

/** Case study for a piece of client work, at /work/:slug. */
@Component({
  selector: 'app-case-study',
  standalone: true,
  imports: [RouterLink, IconComponent, WorkPreviewComponent],
  templateUrl: './case-study.component.html',
  styleUrl: './case-study.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseStudyComponent {
  /** Bound from the route parameter (withComponentInputBinding). */
  readonly slug = input.required<string>();

  readonly item = computed(() => WORK.find((w) => w.slug === this.slug()));

  /** Neighbouring projects, wrapping around, for the footer navigation. */
  readonly neighbours = computed(() => {
    const i = WORK.findIndex((w) => w.slug === this.slug());
    if (i === -1) return null;
    return { prev: WORK[(i - 1 + WORK.length) % WORK.length], next: WORK[(i + 1) % WORK.length] };
  });

  readonly facts = computed(() => {
    const w = this.item();
    if (!w) return [];
    return [
      { label: 'Role', value: w.role },
      { label: 'Period', value: w.period },
      { label: 'Type', value: w.type === 'client' ? 'Production website' : 'Interactive demo' },
      { label: 'Status', value: w.status },
    ].filter((f): f is { label: string; value: string } => !!f.value);
  });
}
