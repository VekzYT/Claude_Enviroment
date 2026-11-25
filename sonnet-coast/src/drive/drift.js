// Drift scoring: points for sliding the player's car at an angle, a combo multiplier for keeping the chain going,
// Tokens when the chain ends cleanly, nothing when it ends in a wall. Also a near-miss bonus for slipping past
// other vehicles mid-drift, and the HUD widget that shows it all.
import { G, on, emit, addPlugin } from '../state.js';
import { addTokens } from '../save.js';
import { addControls } from '../ui/menus.js';
import { clamp, formatTokens } from '../util/math.js';

// A slide counts while the car is in a proper drift (see Vehicle.handling) past MIN_ANGLE, or if it is simply
// that far sideways; grip-limit cornering slips up to about ten degrees and must not keep a chain alive.
const MIN_ANGLE = 12 * Math.PI / 180, BIG_ANGLE = 25 * Math.PI / 180, MAX_ANGLE = 100 * Math.PI / 180, MIN_SPEED = 10;
const GRACE = 1.5;          // seconds of straight driving a chain survives
const RATE = 0.15;          // points per degree per m/s per second, at the reference speed
const REF_SPEED = 16;       // faster slides score more than slow circles (x0.6 .. x1.6)
const LEVEL_T = 2.5;        // seconds of sliding per multiplier step
const MAX_MULT = 5;
const CRASH = 6;            // impact speed (m/s) that ends a chain
const PER_TOKEN = 50, TOKEN_CAP = 300, MIN_BANK = 200;
// Tokens paid recently cool off at HEAT_COOL per second; while warm, chains pay less (down to a quarter), so
// circling one car park for an hour is not the best job in town
const HEAT_K = 250, HEAT_COOL = 2;
const NEAR_GAP = 1.5, NEAR_PTS = 250, NEAR_COOL = 4;
const DEG = 180 / Math.PI;

// Shared scorer state. Jobs read it and may set zoneK (a points multiplier) and event (no Tokens paid per drift).
export const Drift = {
  active: false, points: 0, mult: 1, chainT: 0, graceT: 0, angle: 0, sliding: false,
  zoneK: 1, event: false, heat: 0, car: null,
  near: new Map(),          // vehicle id -> time of its last near-miss
  // Close the chain: pay out, unless it ended badly. Returns the points banked.
  end(clean, reason = '') {
    if (!this.active) return 0;
    const pts = Math.round(this.points);
    this.active = false; this.car = null; this.points = 0; this.mult = 1; this.chainT = 0; this.graceT = 0;
    if (!clean) { emit('driftLost', pts, reason); widget.result(pts, reason || 'LOST', 'lost'); return 0; }
    const best = G.save.best;
    const record = pts > (best.drift ?? 0) && pts >= MIN_BANK;
    if (record) best.drift = pts;
    if (pts >= MIN_BANK && !this.event) {
      const pay = Math.max(1, Math.floor(Math.min(TOKEN_CAP, pts / PER_TOKEN) * clamp(1 - this.heat / HEAT_K, 0.25, 1)));
      this.heat += pay;
      addTokens(pay, 'drift');
    }
    if (pts >= MIN_BANK) emit('sfx', record ? 'checkpoint' : 'token');
    emit('driftBanked', pts);
    widget.result(pts, record ? 'NEW BEST' : 'BANKED', 'banked');
    return pts;
  },
};

