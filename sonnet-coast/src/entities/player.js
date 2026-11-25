// The operative: on-foot movement, getting in and out of vehicles, health, and a
// procedurally animated model with swappable outfits.
import * as THREE from 'three';
import { G, emit } from '../state.js';
import { Input } from '../input.js';
import { groundHeight, terrainHeight } from '../world/roads.js';
import { resolveCircle, queryColliders } from '../world/colliders.js';
import { WATER_Y, POI } from '../world/layout.js';
import { clamp, wrapAngle, lerp } from '../util/math.js';
import { rand, pick } from '../util/rng.js';
import { PAL } from '../world/palette.js';
import { PED_LOOKS } from './pedlooks.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ellipseLoft, limbGeo, torsoGeo, hipsGeo, headGeo, hairGeo, capGeo, handGeo, shoeGeo } from './bodyGeo.js';

export const OUTFITS = {
  jacket: [['Terracotta Bomber', 0xc8643b], ['Slate Tactical', 0x3d3f45], ['Cream Windbreaker', 0xeee6d6], ['Midnight Shell', 0x14161c], ['Teal Tech', 0x1f8f88], ['Signal Coral', 0xff7a59]],
  pants: [['Graphite Cargo', 0x25272c], ['Sand Utility', 0xb8a27c], ['Slate Denim', 0x44506a], ['Night Ops', 0x101114]],
  accent: [['Cyan', PAL.neonCyan], ['Coral', PAL.neonCoral], ['Magenta', PAL.neonMagenta], ['Lime', PAL.neonLime], ['Amber', PAL.neonAmber]],
  head: [['Bare'], ['Courier Cap'], ['Field Helmet'], ['Hood']],
  vest: [['No vest'], ['Tactical Vest']],
  pack: [['No pack'], ['Field Pack']],
};
export const DEFAULT_OUTFIT = { jacket: 0, pants: 0, accent: 0, head: 1, vest: 1, pack: 1 };

const out = { x: 0, z: 0, broken: [] };
const GRAV = 24;

