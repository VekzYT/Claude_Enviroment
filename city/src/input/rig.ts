// The orbiting camera rig. It keeps two views: `goal` (where the camera is heading) and the current
// view (what is on screen; `target` mirrors its ground point). Each channel follows its goal with a
// critically damped spring, so wheel zoom, keys and focus() glide. Finger gestures edit the goal and
// call direct(), which moves the view there at once: the ground stays glued to the fingers.
import * as THREE from 'three';
import type { CameraRig } from './index';
import {
  type Lens,
  type RigLimits,
  type RigView,
  type SpringState,
  DEFAULT_FOV,
  clamp,
  clampView,
  cameraPosition,
  copyView,
  defaultView,
  limitsFor,
  springStep,
} from './math';

/** Smoothing times (seconds, roughly the time to cover most of the way). */
const SMOOTH_PAN = 0.1;
const SMOOTH_FOCUS = 0.2;
const SMOOTH_ROTATE = 0.09;
const SMOOTH_ZOOM = 0.1;
/** Fling inertia decays by e^(-FLING_DECAY * t): a fling coasts about v / FLING_DECAY world units. */
const FLING_DECAY = 4;

type Channel = 'tx' | 'tz' | 'yaw' | 'pitch' | 'distance';

export class OrbitRig implements CameraRig {
  readonly target = new THREE.Vector3();
  /** Where the camera is heading. Gesture code edits it, then calls direct() or glide(). */
  readonly goal: RigView;
  /** The camera seen by the renderer through apply(). */
  camera: THREE.PerspectiveCamera | null = null;
  /** Bumped whenever the current view changes (so callers can tell the picture moved). */
  rev = 0;

  private readonly view: RigView;
  private readonly vel: Record<Channel, number> = { tx: 0, tz: 0, yaw: 0, pitch: 0, distance: 0 };
  private lim: RigLimits;
  private panSmooth = SMOOTH_PAN;
  private anchorOn = false;
  private anchorX = 0;
  private anchorZ = 0;
  private flingOn = false;
  private fvx = 0;
  private fvz = 0;
  /** The target values we last wrote, to notice when someone edits rig.target directly. */
  private writtenX = NaN;
  private writtenZ = NaN;
  private readonly spring: SpringState = { x: 0, v: 0 };
  private readonly pos = { x: 0, y: 0, z: 0 };

  constructor(mapSize: number) {
    this.lim = limitsFor(mapSize);
    this.view = defaultView(this.lim.mapSize);
    this.goal = defaultView(this.lim.mapSize);
    this.writeTarget();
  }

  // ---- CameraRig ----

  get yaw(): number {
    return this.view.yaw;
  }
  set yaw(v: number) {
    if (!Number.isFinite(v)) return;
    this.view.yaw = this.goal.yaw = v;
    this.vel.yaw = 0;
    this.rev++;
  }

  get pitch(): number {
    return this.view.pitch;
  }
  set pitch(v: number) {
    if (!Number.isFinite(v)) return;
    this.view.pitch = this.goal.pitch = clamp(v, this.lim.minPitch, this.lim.maxPitch);
    this.vel.pitch = 0;
    this.rev++;
  }

  get distance(): number {
    return this.view.distance;
  }
  set distance(v: number) {
    if (!Number.isFinite(v)) return;
    this.view.distance = this.goal.distance = clamp(v, this.lim.minDistance, this.lim.maxDistance);
    this.vel.distance = 0;
    this.anchorOn = false;
    this.rev++;
  }

  focus(x: number, z: number): void {
    this.sync();
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    this.flingOn = false;
    this.anchorOn = false;
    this.goal.tx = x + 0.5;
    this.goal.tz = z + 0.5;
    clampView(this.goal, this.lim);
    this.panSmooth = SMOOTH_FOCUS;
  }

