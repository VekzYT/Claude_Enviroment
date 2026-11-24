// The input controller: turns pointer, wheel and key events on the world canvas into camera moves
// and tool plans.
//
// Gesture map (touch first; the mouse mirrors it for desktop testing):
//   inspect tool  one finger drags to pan (with fling inertia); a quick tap inspects a tile.
//   drag tools    one finger plans a..b (road L / zone or bulldoze rectangle); lifting applies it.
//   build tools   one finger drags the footprint ghost; lifting places it.
//   two fingers   pan + pinch zoom + twist rotate together, or tilt when both slide vertically.
//                 A second finger cancels a plan; the gesture stays camera-only until all lift.
//   mouse         left = one finger, right/middle drag = pan, wheel = zoom at the cursor,
//                 alt/ctrl + left drag = rotate/tilt. Keys: WASD/arrows, Q/E, +/-, Escape.
//
// Pointer moves only record positions; camera changes are worked out once per frame in update()
// (and right before the set of fingers changes), so a two-finger move is handled as one step.
import type { Plan, TilePos, ToolId } from '../core/types';
import type { InputController, InputHooks } from './index';
import {
  type Lens,
  type RigView,
  type TwoFingerMode,
  type TwoFingerStep,
  type XY,
  type XZ,
  clamp,
  classifyTwoFinger,
  edgeDepth,
  groundAt,
  rotateAbout,
  screenForward,
  screenRight,
  toNdc,
  twoFingerStep,
  zoomAbout,
} from './math';
import { OrbitRig } from './rig';
import { DragTiles, clampedTileAt, cleanTile } from './tiles';

// ---- tunables (CSS px, ms, radians) ----
/** A tap may wander this far; a one-finger pan starts once the finger goes further. */
const TAP_SLOP = 10;
const TAP_MS = 350;
/** Two fingers must move this far before the gesture is classified (tilt vs pan/zoom/rotate). */
const MULTI_SLOP = 10;
/** Accumulated twist before rotation engages, so plain pinches and pans don't wobble the yaw. */
const ROTATE_START = 0.12;
/** Pitch change per px of two-finger vertical slide (sliding up lowers the camera). */
const TILT_PER_PX = 0.005;
const MOUSE_YAW_PER_PX = 0.008;
const MOUSE_PITCH_PER_PX = 0.005;
/** Auto-pan while a plan is dragged within this many px of a screen edge. */
const EDGE_BAND = 48;
/** Auto-pan speed at the very edge, in camera distances per second, and its ease-in time (s). */
const AUTO_PAN_RATE = 0.5;
const AUTO_PAN_RAMP = 0.35;
/** Keyboard: pan in camera distances per second, rotate in rad/s, zoom in e-folds per second. */
const KEY_PAN = 0.9;
const KEY_ROTATE = 1.6;
const KEY_ZOOM = 1.4;
/** Fling: velocity measured over the last FLING_WINDOW ms; none if the finger rested FLING_REST ms. */
const FLING_WINDOW = 100;
const FLING_REST = 70;
const FLING_MIN_PX = 120;
/** Fastest fling, in camera distances per second. */
const FLING_MAX = 5;
const SAMPLES = 16;

export interface InputOptions {
  /** Millisecond clock used for every timing decision (tests). Default: event timestamps. */
  now?: () => number;
  /** Where key events are heard. Default: the element's window. null: no keyboard. */
  keyTarget?: EventTarget | null;
  /** Where iOS gesture and visibility events are heard. Default: the element's document. */
  docTarget?: EventTarget | null;
}

/** The full controller. createInput returns it typed as the InputController contract. */
export interface InputControllerFull extends InputController {
  readonly rig: OrbitRig;
  /** Pause world input (e.g. while a full-screen menu is open). Cancels any gesture in progress. */
  setEnabled(on: boolean): void;
  isEnabled(): boolean;
  /** True while a finger or mouse button is down on the world. */
  isGesturing(): boolean;
  /** Ground point under a CSS-pixel point on the canvas with the current camera, or null. */
  groundAt(x: number, y: number): XZ | null;
}

type Mode = 'idle' | 'pan' | 'plan' | 'multi' | 'rotate' | 'inert';

