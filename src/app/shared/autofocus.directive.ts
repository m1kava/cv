import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Focuses the host as soon as it is rendered — for inputs that appear on demand. */
@Directive({ selector: '[appAutofocus]', standalone: true })
export class AutofocusDirective {
  constructor() {
    const el: HTMLElement = inject(ElementRef).nativeElement;
    afterNextRender(() => el.focus());
  }
}
