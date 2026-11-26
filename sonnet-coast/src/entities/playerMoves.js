// What the operative's feet and hands meet in the world, and plans for the moves that use it.
// The player stands on the real tops of props (benches, planters, kiosks, vending machines), on bus
// shelter roofs and on car roofs, is pushed out of everything taller, and can vault low obstacles
// and climb onto ledges whose tops are within reach. Everything here only reads the world.
import * as THREE from 'three';
import { G } from '../state.js';
import { queryColliders, allColliders } from '../world/colliders.js';
import { breakables } from '../world/breakables.js';
import { groundHeight, roadAt } from '../world/roads.js';
import { CITY } from '../world/layout.js';
import { clamp } from '../util/math.js';

export const STEP_UP = 0.32;      // tops this far above the feet are stepped onto
// Props that share a generic 1.6 m collision cylinder, and how tall they really are (world/props.js).
const PROP_TOP = { bench: 0.9, bin: 0.96, hydrant: 0.8, vending: 1.95 };
export function topOf(c) {
  if (c.breakIdx !== undefined) {
    const b = breakables[c.breakIdx], h = PROP_TOP[b.kind];
    if (h !== undefined) return b.y + h;
  }
  return c.y1;
}

// Bus shelters only collide with their back wall; their roofs are added here so the player can
// climb up and stand on them. A roof reaches from the wall out towards the road (see props.js).
let roofs = null;
function findRoofs() {
  roofs = [];
  const top = CITY.y + 0.16 + 2.6;
  for (const c of allColliders) {
    if (c.type !== 'box' || c.removed || Math.abs(c.y1 - top) > 0.01) continue;
    const w = c.x1 - c.x0, d = c.z1 - c.z0;
    if (Math.min(w, d) > 0.3 || Math.max(w, d) < 4.4) continue;
    const cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2, ax = w < d ? 1 : 0, az = 1 - ax;
    const ra = roadAt(cx + ax * 3, cz + az * 3, 40), rb = roadAt(cx - ax * 3, cz - az * 3, 40);
    const sg = (ra ? ra.d : 99) < (rb ? rb.d : 99) ? 1 : -1;
    const fx = cx + ax * sg * 0.72, fz = cz + az * sg * 0.72, hx = ax ? 0.95 : 2.4, hz = az ? 0.95 : 2.4;
    roofs.push({ type: 'box', x0: fx - hx, x1: fx + hx, z0: fz - hz, z1: fz + hz, y0: top - 0.12, y1: top, roof: true });
  }
}
// Static solids around (x, z): colliders plus shelter roofs. The returned array is reused.
const _near = [];
function near(x, z, r) {
  if (!roofs) findRoofs();
  const list = queryColliders(x, z, r);
  _near.length = 0;
  for (let i = 0; i < list.length; i++) if (!list[i].removed) _near.push(list[i]);
  for (let i = 0; i < roofs.length; i++) {
    const c = roofs[i];
    if (x + r >= c.x0 && x - r <= c.x1 && z + r >= c.z0 && z - r <= c.z1) _near.push(c);
  }
  return _near;
}

// Push a circle at (x, z) whose feet are at `feet` and which is `h` tall out of everything it hits.
// out gets the corrected position; returns the deepest contact's normal and depth, or null.
const _hit = { nx: 0, nz: 0, pen: 0, c: null };
export function pushOut(x, z, r, feet, h, out) {
  const list = near(x, z, r + 1);
  let best = 0;
  for (let k = 0; k < list.length; k++) {
    const c = list[k];
    if (topOf(c) < feet + STEP_UP || feet + h < c.y0) continue;
    let nx, nz, pen;
    if (c.type === 'box') {
      const cx = Math.max(c.x0, Math.min(x, c.x1)), cz = Math.max(c.z0, Math.min(z, c.z1));
      const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
      if (d2 > r * r) continue;
      if (d2 < 1e-6) {
        const l = x - c.x0, rr = c.x1 - x, t = z - c.z0, b = c.z1 - z, m = Math.min(l, rr, t, b);
        if (m === l) { nx = -1; nz = 0; pen = l + r; } else if (m === rr) { nx = 1; nz = 0; pen = rr + r; } else if (m === t) { nx = 0; nz = -1; pen = t + r; } else { nx = 0; nz = 1; pen = b + r; }
      } else { const d = Math.sqrt(d2); nx = dx / d; nz = dz / d; pen = r - d; }
    } else {
      const dx = x - c.x, dz = z - c.z, rr = r + c.r, d2 = dx * dx + dz * dz;
      if (d2 > rr * rr) continue;
      const d = Math.sqrt(d2) || 1e-4;
      nx = dx / d; nz = dz / d; pen = rr - d;
    }
    x += nx * pen; z += nz * pen;
    if (pen > best) { best = pen; _hit.nx = nx; _hit.nz = nz; _hit.pen = pen; _hit.c = c; }
  }
  out.x = x; out.z = z;
  return best > 0 ? _hit : null;
}

