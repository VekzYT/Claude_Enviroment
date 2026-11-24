// DEV ONLY. A stand-in for src/render/models with the same API, used by the world harness
// (tools/dev/world-shots.mjs with FAKE=1) to exercise glow windows, smoke points, spinners and
// headlights before the real voxel art lands. Never imported by the game.
import * as THREE from 'three';
import { BUILDINGS } from '../core/defs';
import { hash01 } from '../core/rng';
import type { BuildingType } from '../core/types';
import { ZoneType } from '../core/types';
import { MeshBuilder, linearRGB } from '../render/util';

export interface ModelParts {
  body: THREE.BufferGeometry;
  glow: THREE.BufferGeometry | null;
  smoke?: THREE.Vector3[];
  spinner?: { geometry: THREE.BufferGeometry; pivot: THREE.Vector3; axis: 'x' | 'y' | 'z'; speed: number };
  height: number;
}

export const ZONE_VARIANTS = 4;
export const CAR_VARIANTS = 6;

const cache = new Map<string, ModelParts>();

function col(hex: string, j = 1): [number, number, number] {
  const c = linearRGB(hex);
  return [c[0] * j, c[1] * j, c[2] * j];
}

/** A block with jittered voxel shading. */
function block(b: MeshBuilder, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, hex: string, seed: number): void {
  const j = 0.93 + hash01(seed, Math.round(x0 * 10), Math.round(y0 * 10)) * 0.12;
  const c = col(hex, j);
  b.box(x0, y0, z0, x1, y1, z1, c[0], c[1], c[2]);
}

/** Rows of windows on the four faces of a box. */
function windows(g: MeshBuilder, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, floor: number, hex: string): void {
  const c = col(hex);
  const d = 0.012;
  for (let y = y0 + floor * 0.35; y + floor * 0.45 <= y1; y += floor) {
    const h = floor * 0.45;
    for (let x = x0 + 0.08; x + 0.08 <= x1 - 0.04; x += 0.18) {
      g.box(x, y, z1, x + 0.08, y + h, z1 + d, c[0], c[1], c[2]);
      g.box(x, y, z0 - d, x + 0.08, y + h, z0, c[0], c[1], c[2]);
    }
    for (let z = z0 + 0.08; z + 0.08 <= z1 - 0.04; z += 0.18) {
      g.box(x1, y, z, x1 + d, y + h, z + 0.08, c[0], c[1], c[2]);
      g.box(x0 - d, y, z, x0, y + h, z + 0.08, c[0], c[1], c[2]);
    }
  }
}

function finish(b: MeshBuilder, g: MeshBuilder | null, height: number, extra: Partial<ModelParts> = {}): ModelParts {
  return { body: b.build(false, false), glow: g && g.vertexCount ? g.build(false, false) : null, height, ...extra };
}

