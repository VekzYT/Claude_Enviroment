// The input controller's gesture state machine, driven by synthetic pointer events on a fake
// canvas: taps, pans, plans, multi-touch, cancellation and recovery from lost pointers.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Plan, TilePos, ToolId } from '../src/core/types';
import { createInputController, type InputControllerFull } from '../src/input/controller';
import type { InputHooks } from '../src/input/index';
import { lPath, rectTiles, tileAt } from '../src/input/tiles';

const W = 852;
const H = 393;
const N = 64;

class FakeCanvas extends EventTarget {
  style = { touchAction: '', setProperty() {} };
  captured = new Set<number>();
  ownerDocument = null;
  getBoundingClientRect() {
    return { left: 0, top: 0, width: W, height: H, right: W, bottom: H, x: 0, y: 0 };
  }
  setPointerCapture(id: number) {
    this.captured.add(id);
  }
  releasePointerCapture(id: number) {
    this.captured.delete(id);
  }
  hasPointerCapture(id: number) {
    return this.captured.has(id);
  }
}

interface Log {
  plans: Array<{ tool: ToolId; a: TilePos; b: TilePos }>;
  previews: Array<Plan | null>;
  applied: Plan[];
  inspected: Array<TilePos | null>;
  touches: number;
}

function setup(tool: ToolId = 'inspect') {
  const el = new FakeCanvas();
  const keys = new EventTarget();
  let now = 1000;
  const log: Log = { plans: [], previews: [], applied: [], inspected: [], touches: 0 };
  let ctrl!: InputControllerFull;
  // stand-in for the renderer's pick and sim's planTool, both on the same y = 0 ground
  const hooks: InputHooks = {
    pick(x, y) {
      const g = ctrl.groundAt(x, y);
      return g ? tileAt(g.x, g.z, N) : null;
    },
    plan(t, a, b) {
      log.plans.push({ tool: t, a, b });
      const tiles = t === 'road' ? lPath(a, b, N) : t.startsWith('build:') ? [b.z * N + b.x] : rectTiles(a, b, N);
      return { tool: t, tiles, ok: tiles.map(() => true), cost: tiles.length * 10, valid: true };
    },
    apply(p) {
      log.applied.push(p);
    },
    preview(p) {
      log.previews.push(p);
    },
    inspect(t) {
      log.inspected.push(t);
    },
    touched() {
      log.touches++;
    },
  };
  ctrl = createInputController(el as unknown as HTMLElement, hooks, N, { now: () => now, keyTarget: keys, docTarget: null });
  ctrl.setTool(tool);
  let primaryDown = false;
  const fire = (type: string, id: number, x: number, y: number, extra: Record<string, unknown> = {}) => {
    const e = new Event(type, { cancelable: true });
    const isPrimary = type === 'pointerdown' ? !primaryDown : false;
    if (type === 'pointerdown' && !primaryDown) primaryDown = true;
    Object.assign(e, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, isPrimary, button: 0, buttons: 1, altKey: false, ctrlKey: false }, extra);
    el.dispatchEvent(e);
    return e;
  };
  const api = {
    el,
    keys,
    log,
    ctrl,
    down: (id: number, x: number, y: number, extra = {}) => fire('pointerdown', id, x, y, extra),
    move: (id: number, x: number, y: number, extra = {}) => fire('pointermove', id, x, y, extra),
    up: (id: number, x: number, y: number, extra = {}) => {
      const e = fire('pointerup', id, x, y, extra);
      return e;
    },
    cancelPtr: (id: number) => fire('pointercancel', id, 0, 0),
    /** All fingers lifted: the next pointerdown starts a new touch sequence. */
    newSequence: () => {
      primaryDown = false;
    },
    /** Advance the clock and run one frame. */
    frame: (ms = 16) => {
      now += ms;
      ctrl.update(ms / 1000);
    },
    wait: (ms: number) => {
      now += ms;
    },
    ground: (x: number, y: number) => ctrl.groundAt(x, y)!,
    tile: (x: number, y: number) => {
      const g = ctrl.groundAt(x, y)!;
      return tileAt(g.x, g.z, N)!;
    },
  };
  return api;
}

/** Slide pointers in steps, one frame per step. */
function drag(t: ReturnType<typeof setup>, paths: Array<[number, number, number, number, number]>, steps = 10) {
  for (let s = 1; s <= steps; s++) {
    for (const [id, x0, y0, x1, y1] of paths) t.move(id, x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps);
    t.frame();
  }
}

