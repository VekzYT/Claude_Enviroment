import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SAVE_VERSION } from '../src/core/config';
import { DERIVED_LAYERS } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { applyPlan, planTool } from '../src/sim/actions';
import { newGame, simulateDay } from '../src/sim/index';
import { deserialize, serialize } from '../src/sim/save';
import { primarySnapshot } from './sim-helpers.test';

/** A city with roads, zones, buildings (one of them bulldozed, leaving a null) and some history. */
function playedCity(): GameState {
  const s = newGame(77, 'Brickford');
  const c = 32;
  const go = (tool: Parameters<typeof planTool>[1], a: { x: number; z: number }, b = a) => {
    const r = applyPlan(s, planTool(s, tool, a, b));
    assert.ok(r.ok, `${tool} applied`);
  };
  go('road', { x: c - 10, z: c }, { x: c + 10, z: c });
  go('road', { x: c, z: c - 8 }, { x: c, z: c + 8 });
  go('build:power_coal', { x: c + 8, z: c + 2 });
  go('build:water_tower', { x: c - 2, z: c + 1 });
  go('build:park_small', { x: c + 3, z: c + 3 });
  go('bulldoze', { x: c + 3, z: c + 3 });
  go('zone_res', { x: c - 9, z: c - 3 }, { x: c - 1, z: c - 1 });
  go('zone_com', { x: c + 1, z: c - 3 }, { x: c + 5, z: c - 1 });
  go('zone_ind', { x: c + 1, z: c + 1 }, { x: c + 5, z: c + 2 });
  s.taxes.com = 11;
  for (let d = 0; d < 100; d++) simulateDay(s);
  return s;
}

function derivedSnapshot(s: GameState) {
  const out: Record<string, number[]> = {};
  for (const k of DERIVED_LAYERS) out[k] = Array.from(s.tiles[k]);
  return out;
}

test('save round-trips exactly', () => {
  const s = playedCity();
  assert.ok(s.stats.population > 0, 'the city grew');
  assert.ok(s.buildings.includes(null), 'has a removed building');
  const text = serialize(s);
  const json = JSON.parse(text);
  assert.equal(json.version, SAVE_VERSION);
  const t = deserialize(text);
  assert.equal(serialize(t), text);
  assert.deepEqual(primarySnapshot(t), primarySnapshot(s));
  assert.deepEqual(derivedSnapshot(t), derivedSnapshot(s));
  assert.deepEqual(t.buildings, s.buildings);
  assert.deepEqual(t.history, s.history);
  assert.deepEqual(t.taxes, s.taxes);
  for (const k of ['name', 'seed', 'size', 'day', 'money', 'milestone', 'monthsInDebt', 'speed', 'timeOfDay'] as const) {
    assert.equal(t[k], s[k], k);
  }
  assert.equal(t.stats.population, s.stats.population);
  assert.equal(t.stats.happiness, s.stats.happiness);
  assert.deepEqual(t.stats.demand, s.stats.demand);
  assert.equal(t.dirty.size, t.size * t.size, 'every tile marked dirty');
  assert.equal(t.undo.length, 0);
  // The loaded city carries on exactly like the original.
  for (let d = 0; d < 40; d++) {
    simulateDay(s);
    simulateDay(t);
  }
  assert.deepEqual(primarySnapshot(t), primarySnapshot(s));
  assert.equal(t.money, s.money);
});

test('deserialize rejects garbage with a readable error', () => {
  const good = JSON.parse(serialize(playedCity()));
  const mutate = (f: (j: any) => void) => {
    const j = structuredClone(good);
    f(j);
    return JSON.stringify(j);
  };
  const cases: Array<[string, string]> = [
    ['', 'empty'],
    ['hello there', 'not json'],
    ['[]', 'array'],
    ['{}', 'no format'],
    ['null', 'null'],
    [mutate((j) => (j.version = SAVE_VERSION + 1)), 'newer version'],
    [mutate((j) => (j.size = 5)), 'tiny map'],
    [mutate((j) => (j.size = 63)), 'size does not match layers'],
    [mutate((j) => (j.money = 'lots')), 'money not a number'],
    [mutate((j) => (j.day = -3)), 'negative day'],
    [mutate((j) => (j.taxes.res = 99)), 'tax out of range'],
    [mutate((j) => (j.milestone = 42)), 'milestone out of range'],
    [mutate((j) => (j.layers.terrain = j.layers.terrain.slice(0, 100))), 'truncated layer'],
    [mutate((j) => (j.layers.kind = '!!!!' + j.layers.kind.slice(4))), 'bad base64'],
    [mutate((j) => delete j.layers.bld), 'missing layer'],
    [mutate((j) => (j.buildings[0].type = 'castle')), 'unknown building'],
    [mutate((j) => (j.buildings[0].x = 70)), 'building off the map'],
    [mutate((j) => (j.buildings[0].id = 5)), 'building id mismatch'],
    [mutate((j) => j.buildings.push({ id: j.buildings.length, type: 'police', x: 0, z: 0, w: 2, h: 2, rot: 0, active: false })), 'building missing from map'],
    [mutate((j) => (j.buildings = 'none')), 'buildings not a list'],
    [mutate((j) => (j.history = [{ day: 1 }])), 'bad history'],
  ];
  for (const [text, what] of cases) {
    assert.throws(
      () => deserialize(text),
      (err: unknown) => err instanceof Error && err.message.length > 8 && /save|Cubopolis/i.test(err.message),
      what,
    );
  }
  // Tile values that make no sense are caught too.
  const terrain = Buffer.from(good.layers.terrain, 'base64');
  terrain[10] = 9;
  assert.throws(() => deserialize(JSON.stringify({ ...good, layers: { ...good.layers, terrain: terrain.toString('base64') } })), /terrain/);
});

test('a brand-new city saves and loads', () => {
  const s = newGame(3, 'Fresh');
  const t = deserialize(serialize(s));
  assert.deepEqual(primarySnapshot(t), primarySnapshot(s));
  assert.equal(t.name, 'Fresh');
  assert.equal(t.buildings.length, 0);
});
