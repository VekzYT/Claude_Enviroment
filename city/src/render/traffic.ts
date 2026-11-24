// Cars driving on the right-hand side of the roads. Each car follows a smooth curve through one tile
// at a time (straight, left, right, or a U-turn at dead ends), keeps its distance to the car ahead
// in its lane, and leaves if its road disappears. Cost is proportional to the number of cars.
import * as THREE from 'three';
import { MAX_CARS } from '../core/config';
import type { GameState } from '../core/types';
import { TileKind } from '../core/types';
import { LANE_OFFSET } from './atlas';
import { combineParts } from './instances';
import type { LightPools } from './lamps';
import { CAR_VARIANTS, carModel } from './models';
import { roadMask } from './tiles';
import { DX, DZ, OPP, writeYRot } from './util';

const SPEED = 1.05; // tiles per second on a straight
const TURN_SPEED = 0.7;
const GAP = 0.42; // minimum distance to the car ahead in the same lane, in tiles
const SPAWN_RATE = 6; // cars per second while the city fills up
const FADE = 0.35; // seconds to grow in / shrink away
const MAX_WAIT = 2.5; // seconds before a stuck car squeezes through anyway

// turn kinds by (dout - din) mod 4
const STRAIGHT = 0;
const UTURN = 2;
/** Hermite tangent length per turn kind (tuned so curves look like quarter circles). */
const TANGENT = [1.0, 0.56, 2.1, 1.12];

/** Point on the path through a tile; writes into out[0..3] = x, z, dx, dz (tile-local, centred). */
function pathPoint(din: number, dout: number, s: number, out: Float32Array): void {
  const fx0 = DX[din], fz0 = DZ[din];
  const fx1 = DX[dout], fz1 = DZ[dout];
  // right-hand lane: right of travel direction f is (−fz, fx)
  const p0x = -0.5 * fx0 - LANE_OFFSET * fz0;
  const p0z = -0.5 * fz0 + LANE_OFFSET * fx0;
  const p1x = 0.5 * fx1 - LANE_OFFSET * fz1;
  const p1z = 0.5 * fz1 + LANE_OFFSET * fx1;
  const k = TANGENT[(dout - din + 4) % 4];
  const m0x = fx0 * k, m0z = fz0 * k, m1x = fx1 * k, m1z = fz1 * k;
  const s2 = s * s;
  const s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;
  out[0] = h00 * p0x + h10 * m0x + h01 * p1x + h11 * m1x;
  out[1] = h00 * p0z + h10 * m0z + h01 * p1z + h11 * m1z;
  const d00 = 6 * s2 - 6 * s;
  const d10 = 3 * s2 - 4 * s + 1;
  const d01 = -6 * s2 + 6 * s;
  const d11 = 3 * s2 - 2 * s;
  out[2] = d00 * p0x + d10 * m0x + d01 * p1x + d11 * m1x;
  out[3] = d00 * p0z + d10 * m0z + d01 * p1z + d11 * m1z;
}

/** Arc length of each turn kind, measured once. */
const PATH_LEN = (() => {
  const out = new Float32Array(4);
  const tmp = new Float32Array(4);
  for (let kind = 0; kind < 4; kind++) {
    let len = 0;
    let px = 0, pz = 0;
    for (let k = 0; k <= 32; k++) {
      pathPoint(1, (1 + kind) % 4, k / 32, tmp);
      if (k > 0) len += Math.hypot(tmp[0] - px, tmp[1] - pz);
      px = tmp[0];
      pz = tmp[1];
    }
    out[kind] = len;
  }
  return out;
})();

