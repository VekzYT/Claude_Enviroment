// A small, plain test map that follows every rule of the CityMap contract. North-west: a 5 x 5 grid
// of city blocks with streets and avenues, every facade style, a park, a plaza and a canal with a
// bridge. South: a strip of wilderness with a forest, a dirt trail, a swamp with a boardwalk and a
// shack, and a country road. East: a beach and the sea, joined to the canal. Modules use it in
// their dev harnesses and tests so they do not depend on the real generator in src/world. Also
// exports the lane and sidewalk builders, which src/world may reuse.

import { DISTRICT_CELL, LANE_WIDTH, ROADS, SURF_CELL } from './config';
import { DISTRICT_IDS } from './defs';
import { finalizeCity, paintPath, paintRect } from './query';
import { makeRng } from './rng';
import type { Block, Building, BuildingStyle, CityMap, DistrictId, Lane, Poi, Prop, Ramp, RoadClass, RoadEdge, RoadNode, Trail, WalkSeg } from './types';
import { Surface } from './types';

/**
 * Directed lanes for every edge, trimmed to the junction squares, with `out` links at each node.
 * Right-hand traffic: heading +x the lanes are on the +z side, heading +z on the -x side.
 */
export function buildLanes(nodes: RoadNode[], edges: RoadEdge[]): Lane[] {
  const lanes: Lane[] = [];
  for (const e of edges) {
    const spec = ROADS[e.cls];
    const a = nodes[e.a];
    const b = nodes[e.b];
    for (const dir of [1, -1] as const) {
      for (let k = 0; k < e.lanes; k++) {
        const off = spec.median + (k + 0.5) * LANE_WIDTH;
        let ax: number, az: number, bx: number, bz: number;
        if (e.axis === 0) {
          const z = e.z0 + (dir === 1 ? off : -off);
          const xa = a.x + a.half;
          const xb = b.x - b.half;
          ax = dir === 1 ? xa : xb;
          bx = dir === 1 ? xb : xa;
          az = bz = z;
        } else {
          const x = e.x0 + (dir === 1 ? -off : off);
          const za = a.z + a.half;
          const zb = b.z - b.half;
          az = dir === 1 ? za : zb;
          bz = dir === 1 ? zb : za;
          ax = bx = x;
        }
        lanes.push({
          id: lanes.length, edge: e.id, dir, index: k, ax, az, bx, bz,
          len: Math.abs(bx - ax) + Math.abs(bz - az),
          from: dir === 1 ? e.a : e.b, to: dir === 1 ? e.b : e.a, speed: spec.speed, out: [],
        });
      }
    }
  }
  const leaving = new Map<number, Lane[]>();
  for (const l of lanes) {
    let list = leaving.get(l.from);
    if (!list) leaving.set(l.from, (list = []));
    list.push(l);
  }
  for (const l of lanes) {
    const next = leaving.get(l.to) ?? [];
    const onward = next.filter((m) => m.edge !== l.edge);
    // a dead end: turn back along the same road
    l.out = (onward.length ? onward : next).map((m) => m.id);
  }
  return lanes;
}

/**
 * Two sidewalk segments per edge (none where the road has no sidewalk), joined at each junction to
 * every other sidewalk end there. Simple, not pretty: src/world lays proper corners and crossings.
 */
