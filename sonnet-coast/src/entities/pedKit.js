// Body-part kit for the instanced crowd. Each body part is ONE geometry that holds every variant of
// that part (hair styles, hats, sleeves, bags, shoes...). Per instance, a bit mask picks which
// variants show (hidden ones collapse to a point in the vertex shader) and four colours paint them,
// so a crowd of very different people still costs one draw call per body part.
//
// Vertex attributes:  aPart = (colour slot 0-3 or 4 = fixed vertex colour, bit or -1 = always,
//                     roughness); aMorph = offset to the female shape (torso, pelvis); aHair =
//                     (cover 0..2, azimuth, noise) for the shader-shaped hair shell (-1 = not hair).
// Instance data:      iColA..iColD, iBits = (mask, morph weight or hair part), iHair = (volume,
//                     length, fringe, curl) on the head.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ellipseLoft, limbGeo, place } from './bodyGeo.js';

export const A = 0, B = 1, C = 2, D = 3, FIXED = 4;
export const HR = 0.108; // head radius

// ---- bits, per part -----------------------------------------------------------------------
export const HEAD = { HAIR: 0, BUN: 1, PONY: 2, CAP: 3, CAPBACK: 4, BEANIE: 5, BUCKET: 6, SUNHAT: 7, COPCAP: 8, GLASSES: 9, PHONES: 10, BEARD: 11, STACHE: 12, EARRING: 13, BRAIDS: 14 };
export const TORSO = { CREW: 0, HOOD: 1, POCKET: 2, STRINGS: 3, STRIPE: 4, PRINT: 5, TANK: 6, OPEN: 7, COLLAR: 8, RIB: 9, ZIP: 10, VNECK: 11, LAPELS: 12, STRAPS: 13, POCKETS: 14, BADGE: 15, PACK: 16, CROSS: 17, BUTTONS: 18 };
export const PELVIS = { BELT: 0, SKIRT: 1, HEM: 2, COAT: 3, TOWEL: 4, DUTY: 5 };
export const UARM = { SLEEVE: 0 };
export const FARM = { CUFF: 0, PHONE: 1, TOTE: 2, WATCH: 3 };
export const THIGH = { SHORTS: 0 };
export const SHIN = { CUFF: 0, SOCK: 1, BOOT: 2 };
export const FOOT = { SNEAKER: 0, BOOT: 1, SANDAL: 2, DRESS: 3 };