// ---- HUD widget ---------------------------------------------------------------------------
const CSS = `
#drift { position: absolute; right: 26px; top: 34%; width: 230px; text-align: right; opacity: 0; transform: translateX(14px); transition: opacity .25s, transform .25s; pointer-events: none; }
#drift.on { opacity: 1; transform: none; }
#drift .dr-label { font-size: 10px; letter-spacing: .3em; font-weight: 700; color: rgba(240,232,216,.6); }
#drift .dr-row { display: flex; justify-content: flex-end; align-items: baseline; gap: 10px; }
#drift .dr-pts { font-size: 40px; font-weight: 900; font-style: italic; color: var(--ivory); line-height: 1.05; letter-spacing: -.01em; }
#drift .dr-mult { min-width: 46px; padding: 2px 8px; border-radius: 4px; background: var(--panel); border: 2px solid var(--mc, #f0e8d8); color: var(--mc, #f0e8d8); font-weight: 900; font-size: 20px; text-align: center; }
#drift .dr-meter { position: relative; height: 8px; margin-top: 6px; background: rgba(16,15,13,.72); border-radius: 2px; overflow: hidden; border: 1px solid rgba(16,15,13,.9); }
#drift .dr-meter i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; transform-origin: 0 0; transform: scaleX(0); background: linear-gradient(90deg, #8fb7c9, var(--ivory) 45%, var(--amber) 75%, var(--terracotta)); }
#drift .dr-meter u { position: absolute; top: 0; bottom: 0; left: 20%; width: 2px; background: rgba(240,232,216,.5); }
#drift .dr-sub { display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; font-weight: 700; letter-spacing: .12em; color: rgba(240,232,216,.7); }
#drift .dr-grace { height: 3px; margin-top: 5px; background: rgba(240,232,216,.12); border-radius: 2px; overflow: hidden; }
#drift .dr-grace i { display: block; height: 100%; width: 100%; transform-origin: 0 0; background: var(--cyan); }
#drift .dr-msg { height: 22px; margin-top: 6px; font-size: 16px; font-weight: 900; letter-spacing: .1em; font-style: italic; }
#drift .dr-msg.banked { color: var(--lime); } #drift .dr-msg.lost { color: var(--red); } #drift .dr-msg.near { color: var(--cyan); }
#drift .dr-msg.dr-in { animation: drpop .45s ease-out; }
@keyframes drpop { 0% { transform: scale(1.35); opacity: 0; } 100% { transform: none; opacity: 1; } }
body.touch #drift { right: auto; left: 50%; top: 150px; transform: translateX(-50%); text-align: center; }
body.touch #drift.on { transform: translateX(-50%); }
body.touch #drift .dr-row { justify-content: center; }
`;
const MULT_COLORS = ['#f0e8d8', '#f0e8d8', '#8fd3e8', '#ffb347', '#ff8a5c', '#ff5e7a'];

const widget = {
  el: null, cache: {}, msgT: 0, showT: 0,
  build() {
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    const el = document.createElement('div');
    el.id = 'drift';
    el.innerHTML = '<div class="dr-label">DRIFT</div><div class="dr-row"><b class="dr-pts">0</b><span class="dr-mult">×1</span></div>'
      + '<div class="dr-meter"><i></i><u></u></div><div class="dr-sub"><span class="dr-ang">0°</span><span class="dr-best"></span></div>'
      + '<div class="dr-grace"><i></i></div><div class="dr-msg"></div>';
    document.getElementById('hud').appendChild(el);
    const q = (c) => el.querySelector(c);
    this.el = el;
    this.pts = q('.dr-pts'); this.mult = q('.dr-mult'); this.fill = q('.dr-meter i'); this.ang = q('.dr-ang');
    this.best = q('.dr-best'); this.grace = q('.dr-grace i'); this.msg = q('.dr-msg');
  },
  set(key, v, fn) { if (this.cache[key] !== v) { this.cache[key] = v; fn(v); } },
  flash(text, cls) {
    const m = this.msg;
    m.textContent = text; m.className = 'dr-msg ' + cls;
    void m.offsetWidth; m.classList.add('dr-in');
    this.msgT = 2.2;
  },
  result(pts, label, cls) {
    if (!this.el || pts < MIN_BANK) return;   // a twitch of the tail is not worth a message
    this.flash(`${label} ${formatTokens(pts)}`, cls);
    this.showT = 2.2;
  },
  update(dt) {
    if (!this.el) return;
    const S = Drift;
    this.msgT -= dt; this.showT -= dt;
    const on = (S.active && (S.points > 60 || S.chainT > 0.5)) || this.showT > 0;
    this.set('on', on, (v) => this.el.classList.toggle('on', v));
    if (this.msgT <= 0) this.set('msgclr', true, () => { this.msg.textContent = ''; this.msg.className = 'dr-msg'; });
    else this.cache.msgclr = false;
    if (!on) return;
    if (S.active) this.set('pts', Math.round(S.points), (v) => { this.pts.textContent = formatTokens(v); });
    this.set('mult', S.mult, (v) => { this.mult.textContent = `×${v}`; this.mult.style.setProperty('--mc', MULT_COLORS[v]); });
    const a = Math.round(S.angle * DEG);
    this.set('ang', a, (v) => { this.ang.textContent = `${v}°`; this.fill.style.transform = `scaleX(${clamp(v / 60, 0, 1)})`; });
    this.set('best', G.save.best.drift ?? 0, (v) => { this.best.textContent = v ? `BEST ${formatTokens(v)}` : ''; });
    const g = S.active ? 1 - S.graceT / GRACE : 0;
    this.set('grace', Math.round(g * 50), (v) => { this.grace.style.transform = `scaleX(${v / 50})`; });
  },
};