  update(dt: number): void {
    this.sync();
    const step = Number.isFinite(dt) ? clamp(dt, 0, 0.1) : 0;
    if (step <= 0) return;
    const v = this.view;
    const g = this.goal;
    const n = this.lim.mapSize;
    const bx = v.tx;
    const bz = v.tz;
    const byaw = v.yaw;
    const bp = v.pitch;
    const bd = v.distance;

    // inertia after a fling moves view and goal together and fades out
    if (this.flingOn) {
      const dx = this.fvx * step;
      const dz = this.fvz * step;
      g.tx = clamp(g.tx + dx, 0, n);
      g.tz = clamp(g.tz + dz, 0, n);
      v.tx = clamp(v.tx + dx, 0, n);
      v.tz = clamp(v.tz + dz, 0, n);
      if (g.tx <= 0 || g.tx >= n) this.fvx = 0;
      if (g.tz <= 0 || g.tz >= n) this.fvz = 0;
      const k = Math.exp(-FLING_DECAY * step);
      this.fvx *= k;
      this.fvz *= k;
      if (Math.hypot(this.fvx, this.fvz) < Math.max(0.25, v.distance * 0.015)) this.flingOn = false;
    }

    // zoom; with an anchor (wheel at the cursor) the target is pulled along so the ground point
    // under the cursor stays there for the whole glide
    const d0 = v.distance;
    v.distance = this.chase(v.distance, g.distance, 'distance', SMOOTH_ZOOM, step);
    if (this.anchorOn) {
      const k = v.distance / d0;
      if (k !== 1) {
        v.tx = this.anchorX + (v.tx - this.anchorX) * k;
        v.tz = this.anchorZ + (v.tz - this.anchorZ) * k;
        g.tx = clamp(this.anchorX + (g.tx - this.anchorX) * k, 0, n);
        g.tz = clamp(this.anchorZ + (g.tz - this.anchorZ) * k, 0, n);
      }
      if (v.distance === g.distance) this.anchorOn = false;
    }
    v.yaw = this.chase(v.yaw, g.yaw, 'yaw', SMOOTH_ROTATE, step);
    v.pitch = this.chase(v.pitch, g.pitch, 'pitch', SMOOTH_ROTATE, step);
    v.tx = this.chase(v.tx, g.tx, 'tx', this.panSmooth, step);
    v.tz = this.chase(v.tz, g.tz, 'tz', this.panSmooth, step);
    if (v.tx === g.tx && v.tz === g.tz) this.panSmooth = SMOOTH_PAN;
    clampView(v, this.lim);
    this.normalizeYaw();
    if (v.tx !== bx || v.tz !== bz || v.yaw !== byaw || v.pitch !== bp || v.distance !== bd) {
      this.writeTarget();
      this.rev++;
    }
  }

