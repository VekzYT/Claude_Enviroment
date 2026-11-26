// Helicopters: an arcade flight model on top of the vehicle interface (so traffic, police, weapons,
// collisions and missions treat them like any other vehicle), and the police helicopter's pilot.
// Flying: the turbine spools up once someone is at the controls; Space climbs, Shift descends, W / S
// pitch the nose to fly forward or back, A / D yaw; let go and it levels out and holds a hover. It
// sets down on the ground, on helipads and on roofs (building colliders), ditches in water, and goes
// down burning when it is wrecked in the air, exploding where it hits.
import * as THREE from 'three';
import { G, emit } from '../state.js';
import { Vehicle } from './vehicle.js';
import { buildHeliMesh, ROTOR_Y, ROTOR_R, TAIL_ROTOR } from './heliMesh.js';
import { groundHeight } from '../world/roads.js';
import { queryColliders, resolveCircle, rayBoxes } from '../world/colliders.js';
import { WATER_Y } from '../world/layout.js';
import { clamp, wrapAngle, smoothstep, TAU } from '../util/math.js';
import { rand } from '../util/rng.js';
import { makeGlowTexture } from '../world/textures.js';

const GRAV = 24;
const CEILING = 400;
const ROOF = 0.7;        // a building's roof slab stands this far above its collider (see city.js)
const out = { x: 0, z: 0, broken: [] };
const _sb = { water: false };
const _a = new THREE.Vector3(), _d = new THREE.Vector3(), _dn = new THREE.Vector3(0, -1, 0);

// What a helicopter at height `top` would settle on at (x, z): the ground, a roof, a pad deck, or the
// sea. out.water is set when it is open water.
export function surfaceBelow(x, z, top, res = _sb) {
  let g = groundHeight(x, z, top + 0.6);
  res.water = false;
  if (g < WATER_Y) { g = WATER_Y; res.water = true; }
  const list = queryColliders(x, z, 0.5);
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c.removed) continue;
    const box = c.type === 'box';
    // only things a helicopter can stand on: buildings, decks, big roofs (not lamp posts and trees)
    if (!c.building && !c.deck && (box ? Math.min(c.x1 - c.x0, c.z1 - c.z0) < 4 : c.r < 3.5)) continue;
    const y = c.y1 + (c.building ? ROOF : 0.01);
    if (y > top + 0.6 || y <= g) continue;
    if (box ? x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1 : (x - c.x) ** 2 + (z - c.z) ** 2 <= c.r * c.r) { g = y; res.water = false; }
  }
  return g;
}

// Highest roof within `r` of (x, z), for pilots keeping clear of the skyline.
export function roofTop(x, z, r) {
  let top = -Infinity;
  const list = queryColliders(x, z, r);
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (!c.removed && (c.type === 'box' || c.r > 2) && c.y1 > top) top = c.y1;
  }
  return top;
}

export class Heli extends Vehicle {
  constructor(typeId, x, z, heading = 0, opts = {}) {
    super(typeId, x, z, heading, opts);
    this.spool = 0;           // turbine and rotor speed, 0..1
    this.rotorA = 0; this.tailA = 0;
    this.agl = 0;             // height above whatever is below
    this.cmd = { vx: 0, vy: 0, vz: 0, h: heading };   // what an AI pilot wants (world velocity, heading)
    this.downing = false;     // wrecked in the air: falling, burning, explodes on impact
    this.ditched = false; this.ditchT = 0;
    this.strikeT = 0;
    this.sees = false;        // police: the searchlight is on the player
    this.strobeOn = false;    // police: strobes flashing (not sirenOn: road traffic gives way to that, and it wails)
    this.hideBlob = false;
    this.wash = 0;
    this.nitro = 0;           // the HUD's nitro bar reads it; helicopters have none
    this.lightAim = new THREE.Vector3(x, 0, z);
    if (this.isPolice) this.buildSearchlight();
  }
  buildMesh(T, paint) { return buildHeliMesh(T, paint, T.livery); }
  restY(x = this.pos.x, z = this.pos.z) { return surfaceBelow(x, z, this.pos.y + 3); }
  get airborne() { return !this.onGround; }

