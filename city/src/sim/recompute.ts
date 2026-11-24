// OWNER: sim agent. Rebuilds every derived layer and the city stats from the primary layers.
// Cost is O(map + Σ radius²): cheap enough to run after every action and every few game days.

import {
  BASE_IND_DEMAND,
  BASE_RES_DEMAND,
  COM_JOBS,
  COM_PER_RESIDENT,
  DEFAULT_TAX,
  IND_JOBS,
  IND_PER_WORKER,
  INDUSTRY_POLLUTION,
  INDUSTRY_POLLUTION_RADIUS,
  LAND_VALUE_BASE,
  LAND_VALUE_TREES,
  LAND_VALUE_WATERFRONT,
  POLLUTED_THRESHOLD,
  POWER_USE,
  RES_CAPACITY,
  ROAD_REACH,
  ROAD_UPKEEP,
  TAX_DEMAND_EFFECT,
  TAX_PER_COM_JOB,
  TAX_PER_IND_JOB,
  TAX_PER_RESIDENT,
  WATER_FROM_LEVEL,
  WATER_USE,
  WORKFORCE_RATIO,
} from '../core/config';
import { BUILDINGS } from '../core/defs';
import type { Demand, GameState, PlacedBuilding, Taxes } from '../core/types';
import { Problem, SERVICE_KINDS, Terrain, TileKind, ZoneType } from '../core/types';
import type { Producer, SimCache } from './util';
import { buildingTouchesRoad, clamp, footprintDist2, getCache } from './util';

/** Share of a utility's upkeep it costs while idle (the rest scales with load). */
export const UTILITY_IDLE_SHARE = 0.4;
/** Power a service or utility building draws, per footprint tile. */
export const BUILDING_POWER_PER_TILE = 2;
/** Water counts as "nearby" for land value within this many tiles. */
const WATERFRONT_DIST = 3;
/** Land value added by full park coverage / by full coverage of each other service. */
const LV_PARKS = 40;
const LV_SERVICE = 10;
/** Land value lost per point of pollution. */
const LV_POLLUTION = 0.7;
/** Pollution soaked up by each wooded tile in the 3×3 around a tile. */
const TREE_ABSORB = 3;
/** Residents within this many tiles count as "nearby" for shops. */
export const POP_NEAR_RADIUS = 6;
// Happiness weights (points).
const HAPPY_SERVICES = 22;
const HAPPY_PARKS = 8;
const HAPPY_POLLUTION = 30;
const HAPPY_UNEMPLOYMENT = 45;
const HAPPY_TAX = 2.5;
const HAPPY_MISSING_UTILITIES = 25;

/** The parts city happiness is made of (points added to a base of 50). */
export const HAPPINESS_PARTS = ['services', 'parks', 'landmarks', 'pollution', 'jobs', 'taxes', 'utilities'] as const;
export type HappinessPart = (typeof HAPPINESS_PARTS)[number];

/** Demand formulas from the design doc; each zone ends in -1..1. */
export function computeDemand(pop: number, jobsCom: number, jobsInd: number, happiness: number, taxes: Taxes): Demand {
  const wf = pop * WORKFORCE_RATIO;
  const jobs = jobsCom + jobsInd;
  const res = (jobs * 1.15 + BASE_RES_DEMAND - wf) / Math.max(60, wf * 0.5) + (happiness - 50) / 200;
  const com = (pop * COM_PER_RESIDENT - jobsCom) / Math.max(30, pop * 0.12);
  const ind = (wf * IND_PER_WORKER + BASE_IND_DEMAND - jobsInd) / Math.max(40, wf * 0.3);
  const adj = (v: number, tax: number) => clamp(clamp(v, -1, 1) - (tax - DEFAULT_TAX) * TAX_DEMAND_EFFECT, -1, 1);
  return { res: adj(res, taxes.res), com: adj(com, taxes.com), ind: adj(ind, taxes.ind) };
}

