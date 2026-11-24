// OWNER: sim agent. Deterministic terrain for a new city: rivers, lakes, coasts, sandy shores and woods.
// Everything derives from state.seed, so the same seed always gives the same map.

import { hash01, makeRng } from '../core/rng';
import type { GameState } from '../core/types';
import { Terrain, TileKind } from '../core/types';

// ---------- noise ----------

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 2D value noise in [0, 1) on an integer lattice hashed from the seed. */
function valueNoise(seed: number, x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = smooth(x - x0);
  const fz = smooth(z - z0);
  const a = hash01(seed, x0, z0);
  const b = hash01(seed, x0 + 1, z0);
  const c = hash01(seed, x0, z0 + 1);
  const d = hash01(seed, x0 + 1, z0 + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

/** Fractal value noise, roughly in [0, 1). */
function fbm(seed: number, x: number, z: number, octaves: number): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(seed + o * 1013, x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** 1D noise in [0, 1) (a slice of the 2D one). */
function noise1(seed: number, t: number, octaves = 3): number {
  return fbm(seed, t, 7.31, octaves);
}

// ---------- features ----------

type Edge = 0 | 1 | 2 | 3; // 0 north (z = 0), 1 east (x = max), 2 south (z = max), 3 west (x = 0)

interface Features {
  river: boolean;
  coast: Edge | -1;
  lakes: number;
}

function pickFeatures(rng: () => number): Features {
  const roll = rng();
  if (roll < 0.28) return { river: true, coast: -1, lakes: rng() < 0.4 ? 1 : 0 };
  if (roll < 0.52) return { river: false, coast: -1, lakes: 2 + Math.floor(rng() * 2) };
  if (roll < 0.72) return { river: false, coast: Math.floor(rng() * 4) as Edge, lakes: 1 + Math.floor(rng() * 2) };
  if (roll < 0.88) return { river: true, coast: Math.floor(rng() * 4) as Edge, lakes: rng() < 0.3 ? 1 : 0 };
  return { river: true, coast: -1, lakes: 1 + Math.floor(rng() * 2) };
}

/** Distance from the map centre (in tiles) inside which no water is placed. */
function clearRadius(size: number): number {
  return Math.max(4, Math.round(size * 0.17));
}

function stampDisk(water: Uint8Array, size: number, px: number, pz: number, r: number, centre: number, keepOut: number) {
  const x0 = Math.max(0, Math.floor(px - r - 1));
  const x1 = Math.min(size - 1, Math.ceil(px + r + 1));
  const z0 = Math.max(0, Math.floor(pz - r - 1));
  const z1 = Math.min(size - 1, Math.ceil(pz + r + 1));
  const r2 = r * r;
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - px;
      const dz = z + 0.5 - pz;
      if (dx * dx + dz * dz > r2) continue;
      const cx = x + 0.5 - centre;
      const cz = z + 0.5 - centre;
      if (cx * cx + cz * cz < keepOut * keepOut) continue;
      water[z * size + x] = 1;
    }
  }
}

/**
 * A meandering river from one edge to the opposite one. `t` runs along the main axis, `c(t)` is the
 * centre line across it. The river bends around the clear area in the middle of the map.
 */
function carveRiver(water: Uint8Array, size: number, seed: number, rng: () => number, axis: 0 | 1, keepOut: number) {
  const centre = size / 2;
  const side = rng() < 0.5 ? -1 : 1;
  const offset = side * (size * 0.19 + rng() * size * 0.12);
  const slope = (rng() - 0.5) * 0.4;
  const a1 = 2.5 + rng() * 3.5;
  const f1 = (Math.PI * 2) / (28 + rng() * 18);
  const p1 = rng() * Math.PI * 2;
  const a2 = 0.8 + rng() * 1.5;
  const f2 = (Math.PI * 2) / (11 + rng() * 7);
  const p2 = rng() * Math.PI * 2;
  const wSeed = seed ^ 0x51f15e;
  for (let t = -6; t <= size + 6; t += 0.25) {
    const width = 2.2 + 1.9 * noise1(wSeed, t / 14);
    const hw = width / 2;
    let c = centre + offset + slope * (t - centre) + a1 * Math.sin(f1 * t + p1) + a2 * Math.sin(f2 * t + p2);
    // Bend around the clear centre so the river never cuts the starting area.
    const dt = t - centre;
    const need = keepOut + hw + 1;
    if (Math.abs(dt) < need) {
      const minOff = Math.sqrt(need * need - dt * dt);
      if (Math.abs(c - centre) < minOff) c = centre + Math.sign(offset) * minOff;
    }
    if (axis === 0) stampDisk(water, size, t, c, hw, centre, keepOut);
    else stampDisk(water, size, c, t, hw, centre, keepOut);
  }
}

function carveCoast(water: Uint8Array, size: number, seed: number, rng: () => number, edge: Edge) {
  const base = size * (0.06 + rng() * 0.05);
  const amp = size * (0.07 + rng() * 0.07);
  const cSeed = seed ^ 0xc0a57;
  // A bay or headland somewhere along the shore.
  const bayAt = rng() * size;
  const bayWidth = size * (0.08 + rng() * 0.1);
  const bayDepth = (rng() < 0.5 ? 1 : -0.6) * size * (0.04 + rng() * 0.05);
  for (let t = 0; t < size; t++) {
    const bay = bayDepth * Math.exp(-(((t - bayAt) / bayWidth) ** 2));
    const depth = Math.max(1.5, base + amp * 1.8 * (noise1(cSeed, t / 13, 4) - 0.35) + 1.6 * noise1(cSeed + 9, t / 3, 2) + bay);
    for (let d = 0; d < size; d++) {
      if (d + 0.5 > depth) break;
      let x: number, z: number;
      if (edge === 0) [x, z] = [t, d];
      else if (edge === 2) [x, z] = [t, size - 1 - d];
      else if (edge === 3) [x, z] = [d, t];
      else [x, z] = [size - 1 - d, t];
      water[z * size + x] = 1;
    }
  }
}

function carveLake(water: Uint8Array, size: number, seed: number, rng: () => number, keepOut: number, k: number) {
  const centre = size / 2;
  const r = size * (0.055 + rng() * 0.07);
  let lx = 0;
  let lz = 0;
  let found = false;
  for (let attempt = 0; attempt < 40 && !found; attempt++) {
    lx = r + 2 + rng() * (size - 2 * r - 4);
    lz = r + 2 + rng() * (size - 2 * r - 4);
    const d = Math.hypot(lx - centre, lz - centre);
    if (d >= keepOut + r + 2) found = true;
  }
  if (!found) return;
  const stretch = 0.7 + rng() * 0.6;
  const ang = rng() * Math.PI;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const lSeed = seed ^ (0x1a3e + k * 7919);
  const x0 = Math.max(0, Math.floor(lx - r * 2));
  const x1 = Math.min(size - 1, Math.ceil(lx + r * 2));
  const z0 = Math.max(0, Math.floor(lz - r * 2));
  const z1 = Math.min(size - 1, Math.ceil(lz + r * 2));
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - lx;
      const dz = z + 0.5 - lz;
      const u = (dx * ca + dz * sa) * stretch;
      const v = (-dx * sa + dz * ca) / stretch;
      const d = Math.sqrt(u * u + v * v) / r;
      const wobble = (fbm(lSeed, x / 4.5, z / 4.5, 3) - 0.5) * 0.9;
      if (d + wobble < 1) {
        const cx = x + 0.5 - centre;
        const cz = z + 0.5 - centre;
        if (cx * cx + cz * cz >= keepOut * keepOut) water[z * size + x] = 1;
      }
    }
  }
}