const dist2 = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

test('a quick tap with the inspect tool inspects the tile under the finger', () => {
  const t = setup('inspect');
  const expected = t.tile(500, 250);
  t.down(1, 500, 250);
  t.wait(120);
  t.move(1, 503, 252);
  t.up(1, 503, 252);
  assert.deepEqual(t.log.inspected, [expected]);
  assert.equal(t.log.touches, 2, 'touched() on press and on release');
  assert.equal(t.ctrl.isGesturing(), false);
});

test('a long press or a drag is not a tap', () => {
  const t = setup('inspect');
  t.down(1, 500, 250);
  t.wait(600);
  t.up(1, 500, 250);
  t.newSequence();
  t.down(2, 500, 250);
  t.move(2, 540, 250);
  t.up(2, 540, 250);
  assert.deepEqual(t.log.inspected, []);
});

test('one-finger pan keeps the grabbed ground point under the finger', () => {
  const t = setup('inspect');
  const grabbed = t.ground(400, 200);
  t.down(1, 400, 200);
  drag(t, [[1, 400, 200, 250, 120]]);
  const under = t.ground(250, 120);
  assert.ok(dist2(grabbed, under) < 1e-6, `drifted by ${dist2(grabbed, under)}`);
  t.wait(200); // rest before lifting: no fling
  t.up(1, 250, 120);
  const after = t.ctrl.rig.target.clone();
  for (let i = 0; i < 30; i++) t.frame();
  assert.ok(after.distanceTo(t.ctrl.rig.target) < 1e-9, 'no drift after a resting release');
  assert.deepEqual(t.log.inspected, []);
});

test('a quick flick keeps the map coasting after release, then it stops', () => {
  const t = setup('inspect');
  t.down(1, 600, 200);
  for (let s = 1; s <= 6; s++) {
    t.move(1, 600 - s * 25, 200);
    t.frame(16);
  }
  t.up(1, 450, 200);
  assert.ok(t.ctrl.rig.flingSpeed() > 0, 'coasting');
  const at = t.ctrl.rig.target.clone();
  t.frame(16);
  assert.ok(at.distanceTo(t.ctrl.rig.target) > 0.01);
  for (let i = 0; i < 300; i++) t.frame(16);
  assert.equal(t.ctrl.rig.flingSpeed(), 0);
  // a touch that stops a fast fling does not inspect
  t.newSequence();
  t.down(2, 600, 200);
  for (let s = 1; s <= 6; s++) {
    t.move(2, 600 - s * 25, 200);
    t.frame(16);
  }
  t.up(2, 450, 200);
  t.newSequence();
  t.down(3, 300, 200);
  t.up(3, 300, 200);
  assert.deepEqual(t.log.inspected, []);
  assert.equal(t.ctrl.rig.flingSpeed(), 0, 'the touch stopped the fling');
});

test('a road drag shows an L plan that updates only on new tiles and applies on release', () => {
  const t = setup('road');
  const a = t.tile(300, 250);
  const b = t.tile(560, 140);
  t.down(1, 300, 250);
  assert.equal(t.log.plans.length, 1);
  assert.deepEqual(t.log.plans[0].a, a);
  t.move(1, 300.5, 250.5); // same tile: no replanning
  assert.equal(t.log.plans.length, 1);
  drag(t, [[1, 300, 250, 560, 140]], 40);
  const last = t.log.plans[t.log.plans.length - 1];
  assert.deepEqual(last.a, a);
  assert.deepEqual(last.b, b);
  // one plan per distinct tile entered, never more
  const distinct = new Set(t.log.plans.map((p) => `${p.b.x},${p.b.z}`)).size;
  assert.ok(t.log.plans.length <= distinct + 1, `${t.log.plans.length} plans for ${distinct} tiles`);
  const shown = t.log.previews[t.log.previews.length - 1]!;
  assert.deepEqual(shown.tiles, lPath(a, b, N));
  t.up(1, 560, 140);
  assert.equal(t.log.applied.length, 1);
  assert.deepEqual(t.log.applied[0].tiles, lPath(a, b, N));
  assert.equal(t.log.previews[t.log.previews.length - 1], null, 'preview cleared');
  assert.deepEqual(t.log.inspected, []);
});