function buildModel() {
  const root = new THREE.Group();
  const mats = {
    jacket: new THREE.MeshStandardMaterial({ color: 0xc8643b, roughness: 0.72 }),
    pants: new THREE.MeshStandardMaterial({ color: 0x25272c, roughness: 0.85 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xd9a47c, roughness: 0.55, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.55, metalness: 0.2 }),
    gear: new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.7 }),
    hair: new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.6 }),
    boot: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
    accent: new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonCyan).multiplyScalar(1.4), toneMapped: false }),
  };
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m; };
  const rb = (w, h, d, mat, x = 0, y = 0, z = 0, r = 0.03) => mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01)), mat, x, y, z);
  const P = {};
  P.hips = new THREE.Group(); P.hips.position.y = 0.86; root.add(P.hips);
  P.hips.add(mesh(hipsGeo(1.02), mats.pants, 0, 0.1, 0));
  P.hips.add(mesh(ellipseLoft([[0, 0.178, 0.116], [0.035, 0.18, 0.118], [0.07, 0.176, 0.116]], 16, 0.86), mats.dark, 0, 0.06, 0));   // belt
  P.hips.add(rb(0.07, 0.05, 0.02, mats.gear, 0, 0.095, 0.118, 0.008));
  P.torso = new THREE.Group(); P.torso.position.y = 0.1; P.hips.add(P.torso);
  P.torso.add(mesh(torsoGeo(0.56, 1.08), mats.jacket));
  P.torso.add(mesh(ellipseLoft([[0, 0.086, 0.082, -0.004], [0.05, 0.084, 0.078, -0.006], [0.085, 0.07, 0.066, -0.006]], 12), mats.jacket, 0, 0.56, 0));   // collar
  P.torso.add(mesh(limbGeo(0.09, 0.055, 0.052, 10, 1), mats.skin, 0, 0.71, -0.004));                                                                    // neck
  P.torso.add(rb(0.022, 0.4, 0.012, mats.accent, 0, 0.3, 0.127, 0.005));                                                                               // zip line
  P.vest = new THREE.Group();
  P.vest.add(mesh(ellipseLoft([[0.04, 0.182, 0.122], [0.14, 0.2, 0.134, 0.004], [0.3, 0.236, 0.142, 0.008], [0.44, 0.232, 0.136, 0.006], [0.5, 0.2, 0.12, 0.002]], 16, 0.8), mats.gear));
  for (const sx of [-1, 1]) P.vest.add(rb(0.12, 0.12, 0.05, mats.dark, sx * 0.1, 0.16, 0.14, 0.02), rb(0.05, 0.3, 0.03, mats.dark, sx * 0.16, 0.42, 0.11, 0.012));
  P.torso.add(P.vest);
  P.pack = new THREE.Group();
  P.pack.add(rb(0.32, 0.4, 0.15, mats.gear, 0, 0.3, -0.2, 0.06), rb(0.24, 0.14, 0.06, mats.dark, 0, 0.2, -0.29, 0.025), rb(0.03, 0.26, 0.012, mats.accent, 0, 0.36, -0.278, 0.005));
  P.torso.add(P.pack);
  P.head = new THREE.Group(); P.head.position.y = 0.78; P.torso.add(P.head);
  P.head.add(mesh(headGeo(0.118), mats.skin));
  // slim wrap-around glasses in the accent colour
  const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.117, 0.117, 0.034, 16, 1, true, -1.25, 2.5), mats.accent);
  visor.position.set(0, 0.012, 0.004);
  P.head.add(visor);
  P.hair = mesh(hairGeo(0, 0.118), mats.hair);
  P.cap = new THREE.Group(); P.cap.add(mesh(capGeo(0.118), mats.jacket));
  P.helmet = new THREE.Group();
  const shell = mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), mats.gear, 0, 0.012, -0.006);
  shell.scale.set(0.98, 1.06, 1.08);
  P.helmet.add(shell, rb(0.3, 0.035, 0.05, mats.dark, 0, 0.02, 0.13, 0.015), rb(0.04, 0.1, 0.06, mats.dark, 0.15, -0.04, 0, 0.015), rb(0.04, 0.1, 0.06, mats.dark, -0.15, -0.04, 0, 0.015));
  P.hood = mesh(new THREE.SphereGeometry(0.152, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.72), mats.jacket, 0, 0.0, -0.03);
  P.hood.scale.set(1, 1.08, 1.1);
  P.head.add(P.hair, P.cap, P.helmet, P.hood);
  // arms: shoulder -> elbow -> hand
  const arm = (x) => {
    const g = new THREE.Group(); g.position.set(x, 0.47, 0);
    g.add(mesh(new THREE.SphereGeometry(0.078, 10, 8), mats.jacket, 0, 0.0, 0));       // shoulder
    g.add(mesh(limbGeo(0.28, 0.066, 0.056), mats.jacket));
    const fore = new THREE.Group(); fore.position.y = -0.28; g.add(fore);
    fore.add(mesh(limbGeo(0.25, 0.055, 0.044), mats.jacket));
    fore.add(mesh(ellipseLoft([[-0.02, 0.05, 0.048], [0.02, 0.05, 0.048]], 10), mats.dark, 0, -0.235, 0));   // cuff
    fore.add(mesh(handGeo(0.045), mats.skin, 0, -0.315, 0.004));
    return { g, fore };
  };
  const aL = arm(0.262), aR = arm(-0.262);
  P.armL = aL.g; P.armR = aR.g; P.foreL = aL.fore; P.foreR = aR.fore;
  P.torso.add(P.armL, P.armR);
  // legs: hip -> knee -> boot
  const leg = (x) => {
    const g = new THREE.Group(); g.position.set(x, -0.06, 0);
    g.add(mesh(limbGeo(0.37, 0.094, 0.07), mats.pants));
    const shin = new THREE.Group(); shin.position.y = -0.37; g.add(shin);
    shin.add(mesh(limbGeo(0.34, 0.068, 0.052), mats.pants));
    shin.add(mesh(shoeGeo(0.27, 0.104, 0x1b1c20), mats.boot, 0, -0.345, 0));
    return { g, shin };
  };
  const lL = leg(0.1), lR = leg(-0.1);
  P.legL = lL.g; P.legR = lR.g; P.shinL = lL.shin; P.shinR = lR.shin;
  P.hips.add(P.legL, P.legR);
  // held items (right hand)
  const hand = new THREE.Group(); hand.position.set(0, -0.33, 0.05); P.foreR.add(hand);
  const pistol = new THREE.Group();
  pistol.add(rb(0.05, 0.085, 0.27, mats.dark, 0, 0, 0.12, 0.014), rb(0.045, 0.15, 0.065, mats.dark, 0, -0.1, 0.02, 0.014), rb(0.054, 0.02, 0.16, mats.accent, 0, 0.046, 0.14, 0.008), rb(0.02, 0.02, 0.03, mats.gear, 0, 0.05, 0.02, 0.006));
  pistol.rotation.x = Math.PI / 2;
  const baton = new THREE.Group();
  const stick = mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.62, 10), mats.dark, 0, 0, 0.26); stick.rotation.x = Math.PI / 2;
  const tip = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 10), mats.accent, 0, 0, 0.5); tip.rotation.x = Math.PI / 2;
  baton.add(stick, tip);
  baton.rotation.x = Math.PI / 2;
  const emp = mesh(new THREE.IcosahedronGeometry(0.085, 2), mats.gear, 0, 0, 0.06);
  emp.add(new THREE.Mesh(new THREE.TorusGeometry(0.087, 0.012, 6, 20), mats.accent));
  const hack = new THREE.Group();
  hack.add(rb(0.19, 0.022, 0.29, mats.dark, 0, 0, 0.14, 0.01), rb(0.16, 0.006, 0.22, mats.accent, 0, 0.014, 0.16, 0.002));
  hack.rotation.x = Math.PI / 2 - 0.5;
  P.items = { pistol, baton, emp, hack };
  for (const k of Object.keys(P.items)) { P.items[k].visible = false; hand.add(P.items[k]); }
  P.muzzle = new THREE.Object3D(); P.muzzle.position.set(0, -0.3, 0); hand.add(P.muzzle);
  return { root, P, mats };
}

