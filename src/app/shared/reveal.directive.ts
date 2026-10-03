import { DestroyRef, Directive, ElementRef, PLATFORM_ID, afterNextRender, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Fades/slides an element in the first time it scrolls into view. */
@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: { class: 'reveal', '[style.--reveal-delay]': 'delay() + "ms"' },
})
export class RevealDirective {
  readonly delay = input(0, { alias: 'appReveal', transform: (value: number | '') => Number(value) || 0 });

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    afterNextRender(() => {
      if (!isBrowser || !('IntersectionObserver' in window)) {
        element.classList.add('is-visible');
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            element.classList.add('is-visible');
            observer.disconnect();
          }
        },
        { threshold: 0.12 },
      );
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
