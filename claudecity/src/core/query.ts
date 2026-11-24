// Questions everyone asks the city: what is the ground here, what is solid near here, does this ray
// hit anything. Also finalizeCity, which turns a CityDraft from src/world into the CityMap the game
// uses (derived colliders and lookup grids). All of it is allocation-free after finalizeCity.

import { DISTRICT_CELL, GRID_CELL, STEP_UP, SURF_CELL, SWAMP_FLOOR, WATER_FLOOR } from './config';
import { DISTRICT_IDS, PROPS } from './defs';
import type { CityDraft, CityMap, Collider, DistrictId, Prop, RayHit, SpatialGrid } from './types';
import { Surface } from './types';

// ---------------------------------------------------------------------------------------------
// Grids
// ---------------------------------------------------------------------------------------------

const B = new Float64Array(4);

/**
 * Index `count` items by their x/z bounds. `bounds(i, out)` writes [x0, z0, x1, z1] for item i.
 */
export function buildGrid(size: number, cell: number, count: number, bounds: (i: number, out: Float64Array) => void): SpatialGrid {
  const n = Math.max(1, Math.ceil(size / cell));
  const cellOf = (v: number) => {
    const c = Math.floor(v / cell);
    return c < 0 ? 0 : c >= n ? n - 1 : c;
  };
  const counts = new Uint32Array(n * n + 1);
  for (let i = 0; i < count; i++) {
    bounds(i, B);
    const cx0 = cellOf(B[0]);
    const cz0 = cellOf(B[1]);
    const cx1 = cellOf(B[2]);
    const cz1 = cellOf(B[3]);
    for (let cz = cz0; cz <= cz1; cz++) for (let cx = cx0; cx <= cx1; cx++) counts[cz * n + cx + 1]++;
  }
  for (let c = 0; c < n * n; c++) counts[c + 1] += counts[c];
  const start = counts;
  const items = new Uint32Array(start[n * n]);
  const fill = start.slice(0, n * n);
  for (let i = 0; i < count; i++) {
    bounds(i, B);
    const cx0 = cellOf(B[0]);
    const cz0 = cellOf(B[1]);
    const cx1 = cellOf(B[2]);
    const cz1 = cellOf(B[3]);
    for (let cz = cz0; cz <= cz1; cz++) for (let cx = cx0; cx <= cx1; cx++) items[fill[cz * n + cx]++] = i;
  }
  return { cell, n, start, items, mark: new Uint32Array(Math.max(1, count)), tick: 0 };
}

/**
 * Item indices whose grid cells overlap the rectangle, each once, written to `out` from index 0.
 * Returns how many. Items are candidates: check their real bounds yourself.
 */
export function queryGrid(grid: SpatialGrid, x0: number, z0: number, x1: number, z1: number, out: number[]): number {
  const { cell, n, start, items, mark } = grid;
  let cx0 = Math.floor(x0 / cell);
  let cz0 = Math.floor(z0 / cell);
  let cx1 = Math.floor(x1 / cell);
  let cz1 = Math.floor(z1 / cell);
  if (cx1 < 0 || cz1 < 0 || cx0 >= n || cz0 >= n) return 0;
  if (cx0 < 0) cx0 = 0;
  if (cz0 < 0) cz0 = 0;
  if (cx1 >= n) cx1 = n - 1;
  if (cz1 >= n) cz1 = n - 1;
  const tick = ++grid.tick;
  let k = 0;
  for (let cz = cz0; cz <= cz1; cz++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const c = cz * n + cx;
      for (let p = start[c], e = start[c + 1]; p < e; p++) {
        const i = items[p];
        if (mark[i] === tick) continue;
        mark[i] = tick;
        out[k++] = i;
      }
    }
  }
  return k;
}

// ---------------------------------------------------------------------------------------------
// finalizeCity
// ---------------------------------------------------------------------------------------------

/** The x/z box a solid prop occupies (sized props turn with their yaw in quarter turns). */
export function propBox(p: Prop, out: Float64Array): void {
  const def = PROPS[p.kind];
  let hx = def.r * p.scale;
  let hz = hx;
  if (def.sized && p.w !== undefined && p.d !== undefined) {
    const quarter = Math.round(p.yaw / (Math.PI / 2)) & 1;
    hx = (quarter ? p.d : p.w) / 2;
    hz = (quarter ? p.w : p.d) / 2;
  }
  out[0] = p.x - hx;
  out[1] = p.z - hz;
  out[2] = p.x + hx;
  out[3] = p.z + hz;
}

