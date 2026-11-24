// Shared types for every module. This file is the contract between sim/, render/, input/, ui/,
// audio/ and platform/. Module code imports from here; it never redefines these shapes.

/** A tile coordinate. x runs east, z runs south. Tile (x, z) covers world [x, x+1] × [z, z+1]. */
export interface TilePos {
  x: number;
  z: number;
}

export enum Terrain {
  Grass = 0,
  Water = 1,
  Sand = 2,
}

/** What occupies a tile. Trees are a separate layer and only live on Empty land. */
export enum TileKind {
  Empty = 0,
  Road = 1,
  /** A zoned lot. `zone` says which kind, `level` says how built up it is (0 = still an empty lot). */
  Zone = 2,
  /** One tile of a placed service/utility building; `bld` holds the building's id. */
  Building = 3,
}

export enum ZoneType {
  None = 0,
  Res = 1,
  Com = 2,
  Ind = 3,
}

/** Bit flags in `tiles.problems`, recomputed by the simulation. The renderer draws an icon per flag. */
export enum Problem {
  None = 0,
  NoPower = 1,
  NoWater = 2,
  NoRoad = 4,
  Polluted = 8,
  /** A placed building that is not working (no road or no power). */
  Inactive = 16,
}

export type ServiceKind = 'police' | 'fire' | 'health' | 'education' | 'parks';
export const SERVICE_KINDS: readonly ServiceKind[] = ['police', 'fire', 'health', 'education', 'parks'];

export type BuildingType =
  | 'power_coal'
  | 'power_wind'
  | 'power_solar'
  | 'water_tower'
  | 'water_pump'
  | 'park_small'
  | 'park_plaza'
  | 'police'
  | 'fire'
  | 'clinic'
  | 'school'
  | 'hospital'
  | 'college'
  | 'stadium'
  | 'landmark';

/** Everything the player can hold in their hand. */
export type ToolId =
  | 'inspect'
  | 'road'
  | 'zone_res'
  | 'zone_com'
  | 'zone_ind'
  | 'bulldoze'
  | `build:${BuildingType}`;

/** 0 = paused. See config.DAY_SECONDS for how long a game day lasts at each speed. */
export type Speed = 0 | 1 | 2 | 3;

export type OverlayKind =
  | 'none'
  | 'power'
  | 'water'
  | 'pollution'
  | 'landValue'
  | 'police'
  | 'fire'
  | 'health'
  | 'education';

export type Quality = 'low' | 'medium' | 'high';

/** A service or utility building on the map. Its footprint is [x, x+w) × [z, z+h). */
export interface PlacedBuilding {
  id: number;
  type: BuildingType;
  x: number;
  z: number;
  w: number;
  h: number;
  /** 0..3 quarter turns, chosen so the front faces the nearest road when placed. */
  rot: number;
  /** Working this month: has a road touching it (if required) and power (if required). */
  active: boolean;
}

/**
 * Per-tile data, stored as flat typed arrays of length size*size (index = z * size + x).
 * Struct-of-arrays keeps the simulation fast and saves compact.
 */
export interface TileLayers {
  terrain: Uint8Array; // Terrain
  trees: Uint8Array; // 0 = none, 1..3 = tree clump variant
  kind: Uint8Array; // TileKind
  zone: Uint8Array; // ZoneType (only meaningful when kind == Zone)
  level: Uint8Array; // 0..3 development level of a zoned lot
  variant: Uint8Array; // 0..255 random look, re-rolled whenever a lot changes level
  bld: Int32Array; // building id for kind == Building, else -1
  distress: Uint8Array; // days a developed lot has gone without what it needs (drives decline)
  // ---- derived layers: written only by the simulation's recompute, read by everyone ----
  power: Uint8Array; // 1 = powered
  water: Uint8Array; // 1 = has water
  roadDist: Uint8Array; // Manhattan distance to the nearest road tile, capped at 255
  pollution: Uint8Array; // 0..255
  landValue: Uint8Array; // 0..255
  problems: Uint8Array; // Problem bit flags
  police: Uint8Array; // service coverage strength 0..255
  fire: Uint8Array;
  health: Uint8Array;
  education: Uint8Array;
  parks: Uint8Array;
}

export interface Demand {
  /** Each in -1..1. Positive means people want more of that zone. */
  res: number;
  com: number;
  ind: number;
}

