// A small, plain test city that follows every rule of the CityMap contract: a 5 x 5 grid of blocks
// with streets and avenues, every facade style, a park, a plaza, a strip of water with a bridge, a
// stunt ramp, props and points of interest. Modules use it in their dev harnesses and tests so they
// do not depend on the real generator in src/world. Also exports the lane and sidewalk builders,
// which src/world may reuse.

import { DISTRICT_CELL, LANE_WIDTH, ROADS, SURF_CELL } from './config';
import { DISTRICT_IDS } from './defs';
import { finalizeCity, paintRect } from './query';
import { makeRng } from './rng';
import type { Block, Building, BuildingStyle, CityMap, DistrictId, Lane, Poi, Prop, Ramp, RoadClass, RoadEdge, RoadNode, WalkSeg } from './types';
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
 * Two sidewalk segments per edge (none for expressways), joined at each junction to every other
 * sidewalk end there. Simple, not pretty: src/world lays proper corners and crossings.
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

const STYLES: BuildingStyle[] = ['glass', 'ceramic', 'brick', 'concrete', 'neon', 'residential'];

/** The test city. `blocks` per side (default 5) gives a city of blocks * 128 + 128 metres. */
export function fixtureCity(seed = 1, blocks = 5): CityMap {
  const rng = makeRng(seed);
  const pitch = 128;
  const size = blocks * pitch + 128;
  const lines = blocks + 1;
  const pos = (i: number) => 64 + i * pitch;
  const cls = (i: number): RoadClass => (i === 0 || i === lines - 1 || i === Math.floor(lines / 2) ? 'avenue' : 'street');
  // The east side is water: column `waterCol` of blocks, crossed by one bridge.
  const waterX0 = pos(lines - 2) + 30;
  const waterX1 = pos(lines - 1) - 30;
  const bridgeRow = Math.floor(lines / 2);

  const surfN = size / SURF_CELL;
  const surface = new Uint8Array(surfN * surfN).fill(Surface.Ground);
  const districtN = size / DISTRICT_CELL;
  const district = new Uint8Array(districtN * districtN);
  const districtOf = (bx: number, bz: number): DistrictId => DISTRICT_IDS[(bx + bz * 2) % DISTRICT_IDS.length];

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
      if (overWater && j !== bridgeRow) continue; // only one road crosses the water
      addEdge(nodeId(i, j), nodeId(i + 1, j), 0, cls(j), `${j + 1}th Street`, overWater);
    }
  }
  for (let i = 0; i < lines; i++) for (let j = 0; j < lines - 1; j++) addEdge(nodeId(i, j), nodeId(i, j + 1), 1, cls(i), `Avenue ${String.fromCharCode(65 + i)}`, false);

  // ---- surface: water, then road corridors (sidewalk under roadway), junctions
  paintRect(surface, surfN, SURF_CELL, waterX0, 0, waterX1, size, Surface.Water);
  for (const e of edges) {
    const w = e.half + e.walk;
    if (e.axis === 0) {
      if (!e.bridge) paintRect(surface, surfN, SURF_CELL, e.x0, e.z0 - w, e.x1, e.z0 + w, Surface.Sidewalk);
      paintRect(surface, surfN, SURF_CELL, e.x0, e.z0 - e.half, e.x1, e.z0 + e.half, Surface.Road);
      if (e.bridge) paintRect(surface, surfN, SURF_CELL, waterX0, e.z0 - w, waterX1, e.z0 + w, Surface.Bridge);
    } else {
      paintRect(surface, surfN, SURF_CELL, e.x0 - w, e.z0, e.x0 + w, e.z1, Surface.Sidewalk);
      paintRect(surface, surfN, SURF_CELL, e.x0 - e.half, e.z0, e.x0 + e.half, e.z1, Surface.Road);
    }
  }
  for (const nd of nodes) paintRect(surface, surfN, SURF_CELL, nd.x - nd.half, nd.z - nd.half, nd.x + nd.half, nd.z + nd.half, Surface.Road);

  // ---- blocks, buildings, props
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
      paintRect(district, districtN, DISTRICT_CELL, pos(bx), pos(bz), pos(bx + 1), pos(bz + 1), DISTRICT_IDS.indexOf(d));
      const isWater = bx === blocks - 1;
      const use: Block['use'] = isWater ? 'water' : bx === mid && bz === mid ? 'plaza' : bx === 1 && bz === 1 ? 'park' : 'built';
      const id = blocksOut.length;
      blocksOut.push({ id, x0, z0, x1, z1, district: d, use });
      if (use === 'water') continue;
      if (use === 'park') {
        paintRect(surface, surfN, SURF_CELL, x0, z0, x1, z1, Surface.Park);
        for (let k = 0; k < 24; k++) prop(rng() < 0.7 ? 'tree' : 'bush', x0 + 4 + rng() * (x1 - x0 - 8), z0 + 4 + rng() * (z1 - z0 - 8), rng() * 6.28, { scale: 0.8 + rng() * 0.5 });
        prop('bench', (x0 + x1) / 2, z0 + 3, 0);
        continue;
      }
      if (use === 'plaza') {
        paintRect(surface, surfN, SURF_CELL, x0, z0, x1, z1, Surface.Plaza);
        prop('fountain', (x0 + x1) / 2, (z0 + z1) / 2);
        prop('statue', x0 + 14, z0 + 14);
        prop('holo_ad', x1 - 12, z0 + 12);
        continue;
      }
      paintRect(surface, surfN, SURF_CELL, x0, z0, x1, z1, Surface.Lot);
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

  // ---- street furniture: lamps along every road, signals at the big junctions
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

  // ---- a few specials near the start
  const sx = pos(1) + 24;
  const sz = pos(2) + ROADS.street.half + 1.5; // on the south sidewalk of row 2
  ramps.push({ x0: pos(mid) - 4, z0: pos(2) + 30, x1: pos(mid) + 4, z1: pos(2) + 46, dir: 0, h: 3.5 });
  prop('barrier', waterX0 - 2, pos(1) + 64, 0, { w: 0.8, h: 1, d: 60 });
  prop('container', pos(0) + 26, pos(0) + 26, 0, { w: 2.6, h: 2.6, d: 12 });
  prop('billboard', pos(2) + 30, pos(0) + 22, 0, { w: 14, h: 12, d: 0.6 });
  prop('bus_stop', sx + 20, sz + 0.5, Math.PI);
  prop('charger', sx - 8, sz + 0.5, Math.PI);
  pois.push({ id: 'safehouse', kind: 'safehouse', x: sx, y: 0, z: sz, yaw: Math.PI, name: 'Your place', district: districtOf(1, 2) });
  pois.push({ id: 'garage-1', kind: 'garage', x: pos(2) + 24, y: 0, z: sz, yaw: Math.PI, name: 'Garage', district: districtOf(2, 2) });
  pois.push({ id: 'job-claude', kind: 'job', x: sx + 40, y: 0, z: sz, yaw: Math.PI, name: 'Claude', district: districtOf(1, 2), tag: 'claude' });
  pois.push({ id: 'car-1', kind: 'vehicle', x: sx + 6, y: 0, z: pos(2) + ROADS.street.half - 1.1, yaw: Math.PI / 2, name: 'Pebble', district: districtOf(1, 2), tag: 'pod' });
  pois.push({ id: 'car-2', kind: 'vehicle', x: sx + 14, y: 0, z: pos(2) + ROADS.street.half - 1.1, yaw: Math.PI / 2, name: 'Stanza', district: districtOf(1, 2), tag: 'coupe' });
  pois.push({ id: 'stunt-1', kind: 'stunt', x: pos(mid), y: 0, z: pos(2) + 30, yaw: 0, name: 'Ramp', district: districtOf(mid, 2) });
  for (let k = 0; k < 8; k++) {
    const nd = nodes[Math.floor(rng() * nodes.length)];
    pois.push({ id: `spark-${k}`, kind: 'spark', x: nd.x + nd.half + 2, y: 1.2, z: nd.z + nd.half + 2, yaw: 0, name: 'Spark', district: 'core' });
  }

  return finalizeCity({
    seed, size, nodes, edges, lanes: buildLanes(nodes, edges), walks: buildWalks(nodes, edges),
    blocks: blocksOut, buildings, props, ramps, pois, surface, district,
    spawn: { x: sx, z: sz, yaw: Math.PI },
  });
}
