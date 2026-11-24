// DEV ONLY. Gallery of every voxel model for screenshots (tools/dev/models-shots.mjs).
// Imports only three, src/core and src/render/models. The model material below copies the world's
// glow patch (render/materials.ts) so windows behave as in the game: glass by day, lit at night.
import * as THREE from 'three';
import { BUILDING_TYPES, BUILDINGS } from '../core/defs';
import { hash01 } from '../core/rng';
import type { BuildingType } from '../core/types';
import { ZoneType } from '../core/types';
import { CAR_VARIANTS, ZONE_VARIANTS, buildingModel, carModel, treeModel, zoneModel, type ModelParts } from '../render/models';

declare global {
  interface Window {
    __gallery: { ready: boolean; shot(name: string, opts?: ShotOpts): Promise<void>; info: Record<string, unknown> };
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
const uGlowBoost = { value: 1.25 };

function modelMaterial(): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = uNight;
    shader.uniforms.uGlass = uGlass;
    shader.uniforms.uGlowBoost = uGlowBoost;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float aGlow;\nvarying float vGlow;\nvarying float vLit;\nuniform float uNight;`)
      .replace(
        '#include <color_vertex>',
        `#include <color_vertex>
vGlow = aGlow;
float glowTh = 0.18;
float glowLvl = 1.0;
#ifdef USE_INSTANCING
  vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
  float gh = fract(sin(dot(ip, vec2(12.9898, 78.233))) * 43758.5453);
  glowTh = 0.05 + gh * 0.5;
  glowLvl = 0.7 + 0.3 * fract(gh * 7.31);
#endif
vLit = smoothstep(glowTh, glowTh + 0.15, uNight) * glowLvl;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying float vGlow;\nvarying float vLit;\nuniform vec3 uGlass;\nuniform float uGlowBoost;`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec3 glowLitCol = diffuseColor.rgb;
diffuseColor.rgb = mix(diffuseColor.rgb, mix(uGlass, glowLitCol * 0.2, vLit), vGlow);`,
      )
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance += glowLitCol * (vGlow * vLit * uGlowBoost);`);
  };
  mat.customProgramCacheKey = () => 'gallery-glow';
  return mat;
}
const material = modelMaterial();

/** body + glow in one geometry with aGlow, like render/instances.ts combineParts. */
function combine(body: THREE.BufferGeometry, glow: THREE.BufferGeometry | null): THREE.BufferGeometry {
  const list: Array<[THREE.BufferGeometry, number]> = [[body, 0]];
  if (glow) list.push([glow, 1]);
  let n = 0;
  for (const [g] of list) n += g.getAttribute('position').count;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const gl = new Float32Array(n);
  let o = 0;
  for (const [g, f] of list) {
    const c = g.getAttribute('position').count;
    pos.set(g.getAttribute('position').array as Float32Array, o * 3);
    nor.set(g.getAttribute('normal').array as Float32Array, o * 3);
    col.set(g.getAttribute('color').array as Float32Array, o * 3);
    gl.fill(f, o, o + c);
    o += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1));
  return out;
}

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
function place(parts: ModelParts, cx: number, cz: number, rot = 0): void {
  const m = new THREE.Mesh(combine(parts.body, parts.glow), material);
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
    place(treeModel(v), 20 + v + 0.5, 0.5, 0);
  }
  for (let v = 0; v < CAR_VARIANTS; v++) {
    tile(20 + (v % 3), 2 + Math.floor(v / 3), 'road');
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

window.__gallery = { ready: true, shot, info };