/** Remove one-tile spikes and fill one-tile notches so shorelines look deliberate. */
function smoothWater(water: Uint8Array, size: number) {
  const next = new Uint8Array(water);
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const i = z * size + x;
      let count = 0;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue;
          const nx = x + dx;
          const nz = z + dz;
          // Off-map neighbours count as the tile itself, so edges are left alone.
          if (nx < 0 || nz < 0 || nx >= size || nz >= size) count += water[i];
          else count += water[nz * size + nx];
        }
      }
      if (water[i] && count <= 2) next[i] = 0;
      else if (!water[i] && count >= 6) next[i] = 1;
    }
  }
  water.set(next);
}

/** Drop water bodies smaller than `min` tiles (stray specks left by noise). */
function removeSpecks(water: Uint8Array, size: number, min: number) {
  const n = size * size;
  const seen = new Uint8Array(n);
  const stack: number[] = [];
  const comp: number[] = [];
  for (let s = 0; s < n; s++) {
    if (!water[s] || seen[s]) continue;
    comp.length = 0;
    stack.push(s);
    seen[s] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      comp.push(i);
      const x = i % size;
      const z = (i - x) / size;
      if (x > 0 && water[i - 1] && !seen[i - 1]) (seen[i - 1] = 1), stack.push(i - 1);
      if (x < size - 1 && water[i + 1] && !seen[i + 1]) (seen[i + 1] = 1), stack.push(i + 1);
      if (z > 0 && water[i - size] && !seen[i - size]) (seen[i - size] = 1), stack.push(i - size);
      if (z < size - 1 && water[i + size] && !seen[i + size]) (seen[i + size] = 1), stack.push(i + size);
    }
    if (comp.length < min) for (const i of comp) water[i] = 0;
  }
}

