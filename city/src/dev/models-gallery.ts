// DEV ONLY. Gallery of every voxel model for screenshots (tools/dev/models-shots.mjs).
// Imports only three, src/core and src/render/models. The model material below copies the world's
// glow patch (render/materials.ts) so windows behave as in the game: glass by day, lit at night.
import * as THREE from 'three';
import { BUILDING_TYPES, BUILDINGS } from '../core/defs';
import { hash01 } from '../core/rng';
import type { BuildingType } from '../core/types';
import { ZoneType } from '../core/types';
import { CAR_VARIANTS, ZONE_VARIANTS, buildingModel, carModel, treeModel, zoneModel, type ModelParts } from '../render/models';
import { combine, modelMaterial } from './models-material';

declare global {
  interface Window {
    __gallery: {
      ready: boolean;
      shot(name: string, opts?: ShotOpts): Promise<void>;
      sheet(keys: string[], cols: number, rows: number, night?: number, yaw?: number): Promise<void>;
      keys(): string[];
      info: Record<string, unknown>;
    };
  }
}

interface ShotOpts {
  night?: number;
  target?: [number, number];
  yaw?: number;
  pitch?: number;
  dist?: number;
  scene?: string;
  ortho?: number;
}

const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const uNight = { value: 0 };
const uGlass = { value: new THREE.Color('#4f7398') };
const material = modelMaterial({ uNight, uGlass, uGlowBoost: { value: 1.25 } });

const scene = new THREE.Scene();
const sun = new THREE.DirectionalLight(0xfff3df, 2.35);
const hemi = new THREE.HemisphereLight(0xc4e0ff, 0x7c7a5c, 0.82);
scene.add(sun, sun.target, hemi);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;

const world = new THREE.Group();
scene.add(world);
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.3, 500);
let ortho: THREE.OrthographicCamera | null = null;

// ---------------------------------------------------------------- ground

type Ground = 'grass' | 'res' | 'com' | 'ind' | 'road' | 'plaza' | 'gravel' | 'park';
const GROUND: Record<Ground, string> = {
  grass: '#7ccf58',
  res: '#86d35e',
  com: '#d9d3c6',
  ind: '#bdbab2',
  road: '#4d525c',
  plaza: '#e4ddd0',
  gravel: '#b5ae9f',
  park: '#6cc457',
};
const groundPos: number[] = [];
const groundCol: number[] = [];
function tile(x: number, z: number, kind: Ground, w = 1, h = 1): void {
  const c = new THREE.Color(GROUND[kind]);
  const j = 0.96 + hash01(x, z, 9) * 0.06;
  const y = 0;
  const quad = [x, y, z, x, y, z + h, x + w, y, z + h, x, y, z, x + w, y, z + h, x + w, y, z];
  groundPos.push(...quad);
  for (let k = 0; k < 6; k++) groundCol.push(c.r * j, c.g * j, c.b * j);
  // kerb outline for lots
  if (kind !== 'grass' && kind !== 'road') {
    const k = new THREE.Color('#ece7da');
    const e = 0.035;
    for (const [ax, az, bx, bz] of [
      [x, z, x + w, z + e],
      [x, z + h - e, x + w, z + h],
      [x, z, x + e, z + h],
      [x + w - e, z, x + w, z + h],
    ]) {
      groundPos.push(ax, 0.002, az, ax, 0.002, bz, bx, 0.002, bz, ax, 0.002, az, bx, 0.002, bz, bx, 0.002, az);
      for (let q = 0; q < 6; q++) groundCol.push(k.r, k.g, k.b);
    }
  }
}
function finishGround(): void {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(groundPos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(groundCol, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
  m.receiveShadow = true;
  world.add(m);
  // big grass sheet underneath
  const base = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2).translate(0, -0.01, 0), new THREE.MeshLambertMaterial({ color: GROUND.grass }));
  base.receiveShadow = true;
  world.add(base);
}

const spinners: Array<{ mesh: THREE.Mesh; axis: 'x' | 'y' | 'z' }> = [];
/** Gallery placements by key, for the contact sheet: object, footprint size, height. */
const placed = new Map<string, { obj: THREE.Object3D; size: number; height: number }>();
let placeKey = '';
let placeSize = 1;
function place(parts: ModelParts, cx: number, cz: number, rot = 0): void {
  const m = new THREE.Mesh(combine(parts.body, parts.glow), material);
  if (placeKey) {
    placed.set(placeKey, { obj: m, size: placeSize, height: parts.height });
    placeKey = '';
    placeSize = 1;
  }
  m.position.set(cx, 0, cz);
  m.rotation.y = rot * (Math.PI / 2);
  m.castShadow = true;
  m.receiveShadow = true;
  world.add(m);
  if (parts.spinner) {
    const s = new THREE.Mesh(combine(parts.spinner.geometry, null), material);
    s.position.copy(parts.spinner.pivot);
    s.castShadow = true;
    m.add(s);
    s.rotation[parts.spinner.axis] = 0.4;
    spinners.push({ mesh: s, axis: parts.spinner.axis });
  }
  if (parts.smoke) {
    for (const p of parts.smoke) {
      const puff = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshLambertMaterial({ color: '#f0f0f0' }));
      puff.position.copy(p).add(new THREE.Vector3(0, 0.12, 0));
      m.add(puff);
    }
  }
}