/** Adds the derived parts (colliders and grids) to a draft from src/world. */
export function finalizeCity(d: CityDraft): CityMap {
  const colliders: Collider[] = [];
  for (const b of d.buildings) {
    for (const part of b.parts) colliders.push({ x0: part.x0, z0: part.z0, x1: part.x1, z1: part.z1, y0: part.y0, y1: part.y1, kind: 'building', ref: b.id });
  }
  const pb = new Float64Array(4);
  for (let i = 0; i < d.props.length; i++) {
    const p = d.props[i];
    const def = PROPS[p.kind];
    if (!def.solid) continue;
    propBox(p, pb);
    const h = def.sized && p.h !== undefined ? p.h : def.h * p.scale;
    colliders.push({ x0: pb[0], z0: pb[1], x1: pb[2], z1: pb[3], y0: p.y, y1: p.y + h, kind: 'prop', ref: i });
  }
  const grid = buildGrid(d.size, GRID_CELL, colliders.length, (i, o) => {
    const c = colliders[i];
    o[0] = c.x0;
    o[1] = c.z0;
    o[2] = c.x1;
    o[3] = c.z1;
  });
  const propGrid = buildGrid(d.size, GRID_CELL, d.props.length, (i, o) => {
    const p = d.props[i];
    o[0] = o[2] = p.x;
    o[1] = o[3] = p.z;
  });
  const laneGrid = buildGrid(d.size, GRID_CELL, d.lanes.length, (i, o) => {
    const l = d.lanes[i];
    o[0] = Math.min(l.ax, l.bx) - 2;
    o[1] = Math.min(l.az, l.bz) - 2;
    o[2] = Math.max(l.ax, l.bx) + 2;
    o[3] = Math.max(l.az, l.bz) + 2;
  });
  return { ...d, surfN: Math.round(d.size / SURF_CELL), districtN: Math.round(d.size / DISTRICT_CELL), colliders, grid, propGrid, laneGrid };
}

/** Fill a rectangle of a surface (or district) raster. `n` cells per side of size `cell`. */
export function paintRect(raster: Uint8Array, n: number, cell: number, x0: number, z0: number, x1: number, z1: number, value: number): void {
  const cx0 = Math.max(0, Math.round(x0 / cell));
  const cz0 = Math.max(0, Math.round(z0 / cell));
  const cx1 = Math.min(n, Math.round(x1 / cell));
  const cz1 = Math.min(n, Math.round(z1 / cell));
  for (let cz = cz0; cz < cz1; cz++) raster.fill(value, cz * n + cx0, cz * n + cx1);
}

/**
 * Paint a path of the given width along a polyline (x0, z0, x1, z1, ...) into a raster. `keep`, when
 * given, lists cell values that must not be overwritten (e.g. roads and water under a dirt trail).
 */
