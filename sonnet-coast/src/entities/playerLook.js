// The operative's body and wardrobe. The body is built from the crowd's detailed body-part kit (see
// pedKit.js), one single-instance mesh per bone, so the hero is drawn with the same shaders as the
// people around them and every clothing variant of the crowd is available. Gear the crowd never
// wears (tech-shell panels, plate carrier, helmet, raised hood, visor, cargo pockets) is built here
// in the same kit format. OUTFITS lists every wardrobe option; the safehouse menu shows each key.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { DETAIL_LAYER } from '../state.js';
import { ellipseLoft, limbGeo, place } from './bodyGeo.js';
import { makePedMaterials, torsoKit, pelvisKit, headKit, upperArmKit, thighKit, shinKit, footKit, tag, A, B, C, D, FIXED, HR, HEAD, TORSO, PELVIS, UARM, FARM, THIGH, SHIN, FOOT, LIMB } from './pedKit.js';
import { HAIR, STRIDE, HEAD_STRIDE } from './pedlooks.js';

// [label, ...values]. Indices are what the save stores, so only ever append to these lists.
export const OUTFITS = {
  body: [['Athletic'], ['Slender']],
  skin: [['Porcelain', 0xf3d2b8], ['Fair', 0xeac0a0], ['Honey', 0xdcab86], ['Warm', 0xc8916a], ['Bronze', 0xb07852], ['Brown', 0x93613f], ['Deep', 0x774a30], ['Ebony', 0x5c3722]],
  hair: [['Side Part', 'side'], ['Crop', 'crop'], ['Curls', 'curls'], ['Afro', 'afro'], ['Long', 'long'], ['Bob', 'bob'], ['Top Bun', 'bun'], ['Ponytail', 'pony'], ['Braids', 'braids'], ['Wavy', 'wavy'], ['Buzz', 'buzz'], ['Shaved', 'bald']],
  'hair colour': [['Espresso', 0x2a1c13], ['Jet', 0x16110e], ['Chestnut', 0x5e3d24], ['Copper', 0x8f4a26], ['Honey Blonde', 0xcfae78], ['Platinum', 0xe2d6c0], ['Silver', 0x8e8b86], ['Teal', 0x2f8f8a], ['Lilac', 0x9a84c8], ['Coral', 0xd9705a]],
  headwear: [['None'], ['Courier Cap'], ['Cap Backwards'], ['Beanie'], ['Field Helmet'], ['Hood Up']],
  shades: [['None'], ['Dark Shades'], ['Tinted Visor']],
  jacket: [['Tech Shell'], ['Bomber'], ['Hoodie'], ['Open Overshirt'], ['Track Top'], ['Graphic Tee']],
  'jacket colour': [['Terracotta', 0xc8643b], ['Cream', 0xeee6d6], ['Midnight', 0x1f222a], ['Teal', 0x2a9d8f], ['Olive', 0x6b7a3c], ['Mustard', 0xdca236], ['Cobalt', 0x3557a8], ['Coral', 0xe07a5f], ['Burgundy', 0x7a2e3a], ['Sand', 0xd2b98c], ['Lilac', 0xa898cf], ['Forest', 0x2f5d46]],
  shirt: [['Charcoal', 0x2b2d31], ['White', 0xf1f1ee], ['Cream', 0xefe5d1], ['Sky', 0x8fb8de], ['Sage', 0x9fb39a], ['Mustard', 0xdca236], ['Blush', 0xe8b4a8], ['Black', 0x17181b]],
  trousers: [['Cargo'], ['Joggers'], ['Jeans'], ['Chinos'], ['Shorts']],
  'trouser colour': [['Graphite', 0x2b2d31], ['Sand', 0xb8a27c], ['Denim', 0x44506a], ['Olive', 0x5d6a3a], ['Black', 0x17181b], ['Bone', 0xe2d8c6], ['Navy', 0x25314f], ['Rust', 0x9a4a2a]],
  sneakers: [['Cloud White', 0xf1f1ee, 0xf4f3ef], ['Coral Runner', 0xe07a5f, 0xf4f3ef], ['Blackout', 0x1d1e21, 0x1d1e21], ['Teal Trail', 0x2a9d8f, 0xf4f3ef], ['Sand Suede', 0xc9b48a, 0x6b4a30], ['Cobalt Court', 0x3557a8, 0xf4f3ef], ['Mustard Hi', 0xdca236, 0x1d1e21], ['Work Boots', 0x5a3b26, 0x2a2622, 'boot']],
  accent: [['Teal', 0x2fb8ac], ['Coral', 0xf0785a], ['Amber', 0xf2b442], ['Mint', 0x7fd6b0], ['Lilac', 0xa898e8], ['Cobalt', 0x4a78e0], ['Cream', 0xf1e6d0], ['Signal Red', 0xe04848]],
  gloves: [['None'], ['Tactical']],
  vest: [['None'], ['Light Carrier']],
  pack: [['None'], ['Backpack'], ['Sling Bag']],
};
export const DEFAULT_OUTFIT = {
  body: 0, skin: 3, hair: 0, 'hair colour': 0, headwear: 0, shades: 1, jacket: 0, 'jacket colour': 0, shirt: 0,
  trousers: 0, 'trouser colour': 1, sneakers: 0, accent: 0, gloves: 0, vest: 0, pack: 2,
};
// The first wardrobe had six keys: jacket (a colour, each with its own cut), pants, accent (glowing
// colours), head, vest and pack. Map such a save onto the nearest new choices, so a returning
// player keeps their look; one still in that wardrobe's default never chose it, and gets the new one.
const LEGACY_DEFAULT = { jacket: 0, pants: 0, accent: 0, head: 1, vest: 1, pack: 1 };
const LEGACY = {
  jacket: [[1, 0], [0, 2], [0, 1], [0, 2], [0, 3], [0, 7]],   // [style, colour]
  pants: [[0, 0], [0, 1], [2, 2], [0, 4]],                     // [trousers, trouser colour]
  accent: [0, 1, 4, 3, 2],
  head: [0, 1, 4, 5],
};
function fromLegacy(o) {
  if (Object.keys(LEGACY_DEFAULT).every((k) => (Number(o[k]) || 0) === LEGACY_DEFAULT[k])) return DEFAULT_OUTFIT;
  const r = { ...DEFAULT_OUTFIT, vest: o.vest, pack: o.pack };
  const at = (list, i) => { const n = list.length, v = Math.trunc(+i) || 0; return list[((v % n) + n) % n]; };
  [r.jacket, r['jacket colour']] = at(LEGACY.jacket, o.jacket);
  [r.trousers, r['trouser colour']] = at(LEGACY.pants, o.pants);
  r.accent = at(LEGACY.accent, o.accent);
  r.headwear = at(LEGACY.head, o.head);
  return r;
}
// An outfit with every key present and every index in range (saves from older versions name fewer keys).
export function fullOutfit(o = {}) {
  if (('pants' in o || 'head' in o) && !('jacket colour' in o)) o = fromLegacy(o);
  const r = {};
  for (const k of Object.keys(OUTFITS)) {
    const n = OUTFITS[k].length, v = Number(o[k]);
    r[k] = Number.isInteger(v) ? ((v % n) + n) % n : DEFAULT_OUTFIT[k];
  }
  return r;
}

