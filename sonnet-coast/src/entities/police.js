// The "Safety Flag" wanted system: crimes, stars, pursuit units (cruisers, off-road rangers,
// skiffs, containment trucks), officers on foot, Constitutional AI drones and roadblocks.
import * as THREE from 'three';
import { G, on, emit } from '../state.js';
import { Vehicle } from './vehicle.js';
import { spawnPoliceHeli } from './heli.js';
import { LaneDriver } from './traffic.js';
import { driveToward, stopVehicle } from '../ai/driver.js';
import { roadAt, nodes, edges, nearestNode, findPath, edgePoint, groundHeight, terrainHeight } from '../world/roads.js';
import { segmentBlocked, queryColliders } from '../world/colliders.js';
import { forestMask, swampMask } from '../world/terrain.js';
import { WATER_Y, CITY, POI } from '../world/layout.js';
import { clamp, wrapAngle } from '../util/math.js';
import { rand, pick, chance } from '../util/rng.js';
import { PAL } from '../world/palette.js';
import { makeGlowTexture } from '../world/textures.js';

const CRIMES = {
  theft: { min: 0, heat: 0.5, quiet: true, label: 'Vehicle theft' },
  jack: { min: 1, heat: 0.3, label: 'Carjacking' },
  stealPolice: { min: 2, heat: 0.5, label: 'Stolen police vehicle' },
  hitPed: { min: 1, heat: 0.45, label: 'Hit and run' },
  assault: { min: 1, heat: 0.4, label: 'Assault' },
  assaultCop: { min: 2, heat: 0.7, label: 'Assault on an officer' },
  copDown: { min: 3, heat: 0.6, label: 'Officer down' },
  gunfire: { min: 0, heat: 0.15, quiet: true, label: 'Shots fired' },
  shootVehicle: { min: 1, heat: 0.2, label: 'Shots fired' },
  shootPolice: { min: 2, heat: 0.5, label: 'Firing on police' },
  ramPolice: { min: 1, heat: 0.35, label: 'Ramming police' },
  destroyVehicle: { min: 2, heat: 0.6, label: 'Vehicle destroyed' },
  destroyPolice: { min: 3, heat: 1.0, label: 'Police vehicle destroyed' },
  droneDown: { min: 4, heat: 0.8, label: 'Drone destroyed' },
  emp: { min: 1, heat: 0.3, label: 'EMP discharge' },
  empPolice: { min: 3, heat: 0.7, label: 'EMP attack on police' },
  hackPolice: { min: 2, heat: 0.6, label: 'Police systems breached' },
  checkpoint: { min: 3, heat: 0, label: 'Checkpoint breach' },
};
const WANT = {
  cars: [0, 1, 2, 3, 3, 4], swat: [0, 0, 0, 0, 1, 2], drones: [0, 0, 0, 1, 2, 3], boats: [0, 1, 1, 2, 2, 3], helis: [0, 0, 0, 0, 1, 1],
};
const P = {};
const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _dn = new THREE.Vector3(0, -1, 0), _dir = new THREE.Vector3();

// Drives a pursuit vehicle.
class PursuitDriver {
  constructor(unit) { this.unit = unit; this.path = null; this.pathT = 0; this.shootT = rand(1, 2.5); this.offT = 0; }
  control(v, dt, t) {
    const PS = G.police, u = this.unit, pl = G.player;
    const pp = pl.worldPos;
    const known = PS.seen || PS.unseenT < 1.5;
    let tx = known ? pp.x : PS.lastKnown.x + u.searchX, tz = known ? pp.z : PS.lastKnown.z + u.searchZ;
    const d = Math.hypot(tx - v.pos.x, tz - v.pos.z);
    const boat = v.cls === 'boat';
    v.sirenOn = true;
    v.lightsOn = true;
    if (!known && d < 25) { // reached the search point: pick another nearby
      u.searchX = rand(-90, 90); u.searchZ = rand(-90, 90);
    }
    if (boat) {
      if (known) { const lead = clamp(d / 30, 0, 1.2); tx += pl.vehicle ? pl.vehicle.vel.x * lead : 0; tz += pl.vehicle ? pl.vehicle.vel.z * lead : 0; }
      driveToward(v, tx, tz, v.T.maxSpeed, dt, { avoid: true, water: true });
      return;
    }
    const onFoot = !pl.vehicle;
    const los = known && d < 110 && !segmentBlocked(v.pos.x, v.pos.z, pp.x, pp.z, v.pos.y + 1.2);
    let direct = los || d < 28;
    if (!direct) {
      // Out of sight: route along the road graph, then go straight for the last stretch.
      this.pathT -= dt;
      if (!this.path || this.pathT <= 0) {
        this.pathT = 2.2 + Math.random();
        const from = nearestNode(v.pos.x, v.pos.z);
        const to = nearestNode(tx, tz);
        const route = findPath(from, to, u.offroad);
        this.path = route ? route.map((s) => (s.forward ? s.e.b : s.e.a)) : [];
        if (Math.hypot(from.x - v.pos.x, from.z - v.pos.z) > 16 && from !== to) this.path.unshift(from);
        // skip the first node if it is behind us and the second is closer to where we are going
        if (this.path.length > 1) {
          const a = this.path[0], b = this.path[1];
          const ax = a.x - v.pos.x, az = a.z - v.pos.z, bx = b.x - a.x, bz = b.z - a.z;
          if (ax * bx + az * bz < 0 && Math.hypot(b.x - v.pos.x, b.z - v.pos.z) < Math.hypot(bx, bz)) this.path.shift();
        }
      }
      while (this.path.length && Math.hypot(this.path[0].x - v.pos.x, this.path[0].z - v.pos.z) < 15) this.path.shift();
      if (this.path.length) {
        driveToward(v, this.path[0].x, this.path[0].z, Math.min(v.T.maxSpeed, 34), dt, { avoid: true, allowReverse: true, noWater: true });
      } else direct = true;
    } else this.path = null;
    if (direct) {
      if (known && !onFoot) {
        const lead = clamp(d / 34, 0, 1.1);
        tx += pl.vehicle.vel.x * lead; tz += pl.vehicle.vel.z * lead;
      }
      let want = v.T.maxSpeed;
      if (known && onFoot) want = d < 9 ? 0 : Math.min(want, 6 + d * 0.5);
      else if (known && PS.stars <= 1 && d < 16) want = Math.min(want, pl.worldSpeed + 3); // one star: tail, do not ram
      if (want <= 0.1) stopVehicle(v);
      else driveToward(v, tx, tz, want, dt, { avoid: true, allowReverse: true, noWater: true });
    }
    // passenger opens fire at three stars and up
    if (PS.stars >= 3 && known && los && d < 55 && !v.destroyed) {
      this.shootT -= dt;
      if (this.shootT <= 0) {
        this.shootT = rand(1.7, 3.0);
        const lead = d / 75;
        const pv = pl.vehicle ? pl.vehicle.vel : pl.vel;
        G.weapons.fireBolt(v.pos.x, v.pos.y + v.T.hgt * 0.8, v.pos.z, pp.x + pv.x * lead, pp.y + 1.0, pp.z + pv.z * lead, 7, 0.72);
      }
    }
  }
}

