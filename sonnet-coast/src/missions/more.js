// The second set of jobs: a tail, a drone hunt, a takedown, a boat chase, timed deliveries,
// a hover-bike time trial and the finale heist.
import { G, emit } from '../state.js';
import { Input } from '../input.js';
import { Job, fmtTime, spawnOnRoute, spawnGoonCar, driveToward, stopVehicle } from './job.js';
import { POI, CITY, WATER_Y } from '../world/layout.js';
import { groundHeight, nodes } from '../world/roads.js';
import { coastEastX, coastSouthZ } from '../world/terrain.js';
import { PIER } from '../world/landmarks.js';
import { addTokens } from '../save.js';
import { clamp, formatTokens } from '../util/math.js';
import { rand, pick } from '../util/rng.js';
import { PAL } from '../world/palette.js';

export const STASH = { x: 450, z: 366 };   // the south aisle of the Docklands car park
const HAULER = { x: STASH.x + 12, z: STASH.z }, TAG = { x: STASH.x - 1, z: STASH.z + 11 };
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const blipFor = (v, type = 'vehicle') => [{ x: v.pos.x, z: v.pos.z, type, big: true }];

// Hold E beside something for `need` seconds. Returns true when done.
function holdE(job, near, need, prompt, label) {
  if (!near) { if (job.holdT > 0) { job.holdT = 0; G.hud.progress(null); } return false; }
  job.M.interacting = true;
  G.hud.prompt(`<kbd>E</kbd>${prompt}`);
  if (Input.key('KeyE')) job.holdT = (job.holdT || 0) + G.dt; else job.holdT = Math.max(0, (job.holdT || 0) - G.dt);
  G.hud.progress(job.holdT > 0 ? job.holdT / need : null, label);
  if (job.holdT >= need) { job.holdT = 0; G.hud.progress(null); emit('sfx', 'pickup'); return true; }
  return false;
}

// ------------------------------------------------------------------ Tail Lights
export class TailLights extends Job {
  start() {
    this.say('MERIDIAN', 'Every evening a Vantablack courier leaves the labs with a locked case. Nobody knows where it goes.');
    this.say('MERIDIAN', 'Follow the car. Stay back — if the driver makes you, the trail goes cold.');
    this.step = 'car'; this.susp = 0; this.lostT = 0;
    const h = this.spawn('van', HAULER.x, HAULER.z, Math.PI / 2, { paint: 0x2a2c30, locked: true });
    h.keep = true;
    this.listen('vehicleImpact', (v, speed, x, z, other) => { if (this.car && ((v === this.car && other === G.player.vehicle) || (other === this.car && v === G.player.vehicle)) && speed > 2) this.bumped = true; });
  }
  update(dt) {
    const pl = G.player, pp = pl.worldPos;
    if (this.step === 'car') {
      this.obj('Get in a <em>vehicle</em>', null);
      if (pl.vehicle && pl.vehicle.cls !== 'boat') {
        this.car = spawnOnRoute(this, 'sedan', POI.vanta.x, POI.vanta.z + 80, STASH.x, STASH.z, { paint: 0x15161a });
        this.car.outlaw = true; this.car.ai.pace = 0.95;
        this.step = 'tail';
        this.say('MERIDIAN', 'There: the black Opus Cruiser pulling out. Give it room.');
      }
      return;
    }
    const c = this.car;
    if (c.destroyed || c.sunk || c.removed) return this.fail('The courier car was wrecked');
    const d = dist(pp, c.pos);
    if (this.step === 'tail' || this.step === 'park') {
      let rate = d < 16 ? 0.5 : d < 30 ? 0.16 : -0.07;
      if (G.police.stars > 0 && d < 90) rate = Math.max(rate, 0.3);   // sirens draw the eye
      this.susp = clamp(this.susp + rate * dt, 0, 1);
      this.lostT = d > 170 ? this.lostT + dt : 0;
      G.hud.progress(this.susp, d > 170 ? 'LOSING THEM' : this.susp > 0.6 ? 'BACK OFF' : 'SUSPICION');
      if (this.susp >= 1) return this.fail('The courier spotted the tail');
      if (this.lostT > 9) return this.fail('You lost the courier');
      if (this.bumped) return this.fail('You spooked the courier');
    }
    if (this.step === 'tail') {
      this.obj(`Tail the <em>courier</em> without being noticed <u>(${Math.round(d)} m)</u>`, c.pos, blipFor(c));
      if (dist(c.pos, STASH) < 75) {
        this.step = 'park';
        const job = this;
        // in from the street at the end of the aisle, never through the rows of parked cars
        const side = c.pos.x > STASH.x ? 1 : -1;
        const wps = [{ x: STASH.x + side * 47, z: STASH.z }, { x: STASH.x - 10, z: STASH.z }];
        c.ai = { i: 0, control(v, dt2) {
          const w = wps[this.i], last = this.i === wps.length - 1;
          const dd = driveToward(v, w.x, w.z, last ? 7 : 11, dt2, { arrive: last, avoid: true });
          if (!last && dd < 9) this.i++;
          else if (last && dd < 5) { stopVehicle(v); if (v.speed < 0.6) job.parked = true; }
        } };
      }
    } else if (this.step === 'park') {
      this.obj('Hang back and watch where it stops', c.pos, blipFor(c));
      this.parkT = (this.parkT || 0) + dt;
      if (this.parked || this.parkT > 40) {
        c.ai = null; c.driver = null;
        G.hud.progress(null);
        this.step = 'scan';
        this.dest = this.ring(TAG.x, TAG.z, 5, PAL.neonCyan);
        this.say('MERIDIAN', 'That is the stash: an unmarked hauler in the Docklands car park. Roll up and tag it.');
      }
    } else if (this.step === 'scan') {
      this.obj('Tag the <em>stash</em>: stop in the marker', this.dest);
      if (this.inRing(this.dest, pp, 1) && pl.worldSpeed < 3) {
        this.say('MERIDIAN', 'Tagged. We hit it when the crew is ready.');
        this.pass(2200);
      }
    }
  }
}

