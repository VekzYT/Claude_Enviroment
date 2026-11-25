// Vehicles: arcade physics for cars, hover-bikes and boats, with damage, nitro and lights.
import * as THREE from 'three';
import { G, emit } from '../state.js';
import { VEHICLES, SURFACES } from './vehicleTypes.js';
import { buildVehicleMesh, vehicleMats } from './vehicleMesh.js';
import { groundHeight, surfaceAt, terrainHeight } from '../world/roads.js';
import { resolveCircle } from '../world/colliders.js';
import { breakables, breakProp } from '../world/breakables.js';
import { WATER_Y, WORLD_MIN, WORLD_MAX } from '../world/layout.js';
import { clamp, lerp } from '../util/math.js';
import { pick, rand } from '../util/rng.js';
import { makeGlowTexture } from '../world/textures.js';

let nextId = 1;
const out = { x: 0, z: 0, broken: [] };
const GRAVITY = 24;
let beamMat = null;
const _charcoal = new THREE.Color(0x121212);

// The pool of light a vehicle throws on the road at night. vehicleLod.js draws it, and every
// vehicle's ground shadow, as instanced decals.
export function headlightBeamMaterial() {
  if (!beamMat) beamMat = new THREE.MeshBasicMaterial({ map: makeGlowTexture(), color: 0xfff0d0, transparent: true, depthWrite: false, opacity: 0.0, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -9, polygonOffsetUnits: -9 });
  return beamMat;
}

export class Vehicle {
  constructor(typeId, x, z, heading = 0, opts = {}) {
    const T = VEHICLES[typeId];
    this.T = T;
    this.id = nextId++;
    this.typeId = typeId;
    this.cls = T.cls;
    this.name = T.name;
    this.pos = new THREE.Vector3(x, 0, z);
    this.vel = new THREE.Vector3();
    this.heading = heading;
    this.angVel = 0;
    this.steer = 0;
    this.pitch = 0; this.roll = 0; this.bodyRoll = 0; this.bodyPitch = 0;
    // driver inputs
    this.inThrottle = 0; this.inSteer = 0; this.inHandbrake = false; this.inNitro = false;
    this.health = T.health; this.maxHealth = T.health;
    this.nitro = 1; this.boosting = false;
    this.onGround = true; this.airTime = 0;
    this.driver = null;        // null | 'player' | 'npc' | 'cop' | 'racer' | 'convoy'
    this.ai = null;            // object with control(vehicle, dt)
    this.npc = null;           // appearance of the NPC inside (for pulling them out)
    this.locked = !!opts.locked;
    this.alarm = 0;
    this.sirenOn = false;
    this.lightsOn = false;
    this.disabled = 0;         // seconds of engine-out (EMP / hack)
    this.destroyed = false; this.burning = false; this.sunk = false; this.sinkT = 0;
    this.mission = !!opts.mission;
    this.keep = !!opts.keep;   // never despawn automatically
    this.stolen = false;
    this.lastUsed = -999;
    this.slip = 0; this.surface = 'asphalt'; this.speed = 0; this.fwd = 0; this.latAccel = 0;
    // player handling states (see handling()): slide angle, drift, donut/burnout, weight on the front axle
    this.slideAngle = 0; this.drift = false; this.driftDir = 1; this.driftSm = 0; this.driftK = 2.6; this.driftInto = 0; this.driftAge = 0;
    this.coastT = 0; this.powerT = 0; this.pushT = 0; this.trailT = 0; this.liftT = 9; this.brakeT = 9; this.burn = false; this.burnT = 0; this.launchT = 0; this.load = 0; this.airPitch = 0; this.wheelYaw = 0;
    this.fireT = 0; this.smokeT = 0;
    this.paint = opts.paint ?? pick(T.paints);
    this.m = buildVehicleMesh(T, this.paint);
    this.mesh = this.m.group;
    this.mesh.rotation.order = 'YXZ';
    this.cr = T.wid * 0.5;
    const e = T.len / 2 - this.cr;
    this.cOff = [e, 0, -e];
    this.radius = T.len / 2 + 0.3;
    this.far = false;          // simplified update when far from the camera
    this.lite = 0;             // ground and walls read every frame (0), one in four (3) or one in eight (7); traffic.js sets it
    this.farStep = 0;
    this.proxied = false;      // drawn by vehicleLod.js as one instance of its type's model
    this.lean = T.bike ? -0.16 : 0;
    this.snapToGround();
    this.syncMesh();
    G.scene.add(this.mesh);
    G.vehicles.push(this);
  }

  get occupied() { return this.driver !== null; }
  get isPolice() { return !!this.T.police; }
  get healthFrac() { return clamp(this.health / this.maxHealth, 0, 1); }
  forward(target = new THREE.Vector3()) { return target.set(Math.sin(this.heading), 0, Math.cos(this.heading)); }

  restY(x = this.pos.x, z = this.pos.z) {
    if (this.cls === 'boat') return WATER_Y + 0.12;
    const g = groundHeight(x, z, this.pos.y + 3);
    if (this.cls === 'hover') return Math.max(g, WATER_Y) + this.T.hover;
    return g;
  }
  snapToGround() {
    this.pos.y = 9999;
    this.pos.y = this.restY();
    this.vel.y = 0;
    this.onGround = true;
  }

