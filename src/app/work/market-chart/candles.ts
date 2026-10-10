export interface Candle {
  /** Open time, epoch ms. */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export const MINUTE = 60_000;

/** A believable price path: a random walk with slowly drifting volatility. */
export function generateHistory(count: number, start = 100): Candle[] {
  const out: Candle[] = [];
  const t0 = Math.floor(Date.now() / MINUTE) * MINUTE - count * MINUTE;
  let price = start;
  let vol = 0.004;
  for (let i = 0; i < count; i++) {
    vol = Math.min(0.012, Math.max(0.0015, vol * (1 + (Math.random() - 0.5) * 0.25)));
    const o = price;
    let h = o;
    let l = o;
    for (let k = 0; k < 8; k++) {
      price *= 1 + (Math.random() - 0.495) * vol;
      h = Math.max(h, price);
      l = Math.min(l, price);
    }
    out.push({ t: t0 + i * MINUTE, o, h, l, c: price, v: 400 + Math.random() * 1600 * (vol / 0.004) });
  }
  return out;
}

/** Merge consecutive candles into a larger timeframe (e.g. 5 × 1m → 5m). */
export function aggregate(candles: Candle[], factor: number): Candle[] {
  if (factor === 1) return candles;
  const out: Candle[] = [];
  for (const c of candles) {
    const bucket = Math.floor(c.t / (factor * MINUTE)) * factor * MINUTE;
    const last = out[out.length - 1];
    if (last && last.t === bucket) {
      last.h = Math.max(last.h, c.h);
      last.l = Math.min(last.l, c.l);
      last.c = c.c;
      last.v += c.v;
    } else {
      out.push({ ...c, t: bucket });
    }
  }
  return out;
}

/** Simple moving average of closes; `null` until there is enough data. */
export function sma(candles: Candle[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  candles.forEach((c, i) => {
    sum += c.c;
    if (i >= period) sum -= candles[i - period].c;
    out.push(i >= period - 1 ? sum / period : null);
  });
  return out;
}