// ------------------------------------------------------------------ Signal Loss
export class SignalLoss extends Job {
  start() {
    this.say('MERIDIAN', 'Vantablack has four survey drones mapping the district. They are not police; nobody will miss them.');
    this.say('MERIDIAN', 'Bring them down. The Prompt Injector does it quietly. A pistol does it loudly.');
    const gy = CITY.y;
    this.drones = [[POI.park.x, POI.park.z, gy + 15, 14], [250, -150, gy + 20, 12], [-150, 50, gy + 20, 12], [550, 350, gy + 19, 47]]
      .map(([x, z, y, r]) => G.police.spawnTargetDrone(x, z, y, r));
    this.left = 250;
    G.weapons.select(4);
    G.hud.toast(Input.touch.on ? 'Prompt Injector selected — put the crosshair on a drone and press the action button' : 'Prompt Injector selected — aim at a drone and click');
  }
  update(dt) {
    const pp = G.player.worldPos;
    this.left -= dt;
    this.M.timerText = fmtTime(Math.max(0, this.left));
    const alive = this.drones.filter((d) => d.state === 'target');
    if (!alive.length) return this.pass(2400, `Cleared with ${fmtTime(this.left)} to spare`);
    if (this.left <= 0) return this.fail('The drones finished their survey');
    alive.sort((a, b) => dist(a.pos, pp) - dist(b.pos, pp));
    this.obj(`Bring down the <em>survey drones</em> <u>(${this.drones.length - alive.length}/${this.drones.length})</u>`, alive[0].anchor, alive.map((d) => ({ x: d.pos.x, z: d.pos.z, type: 'objective' })));
  }
  cleanup() { super.cleanup(); for (const d of this.drones) if (d.state === 'target') G.police.removeDrone(d); this.M.timerText = ''; }
}

