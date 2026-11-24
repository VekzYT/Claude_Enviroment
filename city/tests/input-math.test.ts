// Pure camera and gesture math of the input module: ground raycast, projection, zoom/rotate about
// a ground point, two-finger decomposition and classification, clamping, smoothing.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import {
  type Lens,
  type RigView,
  cameraPosition,
  clampView,
  classifyTwoFinger,
  edgeDepth,
  groundAt,
  limitsFor,
  projectGround,
  rotateAbout,
  springStep,
  twoFingerStep,
  wrapAngle,
  zoomAbout,
} from '../src/input/math';

const LENS: Lens = { fov: 40, aspect: 852 / 393, zoom: 1 };
const LIM = limitsFor(64);

function view(tx = 32, tz = 32, yaw = Math.PI / 4, pitch = 0.95, distance = 38): RigView {
  return { tx, tz, yaw, pitch, distance };
}

/** Reference: three.js camera placed like the rig, raycast against y = 0. */
function threeGround(v: RigView, lens: Lens, nx: number, ny: number): { x: number; z: number } | null {
  const cam = new THREE.PerspectiveCamera(lens.fov, lens.aspect, 0.1, 2000);
  cam.zoom = lens.zoom;
  cam.updateProjectionMatrix();
  const p = cameraPosition(v, { x: 0, y: 0, z: 0 });
  cam.position.set(p.x, p.y, p.z);
  cam.lookAt(v.tx, 0, v.tz);
  cam.updateMatrixWorld();
  const rc = new THREE.Raycaster();
  rc.setFromCamera(new THREE.Vector2(nx, ny), cam);
  const hit = new THREE.Vector3();
  return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit) ? { x: hit.x, z: hit.z } : null;
}

function screenOf(v: RigView, x: number, z: number) {
  const p = projectGround(v, LENS, x, z, { x: 0, y: 0 });
  assert.ok(p, 'point should be in front of the camera');
  return p;
}

test('groundAt matches a three.js raycast for many views and screen points', () => {
  const views = [view(), view(10, 50, -2.1, 0.6, 12), view(60, 4, 3.0, 1.3, 85), view(32, 32, 0, 0.55, 8)];
  const lenses: Lens[] = [LENS, { fov: 55, aspect: 1.2, zoom: 1 }, { fov: 40, aspect: 2.17, zoom: 1.5 }];
  for (const v of views) {
    for (const lens of lenses) {
      for (const [nx, ny] of [
        [0, 0],
        [-0.9, -0.9],
        [0.9, -0.9],
        [0.5, 0.6],
        [-0.7, 0.95],
      ]) {
        const a = groundAt(v, lens, nx, ny, { x: 0, z: 0 });
        const b = threeGround(v, lens, nx, ny);
        assert.equal(!!a, !!b, `hit/miss mismatch at ${nx},${ny}`);
        if (a && b) {
          assert.ok(Math.abs(a.x - b.x) < 1e-6 * Math.max(1, Math.abs(b.x)), `x ${a.x} vs ${b.x}`);
          assert.ok(Math.abs(a.z - b.z) < 1e-6 * Math.max(1, Math.abs(b.z)), `z ${a.z} vs ${b.z}`);
        }
      }
    }
  }
});

test('the screen centre looks at the target', () => {
  const v = view(20, 41, 1.1, 0.8, 30);
  const g = groundAt(v, LENS, 0, 0, { x: 0, z: 0 })!;
  assert.ok(Math.abs(g.x - 20) < 1e-9 && Math.abs(g.z - 41) < 1e-9);
});

test('a ray above the horizon misses the ground', () => {
  // a very wide lens at the lowest pitch sees sky at the top of the screen
  const v = view(32, 32, 0, 0.55, 40);
  assert.equal(groundAt(v, { fov: 100, aspect: 2, zoom: 1 }, 0, 1, { x: 0, z: 0 }), null);
});

