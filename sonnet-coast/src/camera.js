// Third-person camera: orbit on foot, chase cam in vehicles, over-the-shoulder when aiming.
import * as THREE from 'three';
import { G } from './state.js';
import { Input } from './input.js';
import { groundHeight } from './world/roads.js';
import { rayBoxes } from './world/colliders.js';
import { clamp, wrapAngle, lerp } from './util/math.js';

const _t = new THREE.Vector3(), _d = new THREE.Vector3(), _look = new THREE.Vector3();

export class GameCamera {
  constructor(camera) {
    this.cam = camera;
    this.yaw = Math.PI;
    this.pitch = 0.22;
    this.dist = 5;
    this.target = new THREE.Vector3();
    this.idle = 0;
    this.fov = 62;
    this.zoom = 1;       // 0.75 near, 1 normal, 1.45 far (cycled with V)
    this.first = true;
    this.cinematic = null;
    this.slide = 0;      // smoothed drift angle of the player's vehicle
  }
  forward(out = new THREE.Vector3()) { return this.cam.getWorldDirection(out); }

  update(dt, t) {
    const p = G.player;
    const v = p.vehicle;
    const m = Input.mouse;
    const sens = 0.0024 * G.settings.sensitivity;
    if (m.dx || m.dy) {
      this.yaw -= m.dx * sens;
      this.pitch = clamp(this.pitch + m.dy * sens * (G.settings.invertY ? -1 : 1), -0.55, 1.25);
      this.idle = 0;
    } else this.idle += dt;
    if (Input.hit('KeyV')) this.zoom = this.zoom < 0.9 ? 1 : this.zoom < 1.2 ? 1.45 : 0.75;

    let dist, height, side = 0, fovT = 62;
    if (v) {
      const T = v.T;
      dist = (T.len * 1.15 + 3.4) * this.zoom;
      height = T.hgt * 0.55 + 0.9;
      _t.set(v.pos.x, v.pos.y + height, v.pos.z);
      // in a drift the view swings part of the way towards the direction of travel, so the slide reads from behind
      this.slide += ((v.drift ? v.slideAngle : 0) - this.slide) * Math.min(1, dt * 3);
      // swing back behind the vehicle when the mouse is left alone
      const lookBack = Input.key('KeyC');
      if (lookBack) { this.yaw = v.heading + Math.PI; this.idle = 0.5; }
      else if (this.idle > 0.9 && v.speed > 1.5) {
        const goal = v.heading + (v.fwd < -2 ? Math.PI : 0) - this.slide * 0.45;
        this.yaw += wrapAngle(goal - this.yaw) * Math.min(1, dt * 3.2);
        this.pitch += (0.2 - this.pitch) * Math.min(1, dt * 2);
      }
      fovT = 62 + clamp(v.speed / 60, 0, 1) * 16 + (v.boosting ? 9 : 0) + Math.min(Math.abs(this.slide), 0.8) * 9;
      dist += clamp(v.speed / 60, 0, 1) * 1.6;
    } else {
      this.slide = 0;
      const aiming = p.aiming && p.state === 'foot';
      dist = (aiming ? 2.3 : 4.8) * (aiming ? 1 : this.zoom);
      height = aiming ? 1.62 : 1.55;
      side = aiming ? 0.55 : 0;
      fovT = aiming ? 46 : 62;
      _t.set(p.pos.x, p.pos.y + height + (p.swimming ? 0.5 : 0), p.pos.z);
      if (p.state === 'dead' || p.state === 'busted') { this.yaw += dt * 0.25; this.pitch += (0.55 - this.pitch) * Math.min(1, dt); dist = 6 + Math.min(p.stateT, 4); }
    }
    if (this.first) { this.target.copy(_t); this.first = false; }
    this.target.lerp(_t, 1 - Math.exp(-dt * (v ? 14 : 18)));
    this.dist += (dist - this.dist) * Math.min(1, dt * 6);

    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    // unit vector from the target back towards the camera
    _d.set(-Math.sin(this.yaw) * cp, sp, -Math.cos(this.yaw) * cp);
    const ox = this.target.x + -Math.cos(this.yaw) * side, oy = this.target.y, oz = this.target.z + Math.sin(this.yaw) * side;
    let d = this.dist;
    const hit = rayBoxes(ox, oy, oz, _d.x, _d.y, _d.z, d + 0.4);
    if (hit < d + 0.4) d = Math.max(0.6, hit - 0.4);
    let cx = ox + _d.x * d, cy = oy + _d.y * d, cz = oz + _d.z * d;
    const g = Math.max(groundHeight(cx, cz, cy + 2), 0) + 0.35;
    if (cy < g) cy = g;
    const sh = G.fx ? G.fx.shake : 0;
    if (sh > 0.01) { cx += (Math.random() - 0.5) * sh * 0.35; cy += (Math.random() - 0.5) * sh * 0.35; cz += (Math.random() - 0.5) * sh * 0.35; }
    this.cam.position.set(cx, cy, cz);
    _look.set(ox - _d.x * 30, oy - _d.y * 30 + (v ? 0 : 0), oz - _d.z * 30);
    this.cam.lookAt(_look);
    this.fov += (fovT - this.fov) * Math.min(1, dt * 5);
    if (Math.abs(this.cam.fov - this.fov) > 0.05) { this.cam.fov = this.fov; this.cam.updateProjectionMatrix(); }
  }
}