// Height of whatever the feet would rest on at (x, z), looking down from `feet`; out.vehicle is
// the vehicle whose roof it is, if any.
export function supportAt(x, z, feet, out = null) {
  let g = groundHeight(x, z, feet + 0.7), veh = null;
  const list = near(x, z, 0.5), M = 0.1;
  for (let k = 0; k < list.length; k++) {
    const c = list[k], top = topOf(c);
    if (top > feet + STEP_UP || top <= g) continue;
    if (c.type === 'box' ? x >= c.x0 - M && x <= c.x1 + M && z >= c.z0 - M && z <= c.z1 + M
      : c.r >= 0.4 && (x - c.x) ** 2 + (z - c.z) ** 2 <= (c.r + M) ** 2) g = top;
  }
  for (const v of G.vehicles) {
    const top = v.pos.y + v.T.hgt;
    if (top > feet + STEP_UP || top <= g || v.sunk || v.destroyed || v.cls === 'boat') continue;
    const dx = x - v.pos.x, dz = z - v.pos.z, s = Math.sin(v.heading), c = Math.cos(v.heading);
    if (Math.abs(dx * s + dz * c) < v.T.len / 2 - 0.15 && Math.abs(-dx * c + dz * s) < v.T.wid / 2 - 0.05) { g = top; veh = v; }
  }
  if (out) out.vehicle = veh;
  return g;
}

