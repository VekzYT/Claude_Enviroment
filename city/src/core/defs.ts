// The catalog of placeable buildings and the toolbar layout. UI, sim and render all read this.

import type { BuildingType, ServiceKind, ToolId } from './types';

export interface BuildingDef {
  type: BuildingType;
  name: string;
  /** One line for the toolbar card / inspect panel. */
  blurb: string;
  /** Footprint in tiles (square). */
  size: number;
  cost: number;
  /** Monthly upkeep. */
  upkeep: number;
  /** Population needed before it can be built. 0 = available from the start. */
  unlockPop: number;
  needsRoad: boolean;
  needsPower: boolean;
  /** Power plants: units supplied and the reach in tiles (measured from the footprint's edge). */
  power?: { capacity: number; radius: number };
  /** Water buildings: units supplied and the reach in tiles. */
  water?: { capacity: number; radius: number };
  /** Must have a water tile touching its footprint (orthogonally). */
  needsWaterEdge?: boolean;
  /** Service coverage: strength fades linearly from full at the footprint to zero at `radius`. */
  service?: { kind: ServiceKind; radius: number };
  /** Pollution emitted at the footprint, fading to zero at `radius`. */
  pollution?: { amount: number; radius: number };
  /** Extra land value (0..255 scale) added at the footprint, fading out over `radius`. */
  landValue?: { amount: number; radius: number };
  /** Added to city-wide happiness (points) while active. */
  happiness?: number;
}

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  power_coal: {
    type: 'power_coal',
    name: 'Coal Power Plant',
    blurb: 'Lots of power, lots of smoke.',
    size: 3,
    cost: 4000,
    upkeep: 160,
    unlockPop: 0,
    needsRoad: true,
    needsPower: false,
    power: { capacity: 600, radius: 16 },
    pollution: { amount: 200, radius: 7 },
  },
  power_wind: {
    type: 'power_wind',
    name: 'Wind Turbine',
    blurb: 'Clean power for a small area.',
    size: 1,
    cost: 800,
    upkeep: 20,
    unlockPop: 400,
    needsRoad: false,
    needsPower: false,
    power: { capacity: 60, radius: 7 },
  },
  power_solar: {
    type: 'power_solar',
    name: 'Solar Farm',
    blurb: 'Clean power with a wide reach.',
    size: 2,
    cost: 6000,
    upkeep: 90,
    unlockPop: 2500,
    needsRoad: true,
    needsPower: false,
    power: { capacity: 400, radius: 13 },
  },
  water_tower: {
    type: 'water_tower',
    name: 'Water Tower',
    blurb: 'Water for the blocks around it.',
    size: 1,
    cost: 600,
    upkeep: 30,
    unlockPop: 0,
    needsRoad: true,
    needsPower: true,
    water: { capacity: 150, radius: 9 },
  },
  water_pump: {
    type: 'water_pump',
    name: 'Water Pump',
    blurb: 'Big water supply. Must touch a lake or river.',
    size: 2,
    cost: 3000,
    upkeep: 120,
    unlockPop: 400,
    needsRoad: true,
    needsPower: true,
    needsWaterEdge: true,
    water: { capacity: 700, radius: 15 },
  },
  park_small: {
    type: 'park_small',
    name: 'Small Park',
    blurb: 'Trees and a bench. Neighbours love it.',
    size: 1,
    cost: 150,
    upkeep: 5,
    unlockPop: 0,
    needsRoad: false,
    needsPower: false,
    service: { kind: 'parks', radius: 4 },
    landValue: { amount: 30, radius: 4 },
  },
  park_plaza: {
    type: 'park_plaza',
    name: 'Town Plaza',
    blurb: 'A fountain square that lifts the whole area.',
    size: 2,
    cost: 1500,
    upkeep: 25,
    unlockPop: 1000,
    needsRoad: true,
    needsPower: false,
    service: { kind: 'parks', radius: 8 },
    landValue: { amount: 50, radius: 8 },
    happiness: 2,
  },
  police: {
    type: 'police',
    name: 'Police Station',
    blurb: 'Keeps the streets around it safe.',
    size: 2,
    cost: 1800,
    upkeep: 40,
    unlockPop: 150,
    needsRoad: true,
    needsPower: true,
    service: { kind: 'police', radius: 12 },
  },
  fire: {
    type: 'fire',
    name: 'Fire Station',
    blurb: 'Fire cover for the blocks around it.',
    size: 2,
    cost: 1800,
    upkeep: 40,
    unlockPop: 150,
    needsRoad: true,
    needsPower: true,
    service: { kind: 'fire', radius: 12 },
  },
  clinic: {
    type: 'clinic',
    name: 'Clinic',
    blurb: 'Healthcare for a neighbourhood.',
    size: 2,
    cost: 2500,
    upkeep: 50,
    unlockPop: 400,
    needsRoad: true,
    needsPower: true,
    service: { kind: 'health', radius: 11 },
  },
  school: {
    type: 'school',
    name: 'School',
    blurb: 'Education makes better neighbourhoods.',
    size: 2,
    cost: 2500,
    upkeep: 50,
    unlockPop: 400,
    needsRoad: true,
    needsPower: true,
    service: { kind: 'education', radius: 11 },
  },
  hospital: {
    type: 'hospital',
    name: 'Hospital',
    blurb: 'Healthcare for half the city.',
    size: 3,
    cost: 7000,
    upkeep: 180,
    unlockPop: 2500,
    needsRoad: true,
    needsPower: true,
    service: { kind: 'health', radius: 20 },
  },
  college: {
    type: 'college',
    name: 'College',
    blurb: 'Education for half the city.',
    size: 3,
    cost: 8000,
    upkeep: 190,
    unlockPop: 2500,
    needsRoad: true,
    needsPower: true,
    service: { kind: 'education', radius: 20 },
  },
  stadium: {
    type: 'stadium',
    name: 'Stadium',
    blurb: 'Game nights make the whole city happier.',
    size: 4,
    cost: 15000,
    upkeep: 300,
    unlockPop: 6000,
    needsRoad: true,
    needsPower: true,
    landValue: { amount: 40, radius: 12 },
    happiness: 8,
  },
  landmark: {
    type: 'landmark',
    name: 'Sky Tower',
    blurb: 'A landmark everyone wants to live near.',
    size: 2,
    cost: 25000,
    upkeep: 100,
    unlockPop: 12000,
    needsRoad: true,
    needsPower: true,
    landValue: { amount: 80, radius: 16 },
    happiness: 5,
  },
};

