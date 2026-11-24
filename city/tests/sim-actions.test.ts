import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  BULLDOZE_BUILDING_SHARE,
  COST_BULLDOZE_LOT_PER_LEVEL,
  COST_BULLDOZE_ROAD,
  COST_BULLDOZE_TREES,
  COST_CLEAR_TREES,
  COST_ROAD,
  COST_ZONE,
  MILESTONES,
  UNDO_STACK_SIZE,
} from '../src/core/config';
import { BUILDINGS } from '../src/core/defs';
import { clearListeners, on } from '../src/core/events';
import type { GameEvent } from '../src/core/events';
import { Terrain, TileKind, ZoneType } from '../src/core/types';
import { applyPlan, canUndo, isUnlocked, planTool, undo } from '../src/sim/actions';
import { act, at, flatState, primarySnapshot } from './sim-helpers.test';

let events: GameEvent[] = [];
beforeEach(() => {
  clearListeners();
  events = [];
  for (const t of ['applied', 'denied', 'undo'] as const) on(t, (e) => events.push(e));
});

/** Population high enough that nothing is locked. */
function unlockAll(s: ReturnType<typeof flatState>) {
  s.milestone = MILESTONES.length - 1;
}

test('inspect plans nothing', () => {
  const s = flatState();
  const p = planTool(s, 'inspect', { x: 1, z: 1 }, { x: 4, z: 4 });
  assert.equal(p.tiles.length, 0);
  assert.equal(p.valid, false);
});

test('road: L-shaped path along the long axis first', () => {
  const s = flatState();
  const p = planTool(s, 'road', { x: 2, z: 3 }, { x: 8, z: 5 });
  const expect = [
    ...[2, 3, 4, 5, 6, 7, 8].map((x) => at(s, x, 3)),
    at(s, 8, 4),
    at(s, 8, 5),
  ];
  assert.deepEqual(p.tiles, expect);
  assert.equal(p.cost, expect.length * COST_ROAD);
  assert.ok(p.valid);
  // Long axis is z here: go down first, then across.
  const q = planTool(s, 'road', { x: 2, z: 3 }, { x: 4, z: 9 });
  assert.deepEqual(q.tiles.slice(0, 7), [3, 4, 5, 6, 7, 8, 9].map((z) => at(s, 2, z)));
  assert.deepEqual(q.tiles.slice(7), [at(s, 3, 9), at(s, 4, 9)]);
  // A tap is one tile.
  assert.equal(planTool(s, 'road', { x: 5, z: 5 }, { x: 5, z: 5 }).tiles.length, 1);
});

test('road: existing road is ok but free; trees cost extra; water and buildings block', () => {
  const s = flatState();
  act(s, 'road', { x: 2, z: 2 }, { x: 6, z: 2 });
  s.tiles.trees[at(s, 8, 2)] = 2;
  const p = planTool(s, 'road', { x: 2, z: 2 }, { x: 9, z: 2 });
  assert.ok(p.ok.every(Boolean));
  assert.equal(p.cost, 3 * COST_ROAD + COST_CLEAR_TREES);
  assert.ok(p.valid);
  const again = planTool(s, 'road', { x: 2, z: 2 }, { x: 6, z: 2 });
  assert.equal(again.valid, false);

  s.tiles.terrain[at(s, 4, 6)] = Terrain.Water;
  const wet = planTool(s, 'road', { x: 1, z: 6 }, { x: 8, z: 6 });
  assert.equal(wet.valid, false);
  assert.equal(wet.reason, "Roads can't cross water yet");
  assert.equal(wet.ok[wet.tiles.indexOf(at(s, 4, 6))], false);

  act(s, 'build:park_small', { x: 12, z: 12 });
  const blocked = planTool(s, 'road', { x: 10, z: 12 }, { x: 14, z: 12 });
  assert.equal(blocked.valid, false);
  assert.equal(blocked.ok[blocked.tiles.indexOf(at(s, 12, 12))], false);
});

test('road: applying lays road tiles, marks them and emits applied', () => {
  const s = flatState();
  s.dirty.clear();
  const res = act(s, 'road', { x: 1, z: 1 }, { x: 4, z: 1 });
  assert.equal(res.spent, 4 * COST_ROAD);
  for (let x = 1; x <= 4; x++) {
    assert.equal(s.tiles.kind[at(s, x, 1)], TileKind.Road);
    assert.ok(s.dirty.has(at(s, x, 1)));
  }
  assert.equal(s.money, 100000 - 4 * COST_ROAD);
  assert.equal(s.tiles.roadDist[at(s, 1, 4)], 3);
  const applied = events.find((e) => e.type === 'applied');
  assert.ok(applied && applied.type === 'applied' && applied.tiles.length === 4);
});