const _c = new THREE.Color();
// Give a geometry the kit attributes. hex tints the slot colour (or is the colour, for FIXED).
export function tag(g, slot, bit = -1, rough = 0.8, hex = 0xffffff) {
  if (!g.index) {
    const n = g.getAttribute('position').count, idx = [];
    for (let i = 0; i < n; i++) idx.push(i);
    g.setIndex(idx);
  }
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'aMorph' && k !== 'aHair') g.deleteAttribute(k);
  const n = g.getAttribute('position').count;
  const col = new Float32Array(n * 3), part = new Float32Array(n * 3);
  _c.set(hex);
  for (let i = 0; i < n; i++) {
    col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
    part[i * 3] = slot; part[i * 3 + 1] = bit; part[i * 3 + 2] = rough;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aPart', new THREE.BufferAttribute(part, 3));
  if (!g.getAttribute('aMorph')) g.setAttribute('aMorph', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  if (!g.getAttribute('aHair')) { const h = new Float32Array(n * 3); for (let i = 0; i < n; i++) h[i * 3] = -1; g.setAttribute('aHair', new THREE.BufferAttribute(h, 3)); }
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  return g;
}
const kit = (parts) => mergeGeometries(parts, false);
const sph = (r, w, h, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => place(new THREE.SphereGeometry(r, w, h), x, y, z, rx, ry, rz, sx, sy, sz);

// ---- lofts with a second (female) shape, and cloth patches that lie over them ----------------
function secAt(secs, y) {
  if (y <= secs[0][0]) return secs[0];
  for (let i = 1; i < secs.length; i++) {
    const s1 = secs[i];
    if (y <= s1[0]) {
      const s0 = secs[i - 1], t = (y - s0[0]) / (s1[0] - s0[0] || 1);
      return [y, s0[1] + (s1[1] - s0[1]) * t, s0[2] + (s1[2] - s0[2]) * t, (s0[3] || 0) + ((s1[3] || 0) - (s0[3] || 0)) * t];
    }
  }
  return secs[secs.length - 1];
}
function ring(s, a, p, grow, out) {
  const c = Math.cos(a), sn = Math.sin(a);
  out.x = (s[1] + grow) * Math.sign(c) * Math.abs(c) ** p;
  out.z = (s[3] || 0) + (s[2] + grow) * Math.sign(sn) * Math.abs(sn) ** p;
  return out;
}
const _P = { x: 0, z: 0 }, _Q = { x: 0, z: 0 };
// Rows at heights ys, columns from a0(y) to a1(y) (angle 0 = +x, PI/2 = front). Open surface.
function patch(secsM, secsF, ys, range, cols, p = 0.86, grow = 0.004) {
  const pos = [], mor = [], idx = [];
  for (const y of ys) {
    const [a0, a1] = range(y);
    const m = secAt(secsM, y), f = secAt(secsF || secsM, y);
    for (let k = 0; k <= cols; k++) {
      const a = a0 + ((a1 - a0) * k) / cols;
      ring(m, a, p, grow, _P); ring(f, a, p, grow, _Q);
      pos.push(_P.x, y, _P.z); mor.push(_Q.x - _P.x, 0, _Q.z - _P.z);
    }
  }
  for (let i = 0; i < ys.length - 1; i++) for (let k = 0; k < cols; k++) {
    const a = i * (cols + 1) + k, b = a + 1, c = a + cols + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aMorph', new THREE.Float32BufferAttribute(mor, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// A closed loft (capped both ends) between two shapes of the same topology.
function loft2(secsM, secsF, seg, p = 0.86, caps = true) {
  const ys = secsM.map((s) => s[0]);
  const g = patch(secsM, secsF, ys, () => [0, Math.PI * 2], seg, p, 0);
  // weld the seam and close the ends
  const pos = g.getAttribute('position'), mor = g.getAttribute('aMorph');
  const P = Array.from(pos.array), M = Array.from(mor.array), idx = Array.from(g.index.array);
  const n = ys.length, w = seg + 1;
  for (const [ri, flip] of caps ? [[0, true], [n - 1, false]] : []) {
    const s = secsM[ri], f = (secsF || secsM)[ri];
    const ci = P.length / 3;
    P.push(0, s[0], s[3] || 0); M.push(0, 0, (f[3] || 0) - (s[3] || 0));
    for (let k = 0; k < seg; k++) {
      const a = ri * w + k, b = a + 1;
      if (flip) idx.push(ci, a, b); else idx.push(ci, b, a);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  out.setAttribute('aMorph', new THREE.Float32BufferAttribute(M, 3));
  out.setIndex(idx);
  out.computeVertexNormals();
  weldNormals(out);
  return out;
}
// Average the normals of vertices that share a position, so seams and split lofts shade smoothly.
function weldNormals(g) {
  const pos = g.getAttribute('position'), nor = g.getAttribute('normal');
  const map = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
    let e = map.get(k);
    if (!e) { e = []; map.set(k, e); }
    e.push(i);
  }
  const v = new THREE.Vector3();
  for (const list of map.values()) {
    if (list.length < 2) continue;
    v.set(0, 0, 0);
    for (const i of list) v.x += nor.getX(i), v.y += nor.getY(i), v.z += nor.getZ(i);
    v.normalize();
    for (const i of list) nor.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}
// Revolve a profile [[r, y], ...] around y.
const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// Sections of a tapered limb hanging from the origin (ascending y), matching limbGeo's shape.
function limbSecs(len, r0, r1, flat = 0.92) {
  const secs = [];
  secs.push([-len - r1 * 0.5, r1 * 0.6, r1 * 0.6 * flat]);
  secs.push([-len + r1 * 0.2, r1, r1 * flat]);
  for (let i = 4; i >= 1; i--) { const t = i / 5; const bulge = 1 + 0.1 * Math.sin(Math.min(1, t * 1.6) * Math.PI); const r = (r0 + (r1 - r0) * t) * bulge; secs.push([-len * t, r, r * flat]); }
  secs.push([r0 * 0.1, r0, r0 * flat]);
  secs.push([r0 * 0.55, r0 * 0.62, r0 * 0.62 * flat]);
  return secs;
}
const band = (secs, y0, y1, rows, seg, grow, p = 1) => patch(secs, null, Array.from({ length: rows + 1 }, (_, i) => y0 + ((y1 - y0) * i) / rows), () => [0, Math.PI * 2], seg, p, grow);

// ---- torso ---------------------------------------------------------------------------------
const F_TORSO = [
  [-0.075, 0.198, 0.13], [-0.03, 0.186, 0.124], [0.04, 0.154, 0.108], [0.12, 0.158, 0.11, 0.004],
  [0.2, 0.172, 0.13, 0.016], [0.27, 0.184, 0.142, 0.026], [0.33, 0.19, 0.132, 0.018], [0.38, 0.198, 0.118, 0.006],
  [0.43, 0.19, 0.105, 0], [0.47, 0.152, 0.092, -0.004], [0.5, 0.09, 0.074, -0.006],
];
const M_TORSO = [
  [-0.075, 0.19, 0.125], [-0.03, 0.184, 0.122], [0.04, 0.172, 0.115], [0.12, 0.178, 0.117, 0.002],
  [0.2, 0.196, 0.124, 0.006], [0.27, 0.212, 0.13, 0.009], [0.33, 0.222, 0.13, 0.008], [0.38, 0.228, 0.124, 0.004],
  [0.43, 0.216, 0.11, 0], [0.47, 0.168, 0.096, -0.004], [0.5, 0.096, 0.078, -0.006],
];
const FRONT = Math.PI / 2, BACK = Math.PI * 1.5;
const ys = (y0, y1, n) => Array.from({ length: n + 1 }, (_, i) => y0 + ((y1 - y0) * i) / n);

export function torsoKit(far = false) {
  const S = far ? 10 : 22;
  const P = (y0, y1, rows, range, cols, grow = 0.004) => patch(M_TORSO, F_TORSO, ys(y0, y1, rows), range, cols, 0.86, grow);
  const parts = [tag(loft2(M_TORSO, F_TORSO, S), A, -1, 0.85)];
  parts.push(tag(place(limbGeo(0.17, 0.052, 0.058, far ? 6 : 12, 1), 0, 0.62, -0.006), C, -1, 0.55));      // neck
  // hood lying on the shoulders, and the hoodie's front pocket
  parts.push(tag(sph(0.15, far ? 8 : 16, far ? 5 : 10, 0, 0.47, -0.085, 1.05, 0.62, 0.75, -0.5), A, TORSO.HOOD, 0.9));
  if (!far) {
    parts.push(tag(P(0.0, 0.14, 2, () => [FRONT - 0.55, FRONT + 0.55], 6, 0.006), A, TORSO.POCKET, 0.9, 0xd8d8d8));
    for (const s of [-1, 1]) parts.push(tag(place(new THREE.CylinderGeometry(0.005, 0.005, 0.13, 4), s * 0.035, 0.39, 0.118, 0.12), FIXED, TORSO.STRINGS, 0.7, 0xeeeeee));
    parts.push(tag(P(0.22, 0.29, 1, () => [0, Math.PI * 2], S, 0.003), B, TORSO.STRIPE, 0.85));
    parts.push(tag(P(0.19, 0.33, 2, () => [FRONT - 0.36, FRONT + 0.36], 5, 0.003), B, TORSO.PRINT, 0.7));
    // tank top and sundress: bare skin around the straps (straps sit at x = +-0.1 on the shoulder)
    const bare = (bit, front, back, w) => {
      const st = 1.09, h = w / 2;
      for (const [a0, a1, y0] of [[st + h, Math.PI - st - h, front], [-st + h, st - h, 0.3], [Math.PI - st + h, Math.PI + st - h, 0.3], [Math.PI + st + h, 2 * Math.PI - st - h, back]]) {
        parts.push(tag(P(y0, 0.5, 3, () => [a0, a1], 6, 0.003), C, bit, 0.55));
      }
    };
    bare(TORSO.TANK, 0.37, 0.41, 0.2);
    bare(TORSO.STRAPS, 0.31, 0.35, 0.1);
    // collars
    parts.push(tag(place(ellipseLoft([[0, 0.07, 0.066], [0.022, 0.066, 0.062]], 14), 0, 0.475, -0.004), A, TORSO.CREW, 0.85, 0xe6e6e6));
    parts.push(tag(place(ellipseLoft([[0, 0.086, 0.08, 0.004], [0.04, 0.078, 0.07], [0.06, 0.072, 0.066, -0.004]], 14), 0, 0.46, -0.004), A, TORSO.COLLAR, 0.8));
    parts.push(tag(P(-0.075, -0.035, 1, () => [0, Math.PI * 2], S, 0.007), B, TORSO.RIB, 0.9));
    parts.push(tag(place(ellipseLoft([[0, 0.078, 0.074], [0.035, 0.07, 0.066]], 14), 0, 0.465, -0.004), B, TORSO.RIB, 0.9));
    parts.push(tag(P(-0.075, 0.47, 6, () => [FRONT - 0.035, FRONT + 0.035], 1, 0.008), FIXED, TORSO.ZIP, 0.3, 0xb8bcc2));
    // open front: the shirt underneath, with the jacket edges standing proud of it
    parts.push(tag(P(-0.075, 0.47, 6, () => [FRONT - 0.36, FRONT + 0.36], 4, 0.004), B, TORSO.OPEN, 0.85));
    for (const s of [-1, 1]) parts.push(tag(P(-0.075, 0.46, 6, () => [FRONT + s * 0.36 - 0.06, FRONT + s * 0.36 + 0.06], 1, 0.011), A, TORSO.OPEN, 0.8));
    const vw = (y) => 0.04 + Math.max(0, (y - 0.06) / 0.44) * 0.5;
    parts.push(tag(P(0.04, 0.47, 6, (y) => [FRONT - vw(y), FRONT + vw(y)], 4, 0.004), B, TORSO.VNECK, 0.8));
    for (const s of [-1, 1]) parts.push(tag(P(0.04, 0.46, 6, (y) => s < 0 ? [FRONT - vw(y) - 0.13, FRONT - vw(y)] : [FRONT + vw(y), FRONT + vw(y) + 0.13], 2, 0.012), A, TORSO.LAPELS, 0.75));
    for (const y of [0.06, 0.16]) parts.push(tag(sph(0.008, 5, 4, -0.006, y, 0.128), FIXED, TORSO.BUTTONS, 0.4, 0x2a2a2a));
    // uniform: chest pockets and a badge
    for (const s of [-1, 1]) parts.push(tag(P(0.24, 0.34, 1, () => [FRONT + s * 0.48 - 0.2, FRONT + s * 0.48 + 0.2], 2, 0.006), A, TORSO.POCKETS, 0.85, 0xc4c4c4));
    parts.push(tag(P(0.36, 0.41, 1, () => [FRONT - 0.58, FRONT - 0.42], 1, 0.009), FIXED, TORSO.BADGE, 0.25, 0xd8b45a));
    // backpack straps and crossbody strap
    for (const s of [-1, 1]) {
      parts.push(tag(P(0.12, 0.48, 5, () => [FRONT + s * 0.62 - 0.07, FRONT + s * 0.62 + 0.07], 1, 0.008), D, TORSO.PACK, 0.7, 0x9a9a9a));
    }
    const cx = (y) => FRONT + 0.85 - ((y + 0.04) / 0.52) * 1.75;
    parts.push(tag(P(-0.04, 0.48, 8, (y) => [cx(y) - 0.08, cx(y) + 0.08], 1, 0.008), D, TORSO.CROSS, 0.7, 0x8c8c8c));
    const bx = (y) => BACK - 0.85 + ((y + 0.04) / 0.52) * 1.75;
    parts.push(tag(P(-0.04, 0.48, 8, (y) => [bx(y) - 0.08, bx(y) + 0.08], 1, 0.008), D, TORSO.CROSS, 0.7, 0x8c8c8c));
    parts.push(tag(place(ellipseLoft([[-0.08, 0.075, 0.03], [-0.07, 0.08, 0.034], [0.07, 0.08, 0.034], [0.08, 0.074, 0.03]], 10, 0.6), -0.19, -0.02, 0.07, 0, -0.6), D, TORSO.CROSS, 0.6));
  } else {
    parts.push(tag(P(-0.075, 0.47, 3, () => [FRONT - 0.36, FRONT + 0.36], 2, 0.004), B, TORSO.OPEN, 0.85));
    const vw = (y) => 0.04 + Math.max(0, (y - 0.06) / 0.44) * 0.5;
    parts.push(tag(P(0.04, 0.47, 3, (y) => [FRONT - vw(y), FRONT + vw(y)], 2, 0.004), B, TORSO.VNECK, 0.8));
    parts.push(tag(P(0.37, 0.5, 1, () => [0, Math.PI * 2], 10, 0.003), C, TORSO.TANK, 0.55));
  }
  // backpack
  parts.push(tag(place(ellipseLoft([[-0.17, 0.13, 0.06], [-0.15, 0.15, 0.075], [0.12, 0.15, 0.08], [0.16, 0.12, 0.06]], far ? 6 : 14, 0.55), 0, 0.27, -0.2), D, TORSO.PACK, 0.75));
  if (!far) parts.push(tag(place(ellipseLoft([[-0.07, 0.1, 0.03], [0.05, 0.1, 0.035], [0.07, 0.085, 0.025]], 10, 0.55), 0, 0.17, -0.27), D, TORSO.PACK, 0.75, 0xc8c8c8));
  return kit(parts);
}

// ---- pelvis --------------------------------------------------------------------------------
const M_HIPS = [[-0.27, 0.07, 0.07], [-0.22, 0.165, 0.108], [-0.12, 0.19, 0.122], [-0.02, 0.178, 0.116], [0.04, 0.17, 0.112]];
const F_HIPS = [[-0.27, 0.075, 0.072], [-0.22, 0.18, 0.114], [-0.12, 0.205, 0.128], [-0.02, 0.18, 0.118], [0.04, 0.156, 0.108]];
export function pelvisKit(far = false) {
  const S = far ? 9 : 20;
  const parts = [tag(loft2(M_HIPS, F_HIPS, S, 0.88), A, -1, 0.85)];
  const flare = (y0, y1, r0, r1, z0, z1, rows) => {
    const sm = [], sf = [];
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, y = y1 + (y0 - y1) * t;   // ascending
      const r = r1 + (r0 - r1) * t, rz = z1 + (z0 - z1) * t;
      sm.push([y, r, rz]); sf.push([y, r * 1.06, rz * 1.04]);
    }
    return loft2(sm, sf, S, 0.92, false);
  };
  parts.push(tag(flare(0.04, -0.42, 0.19, 0.25, 0.126, 0.2, far ? 2 : 5), A, PELVIS.SKIRT, 0.85));
  parts.push(tag(flare(0.05, -0.17, 0.195, 0.205, 0.13, 0.138, far ? 1 : 3), C, PELVIS.HEM, 0.85));
  parts.push(tag(flare(0.05, -0.68, 0.198, 0.26, 0.132, 0.19, far ? 2 : 6), C, PELVIS.COAT, 0.8));
  if (!far) {
    parts.push(tag(patch(M_HIPS, F_HIPS, ys(-0.03, 0.01, 1), () => [0, Math.PI * 2], S, 0.88, 0.006), B, PELVIS.BELT, 0.45));
    parts.push(tag(patch(M_HIPS, F_HIPS, ys(-0.035, 0.015, 1), () => [0, Math.PI * 2], S, 0.88, 0.012), FIXED, PELVIS.DUTY, 0.5, 0x15161a));
    parts.push(tag(place(new THREE.BoxGeometry(0.05, 0.04, 0.02), 0, -0.01, 0.128), FIXED, PELVIS.BELT, 0.3, 0xb0a890));
    // beach towel under someone lying on their back (pelvis space: the back faces the ground)
    parts.push(tag(place(new THREE.BoxGeometry(0.75, 1.75, 0.012), 0, 0.12, -0.15), D, PELVIS.TOWEL, 0.95));
  }
  return kit(parts);
}

// ---- head ----------------------------------------------------------------------------------
export function headKit(far = false) {
  const r = HR, parts = [];
  if (far) {
    parts.push(tag(sph(r, 9, 7, 0, 0.012, 0, 0.92, 1.06, 1.0), A, -1, 0.55));
    parts.push(tag(sph(r * 0.78, 7, 5, 0, -r * 0.46, r * 0.16, 0.86, 0.84, 0.9), A, -1, 0.55));
  } else {
    parts.push(tag(sph(r, 22, 16, 0, 0.012, 0, 0.92, 1.06, 1.0), A, -1, 0.5));
    parts.push(tag(sph(r * 0.78, 16, 10, 0, -r * 0.46, r * 0.16, 0.86, 0.84, 0.9), A, -1, 0.5));
    parts.push(tag(sph(r * 0.17, 8, 6, 0, -r * 0.14, r * 1.0, 0.76, 1.25, 1.05), A, -1, 0.45));
    parts.push(tag(sph(r * 0.2, 8, 5, 0, -r * 0.56, r * 0.86, 1.25, 0.35, 0.6), A, -1, 0.4, 0xc08680));    // lips
    for (const s of [-1, 1]) {
      parts.push(tag(sph(r * 0.2, 8, 6, s * r * 0.9, -r * 0.08, -r * 0.04, 0.45, 1.15, 0.8), A, -1, 0.55));                   // ears
      parts.push(tag(sph(r * 0.12, 8, 6, s * r * 0.35, r * 0.1, r * 0.86, 1.15, 0.78, 0.55), FIXED, -1, 0.3, 0xeae6e0));        // eye whites
      parts.push(tag(sph(r * 0.075, 8, 6, s * r * 0.35, r * 0.1, r * 0.93, 1, 1, 0.5), FIXED, -1, 0.2, 0x231a14));              // irises
      parts.push(tag(sph(r * 0.17, 8, 4, s * r * 0.36, r * 0.29, r * 0.9, 1.15, 0.26, 0.5, 0, 0, s * -0.12), B, -1, 0.8));      // brows
    }
  }
  // the hair shell: positions are worked out in the vertex shader from aHair and iHair
  {
    const nA = far ? 12 : 30, nX = far ? 9 : 22;
    const pos = [], hair = [], idx = [];
    for (let i = 0; i <= nX; i++) {
      const x = i <= nX / 2 ? (i / (nX / 2)) : 1 + (i - nX / 2) / (nX / 2);
      for (let k = 0; k <= nA; k++) {
        const ph = -Math.PI + (k / nA) * Math.PI * 2;
        const th = Math.min(x, 1) * Math.PI * 0.5;
        pos.push(Math.sin(th) * Math.sin(ph) * r, Math.cos(th) * r, Math.sin(th) * Math.cos(ph) * r);
        const nz = Math.sin(ph * 5 + x * 7) * 0.5 + Math.sin(ph * 9 - x * 13 + 1.3) * 0.35 + Math.sin(ph * 3 + x * 21) * 0.15;
        hair.push(x, ph, nz);
      }
    }
    for (let i = 0; i < nX; i++) for (let k = 0; k < nA; k++) {
      const a = i * (nA + 1) + k, b = a + 1, c = a + nA + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aHair', new THREE.Float32BufferAttribute(hair, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    parts.push(tag(g, B, HEAD.HAIR, 0.55));
  }
  const W = far ? 6 : 12, H = far ? 4 : 8;
  parts.push(tag(sph(r * 0.4, W, H, 0, r * 0.82, -r * 0.62), B, HEAD.BUN, 0.6));
  parts.push(tag(place(limbGeo(0.2, 0.042, 0.022, far ? 5 : 9), 0, r * 0.35, -r * 1.02, 0.42), B, HEAD.PONY, 0.6));
  if (!far) {
    parts.push(tag(place(ellipseLoft([[0, 0.03, 0.03], [0.018, 0.03, 0.03]], 8), 0, r * 0.3, -r * 1.02, 0.42), D, HEAD.PONY, 0.5));
    for (const s of [-1, 1]) parts.push(tag(place(limbGeo(0.24, 0.026, 0.016, 7), s * r * 0.55, -r * 0.15, -r * 0.7, 0.18, 0, s * 0.12), B, HEAD.BRAIDS, 0.6));
    // beard and moustache follow the jaw
    parts.push(tag(place(new THREE.SphereGeometry(r * 0.81, 18, 8, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.5, Math.PI * 0.32), 0, -r * 0.43, r * 0.15, 0, 0, 0, 0.9, 0.9, 0.98), B, HEAD.BEARD, 0.9));
    parts.push(tag(sph(r * 0.22, 10, 5, 0, -r * 0.43, r * 0.9, 1.3, 0.32, 0.5), B, HEAD.STACHE, 0.9));
    for (const s of [-1, 1]) parts.push(tag(sph(r * 0.05, 6, 4, s * r * 0.92, -r * 0.3, r * 0.02), FIXED, HEAD.EARRING, 0.2, 0xd9b866));
    // sunglasses
    const glass = [];
    for (const s of [-1, 1]) {
      glass.push(sph(r * 0.2, 12, 8, s * r * 0.37, r * 0.1, r * 0.98, 1.2, 0.85, 0.32));
      glass.push(place(new THREE.BoxGeometry(0.008, 0.008, r * 0.95), s * r * 0.86, r * 0.14, r * 0.45));
    }
    glass.push(place(new THREE.BoxGeometry(r * 0.3, 0.008, 0.008), 0, r * 0.18, r * 1.02));
    for (const g of glass) parts.push(tag(g, FIXED, HEAD.GLASSES, 0.12, 0x101114));
    // headphones
    parts.push(tag(place(new THREE.TorusGeometry(r * 1.2, 0.011, 6, 18, Math.PI), 0, 0.012, -0.005), D, HEAD.PHONES, 0.4));
    for (const s of [-1, 1]) parts.push(tag(place(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 12), s * r * 1.05, -r * 0.08, 0, 0, 0, Math.PI / 2), D, HEAD.PHONES, 0.35, 0x9a9a9a));
  }
  // headwear (slot C, bands in D)
  const R = r * 1.1;
  const capParts = (k) => {
    const out = [];
    const crown = new THREE.SphereGeometry(R, far ? 8 : 18, far ? 4 : 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    out.push(place(crown, 0, r * 0.28, -r * 0.02, -0.1, 0, 0, 1, 0.84, 1.06));
    out.push(place(new THREE.CylinderGeometry(R * 0.995, R * 1.0, r * 0.3, far ? 8 : 18, 1, true), 0, r * 0.22, -r * 0.02, -0.1));
    out.push(place(new THREE.CylinderGeometry(R * 0.92, R * 0.92, r * 0.06, far ? 6 : 16, 1, false, -1.0, 2.0), 0, r * 0.13, r * 0.6, 0.12, 0, 0, 0.9, 1, 0.85));
    if (!far) out.push(place(new THREE.SphereGeometry(r * 0.08, 6, 4), 0, r * 1.2, -r * 0.1));
    return out.map((g) => tag(g, C, k, 0.8));
  };
  parts.push(...capParts(HEAD.CAP));
  parts.push(...capParts(HEAD.CAPBACK).map((g) => g.rotateY(Math.PI)));
  parts.push(tag(place(new THREE.SphereGeometry(R * 1.02, far ? 8 : 18, far ? 5 : 10, 0, Math.PI * 2, 0, Math.PI * 0.56), 0, r * 0.12, -r * 0.04, -0.12, 0, 0, 0.98, 1.14, 1.06), C, HEAD.BEANIE, 0.95));
  if (!far) {
    parts.push(tag(place(new THREE.CylinderGeometry(R * 1.06, R * 1.08, r * 0.36, 18, 1, true), 0, r * 0.06, -r * 0.05, -0.12), C, HEAD.BEANIE, 0.95, 0xdcdcdc));
    parts.push(tag(sph(r * 0.22, 8, 6, 0, r * 1.32, -r * 0.18), D, HEAD.BEANIE, 0.95));
  }
  const RL = r * 1.14;
  parts.push(tag(place(lathe([[RL * 0.97, r * 0.32], [RL * 1.45, r * 0.1], [RL * 1.48, r * 0.14], [RL * 1.02, r * 0.4], [RL * 0.95, r * 1.05], [RL * 0.75, r * 1.22], [0.001, r * 1.25]], far ? 8 : 20), 0, 0, -r * 0.03, -0.08), C, HEAD.BUCKET, 0.9));
  parts.push(tag(place(lathe([[RL * 0.97, r * 0.4], [RL * 2.05, r * 0.25], [RL * 2.08, r * 0.3], [RL * 1.02, r * 0.52], [RL * 0.93, r * 1.1], [RL * 0.72, r * 1.28], [0.001, r * 1.31]], far ? 8 : 24), 0, 0, -r * 0.03, -0.06), C, HEAD.SUNHAT, 0.85));
  if (!far) parts.push(tag(place(new THREE.CylinderGeometry(RL * 1.0, RL * 1.01, r * 0.16, 20, 1, true), 0, r * 0.6, -r * 0.03, -0.06), D, HEAD.SUNHAT, 0.7));
  // police cap: flat crown, dark band, glossy peak
  parts.push(tag(place(lathe([[RL * 0.99, r * 0.32], [RL * 1.0, r * 0.7], [RL * 1.12, r * 1.18], [RL * 1.09, r * 1.3], [0.001, r * 1.33]], far ? 8 : 20), 0, 0, -r * 0.02, -0.1), C, HEAD.COPCAP, 0.75));
  parts.push(tag(place(new THREE.CylinderGeometry(RL * 1.005, RL * 1.0, r * 0.3, far ? 8 : 20, 1, true), 0, r * 0.5, -r * 0.02, -0.1), D, HEAD.COPCAP, 0.6));
  parts.push(tag(place(new THREE.CylinderGeometry(R * 0.95, R * 0.95, r * 0.05, far ? 6 : 16, 1, false, -0.95, 1.9), 0, r * 0.36, r * 0.62, 0.22, 0, 0, 0.92, 1, 0.8), FIXED, HEAD.COPCAP, 0.15, 0x0c0d10));
  if (!far) parts.push(tag(sph(r * 0.1, 6, 4, 0, r * 0.88, RL * 1.04, 1, 1.1, 0.35), FIXED, HEAD.COPCAP, 0.2, 0xd8b45a));
  return kit(parts);
}

// ---- arms ----------------------------------------------------------------------------------
const UA_LEN = 0.28, FA_LEN = 0.25;
export function upperArmKit() {
  const secs = limbSecs(UA_LEN, 0.056, 0.046);
  return kit([
    tag(limbGeo(UA_LEN, 0.056, 0.046, 14), B, -1, 0.8),
    tag(sph(0.06, 14, 10, 0, -0.014, -0.004, 1, 1.05, 0.98), B, -1, 0.8),                                // deltoid
    tag(band(secs, -0.13, 0.02, 3, 16, 0.006), A, UARM.SLEEVE, 0.85),
    tag(sph(0.065, 14, 8, 0, -0.012, -0.004, 1, 1.0, 0.98), A, UARM.SLEEVE, 0.85),
  ]);
}
// hand at -0.29 below the elbow, thumb forward (+z)
function handParts(far) {
  if (far) return [tag(sph(0.04, 6, 4, 0, -FA_LEN - 0.045, 0.004, 0.8, 1.3, 1.0), C, -1, 0.55)];
  return [
    tag(sph(0.041, 12, 9, 0, -FA_LEN - 0.04, 0.004, 0.62, 1.15, 1.0), C, -1, 0.5),
    tag(sph(0.03, 10, 7, 0, -FA_LEN - 0.088, 0.01, 0.62, 1.0, 1.0), C, -1, 0.5),                         // fingers
    tag(sph(0.016, 6, 5, 0.006, -FA_LEN - 0.036, 0.036, 0.85, 1.6, 0.9, 0.35), C, -1, 0.5),             // thumb
  ];
}
export function forearmKit() {
  const secs = limbSecs(FA_LEN, 0.046, 0.036);
  return kit([
    tag(limbGeo(FA_LEN, 0.046, 0.036, 12), A, -1, 0.8),
    ...handParts(false),
    tag(band(secs, -FA_LEN + 0.02, -FA_LEN + 0.065, 1, 14, 0.006), B, FARM.CUFF, 0.85),
    tag(band(secs, -FA_LEN + 0.03, -FA_LEN + 0.05, 1, 12, 0.009), FIXED, FARM.WATCH, 0.3, 0x2a2b2e),
    // phone held in the palm, screen towards the face
    tag(place(new THREE.BoxGeometry(0.075, 0.15, 0.011), 0, -FA_LEN - 0.075, 0.036), FIXED, FARM.PHONE, 0.2, 0x18191d),
    tag(place(new THREE.PlaneGeometry(0.064, 0.135), 0, -FA_LEN - 0.075, 0.0425), FIXED, FARM.PHONE, 0.1, 0x6f9fc8),
    // tote bag hanging from the hand
    tag(place(ellipseLoft([[-0.34, 0.15, 0.04], [-0.33, 0.16, 0.045], [-0.04, 0.15, 0.04], [-0.03, 0.14, 0.035]], 12, 0.5), 0, -FA_LEN - 0.08, 0, 0, Math.PI / 2), D, FARM.TOTE, 0.85),
    tag(place(new THREE.TorusGeometry(0.06, 0.008, 5, 10, Math.PI), 0, -FA_LEN - 0.11, 0, 0, Math.PI / 2), D, FARM.TOTE, 0.7, 0xb8b8b8),
  ]);
}
export function farArmKit() {
  const len = UA_LEN + FA_LEN, secs = limbSecs(len, 0.056, 0.04);
  return kit([
    tag(ellipseLoft(secs, 6), B, -1, 0.8),
    tag(band(secs, -0.15, 0.04, 1, 6, 0.008), A, UARM.SLEEVE, 0.85),
    ...handParts(true).map((g) => g.translate(0, -UA_LEN + 0.03, 0)),
  ]);
}

// ---- legs ----------------------------------------------------------------------------------
const TH_LEN = 0.38, SH_LEN = 0.35;
export function thighKit(far = false) {
  const secs = limbSecs(TH_LEN, 0.088, 0.064);
  return kit([
    tag(far ? ellipseLoft(secs, 6) : limbGeo(TH_LEN, 0.088, 0.064, 14), B, -1, 0.85),
    tag(band(secs, -0.19, 0.06, far ? 1 : 3, far ? 6 : 16, 0.012), A, THIGH.SHORTS, 0.85),
  ]);
}
// shoe geometry around the ankle (toe +z, sole at -0.085)
function shoe(len, w, hUp, sole) {
  const L = len;
  const upper = ellipseLoft([[-0.068, w * 0.5, L * 0.5, L * 0.18], [-0.04, w * 0.55, L * 0.53, L * 0.19], [-0.005, w * 0.5, L * 0.4, L * 0.1], [hUp, w * 0.47, w * 0.6, 0]], 14, 0.85);
  const s = ellipseLoft([[-0.085, w * 0.54, L * 0.53, L * 0.18], [-0.085 + sole, w * 0.56, L * 0.545, L * 0.18]], 14, 0.8);
  return [upper, s];
}
export function shinKit(far = false) {
  const secs = limbSecs(SH_LEN, 0.064, 0.048);
  const parts = [tag(far ? ellipseLoft(secs, 6) : limbGeo(SH_LEN, 0.064, 0.048, 12), A, -1, 0.85)];
  if (far) {
    parts.push(tag(ellipseLoft([[-0.085, 0.05, 0.13, 0.04], [-0.04, 0.053, 0.13, 0.04], [0.04, 0.045, 0.055, 0]], 6, 0.9).translate(0, -SH_LEN - 0.005, 0), C, -1, 0.6));
    parts.push(tag(place(ellipseLoft(secs.filter((s) => s[0] < -0.15), 6), 0, 0, 0, 0, 0, 0, 1.18, 1, 1.18), C, SHIN.BOOT, 0.6));
    return kit(parts);
  }
  parts.push(tag(band(secs, -SH_LEN + 0.0, -SH_LEN + 0.07, 2, 14, 0.01), A, SHIN.CUFF, 0.9, 0xd0d0d0));
  parts.push(tag(band(secs, -SH_LEN - 0.01, -SH_LEN + 0.07, 2, 14, 0.004), B, SHIN.SOCK, 0.9));
  parts.push(tag(band(secs, -SH_LEN - 0.02, -0.17, 4, 14, 0.014), C, SHIN.BOOT, 0.6));
  return kit(parts);
}
export function footKit() {
  const parts = [];
  const [su, ss] = shoe(0.26, 0.1, 0.04, 0.028);
  parts.push(tag(su, C, FOOT.SNEAKER, 0.7), tag(ss, D, FOOT.SNEAKER, 0.8));
  parts.push(tag(place(new THREE.SphereGeometry(0.03, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0, -0.06, 0.14, 0, 0, 0, 1.3, 0.6, 1.4), D, FOOT.SNEAKER, 0.8));   // toe cap
  const [bu, bs] = shoe(0.27, 0.11, 0.07, 0.034);
  parts.push(tag(bu, C, FOOT.BOOT, 0.55), tag(bs, FIXED, FOOT.BOOT, 0.8, 0x1a1817));
  // sandals: bare foot, two straps, thin sole
  parts.push(tag(ellipseLoft([[-0.07, 0.045, 0.12, 0.045], [-0.045, 0.048, 0.125, 0.045], [-0.015, 0.04, 0.09, 0.02], [0.03, 0.04, 0.05, 0]], 12, 0.9), B, FOOT.SANDAL, 0.55));
  parts.push(tag(ellipseLoft([[-0.085, 0.052, 0.13, 0.045], [-0.07, 0.053, 0.132, 0.045]], 12, 0.85), D, FOOT.SANDAL, 0.8));
  for (const z of [0.1, 0.0]) parts.push(tag(place(ellipseLoft([[-0.06, 0.05, 0.012], [-0.02, 0.045, 0.012]], 10), 0, -0.002, z), C, FOOT.SANDAL, 0.6));
  const [du, ds] = shoe(0.27, 0.092, 0.03, 0.016);
  parts.push(tag(du, C, FOOT.DRESS, 0.3), tag(ds, FIXED, FOOT.DRESS, 0.7, 0x141312));
  return kit(parts);
}

export const LIMB = { UA_LEN, FA_LEN, TH_LEN, SH_LEN };

// ---- material --------------------------------------------------------------------------------
const VERT_HEAD = /* glsl */`
attribute vec3 aPart;
#ifndef PED_HAIR
attribute vec3 aMorph;
#endif
attribute vec3 iColA;
attribute vec3 iColB;
attribute vec3 iColC;
attribute vec3 iColD;
attribute vec2 iBits;
varying float vRough;
#ifdef PED_HAIR
attribute vec3 aHair;
attribute vec4 iHair;
varying vec2 vHairUv;
// Hair shell: x 0..1 runs over the skull from the crown to the ear line, 1..2 hangs below it.
vec3 pedHair( inout vec3 nrm ) {
  float vol = iHair.x, len = iHair.y, fringe = iHair.z, curl = iHair.w, part = iBits.y;
  float ph = aHair.y, w = abs( ph ) / 3.14159265, sd = sin( ph );
  float frontL = 0.6 + fringe * 0.3 + part * sd * 0.1;
  float sideL = 1.1 + len * 1.4;
  float backL = 1.28 + len * 2.2;
  float lim = mix( frontL, sideL, smoothstep( 0.17, 0.42, w ) );
  lim = mix( lim, backL, smoothstep( 0.5, 0.88, w ) );
  float x = min( aHair.x, lim );
  // hair lies close to the scalp at a short hairline, keeps its body at long ends
  float edge = mix( smoothstep( 0.0, 0.14, lim - aHair.x ), 1.0, smoothstep( 0.95, 1.2, lim ) );
  float v = vol * ( 0.62 + 0.38 * smoothstep( 0.0, 0.45, w ) ) * ( 1.0 + part * sd * 0.5 * ( 1.0 - w ) );
  v = ( v + curl * 0.16 * aHair.z ) * edge + 0.035;
  vec3 sc = vec3( 0.92, 1.06, 1.0 ) * ${HR.toFixed(4)};
  vec3 p;
  if ( x <= 1.0 ) {
    float th = x * 1.5707963;
    vec3 d = vec3( sin( th ) * sin( ph ), cos( th ), sin( th ) * cos( ph ) );
    p = vec3( 0.0, 0.012, 0.0 ) + d * sc * ( 1.0 + v );
    nrm = normalize( d / sc );
  } else {
    // below the ear line: short hair tucks into the nape, long hair falls and flares a little
    float drop = ( x - 1.0 ) * 0.44;
    float tuck = 1.0 - smoothstep( 0.04, 0.2, len );
    float rad = ( 1.0 + v ) * ( 1.0 - tuck * smoothstep( 0.0, 0.1, drop ) * 0.32 ) + drop * 0.5 * ( 1.0 - tuck );
    vec3 d = vec3( sin( ph ), 0.0, cos( ph ) );
    p = vec3( 0.0, 0.012 - drop, -drop * 0.25 * ( 1.0 - tuck ) * w ) + d * vec3( sc.x, 0.0, sc.z ) * rad;
    nrm = normalize( vec3( d.x, 0.2 + tuck * 0.5, d.z ) );
  }
  vHairUv = vec2( ph, aHair.x );
  return p;
}
#endif
vec3 pedPos( inout vec3 nrm ) {
  float bit = aPart.y;
  if ( bit >= 0.0 && ( ( int( iBits.x + 0.5 ) >> int( bit + 0.5 ) ) & 1 ) == 0 ) return vec3( 0.0 );
#ifdef PED_HAIR
  vHairUv = vec2( 0.0, -1.0 );
  if ( aHair.x >= 0.0 ) return pedHair( nrm );
  return position;
#else
  return position + aMorph * iBits.y;
#endif
}
`;

function patchVertex(shader, depth) {
  shader.vertexShader = VERT_HEAD + shader.vertexShader;
  if (depth) {
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', 'vec3 pedN = vec3( 0.0, 1.0, 0.0 );\nvec3 transformed = pedPos( pedN );');
  } else {
    shader.vertexShader = shader.vertexShader
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3( normal );\nvec3 pedP = pedPos( objectNormal );')
      .replace('#include <begin_vertex>', 'vec3 transformed = pedP;')
      .replace('#include <color_vertex>', /* glsl */`
  float pedSlot = aPart.x;
  vec3 pedCol = pedSlot < 0.5 ? iColA : pedSlot < 1.5 ? iColB : pedSlot < 2.5 ? iColC : pedSlot < 3.5 ? iColD : vec3( 1.0 );
  vColor = color.rgb * pedCol;
  vRough = aPart.z;`);
  }
}

// One shared material per kind of part (body or head), plus matching shadow-depth materials.
export function makePedMaterials() {
  const mk = (hair) => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    if (hair) m.defines = { PED_HAIR: '' };
    m.onBeforeCompile = function (shader, renderer) {
      THREE.Material.prototype.onBeforeCompile.call(this, shader, renderer);
      patchVertex(shader, false);
      shader.fragmentShader = 'varying float vRough;\n' + (hair ? 'varying vec2 vHairUv;\n' : '') + shader.fragmentShader
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = vRough;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + (hair ? /* glsl */`
  if ( vHairUv.y >= 0.0 ) diffuseColor.rgb *= 0.84 + 0.16 * sin( vHairUv.x * 46.0 + sin( vHairUv.y * 7.0 + vHairUv.x * 3.0 ) * 2.5 );` : ''));
    };
    m.customProgramCacheKey = () => (hair ? 'ped-head' : 'ped-body');
    const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    if (hair) d.defines = { PED_HAIR: '' };
    d.onBeforeCompile = (shader) => patchVertex(shader, true);
    d.customProgramCacheKey = () => (hair ? 'ped-head-depth' : 'ped-body-depth');
    return { mat: m, depth: d };
  };
  return { body: mk(false), head: mk(true) };
}
