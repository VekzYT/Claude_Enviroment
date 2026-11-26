// Helicopter models, in the style of vehicleMesh.js: a lofted fuselage split into paint, livery and a
// see-through canopy by region, a tapered tail boom with fin and stabiliser, skids, a furnished cabin,
// and the two rotors, whose blades give way to a translucent blur disc as they spin up.
// Local space: +z forward, +x left, y up; the origin is under the main rotor mast, at the skids' soles.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PAL } from '../world/palette.js';

export const ROTOR_Y = 3.02, ROTOR_R = 5.3, TAIL_ROTOR = { x: 0.2, y: 2.32, z: -6.78, r: 0.78 };
// right-hand (pilot's) seat, in body space: [x, cushion height, z]
const SEAT = [-0.4, 0.98, 0.78];
// livery: second colour (belly band), where it goes, and the colour of the cabin trim
const LIVERIES = {
  civil: { band: 0xf0e8d8, lower: true },
  medic: { band: PAL.terracotta, lower: false },
  police: { band: 0xf2f3f4, lower: false },
};

let mats = null;
function sharedMats() {
  if (mats) return mats;
  mats = {
    trim: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.35, envMapIntensity: 1.1 }),
    // the bubble is see-through, so the pilot and the cabin show
    canopy: new THREE.MeshPhysicalMaterial({ color: 0x4d6674, roughness: 0.03, metalness: 0.2, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 }),
    lamps: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    beaconOn: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.12, 0.1).multiplyScalar(3), toneMapped: false }),
    beaconOff: new THREE.MeshStandardMaterial({ color: 0x5a1a18, roughness: 0.3, metalness: 0.2 }),
    blurTex: blurTexture(),
  };
  return mats;
}

