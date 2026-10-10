import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Gives an element a subtle 3D tilt that follows the pointer, plus a pointer
 * position (`--mx` / `--my`, 0→1) for any glare layer. The tilt eases back to
 * flat when the pointer leaves. Honours reduced-motion and coarse pointers.
 */
@Directive({
  selector: '[appTilt]',
  standalone: true,
  host: {
    class: 'tilt',
    '(pointermove)': 'onMove($event)',
    '(pointerleave)': 'onLeave()',
  },
})
export class TiltDirective {
  /** Maximum rotation in degrees at the corners. */
  readonly max = input(10, { alias: 'appTilt', transform: (v: number | '') => Number(v) || 10 });

  private readonly el: HTMLElement = inject(ElementRef).nativeElement;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private enabled = false;
  private frame = 0;

  constructor() {
    afterNextRender(() => {
      this.enabled =
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
        window.matchMedia('(hover: hover)').matches;
    });
    inject(DestroyRef).onDestroy(() => this.isBrowser && cancelAnimationFrame(this.frame));
  }

  onMove(event: PointerEvent): void {
    if (!this.enabled) {
      return;
    }
    const rect = this.el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const rx = (0.5 - py) * this.max() * 2;
      const ry = (px - 0.5) * this.max() * 2;
      this.el.style.setProperty('--mx', px.toFixed(3));
      this.el.style.setProperty('--my', py.toFixed(3));
      this.el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      this.el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      this.el.style.setProperty('--tilt', '1');
    });
  }

  onLeave(): void {
    if (!this.enabled) {
      return;
    }
    cancelAnimationFrame(this.frame);
    this.el.style.setProperty('--rx', '0deg');
    this.el.style.setProperty('--ry', '0deg');
    this.el.style.setProperty('--tilt', '0');
  }
}