/** Multi-source BFS: Manhattan distance from every tile to the nearest tile where `isSource` holds. */
function distanceField(size: number, out: Uint8Array, queue: Int32Array, isSource: (i: number) => boolean) {
  const n = size * size;
  let head = 0;
  let tail = 0;
  for (let i = 0; i < n; i++) {
    if (isSource(i)) {
      out[i] = 0;
      queue[tail++] = i;
    } else out[i] = 255;
  }
  while (head < tail) {
    const i = queue[head++];
    const d = out[i] + 1;
    if (d > 255) continue;
    const x = i % size;
    if (x > 0 && out[i - 1] > d) (out[i - 1] = d), (queue[tail++] = i - 1);
    if (x < size - 1 && out[i + 1] > d) (out[i + 1] = d), (queue[tail++] = i + 1);
    if (i >= size && out[i - size] > d) (out[i - size] = d), (queue[tail++] = i - size);
    if (i < n - size && out[i + size] > d) (out[i + size] = d), (queue[tail++] = i + size);
  }
}

function growPairs(c: SimCache, need: number) {
  if (need <= c.pairP.length) return;
  let len = c.pairP.length;
  while (len < need) len *= 2;
  const grow = (a: Int32Array) => {
    const b = new Int32Array(len);
    b.set(a);
    return b;
  };
  c.pairP = grow(c.pairP);
  c.pairI = grow(c.pairI);
  c.pairNext = grow(c.pairNext);
}

/**
 * Hand out producer capacity to consumers nearest-first. Every (producer, consumer tile) pair within
 * reach is bucketed by squared distance; buckets are walked in order, once per priority pass. A consumer
 * that does not fit in a producer's remaining capacity is skipped (a smaller one further out may fit).
 * Writes reach (1 = within reach of some producer), served (by consumer key) and src (the reaching
 * producer with most capacity left, used by growth to check headroom).
 */
function allocate(state: GameState, c: SimCache, producers: Producer[], passes: number, served: Uint8Array, src: Int32Array) {
  const size = state.size;
  const { reach, load, key, prio } = c;
  reach.fill(0);
  src.fill(-1);
  let maxR2 = 0;
  for (const p of producers) maxR2 = Math.max(maxR2, Math.floor(p.radius * p.radius));
  if (c.bucketHead.length < maxR2 + 1) c.bucketHead = new Int32Array(maxR2 + 1);
  const head = c.bucketHead;
  head.fill(-1, 0, maxR2 + 1);
  let count = 0;
  for (let pi = 0; pi < producers.length; pi++) {
    const { b, radius } = producers[pi];
    const r = Math.floor(radius);
    const r2 = radius * radius;
    const x0 = Math.max(0, b.x - r);
    const x1 = Math.min(size - 1, b.x + b.w - 1 + r);
    const z0 = Math.max(0, b.z - r);
    const z1 = Math.min(size - 1, b.z + b.h - 1 + r);
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        const d2 = footprintDist2(x, z, b.x, b.z, b.w, b.h);
        if (d2 > r2) continue;
        const i = z * size + x;
        reach[i] = 1;
        if (load[i] <= 0) continue;
        if (count >= c.pairP.length) growPairs(c, count + 1);
        c.pairP[count] = pi;
        c.pairI[count] = i;
        c.pairNext[count] = head[d2];
        head[d2] = count++;
      }
    }
  }
  const { pairP, pairI, pairNext } = c;
  for (let pass = 0; pass < passes; pass++) {
    for (let d2 = 0; d2 <= maxR2; d2++) {
      for (let k = head[d2]; k >= 0; k = pairNext[k]) {
        const i = pairI[k];
        if (prio[i] !== pass) continue;
        const kk = key[i];
        if (served[kk]) continue;
        const p = producers[pairP[k]];
        const l = load[i];
        if (p.remain >= l) {
          p.remain -= l;
          served[kk] = 1;
        }
      }
    }
  }
  // For each tile, remember the reaching producer with the most headroom.
  for (let pi = 0; pi < producers.length; pi++) {
    const { b, radius, remain } = producers[pi];
    const r = Math.floor(radius);
    const r2 = radius * radius;
    const x0 = Math.max(0, b.x - r);
    const x1 = Math.min(size - 1, b.x + b.w - 1 + r);
    const z0 = Math.max(0, b.z - r);
    const z1 = Math.min(size - 1, b.z + b.h - 1 + r);
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        if (footprintDist2(x, z, b.x, b.z, b.w, b.h) > r2) continue;
        const i = z * size + x;
        const s = src[i];
        if (s < 0 || remain > producers[s].remain) src[i] = pi;
      }
    }
  }
}