export class TrafficLayer {
  readonly group = new THREE.Group();
  private readonly meshes: THREE.InstancedMesh[] = [];
  // car state, struct of arrays
  private readonly tile = new Int32Array(MAX_CARS);
  private readonly din = new Int8Array(MAX_CARS);
  private readonly dout = new Int8Array(MAX_CARS);
  private readonly s = new Float32Array(MAX_CARS);
  private readonly variant = new Uint8Array(MAX_CARS);
  private readonly scale = new Float32Array(MAX_CARS);
  /** 0 = free slot, 1 = driving, 2 = leaving (shrinking away). */
  private readonly mode = new Uint8Array(MAX_CARS);
  private readonly wait = new Float32Array(MAX_CARS);
  private readonly ahead = new Int16Array(MAX_CARS);
  /** Last car to enter each (tile, entry direction) lane, or −1. */
  private slots = new Int16Array(0);
  private roadTiles = new Int32Array(0);
  private roadCount = 0;
  private state: GameState | null = null;
  /** Indices of cars on the map (driving or leaving), packed; per-frame work walks only these. */
  private readonly live = new Int16Array(MAX_CARS);
  private readonly livePos = new Int16Array(MAX_CARS);
  private alive = 0;
  /** Unused car slots. */
  private readonly free = new Int16Array(MAX_CARS);
  private freeCount = 0;
  /** Cars in mode 1 (driving, not leaving). */
  private driving = 0;
  private spawnClock = 0;
  private seed = 7;
  private readonly tmp = new Float32Array(4);
  private readonly counts = new Int32Array(CAR_VARIANTS);
  target = 0;
  /** Spawn the whole target at once on the next update (after a load). */
  private prefill = true;
  private lastSpawned = 0;

  constructor(material: THREE.Material) {
    this.group.name = 'traffic';
    for (let v = 0; v < CAR_VARIANTS; v++) {
      const m = new THREE.InstancedMesh(combineParts(carModel(v)), material, MAX_CARS);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.count = 0;
      m.frustumCulled = false;
      m.castShadow = false;
      m.receiveShadow = true;
      m.name = `cars-${v}`;
      m.matrixAutoUpdate = false;
      this.meshes.push(m);
      this.group.add(m);
    }
    this.resetCars();
  }

  private resetCars(): void {
    this.mode.fill(0);
    this.alive = 0;
    this.driving = 0;
    this.freeCount = MAX_CARS;
    for (let k = 0; k < MAX_CARS; k++) this.free[k] = MAX_CARS - 1 - k;
  }

  setShadows(on: boolean): void {
    for (const m of this.meshes) m.castShadow = on;
  }

