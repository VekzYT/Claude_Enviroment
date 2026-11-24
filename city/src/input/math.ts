// Pure camera and gesture math for the input module. No DOM and no three.js objects here, so it is
// unit-testable in Node. Functions that run per frame or per pointer event write into caller-owned
// objects instead of allocating.
//
// Conventions (match src/core and the renderer):
// * World: x east, z south, ground at y = 0, 1 tile = 1 unit.
// * The camera orbits a ground target. yaw is the angle around the vertical axis, pitch the angle
//   above the ground, distance the length of the boom. The camera sits at
//   target + distance * (cos(pitch) sin(yaw), sin(pitch), cos(pitch) cos(yaw)) and looks at target.
// * Screen points are CSS pixels relative to the canvas, x right, y down. NDC is x right, y up, -1..1.
// * Lens fov is the vertical field of view in degrees (three.js PerspectiveCamera convention).

export interface RigView {
  tx: number;
  tz: number;
  yaw: number;
  pitch: number;
  distance: number;
}

export interface Lens {
  /** Vertical field of view in degrees. */
  fov: number;
  /** Width / height. */
  aspect: number;
  /** three.js camera.zoom (1 = none). */
  zoom: number;
}

export interface XZ {
  x: number;
  z: number;
}

export interface XY {
  x: number;
  y: number;
}

export interface RigLimits {
  minDistance: number;
  maxDistance: number;
  minPitch: number;
  maxPitch: number;
  /** The target is kept inside [0, mapSize] on both axes. */
  mapSize: number;
}

export const MIN_DISTANCE = 8;
export const MAX_DISTANCE = 90;
export const MIN_PITCH = 0.55;
export const MAX_PITCH = 1.35;
export const DEFAULT_YAW = Math.PI / 4;
export const DEFAULT_PITCH = 0.95;
export const DEFAULT_DISTANCE = 38;
/** The renderer's camera fov; used until a real camera has been seen by rig.apply(). */
export const DEFAULT_FOV = 40;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Angle wrapped into (-PI, PI]. */
export function wrapAngle(a: number): number {
  const t = Math.PI * 2;
  a = a % t;
  if (a <= -Math.PI) a += t;
  else if (a > Math.PI) a -= t;
  return a;
}

export function limitsFor(mapSize: number): RigLimits {
  const size = Number.isFinite(mapSize) && mapSize > 0 ? mapSize : 64;
  return {
    minDistance: MIN_DISTANCE,
    // a bigger map than the standard 64 may be zoomed out further so all of it still fits
    maxDistance: Math.max(MAX_DISTANCE, size * 1.4),
    minPitch: MIN_PITCH,
    maxPitch: MAX_PITCH,
    mapSize: size,
  };
}

export function defaultView(mapSize: number): RigView {
  return { tx: mapSize / 2, tz: mapSize / 2, yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance: DEFAULT_DISTANCE };
}

export function copyView(src: RigView, dst: RigView): RigView {
  dst.tx = src.tx;
  dst.tz = src.tz;
  dst.yaw = src.yaw;
  dst.pitch = src.pitch;
  dst.distance = src.distance;
  return dst;
}

/** Keep a view inside the limits. Non-finite values (a bad external write) fall back to safe ones. */
export function clampView(v: RigView, lim: RigLimits): RigView {
  const n = lim.mapSize;
  v.tx = Number.isFinite(v.tx) ? clamp(v.tx, 0, n) : n / 2;
  v.tz = Number.isFinite(v.tz) ? clamp(v.tz, 0, n) : n / 2;
  v.yaw = Number.isFinite(v.yaw) ? v.yaw : DEFAULT_YAW;
  v.pitch = Number.isFinite(v.pitch) ? clamp(v.pitch, lim.minPitch, lim.maxPitch) : DEFAULT_PITCH;
  v.distance = Number.isFinite(v.distance) ? clamp(v.distance, lim.minDistance, lim.maxDistance) : DEFAULT_DISTANCE;
  return v;
}

/** Camera position for a view. */
export function cameraPosition(v: RigView, out: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  const h = Math.cos(v.pitch) * v.distance;
  out.x = v.tx + Math.sin(v.yaw) * h;
  out.y = Math.sin(v.pitch) * v.distance;
  out.z = v.tz + Math.cos(v.yaw) * h;
  return out;
}

/** CSS pixels (relative to a w × h canvas) to NDC. */
export function toNdc(x: number, y: number, w: number, h: number, out: XY): XY {
  out.x = (x / w) * 2 - 1;
  out.y = 1 - (y / h) * 2;
  return out;
}

