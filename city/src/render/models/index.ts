// OWNER: models agent. Voxel art for everything that stands on the map. Keep these signatures.
//
// Coordinates: 1 world unit = 1 tile. A w×h-tile model is centred on the origin in x/z, spans
// [-w/2, w/2] × [-h/2, h/2], and stands on y = 0. Its front (door, sign) faces +z when rot = 0.
// The world renderer rotates by rot × 90° around y and places the centre over the footprint.
//
// Every model is a voxel design (16 voxels per tile; vehicles 48) meshed with hidden-face culling
// and greedy merging into non-indexed geometry with position, flat normal and linear vertex colour.
// Windows, lamps and signs are in the separate glow geometry. Results are cached forever.
import * as THREE from 'three';
import type { BuildingType } from '../../core/types';
import { ZoneType } from '../../core/types';
import { buildingDesign } from './buildings';
import { finish, type Design, type Finished } from './design';
import { treeGrid } from './nature';
import { CAR_PAINTS, carHeight, carMesh } from './vehicles';
import { MeshAcc } from './voxel';
import { zoneDesign } from './zones';

export interface ModelParts {
  /** Opaque body with vertex colours (attribute `color`) and flat normals. */
  body: THREE.BufferGeometry;
  /** Windows, lamps and signs: drawn with a material that glows at night. Vertex colours are the lit colour. */
  glow: THREE.BufferGeometry | null;
  /** Local points where smoke or steam rises (chimneys). */
  smoke?: THREE.Vector3[];
  /** A part that spins (wind turbine rotor). Geometry is centred on its own pivot. */
  spinner?: { geometry: THREE.BufferGeometry; pivot: THREE.Vector3; axis: 'x' | 'y' | 'z'; speed: number };
  /** Height of the model's top in world units (for floating status icons). */
  height: number;
}

/** Distinct designs per zone and level. Tiles pick one with `variant % ZONE_VARIANTS`. */
export const ZONE_VARIANTS = 4;

const cache = new Map<string, ModelParts>();
/** Triangle counts per cache key (dev tools read these through modelStats). */
const triCounts = new Map<string, number>();

function store(key: string, f: Finished): ModelParts {
  const parts: ModelParts = { body: f.body, glow: f.glow, height: f.height };
  if (f.smoke) parts.smoke = f.smoke;
  if (f.spinner) parts.spinner = f.spinner;
  cache.set(key, parts);
  triCounts.set(key, f.triangles);
  return parts;
}

function cached(key: string, make: () => Design): ModelParts {
  const hit = cache.get(key);
  if (hit) return hit;
  return store(key, finish(make()));
}

function clampInt(v: number, lo: number, hi: number): number {
  const n = Number.isFinite(v) ? Math.floor(v) : lo;
  return n < lo ? lo : n > hi ? hi : n;
}

/** A developed lot (1×1). level is 1..3. Results are cached: same arguments return the same object. */
export function zoneModel(_zone: ZoneType, level: number, _variant: number): ModelParts {
  const zone = _zone === ZoneType.Com || _zone === ZoneType.Ind ? _zone : ZoneType.Res;
  const lvl = clampInt(level, 1, 3);
  const v = ((clampInt(_variant, 0, 1 << 30) % ZONE_VARIANTS) + ZONE_VARIANTS) % ZONE_VARIANTS;
  return cached(`z${zone}-${lvl}-${v}`, () => zoneDesign(zone, lvl, v));
}

/** A placed service or utility building. Cached. */
export function buildingModel(_type: BuildingType): ModelParts {
  return cached(`b-${_type}`, () => buildingDesign(_type));
}

/** A clump of trees on a 1×1 tile, variant 1..3. Cached. */
export function treeModel(_variant: number): ModelParts {
  const v = clampInt(_variant, 1, 3);
  return cached(`t${v}`, () => ({ g: treeGrid(v) }));
}

/** A car about 0.3 long, front facing +z, sitting on y = 0. variant picks the paint. Cached. */
export const CAR_VARIANTS = 6;
export function carModel(_variant: number): ModelParts {
  const v = ((clampInt(_variant, 0, 1 << 30) % CAR_VARIANTS) + CAR_VARIANTS) % CAR_VARIANTS;
  const key = `car${v}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const acc = new MeshAcc();
  acc.append(carMesh(v % CAR_PAINTS));
  const g = acc.toGeometries();
  return store(key, { body: g.body, glow: g.glow, height: carHeight(v), triangles: acc.triangles });
}

/**
 * Build every model ahead of time (a few hundred ms in total), so the first appearance of a big
 * building never stalls a frame. Optional: everything is also built lazily on first use.
 */
export function warmModels(): void {
  for (const zone of [ZoneType.Res, ZoneType.Com, ZoneType.Ind]) {
    for (let level = 1; level <= 3; level++) for (let v = 0; v < ZONE_VARIANTS; v++) zoneModel(zone, level, v);
  }
  for (let v = 1; v <= 3; v++) treeModel(v);
  for (let v = 0; v < CAR_VARIANTS; v++) carModel(v);
}

/** Dev/test helper: triangle counts of every model built so far, by cache key. */
export function modelStats(): Map<string, number> {
  return new Map(triCounts);
}