// ---------------------------------------------------------------- scenes

const info: Record<string, unknown> = {};

/** Zones: three blocks (res, com, ind), rows = level, columns = variant, roads in between. */
function buildZones(): void {
  const zones = [ZoneType.Res, ZoneType.Com, ZoneType.Ind];
  const kinds: Ground[] = ['res', 'com', 'ind'];
  for (let zi = 0; zi < 3; zi++) {
    const x0 = zi * 6;
    for (let lvl = 1; lvl <= 3; lvl++) {
      // level 3 at the back, level 1 in front, so close-ups of low rows are not blocked
      const z = (3 - lvl) * 3;
      for (let v = 0; v < ZONE_VARIANTS; v++) {
        tile(x0 + v, z, kinds[zi]);
        placeKey = `${kinds[zi]}${lvl}-${v}`;
        place(zoneModel(zones[zi], lvl, v), x0 + v + 0.5, z + 0.5, 0);
      }
      for (let v = 0; v < ZONE_VARIANTS; v++) tile(x0 + v, z + 1, 'road');
    }
  }
}

function buildBuildings(): void {
  // shelf layout: x offsets for footprints
  let x = 0;
  let z = 20;
  let rowH = 0;
  for (const t of BUILDING_TYPES) {
    const s = BUILDINGS[t].size;
    if (x + s > 16) {
      x = 0;
      z += rowH + 1;
      rowH = 0;
    }
    const ground: Ground = t === 'park_small' ? 'park' : BUILDINGS[t].power || BUILDINGS[t].water ? 'gravel' : 'plaza';
    tile(x, z, ground, s, s);
    placeKey = t;
    placeSize = s;
    place(buildingModel(t as BuildingType), x + s / 2, z + s / 2, 0);
    for (let k = 0; k < s; k++) tile(x + k, z + s, 'road');
    x += s + 1;
    rowH = Math.max(rowH, s);
  }
  info.buildingsEndZ = z + rowH;
}

function buildNature(): void {
  for (let v = 1; v <= 3; v++) {
    tile(20 + v, 0, 'grass');
    placeKey = `tree${v}`;
    place(treeModel(v), 20 + v + 0.5, 0.5, 0);
  }
  for (let v = 0; v < CAR_VARIANTS; v++) {
    tile(20 + (v % 3), 2 + Math.floor(v / 3), 'road');
    placeKey = `car${v}`;
    placeSize = 0.4;
    place(carModel(v), 20 + (v % 3) + 0.5, 2 + Math.floor(v / 3) + 0.5, v % 2 ? 1 : 0);
  }
}

/** A sample neighbourhood at game zoom: blocks of lots facing roads, mixed levels, trees. */
function buildCity(): void {
  const ox = 40;
  const oz = 0;
  const N = 20;
  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      const road = x % 5 === 0 || z % 5 === 0;
      const gx = ox + x;
      const gz = oz + z;
      if (road) {
        tile(gx, gz, 'road');
        continue;
      }
      const bx = Math.floor(x / 5);
      const bz = Math.floor(z / 5);
      const zone = bz === 0 ? ZoneType.Ind : bx >= 2 && bz >= 2 ? ZoneType.Com : ZoneType.Res;
      const centre = (x % 5 === 2 || x % 5 === 3) && (z % 5 === 2 || z % 5 === 3);
      const h = hash01(x, z, 3);
      if (bx === 0 && bz === 3 && centre) {
        tile(gx, gz, 'grass');
        place(treeModel(1 + Math.floor(h * 3)), gx + 0.5, gz + 0.5, Math.floor(h * 4));
        continue;
      }
      const dist = Math.hypot(x - 12, z - 12);
      const level = Math.max(1, Math.min(3, Math.round(3.4 - dist / 5 + (h - 0.5))));
      // face the nearest road
      const lx = x % 5;
      const lz = z % 5;
      const rot = lz === 4 ? 0 : lz === 1 ? 2 : lx === 4 ? 1 : 3;
      tile(gx, gz, zone === ZoneType.Res ? 'res' : zone === ZoneType.Com ? 'com' : 'ind');
      place(zoneModel(zone, level, Math.floor(hash01(x, z, 4) * 256)), gx + 0.5, gz + 0.5, rot);
    }
  }
  // a few cars on the roads
  for (let k = 0; k < 18; k++) {
    const along = Math.floor(hash01(k, 1, 1) * N);
    const line = Math.floor(hash01(k, 2, 1) * 4) * 5;
    const horiz = k % 2 === 0;
    const gx = ox + (horiz ? along : line) + 0.5 + (horiz ? 0 : 0.17);
    const gz = oz + (horiz ? line : along) + 0.5 + (horiz ? -0.17 : 0);
    place(carModel(k), gx, gz, horiz ? 1 : 0);
  }
}

