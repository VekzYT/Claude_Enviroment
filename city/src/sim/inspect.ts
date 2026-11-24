// OWNER: sim agent. Plain-language description of a tile for the inspect panel.
import {
  COM_JOBS,
  COST_CLEAR_TREES,
  IND_JOBS,
  LEVEL_DESIRABILITY,
  POLLUTED_THRESHOLD,
  RES_CAPACITY,
  ROAD_REACH,
  ROAD_UPKEEP,
  WATER_FROM_LEVEL,
} from '../core/config';
import { BUILDINGS } from '../core/defs';
import type { GameState, InfoRow, PlacedBuilding, TileInfo } from '../core/types';
import { Terrain, TileKind, ZoneType } from '../core/types';
import { desirability, growthBlocker } from './growth';
import { recompute } from './recompute';
import type { SimCache } from './util';
import { formatMoney, getCache } from './util';

const LEVEL_NAMES: Record<number, string[]> = {
  [ZoneType.Res]: ['Empty lot', 'Cottage', 'Apartments', 'Tower'],
  [ZoneType.Com]: ['Empty lot', 'Corner Shop', 'Shopping Block', 'Office Tower'],
  [ZoneType.Ind]: ['Empty lot', 'Workshop', 'Factory', 'Industrial Works'],
};
const ZONE_NAMES: Record<number, string> = {
  [ZoneType.Res]: 'Homes',
  [ZoneType.Com]: 'Shops',
  [ZoneType.Ind]: 'Industry',
};
const SERVICE_LABEL: Record<string, string> = {
  police: 'Police',
  fire: 'Fire',
  health: 'Health',
  education: 'Education',
  parks: 'Parks',
};

/** Level name, e.g. "Cottage" (exported for the UI if it wants it). */
export function lotLevelName(zone: number, level: number): string {
  return LEVEL_NAMES[zone]?.[level] ?? 'Lot';
}

function word(v: number, lo: number, hi: number, words: [string, string, string]): string {
  return v < lo ? words[0] : v < hi ? words[1] : words[2];
}

export function landValueWord(v: number): string {
  return word(v, 85, 140, ['Low', 'Medium', 'High']);
}

function landValueRow(v: number): InfoRow {
  const w = landValueWord(v);
  return { label: 'Land value', value: w, tone: w === 'High' ? 'good' : 'neutral' };
}

/** `cares` is false for industry, which does not mind smoke. */
function pollutionRow(p: number, cares = true): InfoRow {
  if (p < 10) return { label: 'Pollution', value: 'Clean air', tone: cares ? 'good' : 'neutral' };
  if (p < 45) return { label: 'Pollution', value: 'A little', tone: 'neutral' };
  const value = p < POLLUTED_THRESHOLD ? 'Noticeable' : 'Heavy';
  return { label: 'Pollution', value, tone: cares ? 'bad' : 'neutral' };
}

function servicesRow(state: GameState, i: number): InfoRow {
  const T = state.tiles;
  const have: string[] = [];
  for (const k of ['police', 'fire', 'health', 'education', 'parks'] as const) if (T[k][i] >= 40) have.push(SERVICE_LABEL[k]);
  return { label: 'Nearby', value: have.length ? have.join(', ') : 'No services yet', tone: have.length >= 3 ? 'good' : 'neutral' };
}

function yesNo(label: string, v: boolean, no = 'No'): InfoRow {
  return { label, value: v ? 'Yes' : no, tone: v ? 'good' : 'bad' };
}

function supplyRows(c: SimCache, b: PlacedBuilding, rows: InfoRow[]) {
  const def = BUILDINGS[b.type];
  const used = c.supplyUsed.get(b.id) ?? 0;
  if (def.power) {
    rows.push({ label: 'Power supplied', value: b.active ? `${used} / ${def.power.capacity}` : `0 / ${def.power.capacity}`, tone: used >= def.power.capacity ? 'bad' : 'neutral' });
    rows.push({ label: 'Reach', value: `${def.power.radius} tiles` });
  }
  if (def.water) {
    rows.push({ label: 'Water supplied', value: b.active ? `${used} / ${def.water.capacity}` : `0 / ${def.water.capacity}`, tone: used >= def.water.capacity ? 'bad' : 'neutral' });
    rows.push({ label: 'Reach', value: `${def.water.radius} tiles` });
  }
}