test('projectGround inverts groundAt', () => {
  const v = view(12, 50, -0.7, 1.1, 25);
  for (const [nx, ny] of [
    [0.3, -0.4],
    [-0.8, 0.7],
    [0.95, 0.95],
  ]) {
    const g = groundAt(v, LENS, nx, ny, { x: 0, z: 0 })!;
    const s = projectGround(v, LENS, g.x, g.z, { x: 0, y: 0 })!;
    assert.ok(Math.abs(s.x - nx) < 1e-9 && Math.abs(s.y - ny) < 1e-9);
  }
});

test('zoomAbout keeps the ground point fixed on screen and clamps the distance', () => {
  const v = view();
  const before = { x: 0.4, y: -0.3 };
  const g = groundAt(v, LENS, before.x, before.y, { x: 0, z: 0 })!;
  const k = zoomAbout(v, g.x, g.z, 0.5, LIM);
  assert.equal(k, 0.5);
  assert.equal(v.distance, 19);
  const s = screenOf(v, g.x, g.z);
  assert.ok(Math.abs(s.x - before.x) < 1e-9 && Math.abs(s.y - before.y) < 1e-9);
  // past the limit: clamped, and the point still holds
  const k2 = zoomAbout(v, g.x, g.z, 0.1, LIM);
  assert.equal(v.distance, LIM.minDistance);
  assert.ok(Math.abs(k2 - 8 / 19) < 1e-12);
  const s2 = screenOf(v, g.x, g.z);
  assert.ok(Math.abs(s2.x - before.x) < 1e-9 && Math.abs(s2.y - before.y) < 1e-9);
  assert.equal(zoomAbout(v, g.x, g.z, NaN, LIM), 1);
});

test('rotateAbout keeps the pivot on screen and positive angles turn the picture clockwise', () => {
  const v = view();
  const g = groundAt(v, LENS, -0.2, -0.1, { x: 0, z: 0 })!;
  const pivot0 = screenOf(v, g.x, g.z);
  // another ground point, and its screen angle around the pivot (screen y down, so atan2 grows clockwise)
  const o = groundAt(v, LENS, 0.3, -0.1, { x: 0, z: 0 })!;
  const so0 = screenOf(v, o.x, o.z);
  const ang0 = Math.atan2(-(so0.y - pivot0.y), so0.x - pivot0.x);
  rotateAbout(v, g.x, g.z, 0.3);
  const pivot1 = screenOf(v, g.x, g.z);
  assert.ok(Math.abs(pivot1.x - pivot0.x) < 1e-9 && Math.abs(pivot1.y - pivot0.y) < 1e-9);
  assert.ok(Math.abs(v.yaw - (Math.PI / 4 + 0.3)) < 1e-12);
  const so1 = screenOf(v, o.x, o.z);
  const ang1 = Math.atan2(-(so1.y - pivot1.y), so1.x - pivot1.x);
  assert.ok(wrapAngle(ang1 - ang0) > 0.1, `clockwise on screen expected, got ${wrapAngle(ang1 - ang0)}`);
});

test('twoFingerStep: pan, pinch, twist and degenerate spreads', () => {
  const out = { mx0: 0, my0: 0, mx1: 0, my1: 0, scale: 0, twist: 0 };
  twoFingerStep(100, 100, 200, 100, 130, 80, 230, 80, out);
  assert.deepEqual([out.mx0, out.my0, out.mx1, out.my1, out.scale, out.twist], [150, 100, 180, 80, 1, 0]);
  twoFingerStep(100, 100, 200, 100, 50, 100, 250, 100, out);
  assert.equal(out.scale, 2);
  assert.equal(out.twist, 0);
  // the line between the fingers turns from pointing right to pointing down: clockwise on screen
  twoFingerStep(100, 100, 200, 100, 150, 50, 150, 150, out);
  assert.ok(Math.abs(out.twist - Math.PI / 2) < 1e-12);
  assert.ok(Math.abs(out.scale - 1) < 1e-12);
  // across the ±π seam the twist stays small
  twoFingerStep(200, 100, 100, 101, 200, 100, 100, 99, out);
  assert.ok(Math.abs(out.twist) < 0.05);
  // fingers nearly on top of each other: no scale or twist from the noise
  twoFingerStep(100, 100, 103, 100, 100, 100, 100, 104, out);
  assert.equal(out.scale, 1);
  assert.equal(out.twist, 0);
});

