import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  BASE_RES_DEMAND,
  DAYS_PER_MONTH,
  DECLINE_DAYS,
  DEFAULT_TAX,
  LEVEL_DESIRABILITY,
  MAX_TAX,
  MILESTONES,
  POWER_USE,
  RES_CAPACITY,
  TAX_DEMAND_EFFECT,
  TAX_PER_RESIDENT,
} from '../src/core/config';
import { BUILDINGS } from '../src/core/defs';
import type { GameEvent } from '../src/core/events';
import { clearListeners, on } from '../src/core/events';
import type { GameState } from '../src/core/types';
import { Problem, TileKind, ZoneType } from '../src/core/types';
import { isUnlocked } from '../src/sim/actions';
import { computeDemand, happinessBreakdown, newGame, recompute, setTax, simulateDay } from '../src/sim/index';
import { buildingUpkeep, UTILITY_IDLE_SHARE } from '../src/sim/recompute';
import { getCache } from '../src/sim/util';
import { desirability, growthBlocker } from '../src/sim/growth';
import { act, at, flatState, primarySnapshot } from './sim-helpers.test';

let events: GameEvent[] = [];
beforeEach(() => {
  clearListeners();
  events = [];
  for (const t of ['toast', 'milestone', 'month', 'grew'] as const) on(t, (e) => events.push(e));
});

/** Make a lot developed without waiting for growth. */
function lot(s: GameState, x: number, z: number, zone: ZoneType, level: number) {
  const i = at(s, x, z);
  s.tiles.kind[i] = TileKind.Zone;
  s.tiles.zone[i] = zone;
  s.tiles.level[i] = level;
}

test('roadDist is the Manhattan distance to the nearest road', () => {
  const s = flatState(16);
  act(s, 'road', { x: 5, z: 5 });
  assert.equal(s.tiles.roadDist[at(s, 5, 5)], 0);
  assert.equal(s.tiles.roadDist[at(s, 7, 8)], 5);
  assert.equal(s.tiles.roadDist[at(s, 0, 0)], 10);
});

test('power: nearest consumers are served first until capacity runs out', () => {
  const s = flatState(40);
  s.milestone = MILESTONES.length - 1; // unlock the wind turbine
  act(s, 'build:power_wind', { x: 2, z: 20 });
  const def = BUILDINGS.power_wind.power!;
  const use = POWER_USE[ZoneType.Ind][3];
  // A row of level-3 factories heading east from the turbine, plus one empty lot in reach.
  for (let x = 3; x <= 2 + def.radius; x++) lot(s, x, 20, ZoneType.Ind, 3);
  lot(s, 3, 22, ZoneType.Res, 0);
  lot(s, 30, 30, ZoneType.Res, 0);
  recompute(s);
  const fits = Math.floor(def.capacity / use);
  for (let x = 3; x <= 2 + def.radius; x++) {
    assert.equal(s.tiles.power[at(s, x, 20)], x - 3 < fits ? 1 : 0, `factory at x=${x}`);
    assert.equal(!!(s.tiles.problems[at(s, x, 20)] & Problem.NoPower), x - 3 >= fits);
  }
  assert.equal(s.tiles.power[at(s, 30, 30)], 0, 'empty lot out of reach is not');
  assert.ok(s.tiles.problems[at(s, 30, 30)] & Problem.NoPower);
  assert.equal(s.stats.powerSupply, def.capacity);
  assert.equal(s.stats.powerDemand, def.radius * use);
  // The turbine is full, so an empty lot in its reach cannot get power for a first building...
  assert.equal(s.tiles.power[at(s, 3, 22)], 0, 'empty lot next to a full plant shows no power');
  assert.ok(s.tiles.problems[at(s, 3, 22)] & Problem.NoPower);
  // ...but with room to spare it counts as powered while drawing nothing.
  for (let x = 3; x <= 2 + def.radius; x++) s.tiles.level[at(s, x, 20)] = x - 3 < fits - 1 ? 3 : 0;
  recompute(s);
  assert.equal(s.tiles.power[at(s, 3, 22)], 1, 'empty lot in reach counts as powered');
  assert.equal(s.stats.powerDemand, (fits - 1) * use, 'empty lots draw nothing');
});