/** NDC to CSS pixels. */
export function fromNdc(nx: number, ny: number, w: number, h: number, out: XY): XY {
  out.x = ((nx + 1) / 2) * w;
  out.y = ((1 - ny) / 2) * h;
  return out;
}

/**
 * The ground point (y = 0) seen through NDC point (nx, ny), or null when that ray does not meet the
 * ground in front of the camera (above the horizon). Same result as three's Raycaster.setFromCamera
 * + intersectPlane for a camera placed by the rig, without building any objects.
 */
export function groundAt(v: RigView, lens: Lens, nx: number, ny: number, out: XZ): XZ | null {
  const cp = Math.cos(v.pitch);
  const sp = Math.sin(v.pitch);
  const cy = Math.cos(v.yaw);
  const sy = Math.sin(v.yaw);
  // u: unit vector from target to camera; r: camera right; up: camera up (u × r)
  const ux = cp * sy;
  const uy = sp;
  const uz = cp * cy;
  const rx = cy;
  const rz = -sy;
  const upx = -sp * sy;
  const upy = cp;
  const upz = -sp * cy;
  const th = Math.tan((lens.fov * Math.PI) / 360) / (lens.zoom > 0 ? lens.zoom : 1);
  const ax = nx * th * lens.aspect;
  const ay = ny * th;
  const dx = -ux + rx * ax + upx * ay;
  const dy = -uy + upy * ay;
  const dz = -uz + rz * ax + upz * ay;
  if (dy > -1e-6) return null;
  const camY = sp * v.distance;
  const t = camY / -dy;
  out.x = v.tx + ux * v.distance + dx * t;
  out.z = v.tz + uz * v.distance + dz * t;
  return out;
}

/** Where a ground point appears on screen, in NDC, or null if it is behind the camera. */
export function projectGround(v: RigView, lens: Lens, x: number, z: number, out: XY): XY | null {
  const cp = Math.cos(v.pitch);
  const sp = Math.sin(v.pitch);
  const cy = Math.cos(v.yaw);
  const sy = Math.sin(v.yaw);
  const ux = cp * sy;
  const uy = sp;
  const uz = cp * cy;
  // vector from the camera to the point
  const px = x - (v.tx + ux * v.distance);
  const py = -uy * v.distance;
  const pz = z - (v.tz + uz * v.distance);
  const depth = -(px * ux + py * uy + pz * uz);
  if (depth <= 1e-6) return null;
  const xr = px * cy - pz * sy;
  const yu = -px * sp * sy + py * cp - pz * sp * cy;
  const th = Math.tan((lens.fov * Math.PI) / 360) / (lens.zoom > 0 ? lens.zoom : 1);
  out.x = xr / (depth * th * lens.aspect);
  out.y = yu / (depth * th);
  return out;
}

/** Ground direction of the screen's right edge for a yaw (unit vector in x, z). */
export function screenRight(yaw: number, out: XZ): XZ {
  out.x = Math.cos(yaw);
  out.z = -Math.sin(yaw);
  return out;
}

/** Ground direction the camera faces, i.e. "up the screen" (unit vector in x, z). */
export function screenForward(yaw: number, out: XZ): XZ {
  out.x = -Math.sin(yaw);
  out.z = -Math.cos(yaw);
  return out;
}

/**
 * Zoom about a ground point: scale the boom by k and pull the target along so the ground point
 * stays put on screen. With yaw and pitch fixed this is exact (a homothety centred on the point).
 * The distance is clamped; returns the scale that was actually applied.
 */
export function zoomAbout(v: RigView, gx: number, gz: number, k: number, lim: RigLimits): number {
  if (!(k > 0) || !Number.isFinite(k)) return 1;
  const d = clamp(v.distance * k, lim.minDistance, lim.maxDistance);
  const kk = d / v.distance;
  v.tx = gx + (v.tx - gx) * kk;
  v.tz = gz + (v.tz - gz) * kk;
  v.distance = d;
  return kk;
}

/**
 * Turn the whole rig by `a` radians of yaw around the vertical axis through a ground point, so that
 * point stays put on screen. Positive `a` turns the picture clockwise on screen.
 */
export function rotateAbout(v: RigView, gx: number, gz: number, a: number): void {
  if (!Number.isFinite(a) || a === 0) return;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const x = v.tx - gx;
  const z = v.tz - gz;
  v.tx = gx + x * c + z * s;
  v.tz = gz - x * s + z * c;
  v.yaw += a;
}

