// Renders the analytic terrain as a grid of tiles with vertex colours per biome.
import * as THREE from 'three';
import { WORLD_MIN, WORLD_MAX, CITY } from './layout.js';
import { terrainHeight, roadAt } from './roads.js';
import { forestMask, swampMask, meadowMask, landDist } from './terrain.js';
import { makeNoise2D } from '../util/noise.js';
import { smoothstep, lerp, clamp } from '../util/math.js';
import { makeNoiseTexture } from './textures.js';

const TILE = 300;
const STEP = 5;
const nCol = makeNoise2D(77);

const C = {
  grass: [0.17, 0.40, 0.13],
  grassDry: [0.33, 0.45, 0.16],
  forest: [0.09, 0.26, 0.19],
  forestMoss: [0.13, 0.36, 0.27],
  swamp: [0.20, 0.25, 0.11],
  mud: [0.17, 0.14, 0.08],
  sand: [0.80, 0.69, 0.47],
  wetSand: [0.56, 0.48, 0.34],
  seabed: [0.30, 0.42, 0.40],
  city: [0.52, 0.50, 0.47],
  port: [0.46, 0.46, 0.48],
  ridge: [0.62, 0.56, 0.50],
  rock: [0.42, 0.40, 0.38],
  verge: [0.34, 0.38, 0.22],
};
const mix = (a, b, t, out) => { out[0] = lerp(a[0], b[0], t); out[1] = lerp(a[1], b[1], t); out[2] = lerp(a[2], b[2], t); return out; };
const rectW = (x, z, x0, x1, z0, z1, m) => {
  const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1);
  return smoothstep(m, 0, Math.hypot(dx, dz));
};

const tmp = [0, 0, 0];
export function terrainColor(x, z, h, slope, out) {
  const n = nCol(x / 60, z / 60) * 0.5 + 0.5;
  const n2 = nCol(x / 9, z / 9) * 0.5 + 0.5;
  mix(C.grass, C.grassDry, n * 0.7, out);
  const f = forestMask(x, z);
  if (f > 0) mix(out, mix(C.forest, C.forestMoss, n, tmp), f, out);
  const s = swampMask(x, z);
  if (s > 0) mix(out, mix(C.swamp, C.mud, smoothstep(1.3, 0.2, h) * 0.8 + n2 * 0.2, tmp), s, out);
  const cw = rectW(x, z, -322, 622, -322, 322, 14);
  if (cw > 0) mix(out, C.city, cw, out);
  const pw = rectW(x, z, 440, 870, 890, 1100, 20);
  if (pw > 0) mix(out, C.port, pw, out);
  const rw = rectW(x, z, 310, 730, -690, -470, 20);
  if (rw > 0) mix(out, C.ridge, rw, out);
  // Beach
  const d = landDist(x, z);
  if (d < 120 && f < 0.6) {
    const b = smoothstep(120, 70, d) * smoothstep(4.0, 2.4, h) * (1 - Math.max(pw, cw));
    mix(out, mix(C.sand, C.wetSand, smoothstep(0.7, 0.1, h), tmp), b, out);
  }
  if (slope > 0.55) mix(out, C.rock, smoothstep(0.55, 0.95, slope), out);
  if (h < -0.25 && s < 0.5) mix(out, C.seabed, smoothstep(-0.25, -1.8, h), out);
  const v = 0.86 + 0.28 * n2;
  out[0] *= v; out[1] *= v; out[2] *= v;
  return out;
}

export function buildTerrain(scene) {
  const group = new THREE.Group();
  group.name = 'terrain';
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.96, metalness: 0,
    map: makeNoiseTexture(5, 256, 0.16),
  });
  const n = TILE / STEP;
  const col = [0, 0, 0];
  // Pad one tile of open sea around the island so the seabed reaches the fog.
  for (let tx = WORLD_MIN; tx < WORLD_MAX; tx += TILE) for (let tz = WORLD_MIN; tz < WORLD_MAX; tz += TILE) {
    // heights with a 1-sample border for normals
    const W = n + 3;
    const hs = new Float32Array(W * W);
    let maxH = -99;
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
      const h = terrainHeight(tx + (i - 1) * STEP, tz + (j - 1) * STEP);
      hs[j * W + i] = h;
      if (h > maxH) maxH = h;
    }
    if (maxH < -6) continue; // open sea, nothing to draw
    const V = (n + 1) * (n + 1);
    const pos = new Float32Array(V * 3), nor = new Float32Array(V * 3), colr = new Float32Array(V * 3), uv = new Float32Array(V * 2);
    let p = 0, q = 0;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const x = tx + i * STEP, z = tz + j * STEP;
      const h = hs[(j + 1) * W + i + 1];
      const hl = hs[(j + 1) * W + i], hr = hs[(j + 1) * W + i + 2];
      const hu = hs[j * W + i + 1], hd = hs[(j + 2) * W + i + 1];
      let nx = hl - hr, ny = 2 * STEP, nz = hu - hd;
      const len = Math.hypot(nx, ny, nz);
      nx /= len; ny /= len; nz /= len;
      pos[p] = x; pos[p + 1] = h; pos[p + 2] = z;
      nor[p] = nx; nor[p + 1] = ny; nor[p + 2] = nz;
      terrainColor(x, z, h, 1 - ny, col);
      // Darken the verge under dirt trails a touch, so they read from a distance.
      colr[p] = clamp(col[0], 0, 1); colr[p + 1] = clamp(col[1], 0, 1); colr[p + 2] = clamp(col[2], 0, 1);
      uv[q] = x / 14; uv[q + 1] = z / 14;
      p += 3; q += 2;
    }
    const idx = new Uint32Array(n * n * 6);
    let k = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b;
      idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
  }
  scene.add(group);
  return group;
}
