// Vegetation: beach palms, the bioluminescent Glowwood, bayou cypress and mangroves, reeds, lilies.
import * as THREE from 'three';
import { WORLD_MIN, WORLD_MAX, FLAT_ZONES } from './layout.js';
import { forestMask, swampMask, meadowMask, landDist, rawHeight } from './terrain.js';
import { terrainHeight, roadAt, edges, edgePoint } from './roads.js';
import { blockAt } from './cityplan.js';
import { CITY } from './layout.js';
import { Batch, ChunkedInstances, tmpMatrix } from './geom.js';
import { addCircle } from './colliders.js';
import { parkSpots, roofTrees } from './city.js';
import { registerBreakable } from './breakables.js';
import { RNG, hash2 } from '../util/rng.js';
import { PAL } from './palette.js';
import { makeGlowTexture } from './textures.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { grain } from './citylight.js';
import { DETAIL_LAYER } from '../state.js';


// ---- modelling helpers ---------------------------------------------------------------------
const _ca = new THREE.Color(), _cb = new THREE.Color();
// A lumpy, smooth-shaded mass of foliage (or stone): an icosphere pushed in and out by a few
// waves, lighter on top and darker underneath so it reads as lit from the sky.
function blob(r, detail, seed, sx, sy, sz, lo, hi, amp = 0.2) {
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  const p = g.getAttribute('position'), n = p.count, col = new Float32Array(n * 3);
  _ca.set(lo); _cb.set(hi);
  for (let i = 0; i < n; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const w = Math.sin(x * 3.1 + seed) * Math.sin(y * 2.7 + seed * 1.3) * Math.sin(z * 3.3 + seed * 0.7) + 0.45 * Math.sin(x * 6.3 + y * 5.1 + z * 5.7 + seed * 2.1);
    const k = 1 + w * amp;
    p.setXYZ(i, x * k * r * sx, y * k * r * sy, z * k * r * sz);
    const t = Math.min(1, Math.max(0, y * 0.62 + 0.45 + w * 0.22));
    col[i * 3] = _ca.r + (_cb.r - _ca.r) * t; col[i * 3 + 1] = _ca.g + (_cb.g - _ca.g) * t; col[i * 3 + 2] = _ca.b + (_cb.b - _ca.b) * t;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
// A tapered trunk or bough from (x0,y0,z0) to (x1,y1,z1), darker at the base, with a root flare.
function limb(b, x0, y0, z0, x1, y1, z1, r0, r1, lo, hi, seg = 7, flare = 0) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dx, dy, dz);
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1, true);
  const p = g.getAttribute('position'), n = p.count, col = new Float32Array(n * 3);
  _ca.set(lo); _cb.set(hi);
  for (let i = 0; i < n; i++) {
    const t = p.getY(i) / len + 0.5;
    if (flare && t < 0.01) { p.setX(i, p.getX(i) * (1 + flare)); p.setZ(i, p.getZ(i) * (1 + flare)); }
    const k = t * (0.8 + 0.2 * Math.sin(i * 2.4));
    col[i * 3] = _ca.r + (_cb.r - _ca.r) * k; col[i * 3 + 1] = _ca.g + (_cb.g - _ca.g) * k; col[i * 3 + 2] = _ca.b + (_cb.b - _ca.b) * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
  g.applyQuaternion(q);
  b.add(g, null, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
function addBlob(b, r, detail, seed, x, y, z, lo, hi, sx = 1, sy = 0.85, sz = 1, amp = 0.2) { b.add(blob(r, detail, seed, sx, sy, sz, lo, hi, amp), null, x, y, z); }

// A feathered palm frond lying along +z from the origin, arching up then drooping.
function frondGeo(len, leaflets, droop, lo, hi) {
  const pos = [], col = [], idx = [];
  _ca.set(lo); _cb.set(hi);
  const spine = (t) => { const z = t * len * (1 - 0.18 * t), y = Math.sin(t * 2.2) * len * 0.22 - t * t * len * droop; return [z, y]; };
  const v = (x, y, z, k) => { pos.push(x, y, z); col.push(_ca.r + (_cb.r - _ca.r) * k, _ca.g + (_cb.g - _ca.g) * k, _ca.b + (_cb.b - _ca.b) * k); return pos.length / 3 - 1; };
  // rib
  for (let i = 0; i < 4; i++) {
    const [z0, y0] = spine(i / 4), [z1, y1] = spine((i + 1) / 4), w = 0.06 * (1 - i / 5);
    const a = v(-w, y0, z0, 0.3), c = v(w, y0, z0, 0.3), d = v(w, y1, z1, 0.3), e = v(-w, y1, z1, 0.3);
    idx.push(a, c, d, a, d, e);
  }
  // leaflets: narrow blades either side, longest in the middle, hanging a little
  for (let i = 0; i < leaflets; i++) {
    const t = 0.1 + (i / (leaflets - 1)) * 0.9, [z, y] = spine(t), [zn, yn] = spine(Math.min(1, t + 0.06));
    const l = len * 0.34 * Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.86 + 0.25), w = len * 0.045, k = 0.45 + 0.55 * ((i * 7) % 5) / 4;
    for (const s of [-1, 1]) {
      const a = v(s * 0.04, y, z, k), c = v(s * 0.04, yn, zn + w * 0.4, k);
      const d = v(s * l, y - l * 0.38, z + l * 0.3 + w, k * 0.85), e = v(s * l * 0.55, y - l * 0.1, z + l * 0.1, k);
      if (s > 0) idx.push(a, e, c, e, d, c); else idx.push(a, c, e, e, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Palms: the far model is a trunk with plain arching blades; the feathered fronds are a
// separate shell that is only drawn near the camera and sits over the blades.
const PALM_TOP = (() => { let x = 0, y = 0; for (let i = 0; i < 5; i++) { const lean = 0.1 + (i / 5) * 0.2; x += Math.sin(lean) * 1.8; y += Math.cos(lean) * 1.8; } return [x, y]; })();
const PALM_FRONDS = [];
for (let i = 0; i < 10; i++) { const upper = i % 2 === 0; PALM_FRONDS.push({ upper, a: (i / 10) * Math.PI * 2 + (upper ? 0 : 0.25), len: upper ? 3.9 : 4.4, droop: upper ? 0.22 : 0.42, tilt: upper ? -0.5 : -0.05 }); }
function palmGeo() {
  const b = new Batch();
  let x = 0, y = 0;
  for (let i = 0; i < 5; i++) {
    const t = i / 5, lean = 0.1 + t * 0.2;
    const nx = x + Math.sin(lean) * 1.8, ny = y + Math.cos(lean) * 1.8;
    limb(b, x, y, 0, nx, ny + 0.05, 0, 0.27 - t * 0.09 + (i === 0 ? 0.08 : 0), 0.25 - (t + 0.2) * 0.09, i % 2 ? 0x6a4f34 : 0x7d5f40, i % 2 ? 0x8a6d4c : 0x9a7c58, 7);
    x = nx; y = ny;
  }
  addBlob(b, 0.46, 1, 3, x, y + 0.05, 0, 0x4a3a22, 0x6a8a3a, 1, 0.8, 1, 0.1);
  for (let i = 0; i < 3; i++) { const a = i * 2.1; b.add(new THREE.SphereGeometry(0.15, 6, 4), 0x4d3b22, x + Math.cos(a) * 0.3, y - 0.3, Math.sin(a) * 0.3); }
  for (const f of PALM_FRONDS) {
    // a narrow blade down the middle of each frond
    const g = new THREE.PlaneGeometry(0.5, f.len, 1, 4);
    g.rotateX(Math.PI / 2); g.translate(0, 0, f.len / 2);
    const p = g.getAttribute('position');
    for (let k = 0; k < p.count; k++) {
      const t = p.getZ(k) / f.len;
      p.setY(k, Math.sin(t * 2.2) * f.len * 0.22 - t * t * f.len * f.droop - 0.02);
      p.setZ(k, t * f.len * (1 - 0.18 * t));
      p.setX(k, p.getX(k) * (1 - t * 0.7));
    }
    g.computeVertexNormals();
    b.add(g, f.upper ? 0x46733c : 0x345a30, x, y + 0.15, 0, f.tilt, f.a, 0);
  }
  return b.merged();
}
function palmShellGeo() {
  const b = new Batch();
  const [x, y] = PALM_TOP;
  for (const f of PALM_FRONDS) b.add(frondGeo(f.len, 9, f.droop, f.upper ? 0x2a5a30 : 0x244a28, f.upper ? 0x6f9a4c : 0x55803f), null, x, y + 0.15, 0, f.tilt, f.a, 0);
  return b.merged();
}

// Conifers: a cheap core that is always drawn, and a shell of drooping boughs added up close.
function pineGeo() {
  const b = new Batch();
  limb(b, 0, 0, 0, 0, 17.5, 0, 0.55, 0.06, 0x4a3526, 0x7a5c44, 8, 0.5);
  const cols = [[0x0b2f27, 0x16513f], [0x0e3a2f, 0x1b5f48], [0x11463a, 0x237556]];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.ConeGeometry(3.9 - i * 1.0, 6.2, 8, 1, true);
    g.computeVertexNormals();
    b.add(g, cols[i][1], 0, 7.2 + i * 3.9, 0, 0, i * 0.5, 0);
  }
  return b.merged();
}
function pineShellGeo() {
  const b = new Batch();
  _ca.set(0x0a2a23); _cb.set(0x2a7e5c);
  // eleven tiers of boughs; every rim is scalloped and sags, so the outline is ragged
  for (let i = 0; i < 11; i++) {
    const t = i / 10, r = 4.9 * (1 - t * 0.83), y = 4.4 + t * 12.4, h = 2.7 - t * 1.2, pts = 18;
    const g = new THREE.ConeGeometry(r, h, pts, 2, true);
    const p = g.getAttribute('position'), n = p.count, col = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const yy = p.getY(k), rim = 0.5 - yy / h, a = Math.atan2(p.getZ(k), p.getX(k));
      // each tier is a ring of separate boughs: deep notches between them, tips that hang
      const lobe = Math.sin(a * 4.5 + i * 1.9);
      const sc = 1 + rim * (0.34 * lobe + 0.1 * Math.sin(a * 13 + i));
      p.setX(k, p.getX(k) * sc); p.setZ(k, p.getZ(k) * sc);
      p.setY(k, yy - rim * rim * (0.75 + 0.45 * lobe));
      const m = Math.min(1, Math.max(0, rim * 0.9 + 0.1 * Math.sin(a * 9 + i * 3.1)));
      col[k * 3] = _ca.r + (_cb.r - _ca.r) * m; col[k * 3 + 1] = _ca.g + (_cb.g - _ca.g) * m; col[k * 3 + 2] = _ca.b + (_cb.b - _ca.b) * m;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    b.add(g, null, 0, y, 0, 0, i * 0.7, 0);
  }
  return b.merged();
}
function pineGlowGeo() {
  // glowing lantern fruit + bracket fungus on the trunk
  const b = new Batch();
  const pts = [[2.9, 6.0, 0.6], [-2.5, 6.6, 1.4], [0.6, 9.4, -2.5], [-1.4, 9.6, 2.0], [1.7, 12.5, 0.8], [-0.4, 3.2, 0.6], [0.5, 2.2, -0.52]];
  pts.forEach(([x, y, z], i) => b.add(new THREE.SphereGeometry(i > 4 ? 0.34 : 0.3, 8, 6), 0xffffff, x, y, z));
  return b.merged();
}
// Broadleaf trees: trunk, boughs and a small core of canopy in the far model...
const LEAF = [[0x1c3a20, 0x587a3c], [0x223f22, 0x66863f], [0x19361f, 0x4c6f38]];
function broadleafGeo() {
  const b = new Batch();
  limb(b, 0, 0, 0, 0.15, 3.3, 0.05, 0.42, 0.26, 0x33261c, 0x5b4634, 8, 0.45);
  limb(b, 0.15, 3.2, 0.05, 1.5, 5.2, 0.5, 0.2, 0.09, 0x3e2f23, 0x5b4634, 6);
  limb(b, 0.15, 3.2, 0.05, -1.3, 5.3, -0.7, 0.2, 0.09, 0x3e2f23, 0x5b4634, 6);
  limb(b, 0.15, 3.2, 0.05, 0.1, 5.8, -0.2, 0.22, 0.1, 0x3e2f23, 0x5b4634, 6);
  addBlob(b, 2.5, 1, 1, 0, 6.3, 0, ...LEAF[0], 1, 0.82, 1, 0.14);
  addBlob(b, 1.8, 1, 2, 1.6, 5.3, 0.6, ...LEAF[1], 1, 0.8, 1, 0.14);
  addBlob(b, 1.7, 1, 3, -1.4, 5.5, -0.8, ...LEAF[2], 1, 0.8, 1, 0.14);
  return b.merged();
}
// ...and the full crown of overlapping leaf masses that is added near the camera.
function broadleafShellGeo() {
  const b = new Batch();
  const lumps = [[0, 6.5, 0, 3.0, 0], [1.9, 5.3, 0.7, 2.2, 1], [-1.6, 5.5, -1.0, 2.1, 2], [0.4, 5.4, -1.9, 1.9, 1], [-0.7, 5.2, 1.8, 1.9, 0], [0.9, 7.6, 0.4, 1.8, 2], [-1.1, 7.3, -0.3, 1.7, 1]];
  lumps.forEach(([x, y, z, r, c], i) => addBlob(b, r, 2, 5 + i * 2.3, x, y, z, ...LEAF[c], 1, 0.82, 1, 0.24));
  return b.merged();
}
function cypressGeo() {
  const b = new Batch();
  // buttressed swamp trunk
  const prof = [[1.7, 0], [1.1, 0.5], [0.7, 1.4], [0.5, 3.0], [0.4, 6.0], [0.3, 11.0], [0.12, 13.0]].map(([r, y]) => new THREE.Vector2(r, y));
  const tr = new THREE.LatheGeometry(prof, 9);
  const tp = tr.getAttribute('position');
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i), a = Math.atan2(tp.getZ(i), tp.getX(i)), k = 1 + Math.max(0, 1 - y / 2.6) * 0.28 * Math.sin(a * 5); tp.setX(i, tp.getX(i) * k); tp.setZ(i, tp.getZ(i) * k); }
  tr.computeVertexNormals();
  b.add(tr, 0x4f4236);
  limb(b, 0, 9.5, 0, 2.6, 11.6, 0.6, 0.2, 0.07, 0x4a3d32, 0x5a4a3c, 6);
  limb(b, 0, 9.0, 0, -2.2, 11.2, -1.2, 0.2, 0.07, 0x4a3d32, 0x5a4a3c, 6);
  addBlob(b, 3.6, 2, 4, 0, 12.4, 0, 0x22401f, 0x4f7a3c, 1.15, 0.42, 1.15, 0.2);
  addBlob(b, 2.6, 2, 7, 1.6, 10.9, 0.9, 0x263f22, 0x567f40, 1.1, 0.4, 1.1, 0.2);
  addBlob(b, 2.3, 1, 9, -1.8, 11.3, -1.1, 0x22401f, 0x4a743a, 1.1, 0.42, 1.1, 0.2);
  // hanging moss
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * 6.28, r = 2.0 + (i % 3) * 0.8, len = 2.2 + (i % 4) * 0.9;
    for (const ra of [a, a + Math.PI / 2]) {
      const g = new THREE.PlaneGeometry(0.5, len, 1, 3);
      const p = g.getAttribute('position');
      for (let k = 0; k < p.count; k++) { const t = 0.5 - p.getY(k) / len; p.setX(k, p.getX(k) * (1 - t * 0.8)); }
      b.add(g, i % 2 ? 0x7b8b62 : 0x8c9a70, Math.cos(a) * r, 11.3 - len / 2, Math.sin(a) * r, 0, ra, 0);
    }
  }
  return b.merged();
}
function mangroveGeo() {
  const b = new Batch();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.28 + (i % 2) * 0.2, r = 1.0 + (i % 3) * 0.25;
    limb(b, Math.cos(a) * r, -0.6, Math.sin(a) * r, Math.cos(a) * 0.15, 1.9 + (i % 2) * 0.3, Math.sin(a) * 0.15, 0.07, 0.09, 0x3f3125, 0x57463a, 5);
  }
  limb(b, 0, 1.8, 0, 0.1, 3.9, 0, 0.2, 0.12, 0x3f3125, 0x57463a, 6);
  addBlob(b, 2.3, 2, 2, 0, 4.5, 0, 0x1f4a2a, 0x4f8a44, 1.2, 0.6, 1.2, 0.2);
  addBlob(b, 1.6, 1, 5, 1.1, 3.9, 0.8, 0x24522c, 0x5a9448, 1.1, 0.6, 1.1, 0.2);
  addBlob(b, 1.4, 1, 8, -1.0, 4.0, -0.7, 0x1f4a2a, 0x4f8a44, 1.1, 0.6, 1.1, 0.2);
  return b.merged();
}
function mushroomGeo() {
  const stems = new Batch(), caps = new Batch();
  [[0, 0, 1], [0.7, 0.3, 0.7], [-0.5, 0.6, 0.55], [0.2, -0.7, 0.4]].forEach(([x, z, s]) => {
    stems.add(new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 0.9 * s, 5), 0xd8d2c0, x, 0.45 * s, z);
    const g = new THREE.SphereGeometry(0.42 * s, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    caps.add(g, 0xffffff, x, 0.85 * s, z, 0, 0, 0, 1, 0.6, 1);
  });
  return { stems: stems.merged(), caps: caps.merged() };
}
function glowFernGeo() {
  const b = new Batch();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.28;
    const g = new THREE.PlaneGeometry(0.28, 1.5);
    g.translate(0, 0.75, 0);
    g.rotateX(0.75);
    b.add(g, 0xffffff, 0, 0, 0, 0, a, 0);
  }
  return b.merged();
}
function reedGeo() {
  const b = new Batch();
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3, r = 0.25 * (i % 3);
    b.add(new THREE.PlaneGeometry(0.16, 1.9 + (i % 2) * 0.5), i % 2 ? 0x6f8f3c : 0x86a348, Math.cos(a) * r, 0.9, Math.sin(a) * r, 0, a, (i - 2) * 0.06);
  }
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 5), 0x5b3d22, 0.1, 1.9, 0);
  return b.merged();
}
function rockGeo() {
  const b = new Batch();
  b.add(blob(1, 2, 4.2, 1, 0.68, 0.9, 0x55524e, 0x8c8880, 0.34), null);
  b.add(blob(0.55, 1, 9.1, 1, 0.7, 1, 0x5a5650, 0x86827a, 0.3), null, 0.8, -0.1, 0.5);
  return b.merged();
}
function umbrellaGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 5), 0xe8e0d0, 0, 1.2, 0);
  for (let i = 0; i < 8; i++) {
    const g = new THREE.ConeGeometry(1.7, 0.55, 1, 1, true, (i / 8) * 6.283, 6.283 / 8);
    b.add(g, i % 2 ? PAL.terracottaLight : PAL.cream, 0, 2.5, 0);
  }
  return b.merged();
}

