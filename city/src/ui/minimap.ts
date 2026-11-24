// A small top-down picture of a map for the new-city screen: grass, sand, water and trees.
import { hash01 } from '../core/rng';
import type { GameState } from '../core/types';
import { Terrain, TileKind, ZoneType } from '../core/types';
import { ZONE_COLORS } from '../core/defs';

type RGB = [number, number, number];
const GRASS: RGB = [124, 201, 92];
const GRASS_DARK: RGB = [104, 182, 78];
const SAND: RGB = [240, 220, 150];
const WATER_DEEP: RGB = [52, 140, 220];
const WATER_SHALLOW: RGB = [96, 186, 240];
const TREE: RGB = [52, 138, 66];
const TREE_LIGHT: RGB = [82, 168, 84];
const ROAD: RGB = [110, 118, 130];

function hexRGB(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export interface MapFacts {
  water: number;
  trees: number;
  sand: number;
  /** A friendly one-word description of the land. */
  kind: string;
}

/** Shares of water/trees/sand on the map and a one-word description. */
export function mapFacts(state: GameState): MapFacts {
  const T = state.tiles;
  const n = state.size * state.size;
  let water = 0;
  let trees = 0;
  let sand = 0;
  for (let i = 0; i < n; i++) {
    if (T.terrain[i] === Terrain.Water) water++;
    else if (T.terrain[i] === Terrain.Sand) sand++;
    if (T.trees[i]) trees++;
  }
  const w = water / n;
  const t = trees / n;
  const kind = w > 0.28 ? 'Lake country' : w > 0.1 ? 'Lakeside' : t > 0.3 ? 'Woodland' : t > 0.15 ? 'Leafy meadows' : 'Open plains';
  return { water: w, trees: t, sand: sand / n, kind };
}

/**
 * Draw `state` into `canvas`, filling its backing store (set width/height for the device pixel
 * ratio before calling). Water is lighter near the shore; grass gets a gentle checker so it reads
 * as blocks, and trees are little darker squares.
 */
export function drawMinimap(canvas: HTMLCanvasElement, state: GameState): void {
  const g = canvas.getContext('2d');
  if (!g) return;
  const size = state.size;
  const W = canvas.width;
  const H = canvas.height;
  const T = state.tiles;
  const img = g.createImageData(W, H);
  const data = img.data;

  // Distance to land for water tiles (0 = next to land), capped at 3, for shallow-water shading.
  const shore = new Uint8Array(size * size).fill(3);
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const i = z * size + x;
      if (T.terrain[i] !== Terrain.Water) continue;
      let best = 3;
      for (let dz = -2; dz <= 2 && best > 0; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx;
          const zz = z + dz;
          if (xx < 0 || zz < 0 || xx >= size || zz >= size) continue;
          if (T.terrain[zz * size + xx] !== Terrain.Water) best = Math.min(best, Math.max(Math.abs(dx), Math.abs(dz)) - 1);
        }
      }
      shore[i] = best;
    }
  }

  const res = hexRGB(ZONE_COLORS.res);
  const com = hexRGB(ZONE_COLORS.com);
  const ind = hexRGB(ZONE_COLORS.ind);
  const tilePx = W / size;

  for (let py = 0; py < H; py++) {
    const z = Math.min(size - 1, Math.floor(py / tilePx));
    const fy = py / tilePx - z;
    for (let px = 0; px < W; px++) {
      const x = Math.min(size - 1, Math.floor(px / tilePx));
      const fx = px / tilePx - x;
      const i = z * size + x;
      let c: RGB;
      const terr = T.terrain[i];
      if (terr === Terrain.Water) {
        const t = shore[i] / 3;
        c = [
          WATER_SHALLOW[0] + (WATER_DEEP[0] - WATER_SHALLOW[0]) * t,
          WATER_SHALLOW[1] + (WATER_DEEP[1] - WATER_SHALLOW[1]) * t,
          WATER_SHALLOW[2] + (WATER_DEEP[2] - WATER_SHALLOW[2]) * t,
        ];
      } else if (T.kind[i] === TileKind.Road) {
        c = ROAD;
      } else if (T.kind[i] === TileKind.Zone) {
        c = T.zone[i] === ZoneType.Res ? res : T.zone[i] === ZoneType.Com ? com : ind;
      } else if (T.kind[i] === TileKind.Building) {
        c = [236, 232, 222];
      } else if (T.trees[i]) {
        // A tree: a darker rounded blob inside the tile with a lighter top-left.
        const dx = fx - 0.5;
        const dy = fy - 0.5;
        const inside = dx * dx + dy * dy < 0.2;
        c = inside ? (dx + dy < -0.15 ? TREE_LIGHT : TREE) : terr === Terrain.Sand ? SAND : GRASS;
      } else if (terr === Terrain.Sand) {
        c = SAND;
      } else {
        c = hash01(x, z, 3) < 0.18 ? GRASS_DARK : GRASS;
      }
      // Per-tile brightness jitter, like the voxel world.
      const j = 0.94 + hash01(x, z, 7) * 0.1;
      const o = (py * W + px) * 4;
      data[o] = Math.min(255, c[0] * j);
      data[o + 1] = Math.min(255, c[1] * j);
      data[o + 2] = Math.min(255, c[2] * j);
      data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}