test('a tap with a drag tool applies to one tile', () => {
  const t = setup('zone_res');
  const a = t.tile(420, 200);
  t.down(1, 420, 200);
  t.up(1, 421, 200);
  assert.equal(t.log.applied.length, 1);
  assert.deepEqual(t.log.applied[0].tiles, [a.z * N + a.x]);
});

test('a building tool drags the ghost with a == b and places it on release', () => {
  const t = setup('build:police');
  t.down(1, 400, 200);
  drag(t, [[1, 400, 200, 470, 230]]);
  const end = t.tile(470, 230);
  for (const p of t.log.plans) assert.deepEqual(p.a, p.b);
  assert.deepEqual(t.log.plans[t.log.plans.length - 1].b, end);
  t.up(1, 470, 230);
  assert.equal(t.log.applied.length, 1);
  assert.equal(t.log.applied[0].tool, 'build:police');
});

test('a second finger cancels the plan; the gesture stays camera-only until all fingers lift', () => {
  const t = setup('zone_com');
  t.down(1, 300, 200);
  drag(t, [[1, 300, 200, 360, 220]]);
  assert.ok(t.log.previews[t.log.previews.length - 1]);
  t.down(2, 500, 200);
  assert.equal(t.log.previews[t.log.previews.length - 1], null);
  const plansBefore = t.log.plans.length;
  const before = t.ctrl.rig.target.clone();
  drag(t, [
    [1, 360, 220, 300, 200],
    [2, 500, 200, 440, 180],
  ]);
  assert.ok(before.distanceTo(t.ctrl.rig.target) > 0.5, 'two fingers moved the camera');
  t.up(2, 440, 180);
  drag(t, [[1, 300, 200, 280, 260]]); // the remaining finger pans, it does not plan
  t.up(1, 280, 260);
  assert.equal(t.log.plans.length, plansBefore);
  assert.equal(t.log.applied.length, 0);
  // and the next touch is a normal plan again
  t.newSequence();
  t.down(3, 400, 200);
  t.up(3, 400, 200);
  assert.equal(t.log.applied.length, 1);
});

test('pinch zooms about the midpoint and twist rotates the yaw', () => {
  const t = setup('inspect');
  const mid = t.ground(426, 196);
  t.down(1, 326, 196);
  t.down(2, 526, 196);
  drag(t, [
    [1, 326, 196, 226, 196],
    [2, 526, 196, 626, 196],
  ]);
  const d = t.ctrl.rig.distance;
  assert.ok(Math.abs(d - 19) < 0.01, `distance ${d}`);
  assert.ok(dist2(mid, t.ground(426, 196)) < 1e-6, 'midpoint ground stayed put');
  assert.ok(Math.abs(t.ctrl.rig.yaw - Math.PI / 4) < 1e-9, 'a pure pinch does not rotate');
  // twist the fingers 40 degrees clockwise about their midpoint
  const yaw0 = t.ctrl.rig.yaw;
  const r = 200;
  for (let s = 1; s <= 20; s++) {
    const ang = ((40 * Math.PI) / 180) * (s / 20);
    t.move(1, 426 - Math.cos(ang) * r, 196 - Math.sin(ang) * r);
    t.move(2, 426 + Math.cos(ang) * r, 196 + Math.sin(ang) * r);
    t.frame();
  }
  const turned = t.ctrl.rig.yaw - yaw0;
  // all of the twist except the dead zone that tells a twist from a wobble
  assert.ok(turned > 0.45 && turned < 0.7, `yaw turned ${turned}`);
  assert.ok(Math.abs(t.ctrl.rig.distance - d) < 0.01, 'a pure twist does not zoom');
  assert.ok(dist2(mid, t.ground(426, 196)) < 1e-6, 'rotation pivots on the midpoint');
});

test('two fingers sliding up together tilt the camera down toward the horizon', () => {
  const t = setup('inspect');
  const p0 = t.ctrl.rig.pitch;
  const target0 = t.ctrl.rig.target.clone();
  t.down(1, 330, 250);
  t.down(2, 530, 250);
  drag(t, [
    [1, 330, 250, 330, 170],
    [2, 530, 250, 532, 170],
  ]);
  assert.ok(t.ctrl.rig.pitch < p0 - 0.3, `pitch ${t.ctrl.rig.pitch}`);
  assert.ok(target0.distanceTo(t.ctrl.rig.target) < 1e-9, 'tilt does not pan');
  t.up(1, 330, 170);
  t.up(2, 532, 170);
  assert.equal(t.ctrl.rig.flingSpeed(), 0, 'no fling after a tilt');
});