  repair() { super.repair(); this.downing = false; this.m.rotor.visible = this.m.tailRotor.visible = true; }
  // A helicopter wrecked in the air does not blow up on the spot: it falls, spinning and on fire,
  // and goes up where it lands.
  explode(source = null) {
    if (this.destroyed) return;
    if (this.agl > 3 && !this.ditched) {
      if (!this.downing) { this.downing = true; this.burning = true; this.health = 0; this.lastHitBy = source; this.strobeOn = false; emit('heliDown', this); }
      return;
    }
    this.downing = false;
    super.explode(source);
    this.m.rotor.visible = false; this.m.tailRotor.visible = false;
    this.spool = 0;
  }
  // an EMP cuts the turbine: in the air that means an autorotation, on a police helicopter usually a crash
  emp(seconds) {
    if (this.destroyed) return;
    super.emp(seconds);
    if (this.airborne && this.driver !== 'player') this.damage(30, 'player');
  }

  update(dt, t) {
    if (this.sunk) return;
    const T = this.T;
    if (this.asleep) {
      if (this.driver || this.destroyed || this.burning || this.vel.lengthSq() > 0.02) this.asleep = false;
      else return;
    }
    if (this.disabled > 0) this.disabled -= dt;
    if (this.alarm > 0) this.alarm -= dt;
    this.strikeT -= dt;
    if (this.ai && !this.destroyed && !this.downing) this.ai.control(this, dt, t);

    const live = !this.destroyed && !this.downing && !this.ditched && this.disabled <= 0 && this.driver !== null;
    // the turbine takes a few seconds to wind up to flying speed, and longer to wind down
    const want = live ? 1 : 0;
    this.spool += (want - this.spool) * Math.min(1, dt * (want > this.spool ? 0.34 : 0.12));
    if (this.spool < 0.002 && !want) this.spool = 0;
    const auth = this.spool * this.spool;
    const sinH = Math.sin(this.heading), cosH = Math.cos(this.heading);
    const vx0 = this.vel.x, vz0 = this.vel.z;

    // what the pilot asks for: a velocity in the world and a yaw rate
    let vxT = 0, vzT = 0, vyT = 0, yawT = 0;
    const speedK = clamp(this.speed / T.maxSpeed, 0, 1);
    if (this.driver === 'player' && live) {
      const p = clamp(this.inThrottle, -1, 1);
      const f = p >= 0 ? p * T.maxSpeed : p * 15;
      vxT = sinH * f; vzT = cosH * f;
      const lift = (this.inHandbrake ? 1 : 0) - (this.inNitro ? 1 : 0);
      vyT = lift > 0 ? lift * T.climb : lift * T.descend;
      yawT = -clamp(this.inSteer, -1, 1) * T.steer * (1 - 0.4 * speedK);
    } else if (live && this.ai) {
      const c = this.cmd;
      vxT = c.vx; vzT = c.vz; vyT = c.vy;
      yawT = clamp(wrapAngle(c.h - this.heading) * 1.6, -T.steer, T.steer);
    }

    // height above what is below, and the cushion of air near it
    const gy = surfaceBelow(this.pos.x, this.pos.z, this.pos.y + 0.3);
    const water = _sb.water;
    this.agl = this.pos.y - gy;
    // coming down near the ground the machine settles gently, whatever the pilot asks
    const settle = this.agl < 20;
    if (vyT < 0 && settle) vyT = Math.max(vyT, -(0.7 + this.agl * 0.45));
    if (this.pos.y > CEILING - 40) vyT = Math.min(vyT, (CEILING - this.pos.y) * 0.25);
    const ground = this.agl < 7 ? 1 + 0.2 * (1 - this.agl / 7) : 1;

    // horizontal: lean into the wanted velocity, limited by rotor authority; sideways drift is damped
    // harder so the machine tracks its nose. On the skids it barely moves.
    let ax = (vxT - this.vel.x) * 1.05, az = (vzT - this.vel.z) * 1.05;
    const vR = this.vel.x * -cosH + this.vel.z * sinH;
    ax += -cosH * -vR * 0.8; az += sinH * -vR * 0.8;
    const aMax = T.accel * auth * (this.onGround ? 0.12 : 1);
    const al = Math.hypot(ax, az);
    if (al > aMax) { ax *= aMax / al; az *= aMax / al; }
    if (!live) { ax = -this.vel.x * 0.15; az = -this.vel.z * 0.15; }
    this.vel.x += ax * dt; this.vel.z += az * dt;
    if (this.onGround) { const k = Math.max(0, 1 - dt * (live && auth > 0.6 ? 1.5 : 5)); this.vel.x *= k; this.vel.z *= k; }

    // vertical: rotor thrust against gravity; an unpowered rotor only slows the fall
    let thrust = clamp(GRAV + (vyT - this.vel.y) * (settle ? 4 : 2.6), 0, GRAV * 1.75 * auth * ground);
    if (!live) thrust = Math.min(GRAV * 0.55 * this.spool, GRAV + (-16 - this.vel.y) * 2);
    if (this.downing) thrust = Math.max(0, GRAV + (-20 - this.vel.y) * 1.2) * 0.8;
    this.vel.y += (thrust - GRAV) * dt;

    // yaw; a falling wreck spins
    if (this.downing) yawT = 3.4;
    else if (this.onGround && auth < 0.7) yawT = 0;
    this.angVel += (yawT - this.angVel) * Math.min(1, dt * (this.downing ? 0.8 : 2.6));
    this.heading += this.angVel * dt;

    // integrate
    this.pos.x += this.vel.x * dt; this.pos.y += this.vel.y * dt; this.pos.z += this.vel.z * dt;
    this.collideStatic();
    if (this.spool > 0.2 && !this.destroyed) this.rotorStrikes(t);
    this.contact(dt, water);

    const vF = this.vel.x * sinH + this.vel.z * cosH;
    this.fwd = vF;
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    this.latAccel = vF * this.angVel;
    this.slip = 0; this.slideAngle = 0; this.surface = 'air';
    this.accelLong = ((this.vel.x - vx0) * sinH + (this.vel.z - vz0) * cosH) / Math.max(dt, 1e-4);

    // attitude: the nose dips to speed up and flares to slow down, the disc banks into turns
    let pT = 0, rT = 0;
    if (!this.onGround) {
      const aF = ax * sinH + az * cosH, aR = ax * -cosH + az * sinH;
      pT = clamp(aF * 0.028 + (vF / T.maxSpeed) * 0.13, -0.3, 0.36);
      rT = clamp(-this.angVel * vF * 0.016 + aR * 0.022, -0.5, 0.5);
      // a hovering machine is never quite still
      const h = 1 - speedK;
      pT += Math.sin(t * 0.9 + this.id) * 0.012 * h * auth; rT += Math.sin(t * 1.3 + this.id * 2) * 0.016 * h * auth;
      if (this.downing) { pT += 0.25; rT += Math.sin(t * 3) * 0.2; }
    }
    if (this.ditched) { pT = 0.18; rT = 0.35; }
    const k = Math.min(1, dt * (this.onGround ? 8 : 3.2));
    this.pitch += (pT - this.pitch) * k;
    this.roll += (rT - this.roll) * k;

    this.hideBlob = this.agl > 28 || water;
    this.groundY = gy;
    // parked and wound down: sleep until something happens
    if (!this.driver && this.onGround && !this.destroyed && !this.burning && !this.ditched && this.spool === 0 && this.speed < 0.05) {
      this.vel.set(0, 0, 0); this.angVel = 0; this.asleep = true;
    }
    this.washFx(dt, gy, water);
    this.effects(dt, t);
    if (this.downing && !this.far && Math.random() < dt * 30) G.fx.smoke(this.pos.x, this.pos.y + 2, this.pos.z, { dark: 0.06, size: 3.2 });
    this.syncMesh(dt, t);
  }