// ------------------------------------------------------------------ Hot Pursuit
export class HotPursuit extends Job {
  start() {
    this.say('MERIDIAN', 'A contractor just walked out of Compute Ridge with a model checkpoint and a Haiku GT.');
    this.say('MERIDIAN', 'Run the car down before it leaves the city. Wreck it, EMP it, hack it. I only need the drive.');
    this.step = 'car'; this.left = 210; this.slowT = 0;
  }
  update(dt) {
    const pl = G.player, pp = pl.worldPos;
    if (this.step === 'car') {
      this.obj('Get in a <em>vehicle</em>', null);
      if (pl.vehicle && pl.vehicle.cls !== 'boat') {
        const far = pp.x < 150 ? { x: 700, z: 500 } : { x: -400, z: -400 };
        const a = rand(0, 6.283);
        const c = spawnOnRoute(this, 'sport', pp.x + Math.cos(a) * 150, pp.z + Math.sin(a) * 150, far.x, far.z, { paint: 0xf2f3f4 });
        c.outlaw = true; c.ai.panic = Infinity; c.ai.pace = 1.12;
        c.maxHealth = c.health = 150;
        this.car = c; this.step = 'chase';
        this.say('MERIDIAN', 'White Haiku GT, marked on your map. Go.');
      }
      return;
    }
    const c = this.car;
    if (this.step === 'chase') {
      if (c.destroyed || c.sunk || c.removed) return this.fail('The drive burned with the car');
      this.left -= dt;
      this.M.timerText = fmtTime(Math.max(0, this.left));
      const d = dist(pp, c.pos);
      if (this.left <= 0 || d > 480) return this.fail('The runner got away');
      this.slowT = c.speed < 1.5 && d < 30 ? this.slowT + dt : 0;
      this.obj(`Stop the <em>runner</em> <u>(hull ${Math.round(c.healthFrac * 100)}%)</u>`, c.pos, blipFor(c));
      if (c.disabled > 0.5 || c.healthFrac < 0.45 || this.slowT > 4 || !c.ai || pl.vehicle === c) {
        if (c.driver === 'npc') emit('driverEjected', c, 'npc');
        c.ai = null; c.driver = null;
        this.step = 'grab'; this.M.timerText = '';
        this.say('MERIDIAN', 'Driver is out and running. Get the drive from the car.');
      }
      return;
    }
    if (c.destroyed || c.sunk) return this.fail('The drive burned with the car');
    this.obj('Take the <em>drive</em> from the car', c.pos, blipFor(c, 'objective'));
    if (pl.vehicle === c || holdE(this, !pl.vehicle && pl.nearestVehicle(2.6) === c, 1.8, 'Hold to take the drive', 'SEARCHING')) {
      this.say('MERIDIAN', 'Got it. That checkpoint never left the building, as far as anyone knows.');
      this.pass(2600, `${fmtTime(210 - this.left)}`);
    }
  }
  cleanup() { super.cleanup(); this.M.timerText = ''; }
}

// ------------------------------------------------------------------ Wake Up Call
export class WakeUpCall extends Job {
  start() {
    this.say('TILLER', 'Somebody is running product off the pier in a fast boat. My product.');
    this.say('TILLER', 'Catch them before they reach open water west of the port. Shoot the hull, hack it or EMP it, then bring back what they took.');
    const pl = G.player;
    if (pl.vehicle && pl.vehicle.cls === 'boat') this.mine = pl.vehicle;
    else {
      this.mine = G.vehicles.find((v) => v.cls === 'boat' && !v.isPolice && !v.destroyed && dist(v.pos, { x: PIER.x1 - 60, z: 16 }) < 60) || this.spawn('boat', PIER.x1 - 60, 16, Math.PI / 2);
      this.mine.keep = true;
    }
    this.step = 'board';
    // the runner's course: down the east coast, round the point, west along the south shore
    this.wp = [];
    for (const z of [160, 320, 480, 640, 800, 960, 1090]) this.wp.push({ x: coastEastX(z) + 80, z });
    this.wp.push({ x: coastEastX(1150) + 110, z: 1230 }, { x: 960, z: coastSouthZ(960) + 110 });
    for (const x of [760, 560, 320, 80, -180, -440, -700]) this.wp.push({ x, z: coastSouthZ(x) + 95 });
  }
  update(dt) {
    const pl = G.player, pp = pl.worldPos;
    if (this.step === 'board') {
      const m = this.mine;
      if (m.destroyed || m.removed) return this.fail('Your boat is gone');
      this.obj('Get in the <em>speedboat</em> at the end of the pier', m.pos, blipFor(m));
      if (pl.vehicle && pl.vehicle.cls === 'boat') {
        const r = this.spawn('boat', PIER.x1 + 90, 70, 0, { paint: 0x1b1b1f });
        r.driver = 'goon'; r.keep = true; r.outlaw = true;
        const job = this;
        r.ai = { i: 0, control(v, dt2) {
          const w = job.wp[this.i];
          const gap = dist(G.player.worldPos, v.pos);
          const pace = gap > 190 ? 0.6 : gap < 45 ? 0.9 : 0.78;   // let a straggler catch up, pull away when crowded
          if (driveToward(v, w.x, w.z, v.T.maxSpeed * pace, dt2, { avoid: true, water: true }) < 34) { if (this.i < job.wp.length - 1) this.i++; else job.escaped = true; }
        } };
        this.runner = r; this.step = 'chase';
        this.say('TILLER', 'That is them, heading south. Do not lose that boat.');
      }
      return;
    }
    const r = this.runner;
    if (this.step === 'chase') {
      if (r.destroyed || r.sunk) { this.say('TILLER', 'I said stop them, not sink my cargo. Half pay.'); return this.pass(1400, 'Cargo lost with the boat'); }
      if (this.escaped || dist(pp, r.pos) > 520) return this.fail('The runner reached open water');
      this.obj(`Stop the <em>smuggler boat</em> <u>(hull ${Math.round(r.healthFrac * 100)}%)</u>`, r.pos, blipFor(r));
      if (r.disabled > 0.5 || r.healthFrac < 0.5) { r.ai = null; r.driver = null; this.step = 'grab'; this.say('TILLER', 'They are dead in the water. Pull alongside.'); }
      return;
    }
    if (r.sunk) return this.pass(1400, 'Cargo lost with the boat');
    this.obj('Pull alongside and take the <em>cargo</em>', r.pos, blipFor(r, 'objective'));
    const near = pl.vehicle && dist(pp, r.pos) < 10 && pl.worldSpeed < 8;
    this.sideT = near ? (this.sideT || 0) + dt : 0;
    G.hud.progress(near ? this.sideT / 2 : null, 'LOADING');
    if (this.sideT >= 2) { this.say('TILLER', 'Every crate. You ever want steady work on the water, you know where I am.'); this.pass(2800); }
  }
}