export function buildWalks(nodes: RoadNode[], edges: RoadEdge[]): WalkSeg[] {
  const walks: WalkSeg[] = [];
  const ends = new Map<number, Array<{ seg: number; end: 'a' | 'b' }>>();
  const note = (node: number, seg: number, end: 'a' | 'b') => {
    let list = ends.get(node);
    if (!list) ends.set(node, (list = []));
    list.push({ seg, end });
  };
  for (const e of edges) {
    if (e.walk <= 0) continue;
    const a = nodes[e.a];
    const b = nodes[e.b];
    const off = e.half + e.walk / 2;
    for (const side of [1, -1]) {
      const id = walks.length;
      if (e.axis === 0) walks.push({ id, ax: a.x + a.half + e.walk, az: e.z0 + side * off, bx: b.x - b.half - e.walk, bz: e.z0 + side * off, a: [], b: [], crossing: false });
      else walks.push({ id, ax: e.x0 + side * off, az: a.z + a.half + e.walk, bx: e.x0 + side * off, bz: b.z - b.half - e.walk, a: [], b: [], crossing: false });
      note(e.a, id, 'a');
      note(e.b, id, 'b');
    }
  }
  for (const list of ends.values()) {
    for (const p of list) for (const q of list) if (p.seg !== q.seg) walks[p.seg][p.end].push(q.seg);
  }
  return walks;
}

const STYLES: BuildingStyle[] = ['glass', 'ceramic', 'brick', 'concrete', 'neon', 'residential', 'datacenter'];
const CITY_DISTRICTS: DistrictId[] = ['core', 'strip', 'heights', 'harbor', 'park', 'market'];