  // Where someone stands to get in / lands when they get out. side: -1 left (driver), +1 right
  doorPos(side = -1, target = new THREE.Vector3()) {
    const s = Math.sin(this.heading), c = Math.cos(this.heading);
    const d = (this.T.wid / 2 + 0.85) * side;
    return target.set(this.pos.x + -c * d, this.pos.y, this.pos.z + s * d);
  }

  // ---- damage -------------------------------------------------------------
  damage(amount, source = null) {
    if (this.destroyed || amount <= 0) return;
    this.health -= amount * (this.isPolice ? 0.75 : 1);
    this.lastHitBy = source;
    if (this.health <= 0) { this.health = 0; this.explode(source); return; }
    if (this.healthFrac < 0.22) this.burning = true;
    this.applyWear();
  }
  applyWear() {
    const f = this.healthFrac;
    this.m.paintMat.color.copy(this.m.baseColor).lerp(_charcoal, (1 - f) * 0.6);
    this.wobble = (1 - f) * 0.05;
  }
  repair() {
    if (this.sunk) return;
    this.destroyed = false; this.burning = false;
    this.health = this.maxHealth; this.disabled = 0;
    this.applyWear();
  }
  explode(source = null) {
    if (this.destroyed) return;
    this.destroyed = true; this.burning = true;
    this.health = 0;
    this.m.paintMat.color.set(0x0c0c0c);
    this.sirenOn = false; this.lightsOn = false;
    this.vel.y += 6; this.angVel += rand(-2, 2);
    this.onGround = false;
    this.wreckT = 0;
    G.fx.explosion(this.pos.x, this.pos.y + 0.6, this.pos.z, this.T.mass > 3000 ? 1.5 : 1);
    emit('vehicleExploded', this, source);
  }
  emp(seconds) { if (!this.destroyed) { this.disabled = Math.max(this.disabled, seconds); emit('vehicleDisabled', this); } }

  onImpact(speed, x, z, other) {
    if (speed < 2.2) return;
    const dmg = Math.max(0, speed - 5) * 1.25;
    if (dmg > 0) this.damage(dmg, other);
    emit('vehicleImpact', this, speed, x, z, other);
  }

  // A parked vehicle draws its four wheels as one mesh. The swap only happens when it cannot be
  // seen as a change: the wheels are already in their rest pose, or the camera is far away.
  restWheels(on) {
    const m = this.m;
    if (!m.wheelRest || m.wheelRest.visible === on) return;
    if (on) {
      let zero = true;
      for (const w of m.wheels) if (w.mesh.rotation.x !== 0 || w.pivot.rotation.y !== 0) { zero = false; break; }
      if (!zero) {
        const c = G.camera.position;
        if ((c.x - this.pos.x) ** 2 + (c.z - this.pos.z) ** 2 < 45 * 45) return;
        for (const w of m.wheels) { w.mesh.rotation.x = 0; w.pivot.rotation.y = 0; }
      }
    }
    m.wheelRest.visible = on;
    for (const w of m.wheels) w.pivot.visible = !on;
  }

