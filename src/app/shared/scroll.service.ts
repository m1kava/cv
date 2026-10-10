import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ScrollState {
  /** Current vertical scroll offset in px. */
  y: number;
  /** Viewport height in px. */
  vh: number;
  /** Signed scroll delta since the previous frame (px). */
  velocity: number;
  /** Whole-page scroll progress, 0 (top) → 1 (bottom). */
  progress: number;
}

/**
 * A single, SSR-safe scroll loop shared by every scroll-driven effect on the
 * page. Instead of each directive attaching its own listener, they register a
 * callback here; we read layout once per animation frame and fan the state out.
 */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly subscribers = new Set<(state: ScrollState) => void>();

  private frame = 0;
  private running = false;
  private lastY = 0;

  /** Latest frame's state — readable by continuous animations (e.g. canvas). */
  readonly state: ScrollState = { y: 0, vh: 0, velocity: 0, progress: 0 };

  readonly reducedMotion =
    this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Register a per-frame callback. Returns an unsubscribe function. */
  register(callback: (state: ScrollState) => void): () => void {
    this.subscribers.add(callback);
    this.start();
    if (this.isBrowser) {
      this.measure();
      callback(this.state);
    }
    return () => {
      this.subscribers.delete(callback);
      if (!this.subscribers.size) {
        this.stop();
      }
    };
  }

  private start(): void {
    if (!this.isBrowser || this.running) {
      return;
    }
    this.running = true;
    this.lastY = window.scrollY;
    window.addEventListener('scroll', this.onChange, { passive: true });
    window.addEventListener('resize', this.onChange, { passive: true });
    this.schedule();
  }

  private stop(): void {
    if (!this.isBrowser || !this.running) {
      return;
    }
    this.running = false;
    window.removeEventListener('scroll', this.onChange);
    window.removeEventListener('resize', this.onChange);
    cancelAnimationFrame(this.frame);
  }

  private readonly onChange = (): void => this.schedule();

  private schedule(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = (): void => {
    this.measure();
    for (const callback of this.subscribers) {
      callback(this.state);
    }
  };

  private measure(): void {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    this.state.velocity = y - this.lastY;
    this.state.y = y;
    this.state.vh = vh;
    this.state.progress = Math.min(1, Math.max(0, y / max));
    this.lastY = y;
    document.documentElement.style.setProperty('--scroll', this.state.progress.toFixed(4));
  }
}
