import * as THREE from 'three';
import {
  DNA,
  Shape,
  TUNNEL_LENGTH,
  astronaut,
  dna,
  dnaStrandPoint,
  galaxy,
  planet,
  starShell,
  tunnel,
} from './shapes';

export interface UniverseOptions {
  canvas: HTMLCanvasElement;
  /** Page chapters in scene order (galaxy, astronaut, dna, tunnel, planet). */
  chapters: HTMLElement[];
  /** Skill labels pinned to the DNA strands. */
  labels: HTMLElement[];
  astronautUrl: string;
  mobile: boolean;
}

interface Rig {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  /** How far right (world units) the subject sits, leaving the left for copy. */
  shift: number;
}

const SHAPES = 5;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScatter;
  uniform float uAstroRot;
  uniform float uDnaRot;
  uniform float uTunnelTravel;
  uniform float uPlanetRot;
  uniform float uWarp;
  uniform float uAspect;

  attribute vec3 aAstro;
  attribute vec3 aDna;
  attribute vec3 aTunnel;
  attribute vec3 aPlanet;
  attribute vec4 aRand;
  attribute vec4 aTone;

  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vDir;
  varying float vStretch;

  // Per-formation point size and brightness (galaxy, astronaut, dna, tunnel, planet).
  float sizeAt(int i) { return i == 3 ? 1.9 : i == 4 ? 1.15 : 1.0; }
  float glowAt(int i) { return i == 0 ? 1.35 : i == 1 ? 0.9 : i == 3 ? 1.7 : i == 4 ? 1.4 : 1.0; }

  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  vec3 galaxy() {
    vec3 p = position;
    float r = length(p.xz);
    p.xz = rot(uTime * 0.14 / (r * 0.35 + 0.6)) * p.xz; // differential rotation
    return p;
  }
  vec3 astro() {
    vec3 p = aAstro;
    p.xz = rot(uAstroRot) * p.xz;
    p.y += sin(uTime * 0.7) * 0.08;
    return p;
  }
  vec3 dnaShape() { vec3 p = aDna; p.xz = rot(uDnaRot) * p.xz; return p; }
  vec3 tunnelShape() {
    vec3 p = aTunnel;
    p.z = mod(p.z + uTunnelTravel, ${TUNNEL_LENGTH.toFixed(1)}) - ${(TUNNEL_LENGTH - 8).toFixed(1)};
    p.xy = rot(uTime * 0.06 + p.z * 0.025) * p.xy;
    return p;
  }
  vec3 planetShape() { vec3 p = aPlanet; p.xz = rot(uPlanetRot) * p.xz; return p; }

  vec3 shapeAt(int i) {
    if (i == 0) return galaxy();
    if (i == 1) return astro();
    if (i == 2) return dnaShape();
    if (i == 3) return tunnelShape();
    return planetShape();
  }
  float toneAt(int i) {
    if (i == 0) return aTone.x;
    if (i == 1) return aTone.y;
    if (i == 2) return aTone.z;
    if (i == 3) return aRand.w;
    return aTone.w;
  }

  vec3 palette(float t) {
    vec3 cyan = vec3(0.133, 0.827, 0.933);
    vec3 violet = vec3(0.545, 0.361, 0.965);
    vec3 pink = vec3(0.957, 0.247, 0.557);
    if (t < 0.0) return mix(cyan, vec3(1.0), clamp(-t, 0.0, 1.0));
    return t < 0.5 ? mix(cyan, violet, t * 2.0) : mix(violet, pink, t * 2.0 - 1.0);
  }

  void main() {
    float m = clamp(uMorph, 0.0, ${(SHAPES - 1).toFixed(1)});
    int i = min(int(floor(m)), ${SHAPES - 2});
    float t = m - float(i);
    // Each particle departs at its own moment, so formations dissolve and re-form organically.
    float tt = smoothstep(0.0, 1.0, clamp((t - aRand.x * 0.45) / 0.55, 0.0, 1.0));

    vec3 p = mix(shapeAt(i), shapeAt(i + 1), tt);
    p += (aRand.yzw - 0.5) * sin(tt * 3.14159) * uScatter;
    p += 0.018 * vec3(sin(uTime * 1.3 + aRand.x * 40.0), cos(uTime * 1.1 + aRand.y * 40.0), sin(uTime * 0.9 + aRand.z * 40.0));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // Hyperspace: while the tunnel is showing, stretch each point into a streak
    // radiating from the centre of the screen, longer the faster you scroll.
    float tunnelW = i == 2 ? tt : i == 3 ? 1.0 - tt : 0.0;
    vStretch = 1.0 + tunnelW * min(uWarp, 5.0);
    vec2 ndc = gl_Position.xy / gl_Position.w;
    vDir = normalize(vec2(ndc.x * uAspect, -ndc.y) + 1e-5);

    float size = mix(sizeAt(i), sizeAt(i + 1), tt);
    gl_PointSize = uSize * size * (0.35 + aRand.w * 0.9) * uPixelRatio / -mv.z * vStretch;

    vColor = palette(mix(toneAt(i), toneAt(i + 1), tt));
    vAlpha = (0.55 + 0.45 * aRand.z) * mix(glowAt(i), glowAt(i + 1), tt) * smoothstep(0.3, 1.8, -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vDir;
  varying float vStretch;
  void main() {
    // Built-in glow instead of a bloom pass: a white-hot core plus a soft halo.
    // Squash across the streak direction so stretched points become thin trails.
    vec2 o = (gl_PointCoord - 0.5) * 2.0;
    float d = length(vec2(dot(o, vDir), dot(o, vec2(-vDir.y, vDir.x)) * vStretch));
    if (d > 1.0) discard;
    float core = pow(1.0 - d, 4.0);
    float halo = exp(-d * d * 5.0) * 0.32;
    vec3 c = mix(vColor, vec3(1.0), core * 0.45);
    gl_FragColor = vec4(c, (core + halo) * vAlpha * uOpacity);
  }
`;

const smooth = (t: number): number => t * t * (3 - 2 * t);
const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/**
 * The WebGL backdrop for the whole page: one particle cloud that morphs from
 * formation to formation as the visitor scrolls through each chapter, with a
 * camera that is choreographed per chapter and blended between them.
 */
export class Universe {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  private readonly material: THREE.ShaderMaterial;
  private readonly geometry = new THREE.BufferGeometry();
  private readonly disposables: { dispose(): void }[] = [];

  private readonly camPos = new THREE.Vector3(0, 2.4, 10);
  private readonly camTarget = new THREE.Vector3(0, -0.4, 0);
  private readonly mouse = new THREE.Vector2();
  private readonly mouseDamped = new THREE.Vector2();
  private readonly labelAnchors: [number, number, number][];
  private readonly tmp = new THREE.Vector3();

  private frame = 0;
  private last = 0;
  private time = 0;
  private morph = 0;
  private dnaSpin = 0;
  private travel = 0;
  private lastScroll = 0;
  private speed = 0;
  private width = 1;
  private height = 1;

  constructor(private readonly opts: UniverseOptions) {
    const { canvas, mobile } = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6));
    this.renderer.setClearColor(0x05060a, 1);

    const count = mobile ? 11000 : 24000;
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uSize: { value: mobile ? 44 : 36 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uScatter: { value: 2.6 },
        uAstroRot: { value: 0 },
        uDnaRot: { value: 0 },
        uTunnelTravel: { value: 0 },
        uPlanetRot: { value: 0 },
        uWarp: { value: 1 },
        uAspect: { value: 1 },
        uOpacity: { value: mobile ? 0.7 : 0.55 },
      },
    });
    this.buildParticles(count, null);
    const points = new THREE.Points(this.geometry, this.material);
    points.frustumCulled = false;
    this.scene.add(points);
    this.scene.add(this.buildStars(mobile ? 900 : 2200));
    this.buildNebulae();

    this.labelAnchors = opts.labels.map((_, i, all) => dnaStrandPoint(0.08 + (i / Math.max(1, all.length - 1)) * 0.84, 1.08));

    this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('pointermove', this.onPointer, { passive: true });

    // The astronaut arrives a beat later; swap it in when it does.
    fetch(opts.astronautUrl)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null)
      .then((data) => {
        const astro = astronaut(count, data);
        this.geometry.setAttribute('aAstro', new THREE.BufferAttribute(astro.positions, 3));
        const tone = this.geometry.getAttribute('aTone') as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) tone.setY(i, astro.tones[i]);
        tone.needsUpdate = true;
      });
  }

  start(): void {
    this.last = performance.now();
    this.lastScroll = window.scrollY;
    this.frame = requestAnimationFrame(this.tick);
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointer);
    this.geometry.dispose();
    this.material.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------- setup

  private buildParticles(count: number, astroData: ArrayBuffer | null): void {
    const g = galaxy(count);
    const a = astronaut(count, astroData);
    const d = dna(count);
    const t = tunnel(count);
    const p = planet(count);
    const rand = new Float32Array(count * 4);
    const tone = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      rand.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      tone.set([g.tones[i], a.tones[i], d.tones[i], p.tones[i]], i * 4);
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(g.positions, 3));
    this.geometry.setAttribute('aAstro', new THREE.BufferAttribute(a.positions, 3));
    this.geometry.setAttribute('aDna', new THREE.BufferAttribute(d.positions, 3));
    this.geometry.setAttribute('aTunnel', new THREE.BufferAttribute(t.positions, 3));
    this.geometry.setAttribute('aPlanet', new THREE.BufferAttribute(p.positions, 3));
    this.geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    this.geometry.setAttribute('aTone', new THREE.BufferAttribute(tone, 4));
  }

  private buildStars(count: number): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(starShell(count), 3));
    const material = new THREE.PointsMaterial({
      color: 0x9fb0ff,
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.disposables.push(geometry, material);
    return new THREE.Points(geometry, material);
  }

  /** Big soft colour clouds far behind everything — the "aurora" of the scene. */
  private buildNebulae(): void {
    const glow = (color: string): THREE.CanvasTexture => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const ctx = c.getContext('2d')!;
      const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, color);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.disposables.push(tex);
      return tex;
    };
    const clouds: [string, number, number, number, number][] = [
      ['rgba(34,211,238,0.5)', -16, 7, -34, 30],
      ['rgba(139,92,246,0.55)', 18, -3, -38, 36],
      ['rgba(244,63,142,0.4)', 3, -16, -32, 26],
    ];
    for (const [color, x, y, z, s] of clouds) {
      const material = new THREE.SpriteMaterial({
        map: glow(color),
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      this.disposables.push(material);
      const sprite = new THREE.Sprite(material);
      sprite.position.set(x, y, z);
      sprite.scale.setScalar(s);
      this.scene.add(sprite);
    }
  }

  // ---------------------------------------------------------------- loop

  private readonly onResize = (): void => this.resize();

  private readonly onPointer = (e: PointerEvent): void => {
    this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  private resize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  private readonly tick = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    const ease = (rate: number): number => 1 - Math.exp(-rate * dt);

    // --- Where are we in the story? ---------------------------------
    const vh = this.height;
    const rects = this.opts.chapters.map((el) => el.getBoundingClientRect());
    let target = 0;
    for (let k = 0; k < rects.length - 1; k++) {
      // Transition k → k+1 plays while the seam between the chapters crosses mid-screen.
      const seam = (rects[k].bottom + rects[k + 1].top) / 2;
      target += smooth(clamp01((vh * 0.5 - seam) / (vh * 0.9) + 0.5));
    }
    const progress = rects.map((r) => clamp01((vh * 0.5 - r.top) / Math.max(1, r.height)));
    this.morph += (target - this.morph) * ease(5);

    const scrollY = window.scrollY;
    const velocity = (scrollY - this.lastScroll) / Math.max(dt, 1e-3);
    this.lastScroll = scrollY;
    this.speed += (Math.min(4000, Math.abs(velocity)) - this.speed) * ease(3);

    // --- Animate each formation -------------------------------------
    this.dnaSpin += dt * 0.25;
    this.travel += dt * (4 + this.speed * 0.012);
    const u = this.material.uniforms;
    u['uTime'].value = this.time;
    u['uMorph'].value = this.morph;
    u['uAstroRot'].value = -0.5 + this.time * 0.08 + progress[Shape.Astronaut] * 1.2;
    u['uDnaRot'].value = this.dnaSpin + progress[Shape.Dna] * Math.PI * 3;
    u['uTunnelTravel'].value = this.travel;
    u['uPlanetRot'].value = this.time * 0.05;
    u['uWarp'].value = 1.6 + this.speed * 0.004;
    u['uAspect'].value = this.camera.aspect;

    // --- Camera: blend the two adjacent chapter rigs -----------------
    const i = Math.min(Math.floor(this.morph), SHAPES - 2);
    const f = smooth(clamp01(this.morph - i));
    const a = this.rig(i, progress[i] ?? 0);
    const b = this.rig(i + 1, progress[i + 1] ?? 0);
    const pos = a.pos.lerp(b.pos, f);
    const look = a.target.lerp(b.target, f);
    const shift = a.shift + (b.shift - a.shift) * f;

    // Portrait screens: pull back so subjects fit the narrow frame.
    if (this.camera.aspect < 0.85) {
      pos.sub(look).multiplyScalar(1.55).add(look);
    }
    this.mouseDamped.lerp(this.mouse, ease(2.5));
    pos.x += this.mouseDamped.x * 0.45;
    pos.y -= this.mouseDamped.y * 0.3;

    this.camPos.lerp(pos, ease(4));
    this.camTarget.lerp(look, ease(4));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
    this.camera.updateMatrix();
    // Pan the frame sideways (after lookAt) to leave room for the copy.
    const appliedShift = this.camera.aspect < 0.85 ? 0 : shift;
    this.camera.position.addScaledVector(this.tmp.setFromMatrixColumn(this.camera.matrix, 0), -appliedShift);
    this.camera.updateMatrixWorld();

    this.updateLabels(progress[Shape.Dna] ?? 0);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  };

  /** Camera choreography for each chapter, given its scroll progress `p`. */
  private rig(shape: number, p: number): Rig {
    const t = this.time;
    switch (shape) {
      case Shape.Galaxy:
        return {
          pos: new THREE.Vector3(Math.sin(t * 0.05) * 1.2, 4.8 - p * 2, 10 - p * 2),
          target: new THREE.Vector3(0, -1.3, 0),
          shift: 0,
        };
      case Shape.Astronaut: {
        const angle = -0.9 + p * 1.9;
        const radius = 8.8 - Math.sin(p * Math.PI) * 1.8;
        return {
          pos: new THREE.Vector3(Math.sin(angle) * radius, 0.5 + Math.sin(p * Math.PI) * 0.8, Math.cos(angle) * radius),
          target: new THREE.Vector3(0, 0, 0),
          shift: 1.9,
        };
      }
      case Shape.Dna: {
        const y = -4.6 + p * 9.2;
        const angle = -0.3 + p * 0.9;
        return {
          pos: new THREE.Vector3(Math.sin(angle) * 6.4, y + 0.8, Math.cos(angle) * 6.4),
          target: new THREE.Vector3(0, y, 0),
          shift: 1.4,
        };
      }
      case Shape.Tunnel:
        return {
          pos: new THREE.Vector3(0, 0, 7),
          target: new THREE.Vector3(Math.sin(t * 0.3) * 0.6, Math.cos(t * 0.25) * 0.4, -20),
          shift: 0,
        };
      default:
        return {
          pos: new THREE.Vector3(Math.sin(t * 0.06) * 2, 2.2, 16 - p * 1.5),
          target: new THREE.Vector3(0, 0, 0),
          shift: 2.7,
        };
    }
  }

  /** Pin each skill label to its spot on the (rotating) helix. */
  private updateLabels(p: number): void {
    const weight = clamp01(1 - Math.abs(this.morph - Shape.Dna) * 1.6);
    const labels = this.opts.labels;
    if (weight <= 0.001) {
      for (const el of labels) el.style.opacity = '0';
      return;
    }
    const rot = this.dnaSpin + p * Math.PI * 3;
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    labels.forEach((el, k) => {
      const [x, y, z] = this.labelAnchors[k];
      // Same rotation as the shader's rot() applied to xz.
      const rx = c * x + s * z;
      const rz = -s * x + c * z;
      this.tmp.set(rx, y, rz).project(this.camera);
      const sx = (this.tmp.x * 0.5 + 0.5) * this.width;
      const sy = (-this.tmp.y * 0.5 + 0.5) * this.height;
      // +1 when the anchor sits on the side of the helix facing the camera, -1 behind it.
      const cx = this.camera.position.x;
      const cz = this.camera.position.z;
      const facing = (rx * cx + rz * cz) / (DNA.radius * 1.08 * (Math.hypot(cx, cz) || 1));
      // On portrait screens the copy sits up top, so keep labels to the lower band.
      const portrait = this.camera.aspect < 0.85;
      const bandCentre = this.height * (portrait ? 0.7 : 0.5);
      const bandHalf = this.height * (portrait ? 0.2 : 0.36);
      const edge = 1 - smooth(clamp01((Math.abs(sy - bandCentre) - bandHalf) / (this.height * 0.1)));
      const opacity = weight * (0.28 + 0.72 * smooth(clamp01((facing + 0.2) / 0.6))) * edge;
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) scale(${(0.8 + opacity * 0.25).toFixed(3)})`;
    });
  }
}