// ---- probes ------------------------------------------------------------------------------------
// The first solid a ray from (x, z) along (dx, dz) meets within maxD (things low enough to step
// over, or whose underside is more than `under` above the feet, are ignored): entry and exit
// distance, top, and its normal.
const _r = { c: null, tIn: 0, tOut: 0, top: 0, nx: 0, nz: 0, veh: null };
// Slab test: narrows the ray's [t0, t1] to where o + d t lies in [lo, hi] on one axis, noting the
// axis it entered through and the sign of that face's normal. False for a parallel miss.
const _s = { t0: 0, t1: 0, ax: -1, n: 0 };
function slab(o, d, lo, hi, ax) {
  if (Math.abs(d) < 1e-6) return o >= lo && o <= hi;
  let a = (lo - o) / d, b = (hi - o) / d;
  if (a > b) { const q = a; a = b; b = q; }
  if (a > _s.t0) { _s.t0 = a; _s.ax = ax; _s.n = -Math.sign(d); }
  if (b < _s.t1) _s.t1 = b;
  return true;
}
function probe(x, z, dx, dz, maxD, feet, under = 1.75) {
  _r.c = null; _r.veh = null; _r.tIn = maxD;
  const list = near(x + dx * maxD * 0.5, z + dz * maxD * 0.5, maxD * 0.5 + 0.5);
  for (let k = 0; k < list.length; k++) {
    const c = list[k], top = topOf(c);
    if (top < feet + STEP_UP || c.y0 > feet + under) continue;
    let t0, t1, nx = 0, nz = 0;
    if (c.type === 'box') {
      _s.t0 = -Infinity; _s.t1 = Infinity; _s.ax = -1;
      if (!slab(x, dx, c.x0, c.x1, 0) || !slab(z, dz, c.z0, c.z1, 1) || _s.t0 > _s.t1) continue;
      t0 = _s.t0; t1 = _s.t1;
      if (_s.ax === 0) nx = _s.n; else if (_s.ax === 1) nz = _s.n;
    } else {
      const fx = x - c.x, fz = z - c.z, b = fx * dx + fz * dz, cc = fx * fx + fz * fz - c.r * c.r, disc = b * b - cc;
      if (disc < 0) continue;
      const q = Math.sqrt(disc);
      t0 = -b - q; t1 = -b + q;
      const hx = x + dx * t0 - c.x, hz = z + dz * t0 - c.z, l = Math.hypot(hx, hz) || 1;
      nx = hx / l; nz = hz / l;
    }
    if (t0 < -0.05 || t0 >= _r.tIn) continue;
    _r.c = c; _r.tIn = Math.max(0, t0); _r.tOut = t1; _r.top = top; _r.nx = nx; _r.nz = nz;
  }
  return _r.c ? _r : null;
}
// The same against parked or slow vehicles. Vaulting goes over the bonnet or boot where they are
// lower than at the roof; climbing ends up on the roof.
const _vr = { c: null, veh: null, tIn: 0, tOut: 0, top: 0, nx: 0, nz: 0 };
function probeVehicles(x, z, dx, dz, maxD, feet, roof = false) {
  let best = null;
  for (const v of G.vehicles) {
    if (v.speed > 4 || v.destroyed || v.sunk || v.cls === 'boat' || v.driver === 'player') continue;
    const ox = x - v.pos.x, oz = z - v.pos.z;
    if (ox * ox + oz * oz > (maxD + v.T.len) ** 2) continue;
    const s = Math.sin(v.heading), c = Math.cos(v.heading);
    // ray in the vehicle's frame: a = along its length, b = across
    const a0 = ox * s + oz * c, b0 = -ox * c + oz * s, da = dx * s + dz * c, db = -dx * c + dz * s;
    _s.t0 = -Infinity; _s.t1 = Infinity; _s.ax = -1;
    if (!slab(a0, da, -v.T.len / 2, v.T.len / 2, 0) || !slab(b0, db, -v.T.wid / 2, v.T.wid / 2, 1)) continue;
    const t0 = _s.t0, t1 = _s.t1, na = _s.ax === 0 ? _s.n : 0, nb = _s.ax === 1 ? _s.n : 0;
    if (t0 > t1 || t0 < -0.05 || t0 > maxD || (best && t0 >= best.tIn)) continue;
    const mid = Math.abs(a0 + da * (t0 + t1) * 0.5);
    const top = v.pos.y + v.T.hgt * (!roof && mid > v.T.len * 0.22 ? 0.72 : 1);
    if (top < feet + STEP_UP) continue;
    best = _vr;
    best.veh = v; best.tIn = Math.max(0, t0); best.tOut = t1; best.top = top; best.nx = na * s - nb * c; best.nz = na * c + nb * s;
  }
  return best;
}
// Is a body standing at (x, z) on `feet` free of walls and of anything overhead?
const _o = { x: 0, z: 0 };
function clear(x, z, feet) {
  const h = pushOut(x, z, 0.3, feet, 1.7, _o);
  return !h || h.pen < 0.04;
}
// Anything overhead between the feet and `above` (a ceiling or a roof you would climb through)?
function ceiling(x, z, feet, above) {
  const list = near(x, z, 0.1);
  for (let k = 0; k < list.length; k++) {
    const c = list[k];
    if (c.y0 <= feet + 1.2 || c.y0 > above) continue;
    if (c.type === 'box' ? x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1 : (x - c.x) ** 2 + (z - c.z) ** 2 <= c.r * c.r) return true;
  }
  return false;
}

// ---- move plans --------------------------------------------------------------------------------
// Vault over a low obstacle ahead (or a parked car across it). Returns the plan or null.
export function planVault(pl, dx, dz, reach) {
  const x = pl.pos.x, z = pl.pos.z, feet = pl.pos.y;
  let h = probe(x, z, dx, dz, reach, feet);
  const hv = probeVehicles(x, z, dx, dz, reach, feet);
  if (hv && (!h || hv.tIn < h.tIn)) h = hv;
  if (!h) return null;
  const rise = h.top - feet;
  if (rise < 0.45 || rise > (h.veh ? 1.55 : 1.35)) return null;
  const depth = h.tOut - h.tIn;
  const veh = h.veh, top = h.top, tIn = h.tIn, tOut = h.tOut;
  if (depth > (veh ? 2.6 : 2.4)) return veh ? null : planClimb(pl, dx, dz, h, true);
  // land a little beyond the far side, on whatever is there (dropping down is fine)
  const ex = x + dx * (tOut + 0.6), ez = z + dz * (tOut + 0.6);
  const gl = supportAt(ex, ez, top - 0.25);
  if (gl > top - 0.25 || !clear(ex, ez, gl) || ceiling(x + dx * (tIn + tOut) * 0.5, z + dz * (tIn + tOut) * 0.5, top - 1.3, top + 1.8)) return null;
  // nothing else in the way between the obstacle and the landing
  const after = probe(x + dx * (tOut + 0.02), z + dz * (tOut + 0.02), dx, dz, 0.6, gl);
  if (after && after.top > gl + 0.4) return null;
  const run = tOut + 0.6, speed = Math.max(pl.speed, 5.2);
  const lx = -dz, lz = dx;   // to the left of the direction of travel
  const px = x + dx * (tIn + 0.12), pz = z + dz * (tIn + 0.12);
  return {
    kind: 'vault', sx: x, sz: z, sy: feet, ex, ez, ey: gl, top, dx, dz, veh,
    dur: clamp(run / speed + 0.08, 0.42, 0.85), uIn: clamp(tIn / run, 0.08, 0.5), uOut: clamp((tOut + 0.15) / run, 0.45, 0.85),
    plantL: new THREE.Vector3(px + lx * 0.19, top, pz + lz * 0.19), plantR: new THREE.Vector3(px - lx * 0.19, top, pz - lz * 0.19),
    exitSpeed: speed,
  };
}