  // ---- simulation ---------------------------------------------------------
  update(dt, t) {
    const T = this.T;
    if (this.sunk) return;
    // Parked and untouched: skip the simulation until something moves us.
    if (this.asleep) {
      if (this.driver || this.destroyed || this.burning || this.vel.x * this.vel.x + this.vel.z * this.vel.z > 0.02) { this.asleep = false; this.restWheels(false); }
      else { if (this.far !== this._farDrawn) { this._farDrawn = this.far; } this.restWheels(true); return; }
    } else if (!this.driver && !this.destroyed && !this.burning && this.onGround && this.cls !== 'boat' && this.speed < 0.05 && Math.abs(this.angVel) < 0.02) {
      this.idleT = (this.idleT || 0) + dt;
      if (this.idleT > 1.5) { this.asleep = true; this.idleT = 0; this.vel.set(0, 0, 0); this.angVel = 0; this.syncMesh(dt, t); return; }
    } else this.idleT = 0;
    if (this.disabled > 0) this.disabled -= dt;
    if (this.alarm > 0) this.alarm -= dt;
    this.farStep = (this.farStep + 1) & this.lite;
    if (this.ai && !this.destroyed) this.ai.control(this, dt, t);

    const sinH = Math.sin(this.heading), cosH = Math.cos(this.heading);
    let vF = this.vel.x * sinH + this.vel.z * cosH;
    let vR = this.vel.x * -cosH + this.vel.z * sinH;
    const live = !this.destroyed && this.disabled <= 0 && (this.driver !== null);
    const throttle = live ? clamp(this.inThrottle, -1, 1) : 0;
    const steerIn = live || this.driver !== null ? clamp(this.inSteer, -1, 1) : 0;
    const handbrake = this.inHandbrake || (!this.driver && !this.destroyed) || this.destroyed;
    const hf = this.healthFrac;
    const engineK = hf > 0.5 ? 1 : 0.6 + hf * 0.8;

    // nitro
    const wantBoost = live && this.inNitro && throttle > 0.1 && this.nitro > 0.02 && this.cls !== 'boat';
    if (wantBoost && !this.boosting) emit('nitro', this);
    this.boosting = wantBoost;
    if (this.boosting) this.nitro = Math.max(0, this.nitro - dt / 4.2);
    else this.nitro = Math.min(1, this.nitro + dt / 13 + this.slip * dt * 0.06);

    let aLat = 0, latRate = 10, surf = 'asphalt', slide0 = 0;
    const prevF = vF;

    if (this.cls === 'boat') {
      const depth = WATER_Y - terrainHeight(this.pos.x, this.pos.z);
      const bowDepth = WATER_Y - terrainHeight(this.pos.x + sinH * T.len * 0.5, this.pos.z + cosH * T.len * 0.5);
      const afloat = depth > 0.45;
      surf = 'water';
      const maxSpeed = T.maxSpeed * engineK * (afloat ? 1 : 0.06);
      if (throttle > 0) vF += T.accel * throttle * Math.max(0, 1 - Math.pow(Math.max(vF, 0) / maxSpeed, 2)) * dt * (afloat ? 1 : 0.3);
      else if (throttle < 0) vF += T.accel * 0.7 * throttle * Math.max(0, 1 - Math.pow(Math.max(-vF, 0) / (T.maxSpeed * 0.3), 2)) * dt;
      vF -= vF * (afloat ? 0.22 : 3.5) * dt;
      if (bowDepth < 0.15 && vF > 1) vF -= vF * 6 * dt; // run aground
      this.steer += (steerIn * T.steer - this.steer) * Math.min(1, dt * 5);
      // the handbrake lets the hull swing out and skate sideways through a turn
      const skate = live && this.inHandbrake && afloat ? 1 : 0;
      const yawTarget = -this.steer * 1.9 * (1 + 0.4 * skate) * clamp(vF / 9, -1, 1);
      this.angVel += (yawTarget - this.angVel) * Math.min(1, dt * 3.2);
      aLat = afloat ? T.grip * 3.6 * (1 - 0.55 * skate) : 30; latRate = afloat ? 2.4 - 1.2 * skate : 8;
      this.onGround = true;
    } else {
      // --- cars and hover-bikes ---
      const gy = this.groundY ?? groundHeight(this.pos.x, this.pos.z, this.pos.y + 1);
      let S;
      if (this.cls === 'hover') { surf = 'hover'; S = { grip: 0.9, speed: 1, roll: 0.2 }; }
      else {
        surf = this.farStep ? this.surface : gy < WATER_Y - 0.4 ? 'water' : surfaceAt(this.pos.x, this.pos.z, gy);
        S = SURFACES[surf];
      }
      const off = T.offroad;
      const loose = surf === 'dirt' || surf === 'grass' || surf === 'sand' || surf === 'mud';
      const speedK = surf === 'water' ? S.speed : lerp(S.speed, 1, off);
      const gripK = lerp(S.grip, Math.min(1, S.grip + 0.4), off);
      let maxSpeed = T.maxSpeed * speedK * engineK;
      let accel = T.accel * (0.55 + 0.45 * gripK) * engineK;
      if (this.boosting) { maxSpeed *= 1.3; accel *= 1.9; }
      if (this.onGround) {
        this.steer += (steerIn - this.steer) * Math.min(1, dt * (this.cls === 'hover' ? 5 : 8));
        aLat = T.grip * 1.9 * gripK;
        // weight transfer: braking loads the front tyres and sharpens the player's turn-in
        // (AI drivers keep the grip limit their lines were tuned for)
        if (this.driver === 'player') this.load += (clamp(-(this.accelLong || 0) / 14, 0, 1) - this.load) * Math.min(1, dt * 6);
        else this.load = 0;
        const sp0 = Math.abs(vF);
        const yawLock = (sp0 * Math.tan(T.steer)) / T.wheelbase;
        const yawGrip = (aLat * 1.15 * (1 + 0.3 * this.load)) / Math.max(sp0, 1);
        if (this.driver === 'player' && live) this.handling(dt, throttle, vF, vR, Math.abs(this.steer) * yawLock > yawGrip, loose, maxSpeed);
        else { this.drift = false; this.burn = false; }
        slide0 = Math.atan2(vR, Math.max(vF, 0.5));
        if (this.drift) accel *= T.driftPower;   // the rear tyres turn power into smoke
        if (this.launchT > 0) { this.launchT -= dt; accel *= 1.7; }
        if (!this.burn) {
          if (throttle > 0) {
            if (vF < -0.5) vF += T.brake * throttle * dt;
            else vF += accel * throttle * Math.max(0, 1 - Math.pow(Math.max(vF, 0) / maxSpeed, 2)) * dt;
          } else if (throttle < 0) {
            if (vF > 0.5) vF += T.brake * throttle * dt * (0.5 + 0.5 * gripK);
            else vF += accel * 0.6 * throttle * Math.max(0, 1 - Math.pow(Math.max(-vF, 0) / (T.maxSpeed * 0.28), 2)) * dt;
          }
          // rolling resistance, air drag, soft limiter when the surface slows the car
          const rollK = S.roll * (1 - off * 0.75);
          vF -= vF * (0.05 + rollK * 0.22) * dt;
          if (Math.abs(vF) > maxSpeed) vF -= (vF - Math.sign(vF) * maxSpeed) * Math.min(1, 2.2 * dt);
          if (throttle === 0) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 1.6 * dt);
          if (handbrake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), T.brake * (this.drift ? 0.1 : this.driver ? 0.5 : 0.9) * dt);
        }
        const sp = Math.abs(vF);
        if (this.burn) {
          // donut (steering) or burnout (straight): the rear steps round the front wheels
          const dir = Math.abs(this.steer) > 0.3 ? -Math.sign(this.steer) : 0;
          this.angVel += (dir * (2.4 + T.powerSlide * 1.5) - this.angVel) * Math.min(1, dt * 2.5);
          vF += ((dir ? 2.4 : 0) - vF) * Math.min(1, dt * 3);
          vR += (T.wheelbase * 0.5 * this.angVel - vR) * Math.min(1, dt * 6);
          aLat = 0;
        } else if (this.drift) {
          // the yaw itself is set after the lateral friction below, which bends the path
          aLat *= T.driftGrip * (1 + 0.2 * this.driftInto) * (loose ? 1.15 : 1);
          latRate = 2.6;
        } else {
          // steering: limited by lock at low speed and by grip at high speed; a hover-bike carves past its grip and slides
          const yawLock2 = (sp * Math.tan(T.steer)) / T.wheelbase;
          const yawGrip2 = (aLat * 1.15 * (1 + 0.3 * this.load)) / Math.max(sp, 1);
          let yawTarget = -this.steer * Math.min(yawLock2, yawGrip2 * (this.cls === 'hover' ? 1.5 : 1)) * Math.sign(vF || 1);
          if (this.inHandbrake && sp > 5) { yawTarget *= 1.7; aLat *= 0.34; latRate = 2.6; }
          if (this.cls === 'hover') latRate = Math.min(latRate, 2.4);
          this.angVel += (yawTarget - this.angVel) * Math.min(1, dt * (this.inHandbrake ? 5 : 9));
        }
      } else {
        this.drift = this.drift && this.driver === 'player';
        this.burn = false;
        // in the air the player can still yaw a little (the pedals pitch the nose, see vertical())
        const air = this.driver === 'player' && live;
        this.angVel += ((air ? -steerIn * 1.5 : 0) - this.angVel) * Math.min(1, dt * (air ? 1.8 : 0.6));
        aLat = 0;
      }
    }

    // lateral friction (Coulomb-capped so the car can break traction)
    if (aLat > 0) {
      const cut = Math.min(Math.abs(vR) * latRate * dt, aLat * dt);
      vR -= Math.sign(vR) * cut;
    }
    if (this.drift && this.onGround && !this.burn) {
      // hold the slide angle on its target: follow the path as friction and throttle bend it, plus a correction
      const slide1 = Math.atan2(vR, Math.max(vF, 0.5));
      const pathRate = (slide0 - slide1) / Math.max(dt, 1e-4);
      this.angVel = clamp(pathRate + this.driftK * (this.driftSm - slide0), -3.5, 3.5);
    }
    this.latAccel = vF * this.angVel;
    const slideSpeed = Math.abs(vR);
    this.slideAngle = this.onGround && vF > 1 ? Math.atan2(vR, vF) : 0;
    this.slip = this.onGround && this.cls === 'car' ? clamp((slideSpeed - 1.6) / 7, 0, 1) : 0;
    if (this.burn) this.slip = 1;
    if (this.cls === 'car' && this.onGround && throttle !== 0 && Math.abs(vF) < 4 && Math.abs(throttle) > 0.8 && surf !== 'asphalt' && surf !== 'concrete') this.slip = Math.max(this.slip, 0.3);
    this.surface = surf;

    this.vel.x = sinH * vF + -cosH * vR;
    this.vel.z = cosH * vF + sinH * vR;
    this.heading += this.angVel * dt;
    this.fwd = vF;
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    this.accelLong = (vF - prevF) / Math.max(dt, 1e-4);

    // integrate
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    const lim = WORLD_MAX + 180;
    if (this.pos.x < -lim || this.pos.x > lim) { this.pos.x = clamp(this.pos.x, -lim, lim); this.vel.x *= -0.3; }
    if (this.pos.z < -lim || this.pos.z > lim) { this.pos.z = clamp(this.pos.z, -lim, lim); this.vel.z *= -0.3; }

    if (!(this.farStep & (this.lite >> 1))) this.collideStatic();
    this.vertical(dt, t);
    this.effects(dt, t);
    this.syncMesh(dt, t);
  }

  // Player-only handling: drifts (handbrake, power-oversteer, lift-off and trail-brake entries), donuts and
  // burnouts. AI drivers never enter these states, so traffic, police and rivals keep plain grip driving.
  handling(dt, throttle, vF, vR, atLimit, loose, maxSpeed) {
    const T = this.T, hb = this.inHandbrake, steer = this.steer;
    if (this.cls === 'car' && hb && throttle > 0.8 && Math.abs(vF) < (this.burn ? 9 : 6)) {
      if (!this.burn) this.burnT = 0;
      this.burn = true; this.drift = false; this.burnT += dt;
      return;
    }
    // let go of the handbrake after a burnout with the throttle pinned: launch
    if (this.burn) { if (this.burnT > 0.6 && throttle > 0.8) this.launchT = 0.9; this.burn = false; }
    const looseK = loose ? T.looseSlide : 0;
    const s = Math.atan2(vR, Math.max(vF, 0.5));
    this.liftT = throttle > 0.7 ? 0 : this.liftT + dt;
    this.brakeT = throttle < -0.3 ? 0 : this.brakeT + dt;
    if (!this.drift) {
      if (vF < 8) { this.powerT = this.pushT = this.trailT = 0; return; }
      const dir = Math.abs(steer) > 0.25 ? -Math.sign(steer) : 0;   // +1 = into a left-hand slide
      const hard = dir && atLimit && Math.abs(steer) > 0.6;
      let enter = 0;
      if (hb && (dir || Math.abs(this.angVel) > 0.3)) enter = dir || Math.sign(this.angVel);
      else if (hard) {
        // only when pushing hard: ordinary turns at junction speeds, and plain braking, stay on the grip model
        const power = T.powerSlide + looseK, fast = loose ? 10 : 20;
        if (throttle > 0.85 && vF > fast && vF < maxSpeed * 0.85) this.powerT += dt * power;
        else this.powerT = Math.max(0, this.powerT - dt);
        // time at the limit under power, for a lift-off; a stab of the brake at the limit, for a trail-brake entry
        if (throttle > 0.7) this.pushT += dt;
        if (throttle < -0.3 && vF > 14) this.trailT += dt * (power + T.liftOff);
        else if (this.brakeT > 0.4) this.trailT = 0;
        if (this.powerT > 0.5) enter = dir;
        // lift off after a while on the limit: light cars tuck in and the tail steps out
        else if (throttle >= 0 && throttle <= 0.05 && this.liftT < 0.3 && vF > 19 && T.liftOff > 0 && this.pushT > 0.3 / T.liftOff) enter = dir;
        // brake into the turn, then back on the power while still turning: the loaded nose bites and the rear lets go
        else if (throttle > 0.7 && this.brakeT < 0.4 && this.trailT > 0.2 && vF > 15) enter = dir;
      } else { this.powerT = Math.max(0, this.powerT - dt * 2); this.pushT = Math.max(0, this.pushT - dt * 2); this.trailT = 0; }
      if (!enter) return;
      this.drift = true; this.driftDir = enter; this.driftAge = 0; this.coastT = 0; this.powerT = this.pushT = this.trailT = 0; this.driftSm = s;
    }
    // in the slide: throttle and steering into the turn set the angle, steering out of it catches the car;
    // with the wheel straight it settles at a holdable angle (a little countersteer assist for keyboards)
    this.driftAge += dt;
    if (Math.abs(s) > 0.12) this.driftDir = Math.sign(s);
    const d = this.driftDir;
    const into = clamp(-steer * d, -1, 1), thr = Math.max(0, throttle);
    this.coastT = thr > 0.1 || hb ? 0 : this.coastT + dt;
    const A = T.driftAngle * (1 + 0.3 * looseK);
    let mag = A * ((0.3 + 0.55 * thr) * (1 + 0.5 * into) + Math.min(0, into) * 0.6 + (hb ? 0.35 : 0));
    if (this.driftAge > 0.5) mag *= Math.max(0, 1 - this.coastT / (throttle < -0.3 ? 0.5 : 0.75));   // off the throttle the slide dies away
    mag = clamp(mag, -0.3 * A, Math.min(1.05, 1.5 * A));
    this.driftSm += (d * mag - this.driftSm) * Math.min(1, dt * 4);
    this.driftInto = into;
    this.driftK = (hb ? 4 : into < -0.3 ? 3.6 : 2.6) * clamp(Math.sqrt(1500 / T.mass), 0.7, 1.15);
    // once a coasting slide has mostly straightened, hand the car back to grip so the wheel steers it again
    // (sooner with the wheel turned into the corner: the front bites and the car turns in)
    const coasting = thr < 0.1 && !hb && this.driftAge > 0.3 && Math.abs(s) < 0.18 + 0.14 * Math.max(0, into);
    if (vF < 6 || coasting || (this.driftAge > 0.35 && Math.abs(s) < 0.09 && Math.abs(this.driftSm) < 0.15) || Math.abs(s) > 1.9) this.drift = false;
  }

  collideStatic() {
    const T = this.T;
    const s = Math.sin(this.heading), c = Math.cos(this.heading);
    const y = this.cls === 'hover' ? this.pos.y - T.hover : this.pos.y;
    for (let k = 0; k < 3; k++) {
      const ox = s * this.cOff[k], oz = c * this.cOff[k];
      const cx = this.pos.x + ox, cz = this.pos.z + oz;
      const hit = resolveCircle(cx, cz, this.cr, y, out, T.hgt, this.speed * (T.mass > 3000 ? 1.6 : 1));
      for (let b = 0; b < out.broken.length; b++) {
        const idx = out.broken[b];
        if (breakProp(idx, this.vel.x, this.vel.z)) {
          const br = breakables[idx];
          this.vel.x *= 0.93; this.vel.z *= 0.93;
          this.damage(br.kind === 'light' || br.kind === 'signal' ? 2 : 0.6);
          emit('propBroken', br, this);
        }
      }
      if (!hit) continue;
      this.pos.x += out.x - cx; this.pos.z += out.z - cz;
      const vn = this.vel.x * hit.nx + this.vel.z * hit.nz;
      if (vn < 0) {
        const rest = 0.22;
        this.vel.x -= (1 + rest) * vn * hit.nx; this.vel.z -= (1 + rest) * vn * hit.nz;
        this.vel.x *= 0.98; this.vel.z *= 0.98;
        this.angVel += ((oz * hit.nx - ox * hit.nz) * -vn * 0.11) / (T.len * 0.5);
        this.angVel = clamp(this.angVel, -4, 4);
        this.onImpact(-vn, cx - hit.nx * this.cr, cz - hit.nz * this.cr, null);
      }
    }
  }

  vertical(dt, t) {
    const T = this.T;
    if (this.cls === 'boat') {
      const bob = Math.sin(t * 1.7 + this.id) * 0.06 + Math.sin(t * 2.9 + this.id * 2) * 0.03;
      this.pos.y = WATER_Y + 0.1 + bob;
      this.pitch += (-clamp(this.fwd / T.maxSpeed, 0, 1) * 0.13 + Math.sin(t * 1.3 + this.id) * 0.015 - this.pitch) * Math.min(1, dt * 4);
      this.roll += (clamp(this.angVel * 0.22, -0.3, 0.3) + Math.sin(t * 1.1 + this.id) * 0.02 - this.roll) * Math.min(1, dt * 4);
      this.groundY = WATER_Y;
      return;
    }
    if (this.farStep && this.onGround) { this.pos.y += this.vel.y * dt; return; }   // carry on along the slope
    const s = Math.sin(this.heading), c = Math.cos(this.heading);
    const hb = T.wheelbase / 2;
    const ref = this.pos.y + 1.2 - (this.cls === 'hover' ? T.hover : 0);
    let gF = groundHeight(this.pos.x + s * hb, this.pos.z + c * hb, ref);
    let gR = groundHeight(this.pos.x - s * hb, this.pos.z - c * hb, ref);
    let lift = 0;
    if (this.cls === 'hover') { gF = Math.max(gF, WATER_Y); gR = Math.max(gR, WATER_Y); lift = T.hover; }
    const gC = (gF + gR) / 2;
    this.groundY = gC;
    this.vel.y -= GRAVITY * dt;
    this.pos.y += this.vel.y * dt;
    const rest = gC + lift;
    if (this.pos.y <= rest + 0.02) {
      const impact = -this.vel.y;
      if (!this.onGround && impact > 7) {
        if (impact > 13) this.damage((impact - 13) * 2.2);
        emit('vehicleLanded', this, impact);
      }
      this.pos.y = rest;
      this.vel.y = ((gF - gR) / T.wheelbase) * this.fwd;
      this.onGround = true;
      this.airTime = 0;
    } else if (this.pos.y - rest > 0.3) {
      this.onGround = false;
      this.airTime += dt;
    }
    // attitude
    let tp, tr = 0, high = 1;
    if (this.onGround) {
      tp = -Math.atan2(gF - gR, T.wheelbase);
      if (!this.far && !this.lite && this.cls === 'car') {
        const hw = T.wid / 2;
        const gL = groundHeight(this.pos.x + c * hw, this.pos.z - s * hw, ref), gRt = groundHeight(this.pos.x - c * hw, this.pos.z + s * hw, ref);
        tr = Math.atan2(gL - gRt, T.wid);
      }
    } else {
      // the pedals pitch the nose in the air: throttle dips it, brake lifts it
      // (gently for the throttle, which most players hold through a jump anyway)
      if (this.driver === 'player' && this.disabled <= 0 && !this.destroyed) this.airPitch = clamp(this.airPitch + this.inThrottle * dt * (this.inThrottle > 0 ? 0.45 : 1.5), -0.6, 0.35);
      // and the car levels out on the way down, so it lands on its wheels rather than its nose
      high = clamp((this.pos.y - rest) / 2.5, 0, 1);
      tp = clamp(-this.vel.y * 0.02 + this.airPitch * high, -0.9, 0.9);
      tr = this.roll;
    }
    if (this.onGround) this.airPitch = 0;
    const k = Math.min(1, dt * (this.onGround ? 10 : 2 + 6 * (1 - high)));
    this.pitch += (tp - this.pitch) * k;
    this.roll += (tr - this.roll) * k;

    // drowning
    if (this.cls === 'car' && gC < WATER_Y - 1.0 && this.pos.y < WATER_Y - 0.4) {
      this.sinkT += dt;
      this.disabled = Math.max(this.disabled, 1);
      this.vel.x *= 1 - Math.min(1, dt * 2.5); this.vel.z *= 1 - Math.min(1, dt * 2.5);
      if (this.sinkT > 2.4 && !this.sunk) { this.sunk = true; this.destroyed = true; emit('vehicleSunk', this); }
    } else this.sinkT = 0;
  }

  effects(dt, t) {
    const fx = G.fx;
    if (!fx || this.far) return;
    const T = this.T;
    const s = Math.sin(this.heading), c = Math.cos(this.heading);
    const hf = this.healthFrac;
    // engine smoke and fire
    if (hf < 0.5) {
      this.smokeT -= dt;
      if (this.smokeT <= 0) {
        this.smokeT = hf < 0.25 ? 0.05 : 0.12;
        const fz = T.len * 0.32;
        fx.smoke(this.pos.x + s * fz, this.pos.y + T.hgt * 0.7, this.pos.z + c * fz, { dark: hf < 0.25 ? 0.07 : 0.3, size: hf < 0.25 ? 2.6 : 1.6 });
        if (this.burning) fx.fire(this.pos.x + s * fz + rand(-0.4, 0.4), this.pos.y + T.hgt * 0.65, this.pos.z + c * fz + rand(-0.4, 0.4));
      }
    }
    if (this.burning && !this.destroyed) {
      this.health -= dt * 3.5;
      if (this.health <= 0) this.explode(this.lastHitBy);
    }
    if (this.destroyed) {
      this.wreckT = (this.wreckT || 0) + dt;
      if (this.wreckT < 14) { this.smokeT -= dt; if (this.smokeT <= 0) { this.smokeT = 0.1; fx.smoke(this.pos.x, this.pos.y + 1, this.pos.z, { dark: 0.06, size: 3 }); if (this.wreckT < 7) fx.fire(this.pos.x + rand(-1, 1), this.pos.y + 0.8, this.pos.z + rand(-1, 1), 1.8); } }
      return;
    }
    if (this.disabled > 0 && Math.random() < dt * 9) fx.zap(this.pos.x + rand(-1, 1), this.pos.y + T.hgt * 0.6, this.pos.z + rand(-1, 1), 2, 0.6);
    // tyres: smoke, dust or spray off the rear wheels while they slide, and rubber laid down through a drift
    if (this.cls === 'car' && this.onGround) {
      const hard = this.surface === 'asphalt' || this.surface === 'concrete';
      const burn = this.burn ? 1 : 0;
      if (this.slip > 0.12 || burn) {
        const rz = -T.wheelbase / 2, hw = T.wid / 2 - 0.12;
        const k = Math.max(this.slip, burn);
        const rate = (this.drift ? 34 : 12) * k + burn * 30;   // puffs per wheel per second
        const moving = this.speed > 1;
        const dx = moving ? this.vel.x / this.speed : s, dz = moving ? this.vel.z / this.speed : c;
        for (let side = -1; side <= 1; side += 2) {
          const wx = this.pos.x + s * rz + -c * hw * side, wz = this.pos.z + c * rz + s * hw * side;
          if (this.surface !== 'water' && this.surface !== 'grass') fx.skid(this.id * 2 + (side > 0 ? 1 : 0), wx, this.groundY, wz, dx, dz, 0.26, hard ? 0.25 + k * 0.4 : 0.16);
          for (let n = rate * dt + Math.random(); n >= 1; n--) fx.tyreSmoke(wx, this.groundY + 0.4, wz, this.vel.x * 0.3, this.vel.z * 0.3, this.surface, k);
        }
      } else if (!hard && this.speed > 9 && this.surface !== 'water' && Math.random() < dt * 14) {
        const col = this.surface === 'sand' ? [0.78, 0.68, 0.48] : this.surface === 'mud' ? [0.24, 0.2, 0.13] : this.surface === 'grass' ? [0.36, 0.4, 0.22] : [0.5, 0.4, 0.28];
        fx.dust(this.pos.x - s * T.len * 0.5, this.groundY + 0.25, this.pos.z - c * T.len * 0.5, col[0], col[1], col[2], 2.6);
      }
      if (this.surface === 'water' && this.speed > 3 && Math.random() < dt * 20) fx.spray(this.pos.x, 0.1, this.pos.z, -this.vel.x * 0.2, -this.vel.z * 0.2, 2);
    }
    if (this.cls === 'boat' && this.speed > 4) {
      if (Math.random() < dt * 40) fx.spray(this.pos.x - s * T.len * 0.5, 0.1, this.pos.z - c * T.len * 0.5, -this.vel.x * 0.25, -this.vel.z * 0.25, 2);
      // carving: a sheet of spray thrown off the outside of the turn
      const carve = Math.abs(this.angVel) * this.speed + Math.abs(this.slideAngle) * this.speed * 0.5;
      if (carve > 5 && Math.random() < dt * carve * 3) {
        const side = this.angVel > 0 ? 1 : -1, out = 3 + carve * 0.35;
        const ox = -c * side, oz = s * side;
        fx.spray(this.pos.x + ox * T.wid * 0.5 + s * T.len * 0.1, 0.1, this.pos.z + oz * T.wid * 0.5 + c * T.len * 0.1, ox * out + this.vel.x * 0.4, oz * out + this.vel.z * 0.4, 3);
      }
    }
    if (this.cls === 'hover' && this.groundY <= WATER_Y + 0.05 && this.speed > 5 && Math.random() < dt * 25) fx.spray(this.pos.x, 0.1, this.pos.z, -this.vel.x * 0.2, -this.vel.z * 0.2, 1);
    if (this.boosting) {
      const bz = -T.len / 2 - 0.2;
      for (const side of this.cls === 'hover' ? [0] : [-0.5, 0.5]) {
        fx.nitro(this.pos.x + s * bz + -c * side, this.pos.y + (this.cls === 'hover' ? 0.5 : 0.42), this.pos.z + c * bz + s * side, this.vel.x * 0.5 - s * 6, this.vel.z * 0.5 - c * 6);
      }
    }
  }

  syncMesh(dt = 0, t = 0) {
    const T = this.T, m = this.m;
    this.mesh.position.copy(this.pos);
    const wob = this.wobble ? Math.sin(t * 17 + this.id) * this.wobble * clamp(this.speed / 12, 0, 1) : 0;
    // a two-wheeler leans into its turns, and onto its stand when nobody is on it
    if (T.bike) this.lean += (clamp(-this.latAccel * 0.06, -0.8, 0.8) - (this.driver ? 0 : 0.16 * clamp(1 - this.speed / 3, 0, 1)) - this.lean) * Math.min(1, dt * 8);
    this.mesh.rotation.set(this.pitch, this.heading, this.roll + wob + this.lean);
    if (this.proxied) return;
    // body lean and squat
    const rollT = this.cls === 'hover' ? clamp(-this.latAccel * 0.035 - this.slideAngle * 0.5, -0.6, 0.6) : clamp(this.latAccel * 0.006, -0.09, 0.09);
    const pitchT = clamp(-(this.accelLong || 0) * 0.0035, -0.07, 0.07);
    const k = Math.min(1, dt * 7);
    this.bodyRoll += (rollT - this.bodyRoll) * k;
    this.bodyPitch += (pitchT - this.bodyPitch) * k;
    m.body.rotation.set(this.bodyPitch, 0, this.bodyRoll);
    if (this.cls === 'hover') m.body.position.y = Math.sin(t * 3 + this.id) * 0.05 - T.hover * 0.55;
    // wheels: only the ones near the camera cast their own shadows; further off the four tiny
    // patches under the body cannot be told from the body's own shadow
    if (m.wheels.length) {
      const c = G.camera.position, near = (c.x - this.pos.x) ** 2 + (c.z - this.pos.z) ** 2 < 55 * 55;
      if (near !== m.wheelShadows) { m.wheelShadows = near; for (const w of m.wheels) w.mesh.castShadow = near; }
    }
    if (m.wheels.length) {
      // in a slide the front wheels point along the direction of travel (opposite lock) and the rears spin up
      const yawT = this.drift ? clamp(-(this.slideAngle * 0.7 + this.steer * T.steer * 0.3), -T.steer, T.steer) : -this.steer * T.steer * 0.75;
      this.wheelYaw += (yawT - this.wheelYaw) * Math.min(1, dt * 12);
      const spin = this.burn ? 40 : this.drift ? 12 : 0;
      for (const w of m.wheels) {
        w.mesh.rotation.x += (this.fwd / T.wheelR + (w.front ? 0 : spin)) * dt;
        if (w.front) w.pivot.rotation.y = this.wheelYaw;
      }
    }
    // lights
    const M = vehicleMats();
    const lit = this.lightsOn && !this.destroyed;
    m.head.material = lit ? M.head : M.headOff;
    const braking = !this.destroyed && this.driver && ((this.inThrottle < -0.1 && this.fwd > 1) || this.inHandbrake);
    m.tail.material = braking ? M.tailBrake : M.tail;
    if (m.siren) {
      const on = this.sirenOn && !this.destroyed;
      const ph = on && Math.floor(t * 7 + this.id) % 2 === 0;
      m.siren.L.material = on && ph ? M.sirenRed : M.sirenOff;
      m.siren.R.material = on && !ph ? M.sirenBlue : M.sirenOff;
      m.siren.fl.visible = on && ph; m.siren.fr.visible = on && !ph;
    }
    if (m.under) m.under.position.y = (this.groundY ?? this.pos.y) - this.pos.y + 0.08;
  }

  dispose() {
    G.scene.remove(this.mesh);
    this.m.paintMat.dispose();
    const i = G.vehicles.indexOf(this);
    if (i >= 0) G.vehicles.splice(i, 1);
    this.removed = true;
  }
}

