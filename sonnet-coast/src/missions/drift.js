// Drift Trial: a timed drift score attack on the open concrete of the port yard. One zone at a time lights up;
// sliding through the lit zone doubles the points, and a couple of seconds of sliding in it (over one pass or
// several) scores a bonus and moves it on.
import { G, emit } from '../state.js';
import { Job, fmtTime } from './job.js';
import { Drift } from '../drive/drift.js';
import { formatTokens } from '../util/math.js';
import { PAL } from '../world/palette.js';

export const DRIFT_YARD = { x0: 664, x1: 774, z0: 950, z1: 1034 };   // clear, flat concrete between the warehouses
const START = { x: 670, z: 1027, h: Math.PI / 2 };
const ZONES = [[742, 1006], [700, 972], [744, 970], [698, 1008], [720, 990]];
const ZONE_R = 13, ZONE_HOLD = 2, ZONE_BONUS = 400;   // seconds of sliding in the zone (they add up) to clear it
const TIME = 75;
const MEDALS = [24000, 14000, 6000];   // gold, silver, bronze (a tidy but choppy test driver scores about 6.5k)
const PAY = [2500, 1500, 800, 200];

export class DriftTrial extends Job {
  start() {
    const pl = G.player;
    let v = pl.vehicle;
    // bring your own if it can slide; otherwise the marshal lends a Haiku GT
    if (!v || v.cls !== 'car' || v.T.driftAngle < 0.4) { if (v) pl.leaveVehicle(true); v = this.spawn('sport', 0, 0, 0, { paint: 0xd97757 }); pl.vehicle = v; v.driver = 'player'; v.stolen = true; pl.state = 'foot'; pl.seat(); }
    v.pos.set(START.x, 0, START.z); v.heading = START.h; v.vel.set(0, 0, 0); v.angVel = 0; v.drift = false; v.snapToGround(); v.repair(); v.nitro = 1;
    this.mine = v; this.clock = TIME; this.countdown = 3.6; this.beep = 5; this.outT = 0; this.awayT = 0;
    this.score = 0; this.chains = 0; this.crashes = 0; this.zi = 0; this.zoneT = 0;
    this.zone = this.ring(ZONES[0][0], ZONES[0][1], ZONE_R, PAL.neonCyan);
    Drift.active = false; Drift.points = 0; Drift.event = true;
    this.listen('driftBanked', (pts) => { if (this.countdown <= 0) { this.score += pts; this.chains++; } });
    this.listen('driftLost', (pts, why) => { if (this.countdown <= 0 && pts > 200) { this.crashes++; G.hud.toast(`${why.toLowerCase()} — ${formatTokens(pts)} lost`, '#ff4d5e'); } });
    G.cam.yaw = START.h; G.cam.idle = 2;
    G.police.suppressed = true;
    this.say('MARSHAL', `Drift Trial: ${TIME} seconds in the yard. Keep the car sideways, keep the chain alive, bank it clean.`);
    this.say('MARSHAL', 'The lit zone doubles everything. Hold a slide in it and it moves.');
  }
  update(dt) {
    const pl = G.player, v = this.mine;
    if (v.destroyed || v.sunk) return this.fail('The car is wrecked');
    if (pl.vehicle !== v) { this.outT += dt; this.obj('Get back in your <em>car</em>', v.pos); if (this.outT > 10) this.fail('You left the trial'); return; }
    this.outT = 0;
    if (this.countdown > 0) {
      this.countdown -= dt;
      v.disabled = Math.max(v.disabled, 0.1);
      const n = Math.ceil(this.countdown - 0.2);
      if (n !== this.beep && n <= 3) { this.beep = n; if (n > 0) { G.hud.banner(String(n), '', 'cool', 0.8); emit('sfx', 'countdown'); } else { G.hud.banner('DRIFT', '', '', 0.9); emit('sfx', 'go'); v.disabled = 0; } }
      this.obj(`<em>Drift Trial</em> — gold at ${formatTokens(MEDALS[0])}`, null);
      return;
    }
    this.clock -= dt;
    this.M.timerText = fmtTime(Math.max(0, this.clock));
    // the lit zone
    const z = ZONES[this.zi], inZone = Math.hypot(v.pos.x - z[0], v.pos.z - z[1]) < ZONE_R + 2;
    Drift.zoneK = inZone ? 2 : 1;
    if (inZone && Drift.sliding) {
      this.zoneT += dt;
      G.hud.progress(this.zoneT / ZONE_HOLD, 'ZONE');
      if (this.zoneT >= ZONE_HOLD) {
        Drift.points += ZONE_BONUS * Drift.mult;
        G.hud.toast(`Zone bonus +${formatTokens(ZONE_BONUS * Drift.mult)}`, '#5ff3ff');
        emit('sfx', 'checkpoint');
        this.zoneT = 0; this.zi = (this.zi + 1) % ZONES.length;
        G.hud.progress(null);
        this.dropRing(this.zone);
        this.zone = this.ring(ZONES[this.zi][0], ZONES[this.zi][1], ZONE_R, PAL.neonCyan);
      }
    } else if (this.zoneT > 0) G.hud.progress(this.zoneT / ZONE_HOLD, 'ZONE');
    // stay in the yard
    const Y = DRIFT_YARD, away = v.pos.x < Y.x0 - 20 || v.pos.x > Y.x1 + 20 || v.pos.z < Y.z0 - 20 || v.pos.z > Y.z1 + 20;
    this.awayT = away ? this.awayT + dt : 0;
    if (this.awayT > 6) return this.fail('You left the yard');
    const total = this.score + (Drift.active ? Math.round(Drift.points) : 0);
    this.obj(away ? 'Back to the <em>yard</em>' : `Score <em>${formatTokens(total)}</em> · the <u>lit zone</u> doubles points`, away ? { x: (Y.x0 + Y.x1) / 2, z: (Y.z0 + Y.z1) / 2 } : null);
    if (this.clock <= 0) {
      Drift.end(true);   // the running chain counts
      const s = this.score, medal = MEDALS.findIndex((m) => s >= m);
      const m = medal < 0 ? 3 : medal;
      const best = G.save.best.driftTrial ?? 0, rec = s > best;
      if (rec) G.save.best.driftTrial = s;
      this.say('MARSHAL', m === 0 ? 'That is how the yard is meant to look: all smoke and no paint.' : m < 3 ? 'Tidy. Find more angle and keep the chain going.' : 'You drove round a car park. Try sideways.');
      return this.pass(PAY[m], `${['Gold', 'Silver', 'Bronze', 'Finished'][m]} · ${formatTokens(s)} pts${rec ? ' · new best' : ''}`);
    }
  }
  cleanup() { super.cleanup(); Drift.event = false; Drift.zoneK = 1; G.police.suppressed = false; this.M.timerText = ''; }
}
