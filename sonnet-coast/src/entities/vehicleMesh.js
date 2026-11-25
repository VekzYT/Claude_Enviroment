// Procedural vehicle models. Bodies are lofted: a ring of points is evaluated at stations along the
// length and skinned into one smooth surface, which is then split into paint, glass and a second
// colour by region. Wheels, lights and fittings are built from rounded primitives.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Batch } from '../world/geom.js';
import { PAL } from '../world/palette.js';
import { makeGlowTexture } from '../world/textures.js';

const cache = new Map();
let shared = null;

function sharedMats() {
  if (shared) return shared;
  shared = {
    trim: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0d151c, roughness: 0.03, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, side: THREE.DoubleSide }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd4d8dc, roughness: 0.16, metalness: 1.0, envMapIntensity: 1.4 }),
    gloss: new THREE.MeshPhysicalMaterial({ color: 0x08090b, roughness: 0.2, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
    wheel: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.35 }),
    head: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.95, 0.85).multiplyScalar(2.2), toneMapped: false }),
    headOff: new THREE.MeshPhysicalMaterial({ color: 0xdfe6ea, roughness: 0.08, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.05 }),
    tail: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.04, 0.06), toneMapped: false }),
    tailBrake: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.1, 0.1).multiplyScalar(3.2), toneMapped: false }),
    sirenRed: new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.policeRed).multiplyScalar(3), toneMapped: false }),
    sirenBlue: new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.police).multiplyScalar(3), toneMapped: false }),
    sirenOff: new THREE.MeshPhysicalMaterial({ color: 0x2a3340, roughness: 0.1, metalness: 0.3, clearcoat: 1 }),
    flareTex: makeGlowTexture(),
    glow: new Map(),
    alt: new Map(),
  };
  return shared;
}
function glowMat(hex) {
  const s = sharedMats();
  if (!s.glow.has(hex)) s.glow.set(hex, new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(1.4), toneMapped: false }));
  return s.glow.get(hex);
}
function altMat(hex, rough = 0.5, metal = 0.2) {
  const s = sharedMats(), key = `${hex}:${rough}:${metal}`;
  if (!s.alt.has(key)) s.alt.set(key, new THREE.MeshPhysicalMaterial({ color: hex, roughness: rough, metalness: metal, clearcoat: rough < 0.5 ? 0.8 : 0, clearcoatRoughness: 0.1 }));
  return s.alt.get(key);
}