export interface CityStats {
  population: number;
  /** Residents who want a job (population × WORKFORCE_RATIO). */
  workforce: number;
  jobsCom: number;
  jobsInd: number;
  /** 0..1 share of the workforce without a job. */
  unemployment: number;
  demand: Demand;
  /** 0..100 */
  happiness: number;
  powerSupply: number;
  powerDemand: number;
  waterSupply: number;
  waterDemand: number;
  /** Projected monthly figures at current taxes and upkeep (shown in the budget panel). */
  income: { res: number; com: number; ind: number; total: number };
  expenses: { roads: number; buildings: number; total: number };
  /** Counts of developed lots by zone, for the UI. */
  developed: { res: number; com: number; ind: number };
}

export interface MonthRecord {
  /** Game day (state.day) at the end of the month. */
  day: number;
  population: number;
  money: number;
  income: number;
  expenses: number;
  happiness: number;
}

export interface Taxes {
  /** Percent, 0..20 */
  res: number;
  com: number;
  ind: number;
}

/** One undoable player action: a snapshot of the tiles and buildings before it ran. */
export interface UndoRecord {
  tool: ToolId;
  spent: number;
  /** Tile index -> values of every non-derived layer before the change. */
  tiles: Array<{
    i: number;
    terrain: number;
    trees: number;
    kind: number;
    zone: number;
    level: number;
    variant: number;
    bld: number;
    distress: number;
  }>;
  /** Buildings that existed before the change and were removed by it. */
  removedBuildings: PlacedBuilding[];
  /** Ids of buildings the change created. */
  addedBuildingIds: number[];
}

export interface GameState {
  /** Save format version; see sim/save.ts. */
  version: number;
  name: string;
  seed: number;
  size: number;
  /** Days since the city was founded. A month is DAYS_PER_MONTH days, a year 12 months. */
  day: number;
  /** 0..1 cosmetic time of day (0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset). */
  timeOfDay: number;
  speed: Speed;
  money: number;
  taxes: Taxes;
  tiles: TileLayers;
  /** Indexed by building id; removed buildings leave a null so ids stay stable. */
  buildings: Array<PlacedBuilding | null>;
  stats: CityStats;
  /** Most recent last, at most HISTORY_MONTHS entries. */
  history: MonthRecord[];
  /** Index into config.MILESTONES of the highest milestone reached (0 = the starting one). */
  milestone: number;
  /** Months in a row the treasury has been below zero. */
  monthsInDebt: number;

  // ---- runtime only (never saved) ----
  /** Tiles whose look changed since the renderer last looked. The renderer clears it. */
  dirty: Set<number>;
  /** Bumped whenever anything about tiles/buildings changes, so caches can tell they are stale. */
  rev: { tiles: number; buildings: number; derived: number };
  /** Set by actions when the next recompute must rebuild coverage before the next day. */
  needsRecompute: boolean;
  undo: UndoRecord[];
}

/** The tiles a tool would touch, as shown while the player drags, and what it would cost. */
export interface Plan {
  tool: ToolId;
  /** Affected tile indices, in order (for roads: along the path). */
  tiles: number[];
  /** Parallel to `tiles`: true if that tile would actually change. */
  ok: boolean[];
  /** Total cost of the tiles that are ok. */
  cost: number;
  /** True if applying would do something and the city can afford it. */
  valid: boolean;
  /** Why the plan is not valid, in plain words, e.g. "Not enough money" or "Must touch water". */
  reason?: string;
  /** For building tools: the footprint the building would take. */
  building?: { type: BuildingType; x: number; z: number; w: number; h: number; rot: number };
}

export interface ApplyResult {
  ok: boolean;
  spent: number;
  message?: string;
  /** Tile indices that changed. */
  changed: number[];
}

export interface InfoRow {
  label: string;
  value: string;
  tone?: 'good' | 'bad' | 'neutral';
}

/** What the inspect panel shows for a tapped tile. */
export interface TileInfo {
  x: number;
  z: number;
  title: string;
  subtitle?: string;
  rows: InfoRow[];
  /** Plain-language problems, e.g. "No power: build a power plant nearby". */
  problems: string[];
  buildingId?: number;
}

export interface Settings {
  quality: Quality;
  /** 0..1 */
  sfxVolume: number;
  /** 0..1 */
  musicVolume: number;
  haptics: boolean;
  /** Show the first-time tips. */
  tips: boolean;
  /** Ids of tips already shown. */
  seenTips: string[];
}

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export type SfxId =
  | 'click'
  | 'tool'
  | 'road'
  | 'zone'
  | 'build'
  | 'bulldoze'
  | 'denied'
  | 'cash'
  | 'milestone'
  | 'grow'
  | 'undo'
  | 'open'
  | 'close'
  | 'month';