export class Player {
  constructor() {
    this.pos = new THREE.Vector3(POI.safehouse.x + 4, 3, POI.safehouse.z + 4);
    this.vel = new THREE.Vector3();
    this.heading = Math.PI / 2;
    this.onGround = true;
    this.vehicle = null;
    this.state = 'foot';       // foot | entering | ragdoll | dead | busted
    this.stateT = 0;
    this.health = 100; this.maxHealth = 100; this.armor = 0;
    this.lastHurt = -99;
    this.swimming = false;
    this.aiming = false;
    this.speed = 0; this.phase = 0;
    this.punchT = 0; this.recoil = 0;
    this.enterTarget = null; this.enterDur = 0;
    this.invuln = 0;
    this.outfit = { ...DEFAULT_OUTFIT };
    const m = buildModel();
    this.model = m.root; this.P = m.P; this.mats = m.mats;
    this.model.rotation.order = 'YXZ';
    G.scene.add(this.model);
    this.applyOutfit();
    this.heldItem = null;
  }

  applyOutfit(o = this.outfit) {
    this.outfit = { ...DEFAULT_OUTFIT, ...o };
    const O = this.outfit, M = this.mats, P = this.P;
    M.jacket.color.set(OUTFITS.jacket[O.jacket % OUTFITS.jacket.length][1]);
    M.pants.color.set(OUTFITS.pants[O.pants % OUTFITS.pants.length][1]);
    M.accent.color.set(OUTFITS.accent[O.accent % OUTFITS.accent.length][1]).multiplyScalar(1.4);
    P.hair.visible = O.head === 0 || O.head === 1; P.cap.visible = O.head === 1; P.helmet.visible = O.head === 2; P.hood.visible = O.head === 3;
    P.vest.visible = !!O.vest; P.pack.visible = !!O.pack;
  }
  setHeld(name) {
    this.heldItem = name;
    for (const k of Object.keys(this.P.items)) this.P.items[k].visible = k === name;
  }
  muzzlePos(target = new THREE.Vector3()) { return this.P.muzzle.getWorldPosition(target); }