const { UA_LEN, FA_LEN, TH_LEN, SH_LEN } = LIMB;
export const RIG = { UA_LEN, FA_LEN, TH_LEN, SH_LEN, HIP_Y: 1.0, HIP_X: 0.092, THIGH_Y: -0.18, SHOULDER_X: 0.238, SHOULDER_Y: 0.405, NECK_Y: 0.56, FOOT_Y: -0.355 };

// ---- gear geometry -------------------------------------------------------------------------
// pedKit's torso sections ([y, half width, half depth, z offset]; male, then the female shape the
// morph blends to), so gear fits over the kit torso exactly.
const M_TORSO = [
  [-0.075, 0.19, 0.125], [-0.03, 0.184, 0.122], [0.04, 0.172, 0.115], [0.12, 0.178, 0.117, 0.002],
  [0.2, 0.196, 0.124, 0.006], [0.27, 0.212, 0.13, 0.009], [0.33, 0.222, 0.13, 0.008], [0.38, 0.228, 0.124, 0.004],
  [0.43, 0.216, 0.11, 0], [0.47, 0.168, 0.096, -0.004], [0.5, 0.096, 0.078, -0.006],
];
const F_TORSO = [
  [-0.075, 0.198, 0.13], [-0.03, 0.186, 0.124], [0.04, 0.154, 0.108], [0.12, 0.158, 0.11, 0.004],
  [0.2, 0.172, 0.13, 0.016], [0.27, 0.184, 0.142, 0.026], [0.33, 0.19, 0.132, 0.018], [0.38, 0.198, 0.118, 0.006],
  [0.43, 0.19, 0.105, 0], [0.47, 0.152, 0.092, -0.004], [0.5, 0.09, 0.074, -0.006],
];
const FRONT = Math.PI / 2;
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
// rows at y0..y1 plus every torso section in between, so cloth never cuts through the body's curves
function rowsBetween(y0, y1, n) {
  const ys = Array.from({ length: n + 1 }, (_, i) => y0 + ((y1 - y0) * i) / n);
  return [...new Set([...ys, ...M_TORSO.map((s) => s[0]).filter((y) => y > y0 && y < y1)])].sort((a, b) => a - b);
}
// A closed band around the torso from y0 to y1, gx / gz metres off the body, morphing with it.
function band(y0, y1, gx, gz = gx, p = 0.86, seg = 22, n = 2) {
  const ys = rowsBetween(y0, y1, n);
  const mk = (secs) => ellipseLoft(ys.map((y) => { const s = secAt(secs, y); return [y, s[1] + gx, s[2] + gz, s[3] || 0]; }), seg, p);
  const gm = mk(M_TORSO), gf = mk(F_TORSO);
  const pm = gm.getAttribute('position'), pf = gf.getAttribute('position'), mor = new Float32Array(pm.count * 3);
  for (let i = 0; i < pm.count; i++) { mor[i * 3] = pf.getX(i) - pm.getX(i); mor[i * 3 + 2] = pf.getZ(i) - pm.getZ(i); }
  gm.setAttribute('aMorph', new THREE.BufferAttribute(mor, 3));
  return gm;
}
// An open strip of the torso surface between angles a0 and a1 (0 = left side, PI/2 = front).
function strip(y0, y1, a0, a1, grow, cols = 2, n = 2, p = 0.86) {
  const ys = rowsBetween(y0, y1, n), pos = [], mor = [], idx = [];
  const ring = (s, a) => { const c = Math.cos(a), sn = Math.sin(a); return [(s[1] + grow) * Math.sign(c) * Math.abs(c) ** p, (s[3] || 0) + (s[2] + grow) * Math.sign(sn) * Math.abs(sn) ** p]; };
  for (const y of ys) {
    const m = secAt(M_TORSO, y), f = secAt(F_TORSO, y);
    for (let k = 0; k <= cols; k++) {
      const a = a0 + ((a1 - a0) * k) / cols, [mx, mz] = ring(m, a), [fx, fz] = ring(f, a);
      pos.push(mx, y, mz); mor.push(fx - mx, 0, fz - mz);
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
// A flat strap swept along points (in a plane of constant x): width across x, thickness outwards.
function strap(pts, w, t) {
  const pos = [], idx = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x, y, z] = pts[i], [px, py, pz] = pts[Math.max(0, i - 1)], [nx, ny, nz] = pts[Math.min(n - 1, i + 1)];
    let dy = ny - py, dz = nz - pz;
    const l = Math.hypot(dy, dz) || 1; dy /= l; dz /= l;
    const oy = -dz, oz = dy;   // outward normal in the y-z plane
    for (const [sx, so] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) pos.push(x + (sx * w) / 2, y + oy * t * so, z + oz * t * so);
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < 4; k++) {
    const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = a + 4, d = b + 4;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const rbox = (w, h, d, r, x, y, z, rx = 0, ry = 0, rz = 0) => place(new RoundedBoxGeometry(w, h, d, 2, r), x, y, z, rx, ry, rz);
const sph = (r, w, h, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => place(new THREE.SphereGeometry(r, w, h), x, y, z, rx, ry, rz, sx, sy, sz);
// the inside of a shell: same surface, facing in
function inward(g) {
  const ix = g.index.array;
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  const nr = g.getAttribute('normal');
  for (let i = 0; i < nr.count; i++) nr.setXYZ(i, -nr.getX(i), -nr.getY(i), -nr.getZ(i));
  return g;
}

// Torso gear: bits, and colour slots A = carrier, B = dark webbing, C = jacket, D = accent.
const TG = { SHELL: 0, VEST: 1, PACKTRIM: 2, HEM: 3, ZIP: 4, SLOPE: 5 };
function torsoGear() {
  const parts = [];
  // a zip: a narrow seam a shade darker than the jacket
  parts.push(tag(strip(-0.075, 0.47, FRONT - 0.011, FRONT + 0.011, 0.0088, 1, 6), C, TG.ZIP, 0.45, 0x6e6e6e));
  // tech shell: a two-tone yoke over the shoulders edged with accent piping, a tall funnel collar,
  // accent side seams and a chest tab, and a bound hem
  parts.push(tag(band(0.335, 0.47, 0.006), C, TG.SHELL, 0.55, 0xb4b4b4));
  parts.push(tag(band(0.329, 0.341, 0.0085, 0.0085, 0.86, 22, 1), D, TG.SHELL, 0.4));
  for (const a of [0, Math.PI]) parts.push(tag(strip(-0.04, 0.33, a - 0.035, a + 0.035, 0.0075, 1, 4), D, TG.SHELL, 0.4));
  parts.push(tag(strip(0.255, 0.29, FRONT - 0.52, FRONT - 0.3, 0.008, 2, 1), D, TG.SHELL, 0.4));
  parts.push(tag(place(ellipseLoft([[0, 0.084, 0.08, 0.002], [0.04, 0.08, 0.076], [0.09, 0.074, 0.07, -0.004]], 18), 0, 0.455, -0.004), C, TG.SHELL, 0.55));
  parts.push(tag(rbox(0.02, 0.088, 0.008, 0.003, 0, 0.5, 0.072, -0.17), C, TG.SHELL, 0.45, 0x6e6e6e));   // the zip, up the collar
  parts.push(tag(band(-0.08, -0.045, 0.007, 0.007, 0.86, 22, 1), C, TG.HEM, 0.6, 0x8a8a8a));
  // the slope of the shoulders, from the neck over the top of the arm, so they read round, not square
  for (const s of [-1, 1]) parts.push(tag(sph(1, 20, 12, s * 0.178, 0.405, -0.008, 0.085, 0.05, 0.074, 0, 0, s * -0.42), C, TG.SLOPE, 0.85));
  // light plate carrier: closed body with thicker plates front and back, shoulder straps, pouches
  parts.push(tag(band(0.05, 0.355, 0.012, 0.034, 0.72, 22, 3), A, TG.VEST, 0.75));
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; pts.push([s * 0.105, 0.34 + Math.sin(a) * 0.15, Math.cos(a) * 0.158]); }
    parts.push(tag(strap(pts, 0.055, 0.012), B, TG.VEST, 0.7));
  }
  for (const x of [-0.095, 0, 0.095]) {
    parts.push(tag(rbox(0.082, 0.1, 0.034, 0.01, x, 0.15, 0.162), B, TG.VEST, 0.8));
    parts.push(tag(rbox(0.086, 0.028, 0.04, 0.008, x, 0.2, 0.162), A, TG.VEST, 0.7));
  }
  parts.push(tag(rbox(0.06, 0.018, 0.01, 0.004, 0.07, 0.29, 0.168), D, TG.VEST, 0.45));
  parts.push(tag(rbox(0.22, 0.24, 0.03, 0.012, 0, 0.21, -0.17), B, TG.VEST, 0.8));
  // an accent stripe down the backpack
  parts.push(tag(rbox(0.026, 0.2, 0.012, 0.005, 0, 0.29, -0.281), D, TG.PACKTRIM, 0.45));
  return mergeGeometries(parts, false);
}
// Head gear (head space, as headKit): A = shell, B = dark, C = jacket (hood), D = accent.
const HG = { HELMET: 0, HOOD: 1, VISOR: 2 };
function headGear() {
  const r = HR, parts = [], R = r * 1.3;
  // helmet: shell with a thickened rim and dark lining, accent stripe front to back, tinted visor, ear pods
  const shell = (rr, th) => place(new THREE.SphereGeometry(rr, 26, 14, 0, Math.PI * 2, 0, Math.PI * th), 0, 0.022, -0.01, -0.12, 0, 0, 0.95, 1.0, 1.07);
  parts.push(tag(shell(R, 0.6), A, HG.HELMET, 0.35));
  parts.push(tag(inward(shell(R * 0.95, 0.6)), FIXED, HG.HELMET, 0.8, 0x1a1b1e));
  const yc = R * Math.cos(Math.PI * 0.6);   // the rim ring, tilted with the shell
  parts.push(tag(place(new THREE.TorusGeometry(R * Math.sin(Math.PI * 0.6), 0.0075, 6, 34), 0, 0.022 + yc * Math.cos(0.12), -0.01 - yc * Math.sin(0.12), Math.PI / 2 - 0.12, 0, 0, 0.95, 1.07, 1.0), A, HG.HELMET, 0.4, 0xb4b4b4));
  for (const [ph, th] of [[Math.PI / 2, 0.4], [Math.PI * 1.5, 0.58]]) parts.push(tag(place(new THREE.SphereGeometry(R * 1.012, 3, 10, ph - 0.09, 0.18, 0.02, Math.PI * th), 0, 0.022, -0.01, -0.12, 0, 0, 0.95, 1.0, 1.07), D, HG.HELMET, 0.4));
  parts.push(tag(place(new THREE.SphereGeometry(R * 1.035, 24, 6, Math.PI / 2 - 1.15, 2.3, Math.PI * 0.43, Math.PI * 0.17), 0, 0.022, -0.01, -0.12, 0, 0, 0.95, 1.0, 1.07), D, HG.HELMET, 0.08, 0x555555));
  for (const s of [-1, 1]) parts.push(tag(place(new THREE.CylinderGeometry(0.036, 0.036, 0.03, 16), s * R * 0.91, -0.012, -0.004, 0, 0, Math.PI / 2), B, HG.HELMET, 0.5));
  // raised hood: close round the head and down onto the collar, its opening framing the face, the
  // outer shell in the jacket colour and a darker lining showing round the face
  const hood = (rr) => place(new THREE.SphereGeometry(rr, 26, 16, Math.PI / 2 + 0.8, Math.PI * 2 - 1.6, 0, Math.PI * 0.84), 0, -0.018, -0.012, -0.1, 0, 0, 1.0, 1.16, 1.04);
  parts.push(tag(hood(r * 1.25), C, HG.HOOD, 0.9));
  parts.push(tag(inward(hood(r * 1.19)), C, HG.HOOD, 0.95, 0x6a6a6a));
  // wrap-around visor glasses: tinted lens and a dark top bar
  const lens = new THREE.CylinderGeometry(r * 1.0, r * 0.98, r * 0.34, 28, 1, true, -1.15, 2.3);
  parts.push(tag(place(lens, 0, r * 0.11, 0.004, 0, 0, 0, 1.0, 1, 1.13), D, HG.VISOR, 0.06, 0x606060));
  parts.push(tag(place(new THREE.CylinderGeometry(r * 1.015, r * 1.015, r * 0.07, 28, 1, true, -1.15, 2.3), 0, r * 0.27, 0.004, 0, 0, 0, 1.0, 1, 1.13), FIXED, HG.VISOR, 0.3, 0x15161a));
  return mergeGeometries(parts, false);
}
// The forearm with the operative's own hands (side +1 = left): a relaxed hand with curled fingers,
// and a fist for fighting and for gripping things (one shows at a time, see setFists). Slots:
// A = sleeve, B = cuff, C = skin or glove. The palm faces the body, the thumb forwards (+z).
const FA = { CUFF: FARM.CUFF, RELAX: 1, FIST: 2, WATCH: FARM.WATCH };
function tube(pts, r, seg = 7) {
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), seg, r, 7, false);
  const [x, y, z] = pts[pts.length - 1];
  return mergeGeometries([g, place(new THREE.SphereGeometry(r, 7, 5), x, y, z)], false);
}
function forearm(side) {
  const L = FA_LEN, w = -L, s = side, parts = [tag(limbGeo(L, 0.046, 0.036, 14), A, -1, 0.8)];
  // cuff and watch: rings round the wrist (the limb is about 0.038 across there)
  parts.push(tag(ellipseLoft([[w + 0.02, 0.044, 0.041], [w + 0.065, 0.045, 0.042]], 16), B, FA.CUFF, 0.85));
  parts.push(tag(ellipseLoft([[w + 0.03, 0.047, 0.044], [w + 0.05, 0.047, 0.044]], 14), FIXED, FA.WATCH, 0.3, 0x2a2b2e));
  // relaxed: palm, four fingers curling in towards the palm, the thumb resting along the index
  parts.push(tag(sph(0.04, 14, 10, 0, w - 0.04, 0.002, 0.58, 1.05, 1.0), C, FA.RELAX, 0.5));
  for (const [z, len, r] of [[0.026, 0.044, 0.0092], [0.009, 0.05, 0.0096], [-0.009, 0.046, 0.0092], [-0.025, 0.036, 0.0084]]) {
    const y0 = w - 0.074;
    parts.push(tag(tube([[s * 0.002, y0, z], [-s * 0.006, y0 - len * 0.55, z * 1.02], [-s * 0.024, y0 - len * 0.86, z * 1.03]], r), C, FA.RELAX, 0.5));
  }
  parts.push(tag(tube([[-s * 0.006, w - 0.03, 0.03], [-s * 0.014, w - 0.058, 0.046], [-s * 0.02, w - 0.08, 0.044]], 0.0105), C, FA.RELAX, 0.5));
  // fist: fingers rolled into the palm, knuckles in a row, the thumb wrapped over the front
  parts.push(tag(rbox(0.054, 0.074, 0.084, 0.022, -s * 0.004, w - 0.046, 0.0), C, FA.FIST, 0.5));
  for (const z of [0.027, 0.009, -0.009, -0.026]) parts.push(tag(sph(0.0115, 8, 6, s * 0.006, w - 0.078, z, 1, 0.9, 1), C, FA.FIST, 0.5));
  parts.push(tag(tube([[-s * 0.012, w - 0.024, 0.036], [-s * 0.03, w - 0.05, 0.034], [-s * 0.032, w - 0.07, 0.012]], 0.011), C, FA.FIST, 0.5));
  return { base: mergeGeometries(parts, false), extras: [] };
}
// The upper arm with a rounded shoulder cap that carries the slope of the shoulders over into the
// sleeve (the crowd's arm meets the torso at a corner, which reads as blocky this close).
function upperArm(side) {
  const k = upperArmKit();
  const cap = tag(sph(0.066, 18, 12, -side * 0.008, -0.035, -0.006, 1, 1.25, 1), A, -1, 0.85);
  return { base: mergeGeometries([k.base, cap], false), extras: k.extras };
}
// Cargo pockets on the outside of a thigh (side +1 = left).
function thighGear(side) {
  return mergeGeometries([
    tag(rbox(0.03, 0.13, 0.11, 0.012, side * 0.074, -0.245, 0.004), A, 0, 0.85, 0xe0e0e0),
    tag(rbox(0.036, 0.034, 0.116, 0.01, side * 0.077, -0.19, 0.004), A, 0, 0.8, 0xbcbcbc),
  ], false);
}

