/**
 * Particle "formations" the universe morphs between. Each builder returns a
 * flat xyz array of `n` points plus a per-point colour tone (0 = cyan,
 * 0.5 = violet, 1 = pink, negative = towards white).
 */
export interface Formation {
  positions: Float32Array;
  tones: Float32Array;
}

/** Scene order — the `data-scene` index of each page chapter maps onto this. */
export const enum Shape {
  Galaxy = 0,
  Astronaut = 1,
  Dna = 2,
  Tunnel = 3,
  Planet = 4,
}

export const DNA = { height: 12, radius: 1.25, turns: 4 } as const;
export const TUNNEL_LENGTH = 68;

const TAU = Math.PI * 2;

function gauss(): number {
  // Box–Muller: soft, natural-looking scatter.
  return Math.sqrt(-2 * Math.log(Math.random() || 1e-6)) * Math.cos(TAU * Math.random());
}

function formation(n: number): Formation {
  return { positions: new Float32Array(n * 3), tones: new Float32Array(n) };
}

/** A three-armed spiral galaxy with a hot core. */
export function galaxy(n: number): Formation {
  const f = formation(n);
  const arms = 3;
  const radius = 6.5;
  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number, tone: number;
    if (i % 7 === 0) {
      // Bulge
      x = gauss() * 0.55;
      y = gauss() * 0.3;
      z = gauss() * 0.55;
      tone = 0.85 + Math.random() * 0.15;
    } else {
      const r = Math.pow(Math.random(), 0.7) * radius;
      const falloff = 1 - r / (radius + 1);
      const angle = ((i % arms) / arms) * TAU + r * 0.95 + gauss() * 0.28 * falloff;
      x = Math.cos(angle) * r + gauss() * 0.22 * falloff;
      z = Math.sin(angle) * r + gauss() * 0.22 * falloff;
      y = gauss() * 0.18 * falloff;
      tone = Math.max(0, 1 - r / radius + (Math.random() - 0.5) * 0.25);
    }
    f.positions.set([x, y, z], i * 3);
    f.tones[i] = tone;
  }
  return f;
}

/**
 * The astronaut, decoded from the pre-baked surface samples (see
 * public/models/astronaut.bin): uint32 count, int16 xyz, uint8 brightness.
 */
export function astronaut(n: number, data: ArrayBuffer | null): Formation {
  const f = formation(n);
  if (!data) {
    return planet(n, 1.6); // graceful fallback if the model failed to load
  }
  const view = new DataView(data);
  const count = view.getUint32(0, true);
  const xyz = new Int16Array(data, 4, count * 3);
  const lum = new Uint8Array(data, 4 + count * 6, count);
  const scale = 2.15 / 32767;
  for (let i = 0; i < n; i++) {
    const j = Math.floor((i / n) * count);
    f.positions.set([xyz[j * 3] * scale, xyz[j * 3 + 1] * scale, xyz[j * 3 + 2] * scale], i * 3);
    // Dark texels are the visor → glow pink; the suit reads as icy white.
    f.tones[i] = lum[j] < 60 ? 0.82 + Math.random() * 0.18 : -0.05 - (lum[j] / 255) * 0.5;
  }
  return f;
}

/** Local (unrotated) position of a point on strand A at height fraction `s`. */
export function dnaStrandPoint(s: number, outward = 1): [number, number, number] {
  const angle = s * DNA.turns * TAU;
  const r = DNA.radius * outward;
  return [Math.cos(angle) * r, -DNA.height / 2 + s * DNA.height, Math.sin(angle) * r];
}

/** A double helix: two strands joined by base-pair rungs, plus a little dust. */
export function dna(n: number): Formation {
  const f = formation(n);
  const rungs = 52;
  for (let i = 0; i < n; i++) {
    const roll = Math.random();
    let p: [number, number, number];
    let tone: number;
    if (roll < 0.66) {
      const strandB = roll < 0.33;
      const s = Math.random();
      p = dnaStrandPoint(s);
      if (strandB) {
        p = [-p[0], p[1], -p[2]];
      }
      p = [p[0] + gauss() * 0.07, p[1] + gauss() * 0.07, p[2] + gauss() * 0.07];
      tone = strandB ? 0.92 + Math.random() * 0.08 : Math.random() * 0.08;
    } else if (roll < 0.96) {
      const s = (Math.floor(Math.random() * rungs) + 0.5) / rungs;
      const a = dnaStrandPoint(s);
      const u = Math.random();
      p = [a[0] * (1 - 2 * u) + gauss() * 0.035, a[1] + gauss() * 0.035, a[2] * (1 - 2 * u) + gauss() * 0.035];
      tone = 0.05 + u * 0.9;
    } else {
      p = [gauss() * 2.5, (Math.random() - 0.5) * DNA.height * 1.2, gauss() * 2.5];
      tone = Math.random();
    }
    f.positions.set(p, i * 3);
    f.tones[i] = tone;
  }
  return f;
}

/** A hyperspace tunnel along -z. The shader scrolls z to make it rush past. */
export function tunnel(n: number): Formation {
  const f = formation(n);
  for (let i = 0; i < n; i++) {
    const r = 2.4 + Math.pow(Math.random(), 1.8) * 4.5;
    const theta = Math.random() * TAU;
    f.positions.set([Math.cos(theta) * r, Math.sin(theta) * r, Math.random() * TUNNEL_LENGTH], i * 3);
    f.tones[i] = Math.random();
  }
  return f;
}

/** A banded gas giant with a tilted ring system. */
export function planet(n: number, size = 2): Formation {
  const f = formation(n);
  const tiltX = 0.42;
  const tiltZ = 0.18;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const sphereCount = Math.floor(n * 0.58);
  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number, tone: number;
    if (i < sphereCount) {
      const yy = 1 - (i / (sphereCount - 1)) * 2;
      const r = Math.sqrt(1 - yy * yy);
      const theta = golden * i;
      const shell = size * (1 + gauss() * 0.012);
      x = Math.cos(theta) * r * shell;
      y = yy * shell;
      z = Math.sin(theta) * r * shell;
      tone = 0.45 + Math.sin(yy * 11 + Math.sin(theta * 2) * 0.4) * 0.3;
    } else {
      const band = Math.random();
      const r = size * (1.45 + band * 0.95 + (band > 0.55 && band < 0.6 ? 0.08 : 0));
      const theta = Math.random() * TAU;
      x = Math.cos(theta) * r;
      y = gauss() * 0.025;
      z = Math.sin(theta) * r;
      tone = band * 0.35;
    }
    // Tilt the whole system so the ring reads as an ellipse.
    const y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
    const z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
    const x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
    const y2 = x * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);
    f.positions.set([x2, y2, z1], i * 3);
    f.tones[i] = tone;
  }
  return f;
}

/** Far-away background stars on a big shell, for parallax depth. */
export function starShell(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * TAU;
    const r = 35 + Math.random() * 45;
    const s = Math.sqrt(1 - u * u);
    out.set([Math.cos(theta) * s * r, u * r, Math.sin(theta) * s * r], i * 3);
  }
  return out;
}