  apply(camera: THREE.PerspectiveCamera): void {
    this.sync();
    this.camera = camera;
    const v = this.view;
    cameraPosition(v, this.pos);
    camera.position.set(this.pos.x, this.pos.y, this.pos.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(v.tx, 0, v.tz);
    // near grows with the boom (depth precision), far reaches the farthest map corner and the fog
    const near = Math.round(clamp(v.distance * 0.025, 0.1, 2) * 100) / 100;
    const far = Math.ceil(Math.max(v.distance * 4 + 60, v.distance + this.lim.mapSize * 1.5 + 20) / 10) * 10;
    if (camera.near !== near || camera.far !== far) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
  }

  // ---- extras used by the input controller (and available to main) ----

  /** The current view (what is on screen). Read-only: change it through goal + direct()/glide(). */
  get current(): Readonly<RigView> {
    this.sync();
    return this.view;
  }

  get limits(): Readonly<RigLimits> {
    return this.lim;
  }

  /** Move the view to the goal right now (finger gestures). */
  direct(): void {
    this.sync();
    clampView(this.goal, this.lim);
    const v = this.view;
    const changed =
      v.tx !== this.goal.tx || v.tz !== this.goal.tz || v.yaw !== this.goal.yaw || v.pitch !== this.goal.pitch || v.distance !== this.goal.distance;
    copyView(this.goal, v);
    this.vel.tx = this.vel.tz = this.vel.yaw = this.vel.pitch = this.vel.distance = 0;
    this.panSmooth = SMOOTH_PAN;
    this.anchorOn = false;
    this.normalizeYaw();
    if (changed) {
      this.writeTarget();
      this.rev++;
    }
  }

  /** Let the view glide to the (clamped) goal over the next frames (keys, buttons). */
  glide(): void {
    this.sync();
    clampView(this.goal, this.lim);
  }

  /** Stop every motion where it is: glides, zoom, fling. */
  halt(): void {
    this.sync();
    copyView(this.view, this.goal);
    this.vel.tx = this.vel.tz = this.vel.yaw = this.vel.pitch = this.vel.distance = 0;
    this.flingOn = false;
    this.anchorOn = false;
    this.panSmooth = SMOOTH_PAN;
  }

  /** Start coasting with a ground velocity (world units per second); it decays on its own. */
  fling(vx: number, vz: number): void {
    if (!Number.isFinite(vx) || !Number.isFinite(vz)) return;
    this.fvx = vx;
    this.fvz = vz;
    this.flingOn = Math.hypot(vx, vz) > 0;
  }

  /** Current fling speed in world units per second (0 when not coasting). */
  flingSpeed(): number {
    return this.flingOn ? Math.hypot(this.fvx, this.fvz) : 0;
  }

  /**
   * Zoom the goal by a factor (< 1 = closer). With a ground point, the glide keeps that point fixed
   * on screen (wheel at the cursor); without one it zooms toward the screen centre.
   */
  zoomBy(factor: number, gx?: number, gz?: number): void {
    this.sync();
    if (!(factor > 0) || !Number.isFinite(factor)) return;
    this.goal.distance = clamp(this.goal.distance * factor, this.lim.minDistance, this.lim.maxDistance);
    if (gx !== undefined && gz !== undefined && Number.isFinite(gx) && Number.isFinite(gz)) {
      this.anchorOn = true;
      this.anchorX = gx;
      this.anchorZ = gz;
    } else {
      this.anchorOn = false;
    }
  }

  /** Change the map the target is kept inside (new city / load) and re-clamp. */
  setMapSize(size: number): void {
    this.sync();
    this.lim = limitsFor(size);
    clampView(this.goal, this.lim);
    clampView(this.view, this.lim);
    this.flingOn = false;
    this.anchorOn = false;
    this.writeTarget();
    this.rev++;
  }

  /** Back to the starting view over the map centre (glides unless `immediate`). */
  reset(immediate = false): void {
    this.sync();
    const d = defaultView(this.lim.mapSize);
    // keep the yaw within half a turn so the glide takes the short way round
    d.yaw = this.view.yaw + Math.atan2(Math.sin(d.yaw - this.view.yaw), Math.cos(d.yaw - this.view.yaw));
    copyView(d, this.goal);
    this.flingOn = false;
    this.anchorOn = false;
    if (immediate) this.direct();
    else this.panSmooth = SMOOTH_FOCUS;
  }

  /** True while anything is still gliding or coasting. */
  isMoving(): boolean {
    const v = this.view;
    const g = this.goal;
    return this.flingOn || v.tx !== g.tx || v.tz !== g.tz || v.yaw !== g.yaw || v.pitch !== g.pitch || v.distance !== g.distance;
  }

  /** The lens of the camera last passed to apply(), or a default one for a w × h canvas. */
  lens(w: number, h: number, out: Lens): Lens {
    const c = this.camera;
    if (c) {
      out.fov = c.fov;
      out.aspect = c.aspect > 0 ? c.aspect : w > 0 && h > 0 ? w / h : 1;
      out.zoom = c.zoom > 0 ? c.zoom : 1;
    } else {
      out.fov = DEFAULT_FOV;
      out.aspect = w > 0 && h > 0 ? w / h : 1;
      out.zoom = 1;
    }
    return out;
  }

  // ---- internals ----

  private chase(x: number, goal: number, ch: Channel, smooth: number, dt: number): number {
    if (x === goal && this.vel[ch] === 0) return x;
    const s = this.spring;
    s.x = x;
    s.v = this.vel[ch];
    springStep(s, goal, smooth, dt);
    const eps = ch === 'yaw' || ch === 'pitch' ? 1e-5 : 1e-4;
    if (Math.abs(s.x - goal) < eps && Math.abs(s.v) < eps * 20) {
      this.vel[ch] = 0;
      return goal;
    }
    this.vel[ch] = s.v;
    return s.x;
  }

  /** Keep yaw from growing without bound after many turns (view and goal shift together). */
  private normalizeYaw(): void {
    const t = Math.PI * 2;
    if (Math.abs(this.view.yaw) < t * 4) return;
    const k = Math.round(this.view.yaw / t) * t;
    this.view.yaw -= k;
    this.goal.yaw -= k;
  }

  private writeTarget(): void {
    this.target.set(this.view.tx, 0, this.view.tz);
    this.writtenX = this.target.x;
    this.writtenZ = this.target.z;
  }

  /** Someone moved rig.target directly (e.g. main on a new city): treat it as a jump. */
  private sync(): void {
    const t = this.target;
    if (t.x === this.writtenX && t.z === this.writtenZ && t.y === 0) return;
    this.view.tx = this.goal.tx = t.x;
    this.view.tz = this.goal.tz = t.z;
    clampView(this.view, this.lim);
    clampView(this.goal, this.lim);
    this.vel.tx = this.vel.tz = 0;
    this.flingOn = false;
    this.anchorOn = false;
    this.writeTarget();
    this.rev++;
  }
}
