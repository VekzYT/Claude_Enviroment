// OWNER: sim agent. Public entry points of the simulation. Keep these signatures.
import type { GameState } from '../core/types';
import { createState } from '../core/state';

/** A brand-new city on a freshly generated map (terrain, water, trees), with derived layers computed. */
export function newGame(seed: number, name = 'New City'): GameState {
  return createState(undefined, seed, name);
}

/** Advance the city by one game day: growth, decline, and at month end the budget and milestones. */
export function simulateDay(_state: GameState): void {}

/** Recompute every derived layer and state.stats right now (after loading, or after an action). */
export function recompute(_state: GameState): void {}
