// Tunable numbers. Balance lives here so it can be adjusted without touching logic.
// The simulation reads these; the UI shows some of them (costs, milestone names).

import type { Speed } from './types';

export const SAVE_VERSION = 1;

/** Tiles per map side. */
export const MAP_SIZE = 64;

export const START_MONEY = 25000;
export const DEFAULT_TAX = 9;
export const MAX_TAX = 20;

/** Real seconds per game day at each speed (index = Speed). Speed 0 is paused. */
export const DAY_SECONDS: Record<Speed, number> = { 0: Infinity, 1: 0.6, 2: 0.25, 3: 0.08 };
export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Real seconds for one full cosmetic day/night cycle at speed 1 (faster speeds scale it). */
export const DAY_CYCLE_SECONDS = 240;
/** How many month records state.history keeps. */
export const HISTORY_MONTHS = 36;

// ---------- Tool costs (per tile) ----------
export const COST_ROAD = 10;
export const COST_ZONE = 5;
/** Clearing trees is added to any tool that builds on a wooded tile. */
export const COST_CLEAR_TREES = 3;
export const COST_BULLDOZE_ROAD = 5;
export const COST_BULLDOZE_LOT_PER_LEVEL = 15;
export const COST_BULLDOZE_TREES = 3;
/** Demolishing a placed building costs this share of its build price. */
export const BULLDOZE_BUILDING_SHARE = 0.1;
/** How many actions the undo button can take back. Undo refunds the full cost. */
export const UNDO_STACK_SIZE = 20;

// ---------- Zones ----------
/** Residents per residential lot by level (index = level). */
export const RES_CAPACITY = [0, 6, 18, 45];
/** Jobs per commercial lot by level. */
export const COM_JOBS = [0, 4, 12, 30];
/** Jobs per industrial lot by level. */
export const IND_JOBS = [0, 6, 16, 32];
/** Power units a lot draws, by zone (index = ZoneType) then level. */
export const POWER_USE = [
  [0, 0, 0, 0],
  [0, 1, 2, 4], // Res
  [0, 2, 4, 7], // Com
  [0, 3, 6, 10], // Ind
];
/** Water units a lot draws, by zone then level. */
export const WATER_USE = [
  [0, 0, 0, 0],
  [0, 1, 2, 4],
  [0, 1, 3, 5],
  [0, 2, 4, 7],
];
/** A lot can develop only if a road is within this Manhattan distance. */
export const ROAD_REACH = 3;
/** Level 2 and above need water; level 1 needs only power and a road. */
export const WATER_FROM_LEVEL = 2;
/** Desirability (0..1) a lot needs to reach each level (index = target level). */
export const LEVEL_DESIRABILITY = [0, 0, 0.35, 0.6];
/** Base chance per day that a qualifying lot grows one level, scaled by demand and desirability. */
export const GROWTH_CHANCE = 0.05;
/** Days of unmet needs before a developed lot drops a level. */
export const DECLINE_DAYS = 25;

// ---------- Population & demand ----------
export const WORKFORCE_RATIO = 0.6;
/** Demand that exists before anything is built, so the first houses and factories appear. */
export const BASE_RES_DEMAND = 40;
export const BASE_IND_DEMAND = 20;
/** Commerce the population wants, in jobs per resident. */
export const COM_PER_RESIDENT = 0.22;
/** Industry the workforce wants, in jobs per worker. */
export const IND_PER_WORKER = 0.55;
/** Each tax point above DEFAULT_TAX lowers that zone's demand by this much (and raises it below). */
export const TAX_DEMAND_EFFECT = 0.05;

// ---------- Economy (monthly) ----------
/** Monthly income per resident / per job at 1% tax. */
export const TAX_PER_RESIDENT = 0.1;
export const TAX_PER_COM_JOB = 0.14;
export const TAX_PER_IND_JOB = 0.12;
export const ROAD_UPKEEP = 1;

// ---------- Land value & pollution ----------
export const LAND_VALUE_BASE = 60;
export const LAND_VALUE_WATERFRONT = 40; // within 3 tiles of water
export const LAND_VALUE_TREES = 10; // trees within 2 tiles
/** Pollution an industrial lot emits at its own tile, by level; it fades out over INDUSTRY_POLLUTION_RADIUS. */
export const INDUSTRY_POLLUTION = [0, 30, 50, 70];
export const INDUSTRY_POLLUTION_RADIUS = 4;
/** Pollution at which the Polluted problem flag is raised on residential lots. */
export const POLLUTED_THRESHOLD = 90;

// ---------- Milestones ----------
export interface Milestone {
  name: string;
  population: number;
  reward: number;
}
export const MILESTONES: Milestone[] = [
  { name: 'Settlement', population: 0, reward: 0 },
  { name: 'Hamlet', population: 150, reward: 1000 },
  { name: 'Village', population: 400, reward: 2500 },
  { name: 'Town', population: 1000, reward: 5000 },
  { name: 'Small City', population: 2500, reward: 10000 },
  { name: 'City', population: 6000, reward: 20000 },
  { name: 'Metropolis', population: 12000, reward: 50000 },
];

// ---------- Visual-only numbers shared by render and main ----------
export const MAX_CARS = 160;
/** Cars on the road for a given population and job count. */
export function carCount(population: number, jobs: number): number {
  return Math.min(MAX_CARS, Math.floor(population / 25 + jobs / 40));
}
