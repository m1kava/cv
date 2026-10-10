import { Injectable, computed, effect, signal } from '@angular/core';
import { load, save } from './storage';

export interface User {
  name: string;
  since: number;
}

/** Mock authentication: any username + 4-character password. Persisted locally. */
@Injectable()
export class AuthStore {
  readonly user = signal<User | null>(
    load<User | null>('user', null, (v) => v === null || (typeof v === 'object' && typeof (v as User).name === 'string')),
  );
  readonly loggedIn = computed(() => this.user() !== null);
  readonly initials = computed(() =>
    (this.user()?.name ?? '')
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );

  constructor() {
    effect(() => save('user', this.user()));
  }

  login(name: string, password: string): boolean {
    const clean = name.trim();
    if (!clean || password.length < 4) return false;
    this.user.set({ name: clean.slice(0, 24), since: Date.now() });
    return true;
  }

  loginDemo(): void {
    this.user.set({ name: 'Demo Player', since: Date.now() });
  }

  logout(): void {
    this.user.set(null);
  }
}
