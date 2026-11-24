// Jobs, activities, world markers, chop-shop contracts and collectibles.
import * as THREE from 'three';
import { G, on, emit } from '../state.js';
import { Input } from '../input.js';
import { Vehicle } from '../entities/vehicle.js';
import { VEHICLES } from '../entities/vehicleTypes.js';
import { LaneDriver } from '../entities/traffic.js';
import { driveToward, stopVehicle } from '../ai/driver.js';
import { POI, CITY, RECT, WATER_Y } from '../world/layout.js';
import { groundHeight, terrainHeight, roadAt, edges, edgePoint } from '../world/roads.js';
import { forestMask, swampMask, landDist } from '../world/terrain.js';
import { boatSpawns, PIER } from '../world/landmarks.js';
import { addTokens, writeSave } from '../save.js';
import { clamp, formatTokens, catmullRom } from '../util/math.js';
import { RNG, rand, pick } from '../util/rng.js';
import { PAL } from '../world/palette.js';
import { PED_LOOKS } from '../entities/pedlooks.js';

const P = {};
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ------------------------------------------------------------------ base class
class Job {
  constructor(M) { this.M = M; this.vehicles = []; this.rings = []; this.step = ''; this.t = 0; this.offs = []; }
  obj(text, dest = null, blips = null) { this.M.setObjective(text, dest, blips); }
  say(who, text) { G.hud.say(who, text); }
  spawn(type, x, z, heading, opts = {}) { const v = new Vehicle(type, x, z, heading, { ...opts, mission: true }); this.vehicles.push(v); return v; }
  ring(x, z, r = 6, color = PAL.neonAmber, y = null) { const m = this.M.makeRing(x, z, r, color, y); this.rings.push(m); return m; }
  dropRing(m) { if (!m) return; G.scene.remove(m.mesh); const i = this.rings.indexOf(m); if (i >= 0) this.rings.splice(i, 1); }
  inRing(m, pos, extra = 0) { return m && Math.hypot(pos.x - m.x, pos.z - m.z) < m.r + extra && Math.abs(pos.y - m.y) < 6; }
  listen(name, fn) { on(name, fn); this.offs.push([name, fn]); }
  pass(reward, sub = '') { this.M.finish(true, reward, sub); }
  fail(reason) { this.M.finish(false, 0, reason); }
  cleanup() {
    for (const r of this.rings.slice()) this.dropRing(r);
    for (const v of this.vehicles) { v.mission = false; v.keep = false; if (v !== G.player.vehicle) v.lastUsed = -999; }
    for (const [name, fn] of this.offs) { const l = G.events.get(name); if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } }
  }
  update() {}
}

// ------------------------------------------------------------------ intro
class Intro extends Job {
  start() {
    this.say('MERIDIAN', 'Kestrel. Officially this call is not happening, and neither are you.');
    this.say('MERIDIAN', 'Field Ops has problems that cannot go in an incident report. You are how they get solved.');
    this.say('MERIDIAN', 'There is a Haiku GT outside your building. Bring it to Claude Tower. Try to arrive with all four wheels.');
    this.car = G.game.starterCar && !G.game.starterCar.removed && !G.game.starterCar.destroyed ? G.game.starterCar : this.spawn('sport', POI.safehouse.x + 8, POI.safehouse.z - 9.5, Math.PI / 2, { paint: 0xff7a59 });
    this.step = 'car';
    this.tips = 0;
  }
  update(dt, t) {
    const pl = G.player;
    if (this.step === 'car') {
      const ok = this.car && !this.car.removed && !this.car.destroyed;
      this.obj(ok ? 'Get in the <em>Haiku GT</em> outside the safehouse' : 'Find <em>any vehicle</em>', ok ? this.car.pos : null, ok ? [{ x: this.car.pos.x, z: this.car.pos.z, type: 'vehicle' }] : null);
      if (pl.vehicle) { this.step = 'drive'; this.dest = this.ring(POI.tower.x, POI.tower.z + 14, 7); G.hud.toast('W A S D to drive · Space to drift · Shift for nitro'); }
    } else if (this.step === 'drive') {
      this.obj('Drive to <em>Claude Tower</em> downtown', this.dest);
      this.t += dt;
      if (this.t > 14 && this.tips === 0) { this.tips = 1; G.hud.toast('R changes the radio station · M opens the map'); }
      if (this.t > 30 && this.tips === 1) { this.tips = 2; G.hud.toast('Hit things and the Safety Flag goes up. Outrun the cones on the minimap.'); }
      if (this.inRing(this.dest, pl.worldPos) && pl.worldSpeed < 6) {
        this.say('MERIDIAN', 'There you are. The tower has work for you: a prototype to lift, a convoy to stop, hardware to move.');
        this.say('MERIDIAN', 'Look for the stars on your map. And Kestrel — I was never here.');
        this.pass(500, 'Welcome to the Sonnet Coast');
      }
    }
  }
}