export class Police {
  constructor(scene) {
    this.scene = scene;
    this.stars = 0; this.heat = 0;
    this.seen = false; this.unseenT = 99; this.lastSeenT = -99;
    this.lastKnown = { x: 0, z: 0 };
    this.pursuitT = 0;
    this.units = []; this.foot = []; this.drones = []; this.blocks = [];
    this.spawnT = 0; this.senseT = 0; this.blockT = 20;
    this.arrestT = 0;
    this.ramCool = 0;
    this.offroadT = 0;
    this.suppressed = false;   // missions can switch the police off
    this.lastCrime = '';
    this.cones = [];
    this.heli = null; this.heliT = 0;   // the police helicopter (heli.js flies it), and when another may come
    this.buildDroneAssets();
    this.wire();
  }

  wire() {
    on('crime', (type, x, z, obj) => this.crime(type, x, z, obj));
    on('vehicleStolen', (v, kind) => this.crime(v.isPolice ? 'stealPolice' : kind === 'jack' ? 'jack' : 'theft', v.pos.x, v.pos.z, v));
    on('pedDown', (p, source) => {
      const pl = G.player;
      if (source === 'player' || (source && source === pl.vehicle)) this.crime(p.role === 'cop' ? 'copDown' : 'hitPed', p.pos.x, p.pos.z, p);
    });
    on('vehicleImpact', (v, speed, x, z, other) => {
      const pl = G.player;
      if (v === pl.vehicle && other && other.isPolice && other.driver && speed > 5 && this.ramCool <= 0) { this.ramCool = 3; this.crime('ramPolice', x, z, other); }
    });
    on('vehicleExploded', (v, source) => {
      const pl = G.player;
      const byPlayer = source === 'player' || (source && source === pl.vehicle) || v === pl.vehicle;
      if (v.unit) { v.unit.dead = true; }
      if (byPlayer && v !== pl.vehicle) this.crime(v.isPolice ? 'destroyPolice' : 'destroyVehicle', v.pos.x, v.pos.z, v);
    });
  }

