// Tile helpers for turning drags into plans. The input module only tracks the drag's end tiles
// (a, b) and hands them to hooks.plan; the simulation decides what the tool does. The path shapes
// below mirror sim's planTool (road: L along the longer axis first; zones/bulldoze: rectangle) so
// dev harnesses and tests can stand in for the simulation without importing it.
import type { TilePos } from '../core/types';

export function sameTile(a: TilePos | null | undefined, b: TilePos | null | undefined): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.z === b.z;
}

/** The tile containing ground point (gx, gz), or null if that is off a size × size map. */
export function tileAt(gx: number, gz: number, size: number): TilePos | null {
  if (!Number.isFinite(gx) || !Number.isFinite(gz)) return null;
  const x = Math.floor(gx);
  const z = Math.floor(gz);
  if (x < 0 || z < 0 || x >= size || z >= size) return null;
  return { x, z };
}

/** The tile containing ground point (gx, gz), pulled onto the map when the point is off it. */
export function clampedTileAt(gx: number, gz: number, size: number): TilePos {
  const lim = Math.max(0, size - 1);
  const fx = Number.isFinite(gx) ? Math.floor(gx) : 0;
  const fz = Number.isFinite(gz) ? Math.floor(gz) : 0;
  return { x: Math.min(lim, Math.max(0, fx)), z: Math.min(lim, Math.max(0, fz)) };
}

/** A tile from outside (e.g. a pick hook) made safe: whole numbers inside the map, or null. */
export function cleanTile(t: TilePos | null | undefined, size: number): TilePos | null {
  if (!t || !Number.isFinite(t.x) || !Number.isFinite(t.z)) return null;
  const lim = Math.max(0, size - 1);
  // already clean (the usual case): no copy
  if (Number.isInteger(t.x) && Number.isInteger(t.z) && t.x >= 0 && t.z >= 0 && t.x <= lim && t.z <= lim) return t;
  return { x: Math.min(lim, Math.max(0, Math.round(t.x))), z: Math.min(lim, Math.max(0, Math.round(t.z))) };
}

/** L-shaped path of tile indices from a to b: along the longer axis first, then the other. */
export function lPath(a: TilePos, b: TilePos, size: number): number[] {
  const out: number[] = [];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const sx = Math.sign(dx);
  const sz = Math.sign(dz);
  if (Math.abs(dx) >= Math.abs(dz)) {
    for (let x = a.x; ; x += sx) {
      out.push(a.z * size + x);
      if (x === b.x) break;
    }
    if (sz !== 0) {
      for (let z = a.z + sz; ; z += sz) {
        out.push(z * size + b.x);
        if (z === b.z) break;
      }
    }
  } else {
    for (let z = a.z; ; z += sz) {
      out.push(z * size + a.x);
      if (z === b.z) break;
    }
    if (sx !== 0) {
      for (let x = a.x + sx; ; x += sx) {
        out.push(b.z * size + x);
        if (x === b.x) break;
      }
    }
  }
  return out;
}

/** Tile indices of the rectangle spanned by a and b (inclusive), row by row. */
export function rectTiles(a: TilePos, b: TilePos, size: number): number[] {
  const out: number[] = [];
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const z0 = Math.min(a.z, b.z);
  const z1 = Math.max(a.z, b.z);
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) out.push(z * size + x);
  return out;
}

/**
 * The end tiles of a drag in progress. `move` reports whether the plan needs recomputing, so the
 * (possibly expensive) plan hook only runs when the finger reaches a different tile.
 */
export class DragTiles {
  a: TilePos | null = null;
  b: TilePos | null = null;
  /** Building tools drag a single footprint around: a follows b. */
  constructor(readonly single: boolean) {}

  /** Feed the tile now under the finger. Returns true if the drag changed. */
  move(t: TilePos | null): boolean {
    if (!t) return false;
    if (!this.a || !this.b) {
      this.a = { x: t.x, z: t.z };
      this.b = { x: t.x, z: t.z };
      return true;
    }
    if (sameTile(t, this.b)) return false;
    this.b = { x: t.x, z: t.z };
    if (this.single) this.a = { x: t.x, z: t.z };
    return true;
  }

  get started(): boolean {
    return this.a !== null;
  }
}