  get inVehicle() { return !!this.vehicle; }
  get alive() { return this.state !== 'dead' && this.state !== 'busted'; }
  // position that matters for the world (vehicle or body)
  get worldPos() { return this.vehicle ? this.vehicle.pos : this.pos; }
  get worldSpeed() { return this.vehicle ? this.vehicle.speed : this.speed; }

  // ---- damage ----------------------------------------------------------------
  hurt(amount, source = null) {
    if (!this.alive || this.invuln > 0 || amount <= 0) return;
    if (this.vehicle && source !== 'crash' && source !== 'explosion' && source !== 'drown') amount *= 0.45;
    if (this.armor > 0) {
      const a = Math.min(this.armor, amount * 0.8);
      this.armor -= a; amount -= a;
    }
    this.health -= amount;
    this.lastHurt = G.time;
    emit('playerHurt', amount, source);
    if (this.health <= 0) { this.health = 0; this.die(source); }
  }
  die(source) {
    if (!this.alive) return;
    if (this.vehicle) this.leaveVehicle(true);
    this.state = 'dead'; this.stateT = 0;
    emit('playerDied', source);
  }
  bust() {
    if (!this.alive) return;
    if (this.vehicle) this.leaveVehicle(true);
    this.state = 'busted'; this.stateT = 0;
    this.vel.set(0, 0, 0);
    emit('playerBusted');
  }
  knockDown(vx, vy, vz, seconds = 1.4) {
    if (!this.alive) return;
    if (this.vehicle) this.leaveVehicle(true);
    this.state = 'ragdoll'; this.stateT = seconds;
    this.vel.set(vx, vy, vz);
    this.onGround = false;
  }
  respawn(x, z, heading = 0) {
    this.pos.set(x, groundHeight(x, z, 9999), z);
    this.vel.set(0, 0, 0);
    this.heading = heading;
    this.health = this.maxHealth; this.state = 'foot'; this.stateT = 0;
    this.invuln = 3;
    this.model.visible = true;
  }