interface Ptr {
  id: number;
  mouse: boolean;
  /** Latest position (CSS px relative to the canvas). */
  x: number;
  y: number;
  /** Position already turned into camera motion. */
  px: number;
  py: number;
  /** Where it went down, and when. */
  sx: number;
  sy: number;
  t0: number;
}

type KeyName = 'up' | 'down' | 'left' | 'right' | 'rotL' | 'rotR' | 'in' | 'out';
const KEYMAP: Record<string, KeyName> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  KeyQ: 'rotL',
  KeyE: 'rotR',
  Equal: 'in',
  NumpadAdd: 'in',
  Minus: 'out',
  NumpadSubtract: 'out',
};

function keyName(e: KeyboardEvent): KeyName | undefined {
  const byCode = KEYMAP[e.code];
  if (byCode) return byCode;
  if (e.key === '+' || e.key === '=') return 'in';
  if (e.key === '-' || e.key === '_') return 'out';
  return KEYMAP[e.key];
}

function isEditable(t: EventTarget | null): boolean {
  const n = t as HTMLElement | null;
  if (!n || typeof n.tagName !== 'string') return false;
  return n.isContentEditable === true || n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.tagName === 'SELECT';
}

type ToolKind = 'inspect' | 'drag' | 'build';
function toolKind(tool: ToolId): ToolKind {
  if (tool === 'inspect') return 'inspect';
  return typeof tool === 'string' && tool.startsWith('build:') ? 'build' : 'drag';
}

function safe<T>(what: string, fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (err) {
    console.error(`input: ${what} failed`, err);
    return fallback;
  }
}

