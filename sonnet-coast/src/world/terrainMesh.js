// Renders the analytic terrain as a grid of tiles with vertex colours per biome.
import * as THREE from 'three';
import { WORLD_MIN, WORLD_MAX, CITY, RECT } from './layout.js';
import { terrainHeight, roadAt } from './roads.js';
import { forestMask, swampMask, meadowMask, landDist } from './terrain.js';
import { makeNoise2D } from '../util/noise.js';
import { smoothstep, lerp, clamp } from '../util/math.js';
import { makeGround } from './textures.js';
import { grain } from './citylight.js';

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
  const cw = rectW(x, z, CITY.x0 - 9, CITY.x1 + 30, CITY.z0 - 9, CITY.z1 + 9, 7);
  if (cw > 0) mix(out, C.city, cw, out);
  const pw = rectW(x, z, RECT.port.x0 + 10, RECT.port.x1 - 10, RECT.port.z0 + 10, RECT.port.z1 - 10, 20);
  if (pw > 0) mix(out, C.port, pw, out);
  const rw = rectW(x, z, RECT.ridge.x0 + 10, RECT.ridge.x1 - 10, RECT.ridge.z0 + 10, RECT.ridge.z1 - 10, 20);
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

// One tile at a given vertex spacing. Coarse tiles get a skirt so LOD seams never show sky.
function tileGeometry(tx, tz, step, skirt) {
  const n = TILE / step;
  const W = n + 3;
  const hs = new Float32Array(W * W);
  let maxH = -99;
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const h = terrainHeight(tx + (i - 1) * step, tz + (j - 1) * step);
    hs[j * W + i] = h;
    if (h > maxH) maxH = h;
  }
  if (maxH < -6) return null; // open sea, nothing to draw
  const col = [0, 0, 0];
  const pos = [], nor = [], colr = [], uv = [], idx = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const x = tx + i * step, z = tz + j * step;
    const h = hs[(j + 1) * W + i + 1];
    const hl = hs[(j + 1) * W + i], hr = hs[(j + 1) * W + i + 2];
    const hu = hs[j * W + i + 1], hd = hs[(j + 2) * W + i + 1];
    let nx = hl - hr, ny = 2 * step, nz = hu - hd;
    const len = Math.hypot(nx, ny, nz);
    nx /= len; ny /= len; nz /= len;
    pos.push(x, h, z); nor.push(nx, ny, nz);
    terrainColor(x, z, h, 1 - ny, col);
    colr.push(clamp(col[0], 0, 1), clamp(col[1], 0, 1), clamp(col[2], 0, 1));
    uv.push(x / 7, z / 7);
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  if (skirt > 0) {
    const edge = [];
    for (let i = 0; i <= n; i++) edge.push(i);                          // north
    for (let j = 1; j <= n; j++) edge.push(j * (n + 1) + n);            // east
    for (let i = n - 1; i >= 0; i--) edge.push(n * (n + 1) + i);        // south
    for (let j = n - 1; j >= 1; j--) edge.push(j * (n + 1));            // west
    const base = pos.length / 3;
    for (const e of edge) {
      pos.push(pos[e * 3], pos[e * 3 + 1] - skirt, pos[e * 3 + 2]);
      nor.push(nor[e * 3], nor[e * 3 + 1], nor[e * 3 + 2]);
      colr.push(colr[e * 3], colr[e * 3 + 1], colr[e * 3 + 2]);
      uv.push(uv[e * 2], uv[e * 2 + 1]);
    }
    for (let k = 0; k < edge.length; k++) {
      const a = edge[k], b = edge[(k + 1) % edge.length], c = base + k, d = base + ((k + 1) % edge.length);
      idx.push(a, b, c, b, d, c, a, c, b, b, c, d); // both windings: visible from either side
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

export function buildTerrain(scene) {
  const group = new THREE.Group();
  group.name = 'terrain';
  // greyscale blade-and-pebble detail under the biome colours, plus slow world-space mottling
  const det = makeGround('detail');
  const mat = grain(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.96, metalness: 0,
    map: det.map, normalMap: det.normal, normalScale: new THREE.Vector2(0.9, 0.9),
  }), 0.06, 0.0, 0.42);
  const tiles = [];
  for (let tx = WORLD_MIN; tx < WORLD_MAX; tx += TILE) for (let tz = WORLD_MIN; tz < WORLD_MAX; tz += TILE) {
    const fine = tileGeometry(tx, tz, STEP, 0);
    if (!fine) continue;
    const coarse = tileGeometry(tx, tz, STEP * 3, 4);
    const mesh = new THREE.Mesh(fine, mat);
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
    tiles.push({ mesh, fine, coarse, cx: tx + TILE / 2, cz: tz + TILE / 2, lod: 0 });
  }
  scene.add(group);
  return {
    group,
    // Swap distant tiles to the coarse mesh.
    update(x, z) {
      for (const t of tiles) {
        const d = Math.max(Math.abs(t.cx - x), Math.abs(t.cz - z));
        const lod = d > (t.lod ? 520 : 600) ? 1 : 0;
        if (lod !== t.lod) { t.lod = lod; t.mesh.geometry = lod ? t.coarse : t.fine; }
      }
    },
  };
}