/** Count developed lots and residents a service building's area covers (for "it serves N homes"). */
function coveredHomes(state: GameState, b: PlacedBuilding, radius: number): number {
  const T = state.tiles;
  const size = state.size;
  let homes = 0;
  const r = Math.ceil(radius);
  for (let z = Math.max(0, b.z - r); z <= Math.min(size - 1, b.z + b.h - 1 + r); z++) {
    for (let x = Math.max(0, b.x - r); x <= Math.min(size - 1, b.x + b.w - 1 + r); x++) {
      const i = z * size + x;
      if (T.kind[i] !== TileKind.Zone || T.level[i] === 0 || T.zone[i] !== ZoneType.Res) continue;
      const dx = x < b.x ? b.x - x : x > b.x + b.w - 1 ? x - (b.x + b.w - 1) : 0;
      const dz = z < b.z ? b.z - z : z > b.z + b.h - 1 ? z - (b.z + b.h - 1) : 0;
      if (dx * dx + dz * dz < radius * radius) homes++;
    }
  }
  return homes;
}

function noPowerText(c: SimCache, i: number): string {
  if (c.powerProducers.length === 0) return 'No power: place a power plant within reach.';
  if (c.powerSrc[i] >= 0) return 'No power: the power plants in reach are full. Build another plant nearby.';
  return 'No power: out of reach of your power plants. Build one closer.';
}

function describeBuilding(state: GameState, c: SimCache, b: PlacedBuilding, info: TileInfo) {
  const def = BUILDINGS[b.type];
  info.title = def.name;
  info.subtitle = def.blurb;
  info.buildingId = b.id;
  const roadOk = c.roadOk.get(b.id) ?? true;
  const powered = c.powered.get(b.id) ?? true;
  info.rows.push({ label: 'Status', value: b.active ? 'Working' : 'Not working', tone: b.active ? 'good' : 'bad' });
  supplyRows(c, b, info.rows);
  if (def.service) {
    const homes = coveredHomes(state, b, def.service.radius);
    info.rows.push({ label: 'Covers', value: `${def.service.radius} tiles around it` });
    info.rows.push({ label: 'Homes served', value: b.active ? String(homes) : '0' });
  }
  if (def.landValue) info.rows.push({ label: 'Lifts land value', value: `${def.landValue.radius} tiles around it`, tone: 'good' });
  if (def.happiness) info.rows.push({ label: 'City happiness', value: `+${def.happiness}`, tone: 'good' });
  if (def.pollution) info.rows.push({ label: 'Pollution', value: def.pollution.amount >= 150 ? 'Heavy' : 'Some', tone: 'bad' });
  const running = c.upkeep.get(b.id) ?? def.upkeep;
  info.rows.push({
    label: 'Upkeep',
    value: def.power || def.water ? `${formatMoney(running)} / month (up to ${formatMoney(def.upkeep)} at full load)` : `${formatMoney(running)} / month`,
  });

  if (def.needsRoad && !roadOk) info.problems.push('No road: lay a road along one of its sides.');
  if (def.needsPower && !powered) {
    if (!roadOk) info.problems.push('No power: it needs a road before it can draw power.');
    else info.problems.push(noPowerText(c, b.z * state.size + b.x));
  }
  if (def.power && b.active) {
    const used = c.supplyUsed.get(b.id) ?? 0;
    if (used >= def.power.capacity * 0.98) info.problems.push('At full capacity: build another power plant.');
  }
  if (def.water && b.active) {
    const used = c.supplyUsed.get(b.id) ?? 0;
    if (used >= def.water.capacity * 0.98) info.problems.push('At full capacity: build another water tower or a pump.');
  }
}