buildZones();
buildBuildings();
buildNature();
buildCity();
finishGround();

// ---------------------------------------------------------------- shots

function setLight(night: number): void {
  uNight.value = night;
  const day = 1 - night;
  const dayBg = new THREE.Color('#a6d4f5');
  const nightBg = new THREE.Color('#0e1733');
  scene.background = dayBg.clone().lerp(nightBg, night);
  sun.color.set('#fff3df').lerp(new THREE.Color('#a8b8e8'), night);
  sun.intensity = 2.35 * day + 0.6 * night;
  hemi.color.set('#c4e0ff').lerp(new THREE.Color('#3a4a7c'), night);
  hemi.groundColor.set('#7c7a5c').lerp(new THREE.Color('#151a2e'), night);
  hemi.intensity = 0.82 * day + 0.75 * night;
  uGlass.value.set('#4f7398').lerp(new THREE.Color('#161c30'), night);
}

async function shot(name: string, o: ShotOpts = {}): Promise<void> {
  setLight(o.night ?? 0);
  const [tx, tz] = o.target ?? [10, 4];
  const yaw = o.yaw ?? 0.785;
  const pitch = o.pitch ?? 0.9;
  const dist = o.dist ?? 30;
  const h = Math.cos(pitch) * dist;
  let cam: THREE.Camera = camera;
  if (o.ortho) {
    const a = window.innerWidth / window.innerHeight;
    ortho = new THREE.OrthographicCamera(-o.ortho * a, o.ortho * a, o.ortho, -o.ortho, 0.1, 500);
    ortho.position.set(tx + Math.sin(yaw) * h, Math.sin(pitch) * dist, tz + Math.cos(yaw) * h);
    ortho.lookAt(tx, 0, tz);
    cam = ortho;
  } else {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    camera.position.set(tx + Math.sin(yaw) * h, Math.sin(pitch) * dist, tz + Math.cos(yaw) * h);
    camera.lookAt(tx, 0, tz);
  }
  // sun from the south-west so shadows fall north-east, away from the fronts
  sun.position.set(tx - 30, 50, tz + 22);
  sun.target.position.set(tx, 0, tz);
  const sc = sun.shadow.camera;
  const ext = Math.max(12, dist * 0.6);
  sc.left = -ext;
  sc.right = ext;
  sc.top = ext;
  sc.bottom = -ext;
  sc.near = 1;
  sc.far = 200;
  sc.updateProjectionMatrix();
  renderer.render(scene, cam);
  info.last = name;
}

/** Render several models, each alone in its own cell, framed to its size. */
async function sheet(keys: string[], cols: number, rows: number, night = 0, yaw = 0.62): Promise<void> {
  setLight(night);
  const W = renderer.domElement.width / renderer.getPixelRatio();
  const H = renderer.domElement.height / renderer.getPixelRatio();
  const cw = W / cols;
  const ch = H / rows;
  const all = [...placed.values()];
  renderer.setScissorTest(true);
  renderer.setClearColor(scene.background as THREE.Color);
  renderer.clear();
  for (let k = 0; k < keys.length && k < cols * rows; k++) {
    const p = placed.get(keys[k]);
    if (!p) continue;
    for (const o of all) o.obj.visible = o === p;
    const c = k % cols;
    const r = Math.floor(k / cols);
    const x = c * cw;
    const y = H - (r + 1) * ch;
    renderer.setViewport(x, y, cw, ch);
    renderer.setScissor(x, y, cw, ch);
    const pos = p.obj.position;
    const h = Math.max(0.15, p.height);
    const tall = h > p.size * 2.2;
    const pitch = tall ? 0.3 : 0.55;
    // fit the footprint diagonal and the height into the cell
    const span = Math.max(p.size * 1.35, tall ? h * 0.98 : h * 1.3);
    const dist = span / (2 * Math.tan((20 * Math.PI) / 180)) + p.size * 0.3;
    const ty = tall ? h * 0.48 : h * 0.35;
    const hd = Math.cos(pitch) * dist;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    camera.position.set(pos.x + Math.sin(yaw) * hd, ty + Math.sin(pitch) * dist, pos.z + Math.cos(yaw) * hd);
    camera.lookAt(pos.x, ty, pos.z);
    sun.position.set(pos.x - 30, 50, pos.z + 22);
    sun.target.position.set(pos.x, 0, pos.z);
    const sc = sun.shadow.camera;
    const ext = Math.max(4, span);
    sc.left = -ext;
    sc.right = ext;
    sc.top = ext;
    sc.bottom = -ext;
    sc.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  for (const o of all) o.obj.visible = true;
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, W, H);
}

window.__gallery = { ready: true, shot, sheet, keys: () => [...placed.keys()], info };
