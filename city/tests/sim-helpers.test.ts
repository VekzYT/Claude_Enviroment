// Shared helpers for the sim tests (not a test file itself: it does not match *.test.ts).
import { createState } from '../src/core/state';
import type { GameState, TilePos, ToolId } from '../src/core/types';
import { Terrain } from '../src/core/types';
import { applyPlan, planTool } from '../src/sim/actions';
import { recompute } from '../src/sim/index';

/** A small all-grass map with no trees, plenty of money and derived layers computed. */
export function flatState(size = 32, seed = 7, money = 100000): GameState {
  const s = createState(size, seed, 'Test');
  s.money = money;
  s.tiles.terrain.fill(Terrain.Grass);
  s.tiles.trees.fill(0);
  recompute(s);
  return s;
}

export function at(s: GameState, x: number, z: number): number {
  return z * s.size + x;
}

/** Plan and apply in one go; throws if the plan was not applied. */
export function act(s: GameState, tool: ToolId, a: TilePos, b: TilePos = a) {
  const plan = planTool(s, tool, a, b);
  const res = applyPlan(s, plan);
  if (!res.ok) throw new Error(`${tool} failed: ${plan.reason ?? res.message}`);
  return res;
}

/** Copy of every primary layer, for byte-exact comparisons. */
export function primarySnapshot(s: GameState) {
  const T = s.tiles;
  return {
    terrain: Array.from(T.terrain),
    trees: Array.from(T.trees),
    kind: Array.from(T.kind),
    zone: Array.from(T.zone),
    level: Array.from(T.level),
    variant: Array.from(T.variant),
    bld: Array.from(T.bld),
    distress: Array.from(T.distress),
  };
}

// ---- the helpers' own sanity check (this file doubles as a test file so it matches tests/sim-*.test.ts).
// Registered only when this file is run directly, so importing the helpers doesn't repeat it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  test('flatState gives an all-grass map with computed road distances', () => {
    const s = flatState(16);
    assert.equal(s.size, 16);
    assert.ok(s.tiles.terrain.every((t) => t === Terrain.Grass));
    assert.ok(s.tiles.roadDist.every((d) => d === 255));
    assert.equal(at(s, 3, 2), 35);
  });
}