  private rand(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  setState(state: GameState): void {
    this.state = state;
    this.resetCars();
    this.slots = new Int16Array(state.size * state.size * 4).fill(-1);
    this.prefill = true;
    this.rebuildRoads();
    for (const m of this.meshes) m.count = 0;
  }

  /** Roads changed: refresh the list of tiles cars can spawn on. */
  rebuildRoads(): void {
    const s = this.state;
    if (!s) return;
    const n = s.size * s.size;
    if (this.roadTiles.length < n) this.roadTiles = new Int32Array(n);
    let c = 0;
    for (let i = 0; i < n; i++) {
      if (s.tiles.kind[i] !== TileKind.Road) continue;
      if (roadMask(s, i % s.size, (i / s.size) | 0) === 0) continue;
      this.roadTiles[c++] = i;
    }
    this.roadCount = c;
  }

  private isRoadIdx(i: number): boolean {
    return this.state!.tiles.kind[i] === TileKind.Road;
  }

  /** Pick where to leave a tile entered while heading `din`: never back unless it's a dead end. */
  private chooseExit(i: number, din: number): number {
    const s = this.state!;
    const x = i % s.size;
    const z = (i / s.size) | 0;
    const m = roadMask(s, x, z);
    const back = OPP[din];
    let total = 0;
    for (let d = 0; d < 4; d++) {
      if (d === back || !(m & (1 << d))) continue;
      total += d === din ? 2.2 : 1;
    }
    if (total === 0) return back;
    let r = this.rand() * total;
    for (let d = 0; d < 4; d++) {
      if (d === back || !(m & (1 << d))) continue;
      r -= d === din ? 2.2 : 1;
      if (r <= 0) return d;
    }
    return din;
  }

  private spawnOne(): boolean {
    const st = this.state!;
    if (this.roadCount === 0 || this.freeCount === 0) return false;
    const slot = this.free[this.freeCount - 1];
    for (let attempt = 0; attempt < 6; attempt++) {
      const i = this.roadTiles[(this.rand() * this.roadCount) | 0];
      const x = i % st.size;
      const z = (i / st.size) | 0;
      const m = roadMask(st, x, z);
      if (m === 0) continue;
      // arrive as if from a neighbouring road
      const pick = (this.rand() * 4) | 0;
      let din = -1;
      for (let k = 0; k < 4; k++) {
        const d = (pick + k) % 4;
        if (m & (1 << OPP[d])) {
          din = d;
          break;
        }
      }
      if (din < 0) continue;
      const lane = i * 4 + din;
      const occ = this.slots[lane];
      if (occ >= 0 && this.mode[occ] !== 0 && this.tile[occ] === i && this.din[occ] === din) continue;
      this.tile[slot] = i;
      this.din[slot] = din;
      this.dout[slot] = this.chooseExit(i, din);
      this.s[slot] = this.rand() * 0.6;
      this.variant[slot] = (this.rand() * CAR_VARIANTS) | 0;
      this.scale[slot] = 0.01;
      this.mode[slot] = 1;
      this.wait[slot] = 0;
      this.ahead[slot] = -1;
      this.slots[lane] = slot;
      this.freeCount--;
      this.live[this.alive] = slot;
      this.livePos[slot] = this.alive;
      this.alive++;
      this.driving++;
      this.lastSpawned = slot;
      return true;
    }
    return false;
  }

  private release(k: number): void {
    const lane = this.tile[k] * 4 + this.din[k];
    if (this.slots[lane] === k) this.slots[lane] = -1;
  }

  /** Start shrinking a driving car away. */
  private leave(k: number): void {
    if (this.mode[k] !== 1) return;
    this.mode[k] = 2;
    this.driving--;
  }

  /** Remove a car that finished shrinking: back to the free stack, out of the live list. */
  private retire(k: number): void {
    this.release(k);
    this.mode[k] = 0;
    const pos = this.livePos[k];
    const last = this.live[--this.alive];
    this.live[pos] = last;
    this.livePos[last] = pos;
    this.free[this.freeCount++] = k;
  }

  update(dt: number, pools: LightPools | null, night: number): number {
    const st = this.state;
    if (!st) return 0;
    const step = Math.min(dt, 0.1);
    const target = Math.min(this.target, MAX_CARS, Math.floor(this.roadCount * 0.45));

    // a freshly loaded city starts with its traffic already on the roads
    if (this.prefill) {
      this.prefill = false;
      let tries = target * 2;
      while (this.alive < target && tries-- > 0) {
        const before = this.alive;
        if (this.spawnOne() && this.alive > before) this.scale[this.lastSpawned] = 1;
      }
    }
    // then grow or thin it gradually
    if (this.alive < target) {
      this.spawnClock += step * Math.max(SPAWN_RATE, (target - this.alive) * 0.4);
      while (this.spawnClock >= 1 && this.alive < target) {
        this.spawnClock -= 1;
        if (!this.spawnOne()) break;
      }
      if (this.spawnClock > 2) this.spawnClock = 2;
    } else {
      this.spawnClock = 0;
      for (let n = 0; n < this.alive && this.driving > target; n++) this.leave(this.live[n]);
    }

    const kind = st.tiles.kind;
    const size = st.size;
    for (let n = 0; n < this.alive; n++) {
      const k = this.live[n];
      // the road under it vanished: shrink away
      if (this.mode[k] === 1 && kind[this.tile[k]] !== TileKind.Road) this.leave(k);
      if (this.mode[k] === 2) {
        this.scale[k] -= step / FADE;
        if (this.scale[k] <= 0) {
          this.retire(k);
          n--; // the last live car moved into this position
          continue;
        }
      } else if (this.scale[k] < 1) {
        this.scale[k] = Math.min(1, this.scale[k] + step / FADE);
      }

      const turn = (this.dout[k] - this.din[k] + 4) % 4;
      const len = PATH_LEN[turn];
      const speed = turn === STRAIGHT ? SPEED : TURN_SPEED;
      let s = this.s[k] + (speed * step) / len;
      // keep a gap to the car ahead in the same lane of the same tile
      const a = this.ahead[k];
      if (a >= 0) {
        if (this.mode[a] !== 0 && this.tile[a] === this.tile[k] && this.din[a] === this.din[k]) {
          const aLen = PATH_LEN[(this.dout[a] - this.din[a] + 4) % 4];
          const limit = (this.s[a] * aLen - GAP) / len;
          if (s > limit) s = Math.max(this.s[k], limit);
        } else this.ahead[k] = -1;
      }
      if (s >= 1) {
        const i = this.tile[k];
        const d = this.dout[k];
        const x = (i % size) + DX[d];
        const z = ((i / size) | 0) + DZ[d];
        const next = z * size + x;
        if (x < 0 || z < 0 || x >= size || z >= size || !this.isRoadIdx(next)) {
          // the road ahead is gone
          s = 1;
          this.leave(k);
        } else {
          const lane = next * 4 + d;
          const occ = this.slots[lane];
          const occupied = occ >= 0 && occ !== k && this.mode[occ] !== 0 && this.tile[occ] === next && this.din[occ] === d;
          let tooClose = false;
          if (occupied) {
            // a U-turn loops back across its own lane, so nobody follows into it until it has left
            const occTurn = (this.dout[occ] - this.din[occ] + 4) % 4;
            tooClose = occTurn === UTURN || this.s[occ] * PATH_LEN[occTurn] < GAP;
          }
          if (tooClose && this.wait[k] < MAX_WAIT) {
            s = 1;
            this.wait[k] += step;
          } else {
            this.release(k);
            this.ahead[k] = occupied ? occ : -1;
            this.slots[lane] = k;
            this.tile[k] = next;
            this.din[k] = d;
            this.dout[k] = this.chooseExit(next, d);
            this.wait[k] = 0;
            s = Math.min(0.5, (s - 1) * len / PATH_LEN[(this.dout[k] - d + 4) % 4]);
          }
        }
      }
      this.s[k] = s;
    }

    // draw: group by paint variant, write transforms, and headlight pools at night
    this.counts.fill(0);
    let lights = 0;
    const withLights = pools !== null && night > 0.03;
    for (let n = 0; n < this.alive; n++) {
      const k = this.live[n];
      const i = this.tile[k];
      pathPoint(this.din[k], this.dout[k], Math.min(1, this.s[k]), this.tmp);
      const x = (i % size) + 0.5 + this.tmp[0];
      const z = ((i / size) | 0) + 0.5 + this.tmp[1];
      const yaw = Math.atan2(this.tmp[2], this.tmp[3]);
      const v = this.variant[k];
      const m = this.meshes[v];
      const sc = this.scale[k];
      writeYRot(m.instanceMatrix.array as Float32Array, this.counts[v] * 16, x, 0.004, z, yaw, sc, sc);
      this.counts[v]++;
      if (withLights) {
        pools!.setHeadlight(lights++, x + Math.sin(yaw) * 0.36 * sc, z + Math.cos(yaw) * 0.36 * sc, yaw, sc);
      }
    }
    for (let v = 0; v < CAR_VARIANTS; v++) {
      const m = this.meshes[v];
      m.count = this.counts[v];
      m.visible = m.count > 0;
      if (m.count > 0) m.instanceMatrix.needsUpdate = true;
    }
    return lights;
  }

  /** Cars currently on the map (for tests and the debug overlay). */
  carCount(): number {
    return this.alive;
  }

  dispose(): void {
    for (const m of this.meshes) {
      m.dispose();
      m.geometry.dispose();
    }
  }
}