// Climb onto (or over) the ledge ahead. `low` plans a mantle onto something waist high; otherwise
// the top must be between minRise and maxRise above the feet.
export function planClimb(pl, dx, dz, hit = null, low = false, minRise = 1.3, maxRise = 2.7, reach = 0.85) {
  const x = pl.pos.x, z = pl.pos.z, feet = pl.pos.y;
  let h = hit;
  if (!h) {
    // things overhead count here: a shelter roof can be grabbed from below its edge
    h = probe(x, z, dx, dz, reach, feet, maxRise);
    const hv = probeVehicles(x, z, dx, dz, reach, feet, true);
    if (hv && (!h || hv.tIn < h.tIn)) h = hv;
  }
  let top, tIn, depth, nx, nz;
  if (h) { top = h.top; tIn = h.tIn; depth = h.tOut - h.tIn; nx = h.nx; nz = h.nz; } else {
    // a step in the ground itself: a quay, a terrace, a pier deck
    let d = 0.15;
    for (; d <= reach; d += 0.1) if (groundHeight(x + dx * d, z + dz * d, feet + maxRise + 0.2) - feet > minRise - 0.05) break;
    if (d > reach) return null;
    top = groundHeight(x + dx * (d + 0.45), z + dz * (d + 0.45), feet + maxRise + 0.2);
    tIn = d - 0.05; depth = 9; nx = -dx; nz = -dz;
  }
  const rise = top - feet;
  if (!low && (rise < minRise || rise > maxRise)) return null;
  // square up to the face we are climbing
  const fl = Math.hypot(nx, nz) || 1;
  const fx = -nx / fl, fz = -nz / fl;
  if (fx * dx + fz * dz < 0.5) return null;
  const wx = x + dx * tIn, wz = z + dz * tIn;
  if (ceiling(x, z, feet, top + 1.8)) return null;
  // stand on top just past the edge; a thin wall with nothing to stand on is climbed over instead
  let sx = wx + fx * 0.42, sz = wz + fz * 0.42, over = false, sy = top;
  const sup = supportAt(sx, sz, top + 0.05);
  if (Math.abs(sup - top) > 0.15 || !clear(sx, sz, top)) {
    if (depth > 0.6 || h?.veh) return null;
    sx = wx + fx * (depth + 0.45); sz = wz + fz * (depth + 0.45);
    sy = supportAt(sx, sz, top - 0.3);
    if (sy > top - 0.3 || !clear(sx, sz, sy)) return null;
    over = true;
  }
  const lx = -fz, lz = fx;
  const gx = wx + fx * 0.03, gz = wz + fz * 0.03;
  return {
    kind: low ? 'mantle' : 'climb', sx: x, sz: z, sy: feet, hx: wx - fx * 0.3, hz: wz - fz * 0.3, tx: sx, tz: sz, ty: sy, top, over,
    heading: Math.atan2(fx, fz), dur: low ? 0.55 : clamp(0.78 + (rise - 1.3) * 0.2, 0.78, 1.05),
    gripL: new THREE.Vector3(gx + lx * 0.21, top + 0.02, gz + lz * 0.21), gripR: new THREE.Vector3(gx - lx * 0.21, top + 0.02, gz - lz * 0.21),
  };
}

// A wall right ahead that is too tall to climb (for kicking off it mid-air).
export function wallAhead(pl, dx, dz) {
  const h = probe(pl.pos.x, pl.pos.z, dx, dz, 0.75, pl.pos.y);
  return h && h.top - pl.pos.y > 2.2 ? h : null;
}
