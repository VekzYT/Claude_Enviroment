// Cheap voxel particles in one instanced draw: smoke rising from chimneys of working buildings and
// dust puffs when something is built or bulldozed. Fixed-size pool, no per-frame allocation.
import * as THREE from 'three';
import { writeYRot } from './util';

const POOL = 360;
/** Seconds between puffs from one chimney. */
const SMOKE_EVERY = 0.42;
/** At most this many chimneys smoke at once (the rest stay quiet) to keep the pool healthy. */
const MAX_EMITTERS = 72;

const SMOKE = new THREE.Color('#eeeeec');
const SMOKE_DARK = new THREE.Color('#c9c9cc');
const DUST = new THREE.Color('#dcc6a0');

export class FxLayer {
  readonly mesh: THREE.InstancedMesh;
  private readonly px = new Float32Array(POOL);
  private readonly py = new Float32Array(POOL);
  private readonly pz = new Float32Array(POOL);
  private readonly vx = new Float32Array(POOL);
  private readonly vy = new Float32Array(POOL);
  private readonly vz = new Float32Array(POOL);
  private readonly age = new Float32Array(POOL);
  private readonly life = new Float32Array(POOL);
  private readonly size = new Float32Array(POOL);
  private readonly spin = new Float32Array(POOL);
  private readonly kind = new Uint8Array(POOL); // 0 = smoke, 1 = dust
  private readonly cr = new Float32Array(POOL);
  private readonly cg = new Float32Array(POOL);
  private readonly cb = new Float32Array(POOL);
  private alive = 0;
  private emitClock = new Float32Array(MAX_EMITTERS);
  private seed = 1;
  /** Multiplier on how many smoke puffs are made (quality setting). */
  density = 1;

  constructor() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(geo, mat, POOL);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3);
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.name = 'fx';
    for (let k = 0; k < MAX_EMITTERS; k++) this.emitClock[k] = this.rand() * SMOKE_EVERY;
  }

  private rand(): number {
    // tiny LCG: deterministic and allocation free
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  private spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, kind: number, c: THREE.Color): void {
    let k: number;
    if (this.alive < POOL) k = this.alive++;
    else {
      // pool full: recycle the oldest-looking slot
      k = (this.rand() * POOL) | 0;
    }
    this.px[k] = x;
    this.py[k] = y;
    this.pz[k] = z;
    this.vx[k] = vx;
    this.vy[k] = vy;
    this.vz[k] = vz;
    this.age[k] = 0;
    this.life[k] = life;
    this.size[k] = size;
    this.spin[k] = this.rand() * 6.28;
    this.kind[k] = kind;
    this.cr[k] = c.r;
    this.cg[k] = c.g;
    this.cb[k] = c.b;
  }

  /** A ring of dust around a footprint (building placed, lot grown, something bulldozed). */
  dust(x: number, z: number, w: number, h: number): void {
    const cx = x + w / 2;
    const cz = z + h / 2;
    const count = Math.min(26, 8 + Math.round((w + h) * 3));
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + this.rand() * 0.4;
      const ex = Math.cos(a);
      const ez = Math.sin(a);
      // start on the footprint's edge, puff outward and a little up
      const rx = (w / 2) * ex * 0.95;
      const rz = (h / 2) * ez * 0.95;
      const sp = 0.5 + this.rand() * 0.6;
      this.spawn(cx + rx, 0.05, cz + rz, ex * sp, 0.35 + this.rand() * 0.4, ez * sp, 0.55 + this.rand() * 0.35, 0.1 + this.rand() * 0.09 * Math.min(2, w), 1, DUST);
    }
  }

  clear(): void {
    this.alive = 0;
    this.mesh.count = 0;
  }

  update(dt: number, emitters: Float32Array, emitterCount: number, night: number): void {
    // chimneys
    const n = Math.min(MAX_EMITTERS, emitterCount);
    const step = emitterCount > MAX_EMITTERS ? emitterCount / MAX_EMITTERS : 1;
    const every = SMOKE_EVERY / Math.max(0.2, this.density);
    for (let k = 0; k < n; k++) {
      this.emitClock[k] -= dt;
      if (this.emitClock[k] > 0) continue;
      this.emitClock[k] += every * (0.8 + this.rand() * 0.4);
      const e = Math.floor(k * step) * 3;
      const c = this.rand() < 0.5 ? SMOKE : SMOKE_DARK;
      this.spawn(
        emitters[e] + (this.rand() - 0.5) * 0.05,
        emitters[e + 1],
        emitters[e + 2] + (this.rand() - 0.5) * 0.05,
        0.06 + this.rand() * 0.06,
        0.45 + this.rand() * 0.2,
        0.03 * (this.rand() - 0.5),
        2.2 + this.rand() * 0.8,
        0.11 + this.rand() * 0.05,
        0,
        c,
      );
    }

    // integrate, retire dead puffs by swapping the last one in, write matrices
    const arr = this.mesh.instanceMatrix.array as Float32Array;
    const col = this.mesh.instanceColor!.array as Float32Array;
    const dim = 1 - night * 0.55;
    let k = 0;
    while (k < this.alive) {
      this.age[k] += dt;
      if (this.age[k] >= this.life[k]) {
        const last = --this.alive;
        if (k !== last) this.move(last, k);
        continue;
      }
      const t = this.age[k] / this.life[k];
      if (this.kind[k] === 0) {
        // smoke: drifts with the breeze, slows its climb, swells then shrinks away
        this.vy[k] *= 1 - dt * 0.25;
      } else {
        // dust: quick burst that settles
        const drag = 1 - Math.min(1, dt * 3.5);
        this.vx[k] *= drag;
        this.vz[k] *= drag;
        this.vy[k] -= dt * 0.9;
      }
      this.px[k] += this.vx[k] * dt;
      this.py[k] += this.vy[k] * dt;
      this.pz[k] += this.vz[k] * dt;
      if (this.py[k] < 0.02) this.py[k] = 0.02;
      const grow = this.kind[k] === 0 ? 1 + t * 1.6 : 1 + t * 0.8;
      const fade = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
      const s = this.size[k] * grow * Math.max(0.05, fade) * Math.min(1, t * 8 + 0.3);
      writeYRot(arr, k * 16, this.px[k], this.py[k], this.pz[k], this.spin[k] + t * 1.5, s, s);
      col[k * 3] = this.cr[k] * dim;
      col[k * 3 + 1] = this.cg[k] * dim;
      col[k * 3 + 2] = this.cb[k] * dim;
      k++;
    }
    this.mesh.count = this.alive;
    this.mesh.visible = this.alive > 0;
    if (this.alive > 0) {
      this.mesh.instanceMatrix.needsUpdate = true;
      this.mesh.instanceColor!.needsUpdate = true;
    }
  }

  private move(from: number, to: number): void {
    this.px[to] = this.px[from];
    this.py[to] = this.py[from];
    this.pz[to] = this.pz[from];
    this.vx[to] = this.vx[from];
    this.vy[to] = this.vy[from];
    this.vz[to] = this.vz[from];
    this.age[to] = this.age[from];
    this.life[to] = this.life[from];
    this.size[to] = this.size[from];
    this.spin[to] = this.spin[from];
    this.kind[to] = this.kind[from];
    this.cr[to] = this.cr[from];
    this.cg[to] = this.cg[from];
    this.cb[to] = this.cb[from];
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