// ---- scoring ------------------------------------------------------------------------------
// Closest gap between two vehicles' bodies (each is three circles along its length).
function bodyGap(a, b) {
  const sa = Math.sin(a.heading), ca = Math.cos(a.heading), sb = Math.sin(b.heading), cb = Math.cos(b.heading);
  let best = Infinity;
  for (let p = 0; p < 3; p++) {
    const ax = a.pos.x + sa * a.cOff[p], az = a.pos.z + ca * a.cOff[p];
    for (let q = 0; q < 3; q++) {
      const d = Math.hypot(b.pos.x + sb * b.cOff[q] - ax, b.pos.z + cb * b.cOff[q] - az);
      if (d < best) best = d;
    }
  }
  return best - a.cr - b.cr;
}

function nearMisses(v, t) {
  for (const o of G.vehicles) {
    if (o === v || o.sunk || o.cls === 'boat') continue;
    const dx = o.pos.x - v.pos.x, dz = o.pos.z - v.pos.z;
    if (dx * dx + dz * dz > 100 || Math.abs(o.pos.y - v.pos.y) > 2.5) continue;
    if (Math.hypot(o.vel.x - v.vel.x, o.vel.z - v.vel.z) < 6) continue;
    const last = Drift.near.get(o.id);
    if (last !== undefined && t - last < NEAR_COOL) continue;
    const gap = bodyGap(v, o);
    if (gap > 0.05 && gap < NEAR_GAP) {
      Drift.near.set(o.id, t);
      const pts = NEAR_PTS * Drift.mult;
      Drift.points += pts;
      widget.flash(`NEAR MISS +${formatTokens(pts)}`, 'near');
      emit('sfx', 'uiMove');
      emit('driftNearMiss', o, pts);
    }
  }
  if (Drift.near.size > 64) Drift.near.clear();
}

addPlugin({
  init() {
    G.drift = Drift;
    widget.build();
    on('vehicleImpact', (v, speed) => { if (v === G.player.vehicle && speed > CRASH) Drift.end(false, 'CRASHED'); });
    on('playerDied', () => Drift.end(false, 'WRECKED'));
    on('playerBusted', () => Drift.end(false, 'CONTAINED'));
    addControls([['Space + W', 'Standing start: burnout · add A / D for donuts'], ['In the air', 'A / D yaw · W / S pitch the nose']],
      [['drift', 'Hold DRIFT with the pedal down at a standstill: burnout or donuts']]);
  },
  update(dt, t) {
    const S = Drift, v = G.player.vehicle;
    S.heat = Math.max(0, S.heat - HEAT_COOL * dt);
    // getting out ends the chain here rather than on leftVehicle: death and arrest leave the car first and then
    // emit their own event, which names the reason
    if (S.active && v !== S.car) S.end(false, S.car.destroyed ? 'WRECKED' : 'BAILED');
    if (!v || v.destroyed || (v.cls !== 'car' && v.cls !== 'hover')) { S.angle = 0; S.sliding = false; if (S.active) S.end(false, 'WRECKED'); return; }
    const ang = Math.abs(v.slideAngle);
    S.angle += ((v.onGround ? ang : 0) - S.angle) * Math.min(1, dt * 10);
    S.sliding = v.onGround && v.fwd > 0 && v.speed > MIN_SPEED && ang > (v.drift ? MIN_ANGLE : BIG_ANGLE) && ang < MAX_ANGLE;
    if (S.sliding) {
      if (!S.active) { S.active = true; S.car = v; S.points = 0; S.chainT = 0; S.mult = 1; }
      S.graceT = 0;
      S.chainT += dt;
      const mult = Math.min(MAX_MULT, 1 + Math.floor(S.chainT / LEVEL_T));
      if (mult > S.mult) emit('sfx', 'uiSelect');
      S.mult = mult;
      S.points += ang * DEG * v.speed * clamp(v.speed / REF_SPEED, 0.6, 1.6) * RATE * dt * S.mult * S.zoneK;
    } else if (S.active && v.onGround) {
      // a jump in the middle of a chain holds it; a straight bit runs the grace timer
      S.graceT += dt;
      if (v.speed < 3) S.end(false, 'STALLED');
      else if (S.graceT > GRACE) S.end(true);
    }
    if (S.active) nearMisses(v, t);
  },
  lateUpdate(dt) { widget.update(dt); },
});
