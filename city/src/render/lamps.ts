// Street lamps along the roads, and the soft pools of light on the ground at night (shared with car
// headlights so all ground glow is a single additive draw).
import * as THREE from 'three';
import { MAX_CARS } from '../core/config';
import { hash01 } from '../core/rng';
import type { GameState } from '../core/types';
import { TileKind } from '../core/types';
import { SIDEWALK_OFFSET } from './atlas';
import { roadMask } from './tiles';
import { DX, DZ, MeshBuilder, linearRGB, writeYRot, writeYRotXZ } from './util';

const ARM = 0.17;

function lampGeometry(): THREE.BufferGeometry {
  const b = new MeshBuilder();
  const pole = linearRGB('#5a6170');
  const dark = linearRGB('#3f4450');
  const lamp = linearRGB('#ffd68a');
  const w = 0.022;
  b.box(-0.04, 0, -0.04, 0.04, 0.05, 0.04, dark[0], dark[1], dark[2]);
  b.box(-w, 0.05, -w, w, 0.6, w, pole[0], pole[1], pole[2]);
  // arm reaching over the road (+z), and the lamp head under its tip
  b.box(-w * 0.8, 0.58, -w, w * 0.8, 0.615, ARM + 0.03, pole[0], pole[1], pole[2]);
  b.box(-0.035, 0.555, ARM - 0.045, 0.035, 0.585, ARM + 0.04, lamp[0], lamp[1], lamp[2], 1, true);
  return b.build(false, true);
}

function poolTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const LAMP_POOL = new THREE.Color('#ffc86e');
const HEAD_POOL = new THREE.Color('#fff2cf');

/** Additive ground glow: lamp pools first (static), then car headlights (rewritten each frame). */
export class LightPools {
  mesh: THREE.InstancedMesh;
  private cap: number;
  staticCount = 0;
  private readonly mat: THREE.MeshBasicMaterial;

  constructor(cap: number) {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    this.mat = new THREE.MeshBasicMaterial({
      map: poolTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      opacity: 0,
    });
    this.cap = cap;
    this.mesh = this.make(geo, cap);
  }

  private make(geo: THREE.BufferGeometry, cap: number): THREE.InstancedMesh {
    const m = new THREE.InstancedMesh(geo, this.mat, cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    m.count = 0;
    m.frustumCulled = false;
    m.renderOrder = 3;
    m.name = 'light-pools';
    m.visible = false;
    return m;
  }

  /** Make room for n static pools plus every possible car. Returns the (possibly new) mesh. */
  reserve(nStatic: number): THREE.InstancedMesh | null {
    const need = nStatic + MAX_CARS;
    if (need <= this.cap) return null;
    this.cap = Math.ceil(need * 1.3);
    const old = this.mesh;
    const m = this.make(old.geometry, this.cap);
    old.dispose();
    this.mesh = m;
    return m;
  }

  setStatic(k: number, x: number, z: number, r: number): void {
    writeYRot(this.mesh.instanceMatrix.array as Float32Array, k * 16, x, 0.012, z, 0, r, 1);
    this.mesh.setColorAt(k, LAMP_POOL);
  }

  /** Headlight pool for dynamic slot j (0-based after the statics). */
  setHeadlight(j: number, x: number, z: number, yaw: number, scale: number): void {
    const k = this.staticCount + j;
    writeYRotXZ(this.mesh.instanceMatrix.array as Float32Array, k * 16, x, 0.014, z, yaw, 0.32 * scale, 1, 0.62 * scale);
    const c = this.mesh.instanceColor!.array as Float32Array;
    c[k * 3] = HEAD_POOL.r;
    c[k * 3 + 1] = HEAD_POOL.g;
    c[k * 3 + 2] = HEAD_POOL.b;
  }

  /** Per frame: how bright, and how many headlight pools follow the statics. */
  commit(night: number, dynamicCount: number): void {
    this.mat.opacity = Math.min(1, night * 1.1) * 0.8;
    const on = night > 0.03;
    this.mesh.visible = on && this.staticCount + dynamicCount > 0;
    if (!on) return;
    this.mesh.count = this.staticCount + dynamicCount;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mat.map?.dispose();
    this.mat.dispose();
    this.mesh.dispose();
  }
}

export class LampLayer {
  readonly group = new THREE.Group();
  private mesh: THREE.InstancedMesh | null = null;
  private readonly geom = lampGeometry();
  private cap = 0;

