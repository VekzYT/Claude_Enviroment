// OWNER: sim agent. Small helpers shared by the simulation files, plus the per-state runtime cache
// (scratch buffers and results of the last recompute that growth and inspect read).

import type { GameState, PlacedBuilding } from '../core/types';
import { TileKind, Terrain } from '../core/types';

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Squared Euclidean distance (in tiles) from tile (x, z) to the nearest tile of a footprint. */
export function footprintDist2(x: number, z: number, bx: number, bz: number, w: number, h: number): number {
  const dx = x < bx ? bx - x : x > bx + w - 1 ? x - (bx + w - 1) : 0;
  const dz = z < bz ? bz - z : z > bz + h - 1 ? z - (bz + h - 1) : 0;
  return dx * dx + dz * dz;
}

/**
 * Distance (in tiles) from tile (x, z) to the nearest tile of a footprint, as the simulation uses it
 * for every reach and radius: 0 on the footprint, Euclidean outside it. A building with radius r reaches
 * every tile with footprintDistance <= r (the footprint grown by r, with rounded corners).
 */
export function footprintDistance(x: number, z: number, bx: number, bz: number, w: number, h: number): number {
  return Math.sqrt(footprintDist2(x, z, bx, bz, w, h));
}

/** True if a road tile touches the footprint's outside edge orthogonally. */
export function buildingTouchesRoad(state: GameState, b: { x: number; z: number; w: number; h: number }): boolean {
  const { size } = state;
  const kind = state.tiles.kind;
  for (let x = b.x; x < b.x + b.w; x++) {
    if (b.z - 1 >= 0 && kind[(b.z - 1) * size + x] === TileKind.Road) return true;
    if (b.z + b.h < size && kind[(b.z + b.h) * size + x] === TileKind.Road) return true;
  }
  for (let z = b.z; z < b.z + b.h; z++) {
    if (b.x - 1 >= 0 && kind[z * size + b.x - 1] === TileKind.Road) return true;
    if (b.x + b.w < size && kind[z * size + b.x + b.w] === TileKind.Road) return true;
  }
  return false;
}

/** True if a water tile touches the footprint's outside edge orthogonally. */
export function footprintTouchesWater(state: GameState, x0: number, z0: number, w: number, h: number): boolean {
  const { size } = state;
  const terrain = state.tiles.terrain;
  for (let x = x0; x < x0 + w; x++) {
    if (x < 0 || x >= size) continue;
    if (z0 - 1 >= 0 && terrain[(z0 - 1) * size + x] === Terrain.Water) return true;
    if (z0 + h < size && z0 + h >= 0 && terrain[(z0 + h) * size + x] === Terrain.Water) return true;
  }
  for (let z = z0; z < z0 + h; z++) {
    if (z < 0 || z >= size) continue;
    if (x0 - 1 >= 0 && terrain[z * size + x0 - 1] === Terrain.Water) return true;
    if (x0 + w < size && x0 + w >= 0 && terrain[z * size + x0 + w] === Terrain.Water) return true;
  }
  return false;
}

/** Thousands separators without relying on the runtime locale. */
export function formatMoney(n: number): string {
  const neg = n < 0;
  const s = String(Math.round(Math.abs(n)));
  let out = '';
  for (let k = 0; k < s.length; k++) {
    if (k > 0 && (s.length - k) % 3 === 0) out += ',';
    out += s[k];
  }
  return (neg ? '-$' : '$') + out;
}

export function formatCount(n: number): string {
  return formatMoney(n).replace('$', '');
}

/** Odd stride coprime with n, so (start + k*stride) % n visits every tile once in a scattered order. */
export function coprimeStride(n: number): number {
  let s = Math.max(1, Math.floor(n * 0.6180339887)) | 1;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  while (gcd(s, n) !== 1) s += 2;
  return s;
}