export interface TwoFingerStep {
  /** Midpoint before and after. */
  mx0: number;
  my0: number;
  mx1: number;
  my1: number;
  /** Finger spread after / before (> 1 = fingers moved apart = zoom in). */
  scale: number;
  /** Change in the angle of the line between the fingers, radians, positive = clockwise on screen. */
  twist: number;
}

/** Below this finger separation (px) the angle and spread are too noisy to use. */
const MIN_SPREAD = 12;

/** Decompose a two-finger move p1,p2 → q1,q2 into midpoint pan, pinch scale and twist. */
export function twoFingerStep(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  q1x: number,
  q1y: number,
  q2x: number,
  q2y: number,
  out: TwoFingerStep,
): TwoFingerStep {
  const ax = p2x - p1x;
  const ay = p2y - p1y;
  const bx = q2x - q1x;
  const by = q2y - q1y;
  const la = Math.hypot(ax, ay);
  const lb = Math.hypot(bx, by);
  const usable = la >= MIN_SPREAD && lb >= MIN_SPREAD;
  out.mx0 = (p1x + p2x) / 2;
  out.my0 = (p1y + p2y) / 2;
  out.mx1 = (q1x + q2x) / 2;
  out.my1 = (q1y + q2y) / 2;
  out.scale = usable ? lb / la : 1;
  out.twist = usable ? wrapAngle(Math.atan2(by, bx) - Math.atan2(ay, ax)) : 0;
  return out;
}

export type TwoFingerMode = 'pending' | 'tilt' | 'transform';

const scratchStep: TwoFingerStep = { mx0: 0, my0: 0, mx1: 0, my1: 0, scale: 1, twist: 0 };

/**
 * Decide what a two-finger gesture is from where the fingers started (s1, s2) and are now (q1, q2).
 * 'tilt': both fingers slide the same way, mostly vertically, side by side, without pinching or
 * twisting. 'transform': anything else (pan + pinch + twist together). 'pending' until either
 * finger has moved `slop` px.
 */
export function classifyTwoFinger(
  s1x: number,
  s1y: number,
  s2x: number,
  s2y: number,
  q1x: number,
  q1y: number,
  q2x: number,
  q2y: number,
  slop: number,
): TwoFingerMode {
  const d1x = q1x - s1x;
  const d1y = q1y - s1y;
  const d2x = q2x - s2x;
  const d2y = q2y - s2y;
  if (Math.max(Math.hypot(d1x, d1y), Math.hypot(d2x, d2y)) < slop) return 'pending';
  const a1 = Math.abs(d1y);
  const a2 = Math.abs(d2y);
  const vertical = a1 > 1.5 * Math.abs(d1x) && a2 > 1.5 * Math.abs(d2x);
  const together = d1y * d2y > 0 && Math.min(a1, a2) > 0.5 * Math.max(a1, a2);
  const sideBySide = Math.abs(s2x - s1x) > Math.abs(s2y - s1y);
  const st = twoFingerStep(s1x, s1y, s2x, s2y, q1x, q1y, q2x, q2y, scratchStep);
  const steady = Math.abs(st.scale - 1) < 0.12 && Math.abs(st.twist) < 0.15;
  return vertical && together && sideBySide && steady ? 'tilt' : 'transform';
}

/** Position and velocity of one smoothed channel. */
export interface SpringState {
  x: number;
  v: number;
}

/**
 * Advance a critically damped spring toward `goal` by dt seconds (exact solution, stable for any
 * dt). smoothTime is roughly how long it takes to cover most of the way; it never overshoots when
 * starting from rest.
 */
export function springStep(s: SpringState, goal: number, smoothTime: number, dt: number): SpringState {
  if (!(smoothTime > 0)) {
    s.x = goal;
    s.v = 0;
    return s;
  }
  const w = 2 / smoothTime;
  const c = s.x - goal;
  const e = Math.exp(-w * dt);
  const tmp = (s.v + w * c) * dt;
  s.x = goal + (c + tmp) * e;
  s.v = (s.v - w * tmp) * e;
  return s;
}

/**
 * How deep a coordinate is inside the edge band of a span [0, size]: -1..0 near the start, 0 in the
 * middle, 0..1 near the end. Used for auto-panning while a drag nears the screen edge.
 */
export function edgeDepth(v: number, size: number, band: number): number {
  if (!(size > band * 2)) return 0;
  if (v < band) return -clamp((band - v) / band, 0, 1);
  if (v > size - band) return clamp((v - (size - band)) / band, 0, 1);
  return 0;
}