// Radial streaks for the spinning disc: clear at the hub, a soft grey band out to the tips.
function blurTexture() {
  const S = 256, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(30,32,36,0)'); gr.addColorStop(0.1, 'rgba(30,32,36,0.15)');
  gr.addColorStop(0.55, 'rgba(30,32,36,0.42)'); gr.addColorStop(0.9, 'rgba(26,28,32,0.6)');
  gr.addColorStop(0.95, 'rgba(210,200,180,0.55)'); gr.addColorStop(1, 'rgba(26,28,32,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  // faint concentric rings read as the blades' wake
  g.globalCompositeOperation = 'destination-out';
  for (let r = 0.18; r < 0.9; r += 0.07) { g.strokeStyle = `rgba(0,0,0,${0.18 + 0.1 * Math.sin(r * 40)})`; g.lineWidth = 2; g.beginPath(); g.arc(S / 2, S / 2, r * S / 2, 0, Math.PI * 2); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- small maths --------------------------------------------------------------------------------
function smooth(keys, z) {
  const n = keys.length;
  if (z <= keys[0][0]) return keys[0][1];
  if (z >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (z > keys[i + 1][0]) i++;
  const m = (k) => { const a = Math.max(0, k - 1), b = Math.min(n - 1, k + 1); return (keys[b][1] - keys[a][1]) / (keys[b][0] - keys[a][0]); };
  const z0 = keys[i][0], h = keys[i + 1][0] - z0, t = (z - z0) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * keys[i][1] + (t3 - 2 * t2 + t) * h * m(i) + (-2 * t3 + 3 * t2) * keys[i + 1][1] + (t3 - t2) * h * m(i + 1);
}
const spow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

// Skins stations along z into a closed surface. sec(z) -> [halfWidth, yBottom, yTop, squareness];
// classify(z, u, x) names the group a quad goes to (u is -1 at the keel, +1 at the spine); shade(z)
// darkens a whole ring (crisp seams). One set of smooth normals is shared by every group.
function skin(zs, sec, seg, classify, shade) {
  const S = zs.length, pos = [], col = [];
  for (const z of zs) {
    const [w, yb, yt, p] = sec(z), yc = (yb + yt) / 2, hh = (yt - yb) / 2, c = shade ? shade(z) : 1;
    for (let k = 0; k < seg; k++) {
      const a = -Math.PI / 2 + (k / seg) * Math.PI * 2;
      pos.push(w * spow(Math.cos(a), p), yc + hh * spow(Math.sin(a), p), z);
      col.push(c, c, c);
    }
  }
  const groups = {};
  const put = (name, a, b, c) => (groups[name] || (groups[name] = [])).push(a, b, c);
  for (let i = 0; i < S - 1; i++) {
    for (let k = 0; k < seg; k++) {
      const k1 = (k + 1) % seg, a = i * seg + k, b = i * seg + k1, c = a + seg, d = b + seg;
      const am = -Math.PI / 2 + ((k + 0.5) / seg) * Math.PI * 2;
      const name = classify((zs[i] + zs[i + 1]) / 2, Math.sin(am), Math.cos(am));
      put(name, a, c, b); put(name, b, c, d);
    }
  }
  // caps
  for (const [i, front] of [[0, false], [S - 1, true]]) {
    let cx = 0, cy = 0;
    for (let k = 0; k < seg; k++) cy += pos[(i * seg + k) * 3 + 1] / seg;
    const ci = pos.length / 3;
    pos.push(cx, cy, zs[i]); col.push(1, 1, 1);
    const name = classify(zs[i], 0, 0);
    for (let k = 0; k < seg; k++) { const a = i * seg + k, b = i * seg + ((k + 1) % seg); if (front) put(name, ci, a, b); else put(name, ci, b, a); }
  }
  const all = [];
  for (const k of Object.keys(groups)) for (const v of groups[k]) all.push(v);
  const whole = new THREE.BufferGeometry();
  const P = new THREE.Float32BufferAttribute(pos, 3);
  whole.setAttribute('position', P); whole.setIndex(all); whole.computeVertexNormals();
  const N = whole.getAttribute('normal'), C = new THREE.Float32BufferAttribute(col, 3);
  const out = {};
  for (const k of Object.keys(groups)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', P); g.setAttribute('normal', N); g.setAttribute('color', C);
    g.setIndex(groups[k]);
    out[k] = g.toNonIndexed();
  }
  return out;
}
function range(a, b, n) { const o = []; for (let i = 0; i <= n; i++) o.push(a + ((b - a) * i) / n); return o; }

// ---- parts --------------------------------------------------------------------------------------
function tint(g, hex) {
  g = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  const c = new THREE.Color(hex), n = g.getAttribute('position').count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function put(list, geo, hex, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const g = tint(geo, hex);
  g.applyMatrix4(_m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(1, 1, 1)));
  list.push(g);
  return g;
}
const rbox = (list, sx, sy, sz, x, y, z, hex, r = 0.04, rx = 0, ry = 0, rz = 0) => put(list, new RoundedBoxGeometry(sx, sy, sz, 2, Math.min(r, sx / 2.1, sy / 2.1, sz / 2.1)), hex, x, y, z, rx, ry, rz);
function tube(list, pts, r, hex, seg = 6, closed = false) {
  const path = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed);
  list.push(tint(new THREE.TubeGeometry(path, Math.max(8, pts.length * 6), r, seg, closed), hex));
}
// a flat plate in the y-z plane (fins), outline given as [z, y] points, thickness t, centred on x
function plate(list, outline, t, hex, x = 0) {
  const sh = new THREE.Shape(outline.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, -t / 2);
  g.rotateY(-Math.PI / 2);   // shape x -> world z, extrusion -> world x
  g.translate(x, 0, 0);
  list.push(tint(g, hex));
}

const geoCache = new Map();
function heliGeometry(livery) {
  if (geoCache.has(livery)) return geoCache.get(livery);
  const L = LIVERIES[livery];
  const police = livery === 'police';
  const paint = [], alt = [], glass = [], trim = [], lamps = [];
  const DARK = 0x24272c, GREY = 0x8d9399, STEEL = 0xb9bec4, SEAT_C = police ? 0x2c3038 : 0x6b5a48, FLOOR = 0x2a2c30;

  // fuselage: cabin, bubble nose and the taper into the boom
  const W = [[-1.75, 0.5], [-1.05, 0.84], [-0.1, 0.94], [0.95, 0.92], [1.8, 0.78], [2.35, 0.52], [2.72, 0.14], [2.8, 0.02]];
  const YB = [[-1.75, 1.08], [-1.15, 0.74], [-0.55, 0.62], [1.45, 0.63], [2.2, 0.8], [2.6, 1.02], [2.8, 1.2]];
  const YT = [[-1.75, 2.0], [-1.0, 2.22], [0.4, 2.27], [1.25, 2.16], [1.95, 1.84], [2.45, 1.48], [2.8, 1.22]];
  const P = [[-1.75, 0.85], [-1.0, 0.68], [1.2, 0.72], [2.2, 0.9], [2.8, 1]];
  // seams (door shut lines), as thin dark rings
  const seams = [-1.08, -0.13, 0.84];
  const zs = range(-1.75, 2.8, 30);
  for (const s of seams) zs.push(s - 0.012, s + 0.012);
  zs.sort((a, b) => a - b);
  const fus = skin(zs, (z) => [smooth(W, z), smooth(YB, z), smooth(YT, z), smooth(P, z)], 32, (z, u) => {
    // the bubble: forward of the door pillars down to the chin, under a painted roof strip
    if (z > 1.0 && u > -0.32 && z < 2.7 && !(u > 0.8 && z < 1.75)) return 'glass';
    // door windows: a big one in the pilot's door, a smaller one behind
    if (z > -0.02 && z < 0.72 && u > 0.08 && u < 0.72) return 'glass';
    if (z > -0.85 && z < -0.25 && u > 0.22 && u < 0.68) return 'glass';
    if (L.lower ? u < -0.42 || (u > -0.16 && u < -0.08) : u < -0.12 && u > -0.5) return 'alt';
    return 'paint';
  }, (z) => (seams.some((s) => Math.abs(z - s) < 0.015) ? 0.3 : 1));
  paint.push(fus.paint); alt.push(fus.alt); glass.push(fus.glass);

  // engine fairing on the roof, with intakes and exhaust
  const eng = skin(range(-1.95, 0.95, 12), (z) => [smooth([[-1.95, 0.16], [-1.45, 0.48], [0.25, 0.58], [0.8, 0.44], [0.95, 0.12]], z), 2.05,
    smooth([[-1.95, 2.24], [-1.3, 2.6], [0.4, 2.68], [0.95, 2.28]], z), 0.6], 20, () => 'paint');
  paint.push(eng.paint);
  for (const s of [-1, 1]) {
    rbox(trim, 0.06, 0.24, 0.55, s * 0.6, 2.42, 0.2, DARK, 0.03);
    put(trim, new THREE.CylinderGeometry(0.08, 0.095, 0.3, 10, 1, true), 0x3a3d42, s * 0.24, 2.5, -1.85, -1.4, 0, 0);
  }
  // mast and swash plate
  put(trim, new THREE.CylinderGeometry(0.1, 0.13, 0.5, 10), GREY, 0, 2.78, 0);
  put(trim, new THREE.CylinderGeometry(0.28, 0.28, 0.08, 14), STEEL, 0, 2.78, 0);

  // tail boom, tapering and rising slightly
  const boom = skin(range(-1.7, -6.95, 16), (z) => {
    const t = (z + 1.7) / -5.25, r = 0.43 + (0.15 - 0.43) * t, y = 1.55 + 0.3 * t;
    return [r, y - r, y + r, 1];
  }, 16, (z, u) => (police && u < 0.1 && u > -0.35 && z > -5.2 ? 'alt' : 'paint'));
  paint.push(boom.paint); if (boom.alt) alt.push(boom.alt);
  // fin with a swept leading edge, ventral fin, stabiliser with end plates
  plate(paint, [[-6.4, 1.75], [-6.15, 2.0], [-6.6, 3.05], [-7.05, 3.05], [-7.0, 1.9]], 0.09, 0xffffff);
  plate(paint, [[-6.55, 1.62], [-6.75, 1.02], [-7.0, 1.02], [-6.95, 1.7]], 0.07, 0xffffff);
  rbox(paint, 2.3, 0.07, 0.48, 0, 1.78, -5.45, 0xffffff, 0.03);
  for (const s of [-1, 1]) plate(alt, [[-5.25, 1.55], [-5.3, 2.08], [-5.62, 2.08], [-5.7, 1.55]], 0.05, 0xffffff, s * 1.16);
  // tail rotor gearbox
  put(trim, new THREE.CylinderGeometry(0.11, 0.11, 0.26, 10), GREY, 0.1, TAIL_ROTOR.y, TAIL_ROTOR.z, 0, 0, Math.PI / 2);

  // skids and cross tubes
  for (const s of [-1, 1]) {
    tube(trim, [[s * 1.12, 0.06, -1.75], [s * 1.12, 0.06, 0.2], [s * 1.12, 0.06, 1.75], [s * 1.12, 0.16, 2.2], [s * 1.12, 0.42, 2.42]], 0.055, STEEL);
    rbox(trim, 0.12, 0.05, 0.55, s * 1.12, 0.03, -1.35, DARK, 0.02);
    rbox(trim, 0.12, 0.05, 0.55, s * 1.12, 0.03, 1.35, DARK, 0.02);
    // step at the door
    rbox(trim, 0.28, 0.035, 0.42, s * 0.95, 0.42, 0.3, DARK, 0.015);
  }
  for (const z of [-0.95, 1.05]) tube(trim, [[1.12, 0.07, z], [1.05, 0.42, z], [0.66, 0.66, z], [-0.66, 0.66, z], [-1.05, 0.42, z], [-1.12, 0.07, z]], 0.05, STEEL);

  // cabin: floor, seats, the instrument panel and the sticks
  rbox(trim, 1.3, 0.08, 2.9, 0, 0.8, 0.55, FLOOR, 0.03);
  for (const x of [SEAT[0], -SEAT[0]]) {
    rbox(trim, 0.5, 0.12, 0.5, x, SEAT[1] - 0.06, SEAT[2], SEAT_C, 0.05);
    rbox(trim, 0.5, 0.62, 0.11, x, SEAT[1] + 0.3, SEAT[2] - 0.3, SEAT_C, 0.05, -0.12);
    rbox(trim, 0.38, 0.28, 0.28, x, SEAT[1] - 0.24, SEAT[2], DARK, 0.03);
  }
  rbox(trim, 1.45, 0.5, 0.12, 0, 1.3, -0.62, SEAT_C, 0.05, -0.1);   // rear bench back
  rbox(trim, 1.45, 0.14, 0.5, 0, 1.0, -0.38, SEAT_C, 0.05);
  rbox(trim, 1.25, 0.3, 0.32, 0, 1.22, 1.72, DARK, 0.06, 0.5);       // panel
  put(trim, new THREE.CylinderGeometry(0.018, 0.022, 0.5, 6), DARK, SEAT[0], 0.98, SEAT[2] + 0.44, 0.25);   // cyclic
  put(trim, new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), DARK, SEAT[0] + 0.34, 0.92, SEAT[2] + 0.05, 1.15);   // collective
  // screens glowing softly in the panel
  for (const x of [-0.36, 0.0, 0.36]) rbox(lamps, 0.26, 0.17, 0.02, x, 1.3, 1.575, 0x2d4a52, 0.01, 0.5);

  // details: door handles, a pitot tube, antennas, the canopy's centre pillar
  for (const s of [-1, 1]) rbox(trim, 0.03, 0.03, 0.16, s * 0.95, 1.45, 0.5, STEEL, 0.012);
  put(trim, new THREE.CylinderGeometry(0.012, 0.016, 0.42, 5), STEEL, 0.32, 1.55, 2.6, Math.PI / 2 - 0.15);
  put(trim, new THREE.CylinderGeometry(0.01, 0.02, 0.5, 5), DARK, 0, 0.42, -2.4);
  put(trim, new THREE.CylinderGeometry(0.008, 0.014, 0.6, 5), DARK, -0.15, 2.95, -1.2, -0.4);
  tube(trim, [[0, 2.2, 1.28], [0, 1.95, 1.9], [0, 1.55, 2.42], [0, 1.27, 2.74]], 0.022, DARK, 5);

  // lamps: red to port (left), green to starboard, white at the tail; landing light under the nose
  rbox(lamps, 0.07, 0.07, 0.1, 1.2, 2.1, -5.45, 0xff2a20, 0.03);
  rbox(lamps, 0.07, 0.07, 0.1, -1.2, 2.1, -5.45, 0x20ff60, 0.03);
  rbox(lamps, 0.06, 0.06, 0.06, 0, 1.9, -7.05, 0xffffff, 0.02);
  const land = put([], new THREE.CircleGeometry(0.13, 14), 0xffffff, 0.0, 0.765, 2.12, Math.PI / 2 - 0.35);
  const beacon = mergeGeometries([
    tint(new THREE.SphereGeometry(0.07, 10, 6).translate(0, 2.71, -1.1), 0xffffff),
    tint(new THREE.SphereGeometry(0.06, 10, 6).translate(0, 0.6, -0.5), 0xffffff),
  ]);
  let siren = null, light = null;
  if (police) {
    // strobes on the cross tubes and a searchlight pod under the nose
    siren = [tint(new RoundedBoxGeometry(0.2, 0.08, 0.1, 2, 0.03), 0xff2040).translate(0.7, 0.58, 1.05), tint(new RoundedBoxGeometry(0.2, 0.08, 0.1, 2, 0.03), 0x3080ff).translate(-0.7, 0.58, 1.05)];
    put(trim, new THREE.SphereGeometry(0.2, 12, 8), DARK, 0.55, 0.55, 1.95);
    light = tint(new THREE.CircleGeometry(0.15, 12), 0xffffff).rotateX(Math.PI / 2 - 0.5).translate(0.55, 0.42, 2.07);
  }

  // rotors: four blades with coloured tips, a hub; two tail blades
  const blades = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2;
    const b = tint(new RoundedBoxGeometry(ROTOR_R - 0.3, 0.05, 0.3, 1, 0.02), DARK);
    b.translate((ROTOR_R - 0.3) / 2 + 0.3, 0, 0);
    const tip = tint(new THREE.BoxGeometry(0.35, 0.052, 0.3), L.band);
    tip.translate(ROTOR_R - 0.18, 0, 0);
    for (const g of [b, tip]) { g.rotateX(0.06); g.rotateY(a); blades.push(g); }
  }
  blades.push(tint(new THREE.CylinderGeometry(0.24, 0.3, 0.2, 12), GREY), tint(new THREE.SphereGeometry(0.16, 10, 6).translate(0, 0.12, 0), STEEL));
  const tail = [];
  for (const s of [-1, 1]) tail.push(tint(new RoundedBoxGeometry(0.04, TAIL_ROTOR.r - 0.08, 0.1, 1, 0.015).translate(0, s * (TAIL_ROTOR.r / 2 + 0.04), 0), DARK));
  tail.push(tint(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8).rotateZ(Math.PI / 2), GREY));

  // the landing light (and a police searchlight lens) are lit lamps; the strobes are one mesh
  lamps.push(land);
  if (light) lamps.push(light);
  const out = {
    paint: mergeGeometries(paint), alt: mergeGeometries(alt.filter(Boolean)), glass: mergeGeometries(glass), trim: mergeGeometries(trim),
    lamps: mergeGeometries(lamps), beacon, blades: mergeGeometries(blades), tail: mergeGeometries(tail),
    disc: new THREE.CircleGeometry(ROTOR_R + 0.05, 48).rotateX(-Math.PI / 2),
    tailDisc: new THREE.CircleGeometry(TAIL_ROTOR.r, 24).rotateY(Math.PI / 2),
    siren: siren ? mergeGeometries(siren) : null,
  };
  // what the stand-in for a distance adds to the skin: the glass, skids and a still rotor, coloured
  // as they are (aPart 2; the skin is 0, coloured by the paint)
  const skids = [];
  for (const sx of [-1, 1]) rbox(skids, 0.1, 0.1, 3.9, sx * 1.12, 0.06, 0.25, STEEL, 0.03);
  rbox(skids, 2.3, 0.08, 0.1, 0, 0.4, -0.95, STEEL, 0.03); rbox(skids, 2.3, 0.08, 0.1, 0, 0.4, 1.05, STEEL, 0.03);
  rbox(skids, ROTOR_R * 2, 0.05, 0.3, 0, ROTOR_Y, 0, DARK, 0.02); rbox(skids, 0.3, 0.05, ROTOR_R * 2, 0, ROTOR_Y, 0, DARK, 0.02);
  out.farRest = mergeGeometries([tagged(tint(out.glass.clone(), 0x1c262e), 2), ...skids.map((g) => tagged(g, 2))]);
  for (const k of Object.keys(out)) if (out[k] && out[k].computeBoundingSphere) out[k].computeBoundingSphere();
  geoCache.set(livery, out);
  return out;
}
function tagged(g, k) {
  g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count).fill(k), 1));
  return g;
}

