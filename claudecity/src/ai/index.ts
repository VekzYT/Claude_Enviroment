// OWNER: ai. Everyone who is not the player: traffic, people on the sidewalks, security and heat.
// It spawns and removes them around the player and writes their inputs; src/sim moves vehicles.
import type { CityMap, GameState } from '../core/types';

/** Call once per fixed step, before stepGame. PLACEHOLDER: does nothing. */
export function stepAI(game: GameState, map: CityMap, dt: number): void {
  void game; void map; void dt;
}

/** Forget everything (after a new game or a load). */
export function resetAI(game: GameState, map: CityMap): void {
  void game; void map;
}
