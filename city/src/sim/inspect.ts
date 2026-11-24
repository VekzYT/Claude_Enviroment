// OWNER: sim agent. Plain-language description of a tile for the inspect panel.
import type { GameState, TileInfo } from '../core/types';

export function describeTile(_state: GameState, x: number, z: number): TileInfo {
  return { x, z, title: 'Grass', rows: [], problems: [] };
}
