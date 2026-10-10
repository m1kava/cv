import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { ScrollService } from './scroll.service';

interface Star {
  x: number;
  y: number;
  z: number; // depth 0.2–1, drives size, speed and parallax
  tw: number; // twinkle phase
}

/**
 * A full-bleed starfield that drifts on its own and surges with scroll speed —
 * stars stretch into streaks when you fling the page, then settle. Nearby stars
 * link up into faint constellations. Pure canvas, fixed behind the content.
 */
@Component({
  selector: 'app-starfield',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
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
        opacity: 0.9;
      }
    `,
  ],
})
export class StarfieldComponent {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly scroll = inject(ScrollService);

  private ctx!: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private frame = 0;
  private drift = 0; // smoothed scroll velocity
  private lastY = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.scroll.reducedMotion) {
        return; // leave the static CSS backdrop to do the work
      }
      const canvas = this.canvasRef().nativeElement;
      this.ctx = canvas.getContext('2d')!;
      this.resize();
      window.addEventListener('resize', this.onResize, { passive: true });
      this.frame = requestAnimationFrame(this.render);

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(this.frame);
        window.removeEventListener('resize', this.onResize);
      });
    });
  }

  private readonly onResize = (): void => this.resize();

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = canvas.clientWidth;
    this.h = canvas.clientHeight;
    canvas.width = Math.floor(this.w * this.dpr);
    canvas.height = Math.floor(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const count = Math.round(Math.min(160, (this.w * this.h) / 9000));
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      z: 0.2 + Math.random() * 0.8,
      tw: Math.random() * Math.PI * 2,
    }));
  }

  private readonly render = (): void => {
    const ctx = this.ctx;
    // Derive velocity from scroll position each frame so it naturally decays to
    // zero the moment scrolling stops, then ease it into a smooth drift value.
    const y = this.scroll.state.y;
    const velocity = y - this.lastY;
    this.lastY = y;
    this.drift += (velocity - this.drift) * 0.12;
    const drift = this.drift;

    ctx.clearRect(0, 0, this.w, this.h);

    const near: Star[] = [];
    for (const s of this.stars) {
      // Depth-scaled parallax: closer stars (higher z) move more with scroll.
      s.y += (0.04 + drift * 0.06) * s.z;
      s.x += 0.02 * s.z;
      s.tw += 0.02;

      if (s.y > this.h + 4) s.y = -4;
      if (s.y < -4) s.y = this.h + 4;
      if (s.x > this.w + 4) s.x = -4;

      const size = s.z * 1.6;
      const twinkle = 0.55 + Math.sin(s.tw) * 0.25;
      const streak = Math.min(26, Math.abs(drift) * s.z * 0.9);

      ctx.globalAlpha = Math.min(1, 0.35 + s.z * 0.5) * twinkle;
      ctx.strokeStyle = '#8b9bff';
      ctx.fillStyle = '#cdd6ff';

      if (streak > 1.5) {
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y - Math.sign(drift) * streak);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (s.z > 0.75) near.push(s);
    }

    // Faint constellation links between the brightest, closest stars.
    ctx.lineWidth = 1;
    for (let i = 0; i < near.length; i++) {
      for (let j = i + 1; j < near.length; j++) {
        const dx = near[i].x - near[j].x;
        const dy = near[i].y - near[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          ctx.globalAlpha = (1 - dist / 130) * 0.12;
          ctx.strokeStyle = '#22d3ee';
          ctx.beginPath();
          ctx.moveTo(near[i].x, near[i].y);
          ctx.lineTo(near[j].x, near[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    this.frame = requestAnimationFrame(this.render);
  };
}
