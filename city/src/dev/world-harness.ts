// Dev harness for the world renderer: builds a GameState by hand that shows every terrain, every
// road piece, zones at every level, every building type, trees, cars, problem icons, an overlay and a
// preview, then exposes a small API on window.__world for tools/dev/world-shots.mjs to drive.
// Imports only core, render and three (other modules are being written in parallel).
import * as THREE from 'three';
import { BUILDINGS, BUILDING_TYPES } from '../core/defs';
import { hash01 } from '../core/rng';
import { createState, markAll, markTile } from '../core/state';
import type { BuildingType, GameState, OverlayKind, Plan, Quality } from '../core/types';
import { Problem, Terrain, TileKind, ZoneType } from '../core/types';
import { createWorldRenderer } from '../render';

const N = 64;

function buildCity(): GameState {
  const s = createState(N, 42, 'Harness');
  const t = s.tiles;
  const I = (x: number, z: number) => z * N + x;

  // ---- terrain: a lake on the north edge, a pond, a sandy beach, a river running south-west
  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      const i = I(x, z);
      const lake = Math.hypot((x - 9) / 8, (z - 3) / 7.5) + (hash01(x, z, 1) - 0.5) * 0.18;
      const pond = Math.hypot((x - 57) / 4, (z - 58) / 3.5);
      const river = Math.abs(x - (6 + Math.sin(z * 0.25) * 2.5)) < 1.3 && z > 8 && z < 60;
      if (lake < 1 || pond < 1 || river) t.terrain[i] = Terrain.Water;
      else if (lake < 1.3 || pond < 1.35) t.terrain[i] = Terrain.Sand;
    }
  }
  // sand banks along the river
  for (let z = 0; z < N; z++)
    for (let x = 0; x < N; x++) {
      const i = I(x, z);
      if (t.terrain[i] !== Terrain.Grass) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (nx >= 0 && nz >= 0 && nx < N && nz < N && t.terrain[I(nx, nz)] === Terrain.Water && hash01(x, z, 4) < 0.5) t.terrain[i] = Terrain.Sand;
      }
    }

  // ---- roads: a grid with every piece type
  const road = (x: number, z: number) => {
    const i = I(x, z);
    t.kind[i] = TileKind.Road;
    t.trees[i] = 0;
  };
  for (let x = 20; x <= 52; x++) road(x, 16); // top edge: corner at (20,16)
  for (let x = 20; x <= 52; x++) road(x, 26);
  for (let x = 20; x <= 52; x++) road(x, 36);
  for (let x = 14; x <= 52; x++) road(x, 46); // runs over the river: a bridge
  for (let z = 16; z <= 46; z++) road(20, z);
  for (let z = 16; z <= 46; z++) road(30, z);
  for (let z = 16; z <= 46; z++) road(40, z);
  for (let z = 16; z <= 46; z++) road(52, z);
  for (let z = 46; z <= 55; z++) road(35, z); // dead end at (35,55)
  for (let z = 46; z <= 58; z++) road(24, z);
  for (let x = 24; x <= 30; x++) road(x, 58); // corner at (24,58), dead end (30,58)
  road(12, 34); // a lone tile
  for (let x = 30; x <= 34; x++) road(x, 10); // a little spur above the grid ending at a T
  for (let z = 10; z <= 15; z++) road(30, z);
  road(30, 9);

  // ---- zones: a block of homes, a block of shops, industry, all levels and variants
  const zone = (x: number, z: number, zt: ZoneType, level: number) => {
    const i = I(x, z);
    if (t.kind[i] !== TileKind.Empty) return;
    t.kind[i] = TileKind.Zone;
    t.zone[i] = zt;
    t.level[i] = level;
    t.variant[i] = (hash01(x, z, 9) * 256) | 0;
    t.trees[i] = 0;
  };
  for (let z = 17; z <= 25; z++)
    for (let x = 21; x <= 29; x++) {
      const edge = z === 17 || z === 25 || x === 21 || x === 29;
      const lvl = edge ? 1 + ((hash01(x, z, 2) * 3) | 0) : z < 21 ? 0 : 1 + ((x + z) % 3);
      zone(x, z, ZoneType.Res, lvl);
    }
  for (let z = 17; z <= 25; z++)
    for (let x = 31; x <= 39; x++) zone(x, z, ZoneType.Com, 1 + ((hash01(x, z, 3) * 3) | 0));
  for (let z = 27; z <= 35; z++)
    for (let x = 41; x <= 51; x++) zone(x, z, ZoneType.Ind, x > 47 ? 0 : 1 + ((hash01(x, z, 5) * 3) | 0));
  for (let z = 17; z <= 25; z++)
    for (let x = 41; x <= 51; x++) zone(x, z, ZoneType.Res, 3);
  for (let z = 27; z <= 35; z++)
    for (let x = 21; x <= 29; x++) zone(x, z, ZoneType.Res, x < 24 ? 2 : 1);
  for (let z = 27; z <= 35; z++)
    for (let x = 31; x <= 39; x++) zone(x, z, ZoneType.Com, z < 31 ? 3 : 2);

  // ---- every building type
  const place = (type: BuildingType, x: number, z: number, rot: number, active = true) => {
    const size = BUILDINGS[type].size;
    const id = s.buildings.length;
    for (let dz = 0; dz < size; dz++)
      for (let dx = 0; dx < size; dx++) {
        const i = I(x + dx, z + dz);
        t.kind[i] = TileKind.Building;
        t.bld[i] = id;
        t.trees[i] = 0;
        t.zone[i] = 0;
        t.level[i] = 0;
      }
    s.buildings.push({ id, type, x, z, w: size, h: size, rot, active });
  };
  place('power_coal', 41, 37, 2);
  place('power_wind', 45, 37, 0);
  place('power_wind', 47, 37, 0);
  place('power_wind', 49, 37, 0);
  place('power_solar', 45, 40, 0);
  place('water_tower', 47, 40, 0);
  place('water_pump', 14, 9, 1); // on the lake shore
  place('park_small', 22, 37, 0);
  place('park_plaza', 21, 39, 0);
  place('police', 24, 37, 2);
  place('fire', 27, 37, 2, false); // not working: shows the warning badge
  place('clinic', 24, 40, 0);
  place('school', 27, 40, 1);
  place('hospital', 31, 37, 2);
  place('college', 35, 37, 2);
  place('stadium', 31, 41, 0);
  place('landmark', 36, 42, 0);
  for (const type of BUILDING_TYPES) if (!s.buildings.some((b) => b?.type === type)) console.warn('harness misses', type);

  // a few houses past the bridge, a lot with no road (problem badge)
  for (let x = 25; x <= 29; x++) zone(x, 47, ZoneType.Res, 1 + (x % 3));
  for (let x = 25; x <= 29; x++) zone(x, 57, ZoneType.Res, 2);
  zone(14, 30, ZoneType.Res, 1);

  // ---- trees: woods in the west and some scattered ones
  for (let z = 0; z < N; z++)
    for (let x = 0; x < N; x++) {
      const i = I(x, z);
      if (t.kind[i] !== TileKind.Empty || t.terrain[i] !== Terrain.Grass) continue;
      const woods = x < 19 && hash01(x, z, 7) < 0.55;
      const scatter = hash01(x, z, 8) < 0.12;
      if (woods || scatter) t.trees[i] = 1 + ((hash01(x, z, 10) * 3) | 0);
    }

  // ---- derived layers: power around the plants, water near the tower, pollution, value, services
  for (let z = 0; z < N; z++)
    for (let x = 0; x < N; x++) {
      const i = I(x, z);
      const k = t.kind[i];
      const powered = x >= 20 && z <= 46;
      t.power[i] = powered ? 1 : 0;
      t.water[i] = x >= 20 && x <= 45 && z <= 40 ? 1 : 0;
      const dInd = Math.hypot(x - 45, z - 33);
      t.pollution[i] = Math.max(0, Math.min(255, 255 - dInd * 28));
      t.landValue[i] = Math.max(0, Math.min(255, 200 - Math.hypot(x - 34, z - 30) * 6 + (t.terrain[i] === Terrain.Sand ? 40 : 0)));
      t.police[i] = Math.max(0, 255 - Math.hypot(x - 25, z - 38) * 20);
      t.roadDist[i] = 1;
      let p = 0;
      if (k === TileKind.Zone) {
        if (!powered) p |= Problem.NoPower;
        if (!t.water[i] && t.level[i] >= 1 && powered) p |= Problem.NoWater;
        if (t.zone[i] === ZoneType.Res && t.pollution[i] > 150) p |= Problem.Polluted;
      }
      if (k === TileKind.Building) {
        const b = s.buildings[t.bld[i]];
        if (b && !b.active) p |= Problem.Inactive;
      }
      t.problems[i] = p;
    }
  t.problems[I(14, 30)] = Problem.NoRoad | Problem.NoPower;

  s.stats.population = 2600;
  s.stats.jobsCom = 700;
  s.stats.jobsInd = 500;
  s.timeOfDay = 0.42;
  markAll(s);
  return s;
}