export function zoneModel(zone: ZoneType, level: number, variant: number): ModelParts {
  const key = `z${zone}-${level}-${variant % ZONE_VARIANTS}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const b = new MeshBuilder();
  const g = new MeshBuilder();
  const v = variant % ZONE_VARIANTS;
  let parts: ModelParts;
  if (zone === ZoneType.Res) {
    const walls = ['#f3e2c6', '#e9d3e8', '#d6e7f4', '#f6efd2'][v];
    const roof = ['#d9534f', '#6c7fd1', '#4f9d69', '#c97a3d'][v];
    if (level === 1) {
      const w = 0.32 + v * 0.03;
      block(b, -w, 0, -0.28, w, 0.32, 0.22, walls, 1);
      block(b, -w - 0.03, 0.32, -0.31, w + 0.03, 0.42, 0.25, roof, 2);
      block(b, -w * 0.6, 0.42, -0.2, w * 0.6, 0.5, 0.14, roof, 3);
      block(b, -0.05, 0, 0.22, 0.05, 0.16, 0.24, '#8a5a3c', 4);
      windows(g, -w, -0.28, w, 0.22, 0, 0.32, 0.32, '#ffd98a');
      parts = finish(b, g, 0.5);
    } else if (level === 2) {
      block(b, -0.36, 0, -0.36, 0.36, 0.9, 0.3, walls, 1);
      block(b, -0.4, 0.9, -0.4, 0.4, 1.0, 0.34, roof, 2);
      windows(g, -0.36, -0.36, 0.36, 0.3, 0, 0.9, 0.3, '#ffd98a');
      parts = finish(b, g, 1.0);
    } else {
      const h = 1.8 + v * 0.3;
      block(b, -0.38, 0, -0.38, 0.38, h, 0.38, walls, 1);
      block(b, -0.3, h, -0.3, 0.3, h + 0.12, 0.3, roof, 2);
      windows(g, -0.38, -0.38, 0.38, 0.38, 0, h, 0.3, '#ffe2a0');
      parts = finish(b, g, h + 0.12);
    }
  } else if (zone === ZoneType.Com) {
    const body = ['#8fb8e8', '#b8c4d6', '#7fd0c8', '#c9b8e8'][v];
    const h = [0, 0.6, 1.5, 2.6 + v * 0.4][level];
    block(b, -0.4, 0, -0.4, 0.4, h, 0.4, body, 1);
    block(b, -0.42, h, -0.42, 0.42, h + 0.06, 0.42, '#5d6b80', 2);
    block(b, -0.3, 0.12, 0.4, 0.3, 0.2, 0.46, ['#ff7a59', '#ffcf3d', '#4fd18b', '#ff5fa2'][v], 3);
    windows(g, -0.4, -0.4, 0.4, 0.4, 0, h, 0.26, '#fff0c0');
    g.box(-0.28, 0.2, 0.46, 0.28, 0.27, 0.47, ...col('#ffe08a'));
    parts = finish(b, g, h + 0.06);
  } else {
    const h = [0, 0.45, 0.7, 0.95][level];
    block(b, -0.42, 0, -0.38, 0.42, h, 0.3, ['#c2b8a3', '#a9b4bf', '#c9a98f', '#b0b8a0'][v], 1);
    block(b, -0.44, h, -0.4, 0.44, h + 0.05, 0.32, '#6d6a66', 2);
    block(b, 0.2, h, -0.3, 0.32, h + 0.55, -0.18, '#9a5a4a', 3);
    windows(g, -0.42, -0.38, 0.42, 0.3, 0, h, 0.4, '#ffcc66');
    parts = finish(b, g, h + 0.55, { smoke: [new THREE.Vector3(0.26, h + 0.58, -0.24)] });
  }
  cache.set(key, parts);
  return parts;
}

export function buildingModel(type: BuildingType): ModelParts {
  const key = `b-${type}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const def = BUILDINGS[type];
  const s = def.size / 2 - 0.08;
  const b = new MeshBuilder();
  const g = new MeshBuilder();
  let parts: ModelParts;
  if (type === 'power_wind') {
    block(b, -0.06, 0, -0.06, 0.06, 1.6, 0.06, '#eef1f4', 1);
    block(b, -0.08, 1.55, -0.12, 0.08, 1.7, 0.1, '#dfe4ea', 2);
    const blades = new MeshBuilder();
    const c = col('#ffffff');
    blades.box(-0.03, -0.03, 0, 0.03, 0.7, 0.03, c[0], c[1], c[2]);
    blades.box(-0.6, -0.03, 0, 0.0, 0.03, 0.03, c[0], c[1], c[2]);
    blades.box(0.0, -0.03, 0, 0.6, 0.03, 0.03, c[0], c[1], c[2]);
    parts = finish(b, g, 2.3, {
      spinner: { geometry: blades.build(false, false), pivot: new THREE.Vector3(0, 1.62, 0.12), axis: 'z', speed: 2.2 },
    });
  } else if (type === 'power_coal') {
    block(b, -s, 0, -s, s * 0.4, 0.8, s, '#9aa2ab', 1);
    block(b, s * 0.4, 0, -s * 0.6, s, 0.5, s * 0.6, '#b58a6a', 2);
    block(b, -s * 0.8, 0.8, -s * 0.8, -s * 0.5, 2.1, -s * 0.5, '#d7d2cc', 3);
    block(b, -s * 0.2, 0.8, -s * 0.8, s * 0.1, 1.8, -s * 0.5, '#d7d2cc', 4);
    windows(g, -s, -s, s * 0.4, s, 0, 0.8, 0.35, '#ffcc66');
    parts = finish(b, g, 2.1, {
      smoke: [new THREE.Vector3(-s * 0.65, 2.15, -s * 0.65), new THREE.Vector3(-s * 0.05, 1.85, -s * 0.65)],
    });
  } else if (type === 'power_solar') {
    for (let x = -s; x < s - 0.2; x += 0.42)
      for (let z = -s; z < s - 0.2; z += 0.5) block(b, x, 0.1, z, x + 0.36, 0.16, z + 0.4, '#2d4f8a', 5 + x * 10 + z);
    parts = finish(b, g, 0.4);
  } else if (type === 'park_small' || type === 'park_plaza') {
    block(b, -0.05, 0, -0.05, 0.05, 0.3, 0.05, '#7a5233', 1);
    block(b, -0.25, 0.25, -0.25, 0.25, 0.6, 0.25, '#4caf50', 2);
    if (type === 'park_plaza') block(b, -0.4, 0, -0.4, 0.4, 0.12, 0.4, '#bfe3f5', 3);
    g.box(-0.3, 0.12, 0.6, -0.26, 0.4, 0.64, ...col('#fff0b0'));
    parts = finish(b, g, 0.7);
  } else {
    const hues: Record<string, string> = {
      water_tower: '#9cc8e8', water_pump: '#7fa7c9', police: '#6f8fd8', fire: '#e05a4a', clinic: '#f4f4f4', school: '#f0c060',
      hospital: '#f2f2f2', college: '#c98a5a', stadium: '#d8d8d8', landmark: '#a8c8e8',
    };
    const h = type === 'landmark' ? 4.5 : type === 'stadium' ? 0.9 : type === 'water_tower' ? 1.6 : 0.6 + def.size * 0.35;
    block(b, -s, 0, -s, s, h, s, hues[type] ?? '#cccccc', 1);
    block(b, -s - 0.03, h, -s - 0.03, s + 0.03, h + 0.08, s + 0.03, '#59606e', 2);
    windows(g, -s, -s, s, s, 0, h, 0.32, '#ffe6a8');
    parts = finish(b, g, h + 0.1);
  }
  cache.set(key, parts);
  return parts;
}