// ---- small maths -------------------------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
// piecewise-linear curve through [z, v] keys
function lin(keys, z) {
  const n = keys.length;
  if (z <= keys[0][0]) return keys[0][1];
  if (z >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (z > keys[i + 1][0]) i++;
  return lerp(keys[i][1], keys[i + 1][1], (z - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
}
// smooth (Hermite) curve through [z, v] keys
function smooth(keys, z) {
  const n = keys.length;
  if (z <= keys[0][0]) return keys[0][1];
  if (z >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (z > keys[i + 1][0]) i++;
  const m = (k) => {
    const a = Math.max(0, k - 1), b = Math.min(n - 1, k + 1);
    return (keys[b][1] - keys[a][1]) / (keys[b][0] - keys[a][0]);
  };
  const z0 = keys[i][0], h = keys[i + 1][0] - z0, t = (z - z0) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * keys[i][1] + (t3 - 2 * t2 + t) * h * m(i) + (-2 * t3 + 3 * t2) * keys[i + 1][1] + (t3 - t2) * h * m(i + 1);
}
const within = (r, z) => !!r && z > r[0] && z < r[1];

// ---- lofting -----------------------------------------------------------------------------------
// ringAt(z) gives the right half of a cross-section as [x, y] points from the bottom centre up to
// the top centre. classify(z, seg) names the group a strip belongs to; tint(z, j) shades vertices.
function loft(zs, ringAt, classify, tint, sub = 2) {
  const halves = zs.map((z) => {
    const p = ringAt(z), n = p.length, out = [];
    const at = (i) => (i < 0 ? [-p[-i][0], p[-i][1]] : i >= n ? [-p[2 * n - 2 - i][0], p[2 * n - 2 - i][1]] : p[i]);
    for (let i = 0; i < n - 1; i++) {
      const a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2);
      for (let s = 0; s < sub; s++) {
        const t = s / sub, t2 = t * t, t3 = t2 * t;
        const f = (k) => 0.5 * ((2 * b[k]) + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3);
        out.push(s === 0 ? [b[0], b[1]] : [Math.max(0, f(0)), f(1)]);
      }
    }
    out.push([p[n - 1][0], p[n - 1][1]]);
    return out;
  });
  const H = halves[0].length, K = 2 * H - 2, S = zs.length;
  const pos = new Float32Array((S * K + 2) * 3), col = new Float32Array((S * K + 2) * 3);
  const jOf = (k) => (k < H ? k : 2 * H - 2 - k);
  for (let i = 0; i < S; i++) {
    for (let k = 0; k < K; k++) {
      const j = jOf(k), p = halves[i][j], o = (i * K + k) * 3;
      pos[o] = k < H ? p[0] : -p[0]; pos[o + 1] = p[1]; pos[o + 2] = zs[i];
      const c = tint ? tint(zs[i], j / sub) : 1;
      col[o] = col[o + 1] = col[o + 2] = c;
    }
  }
  const groups = {};
  const push = (name, a, b, c) => { (groups[name] || (groups[name] = [])).push(a, b, c); };
  for (let i = 0; i < S - 1; i++) {
    const zm = (zs[i] + zs[i + 1]) / 2;
    for (let k = 0; k < K; k++) {
      const k1 = (k + 1) % K;
      const seg = Math.floor(Math.min(jOf(k), jOf(k1)) / sub);
      const name = classify(zm, seg);
      const a = i * K + k, b = i * K + k1, c = (i + 1) * K + k, d = (i + 1) * K + k1;
      push(name, a, b, c); push(name, b, d, c);
    }
  }
  // end caps
  for (const [i, front] of [[0, false], [S - 1, true]]) {
    const ci = S * K + (front ? 1 : 0);
    let y0 = Infinity, y1 = -Infinity;
    for (const p of halves[i]) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    pos[ci * 3] = 0; pos[ci * 3 + 1] = (y0 + y1) / 2; pos[ci * 3 + 2] = zs[i];
    col[ci * 3] = col[ci * 3 + 1] = col[ci * 3 + 2] = tint ? tint(zs[i], 5) : 1;
    const name = classify(zs[i], -1);
    for (let k = 0; k < K; k++) { const a = i * K + k, b = i * K + ((k + 1) % K); if (front) push(name, ci, a, b); else push(name, ci, b, a); }
  }
  // one set of smooth normals for the whole skin, shared by every group
  const all = [];
  for (const k of Object.keys(groups)) for (const v of groups[k]) all.push(v);
  const whole = new THREE.BufferGeometry();
  const posA = new THREE.BufferAttribute(pos, 3);
  whole.setAttribute('position', posA);
  whole.setIndex(all);
  whole.computeVertexNormals();
  const norA = whole.getAttribute('normal'), colA = new THREE.BufferAttribute(col, 3);
  const geos = {};
  for (const k of Object.keys(groups)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', posA); g.setAttribute('normal', norA); g.setAttribute('color', colA);
    g.setIndex(groups[k]);
    g.computeBoundingSphere();
    geos[k] = g;
  }
  return geos;
}

// ---- car bodies ----------------------------------------------------------------------------------
// o: gc (floor height), belt/width keys (smooth), cab keys (height of the cabin above the belt,
// linear), tum (roof width), winBase, drop (hood sits below the wings), bed [z0, z1, depth],
// ws/rear/side/roofGlass (glass ranges along z), alt(z, seg), arches (false for open wheels).
function carBody(T, o) {
  const hl = T.len / 2, W = (o.bodyW ?? T.wid) / 2, R = T.wheelR, ax = T.wheelbase / 2;
  const Ra = R + (o.archGap ?? 0.075);
  const axles = o.arches === false ? [] : [ax, -ax];
  const cab = o.cab || [[-hl, 0], [hl, 0]];
  const tum = o.tum ?? 0.74, wb = o.winBase ?? 0.025;
  const info = (z) => {
    const w = W * smooth(o.width, z), yb = smooth(o.belt, z), h = Math.max(0, lin(cab, z));
    const edge = Math.max(0, Math.abs(z) - (hl - (o.overhang ?? 0.55))) / (o.overhang ?? 0.55);
    const yf = o.gc + (o.rise ?? 0.1) * edge * edge;
    return { w, yb, h, yf, yt: yb + (h > 0.02 ? h + 0.026 : 0.036 - (o.drop ? lin(o.drop, z) : 0)) };
  };
  const ringAt = (z) => {
    const { w, yb, h, yf } = info(z);
    const c = clamp01(h / 0.2), wct = w * tum;
    let arch = 0;
    for (const za of axles) { const dz = Math.abs(z - za); if (dz < Ra) arch = Math.max(arch, R + Math.sqrt(Ra * Ra - dz * dz)); }
    const lim = yb - 0.06;
    const low = (y) => Math.min(lim, Math.max(y, arch));
    const fl = arch > 0 ? 0.022 : 0;
    const dr = o.drop ? lin(o.drop, z) * (1 - c) : 0;
    const p = [
      [0, low(yf)],
      [w * 0.62, low(yf)],
      [w * 0.93, low(yf + 0.045)],
      [w + fl, low(yf + 0.15)],
      [w * 1.012 + fl, low(lerp(yf, yb, 0.56))],
      [w * 0.992, yb - 0.075],
      [w * 0.945, yb - 0.008],
      [lerp(w * 0.84, w * 0.9, c), yb + lerp(0.012 - dr * 0.25, Math.min(wb, h * 0.6), c)],
      [lerp(w * 0.66, wct, c), yb + lerp(0.02 - dr * 0.8, h - 0.05, c)],
      [lerp(w * 0.5, wct * 0.88, c), yb + lerp(0.027 - dr, h - 0.008, c)],
      [lerp(w * 0.26, wct * 0.5, c), yb + lerp(0.033 - dr, h + 0.018, c)],
      [0, yb + lerp(0.036 - dr, h + 0.026, c)],
    ];
    if (o.bed && z > o.bed[0] && z < o.bed[1]) {
      const d = o.bed[2];
      p[7] = [w * 0.9, yb + 0.012]; p[8] = [w * 0.83, yb - d]; p[9] = [w * 0.6, yb - d - 0.01]; p[10] = [w * 0.3, yb - d - 0.01]; p[11] = [0, yb - d - 0.01];
    }
    // rounded ends: the last few centimetres pull in towards the middle
    const e = hl - Math.abs(z);
    if (e < 0.1) {
      const s = lerp(o.endScale ?? 0.8, 1, Math.sqrt(clamp01(e / 0.1)));
      let y0 = Infinity, y1 = -Infinity;
      for (const q of p) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      const yc = (y0 + y1) / 2, sy = 1 - (1 - s) * 0.55;
      for (const q of p) { q[0] *= s; q[1] = yc + (q[1] - yc) * sy; }
    }
    return p;
  };
  const set = new Set();
  const add = (z) => { if (z >= -hl - 1e-6 && z <= hl + 1e-6) set.add(Math.round(Math.max(-hl, Math.min(hl, z)) * 500) / 500); };
  for (let z = -hl; z <= hl; z += o.step ?? 0.2) add(z);
  for (const e of [0, 0.025, 0.06, 0.1]) { add(-hl + e); add(hl - e); }
  for (const k of o.belt) add(k[0]);
  for (const k of cab) add(k[0]);
  for (const r of [o.ws, o.rear, o.roofGlass, ...(o.side || [])]) if (r) { add(r[0]); add(r[1]); }
  if (o.bed) for (const z of [o.bed[0], o.bed[0] + 0.03, o.bed[1], o.bed[1] - 0.03]) add(z);
  for (const z of o.breaks || []) add(z);
  if (o.side && o.side.length) { add(o.side[0][0] - 0.02); add(o.side[o.side.length - 1][1] + 0.02); }
  for (const z of [...(o.seams || []), ...(o.seamsTop || [])]) { add(z - 0.007); add(z + 0.007); }
  for (const za of axles) {
    for (let i = 0; i <= 8; i++) add(za + Ra * Math.cos((i / 8) * Math.PI));
    add(za + Ra + 0.02); add(za - Ra - 0.02);
  }
  const zs = [...set].sort((a, b) => a - b).filter((z, i, a) => i === 0 || z - a[i - 1] > 0.004);
  const classify = (z, seg) => {
    if (seg < 0) return 'paint';
    if (seg >= 3 && seg <= 6 && o.seams && o.seams.some((q) => Math.abs(q - z) < 0.007)) return 'dark';
    if (seg >= 7 && o.seamsTop && o.seamsTop.some((q) => Math.abs(q - z) < 0.007) && lin(cab, z) < 0.03) return 'dark';
    if (o.alt && o.alt(z, seg)) return 'alt';
    if (seg === 7 && o.side && o.side.some((r) => within(r, z))) return 'glass';
    // bright waistline under the side glass, gloss-black pillars between the panes
    if (o.side && o.side.length && z > o.side[0][0] - 0.02 && z < o.side[o.side.length - 1][1] + 0.02) {
      if (seg === 6 && o.waist !== false) return 'chrome';
      if (seg === 7) return 'gloss';
    }
    if (seg >= 8 && (within(o.ws, z) || within(o.rear, z)) && lin(cab, z) > 0.075) return 'glass';
    if (seg >= 8 && within(o.roofGlass, z)) return 'glass';
    return 'paint';
  };
  const tint = (z, j) => {
    if (j <= 1.2) return 0.06;
    if (j < 2.2) return 0.4;
    if (o.bed && j >= 7.6 && z > o.bed[0] && z < o.bed[1]) return 0.1;
    return 1;
  };
  const geos = loft(zs, ringAt, classify, tint, o.sub ?? 2);
  return { geos, info, hl, W, R, ax, Ra, axles };
}

// ---- fittings ------------------------------------------------------------------------------------
const _v = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
function rbox(b, sx, sy, sz, x, y, z, color, r = 0.04, ry = 0, rx = 0, rz = 0) {
  b.add(new RoundedBoxGeometry(sx, sy, sz, 1, Math.min(r, sx / 2 - 0.001, sy / 2 - 0.001, sz / 2 - 0.001)), color, x, y, z, rx, ry, rz);
}
function ell(b, sx, sy, sz, x, y, z, color, seg = 10) {
  b.add(new THREE.SphereGeometry(0.5, seg, Math.max(6, seg - 4)), color, x, y, z, 0, 0, 0, sx, sy, sz);
}
function tube(b, x0, y0, z0, x1, y1, z1, r, color, seg = 8) {
  _v.set(x1 - x0, y1 - y0, z1 - z0);
  const len = _v.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  _q.setFromUnitVectors(_up, _v.normalize());
  g.applyQuaternion(_q);
  b.add(g, color, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
function ring(b, R, r, x, y, z, color, rx = Math.PI / 2, seg = 20) {
  b.add(new THREE.TorusGeometry(R, r, 6, seg), color, x, y, z, rx, 0, 0);
}
const DARK = 0x15161a, PLASTIC = 0x1e2024, CHROME = 0xc9ced3;

// A wheel with its axle along x: rounded tyre, barrel, five spokes a side, brake disc.
function wheelGeo(r, w, offroad) {
  const b = new Batch();
  const hw = w / 2, sh = offroad ? 0.9 : 0.72;
  const prof = [[r * 0.6, -hw * 0.9], [r * 0.8, -hw], [r * 0.95, -hw * 0.97], [r, -hw * sh], [r, hw * sh], [r * 0.95, hw * 0.97], [r * 0.8, hw], [r * 0.6, hw * 0.9]];
  const tyre = new THREE.LatheGeometry(prof.map(([a, c]) => new THREE.Vector2(a, c)), 18);
  b.add(tyre, 0x101113, 0, 0, 0, 0, 0, Math.PI / 2);
  if (offroad) for (let i = 0; i < 14; i++) {   // tread blocks
    const a = (i / 14) * Math.PI * 2;
    b.add(new THREE.BoxGeometry(w * 0.96, r * 0.09, r * 0.2), 0x0c0d0e, 0, Math.cos(a) * r, Math.sin(a) * r, a, 0, 0);
  }
  const rr = r * 0.61;
  const barrel = new THREE.CylinderGeometry(rr, rr, w * 0.78, 18, 1, true);
  b.add(barrel, 0x2a2c30, 0, 0, 0, 0, 0, Math.PI / 2);
  b.add(new THREE.CylinderGeometry(rr * 0.74, rr * 0.74, w * 0.5, 14), 0x5d6166, 0, 0, 0, 0, 0, Math.PI / 2);   // brake disc
  for (const s of [-1, 1]) {
    const x = s * hw * 0.8;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      b.add(new THREE.BoxGeometry(0.035, rr * 0.98, rr * 0.2), CHROME, x, Math.cos(a) * rr * 0.5, Math.sin(a) * rr * 0.5, a, 0, 0);
    }
    b.add(new THREE.CylinderGeometry(rr * 0.24, rr * 0.28, 0.05, 10), CHROME, x + s * 0.012, 0, 0, 0, 0, Math.PI / 2);
    b.add(new THREE.TorusGeometry(rr, 0.02, 4, 16), CHROME, s * hw * 0.86, 0, 0, 0, Math.PI / 2, 0);
  }
  return b.merged();
}

// Lamp lenses: [x, y, z, width, height] -> a low dome set into the body.
function lightsGeo(list, front) {
  const b = new Batch();
  for (const [x, y, z, w, h, d = 0.16] of list) ell(b, w, h, d, x, y, z, 0xffffff, 12);
  void front;
  return b.merged();
}

// things most road cars share
function carFittings(b, B, o = {}) {
  const { hl, W, R, axles, Ra } = B;
  // the dark insides of the wheel wells
  for (const za of axles) { const top = Math.min(R * 2.05, B.info(za).yt - 0.09); b.box(Math.max(0.2, W * 2 - 0.72), top - R * 0.35, Ra * 1.9, 0, R * 0.35, za, 0x0a0a0b); }
  const f = B.info(hl - 0.12), r = B.info(-hl + 0.12);
  // lower grille and intake, front plate
  rbox(b, f.w * 1.25, Math.max(0.1, (f.yb - f.yf) * 0.3), 0.1, 0, f.yf + (f.yb - f.yf) * 0.3, hl - 0.045, 0x0c0d0f, 0.03);
  if (o.grille !== false) rbox(b, f.w * 0.8, (f.yb - f.yf) * 0.2, 0.08, 0, f.yf + (f.yb - f.yf) * 0.66, hl - 0.035, 0x121316, 0.03);
  rbox(b, 0.42, 0.11, 0.02, 0, r.yf + (r.yb - r.yf) * 0.42, -hl - 0.004, 0xe9e6dc, 0.008);
  // rear valance and exhausts
  rbox(b, r.w * 1.3, (r.yb - r.yf) * 0.22, 0.1, 0, r.yf + (r.yb - r.yf) * 0.14, -hl + 0.04, 0x0f1012, 0.03);
  if (o.exhaust !== false) for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 10), CHROME, s * r.w * 0.5, r.yf + 0.06, -hl + 0.02, Math.PI / 2, 0, 0);
  // door mirrors
  if (o.mirrorZ !== undefined) {
    const m = B.info(o.mirrorZ);
    for (const s of [-1, 1]) { ell(b, 0.2, 0.12, 0.1, s * (m.w + 0.09), m.yb + 0.07, o.mirrorZ, PLASTIC, 10); tube(b, s * m.w * 0.93, m.yb + 0.03, o.mirrorZ, s * (m.w + 0.06), m.yb + 0.06, o.mirrorZ, 0.022, PLASTIC, 6); }
  }
  // door handles
  for (const z of o.handles || []) { const m = B.info(z); for (const s of [-1, 1]) rbox(b, 0.02, 0.028, 0.15, s * (m.w * 0.985), m.yb - 0.1, z, o.handleColor ?? CHROME, 0.009); }
}

const SHAPES = {
  sport(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.15, tum: 0.7, rise: 0.06,
      belt: [[-2.25, 0.72], [-1.9, 0.86], [-1.35, 0.88], [-0.5, 0.8], [0.6, 0.78], [1.35, 0.83], [1.85, 0.72], [2.25, 0.47]],
      cab: [[-1.5, 0], [-0.6, 0.36], [0.0, 0.4], [0.1, 0.39], [1.05, 0]],
      width: [[-2.25, 0.86], [-1.9, 0.99], [-1.2, 1.0], [0.0, 0.95], [1.4, 0.99], [2.0, 0.93], [2.25, 0.76]],
      drop: [[-2.25, 0.02], [-1.5, 0.05], [1.0, 0.06], [1.4, 0.1], [2.25, 0.03]],
      ws: [0.1, 1.05], rear: [-1.5, -0.6], side: [[-0.56, 0.06]],
      seams: [-0.62, 0.52], seamsTop: [1.12],
    });
    return {
      B,
      trim(b) {
        carFittings(b, B, { mirrorZ: 0.78, handles: [-0.15] });
        rbox(b, W * 1.9, 0.035, 0.36, 0, 1.06, -2.02, DARK, 0.016);                     // wing
        for (const s of [-1, 1]) { rbox(b, 0.05, 0.2, 0.2, s * W * 0.62, 0.95, -1.98, DARK, 0.02); rbox(b, 0.03, 0.12, 0.4, s * W * 0.95, 1.06, -2.02, DARK, 0.012); }
        rbox(b, W * 1.75, 0.035, 0.3, 0, 0.19, 2.12, DARK, 0.015);                      // splitter
        for (const s of [-1, 1]) ell(b, 0.06, 0.22, 0.5, s * W * 0.985, 0.52, -0.75, 0x0b0b0d, 10);   // side intakes
      },
      head: [[W * 0.62, 0.6, 2.13, 0.4, 0.1, 0.2], [-W * 0.62, 0.6, 2.13, 0.4, 0.1, 0.2]],
      tail: [[0, 0.74, -2.2, W * 1.45, 0.06, 0.12]],
      seat: [0.42, 0.42, -0.25],
    };
  },
  prototype(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.12, tum: 0.6, rise: 0.05,
      belt: [[-2.35, 0.66], [-2.0, 0.84], [-1.4, 0.87], [-0.6, 0.76], [0.6, 0.74], [1.4, 0.84], [1.9, 0.7], [2.35, 0.38]],
      cab: [[-1.35, 0], [-0.55, 0.3], [0.1, 0.33], [1.2, 0]],
      width: [[-2.35, 0.84], [-1.9, 1.0], [-1.0, 0.97], [0.1, 0.9], [1.4, 0.99], [2.05, 0.92], [2.35, 0.7]],
      drop: [[-2.35, 0.02], [-1.4, 0.1], [1.2, 0.08], [1.5, 0.14], [2.35, 0.03]],
      ws: [0.1, 1.2], rear: [-1.35, -0.55], side: [[-0.55, 0.1]], roofGlass: [-0.55, 0.1],
    });
    return {
      B,
      trim(b) {
        carFittings(b, B, { mirrorZ: 0.9, grille: false, exhaust: false });
        rbox(b, W * 2.0, 0.03, 0.42, 0, 1.12, -2.1, 0x0c0c10, 0.014);
        for (const s of [-1, 1]) rbox(b, 0.045, 0.28, 0.26, s * W * 0.7, 0.98, -2.06, 0x0c0c10, 0.02);
        for (const s of [-1, 1]) for (let k = 0; k < 4; k++) rbox(b, 0.03, 0.12, 0.34, s * W * 0.3 * (k * 0.4 + 0.2), 0.2, -2.3, 0x0a0a0c, 0.012);   // diffuser fins
      },
      glowParts(b) {
        for (const s of [-1, 1]) rbox(b, 0.03, 0.03, 3.2, s * (W * 0.98), 0.27, 0, 0xffffff, 0.012);
        rbox(b, W * 1.5, 0.03, 0.04, 0, 0.52, 2.2, 0xffffff, 0.012);
      },
      head: [[W * 0.62, 0.55, 2.22, 0.36, 0.06, 0.2], [-W * 0.62, 0.55, 2.22, 0.36, 0.06, 0.2]],
      tail: [[0, 0.7, -2.31, W * 1.6, 0.045, 0.1]],
      seat: [0.42, 0.38, -0.2],
    };
  },
  sedan(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.2, tum: 0.74,
      belt: [[-2.35, 0.8], [-2.1, 0.95], [-1.0, 1.0], [1.0, 0.97], [1.9, 0.9], [2.35, 0.68]],
      cab: [[-1.72, 0], [-1.05, 0.44], [-0.2, 0.485], [0.4, 0.46], [1.22, 0]],
      width: [[-2.35, 0.84], [-2.0, 0.97], [0, 1.0], [1.7, 0.97], [2.15, 0.9], [2.35, 0.74]],
      ws: [0.4, 1.22], rear: [-1.72, -1.05], side: [[-1.0, -0.36], [-0.27, 0.36]],
      seams: [-1.08, -0.31, 0.62], seamsTop: [1.3, -1.8],
    });
    return {
      B,
      trim(b) { carFittings(b, B, { mirrorZ: 1.02, handles: [-0.6, 0.2] }); },
      head: [[W * 0.62, 0.76, 2.24, 0.44, 0.13, 0.2], [-W * 0.62, 0.76, 2.24, 0.44, 0.13, 0.2]],
      tail: [[W * 0.64, 0.86, -2.27, 0.42, 0.11, 0.16], [-W * 0.64, 0.86, -2.27, 0.42, 0.11, 0.16]],
      seat: [0.42, 0.6, 0],
    };
  },
  compact(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.2, tum: 0.78,
      belt: [[-1.9, 0.86], [-1.7, 0.99], [0.6, 0.98], [1.4, 0.92], [1.9, 0.7]],
      cab: [[-1.86, 0], [-1.52, 0.47], [-0.4, 0.52], [0.25, 0.5], [1.0, 0]],
      width: [[-1.9, 0.88], [-1.6, 0.98], [0, 1], [1.3, 0.97], [1.7, 0.9], [1.9, 0.76]],
      ws: [0.25, 1.0], rear: [-1.86, -1.52], side: [[-1.46, -0.46], [-0.37, 0.2]],
      seams: [-1.5, -0.42, 0.46], seamsTop: [1.08],
    });
    return {
      B,
      trim(b) { carFittings(b, B, { mirrorZ: 0.82, handles: [-0.9, 0.0] }); },
      head: [[W * 0.62, 0.76, 1.8, 0.36, 0.16, 0.2], [-W * 0.62, 0.76, 1.8, 0.36, 0.16, 0.2]],
      tail: [[W * 0.68, 1.0, -1.8, 0.16, 0.28, 0.14], [-W * 0.68, 1.0, -1.8, 0.16, 0.28, 0.14]],
      seat: [0.4, 0.6, 0],
    };
  },
  truck(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.62, tum: 0.86, rise: 0.16, endScale: 0.88, archGap: 0.1,
      belt: [[-2.65, 1.4], [-2.4, 1.44], [1.2, 1.46], [2.2, 1.42], [2.65, 1.2]],
      cab: [[-0.46, 0], [-0.32, 0.56], [0.7, 0.58], [1.36, 0]],
      width: [[-2.65, 0.94], [-2.4, 0.99], [1.8, 1.0], [2.4, 0.97], [2.65, 0.88]],
      bed: [-2.52, -0.52, 0.44],
      ws: [0.7, 1.36], rear: [-0.46, -0.32], side: [[-0.27, 0.66]],
      alt: (z, seg) => seg === 2 || seg === 3, breaks: [-0.3],
      seams: [-0.36, 0.86], seamsTop: [1.44],
    });
    return {
      B, altColor: [PLASTIC, 0.8, 0.1],
      trim(b) {
        carFittings(b, B, { mirrorZ: 1.1, handles: [0.1], handleColor: DARK });
        rbox(b, W * 2.06, 0.3, 0.2, 0, 0.82, 2.66, 0x1a1b1e, 0.06); rbox(b, W * 2.04, 0.26, 0.18, 0, 0.82, -2.66, 0x1a1b1e, 0.06);   // bumpers
        for (const s of [-1, 1]) tube(b, s * (W + 0.06), 0.62, -0.5, s * (W + 0.06), 0.62, 1.2, 0.05, CHROME, 8);                 // side steps
        tube(b, -W * 0.8, 2.12, 0.25, W * 0.8, 2.12, 0.25, 0.04, DARK, 8);                                                       // light bar
        for (const s of [-1, 1]) tube(b, s * W * 0.7, 2.02, 0.2, s * W * 0.7, 2.12, 0.25, 0.03, DARK, 6);
        for (const s of [-1, 1]) { tube(b, s * W * 0.82, 1.45, -0.6, s * W * 0.82, 1.95, -0.6, 0.04, DARK, 8); }                 // sports bar
        tube(b, -W * 0.82, 1.95, -0.6, W * 0.82, 1.95, -0.6, 0.04, DARK, 8);
      },
      head: [[W * 0.66, 1.24, 2.56, 0.4, 0.17, 0.2], [-W * 0.66, 1.24, 2.56, 0.4, 0.17, 0.2], [0, 2.12, 0.3, W * 1.3, 0.07, 0.1]],
      tail: [[W * 0.86, 1.22, -2.6, 0.14, 0.34, 0.14], [-W * 0.86, 1.22, -2.6, 0.14, 0.34, 0.14]],
      seat: [0.45, 1.1, 0.3],
    };
  },
  buggy(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.5, bodyW: T.wid * 0.6, arches: false, rise: 0.2, overhang: 0.7,
      belt: [[-1.7, 0.86], [-1.4, 1.0], [-0.2, 1.0], [0.8, 0.9], [1.7, 0.66]],
      width: [[-1.7, 0.8], [-1.2, 1.0], [0.3, 1.0], [1.2, 0.8], [1.7, 0.5]],
      bed: [-0.95, 0.3, 0.34],
    });
    const c = 0x24252a;
    return {
      B,
      trim(b) {
        const cx = W * 0.56;
        for (const s of [-1, 1]) {                                                       // roll cage
          tube(b, s * cx, 0.98, -1.0, s * cx, 1.95, -0.85, 0.04, c); tube(b, s * cx, 0.95, 0.5, s * cx, 1.92, 0.05, 0.04, c);
          tube(b, s * cx, 1.95, -0.85, s * cx, 1.92, 0.05, 0.04, c); tube(b, s * cx, 1.95, -0.85, s * cx * 0.9, 1.0, -1.6, 0.035, c);
          // suspension arms out to the wheels
          for (const z of [B.ax, -B.ax]) { tube(b, s * W * 0.5, 0.62, z - 0.2, s * (W - 0.24), 0.46, z, 0.03, 0x3a3c40, 6); tube(b, s * W * 0.5, 0.62, z + 0.2, s * (W - 0.24), 0.46, z, 0.03, 0x3a3c40, 6); tube(b, s * W * 0.45, 0.95, z, s * (W - 0.26), 0.56, z, 0.035, PAL.terracotta, 6); }
          rbox(b, 0.44, 0.14, 0.46, s * 0.3, 0.74, -0.42, 0x2d2f34, 0.05); rbox(b, 0.44, 0.56, 0.13, s * 0.3, 1.04, -0.68, 0x2d2f34, 0.05, 0, -0.15);   // seats
        }
        tube(b, -cx, 1.95, -0.85, cx, 1.95, -0.85, 0.04, c); tube(b, -cx, 1.92, 0.05, cx, 1.92, 0.05, 0.04, c);
        rbox(b, W * 0.8, 0.36, 0.5, 0, 1.12, -1.3, 0x3d4046, 0.06);                      // engine
        for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), CHROME, s * 0.2, 1.22, -1.62, Math.PI / 2 - 0.3, 0, 0);
        tube(b, -W * 0.7, 0.62, 1.74, W * 0.7, 0.62, 1.74, 0.045, c);                    // bumper bar
        b.add(new THREE.TorusGeometry(0.16, 0.022, 6, 16), DARK, 0.3, 1.2, 0.34, -0.5, 0, 0);   // steering wheel
      },
      head: [[W * 0.3, 0.84, 1.56, 0.2, 0.15, 0.16], [-W * 0.3, 0.84, 1.56, 0.2, 0.15, 0.16], [0, 2.0, 0.08, W * 0.8, 0.08, 0.1]],
      tail: [[W * 0.36, 0.92, -1.62, 0.16, 0.1, 0.1], [-W * 0.36, 0.92, -1.62, 0.16, 0.1, 0.1]],
      seat: [0.3, 0.85, -0.45],
    };
  },
  van(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.42, tum: 0.95, winBase: 0.3, endScale: 0.92, archGap: 0.09,
      belt: [[-3.1, 1.5], [1.4, 1.5], [2.5, 1.44], [3.1, 1.12]],
      cab: [[-3.09, 0], [-3.02, 1.16], [1.5, 1.2], [1.75, 1.12], [2.5, 0]],
      width: [[-3.1, 0.97], [-2.9, 1.0], [2.3, 1.0], [2.8, 0.96], [3.1, 0.88]],
      ws: [1.75, 2.5], side: [[1.02, 1.68]],
      alt: (z, seg) => seg === 5 && z < 0.9 && z > -3.0, breaks: [0.9, -3.0, 1.0],
    });
    return {
      B, altColor: [PAL.terracotta, 0.4, 0.3],
      trim(b) {
        carFittings(b, B, { mirrorZ: 1.72, handles: [1.3], handleColor: DARK });
        rbox(b, W * 2.04, 0.3, 0.2, 0, 0.6, 3.06, 0x1c1c20, 0.07); rbox(b, W * 2.04, 0.3, 0.2, 0, 0.6, -3.06, 0x1c1c20, 0.07);
        rbox(b, 1.2, 0.26, 1.5, 0, 2.82, -1.2, 0x55585e, 0.08);                          // roof unit
        for (const s of [-1, 1]) for (const z of [-1.0, -0.2]) rbox(b, 0.015, 1.9, 0.03, s * W * 0.985, 1.55, z, 0x9a9da2, 0.006);   // door seams
        rbox(b, 0.03, 1.7, 0.02, 0, 1.6, -3.105, 0x8a8d92, 0.006);
      },
      glowParts(b) { for (const s of [-1, 1]) rbox(b, 0.02, 0.05, 3.9, s * (W * 0.992), 1.72, -1.0, 0xffffff, 0.008); },
      head: [[W * 0.68, 1.24, 3.0, 0.38, 0.18, 0.2], [-W * 0.68, 1.24, 3.0, 0.38, 0.18, 0.2]],
      tail: [[W * 0.86, 1.6, -3.07, 0.14, 0.5, 0.12], [-W * 0.86, 1.6, -3.07, 0.14, 0.5, 0.12]],
      seat: [0.5, 1.2, 1.6],
    };
  },
  police(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.22, tum: 0.75,
      belt: [[-2.45, 0.84], [-2.2, 0.99], [-1.0, 1.04], [1.05, 1.01], [2.0, 0.93], [2.45, 0.72]],
      cab: [[-1.78, 0], [-1.1, 0.44], [-0.2, 0.48], [0.42, 0.46], [1.26, 0]],
      width: [[-2.45, 0.85], [-2.1, 0.97], [0, 1.0], [1.8, 0.97], [2.25, 0.9], [2.45, 0.76]],
      ws: [0.42, 1.26], rear: [-1.78, -1.1], side: [[-1.05, -0.36], [-0.27, 0.38]],
      alt: (z, seg) => seg >= 3 && seg <= 5 && z > -1.12 && z < 0.9, breaks: [-1.12, 0.9],
      seams: [-1.12, -0.31, 0.9], seamsTop: [1.34, -1.86],
    });
    return {
      B, altColor: [0xe9e2d2, 0.35, 0.3],
      trim(b) {
        carFittings(b, B, { mirrorZ: 1.05, handles: [-0.6, 0.2], handleColor: DARK });
        for (const s of [-1, 1]) { tube(b, s * W * 0.45, 0.3, 2.5, s * W * 0.45, 0.92, 2.52, 0.04, DARK); }                      // push bar
        tube(b, -W * 0.6, 0.62, 2.52, W * 0.6, 0.62, 2.52, 0.04, DARK); tube(b, -W * 0.6, 0.9, 2.52, W * 0.6, 0.9, 2.52, 0.04, DARK);
        rbox(b, W * 1.2, 0.05, 0.3, 0, 1.52, -0.4, DARK, 0.02);                          // lightbar base
        tube(b, W * 0.5, 1.0, -1.9, W * 0.5, 1.75, -2.0, 0.008, DARK, 5);                // aerial
      },
      glowParts(b) { for (const s of [-1, 1]) rbox(b, 0.02, 0.04, 3.9, s * (W * 0.996), 0.96, 0, 0xffffff, 0.008); },
      head: [[W * 0.62, 0.8, 2.34, 0.44, 0.13, 0.2], [-W * 0.62, 0.8, 2.34, 0.44, 0.13, 0.2]],
      tail: [[0, 0.9, -2.4, W * 1.5, 0.07, 0.12]],
      siren: [0, 1.6, -0.4, W * 1.12],
      seat: [0.42, 0.62, 0],
    };
  },
  policeTruck(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.6, tum: 0.85, rise: 0.16, endScale: 0.88, archGap: 0.1,
      belt: [[-2.6, 1.3], [-2.3, 1.44], [1.2, 1.46], [2.2, 1.42], [2.6, 1.2]],
      cab: [[-2.56, 0], [-2.2, 0.5], [0.6, 0.54], [1.36, 0]],
      width: [[-2.6, 0.93], [-2.3, 0.99], [1.8, 1.0], [2.35, 0.97], [2.6, 0.88]],
      ws: [0.6, 1.36], rear: [-2.56, -2.2], side: [[-2.12, -1.24], [-1.14, -0.24], [-0.14, 0.56]],
      alt: (z, seg) => seg >= 3 && seg <= 5 && z > -1.2 && z < 0.85, breaks: [-1.2, 0.85],
      seams: [-1.2, -0.19, 0.85], seamsTop: [1.44],
    });
    return {
      B, altColor: [0xe9e2d2, 0.35, 0.3],
      trim(b) {
        carFittings(b, B, { mirrorZ: 1.1, handles: [-0.7, 0.3], handleColor: DARK });
        rbox(b, W * 2.08, 0.4, 0.22, 0, 0.84, 2.62, DARK, 0.07); rbox(b, W * 2.04, 0.28, 0.2, 0, 0.84, -2.62, DARK, 0.07);
        for (const s of [-1, 1]) { tube(b, s * W * 0.5, 0.7, 2.74, s * W * 0.5, 1.4, 2.72, 0.045, DARK); tube(b, s * (W + 0.06), 0.62, -0.9, s * (W + 0.06), 0.62, 1.2, 0.05, DARK, 8); }
        tube(b, -W * 0.5, 1.4, 2.72, W * 0.5, 1.4, 2.72, 0.045, DARK);
        rbox(b, W * 1.2, 0.05, 0.3, 0, 2.02, -0.3, DARK, 0.02);
        for (const s of [-1, 1]) tube(b, s * W * 0.7, 2.0, -2.0, s * W * 0.7, 2.0, 0.3, 0.025, DARK, 6);                          // roof rails
      },
      glowParts(b) { for (const s of [-1, 1]) rbox(b, 0.02, 0.04, 4.2, s * (W * 0.996), 1.4, 0, 0xffffff, 0.008); },
      head: [[W * 0.66, 1.24, 2.5, 0.4, 0.17, 0.2], [-W * 0.66, 1.24, 2.5, 0.4, 0.17, 0.2]],
      tail: [[0, 1.32, -2.56, W * 1.5, 0.08, 0.12]],
      siren: [0, 2.1, -0.3, W * 1.12],
      seat: [0.45, 1.1, 0.2],
    };
  },
  swat(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.62, tum: 0.93, winBase: 0.38, rise: 0.14, endScale: 0.93, archGap: 0.1, sub: 1,
      belt: [[-3.3, 1.86], [1.9, 1.9], [2.7, 1.8], [3.3, 1.46]],
      cab: [[-3.29, 0], [-3.2, 0.98], [1.45, 1.0], [1.7, 0.92], [2.3, 0]],
      width: [[-3.3, 0.97], [-3.1, 1.0], [2.5, 1.0], [3.0, 0.97], [3.3, 0.9]],
      ws: [1.72, 2.2], side: [[1.0, 1.6]],
      alt: (z, seg) => seg === 4 && z < 0.7 && z > -3.1, breaks: [0.7, -3.1, 1.0, 1.6],
    });
    return {
      B, altColor: [0xe9e2d2, 0.4, 0.3],
      trim(b) {
        carFittings(b, B, { mirrorZ: 1.72, grille: false, exhaust: false });
        rbox(b, W * 2.14, 0.86, 0.3, 0, 0.94, 3.36, 0x0e0f12, 0.08);                     // ram
        for (const s of [-1, 1]) for (let k = 0; k < 3; k++) rbox(b, 0.14, 0.7, 0.06, s * W * 0.5 * (k * 0.5 + 0.2), 0.94, 3.52, 0x1c1d22, 0.02);
        rbox(b, W * 1.2, 0.05, 0.36, 0, 2.92, 0.8, 0x0e0f12, 0.02);
        for (const s of [-1, 1]) { tube(b, s * (W + 0.07), 0.64, -1.6, s * (W + 0.07), 0.64, 1.6, 0.06, 0x0e0f12, 8); for (const z of [-2.2, -0.9, 0.3]) rbox(b, 0.02, 0.3, 0.5, s * W * 0.99, 2.45, z, 0x0a0b0d, 0.008); }
        rbox(b, 0.9, 0.2, 0.9, 0, 2.98, -1.4, 0x17181c, 0.06);                           // roof hatch
        tube(b, -W * 0.6, 1.0, -3.3, -W * 0.6, 3.4, -3.3, 0.01, DARK, 5);
      },
      glowParts(b) { for (const s of [-1, 1]) rbox(b, 0.02, 0.05, 4.4, s * (W * 0.996), 2.02, -0.9, 0xffffff, 0.008); },
      head: [[W * 0.7, 1.52, 3.2, 0.38, 0.2, 0.2], [-W * 0.7, 1.52, 3.2, 0.38, 0.2, 0.2]],
      tail: [[W * 0.86, 1.6, -3.27, 0.16, 0.5, 0.12], [-W * 0.86, 1.6, -3.27, 0.16, 0.5, 0.12]],
      siren: [0, 3.02, 0.8, W * 1.12],
      seat: [0.5, 1.4, 1.2],
    };
  },
  hoverbike(T) {
    const B = carBody(T, {
      gc: 0.34, bodyW: 0.5, arches: false, rise: 0.22, overhang: 0.6, step: 0.1, endScale: 0.6,
      belt: [[-1.3, 0.58], [-1.0, 0.72], [-0.3, 0.78], [0.35, 0.86], [0.9, 0.76], [1.3, 0.54]],
      width: [[-1.3, 0.3], [-0.9, 0.8], [-0.2, 1.0], [0.45, 1.0], [1.0, 0.7], [1.3, 0.25]],
    });
    return {
      B,
      trim(b) {
        rbox(b, 0.3, 0.09, 0.78, 0, 0.84, -0.45, 0x1a1a1e, 0.04);                        // saddle
        tube(b, -0.4, 1.06, 0.5, 0.4, 1.06, 0.5, 0.022, 0x1a1a1e, 8);                    // bars
        tube(b, 0, 0.86, 0.56, 0, 1.06, 0.5, 0.03, 0x2a2b30, 8);
        for (const s of [-1, 1]) { ell(b, 0.07, 0.07, 0.14, s * 0.4, 1.06, 0.5, 0x101012, 8); rbox(b, 0.5, 0.03, 0.34, s * 0.42, 0.44, -1.0, 0x24252a, 0.014, 0, 0, s * 0.25); }
        for (const z of [0.9, -0.9]) { ring(b, 0.38, 0.07, 0, 0.2, z, 0x24252a); b.add(new THREE.CylinderGeometry(0.1, 0.14, 0.24, 10), 0x2c2d32, 0, 0.3, z); }
        for (const s of [-1, 1]) for (const z of [0.9, -0.9]) tube(b, s * 0.12, 0.42, z * 0.8, s * 0.3, 0.22, z, 0.03, 0x33353a, 6);
      },
      glassParts(b) {
        const g = new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI, 0.25, 1.05);
        b.add(g, 0xffffff, 0, 0.78, 0.62, -0.5, 0, 0, 0.95, 1.25, 0.9);
      },
      glowParts(b) {
        for (const z of [0.9, -0.9]) b.add(new THREE.CylinderGeometry(0.31, 0.31, 0.03, 18), 0xffffff, 0, 0.13, z);
        for (const s of [-1, 1]) rbox(b, 0.025, 0.025, 1.3, s * 0.262, 0.58, 0, 0xffffff, 0.01);
      },
      head: [[0, 0.62, 1.24, 0.2, 0.1, 0.16]],
      tail: [[0, 0.62, -1.26, 0.2, 0.05, 0.1]],
      seat: [0, 0.78, -0.4],
    };
  },
  boat(T) {
    const W = T.wid / 2, hl = T.len / 2;
    const width = [[-hl, 0.9], [-hl + 0.6, 1.0], [0.4, 1.0], [hl * 0.5, 0.8], [hl * 0.82, 0.42], [hl, 0.07]];
    const keel = [[-hl, -0.34], [0.4, -0.38], [hl * 0.6, -0.18], [hl, 0.46]];
    const gun = [[-hl, 0.6], [0.4, 0.64], [hl, 0.86]];
    const c0 = -hl + 0.5, c1 = hl * 0.22;
    const ringAt = (z) => {
      const w = W * smooth(width, z), yk = smooth(keel, z), yg = smooth(gun, z);
      const p = [[0, yk], [w * 0.45, yk + 0.09], [w * 0.86, yk + 0.24], [w * 0.98, yk + 0.4], [w, lerp(yk, yg, 0.7)], [w * 0.992, yg - 0.05], [w * 0.95, yg], [w * 0.85, yg - 0.004]];
      if (z > c0 && z < c1) { const f = 0.14; p.push([w * 0.82, f + 0.02], [w * 0.6, f], [w * 0.3, f], [0, f]); }
      else p.push([w * 0.66, yg + 0.03], [w * 0.45, yg + 0.05], [w * 0.22, yg + 0.06], [0, yg + 0.065]);
      return p;
    };
    const set = new Set();
    for (let z = -hl; z <= hl + 1e-6; z += 0.2) set.add(Math.round(z * 100) / 100);
    for (const z of [hl, hl - 0.06, c0, c0 + 0.03, c1, c1 - 0.03]) set.add(Math.round(z * 100) / 100);
    const zs = [...set].sort((a, b) => a - b);
    const geos = loft(zs, ringAt, (z, seg) => (seg < 0 ? 'paint' : seg <= 1 ? 'dark' : seg >= 6 ? 'alt' : 'paint'), (z, j) => (j >= 8.5 && z > c0 && z < c1 ? 0.62 : 1));
    return {
      B: { geos, hl, W },
      altColor: [0xf0ece2, 0.5, 0.05], darkColor: [0x2a3138, 0.6, 0.1],
      trim(b) {
        const col = 0xe9e2d2;
        for (const s of [-1, 1]) { rbox(b, 0.5, 0.16, 0.5, s * 0.46, 0.5, -0.3, col, 0.06); rbox(b, 0.5, 0.5, 0.14, s * 0.46, 0.8, -0.56, col, 0.06, 0, -0.12); rbox(b, 0.34, 0.3, 0.36, s * 0.46, 0.29, -0.3, 0x8f9499, 0.04); }
        rbox(b, W * 1.5, 0.3, 0.5, 0, 0.3, -hl + 0.86, col, 0.08);                       // stern bench
        rbox(b, W * 1.45, 0.42, 0.26, 0, 0.62, c1 - 0.2, 0xd8d2c4, 0.06);                // console
        b.add(new THREE.TorusGeometry(0.17, 0.022, 6, 16), DARK, 0.46, 0.94, c1 - 0.38, -0.6, 0, 0);
        // outboard
        rbox(b, 0.42, 0.5, 0.56, 0, 0.84, -hl - 0.22, 0x1c1d20, 0.12); rbox(b, 0.2, 0.9, 0.26, 0, 0.12, -hl - 0.2, 0x2a2c30, 0.06);
        b.add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 10), 0x8f9499, 0, -0.34, -hl - 0.36, Math.PI / 2, 0, 0);
        // bow rail and cleats
        for (const s of [-1, 1]) { tube(b, s * W * 0.72, 0.72, hl * 0.3, s * W * 0.4, 1.02, hl * 0.72, 0.018, CHROME, 6); tube(b, s * W * 0.4, 1.02, hl * 0.72, 0, 1.08, hl * 0.9, 0.018, CHROME, 6); tube(b, s * W * 0.4, 0.82, hl * 0.72, s * W * 0.4, 1.02, hl * 0.72, 0.014, CHROME, 5); rbox(b, 0.05, 0.05, 0.16, s * W * 0.86, 0.66, -hl + 0.3, CHROME, 0.02); }
      },
      glassParts(b) {
        const g = new THREE.CylinderGeometry(W * 0.84, W * 0.9, 0.42, 16, 1, true, -0.95, 1.9);
        b.add(g, 0xffffff, 0, 1.0, c1 - W * 0.78, -0.42, 0, 0);
      },
      stripe(b) { for (const s of [-1, 1]) rbox(b, 0.02, 0.09, T.len * 0.62, s * W * 0.992, 0.34, -T.len * 0.14, PAL.terracotta, 0.008); },
      head: [[0, 0.82, hl - 0.34, 0.2, 0.08, 0.16]],
      tail: [[W * 0.7, 0.5, -hl - 0.01, 0.14, 0.08, 0.06], [-W * 0.7, 0.5, -hl - 0.01, 0.14, 0.08, 0.06]],
      seat: [0.46, 0.92, -0.3],
    };
  },
  policeBoat(T) {
    const s = SHAPES.boat(T);
    const W = T.wid / 2, hl = T.len / 2;
    const base = s.trim;
    s.trim = (b) => {
      base(b);
      for (const k of [-1, 1]) { tube(b, k * W * 0.6, 0.66, -0.9, k * W * 0.5, 1.5, -0.8, 0.03, DARK, 6); rbox(b, 0.02, 0.16, T.len * 0.5, k * W * 0.994, 0.46, -T.len * 0.1, 0xe9e2d2, 0.008); }
      tube(b, -W * 0.5, 1.5, -0.8, W * 0.5, 1.5, -0.8, 0.03, DARK, 6);
      rbox(b, 0.7, 0.05, 0.3, 0, 1.54, -0.8, DARK, 0.02);
      void hl;
    };
    s.stripe = null;
    s.siren = [0, 1.62, -0.8, 0.66];
    return s;
  },
};