// ---- held items ------------------------------------------------------------------------------
function items(mats) {
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.layers.set(DETAIL_LAYER); return m; };
  const rb = (w, h, d, mat, x, y, z, r) => mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01)), mat, x, y, z);
  const pistol = new THREE.Group();
  pistol.add(rb(0.05, 0.085, 0.27, mats.dark, 0, 0, 0.12, 0.014), rb(0.045, 0.15, 0.065, mats.dark, 0, -0.1, 0.02, 0.014), rb(0.054, 0.02, 0.16, mats.accent, 0, 0.046, 0.14, 0.008), rb(0.02, 0.02, 0.03, mats.gear, 0, 0.05, 0.02, 0.006));
  pistol.rotation.x = Math.PI / 2;
  const baton = new THREE.Group();
  const stick = mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.62, 10), mats.dark, 0, 0, 0.26); stick.rotation.x = Math.PI / 2;
  const tip = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 10), mats.accent, 0, 0, 0.5); tip.rotation.x = Math.PI / 2;
  baton.add(stick, tip);
  baton.rotation.x = Math.PI / 2;
  const emp = mesh(new THREE.IcosahedronGeometry(0.085, 2), mats.gear, 0, 0, 0.06);
  emp.add(new THREE.Mesh(new THREE.TorusGeometry(0.087, 0.012, 6, 20), mats.accent));
  emp.children[0].layers.set(DETAIL_LAYER);
  const hack = new THREE.Group();
  hack.add(rb(0.19, 0.022, 0.29, mats.dark, 0, 0, 0.14, 0.01), rb(0.16, 0.006, 0.22, mats.accent, 0, 0.014, 0.16, 0.002));
  hack.rotation.x = Math.PI / 2 - 0.5;
  return { pistol, baton, emp, hack };
}