test('classifyTwoFinger tells tilt from pan/pinch/twist', () => {
  // under the slop: undecided
  assert.equal(classifyTwoFinger(300, 200, 500, 200, 303, 196, 502, 195, 10), 'pending');
  // side by side, both slide up together: tilt
  assert.equal(classifyTwoFinger(300, 200, 500, 200, 302, 170, 499, 168, 10), 'tilt');
  assert.equal(classifyTwoFinger(300, 200, 500, 210, 300, 240, 501, 252, 10), 'tilt');
  // pinch apart
  assert.equal(classifyTwoFinger(300, 200, 500, 200, 280, 200, 520, 200, 10), 'transform');
  // sideways pan
  assert.equal(classifyTwoFinger(300, 200, 500, 200, 330, 202, 530, 201, 10), 'transform');
  // fingers one above the other sliding up: a pan, not a tilt
  assert.equal(classifyTwoFinger(400, 100, 410, 300, 401, 70, 411, 270, 10), 'transform');
  // only one finger moves (a rotate/pinch about the other)
  assert.equal(classifyTwoFinger(300, 200, 500, 200, 300, 200, 500, 170, 10), 'transform');
  // vertical but opposite directions: twist
  assert.equal(classifyTwoFinger(300, 200, 500, 200, 300, 220, 500, 180, 10), 'transform');
});

test('clampView keeps the view inside the map and limits, and repairs bad numbers', () => {
  const v = clampView({ tx: -5, tz: 99, yaw: 1, pitch: 3, distance: 500 }, LIM);
  assert.deepEqual(v, { tx: 0, tz: 64, yaw: 1, pitch: LIM.maxPitch, distance: LIM.maxDistance });
  const w = clampView({ tx: NaN, tz: Infinity, yaw: NaN, pitch: -1, distance: 0 }, LIM);
  assert.equal(w.tx, 32);
  assert.equal(w.tz, 32);
  assert.ok(Number.isFinite(w.yaw));
  assert.equal(w.pitch, LIM.minPitch);
  assert.equal(w.distance, LIM.minDistance);
  assert.equal(LIM.maxDistance, 90);
  assert.ok(limitsFor(128).maxDistance > 90);
});

test('springStep is critically damped: converges, never overshoots from rest, stable for big steps', () => {
  const s = { x: 0, v: 0 };
  let last = 0;
  for (let i = 0; i < 120; i++) {
    springStep(s, 10, 0.1, 1 / 60);
    assert.ok(s.x <= 10 + 1e-9, 'no overshoot');
    assert.ok(s.x >= last - 1e-12, 'monotonic');
    last = s.x;
  }
  assert.ok(Math.abs(s.x - 10) < 1e-3);
  const big = springStep({ x: 0, v: 0 }, 5, 0.1, 10);
  assert.ok(Math.abs(big.x - 5) < 1e-6 && Number.isFinite(big.v));
  const zero = springStep({ x: 3, v: 2 }, 7, 0, 0.016);
  assert.deepEqual(zero, { x: 7, v: 0 });
});

test('edgeDepth and wrapAngle', () => {
  assert.equal(edgeDepth(0, 852, 48), -1);
  assert.equal(edgeDepth(24, 852, 48), -0.5);
  assert.equal(edgeDepth(400, 852, 48), 0);
  assert.equal(edgeDepth(852, 852, 48), 1);
  assert.equal(edgeDepth(900, 852, 48), 1);
  assert.equal(edgeDepth(10, 50, 48), 0); // a tiny canvas has no edge band
  assert.ok(Math.abs(wrapAngle(3 * Math.PI) - Math.PI) < 1e-12);
  assert.ok(Math.abs(wrapAngle(-Math.PI / 2 - 4 * Math.PI) + Math.PI / 2) < 1e-12);
});
