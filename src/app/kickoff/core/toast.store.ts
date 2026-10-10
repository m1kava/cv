import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'warn' | 'info';
}

/** Short-lived notifications (bet placed, cash-out, settlement…). */
@Injectable()
export class ToastStore {
  readonly toasts = signal<Toast[]>([]);
  private next = 1;

  show(text: string, kind: Toast['kind'] = 'info'): void {
    const id = this.next++;
    this.toasts.update((list) => [...list, { id, text, kind }].slice(-3));
    setTimeout(() => this.dismiss(id), 3800);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
