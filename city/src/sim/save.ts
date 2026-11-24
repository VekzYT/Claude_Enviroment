// OWNER: sim agent. Save files are JSON text; typed arrays are stored as base64.
import type { GameState } from '../core/types';

export function serialize(_state: GameState): string {
  return '{}';
}

/** Rebuilds a full GameState (derived layers recomputed). Throws an Error with a readable message if the text is not a valid save. */
export function deserialize(_text: string): GameState {
  throw new Error('not implemented');
}