// ---- the model ---------------------------------------------------------------------------------
// A single-instance mesh of a kit geometry with its own instance record (colours, bits, hair).
function kitMesh(geo, mat, stride) {
  const data = new Float32Array(stride);
  const ib = new THREE.InstancedInterleavedBuffer(data, stride, 1);
  geo.setAttribute('iColA', new THREE.InterleavedBufferAttribute(ib, 3, 0));
  geo.setAttribute('iColB', new THREE.InterleavedBufferAttribute(ib, 3, 3));
  geo.setAttribute('iColC', new THREE.InterleavedBufferAttribute(ib, 3, 6));
  geo.setAttribute('iColD', new THREE.InterleavedBufferAttribute(ib, 3, 9));
  geo.setAttribute('iBits', new THREE.InterleavedBufferAttribute(ib, 2, 12));
  if (stride > 14) geo.setAttribute('iHair', new THREE.InterleavedBufferAttribute(ib, 4, 14));
  const m = new THREE.InstancedMesh(geo, mat.mat, 1);
  m.customDepthMaterial = mat.depth;
  // the shader moves vertices (hair, morphs, hidden variants), so cull on a sphere that holds any of it
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.9);
  m.castShadow = true;
  m.layers.set(DETAIL_LAYER);
  m.userData.rec = data; m.userData.ib = ib;
  return m;
}
// A body part: the base mesh plus its kit's variant groups (each shown only when a variant is worn).
function kitPart(kit, mat, stride = STRIDE) {
  const g = new THREE.Group();
  const base = kitMesh(kit.base, mat, stride);
  base.userData.always = true;
  const meshes = [base, ...kit.extras.map((e) => { const m = kitMesh(e.geo, mat, stride); m.userData.mask = e.mask; return m; })];
  g.add(...meshes);
  g.userData.meshes = meshes;
  return g;
}
function bone(parent, x, y, z, order = 'XYZ') {
  const b = new THREE.Group();
  b.position.set(x, y, z); b.rotation.order = order;
  parent.add(b);
  return b;
}

