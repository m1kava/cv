import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AutofocusDirective } from '../../shared/autofocus.directive';
import { WorkPageComponent } from '../shell/work-page.component';
import { BoardStore, COLUMNS, ColumnId, Tag, Task } from './board.store';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [WorkPageComponent, AutofocusDirective],
  providers: [BoardStore],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class TaskBoardComponent {
  readonly store = inject(BoardStore);
  readonly columns = COLUMNS;
  readonly tags: Tag[] = ['feature', 'bug', 'chore'];

  readonly query = signal('');
  readonly tagFilter = signal<Tag | 'all'>('all');
  readonly dragging = signal<string | null>(null);
  readonly dropAt = signal<{ column: ColumnId; before: string | null } | null>(null);
  readonly editing = signal<string | null>(null);
  readonly addingTo = signal<ColumnId | null>(null);
  readonly newTag = signal<Tag>('feature');

  /** Tasks per column after search and tag filters. */
  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tag = this.tagFilter();
    const out = new Map<ColumnId, Task[]>();
    for (const [column, tasks] of this.store.byColumn()) {
      out.set(
        column,
        tasks.filter((t) => (tag === 'all' || t.tag === tag) && (!q || t.title.toLowerCase().includes(q))),
      );
    }
    return out;
  });

  readonly total = computed(() => this.store.tasks().length);
  readonly done = computed(() => this.store.byColumn().get('done')!.length);

  // ---- drag & drop (HTML5) -------------------------------------------

  onDragStart(event: DragEvent, task: Task): void {
    event.dataTransfer?.setData('text/plain', task.id);
    event.dataTransfer!.effectAllowed = 'move';
    this.dragging.set(task.id);
  }

  onDragOver(event: DragEvent, column: ColumnId, before: string | null): void {
    if (!this.dragging()) return;
    event.preventDefault();
    event.stopPropagation();
    const current = this.dropAt();
    if (current?.column !== column || current.before !== before) this.dropAt.set({ column, before });
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const id = this.dragging();
    const target = this.dropAt();
    if (id && target) this.store.move(id, target.column, target.before);
    this.onDragEnd();
  }

  onDragEnd(): void {
    this.dragging.set(null);
    this.dropAt.set(null);
  }

  // ---- editing --------------------------------------------------------

  submitNew(column: ColumnId, input: HTMLInputElement): void {
    this.store.add(column, input.value, this.newTag());
    input.value = '';
    input.focus();
  }

  finishEdit(task: Task, value: string): void {
    this.store.rename(task.id, value);
    this.editing.set(null);
  }

  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable]')) return;
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.store.undo();
    } else if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault();
      this.store.redo();
    }
  }

  readonly page = {
    title: 'Signal Task Board',
    description:
      'A Kanban board for a front-end team: drag cards between columns, edit them inline, filter by tag or text, and undo or redo any change. Everything is saved in your browser.',
    stack: ['Angular', 'Signals', 'TypeScript', 'HTML5 Drag & Drop', 'SCSS'],
    points: [
      'State is a single signal of immutable snapshots in a small store service; columns, filters and counters are computed signals.',
      'Undo / redo works by moving whole snapshots between a past and a future stack — every mutation goes through one commit() method.',
      'An effect persists the board to localStorage, with validation on load so a corrupt save falls back to the default board.',
      'Native HTML5 drag & drop with a live drop indicator, plus ← / → buttons so cards can be moved by keyboard or touch.',
      'Ctrl / ⌘ + Z and Ctrl / ⌘ + Shift + Z (or Y) shortcuts, ignored while you are typing. A WIP limit warns when “In progress” is overloaded.',
    ],
  };
}