  // ---- crimes -----------------------------------------------------------------
  witnessed(x, z) {
    for (const u of this.units) if (!u.dead && Math.hypot(u.v.pos.x - x, u.v.pos.z - z) < 90) return true;
    for (const f of this.foot) if (Math.hypot(f.ped.pos.x - x, f.ped.pos.z - z) < 70) return true;
    for (const v of G.vehicles) if (v.patrol && v.driver && Math.hypot(v.pos.x - x, v.pos.z - z) < 75 && !segmentBlocked(v.pos.x, v.pos.z, x, z, v.pos.y + 1.2)) return true;
    return false;
  }
  crime(type, x, z, obj) {
    if (this.suppressed) return;
    const C = CRIMES[type];
    if (!C || (obj && obj.outlaw)) return;
    const wit = this.witnessed(x, z);
    const wild = Math.max(forestMask(x, z), swampMask(x, z)) > 0.5;
    if (C.quiet && !wit && this.stars === 0) {
      // out in the wilds nobody is listening; in town a quiet crime is sometimes called in
      if (wild || !chance(type === 'theft' ? 0.4 : 0.25)) return;
    }
    if (wild && !wit && this.stars === 0 && C.min <= 1 && chance(0.5)) return;
    const before = this.stars;
    let min = C.min;
    if (C.quiet && min === 0) min = 1;
    this.heat += C.heat;
    let s = Math.max(this.stars, min);
    while (this.heat >= 1 && s < 5) { this.heat -= 1; s++; }
    this.setStars(s);
    this.lastKnown.x = x; this.lastKnown.z = z;
    this.unseenT = Math.min(this.unseenT, 3);
    this.lastCrime = C.label;
    if (this.stars > before) emit('wantedUp', this.stars, C.label);
  }
  setStars(n) {
    n = clamp(Math.round(n), 0, 5);
    if (n === this.stars) return;
    const was = this.stars;
    this.stars = n;
    if (n > 0) this.wasWanted = true;
    if (n === 0) this.clear('cleared');
    else if (was === 0) { this.pursuitT = 0; this.unseenT = 0; const p = G.player.worldPos; this.lastKnown.x = p.x; this.lastKnown.z = p.z; }
    emit('wantedChanged', n, was);
  }
  raise(min, label = '') {
    if (this.suppressed) return;
    if (this.stars < min) { const was = this.stars; this.setStars(min); this.unseenT = 0; if (label) this.lastCrime = label; emit('wantedUp', this.stars, label); void was; }
  }
  get evading() { return this.stars > 0 && !this.seen && this.unseenT > 2.5; }
  get clearTime() { return 16 + this.stars * 7; }
  // 0..1 progress towards losing the flag
  get evadeProgress() { return this.stars > 0 && !this.seen ? clamp(this.unseenT / this.clearTime, 0, 1) : 0; }

  clear(reason = 'evaded') {
    const had = this.wasWanted || this.stars > 0;
    this.wasWanted = false;
    this.stars = 0; this.heat = 0; this.pursuitT = 0; this.arrestT = 0;
    for (const u of this.units) {
      const v = u.v;
      v.unit = null;
      if (v.destroyed || v.removed) continue;
      v.sirenOn = false; v.keep = false;
      const r = v.cls !== 'boat' ? roadAt(v.pos.x, v.pos.z, 14) : null;
      if (r && v.driver && r.type !== 'dirt') {
        const pts = r.e.pts, s = pts[r.i].s + r.t * (pts[r.i + 1].s - pts[r.i].s);
        edgePoint(r.e, s, 0, P);
        const dir = Math.sin(v.heading) * P.dx + Math.cos(v.heading) * P.dz >= 0 ? 1 : -1;
        v.ai = new LaneDriver(r.e, dir, s, 0);
        v.driver = 'npc'; v.traffic = true; v.patrol = true;
      } else { v.ai = null; v.driver = null; v.traffic = false; v.lastUsed = -999; }
    }
    this.units.length = 0;
    for (const f of this.foot) { f.ped.brain = null; f.ped.role = 'gone'; f.ped.aim = 0; f.ped.state = 'flee'; f.ped.fleeFrom = { x: G.player.worldPos.x, z: G.player.worldPos.z }; f.ped.stateT = 30; }
    this.foot.length = 0;
    for (const d of this.drones) if (d.state === 'chase') d.state = 'leave';
    this.releaseHeli();
    for (const b of this.blocks) { b.keep = false; b.sirenOn = false; b.lastUsed = -999; }
    this.blocks.length = 0;
    if (had) emit('wantedCleared', reason);
  }

