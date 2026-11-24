// Tunable numbers shared by more than one module. Feel-tuning that only one module needs lives there.

import type { RoadClass } from './types';

export const SAVE_VERSION = 1;
export const SAVE_SLOT = 'claudecity';

// ---------- the city ----------
/** Side of the full city in metres. */
export const CITY_SIZE = 2048;
/** Cell size of CityMap.surface. */
export const SURF_CELL = 2;
/** Cell size of CityMap.district. */
export const DISTRICT_CELL = 16;
/** Cell size of the collider / prop / lane grids. */
export const GRID_CELL = 32;
export const LANE_WIDTH = 4;
/** Height of the water surface, and of the bed things fall to. Land and bridges are at y = 0. */
export const WATER_Y = -1.2;
export const WATER_FLOOR = -6;

export interface RoadSpec {
  /** Lanes per direction. */
  lanes: number;
  /** Half width of the roadway. Streets and avenues include a 2 m parking strip along each kerb. */
  half: number;
  /** Sidewalk width on each side. */
  walk: number;
  /** Speed limit, m/s. */
  speed: number;
  /** Half width of the central reservation (lane 0 starts this far from the centre line). */
  median: number;
}
export const ROADS: Record<RoadClass, RoadSpec> = {
  street: { lanes: 1, half: 6, walk: 3, speed: 14, median: 0 },
  avenue: { lanes: 2, half: 10, walk: 4, speed: 20, median: 0 },
  expressway: { lanes: 3, half: 14, walk: 0, speed: 34, median: 1 },
};

// ---------- time ----------
/** The simulation advances in fixed steps. */
export const SIM_DT = 1 / 60;
export const MAX_STEPS_PER_FRAME = 4;
/** Real seconds for one full day and night. */
export const DAY_SECONDS = 1200;
/** A new game starts in the late afternoon, so the first sunset comes a few minutes in. */
export const START_CLOCK = 0.68;

// ---------- pools ----------
export const MAX_VEHICLES = 40;
export const MAX_PEDS = 48;
export const MAX_DRONES = 12;
export const MAX_SHOTS = 24;
export const MAX_PICKUPS = 96;

// ---------- the player on foot ----------
export const GRAVITY = 24;
export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.8;
export const WALK_SPEED = 2.4;
export const RUN_SPEED = 6.8;
export const JUMP_SPEED = 7.6;
/** How close (to a vehicle's side) the player must be to get in. */
export const ENTER_RANGE = 3.0;
/** Seconds the get-in / get-out move takes. */
export const ENTER_TIME = 0.45;

// ---------- the pulse (a non-lethal stun shot) ----------
export const PULSE_SPEED = 70;
export const PULSE_LIFE = 0.9;
export const PULSE_COOLDOWN = 0.45;
/** Seconds a vehicle / drone / bot stays disabled when hit. */
export const PULSE_STUN = 4;

// ---------- heat ----------
export const MAX_HEAT = 5;
/** Seconds out of sight before heat starts to drain, and per level drained after that. */
export const HEAT_HIDE_DELAY = 6;
export const HEAT_COOL_PER_LEVEL = 9;

// ---------- money ----------
export const START_CREDITS = 500;