// ------------------------------------------------------------------ prototype theft -> chop shop
class Prototype extends Job {
  start() {
    this.say('MERIDIAN', 'Vantablack Labs built a hypercar on weights they did not earn. The Vanta X-1.');
    this.say('MERIDIAN', 'It is sitting in their executive lot uptown. Take it, lose the police, and deliver it to Gator Garage in the bayou.');
    const lot = { x: POI.vanta.x, z: POI.vanta.z + 22 };
    this.car = this.spawn('prototype', lot.x, lot.z, Math.PI / 2, { locked: true });
    this.car.keep = true;
    this.step = 'steal';
    this.listen('enteredVehicle', (v) => {
      if (v !== this.car || this.step !== 'steal') return;
      G.police.raise(2, 'Prototype theft');
      this.say('GATOR', 'That the X-1 I hear? Do not bring the law to my door, cher. Shake them first.');
      this.step = 'run';
    });
  }
  update(dt, t) {
    const pl = G.player, car = this.car;
    if (car.destroyed || car.sunk || car.removed) return this.fail('The prototype was destroyed');
    if (this.step === 'steal') { this.obj('Steal the <em>Vanta X-1</em> from Vantablack Labs', car.pos, [{ x: car.pos.x, z: car.pos.z, type: 'vehicle' }]); return; }
    if (pl.vehicle !== car) { this.obj('Get back in the <em>Vanta X-1</em>', car.pos, [{ x: car.pos.x, z: car.pos.z, type: 'vehicle' }]); return; }
    if (G.police.stars > 0) { this.obj('Lose the <em>Safety Flag</em> — break line of sight and stay out of the cones', null); this.dropRing(this.dest); this.dest = null; return; }
    if (!this.dest) { this.dest = this.ring(POI.gator.x + 2, POI.gator.z - 8, 6, PAL.neonLime); if (!this.told) { this.told = true; this.say('MERIDIAN', 'You are clean. Bayou Road west, then the causeway. The garage is not on any map but yours.'); } }
    this.obj(`Deliver the prototype to <em>Gator Garage</em> <u>(hull ${Math.round(car.healthFrac * 100)}%)</u>`, this.dest);
    if (this.inRing(this.dest, car.pos) && car.speed < 4) {
      const bonus = Math.round(1500 * car.healthFrac);
      pl.leaveVehicle(true);
      pl.pos.set(POI.gator.x - 6, groundHeight(POI.gator.x - 6, POI.gator.z + 2, 99), POI.gator.z + 2);
      car.mission = false; car.keep = false; car.dispose();
      this.say('GATOR', bonus > 1000 ? 'Not a scratch. You drive like you got something to lose.' : 'She has seen better days. Still worth the parts.');
      G.save.chopUnlocked = true;
      this.pass(2500 + bonus, `Condition bonus ${formatTokens(bonus)} ◈`);
    }
  }
}

// ------------------------------------------------------------------ police heist: scanner + convoy
class EscortDriver {
  constructor(job) { this.job = job; this.lane = null; }
  control(v, dt, t) {
    const pl = G.player, pp = pl.worldPos;
    const d = Math.hypot(pp.x - v.pos.x, pp.z - v.pos.z);
    if (this.job.hot && d < 160) {
      const pv = pl.vehicle ? pl.vehicle.vel : pl.vel, lead = clamp(d / 34, 0, 1);
      driveToward(v, pp.x + pv.x * lead, pp.z + pv.z * lead, v.T.maxSpeed, dt, { avoid: true, allowReverse: true, noWater: true });
    } else {
      // hold formation behind the hauler
      const h = this.job.hauler;
      if (h.removed || h.destroyed || !h.driver) return stopVehicle(v);
      const s = Math.sin(h.heading), c = Math.cos(h.heading);
      const tx = h.pos.x - s * this.back, tz = h.pos.z - c * this.back;
      const dd = Math.hypot(tx - v.pos.x, tz - v.pos.z);
      driveToward(v, tx + s * 8, tz + c * 8, clamp(h.speed + (dd - 8) * 0.5, 0, v.T.maxSpeed), dt, { avoid: true });
    }
  }
}
class Heist extends Job {
  start() {
    this.say('MERIDIAN', 'A convoy is moving exfiltrated weights around the loop highway. We cannot see it. The police can.');
    this.say('MERIDIAN', 'Borrow an Anthropic Police interceptor from the Safety Center. Its scanner will find the hauler.');
    const lot = { x: POI.police.x, z: POI.police.z + 60 };
    this.cruiser = this.spawn('police', lot.x + 12, lot.z, 0);
    this.cruiser.keep = true;
    this.step = 'cruiser';
    this.pingT = 0; this.reveal = 0; this.hot = false; this.grab = 0;
  }
  spawnConvoy() {
    // somewhere on the highway, far from the player
    const pp = G.player.worldPos;
    const hw = edges.filter((e) => e.type === 'highway');
    let best = null, bd = 0;
    for (let k = 0; k < 30; k++) {
      const e = pick(hw), s = rand(40, e.len - 40);
      edgePoint(e, s, 0, P);
      if (P.bridge) continue;
      const d = Math.hypot(P.x - pp.x, P.z - pp.z);
      if (d > bd && d < 1400) { bd = d; best = { e, s, x: P.x, z: P.z, dx: P.dx, dz: P.dz }; }
    }
    const { e, s } = best;
    const mk = (type, back, paint) => {
      const q = edgePoint(e, s - back, e.spec.lanes[0], {});
      const v = this.spawn(type, q.x, q.z, Math.atan2(q.dx, q.dz), { paint });
      v.driver = 'convoy'; v.keep = true; v.outlaw = true; v.npc = pick(PED_LOOKS);
      return v;
    };
    this.hauler = mk('van', 0, 0xe8e2d4);
    const ld = new LaneDriver(e, 1, s, 0);
    ld.pace = 0.78; ld.only = (x) => x.type === 'highway';
    this.hauler.ai = ld;
    this.escorts = [mk('sedan', 12, 0x1b1b1f), mk('sedan', 24, 0x1b1b1f)];
    this.escorts.forEach((v, i) => { const a = new EscortDriver(this); a.back = 12 + i * 12; v.ai = a; });
  }
  update(dt, t) {
    const pl = G.player, pp = pl.worldPos;
    this.pingT -= dt; this.reveal -= dt;
    const inCruiser = pl.vehicle && pl.vehicle.isPolice;
    if (this.step === 'cruiser') {
      const c = this.cruiser;
      const ok = c && !c.removed && !c.destroyed;
      this.obj('Steal an <em>Anthropic Police</em> interceptor', ok ? c.pos : POI.police, ok ? [{ x: c.pos.x, z: c.pos.z, type: 'vehicle' }] : null);
      if (inCruiser) { this.step = 'clean'; this.say('MERIDIAN', 'Subtle. Lose them and I will spoof the transponder so the cruiser reads as one of theirs.'); }
      return;
    }
    if (this.step === 'clean') {
      this.obj(G.police.stars > 0 ? 'Lose the <em>Safety Flag</em>' : 'Stand by…', null);
      if (G.police.stars === 0) { this.spawnConvoy(); this.step = 'scan'; this.say('MERIDIAN', 'Transponder spoofed. Ping the scanner and go hunting.'); }
      return;
    }
    const h = this.hauler;
    if (this.step === 'scan' || this.step === 'stop') {
      if (h.destroyed || h.sunk || h.removed) return this.fail('The data core was destroyed with the hauler');
      const d = Math.hypot(h.pos.x - pp.x, h.pos.z - pp.z);
      if (Input.hit('KeyG')) {
        if (!inCruiser) G.hud.toast('The scanner is built into police vehicles');
        else if (this.pingT <= 0) { this.pingT = 3.5; this.reveal = 9; emit('sfx', 'scanner'); G.hud.toast(`Scanner: convoy ${Math.round(d)} m out`, '#6ab6ff'); }
      }
      const shown = this.reveal > 0 || d < 150;
      const blips = shown ? [{ x: h.pos.x, z: h.pos.z, type: 'vehicle', big: true }] : null;
      if (this.step === 'scan') {
        this.obj(shown ? 'Intercept the <em>data convoy</em>' : (inCruiser ? 'Press <kbd>G</kbd> to ping the scanner and find the <em>data convoy</em>' : 'Get in a <em>police vehicle</em> to use its scanner'), shown ? h.pos : null, blips);
        if (d < 55) { this.step = 'stop'; this.hot = true; this.say('MERIDIAN', 'That is it. Stop the hauler — ram it, EMP it, or hack it. Mind the escorts.'); h.ai.panic = t + 999; }
      } else {
        this.obj(`Stop the <em>Data Hauler</em> <u>(${Math.round(h.healthFrac * 100)}%)</u> — ram it, EMP it or hack it`, h.pos, blips);
        if (h.speed < 1.2) this.slowT = (this.slowT || 0) + dt; else this.slowT = 0;
        if (h.disabled > 0 || h.healthFrac < 0.5 || this.slowT > 3.5) {
          h.ai = null; emit('driverEjected', h, 'npc'); h.driver = null; h.disabled = 0;
          this.step = 'grab';
          this.say('MERIDIAN', 'Driver is running. The core is in the back — pull it.');
        }
      }
      return;
    }
    if (this.step === 'grab') {
      if (h.destroyed || h.sunk) return this.fail('The data core was destroyed with the hauler');
      const rx = h.pos.x - Math.sin(h.heading) * (h.T.len / 2 + 1), rz = h.pos.z - Math.cos(h.heading) * (h.T.len / 2 + 1);
      this.obj('Pull the <em>data core</em> from the back of the hauler', { x: rx, z: rz }, [{ x: rx, z: rz, type: 'objective' }]);
      const near = !pl.vehicle && Math.hypot(pp.x - rx, pp.z - rz) < 3.2;
      if (near) {
        this.M.interacting = true;
        G.hud.prompt('<kbd>E</kbd>Hold to pull the data core');
        if (Input.key('KeyE')) { this.grab += dt; G.hud.progress(this.grab / 2.2, 'EXTRACTING'); } else { this.grab = Math.max(0, this.grab - dt); G.hud.progress(this.grab > 0 ? this.grab / 2.2 : null); }
        if (this.grab >= 2.2) { G.hud.progress(null); emit('sfx', 'pickup'); this.step = 'return'; this.hot = false; this.dest = this.ring(POI.tower.x, POI.tower.z + 14, 7); this.say('MERIDIAN', 'Got it. Bring it home to the tower.'); }
      } else if (this.grab > 0) { this.grab = 0; G.hud.progress(null); }
      return;
    }
    if (this.step === 'return') {
      this.obj('Bring the data core to <em>Claude Tower</em>', this.dest);
      if (this.inRing(this.dest, pp) && pl.worldSpeed < 6) {
        this.say('MERIDIAN', 'Weights recovered. Nobody will ever thank you for this. Tokens are in your account.');
        this.pass(4000);
      }
    }
  }
}

