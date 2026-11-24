export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const TAU = Math.PI * 2;
export function wrapAngle(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}
export function angleTo(fromX, fromZ, toX, toZ) {
  // heading convention: forward = (sin h, cos h)
  return Math.atan2(toX - fromX, toZ - fromZ);
}
export const dist2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };
export const dist = (ax, az, bx, bz) => Math.sqrt(dist2(ax, az, bx, bz));
// Frame-rate independent exponential smoothing factor.
export const damp = (rate, dt) => 1 - Math.exp(-rate * dt);

// Closest point on segment ab to p; returns t in [0,1] and squared distance.
export function segProject(px, pz, ax, az, bx, bz) {
  const abx = bx - ax, abz = bz - az;
  const len2 = abx * abx + abz * abz || 1e-9;
  let t = ((px - ax) * abx + (pz - az) * abz) / len2;
  t = clamp(t, 0, 1);
  const cx = ax + abx * t, cz = az + abz * t;
  const dx = px - cx, dz = pz - cz;
  return { t, d2: dx * dx + dz * dz, cx, cz };
}

// Catmull-Rom resampling of a polyline of {x,z} at roughly `step` spacing.
export function catmullRom(points, step = 6, closed = false) {
  const out = [];
  const n = points.length;
  const get = (i) => {
    if (closed) return points[(i + n) % n];
    return points[clamp(i, 0, n - 1)];
  };
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const len = Math.hypot(p2.x - p1.x, p2.z - p1.z);
    const steps = Math.max(1, Math.ceil(len / step));
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), z: f(p0.z, p1.z, p2.z, p3.z) });
    }
  }
  if (!closed) out.push({ x: points[n - 1].x, z: points[n - 1].z });
  return out;
}

export function formatTokens(n) {
  return Math.floor(n).toLocaleString('en-US');
}