  // touching down: on the skids, too hard, or in the water
  contact(dt, water) {
    const gy = surfaceBelow(this.pos.x, this.pos.z, this.pos.y + 0.5, _sb);
    if (this.ditched) {
      this.ditchT += dt;
      this.pos.y = WATER_Y - Math.min(this.ditchT * 0.55, 2.8) + Math.sin(this.ditchT * 2) * 0.06;
      this.vel.set(0, 0, 0); this.onGround = true;
      if (this.ditchT > 5.5 && !this.sunk) { this.sunk = true; this.destroyed = true; emit('vehicleSunk', this); }
      return;
    }
    if (this.pos.y > gy + 0.02) { if (this.pos.y - gy > 0.15) this.onGround = false; return; }
    const impact = -this.vel.y, slide = this.speed;
    this.pos.y = gy;
    if (_sb.water || water) {
      this.ditched = true; this.ditchT = 0; this.disabled = 9999;
      emit('splash', this.pos.x, this.pos.z);
      if (this.downing) { this.downing = false; this.explode(this.lastHitBy); }
      return;
    }
    this.agl = 0;
    if (this.downing) { this.vel.y = 0; this.explode(this.lastHitBy); this.onGround = true; return; }
    if (!this.onGround) {
      if (impact > 3) emit('vehicleLanded', this, impact * 1.6);
      // a firm landing is fine; a fast one, or one with the machine still sliding, breaks things
      let dmg = Math.max(0, impact - 6.5) * 9 + Math.max(0, slide - 9) * 2.5;
      if (dmg > 0) { this.damage(dmg, this.lastHitBy); if (impact > 9) G.fx.dust(this.pos.x, this.pos.y + 0.3, this.pos.z, 0.6, 0.58, 0.54, 4); }
    }
    this.vel.y = Math.max(0, this.vel.y);
    this.onGround = true;
  }