// ------------------------------------------------------------------ bayou smuggling run
class BayouRun extends Job {
  start() {
    this.say('TILLER', 'Twelve crates of restricted GPUs, already strapped to the buggy. The port wants them gone.');
    this.say('TILLER', 'Main roads are all checkpoints tonight. Take the Smuggler Trail west to Heron Jetty, then the river up to Moonshine Hollow.');
    this.buggy = this.spawn('buggy', POI.port.x - 6, POI.port.z - 64, -Math.PI / 2, { paint: PAL.neonAmber });
    this.buggy.keep = true;
    this.cargoV = this.buggy;
    this.cargo = 100;
    this.step = 'board';
    this.clock = 0;
    this.checks = [{ x: 592, z: 790, e: 'Port Road' }, { x: -8, z: 690, e: 'Marsh Road' }, { x: 170, z: 1056, e: 'Glowwood Highway' }, { x: 788, z: 770, e: 'Shore Drive South' }];
    for (const c of this.checks) {
      const r = roadAt(c.x, c.z, 20);
      const dx = r ? r.e.pts[r.i + 1].x - r.e.pts[r.i].x : 1, dz = r ? r.e.pts[r.i + 1].z - r.e.pts[r.i].z : 0;
      const hd = Math.atan2(dx, dz) + Math.PI / 2;
      const l = Math.hypot(dx, dz) || 1;
      for (const s of [-3.4, 3.4]) {
        const v = this.spawn('police', c.x + (-dz / l) * s, c.z + (dx / l) * s, hd + (s > 0 ? 0 : Math.PI));
        v.sirenOn = true; v.lightsOn = true; v.keep = true; v.roadblock = true;
      }
      c.hit = false;
    }
    this.listen('vehicleImpact', (v, speed) => { if (v === this.cargoV && speed > 5) { this.cargo = Math.max(0, this.cargo - (speed - 5) * 1.5); } });
  }
  update(dt, t) {
    const pl = G.player, pp = pl.worldPos;
    const cv = this.cargoV;
    if (cv.destroyed || cv.sunk || cv.removed) return this.fail('The cargo went down with the vehicle');
    if (this.cargo <= 0) return this.fail('The GPUs were smashed to scrap');
    // checkpoints watch for the cargo vehicle
    for (const c of this.checks) {
      G.police.cones.push({ x: c.x, z: c.z, heading: 0, range: 55, fov: Math.PI, alert: true, drone: true });
      if (!c.hit && pl.vehicle === cv && Math.hypot(cv.pos.x - c.x, cv.pos.z - c.z) < 55) { c.hit = true; G.police.raise(3, 'Checkpoint breach'); G.hud.toast(`Checkpoint on ${c.e} spotted the cargo`, '#ff4d5e'); }
    }
    const tag = ` <u>(cargo ${Math.round(this.cargo)}%)</u>`;
    if (this.step !== 'board') this.clock += dt;
    if (pl.vehicle !== cv && this.step !== 'swap') { this.obj(`Get back to the <em>${cv.name}</em>${tag}`, cv.pos, [{ x: cv.pos.x, z: cv.pos.z, type: 'vehicle' }]); if (this.step === 'board' && pl.vehicle === cv) this.step = 'trail'; return; }
    if (this.step === 'board') { this.step = 'trail'; this.dest = this.ring(POI.jetty.x, POI.jetty.z - 4, 7); }
    if (this.step === 'trail') {
      this.obj(`Take the cargo to <em>Heron Jetty</em> — stay off the main roads${tag}`, this.dest);
      if (this.inRing(this.dest, cv.pos) && cv.speed < 5) {
        this.step = 'swap';
        this.dropRing(this.dest);
        const b = boatSpawns.find((q) => Math.hypot(q.x - POI.jetty.x, q.z - POI.jetty.z) < 80);
        let boat = G.vehicles.find((v) => v.cls === 'boat' && !v.isPolice && !v.destroyed && Math.hypot(v.pos.x - POI.jetty.x, v.pos.z - POI.jetty.z) < 90);
        if (!boat) boat = this.spawn('boat', b.x, b.z, b.heading);
        boat.keep = true; boat.mission = true;
        if (!this.vehicles.includes(boat)) this.vehicles.push(boat);
        this.boat = boat;
        this.say('TILLER', 'Good. Boat is tied up at the end of the jetty. Load her and run the river north-west.');
      }
      return;
    }
    if (this.step === 'swap') {
      this.obj(`Load the cargo onto the <em>speedboat</em>${tag}`, this.boat.pos, [{ x: this.boat.pos.x, z: this.boat.pos.z, type: 'vehicle' }]);
      if (pl.vehicle && pl.vehicle.cls === 'boat') {
        this.cargoV = pl.vehicle; this.cargoV.mission = true; this.cargoV.keep = true;
        if (!this.vehicles.includes(this.cargoV)) this.vehicles.push(this.cargoV);
        this.step = 'river';
        this.dest = this.ring(POI.camp.x + 48, POI.camp.z + 2, 9, PAL.neonAmber, WATER_Y);
        emit('sfx', 'pickup');
      }
      return;
    }
    if (this.step === 'river') {
      this.obj(`Run the river to <em>Moonshine Hollow</em>${tag}`, this.dest);
      if (this.inRing(this.dest, cv.pos) && cv.speed < 7) {
        const reward = Math.round(3500 * (0.5 + 0.5 * this.cargo / 100));
        this.say('TILLER', this.cargo > 80 ? 'Every crate still sealed. You are wasted on the city.' : 'Some of these are rattling. I am docking you for it.');
        this.pass(reward, `Cargo ${Math.round(this.cargo)}% · ${fmtTime(this.clock)}`);
      }
    }
  }
}