// ------------------------------------------------------------------ Courier Rush
export class CourierRush extends Job {
  start() {
    this.say('DISPATCH', 'Haiku Express: six parcels, all of them late. The clock is already running.');
    this.n = 0; this.total = 6; this.left = 0; this.last = null;
    this.next(true);
  }
  next(first) {
    const pp = G.player.worldPos;
    const xs = CITY.xs.length;
    const cand = nodes.filter((n) => n.grid && n.gi < xs - 1 && dist(n, pp) > 190 && dist(n, pp) < 520 && n !== this.last);
    const n = pick(cand.length ? cand : nodes.filter((q) => q.grid && q.gi < xs - 1));
    this.last = n;
    const x = n.x + 50, z = n.z + n.hz - 2.4;
    this.dropRing(this.dest);
    this.dest = this.ring(x, z, 5.5, PAL.neonAmber);
    this.left = (first ? 22 : this.left) + dist({ x, z }, pp) / 11 + 5;
  }
  update(dt) {
    const pl = G.player, pp = pl.worldPos;
    this.left -= dt;
    this.M.timerText = fmtTime(Math.max(0, this.left));
    this.obj(`Deliver parcel <em>${this.n + 1} of ${this.total}</em>${pl.vehicle ? '' : ' — you will want wheels'}`, this.dest);
    if (this.inRing(this.dest, pp, 1.5) && pl.worldSpeed < 10) {
      this.n++;
      addTokens(150 + Math.round(this.left * 3), 'delivery');
      emit('sfx', 'checkpoint');
      if (this.n >= this.total) return this.pass(900, `${this.total} parcels on time`);
      this.next(false);
    } else if (this.left <= 0) this.fail(`Out of time — ${this.n} of ${this.total} delivered`);
  }
  cleanup() { super.cleanup(); this.M.timerText = ''; }
}