  // the main rotor's disc and the tail rotor against walls: sparks, damage and a shove clear
  rotorStrikes(t) {
    const s = Math.sin(this.heading), c = Math.cos(this.heading);
    for (let k = 0; k < 2; k++) {
      const tail = k === 1;
      const cx = this.pos.x + (tail ? s * TAIL_ROTOR.z : 0), cz = this.pos.z + (tail ? c * TAIL_ROTOR.z : 0);
      const r = tail ? TAIL_ROTOR.r + 0.1 : ROTOR_R;
      const y = this.pos.y + (tail ? 1.3 : ROTOR_Y - 0.12);
      const hit = resolveCircle(cx, cz, r, y, out, tail ? 1.5 : 0.3);
      if (!hit) continue;
      const px = out.x - cx, pz = out.z - cz;
      this.pos.x += px; this.pos.z += pz;
      const vn = this.vel.x * hit.nx + this.vel.z * hit.nz;
      if (vn < 0) { this.vel.x -= 1.6 * vn * hit.nx; this.vel.z -= 1.6 * vn * hit.nz; }
      if (tail) this.angVel += (hit.nx * c - hit.nz * s) * 2.5;
      if (this.strikeT > 0) continue;
      this.strikeT = 0.5;
      const hx = cx + px - hit.nx * r, hz = cz + pz - hit.nz * r;
      if (!this.far) G.fx.sparks(hx, y, hz, 18, hit.nx * 4, hit.nz * 4, [1, 0.85, 0.55]);
      this.damage((tail ? 6 : 8) + this.spool * 8 + Math.max(0, -vn) * 2, this.lastHitBy);
      emit('vehicleImpact', this, Math.max(10, -vn + 8), hx, hz, null);
    }
  }