export function createInputController(el: HTMLElement, hooks: InputHooks, mapSize: number, opts: InputOptions = {}): InputControllerFull {
  const rig = new OrbitRig(mapSize);
  let size = rig.limits.mapSize;
  let tool: ToolId = 'inspect';
  let enabled = true;
  let disposed = false;

  const clock = opts.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  /** Event time in ms. Event timestamps keep taps and flings accurate when frames are slow. */
  const evTime = (e: Event): number => (opts.now ? opts.now() : e.timeStamp > 0 ? e.timeStamp : clock());

  // ---- canvas geometry (measured when a gesture starts) ----
  let rl = 0;
  let rt = 0;
  let vw = 0;
  let vh = 0;
  function measure(): void {
    const r = el.getBoundingClientRect();
    rl = r.left;
    rt = r.top;
    vw = r.width;
    vh = r.height;
  }

  const lensTmp: Lens = { fov: 40, aspect: 1, zoom: 1 };
  const ndc: XY = { x: 0, y: 0 };
  const gA: XZ = { x: 0, z: 0 };
  const gB: XZ = { x: 0, z: 0 };
  const dirR: XZ = { x: 0, z: 0 };
  const dirF: XZ = { x: 0, z: 0 };
  const tf: TwoFingerStep = { mx0: 0, my0: 0, mx1: 0, my1: 0, scale: 1, twist: 0 };

  /** Ground point under canvas point (x, y) for a view. */
  function ground(view: RigView, x: number, y: number, out: XZ): XZ | null {
    if (!(vw > 0 && vh > 0)) return null;
    rig.lens(vw, vh, lensTmp);
    toNdc(x, y, vw, vh, ndc);
    return groundAt(view, lensTmp, ndc.x, ndc.y, out);
  }

  // ---- gesture state ----
  const ptrs: Ptr[] = [];
  let mode: Mode = 'idle';
  /** A second finger joined this touch sequence: camera only until every finger lifts. */
  let camOnly = false;
  /** The single pointer may still turn out to be a tap. */
  let tapOk = false;
  /** The single pointer is past the slop and panning. */
  let panning = false;
  /** Pointer positions changed since the last flush. */
  let dirty = false;

  // plan drag
  let drag: DragTiles | null = null;
  let dragId = -1;
  let dragMoved = false;
  let current: Plan | null = null;
  let edgeTime = 0;
  let pickedRev = -1;

  // two fingers
  let mA = -1;
  let mB = -1;
  let mMode: TwoFingerMode = 'pending';
  let s1x = 0;
  let s1y = 0;
  let s2x = 0;
  let s2y = 0;
  let twistAcc = 0;
  let rotating = false;

  // recent positions of the panning point (finger or two-finger midpoint), for fling velocity
  const sT = new Float64Array(SAMPLES);
  const sX = new Float64Array(SAMPLES);
  const sY = new Float64Array(SAMPLES);
  let sN = 0;
  let sHead = 0;
  let offX = 0;
  let offY = 0;

  const held = new Map<string, KeyName>();

  function find(id: number): Ptr | undefined {
    for (const p of ptrs) if (p.id === id) return p;
    return undefined;
  }
  function moved(p: Ptr): number {
    return Math.hypot(p.x - p.sx, p.y - p.sy);
  }

  function resetSamples(): void {
    sN = 0;
    offX = offY = 0;
  }
  function addSample(t: number, x: number, y: number): void {
    sHead = (sHead + 1) % SAMPLES;
    sT[sHead] = t;
    sX[sHead] = x + offX;
    sY[sHead] = y + offY;
    if (sN < SAMPLES) sN++;
  }
  /** The tracked point is about to jump (finger ↔ midpoint): keep the sampled path continuous. */
  function rebaseSamples(x: number, y: number): void {
    if (sN) {
      offX = sX[sHead] - x;
      offY = sY[sHead] - y;
    } else {
      offX = offY = 0;
    }
  }

  // ---- plans ----

  function pickTile(x: number, y: number, clampToMap: boolean): TilePos | null {
    const t = cleanTile(
      safe('pick', () => hooks.pick(x, y), null),
      size,
    );
    if (t || !clampToMap) return t;
    // off the map: follow the ground point under the finger along the map's edge
    const g = ground(rig.current, x, y, gA);
    return g ? clampedTileAt(g.x, g.z, size) : null;
  }

  function startPlan(p: Ptr): void {
    drag = new DragTiles(toolKind(tool) === 'build');
    dragId = p.id;
    dragMoved = false;
    current = null;
    edgeTime = 0;
    trackPlan();
  }

  /** Re-read the tile under the planning finger; replan only when it changed. */
  function trackPlan(): void {
    const d = drag;
    if (!d) return;
    pickedRev = rig.rev;
    const p = find(dragId);
    if (!p) return;
    const t = pickTile(p.x, p.y, d.started);
    if (!d.move(t) || !d.a || !d.b) return;
    const a = { x: d.a.x, z: d.a.z };
    const b = { x: d.b.x, z: d.b.z };
    const t0 = tool;
    current = safe('plan', () => hooks.plan(t0, a, b), null);
    const shown = current;
    safe('preview', () => hooks.preview(shown), undefined);
  }

  function commitPlan(): void {
    const d = drag;
    const plan = current;
    drag = null;
    dragId = -1;
    current = null;
    if (!d || !d.started || !d.a || !d.b) return;
    const a = d.a;
    const b = d.b;
    const t0 = tool;
    const final = plan ?? safe('plan', () => hooks.plan(t0, { x: a.x, z: a.z }, { x: b.x, z: b.z }), null);
    if (final) safe('apply', () => hooks.apply(final), undefined);
    safe('preview', () => hooks.preview(null), undefined);
  }

  function cancelPlan(): void {
    const d = drag;
    drag = null;
    dragId = -1;
    current = null;
    if (d && d.started) safe('preview', () => hooks.preview(null), undefined);
  }

  // ---- gestures ----

  function beginMulti(): void {
    const a = ptrs[0];
    const b = ptrs[1];
    mA = a.id;
    mB = b.id;
    a.px = a.x;
    a.py = a.y;
    b.px = b.x;
    b.py = b.y;
    s1x = a.x;
    s1y = a.y;
    s2x = b.x;
    s2y = b.y;
    mMode = 'pending';
    twistAcc = 0;
    rotating = false;
    mode = 'multi';
    panning = false;
    rebaseSamples((a.x + b.x) / 2, (a.y + b.y) / 2);
  }

  function panStep(): void {
    const p = ptrs[0];
    if (!p) return;
    if (!panning) {
      if (moved(p) <= TAP_SLOP) return;
      panning = true;
    }
    if (p.x === p.px && p.y === p.py) return;
    // ground-anchored: the ground point that was under the finger moves to where the finger is
    const g = rig.goal;
    const G = ground(g, p.px, p.py, gA);
    const H = G ? ground(g, p.x, p.y, gB) : null;
    if (G && H) {
      g.tx += G.x - H.x;
      g.tz += G.z - H.z;
      rig.direct();
    }
    p.px = p.x;
    p.py = p.y;
  }

  function multiStep(): void {
    const a = find(mA);
    const b = find(mB);
    if (!a || !b) return;
    if (mMode === 'pending') {
      mMode = classifyTwoFinger(s1x, s1y, s2x, s2y, a.x, a.y, b.x, b.y, MULTI_SLOP);
      // until decided, px/py stay at the start so no movement is lost once it is
      if (mMode === 'pending') return;
      if (mMode === 'tilt') resetSamples();
    }
    const g = rig.goal;
    if (mMode === 'tilt') {
      const dy = (a.y - a.py + (b.y - b.py)) / 2;
      g.pitch += dy * TILT_PER_PX;
    } else {
      twoFingerStep(a.px, a.py, b.px, b.py, a.x, a.y, b.x, b.y, tf);
      const G = ground(g, tf.mx0, tf.my0, gA);
      if (G) {
        const gx = G.x;
        const gz = G.z;
        // twist and pinch about the ground point under the old midpoint (it stays put on screen) ...
        if (rotating) rotateAbout(g, gx, gz, tf.twist);
        else {
          twistAcc += tf.twist;
          if (Math.abs(twistAcc) > ROTATE_START) rotating = true;
        }
        zoomAbout(g, gx, gz, 1 / tf.scale, rig.limits);
        // ... then slide it under the new midpoint
        const H = ground(g, tf.mx1, tf.my1, gB);
        if (H) {
          g.tx += gx - H.x;
          g.tz += gz - H.z;
        }
      }
    }
    a.px = a.x;
    a.py = a.y;
    b.px = b.x;
    b.py = b.y;
    rig.direct();
  }

  function rotateStep(): void {
    const p = ptrs[0];
    if (!p) return;
    const dx = p.x - p.px;
    const dy = p.y - p.py;
    if (!dx && !dy) return;
    const g = rig.goal;
    g.yaw -= dx * MOUSE_YAW_PER_PX;
    g.pitch += dy * MOUSE_PITCH_PER_PX;
    rig.direct();
    p.px = p.x;
    p.py = p.y;
  }

  /** Turn recorded pointer positions into camera motion. */
  function flush(): void {
    if (!dirty) return;
    dirty = false;
    if (mode === 'pan') panStep();
    else if (mode === 'multi') multiStep();
    else if (mode === 'rotate') rotateStep();
  }

  /** On release after a pan: keep coasting with the finger's recent speed. */
  function releaseFling(t: number, x: number, y: number): void {
    if (!sN) return;
    const hi = sHead;
    const tl = sT[hi];
    if (t - tl > FLING_REST) return;
    let lo = hi;
    for (let k = 1; k < sN; k++) {
      const j = (hi - k + SAMPLES) % SAMPLES;
      if (tl - sT[j] > FLING_WINDOW) break;
      lo = j;
    }
    const dt = (tl - sT[lo]) / 1000;
    if (dt < 0.012) return;
    const vx = (sX[hi] - sX[lo]) / dt;
    const vy = (sY[hi] - sY[lo]) / dt;
    if (Math.hypot(vx, vy) < FLING_MIN_PX) return;
    // the ground moved with the finger, so the target moves the other way
    const tau = 0.04;
    const g = rig.goal;
    const G1 = ground(g, x, y, gA);
    const G0 = G1 ? ground(g, x - vx * tau, y - vy * tau, gB) : null;
    if (!G1 || !G0) return;
    let wx = (G0.x - G1.x) / tau;
    let wz = (G0.z - G1.z) / tau;
    const max = g.distance * FLING_MAX;
    const s = Math.hypot(wx, wz);
    if (s > max) {
      wx *= max / s;
      wz *= max / s;
    }
    rig.fling(wx, wz);
  }

  function releaseCaptures(): void {
    for (const p of ptrs) {
      try {
        if (el.hasPointerCapture?.(p.id)) el.releasePointerCapture(p.id);
      } catch {
        // the pointer is already gone
      }
    }
  }

  /** Forget every pointer and drop any plan (no apply). */
  function resetGesture(): void {
    releaseCaptures();
    ptrs.length = 0;
    if (drag) cancelPlan();
    mode = 'idle';
    camOnly = false;
    panning = false;
    tapOk = false;
    dirty = false;
    resetSamples();
  }

  /** After a pointer left: settle what the remaining fingers do. */
  function afterRemoval(): void {
    if (!ptrs.length) {
      mode = 'idle';
      camOnly = false;
      panning = false;
      tapOk = false;
      return;
    }
    if (mode === 'multi') {
      if (ptrs.length >= 2) {
        if (ptrs[0].id !== mA || ptrs[1].id !== mB) beginMulti();
      } else {
        // one finger left: it carries on panning the camera from where it is
        const q = ptrs[0];
        q.px = q.x;
        q.py = q.y;
        if (mMode === 'tilt') resetSamples();
        else rebaseSamples(q.x, q.y);
        mode = 'pan';
        panning = true;
        tapOk = false;
      }
    } else if (mode !== 'inert') {
      mode = 'inert';
    }
  }

  // ---- DOM events ----

  function onDown(e: PointerEvent): void {
    if (disposed) return;
    safe('touched', () => hooks.touched(), undefined);
    if (!enabled) return;
    const mouse = e.pointerType === 'mouse';
    if (mouse) {
      if (ptrs.length) return; // a touch (or another button) owns the canvas
      if (e.button > 2) return; // back / forward buttons
      e.preventDefault();
    } else {
      if (ptrs.some((q) => q.mouse)) resetGesture();
      // the first finger of a new touch sequence: anything still held is stale (a lost pointerup)
      if (e.isPrimary && ptrs.length) resetGesture();
    }
    if (find(e.pointerId)) return;
    flush();
    if (!ptrs.length) {
      measure();
      resetSamples();
    }
    const x = e.clientX - rl;
    const y = e.clientY - rt;
    const p: Ptr = { id: e.pointerId, mouse, x, y, px: x, py: y, sx: x, sy: y, t0: evTime(e) };
    ptrs.push(p);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // synthetic or already-released pointer: capture is a nicety
    }
    // touching the world stops any glide or fling; a touch that stops a fast fling is not a tap
    const coasting = rig.flingSpeed() > Math.max(1, rig.current.distance * 0.3);
    rig.halt();
    if (ptrs.length === 1) {
      camOnly = false;
      panning = false;
      tapOk = false;
      if (mouse && e.button !== 0) {
        mode = 'pan';
        camOnly = true;
        panning = true;
      } else if (mouse && (e.altKey || e.ctrlKey)) {
        mode = 'rotate';
        camOnly = true;
      } else if (toolKind(tool) === 'inspect') {
        mode = 'pan';
        tapOk = !coasting;
      } else {
        mode = 'plan';
        startPlan(p);
      }
    } else {
      if (drag) cancelPlan();
      camOnly = true;
      tapOk = false;
      if (mode !== 'multi' || ptrs[0].id !== mA || ptrs[1].id !== mB) beginMulti();
    }
  }

  function onMove(e: PointerEvent): void {
    const p = find(e.pointerId);
    if (!p) return;
    if (p.mouse && e.buttons === 0) {
      // the button came up somewhere we did not hear about
      onUp(e);
      return;
    }
    p.x = e.clientX - rl;
    p.y = e.clientY - rt;
    dirty = true;
    const t = evTime(e);
    if (mode === 'plan') {
      if (p.id === dragId) {
        if (!dragMoved && moved(p) > TAP_SLOP) dragMoved = true;
        trackPlan();
      }
    } else if (mode === 'pan') {
      if (tapOk && moved(p) > TAP_SLOP) tapOk = false;
      addSample(t, p.x, p.y);
    } else if (mode === 'multi' && mMode !== 'tilt' && (p.id === mA || p.id === mB)) {
      const a = find(mA);
      const b = find(mB);
      if (a && b) addSample(t, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
  }

  function onUp(e: PointerEvent): void {
    const p = find(e.pointerId);
    if (!p) return;
    if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) {
      p.x = e.clientX - rl;
      p.y = e.clientY - rt;
    }
    const t = evTime(e);
    dirty = true;
    flush();
    ptrs.splice(ptrs.indexOf(p), 1);
    try {
      if (el.hasPointerCapture?.(p.id)) el.releasePointerCapture(p.id);
    } catch {
      // already released
    }
    if (mode === 'plan' && p.id === dragId) {
      commitPlan();
    } else if (mode === 'pan') {
      const isTap = tapOk && !camOnly && t - p.t0 <= TAP_MS && moved(p) <= TAP_SLOP && toolKind(tool) === 'inspect';
      if (isTap) {
        const tile = cleanTile(
          safe('pick', () => hooks.pick(p.x, p.y), null),
          size,
        );
        safe('inspect', () => hooks.inspect(tile), undefined);
      } else if (panning && ptrs.length === 0) {
        releaseFling(t, p.x, p.y);
      }
    }
    afterRemoval();
  }

  function onCancel(e: PointerEvent): void {
    const p = find(e.pointerId);
    if (!p) return;
    ptrs.splice(ptrs.indexOf(p), 1);
    try {
      if (el.hasPointerCapture?.(p.id)) el.releasePointerCapture(p.id);
    } catch {
      // already released
    }
    if (mode === 'plan' && p.id === dragId) cancelPlan();
    tapOk = false;
    afterRemoval();
  }

  function onLostCapture(e: PointerEvent): void {
    // normally this follows pointerup/cancel (pointer already gone); if not, the pointer is lost
    if (find(e.pointerId)) onCancel(e);
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (disposed || !enabled) return;
    measure();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= vh || 400;
    if (!Number.isFinite(dy) || dy === 0) return;
    // ctrl + wheel is a trackpad pinch: small deltas, so a stronger rate
    const f = Math.exp(clamp(dy * (e.ctrlKey ? 0.01 : 0.0015), -0.5, 0.5));
    rig.fling(0, 0);
    const G = ground(rig.current, e.clientX - rl, e.clientY - rt, gA);
    if (G) rig.zoomBy(f, G.x, G.z);
    else rig.zoomBy(f);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (disposed || isEditable(e.target)) return;
    if (e.key === 'Escape' || e.key === 'Esc') {
      controller.cancel();
      return;
    }
    if (!enabled || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = keyName(e);
    if (k) held.set(e.code || e.key, k);
  }

  function onKeyUp(e: KeyboardEvent): void {
    held.delete(e.code || e.key);
  }

  function keyboard(dt: number): void {
    if (!held.size || dt <= 0) return;
    let fwd = 0;
    let right = 0;
    let rot = 0;
    let zoom = 0;
    for (const k of held.values()) {
      if (k === 'up') fwd = 1;
      else if (k === 'down') fwd = fwd === 1 ? 0 : -1;
      else if (k === 'right') right = 1;
      else if (k === 'left') right = right === 1 ? 0 : -1;
      else if (k === 'rotL') rot = 1;
      else if (k === 'rotR') rot = rot === 1 ? 0 : -1;
      else if (k === 'out') zoom = 1;
      else if (k === 'in') zoom = zoom === 1 ? 0 : -1;
    }
    if (!fwd && !right && !rot && !zoom) return;
    rig.fling(0, 0);
    const g = rig.goal;
    if (fwd || right) {
      const s = g.distance * KEY_PAN * dt;
      screenRight(g.yaw, dirR);
      screenForward(g.yaw, dirF);
      g.tx += (dirR.x * right + dirF.x * fwd) * s;
      g.tz += (dirR.z * right + dirF.z * fwd) * s;
    }
    if (rot) g.yaw += rot * KEY_ROTATE * dt;
    if (zoom) g.distance *= Math.exp(zoom * KEY_ZOOM * dt);
    rig.glide();
  }

  /** While a plan is dragged near a screen edge, slide the map that way. */
  function autoPan(dt: number): void {
    if (mode !== 'plan' || !drag || !drag.started || !dragMoved || dt <= 0) {
      edgeTime = 0;
      return;
    }
    const p = find(dragId);
    if (!p) return;
    const ex = edgeDepth(p.x, vw, EDGE_BAND);
    const ey = edgeDepth(p.y, vh, EDGE_BAND);
    if (!ex && !ey) {
      edgeTime = 0;
      return;
    }
    edgeTime += dt;
    const g = rig.goal;
    const speed = g.distance * AUTO_PAN_RATE * Math.min(1, edgeTime / AUTO_PAN_RAMP) * dt;
    // deeper into the band = faster, with a floor so it never crawls
    const kx = ex ? Math.sign(ex) * (0.3 + 0.7 * Math.abs(ex)) : 0;
    const ky = ey ? -Math.sign(ey) * (0.3 + 0.7 * Math.abs(ey)) : 0;
    screenRight(g.yaw, dirR);
    screenForward(g.yaw, dirF);
    g.tx += (dirR.x * kx + dirF.x * ky) * speed;
    g.tz += (dirR.z * kx + dirF.z * ky) * speed;
    rig.direct();
  }

  // ---- wiring ----

  const offs: Array<() => void> = [];
  function listen(t: EventTarget | null | undefined, type: string, fn: (e: any) => void, o?: AddEventListenerOptions): void {
    if (!t) return;
    t.addEventListener(type, fn, o);
    offs.push(() => t.removeEventListener(type, fn, o));
  }
  const prevent = (e: Event) => {
    if (e.cancelable) e.preventDefault();
  };
  const docT: EventTarget | null =
    opts.docTarget !== undefined ? opts.docTarget : (el.ownerDocument ?? (typeof document !== 'undefined' ? document : null));
  const winT: EventTarget | null =
    opts.keyTarget !== undefined
      ? opts.keyTarget
      : (el.ownerDocument?.defaultView ?? (typeof window !== 'undefined' ? window : null));

  // the canvas handles every gesture itself: no browser panning, zooming, selection or callouts
  const st = el.style as CSSStyleDeclaration | undefined;
  if (st) {
    st.touchAction = 'none';
    st.setProperty?.('user-select', 'none');
    st.setProperty?.('-webkit-user-select', 'none');
    st.setProperty?.('-webkit-touch-callout', 'none');
    st.setProperty?.('-webkit-tap-highlight-color', 'transparent');
  }

  listen(el, 'pointerdown', onDown);
  listen(el, 'pointermove', onMove);
  listen(el, 'pointerup', onUp);
  listen(el, 'pointercancel', onCancel);
  listen(el, 'lostpointercapture', onLostCapture);
  listen(el, 'wheel', onWheel, { passive: false });
  listen(el, 'touchmove', prevent, { passive: false });
  listen(el, 'contextmenu', prevent);
  listen(el, 'dblclick', prevent);
  listen(el, 'selectstart', prevent);
  // iOS Safari's own pinch-zoom of the page
  listen(docT, 'gesturestart', prevent, { passive: false });
  listen(docT, 'gesturechange', prevent, { passive: false });
  listen(docT, 'gestureend', prevent, { passive: false });
  listen(docT, 'visibilitychange', () => {
    if ((docT as Document).visibilityState === 'hidden') {
      resetGesture();
      held.clear();
    }
  });
  listen(winT, 'keydown', onKeyDown);
  listen(winT, 'keyup', onKeyUp);
  listen(winT, 'blur', () => {
    held.clear();
    resetGesture();
  });

  const controller: InputControllerFull = {
    rig,

    setTool(t) {
      if (typeof t !== 'string') return;
      tool = t;
      if (drag) cancelPlan();
      if (mode === 'plan') mode = 'inert';
      tapOk = false;
    },

    getTool() {
      return tool;
    },

    cancel() {
      if (drag) cancelPlan();
      if (mode === 'plan') mode = 'inert';
    },

    update(dt) {
      if (disposed) return;
      const step = Number.isFinite(dt) ? clamp(dt, 0, 0.1) : 0;
      flush();
      if (enabled) keyboard(step);
      autoPan(step);
      rig.update(step);
      // the picture moved under a planning finger: the tile under it may have changed
      if (mode === 'plan' && drag && rig.rev !== pickedRev) {
        if (rig.camera) rig.apply(rig.camera);
        trackPlan();
      }
    },

    setMapSize(n) {
      if (!(n > 0)) return;
      rig.setMapSize(n);
      size = rig.limits.mapSize;
      if (drag) cancelPlan();
      if (mode === 'plan') mode = 'inert';
    },

    dispose() {
      if (disposed) return;
      resetGesture();
      held.clear();
      for (const off of offs) off();
      offs.length = 0;
      disposed = true;
    },

    setEnabled(on) {
      enabled = !!on;
      if (!enabled) {
        resetGesture();
        held.clear();
      }
    },

    isEnabled() {
      return enabled;
    },

    isGesturing() {
      return ptrs.length > 0;
    },

    groundAt(x, y) {
      if (!ptrs.length) measure();
      const g = ground(rig.current, x, y, gA);
      return g ? { x: g.x, z: g.z } : null;
    },
  };
  return controller;
}