test('pointercancel abandons a plan and leaves nothing stuck', () => {
  const t = setup('road');
  t.down(1, 300, 200);
  drag(t, [[1, 300, 200, 400, 200]]);
  t.cancelPtr(1);
  assert.equal(t.log.previews[t.log.previews.length - 1], null);
  assert.equal(t.log.applied.length, 0);
  assert.equal(t.ctrl.isGesturing(), false);
  t.newSequence();
  t.down(2, 300, 200);
  t.up(2, 300, 200);
  assert.equal(t.log.applied.length, 1);
});

test('a lost pointerup does not wedge the controller', () => {
  const t = setup('road');
  t.down(1, 300, 200);
  drag(t, [[1, 300, 200, 350, 200]]);
  // finger 1's pointerup never arrives; a new touch sequence starts
  t.newSequence();
  t.down(2, 500, 250);
  assert.equal(t.log.previews[t.log.previews.length - 1]?.tiles.length, 1, 'fresh one-tile plan, not a two-finger gesture');
  t.up(2, 500, 250);
  assert.equal(t.log.applied.length, 1);
  assert.equal(t.ctrl.isGesturing(), false);
  // lost capture without an up is treated as a cancel
  t.newSequence();
  t.down(3, 300, 200);
  t.el.dispatchEvent(Object.assign(new Event('lostpointercapture'), { pointerId: 3, pointerType: 'touch' }));
  assert.equal(t.ctrl.isGesturing(), false);
  assert.equal(t.log.applied.length, 1);
});

test('setTool and cancel() drop the plan in progress; the finger then does nothing', () => {
  const t = setup('road');
  t.down(1, 300, 200);
  drag(t, [[1, 300, 200, 380, 200]]);
  t.ctrl.setTool('zone_res');
  assert.equal(t.log.previews[t.log.previews.length - 1], null);
  const plans = t.log.plans.length;
  drag(t, [[1, 380, 200, 420, 200]]);
  t.up(1, 420, 200);
  assert.equal(t.log.plans.length, plans);
  assert.equal(t.log.applied.length, 0);
  assert.equal(t.ctrl.getTool(), 'zone_res');

  t.newSequence();
  t.down(2, 300, 200);
  t.ctrl.cancel();
  t.up(2, 300, 200);
  assert.equal(t.log.applied.length, 0);
});

test('dragging a plan into the screen edge auto-pans and keeps extending the plan', () => {
  const t = setup('road');
  t.down(1, 400, 200);
  drag(t, [[1, 400, 200, 845, 200]]);
  const b0 = t.log.plans[t.log.plans.length - 1].b;
  const target0 = t.ctrl.rig.target.clone();
  for (let i = 0; i < 60; i++) t.frame(16);
  assert.ok(target0.distanceTo(t.ctrl.rig.target) > 3, 'camera slid toward the edge');
  const b1 = t.log.plans[t.log.plans.length - 1].b;
  assert.ok(Math.hypot(b1.x - b0.x, b1.z - b0.z) >= 3, 'plan kept growing');
  assert.deepEqual(b1, t.tile(845, 200), 'plan end follows the tile under the finger');
  t.up(1, 845, 200);
  assert.equal(t.log.applied.length, 1);
});

test('a tap near the edge does not auto-pan', () => {
  const t = setup('build:park_small');
  t.down(1, 10, 200);
  const target0 = t.ctrl.rig.target.clone();
  for (let i = 0; i < 30; i++) t.frame(16);
  assert.ok(target0.distanceTo(t.ctrl.rig.target) < 1e-9);
  t.up(1, 10, 200);
  assert.equal(t.log.applied.length, 1);
});

