import { Directive, ElementRef, inject } from '@angular/core';

/** Exposes the pointer position as `--x` / `--y` so CSS can draw a glow that follows the cursor. */
@Directive({
  selector: '[appSpotlight]',
  standalone: true,
  host: { class: 'spotlight', '(pointermove)': 'onMove($event)' },
})
export class SpotlightDirective {
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;

  onMove(event: PointerEvent): void {
    const rect = this.element.getBoundingClientRect();
    this.element.style.setProperty('--x', `${event.clientX - rect.left}px`);
    this.element.style.setProperty('--y', `${event.clientY - rect.top}px`);
  }
}