// ------------------------------------------------------------------ heat check
class HeatCheck extends Job {
  start() {
    this.say('MERIDIAN', 'Training exercise. I have just flagged you myself — three stars, live units.');
    this.say('MERIDIAN', 'Stay free for seventy-five seconds, then shake them. Do not make me come and sign for you.');
    G.police.raise(3, 'Live-fire exercise');
    this.left = 75; this.step = 'survive'; this.peak = 3;
  }
  update(dt) {
    const Pz = G.police;
    this.peak = Math.max(this.peak, Pz.stars);
    if (this.step === 'survive') {
      if (Pz.stars === 0) { Pz.raise(3, 'Too easy'); G.hud.toast('Too easy — flag restored'); }
      this.left -= dt;
      this.M.timerText = fmtTime(Math.max(0, this.left));
      this.obj('Stay out of custody', null);
      if (this.left <= 0) { this.step = 'lose'; this.M.timerText = ''; this.say('MERIDIAN', 'Time. Now disappear.'); }
    } else {
      this.obj('Lose the <em>Safety Flag</em>', null);
      if (Pz.stars === 0) this.pass(1800 + this.peak * 250, `Peak flag ${'★'.repeat(this.peak)}`);
    }
  }
}

// ------------------------------------------------------------------ races
// Rivals follow a dense racing line (points a few metres apart) with a speed-dependent look-ahead.
class RaceDriver {
  constructor(race, idx) { this.race = race; this.pi = 0; this.lap = 0; this.idx = idx; this.done = false; this.skill = 0.9 + idx * 0.035; this.lane = (idx % 2 ? 1 : -1) * 1.4; }
  get total() { return this.lap * this.race.path.length + this.pi; }
  control(v, dt) {
    const R = this.race, path = R.path, N = path.length;
    if (R.countdown > 0 || this.done) return stopVehicle(v);
    // advance our index to the closest point a little way ahead
    let best = this.pi, bd = Infinity;
    for (let k = 0; k < 14; k++) {
      const q = path[(this.pi + k) % N];
      const d = (q.x - v.pos.x) ** 2 + (q.z - v.pos.z) ** 2;
      if (d < bd) { bd = d; best = this.pi + k; }
    }
    if (best >= N) { best -= N; this.lap++; if (this.lap >= R.laps) { this.done = true; R.finished.push(this); return; } }
    this.pi = best;
    const look = Math.round(clamp(v.speed * 0.11, 2, 7));
    const a = path[(this.pi + look) % N], b = path[(this.pi + look + 1) % N];
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    // how sharply does the line bend further on? brake for it
    const c = path[(this.pi + look + 5) % N], e = path[(this.pi + look + 6) % N];
    const bend = Math.abs(Math.atan2((e.x - c.x) * dz - (e.z - c.z) * dx, (e.x - c.x) * dx + (e.z - c.z) * dz));
    const gap = this.total - R.playerTotal;
    const band = gap < -12 ? 1.12 : gap > 9 ? 0.82 : 1;
    const want = v.T.maxSpeed * this.skill * band * R.pace * (1 - clamp(bend * 0.75, 0, 0.6));
    driveToward(v, a.x + (-dz / l) * this.lane, a.z + (dx / l) * this.lane, want, dt, { avoid: bd > 100, noWater: true });
    v.inNitro = bend < 0.1 && Math.abs(v.inSteer) < 0.2 && gap < 0;
  }
}
class Race extends Job {
  constructor(M, def) { super(M); this.def = def; }
  start() {
    const D = this.def, pl = G.player;
    this.cps = D.points.map(([x, z]) => ({ x, z, y: groundHeight(x, z, 99) }));
    // racing line: straight runs between the checkpoints, or the trail itself for the rally
    const ctrl = (D.line || D.points).map(([x, z]) => ({ x, z }));
    this.path = D.smooth ? catmullRom(ctrl, 6, true) : (() => {
      const out = [];
      for (let i = 0; i < ctrl.length; i++) {
        const a = ctrl[i], b = ctrl[(i + 1) % ctrl.length];
        const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 7);
        for (let k = 0; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n });
      }
      return out;
    })();
    this.laps = D.laps; this.pace = D.pace;
    this.cp = 0; this.lap = 0; this.pidx = 0; this.finished = []; this.clock = 0; this.countdown = 4.2; this.lastBeep = 5;
    G.police.suppressed = true;
    const heading = Math.atan2(this.cps[0].x - D.start[0], this.cps[0].z - D.start[1]);
    const s = Math.sin(heading), c = Math.cos(heading);
    const slot = (row, side) => ({ x: D.start[0] - s * row * 8 + -c * side * D.gridW, z: D.start[1] - c * row * 8 + s * side * D.gridW });
    // the player races what they brought, if it suits; otherwise we lend one
    let mine = pl.vehicle;
    if (!mine || !D.allow.includes(mine.typeId)) { if (pl.vehicle) pl.leaveVehicle(true); mine = this.spawn(D.loan, 0, 0, heading); pl.vehicle = mine; mine.driver = 'player'; mine.stolen = true; pl.state = 'foot'; pl.seat(); }
    const q = slot(2, 1);
    mine.pos.set(q.x, 0, q.z); mine.heading = heading; mine.vel.set(0, 0, 0); mine.angVel = 0; mine.snapToGround(); mine.repair(); mine.nitro = 1;
    this.mine = mine;
    // start the racing line at the point nearest the grid
    let si = 0, sd = Infinity;
    this.path.forEach((p, i) => { const d = (p.x - D.start[0]) ** 2 + (p.z - D.start[1]) ** 2; if (d < sd) { sd = d; si = i; } });
    this.path = this.path.slice(si).concat(this.path.slice(0, si));
    this.rivals = D.rivals.map((type, i) => {
      const g = slot(i < 2 ? 0 : 1, i % 2 === 0 ? -1 : 1);
      const v = this.spawn(type, g.x, g.z, heading);
      v.driver = 'racer'; v.keep = true; v.npc = pick(PED_LOOKS);
      v.ai = new RaceDriver(this, i);
      return v;
    });
    this.ringMesh = this.ring(this.cps[0].x, this.cps[0].z, 13, PAL.neonMagenta);
    this.nextMesh = this.ring(this.cps[1].x, this.cps[1].z, 13, 0x7a3a70);
    G.cam.yaw = heading; G.cam.idle = 2;
    this.say('MARSHAL', D.intro);
  }
  // the player's place on the racing line (only ever moves forward within a window)
  get playerTotal() { return this.lapLine * this.path.length + this.pidx; }
  update(dt, t) {
    const pl = G.player, v = this.mine;
    if (v.destroyed || v.sunk) return this.fail('Your ride is wrecked');
    if (pl.vehicle !== v) { this.outT = (this.outT || 0) + dt; this.obj('Get back in your <em>vehicle</em>', v.pos); if (this.outT > 12) return this.fail('You left the race'); return; }
    this.outT = 0;
    if (this.countdown > 0) {
      this.countdown -= dt;
      v.disabled = Math.max(v.disabled, 0.1);
      const n = Math.ceil(this.countdown - 0.2);
      if (n !== this.lastBeep && n <= 3) { this.lastBeep = n; if (n > 0) { G.hud.banner(String(n), '', 'cool', 0.8); emit('sfx', 'countdown'); } else { G.hud.banner('GO', '', '', 0.9); emit('sfx', 'go'); v.disabled = 0; } }
      this.obj(`<em>${this.def.title}</em> — ${this.laps} laps`, null);
      this.lapLine = 0;
      return;
    }
    this.clock += dt;
    // progress along the line
    const N = this.path.length;
    let best = this.pidx, bd = Infinity;
    for (let k = 0; k < 20; k++) { const q = this.path[(this.pidx + k) % N]; const d = (q.x - v.pos.x) ** 2 + (q.z - v.pos.z) ** 2; if (d < bd) { bd = d; best = this.pidx + k; } }
    if (best >= N) { best -= N; this.lapLine++; }
    this.pidx = best;
    const c = this.cps[this.cp];
    if (Math.hypot(c.x - v.pos.x, c.z - v.pos.z) < 15) {
      emit('sfx', 'checkpoint');
      this.cp++;
      if (this.cp >= this.cps.length) { this.cp = 0; this.lap++; if (this.lap < this.laps) G.hud.toast(this.lap === this.laps - 1 ? 'Final lap' : `Lap ${this.lap + 1} of ${this.laps}`); }
      if (this.lap >= this.laps) {
        const place = this.finished.length + 1;
        const prize = [this.def.prize, Math.round(this.def.prize * 0.45), Math.round(this.def.prize * 0.2), 100][Math.min(3, place - 1)];
        const best2 = G.save.best[this.def.id];
        const record = !best2 || this.clock < best2;
        if (record) G.save.best[this.def.id] = Math.round(this.clock * 100) / 100;
        this.say('MARSHAL', place === 1 ? 'First across the line. The Coast has a new name to beat.' : `P${place}. The tokens are smaller back there.`);
        return this.pass(prize, `${['1st', '2nd', '3rd', '4th'][Math.min(3, place - 1)]} place · ${fmtTime(this.clock)}${record ? ' · new best' : ''}`);
      }
      const a = this.cps[this.cp], b = this.cps[(this.cp + 1) % this.cps.length];
      this.dropRing(this.ringMesh); this.dropRing(this.nextMesh);
      this.ringMesh = this.ring(a.x, a.z, 13, PAL.neonMagenta);
      this.nextMesh = this.lap === this.laps - 1 && this.cp === this.cps.length - 1 ? null : this.ring(b.x, b.z, 13, 0x7a3a70);
    }
    let ahead = 0;
    const mineP = this.playerTotal;
    this.rivals.forEach((r) => { if (r.ai.done || r.ai.total > mineP) ahead++; });
    this.M.timerText = fmtTime(this.clock);
    this.obj(`Position <em>${ahead + 1}/${this.rivals.length + 1}</em> · Lap <em>${Math.min(this.lap + 1, this.laps)}/${this.laps}</em>`, this.cps[this.cp]);
  }
  cleanup() { super.cleanup(); G.police.suppressed = false; this.M.timerText = ''; }
}