  // ---- vehicles ------------------------------------------------------------
  nearestVehicle(range = 3.6) {
    let best = null, bd = range;
    for (const v of G.vehicles) {
      if (v.sunk || v.destroyed) continue;
      const dx = this.pos.x - v.pos.x, dz = this.pos.z - v.pos.z;
      if (Math.abs(this.pos.y - v.pos.y) > 3) continue;
      const s = Math.sin(v.heading), c = Math.cos(v.heading);
      // distance to the hull: project onto its axes
      const f = clamp(dx * s + dz * c, -v.T.len / 2, v.T.len / 2);
      const r = clamp(dx * -c + dz * s, -v.T.wid / 2, v.T.wid / 2);
      const hx = v.pos.x + s * f + -c * r, hz = v.pos.z + c * f + s * r;
      const d = Math.hypot(this.pos.x - hx, this.pos.z - hz);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }
  tryEnter() {
    const v = this.nearestVehicle();
    if (!v) return false;
    let dur = 0.45, kind = 'enter';
    if (v.driver && v.driver !== 'player') { dur = 0.95; kind = 'jack'; }
    else if (v.locked) { dur = 1.5; kind = 'break'; }
    this.state = 'entering'; this.stateT = 0; this.enterDur = dur; this.enterTarget = v; this.enterKind = kind;
    this.aiming = false;
    emit('enterStart', v, kind);
    return true;
  }
  finishEnter() {
    const v = this.enterTarget;
    this.enterTarget = null;
    if (!v || v.removed || v.destroyed || v.sunk || Math.hypot(v.pos.x - this.pos.x, v.pos.z - this.pos.z) > 7 + v.speed) { this.state = 'foot'; return; }
    const kind = this.enterKind;
    const prev = v.driver;
    if (prev && prev !== 'player') emit('driverEjected', v, prev);
    v.driver = 'player'; v.ai = null; v.locked = false; v.parked = false; v.traffic = false;
    if (!v.stolen && (kind !== 'enter' || v.isPolice)) emit('vehicleStolen', v, kind, prev);
    v.stolen = true;
    this.vehicle = v;
    this.state = 'foot';
    v.inThrottle = 0; v.inSteer = 0; v.inHandbrake = false;
    this.seat();
    emit('enteredVehicle', v, kind);
  }
  seat() {
    const v = this.vehicle;
    if (v.T.open) {
      v.m.body.add(this.model);
      this.model.position.set(v.m.seat[0], v.m.seat[1] - 0.86 + 0.18, v.m.seat[2]);
      this.model.rotation.set(0, 0, 0);
      this.model.visible = true;
    } else this.model.visible = false;
  }
  leaveVehicle(forced = false) {
    const v = this.vehicle;
    if (!v) return;
    const speed = v.speed;
    this.vehicle = null;
    v.driver = null; v.inThrottle = 0; v.inSteer = 0; v.inNitro = false;
    v.lastUsed = G.time;
    G.scene.add(this.model);
    this.model.visible = true;
    // pick a free spot beside the car
    const tmp = new THREE.Vector3();
    let placed = false;
    for (const side of [-1, 1]) {
      v.doorPos(side, tmp);
      const hit = resolveCircle(tmp.x, tmp.z, 0.4, v.pos.y, out, 1.6);
      if (!hit || Math.hypot(out.x - tmp.x, out.z - tmp.z) < 0.5) { this.pos.set(out.x, v.pos.y, out.z); placed = true; break; }
    }
    if (!placed) this.pos.set(v.pos.x, v.pos.y + v.T.hgt + 0.2, v.pos.z);
    const g = groundHeight(this.pos.x, this.pos.z, v.pos.y + 2);
    this.pos.y = v.cls === 'boat' ? Math.max(g, v.pos.y + 0.6) : Math.max(g, Math.min(this.pos.y, g + 2.5));
    this.heading = v.heading;
    this.vel.set(v.vel.x, 0, v.vel.z);
    emit('leftVehicle', v);
    if (!forced && speed > 9) {
      this.hurt((speed - 9) * 1.6, 'bail');
      if (this.alive) this.knockDown(v.vel.x * 0.8, 2.5, v.vel.z * 0.8, 1.2 + speed * 0.03);
    } else if (!forced) this.vel.multiplyScalar(0.3);
  }

  // ---- per-frame ---------------------------------------------------------------
  update(dt, t) {
    this.stateT += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.punchT > 0) this.punchT -= dt;
    this.recoil = Math.max(0, this.recoil - dt * 6);
    // slow regeneration up to half health
    if (this.alive && this.health < 50 && t - this.lastHurt > 7) this.health = Math.min(50, this.health + dt * 2.5);

    if (this.vehicle) {
      this.driveInput(dt, t);
      if (this.vehicle) this.animateSeated(dt, t); else this.animate(dt, t);
      return;
    }

    switch (this.state) {
      case 'entering': {
        const v = this.enterTarget;
        if (v && !v.removed) {
          const d = v.doorPos(-1);
          const k = Math.min(1, dt * 6);
          this.pos.x += (d.x - this.pos.x) * k; this.pos.z += (d.z - this.pos.z) * k;
          this.heading += wrapAngle(Math.atan2(v.pos.x - this.pos.x, v.pos.z - this.pos.z) - this.heading) * k;
          if (this.enterKind === 'jack' && v.ai) { v.inThrottle = v.fwd > 0.5 ? -1 : 0; v.inHandbrake = true; v.ai.wait = 1; }
        }
        this.speed = 0;
        if (this.stateT >= this.enterDur) this.finishEnter();
        break;
      }
      case 'ragdoll':
        this.physics(dt, 0, 0, false);
        this.stateT -= dt * 2; // counts down
        if (this.stateT <= 0 && this.onGround) { this.state = 'foot'; this.stateT = 0; }
        break;
      case 'dead': case 'busted':
        this.physics(dt, 0, 0, false);
        break;
      default:
        this.footInput(dt, t);
    }
    this.animate(dt, t);
  }

