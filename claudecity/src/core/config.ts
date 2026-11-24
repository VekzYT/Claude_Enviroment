// Tunable numbers shared by more than one module. Feel-tuning that only one module needs lives there.

import type { RoadClass } from './types';

export const SAVE_VERSION = 1;
export const SAVE_SLOT = 'sonnetcoast';

// ---------- the map ----------
/** Side of the whole map (Sonnet Coast: the city and the wilderness around it) in metres. */
export const MAP_SIZE = 4096;
/** Cell size of CityMap.surface. */
export const SURF_CELL = 2;
/** Cell size of CityMap.district. */
export const DISTRICT_CELL = 16;
/** Cell size of the collider / prop / lane grids. */
export const GRID_CELL = 32;
export const LANE_WIDTH = 4;
/** Land, roads, bridges and boardwalks are at y = 0. The water surface is just below, everywhere. */
export const WATER_Y = -0.35;
/** The bed of deep water (things that leave the land sink to it) and of the shallow swamp. */
export const WATER_FLOOR = -5;
export const SWAMP_FLOOR = -0.8;
/** Height of a bridge deck above the land (boats pass under it). */
export const BRIDGE_H = 3.2;
/** A raised surface counts as ground only if it is no higher than this above where you are. */
export const STEP_UP = 0.75;

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
  /** Two-lane country road through the wilderness: no parking strip, no sidewalk. */
  rural: { lanes: 1, half: 4.5, walk: 0, speed: 24, median: 0 },
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
export const MAX_CRITTERS = 20;
export const MAX_SHOTS = 24;
export const MAX_PICKUPS = 96;
export const MAX_SMOKES = 4;

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

/** Seconds it takes to pull a driver out, and to break into a locked parked vehicle. */
export const JACK_TIME = 1.1;
export const BREAK_IN_TIME = 1.6;

// ---------- the Safety Flag level (heat) ----------
export const MAX_HEAT = 5;
/** Seconds out of sight before the level starts to drain, and per flag drained after that. */
export const HEAT_HIDE_DELAY = 6;
export const HEAT_COOL_PER_LEVEL = 9;
/** How far and how wide a police unit sees (the cone drawn on the minimap). */
export const POLICE_VIEW_RANGE = 75;
export const POLICE_VIEW_HALF_ANGLE = 0.6;

// ---------- money ----------
export const START_TOKENS = 500;