test('zones: rectangle on empty land, skipping roads, water, buildings and developed lots', () => {
  const s = flatState();
  act(s, 'road', { x: 3, z: 0 }, { x: 3, z: 10 });
  s.tiles.terrain[at(s, 5, 5)] = Terrain.Water;
  s.tiles.trees[at(s, 6, 6)] = 1;
  act(s, 'zone_res', { x: 0, z: 9 }, { x: 0, z: 9 });
  s.tiles.level[at(s, 0, 9)] = 2; // pretend it developed
  const p = planTool(s, 'zone_com', { x: 0, z: 4 }, { x: 6, z: 9 });
  const okTiles = p.tiles.filter((_, k) => p.ok[k]);
  assert.equal(p.tiles.length, 7 * 6);
  assert.ok(!okTiles.includes(at(s, 3, 5)), 'road skipped');
  assert.ok(!okTiles.includes(at(s, 5, 5)), 'water skipped');
  assert.ok(!okTiles.includes(at(s, 0, 9)), 'developed lot skipped');
  assert.equal(okTiles.length, 42 - 6 - 1 - 1);
  assert.equal(p.cost, okTiles.length * COST_ZONE + COST_CLEAR_TREES);
  act(s, 'zone_com', { x: 0, z: 4 }, { x: 6, z: 9 });
  assert.equal(s.tiles.zone[at(s, 6, 6)], ZoneType.Com);
  assert.equal(s.tiles.trees[at(s, 6, 6)], 0, 'zoning clears trees');
});

test('zones: level-0 lots of another type can be rezoned, same type cannot', () => {
  const s = flatState();
  act(s, 'zone_res', { x: 2, z: 2 }, { x: 4, z: 2 });
  const same = planTool(s, 'zone_res', { x: 2, z: 2 }, { x: 4, z: 2 });
  assert.equal(same.valid, false);
  assert.match(same.reason ?? '', /Already zoned/);
  const other = planTool(s, 'zone_ind', { x: 2, z: 2 }, { x: 4, z: 2 });
  assert.ok(other.valid);
  assert.equal(other.cost, 3 * COST_ZONE);
  const wet = flatState();
  wet.tiles.terrain.fill(Terrain.Water);
  assert.equal(planTool(wet, 'zone_res', { x: 1, z: 1 }, { x: 2, z: 2 }).reason, "Can't zone on water");
});

test('not enough money makes any plan invalid', () => {
  const s = flatState(32, 7, 30);
  const p = planTool(s, 'road', { x: 0, z: 0 }, { x: 9, z: 0 });
  assert.equal(p.valid, false);
  assert.equal(p.reason, 'Not enough money');
  const res = applyPlan(s, p);
  assert.equal(res.ok, false);
  assert.equal(s.money, 30);
  const denied = events.find((e) => e.type === 'denied');
  assert.ok(denied && denied.type === 'denied' && denied.reason === 'Not enough money');
});

test('build: footprint centred on the tap, rotation faces the adjacent road', () => {
  const s = flatState();
  unlockAll(s);
  act(s, 'road', { x: 0, z: 10 }, { x: 31, z: 10 });
  // 3x3 centred on (10, 8): x 9..11, z 7..9; road runs along z = 10, i.e. the +z side.
  const p = planTool(s, 'build:power_coal', { x: 10, z: 8 }, { x: 10, z: 8 });
  assert.deepEqual(p.building, { type: 'power_coal', x: 9, z: 7, w: 3, h: 3, rot: 0 });
  assert.equal(p.tiles.length, 9);
  assert.equal(p.cost, BUILDINGS.power_coal.cost);
  // 2x2 centred on (5, 12): x 5..6 (floor((2-1)/2) = 0), z 12..13; road on the -z side -> rot 2.
  const q = planTool(s, 'build:police', { x: 5, z: 12 }, { x: 5, z: 12 });
  assert.deepEqual(q.building, { type: 'police', x: 5, z: 12, w: 2, h: 2, rot: 2 });
  // Road on the west side -> rot 3; on the east -> rot 1.
  act(s, 'road', { x: 20, z: 15 }, { x: 20, z: 25 });
  assert.equal(planTool(s, 'build:water_tower', { x: 21, z: 18 }, { x: 21, z: 18 }).building?.rot, 3);
  assert.equal(planTool(s, 'build:water_tower', { x: 19, z: 18 }, { x: 19, z: 18 }).building?.rot, 1);
});