  footInput(dt, t) {
    const cam = G.cam;
    const mx = Input.axis('KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight');
    const mz = Input.axis('KeyS', 'KeyW', 'ArrowDown', 'ArrowUp');
    const sprint = Input.any('ShiftLeft', 'ShiftRight');
    this.aiming = Input.mouse.right && !this.swimming;
    let wx = 0, wz = 0, want = 0;
    if (mx || mz) {
      const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
      // camera forward (s,c); camera right (-c, s)
      wx = s * mz + -c * mx; wz = c * mz + s * mx;
      const l = Math.hypot(wx, wz); wx /= l; wz /= l;
      want = this.swimming ? 2.7 : this.aiming ? 2.6 : sprint ? 7.8 : 4.6;
    }
    if (this.aiming || G.weapons?.facingCamera) {
      this.heading += wrapAngle(cam.yaw - this.heading) * Math.min(1, dt * 16);
    } else if (want > 0) {
      this.heading += wrapAngle(Math.atan2(wx, wz) - this.heading) * Math.min(1, dt * 11);
    }
    const jump = Input.hit('Space') && this.onGround && !this.swimming;
    this.physics(dt, wx * want, wz * want, jump);
    if (Input.hit('KeyF') || (Input.hit('KeyE') && !G.interact.active)) this.tryEnter();
  }

