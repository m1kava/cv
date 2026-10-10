import { Injectable, computed, effect, signal } from '@angular/core';

export type ColumnId = 'backlog' | 'progress' | 'review' | 'done';
export type Tag = 'feature' | 'bug' | 'chore';

export interface Task {
  id: string;
  title: string;
  tag: Tag;
  column: ColumnId;
}

export const COLUMNS: { id: ColumnId; title: string; limit?: number }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'progress', title: 'In progress', limit: 3 },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

const STORAGE_KEY = 'vm-task-board-v1';
const HISTORY_LIMIT = 50;

const SEED: Task[] = [
  { id: 't1', title: 'Lazy-load the live casino lobby', tag: 'feature', column: 'progress' },
  { id: 't2', title: 'Odds flicker when the socket reconnects', tag: 'bug', column: 'progress' },
  { id: 't3', title: 'Migrate bet slip state to signals', tag: 'chore', column: 'review' },
  { id: 't4', title: 'Add Georgian translations for promo pages', tag: 'feature', column: 'backlog' },
  { id: 't5', title: 'Cash-out button ignores suspended markets', tag: 'bug', column: 'backlog' },
  { id: 't6', title: 'Upgrade to Angular 18', tag: 'chore', column: 'done' },
  { id: 't7', title: 'Virtual scroll for the results archive', tag: 'feature', column: 'done' },
  { id: 't8', title: 'Bundle budget check in CI', tag: 'chore', column: 'backlog' },
];

/**
 * Board state as a single signal of immutable snapshots. Every mutation goes
 * through `commit`, which pushes the previous snapshot onto an undo stack —
 * so undo/redo is just moving snapshots between two arrays. An effect
 * persists the board to localStorage.
 */
@Injectable()
export class BoardStore {
  readonly tasks = signal<Task[]>(load());
  private readonly past = signal<Task[][]>([]);
  private readonly future = signal<Task[][]>([]);

  readonly canUndo = computed(() => this.past().length > 0);
  readonly canRedo = computed(() => this.future().length > 0);

  readonly byColumn = computed(() => {
    const map = new Map<ColumnId, Task[]>(COLUMNS.map((c) => [c.id, []]));
    for (const task of this.tasks()) map.get(task.column)!.push(task);
    return map;
  });

  constructor() {
    effect(() => {
      const tasks = this.tasks();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch {
        // Private mode or storage disabled: the board still works, it just won't persist.
      }
    });
  }

  add(column: ColumnId, title: string, tag: Tag): void {
    const clean = title.trim();
    if (!clean) return;
    this.commit([...this.tasks(), { id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, title: clean, tag, column }]);
  }

  rename(id: string, title: string): void {
    const clean = title.trim();
    const task = this.tasks().find((t) => t.id === id);
    if (!task || !clean || task.title === clean) return;
    this.commit(this.tasks().map((t) => (t.id === id ? { ...t, title: clean } : t)));
  }

  remove(id: string): void {
    this.commit(this.tasks().filter((t) => t.id !== id));
  }

  /** Move a task into `column`, before `beforeId` (or to the end). */
  move(id: string, column: ColumnId, beforeId: string | null = null): void {
    const task = this.tasks().find((t) => t.id === id);
    if (!task || id === beforeId) return;
    const rest = this.tasks().filter((t) => t.id !== id);
    const moved = { ...task, column };
    const index = beforeId ? rest.findIndex((t) => t.id === beforeId) : -1;
    const next = index === -1 ? [...rest, moved] : [...rest.slice(0, index), moved, ...rest.slice(index)];
    if (sameOrder(next, this.tasks())) return;
    this.commit(next);
  }

  /** Keyboard-friendly move to the neighbouring column. */
  shift(id: string, step: -1 | 1): void {
    const task = this.tasks().find((t) => t.id === id);
    if (!task) return;
    const index = COLUMNS.findIndex((c) => c.id === task.column) + step;
    if (index >= 0 && index < COLUMNS.length) this.move(id, COLUMNS[index].id);
  }

  undo(): void {
    const past = this.past();
    if (!past.length) return;
    this.future.update((f) => [this.tasks(), ...f]);
    this.past.set(past.slice(0, -1));
    this.tasks.set(past[past.length - 1]);
  }

  redo(): void {
    const [next, ...rest] = this.future();
    if (!next) return;
    this.past.update((p) => [...p, this.tasks()]);
    this.future.set(rest);
    this.tasks.set(next);
  }

  reset(): void {
    this.commit(SEED);
  }

  private commit(next: Task[]): void {
    this.past.update((p) => [...p, this.tasks()].slice(-HISTORY_LIMIT));
    this.future.set([]);
    this.tasks.set(next);
  }
}

function sameOrder(a: Task[], b: Task[]): boolean {
  return a.length === b.length && a.every((t, i) => t.id === b[i].id && t.column === b[i].column);
}

function load(): Task[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(saved) && saved.every((t) => t && typeof t.id === 'string' && typeof t.title === 'string')) {
      return saved;
    }
  } catch {
    // Fall through to the seed board.
  }
  return SEED;
}
