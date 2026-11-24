// OWNER: sim agent. The daily growth/decline pass over zoned lots, and lot desirability.

import {
  COM_JOBS,
  DECLINE_DAYS,
  GROWTH_CHANCE,
  IND_JOBS,
  LEVEL_DESIRABILITY,
  POWER_USE,
  RES_CAPACITY,
  ROAD_REACH,
  WATER_FROM_LEVEL,
  WATER_USE,
} from '../core/config';
import { emit } from '../core/events';
import { hash01 } from '../core/rng';
import { markTile } from '../core/state';
import type { Demand, GameState } from '../core/types';
import { TileKind, ZoneType } from '../core/types';
import { computeDemand } from './recompute';
import type { SimCache } from './util';
import { clamp } from './util';

/** A developed lot whose desirability falls this far below its level's requirement is unhappy (decline). */
export const DESIRABILITY_SLACK = 0.12;
/** Growth pace by target level: bigger buildings take longer to appear. */
const LEVEL_PACE = [0, 2.0, 0.3, 0.38];
/** Below this demand, developed lots of that zone may empty out and drop a level. */
const ABANDON_DEMAND = -0.3;
/** Daily chance a lot drops a level at demand -1 (scaled down linearly to 0 at ABANDON_DEMAND). */
const ABANDON_RATE = 0.008;
/** Below this happiness, residents start moving away (homes drop levels, faster the unhappier). */
export const UNHAPPY_HAPPINESS = 35;
/** At most this many 'grew' events per day (the rest change silently), so sounds stay sparse. */
const GREW_EVENTS_PER_DAY = 3;
/** Residents nearby that make a shop lot fully attractive. */
const SHOP_CATCHMENT = 400;

export interface DesirabilityParts {
  value: number;
  landValue: number;
  pollution: number;
  services: number;
  parks: number;
}

/** How much a lot of the given zone wants to be here, 0..1, from the derived layers. */
export function desirability(state: GameState, c: SimCache, i: number, zone: number): number {
  const T = state.tiles;
  const lv = T.landValue[i] / 255;
  const pol = T.pollution[i] / 255;
  const svc = (T.police[i] + T.fire[i] + T.health[i] + T.education[i]) / (4 * 255);
  if (zone === ZoneType.Res) {
    // Homes: land value (which already counts parks, services and pollution), plus services, and they
    // hate pollution on top of what it does to land value.
    return clamp(0.06 + 1.1 * lv + 0.12 * svc + 0.08 * (T.parks[i] / 255) - 0.6 * pol, 0, 1);
  }
  if (zone === ZoneType.Com) {
    // Shops: land value and customers living nearby.
    const people = Math.min(1, c.popNear[i] / SHOP_CATCHMENT);
    return clamp(0.12 + 0.9 * lv + 0.35 * people + 0.05 * svc, 0, 1);
  }
  if (zone === ZoneType.Ind) {
    // Industry: shrugs at pollution, likes being right on a road and having fire and police cover.
    const rd = T.roadDist[i];
    const road = rd <= 1 ? 1 : rd === 2 ? 0.55 : 0.25;
    const safety = (T.fire[i] + T.police[i]) / (2 * 255);
    const lvClean = Math.min(1, (T.landValue[i] + T.pollution[i] * 0.7) / 255);
    return clamp(0.2 + 0.22 * road + 0.25 * safety + 0.3 * lvClean, 0, 1);
  }
  return 0;
}

function demandOf(d: Demand, zone: number): number {
  return zone === ZoneType.Res ? d.res : zone === ZoneType.Com ? d.com : zone === ZoneType.Ind ? d.ind : 0;
}

function addCounters(c: SimCache, zone: number, level: number, sign: number) {
  if (zone === ZoneType.Res) c.pop += sign * (RES_CAPACITY[level] ?? 0);
  else if (zone === ZoneType.Com) c.jobsCom += sign * (COM_JOBS[level] ?? 0);
  else if (zone === ZoneType.Ind) c.jobsInd += sign * (IND_JOBS[level] ?? 0);
}

/** What a lot needs right now to keep its level (true if all of it is there). */
export function lotNeedsMet(state: GameState, c: SimCache, i: number): boolean {
  const T = state.tiles;
  const L = T.level[i];
  if (T.roadDist[i] > ROAD_REACH || !T.power[i]) return false;
  if (L >= WATER_FROM_LEVEL && !T.water[i]) return false;
  if (L >= 2 && desirability(state, c, i, T.zone[i]) < LEVEL_DESIRABILITY[L] - DESIRABILITY_SLACK) return false;
  return true;
}

/**
 * Why a lot cannot grow to the next level right now, or null if it could (demand permitting).
 * Shared by growth and the inspect panel so they always agree.
 */