  physics(dt, tvx, tvz, jump) {
    const control = this.state === 'foot';
    if (control) {
      const k = Math.min(1, dt * (this.onGround ? 11 : 2.5));
      this.vel.x += (tvx - this.vel.x) * k; this.vel.z += (tvz - this.vel.z) * k;
    } else if (this.onGround) {
      const f = Math.max(0, 1 - dt * 3.5);
      this.vel.x *= f; this.vel.z *= f;
    }
    if (jump) { this.vel.y = 7.2; this.onGround = false; emit('playerJump'); }
    this.vel.y -= GRAV * dt;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; this.pos.y += this.vel.y * dt;

    // static geometry
    const hit = resolveCircle(this.pos.x, this.pos.z, 0.36, this.pos.y + 0.3, out, 1.4);
    if (hit) { this.pos.x = out.x; this.pos.z = out.z; }
    // vehicles are solid; fast ones hurt
    for (const v of G.vehicles) {
      const dx = this.pos.x - v.pos.x, dz = this.pos.z - v.pos.z;
      const rr = v.radius + 0.5;
      if (dx * dx + dz * dz > rr * rr) continue;
      if (this.pos.y > v.pos.y + v.T.hgt + 0.1 || this.pos.y + 1.7 < v.pos.y) continue;
      const s = Math.sin(v.heading), c = Math.cos(v.heading);
      for (let q = 0; q < 3; q++) {
        const cx = v.pos.x + s * v.cOff[q], cz = v.pos.z + c * v.cOff[q];
        const ex = this.pos.x - cx, ez = this.pos.z - cz;
        const r = v.cr + 0.34;
        const d2 = ex * ex + ez * ez;
        if (d2 >= r * r) continue;
        const d = Math.sqrt(d2) || 0.01;
        const along = (v.vel.x * ex + v.vel.z * ez) / d;
        if (v.speed > 5 && along > 3 && this.state !== 'ragdoll' && this.alive) {
          this.hurt(v.speed * 2.2, 'run over');
          if (this.alive) this.knockDown(v.vel.x * 0.8 + (ex / d) * 2, 3 + v.speed * 0.15, v.vel.z * 0.8 + (ez / d) * 2, 1.6);
          else this.vel.set(v.vel.x * 0.8, 4, v.vel.z * 0.8);
          emit('playerRunOver', v);
        }
        this.pos.x = cx + (ex / d) * r; this.pos.z = cz + (ez / d) * r;
      }
    }

    // ground and water
    const g = groundHeight(this.pos.x, this.pos.z, this.pos.y + 0.7);
    const floatY = WATER_Y - 1.15;
    const deep = g < floatY - 0.15;
    if (deep && this.pos.y <= floatY + 0.05) {
      if (!this.swimming) emit('splash', this.pos.x, this.pos.z);
      this.swimming = true;
      this.pos.y = floatY; this.vel.y = 0; this.onGround = true;
    } else {
      this.swimming = false;
      if (this.pos.y <= g) {
        if (!this.onGround && this.vel.y < -15) this.hurt((-this.vel.y - 15) * 6, 'fall');
        if (!this.onGround && this.vel.y < -5) emit('playerLand');
        this.pos.y = g; this.vel.y = 0; this.onGround = true;
      } else if (this.pos.y - g > 0.25) this.onGround = false;
    }
    this.speed = Math.hypot(this.vel.x, this.vel.z);
  }

  driveInput(dt, t) {
    const v = this.vehicle;
    v.inThrottle = Input.axis('KeyS', 'KeyW', 'ArrowDown', 'ArrowUp');
    v.inSteer = Input.axis('KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight');
    v.inHandbrake = Input.key('Space');
    v.inNitro = Input.any('ShiftLeft', 'ShiftRight', 'KeyN');
    v.lastUsed = t;
    this.pos.copy(v.pos);
    this.heading = v.heading;
    this.speed = v.speed;
    if (Input.hit('KeyF') || (Input.hit('KeyE') && !G.interact.active)) this.leaveVehicle();
    else if (v.sunk || v.destroyed) this.leaveVehicle(true);
  }