  // ---- spawning -----------------------------------------------------------------
  spawnUnit(type) {
    const pl = G.player, pp = pl.worldPos;
    const pv = pl.vehicle ? pl.vehicle.vel : pl.vel;
    if (type === 'policeBoat') {
      for (let k = 0; k < 20; k++) {
        const a = rand(0, 6.283), d = rand(110, 190);
        const x = pp.x + Math.cos(a) * d, z = pp.z + Math.sin(a) * d;
        if (WATER_Y - terrainHeight(x, z) < 1.4) continue;
        return this.addUnit(new Vehicle(type, x, z, Math.atan2(pp.x - x, pp.z - z)), false);
      }
      return null;
    }
    const offroad = type === 'policeOffroad';
    for (let k = 0; k < 24; k++) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      if (e.type === 'dirt' && !offroad) continue;
      const s = rand(6, e.len - 6);
      edgePoint(e, s, 0, P);
      const d = Math.hypot(P.x - pp.x, P.z - pp.z);
      if (d < 130 || d > 240) continue;
      if (P.bridge) continue;
      // at higher levels some units arrive ahead of the player to cut them off
      if (this.stars >= 3 && k < 12 && (P.x - pp.x) * pv.x + (P.z - pp.z) * pv.z < 0) continue;
      const toward = (pp.x - P.x) * P.dx + (pp.z - P.z) * P.dz >= 0 ? 1 : -1;
      const lp = edgePoint(e, s, e.spec.lanes[0] * toward, {});
      let clear = true;
      for (const o of G.vehicles) if ((o.pos.x - lp.x) ** 2 + (o.pos.z - lp.z) ** 2 < 144) { clear = false; break; }
      if (!clear) continue;
      const heading = Math.atan2(P.dx * toward, P.dz * toward);
      const v = new Vehicle(type, lp.x, lp.z, heading);
      v.vel.set(Math.sin(heading) * 14, 0, Math.cos(heading) * 14);
      return this.addUnit(v, offroad);
    }
    return null;
  }
  addUnit(v, offroad) {
    const u = { v, offroad, cops: v.typeId === 'swat' ? 3 : 2, out: 0, dead: false, searchX: rand(-60, 60), searchZ: rand(-60, 60), stopT: 0, id: v.id };
    v.driver = 'cop'; v.unit = u; v.keep = true; v.sirenOn = true; v.lightsOn = true; v.patrol = false; v.traffic = false;
    v.ai = new PursuitDriver(u);
    this.units.push(u);
    return u;
  }

  // ---- officers on foot ---------------------------------------------------------
  dismount(u) {
    const v = u.v;
    const n = Math.min(u.cops, this.stars >= 3 ? 2 : 1);
    for (let k = 0; k < n; k++) {
      const d = v.doorPos(k === 0 ? -1 : 1);
      const ped = G.peds.spawnCop(d.x, d.z, null);
      if (!ped) break;
      const f = { ped, unit: u, shootT: rand(0.6, 1.4), stuckT: 0 };
      ped.brain = (p, dt, t) => this.copBrain(f, dt, t);
      ped.heading = v.heading;
      this.foot.push(f);
      u.cops--; u.out++;
    }
    v.driver = null; v.ai = null; v.inThrottle = 0; v.inSteer = 0;
    emit('sfx', 'doorOpen', v.pos.x, v.pos.z);
  }
  remount(u) {
    for (let i = this.foot.length - 1; i >= 0; i--) {
      const f = this.foot[i];
      if (f.unit !== u) continue;
      G.peds.remove(f.ped);
      this.foot.splice(i, 1);
      u.cops++; u.out--;
    }
    if (!u.v.destroyed) { u.v.driver = 'cop'; u.v.ai = new PursuitDriver(u); }
  }
  copBrain(f, dt, t) {
    const p = f.ped, pl = G.player, pp = pl.worldPos;
    const dx = pp.x - p.pos.x, dz = pp.z - p.pos.z;
    const d = Math.hypot(dx, dz);
    const sees = d < 70 && !segmentBlocked(p.pos.x, p.pos.z, pp.x, pp.z, p.pos.y + 1.4);
    const lethal = this.stars >= 3 || (this.stars >= 2 && this.playerArmed);
    p.aim = 0;
    if (!pl.alive) return 0;
    if (!sees && !this.seen) { p.dest = { x: this.lastKnown.x + f.unit.searchX * 0.3, z: this.lastKnown.z + f.unit.searchZ * 0.3 }; return 3.2; }
    // arrest: stay on top of a slow or downed suspect
    const slow = pl.worldSpeed < 2.4 || pl.state === 'ragdoll';
    if (d < 2.1 && slow && Math.abs(pp.y - p.pos.y) < 2) {
      p.heading = Math.atan2(dx, dz);
      p.aim = 1;
      return 0;
    }
    if (lethal && sees && d < 34 && !pl.vehicle) {
      p.heading += clamp(wrapAngle(Math.atan2(dx, dz) - p.heading), -dt * 8, dt * 8);
      p.aim = 1;
      f.shootT -= dt;
      if (f.shootT <= 0) {
        f.shootT = rand(0.9, 1.6);
        const acc = clamp(0.92 - d * 0.012 - pl.worldSpeed * 0.035, 0.35, 0.9);
        G.weapons.fireBolt(p.pos.x + Math.sin(p.heading) * 0.5, p.pos.y + 1.35, p.pos.z + Math.cos(p.heading) * 0.5, pp.x, pp.y + 1.0, pp.z, 9, acc);
      }
      if (d > 14) { p.dest = { x: pp.x, z: pp.z }; return 2.2; }
      return 0;
    }
    if (lethal && sees && d < 40 && pl.vehicle) {
      p.heading += clamp(wrapAngle(Math.atan2(dx, dz) - p.heading), -dt * 8, dt * 8);
      p.aim = 1;
      f.shootT -= dt;
      if (f.shootT <= 0) { f.shootT = rand(1.0, 1.7); G.weapons.fireBolt(p.pos.x, p.pos.y + 1.35, p.pos.z, pp.x, pp.y + 0.9, pp.z, 8, 0.7); }
      if (pl.worldSpeed < 2 && d > 2.4) { p.dest = pl.vehicle.doorPos(-1, _v); p.dest = { x: p.dest.x, z: p.dest.z }; return 5.4; }
      return 0;
    }
    p.dest = pl.vehicle ? (() => { const q = pl.vehicle.doorPos(-1, _v); return { x: q.x, z: q.z }; })() : { x: pp.x, z: pp.z };
    return 5.6;
  }

  // ---- drones -------------------------------------------------------------------
  buildDroneAssets() {
    const body = new THREE.MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.5, metalness: 0.6 });
    const cyan = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonCyan).multiplyScalar(2.2), toneMapped: false });
    const red = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.policeRed).multiplyScalar(3), toneMapped: false });
    const blue = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.police).multiplyScalar(3), toneMapped: false });
    this.droneMats = { body, cyan, red, blue };
    this.coneMat = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.085, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    this.coneGeo = new THREE.CylinderGeometry(0.4, 7, 1, 16, 1, true);
    this.coneGeo.translate(0, -0.5, 0);
    this.spotMat = new THREE.MeshBasicMaterial({ map: makeGlowTexture(), color: 0xcfeeff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 });
    this.spotGeo = new THREE.PlaneGeometry(16, 16);
    this.spotGeo.rotateX(-Math.PI / 2);
  }
  spawnDrone() {
    const pp = G.player.worldPos;
    const a = rand(0, 6.283);
    const g = new THREE.Group();
    const M = this.droneMats;
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.5), M.body); g.add(b);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), M.cyan).translateY(-0.3));
    const rotors = [];
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 1.5), M.body);
      arm.position.set(x * 0.9, 0.05, z * 0.9); arm.rotation.y = Math.atan2(x, z);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 5, 16), M.cyan);
      ring.rotation.x = Math.PI / 2; ring.position.set(x * 1.45, 0.2, z * 1.45);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 0.1), M.body);
      blade.position.copy(ring.position);
      g.add(arm, ring, blade);
      rotors.push(blade);
    }
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.2), M.red); l1.position.set(0.4, 0.3, 0);
    const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.2), M.blue); l2.position.set(-0.4, 0.3, 0);
    g.add(l1, l2);
    g.scale.setScalar(1.25);
    const cone = new THREE.Mesh(this.coneGeo, this.coneMat);
    cone.renderOrder = 4;
    const spot = new THREE.Mesh(this.spotGeo, this.spotMat);
    spot.renderOrder = 3;
    this.scene.add(g, cone, spot);
    const d = {
      id: Math.random() * 100, pos: new THREE.Vector3(pp.x + Math.cos(a) * 140, 60, pp.z + Math.sin(a) * 140), vel: new THREE.Vector3(),
      mesh: g, cone, spot, rotors, l1, l2, health: 42, state: 'chase', shootT: rand(1, 3), empT: rand(8, 14), fallT: 0, sees: false,
    };
    this.drones.push(d);
    return d;
  }
  removeDrone(d) {
    this.scene.remove(d.mesh, d.cone, d.spot);
    const i = this.drones.indexOf(d);
    if (i >= 0) this.drones.splice(i, 1);
  }
  damageDrone(d, amount) {
    if (d.state === 'falling') return;
    d.health -= amount;
    if (!d.outlaw) this.raise(Math.max(this.stars, 3), 'Firing on a drone');
    if (d.health <= 0) { d.state = 'falling'; d.vel.y = 2; this.crime('droneDown', d.pos.x, d.pos.z, d); emit('droneDown', d); }
  }
  // A drone that is nobody's police: it just circles a point (jobs use these as targets).
  spawnTargetDrone(x, z, y, r = 10) {
    const d = this.spawnDrone();
    d.state = 'target'; d.outlaw = true; d.health = 30;
    d.anchor = { x, z, y, r };
    d.pos.set(x + r, y, z);
    d.l1.scale.setScalar(0); d.l2.scale.setScalar(0);
    d.cone.visible = false; d.spot.visible = false;
    return d;
  }
  hackDrone(d) { if (d.state !== 'falling') { d.state = 'falling'; G.fx.zap(d.pos.x, d.pos.y, d.pos.z, 30, 1.2); emit('droneDown', d); } }
  empDrones(x, y, z, r) {
    let n = 0;
    for (const d of this.drones) if (d.state !== 'falling' && Math.hypot(d.pos.x - x, d.pos.z - z) < r && Math.abs(d.pos.y - y) < 40) { d.state = 'falling'; if (!d.outlaw) n++; emit('droneDown', d); }
    return n;
  }
  rayDrones(ox, oy, oz, dx, dy, dz, maxD) {
    let best = null, bt = maxD;
    for (const d of this.drones) {
      if (d.state === 'falling') continue;
      const fx = d.pos.x - ox, fy = d.pos.y - oy, fz = d.pos.z - oz;
      const t = fx * dx + fy * dy + fz * dz;
      if (t < 0 || t > bt) continue;
      const cx = fx - dx * t, cy = fy - dy * t, cz = fz - dz * t;
      if (cx * cx + cy * cy + cz * cz < 2.6 * 2.6) { bt = t; best = d; }
    }
    return best ? { drone: best, t: bt } : null;
  }
  updateDrones(dt, t) {
    const pl = G.player, pp = pl.worldPos;
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      d.rotors.forEach((r, k) => { r.rotation.y += dt * (38 + k); });
      const flash = Math.floor(t * 6 + d.id) % 2 === 0;
      d.l1.visible = flash; d.l2.visible = !flash;
      if (d.state === 'falling') {
        d.vel.y -= 20 * dt;
        d.pos.addScaledVector(d.vel, dt);
        d.mesh.rotation.x += dt * 4; d.mesh.rotation.z += dt * 3;
        d.cone.visible = false; d.spot.visible = false;
        if (Math.random() < dt * 30) G.fx.smoke(d.pos.x, d.pos.y, d.pos.z, { dark: 0.15, size: 1.4 });
        const g = Math.max(groundHeight(d.pos.x, d.pos.z, d.pos.y + 1), WATER_Y);
        if (d.pos.y <= g + 0.4) { G.fx.explosion(d.pos.x, g, d.pos.z, 0.55); emit('sfx', 'explosion', d.pos.x, d.pos.z); this.removeDrone(d); continue; }
        d.mesh.position.copy(d.pos);
        continue;
      }
      if (d.state === 'target') {
        const a = t * 0.4 + d.id, A = d.anchor;
        const k = Math.min(1, dt * 1.6);
        d.pos.x += (A.x + Math.cos(a) * A.r - d.pos.x) * k; d.pos.z += (A.z + Math.sin(a) * A.r - d.pos.z) * k;
        d.pos.y += (A.y + Math.sin(t * 0.7 + d.id) * 1.5 - d.pos.y) * k;
        d.mesh.position.copy(d.pos);
        d.mesh.rotation.set(0, -a, 0);
        d.sees = false;
        continue;
      }
      // where to hover
      let tx, tz, ty;
      if (d.state === 'leave') { tx = d.pos.x + (d.pos.x - pp.x); tz = d.pos.z + (d.pos.z - pp.z); ty = 120; if (Math.hypot(d.pos.x - pp.x, d.pos.z - pp.z) > 260) { this.removeDrone(d); continue; } }
      else {
        const known = this.seen || this.unseenT < 2;
        const cx = known ? pp.x : this.lastKnown.x, cz = known ? pp.z : this.lastKnown.z;
        const a = t * (known ? 0.5 : 0.25) + d.id;
        const r = known ? 13 : 45;
        tx = cx + Math.cos(a) * r; tz = cz + Math.sin(a) * r;
        ty = Math.max(groundHeight(tx, tz, 9999), WATER_Y) + 17;
      }
      // climb over roofs
      let roof = 0;
      for (const ahead of [0, 0.6]) {
        const qx = d.pos.x + d.vel.x * ahead, qz = d.pos.z + d.vel.z * ahead;
        for (const c of queryColliders(qx, qz, 3)) if (c.type === 'box' && qx > c.x0 - 3 && qx < c.x1 + 3 && qz > c.z0 - 3 && qz < c.z1 + 3) roof = Math.max(roof, c.y1);
      }
      if (roof + 5 > ty) ty = roof + 5;
      const ax = (tx - d.pos.x) * 1.6 - d.vel.x * 1.5, ay = (ty - d.pos.y) * 2.4 - d.vel.y * 2.2, az = (tz - d.pos.z) * 1.6 - d.vel.z * 1.5;
      d.vel.x += clamp(ax, -30, 30) * dt; d.vel.y += clamp(ay, -22, 22) * dt; d.vel.z += clamp(az, -30, 30) * dt;
      const sp = Math.hypot(d.vel.x, d.vel.z);
      if (sp > 40) { d.vel.x *= 40 / sp; d.vel.z *= 40 / sp; }
      d.pos.addScaledVector(d.vel, dt);
      d.mesh.position.copy(d.pos);
      d.mesh.rotation.set(clamp(d.vel.z * 0.02, -0.5, 0.5), Math.atan2(pp.x - d.pos.x, pp.z - d.pos.z), clamp(-d.vel.x * 0.02, -0.5, 0.5));
      // searchlight
      const hd = Math.hypot(pp.x - d.pos.x, pp.z - d.pos.z);
      const dy = d.pos.y - pp.y;
      d.sees = d.state === 'chase' && hd < 60 && dy > 0 && !segmentBlocked(d.pos.x, d.pos.z, pp.x, pp.z, Math.min(d.pos.y, pp.y + 6));
      const aim = d.sees ? _a.copy(pp) : _a.set(d.pos.x + Math.sin(t + d.id) * 9, groundHeight(d.pos.x, d.pos.z, 9999), d.pos.z + Math.cos(t * 0.8 + d.id) * 9);
      const len = Math.hypot(aim.x - d.pos.x, aim.y - d.pos.y, aim.z - d.pos.z);
      d.cone.visible = G.env.night > 0.1 || d.sees;
      d.cone.position.copy(d.pos);
      d.cone.scale.set(1, len, 1);
      d.cone.quaternion.setFromUnitVectors(_dn, _dir.set(aim.x - d.pos.x, aim.y - d.pos.y, aim.z - d.pos.z).normalize());
      d.spot.visible = d.cone.visible;
      d.spot.position.set(aim.x, Math.max(groundHeight(aim.x, aim.z, 9999), WATER_Y) + 0.12, aim.z);
      // weapons
      if (d.sees && this.stars >= 4) {
        d.shootT -= dt;
        if (d.shootT <= 0) {
          d.shootT = rand(1.3, 2.1);
          const pv = pl.vehicle ? pl.vehicle.vel : pl.vel, lead = len / 75;
          G.weapons.fireBolt(d.pos.x, d.pos.y - 0.5, d.pos.z, pp.x + pv.x * lead, pp.y + 0.9, pp.z + pv.z * lead, 6, 0.78);
        }
        if (this.stars >= 5 && pl.vehicle && hd < 26) {
          d.empT -= dt;
          if (d.empT <= 0) { d.empT = rand(13, 18); pl.vehicle.emp(1.8); G.fx.zap(pl.vehicle.pos.x, pl.vehicle.pos.y + 1, pl.vehicle.pos.z, 30, 1.6); emit('sfx', 'empBlast', pl.vehicle.pos.x, pl.vehicle.pos.z); emit('toast', 'Drone EMP — engine stalled'); }
        }
      }
    }
  }

  // ---- the helicopter ----------------------------------------------------------------
  releaseHeli() {
    const h = this.heli;
    this.heli = null;
    // it stays kept while it flies off: heliWorld.js takes it away once it is far out of town
    if (h && !h.removed && h.ai) h.ai.leaving = true;
  }
  upkeepHeli(t) {
    const h = this.heli;
    if (h && (h.removed || h.destroyed || h.downing || h.sunk)) { this.heli = null; this.heliT = t + 45; h.keep = false; }
    if (this.heli && this.stars < 4) this.releaseHeli();
    else if (!this.heli && WANT.helis[this.stars] && t > this.heliT) { this.heli = spawnPoliceHeli(); this.heliT = t + 20; emit('toast', 'Police helicopter inbound'); }
  }

  // ---- roadblocks ----------------------------------------------------------------
  tryRoadblock(t) {
    const pl = G.player;
    const v = pl.vehicle;
    if (!v || v.cls !== 'car' || v.speed < 12) return;
    const r = roadAt(v.pos.x, v.pos.z, 10);
    if (!r || r.type === 'dirt') return;
    const e = r.e, pts = e.pts;
    const s = pts[r.i].s + r.t * (pts[r.i + 1].s - pts[r.i].s);
    edgePoint(e, s, 0, P);
    const dir = v.vel.x * P.dx + v.vel.z * P.dz >= 0 ? 1 : -1;
    const s2 = s + dir * rand(150, 200);
    if (s2 < 22 || s2 > e.len - 22) return;
    edgePoint(e, s2, 0, P);
    if (P.bridge) return;
    const base = Math.atan2(P.dx, P.dz) + Math.PI / 2;
    for (const off of [-e.spec.hw * 0.5, e.spec.hw * 0.5]) {
      const q = edgePoint(e, s2, off, {});
      let clear = true;
      for (const o of G.vehicles) if ((o.pos.x - q.x) ** 2 + (o.pos.z - q.z) ** 2 < 49) { clear = false; break; }
      if (!clear) continue;
      const b = new Vehicle('police', q.x, q.z, base + (off > 0 ? 0 : Math.PI));
      b.keep = true; b.sirenOn = true; b.lightsOn = true; b.roadblock = true;
      this.blocks.push(b);
    }
    emit('toast', 'Roadblock ahead');
  }

  // ---- main update ----------------------------------------------------------------
  update(dt, t) {
    const pl = G.player, pp = pl.worldPos;
    this.ramCool -= dt;
    this.playerArmed = !pl.vehicle && (G.weapons.current.id === 'pistol' || G.weapons.facingCamera);
    this.updateDrones(dt, t);
    this.cones.length = 0;

    if (this.stars === 0) {
      this.seen = false;
      // patrol cars show up on the minimap too
      for (const v of G.vehicles) if (v.patrol && v.driver) this.cones.push({ x: v.pos.x, z: v.pos.z, heading: v.heading, range: 55, fov: 1.0, alert: false });
      return;
    }
    if (!pl.alive) return;

    // --- perception ---
    this.senseT -= dt;
    let seenNow = false;
    for (const u of this.units) {
      if (u.dead) continue;
      const v = u.v;
      const dx = pp.x - v.pos.x, dz = pp.z - v.pos.z, d = Math.hypot(dx, dz);
      const ang = Math.abs(wrapAngle(Math.atan2(dx, dz) - v.heading));
      const can = d < 28 || (d < 95 && ang < 1.0);
      this.cones.push({ x: v.pos.x, z: v.pos.z, heading: v.heading, range: 95, fov: 1.0, alert: true });
      if (can && !seenNow && this.senseT <= 0 && !segmentBlocked(v.pos.x, v.pos.z, pp.x, pp.z, v.pos.y + 1.3)) seenNow = true;
      else if (can && this.seen && this.senseT > 0) seenNow = true;
    }
    for (const f of this.foot) {
      const p = f.ped;
      if (p.state === 'ragdoll' || p.state === 'down') continue;
      const dx = pp.x - p.pos.x, dz = pp.z - p.pos.z, d = Math.hypot(dx, dz);
      const ang = Math.abs(wrapAngle(Math.atan2(dx, dz) - p.heading));
      this.cones.push({ x: p.pos.x, z: p.pos.z, heading: p.heading, range: 55, fov: 1.2, alert: true });
      if ((d < 12 || (d < 55 && ang < 1.2)) && this.senseT <= 0 && !segmentBlocked(p.pos.x, p.pos.z, pp.x, pp.z, p.pos.y + 1.4)) seenNow = true;
    }
    for (const d of this.drones) { if (d.sees) seenNow = true; if (d.state === 'chase') this.cones.push({ x: d.pos.x, z: d.pos.z, heading: 0, range: 60, fov: Math.PI, alert: true, drone: true }); }
    // the helicopter crew calls the player's position down to everyone else
    const H = this.heli;
    if (H && !H.removed) { if (H.sees) seenNow = true; this.cones.push({ x: H.pos.x, z: H.pos.z, heading: 0, range: 90, fov: Math.PI, alert: true, drone: true }); }
    for (const b of this.blocks) if (!b.destroyed && Math.hypot(pp.x - b.pos.x, pp.z - b.pos.z) < 60) seenNow = true;
    if (this.senseT <= 0) { this.senseT = 0.2; this.seen = seenNow; }
    else if (seenNow) this.seen = true;

    if (this.seen) {
      this.unseenT = 0; this.lastSeenT = t;
      this.lastKnown.x = pp.x; this.lastKnown.z = pp.z;
      this.pursuitT += dt;
      // a long chase escalates on its own, up to four
      if (this.stars >= 2 && this.stars < 4 && this.pursuitT > 55) { this.pursuitT = 0; this.setStars(this.stars + 1); emit('wantedUp', this.stars, 'Evading arrest'); }
    } else {
      this.unseenT += dt;
      if (this.unseenT > this.clearTime) { this.clear('evaded'); return; }
    }

    // --- arrests ---
    let contact = false;
    for (const f of this.foot) {
      const p = f.ped;
      if (p.state !== 'walk') continue;
      const d = Math.hypot(pp.x - p.pos.x, pp.z - p.pos.z);
      if (d < 2.6 && (pl.worldSpeed < 2.4 || pl.state === 'ragdoll')) contact = true;
    }
    if (contact) {
      this.arrestT += dt * (pl.vehicle ? 0.6 : 1);
      if (this.arrestT > 1.5) { this.arrestT = 0; pl.bust(); return; }
    } else this.arrestT = Math.max(0, this.arrestT - dt * 0.8);

    // --- unit upkeep ---
    const onWater = pl.vehicle ? pl.vehicle.cls === 'boat' : pl.swimming;
    const road = roadAt(pp.x, pp.z, 26);
    if (!road && !onWater) this.offroadT += dt; else this.offroadT = Math.max(0, this.offroadT - dt * 2);
    let cars = 0, swat = 0, boats = 0;
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i], v = u.v;
      if (u.dead || v.removed || v.destroyed || v.sunk) {
        v.keep = false; v.unit = null;
        this.units.splice(i, 1);
        // officers who were standing nearby carry on on foot
        continue;
      }
      const d = Math.hypot(pp.x - v.pos.x, pp.z - v.pos.z);
      if (d > 340 && !this.seen || d > 420 || (v.cls !== 'boat' && onWater && d > 200)) {
        // too far behind to matter: recycle
        for (let k = this.foot.length - 1; k >= 0; k--) if (this.foot[k].unit === u) { G.peds.remove(this.foot[k].ped); this.foot.splice(k, 1); }
        v.keep = false; v.unit = null; v.dispose();
        this.units.splice(i, 1);
        continue;
      }
      if (v.typeId === 'swat') swat++; else if (v.cls === 'boat') boats++; else cars++;
      // get out when the suspect is on foot or boxed in
      if (v.cls !== 'boat' && v.driver === 'cop' && u.cops > 0) {
        const suspectSlow = !pl.vehicle || pl.vehicle.speed < 1.8;
        if (suspectSlow && d < 15 && v.speed < 3.5 && (this.seen || d < 8)) {
          u.stopT += dt;
          if (u.stopT > (pl.vehicle ? 1.6 : 0.5)) { u.stopT = 0; this.dismount(u); }
        } else u.stopT = 0;
      } else if (!v.driver && u.out > 0) {
        // back in the car when the suspect drives off
        const far = pl.vehicle && pl.vehicle.speed > 6 && d > 24;
        if (far) { u.stopT += dt; if (u.stopT > 1.8) { u.stopT = 0; this.remount(u); } } else u.stopT = 0;
      }
    }
    for (let i = this.foot.length - 1; i >= 0; i--) {
      const f = this.foot[i];
      if (f.ped.removed) { this.foot.splice(i, 1); continue; }
      if (f.ped.state === 'down') { f.unit.out--; f.ped.role = 'gone'; f.ped.brain = null; this.foot.splice(i, 1); }
    }

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.4;
      const s = this.stars;
      // patrol cars that happen to be nearby join in
      for (const v of G.vehicles) {
        if (!v.patrol || v.driver !== 'npc' || v.unit || cars >= WANT.cars[s]) continue;
        if (Math.hypot(v.pos.x - pp.x, v.pos.z - pp.z) < 170) { this.addUnit(v, false); cars++; }
      }
      if (onWater) {
        if (boats < WANT.boats[s]) this.spawnUnit('policeBoat');
      } else {
        if (cars < WANT.cars[s]) this.spawnUnit(this.offroadT > 3 && chance(0.7) ? 'policeOffroad' : 'police');
        else if (swat < WANT.swat[s]) this.spawnUnit('swat');
      }
      let live = 0;
      for (const d of this.drones) if (d.state === 'chase') live++;
      if (live < WANT.drones[s]) this.spawnDrone();
      this.upkeepHeli(t);
    }
    if (this.stars >= 4) {
      this.blockT -= dt;
      if (this.blockT <= 0) { this.blockT = rand(22, 34); this.tryRoadblock(t); }
    }
  }
}