export function growthBlocker(state: GameState, c: SimCache, i: number): 'road' | 'power' | 'powerCap' | 'water' | 'waterCap' | 'desire' | 'max' | null {
  const T = state.tiles;
  const L = T.level[i];
  const z = T.zone[i];
  if (L >= 3) return 'max';
  const target = L + 1;
  if (T.roadDist[i] > ROAD_REACH) return 'road';
  // In reach of a plant but not supplied means the plants there are full.
  if (!T.power[i]) return c.powerSrc[i] >= 0 ? 'powerCap' : 'power';
  const ps = c.powerSrc[i];
  const extraPower = (POWER_USE[z]?.[target] ?? 0) - (L > 0 ? POWER_USE[z]?.[L] ?? 0 : 0);
  if (ps < 0 || !c.powerProducers[ps] || c.powerProducers[ps].remain < extraPower) return 'powerCap';
  if (target >= WATER_FROM_LEVEL) {
    if (!T.water[i]) return c.waterSrc[i] >= 0 ? 'waterCap' : 'water';
    const ws = c.waterSrc[i];
    // A level-1 lot that already draws water only needs the difference.
    const extraWater = (WATER_USE[z]?.[target] ?? 0) - (L > 0 ? WATER_USE[z]?.[L] ?? 0 : 0);
    if (ws < 0 || !c.waterProducers[ws] || c.waterProducers[ws].remain < extraWater) return 'waterCap';
  }
  if (desirability(state, c, i, z) < LEVEL_DESIRABILITY[target]) return 'desire';
  return null;
}

function newVariant(state: GameState, i: number, level: number): number {
  return Math.floor(hash01(state.seed ^ 0x6a09e667, state.day * 4 + level, i) * 256);
}

/**
 * One day of growth and decline. Reads the derived layers from the last recompute; draws down the
 * producers' spare capacity as lots grow so a plant is never promised twice. Returns level changes.
 */
export function growthPass(state: GameState, c: SimCache): number {
  const T = state.tiles;
  const n = state.size * state.size;
  const { kind, zone, level, distress } = T;
  let changes = 0;
  let grewEvents = 0;
  let demand = computeDemand(c.pop, c.jobsCom, c.jobsInd, state.stats.happiness, state.taxes);
  const start = Math.floor(hash01(state.seed, state.day, 0x5ca7) * n);
  const stride = c.stride;
  const seedG = state.seed ^ 0x3c6ef372;
  const seedD = state.seed ^ 0x1f83d9ab;
  const unhappy = Math.max(0, (UNHAPPY_HAPPINESS - state.stats.happiness) / UNHAPPY_HAPPINESS);

  const changeLevel = (i: number, z: number, from: number, to: number) => {
    addCounters(c, z, from, -1);
    addCounters(c, z, to, 1);
    // Keep the producers' books straight until the next recompute.
    const ps = c.powerSrc[i];
    if (ps >= 0 && c.powerProducers[ps]) c.powerProducers[ps].remain -= (POWER_USE[z]?.[to] ?? 0) - (POWER_USE[z]?.[from] ?? 0);
    const ws = c.waterSrc[i];
    if (ws >= 0 && c.waterProducers[ws] && (to >= WATER_FROM_LEVEL || from >= WATER_FROM_LEVEL || T.water[i])) {
      c.waterProducers[ws].remain -= (WATER_USE[z]?.[to] ?? 0) - (WATER_USE[z]?.[from] ?? 0);
    }
    level[i] = to;
    T.variant[i] = newVariant(state, i, to);
    distress[i] = 0;
    markTile(state, i);
    changes++;
    c.changesSinceRecompute++;
    demand = computeDemand(c.pop, c.jobsCom, c.jobsInd, state.stats.happiness, state.taxes);
    if (grewEvents < GREW_EVENTS_PER_DAY) {
      grewEvents++;
      emit({ type: 'grew', i, level: to, up: to > from });
    }
  };

  for (let k = 0, i = start; k < n; k++, i = (i + stride) % n) {
    if (kind[i] !== TileKind.Zone) continue;
    const z = zone[i];
    if (z !== ZoneType.Res && z !== ZoneType.Com && z !== ZoneType.Ind) continue;
    const L = level[i];
    const d = demandOf(demand, z);

    if (L > 0) {
      if (!lotNeedsMet(state, c, i)) {
        // Distress only matters to the simulation; the tile is marked when it starts and when it resolves.
        const before = distress[i];
        distress[i] = Math.min(255, before + 1);
        if (before === 0) markTile(state, i);
        if (distress[i] >= DECLINE_DAYS) changeLevel(i, z, L, L - 1);
        continue;
      }
      if (distress[i] !== 0) {
        distress[i] = 0;
        markTile(state, i);
      }
      // Too many of this zone for the city, or residents fed up with the city: some lots empty out.
      let leave = d < ABANDON_DEMAND ? ABANDON_RATE * ((ABANDON_DEMAND - d) / (1 + ABANDON_DEMAND)) : 0;
      if (z === ZoneType.Res && unhappy > 0) leave += ABANDON_RATE * unhappy;
      if (leave > 0 && hash01(seedD, state.day, i) < leave) {
        changeLevel(i, z, L, L - 1);
        continue;
      }
    }

    if (L >= 3 || d <= 0) continue;
    if (growthBlocker(state, c, i) !== null) continue;
    const des = desirability(state, c, i, z);
    // sqrt: modest demand still builds at a fair pace; strong demand is not explosive.
    const chance = GROWTH_CHANCE * Math.sqrt(Math.min(1, d)) * (0.35 + 0.65 * des) * LEVEL_PACE[L + 1];
    if (hash01(seedG, state.day, i) < chance) changeLevel(i, z, L, L + 1);
  }
  return changes;
}
