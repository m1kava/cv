import Lenis from 'lenis';

/**
 * Inertia-smoothed scrolling (Lenis). It still drives the native scroll
 * position, so `position: sticky`, anchors and every scroll listener keep
 * working — the page just glides. Returns a teardown function, or nothing when
 * the user prefers reduced motion.
 */
export function startSmoothScroll(): (() => void) | undefined {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return undefined;
  }
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: { offset: -80 } });
  let frame = requestAnimationFrame(function raf(time: number) {
    lenis.raf(time);
    frame = requestAnimationFrame(raf);
  });
  return () => {
    cancelAnimationFrame(frame);
    lenis.destroy();
  };
}