export function buildModel() {
  const mats = makePedMaterials();
  const flat = {
    dark: new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.45, metalness: 0.35 }),
    gear: new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.6, metalness: 0.15 }),
    accent: new THREE.MeshStandardMaterial({ color: 0x2fb8ac, emissive: 0x2fb8ac, emissiveIntensity: 0.6, roughness: 0.35 }),
  };
  const root = new THREE.Group();
  root.rotation.order = 'YXZ';
  const P = { parts: {} };
  const part = (name, parentBone, kit, mat = mats.body, stride = STRIDE) => { const p = kitPart(kit, mat, stride); parentBone.add(p); P.parts[name] = p; return p; };
  const gear = (name, parentBone, geo) => { const m = kitMesh(geo, mats.body, STRIDE); parentBone.add(m); P.parts[name] = m; return m; };
  P.pelvis = bone(root, 0, RIG.HIP_Y, 0, 'YZX');
  part('pelvis', P.pelvis, pelvisKit(false));
  P.torso = bone(P.pelvis, 0, 0, 0, 'YXZ');
  part('torso', P.torso, torsoKit(false));
  gear('torsoGear', P.torso, torsoGear());
  P.head = bone(P.torso, 0, RIG.NECK_Y, 0, 'YXZ');
  const skull = bone(P.head, 0, 0.065, 0.006);
  part('head', skull, headKit(false), mats.head, HEAD_STRIDE);
  gear('headGear', skull, headGear());
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    const ua = bone(P.torso, s * RIG.SHOULDER_X, RIG.SHOULDER_Y, -0.008, 'ZXY');
    part('uarm' + k, ua, upperArm(s));
    const fa = bone(ua, 0, -UA_LEN, 0);
    part('farm' + k, fa, forearm(s));
    const th = bone(P.pelvis, s * RIG.HIP_X, RIG.THIGH_Y, 0, 'ZXY');
    part('thigh' + k, th, thighKit(false));
    gear('thighGear' + k, th, thighGear(s));
    const sh = bone(th, 0, -TH_LEN, 0);
    part('shin' + k, sh, shinKit(false));
    const ft = bone(sh, 0, RIG.FOOT_Y, 0);
    part('foot' + k, ft, footKit());
    P['ua' + k] = ua; P['fa' + k] = fa; P['th' + k] = th; P['sh' + k] = sh; P['ft' + k] = ft;
  }
  // held items sit in the right palm
  const hand = P.hand = bone(P.faR, 0, -FA_LEN - 0.05, 0.03);
  P.items = items(flat);
  for (const k of Object.keys(P.items)) { P.items[k].visible = false; hand.add(P.items[k]); }
  P.muzzle = new THREE.Object3D(); P.muzzle.position.set(0, -0.3, 0); hand.add(P.muzzle);
  root.traverse((o) => { if (o.isMesh) o.layers.set(DETAIL_LAYER); });
  return { root, P, mats: flat };
}

