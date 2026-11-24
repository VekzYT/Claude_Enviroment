import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ROADS, SWAMP_FLOOR, WATER_FLOOR } from '../src/core/config';
import { fixtureCity } from '../src/core/fixture';
import { districtAt, groundY, lineOfSight, nearestLane, newRayHit, queryColliders, raycast, surfaceAt } from '../src/core/query';
import { Surface } from '../src/core/types';

const map = fixtureCity(1);

test('fixture city is well formed', () => {
  assert.equal(map.size, 1024);
  assert.ok(map.trails.length >= 2);
  for (const p of map.pois) assert.ok(p.x > 0 && p.z > 0 && p.x < map.size && p.z < map.size);
  assert.ok(map.buildings.length >= 60);
  assert.ok(map.lanes.length > 0 && map.walks.length > 0);
  for (const l of map.lanes) {
    assert.ok(l.len > 20, 'lane has length');
    assert.ok(l.out.length > 0, 'lane leads somewhere');
    for (const o of l.out) assert.equal(map.lanes[o].from, l.to);
  }
  for (const e of map.edges) assert.ok(e.axis === 0 ? e.x1 > e.x0 && e.z0 === e.z1 : e.z1 > e.z0 && e.x0 === e.x1);
  for (const b of map.buildings) for (const p of b.parts) assert.ok(p.x1 > p.x0 && p.z1 > p.z0 && p.y1 > p.y0);
});

test('surfaces', () => {
  const n = map.nodes[7];
  assert.equal(surfaceAt(map, n.x, n.z), Surface.Road);
  assert.equal(surfaceAt(map, -5, 10), Surface.Water);
  assert.equal(surfaceAt(map, map.spawn.x, map.spawn.z), Surface.Sidewalk);
  const bridge = map.edges.find((e) => e.bridge)!;
  assert.equal(surfaceAt(map, (bridge.x0 + bridge.x1) / 2, bridge.z0), Surface.Bridge);
  assert.equal(groundY(map, (bridge.x0 + bridge.x1) / 2, bridge.z0), 0);
  assert.equal(groundY(map, (bridge.x0 + bridge.x1) / 2, bridge.z0 + 60), WATER_FLOOR);
  assert.ok(districtAt(map, 200, 200).length > 0);
  // the wilderness
  assert.equal(districtAt(map, 100, 900), 'forest');
  assert.equal(surfaceAt(map, 60, 820), Surface.Forest);
  assert.equal(surfaceAt(map, 700, 850), Surface.Swamp);
  assert.equal(groundY(map, 700, 850), SWAMP_FLOOR);
  assert.equal(surfaceAt(map, 500, 900), Surface.Boardwalk);
  assert.equal(groundY(map, 500, 900), 0);
  assert.equal(surfaceAt(map, 800, 300), Surface.Sand);
  assert.equal(surfaceAt(map, 950, 300), Surface.Water);
  assert.equal(surfaceAt(map, 250, 870), Surface.Dirt);
  const boat = map.pois.find((p) => p.tag === 'boat')!;
  assert.equal(surfaceAt(map, boat.x, boat.z), Surface.Water);
  const rural = map.edges.find((e) => e.cls === 'rural')!;
  assert.equal(surfaceAt(map, rural.x0, (rural.z0 + rural.z1) / 2), Surface.Road);
});

test('right-hand traffic', () => {
  const e = map.edges.find((x) => x.axis === 0 && x.cls === 'street')!;
  const east = map.lanes.find((l) => l.edge === e.id && l.dir === 1)!;
  assert.ok(east.bx > east.ax && east.az > e.z0, 'eastbound lane is on the south side');
  const s = map.edges.find((x) => x.axis === 1 && x.cls === 'street')!;
  const south = map.lanes.find((l) => l.edge === s.id && l.dir === 1)!;
  assert.ok(south.bz > south.az && south.ax < s.x0, 'southbound lane is on the west side');
  assert.equal(nearestLane(map, east.ax + 5, east.az + 0.5, 6), east.id);
  assert.ok(ROADS.street.half > 0);
});

test('ramp height', () => {
  const r = map.ramps[0];
  assert.equal(groundY(map, (r.x0 + r.x1) / 2, r.z0 + 0.001) < 0.01, true);
  assert.ok(Math.abs(groundY(map, (r.x0 + r.x1) / 2, r.z1 - 0.001) - r.h) < 0.01);
});

test('colliders and rays', () => {
  const b = map.buildings[0];
  const out: number[] = [];
  const k = queryColliders(map, b.x0 + 1, b.z0 + 1, b.x1 - 1, b.z1 - 1, out);
  assert.ok(k > 0 && out.slice(0, k).some((i) => map.colliders[i].kind === 'building' && map.colliders[i].ref === b.id));
  // a ray along +x at head height from west of the building hits its west wall
  const hit = newRayHit();
  const zc = (b.z0 + b.z1) / 2;
  const t = raycast(map, b.x0 - 10, 1.5, zc, 1, 0, 0, 100, hit, true);
  assert.ok(Math.abs(t - 10) < 1e-6, `hit at ${t}`);
  assert.equal(hit.nx, -1);
  assert.equal(map.colliders[hit.collider].ref, b.id);
  // brute-force check against every building box on a batch of random rays
  let s = 12345;
  const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let i = 0; i < 300; i++) {
    const ox = rnd() * map.size, oz = rnd() * map.size, oy = 0.5 + rnd() * 40;
    const a = rnd() * Math.PI * 2, el = (rnd() - 0.5) * 0.6;
    const dx = Math.cos(a) * Math.cos(el), dz = Math.sin(a) * Math.cos(el), dy = Math.sin(el);
    const got = raycast(map, ox, oy, oz, dx, dy, dz, 400, undefined, true);
    let want = -1;
    for (const c of map.colliders) {
      if (c.kind !== 'building') continue;
      let t0 = 0, t1 = 400, ok = true;
      for (const [o, d, lo, hi] of [[ox, dx, c.x0, c.x1], [oy, dy, c.y0, c.y1], [oz, dz, c.z0, c.z1]] as const) {
        if (d === 0) { if (o < lo || o > hi) ok = false; continue; }
        let p = (lo - o) / d, q = (hi - o) / d;
        if (p > q) [p, q] = [q, p];
        t0 = Math.max(t0, p); t1 = Math.min(t1, q);
      }
      if (ok && t0 <= t1 && (want < 0 || t0 < want)) want = t0;
    }
    assert.ok(Math.abs(got - want) < 1e-6, `ray ${i}: got ${got}, want ${want}`);
  }
  assert.equal(lineOfSight(map, b.x0 - 5, 2, zc, b.x1 + 5, 2, zc), false);
  assert.equal(lineOfSight(map, map.nodes[0].x, 2, map.nodes[0].z, map.nodes[1].x, 2, map.nodes[1].z), true);
});