function shapeData(T) {
  if (cache.has(T.id)) return cache.get(T.id);
  const S = SHAPES[T.shape](T);
  const G = S.B.geos;
  const trim = new Batch();
  if (S.trim) S.trim(trim);
  if (S.stripe) S.stripe(trim);
  const glassB = new Batch();
  if (S.glassParts) S.glassParts(glassB);
  const glow = new Batch();
  if (S.glowParts) S.glowParts(glow);
  const big = T.wheelR > 0.44;
  const data = {
    paint: G.paint,
    glass: G.glass || null,
    glass2: glassB.empty ? null : glassB.merged(),
    alt: G.alt || null, altColor: S.altColor || [0x2a2c30, 0.6, 0.2],
    chrome: G.chrome || null, gloss: G.gloss || null,
    dark: G.dark || null, darkColor: S.darkColor || [0x101114, 0.7, 0.1],
    trim: trim.empty ? null : trim.merged(),
    glow: glow.empty ? null : glow.merged(),
    head: lightsGeo(S.head, true),
    tail: lightsGeo(S.tail, false),
    wheel: T.wheelR ? wheelGeo(T.wheelR, big ? 0.38 : 0.26, big) : null,
    wheelX: T.wid / 2 - (big ? 0.2 : 0.145),
    siren: S.siren || null,
    seat: S.seat || [0.4, 0.6, 0],
    headPos: S.head,
  };
  cache.set(T.id, data);
  return data;
}