const RACES = {
  neon: {
    id: 'neon', title: 'Neon Sprint', laps: 2, pace: 0.86, prize: 1600, loan: 'sport', gridW: 2.6,
    allow: ['sport', 'sedan', 'compact', 'prototype', 'police', 'truck'], rivals: ['sport', 'sport', 'sport'],
    start: [150, 5.5], points: [[440, 5.5], [794, 8], [794, 294], [440, 303.5], [108, 296], [105, 10]],
    intro: 'Two laps: Sonnet Boulevard to the shore, down Shoreline, back on Eighth and up Constitution. Traffic is your problem.',
  },
  rally: {
    id: 'rally', title: 'Glowwood Rally', laps: 2, pace: 0.8, prize: 1900, loan: 'buggy', gridW: 1.8,
    allow: ['buggy', 'truck', 'policeOffroad'], rivals: ['buggy', 'truck', 'buggy'],
    start: [-262, -724], points: [[-232, -838], [-338, -928], [-498, -950], [-608, -860], [-600, -742], [-482, -672], [-352, -680], [-264, -716]],
    smooth: true, line: [[-260, -720], [-230, -840], [-340, -930], [-500, -950], [-610, -860], [-600, -740], [-480, -670], [-350, -680]],
    intro: 'Two laps of the old logging loop. No lights out here but the trees — do not hit one.',
  },
};