  // rotor wash: dust, grass or spray kicked up under a low machine
  washFx(dt, gy, water) {
    if (this.far || !G.fx || this.spool < 0.4 || this.agl > 16 || this.destroyed) return;
    const k = this.spool * (1 - this.agl / 16);
    this.wash += dt * k * 26;
    while (this.wash >= 1) {
      this.wash--;
      const a = rand(0, TAU), r = rand(2.5, 6.5), ox = Math.cos(a), oz = Math.sin(a);
      const x = this.pos.x + ox * r, z = this.pos.z + oz * r;
      if (water) G.fx.spray(x, WATER_Y + 0.1, z, ox * 7, oz * 7, 2);
      else G.fx.dust(x, gy + 0.2, z, 0.62, 0.6, 0.55, 2.4 + k * 2);
    }
  }

  syncMesh(dt = 0, t = 0) {
    const m = this.m;
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(this.pitch, this.heading, this.roll);
    const spool = this.spool || 0;
    // blades at low speed, the disc as they blur; both turn so the hand-over does not show
    this.rotorA = ((this.rotorA || 0) + dt * Math.min(spool * 7, spool < 0.75 ? 1.4 : 7) * TAU) % TAU;
    this.tailA = ((this.tailA || 0) + dt * spool * 14 * TAU) % TAU;
    m.rotor.rotation.y = this.rotorA;
    m.tailRotor.rotation.x = this.tailA;
    const blur = smoothstep(0.45, 0.85, spool);
    m.discMat.opacity = blur * 0.8;
    m.disc.visible = m.tailDisc.visible = blur > 0.01;
    m.blades.visible = blur < 0.97; m.tailBlades.visible = blur < 0.97;
    // the anti-collision beacon flashes while the engine runs
    const beat = (t * 1.1 + this.id * 0.37) % 1;
    const beacon = spool > 0.05 && !this.destroyed && beat < 0.1;
    m.beacon.material = beacon ? m.beaconMats.on : m.beaconMats.off;
    if (m.strobe) m.strobe.visible = this.strobeOn && !this.destroyed && Math.floor(t * 6 + this.id) % 3 === 0;
    if (this.light) this.updateSearchlight(dt, t);
  }

  // ---- police searchlight: a soft cone and a pool of light on the ground (no real light) -----------
  buildSearchlight() {
    const cone = new THREE.Mesh(searchGeo(), searchMats().cone);
    const spot = new THREE.Mesh(searchGeo(true), searchMats().spot);
    cone.renderOrder = 4; spot.renderOrder = 3;
    cone.visible = spot.visible = false;
    cone.frustumCulled = false;
    G.scene.add(cone, spot);
    this.light = { cone, spot, on: 0 };
  }
  updateSearchlight(dt, t) {
    const L = this.light, pl = G.player;
    const want = !this.destroyed && !this.downing && this.driver === 'cop' && G.env.night > 0.12 ? 1 : 0;
    L.on += (want - L.on) * Math.min(1, dt * 2);
    L.cone.visible = L.spot.visible = L.on > 0.02;
    if (!L.cone.visible) return;
    // the beam leads from the nose pod; on target it holds the player, otherwise it sweeps
    const s = Math.sin(this.heading), c = Math.cos(this.heading);
    const ox = this.pos.x + s * 2.07 + c * 0.55, oy = this.pos.y + 0.42, oz = this.pos.z + c * 2.07 - s * 0.55;
    const pp = pl.worldPos;
    if (this.sees) _a.set(pp.x, pp.y, pp.z);
    else _a.set(this.pos.x + Math.sin(t * 0.5 + this.id) * 22 + s * 18, 0, this.pos.z + Math.cos(t * 0.37 + this.id) * 22 + c * 18);
    if (!this.sees) _a.y = surfaceBelow(_a.x, _a.z, this.pos.y);
    const A = this.lightAim;
    A.lerp(_a, Math.min(1, dt * (this.sees ? 3 : 1.2)));
    const len = Math.max(1, Math.hypot(A.x - ox, A.y - oy, A.z - oz));
    L.cone.position.set(ox, oy, oz);
    L.cone.scale.set(len * 0.11, len, len * 0.11);
    L.cone.quaternion.setFromUnitVectors(_dn, _d.set(A.x - ox, A.y - oy, A.z - oz).normalize());
    L.cone.material.opacity = 0.13 * L.on;
    L.spot.position.set(A.x, surfaceBelow(A.x, A.z, A.y + 2) + 0.15, A.z);
    L.spot.scale.setScalar(Math.max(6, len * 0.24));
    L.spot.material.opacity = 0.75 * L.on;
  }
  dispose() {
    if (this.light) G.scene.remove(this.light.cone, this.light.spot);
    this.m.discMat.dispose(); this.m.far.material.dispose(); this.m.far.geometry.dispose(); this.m.casters[0].geometry.dispose();
    super.dispose();
  }
}