export function buildVehicleMesh(T, paintHex) {
  const M = sharedMats();
  const D = shapeData(T);
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  // metallic base under a clear coat
  const paintMat = new THREE.MeshPhysicalMaterial({ color: paintHex, roughness: 0.42, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.07, vertexColors: true, envMapIntensity: 1.25 });
  const paint = new THREE.Mesh(D.paint, paintMat);
  paint.castShadow = true; paint.receiveShadow = true;
  body.add(paint);
  if (D.glass) body.add(new THREE.Mesh(D.glass, M.glass));
  if (D.glass2) body.add(new THREE.Mesh(D.glass2, M.glass));
  if (D.chrome) body.add(new THREE.Mesh(D.chrome, M.chrome));
  if (D.gloss) body.add(new THREE.Mesh(D.gloss, M.gloss));
  if (D.alt) { const a = new THREE.Mesh(D.alt, altMat(...D.altColor)); a.castShadow = true; body.add(a); }
  if (D.dark) body.add(new THREE.Mesh(D.dark, altMat(...D.darkColor)));
  if (D.trim) { const t = new THREE.Mesh(D.trim, M.trim); t.castShadow = true; body.add(t); }
  const glowHex = T.police ? 0xbfdcff : T.glow || (T.shape === 'van' ? 0xffe6c4 : null);
  let glow = null;
  if (D.glow && glowHex) { glow = new THREE.Mesh(D.glow, glowMat(glowHex)); body.add(glow); }
  const head = new THREE.Mesh(D.head, M.headOff);
  const tail = new THREE.Mesh(D.tail, M.tail);
  body.add(head, tail);

  const wheels = [];
  if (D.wheel) {
    const wx = D.wheelX, wz = T.wheelbase / 2;
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * wx, T.wheelR, sz * wz);
      const w = new THREE.Mesh(D.wheel, M.wheel);
      w.castShadow = true;
      pivot.add(w);
      group.add(pivot);
      wheels.push({ pivot, mesh: w, front: sz > 0 });
    }
  }
  // underglow for flashy rides
  let under = null;
  if (T.glow && T.cls === 'car') {
    under = new THREE.Mesh(new THREE.PlaneGeometry(T.wid * 1.5, T.len * 1.25), new THREE.MeshBasicMaterial({
      map: M.flareTex, color: T.glow, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending,
      polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8,
    }));
    under.rotation.x = -Math.PI / 2;
    under.position.y = 0.08;
    group.add(under);
  }
  let siren = null;
  if (D.siren) {
    const [sx, sy, sz, sw] = D.siren;
    const geo = new RoundedBoxGeometry(sw / 2, 0.15, 0.26, 2, 0.06);
    const L = new THREE.Mesh(geo, M.sirenOff), Rm = new THREE.Mesh(geo, M.sirenOff);
    L.position.set(sx + sw / 4, sy, sz); Rm.position.set(sx - sw / 4, sy, sz);
    const mk = (hex) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.flareTex, color: hex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9, fog: false }));
      s.scale.setScalar(7);
      s.visible = false;
      return s;
    };
    const fl = mk(PAL.policeRed), fr = mk(PAL.police);
    fl.position.copy(L.position); fr.position.copy(Rm.position);
    body.add(L, Rm, fl, fr);
    siren = { L, R: Rm, fl, fr };
  }
  return { group, body, paintMat, head, tail, wheels, siren, glow, under, seat: D.seat, headPos: D.headPos, baseColor: new THREE.Color(paintHex) };
}

export function vehicleMats() { return sharedMats(); }
