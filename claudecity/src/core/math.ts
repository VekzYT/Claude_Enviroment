// Small maths helpers and the heading convention (see core/types.ts).

export const TAU = Math.PI * 2;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
/** Frame-rate independent approach: moves `a` towards `b`, covering 63% of the gap every 1/rate seconds. */
export function damp(a: number, b: number, rate: number, dt: number): number {
  return b + (a - b) * Math.exp(-rate * dt);
}
/** Wraps an angle into (-PI, PI]. */
export function wrapAngle(a: number): number {
  a = a % TAU;
  if (a > Math.PI) a -= TAU;
  else if (a <= -Math.PI) a += TAU;
  return a;
}
/** The shortest signed turn from heading `a` to heading `b`. */
export function angleDiff(a: number, b: number): number {
  return wrapAngle(b - a);
}
export function dampAngle(a: number, b: number, rate: number, dt: number): number {
  return a + angleDiff(a, b) * (1 - Math.exp(-rate * dt));
}
/** Forward unit vector of a heading: (fwdX(yaw), 0, fwdZ(yaw)). */
export function fwdX(yaw: number): number {
  return Math.sin(yaw);
}
export function fwdZ(yaw: number): number {
  return Math.cos(yaw);
}
/** Right-hand unit vector of a heading: (rightX(yaw), 0, rightZ(yaw)). */
export function rightX(yaw: number): number {
  return -Math.cos(yaw);
}
export function rightZ(yaw: number): number {
  return Math.sin(yaw);
}
/** The heading that faces from (ax, az) towards (bx, bz). */
export function headingTo(ax: number, az: number, bx: number, bz: number): number {
  return Math.atan2(bx - ax, bz - az);
}
export function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  return dx * dx + dz * dz;
}
export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
