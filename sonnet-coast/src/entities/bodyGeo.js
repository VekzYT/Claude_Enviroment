// Shared body-part geometry for the player and pedestrians: lofted torsos, tapered limbs, heads
// with faces, hair, hands and shoes. Everything is smooth-shaded and carries vertex colours so one
// instanced mesh can hold, say, a shin and its shoe.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const _c = new THREE.Color();
export function tintGeo(g, hex) {
  const n = g.getAttribute('position').count, a = new Float32Array(n * 3);
  _c.set(hex);
  for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
// merge parts that may or may not carry uvs / indices
export function join(parts) {
  const clean = parts.map((g) => {
    const q = g.index ? g.toNonIndexed() : g;
    q.deleteAttribute('uv');
    if (!q.getAttribute('color')) tintGeo(q, 0xffffff);
    return q;
  });
  return mergeGeometries(clean, false);
}
export function place(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
  g.applyMatrix4(m);
  return g;
}

// Sections [y, rx, rz, z0] skinned into a closed, smooth shape. p < 1 squares the cross-section off.
export function ellipseLoft(secs, seg = 14, p = 1) {
  const n = secs.length, pos = [], idx = [];
  for (const [y, rx, rz, z0 = 0] of secs) {
    for (let k = 0; k < seg; k++) {
      const a = (k / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pos.push(rx * Math.sign(c) * Math.abs(c) ** p, y, z0 + rz * Math.sign(s) * Math.abs(s) ** p);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) {
    const a = i * seg + k, b = i * seg + ((k + 1) % seg), c = a + seg, d = b + seg;
    idx.push(a, c, b, b, c, d);
  }
  const bot = pos.length / 3; pos.push(0, secs[0][0], secs[0][3] || 0);
  const top = bot + 1; pos.push(0, secs[n - 1][0], secs[n - 1][3] || 0);
  for (let k = 0; k < seg; k++) {
    const k1 = (k + 1) % seg;
    idx.push(bot, k, k1);
    idx.push(top, (n - 1) * seg + k1, (n - 1) * seg + k);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A limb hanging from the origin down -y: radius r0 at the joint, r1 at the far end, rounded both ends.
export function limbGeo(len, r0, r1, seg = 9, flat = 0.92) {
  const secs = [];
  const steps = 5;
  secs.push([r0 * 0.55, r0 * 0.62, r0 * 0.62 * flat]);
  secs.push([r0 * 0.1, r0, r0 * flat]);
  for (let i = 1; i < steps; i++) { const t = i / steps; const bulge = 1 + 0.1 * Math.sin(Math.min(1, t * 1.6) * Math.PI); secs.push([-len * t, (r0 + (r1 - r0) * t) * bulge, (r0 + (r1 - r0) * t) * bulge * flat]); }
  secs.push([-len + r1 * 0.2, r1, r1 * flat]);
  secs.push([-len - r1 * 0.5, r1 * 0.6, r1 * 0.6 * flat]);
  secs.reverse();
  return ellipseLoft(secs, seg);
}

// Upper body from the waist to the neck (origin at the waist). w scales the shoulders.
export function torsoGeo(h = 0.5, w = 1, seg = 16) {
  return ellipseLoft([
    [-0.075, 0.176 * w, 0.118],
    [-0.07, 0.186 * w, 0.126],
    [0.0, 0.182 * w, 0.122],
    [h * 0.22, 0.176 * w, 0.116],
    [h * 0.5, 0.2 * w, 0.125, 0.006],
    [h * 0.74, 0.222 * w, 0.128, 0.008],
    [h * 0.9, 0.218 * w, 0.115, 0.002],
    [h * 0.98, 0.16 * w, 0.095, -0.004],
    [h * 1.04, 0.075, 0.07, -0.006],
    [h * 1.16, 0.056, 0.056, -0.004],
  ], seg, 0.86);
}
// Pelvis (origin at the waist, hanging down).
export function hipsGeo(w = 1, seg = 14) {
  return ellipseLoft([
    [-0.27, 0.07 * w, 0.07],
    [-0.22, 0.165 * w, 0.108],
    [-0.12, 0.19 * w, 0.122],
    [-0.02, 0.175 * w, 0.112],
    [0.04, 0.16 * w, 0.104],
  ], seg, 0.88);
}

// Head centred on the origin, looking down +z: skull, jaw, nose, ears and dark eyes.
export function headGeo(r = 0.115) {
  const skull = place(new THREE.SphereGeometry(r, 16, 12), 0, 0.012, 0, 0, 0, 0, 0.94, 1.08, 1.02);
  const jaw = place(new THREE.SphereGeometry(r * 0.78, 12, 8), 0, -r * 0.46, r * 0.14, 0, 0, 0, 0.9, 0.86, 0.92);
  const nose = place(new THREE.SphereGeometry(r * 0.17, 8, 6), 0, -r * 0.14, r * 1.0, 0, 0, 0, 0.8, 1.2, 1.1);
  const parts = [skull, jaw, nose];
  for (const s of [-1, 1]) {
    parts.push(place(new THREE.SphereGeometry(r * 0.2, 8, 6), s * r * 0.93, -r * 0.05, -r * 0.04, 0, 0, 0, 0.45, 1.15, 0.8));
    parts.push(tintGeo(place(new THREE.SphereGeometry(r * 0.1, 8, 6), s * r * 0.36, r * 0.1, r * 0.9, 0, 0, 0, 1.25, 0.8, 0.6), 0x1a1614));
    parts.push(tintGeo(place(new THREE.BoxGeometry(r * 0.3, r * 0.045, r * 0.08), s * r * 0.36, r * 0.27, r * 0.93, 0, 0, s * -0.12), 0x2a211c));
  }
  parts.push(tintGeo(place(new THREE.BoxGeometry(r * 0.42, r * 0.035, r * 0.06), 0, -r * 0.5, r * 0.86), 0x7a4a40));
  return join(parts);
}
// Hair shells that sit over headGeo. style: 0 short crop, 1 longer, 2 tied back.
export function hairGeo(style = 0, r = 0.115) {
  const R = r * 1.07;
  if (style === 1) {
    const cap = place(new THREE.SphereGeometry(R, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), 0, 0.024, -r * 0.06, -0.22, 0, 0, 0.98, 1.1, 1.08);
    const back = place(new THREE.SphereGeometry(R * 0.96, 12, 8), 0, -r * 0.62, -r * 0.42, 0, 0, 0, 0.98, 1.2, 0.62);
    return join([cap, back]);
  }
  if (style === 2) {
    const cap = place(new THREE.SphereGeometry(R, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), 0, 0.02, -r * 0.05, -0.2, 0, 0, 0.97, 1.08, 1.06);
    const bun = place(new THREE.SphereGeometry(r * 0.36, 8, 6), 0, r * 0.5, -r * 1.02);
    return join([cap, bun]);
  }
  const cap = place(new THREE.SphereGeometry(R, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), 0, 0.022, -r * 0.05, -0.26, 0, 0, 0.97, 1.08, 1.06);
  const fringe = place(new THREE.SphereGeometry(R * 0.9, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.4), 0, r * 0.2, r * 0.2, 0.5, 0, 0, 0.98, 0.8, 0.86);
  return join([cap, fringe]);
}
// Peaked cap that sits over the head.
export function capGeo(r = 0.115) {
  const R = r * 1.1;
  const crown = place(new THREE.SphereGeometry(R, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), 0, r * 0.3, -r * 0.02, -0.08, 0, 0, 1, 0.82, 1.06);
  const band = place(new THREE.CylinderGeometry(R * 0.99, R * 1.0, r * 0.3, 14), 0, r * 0.24, -r * 0.02);
  const peak = place(new THREE.CylinderGeometry(R * 0.9, R * 0.9, r * 0.07, 14, 1, false, -1.0, 2.0), 0, r * 0.2, r * 0.6, 0.1, 0, 0, 0.9, 1, 0.82);
  return join([crown, band, peak]);
}
export function handGeo(r = 0.042) {
  const palm = place(new THREE.SphereGeometry(r, 10, 8), 0, 0, 0, 0, 0, 0, 0.78, 1.35, 1.0);
  const thumb = place(new THREE.SphereGeometry(r * 0.42, 6, 5), 0, r * 0.2, r * 0.9, 0, 0, 0, 0.8, 1.4, 0.9);
  return join([palm, thumb]);
}
// Shoe centred on the ankle: toe points down +z.
export function shoeGeo(len = 0.25, w = 0.095, hex = 0x17181c) {
  const upper = ellipseLoft([[-0.075, w * 0.5, len * 0.5, len * 0.16], [-0.04, w * 0.56, len * 0.54, len * 0.17], [0.0, w * 0.52, len * 0.36, len * 0.06], [0.05, w * 0.5, w * 0.6, 0]], 10, 0.9);
  const sole = place(new THREE.BoxGeometry(w * 1.06, 0.022, len * 1.04), 0, -0.082, len * 0.165);
  return join([tintGeo(upper, hex), tintGeo(sole, 0x0b0b0c)]);
}
