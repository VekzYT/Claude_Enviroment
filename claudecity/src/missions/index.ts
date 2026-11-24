// OWNER: missions. Jobs, dialogue, rewards, the garage, and what gets saved.
import type { CityMap, GameState } from '../core/types';

/** Call once per fixed step, after stepGame. PLACEHOLDER: does nothing. */
export function stepMissions(game: GameState, map: CityMap, dt: number): void {
  void game; void map; void dt;
}

/** The saved game as text. PLACEHOLDER. */
export function serializeProgress(game: GameState): string {
  return JSON.stringify({ v: game.version, progress: game.progress });
}

/** Load saved text into a fresh game. Returns false (and changes nothing) if it is not valid. PLACEHOLDER. */
export function loadProgress(game: GameState, text: string): boolean {
  void game; void text;
  return false;
}