let sGeo = null, sMats = null;
function searchGeo(spot = false) {
  if (!sGeo) {
    const c = new THREE.CylinderGeometry(0.06, 1, 1, 20, 1, true);
    c.translate(0, -0.5, 0);
    const p = new THREE.PlaneGeometry(1, 1);
    p.rotateX(-Math.PI / 2);
    sGeo = { c, p };
  }
  return spot ? sGeo.p : sGeo.c;
}
function searchMats() {
  if (!sMats) sMats = {
    cone: new THREE.MeshBasicMaterial({ color: 0xe8f2ff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
    spot: new THREE.MeshBasicMaterial({ map: makeGlowTexture(), color: 0xf0f6ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }),
  };
  return sMats;
}

// ---- the police helicopter's pilot ------------------------------------------------------------
// Circles the player at altitude (over the rooftops), keeps the searchlight on them and tells the
// ground units where they are, fires now and then from the door, and flies off when the flag drops.
export class HeliPilot {
  constructor() { this.leaving = false; this.orbit = rand(0, TAU); this.shootT = rand(3, 5); this.lookT = 0; this.seen = false; }
  control(v, dt, t) {
    const PS = G.police, pl = G.player, pp = pl.worldPos;
    let tx, tz, alt;
    const dx = pp.x - v.pos.x, dz = pp.z - v.pos.z, hd = Math.hypot(dx, dz);
    if (this.leaving) {
      tx = v.pos.x - dx; tz = v.pos.z - dz; alt = v.pos.y + 30;
      v.strobeOn = false;
      if (hd > 520) this.done = true;   // heliWorld.js takes it away
    } else {
      const known = PS.seen || PS.unseenT < 3;
      const cx = known ? pp.x : PS.lastKnown.x, cz = known ? pp.z : PS.lastKnown.z;
      this.orbit += dt * (known ? 0.2 : 0.1);
      const r = known ? 34 : 50;
      tx = cx + Math.cos(this.orbit) * r; tz = cz + Math.sin(this.orbit) * r;
      alt = Math.max(groundHeight(tx, tz, 9999), WATER_Y) + 46;
      // the player flying: stay level with them, a little above
      if (pl.vehicle && pl.vehicle.cls === 'heli') alt = Math.max(alt, pp.y + 14);
    }
    // keep clear of the skyline: climb over low roofs ahead (braking until clear), fly round towers
    let vx = (tx - v.pos.x) * 0.45, vz = (tz - v.pos.z) * 0.45;
    const sp = Math.hypot(vx, vz), cap = this.leaving ? 40 : 36;
    if (sp > cap) { vx *= cap / sp; vz *= cap / sp; }
    let roof = roofTop(v.pos.x, v.pos.z, 10);
    const ob = blocker(v, vx, vz);
    if (ob && ob.top > v.pos.y + 30) {
      // slide along the tower's side, towards the side the target is on
      const ax = v.pos.x - ob.x, az = v.pos.z - ob.z, l = Math.hypot(ax, az) || 1, into = -(vx * ax + vz * az) / l;
      if (into > 0) { vx += (ax / l) * into; vz += (az / l) * into; }
      const sx = -az / l, sz = ax / l, side = Math.sign((tx - v.pos.x) * sx + (tz - v.pos.z) * sz) || 1;
      vx += sx * side * 16; vz += sz * side * 16;
    } else if (ob) roof = Math.max(roof, ob.top);
    alt = Math.max(alt, roof + 18);
    if (roof > v.pos.y - 10) { const k = clamp((v.pos.y - roof) / 10, 0.1, 1); vx *= k; vz *= k; }
    v.cmd.vx = vx; v.cmd.vz = vz;
    v.cmd.vy = clamp((Math.min(alt, CEILING - 20) - v.pos.y) * 0.7, -7, v.T.climb);
    v.cmd.h = hd < 140 && !this.leaving ? Math.atan2(dx, dz) : Math.atan2(vx, vz);
    // can the crew see the player? (a few times a second)
    this.lookT -= dt;
    if (this.lookT <= 0) {
      this.lookT = 0.25;
      const dy = pp.y + 1 - v.pos.y, d3 = Math.hypot(dx, dy, dz);
      this.seen = !this.leaving && !G.indoors && pl.alive && hd < 170 && d3 > 1 && rayBoxes(v.pos.x, v.pos.y, v.pos.z, dx / d3, dy / d3, dz / d3, d3 - 2) >= d3 - 2;
    }
    v.sees = this.seen;
    v.strobeOn = !this.leaving;
    v.lightsOn = true;
    // a marksman in the door at four stars and up
    if (this.seen && PS.stars >= 4 && hd < 120) {
      this.shootT -= dt;
      if (this.shootT <= 0) {
        this.shootT = rand(2.2, 3.8);
        const pv = pl.vehicle ? pl.vehicle.vel : pl.vel, lead = Math.hypot(dx, dz, pp.y - v.pos.y) / 75;
        const s = Math.sin(v.heading), c = Math.cos(v.heading);
        G.weapons.fireBolt(v.pos.x - c * 1.3, v.pos.y + 1.2, v.pos.z + s * 1.3, pp.x + pv.x * lead, pp.y + 0.9, pp.z + pv.z * lead, 6, 0.62);
      }
    }
  }
}

// The first building in the way along (vx, vz) that stands above the machine: its centre and top.
const _ob = { x: 0, z: 0, top: 0 };
function blocker(v, vx, vz) {
  const sp = Math.hypot(vx, vz);
  if (sp < 1) return null;
  for (const ahead of [12, 30, 50]) {
    const x = v.pos.x + (vx / sp) * ahead, z = v.pos.z + (vz / sp) * ahead;
    for (const c of queryColliders(x, z, 9)) {
      if (c.removed || c.y1 < v.pos.y - 8 || (c.type !== 'box' && c.r < 3)) continue;
      const box = c.type === 'box';
      const d = box ? Math.hypot(Math.max(c.x0 - x, 0, x - c.x1), Math.max(c.z0 - z, 0, z - c.z1)) : Math.hypot(c.x - x, c.z - z) - c.r;
      if (d > 9) continue;
      _ob.x = box ? (c.x0 + c.x1) / 2 : c.x; _ob.z = box ? (c.z0 + c.z1) / 2 : c.z; _ob.top = c.y1;
      return _ob;
    }
  }
  return null;
}

// A police helicopter arriving from out of town towards the player.
export function spawnPoliceHeli() {
  const pp = G.player.worldPos, a = rand(0, TAU), d = 280;
  const x = pp.x + Math.cos(a) * d, z = pp.z + Math.sin(a) * d;
  const h = Math.atan2(pp.x - x, pp.z - z);
  const v = new Heli('policeHeli', x, z, h);
  v.pos.y = Math.max(roofTop(x, z, 12) + 30, Math.max(groundHeight(x, z, 9999), WATER_Y) + 80);
  v.onGround = false; v.spool = 1; v.agl = 80;
  v.vel.set(Math.sin(h) * 30, 0, Math.cos(h) * 30);
  v.driver = 'cop'; v.keep = true; v.strobeOn = true; v.lightsOn = true;
  v.ai = new HeliPilot();
  v.syncMesh();
  return v;
}
