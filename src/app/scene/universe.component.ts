import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { SKILLS } from '../data/cv.data';
import { StarfieldComponent } from '../shared/starfield.component';
import type { Universe } from './universe';

/**
 * Hosts the full-screen WebGL universe behind the page. Three.js is loaded
 * lazily after first render so it never blocks the initial paint; without
 * WebGL, or when reduced motion is requested, it falls back to the light 2D
 * starfield.
 */
@Component({
  selector: 'app-universe',
  standalone: true,
  imports: [StarfieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (fallback()) {
      <app-starfield />
    } @else {
      <canvas #canvas aria-hidden="true" [class.is-ready]="ready()"></canvas>
      <div class="labels" aria-hidden="true">
        @for (skill of skills; track skill) {
          <span #label class="label"><i></i>{{ skill }}</span>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 1.4s ease;
      }
      canvas.is-ready {
        opacity: 1;
      }
      .label {
        position: absolute;
        top: 0;
        left: 0;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px 6px 8px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background: rgba(8, 9, 16, 0.55);
        backdrop-filter: blur(6px);
        color: #f5f6fa;
        font: 500 13px/1 var(--font-mono);
        white-space: nowrap;
        opacity: 0;
        will-change: transform, opacity;
        /* Anchor the dot (not the pill's corner) on the strand. */
        translate: -9px -50%;

        i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--cyan);
          box-shadow: 0 0 10px var(--cyan), 0 0 22px var(--violet);
        }
      }
    `,
  ],
})
export class UniverseComponent {
  readonly skills = SKILLS;
  readonly fallback = signal(false);
  readonly ready = signal(false);

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly labels = viewChildren<ElementRef<HTMLElement>>('label');

  constructor() {
    const destroyRef = inject(DestroyRef);
    let universe: Universe | undefined;
    let destroyed = false;
    destroyRef.onDestroy(() => {
      destroyed = true;
      universe?.dispose();
    });

    afterNextRender(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !supportsWebGL2()) {
        this.useFallback();
        return;
      }
      import('./universe')
        .then(({ Universe }) => {
          const canvas = this.canvas()?.nativeElement;
          if (destroyed || !canvas) {
            return;
          }
          const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).sort(
            (a, b) => Number(a.dataset['scene']) - Number(b.dataset['scene']),
          );
          universe = new Universe({
            canvas,
            chapters,
            labels: this.labels().map((l) => l.nativeElement),
            astronautUrl: 'models/astronaut.bin',
            mobile: window.matchMedia('(max-width: 760px), (pointer: coarse)').matches,
          });
          universe.start();
          document.documentElement.classList.add('webgl');
          this.ready.set(true);
        })
        .catch(() => this.useFallback());
    });
  }

  /** Swap to the 2D starfield and let chapters switch to their flat layouts. */
  private useFallback(): void {
    document.documentElement.classList.add('no-webgl');
    this.fallback.set(true);
  }
}

function supportsWebGL2(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