// ------------------------------------------------------------------ manager
const JOBS = [
  { id: 'intro', title: 'Off the Books', where: 'Context Window Lofts', cls: Intro, reward: 500, at: () => ({ x: POI.safehouse.x + 14, z: POI.safehouse.z + 1 }), type: 'mission', foot: false },
  { id: 'prototype', title: 'Grand Theft Prototype', where: 'Claude Tower', cls: Prototype, reward: 4000, req: 'intro', at: () => ({ x: POI.tower.x - 12, z: POI.tower.z + 4 }), type: 'mission' },
  { id: 'heist', title: 'Badge Swap', where: 'Claude Tower', cls: Heist, reward: 4000, req: 'intro', at: () => ({ x: POI.tower.x + 12, z: POI.tower.z + 4 }), type: 'mission' },
  { id: 'bayou', title: 'Bayou Run', where: 'Port of Sonnet', cls: BayouRun, reward: 3500, req: 'intro', at: () => ({ x: POI.port.x, z: POI.port.z - 52 }), type: 'mission' },
  { id: 'heat', title: 'Heat Check', where: 'Token Row', cls: HeatCheck, reward: 2500, req: 'intro', at: () => ({ x: 470, z: 16 }), type: 'activity' },
  { id: 'neon', title: 'Neon Sprint (street race)', where: 'Sonnet Boulevard', cls: Race, def: RACES.neon, reward: 1600, req: 'intro', at: () => ({ x: 134, z: 15.5 }), type: 'race', cleanOnly: true },
  { id: 'rally', title: 'Glowwood Rally (dirt race)', where: 'Glowwood Lookout', cls: Race, def: RACES.rally, reward: 1900, req: 'intro', at: () => ({ x: -252, z: -708 }), type: 'race', cleanOnly: true },
];
const CONTRACT_TYPES = ['sport', 'sedan', 'compact', 'truck', 'hoverbike', 'van', 'buggy'];

export class Missions {
  constructor(scene) {
    this.scene = scene;
    this.active = null; this.activeDef = null;
    this.markers = [];
    this.timerText = '';
    this.objectiveDest = null; this.objectiveBlips = null; this.waypoint = null;
    this.interacting = false;
    this.ringGeo = new THREE.TorusGeometry(1, 0.06, 6, 40);
    this.ringGeo.rotateX(Math.PI / 2);
    this.beamGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
    this.beamGeo.translate(0, 0.5, 0);
    this.weights = [];
    this.buildMarkers();
    this.buildWeights();
    on('playerDied', () => { if (this.active) this.finish(false, 0, 'You flatlined'); });
    on('playerBusted', () => { if (this.active) this.finish(false, 0, 'You were contained'); });
    on('waypoint', (w) => { this.waypoint = w; this.refreshRoute(); G.hud.toast(w ? 'Waypoint set' : 'Waypoint cleared'); });
    this.blipT = 0;
  }
  done(id) { return (G.save.missions[id] || 0) > 0; }
  jobById(id) { return JOBS.find((j) => j.id === id); }
  resetWeights() { for (const w of this.weights) { w.got = G.save.weights.includes(w.id); w.mesh.visible = !w.got; } }
  get weightTotal() { return this.weights.length; }
  catalog() {
    return JOBS.map((j) => ({ title: j.title, where: j.where, reward: j.reward, done: this.done(j.id), times: G.save.missions[j.id] || 0, locked: !!j.req && !this.done(j.req) }));
  }