test('build: must fit on clear land; trees add cost; level-0 lots are replaced', () => {
  const s = flatState();
  unlockAll(s);
  const edge = planTool(s, 'build:power_coal', { x: 0, z: 5 }, { x: 0, z: 5 });
  assert.equal(edge.valid, false);
  assert.match(edge.reason ?? '', /edge/);
  s.tiles.trees[at(s, 10, 10)] = 3;
  const wooded = planTool(s, 'build:police', { x: 10, z: 10 }, { x: 10, z: 10 });
  assert.ok(wooded.valid);
  assert.equal(wooded.cost, BUILDINGS.police.cost + COST_CLEAR_TREES);
  act(s, 'zone_res', { x: 14, z: 14 }, { x: 15, z: 15 });
  assert.ok(planTool(s, 'build:fire', { x: 14, z: 14 }, { x: 14, z: 14 }).valid);
  s.tiles.level[at(s, 15, 15)] = 1;
  assert.equal(planTool(s, 'build:fire', { x: 14, z: 14 }, { x: 14, z: 14 }).valid, false);
  s.tiles.terrain[at(s, 20, 20)] = Terrain.Water;
  assert.equal(planTool(s, 'build:park_small', { x: 20, z: 20 }, { x: 20, z: 20 }).reason, "Can't build on water");
  act(s, 'build:fire', { x: 2, z: 20 });
  const b = s.buildings[0]!;
  assert.equal(b.type, 'fire');
  for (let z = b.z; z < b.z + 2; z++) {
    for (let x = b.x; x < b.x + 2; x++) {
      assert.equal(s.tiles.kind[at(s, x, z)], TileKind.Building);
      assert.equal(s.tiles.bld[at(s, x, z)], 0);
    }
  }
});

test('water pump must touch water orthogonally', () => {
  const s = flatState();
  unlockAll(s);
  // Pump at (10..11, 10..11). Water diagonal to its corner does not count.
  s.tiles.terrain[at(s, 12, 12)] = Terrain.Water;
  const diag = planTool(s, 'build:water_pump', { x: 10, z: 10 }, { x: 10, z: 10 });
  assert.equal(diag.valid, false);
  assert.equal(diag.reason, 'Must touch a lake or river');
  s.tiles.terrain[at(s, 12, 11)] = Terrain.Water;
  assert.ok(planTool(s, 'build:water_pump', { x: 10, z: 10 }, { x: 10, z: 10 }).valid);
  // Water under the footprint is not allowed.
  assert.equal(planTool(s, 'build:water_pump', { x: 11, z: 11 }, { x: 11, z: 11 }).valid, false);
});

test('locked buildings say when they unlock; unlocks never re-lock', () => {
  const s = flatState();
  const p = planTool(s, 'build:clinic', { x: 10, z: 10 }, { x: 10, z: 10 });
  assert.equal(p.valid, false);
  assert.equal(p.reason, 'Unlocks at 400 people');
  assert.equal(isUnlocked(s, 'build:clinic'), false);
  assert.equal(isUnlocked(s, 'road'), true);
  assert.equal(isUnlocked(s, 'build:power_coal'), true);
  s.stats.population = 400;
  assert.equal(isUnlocked(s, 'build:clinic'), true);
  s.stats.population = 10;
  assert.equal(isUnlocked(s, 'build:clinic'), false);
  s.milestone = MILESTONES.findIndex((m) => m.population === 400);
  assert.equal(isUnlocked(s, 'build:clinic'), true, 'reached milestone keeps it');
  assert.equal(isUnlocked(s, 'build:hospital'), false);
});