/** Add `amount` fading linearly to 0 at `radius` (measured from the footprint) into a float field. */
function spread(size: number, field: Float32Array, b: { x: number; z: number; w: number; h: number }, amount: number, radius: number) {
  if (radius <= 0 || amount === 0) return;
  const r = Math.ceil(radius);
  const x0 = Math.max(0, b.x - r);
  const x1 = Math.min(size - 1, b.x + b.w - 1 + r);
  const z0 = Math.max(0, b.z - r);
  const z1 = Math.min(size - 1, b.z + b.h - 1 + r);
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.sqrt(footprintDist2(x, z, b.x, b.z, b.w, b.h));
      if (d >= radius) continue;
      field[z * size + x] += amount * (1 - d / radius);
    }
  }
}

/** Service coverage of one building: 255 on the footprint, fading linearly to 0 at the radius; max-combined. */
function cover(size: number, layer: Uint8Array, b: PlacedBuilding, radius: number) {
  const r = Math.ceil(radius);
  const x0 = Math.max(0, b.x - r);
  const x1 = Math.min(size - 1, b.x + b.w - 1 + r);
  const z0 = Math.max(0, b.z - r);
  const z1 = Math.min(size - 1, b.z + b.h - 1 + r);
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.sqrt(footprintDist2(x, z, b.x, b.z, b.w, b.h));
      if (d >= radius) continue;
      const s = Math.round(255 * (1 - d / radius));
      const i = z * size + x;
      if (s > layer[i]) layer[i] = s;
    }
  }
}

/**
 * Fill the power or water layer after allocation. Consumers get 1 if they were served. Open land and
 * empty zoned lots count as supplied when a producer reaching them still has room for a first building
 * there, so a lot next to a full plant shows "no power" instead of silently never developing.
 * Other tiles (roads, buildings that draw nothing) just show reach.
 */
function writeSupplyLayer(
  state: GameState,
  c: SimCache,
  layer: Uint8Array,
  served: Uint8Array,
  producers: Producer[],
  src: Int32Array,
  use: number[][],
) {
  const { kind, zone, level } = state.tiles;
  const { load, key, reach } = c;
  for (let i = 0; i < layer.length; i++) {
    if (load[i] > 0) layer[i] = served[key[i]];
    else if (!reach[i]) layer[i] = 0;
    else {
      const k = kind[i];
      if (k === TileKind.Empty || (k === TileKind.Zone && level[i] === 0)) {
        const need = k === TileKind.Zone && validZone(zone[i]) ? use[zone[i]][1] : 1;
        const p = src[i] >= 0 ? producers[src[i]] : undefined;
        layer[i] = p && p.remain >= need ? 1 : 0;
      } else layer[i] = 1;
    }
  }
}

/**
 * Monthly running cost of a building. Power plants and water buildings cost UTILITY_IDLE_SHARE of their
 * upkeep when idle and the full upkeep at capacity (fuel and pumping follow use), so a young town's
 * first plant is affordable and a big city's utilities cost in proportion to what it uses.
 */
export function buildingUpkeep(c: SimCache, b: PlacedBuilding): number {
  const def = BUILDINGS[b.type];
  const cap = def.power?.capacity ?? def.water?.capacity;
  if (!cap) return def.upkeep;
  const load = b.active ? Math.min(1, (c.supplyUsed.get(b.id) ?? 0) / cap) : 0;
  return Math.round(def.upkeep * (UTILITY_IDLE_SHARE + (1 - UTILITY_IDLE_SHARE) * load));
}

function validZone(z: number): boolean {
  return z === ZoneType.Res || z === ZoneType.Com || z === ZoneType.Ind;
}