function inFlatZone(x, z, pad = 6) {
  for (const zone of FLAT_ZONES) {
    if (zone.r !== undefined) { if (Math.hypot(x - zone.cx, z - zone.cz) < zone.r + pad) return true; }
    else if (x > zone.x0 - pad && x < zone.x1 + pad && z > zone.z0 - pad && z < zone.z1 + pad) return true;
  }
  return false;
}

export function buildNature(scene, env, quality) {
  const group = new THREE.Group();
  group.name = 'nature';
  const rng = new RNG(31337);
  const dens = quality === 'low' ? 0.5 : quality === 'medium' ? 0.75 : 1;

  // foliage and bark carry a strong leafy grain so they never read as smooth plastic
  const leafMat = grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, side: THREE.DoubleSide }), 1.3, 0.9, 0.5);
  const solidMat = grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), 1.5, 1.0, 0.55);
  const glowMat = (hex) => {
    const base = new THREE.Color(hex);
    const m = new THREE.MeshBasicMaterial({ color: base.clone(), toneMapped: false });
    for (const ch of ['r', 'g', 'b']) env.nightLerp(m.color, ch, base[ch] * 0.75, base[ch] * 2.6);
    return m;
  };

  const sh = quality === 'high';
  const palms = new ChunkedInstances(palmGeo(), leafMat, { shadow: sh, chunk: 250, maxDist: 900 });
  const palmShell = new ChunkedInstances(palmShellGeo(), leafMat, { shadow: sh, chunk: 90, maxDist: quality === 'low' ? 0 : quality === 'medium' ? 110 : 170 });
  const pinesFar = new ChunkedInstances(pineGeo(), solidMat, { shadow: sh, maxDist: 1250 });
  const SHELL = quality === 'low' ? 0 : quality === 'medium' ? 130 : 210;   // how far the detailed crowns reach
  const pineShell = new ChunkedInstances(pineShellGeo(), leafMat, { shadow: sh, chunk: 90, maxDist: SHELL });
  const pines = { add(m) { if (SHELL) pineShell.add(m); return pinesFar.add(m); } };
  const gl = { maxDist: 520, colors: true };
  const glowCols = [PAL.neonCyan, PAL.neonMagenta, PAL.neonLime, 0x7dffb0, 0x35e0c8, 0xb46bff].map((h) => new THREE.Color(h));
  const white = () => { const m = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); for (const ch of ['r', 'g', 'b']) env.nightLerp(m.color, ch, 0.75, 2.6); return m; };
  const pineGlowAll = new ChunkedInstances(pineGlowGeo(), white(), gl);
  const pineGlow = [0, 1, 2].map((k) => ({ add: (m) => pineGlowAll.add(m, glowCols[k]) }));
  const broadFar = new ChunkedInstances(broadleafGeo(), solidMat, { shadow: sh, chunk: 250, maxDist: 1100 });
  const broadShell = new ChunkedInstances(broadleafShellGeo(), solidMat, { shadow: sh, chunk: 90, maxDist: SHELL });
  const broad = { add(m) { if (SHELL) broadShell.add(m); return broadFar.add(m); } };
  const cypress = new ChunkedInstances(cypressGeo(), leafMat, { shadow: sh, maxDist: 950 });
  const mangrove = new ChunkedInstances(mangroveGeo(), leafMat, { shadow: false, maxDist: 600 });
  const mg = mushroomGeo();
  const near = { chunk: 200, maxDist: 260, layer: DETAIL_LAYER };
  const stems = new ChunkedInstances(mg.stems, solidMat, near);
  const capsAll = new ChunkedInstances(mg.caps, white(), gl);
  const caps = [0, 1, 3].map((k) => ({ add: (m) => capsAll.add(m, glowCols[k]) }));
  const fernMat = white(); fernMat.side = THREE.DoubleSide;
  const fernsAll = new ChunkedInstances(glowFernGeo(), fernMat, gl);
  const ferns = [4, 5].map((k) => ({ add: (m) => fernsAll.add(m, glowCols[k]) }));
  const reeds = new ChunkedInstances(reedGeo(), leafMat, near);
  const rocks = new ChunkedInstances(rockGeo(), solidMat, { shadow: sh, maxDist: 500 });
  const umbrellas = new ChunkedInstances(umbrellaGeo(), leafMat, { chunk: 200, maxDist: 380 });
  const lilyGeo = new THREE.CircleGeometry(0.55, 7, 0.4, 5.6);
  lilyGeo.rotateX(-Math.PI / 2);
  const lilies = new ChunkedInstances(lilyGeo, new THREE.MeshStandardMaterial({ color: 0x3f8f45, roughness: 0.6, side: THREE.DoubleSide }), near);

  const placePalm = (x, z, y, breakable) => {
    const m = tmpMatrix(x, y - 0.1, z, rng.float(0, 6.28), rng.float(1.0, 1.5));
    const refs = [palms.add(m)];
    if (quality !== 'low') refs.push(palmShell.add(m));
    const c = addCircle(x, z, 0.3, 0, y + 6, {});
    if (breakable) registerBreakable({ collider: c, fall: refs, hide: [], x, z, y: y - 0.1, kind: 'palm', minSpeed: 11 });
  };

  const STEP = 11;
  for (let gx = WORLD_MIN + 20; gx < WORLD_MAX - 20; gx += STEP) for (let gz = WORLD_MIN + 20; gz < WORLD_MAX - 20; gz += STEP) {
    const x = gx + rng.float(-5, 5), z = gz + rng.float(-5, 5);
    const roll = rng.next(), roll2 = rng.next();
    const d = landDist(x, z);
    if (d < -5) continue;
    const road = roadAt(x, z, 20);
    const roadGap = road ? road.d - road.hw : 99;
    if (roadGap < 3.5) continue;
    if (inFlatZone(x, z)) continue;
    const h = terrainHeight(x, z);
    const f = forestMask(x, z), s = swampMask(x, z);

    if (f > 0.5 && h > 0.6) {
      if (d < 14) continue;
      if (roll < 0.52 * dens && roadGap > 4.5) {
        const sc = rng.float(0.8, 1.5);
        const m = tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc);
        pines.add(m);
        if (roll2 < 0.42) pineGlow[rng.int(0, 2)].add(m);
        addCircle(x, z, 0.5 * sc, 0, h + 12, {});
      } else if (roll < 0.70) {
        const k = rng.int(0, 2);
        const m = tmpMatrix(x, h - 0.05, z, rng.float(0, 6.28), rng.float(0.8, 2.2));
        stems.add(m); caps[k].add(m);
      } else if (roll < 0.86) {
        ferns[rng.int(0, 1)].add(tmpMatrix(x, h - 0.05, z, rng.float(0, 6.28), rng.float(0.8, 1.7)));
      } else if (roll < 0.885) {
        const sc = rng.float(0.8, 2.6);
        rocks.add(tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc));
        addCircle(x, z, sc * 0.85, 0, h + sc * 0.6, {});
      }
      continue;
    }
    if (s > 0.5) {
      if (h > 0.25 && h < 2.6) {
        if (roll < 0.20 * dens && roadGap > 5) {
          const sc = rng.float(0.8, 1.35);
          cypress.add(tmpMatrix(x, h - 0.3, z, rng.float(0, 6.28), sc));
          addCircle(x, z, 0.9 * sc, -3, h + 10, {});
        } else if (roll < 0.36 && h < 0.9) {
          const sc = rng.float(0.8, 1.4);
          mangrove.add(tmpMatrix(x, h - 0.3, z, rng.float(0, 6.28), sc));
          addCircle(x, z, 0.5, -3, h + 3, {});
        } else if (roll < 0.47) {
          const k = rng.int(0, 2);
          const m = tmpMatrix(x, h - 0.05, z, rng.float(0, 6.28), rng.float(0.7, 1.6));
          stems.add(m); caps[k].add(m);
        } else if (roll < 0.62) reeds.add(tmpMatrix(x, h - 0.1, z, rng.float(0, 6.28), rng.float(0.8, 1.5)));
      } else if (h > -0.5 && h <= 0.25) {
        if (roll < 0.55) reeds.add(tmpMatrix(x, Math.max(h, -0.15) - 0.1, z, rng.float(0, 6.28), rng.float(0.9, 1.6)));
        else if (roll < 0.68) { mangrove.add(tmpMatrix(x, -0.2, z, rng.float(0, 6.28), rng.float(0.8, 1.3))); addCircle(x, z, 0.5, -3, 3, {}); }
      } else if (h <= -0.5 && h > -2.2 && roll < 0.22) {
        for (let k = 0; k < 3; k++) lilies.add(tmpMatrix(x + rng.float(-2, 2), 0.03, z + rng.float(-2, 2), rng.float(0, 6.28), rng.float(0.6, 1.4)));
      }
      continue;
    }
    // Beach & coast
    if (d < 110 && h > 0.9 && h < 4 && f < 0.3) {
      if (roll < 0.11 * dens && d > 28) placePalm(x, z, h, true);
      else if (roll < 0.135 && d > 14 && d < 60 && x > 700) umbrellas.add(tmpMatrix(x, h - 0.05, z, rng.float(0, 6.28), 1));
      else if (roll > 0.985) { const sc = rng.float(0.6, 1.6); rocks.add(tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc)); addCircle(x, z, sc * 0.8, 0, h + sc * 0.6, {}); }
      continue;
    }
    if (h < 0.6) continue;
    // Meadows and coastal parkland
    if (roll < 0.045 * dens && roadGap > 5) {
      if (x > 640 && roll2 < 0.7) placePalm(x, z, h, true);
      else {
        const sc = rng.float(0.8, 1.4);
        broad.add(tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc));
        addCircle(x, z, 0.45 * sc, 0, h + 5, {});
      }
    } else if (roll > 0.99) { const sc = rng.float(0.5, 1.4); rocks.add(tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc)); addCircle(x, z, sc * 0.8, 0, h + sc * 0.6, {}); }
  }
  // City parks and plaza planters
  const GY = CITY.y + 0.16;
  const placeBroad = (x, z, y, sc) => { broad.add(tmpMatrix(x, y - 0.15, z, rng.float(0, 6.28), sc)); addCircle(x, z, 0.4 * sc, 0, y + 5, {}); };
  for (const p of parkSpots) {
    const y = p.planter ? GY + 0.7 : GY;
    if (p.inside) {
      // under glass: no collisions, nobody can get in there
      if (rng.chance(0.55)) { const m = tmpMatrix(p.x, y - 0.1, p.z, rng.float(0, 6.28), rng.float(0.9, 1.3)); palms.add(m); if (quality !== 'low') palmShell.add(m); }
      else broad.add(tmpMatrix(p.x, y - 0.15, p.z, rng.float(0, 6.28), rng.float(0.7, 1.1)));
    } else if (rng.chance(p.planter ? 0.5 : 0.45)) placePalm(p.x, p.z, y, !p.planter);
    else placeBroad(p.x, p.z, y, rng.float(0.75, 1.15));
  }
  // trees on roofs, terraces and sky bridges
  for (const t of roofTrees) broad.add(tmpMatrix(t.x, t.y - 0.1, t.z, rng.float(0, 6.28), t.s));
  // Street trees along every kerb, palms down the boulevard medians and the boardwalk
  const P = {};
  const palmy = { ocean: 1, strip: 0.9, downtown: 0.55, midtown: 0.4, uptown: 0.25, riverside: 0.2, oldtown: 0.15 };
  for (const e of edges) {
    if (!e.grid) continue;
    for (const side of [-1, 1]) {
      edgePoint(e, 50, (e.spec.hw + 3) * side, P);
      const block = blockAt(P.x, P.z);
      const D = block ? block.district : 'ocean';
      if (D === 'docks' || (block && block.park)) continue;
      for (const s of [34, 66]) {
        if (!rng.chance(0.82 * dens + 0.1)) continue;
        edgePoint(e, s + rng.float(-2, 2), (e.spec.hw + 2.5) * side, P);
        if (rng.chance(palmy[D] ?? 0.3)) placePalm(P.x, P.z, GY, true);
        else placeBroad(P.x, P.z, GY, rng.float(0.6, 0.85));
      }
    }
    if (e.type === 'blvd') {
      // (the monorail pylons stand at 14, 50 and 86 m along each block)
      for (const s of [24, 34, 66, 76]) { edgePoint(e, s, 0, P); placePalm(P.x, P.z, CITY.y + 0.03, true); }
    }
  }
  for (let z = CITY.promenade.z0 + 12; z < CITY.promenade.z1 - 8; z += 15) {
    if (Math.abs(z) < 12) continue; // keep the pier entrance open
    placePalm(CITY.promenade.x0 + 3.5, z + rng.float(-2, 2), GY, true);
  }

  for (const ci of [palms, palmShell, pinesFar, pineShell, pineGlowAll, broadFar, broadShell, cypress, mangrove, stems, capsAll, fernsAll, reeds, rocks, umbrellas, lilies]) ci.build(group);

  // ---- Fireflies (GPU-wrapped point field following the camera) -------------
  const N = quality === 'low' ? 250 : 700;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = rng.float(0, 1); pos[i * 3 + 1] = rng.float(0, 1); pos[i * 3 + 2] = rng.float(0, 1); seed[i] = rng.float(0, 100); }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  fg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const fireflyMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uIntensity: { value: 0 }, uMap: { value: makeGlowTexture() }, uGround: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uGround; uniform vec3 uCenter;
      attribute float aSeed; varying float vA; varying vec3 vCol;
      void main() {
        vec3 box = vec3(110.0, 9.0, 110.0);
        vec3 p = position * box;
        p.xz += vec2(sin(uTime * 0.3 + aSeed), cos(uTime * 0.23 + aSeed * 1.7)) * 3.0;
        p.y += sin(uTime * 0.5 + aSeed * 3.1) * 1.2;
        vec3 rel = mod(p - uCenter + box * 0.5, box) - box * 0.5;
        vec3 wp = vec3(uCenter.x + rel.x, uGround + 0.6 + position.y * box.y + sin(uTime * 0.5 + aSeed) * 0.8, uCenter.z + rel.z);
        vec4 mv = viewMatrix * vec4(wp, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((150.0 + 60.0 * sin(aSeed)) / max(-mv.z, 1.0), 1.5, 16.0);
        vA = (0.5 + 0.5 * sin(uTime * (1.5 + fract(aSeed) * 2.0) + aSeed * 9.0)) * smoothstep(55.0, 35.0, length(rel.xz));
        vCol = mix(vec3(0.6, 1.0, 0.5), vec3(0.4, 0.95, 1.0), fract(aSeed * 0.37));
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uIntensity; varying float vA; varying vec3 vCol;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).r * vA * uIntensity;
        gl_FragColor = vec4(vCol * a * 1.6, a);
      }`,
  });
  const fireflies = new THREE.Points(fg, fireflyMat);
  fireflies.frustumCulled = false;
  group.add(fireflies);

  scene.add(group);
  return {
    group, palms,
    update(dt, t, focus) {
      const u = fireflyMat.uniforms;
      u.uTime.value = t;
      u.uCenter.value.copy(focus);
      u.uGround.value = Math.max(terrainHeight(focus.x, focus.z), 0);
      const wild = Math.max(forestMask(focus.x, focus.z), swampMask(focus.x, focus.z));
      u.uIntensity.value = wild * env.night;
      fireflies.visible = u.uIntensity.value > 0.02;
    },
  };
}