// ------------------------------------------------------------------ Glide Path
export class GlidePath extends Job {
  start() {
    const pl = G.player, E = PIER.x1;
    // off the south side of the pier, a loop over the bay, round the pier head and home along the north beach;
    // it never crosses the pier's centre line, where the monorail pylons stand
    this.pts = [[E - 140, 4.5], [E - 75, 75], [E - 150, 210], [E - 10, 300], [E + 100, 150], [E + 100, -10], [E + 30, -150], [E - 110, -280], [E - 170, -130], [878, -45]].map(([x, z]) => ({ x, z }));
    let v = pl.vehicle;
    if (!v || v.cls !== 'hover') { if (v) pl.leaveVehicle(true); v = this.spawn('hoverbike', 0, 0, 0); pl.vehicle = v; v.driver = 'player'; v.stolen = true; pl.state = 'foot'; pl.seat(); }
    v.pos.set(PIER.x0 + 12, 0, 4.5); v.heading = Math.PI / 2; v.vel.set(0, 0, 0); v.angVel = 0; v.snapToGround(); v.repair(); v.nitro = 1;
    this.mine = v; this.i = 0; this.clock = 0; this.countdown = 3.6; this.beep = 5; this.outT = 0;
    this.cur = this.ring(this.pts[0].x, this.pts[0].z, 12, PAL.neonCyan);
    this.nxt = this.ring(this.pts[1].x, this.pts[1].z, 12, 0x5a7a8a);
    G.cam.yaw = Math.PI / 2; G.cam.idle = 2;
    G.police.suppressed = true;
    this.say('MARSHAL', 'Hover-bike time trial: down the pier, a loop over the bay, round the pier head and back along the sand. Ten gates.');
  }
  update(dt) {
    const pl = G.player, v = this.mine;
    if (v.destroyed || v.sunk) return this.fail('The bike is wrecked');
    if (pl.vehicle !== v) { this.outT += dt; this.obj('Get back on the <em>hover-bike</em>', v.pos); if (this.outT > 10) this.fail('You left the course'); return; }
    this.outT = 0;
    if (this.countdown > 0) {
      this.countdown -= dt;
      v.disabled = Math.max(v.disabled, 0.1);
      const n = Math.ceil(this.countdown - 0.2);
      if (n !== this.beep && n <= 3) { this.beep = n; if (n > 0) { G.hud.banner(String(n), '', 'cool', 0.8); emit('sfx', 'countdown'); } else { G.hud.banner('GO', '', '', 0.9); emit('sfx', 'go'); v.disabled = 0; } }
      this.obj('<em>Glide Path</em> — ten gates', null);
      return;
    }
    this.clock += dt;
    this.M.timerText = `${this.clock.toFixed(1)}s`;
    const p = this.pts[this.i];
    this.obj(`Gate <em>${this.i + 1}/${this.pts.length}</em>`, p);
    if (dist(p, v.pos) < 16) {
      emit('sfx', 'checkpoint');
      this.i++;
      if (this.i >= this.pts.length) {
        const t = this.clock;
        const medal = t <= 58 ? 0 : t <= 72 ? 1 : t <= 95 ? 2 : 3;
        const best = G.save.best.glide;
        const rec = !best || t < best;
        if (rec) G.save.best.glide = Math.round(t * 100) / 100;
        return this.pass([1600, 1000, 500, 150][medal], `${['Gold', 'Silver', 'Bronze', 'Finished'][medal]} · ${t.toFixed(1)}s${rec ? ' · new best' : ''}`);
      }
      this.dropRing(this.cur); this.dropRing(this.nxt);
      const a = this.pts[this.i], b = this.pts[this.i + 1];
      this.cur = this.ring(a.x, a.z, 12, PAL.neonCyan);
      this.nxt = b ? this.ring(b.x, b.z, 12, 0x5a7a8a) : null;
    }
  }
  cleanup() { super.cleanup(); G.police.suppressed = false; this.M.timerText = ''; }
}