/** A producer (power plant or water building) as the allocation sees it. */
export interface Producer {
  id: number;
  b: PlacedBuilding;
  capacity: number;
  radius: number;
  /** Capacity left after allocation; growth draws it down between recomputes. */
  remain: number;
}

/** Results of the last recompute plus scratch memory, kept per state and never saved. */
export interface SimCache {
  size: number;
  computed: boolean;
  queue: Int32Array;
  /** Manhattan distance to the nearest water tile (capped). */
  waterDist: Uint8Array;
  /** 1 if a tree stands within 2 tiles. */
  treeNear: Uint8Array;
  /** Residents living within a few tiles (for shop desirability). */
  popNear: Float32Array;
  pollutionF: Float32Array;
  /** Extra land value from buildings (scratch). */
  landF: Float32Array;
  /** Allocation scratch: consumer load, consumer key and priority pass per tile, and reach flags. */
  load: Int32Array;
  key: Int32Array;
  prio: Uint8Array;
  reach: Uint8Array;
  /** Index into powerProducers / waterProducers of the producer with most spare capacity reaching a tile, or -1. */
  powerSrc: Int32Array;
  waterSrc: Int32Array;
  powerProducers: Producer[];
  waterProducers: Producer[];
  /** Building id -> units it was allocated (power for plants, water for water buildings). */
  supplyUsed: Map<number, number>;
  /** Building id -> its running cost this month. */
  upkeep: Map<number, number>;
  /** Building id -> true when it has a road it needs (or does not need one). */
  roadOk: Map<number, boolean>;
  /** Building id -> true when it is powered (or does not need power). */
  powered: Map<number, boolean>;
  /** Happiness the city is drifting towards; stats.happiness follows it slowly. */
  happinessTarget: number;
  /** What the target is made of, in points around a base of 50. */
  happinessParts: Record<'services' | 'parks' | 'landmarks' | 'pollution' | 'jobs' | 'taxes' | 'utilities', number>;
  /** Live counters, updated by growth between recomputes so demand reacts at once. */
  pop: number;
  jobsCom: number;
  jobsInd: number;
  /** Level changes since the last recompute. */
  changesSinceRecompute: number;
  /** Toast kind -> month number it was last shown (rate limiting). */
  lastToast: Map<string, number>;
  // allocation scratch: pairs bucketed by squared distance
  pairP: Int32Array;
  pairI: Int32Array;
  pairNext: Int32Array;
  bucketHead: Int32Array;
  stride: number;
}

const caches = new WeakMap<GameState, SimCache>();

export function getCache(state: GameState): SimCache {
  let c = caches.get(state);
  if (c && c.size === state.size) return c;
  const n = state.size * state.size;
  c = {
    size: state.size,
    computed: false,
    queue: new Int32Array(n),
    waterDist: new Uint8Array(n),
    treeNear: new Uint8Array(n),
    popNear: new Float32Array(n),
    pollutionF: new Float32Array(n),
    landF: new Float32Array(n),
    load: new Int32Array(n),
    key: new Int32Array(n),
    prio: new Uint8Array(n),
    reach: new Uint8Array(n),
    powerSrc: new Int32Array(n).fill(-1),
    waterSrc: new Int32Array(n).fill(-1),
    powerProducers: [],
    waterProducers: [],
    supplyUsed: new Map(),
    upkeep: new Map(),
    roadOk: new Map(),
    powered: new Map(),
    happinessTarget: 50,
    happinessParts: { services: 0, parks: 0, landmarks: 0, pollution: 0, jobs: 0, taxes: 0, utilities: 0 },
    pop: 0,
    jobsCom: 0,
    jobsInd: 0,
    changesSinceRecompute: 0,
    lastToast: new Map(),
    pairP: new Int32Array(8192),
    pairI: new Int32Array(8192),
    pairNext: new Int32Array(8192),
    bucketHead: new Int32Array(64),
    stride: coprimeStride(n),
  };
  caches.set(state, c);
  return c;
}
