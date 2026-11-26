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
    this.low = 0;        // how far the on-foot view has dropped for a slide or roll
    this.side = 0;       // sideways offset of the view (over the shoulder when aiming), smoothed
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
      // a little life on foot: wider when sprinting or sliding, lower through rolls and slides
      fovT = aiming ? 46 : 62 + (p.sprinting ? 6 : 0) + (p.state === 'slide' ? 8 : 0);
      this.low += ((p.state === 'slide' ? 0.6 : p.state === 'roll' ? 0.4 : 0) - this.low) * Math.min(1, dt * 7);
      _t.set(p.pos.x, p.pos.y + height - this.low + (p.swimming ? 0.5 : 0), p.pos.z);
      if (p.state === 'dead' || p.state === 'busted') { this.yaw += dt * 0.25; this.pitch += (0.55 - this.pitch) * Math.min(1, dt); dist = 6 + Math.min(p.stateT, 4); }
      // a menu over the game (the wardrobe, a shop): the player close up, beside the panel on the right
      if (G.mode === 'menu') { dist = 2.7; _t.y = p.pos.y + 1.15; side = 0.95; fovT = 50; }
    }
    // the view is set once when a menu opens, so it goes straight there; easing back out after
    const snap = G.mode === 'menu';
    this.side += (side - this.side) * (snap ? 1 : Math.min(1, dt * 8));
    if (this.first || snap) { this.target.copy(_t); this.first = false; }
    if (v || (p.aiming && p.state === 'foot')) this.target.lerp(_t, 1 - Math.exp(-dt * (v ? 14 : 18)));
    else {
      // on foot the view trails the body a touch, and lags more vertically so jumps and climbs stay smooth
      const kh = 1 - Math.exp(-dt * 11), kv = 1 - Math.exp(-dt * 8);
      this.target.x += (_t.x - this.target.x) * kh; this.target.z += (_t.z - this.target.z) * kh; this.target.y += (_t.y - this.target.y) * kv;
    }
    this.dist += (dist - this.dist) * (snap ? 1 : Math.min(1, dt * 6));

    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    // unit vector from the target back towards the camera
    _d.set(-Math.sin(this.yaw) * cp, sp, -Math.cos(this.yaw) * cp);
    // landings dip the view (the player's landing squash sets camDip)
    const ox = this.target.x + -Math.cos(this.yaw) * this.side, oy = this.target.y - (v ? 0 : p.camDip), oz = this.target.z + Math.sin(this.yaw) * this.side;
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
    this.fov += (fovT - this.fov) * (snap ? 1 : Math.min(1, dt * 5));
    if (Math.abs(this.cam.fov - this.fov) > 0.05) { this.cam.fov = this.fov; this.cam.updateProjectionMatrix(); }
  }
}