  constructor(
    private readonly material: THREE.Material,
    readonly pools: LightPools,
    private readonly onPoolsMeshChanged: (old: THREE.InstancedMesh, m: THREE.InstancedMesh) => void,
  ) {
    this.group.name = 'lamps';
  }

  /** Place lamps along every road (only called when roads change). */
  rebuild(state: GameState): void {
    const n = state.size;
    const kind = state.tiles.kind;
    const spots: number[] = [];
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        if (kind[z * n + x] !== TileKind.Road) continue;
        if ((x + z) % 2 !== 0) continue;
        const m = roadMask(state, x, z);
        let ox = 0;
        let oz = 0;
        if (m === 15) {
          // crossroads: stand on one of the four corner squares
          const c = (hash01(x, z, 31) * 4) | 0;
          ox = c & 1 ? SIDEWALK_OFFSET : -SIDEWALK_OFFSET;
          oz = c & 2 ? SIDEWALK_OFFSET : -SIDEWALK_OFFSET;
        } else {
          const free: number[] = [];
          for (let d = 0; d < 4; d++) if (!(m & (1 << d))) free.push(d);
          if (m === 5 || m === 10) {
            // straight: stagger lamps from one side to the other
            const pick = ((x + z) >> 1) % 2;
            const d = free[pick % free.length];
            ox = DX[d] * SIDEWALK_OFFSET;
            oz = DZ[d] * SIDEWALK_OFFSET;
          } else if (free.length === 2 && ((free[0] + 1) % 4 === free[1] || (free[1] + 1) % 4 === free[0])) {
            // a bend: the roomy outer corner
            ox = (DX[free[0]] + DX[free[1]]) * SIDEWALK_OFFSET;
            oz = (DZ[free[0]] + DZ[free[1]]) * SIDEWALK_OFFSET;
          } else {
            const d = free[(hash01(x, z, 32) * free.length) | 0];
            ox = DX[d] * SIDEWALK_OFFSET;
            oz = DZ[d] * SIDEWALK_OFFSET;
          }
        }
        // the arm points back toward the middle of the road
        const yaw = Math.atan2(-ox, -oz);
        spots.push(x + 0.5 + ox, z + 0.5 + oz, yaw);
      }
    }
    const count = spots.length / 3;
    if (!this.mesh || this.cap < count) {
      if (this.mesh) {
        this.group.remove(this.mesh);
        this.mesh.dispose();
      }
      this.cap = Math.max(32, Math.ceil(count * 1.4));
      this.mesh = new THREE.InstancedMesh(this.geom, this.material, this.cap);
      this.mesh.castShadow = false;
      this.mesh.receiveShadow = true;
      this.mesh.name = 'lamps';
      this.mesh.matrixAutoUpdate = false;
      this.group.add(this.mesh);
    }
    const old = this.pools.mesh;
    const replaced = this.pools.reserve(count);
    if (replaced) this.onPoolsMeshChanged(old, replaced);
    const arr = this.mesh.instanceMatrix.array as Float32Array;
    for (let k = 0; k < count; k++) {
      const x = spots[k * 3];
      const z = spots[k * 3 + 1];
      const yaw = spots[k * 3 + 2];
      writeYRot(arr, k * 16, x, 0, z, yaw, 1, 1);
      this.pools.setStatic(k, x + Math.sin(yaw) * ARM, z + Math.cos(yaw) * ARM, 0.95);
    }
    this.pools.staticCount = count;
    this.mesh.count = count;
    this.mesh.visible = count > 0;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.computeBoundingSphere();
  }

  dispose(): void {
    if (this.mesh) this.mesh.dispose();
    this.geom.dispose();
  }
}
