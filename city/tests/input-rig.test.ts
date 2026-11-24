// The orbiting camera rig: defaults, clamping, smoothing, focus, anchored wheel zoom, fling, apply.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { type Lens, groundAt, projectGround } from '../src/input/math';
import { OrbitRig } from '../src/input/rig';

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

function run(rig: OrbitRig, seconds: number, fps = 60) {
  for (let t = 0; t < seconds; t += 1 / fps) rig.update(1 / fps);
}

test('starts over the map centre with the default angles', () => {
  const rig = new OrbitRig(64);
  assert.deepEqual(rig.target.toArray(), [32, 0, 32]);
  assert.ok(near(rig.yaw, Math.PI / 4));
  assert.ok(near(rig.pitch, 0.95));
  assert.equal(rig.distance, 38);
  assert.equal(rig.isMoving(), false);
});

test('apply places the camera, looks at the target and sets near/far to cover the map', () => {
  const rig = new OrbitRig(64);
  const cam = new THREE.PerspectiveCamera(40, 852 / 393, 0.5, 400);
  rig.apply(cam);
  const p = cam.position;
  assert.ok(near(p.y, Math.sin(0.95) * 38));
  assert.ok(near(Math.hypot(p.x - 32, p.y, p.z - 32), 38));
  // the target projects to the screen centre
  const c = new THREE.Vector3(32, 0, 32).project(cam);
  assert.ok(Math.abs(c.x) < 1e-6 && Math.abs(c.y) < 1e-6);
  assert.ok(cam.near > 0 && cam.near < 2);
  // every map corner is closer than the far plane, at the most zoomed-out view too
  rig.distance = 1000;
  rig.pitch = 0;
  rig.apply(cam);
  for (const [x, z] of [
    [0, 0],
    [64, 0],
    [0, 64],
    [64, 64],
  ]) {
    assert.ok(cam.position.distanceTo(new THREE.Vector3(x, 0, z)) < cam.far, 'corner inside far plane');
  }
  assert.equal(rig.distance, 90);
  assert.equal(rig.pitch, 0.55);
});

test('setters clamp and ignore non-numbers', () => {
  const rig = new OrbitRig(64);
  rig.pitch = 5;
  assert.equal(rig.pitch, 1.35);
  rig.distance = 1;
  assert.equal(rig.distance, 8);
  rig.yaw = NaN;
  assert.ok(near(rig.yaw, Math.PI / 4));
  rig.yaw = 2;
  assert.equal(rig.yaw, 2);
  assert.equal(rig.goal.yaw, 2, 'a direct set does not spring back');
  run(rig, 0.5);
  assert.equal(rig.yaw, 2);
});

test('focus glides smoothly to the tile centre without overshooting, and clamps to the map', () => {
  const rig = new OrbitRig(64);
  rig.focus(10, 50);
  let lastX = rig.target.x;
  const xs: number[] = [];
  for (let i = 0; i < 120; i++) {
    rig.update(1 / 60);
    assert.ok(rig.target.x <= lastX + 1e-9, 'moves one way only');
    assert.ok(rig.target.x >= 10.5 - 1e-9, 'no overshoot');
    lastX = rig.target.x;
    xs.push(lastX);
  }
  assert.ok(xs[0] > 30, 'it glides rather than jumping');
  assert.ok(near(rig.target.x, 10.5, 1e-3) && near(rig.target.z, 50.5, 1e-3));
  run(rig, 2);
  assert.equal(rig.isMoving(), false);
  rig.focus(200, -40);
  run(rig, 3);
  assert.deepEqual(rig.target.toArray(), [64, 0, 0]);
});

test('setMapSize re-clamps the target and the zoom range', () => {
  const rig = new OrbitRig(64);
  rig.setMapSize(16);
  assert.deepEqual(rig.target.toArray(), [16, 0, 16]);
  rig.setMapSize(200);
  rig.distance = 1000;
  assert.ok(rig.distance > 90 && rig.distance <= 200 * 1.4);
});

test('an outside edit of rig.target is taken as a jump, not undone', () => {
  const rig = new OrbitRig(64);
  rig.target.set(5, 3, 6);
  run(rig, 0.5);
  assert.deepEqual(rig.target.toArray(), [5, 0, 6]);
  rig.target.set(-10, 0, 99);
  rig.update(1 / 60);
  assert.deepEqual(rig.target.toArray(), [0, 0, 64]);
});

test('wheel-style zoom keeps the anchored ground point under the cursor all the way', () => {
  const rig = new OrbitRig(64);
  const lens: Lens = { fov: 40, aspect: 852 / 393, zoom: 1 };
  const ndc = { x: 0.5, y: -0.4 };
  const g = groundAt(rig.current, lens, ndc.x, ndc.y, { x: 0, z: 0 })!;
  rig.zoomBy(0.5, g.x, g.z);
  for (let i = 0; i < 60; i++) {
    rig.update(1 / 60);
    const s = projectGround(rig.current, lens, g.x, g.z, { x: 0, y: 0 })!;
    assert.ok(near(s.x, ndc.x, 1e-6) && near(s.y, ndc.y, 1e-6), `drifted to ${s.x},${s.y}`);
  }
  assert.ok(near(rig.distance, 19, 1e-3));
});

test('a fling coasts, slows down, stops, and stays on the map', () => {
  const rig = new OrbitRig(64);
  rig.fling(40, 0);
  rig.update(1 / 60);
  const x1 = rig.target.x;
  assert.ok(x1 > 32);
  run(rig, 0.25);
  const x2 = rig.target.x;
  run(rig, 0.25);
  const x3 = rig.target.x;
  assert.ok(x2 - x1 > x3 - x2, 'decelerates');
  run(rig, 5);
  assert.equal(rig.flingSpeed(), 0);
  assert.ok(rig.target.x <= 64 && rig.target.x > 32 + 5);
  rig.fling(-1e6, 0);
  run(rig, 1);
  assert.equal(rig.target.x, 0);
  assert.equal(rig.flingSpeed(), 0, 'hitting the edge kills the fling');
});

test('halt freezes glides where they are; direct jumps; bad dt is ignored', () => {
  const rig = new OrbitRig(64);
  rig.focus(0, 0);
  rig.update(1 / 60);
  const x = rig.target.x;
  rig.halt();
  run(rig, 1);
  assert.equal(rig.target.x, x);
  rig.goal.yaw += 1;
  rig.direct();
  assert.ok(near(rig.yaw, Math.PI / 4 + 1));
  const before = rig.target.toArray();
  rig.focus(60, 60);
  rig.update(NaN);
  rig.update(-1);
  assert.deepEqual(rig.target.toArray(), before);
  rig.update(5); // a long stall is treated as one 0.1 s step, not a teleport
  assert.ok(rig.target.x < 60);
});

test('reset glides back to the default view the short way round', () => {
  const rig = new OrbitRig(64);
  rig.yaw = Math.PI / 4 + Math.PI * 6 + 0.5;
  rig.focus(3, 3);
  run(rig, 2);
  rig.reset();
  run(rig, 3);
  assert.ok(near(rig.target.x, 32, 1e-3) && near(rig.distance, 38, 1e-3));
  assert.ok(near(Math.cos(rig.yaw), Math.cos(Math.PI / 4), 1e-4));
  assert.ok(Math.abs(rig.yaw) < Math.PI * 8, 'yaw kept bounded');
});