// ------------------------------------------------------------------ The Weights Job (finale)
const WREN = { skin: 0xc68863, top: 0xeee6d6, bottom: 0x25272c, hair: 0x2ec4b6, hat: false, glow: 0xff9a78, scale: 0.98 };
export class WeightsJob extends Job {
  start() {
    this.say('MERIDIAN', 'Everything you have done leads here. The hauler you tagged holds every weight file Vantablack ever lifted.');
    this.say('MERIDIAN', 'Wren will crack it. You keep her breathing. She is waiting at Alignment Park.');
    this.step = 'pickup';
    this.dest = this.ring(93.5, 32, 5);
    this.wren = G.peds.spawn(86.5, 32, WREN, { role: 'ally', heading: Math.PI / 2, health: 400, brain: () => 0 });
    if (this.wren) this.wren.keep = true;
    this.hauler = this.spawn('van', HAULER.x, HAULER.z, Math.PI / 2, { paint: 0x2a2c30, locked: true });
    this.hauler.keep = true; this.hauler.outlaw = true;
    this.waves = [3, 21, 40];
  }
  update(dt) {
    const pl = G.player, pp = pl.worldPos;
    if (this.step === 'pickup') {
      this.obj('Pick up <em>Wren</em> at Alignment Park', this.dest);
      if (!pl.vehicle || pl.vehicle.cls === 'boat') { if (this.inRing(this.dest, pp, 4)) G.hud.prompt('Bring a car — Wren is not walking to the docks'); return; }
      if (this.inRing(this.dest, pp, 1.5) && pl.worldSpeed < 3) {
        if (this.wren) { G.peds.remove(this.wren); this.wren = null; }
        emit('sfx', 'doorClose');
        this.say('WREN', 'Nice ride. Docklands car park. Drive like someone is watching, because they are.');
        this.dropRing(this.dest);
        this.dest = this.ring(TAG.x, TAG.z, 6);
        this.step = 'drive';
      }
      return;
    }
    if (this.step === 'drive') {
      if (this.hauler.destroyed || this.hauler.removed) return this.fail('The hauler was destroyed, and the weights with it');
      this.obj('Drive to the <em>stash</em> in the Docklands car park', this.dest);
      if (this.inRing(this.dest, pp, 1.5) && pl.worldSpeed < 4) {
        this.dropRing(this.dest);
        const hv = this.hauler;
        this.wren = G.peds.spawn(hv.pos.x - hv.T.len / 2 - 0.9, hv.pos.z + 0.4, WREN, { role: 'ally', heading: Math.PI / 2, health: 9999, brain: () => 0 });
        if (this.wren) this.wren.keep = true;
        G.weapons.reserve += 36;
        G.hud.toast('Wren hands you spare magazines');
        this.hold = 62; this.step = 'hold';
        this.say('WREN', 'There she is. Sixty seconds on the lock. Company is coming — cover me.');
      }
      return;
    }
    const h = this.hauler;
    if (h.destroyed || h.sunk || h.removed) return this.fail('The hauler was destroyed, and the weights with it');
    if (this.step === 'hold') {
      if (dist(pp, h.pos) > 90) return this.fail('You left Wren on her own');
      this.hold -= dt;
      this.M.timerText = fmtTime(Math.max(0, this.hold));
      G.hud.progress(1 - this.hold / 62, 'CRACKING THE LOCK');
      const live = this.goons.filter((g) => g.alive && g.state !== 'down').length;
      this.obj(`Hold off <em>Vantablack security</em>${live ? ` <u>(${live} on foot)</u>` : ''}`, h.pos, blipFor(h, 'objective'));
      while (this.waves.length && 62 - this.hold >= this.waves[0]) {
        this.waves.shift();
        const first = this.waves.length === 2;
        for (let k = 0; k < (first ? 1 : 2); k++) spawnGoonCar(this, STASH.x + rand(-24, 24), STASH.z + rand(-14, 18), first ? 3 : 2);
        G.hud.toast('Vantablack security inbound', '#ff4d5e');
      }
      if (this.hold <= 0) {
        this.M.timerText = ''; G.hud.progress(null);
        h.locked = false;
        this.step = 'take';
        this.say('WREN', 'We are in. It is all in the back — take the hauler and go. I will find my own way out.');
      }
      return;
    }
    if (this.step === 'take') {
      this.obj('Get in the <em>Data Hauler</em>', h.pos, blipFor(h));
      if (pl.vehicle === h) { G.police.raise(3, 'Vault alarm'); this.step = 'run'; this.say('MERIDIAN', 'Alarm is out. Lose them, then get that hauler to Gator. He knows what to do with it.'); }
      return;
    }
    if (pl.vehicle !== h) { this.obj('Get back in the <em>Data Hauler</em>', h.pos, blipFor(h)); return; }
    if (G.police.stars > 0) { this.obj('Lose the <em>Safety Flag</em>', null); this.dropRing(this.dest); this.dest = null; return; }
    if (!this.dest) this.dest = this.ring(POI.gator.x + 2, POI.gator.z - 8, 6, PAL.neonLime);
    this.obj(`Deliver the hauler to <em>Gator Garage</em> <u>(hull ${Math.round(h.healthFrac * 100)}%)</u>`, this.dest);
    if (this.inRing(this.dest, h.pos) && h.speed < 4) {
      const bonus = Math.round(3000 * h.healthFrac);
      pl.leaveVehicle(true);
      pl.pos.set(POI.gator.x - 6, groundHeight(POI.gator.x - 6, POI.gator.z + 2, 99), POI.gator.z + 2);
      h.mission = false; h.keep = false; h.dispose();
      this.say('GATOR', 'Every weight they ever stole, sitting in my shed. Cher, you just made some very rich people very nervous.');
      this.say('MERIDIAN', 'It is done. Officially, none of this happened. Unofficially: well played, Kestrel.');
      G.save.finale = true;
      this.pass(9000 + bonus, `The Weights Job · bonus ${formatTokens(bonus)} ◈`);
    }
  }
  cleanup() { super.cleanup(); if (this.wren) { G.peds.remove(this.wren); this.wren = null; } this.M.timerText = ''; }
}