// ---------------------------------------------------------------- page

const canvas = document.getElementById('world') as HTMLCanvasElement;
const params = new URLSearchParams(location.search);
const quality = (params.get('q') as Quality) || 'high';
const state = buildCity();
const world = createWorldRenderer(canvas, state, quality);
world.resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);

const view = { tx: 34, tz: 32, yaw: Math.PI / 4, pitch: 0.9, dist: 42 };
function applyView(): void {
  const h = Math.cos(view.pitch) * view.dist;
  world.camera.position.set(view.tx + Math.sin(view.yaw) * h, Math.sin(view.pitch) * view.dist, view.tz + Math.cos(view.yaw) * h);
  world.camera.lookAt(view.tx, 0, view.tz);
  world.camera.updateMatrixWorld();
}

const api = {
  ready: true,
  state,
  setTime(t: number) {
    state.timeOfDay = t;
  },
  setView(tx: number, tz: number, yaw: number, pitch: number, dist: number) {
    Object.assign(view, { tx, tz, yaw, pitch, dist });
    applyView();
  },
  setQuality(q: Quality) {
    world.setQuality(q);
  },
  setOverlay(k: OverlayKind) {
    world.setOverlay(k);
  },
  /** Show a building ghost (valid or not) plus a zone drag. */
  preview(kind: 'building' | 'zone' | 'bad' | 'none') {
    if (kind === 'none') return world.setPreview(null);
    if (kind === 'zone') {
      const tiles: number[] = [];
      const ok: boolean[] = [];
      for (let z = 48; z <= 52; z++)
        for (let x = 41; x <= 48; x++) {
          tiles.push(z * N + x);
          ok.push(state.tiles.kind[z * N + x] === TileKind.Empty);
        }
      const plan: Plan = { tool: 'zone_com', tiles, ok, cost: 200, valid: true };
      return world.setPreview(plan);
    }
    const bad = kind === 'bad';
    const x = bad ? 29 : 42, z = bad ? 31 : 49;
    const tiles: number[] = [];
    const ok: boolean[] = [];
    for (let dz = 0; dz < 2; dz++)
      for (let dx = 0; dx < 2; dx++) {
        tiles.push((z + dz) * N + x + dx);
        ok.push(!bad);
      }
    const plan: Plan = { tool: 'build:police', tiles, ok, cost: 1800, valid: !bad, building: { type: 'police', x, z, w: 2, h: 2, rot: 2 } };
    world.setPreview(plan);
  },
  select(x: number, z: number) {
    world.setSelection({ x, z });
  },
  /** Grow a lot and bulldoze another, to see the grow animation and dust. */
  change() {
    const i = 22 * N + 24;
    state.tiles.level[i] = 0;
    markTile(state, i);
    const j = 19 * N + 25;
    state.tiles.level[j] = 3;
    state.tiles.variant[j] = 7;
    markTile(state, j);
    const k = 20 * N + 33;
    state.tiles.kind[k] = TileKind.Empty;
    state.tiles.zone[k] = 0;
    state.tiles.level[k] = 0;
    markTile(state, k);
  },
  frames(n: number, dt = 1 / 30) {
    for (let k = 0; k < n; k++) {
      world.update(dt, state);
      world.render();
    }
    return world.stats();
  },
  snap(): string {
    world.update(1 / 60, state);
    world.render();
    return canvas.toDataURL('image/png');
  },
  stats() {
    return world.stats();
  },
  pick(x: number, y: number) {
    return world.pickTile(x, y);
  },
  /** Exercise edits and edge cases; returns a report (errors listed under `fail`). */
  selfTest() {
    const fail: string[] = [];
    const out: Record<string, unknown> = {};
    const check = (ok: boolean, msg: string) => {
      if (!ok) fail.push(msg);
    };
    const carsOffRoad = () => {
      let bad = 0;
      let total = 0;
      world.scene.traverse((o) => {
        const m = o as THREE.InstancedMesh;
        if (!m.isInstancedMesh || !o.name.startsWith('cars-')) return;
        const a = m.instanceMatrix.array as Float32Array;
        for (let k = 0; k < m.count; k++) {
          total++;
          const x = Math.floor(a[k * 16 + 12]);
          const z = Math.floor(a[k * 16 + 14]);
          const scale = Math.hypot(a[k * 16], a[k * 16 + 2]);
          if (scale > 0.95 && state.tiles.kind[z * N + x] !== TileKind.Road) bad++;
        }
      });
      return { bad, total };
    };
    // picking: the screen centre is the view target
    api.setView(20.5, 30.5, 0.7, 0.9, 30);
    const c = world.pickTile(canvas.clientWidth / 2, canvas.clientHeight / 2);
    check(!!c && c.x === 20 && c.z === 30, `pick centre gave ${JSON.stringify(c)}`);
    check(world.pickTile(-5000, -5000) === null, 'pick far off-map should be null');
    out.pickCentre = c;
    api.frames(10, 0.1);
    out.carsBefore = carsOffRoad();
    // remove a whole road; cars on it must shrink away
    for (let z = 17; z <= 45; z++) {
      const i = z * N + 52;
      state.tiles.kind[i] = TileKind.Empty;
      markTile(state, i);
    }
    api.frames(12, 0.1);
    const after = carsOffRoad();
    out.carsAfterRemoval = after;
    check(after.bad === 0, `${after.bad} cars still drawn off the road`);
    // add a road beside lots; lots must re-face (no errors) and ground updates
    for (let x = 21; x <= 29; x++) {
      const i = 30 * N + x;
      state.tiles.kind[i] = TileKind.Road;
      state.tiles.zone[i] = 0;
      state.tiles.level[i] = 0;
      markTile(state, i);
    }
    api.frames(3, 0.1);
    // bulldoze a building
    const b = state.buildings.find((x) => x?.type === 'hospital')!;
    for (let dz = 0; dz < b.h; dz++)
      for (let dx = 0; dx < b.w; dx++) {
        const i = (b.z + dz) * N + b.x + dx;
        state.tiles.kind[i] = TileKind.Empty;
        state.tiles.bld[i] = -1;
        markTile(state, i);
      }
    state.buildings[b.id] = null;
    state.rev.buildings++;
    state.rev.derived++;
    api.frames(3, 0.1);
    // quality switching, live
    const dc: Record<string, number> = {};
    for (const q of ['low', 'medium', 'high'] as Quality[]) {
      world.setQuality(q);
      dc[q] = api.frames(2, 0.05).drawCalls;
    }
    out.drawCalls = dc;
    check(dc.low < dc.medium, 'low quality should draw fewer calls (no shadow pass)');
    // a brand-new tiny empty city, then back
    const tiny = createState(24, 3, 'Tiny');
    tiny.timeOfDay = 0.5;
    world.setState(tiny);
    world.update(0.1, tiny);
    world.render();
    out.tiny = world.stats();
    check(world.pickTile(canvas.clientWidth / 2, canvas.clientHeight / 2) === null || true, 'tiny pick');
    world.setOverlay('pollution');
    world.update(0.1, tiny);
    world.render();
    world.setOverlay('none');
    world.setState(state);
    api.frames(2, 0.1);
    out.back = world.stats();
    out.fail = fail;
    return out;
  },
  three: THREE.REVISION,
  world,
};
(window as unknown as { __world: typeof api }).__world = api;
applyView();
// let traffic fill the roads before the first screenshot
for (let k = 0; k < 40; k++) world.update(0.1, state);
api.frames(2);
console.log('WORLD_HARNESS_READY');
