// OWNER: sim agent. Public entry points of the simulation. Keep these signatures.
import { DAYS_PER_MONTH, DEFAULT_TAX, MAP_SIZE, MAX_TAX } from '../core/config';
import { createState, markAll } from '../core/state';
import type { GameState } from '../core/types';
import { checkMilestones, endOfMonth } from './economy';
import { growthPass } from './growth';
import { generateMap } from './mapgen';
import type { HappinessPart } from './recompute';
import { computeDemand as demandOf, HAPPINESS_PARTS, recompute as recomputeAll } from './recompute';
import { clamp, getCache } from './util';

/** Recompute at least this often (days); growth changes loads, coverage and stats. */
const RECOMPUTE_EVERY_DAYS = 3;
/** ...or sooner once this many lots changed level since the last one. */
const RECOMPUTE_AFTER_CHANGES = 24;
/** Share of the gap to the target happiness closed each day (≈ 80% over a month). */
const HAPPINESS_DAILY_STEP = 0.055;

/** A brand-new city on a freshly generated map (terrain, water, trees), with derived layers computed. */
export function newGame(seed: number, name = 'New City'): GameState {
  const state = createState(MAP_SIZE, seed, name);
  generateMap(state);
  recomputeAll(state);
  markAll(state);
  return state;
}

/** Advance the city by one game day: growth, decline, and at month end the budget and milestones. */
export function simulateDay(state: GameState): void {
  const c = getCache(state);
  if (state.needsRecompute || !c.computed) recomputeAll(state);

  state.day++;
  growthPass(state, c);

  // Happiness drifts towards where the city's conditions put it, so it never jumps.
  const h = state.stats.happiness;
  state.stats.happiness = clamp(h + (c.happinessTarget - h) * HAPPINESS_DAILY_STEP, 0, 100);
  // Keep the demand bars live between recomputes (growth updates the counters as it goes).
  state.stats.demand = demandOf(c.pop, c.jobsCom, c.jobsInd, state.stats.happiness, state.taxes);

  if (state.needsRecompute || state.day % RECOMPUTE_EVERY_DAYS === 0 || c.changesSinceRecompute >= RECOMPUTE_AFTER_CHANGES) {
    recomputeAll(state);
  }
  checkMilestones(state);
  if (state.day % DAYS_PER_MONTH === 0) {
    // The budget must use this month's final numbers.
    if (c.changesSinceRecompute > 0) recomputeAll(state);
    endOfMonth(state, c);
  }
}

/** Recompute every derived layer and state.stats right now (after loading, or after an action). */
export function recompute(state: GameState): void {
  recomputeAll(state);
}

/** Set one zone's tax (clamped to 0..MAX_TAX, whole percent) and refresh income and demand at once. */
export function setTax(state: GameState, zone: 'res' | 'com' | 'ind', percent: number): void {
  const v = Number.isFinite(percent) ? Math.round(percent) : DEFAULT_TAX;
  state.taxes[zone] = Math.min(MAX_TAX, Math.max(0, v));
  recomputeAll(state);
}

/**
 * What city happiness is made of right now, for a "why" panel: each entry is points added to (or taken
 * from) a base of 50, biggest effect first. `target` is where stats.happiness is heading.
 */
export function happinessBreakdown(state: GameState): { target: number; parts: Array<{ label: string; points: number }> } {
  const c = getCache(state);
  if (state.needsRecompute || !c.computed) recomputeAll(state);
  const labels: Record<HappinessPart, string> = {
    services: 'Services nearby',
    parks: 'Parks',
    landmarks: 'Plazas and landmarks',
    pollution: 'Pollution',
    jobs: 'Jobs',
    taxes: 'Taxes',
    utilities: 'Power and water',
  };
  const parts = HAPPINESS_PARTS.map((k) => ({ label: labels[k], points: Math.round(c.happinessParts[k] * 10) / 10 }))
    .filter((p) => p.points !== 0)
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  return { target: Math.round(c.happinessTarget), parts };
}

// Extra exports other modules may find useful.
export { describeTile } from './inspect';
export { applyPlan, canUndo, isUnlocked, planTool, undo } from './actions';
export { deserialize, serialize } from './save';
export { footprintDistance } from './util';
export { computeDemand } from './recompute';
export { buildableShare } from './mapgen';