test('power: service buildings draw power, need a road, and go inactive without either', () => {
  const s = flatState(40);
  s.milestone = MILESTONES.length - 1;
  act(s, 'road', { x: 0, z: 10 }, { x: 39, z: 10 });
  act(s, 'build:police', { x: 20, z: 8 }); // 20..21 x 8..9, touches the road
  const police = s.buildings[0]!;
  assert.equal(police.active, false, 'no power yet');
  assert.ok(s.tiles.problems[at(s, 20, 8)] & Problem.Inactive);
  assert.equal(s.tiles.police[at(s, 20, 12)], 0);
  act(s, 'build:power_coal', { x: 5, z: 8 });
  assert.equal(police.active, true);
  assert.equal(s.stats.powerDemand, 2 * 4);
  assert.equal(s.tiles.problems[at(s, 20, 8)], 0);
  assert.ok(s.tiles.police[at(s, 20, 12)] > 150, 'coverage near the station');
  assert.equal(s.tiles.police[at(s, 39, 39)], 0, 'no coverage far away');
  // Cut the road next to it: inactive again.
  act(s, 'bulldoze', { x: 18, z: 10 }, { x: 23, z: 10 });
  assert.equal(police.active, false);
  assert.ok(s.tiles.problems[at(s, 20, 8)] & Problem.NoRoad);
});

test('demand follows the formulas and taxes shift it', () => {
  const taxes = { res: DEFAULT_TAX, com: DEFAULT_TAX, ind: DEFAULT_TAX };
  const d0 = computeDemand(0, 0, 0, 50, taxes);
  assert.ok(Math.abs(d0.res - BASE_RES_DEMAND / 60) < 1e-9);
  assert.equal(d0.com, 0);
  const high = computeDemand(0, 0, 0, 50, { res: DEFAULT_TAX + 4, com: DEFAULT_TAX, ind: DEFAULT_TAX });
  assert.ok(Math.abs(d0.res - high.res - 4 * TAX_DEMAND_EFFECT) < 1e-9);
  const flooded = computeDemand(5000, 0, 0, 50, taxes);
  assert.equal(flooded.res, -1);
  assert.equal(flooded.com, 1);
  assert.equal(flooded.ind, 1);
});

/**
 * A small working town on a 40x40 map: a main road, a coal plant east of the homes (in reach, but too
 * far to pollute them), a water tower, homes and a little industry; plus homes far beyond the plant's
 * reach that have a road but no power.
 */
function town(): GameState {
  const s = flatState(40, 11);
  act(s, 'road', { x: 0, z: 10 }, { x: 39, z: 10 });
  act(s, 'build:power_coal', { x: 29, z: 12 }); // 28..30 x 11..13
  act(s, 'build:water_tower', { x: 16, z: 11 });
  act(s, 'zone_res', { x: 13, z: 7 }, { x: 20, z: 9 });
  // Two small parks make the homes nice enough for level 2.
  act(s, 'build:park_small', { x: 14, z: 8 });
  act(s, 'build:park_small', { x: 19, z: 8 });
  act(s, 'zone_ind', { x: 22, z: 11 }, { x: 26, z: 12 });
  act(s, 'road', { x: 2, z: 20 }, { x: 2, z: 39 });
  act(s, 'zone_res', { x: 3, z: 30 }, { x: 4, z: 38 });
  return s;
}

test('a powered, watered zone on a road grows; an unpowered one does not', () => {
  const s = town();
  for (let d = 0; d < 360; d++) simulateDay(s);
  let grown = 0;
  let level2 = 0;
  for (let z = 7; z <= 9; z++) {
    for (let x = 13; x <= 20; x++) {
      const L = s.tiles.level[at(s, x, z)];
      if (L > 0) grown++;
      if (L >= 2) level2++;
    }
  }
  assert.ok(grown >= 12, `powered homes grew (${grown})`);
  assert.ok(level2 >= 1, 'some reached level 2 with water and parks');
  for (let z = 30; z <= 38; z++) {
    for (let x = 3; x <= 4; x++) assert.equal(s.tiles.level[at(s, x, z)], 0, 'unpowered lots stay empty');
  }
  assert.ok(s.stats.population > 0);
  assert.ok(events.some((e) => e.type === 'grew' && e.up));
});

test('level 2 needs water and a nice enough area', () => {
  const s = flatState(32);
  act(s, 'road', { x: 0, z: 10 }, { x: 31, z: 10 });
  act(s, 'build:power_coal', { x: 20, z: 12 }); // in reach of the homes, too far to pollute them
  for (let x = 4; x < 12; x++) lot(s, x, 9, ZoneType.Res, 1);
  recompute(s);
  const c = getCache(s);
  const i = at(s, 6, 9);
  assert.equal(growthBlocker(s, c, i), 'water', 'no water yet');
  act(s, 'build:water_tower', { x: 8, z: 11 });
  assert.equal(growthBlocker(s, c, i), 'desire', 'bare grass is not enough');
  assert.ok(desirability(s, c, i, ZoneType.Res) < LEVEL_DESIRABILITY[2]);
  act(s, 'build:park_small', { x: 6, z: 8 });
  assert.equal(growthBlocker(s, c, i), null, 'a park next door makes it nice enough');
  // Pollution makes homes less desirable; industry does not mind.
  const before = desirability(s, c, i, ZoneType.Res);
  for (let x = 4; x < 12; x++) lot(s, x, 7, ZoneType.Ind, 3);
  recompute(s);
  assert.ok(desirability(s, c, i, ZoneType.Res) < before - 0.15);
  assert.ok(desirability(s, c, at(s, 5, 7), ZoneType.Ind) >= LEVEL_DESIRABILITY[2]);
});