test('bulldoze: roads, lots by level, trees, and whole buildings', () => {
  const s = flatState();
  unlockAll(s);
  act(s, 'road', { x: 0, z: 0 }, { x: 3, z: 0 });
  act(s, 'zone_res', { x: 0, z: 2 }, { x: 1, z: 2 });
  s.tiles.level[at(s, 1, 2)] = 2;
  s.tiles.trees[at(s, 3, 3)] = 1;
  const p = planTool(s, 'bulldoze', { x: 0, z: 0 }, { x: 3, z: 3 });
  assert.equal(p.cost, 4 * COST_BULLDOZE_ROAD + 2 * COST_BULLDOZE_LOT_PER_LEVEL + COST_BULLDOZE_TREES);
  act(s, 'bulldoze', { x: 0, z: 0 }, { x: 3, z: 3 });
  for (let z = 0; z <= 3; z++) {
    for (let x = 0; x <= 3; x++) {
      assert.equal(s.tiles.kind[at(s, x, z)], TileKind.Empty);
      assert.equal(s.tiles.trees[at(s, x, z)], 0);
    }
  }
  assert.equal(planTool(s, 'bulldoze', { x: 0, z: 0 }, { x: 3, z: 3 }).reason, 'Nothing to clear here');

  // A building goes as a whole even if the drag touches one tile; the plan shows its footprint.
  act(s, 'build:power_coal', { x: 10, z: 10 }); // 9..11 x 9..11
  const id = s.buildings.length - 1;
  const q = planTool(s, 'bulldoze', { x: 11, z: 11 }, { x: 12, z: 12 });
  assert.equal(q.tiles.length, 4 + 8);
  assert.equal(q.cost, Math.round(BUILDINGS.power_coal.cost * BULLDOZE_BUILDING_SHARE));
  const revB = s.rev.buildings;
  act(s, 'bulldoze', { x: 11, z: 11 }, { x: 12, z: 12 });
  assert.equal(s.buildings[id], null);
  assert.ok(s.rev.buildings > revB);
  for (let z = 9; z <= 11; z++) for (let x = 9; x <= 11; x++) assert.equal(s.tiles.kind[at(s, x, z)], TileKind.Empty);
  assert.ok(s.tiles.bld.every((b) => b === -1));
});

test('undo restores byte-identical primary layers, buildings and money', () => {
  const s = flatState();
  unlockAll(s);
  s.tiles.trees[at(s, 5, 5)] = 2;
  act(s, 'road', { x: 0, z: 8 }, { x: 20, z: 8 });
  act(s, 'zone_res', { x: 0, z: 5 }, { x: 8, z: 7 });
  s.tiles.level[at(s, 2, 6)] = 3;
  const before = primarySnapshot(s);
  const money = s.money;
  const bldsBefore = JSON.stringify(s.buildings);

  act(s, 'build:power_coal', { x: 12, z: 6 });
  act(s, 'bulldoze', { x: 0, z: 5 }, { x: 13, z: 8 });
  act(s, 'zone_ind', { x: 0, z: 0 }, { x: 9, z: 3 });
  assert.notDeepEqual(primarySnapshot(s), before);

  assert.ok(undo(s));
  assert.ok(undo(s));
  assert.ok(undo(s));
  assert.deepEqual(primarySnapshot(s), before);
  assert.equal(s.money, money);
  assert.equal(JSON.stringify(s.buildings), bldsBefore);
  const u = events.filter((e) => e.type === 'undo');
  assert.equal(u.length, 3);

  // Undoing a bulldozed building brings it back where it was.
  act(s, 'build:police', { x: 20, z: 20 });
  const placed = JSON.stringify(s.buildings);
  act(s, 'bulldoze', { x: 20, z: 20 });
  undo(s);
  assert.equal(JSON.stringify(s.buildings), placed);
});

test('undo stack is capped and undo with nothing to undo returns false', () => {
  const s = flatState();
  assert.equal(canUndo(s), false);
  assert.equal(undo(s), false);
  for (let k = 0; k < UNDO_STACK_SIZE + 5; k++) act(s, 'road', { x: k % 30, z: Math.floor(k / 30) });
  assert.equal(s.undo.length, UNDO_STACK_SIZE);
  assert.ok(canUndo(s));
});

test('applyPlan re-validates a stale plan', () => {
  const s = flatState();
  const p = planTool(s, 'road', { x: 0, z: 0 }, { x: 5, z: 0 });
  s.tiles.terrain[at(s, 3, 0)] = Terrain.Water;
  const res = applyPlan(s, p);
  assert.equal(res.ok, false);
  assert.equal(s.tiles.kind[at(s, 0, 0)], TileKind.Empty);
  assert.equal(s.money, 100000);
  assert.equal(s.undo.length, 0);
});
