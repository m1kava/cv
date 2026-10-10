import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { ScrollService, ScrollState } from './scroll.service';

/**
 * Publishes an element's scroll position as CSS custom properties so stylesheets
 * can scrub animations against it — no per-component scroll code required.
 *
 *  --p   travel through the viewport: 0 as the element's top reaches the bottom
 *        edge, 1 as its bottom clears the top edge.
 *  --pc  the same, re-centred so the midpoint of the element sits at 0.5.
 *  --pin progress while a `position: sticky` child is pinned inside a tall
 *        section: 0 when the section's top hits the viewport top, 1 when its
 *        bottom does. This is what drives the horizontal "pinned" scenes.
 */
@Directive({
  selector: '[appScrollProgress]',
  standalone: true,
  host: { class: 'scroll-progress' },
})
export class ScrollProgressDirective {
  private readonly el: HTMLElement = inject(ElementRef).nativeElement;
  private readonly scroll = inject(ScrollService);

  constructor() {
    const stop = this.scroll.register((state) => this.update(state));
    inject(DestroyRef).onDestroy(stop);
  }

  private update({ vh }: ScrollState): void {
    const rect = this.el.getBoundingClientRect();
    const style = this.el.style;

    const travel = (vh - rect.top) / (vh + rect.height);
    style.setProperty('--p', clamp(travel).toFixed(4));

    const center = rect.top + rect.height / 2;
    style.setProperty('--pc', clamp((vh - center) / vh).toFixed(4));

    const pinnable = rect.height - vh;
    const pin = pinnable > 0 ? clamp(-rect.top / pinnable) : 0;
    style.setProperty('--pin', pin.toFixed(4));

    const inView = rect.top < vh && rect.bottom > 0;
    this.el.classList.toggle('in-view', inView);
  }
}

function clamp(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