test('mouse: wheel zooms at the cursor, right-drag pans, alt-drag rotates, keys move the camera', () => {
  const t = setup('road');
  const g = t.ground(600, 120);
  const wheel = Object.assign(new Event('wheel', { cancelable: true }), { deltaY: -300, deltaMode: 0, clientX: 600, clientY: 120, ctrlKey: false });
  t.el.dispatchEvent(wheel);
  assert.ok(wheel.defaultPrevented);
  for (let i = 0; i < 60; i++) t.frame();
  assert.ok(t.ctrl.rig.distance < 30);
  assert.ok(dist2(g, t.ground(600, 120)) < 1e-3, 'zoomed toward the cursor');

  const mouse = { pointerType: 'mouse' };
  const grabbed = t.ground(400, 200);
  t.down(9, 400, 200, { ...mouse, button: 2, buttons: 2 });
  drag(t, [[9, 400, 200, 300, 250]].map((p) => p as [number, number, number, number, number]));
  assert.ok(dist2(grabbed, t.ground(300, 250)) < 1e-6, 'right-drag pans');
  t.up(9, 300, 250, { ...mouse, button: 2, buttons: 0 });
  assert.equal(t.log.plans.length, 0, 'right-drag never plans');

  t.newSequence();
  const yaw0 = t.ctrl.rig.yaw;
  t.down(9, 400, 200, { ...mouse, altKey: true });
  t.move(9, 450, 200, { ...mouse });
  t.frame();
  t.up(9, 450, 200, { ...mouse, buttons: 0 });
  assert.ok(Math.abs(t.ctrl.rig.yaw - yaw0) > 0.2, 'alt-drag rotates');
  assert.equal(t.log.plans.length, 0);

  const x0 = t.ctrl.rig.target.clone();
  t.keys.dispatchEvent(Object.assign(new Event('keydown'), { code: 'KeyD', key: 'd' }));
  for (let i = 0; i < 30; i++) t.frame();
  t.keys.dispatchEvent(Object.assign(new Event('keyup'), { code: 'KeyD', key: 'd' }));
  assert.ok(x0.distanceTo(t.ctrl.rig.target) > 2, 'D pans');
  const d0 = t.ctrl.rig.distance;
  t.keys.dispatchEvent(Object.assign(new Event('keydown'), { code: 'Minus', key: '-' }));
  for (let i = 0; i < 30; i++) t.frame();
  t.keys.dispatchEvent(Object.assign(new Event('keyup'), { code: 'Minus', key: '-' }));
  assert.ok(t.ctrl.rig.distance > d0, '- zooms out');

  // Escape cancels a plan
  t.newSequence();
  t.down(10, 400, 200, { ...mouse });
  t.keys.dispatchEvent(Object.assign(new Event('keydown'), { code: 'Escape', key: 'Escape' }));
  t.up(10, 400, 200, { ...mouse, buttons: 0 });
  assert.equal(t.log.applied.length, 0);
});

test('touched() fires on every pointerdown and pointerup; disabled input ignores gestures', () => {
  const t = setup('road');
  t.ctrl.setEnabled(false);
  t.down(1, 300, 200);
  t.up(1, 300, 200);
  assert.equal(t.log.touches, 2, 'audio can still be unlocked while the world is paused');
  assert.equal(t.log.applied.length, 0);
  t.ctrl.setEnabled(true);
  t.newSequence();
  t.down(2, 300, 200);
  t.down(3, 400, 200);
  assert.equal(t.log.touches, 4);
});

test('auto-pan stops once the finger points past the map border', () => {
  const t = setup('road');
  t.down(1, 400, 200);
  drag(t, [[1, 400, 200, 845, 200]]);
  for (let i = 0; i < 400; i++) t.frame(16);
  const a = t.ctrl.rig.target.clone();
  for (let i = 0; i < 30; i++) t.frame(16);
  assert.ok(a.distanceTo(t.ctrl.rig.target) < 1e-9, 'came to rest');
  const g = t.ground(845, 200);
  assert.ok(g.x <= N + 1.5 && g.z <= N + 1.5 && g.x >= -1.5 && g.z >= -1.5, `finger over ${g.x.toFixed(2)}, ${g.z.toFixed(2)}`);
  const b = t.log.plans[t.log.plans.length - 1].b;
  assert.ok(b.x === N - 1 || b.z === 0, 'the plan reaches the border');
  t.up(1, 845, 200);
  assert.equal(t.log.applied.length, 1);
});

test('setMapSize re-clamps and dispose detaches every listener', () => {
  const t = setup('inspect');
  t.ctrl.setMapSize(20);
  assert.ok(t.ctrl.rig.target.x <= 20 && t.ctrl.rig.target.z <= 20);
  t.ctrl.dispose();
  t.down(1, 400, 200);
  t.up(1, 400, 200);
  assert.equal(t.log.touches, 0);
  assert.equal(t.log.inspected.length, 0);
});
