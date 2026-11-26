// Static collision: axis-aligned boxes (buildings, walls) and vertical cylinders
// (trees, poles) bucketed in a uniform grid.
const CELL = 32;
const grid = new Map();
const key = (i, j) => i * 92821 + j;
export const allColliders = [];

function insert(c, x0, z0, x1, z1) {
  c.cells = [];
  for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++)
    for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) {
      const k = key(i, j);
      let l = grid.get(k);
      if (!l) { l = []; grid.set(k, l); }
      l.push(c);
      c.cells.push(l);
    }
  allColliders.push(c);
  return c;
}

export function addBox(x0, z0, x1, z1, y0, y1, data = {}) {
  return insert({ type: 'box', x0, z0, x1, z1, y0, y1, ...data }, x0, z0, x1, z1);
}
export function addCircle(x, z, r, y0, y1, data = {}) {
  return insert({ type: 'circle', x, z, r, y0, y1, ...data }, x - r, z - r, x + r, z + r);
}
export function removeCollider(c) {
  if (c.removed) return;
  c.removed = true;
  for (const l of c.cells) {
    const i = l.indexOf(c);
    if (i >= 0) l.splice(i, 1);
  }
}
// Put a removed collider back where it was (rooms and props that come and go keep their own).
export function restoreCollider(c) {
  if (!c.removed) return;
  c.removed = false;
  for (const l of c.cells) l.push(c);
}

const tmp = [];
let stamp = 0;
// All colliders overlapping the square around (x,z) of half-size r.
export function queryColliders(x, z, r) {
  tmp.length = 0;
  stamp++;
  for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++)
    for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) {
      const l = grid.get(key(i, j));
      if (!l) continue;
      for (let k = 0; k < l.length; k++) {
        const c = l[k];
        if (c._stamp === stamp) continue;
        c._stamp = stamp;
        tmp.push(c);
      }
    }
  return tmp;
}

// Push a circle (x,z,r) at height y out of static geometry. Returns the deepest contact or null.
// out receives the corrected position. If breakSpeed > 0, breakable props slower-rated than that
// are not solid: their indices are collected in out.broken instead.
export function resolveCircle(x, z, r, y, out, heightAbove = 1.5, breakSpeed = 0) {
  const list = queryColliders(x, z, r + 1);
  let hit = null;
  if (out.broken) out.broken.length = 0; else out.broken = [];
  for (let k = 0; k < list.length; k++) {
    const c = list[k];
    if (y + heightAbove < c.y0 || y > c.y1) continue;
    let nx, nz, pen;
    if (c.type === 'box') {
      const cx = Math.max(c.x0, Math.min(x, c.x1));
      const cz = Math.max(c.z0, Math.min(z, c.z1));
      const dx = x - cx, dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 > r * r) continue;
      if (d2 < 1e-6) {
        // Centre inside the box: push out along the shortest axis.
        const l = x - c.x0, rr = c.x1 - x, t = z - c.z0, b = c.z1 - z;
        const m = Math.min(l, rr, t, b);
        if (m === l) { nx = -1; nz = 0; pen = l + r; }
        else if (m === rr) { nx = 1; nz = 0; pen = rr + r; }
        else if (m === t) { nx = 0; nz = -1; pen = t + r; }
        else { nx = 0; nz = 1; pen = b + r; }
      } else {
        const d = Math.sqrt(d2);
        nx = dx / d; nz = dz / d; pen = r - d;
      }
    } else {
      const dx = x - c.x, dz = z - c.z;
      const rr = r + c.r;
      const d2 = dx * dx + dz * dz;
      if (d2 > rr * rr) continue;
      if (breakSpeed > 0 && c.breakIdx !== undefined && breakSpeed >= c.breakMin) { out.broken.push(c.breakIdx); continue; }
      const d = Math.sqrt(d2) || 1e-4;
      nx = dx / d; nz = dz / d; pen = rr - d;
    }
    x += nx * pen; z += nz * pen;
    if (!hit || pen > hit.pen) hit = { nx, nz, pen, c };
  }
  out.x = x; out.z = z;
  return hit;
}

// True if the segment between two points at height y is blocked by a box collider.
export function segmentBlocked(ax, az, bx, bz, y = 2) {
  const len = Math.hypot(bx - ax, bz - az);
  const steps = Math.ceil(len / 8);
  stamp++;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = ax + (bx - ax) * t, pz = az + (bz - az) * t;
    const l = grid.get(key(Math.floor(px / CELL), Math.floor(pz / CELL)));
    if (!l) continue;
    for (const c of l) {
      if (c.type !== 'box' || c._stamp === stamp) continue;
      c._stamp = stamp;
      if (y < c.y0 || y > c.y1) continue;
      if (segBox(ax, az, bx, bz, c)) return true;
    }
  }
  return false;
}
function segBox(ax, az, bx, bz, c) {
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dz = bz - az;
  const clip = (p, q) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
    else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  return clip(-dx, ax - c.x0) && clip(dx, c.x1 - ax) && clip(-dz, az - c.z0) && clip(dz, c.z1 - az) && t0 <= t1;
}

// Ray against box colliders, returns distance or Infinity (2D, height-checked).
export function rayBoxes(ox, oy, oz, dx, dy, dz, maxD) {
  let best = maxD;
  const steps = Math.ceil(maxD / 16);
  stamp++;
  for (let s = 0; s <= steps; s++) {
    const px = ox + dx * s * 16, pz = oz + dz * s * 16;
    for (let oi = -1; oi <= 1; oi++) for (let oj = -1; oj <= 1; oj++) {
      const l = grid.get(key(Math.floor(px / CELL) + oi, Math.floor(pz / CELL) + oj));
      if (!l) continue;
      for (const c of l) {
        if (c._stamp === stamp) continue;
        c._stamp = stamp;
        const t = c.type === 'box' ? rayAabb(ox, oy, oz, dx, dy, dz, c) : rayCyl(ox, oy, oz, dx, dy, dz, c);
        if (t < best) best = t;
      }
    }
  }
  return best;
}
function rayAabb(ox, oy, oz, dx, dy, dz, c) {
  let tmin = 0, tmax = Infinity;
  const axes = [[ox, dx, c.x0, c.x1], [oy, dy, c.y0, c.y1], [oz, dz, c.z0, c.z1]];
  for (const [o, d, lo, hi] of axes) {
    if (Math.abs(d) < 1e-8) { if (o < lo || o > hi) return Infinity; continue; }
    let t1 = (lo - o) / d, t2 = (hi - o) / d;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}
function rayCyl(ox, oy, oz, dx, dy, dz, c) {
  const fx = ox - c.x, fz = oz - c.z;
  const a = dx * dx + dz * dz;
  if (a < 1e-8) return Infinity;
  const b = 2 * (fx * dx + fz * dz);
  const cc = fx * fx + fz * fz - c.r * c.r;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return Infinity;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  if (t < 0) return Infinity;
  const y = oy + dy * t;
  return y >= c.y0 && y <= c.y1 ? t : Infinity;
}
