import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WORK, WORK_TECH, WorkItem, WorkType } from '../../data/work.data';
import { IconComponent } from '../../shared/icon.component';
import { SpotlightDirective } from '../../shared/spotlight.directive';
import { WorkPreviewComponent } from '../../shared/work-preview/work-preview.component';

type Sort = 'featured' | 'newest' | 'az';
type View = 'grid' | 'list';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'az', label: 'A – Z' },
];

/**
 * Every project in one place, with filters that live in the URL: type, tech
 * (AND), free-text search, sort and view are all query params, so any filtered
 * view can be shared or bookmarked and survives a reload.
 */
@Component({
  selector: 'app-work-index',
  standalone: true,
  imports: [RouterLink, IconComponent, SpotlightDirective, WorkPreviewComponent],
  templateUrl: './work-index.component.html',
  styleUrl: './work-index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class WorkIndexComponent {
  private readonly router = inject(Router);
  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');

  readonly allTech = WORK_TECH;
  readonly sorts = SORTS;
  readonly types: { id: WorkType | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'client', label: 'Client work' },
    { id: 'demo', label: 'Live demos' },
  ];

  readonly type = signal<WorkType | 'all'>('all');
  readonly tech = signal<string[]>([]);
  readonly query = signal('');
  readonly sort = signal<Sort>('featured');
  readonly view = signal<View>('grid');

  readonly stats = [
    { value: WORK.length, label: 'projects' },
    { value: WORK.filter((w) => w.type === 'client').length, label: 'live client sites' },
    { value: WORK.filter((w) => w.type === 'demo').length, label: 'interactive demos' },
    { value: WORK_TECH.length, label: 'technologies' },
  ];

  readonly counts = computed(() => {
    const base = this.matching({ ignoreType: true });
    return {
      all: base.length,
      client: base.filter((w) => w.type === 'client').length,
      demo: base.filter((w) => w.type === 'demo').length,
    } as Record<WorkType | 'all', number>;
  });

  readonly results = computed(() => {
    const items = this.matching({ ignoreType: false });
    switch (this.sort()) {
      case 'az':
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return [...items].sort((a, b) => (b.since ?? '').localeCompare(a.since ?? ''));
      default:
        return [...items].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
  });

  readonly filtered = computed(
    () => this.type() !== 'all' || this.tech().length > 0 || this.query().trim() !== '',
  );

  constructor() {
    // Restore filters from the URL once…
    const params = inject(ActivatedRoute).snapshot.queryParamMap;
    const type = params.get('type');
    if (type === 'client' || type === 'demo') this.type.set(type);
    this.tech.set(params.getAll('tech').filter((t) => WORK_TECH.includes(t)));
    this.query.set(params.get('q') ?? '');
    const sort = params.get('sort');
    if (SORTS.some((s) => s.id === sort)) this.sort.set(sort as Sort);
    if (params.get('view') === 'list') this.view.set('list');

    // …then keep the URL in sync without adding history entries.
    effect(() => {
      const queryParams = {
        type: this.type() === 'all' ? null : this.type(),
        tech: this.tech().length ? this.tech() : null,
        q: this.query().trim() || null,
        sort: this.sort() === 'featured' ? null : this.sort(),
        view: this.view() === 'grid' ? null : this.view(),
      };
      void this.router.navigate([], { queryParams, replaceUrl: true });
    });
  }

  toggleTech(tech: string): void {
    this.tech.update((list) => (list.includes(tech) ? list.filter((t) => t !== tech) : [...list, tech]));
  }

  clear(): void {
    this.type.set('all');
    this.tech.set([]);
    this.query.set('');
  }

  /** Press "/" anywhere to jump to search. */
  onKey(event: KeyboardEvent): void {
    if (event.key !== '/' || (event.target as HTMLElement).closest('input, textarea')) return;
    event.preventDefault();
    this.search()?.nativeElement.focus();
  }

  private matching({ ignoreType }: { ignoreType: boolean }): WorkItem[] {
    const q = this.query().trim().toLowerCase();
    const tech = this.tech();
    const type = this.type();
    return WORK.filter(
      (w) =>
        (ignoreType || type === 'all' || w.type === type) &&
        tech.every((t) => w.tech.includes(t)) &&
        (!q || [w.name, w.summary, w.role, ...w.tech].join(' ').toLowerCase().includes(q)),
    );
  }
}