const SEAT = 0.7;

// ---- dressing ----------------------------------------------------------------------------------
const lin = (hex, out, o) => {
  // three.js colours are linear; the wardrobe's hex values are sRGB
  for (let i = 0; i < 3; i++) { const c = ((hex >> (16 - i * 8)) & 255) / 255; out[o + i] = c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4); }
};
const shade = (hex, k) => { const r = Math.min(255, ((hex >> 16) & 255) * k), g = Math.min(255, ((hex >> 8) & 255) * k), b = Math.min(255, (hex & 255) * k); return (r << 16) | (g << 8) | b; };
const bits = (...list) => list.reduce((m, b) => (b === null || b === undefined || b === false ? m : m | (1 << b)), 0);
function setRec(m, a, b, c, d, mask, extra = 0) {
  const r = m.userData.rec;
  lin(a, r, 0); lin(b, r, 3); lin(c, r, 6); lin(d, r, 9);
  r[12] = mask; r[13] = extra;
  m.userData.ib.needsUpdate = true;
  // a kit part's base always shows; its variant meshes and the gear only when something on them is worn
  m.visible = m.userData.always || (m.userData.mask === undefined ? mask !== 0 : (mask & m.userData.mask) !== 0);
}
// write the same record to a kit part's base mesh and its variant meshes
function setPart(p, a, b, c, d, mask, extra = 0) {
  for (const m of p.userData.meshes) setRec(m, a, b, c, d, mask, extra);
}