/** Recompute every derived layer and state.stats (except the smoothed happiness, see simulateDay). */
export function recompute(state: GameState): void {
  const c = getCache(state);
  const size = state.size;
  const n = size * size;
  const T = state.tiles;
  const { kind, zone, level, terrain, trees } = T;

  // ---- distances ----
  distanceField(size, T.roadDist, c.queue, (i) => kind[i] === TileKind.Road);
  distanceField(size, c.waterDist, c.queue, (i) => terrain[i] === Terrain.Water);
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      let near = 0;
      for (let dz = -2; dz <= 2 && !near; dz++) {
        const zz = z + dz;
        if (zz < 0 || zz >= size) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < size && trees[zz * size + xx]) {
            near = 1;
            break;
          }
        }
      }
      c.treeNear[z * size + x] = near;
    }
  }

  // ---- buildings: road access ----
  const blds: PlacedBuilding[] = [];
  for (const b of state.buildings) if (b) blds.push(b);
  c.roadOk.clear();
  c.powered.clear();
  c.supplyUsed.clear();
  for (const b of blds) {
    const def = BUILDINGS[b.type];
    c.roadOk.set(b.id, !def.needsRoad || buildingTouchesRoad(state, b));
  }
  const served = new Uint8Array(n + state.buildings.length);

  // ---- power ----
  const { load, key, prio } = c;
  load.fill(0);
  prio.fill(0);
  let powerDemand = 0;
  for (let i = 0; i < n; i++) {
    key[i] = i;
    if (kind[i] === TileKind.Zone && level[i] > 0 && validZone(zone[i])) {
      load[i] = POWER_USE[zone[i]][level[i]];
      powerDemand += load[i];
    }
  }
  for (const b of blds) {
    const def = BUILDINGS[b.type];
    if (!def.needsPower || !c.roadOk.get(b.id)) continue;
    const use = BUILDING_POWER_PER_TILE * b.w * b.h;
    powerDemand += use;
    for (let z = b.z; z < b.z + b.h; z++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        const i = z * size + x;
        load[i] = use;
        key[i] = n + b.id;
      }
    }
  }
  const powerProducers: Producer[] = [];
  let powerSupply = 0;
  for (const b of blds) {
    const def = BUILDINGS[b.type];
    if (!def.power || !c.roadOk.get(b.id)) continue;
    powerProducers.push({ id: b.id, b, capacity: def.power.capacity, radius: def.power.radius, remain: def.power.capacity });
    powerSupply += def.power.capacity;
  }
  allocate(state, c, powerProducers, 1, served, c.powerSrc);
  writeSupplyLayer(state, c, T.power, served, powerProducers, c.powerSrc, POWER_USE);
  for (const p of powerProducers) c.supplyUsed.set(p.id, p.capacity - p.remain);
  c.powerProducers = powerProducers;

  // ---- activity ----
  let activeChanged = false;
  for (const b of blds) {
    const def = BUILDINGS[b.type];
    const roadOk = c.roadOk.get(b.id)!;
    const powered = !def.needsPower || (roadOk && served[n + b.id] === 1);
    c.powered.set(b.id, powered);
    const active = roadOk && powered;
    if (b.active !== active) {
      b.active = active;
      activeChanged = true;
    }
  }
  if (activeChanged) state.rev.buildings++;

  // ---- water ----
  served.fill(0);
  load.fill(0);
  prio.fill(0);
  let waterDemand = 0;
  for (let i = 0; i < n; i++) {
    key[i] = i;
    if (kind[i] === TileKind.Zone && level[i] > 0 && validZone(zone[i])) {
      load[i] = WATER_USE[zone[i]][level[i]];
      waterDemand += load[i];
      // Lots that need water to keep their level are served before cottages that merely use it.
      prio[i] = level[i] >= WATER_FROM_LEVEL ? 0 : 1;
    }
  }
  const waterProducers: Producer[] = [];
  let waterSupply = 0;
  for (const b of blds) {
    const def = BUILDINGS[b.type];
    if (!def.water || !b.active) continue;
    waterProducers.push({ id: b.id, b, capacity: def.water.capacity, radius: def.water.radius, remain: def.water.capacity });
    waterSupply += def.water.capacity;
  }
  allocate(state, c, waterProducers, 2, served, c.waterSrc);
  writeSupplyLayer(state, c, T.water, served, waterProducers, c.waterSrc, WATER_USE);
  for (const p of waterProducers) c.supplyUsed.set(p.id, p.capacity - p.remain);
  c.waterProducers = waterProducers;

  // ---- services, pollution, land value ----
  for (const k of SERVICE_KINDS) T[k].fill(0);
  const pf = c.pollutionF;
  const lf = c.landF;
  pf.fill(0);
  lf.fill(0);
  let happinessBonus = 0;
  for (const b of blds) {
    if (!b.active) continue;
    const def = BUILDINGS[b.type];
    if (def.service) cover(size, T[def.service.kind], b, def.service.radius);
    if (def.pollution) spread(size, pf, b, def.pollution.amount, def.pollution.radius);
    if (def.landValue) spread(size, lf, b, def.landValue.amount, def.landValue.radius);
    if (def.happiness) happinessBonus += def.happiness;
  }
  const lot = { x: 0, z: 0, w: 1, h: 1 };
  for (let i = 0; i < n; i++) {
    if (kind[i] === TileKind.Zone && zone[i] === ZoneType.Ind && level[i] > 0) {
      lot.x = i % size;
      lot.z = (i - lot.x) / size;
      spread(size, pf, lot, INDUSTRY_POLLUTION[level[i]] ?? 0, INDUSTRY_POLLUTION_RADIUS);
    }
  }
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const i = z * size + x;
      let v = pf[i];
      if (v > 0) {
        let wooded = 0;
        for (let dz = -1; dz <= 1; dz++) {
          const zz = z + dz;
          if (zz < 0 || zz >= size) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx >= 0 && xx < size && trees[zz * size + xx]) wooded++;
          }
        }
        v -= wooded * TREE_ABSORB;
      }
      T.pollution[i] = clamp(Math.round(v), 0, 255);
    }
  }
  for (let i = 0; i < n; i++) {
    let v = LAND_VALUE_BASE;
    if (terrain[i] !== Terrain.Water && c.waterDist[i] <= WATERFRONT_DIST) v += LAND_VALUE_WATERFRONT;
    if (c.treeNear[i]) v += LAND_VALUE_TREES;
    v += (T.parks[i] / 255) * LV_PARKS;
    v += ((T.police[i] + T.fire[i] + T.health[i] + T.education[i]) / 255) * LV_SERVICE;
    v += lf[i];
    v -= T.pollution[i] * LV_POLLUTION;
    T.landValue[i] = clamp(Math.round(v), 0, 255);
  }

  // ---- residents nearby (summed-area table over a square window) ----
  {
    const s = size + 1;
    const sat = new Float64Array(s * s);
    for (let z = 0; z < size; z++) {
      let row = 0;
      for (let x = 0; x < size; x++) {
        const i = z * size + x;
        if (kind[i] === TileKind.Zone && zone[i] === ZoneType.Res) row += RES_CAPACITY[level[i]] ?? 0;
        sat[(z + 1) * s + x + 1] = sat[z * s + x + 1] + row;
      }
    }
    const R = POP_NEAR_RADIUS;
    for (let z = 0; z < size; z++) {
      const z0 = Math.max(0, z - R);
      const z1 = Math.min(size, z + R + 1);
      for (let x = 0; x < size; x++) {
        const x0 = Math.max(0, x - R);
        const x1 = Math.min(size, x + R + 1);
        c.popNear[z * size + x] = sat[z1 * s + x1] - sat[z0 * s + x1] - sat[z1 * s + x0] + sat[z0 * s + x0];
      }
    }
  }

  // ---- problems and stats ----
  let pop = 0;
  let jobsCom = 0;
  let jobsInd = 0;
  let devRes = 0;
  let devCom = 0;
  let devInd = 0;
  let roads = 0;
  let missing = 0;
  let svcSum = 0;
  let parkSum = 0;
  let polSum = 0;
  for (let i = 0; i < n; i++) {
    const k = kind[i];
    let p = 0;
    if (k === TileKind.Road) roads++;
    else if (k === TileKind.Zone) {
      const L = level[i];
      const zt = zone[i];
      if (T.roadDist[i] > ROAD_REACH) p |= Problem.NoRoad;
      if (!T.power[i]) p |= Problem.NoPower;
      if (L > 0) {
        if (!T.water[i]) p |= Problem.NoWater;
        if (!T.power[i] || (L >= WATER_FROM_LEVEL && !T.water[i])) missing++;
        if (zt === ZoneType.Res) {
          const r = RES_CAPACITY[L] ?? 0;
          pop += r;
          devRes++;
          if (T.pollution[i] >= POLLUTED_THRESHOLD) p |= Problem.Polluted;
          svcSum += r * ((T.police[i] + T.fire[i] + T.health[i] + T.education[i]) / (4 * 255));
          parkSum += r * (T.parks[i] / 255);
          polSum += r * Math.min(1, T.pollution[i] / 150);
        } else if (zt === ZoneType.Com) {
          jobsCom += COM_JOBS[L] ?? 0;
          devCom++;
        } else if (zt === ZoneType.Ind) {
          jobsInd += IND_JOBS[L] ?? 0;
          devInd++;
        }
      }
    } else if (k === TileKind.Building) {
      const b = state.buildings[T.bld[i]];
      if (b) {
        const def = BUILDINGS[b.type];
        if (!b.active) p |= Problem.Inactive;
        if (def.needsRoad && !c.roadOk.get(b.id)) p |= Problem.NoRoad;
        if (def.needsPower && !c.powered.get(b.id)) p |= Problem.NoPower;
      }
    }
    T.problems[i] = p;
  }

  const st = state.stats;
  const workforce = pop * WORKFORCE_RATIO;
  const jobs = jobsCom + jobsInd;
  const unemployment = workforce > 0 ? clamp((workforce - jobs) / workforce, 0, 1) : 0;

  // Happiness: 50 plus what the city does well, minus what it does badly. Each part is kept so the
  // UI can explain the number (see happinessBreakdown).
  const parts = c.happinessParts;
  parts.services = pop > 0 ? (HAPPY_SERVICES * svcSum) / pop : 0;
  parts.parks = pop > 0 ? (HAPPY_PARKS * parkSum) / pop : 0;
  parts.pollution = pop > 0 ? -(HAPPY_POLLUTION * polSum) / pop : 0;
  parts.landmarks = happinessBonus;
  parts.jobs = -HAPPY_UNEMPLOYMENT * Math.max(0, unemployment - 0.05);
  const taxDev =
    0.5 * (state.taxes.res - DEFAULT_TAX) + 0.25 * (state.taxes.com - DEFAULT_TAX) + 0.25 * (state.taxes.ind - DEFAULT_TAX);
  parts.taxes = -HAPPY_TAX * taxDev;
  const developed = devRes + devCom + devInd;
  parts.utilities = developed > 0 ? -(HAPPY_MISSING_UTILITIES * missing) / developed : 0;
  let h = 50;
  for (const k of HAPPINESS_PARTS) h += parts[k];
  c.happinessTarget = clamp(h, 0, 100);
  st.happiness = clamp(Number.isFinite(st.happiness) ? st.happiness : 50, 0, 100);

  st.population = pop;
  st.workforce = Math.round(workforce);
  st.jobsCom = jobsCom;
  st.jobsInd = jobsInd;
  st.unemployment = unemployment;
  st.demand = computeDemand(pop, jobsCom, jobsInd, st.happiness, state.taxes);
  st.powerSupply = powerSupply;
  st.powerDemand = powerDemand;
  st.waterSupply = waterSupply;
  st.waterDemand = waterDemand;
  const incRes = Math.round(pop * state.taxes.res * TAX_PER_RESIDENT);
  const incCom = Math.round(jobsCom * state.taxes.com * TAX_PER_COM_JOB);
  const incInd = Math.round(jobsInd * state.taxes.ind * TAX_PER_IND_JOB);
  st.income = { res: incRes, com: incCom, ind: incInd, total: incRes + incCom + incInd };
  let upkeep = 0;
  c.upkeep.clear();
  for (const b of blds) {
    const cost = buildingUpkeep(c, b);
    c.upkeep.set(b.id, cost);
    upkeep += cost;
  }
  const roadCost = Math.round(roads * ROAD_UPKEEP);
  st.expenses = { roads: roadCost, buildings: upkeep, total: roadCost + upkeep };
  st.developed = { res: devRes, com: devCom, ind: devInd };

  c.pop = pop;
  c.jobsCom = jobsCom;
  c.jobsInd = jobsInd;
  c.changesSinceRecompute = 0;
  c.computed = true;
  state.needsRecompute = false;
  state.rev.derived++;
}