test('growth is deterministic for the same seed and actions', () => {
  const a = town();
  const b = town();
  for (let d = 0; d < 90; d++) {
    simulateDay(a);
    simulateDay(b);
  }
  assert.deepEqual(primarySnapshot(a), primarySnapshot(b));
  assert.equal(a.money, b.money);
});

test('developed lots that lose power decline after DECLINE_DAYS', () => {
  const s = town();
  for (let d = 0; d < 120; d++) simulateDay(s);
  const before = s.stats.population;
  assert.ok(before > 0);
  act(s, 'bulldoze', { x: 29, z: 12 }); // remove the coal plant
  for (let d = 0; d < DECLINE_DAYS - 2; d++) simulateDay(s);
  assert.equal(s.stats.population, before, 'nothing drops before the grace period');
  for (let d = 0; d < DECLINE_DAYS * 4; d++) simulateDay(s);
  assert.equal(s.stats.population, 0, 'all homes emptied');
  assert.ok(events.some((e) => e.type === 'grew' && !e.up));
});

test('month end: money changes by income minus expenses and history grows', () => {
  const s = flatState(32);
  act(s, 'road', { x: 0, z: 5 }, { x: 31, z: 5 });
  act(s, 'build:power_coal', { x: 2, z: 7 });
  for (let x = 6; x < 26; x++) lot(s, x, 4, ZoneType.Res, 1);
  for (let x = 6; x < 12; x++) lot(s, x, 6, ZoneType.Com, 1);
  recompute(s);
  const pop = 20 * RES_CAPACITY[1];
  assert.equal(s.stats.population, pop);
  assert.equal(s.stats.income.res, Math.round(pop * DEFAULT_TAX * TAX_PER_RESIDENT));
  assert.equal(s.stats.expenses.roads, 32);
  // A plant's running cost follows its load: UTILITY_IDLE_SHARE of upkeep when idle, all of it when full.
  const plant = s.buildings[0]!;
  const load = (getCache(s).supplyUsed.get(plant.id) ?? 0) / BUILDINGS.power_coal.power!.capacity;
  assert.ok(load > 0 && load < 1);
  assert.equal(
    s.stats.expenses.buildings,
    Math.round(BUILDINGS.power_coal.upkeep * (UTILITY_IDLE_SHARE + (1 - UTILITY_IDLE_SHARE) * load)),
  );
  assert.equal(s.stats.expenses.buildings, buildingUpkeep(getCache(s), plant));
  s.day = DAYS_PER_MONTH - 1;
  const money = s.money;
  const net = s.stats.income.total - s.stats.expenses.total;
  simulateDay(s);
  assert.equal(s.day, DAYS_PER_MONTH);
  assert.equal(s.money, money + net);
  assert.equal(s.history.length, 1);
  assert.deepEqual(
    { day: s.history[0].day, population: s.history[0].population, money: s.history[0].money },
    { day: DAYS_PER_MONTH, population: pop, money: s.money },
  );
  const month = events.find((e) => e.type === 'month');
  assert.ok(month && month.type === 'month' && month.record.income === s.stats.income.total);
});

test('debt is tracked month by month', () => {
  const s = flatState(32, 7, 0);
  s.tiles.kind.fill(TileKind.Road, 0, 200);
  recompute(s);
  for (let d = 0; d < DAYS_PER_MONTH * 2; d++) simulateDay(s);
  assert.equal(s.money, -400);
  assert.equal(s.monthsInDebt, 2);
  assert.ok(events.some((e) => e.type === 'toast' && /red/.test(e.text)));
});