function buildWater(size: number, seed: number, f: Features, rng: () => number): Uint8Array {
  const water = new Uint8Array(size * size);
  const keepOut = clearRadius(size);
  if (f.coast >= 0) carveCoast(water, size, seed, rng, f.coast as Edge);
  if (f.river) {
    // With a coast, the river runs into the sea (perpendicular to the coast edge).
    let axis: 0 | 1;
    if (f.coast === 0 || f.coast === 2) axis = 1;
    else if (f.coast === 1 || f.coast === 3) axis = 0;
    else axis = rng() < 0.5 ? 0 : 1;
    carveRiver(water, size, seed, rng, axis, keepOut);
  }
  for (let k = 0; k < f.lakes; k++) carveLake(water, size, seed, rng, keepOut, k);
  smoothWater(water, size);
  smoothWater(water, size);
  removeSpecks(water, size, 5);
  return water;
}

/**
 * Fill in terrain and trees for state.seed. Expects a fresh state (everything Empty). Keeps a clear,
 * dry area around the centre so every map starts with room to build.
 */
export function generateMap(state: GameState): void {
  const { size, seed } = state;
  const n = size * size;
  const T = state.tiles;
  const rng = makeRng((seed ^ 0x5eed1234) >>> 0);
  const f = pickFeatures(rng);

  // Water; if a combination floods too much of the map, drop features until it fits.
  let water = buildWater(size, seed, f, rng);
  const share = (w: Uint8Array) => w.reduce((s, v) => s + v, 0) / n;
  while (share(water) > 0.3 && (f.lakes > 0 || f.coast >= 0)) {
    if (f.lakes > 0) f.lakes--;
    else f.coast = -1;
    water = buildWater(size, seed, f, makeRng((seed ^ 0x7a11) >>> 0));
  }

  for (let i = 0; i < n; i++) {
    T.terrain[i] = water[i] ? Terrain.Water : Terrain.Grass;
    T.trees[i] = 0;
    T.kind[i] = TileKind.Empty;
    T.zone[i] = 0;
    T.level[i] = 0;
    T.bld[i] = -1;
    T.distress[i] = 0;
    T.variant[i] = Math.floor(hash01(seed, i, 0x7a) * 256);
  }

  // Sandy shores: land touching water, with a few grassy banks for variety.
  const shoreSeed = seed ^ 0x5a2d;
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const i = z * size + x;
      if (water[i]) continue;
      let orth = false;
      let diag = false;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue;
          const nx = x + dx;
          const nz = z + dz;
          if (nx < 0 || nz < 0 || nx >= size || nz >= size) continue;
          if (!water[nz * size + nx]) continue;
          if (dx === 0 || dz === 0) orth = true;
          else diag = true;
        }
      }
      if (!orth && !diag) continue;
      const v = fbm(shoreSeed, x / 6, z / 6, 2);
      if ((orth && v > 0.22) || (diag && v > 0.45)) T.terrain[i] = Terrain.Sand;
    }
  }

  // Woods: fBm clusters covering 20-30% of the land, none in the clear centre.
  const treeSeed = seed ^ 0x7a3e;
  const target = 0.2 + rng() * 0.1;
  const centre = size / 2;
  const noTrees = Math.max(3, size * 0.125);
  const ramp = Math.max(2, size * 0.08);
  const vals = new Float32Array(n).fill(-Infinity);
  let land = 0;
  const eligible: number[] = [];
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const i = z * size + x;
      if (T.terrain[i] === Terrain.Water) continue;
      land++;
      if (T.terrain[i] !== Terrain.Grass) continue;
      const d = Math.hypot(x + 0.5 - centre, z + 0.5 - centre);
      if (d < noTrees) continue;
      let v = fbm(treeSeed, x / 9, z / 9, 4) + 0.22 * fbm(treeSeed + 77, x / 3.2, z / 3.2, 2);
      if (d < noTrees + ramp) v -= (1 - (d - noTrees) / ramp) * 0.5;
      vals[i] = v;
      eligible.push(i);
    }
  }
  const want = Math.min(eligible.length, Math.round(land * target));
  if (want > 0) {
    const sorted = eligible.map((i) => vals[i]).sort((a, b) => b - a);
    const threshold = sorted[want - 1];
    // Clumps get denser towards the middle of each wood.
    const spread = Math.max(1e-6, sorted[0] - threshold);
    for (const i of eligible) {
      const v = vals[i];
      if (v >= threshold) {
        const depth = (v - threshold) / spread + (hash01(seed, i, 0x3e) - 0.5) * 0.25;
        T.trees[i] = depth > 0.45 ? 3 : depth > 0.18 ? 2 : 1;
      } else if (hash01(seed, i, 0x10e) < 0.012) {
        T.trees[i] = 1; // the odd lone tree in a meadow
      }
    }
  }
}

/** Share of the map that is land (anything but water). */
export function buildableShare(state: GameState): number {
  let land = 0;
  const t = state.tiles.terrain;
  for (let i = 0; i < t.length; i++) if (t[i] !== Terrain.Water) land++;
  return land / t.length;
}