function describeLot(state: GameState, c: SimCache, i: number, info: TileInfo) {
  const T = state.tiles;
  const z = T.zone[i];
  const L = T.level[i];
  const zoneName = ZONE_NAMES[z] ?? 'Zone';
  const roadOk = T.roadDist[i] <= ROAD_REACH;
  const demand = z === ZoneType.Res ? state.stats.demand.res : z === ZoneType.Com ? state.stats.demand.com : state.stats.demand.ind;

  if (L === 0) {
    info.title = `${zoneName} lot`;
    info.subtitle = 'Zoned and waiting to be built on.';
  } else {
    info.title = lotLevelName(z, L);
    info.subtitle = `${zoneName}, level ${L} of 3`;
    if (z === ZoneType.Res) info.rows.push({ label: 'Residents', value: String(RES_CAPACITY[L] ?? 0) });
    else if (z === ZoneType.Com) info.rows.push({ label: 'Jobs', value: String(COM_JOBS[L] ?? 0) });
    else info.rows.push({ label: 'Jobs', value: String(IND_JOBS[L] ?? 0) });
  }
  info.rows.push(landValueRow(T.landValue[i]));
  info.rows.push(yesNo('Power', T.power[i] === 1));
  if (L > 0 || T.water[i]) {
    info.rows.push(
      L >= WATER_FROM_LEVEL || T.water[i]
        ? yesNo('Water', T.water[i] === 1)
        : { label: 'Water', value: 'No (needed to grow)', tone: 'neutral' },
    );
  }
  info.rows.push(pollutionRow(T.pollution[i], z !== ZoneType.Ind));
  info.rows.push(servicesRow(state, i));

  // Problems: what is wrong now, then what stops it growing.
  if (!roadOk) info.problems.push(`No road within ${ROAD_REACH} tiles: lay a road closer.`);
  if (!T.power[i]) info.problems.push(noPowerText(c, i));
  if (L >= WATER_FROM_LEVEL && !T.water[i]) {
    info.problems.push(
      c.waterSrc[i] >= 0
        ? 'No water: the water supply here is used up. Add a water tower or pump, or this building will shrink.'
        : 'No water: build a water tower within reach, or this building will shrink.',
    );
  }
  if (z === ZoneType.Res && L > 0 && T.pollution[i] >= POLLUTED_THRESHOLD) {
    info.problems.push('Too much pollution: keep factories and power plants away from homes.');
  }
  if (T.distress[i] > 0 && L > 0) info.problems.push('Struggling: if this goes on it will drop a level.');

  if (L < 3 && roadOk && T.power[i]) {
    const blocker = growthBlocker(state, c, i);
    if (blocker === 'powerCap') info.problems.push('Power plants nearby are full: build another to let it grow.');
    else if (blocker === 'water') info.problems.push('Needs water to grow bigger: build a water tower within reach.');
    else if (blocker === 'waterCap') info.problems.push('Water supply nearby is used up: add another water tower.');
    else if (blocker === 'desire') {
      const des = desirability(state, c, i, z);
      const need = LEVEL_DESIRABILITY[L + 1];
      if (z === ZoneType.Res) info.problems.push('Wants a nicer area to grow: add parks and services, keep pollution away.');
      else if (z === ZoneType.Com) info.problems.push('Wants more customers and higher land value to grow.');
      else info.problems.push('Wants a road right beside it and fire and police cover to grow.');
      if (des < need - 0.3) info.rows.push({ label: 'Appeal', value: 'Low', tone: 'bad' });
    } else if (blocker === null && demand <= 0) {
      info.problems.push(`Not much demand for ${zoneName.toLowerCase()} right now.`);
    }
  }
}

export function describeTile(state: GameState, x: number, z: number): TileInfo {
  const info: TileInfo = { x, z, title: 'Grass', rows: [], problems: [] };
  if (!Number.isInteger(x) || !Number.isInteger(z) || x < 0 || z < 0 || x >= state.size || z >= state.size) {
    info.title = 'Off the map';
    return info;
  }
  const c = getCache(state);
  if (!c.computed || state.needsRecompute) recompute(state);
  const T = state.tiles;
  const i = z * state.size + x;
  const k = T.kind[i];

  if (T.terrain[i] === Terrain.Water) {
    info.title = 'Water';
    info.subtitle = 'Nothing can be built on water. Homes near it are worth more.';
    info.rows.push({ label: 'Water pumps', value: 'Must touch it' });
    return info;
  }

  if (k === TileKind.Building) {
    const b = state.buildings[T.bld[i]];
    if (b) {
      describeBuilding(state, c, b, info);
      return info;
    }
  }
  if (k === TileKind.Zone) {
    describeLot(state, c, i, info);
    return info;
  }
  if (k === TileKind.Road) {
    info.title = 'Road';
    info.subtitle = `Zones within ${ROAD_REACH} tiles can develop.`;
    info.rows.push({ label: 'Upkeep', value: `${formatMoney(ROAD_UPKEEP)} / month` });
    info.rows.push(pollutionRow(T.pollution[i]));
    return info;
  }

  // Open land.
  if (T.trees[i]) {
    info.title = T.trees[i] >= 3 ? 'Woods' : T.trees[i] === 2 ? 'Copse' : 'Trees';
    info.subtitle = 'Trees clean the air and lift land value nearby.';
    info.rows.push({ label: 'Clearing', value: `${formatMoney(COST_CLEAR_TREES)} extra to build here` });
  } else if (T.terrain[i] === Terrain.Sand) {
    info.title = 'Sandy shore';
    info.subtitle = 'Open land by the water, good for building.';
  } else {
    info.title = 'Grass';
    info.subtitle = 'Open land, ready to build on.';
  }
  info.rows.push(landValueRow(T.landValue[i]));
  info.rows.push({ label: 'Power reach', value: T.power[i] ? 'Yes' : 'No', tone: T.power[i] ? 'good' : 'neutral' });
  info.rows.push({ label: 'Water reach', value: T.water[i] ? 'Yes' : 'No', tone: T.water[i] ? 'good' : 'neutral' });
  info.rows.push({ label: 'Road', value: T.roadDist[i] === 0 ? 'Here' : T.roadDist[i] <= ROAD_REACH ? 'Close by' : 'Too far to zone', tone: T.roadDist[i] <= ROAD_REACH ? 'good' : 'neutral' });
  if (T.pollution[i] >= 10) info.rows.push(pollutionRow(T.pollution[i]));
  return info;
}