  // ---- markers -------------------------------------------------------------------
  makeRing(x, z, r, color, y = null) {
    const g = new THREE.Group();
    const c = new THREE.Color(color);
    const ring = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(2), toneMapped: false }));
    ring.scale.set(r, 1, r);
    const beam = new THREE.Mesh(this.beamGeo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    beam.scale.set(r, 9, r);
    g.add(ring, beam);
    const gy = y ?? Math.max(groundHeight(x, z, 99), WATER_Y);
    g.position.set(x, gy + 0.12, z);
    this.scene.add(g);
    return { mesh: g, ring, beam, x, z, y: gy, r };
  }
  addMarker(m) {
    m.vis = this.makeRing(m.x, m.z, m.r, m.color);
    m.y = m.vis.y;
    this.markers.push(m);
    return m;
  }
  buildMarkers() {
    const M = G.menus;
    this.addMarker({ id: 'safehouse', x: POI.safehouse.x, z: POI.safehouse.z, r: 2.2, color: 0x7dffb0, label: 'Enter the safehouse', blip: 'safehouse', name: 'Safehouse', foot: true, use: () => G.game.openMenu('wardrobe') });
    this.addMarker({ id: 'supply', x: POI.supply.x, z: POI.supply.z, r: 2.2, color: PAL.neonCyan, label: 'Browse Prompt Supply Co.', blip: 'shop', name: 'Prompt Supply Co.', foot: true, use: () => G.game.openMenu('shop') });
    this.addMarker({ id: 'retune', x: POI.retune.x, z: POI.retune.z + 12, r: 5, color: PAL.neonAmber, label: 'Use the Re-Tune garage', blip: 'retune', name: 'Re-Tune Garage', car: true, use: () => G.game.openMenu('retune') });
    this.addMarker({ id: 'retune2', x: POI.portRetune.x, z: POI.portRetune.z, r: 5, color: PAL.neonAmber, label: 'Use the Re-Tune garage', blip: 'retune', name: 'Re-Tune Garage', car: true, use: () => G.game.openMenu('retune') });
    this.addMarker({ id: 'chop', x: POI.gator.x + 2, z: POI.gator.z - 8, r: 6, color: PAL.neonLime, label: '', blip: 'garage', name: 'Gator Garage', show: () => !!G.save.chopUnlocked, chop: true, use: () => this.chopUse() });
    for (const j of JOBS) {
      const p = j.at();
      this.addMarker({ id: 'job:' + j.id, job: j, x: p.x, z: p.z, r: j.type === 'race' ? 5 : 2.4, color: j.type === 'race' ? PAL.neonMagenta : j.type === 'activity' ? 0xc77dff : PAL.neonAmber,
        label: `Start: ${j.title}`, blip: j.type, name: j.title, show: () => !this.active && (!j.req || this.done(j.req)) && (j.id !== 'intro' || !this.done('intro')), use: () => this.begin(j) });
    }
    void M;
  }
  buildWeights() {
    const rng = new RNG(808);
    const pts = [[PIER.x1 - 4, 20], [905, 1136], [128, -1264], [-270, -700], [POI.camp.x - 20, POI.camp.z - 4], [POI.jetty.x - 16, POI.jetty.z - 12], [690, -710], [-1010, 548]];
    let guard = 0;
    while (pts.length < 24 && guard++ < 4000) {
      const x = rng.float(-1380, 1000), z = rng.float(-1380, 1330);
      if (x > RECT.city.x0 - 40 && x < RECT.city.x1 + 20 && z > RECT.city.z0 - 40 && z < RECT.city.z1 + 40) continue;
      const h = terrainHeight(x, z);
      if (h < 0.9 || landDist(x, z) < 12) continue;
      if (roadAt(x, z, 40)) continue;
      if (pts.some(([a, b]) => Math.hypot(a - x, b - z) < 210)) continue;
      pts.push([x, z]);
    }
    const geo = new THREE.OctahedronGeometry(0.55, 0);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonCyan).multiplyScalar(2.4), toneMapped: false });
    const halo = new THREE.MeshBasicMaterial({ color: PAL.neonCyan, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    pts.forEach(([x, z], i) => {
      const got = G.save.weights.includes(i);
      const y = Math.max(groundHeight(x, z, 99), WATER_Y) + 1.3;
      const g = new THREE.Group();
      g.add(new THREE.Mesh(geo, mat));
      const b = new THREE.Mesh(this.beamGeo, halo); b.scale.set(0.5, 16, 0.5); b.position.y = -1.1; g.add(b);
      g.position.set(x, y, z);
      g.visible = !got;
      this.scene.add(g);
      this.weights.push({ id: i, x, y, z, mesh: g, got });
    });
  }

  // ---- chop shop contracts ------------------------------------------------------------
  chopUse() {
    const v = G.player.vehicle;
    const want = G.save.contract;
    if (v && want && v.typeId === want && !v.mission) {
      if (G.police.stars > 0) return G.hud.toast('Gator will not open up while you are flagged');
      const pay = Math.round(v.T.value * (0.4 + 0.6 * v.healthFrac) * 2.2 / 10) * 10;
      G.player.leaveVehicle(true);
      G.player.pos.set(POI.gator.x - 6, groundHeight(POI.gator.x - 6, POI.gator.z + 2, 99), POI.gator.z + 2);
      v.dispose();
      addTokens(pay, 'chop shop');
      G.save.stats.contracts++;
      G.save.contract = null;
      emit('sfx', 'token');
      G.hud.say('GATOR', pick(['Pleasure doing business.', 'That will part out nicely.', 'You bring them, I un-make them.']));
    }
    if (!G.save.contract) {
      G.save.contract = pick(CONTRACT_TYPES.filter((x) => x !== want));
      G.hud.say('GATOR', `Got a buyer for a ${VEHICLES[G.save.contract].name}. Bring me one in good shape.`);
    } else if (!v || v.typeId !== G.save.contract) G.hud.say('GATOR', `Still waiting on that ${VEHICLES[G.save.contract].name}, cher.`);
    writeSave();
  }

  // ---- job lifecycle ----------------------------------------------------------------
  begin(j) {
    if (this.active) return;
    if (j.cleanOnly && G.police.stars > 0) return G.hud.toast('Lose the Safety Flag first');
    this.activeDef = j;
    this.active = new j.cls(this, j.def);
    this.timerText = '';
    G.hud.clearSpeech();
    G.hud.banner(j.title, j.where, 'cool', 2.6);
    emit('sfx', 'missionStart');
    this.active.start();
    this.refreshBlips();
  }
  finish(pass, reward, sub) {
    const j = this.activeDef, a = this.active;
    if (!a) return;
    this.active = null; this.activeDef = null;
    a.cleanup();
    this.setObjective('', null, null);
    this.timerText = '';
    G.hud.progress(null);
    if (pass) {
      G.save.missions[j.id] = (G.save.missions[j.id] || 0) + 1;
      G.save.started = true;
      addTokens(reward, 'job');
      G.hud.banner('JOB DONE', `${j.title} · +${formatTokens(reward)} ◈${sub ? ' · ' + sub : ''}`, '', 5);
      emit('sfx', 'missionPass');
      writeSave();
    } else {
      G.hud.banner('JOB FAILED', sub || '', 'bad', 4.5);
      emit('sfx', 'missionFail');
    }
    emit('jobEnded', j.id, pass);
    this.refreshBlips();
  }
  setObjective(text, dest, blips) {
    G.hud.objective(text);
    const d = dest ? { x: dest.x, z: dest.z } : null;
    const moved = (!d) !== (!this.objectiveDest) || (d && Math.hypot(d.x - this.objectiveDest.x, d.z - this.objectiveDest.z) > 12);
    this.objectiveBlips = blips;
    if (moved) { this.objectiveDest = d; this.refreshRoute(); }
    else if (d) { this.objectiveDest.x = d.x; this.objectiveDest.z = d.z; }
  }
  refreshRoute() {
    const target = this.waypoint || this.objectiveDest;
    G.hud.map.setDestination(target);
    this.refreshBlips();
  }
  refreshBlips() {
    const b = [];
    for (const m of this.markers) if (!m.show || m.show()) if (!this.active || !m.job) b.push({ x: m.x, z: m.z, type: m.blip, name: m.name });
    b.push({ x: POI.clinic.x, z: POI.clinic.z, type: 'clinic', name: 'Clinic' }, { x: POI.police.x, z: POI.police.z, type: 'police', name: 'Safety Center', glyph: 'P' });
    if (this.objectiveBlips) for (const q of this.objectiveBlips) b.push({ ...q, big: true });
    else if (this.objectiveDest) b.push({ x: this.objectiveDest.x, z: this.objectiveDest.z, type: 'objective', big: true, name: 'Objective' });
    if (this.waypoint) b.push({ x: this.waypoint.x, z: this.waypoint.z, type: 'waypoint', name: 'Waypoint' });
    const pp = G.player.worldPos;
    for (const w of this.weights) if (!w.got && Math.hypot(w.x - pp.x, w.z - pp.z) < 150) b.push({ x: w.x, z: w.z, type: 'collect', local: true });
    G.hud.blips = b;
  }

  update(dt, t) {
    const pl = G.player, pp = pl.worldPos;
    this.interacting = false;
    // markers: pulse, show, prompt
    let hot = null;
    for (const m of this.markers) {
      const vis = (!m.show || m.show()) && !(this.active && m.job);
      m.vis.mesh.visible = vis && Math.hypot(m.x - pp.x, m.z - pp.z) < 260;
      if (!m.vis.mesh.visible) continue;
      const pulse = 1 + Math.sin(t * 3 + m.x) * 0.06;
      m.vis.ring.scale.set(m.r * pulse, 1, m.r * pulse);
      m.vis.beam.material.opacity = 0.12 + 0.06 * Math.sin(t * 2 + m.z);
      if (Math.hypot(m.x - pp.x, m.z - pp.z) < m.r + (pl.vehicle ? 1.5 : 0.4) && Math.abs(pp.y - m.y) < 5 && pl.alive) {
        if (m.foot && pl.vehicle) { G.hud.prompt('Get out of the vehicle to go in'); continue; }
        if (m.car && !pl.vehicle) { G.hud.prompt('Bring a vehicle here'); continue; }
        if (pl.vehicle && pl.vehicle.speed > 6) continue;
        hot = m;
      }
    }
    if (hot) {
      let label = hot.label;
      if (hot.chop) {
        const want = G.save.contract, v = pl.vehicle;
        label = v && want && v.typeId === want ? `Sell the ${v.name} to Gator` : want ? `Contract: ${VEHICLES[want].name}` : 'Ask Gator for a contract';
      }
      this.interacting = true;
      G.hud.prompt(`<kbd>E</kbd>${label}`);
      if (Input.hit('KeyE')) { emit('sfx', 'uiSelect'); hot.use(); }
    }
    if (this.active) this.active.update(dt, t);
    G.interact.active = this.interacting;
    this.setTimer();

    // waypoint reached
    if (this.waypoint && Math.hypot(this.waypoint.x - pp.x, this.waypoint.z - pp.z) < 22) { this.waypoint = null; this.refreshRoute(); }

    // Lost Weights
    for (const w of this.weights) {
      if (w.got) continue;
      const d = Math.hypot(w.x - pp.x, w.z - pp.z);
      if (d > 220) { w.mesh.visible = false; continue; }
      w.mesh.visible = true;
      w.mesh.children[0].rotation.y = t * 1.6; w.mesh.children[0].position.y = Math.sin(t * 2 + w.id) * 0.2;
      if (d < 3 && Math.abs(pp.y - w.y) < 5) {
        w.got = true; w.mesh.visible = false;
        G.save.weights.push(w.id);
        const all = G.save.weights.length === this.weights.length;
        addTokens(all ? 5250 : 250, 'Lost Weight');
        G.hud.toast(`Lost Weight recovered — ${G.save.weights.length}/${this.weights.length}`, '#5ff3ff');
        if (all) G.hud.banner('ALL WEIGHTS RECOVERED', 'MERIDIAN owes you one', 'cool', 5);
        emit('sfx', 'collectible');
        G.fx.zap(w.x, w.y, w.z, 24, 0.8);
        writeSave();
      }
    }
    this.blipT -= dt;
    if (this.blipT <= 0) { this.blipT = 0.5; this.refreshBlips(); }
  }
  setTimer() {
    const el = G.hud.el;
    G.hud.set('mt', this.activeDef ? this.activeDef.title : '', (v) => { el.mtitle.textContent = v; });
    G.hud.set('mtimer', this.timerText, (v) => { el.mtimer.textContent = v; });
  }
}
