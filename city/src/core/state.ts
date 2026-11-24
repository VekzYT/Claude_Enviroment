// Creating a blank GameState and small helpers every module uses to read and mark tiles.

import { DEFAULT_TAX, MAP_SIZE, SAVE_VERSION, START_MONEY } from './config';
import type { CityStats, GameState, TileLayers } from './types';

export function createTileLayers(size: number): TileLayers {
  const n = size * size;
  const bld = new Int32Array(n);
  bld.fill(-1);
  return {
    terrain: new Uint8Array(n),
    trees: new Uint8Array(n),
    kind: new Uint8Array(n),
    zone: new Uint8Array(n),
    level: new Uint8Array(n),
    variant: new Uint8Array(n),
    bld,
    distress: new Uint8Array(n),
    power: new Uint8Array(n),
    water: new Uint8Array(n),
    roadDist: new Uint8Array(n).fill(255),
    pollution: new Uint8Array(n),
    landValue: new Uint8Array(n),
    problems: new Uint8Array(n),
    police: new Uint8Array(n),
    fire: new Uint8Array(n),
    health: new Uint8Array(n),
    education: new Uint8Array(n),
    parks: new Uint8Array(n),
  };
}

/** Layers the player's actions change (saved, undone). The rest are recomputed by the simulation. */
export const PRIMARY_LAYERS = ['terrain', 'trees', 'kind', 'zone', 'level', 'variant', 'bld', 'distress'] as const;
/** Layers recomputed from the primary ones (never saved). */
export const DERIVED_LAYERS = [
  'power',
  'water',
  'roadDist',
  'pollution',
  'landValue',
  'problems',
  'police',
  'fire',
  'health',
  'education',
  'parks',
] as const;

export function emptyStats(): CityStats {
  return {
    population: 0,
    workforce: 0,
    jobsCom: 0,
    jobsInd: 0,
    unemployment: 0,
    demand: { res: 0, com: 0, ind: 0 },
    happiness: 50,
    powerSupply: 0,
    powerDemand: 0,
    waterSupply: 0,
    waterDemand: 0,
    income: { res: 0, com: 0, ind: 0, total: 0 },
    expenses: { roads: 0, buildings: 0, total: 0 },
    developed: { res: 0, com: 0, ind: 0 },
  };
}

/** A flat, all-grass map with no city on it. sim/index.ts `newGame` fills in terrain. */
export function createState(size: number = MAP_SIZE, seed = 1, name = 'New City'): GameState {
  return {
    version: SAVE_VERSION,
    name,
    seed,
    size,
    day: 0,
    timeOfDay: 0.35,
    speed: 1,
    money: START_MONEY,
    taxes: { res: DEFAULT_TAX, com: DEFAULT_TAX, ind: DEFAULT_TAX },
    tiles: createTileLayers(size),
    buildings: [],
    stats: emptyStats(),
    history: [],
    milestone: 0,
    monthsInDebt: 0,
    dirty: new Set(),
    rev: { tiles: 0, buildings: 0, derived: 0 },
    needsRecompute: true,
    undo: [],
  };
}

export function idx(state: GameState, x: number, z: number): number {
  return z * state.size + x;
}

export function inBounds(state: GameState, x: number, z: number): boolean {
  return x >= 0 && z >= 0 && x < state.size && z < state.size;
}

export function tileX(state: GameState, i: number): number {
  return i % state.size;
}

export function tileZ(state: GameState, i: number): number {
  return Math.floor(i / state.size);
}

/** Record that tile i looks different now. Call after changing any primary layer of a tile. */
export function markTile(state: GameState, i: number): void {
  state.dirty.add(i);
  state.rev.tiles++;
}

/** Mark every tile dirty (after loading a save or starting a new city). */
export function markAll(state: GameState): void {
  const n = state.size * state.size;
  for (let i = 0; i < n; i++) state.dirty.add(i);
  state.rev.tiles++;
  state.rev.buildings++;
  state.rev.derived++;
}

/**
 * How dark it is for a cosmetic time of day: 0 in full daylight, 1 in deep night, smooth through
 * dawn (~0.25) and dusk (~0.75). Renderer uses it for lighting, audio for crickets.
 */
export function nightAmount(timeOfDay: number): number {
  const sun = Math.sin((timeOfDay - 0.25) * Math.PI * 2); // 1 at noon, -1 at midnight
  return Math.min(1, Math.max(0, (0.15 - sun) / 0.4));
}

/** Calendar helpers. */
export function monthIndex(day: number, daysPerMonth = 30): number {
  return Math.floor(day / daysPerMonth) % 12;
}
export function yearNumber(day: number, daysPerMonth = 30): number {
  return Math.floor(day / (daysPerMonth * 12)) + 1;
}