export function paintPath(raster: Uint8Array, n: number, cell: number, pts: number[], width: number, value: number, keep?: readonly number[]): void {
  const r = width / 2;
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i];
    const az = pts[i + 1];
    const bx = pts[i + 2];
    const bz = pts[i + 3];
    const cx0 = Math.max(0, Math.floor((Math.min(ax, bx) - r) / cell));
    const cz0 = Math.max(0, Math.floor((Math.min(az, bz) - r) / cell));
    const cx1 = Math.min(n - 1, Math.floor((Math.max(ax, bx) + r) / cell));
    const cz1 = Math.min(n - 1, Math.floor((Math.max(az, bz) + r) / cell));
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz;
    for (let cz = cz0; cz <= cz1; cz++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const px = (cx + 0.5) * cell;
        const pz = (cz + 0.5) * cell;
        let t = len2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / len2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = ax + dx * t - px;
        const ez = az + dz * t - pz;
        if (ex * ex + ez * ez > r * r) continue;
        const k = cz * n + cx;
        if (keep && keep.includes(raster[k])) continue;
        raster[k] = value;
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Point queries
// ---------------------------------------------------------------------------------------------

/** The surface at a point. Outside the city it is open water. */
export function surfaceAt(map: CityMap, x: number, z: number): Surface {
  const n = map.surfN;
  const cx = Math.floor(x / SURF_CELL);
  const cz = Math.floor(z / SURF_CELL);
  if (cx < 0 || cz < 0 || cx >= n || cz >= n) return Surface.Water;
  return map.surface[cz * n + cx] as Surface;
}

export function districtAt(map: CityMap, x: number, z: number): DistrictId {
  const n = map.districtN;
  let cx = Math.floor(x / DISTRICT_CELL);
  let cz = Math.floor(z / DISTRICT_CELL);
  if (cx < 0) cx = 0;
  else if (cx >= n) cx = n - 1;
  if (cz < 0) cz = 0;
  else if (cz >= n) cz = n - 1;
  return DISTRICT_IDS[map.district[cz * n + cx]] ?? DISTRICT_IDS[0];
}

/**
 * Height of the solid ground at a point: 0 on land and boardwalks, the ramp or bridge-deck height
 * where there is one, SWAMP_FLOOR in the shallows and WATER_FLOOR under deep water (so things that
 * leave the land fall in). The water surface itself is at WATER_Y everywhere.
 *
 * Pass `fromY` (the height of whoever is asking) to get the ground under THEM: a ramp or deck more
 * than STEP_UP above fromY is overhead, not underfoot, and is ignored. That is how a boat passes
 * under a bridge while a car drives over it. Leave it out to get the topmost surface.
 */
export function groundY(map: CityMap, x: number, z: number, fromY = Infinity): number {
  const s = surfaceAt(map, x, z);
  let y = s === Surface.Water || s === Surface.Bridge ? WATER_FLOOR : s === Surface.Swamp ? SWAMP_FLOOR : 0;
  const ramps = map.ramps;
  for (let i = 0; i < ramps.length; i++) {
    const r = ramps[i];
    if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue;
    let t: number;
    if (r.dir === 0) t = (z - r.z0) / (r.z1 - r.z0);
    else if (r.dir === 1) t = (x - r.x0) / (r.x1 - r.x0);
    else if (r.dir === 2) t = (r.z1 - z) / (r.z1 - r.z0);
    else t = (r.x1 - x) / (r.x1 - r.x0);
    const h = r.h0 + (r.h - r.h0) * t;
    if (h > y && h <= fromY + STEP_UP) y = h;
  }
  return y;
}

/** Indices into map.colliders of solid boxes whose grid cells overlap the rectangle (candidates). */
export function queryColliders(map: CityMap, x0: number, z0: number, x1: number, z1: number, out: number[]): number {
  return queryGrid(map.grid, x0, z0, x1, z1, out);
}

/** Indices into map.props of props whose grid cells overlap the rectangle (candidates). */
export function queryProps(map: CityMap, x0: number, z0: number, x1: number, z1: number, out: number[]): number {
  return queryGrid(map.propGrid, x0, z0, x1, z1, out);
}

const laneScratch: number[] = [];

/** The lane whose centre line passes closest to the point, within maxDist, or -1. */
export function nearestLane(map: CityMap, x: number, z: number, maxDist: number): number {
  const k = queryGrid(map.laneGrid, x - maxDist, z - maxDist, x + maxDist, z + maxDist, laneScratch);
  let best = -1;
  let bestD = maxDist * maxDist;
  for (let i = 0; i < k; i++) {
    const l = map.lanes[laneScratch[i]];
    const dx = l.bx - l.ax;
    const dz = l.bz - l.az;
    const len2 = dx * dx + dz * dz;
    let t = len2 > 0 ? ((x - l.ax) * dx + (z - l.az) * dz) / len2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = l.ax + dx * t - x;
    const pz = l.az + dz * t - z;
    const d = px * px + pz * pz;
    if (d < bestD) {
      bestD = d;
      best = l.id;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------------
// Rays
// ---------------------------------------------------------------------------------------------

/**
 * Cast a ray against the city's solid boxes (not the ground). The direction must be a unit vector.
 * Returns the distance to the nearest hit, or -1 if nothing is hit within maxDist. Fills `hit`
 * when given. Props knocked over during play are not removed: pass `skipProps` to ignore all props.
 */
export function raycast(
  map: CityMap,
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
  hit?: RayHit,
  skipProps = false,
): number {
  const g = map.grid;
  const { cell, n, start, items, mark } = g;
  const cols = map.colliders;
  const tick = ++g.tick;
  let best = maxDist;
  let bestI = -1;
  let bestAxis = 0;

  let cx = Math.floor(ox / cell);
  let cz = Math.floor(oz / cell);
  const stepX = dx > 0 ? 1 : -1;
  const stepZ = dz > 0 ? 1 : -1;
  const tDeltaX = dx !== 0 ? cell / Math.abs(dx) : Infinity;
  const tDeltaZ = dz !== 0 ? cell / Math.abs(dz) : Infinity;
  let tMaxX = dx !== 0 ? ((dx > 0 ? (cx + 1) * cell : cx * cell) - ox) / dx : Infinity;
  let tMaxZ = dz !== 0 ? ((dz > 0 ? (cz + 1) * cell : cz * cell) - oz) / dz : Infinity;
  const ix = dx !== 0 ? 1 / dx : Infinity;
  const iy = dy !== 0 ? 1 / dy : Infinity;
  const iz = dz !== 0 ? 1 / dz : Infinity;

  for (let guard = 0; guard < 2048; guard++) {
    if (cx >= 0 && cz >= 0 && cx < n && cz < n) {
      const c = cz * n + cx;
      for (let p = start[c], e = start[c + 1]; p < e; p++) {
        const i = items[p];
        if (mark[i] === tick) continue;
        mark[i] = tick;
        const b = cols[i];
        if (skipProps && b.kind === 'prop') continue;
        // slab test
        let t0 = 0;
        let t1 = best;
        let axis = -1;
        // x
        if (dx !== 0) {
          let a = (b.x0 - ox) * ix;
          let bb = (b.x1 - ox) * ix;
          if (a > bb) {
            const s = a;
            a = bb;
            bb = s;
          }
          if (a > t0) {
            t0 = a;
            axis = 0;
          }
          if (bb < t1) t1 = bb;
        } else if (ox < b.x0 || ox > b.x1) continue;
        if (t0 > t1) continue;
        // y
        if (dy !== 0) {
          let a = (b.y0 - oy) * iy;
          let bb = (b.y1 - oy) * iy;
          if (a > bb) {
            const s = a;
            a = bb;
            bb = s;
          }
          if (a > t0) {
            t0 = a;
            axis = 1;
          }
          if (bb < t1) t1 = bb;
        } else if (oy < b.y0 || oy > b.y1) continue;
        if (t0 > t1) continue;
        // z
        if (dz !== 0) {
          let a = (b.z0 - oz) * iz;
          let bb = (b.z1 - oz) * iz;
          if (a > bb) {
            const s = a;
            a = bb;
            bb = s;
          }
          if (a > t0) {
            t0 = a;
            axis = 2;
          }
          if (bb < t1) t1 = bb;
        } else if (oz < b.z0 || oz > b.z1) continue;
        if (t0 > t1) continue;
        if (t0 < best) {
          best = t0;
          bestI = i;
          bestAxis = axis;
        }
      }
    }
    const tNext = tMaxX < tMaxZ ? tMaxX : tMaxZ;
    if (tNext > best) break;
    if (tMaxX < tMaxZ) {
      cx += stepX;
      tMaxX += tDeltaX;
      if ((stepX > 0 && cx >= n) || (stepX < 0 && cx < 0)) break;
    } else {
      cz += stepZ;
      tMaxZ += tDeltaZ;
      if ((stepZ > 0 && cz >= n) || (stepZ < 0 && cz < 0)) break;
    }
  }
  if (bestI < 0) return -1;
  if (hit) {
    hit.t = best;
    hit.x = ox + dx * best;
    hit.y = oy + dy * best;
    hit.z = oz + dz * best;
    hit.nx = bestAxis === 0 ? (dx > 0 ? -1 : 1) : 0;
    hit.ny = bestAxis === 1 ? (dy > 0 ? -1 : 1) : 0;
    hit.nz = bestAxis === 2 ? (dz > 0 ? -1 : 1) : 0;
    hit.collider = bestI;
  }
  return best;
}

/** True if nothing solid (props ignored) lies on the straight line between two points. */
export function lineOfSight(map: CityMap, ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 1e-6) return true;
  return raycast(map, ax, ay, az, dx / len, dy / len, dz / len, len, undefined, true) < 0;
}

export function newRayHit(): RayHit {
  return { t: 0, x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0, collider: -1 };
}
