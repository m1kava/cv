import { DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { ScrollService, ScrollState } from './scroll.service';

/**
 * Moves an element vertically as the page scrolls, at a fraction of the scroll
 * speed, to build depth. `appParallax` is the strength: positive drifts the
 * element up as you scroll down, negative pushes it down. Disabled when the
 * user prefers reduced motion.
 */
@Directive({
  selector: '[appParallax]',
  standalone: true,
})
export class ParallaxDirective {
  readonly speed = input(0.15, {
    alias: 'appParallax',
    transform: (value: number | '') => Number(value) || 0.15,
  });

  private readonly el: HTMLElement = inject(ElementRef).nativeElement;
  private readonly scroll = inject(ScrollService);
  /** Last applied offset, subtracted back out so measurements stay stable. */
  private lastShift = 0;

  constructor() {
    if (this.scroll.reducedMotion) {
      return;
    }
    this.el.style.willChange = 'transform';
    const stop = this.scroll.register((state) => this.update(state));
    inject(DestroyRef).onDestroy(stop);
  }

  private update({ vh }: ScrollState): void {
    const rect = this.el.getBoundingClientRect();
    // getBoundingClientRect reflects the transform we applied last frame, so
    // subtract it back out to recover the element's true (untransformed) top —
    // otherwise the offset would feed back on itself and drift.
    const trueTop = rect.top - this.lastShift;
    const fromCenter = trueTop + rect.height / 2 - vh / 2;
    const shift = -fromCenter * this.speed();
    this.lastShift = shift;
    this.el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
  }
}
