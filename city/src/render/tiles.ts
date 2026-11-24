// Read-only helpers over GameState tiles used by several render layers.
import { ROAD_REACH } from '../core/config';
import { BUILDINGS } from '../core/defs';
import type { BuildingType, GameState } from '../core/types';
import { Terrain, TileKind } from '../core/types';
import { DX, DZ, FACE_DX, FACE_DZ } from './util';

export function isRoad(state: GameState, x: number, z: number): boolean {
  if (x < 0 || z < 0 || x >= state.size || z >= state.size) return false;
  return state.tiles.kind[z * state.size + x] === TileKind.Road;
}

/** 4-neighbour road mask: N(−z)=1, E(+x)=2, S(+z)=4, W(−x)=8. Map edges count as no road. */
export function roadMask(state: GameState, x: number, z: number): number {
  let m = 0;
  for (let d = 0; d < 4; d++) if (isRoad(state, x + DX[d], z + DZ[d])) m |= 1 << d;
  return m;
}

/** True when a tile shows open water (water terrain with nothing built on it). */
export function isOpenWater(state: GameState, i: number): boolean {
  return state.tiles.terrain[i] === Terrain.Water && state.tiles.kind[i] === TileKind.Empty;
}

/**
 * Which way a 1×1 lot faces (rot 0 = +z, 1 = +x, 2 = −z, 3 = −x). An adjacent road wins, checked in
 * the order +z, +x, −z, −x; otherwise the nearest road straight out within ROAD_REACH; otherwise a
 * stable per-tile choice.
 */
export function lotFacing(state: GameState, x: number, z: number): number {
  for (let dist = 1; dist <= ROAD_REACH; dist++) {
    for (let r = 0; r < 4; r++) {
      if (isRoad(state, x + FACE_DX[r] * dist, z + FACE_DZ[r] * dist)) return r;
    }
  }
  return state.tiles.variant[z * state.size + x] & 3;
}

export type GroundStyle = 'plaza' | 'gravel' | 'park';

export function buildingGround(type: BuildingType): GroundStyle {
  if (type === 'park_small') return 'park';
  const def = BUILDINGS[type];
  if (def.power || def.water) return 'gravel';
  return 'plaza';
}