// Pairwise vehicle collisions (three circles per vehicle).
export function collideVehicles(list) {
  const n = list.length;
  for (let i = 0; i < n; i++) {
    const a = list[i];
    if (a.sunk) continue;
    for (let j = i + 1; j < n; j++) {
      const b = list[j];
      if (b.sunk) continue;
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
      const rr = a.radius + b.radius;
      if (dx * dx + dz * dz > rr * rr) continue;
      if (Math.abs(a.pos.y - b.pos.y) > 2.6) continue;
      const sa = Math.sin(a.heading), ca = Math.cos(a.heading), sb = Math.sin(b.heading), cb = Math.cos(b.heading);
      for (let p = 0; p < 3; p++) {
        const aox = sa * a.cOff[p], aoz = ca * a.cOff[p];
        const ax = a.pos.x + aox, az = a.pos.z + aoz;
        for (let q = 0; q < 3; q++) {
          const box = sb * b.cOff[q], boz = cb * b.cOff[q];
          const bx = b.pos.x + box, bz = b.pos.z + boz;
          const ex = bx - ax, ez = bz - az;
          const r = a.cr + b.cr;
          const d2 = ex * ex + ez * ez;
          if (d2 >= r * r) continue;
          const d = Math.sqrt(d2) || 1e-3;
          const nx = ex / d, nz = ez / d, pen = r - d;
          const ma = a.T.mass, mb = b.T.mass;
          const wa = mb / (ma + mb), wb = ma / (ma + mb);
          a.pos.x -= nx * pen * wa; a.pos.z -= nz * pen * wa;
          b.pos.x += nx * pen * wb; b.pos.z += nz * pen * wb;
          const rvn = (b.vel.x - a.vel.x) * nx + (b.vel.z - a.vel.z) * nz;
          if (rvn < 0) {
            const jimp = -(1 + 0.2) * rvn / (1 / ma + 1 / mb);
            a.vel.x -= (jimp / ma) * nx; a.vel.z -= (jimp / ma) * nz;
            b.vel.x += (jimp / mb) * nx; b.vel.z += (jimp / mb) * nz;
            a.angVel = clamp(a.angVel + ((aoz * -nx - aox * -nz) * (jimp / ma) * 0.09) / (a.T.len * 0.5), -4, 4);
            b.angVel = clamp(b.angVel + ((boz * nx - box * nz) * (jimp / mb) * 0.09) / (b.T.len * 0.5), -4, 4);
            const hx = ax + nx * a.cr, hz = az + nz * a.cr;
            const sp = -rvn;
            a.onImpact(sp * wa * 1.4, hx, hz, b);
            b.onImpact(sp * wb * 1.4, hx, hz, a);
          }
        }
      }
    }
  }
}
