import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { WorkPageComponent } from '../shell/work-page.component';
import { Candle, MINUTE, aggregate, generateHistory, sma } from './candles';

const UP = '#34d399';
const DOWN = '#f43f5e';
const AXIS_W = 70;
const TIME_H = 26;
/** Empty slots kept to the right of the newest candle. */
const RIGHT_PAD = 3;

@Component({
  selector: 'app-market-chart',
  standalone: true,
  imports: [DecimalPipe, WorkPageComponent],
  templateUrl: './market-chart.component.html',
  styleUrl: './market-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketChartComponent {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly timeframes = [
    { label: '1m', factor: 1 },
    { label: '5m', factor: 5 },
    { label: '15m', factor: 15 },
  ];

  /** Base 1-minute candles; the live feed mutates only the last one. */
  readonly base = signal<Candle[]>(generateHistory(900));
  readonly factor = signal(1);
  readonly visible = signal(90);
  /** How many candles we are scrolled back from the live edge. */
  readonly offset = signal(0);
  readonly hover = signal<{ index: number; y: number } | null>(null);
  readonly showSma20 = signal(true);
  readonly showSma50 = signal(true);
  readonly showVolume = signal(true);
  readonly live = signal(true);

  readonly candles = computed(() => aggregate(this.base(), this.factor()));
  readonly sma20 = computed(() => sma(this.candles(), 20));
  readonly sma50 = computed(() => sma(this.candles(), 50));

  readonly last = computed(() => this.candles()[this.candles().length - 1]);
  readonly change = computed(() => {
    const all = this.base();
    const dayAgo = all[Math.max(0, all.length - 1 - 24 * 60)] ?? all[0];
    return ((all[all.length - 1].c - dayAgo.o) / dayAgo.o) * 100;
  });
  /** Candle shown in the legend: the hovered one, or the latest. */
  readonly legend = computed(() => {
    const h = this.hover();
    return (h && this.candles()[h.index]) || this.last();
  });

  private ctx!: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private frame = 0;
  private drag: { x: number; offset: number } | null = null;
  private ticks = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Live feed: a price tick every 400 ms; a fresh 1m candle every 15 ticks.
    interval(400)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        if (!this.live()) return;
        this.ticks++;
        this.base.update((all) => {
          const next = all.slice();
          const lastCandle = { ...next[next.length - 1] };
          const price = lastCandle.c * (1 + (Math.random() - 0.495) * 0.003);
          lastCandle.c = price;
          lastCandle.h = Math.max(lastCandle.h, price);
          lastCandle.l = Math.min(lastCandle.l, price);
          lastCandle.v += Math.random() * 120;
          next[next.length - 1] = lastCandle;
          if (this.ticks % 15 === 0) {
            next.push({ t: lastCandle.t + MINUTE, o: price, h: price, l: price, c: price, v: 0 });
            if (next.length > 3000) next.shift();
          }
          return next;
        });
      });

    // Any state change schedules one redraw on the next animation frame.
    effect(() => {
      this.candles();
      this.visible();
      this.offset();
      this.hover();
      this.showSma20();
      this.showSma50();
      this.showVolume();
      this.requestDraw();
    });

    afterNextRender(() => {
      const canvas = this.canvasRef().nativeElement;
      this.ctx = canvas.getContext('2d')!;
      // Narrow screens start zoomed in so candles stay readable.
      if (canvas.clientWidth < 600) this.visible.set(40);
      const observer = new ResizeObserver(() => this.resize());
      observer.observe(canvas);
      // Wheel needs a non-passive listener so the page doesn't scroll while zooming.
      const onWheel = (e: WheelEvent) => this.onWheel(e);
      canvas.addEventListener('wheel', onWheel, { passive: false });
      destroyRef.onDestroy(() => {
        observer.disconnect();
        canvas.removeEventListener('wheel', onWheel);
        cancelAnimationFrame(this.frame);
      });
      this.resize();
    });
  }

  // ---- interaction ------------------------------------------------------

  setFactor(factor: number): void {
    this.factor.set(factor);
    this.offset.set(0);
    this.hover.set(null);
  }

  zoom(by: number): void {
    this.visible.update((v) => Math.round(Math.min(300, Math.max(20, v * by))));
    this.clampOffset();
  }

  pan(by: number): void {
    this.offset.update((o) => o + by);
    this.clampOffset();
  }

  goLive(): void {
    this.offset.set(0);
  }

  onPointerDown(e: PointerEvent): void {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.drag = { x: e.clientX, offset: this.offset() };
  }

  onPointerMove(e: PointerEvent): void {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (this.drag) {
      this.offset.set(this.drag.offset + (e.clientX - this.drag.x) / this.candleWidth());
      this.clampOffset();
    }
    const { start } = this.window();
    const index = Math.floor(start + x / this.candleWidth());
    if (x < this.plotWidth() && index >= 0 && index < this.candles().length) {
      this.hover.set({ index, y });
    } else {
      this.hover.set(null);
    }
  }

  onPointerUp(): void {
    this.drag = null;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      this.pan(e.deltaX / this.candleWidth());
    } else {
      this.zoom(e.deltaY > 0 ? 1.1 : 0.9);
    }
  }

  private clampOffset(): void {
    const max = Math.max(0, this.candles().length - this.visible() * 0.5);
    this.offset.update((o) => Math.min(max, Math.max(0, o)));
  }

  // ---- geometry ---------------------------------------------------------

  private plotWidth(): number {
    return this.width - AXIS_W;
  }

  private candleWidth(): number {
    return this.plotWidth() / this.visible();
  }

  /** Fractional candle index at the left edge, plus the visible slice. */
  private window(): { start: number; from: number; to: number } {
    const len = this.candles().length;
    const start = len + RIGHT_PAD - this.offset() - this.visible();
    return { start, from: Math.max(0, Math.floor(start)), to: Math.min(len, Math.ceil(start + this.visible())) };
  }

  // ---- rendering --------------------------------------------------------

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
    canvas.width = Math.round(this.width * dpr);
    canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.requestDraw();
  }

  private requestDraw(): void {
    if (!this.ctx || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.draw();
    });
  }

  private draw(): void {
    const { ctx, width, height } = this;
    const candles = this.candles();
    const { start, from, to } = this.window();
    const cw = this.candleWidth();
    const plotW = this.plotWidth();
    const volH = this.showVolume() ? (height - TIME_H) * 0.18 : 0;
    const priceH = height - TIME_H - volH - 8;
    const xOf = (i: number) => (i - start + 0.5) * cw;

    ctx.clearRect(0, 0, width, height);
    if (to <= from) return;

    // Price range of what's on screen, with a little headroom.
    let lo = Infinity;
    let hi = -Infinity;
    let maxVol = 0;
    for (let i = from; i < to; i++) {
      lo = Math.min(lo, candles[i].l);
      hi = Math.max(hi, candles[i].h);
      maxVol = Math.max(maxVol, candles[i].v);
    }
    const pad = (hi - lo) * 0.08 || 1;
    lo -= pad;
    hi += pad;
    const yOf = (p: number) => 8 + ((hi - p) / (hi - lo)) * priceH;

    // Grid + price axis
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    const step = niceStep((hi - lo) / 6);
    for (let p = Math.ceil(lo / step) * step; p <= hi; p += step) {
      const y = Math.round(yOf(p)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotW, y);
      ctx.stroke();
      ctx.fillStyle = '#646a80';
      ctx.fillText(p.toFixed(2), plotW + 8, y);
    }

    // Time axis
    const every = Math.max(1, Math.round(90 / cw));
    ctx.textAlign = 'center';
    for (let i = from; i < to; i++) {
      if (i % every) continue;
      const x = xOf(i);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, 8);
      ctx.lineTo(Math.round(x) + 0.5, height - TIME_H);
      ctx.stroke();
      ctx.fillStyle = '#646a80';
      ctx.fillText(formatTime(candles[i].t), x, height - TIME_H / 2);
    }
    ctx.textAlign = 'left';

    // Volume
    if (volH) {
      const base = height - TIME_H;
      for (let i = from; i < to; i++) {
        const c = candles[i];
        const h = (c.v / maxVol) * volH;
        ctx.fillStyle = c.c >= c.o ? 'rgba(52,211,153,0.25)' : 'rgba(244,63,94,0.25)';
        ctx.fillRect(xOf(i) - cw * 0.35, base - h, Math.max(1, cw * 0.7), h);
      }
    }

    // Candles
    for (let i = from; i < to; i++) {
      const c = candles[i];
      const x = Math.round(xOf(i)) + 0.5;
      const color = c.c >= c.o ? UP : DOWN;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, yOf(c.h));
      ctx.lineTo(x, yOf(c.l));
      ctx.stroke();
      const top = yOf(Math.max(c.o, c.c));
      const bodyH = Math.max(1, yOf(Math.min(c.o, c.c)) - top);
      ctx.fillRect(x - cw * 0.35, top, Math.max(1, cw * 0.7), bodyH);
    }

    // Moving averages
    const line = (values: (number | null)[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = from; i < to; i++) {
        const v = values[i];
        if (v == null) continue;
        if (started) ctx.lineTo(xOf(i), yOf(v));
        else ctx.moveTo(xOf(i), yOf(v));
        started = true;
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    };
    if (this.showSma20()) line(this.sma20(), '#22d3ee');
    if (this.showSma50()) line(this.sma50(), '#8b5cf6');

    // Last price line + tag
    const last = candles[candles.length - 1];
    const ly = yOf(last.c);
    if (ly > 0 && ly < priceH + 8) {
      const color = last.c >= last.o ? UP : DOWN;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(ly) + 0.5);
      ctx.lineTo(plotW, Math.round(ly) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      tag(ctx, last.c.toFixed(2), plotW, ly, color);
    }

    // Crosshair
    const hover = this.hover();
    if (hover && !this.drag) {
      const x = Math.round(xOf(hover.index)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x, height - TIME_H);
      if (hover.y < priceH + 8) {
        ctx.moveTo(0, Math.round(hover.y) + 0.5);
        ctx.lineTo(plotW, Math.round(hover.y) + 0.5);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (hover.y < priceH + 8) {
        const price = hi - ((hover.y - 8) / priceH) * (hi - lo);
        tag(ctx, price.toFixed(2), plotW, hover.y, '#8b5cf6');
      }
    }
  }

  readonly page = {
    title: 'Live Market Chart',
    description:
      'A real-time candlestick chart rendered from scratch on canvas: prices stream in live, and you can zoom, pan, switch timeframes and inspect any candle with the crosshair.',
    stack: ['Angular', 'Canvas 2D', 'Signals', 'RxJS', 'TypeScript'],
    points: [
      'No chart library — candles, volume, moving averages, axes and crosshair are drawn by hand on a DPR-aware canvas.',
      'Signals hold the data and the view (zoom, pan, hover); a single effect batches every change into one requestAnimationFrame redraw.',
      'Only the visible slice is drawn, so panning through ~900 candles stays smooth; timeframes are aggregated from 1-minute data with computed signals.',
      'Mouse wheel zooms, horizontal scroll or drag pans (pointer capture, so it works on touch too); wheel listener is non-passive to keep the page still.',
      'A ResizeObserver keeps the canvas crisp at any size; all listeners are cleaned up through DestroyRef.',
    ],
  };
}

function niceStep(raw: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

function formatTime(t: number): string {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y - 9, AXIS_W - 4, 18);
  ctx.fillStyle = '#05060a';
  ctx.fillText(text, x + 8, y);
}