test('milestones pay their reward once, unlock buildings and never re-lock', () => {
  const s = flatState(32);
  const need = MILESTONES[1].population;
  for (let k = 0; k * RES_CAPACITY[1] < need; k++) lot(s, k % 32, 3 + Math.floor(k / 32), ZoneType.Res, 1);
  recompute(s);
  assert.equal(isUnlocked(s, 'build:police'), true, 'population alone unlocks');
  const money = s.money;
  simulateDay(s);
  assert.equal(s.milestone, 1);
  assert.equal(s.money, money + MILESTONES[1].reward);
  const m = events.find((e) => e.type === 'milestone');
  assert.ok(m && m.type === 'milestone');
  assert.deepEqual(m.unlocked.sort(), ['fire', 'police']);
  assert.ok(events.some((e) => e.type === 'toast' && e.tone === 'good' && e.text.includes(MILESTONES[1].name)));
  simulateDay(s);
  assert.equal(events.filter((e) => e.type === 'milestone').length, 1);
  // The town empties: the unlock stays.
  s.tiles.level.fill(0);
  recompute(s);
  assert.equal(s.stats.population, 0);
  assert.equal(isUnlocked(s, 'build:police'), true);
  assert.equal(isUnlocked(s, 'build:clinic'), false);
});

test('happiness drifts towards its target instead of jumping', () => {
  const s = town();
  for (let d = 0; d < 60; d++) simulateDay(s);
  const h0 = s.stats.happiness;
  s.taxes = { res: 20, com: 20, ind: 20 };
  recompute(s);
  assert.equal(s.stats.happiness, h0, 'a recompute alone does not move it');
  simulateDay(s);
  const h1 = s.stats.happiness;
  assert.ok(h1 < h0 && h0 - h1 < 5, `small step down (${h0} -> ${h1})`);
  for (let d = 0; d < 90; d++) simulateDay(s);
  assert.ok(s.stats.happiness < h0 - 8, `and keeps falling with high taxes (${h0} -> ${s.stats.happiness})`);
  const why = happinessBreakdown(s);
  assert.equal(why.parts[0].label, 'Taxes', 'taxes are the biggest drag');
  assert.ok(why.parts[0].points < -20);
});

test('problem toasts are rate limited', () => {
  const s = flatState(32);
  act(s, 'road', { x: 0, z: 5 }, { x: 31, z: 5 });
  act(s, 'zone_res', { x: 0, z: 2 }, { x: 15, z: 4 });
  for (let d = 0; d < DAYS_PER_MONTH * 12; d++) simulateDay(s);
  const power = events.filter((e) => e.type === 'toast' && /power plant/.test(e.text));
  assert.equal(power.length, 2, 'once every six months');
});

test('recompute is quick on a busy map', () => {
  const s = newGame(9);
  for (let i = 0; i < s.size * s.size; i++) {
    if (s.tiles.terrain[i] === 1) continue;
    s.tiles.trees[i] = 0;
    s.tiles.kind[i] = i % 5 === 0 ? TileKind.Road : TileKind.Zone;
    if (i % 5) {
      s.tiles.zone[i] = 1 + (i % 3);
      s.tiles.level[i] = i % 4;
    }
  }
  s.milestone = MILESTONES.length - 1;
  recompute(s);
  const t0 = performance.now();
  for (let k = 0; k < 10; k++) recompute(s);
  const ms = (performance.now() - t0) / 10;
  assert.ok(ms < 40, `recompute took ${ms.toFixed(1)} ms`);
});

test('setTax clamps to a whole percent and refreshes income and demand at once', () => {
  const s = flatState(32);
  for (let x = 0; x < 20; x++) lot(s, x, 4, ZoneType.Res, 1);
  recompute(s);
  const income = s.stats.income.res;
  const demand = s.stats.demand.res;
  setTax(s, 'res', DEFAULT_TAX + 3.4);
  assert.equal(s.taxes.res, DEFAULT_TAX + 3);
  assert.ok(s.stats.income.res > income);
  assert.ok(s.stats.demand.res < demand);
  setTax(s, 'res', 99);
  assert.equal(s.taxes.res, MAX_TAX);
  setTax(s, 'com', -5);
  assert.equal(s.taxes.com, 0);
  setTax(s, 'ind', Number.NaN);
  assert.equal(s.taxes.ind, DEFAULT_TAX);
});

test('very high taxes make residents unhappy and they move out over months, not instantly', () => {
  const s = town();
  for (let d = 0; d < 360; d++) simulateDay(s);
  const before = s.stats.population;
  assert.ok(before > 0);
  for (const z of ['res', 'com', 'ind'] as const) setTax(s, z, MAX_TAX);
  for (let d = 0; d < 30; d++) simulateDay(s);
  assert.ok(s.stats.population > before * 0.7, 'no collapse within a month');
  for (let d = 0; d < 330; d++) simulateDay(s);
  assert.ok(s.stats.happiness < 35, `unhappy (${s.stats.happiness})`);
  assert.ok(events.some((e) => e.type === 'toast' && /unhappy/.test(e.text) && /taxes/.test(e.text)), 'a toast says why');
  assert.ok(s.stats.population < before * 0.85, `homes empty out over a year (${before} -> ${s.stats.population})`);
});