// The paint and the livery as one mesh for one machine: the livery's vertices carry the ratio of its
// colour to the paint's, so the paint material draws both (and weathers and chars both).
function bakeSkin(D, paint, band) {
  const alt = D.alt.clone(), c = alt.getAttribute('color').array;
  const r = [band.r / Math.max(paint.r, 1e-3), band.g / Math.max(paint.g, 1e-3), band.b / Math.max(paint.b, 1e-3)];
  for (let i = 0; i < c.length; i++) c[i] *= r[i % 3];
  const g = mergeGeometries([D.paint, alt]);
  g.computeBoundingSphere();
  return g;
}

// The model for one helicopter. The returned object follows buildVehicleMesh's shape where the rest of
// the game reads it (group, body, paintMat, baseColor, wheels, seat, head, tail, rider) and adds the
// moving parts.
export function buildHeliMesh(T, paintHex, livery) {
  const M = sharedMats(), D = heliGeometry(livery);
  const group = new THREE.Group(), body = new THREE.Group();
  group.add(body);
  const paintMat = new THREE.MeshPhysicalMaterial({ color: paintHex, roughness: 0.36, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06, vertexColors: true, envMapIntensity: 1.25 });
  // a civilian machine's belly is dark under a light paint and cream under a dark one
  const lum = new THREE.Color(paintHex).getHSL({}).l;
  const band = new THREE.Color(livery === 'civil' ? (lum > 0.55 ? 0x33373c : LIVERIES.civil.band) : LIVERIES[livery].band);
  const skin = bakeSkin(D, paintMat.color, band);
  const mesh = (g, m, cast = false) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = cast; body.add(o); return o; };
  const paint = mesh(skin, paintMat, true);
  const trim = mesh(D.trim, M.trim, true);
  mesh(D.lamps, M.lamps);
  const glass = mesh(D.glass, M.canopy);
  glass.renderOrder = 2;
  const beacon = mesh(D.beacon, M.beaconOff);
  // main rotor: blades, and the disc that replaces them at speed (each helicopter fades its own)
  const rotor = new THREE.Group();
  rotor.position.set(0, ROTOR_Y, 0);
  const blades = new THREE.Mesh(D.blades, M.trim);
  blades.castShadow = true;
  const discMat = new THREE.MeshBasicMaterial({ map: M.blurTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const disc = new THREE.Mesh(D.disc, discMat);
  disc.renderOrder = 3; disc.visible = false;
  rotor.add(blades, disc);
  body.add(rotor);
  const tailRotor = new THREE.Group();
  tailRotor.position.set(TAIL_ROTOR.x + 0.1, TAIL_ROTOR.y, TAIL_ROTOR.z);
  const tailBlades = new THREE.Mesh(D.tail, M.trim);
  const tailDisc = new THREE.Mesh(D.tailDisc, discMat);
  tailDisc.renderOrder = 3; tailDisc.visible = false;
  tailRotor.add(tailBlades, tailDisc);
  body.add(tailRotor);
  const strobe = D.siren ? mesh(D.siren, M.lamps) : null;
  if (strobe) strobe.visible = false;
  // the stand-in for a distance (heliWorld.js swaps between them)
  const far = new THREE.Mesh(mergeGeometries([tagged(skin.clone(), 0), D.farRest]), farMaterial(paintMat));
  far.visible = false;
  group.add(far);
  return {
    group, body, paintMat, baseColor: new THREE.Color(paintHex), casters: [paint, trim, blades],
    rotor, blades, disc, discMat, tailRotor, tailBlades, tailDisc, head: null, tail: null, beacon, strobe, far,
    beaconMats: { on: M.beaconOn, off: M.beaconOff },
    wheels: [], wheelRest: null, rider: null, riderIdx: -1, under: null, glow: null, seat: SEAT,
  };
}
// One program for every distant helicopter; each has its own material only to point at its paint.
function farMaterial(paint) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.25, envMapIntensity: 1.1 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uPaint = { value: paint.color };
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute float aPart;\nuniform vec3 uPaint;\nvoid main() {')
      .replace('#include <color_vertex>', '#include <color_vertex>\n  if (aPart < 0.5) vColor *= uPaint;');
  };
  m.customProgramCacheKey = () => 'heli-far';
  return m;
}
