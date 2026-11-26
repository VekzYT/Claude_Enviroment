// Procedural vehicle models. Bodies are lofted: a ring of points is evaluated at stations along the
// length and skinned into one smooth surface, which is then split into paint, glass and a second
// colour by region. Wheels, lights and fittings are built from rounded primitives.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Batch, colorize } from '../world/geom.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PAL } from '../world/palette.js';
import { makeGlowTexture } from '../world/textures.js';
import { tintGeo, join, place, limbGeo, farLimbGeo, torsoGeo, hipsGeo, headGeo, hairGeo, handGeo, shoeGeo } from './bodyGeo.js';

const cache = new Map();
let shared = null;
let LOD = false;   // set while a distant proxy is being lofted

function sharedMats() {
  if (shared) return shared;
  shared = {
    trim: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0d151c, roughness: 0.03, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, side: THREE.DoubleSide }),
    // big flat side windows (bus, lorry cab) mirror the street too brightly at a glancing angle: tinted glass
    glassTint: new THREE.MeshPhysicalMaterial({ color: 0x091016, roughness: 0.04, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.65, side: THREE.DoubleSide }),
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
    rider: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.04 }),
    flareTex: makeGlowTexture(),
    glow: new Map(),
    alt: new Map(),
  };
  // Everything on a vehicle that is neither paint nor glass (chrome, gloss pillars, seams, cladding,
  // liveries, fittings) is one mesh. Each vertex brings its own colour and its own roughness,
  // metalness and clear coat in the aPbr attribute, so one material and one draw call cover it.
  const detail = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 });
  detail.onBeforeCompile = function (shader, renderer) {
    THREE.Material.prototype.onBeforeCompile.call(this, shader, renderer);
    shader.vertexShader = shader.vertexShader.replace('void main() {', 'attribute vec3 aPbr;\nvarying vec3 vPbr;\nvoid main() {\n  vPbr = aPbr;');
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', 'varying vec3 vPbr;\nvoid main() {')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  roughnessFactor = vPbr.x; metalnessFactor = vPbr.y;')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n  material.clearcoat *= vPbr.z;');
  };
  detail.customProgramCacheKey = () => 'vehicle-detail';
  shared.detail = detail;
  return shared;
}
// A copy of a geometry reduced to position / normal / colour plus the per-vertex PBR triple.
function detailPart(geo, color, rough, metal, coat) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
  if (color !== null || !g.getAttribute('color')) colorize(g, color ?? 0xffffff);
  const n = g.getAttribute('position').count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = rough; a[i * 3 + 1] = metal; a[i * 3 + 2] = coat; }
  g.setAttribute('aPbr', new THREE.BufferAttribute(a, 3));
  return g;
}
function bare(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  return g;
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
  const hl = (o.len ?? T.len) / 2, W = (o.bodyW ?? T.wid) / 2, R = T.wheelR, ax = T.wheelbase / 2;
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
  // a distant proxy (see proxyGeometry) keeps the outline and the glass, without seams and fine curvature
  const set = new Set();
  const add = (z) => { if (z >= -hl - 1e-6 && z <= hl + 1e-6) set.add(Math.round(Math.max(-hl, Math.min(hl, z)) * 500) / 500); };
  for (let z = -hl; z <= hl; z += LOD ? Math.max(0.45, o.step ?? 0) : o.step ?? 0.2) add(z);
  for (const e of LOD ? [0, 0.1] : [0, 0.025, 0.06, 0.1]) { add(-hl + e); add(hl - e); }
  for (const k of o.belt) add(k[0]);
  for (const k of cab) add(k[0]);
  for (const r of [o.ws, o.rear, o.roofGlass, ...(o.side || [])]) if (r) { add(r[0]); add(r[1]); }
  if (o.bed) for (const z of [o.bed[0], o.bed[0] + 0.03, o.bed[1], o.bed[1] - 0.03]) add(z);
  for (const z of o.breaks || []) add(z);
  if (o.side && o.side.length) { add(o.side[0][0] - 0.02); add(o.side[o.side.length - 1][1] + 0.02); }
  if (!LOD) for (const z of [...(o.seams || []), ...(o.seamsTop || [])]) { add(z - 0.007); add(z + 0.007); }
  const arcN = LOD ? 4 : 8;
  for (const za of axles) {
    for (let i = 0; i <= arcN; i++) add(za + Ra * Math.cos((i / arcN) * Math.PI));
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
  const geos = loft(zs, ringAt, classify, tint, LOD ? 1 : o.sub ?? 2);
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
      wheelAt: [0.3, 1.2, 0.34],
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
  taxi(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.2, tum: 0.74,
      belt: [[-2.4, 0.8], [-2.15, 0.95], [-1.0, 1.0], [1.0, 0.97], [1.95, 0.9], [2.4, 0.68]],
      cab: [[-1.74, 0], [-1.07, 0.45], [-0.2, 0.495], [0.42, 0.47], [1.24, 0]],
      width: [[-2.4, 0.84], [-2.05, 0.97], [0, 1.0], [1.75, 0.97], [2.2, 0.9], [2.4, 0.74]],
      ws: [0.42, 1.24], rear: [-1.74, -1.07], side: [[-1.02, -0.36], [-0.27, 0.38]],
      seams: [-1.1, -0.31, 0.64], seamsTop: [1.32, -1.82],
    });
    const top = B.info(-0.25).yt, sz = -0.25;
    return {
      B, glowHex: 0xffc560,
      // the roof sign holds the lit strips, so the distant proxy keeps it too
      bulk(b) {
        rbox(b, 0.98, 0.05, 0.4, 0, top + 0.02, sz, DARK, 0.02);
        rbox(b, 0.88, 0.26, 0.3, 0, top + 0.17, sz, 0x1d1e22, 0.06);
      },
      trim(b) {
        carFittings(b, B, { mirrorZ: 1.04, handles: [-0.62, 0.2] });
        // checker band along the doors, just under the waist
        for (let i = 0; i < 21; i++) {
          const z = -1.0 + i * 0.1, m = B.info(z);
          for (let r = 0; r < 2; r++) for (const s of [-1, 1]) b.cbox(0.012, 0.058, 0.1, s * (m.w * 1.004 + 0.006), m.yb - 0.1 - r * 0.058, z, (i + r) % 2 ? 0x16171a : 0xf4f1ea);
        }
      },
      glowParts(b) { for (const s of [-1, 1]) rbox(b, 0.74, 0.15, 0.02, 0, top + 0.18, sz + s * 0.152, 0xffffff, 0.01); },
      head: [[W * 0.62, 0.76, 2.29, 0.44, 0.13, 0.2], [-W * 0.62, 0.76, 2.29, 0.44, 0.13, 0.2]],
      tail: [[W * 0.64, 0.86, -2.32, 0.42, 0.11, 0.16], [-W * 0.64, 0.86, -2.32, 0.42, 0.11, 0.16]],
      seat: [0.42, 0.6, 0],
    };
  },
  roadster(T) {
    const W = T.wid / 2;
    const B = carBody(T, {
      gc: 0.16, tum: 0.72, rise: 0.06,
      belt: [[-2.15, 0.68], [-1.85, 0.8], [-1.2, 0.84], [-0.4, 0.8], [0.5, 0.78], [1.4, 0.76], [1.85, 0.66], [2.15, 0.45]],
      cab: [[0.24, 0], [0.28, 0.3], [0.34, 0.3], [0.92, 0]],
      width: [[-2.15, 0.86], [-1.8, 0.99], [-1.0, 1.0], [0.1, 0.95], [1.3, 0.99], [1.9, 0.92], [2.15, 0.76]],
      drop: [[-2.15, 0.02], [-1.3, 0.04], [0.92, 0.05], [1.4, 0.08], [2.15, 0.03]],
      ws: [0.24, 0.92], side: [[0.28, 0.9]], waist: false, bed: [-1.08, 0.22, 0.3],
      seams: [0.62], seamsTop: [1.0],
    });
    const TAN = 0xa9764f;
    const f = B.info(0.31);
    return {
      B,
      trim(b) {
        carFittings(b, B, { mirrorZ: 0.72, handles: [-0.2] });
        for (const s of [-1, 1]) {
          rbox(b, 0.46, 0.12, 0.5, s * 0.42, 0.56, -0.4, TAN, 0.05);                       // bucket seats
          rbox(b, 0.46, 0.56, 0.12, s * 0.42, 0.86, -0.72, TAN, 0.05, 0, -0.18);
          b.add(new THREE.TorusGeometry(0.19, 0.024, 6, 12, Math.PI), CHROME, s * 0.42, 0.86, -0.98);   // roll hoops
        }
        rbox(b, W * 1.6, 0.1, 0.26, 0, 0.8, 0.12, 0x1a1a1d, 0.04);                          // dash
        b.add(new THREE.TorusGeometry(0.16, 0.022, 6, 16), DARK, 0.42, 0.9, 0.0, -0.45, 0, 0);
        tube(b, -f.w * 0.62, f.yt - 0.01, 0.31, f.w * 0.62, f.yt - 0.01, 0.31, 0.022, CHROME, 6);   // screen frame
        rbox(b, W * 1.3, 0.035, 0.26, 0, 0.17, 2.04, DARK, 0.015);                          // lip
      },
      head: [[W * 0.6, 0.58, 2.06, 0.34, 0.12, 0.2], [-W * 0.6, 0.58, 2.06, 0.34, 0.12, 0.2]],
      tail: [[W * 0.66, 0.66, -2.1, 0.2, 0.09, 0.12], [W * 0.4, 0.68, -2.12, 0.2, 0.09, 0.12], [-W * 0.4, 0.68, -2.12, 0.2, 0.09, 0.12], [-W * 0.66, 0.66, -2.1, 0.2, 0.09, 0.12]],
      seat: [0.42, 0.42, -0.4],
      wheelAt: [0.42, 0.9, 0.0],
    };
  },
  moto(T) {
    const R = T.wheelR, az = T.wheelbase / 2;
    const B = carBody(T, {
      len: 1.6, gc: 0.44, bodyW: 0.36, arches: false, rise: 0.32, overhang: 0.5, step: 0.1, endScale: 0.6,
      belt: [[-0.8, 0.92], [-0.62, 0.9], [-0.42, 0.84], [-0.1, 0.83], [0.08, 0.9], [0.38, 0.99], [0.62, 0.96], [0.8, 0.86]],
      width: [[-0.8, 0.3], [-0.55, 0.62], [-0.25, 0.8], [0.0, 0.78], [0.3, 1.0], [0.6, 0.85], [0.8, 0.45]],
      alt: (z, seg) => seg >= 6 && z > -0.66 && z < 0.02, breaks: [-0.66, 0.02],
    });
    const METAL = 0x3a3d42, SPRING = 0xd9a441;
    return {
      B, altColor: [0x1b1b1e, 0.75, 0.05],
      trim(b) {
        rbox(b, 0.28, 0.3, 0.46, 0, 0.36, 0.08, METAL, 0.06);                               // engine
        for (let k = 0; k < 4; k++) rbox(b, 0.34, 0.022, 0.3, 0, 0.44 + k * 0.05, 0.14, 0x8c9095, 0.008);
        tube(b, -0.1, 0.3, 0.26, -0.15, 0.3, -0.18, 0.035, CHROME, 8);                       // exhaust
        tube(b, -0.15, 0.3, -0.18, -0.17, 0.44, -0.72, 0.065, CHROME, 10);
        ell(b, 0.1, 0.1, 0.06, -0.17, 0.45, -0.75, 0x101012, 8);
        for (const s of [-1, 1]) {
          tube(b, s * 0.075, R, az, s * 0.075, 1.0, az - 0.17, 0.028, CHROME, 8);            // fork
          tube(b, s * 0.1, 0.38, -0.02, s * 0.09, R, -az, 0.03, METAL, 8);                    // swingarm
          tube(b, s * 0.1, 0.42, -0.5, s * 0.1, 0.78, -0.3, 0.03, SPRING, 8);                 // rear shock
          rbox(b, 0.14, 0.03, 0.05, s * 0.2, 0.36, -0.12, DARK, 0.01);                        // foot pegs
          ell(b, 0.13, 0.055, 0.055, s * 0.33, 1.07, az - 0.24, PLASTIC, 8);                  // grips
          tube(b, s * 0.22, 1.07, az - 0.24, s * 0.28, 1.26, az - 0.26, 0.012, DARK, 5);      // mirrors
          ell(b, 0.1, 0.06, 0.03, s * 0.29, 1.28, az - 0.26, DARK, 8);
        }
        rbox(b, 0.22, 0.05, 0.1, 0, 1.0, az - 0.16, DARK, 0.02);                              // yoke
        tube(b, -0.33, 1.07, az - 0.24, 0.33, 1.07, az - 0.24, 0.016, DARK, 6);               // bars
        tube(b, 0, 1.0, az - 0.16, 0, 1.07, az - 0.22, 0.02, DARK, 6);
        ell(b, 0.2, 0.2, 0.16, 0, 0.92, az, DARK, 12);                                        // headlight bucket
        b.add(new THREE.TorusGeometry(R + 0.05, 0.035, 4, 12, Math.PI * 0.75), DARK, 0, R, az, 0, -Math.PI / 2, -0.35);   // mudguards
        b.add(new THREE.TorusGeometry(R + 0.05, 0.035, 4, 12, Math.PI * 0.6), DARK, 0, R, -az, 0, Math.PI / 2, 0.2);
        rbox(b, 0.16, 0.11, 0.02, 0, 0.72, -0.97, 0xe9e6dc, 0.01);                            // plate
        tube(b, 0.12, 0.3, -0.08, 0.26, 0.02, -0.14, 0.014, DARK, 5);                         // kickstand
      },
      glassParts(b) { b.add(new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI, 0.2, 1.0), 0xffffff, 0, 1.0, az - 0.05, -0.6, 0, 0, 0.9, 1.1, 0.8); },
      head: [[0, 0.92, az + 0.07, 0.15, 0.13, 0.1]],
      tail: [[0, 0.86, -0.81, 0.13, 0.06, 0.08]],
      seat: [0, 0.76, -0.3],
      bars: [0.33, 1.07, az - 0.24],
    };
  },
  boxtruck(T) {
    const W = T.wid / 2, hl = T.len / 2;
    const B = carBody(T, {
      gc: 0.46, tum: 0.9, winBase: 0.12, rise: 0.12, endScale: 0.92, archGap: 0.09, step: 0.3,
      belt: [[-hl, 1.02], [1.3, 1.02], [1.62, 1.42], [3.15, 1.42], [hl, 1.12]],
      cab: [[1.6, 0], [1.66, 1.02], [2.55, 1.08], [3.25, 0]],
      width: [[-hl, 0.96], [-3.5, 1.0], [3.1, 1.0], [3.5, 0.96], [hl, 0.88]],
      ws: [2.55, 3.25], rear: [1.6, 1.66], side: [[1.8, 2.5]], breaks: [1.6, 1.66],
    });
    const BOX = 0xeeeae0, roof = B.info(2.1).yt;
    return {
      B, wheelW: 0.3, tint: true,
      bulk(b) {
        rbox(b, 2.44, 2.26, 5.2, 0, 2.17, -1.1, BOX, 0.06);                                  // cargo box
        rbox(b, 1.9, 0.34, 0.9, 0, roof + 0.14, 2.05, 0x3a3c40, 0.1, 0, -0.2);               // roof deflector
        for (const s of [-1, 1]) {
          rbox(b, 0.02, 0.4, 4.4, s * 1.226, 2.06, -1.2, PAL.terracottaLight, 0.008);        // livery
          rbox(b, 0.02, 0.08, 4.4, s * 1.226, 1.76, -1.2, 0x2f7f86, 0.008);
        }
      },
      trim(b) {
        carFittings(b, B, { mirrorZ: 2.7, handles: [2.0], handleColor: DARK, exhaust: false });
        rbox(b, W * 2.04, 0.3, 0.22, 0, 0.62, hl - 0.04, 0x1c1c20, 0.07); rbox(b, W * 2.04, 0.26, 0.22, 0, 0.62, -hl + 0.04, 0x1c1c20, 0.07);
        for (const s of [-1, 1]) {
          rbox(b, 0.08, 0.16, 5.1, s * 1.18, 0.98, -1.1, 0x2a2c30, 0.02);                    // box rails
          tube(b, s * (W - 0.05), 1.3, 2.6, s * (W + 0.18), 1.6, 2.75, 0.02, DARK, 5);       // mirror arms
        }
        for (let k = 0; k < 9; k++) rbox(b, 2.2, 0.024, 0.02, 0, 1.3 + k * 0.22, -hl - 0.015, 0xcfcabf, 0.006);   // roller door
        rbox(b, 0.3, 0.06, 0.06, 0, 1.12, -hl - 0.04, CHROME, 0.02);
        tube(b, 0.9, 0.45, -1.2, 0.9, 0.45, 0.6, 0.06, CHROME, 8);                            // tank
      },
      head: [[W * 0.7, 1.0, hl - 0.02, 0.34, 0.18, 0.2], [-W * 0.7, 1.0, hl - 0.02, 0.34, 0.18, 0.2]],
      tail: [[W * 0.8, 0.62, -hl - 0.08, 0.24, 0.12, 0.1], [-W * 0.8, 0.62, -hl - 0.08, 0.24, 0.12, 0.1], [W * 0.92, 3.16, -hl - 0.02, 0.1, 0.06, 0.06], [-W * 0.92, 3.16, -hl - 0.02, 0.1, 0.06, 0.06]],
      seat: [0.5, 1.3, 2.3],
    };
  },
  bus(T) {
    const W = T.wid / 2, hl = T.len / 2;
    const side = [];
    for (let z = -5.15; z < 4.9; z += 1.3) side.push([z, Math.min(z + 1.18, 5.25)]);
    const B = carBody(T, {
      gc: 0.32, tum: 0.92, winBase: 0.06, rise: 0.08, endScale: 0.96, archGap: 0.08, step: 0.35, sub: 1,
      belt: [[-hl, 1.22], [4.9, 1.22], [5.45, 1.02], [hl, 0.92]],
      cab: [[-hl + 0.01, 0], [-hl + 0.1, 1.66], [4.9, 1.66], [5.45, 1.86], [hl - 0.06, 1.7], [hl, 0]],
      width: [[-hl, 0.97], [-hl + 0.25, 1.0], [hl - 0.3, 1.0], [hl, 0.96]],
      ws: [5.2, hl], side,
      alt: (z, seg) => seg >= 8 && z < 5.15 && z > -hl + 0.15, breaks: [5.15, -hl + 0.15],
    });
    const roof = B.info(0).yt, DOOR = 0x1a2026;
    const doors = [[4.35, 5.2], [0.2, 1.5]];
    return {
      B, altColor: [0xf0ece2, 0.5, 0.05], glowHex: 0xffb648, wheelW: 0.32, tint: true,
      bulk(b) {
        rbox(b, 1.6, 0.3, 2.8, 0, roof + 0.13, -1.2, 0xdcd8ce, 0.08);                        // roof units
        rbox(b, 1.3, 0.22, 1.3, 0, roof + 0.09, 2.8, 0xdcd8ce, 0.08);
      },
      trim(b) {
        carFittings(b, B, { exhaust: false });
        rbox(b, W * 2.02, 0.34, 0.24, 0, 0.52, hl - 0.06, 0x1c1c20, 0.08); rbox(b, W * 2.02, 0.34, 0.24, 0, 0.52, -hl + 0.06, 0x1c1c20, 0.08);
        for (const s of [-1, 1]) {
          rbox(b, 0.012, 0.07, 10.4, s * (W * 1.0 + 0.008), 1.06, -0.2, 0xf2efe6, 0.004);    // waist stripe
          tube(b, s * (W - 0.05), 2.5, hl - 0.25, s * (W + 0.2), 2.4, hl + 0.2, 0.025, DARK, 5);   // mirror arms
          ell(b, 0.1, 0.36, 0.06, s * (W + 0.22), 2.16, hl + 0.22, DARK, 8);
        }
        // doors on the kerb side (-x): smoked glass leaves with bright edges
        for (const [z0, z1] of doors) {
          const zc = (z0 + z1) / 2, w = z1 - z0;
          rbox(b, 0.03, 0.86, w, -(W * 1.012 + 0.012), 0.78, zc, DOOR, 0.01);
          rbox(b, 0.03, 1.3, w, -(W * 0.92 + 0.015), 1.92, zc, DOOR, 0.01);
          for (const z of [z0, zc, z1]) { rbox(b, 0.035, 0.9, 0.035, -(W * 1.012 + 0.02), 0.78, z, CHROME, 0.01); rbox(b, 0.035, 1.3, 0.035, -(W * 0.92 + 0.022), 1.92, z, CHROME, 0.01); }
        }
        rbox(b, 0.5, 0.14, 0.02, 0, 0.52, -hl - 0.005, 0xe9e6dc, 0.008);
      },
      glassParts(b) { rbox(b, 2.0, 0.85, 0.03, 0, 2.25, -hl - 0.012, 0xffffff, 0.04); },
      glowParts(b) { rbox(b, W * 1.4, 0.22, 0.03, 0, 2.5, hl - 0.025, 0xffffff, 0.01); rbox(b, 0.03, 0.18, 1.2, -(W * 0.92 + 0.02), 2.62, 3.6, 0xffffff, 0.01); },
      head: [[W * 0.72, 0.74, hl - 0.02, 0.36, 0.14, 0.14], [-W * 0.72, 0.74, hl - 0.02, 0.36, 0.14, 0.14]],
      tail: [[W * 0.88, 1.0, -hl - 0.01, 0.16, 0.6, 0.08], [-W * 0.88, 1.0, -hl - 0.01, 0.16, 0.6, 0.08]],
      seat: [0.7, 1.3, 4.9],
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
      bars: [0.4, 1.06, 0.5],
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
      wheelAt: [0.46, 0.94, c1 - 0.38],
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

// Wheel centres in the vehicle's frame: four corners, or one track for a two-wheeler.
function wheelSpots(T, wx) {
  const z = T.wheelbase / 2;
  return T.bike ? [[0, z], [0, -z]] : [[wx, z], [-wx, z], [wx, -z], [-wx, -z]];
}

function shapeData(T) {
  if (cache.has(T.id)) return cache.get(T.id);
  const S = SHAPES[T.shape](T);
  const G = S.B.geos;
  const trim = new Batch();
  if (S.bulk) S.bulk(trim);
  if (S.trim) S.trim(trim);
  if (S.stripe) S.stripe(trim);
  const glassB = new Batch();
  if (S.glassParts) S.glassParts(glassB);
  const glow = new Batch();
  if (S.glowParts) S.glowParts(glow);
  const big = T.wheelR > 0.44;
  // gather the non-paint, non-glass parts into the single detail mesh
  const parts = [];
  // chrome used to reflect 1.4x through its own material; the brighter base colour keeps that
  if (G.chrome) parts.push(detailPart(G.chrome, new THREE.Color(0xd4d8dc).multiplyScalar(1.4), 0.16, 1, 0));
  if (G.gloss) parts.push(detailPart(G.gloss, 0x08090b, 0.2, 0.2, 1));
  const alt = S.altColor || [0x2a2c30, 0.6, 0.2], dark = S.darkColor || [0x101114, 0.7, 0.1];
  if (G.alt) parts.push(detailPart(G.alt, alt[0], alt[1], alt[2], alt[1] < 0.5 ? 0.8 : 0));
  if (G.dark) parts.push(detailPart(G.dark, dark[0], dark[1], dark[2], dark[1] < 0.5 ? 0.8 : 0));
  if (!trim.empty) parts.push(detailPart(trim.merged(), null, 0.55, 0.25, 0));
  const glassParts = [];
  if (G.glass) glassParts.push(bare(G.glass));
  if (!glassB.empty) glassParts.push(bare(glassB.merged()));
  // knobbly tyres for the big off-roaders; buses and lorries name their own road tyres
  const wheel = T.wheelR ? wheelGeo(T.wheelR, S.wheelW ?? (big ? 0.38 : T.bike ? 0.16 : 0.26), big && !S.wheelW) : null;
  const wheelX = T.wid / 2 - (big ? 0.2 : 0.145);
  // the wheels of a parked vehicle as one mesh
  let wheels4 = null;
  if (wheel) {
    const all = wheelSpots(T, wheelX).map(([x, z]) => { const g = wheel.clone(); g.translate(x, T.wheelR, z); return g; });
    wheels4 = mergeGeometries(all, false);
  }
  const data = {
    paint: G.paint,
    glass: glassParts.length ? (glassParts.length > 1 ? mergeGeometries(glassParts, false) : glassParts[0]) : null,
    tint: !!S.tint,
    detail: parts.length ? (parts.length > 1 ? mergeGeometries(parts, false) : parts[0]) : null,
    wheels4,
    glow: glow.empty ? null : glow.merged(),
    glowHex: S.glowHex || null,
    head: lightsGeo(S.head, true),
    tail: lightsGeo(S.tail, false),
    wheel, wheelX,
    siren: S.siren || null,
    seat: S.seat || [0.4, 0.6, 0],
    headPos: S.head,
    riders: T.open && (S.bars || S.wheelAt) ? riderLooks(T).map((C) => riderGeo(S, C, false)) : null,
  };
  cache.set(T.id, data);
  return data;
}

// ---- riders --------------------------------------------------------------------------------------
// Whoever drives an open vehicle, other than the player (whose own model takes the seat), is a
// figure baked into one mesh: astride for bikes (S.bars: right grip), seated for cars and boats
// (S.wheelAt: steering wheel centre). Each vehicle picks one look (m.riderIdx) and keeps it in every tier.
const RIDERS = [
  { top: 0xd97757, legs: 0x2a3340, skin: 0xc68863, lid: 0xf2f3f4, hair: 0x2a1d16 },
  { top: 0x2f7f86, legs: 0x1f2226, skin: 0xe0ac8a, lid: 0x1b1b1f, hair: 0x6b4a2e },
  { top: 0xe3b54f, legs: 0x3a3d45, skin: 0x9a6645, lid: 0xd97757, hair: 0x101012 },
];
// officers in uniform, for the police boat
const POLICE_RIDERS = [
  { top: 0x243246, legs: 0x1a1f28, skin: 0xc68863, lid: 0x243246, hair: 0x2a1d16 },
  { top: 0x243246, legs: 0x1a1f28, skin: 0x9a6645, lid: 0x243246, hair: 0x101012 },
];
const riderLooks = (T) => (T.police ? POLICE_RIDERS : RIDERS);
const _dn = new THREE.Vector3(0, -1, 0), _col = new THREE.Color();
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function limbFrom(a, b, r0, r1, hex, far) {
  _v.subVectors(b, a);
  const len = _v.length();
  const g = far ? farLimbGeo(len, r0, r1) : limbGeo(len, r0, r1, 8);
  g.applyQuaternion(_q.setFromUnitVectors(_dn, _v.normalize()));
  g.translate(a.x, a.y, a.z);
  return tintGeo(g, hex);
}
// headGeo leaves the skin white so it can be tinted here
function skinned(g, hex) {
  const c = g.getAttribute('color');
  _col.set(hex);
  for (let i = 0; i < c.count; i++) if (c.getX(i) > 0.99 && c.getY(i) > 0.99 && c.getZ(i) > 0.99) c.setXYZ(i, _col.r, _col.g, _col.b);
  return g;
}
function riderGeo(S, C, far) {
  const bike = !!S.bars, seg = far ? 6 : 12;
  const [sx, sy, sz] = S.seat;
  const lean = bike ? 0.45 : -0.1, cl = Math.cos(lean), sl = Math.sin(lean);
  const waist = V3(sx, sy + (bike ? 0.26 : 0.24), sz);
  const up = (x, y, z) => V3(waist.x + x, waist.y + y * cl - z * sl, waist.z + y * sl + z * cl);
  const parts = [];
  parts.push(place(tintGeo(torsoGeo(0.5, 1, seg + 2), C.top), waist.x, waist.y, waist.z, lean));
  parts.push(place(tintGeo(hipsGeo(1, seg), C.legs), waist.x, waist.y, waist.z));
  const head = up(0, 0.67, 0.03);
  parts.push(place(skinned(headGeo(0.115, far), C.skin), head.x, head.y, head.z, 0.1));
  if (bike) {
    parts.push(tintGeo(place(new THREE.SphereGeometry(0.15, seg + 2, seg), head.x, head.y + 0.02, head.z - 0.01, 0, 0, 0, 1, 1.02, 1.1), C.lid));
    parts.push(tintGeo(place(new THREE.SphereGeometry(0.153, 10, 4, Math.PI / 2 - 0.85, 1.7, 1.2, 0.42), head.x, head.y + 0.02, head.z - 0.01, 0, 0, 0, 1, 1.02, 1.1), 0x11161b));
  } else parts.push(place(tintGeo(hairGeo(0, 0.115, far), C.hair), head.x, head.y, head.z, 0.1));
  const grip = bike ? S.bars : S.wheelAt;
  for (const s of [-1, 1]) {
    const sh = up(s * 0.19, 0.43, 0);
    const hand = bike ? V3(s * grip[0], grip[1], grip[2]) : V3(grip[0] + s * 0.15, grip[1], grip[2]);
    const el = V3((sh.x + hand.x) / 2 + s * 0.07, (sh.y + hand.y) / 2 - 0.1, (sh.z + hand.z) / 2 - 0.03);
    parts.push(limbFrom(sh, el, 0.058, 0.047, C.top, far), limbFrom(el, hand, 0.047, 0.037, C.top, far));
    parts.push(place(tintGeo(handGeo(0.042, far), C.skin), hand.x, hand.y, hand.z));
    const hip = V3(sx + s * 0.1, waist.y - 0.16, sz + 0.04);
    const knee = bike ? V3(s * 0.21, sy + 0.06, sz + 0.42) : V3(sx + s * 0.12, sy + 0.26, sz + 0.5);
    const foot = bike ? V3(s * 0.2, 0.44, sz + 0.18) : V3(sx + s * 0.12, sy - 0.08, sz + 0.86);
    parts.push(limbFrom(hip, knee, 0.078, 0.056, C.legs, far), limbFrom(knee, foot, 0.056, 0.042, C.legs, far));
    parts.push(place(shoeGeo(0.25, 0.095, 0x17181c, far), foot.x, foot.y, foot.z));
  }
  return join(parts);
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
  if (D.glass) body.add(new THREE.Mesh(D.glass, D.tint ? M.glassTint : M.glass));
  if (D.detail) { const t = new THREE.Mesh(D.detail, M.detail); t.castShadow = true; body.add(t); }
  const glowHex = T.police ? 0xbfdcff : D.glowHex || T.glow || (T.shape === 'van' ? 0xffe6c4 : null);
  let glow = null;
  if (D.glow && glowHex) { glow = new THREE.Mesh(D.glow, glowMat(glowHex)); body.add(glow); }
  const head = new THREE.Mesh(D.head, M.headOff);
  const tail = new THREE.Mesh(D.tail, M.tail);
  body.add(head, tail);
  // shown by vehicleLod.js while someone other than the player drives
  let rider = null, riderIdx = -1;
  if (D.riders) {
    riderIdx = Math.floor(Math.random() * D.riders.length);
    rider = new THREE.Mesh(D.riders[riderIdx], M.rider);
    rider.castShadow = true; rider.visible = false;
    body.add(rider);
  }

  const wheels = [];
  if (D.wheel) {
    for (const [x, z] of wheelSpots(T, D.wheelX)) {
      const pivot = new THREE.Group();
      pivot.position.set(x, T.wheelR, z);
      const w = new THREE.Mesh(D.wheel, M.wheel);
      w.castShadow = true;
      pivot.add(w);
      group.add(pivot);
      wheels.push({ pivot, mesh: w, front: z > 0 });
    }
  }
  // stand-in for all the wheels while the vehicle is parked (see Vehicle.restWheels)
  let wheelRest = null;
  if (D.wheels4) { wheelRest = new THREE.Mesh(D.wheels4, M.wheel); wheelRest.castShadow = true; wheelRest.visible = false; group.add(wheelRest); }
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
  return { group, body, paintMat, head, tail, wheels, wheelRest, siren, glow, under, rider, riderIdx, seat: D.seat, headPos: D.headPos, baseColor: new THREE.Color(paintHex) };
}

export function vehicleMats() { return sharedMats(); }
export function wheelGeometry(T) { return shapeData(T).wheel; }
// how many rider looks an open vehicle chooses from (0: it never shows a rider)
export function riderCount(T) { const r = shapeData(T).riders; return r ? r.length : 0; }

// ---- instanced models for vehicleLod.js ------------------------------------------------------------
// Each is one merged mesh per type, drawn once for every vehicle of that type in its tier.
// aProxy per vertex = (roughness, metalness, paint, lamp): paint 1 takes the instance colour,
// lamp 1 = headlight, 2 = tail light, 3 = always lit, 4 = tinted glass (dimmer reflections).
function proxyPart(geo, color, rough, metal, paint, lamp) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
  if (color !== null || !g.getAttribute('color')) colorize(g, color ?? 0xffffff);
  const n = g.getAttribute('position').count, a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { a[i * 4] = rough; a[i * 4 + 1] = metal; a[i * 4 + 2] = paint; a[i * 4 + 3] = lamp; }
  g.setAttribute('aProxy', new THREE.BufferAttribute(a, 4));
  return g;
}
// The full model (parked, or 40-88 m away): the same paint, glass, trim and lamps, on wheels that
// no longer need to turn and are built lighter. rider: the index of a rider look to seat, or -1.
export function restGeometry(T, rider = -1) {
  const D = shapeData(T), parts = [];
  const P = (geo, color, rough, metal, paint = 0, lamp = 0) => { const g = proxyPart(geo, color, rough, metal, paint, lamp); parts.push(g); return g; };
  P(D.paint, null, 0.42, 0.5, 1);
  if (D.glass) P(D.glass, D.tint ? 0x091016 : 0x0d151c, 0.03, 0, 0, D.tint ? 4 : 0);
  if (D.detail) {
    // keep the trim's own roughness and metalness
    const g = P(D.detail, null, 0, 0), a = g.getAttribute('aProxy').array, pbr = D.detail.getAttribute('aPbr').array;
    for (let i = 0, n = a.length / 4; i < n; i++) { a[i * 4] = pbr[i * 3]; a[i * 4 + 1] = pbr[i * 3 + 1]; }
  }
  const glowHex = T.police ? 0xbfdcff : D.glowHex || T.glow || (T.shape === 'van' ? 0xffe6c4 : null);
  if (D.glow && glowHex) P(D.glow, glowHex, 1, 0, 0, 3);
  P(D.head, 0xdfe6ea, 0.08, 0.6, 0, 1);
  P(D.tail, 0xb01218, 0.2, 0, 0, 2);
  if (D.wheel) {
    const b = new Batch(), R = T.wheelR, w = T.bike ? 0.16 : T.wheelR > 0.44 ? 0.34 : 0.26;
    for (const [x, z] of wheelSpots(T, D.wheelX)) {
      b.add(new THREE.CylinderGeometry(R, R, w, 16), 0x111214, x, R, z, 0, 0, Math.PI / 2);
      b.add(new THREE.CylinderGeometry(R * 0.62, R * 0.62, w + 0.012, 12), 0x9ea3a8, x, R, z, 0, 0, Math.PI / 2);
      b.add(new THREE.CylinderGeometry(R * 0.2, R * 0.2, w + 0.03, 8), CHROME, x, R, z, 0, 0, Math.PI / 2);
    }
    P(b.merged(), null, 0.5, 0.4);
  }
  if (rider >= 0 && D.riders) P(D.riders[rider], null, 0.72, 0.04);
  return finish(T, D, parts);
}
// Parts every instanced model shares: the dark lightbar of a police car, and a hover-bike's body
// riding low on its cushion as it does on the full model.
function finish(T, D, parts) {
  if (D.siren) {
    const [sx, sy, sz, sw] = D.siren, b = new Batch();
    for (const k of [-1, 1]) b.add(new THREE.BoxGeometry(sw / 2, 0.15, 0.26), 0x2a3340, sx + k * sw / 4, sy, sz);
    parts.push(proxyPart(b.merged(), null, 0.1, 0.3, 0, 0));
  }
  const geo = mergeGeometries(parts, false);
  if (T.cls === 'hover') geo.translate(0, -T.hover * 0.55, 0);
  geo.computeBoundingSphere();
  return geo;
}
// The distant stand-in: a coarser loft of the same body, its glass and trim colours, the big fittings
// (S.bulk), plain wheels and lamp lenses, plus a rider when asked.
export function proxyGeometry(T, rider = -1) {
  const D = shapeData(T);
  let S;
  LOD = true;
  try { S = SHAPES[T.shape](T); } finally { LOD = false; }
  const G = S.B.geos, parts = [];
  const P = (geo, color, rough, metal, paint = 0, lamp = 0) => parts.push(proxyPart(geo, color, rough, metal, paint, lamp));
  P(G.paint, null, 0.4, 0.45, 1);
  if (G.glass) P(G.glass, D.tint ? 0x091016 : 0x0d151c, 0.06, 0.2, 0, D.tint ? 4 : 0);
  if (G.chrome) P(G.chrome, 0xd4d8dc, 0.2, 1);
  if (G.gloss) P(G.gloss, 0x08090b, 0.2, 0.2);
  const alt = S.altColor || [0x2a2c30, 0.6, 0.2], dark = S.darkColor || [0x101114, 0.7, 0.1];
  if (G.alt) P(G.alt, alt[0], alt[1], alt[2]);
  if (G.dark) P(G.dark, dark[0], dark[1], dark[2]);
  if (S.bulk) { const b = new Batch(); S.bulk(b); P(b.merged(), null, 0.55, 0.25); }
  const glowHex = T.police ? 0xbfdcff : D.glowHex || T.glow || (T.shape === 'van' ? 0xffe6c4 : null);
  if (D.glow && glowHex) P(D.glow, glowHex, 1, 0, 0, 3);
  if (T.wheelR) {
    const b = new Batch(), w = T.bike ? 0.16 : 0.26;
    for (const [x, z] of wheelSpots(T, D.wheelX)) {
      b.add(new THREE.CylinderGeometry(T.wheelR, T.wheelR, w, 10), 0x111214, x, T.wheelR, z, 0, 0, Math.PI / 2);
      b.add(new THREE.CylinderGeometry(T.wheelR * 0.6, T.wheelR * 0.6, w + 0.02, 8), 0x8a8e93, x, T.wheelR, z, 0, 0, Math.PI / 2);
    }
    P(b.merged(), null, 0.6, 0.3);
  }
  const lamps = (list, hex, lamp) => {
    const b = new Batch();
    for (const [x, y, z, w, h, d = 0.16] of list) b.add(new THREE.SphereGeometry(0.5, 6, 4), hex, x, y, z, 0, 0, 0, w, h, d);
    P(b.merged(), null, 0.1, 0.5, 0, lamp);
  };
  lamps(S.head, 0xdfe6ea, 1);
  lamps(S.tail, 0xb01218, 2);
  if (rider >= 0 && D.riders) P(riderGeo(S, riderLooks(T)[rider], true), null, 0.7, 0.04);
  return finish(T, D, parts);
}