// Close or open a hand: fists for fighting and for holding on to things.
function fist(p, f) {
  if (p.userData.fist === f) return;
  p.userData.fist = f;
  const m = p.userData.meshes[0];
  m.userData.rec[12] = p.userData.base | (1 << (f ? FA.FIST : FA.RELAX));
  m.userData.ib.needsUpdate = true;
}
export function setFists(P, l, r) { fist(P.parts.farmL, l); fist(P.parts.farmR, r); }

// Paint the model for an outfit (all keys present, see fullOutfit).
export function dressModel(P, flat, o) {
  const pick = (k) => OUTFITS[k][o[k]];
  const skin = pick('skin')[1], hairCol = pick('hair colour')[1], acc = pick('accent')[1];
  const jStyle = pick('jacket')[0], jacket = pick('jacket colour')[1], shirt = pick('shirt')[1];
  const tStyle = pick('trousers')[0], trou = pick('trouser colour')[1];
  const [, shoe, sole, shoeKind] = pick('sneakers');
  const hw = pick('headwear')[0], shades = o.shades, fem = o.body === 1 ? 1 : 0;
  const glove = o.gloves ? 0x1f2024 : skin, bag = 0x2b2d31;
  const T = TORSO, Pp = P.parts;
  const tee = jStyle === 'Graphic Tee', hoodUp = hw === 'Hood Up', helmet = hw === 'Field Helmet';
  // torso
  let tb = 0, tB = shade(jacket, 0.7);
  switch (jStyle) {
    case 'Bomber': tb = bits(T.RIB); tB = shade(jacket, 0.6); break;
    case 'Hoodie': tb = bits(!hoodUp && T.HOOD, T.POCKET, !hoodUp && T.STRINGS); tB = shade(jacket, 0.82); break;
    case 'Open Overshirt': tb = bits(T.OPEN, T.COLLAR); tB = shirt; break;
    case 'Track Top': tb = bits(T.COLLAR, T.STRIPE); tB = acc; break;
    case 'Graphic Tee': tb = bits(T.CREW, T.PRINT); tB = acc; break;
  }
  if (o.pack === 1) tb |= bits(T.PACK);
  if (o.pack === 2) tb |= bits(T.CROSS);
  setPart(Pp.torso, jacket, tB, skin, bag, tb, fem);
  const zip = jStyle === 'Tech Shell' || jStyle === 'Bomber' || jStyle === 'Track Top';
  setRec(Pp.torsoGear, 0x3a3d44, 0x24262b, jacket, acc, bits(TG.SLOPE, jStyle === 'Tech Shell' && TG.SHELL, jStyle === 'Tech Shell' && TG.HEM, zip && TG.ZIP, o.vest === 1 && TG.VEST, o.pack === 1 && TG.PACKTRIM), fem);
  // pelvis
  const shorts = tStyle === 'Shorts';
  setPart(Pp.pelvis, trou, 0x1d1e21, jacket, 0, bits((tStyle === 'Cargo' || tStyle === 'Jeans' || tStyle === 'Chinos') && jStyle !== 'Hoodie' && PELVIS.BELT, jStyle === 'Open Overshirt' && PELVIS.HEM), fem);
  // arms: short sleeves only with the tee
  const lower = tee ? skin : jacket;
  const cuff = jStyle === 'Bomber' || jStyle === 'Hoodie' || jStyle === 'Track Top' || jStyle === 'Tech Shell';
  for (const k of ['L', 'R']) {
    setPart(Pp['uarm' + k], jacket, lower, skin, skin, bits(tee && UARM.SLEEVE));
    const fa = Pp['farm' + k];
    fa.userData.base = bits(cuff && FA.CUFF, k === 'L' && FA.WATCH); fa.userData.fist = false;
    setPart(fa, lower, jStyle === 'Track Top' ? acc : shade(jacket, 0.72), glove, bag, fa.userData.base | bits(FA.RELAX));
    setPart(Pp['thigh' + k], trou, shorts ? skin : trou, skin, skin, bits(shorts && THIGH.SHORTS));
    setRec(Pp['thighGear' + k], trou, trou, trou, trou, tStyle === 'Cargo' ? 1 : 0);
    const boot = shoeKind === 'boot';
    setPart(Pp['shin' + k], shorts ? skin : trou, 0xf1f1ee, shoe, sole, bits(tStyle === 'Joggers' && SHIN.CUFF, shorts && !boot && SHIN.SOCK, boot && !shorts && SHIN.BOOT));
    setPart(Pp['foot' + k], skin, skin, shoe, sole, bits(boot ? FOOT.BOOT : FOOT.SNEAKER));
  }
  // head: hair squashes under anything worn on it; helmets and hoods hide the long ends
  const H = HAIR[pick('hair')[1]] || HAIR.crop;
  const covered = helmet || hoodUp;
  const hat = { 'Courier Cap': HEAD.CAP, 'Cap Backwards': HEAD.CAPBACK, Beanie: HEAD.BEANIE }[hw];
  const hb = bits(!H.none && HEAD.HAIR, ...(covered ? [] : H.bits || []), hat, shades === 1 && HEAD.GLASSES);
  setPart(Pp.head, skin, hairCol, jacket, bag, hb, H.part || 0);
  for (const m of Pp.head.userData.meshes) {
    const r = m.userData.rec, v = H.v;
    const squash = hat !== undefined || covered;
    r[14] = covered ? 0 : squash ? Math.min(v[0], 0.04) : v[0];
    r[15] = covered ? Math.min(v[1], 0.02) : v[1];
    r[16] = covered ? Math.min(v[2], 0.25) : squash ? Math.min(v[2], 0.4) : v[2];
    r[17] = squash ? 0 : v[3];
  }
  setRec(Pp.headGear, 0xe9e5dc, 0x1c1d21, jacket, acc, bits(helmet && HG.HELMET, hoodUp && HG.HOOD, shades === 2 && !helmet && HG.VISOR));
  flat.accent.color.set(acc); flat.accent.emissive.set(acc);
  // a touch more bulk than the crowd: a fuller jacket, sleeves over the arms, roomier trousers
  // (the hips stay a centimetre inside the jacket's waist on either build, or trousers show through)
  const build = fem ? 1 : 1.06, sleeve = tee ? 1.02 : 1.05, leg = tStyle === 'Cargo' || tStyle === 'Joggers' ? 1.08 : shorts ? 1 : 1.03;
  Pp.torso.scale.set(build, 1, fem ? 1.01 : 1.04); Pp.torsoGear.scale.copy(Pp.torso.scale);
  // the crowd's seat hangs well below the hip joints; shortened about the belt line it sits between the thighs
  if (fem) Pp.pelvis.scale.set(0.96, SEAT, 0.95); else Pp.pelvis.scale.set(1.03, SEAT, 1);
  Pp.pelvis.position.y = -0.1 * (1 - SEAT);
  for (const k of ['L', 'R']) {
    Pp['uarm' + k].scale.set(sleeve, 1, sleeve); Pp['farm' + k].scale.set(sleeve * 0.97, 1, sleeve * 0.97);
    for (const n of ['thigh', 'thighGear', 'shin']) Pp[n + k].scale.set(leg, 1, leg);
  }
  const sx = RIG.SHOULDER_X * build - (fem ? 0.016 : 0);
  P.uaL.position.x = sx; P.uaR.position.x = -sx;
}