export function treeModel(variant: number): ModelParts {
  const key = `t${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const b = new MeshBuilder();
  const spots = variant === 1 ? [[0, 0]] : variant === 2 ? [[-0.18, -0.12], [0.2, 0.15]] : [[-0.2, -0.18], [0.22, -0.1], [-0.02, 0.22]];
  spots.forEach(([x, z], k) => {
    const h = 0.18 + hash01(variant, k, 3) * 0.12;
    const r = 0.15 + hash01(variant, k, 4) * 0.06;
    block(b, x - 0.04, 0, z - 0.04, x + 0.04, h, z + 0.04, '#7a5233', k);
    block(b, x - r, h, z - r, x + r, h + r * 1.6, z + r, ['#3f9d4a', '#4fae4f', '#358a45'][k % 3], k + 9);
    block(b, x - r * 0.6, h + r * 1.6, z - r * 0.6, x + r * 0.6, h + r * 2.2, z + r * 0.6, '#5cbf5a', k + 19);
  });
  const parts = finish(b, null, 0.8);
  cache.set(key, parts);
  return parts;
}

export function carModel(variant: number): ModelParts {
  const key = `c${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const paint = ['#e84a5f', '#2f80ed', '#f2c94c', '#27ae60', '#f2f2f2', '#9b51e0'][variant % 6];
  const b = new MeshBuilder();
  const g = new MeshBuilder();
  block(b, -0.075, 0.02, -0.15, 0.075, 0.09, 0.15, paint, 1);
  block(b, -0.065, 0.09, -0.08, 0.065, 0.15, 0.07, '#cfe3f0', 2);
  const hl = col('#fff6d8');
  const tl = col('#ff3b30');
  g.box(-0.06, 0.045, 0.15, -0.03, 0.07, 0.155, hl[0], hl[1], hl[2]);
  g.box(0.03, 0.045, 0.15, 0.06, 0.07, 0.155, hl[0], hl[1], hl[2]);
  g.box(-0.06, 0.045, -0.155, -0.03, 0.07, -0.15, tl[0], tl[1], tl[2]);
  g.box(0.03, 0.045, -0.155, 0.06, 0.07, -0.15, tl[0], tl[1], tl[2]);
  const parts = finish(b, g, 0.15);
  cache.set(key, parts);
  return parts;
}
