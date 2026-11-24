import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAP_SIZE } from '../src/core/config';
import { Terrain, TileKind } from '../src/core/types';
import { newGame } from '../src/sim/index';
import { buildableShare } from '../src/sim/mapgen';
import { primarySnapshot } from './sim-helpers.test';

const SEEDS = Array.from({ length: 20 }, (_, k) => k * 7919 + 13);

test('newGame is deterministic for a seed', () => {
  for (const seed of [1, 42, 123456]) {
    const a = newGame(seed);
    const b = newGame(seed);
    assert.deepEqual(primarySnapshot(a), primarySnapshot(b));
  }
  assert.notDeepEqual(primarySnapshot(newGame(1)).terrain, primarySnapshot(newGame(2)).terrain);
});

test('maps are 64x64, start empty and are mostly buildable across 20 seeds', () => {
  for (const seed of SEEDS) {
    const s = newGame(seed);
    assert.equal(s.size, MAP_SIZE);
    assert.equal(s.tiles.terrain.length, MAP_SIZE * MAP_SIZE);
    assert.ok(buildableShare(s) >= 0.65, `seed ${seed}: buildable ${buildableShare(s)}`);
    assert.ok(s.tiles.kind.every((k) => k === TileKind.Empty));
    assert.equal(s.buildings.length, 0);
    assert.equal(s.stats.population, 0);
  }
});

test('every map has water, sandy shores, woods of 15-35% and a clear centre', () => {
  let rivers = 0;
  for (const seed of SEEDS) {
    const s = newGame(seed);
    const T = s.tiles;
    const n = s.size * s.size;
    let water = 0;
    let land = 0;
    let trees = 0;
    let sand = 0;
    for (let i = 0; i < n; i++) {
      if (T.terrain[i] === Terrain.Water) {
        water++;
        assert.equal(T.trees[i], 0, 'no trees in water');
      } else land++;
      if (T.terrain[i] === Terrain.Sand) {
        sand++;
        assert.equal(T.trees[i], 0, 'no trees on sand');
      }
      if (T.trees[i]) {
        trees++;
        assert.ok(T.trees[i] >= 1 && T.trees[i] <= 3);
      }
    }
    assert.ok(water > 0, `seed ${seed} has water`);
    assert.ok(sand > 0, `seed ${seed} has sand`);
    const share = trees / land;
    assert.ok(share >= 0.15 && share <= 0.35, `seed ${seed}: trees ${share}`);
    // Nothing wet or wooded right in the middle.
    const c = s.size / 2;
    for (let z = 0; z < s.size; z++) {
      for (let x = 0; x < s.size; x++) {
        const d = Math.hypot(x + 0.5 - c, z + 0.5 - c);
        const i = z * s.size + x;
        if (d < 8) {
          assert.notEqual(T.terrain[i], Terrain.Water, `seed ${seed}: water near centre`);
          assert.equal(T.trees[i], 0, `seed ${seed}: trees near centre`);
        }
      }
    }
    // A river touches two opposite edges.
    const edgeWater = (side: number) => {
      for (let t = 0; t < s.size; t++) {
        const [x, z] = side === 0 ? [t, 0] : side === 1 ? [s.size - 1, t] : side === 2 ? [t, s.size - 1] : [0, t];
        if (T.terrain[z * s.size + x] === Terrain.Water) return true;
      }
      return false;
    };
    if ((edgeWater(0) && edgeWater(2)) || (edgeWater(1) && edgeWater(3))) rivers++;
  }
  assert.ok(rivers >= 4 && rivers <= 18, `some but not all maps have a river (${rivers})`);
});

test('newGame computes derived layers and marks the whole map dirty', () => {
  const s = newGame(5);
  assert.equal(s.dirty.size, s.size * s.size);
  assert.ok(s.rev.derived > 0);
  assert.equal(s.needsRecompute, false);
  assert.ok(s.tiles.landValue.some((v) => v > 0));
});