export const BUILDING_TYPES = Object.keys(BUILDINGS) as BuildingType[];

/** The bottom toolbar: each category opens a tray of tools. */
export interface ToolCategory {
  id: string;
  label: string;
  tools: ToolId[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  { id: 'roads', label: 'Roads', tools: ['road'] },
  { id: 'zones', label: 'Zones', tools: ['zone_res', 'zone_com', 'zone_ind'] },
  { id: 'utilities', label: 'Utilities', tools: ['build:power_coal', 'build:power_wind', 'build:power_solar', 'build:water_tower', 'build:water_pump'] },
  { id: 'services', label: 'Services', tools: ['build:police', 'build:fire', 'build:clinic', 'build:school', 'build:hospital', 'build:college'] },
  { id: 'fun', label: 'Parks', tools: ['build:park_small', 'build:park_plaza', 'build:stadium', 'build:landmark'] },
  { id: 'bulldoze', label: 'Bulldoze', tools: ['bulldoze'] },
];

export interface ToolInfo {
  name: string;
  blurb: string;
  /** Cost shown on the card. For drag tools this is per tile. */
  cost: number;
  perTile: boolean;
  unlockPop: number;
}

const BASIC_TOOLS: Record<string, ToolInfo> = {
  inspect: { name: 'Look', blurb: 'Tap anything to see how it is doing.', cost: 0, perTile: false, unlockPop: 0 },
  road: { name: 'Road', blurb: 'Drag to lay road. Zones need a road within 3 tiles.', cost: 10, perTile: true, unlockPop: 0 },
  zone_res: { name: 'Homes', blurb: 'Drag to zone housing (green).', cost: 5, perTile: true, unlockPop: 0 },
  zone_com: { name: 'Shops', blurb: 'Drag to zone shops and offices (blue).', cost: 5, perTile: true, unlockPop: 0 },
  zone_ind: { name: 'Industry', blurb: 'Drag to zone factories (yellow). They pollute.', cost: 5, perTile: true, unlockPop: 0 },
  bulldoze: { name: 'Bulldoze', blurb: 'Drag over anything to clear it.', cost: 0, perTile: true, unlockPop: 0 },
};

export function toolInfo(tool: ToolId): ToolInfo {
  if (tool.startsWith('build:')) {
    const def = BUILDINGS[tool.slice(6) as BuildingType];
    return { name: def.name, blurb: def.blurb, cost: def.cost, perTile: false, unlockPop: def.unlockPop };
  }
  return BASIC_TOOLS[tool];
}

export function buildingTypeOf(tool: ToolId): BuildingType | null {
  return tool.startsWith('build:') ? (tool.slice(6) as BuildingType) : null;
}

/** Zone colours (also used by render for lot tints and by the UI for the demand bars). */
export const ZONE_COLORS = {
  res: '#4cc764',
  com: '#3d8bff',
  ind: '#f2b632',
} as const;