/** The test map: 1024 m square. */
export function fixtureCity(seed = 1): CityMap {
  const rng = makeRng(seed);
  const blocks = 5;
  const pitch = 128;
  const size = 1024;
  const cityEnd = blocks * pitch + 128; // 768: the city grid lies in [0, 768] x [0, 768]
  const lines = blocks + 1;
  const pos = (i: number) => 64 + i * pitch;
  const cls = (i: number): RoadClass => (i === 0 || i === lines - 1 || i === Math.floor(lines / 2) ? 'avenue' : 'street');
  // A canal runs north-south through the last column of blocks, crossed by one bridge, and on south
  // through the swamp to the sea.
  const waterX0 = pos(lines - 2) + 30;
  const waterX1 = pos(lines - 1) - 30;
  const bridgeRow = Math.floor(lines / 2);
  const beachX = 760; // sand from here east
  const seaX = 880; // open sea from here east
  const wildZ = 790; // wilderness from here south
  const seaZ = 990; // and the sea again along the south edge, east of the canal

  const surfN = size / SURF_CELL;
  const surface = new Uint8Array(surfN * surfN).fill(Surface.Ground);
  const districtN = size / DISTRICT_CELL;
  const district = new Uint8Array(districtN * districtN);
  const districtOf = (bx: number, bz: number): DistrictId => CITY_DISTRICTS[(bx + bz * 2) % CITY_DISTRICTS.length];
  const paintS = (x0: number, z0: number, x1: number, z1: number, v: Surface) => paintRect(surface, surfN, SURF_CELL, x0, z0, x1, z1, v);
  const paintD = (x0: number, z0: number, x1: number, z1: number, d: DistrictId) => paintRect(district, districtN, DISTRICT_CELL, x0, z0, x1, z1, DISTRICT_IDS.indexOf(d));

  // ---- the lie of the land: forest, swamp, beach, sea, canal
  paintD(0, cityEnd, 400, size, 'forest');
  paintD(400, cityEnd, beachX, size, 'bayou');
  paintD(beachX, 0, size, size, 'coast');
  paintS(0, wildZ, 400, size, Surface.Forest);
  paintS(400, wildZ, beachX, size, Surface.Swamp);
  paintS(beachX, 0, seaX, size, Surface.Sand);
  paintS(seaX, 0, size, size, Surface.Water);
  paintS(waterX0, 0, waterX1, size, Surface.Water);
  paintS(waterX0, seaZ, size, size, Surface.Water);

  // ---- nodes and edges
  const nodes: RoadNode[] = [];
  const edges: RoadEdge[] = [];
  const nodeId = (i: number, j: number) => j * lines + i;
  for (let j = 0; j < lines; j++) {
    for (let i = 0; i < lines; i++) {
      const half = Math.max(ROADS[cls(i)].half, ROADS[cls(j)].half);
      nodes.push({ id: nodeId(i, j), x: pos(i), z: pos(j), edges: [-1, -1, -1, -1], half, signal: cls(i) === 'avenue' && cls(j) === 'avenue' });
    }
  }
  const addEdge = (a: number, b: number, axis: 0 | 1, c: RoadClass, name: string, bridge: boolean) => {
    const spec = ROADS[c];
    const id = edges.length;
    edges.push({ id, a, b, axis, cls: c, x0: nodes[a].x, z0: nodes[a].z, x1: nodes[b].x, z1: nodes[b].z, half: spec.half, walk: spec.walk, lanes: spec.lanes, bridge, name });
    if (axis === 0) {
      nodes[a].edges[1] = id;
      nodes[b].edges[3] = id;
    } else {
      nodes[a].edges[2] = id;
      nodes[b].edges[0] = id;
    }
  };
  for (let j = 0; j < lines; j++) {
    for (let i = 0; i < lines - 1; i++) {
      const overWater = i === lines - 2;
      if (overWater && j !== bridgeRow) continue; // only one road crosses the canal
      addEdge(nodeId(i, j), nodeId(i + 1, j), 0, cls(j), `${j + 1}th Street`, overWater);
    }
  }
  for (let i = 0; i < lines; i++) for (let j = 0; j < lines - 1; j++) addEdge(nodeId(i, j), nodeId(i, j + 1), 1, cls(i), `Avenue ${String.fromCharCode(65 + i)}`, false);
  // a country road south from the middle of the city into the forest, ending at an outpost
  const ruralX = pos(2);
  const outpost: RoadNode = { id: nodes.length, x: ruralX, z: 980, edges: [-1, -1, -1, -1], half: ROADS.rural.half, signal: false };
  nodes.push(outpost);
  addEdge(nodeId(2, lines - 1), outpost.id, 1, 'rural', 'Bayou Road', false);

  // ---- surface: road corridors (sidewalk under roadway), junctions
  for (const e of edges) {
    const w = e.half + e.walk;
    if (e.axis === 0) {
      if (!e.bridge) paintS(e.x0, e.z0 - w, e.x1, e.z0 + w, Surface.Sidewalk);
      paintS(e.x0, e.z0 - e.half, e.x1, e.z0 + e.half, Surface.Road);
      if (e.bridge) paintS(waterX0, e.z0 - w, waterX1, e.z0 + w, Surface.Bridge);
    } else {
      if (e.walk > 0) paintS(e.x0 - w, e.z0, e.x0 + w, e.z1, Surface.Sidewalk);
      paintS(e.x0 - e.half, e.z0, e.x0 + e.half, e.z1, Surface.Road);
    }
  }
  for (const nd of nodes) paintS(nd.x - nd.half, nd.z - nd.half, nd.x + nd.half, nd.z + nd.half, Surface.Road);

  // ---- city blocks, buildings, props
  const blocksOut: Block[] = [];
  const buildings: Building[] = [];
  const props: Prop[] = [];
  const pois: Poi[] = [];
  const ramps: Ramp[] = [];
  const prop = (kind: Prop['kind'], x: number, z: number, yaw = 0, extra: Partial<Prop> = {}) =>
    props.push({ kind, x, y: 0, z, yaw, scale: 1, seed: Math.floor(rng() * 1e6), ...extra });
  const mid = Math.floor(blocks / 2);
  for (let bz = 0; bz < blocks; bz++) {
    for (let bx = 0; bx < blocks; bx++) {
      const inset = (i: number) => ROADS[cls(i)].half + ROADS[cls(i)].walk;
      const x0 = pos(bx) + inset(bx);
      const x1 = pos(bx + 1) - inset(bx + 1);
      const z0 = pos(bz) + inset(bz);
      const z1 = pos(bz + 1) - inset(bz + 1);
      const d = districtOf(bx, bz);
      paintD(pos(bx), pos(bz), pos(bx + 1), pos(bz + 1), d);
      const isWater = bx === blocks - 1;
      const use: Block['use'] = isWater ? 'water' : bx === mid && bz === mid ? 'plaza' : bx === 1 && bz === 1 ? 'park' : 'built';
      const id = blocksOut.length;
      blocksOut.push({ id, x0, z0, x1, z1, district: d, use });
      if (use === 'water') continue;
      if (use === 'park') {
        paintS(x0, z0, x1, z1, Surface.Park);
        for (let k = 0; k < 24; k++) prop(rng() < 0.7 ? 'tree' : 'bush', x0 + 4 + rng() * (x1 - x0 - 8), z0 + 4 + rng() * (z1 - z0 - 8), rng() * 6.28, { scale: 0.8 + rng() * 0.5 });
        prop('bench', (x0 + x1) / 2, z0 + 3, 0);
        continue;
      }
      if (use === 'plaza') {
        paintS(x0, z0, x1, z1, Surface.Plaza);
        prop('fountain', (x0 + x1) / 2, (z0 + z1) / 2);
        prop('statue', x0 + 14, z0 + 14);
        prop('holo_ad', x1 - 12, z0 + 12);
        continue;
      }
      paintS(x0, z0, x1, z1, Surface.Lot);
      // four buildings, one in each quarter, each facing its nearest street
      const mx = (x0 + x1) / 2;
      const mz = (z0 + z1) / 2;
      const quarters: Array<[number, number, number, number, 0 | 1 | 2 | 3]> = [
        [x0, z0, mx, mz, 2],
        [mx, z0, x1, mz, 1],
        [x0, mz, mx, z1, 3],
        [mx, mz, x1, z1, 0],
      ];
      for (const [qx0, qz0, qx1, qz1, front] of quarters) {
        const gap = 3 + rng() * 3;
        const style = STYLES[buildings.length % STYLES.length];
        const tall = d === 'core' ? 60 + rng() * 140 : 10 + rng() * 40;
        const b: Building = {
          id: buildings.length, block: id, district: d, style, parts: [],
          x0: qx0 + gap, z0: qz0 + gap, x1: qx1 - gap, z1: qz1 - gap, h: tall, front, seed: Math.floor(rng() * 1e9),
        };
        if (tall > 50) {
          // podium and a narrower tower
          const pod = 12;
          b.parts.push({ x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1, y0: 0, y1: pod });
          b.parts.push({ x0: b.x0 + 5, z0: b.z0 + 5, x1: b.x1 - 5, z1: b.z1 - 5, y0: pod, y1: tall });
          props.push({ kind: 'antenna', x: (b.x0 + b.x1) / 2, y: tall, z: (b.z0 + b.z1) / 2, yaw: 0, scale: 1, seed: b.seed });
        } else {
          b.parts.push({ x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1, y0: 0, y1: tall });
          props.push({ kind: 'ac_unit', x: b.x0 + 4, y: tall, z: b.z0 + 4, yaw: 0, scale: 1, seed: b.seed });
        }
        buildings.push(b);
      }
    }
  }

  // ---- street furniture: lamps along every city road, signals at the big junctions
  for (const e of edges) {
    if (e.walk <= 0) continue;
    const off = e.half + 0.8;
    const len = e.axis === 0 ? e.x1 - e.x0 : e.z1 - e.z0;
    for (let s = 32; s < len - 16; s += 32) {
      for (const side of [1, -1]) {
        if (e.axis === 0) prop('lamp', e.x0 + s, e.z0 + side * off, side > 0 ? Math.PI : 0);
        else prop('lamp', e.x0 + side * off, e.z0 + s, side > 0 ? -Math.PI / 2 : Math.PI / 2);
      }
    }
  }
  for (const nd of nodes) if (nd.signal) prop('traffic_light', nd.x + nd.half + 0.8, nd.z + nd.half + 0.8);

  // ---- the wilderness
  const trails: Trail[] = [];
  // a dirt trail: off the country road, west through the forest to a clearing, then round to the swamp
  const dirt = [ruralX - 5, 860, 250, 870, 190, 905, 140, 940, 170, 985, 260, 1000, 330, 1005, 392, 960, 420, 905];
  trails.push({ id: 0, name: 'Glow Trail', kind: 'dirt', width: 5, pts: dirt });
  paintPath(surface, surfN, SURF_CELL, dirt, 5, Surface.Dirt, [Surface.Road, Surface.Water]);
  // a clearing with a camp
  paintPath(surface, surfN, SURF_CELL, [140, 940, 141, 941], 26, Surface.Ground, [Surface.Dirt]);
  prop('campfire', 132, 936);
  prop('log', 128, 942, Math.PI / 2, { w: 0.6, h: 0.5, d: 3.2 });
  // a boardwalk from the end of the trail across the swamp to a dock on the canal
  const walkway = [420, 905, 500, 900, waterX0 + 4, 900];
  trails.push({ id: 1, name: 'Bayou Boardwalk', kind: 'boardwalk', width: 4, pts: walkway });
  paintPath(surface, surfN, SURF_CELL, walkway, 4, Surface.Boardwalk);
  for (let x = 430; x < waterX0; x += 20) {
    prop('dock_post', x, 897.6);
    prop('dock_post', x, 902.4);
  }
  // an islet in the swamp with a shack: the chop shop
  paintPath(surface, surfN, SURF_CELL, [470, 955, 471, 956], 36, Surface.Ground);
  paintPath(surface, surfN, SURF_CELL, [470, 905, 470, 945], 4, Surface.Boardwalk);
  const shack: Building = { id: buildings.length, block: -1, district: 'bayou', style: 'shack', parts: [{ x0: 464, z0: 952, x1: 476, z1: 961, y0: 0, y1: 4.5 }], x0: 464, z0: 952, x1: 476, z1: 961, h: 4.5, front: 2, seed: 77 };
  buildings.push(shack);
  // trees, rocks and glow
  for (let k = 0; k < 150; k++) {
    const x = 6 + rng() * 388;
    const z = wildZ + 6 + rng() * (size - wildZ - 12);
    const s = surface[Math.floor(z / SURF_CELL) * surfN + Math.floor(x / SURF_CELL)];
    if (s !== Surface.Forest) continue;
    const roll = rng();
    prop(roll < 0.45 ? 'glow_tree' : roll < 0.85 ? 'tree' : roll < 0.95 ? 'rock' : 'glow_shroom', x, z, rng() * 6.28, { scale: 0.8 + rng() * 0.6 });
  }
  for (let k = 0; k < 70; k++) {
    const x = 404 + rng() * (beachX - 408);
    const z = wildZ + 4 + rng() * (seaZ - wildZ - 8);
    const s = surface[Math.floor(z / SURF_CELL) * surfN + Math.floor(x / SURF_CELL)];
    if (s !== Surface.Swamp) continue;
    prop('cypress', x, z, rng() * 6.28, { scale: 0.8 + rng() * 0.5 });
  }
  for (let z = 30; z < seaZ - 20; z += 26) prop('palm', beachX + 8 + rng() * 30, z + rng() * 8, rng() * 6.28, { scale: 0.9 + rng() * 0.3 });
  prop('buoy', seaX + 40, 400);
  // a checkpoint on the country road and the outpost at its end
  prop('gate_arm', ruralX + 2.4, 800, 0, { w: 4.2, h: 1.2, d: 0.3 });
  prop('watchtower', ruralX + 9, 806);
  prop('trail_sign', ruralX - 6.5, 856);
  prop('crate', ruralX + 7, 972);
  prop('cooler', ruralX - 10, 974);
  prop('dish', ruralX - 10, 966);

  // ---- a few specials near the start
  const sx = pos(1) + 24;
  const sz = pos(2) + ROADS.street.half + 1.5; // on the south sidewalk of row 2
  const kerb = pos(2) + ROADS.street.half - 1.1; // the parking strip, eastbound side
  ramps.push({ x0: pos(mid) - 4, z0: pos(2) + 30, x1: pos(mid) + 4, z1: pos(2) + 46, dir: 0, h: 3.5 });
  prop('barrier', waterX0 - 2, pos(1) + 64, 0, { w: 0.8, h: 1, d: 60 });
  prop('container', pos(0) + 26, pos(0) + 26, 0, { w: 2.6, h: 2.6, d: 12 });
  prop('billboard', pos(2) + 30, pos(0) + 22, 0, { w: 14, h: 12, d: 0.6 });
  prop('bus_stop', sx + 20, sz + 0.5, Math.PI);
  prop('charger', sx - 8, sz + 0.5, Math.PI);
  const poi = (id: string, kind: Poi['kind'], x: number, z: number, yaw: number, name: string, d: DistrictId, tag?: string, y = 0) => pois.push({ id, kind, x, y, z, yaw, name, district: d, tag });
  const home = districtOf(1, 2);
  poi('safehouse', 'safehouse', sx, sz, Math.PI, 'Your place', home);
  poi('garage-1', 'garage', pos(2) + 24, sz, Math.PI, 'Garage', districtOf(2, 2));
  poi('job-claude', 'job', sx + 40, sz, Math.PI, 'Claude', home, 'claude');
  poi('car-1', 'vehicle', sx + 6, kerb, Math.PI / 2, 'Pebble', home, 'compact');
  poi('car-2', 'vehicle', sx + 14, kerb, Math.PI / 2, 'Stanza', home, 'sports');
  poi('car-3', 'vehicle', sx + 24, kerb, Math.PI / 2, 'Sentinel', home, 'police');
  poi('car-4', 'vehicle', ruralX + 2.2, 846, 0, 'Ballad 4x4', 'forest', 'truck');
  poi('car-5', 'vehicle', 146, 946, 1, 'Limerick', 'forest', 'buggy');
  poi('car-6', 'vehicle', 414, 912, 0.4, 'Haiku', 'bayou', 'bike');
  poi('boat-1', 'vehicle', waterX0 + 12, 908, 0, 'Riptide', 'bayou', 'boat');
  poi('dock-1', 'dock', waterX0 + 2, 900, Math.PI / 2, 'Bayou dock', 'bayou');
  poi('chopshop-1', 'chopshop', 470, 948, Math.PI, 'The Shack', 'bayou');
  poi('checkpoint-1', 'checkpoint', ruralX, 800, 0, 'Bayou Road checkpoint', 'forest');
  poi('outpost-1', 'outpost', ruralX, 972, 0, 'Relay outpost', 'forest');
  poi('stunt-1', 'stunt', pos(mid), pos(2) + 30, 0, 'Ramp', districtOf(mid, 2));
  poi('race-1', 'race', 250, 870, -1.4, 'Glow Trail sprint', 'forest');
  for (let k = 0; k < 8; k++) {
    const nd = nodes[Math.floor(rng() * (lines * lines))];
    poi(`spark-${k}`, 'spark', nd.x + nd.half + 2, nd.z + nd.half + 2, 0, 'Spark', 'core', undefined, 1.2);
  }
  poi('spark-8', 'spark', 136, 932, 0, 'Spark', 'forest', undefined, 1.2);
  poi('spark-9', 'spark', 470, 946, 0, 'Spark', 'bayou', undefined, 1.2);

  return finalizeCity({
    seed, size, nodes, edges, lanes: buildLanes(nodes, edges), walks: buildWalks(nodes, edges), trails,
    blocks: blocksOut, buildings, props, ramps, pois, surface, district,
    spawn: { x: sx, z: sz, yaw: Math.PI },
  });
}