  // ---- animation ---------------------------------------------------------------
  animate(dt, t) {
    const P = this.P, m = this.model;
    m.position.copy(this.pos);
    const moving = clamp(this.speed / 4.6, 0, 1.6);
    this.phase += this.speed * dt * 2.3;
    const sw = Math.sin(this.phase) * 0.8 * Math.min(1, moving);
    let lean = this.speed > 6 ? 0.2 : this.speed > 1 ? 0.06 : 0;
    let lie = 0;
    if (this.state === 'ragdoll' || this.state === 'dead') lie = -1.5;
    if (this.state === 'busted') { lean = 0.0; }
    const cur = m.rotation.x;
    m.rotation.set(cur + ((this.swimming ? 1.1 : lie || lean) - cur) * Math.min(1, dt * 9), this.heading, 0);
    m.position.y += lie ? 0.18 : this.swimming ? 0.55 : Math.abs(Math.cos(this.phase)) * 0.035 * Math.min(1, moving);
    let aL = sw, aR = -sw, lL = -sw, lR = sw, aLz = 0, aRz = 0;
    if (!this.onGround && !this.swimming && this.state === 'foot') { lL = 0.5; lR = -0.25; aL = -0.5; aR = -0.6; }
    if (this.swimming) { aL = -2.4 + Math.sin(t * 5) * 0.7; aR = -2.4 - Math.sin(t * 5) * 0.7; lL = Math.sin(t * 6) * 0.35; lR = -lL; }
    if (this.state === 'busted') { aL = -3.0; aR = -3.0; aLz = -0.25; aRz = 0.25; }
    if (this.state === 'entering') { aR = -1.2; aL = -0.9; }
    const held = this.heldItem;
    if (this.state === 'foot' && !this.swimming) {
      if (this.aiming || (G.weapons && G.weapons.facingCamera)) {
        const pitch = clamp(G.cam.pitch, -0.9, 0.7);
        aR = -1.5 + pitch + this.recoil * -0.25;
        if (held === 'pistol' || held === 'hack') { aL = -1.35 + pitch; aLz = -0.45; }
      } else if (held) aR = aR * 0.4 - 0.25;
      if (this.punchT > 0) { const k = Math.sin((1 - this.punchT / 0.3) * Math.PI); aR = -1.5 * k - 0.3; P.torso.rotation.y = -k * 0.5; } else P.torso.rotation.y *= 0.8;
    }
    const k = Math.min(1, dt * 16);
    P.armL.rotation.x += (aL - P.armL.rotation.x) * k; P.armR.rotation.x += (aR - P.armR.rotation.x) * k;
    P.armL.rotation.z += (aLz - P.armL.rotation.z) * k; P.armR.rotation.z += (aRz - P.armR.rotation.z) * k;
    P.legL.rotation.x += (lL - P.legL.rotation.x) * k; P.legR.rotation.x += (lR - P.legR.rotation.x) * k;
    P.head.rotation.x = this.aiming ? clamp(G.cam.pitch, -0.5, 0.5) * 0.6 : 0;
    // knees fold as each leg swings through; elbows carry a little bend that deepens on a run
    const stride = Math.min(1, moving), cs = Math.cos(this.phase);
    let kL = Math.max(0, cs) * 1.0 * stride, kR = Math.max(0, -cs) * 1.0 * stride;
    let eL = -0.16 - 0.5 * stride * (this.speed > 6 ? 1.6 : 0.6), eR = eL;
    if (!this.onGround && !this.swimming && this.state === 'foot') { kL = 0.9; kR = 0.5; }
    if (this.swimming) { kL = 0.3 + Math.max(0, Math.sin(t * 6)) * 0.5; kR = 0.3 + Math.max(0, -Math.sin(t * 6)) * 0.5; eL = eR = -0.3; }
    if (this.state === 'busted') { eL = eR = -1.2; }
    if (this.state === 'foot' && !this.swimming && (this.aiming || (G.weapons && G.weapons.facingCamera))) { eR = -0.06; if (held === 'pistol' || held === 'hack') eL = -0.5; }
    else if (held && this.state === 'foot') eR = -0.5;
    if (this.punchT > 0) eR = -0.2;
    P.shinL.rotation.x += (kL - P.shinL.rotation.x) * k; P.shinR.rotation.x += (kR - P.shinR.rotation.x) * k;
    P.foreL.rotation.x += (eL - P.foreL.rotation.x) * k; P.foreR.rotation.x += (eR - P.foreR.rotation.x) * k;
  }
  animateSeated(dt, t) {
    const v = this.vehicle, P = this.P;
    if (!v.T.open) return;
    const bike = v.cls === 'hover';
    P.legL.rotation.x = bike ? -0.9 : -1.45; P.legR.rotation.x = bike ? -0.9 : -1.45;
    P.armL.rotation.x = -1.1 + v.steer * 0.25; P.armR.rotation.x = -1.1 - v.steer * 0.25;
    P.armL.rotation.z = P.armR.rotation.z = 0;
    P.shinL.rotation.x = P.shinR.rotation.x = bike ? 1.25 : 1.35;
    P.foreL.rotation.x = P.foreR.rotation.x = -0.55;
    P.torso.rotation.y = 0;
    this.model.rotation.set(bike ? 0.28 : 0.05, 0, 0);
  }
}
