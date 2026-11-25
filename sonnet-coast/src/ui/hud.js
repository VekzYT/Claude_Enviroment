// Heads-up display: minimap, health/armor, Safety Flag stars, Tokens, weapon, speedo, objectives.
import { G } from '../state.js';
import { touchKeys } from '../touch.js';
import { MapRenderer } from './minimap.js';
import { WEAPONS } from '../entities/weapons.js';
import { districtAt } from '../world/cityplan.js';
import { roadAt } from '../world/roads.js';
import { forestMask, swampMask, landDist } from '../world/terrain.js';
import { RECT } from '../world/layout.js';
import { clamp, formatTokens } from '../util/math.js';

const STAR = '<svg viewBox="0 0 24 24"><path d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7-6.3-3.4-6.3 3.4 1.3-7L1.8 9.2l7.1-.9z"/></svg>';

const TEMPLATE = `
<div id="hud" class="hidden">
  <div class="hud-tl"><div id="mtitle"></div><div id="mtimer"></div><div id="fps"></div></div>
  <div class="hud-tr">
    <div class="flag" id="flag"><span class="flag-label">SAFETY FLAG</span><div class="stars">${STAR.repeat(5)}</div><div class="evade"><i id="evade"></i></div></div>
    <div class="tokens"><span class="tk-ico">◈</span><b id="tokens">0</b><span class="tk-label">TOKENS</span></div>
    <div id="tokpop"></div>
    <div class="weapon"><span id="wname">Fists</span><b id="wammo"></b></div>
  </div>
  <div class="hud-bl">
    <div class="place"><b id="place"></b><span id="clock"></span></div>
    <div class="mini-wrap"><canvas id="mini" width="232" height="232"></canvas></div>
    <div class="bars"><div class="bar hp"><i id="hp"></i></div><div class="bar ar"><i id="ar"></i></div></div>
  </div>
  <div class="hud-br hidden" id="veh">
    <div class="radio" id="radio"><span id="rstation"></span><em id="rtrack"></em></div>
    <div class="vname" id="vname"></div>
    <div class="speed"><b id="spd">0</b><span>km/h</span></div>
    <div class="bar nitro"><i id="nitro"></i><label>NITRO</label></div>
    <div class="bar vhp"><i id="vhp"></i><label>HULL</label></div>
  </div>
  <div class="hud-bc"><div id="subtitle"></div><div id="objective"></div><div id="prompt"></div></div>
  <div id="banner"></div>
  <div id="toasts"></div>
  <div id="cross"><i></i><i></i><i></i><i></i><u></u></div>
  <div id="hit"></div>
  <div id="progress" class="hidden"><i></i><span></span></div>
  <div id="wheel" class="hidden"><div class="wheel-ring"></div><div class="wheel-mid"><b id="whname"></b><span id="whhint"></span></div></div>
  <div id="dmg"></div>
</div>`;

export class HUD {
  constructor(root) {
    root.insertAdjacentHTML('beforeend', TEMPLATE);
    const $ = (id) => document.getElementById(id);
    this.el = { hud: $('hud'), mini: $('mini'), hp: $('hp'), ar: $('ar'), tokens: $('tokens'), tokpop: $('tokpop'), flag: $('flag'), evade: $('evade'),
      wname: $('wname'), wammo: $('wammo'), place: $('place'), clock: $('clock'), veh: $('veh'), vname: $('vname'), spd: $('spd'), nitro: $('nitro'), vhp: $('vhp'),
      radio: $('radio'), rstation: $('rstation'), rtrack: $('rtrack'), subtitle: $('subtitle'), objective: $('objective'), prompt: $('prompt'),
      banner: $('banner'), toasts: $('toasts'), cross: $('cross'), hit: $('hit'), wheel: $('wheel'), whname: $('whname'), whhint: $('whhint'),
      mtitle: $('mtitle'), mtimer: $('mtimer'), fps: $('fps'), dmg: $('dmg'), progress: $('progress') };
    this.stars = Array.from(this.el.flag.querySelectorAll('svg'));
    this.ctx = this.el.mini.getContext('2d');
    this.map = new MapRenderer();
    this.cache = {};
    this.blips = [];          // persistent blips (set by missions / world)
    this.promptText = ''; this.promptNext = '';
    this.subQueue = []; this.subT = 0;
    this.bannerT = 0;
    this.shownTokens = 0;
    this.miniT = 0;
    this.radioT = 0;
    this.dmgA = 0;
    this.placeT = 0;
    this.fpsAcc = 0; this.fpsN = 0;
    this.buildWheel();
  }
  set(key, value, fn) { if (this.cache[key] !== value) { this.cache[key] = value; fn(value); } }
  show(v) { this.el.hud.classList.toggle('hidden', !v); }

  // ---- messages ------------------------------------------------------------------
  prompt(text) { this.promptNext = text; }
  objective(text) { this.set('obj', text || '', (v) => { this.el.objective.innerHTML = touchKeys(v); this.el.objective.classList.toggle('on', !!v); }); }
  say(speaker, text, seconds) { this.subQueue.push({ speaker, text, t: seconds || clamp(1.6 + text.length * 0.055, 2.4, 7.5) }); }
  clearSpeech() { this.subQueue.length = 0; this.subT = 0; this.el.subtitle.classList.remove('on'); }
  toast(text, color = '') {
    const d = document.createElement('div');
    d.className = 'toast'; d.textContent = text;
    if (color) d.style.borderColor = color;
    this.el.toasts.appendChild(d);
    while (this.el.toasts.children.length > 4) this.el.toasts.firstChild.remove();
    setTimeout(() => d.classList.add('out'), 3600);
    setTimeout(() => d.remove(), 4200);
  }
  banner(title, sub = '', cls = '', seconds = 4.2) {
    this.el.banner.className = 'on ' + cls;
    this.el.banner.innerHTML = `<b>${title}</b><span>${sub}</span>`;
    this.bannerT = seconds;
  }
  tokenPop(n, reason) {
    if (!n) return;
    const d = document.createElement('div');
    d.className = 'pop ' + (n > 0 ? 'plus' : 'minus');
    d.textContent = `${n > 0 ? '+' : '−'}${formatTokens(Math.abs(n))}${reason ? '  ' + reason : ''}`;
    this.el.tokpop.appendChild(d);
    setTimeout(() => d.remove(), 2600);
  }
  hitMarker() { const h = this.el.hit; h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); }
  progress(frac, label = '') {
    const p = this.el.progress;
    if (frac === null) { this.set('prog', false, () => p.classList.add('hidden')); return; }
    this.set('prog', true, () => p.classList.remove('hidden'));
    p.firstElementChild.style.width = `${clamp(frac, 0, 1) * 100}%`;
    p.lastElementChild.textContent = label;
  }
  radioPopup(np) {
    if (!np) { this.el.rstation.textContent = 'RADIO OFF'; this.el.rtrack.textContent = ''; this.el.radio.style.setProperty('--rc', '#8f8b83'); }
    else { this.el.rstation.textContent = `${np.station} ${np.freq}`; this.el.rtrack.textContent = `${np.track} — ${np.artist}`; this.el.radio.style.setProperty('--rc', np.color || '#ff7a59'); }
    this.el.radio.classList.add('on');
    this.radioT = 5;
  }
  damageFlash(a = 0.6) { this.dmgA = Math.min(1, this.dmgA + a); }

  // ---- weapon wheel ------------------------------------------------------------------
  buildWheel() {
    const ring = this.el.wheel.querySelector('.wheel-ring');
    this.wheelItems = WEAPONS.map((w, i) => {
      const a = (i / WEAPONS.length) * Math.PI * 2 - Math.PI / 2;
      const d = document.createElement('div');
      d.className = 'wheel-item';
      d.style.left = `${50 + Math.cos(a) * 36}%`; d.style.top = `${50 + Math.sin(a) * 36}%`;
      d.innerHTML = `<b>${i + 1}</b><span>${w.name}</span>`;
      ring.appendChild(d);
      return d;
    });
    this.wheelOpen = false; this.wheelSel = 0; this.wx = 0; this.wy = 0;
  }
  openWheel(open) {
    if (open === this.wheelOpen) return;
    this.wheelOpen = open;
    this.el.wheel.classList.toggle('hidden', !open);
    if (open) { this.wx = 0; this.wy = 0; this.wheelSel = G.weapons.index; this.paintWheel(); }
    else G.weapons.select(this.wheelSel);
  }
  wheelMove(dx, dy) {
    this.wx = clamp(this.wx + dx, -140, 140); this.wy = clamp(this.wy + dy, -140, 140);
    if (Math.hypot(this.wx, this.wy) > 34) {
      const a = Math.atan2(this.wy, this.wx) + Math.PI / 2;
      const n = WEAPONS.length;
      const sel = ((Math.round((a / (Math.PI * 2)) * n) % n) + n) % n;
      if (sel !== this.wheelSel) { this.wheelSel = sel; this.paintWheel(); G.audio?.play('uiMove'); }
    }
  }
  paintWheel() {
    this.wheelItems.forEach((d, i) => d.classList.toggle('sel', i === this.wheelSel));
    this.el.whname.textContent = WEAPONS[this.wheelSel].name;
    this.el.whhint.textContent = WEAPONS[this.wheelSel].hint;
  }

  // ---- per-frame ---------------------------------------------------------------------
  placeName(x, z) {
    const r = roadAt(x, z, 14);
    const d = districtAt(x, z);
    let area = d;
    if (!area) {
      if (x > RECT.port.x0 && x < RECT.port.x1 && z > RECT.port.z0 && z < RECT.port.z1) area = 'Port of Sonnet';
      else if (x > RECT.ridge.x0 && x < RECT.ridge.x1 && z > RECT.ridge.z0 && z < RECT.ridge.z1) area = 'Compute Ridge';
      else if (forestMask(x, z) > 0.5) area = 'Glowwood';
      else if (swampMask(x, z) > 0.5) area = 'Opus Bayou';
      else if (landDist(x, z) < 0) area = 'Sonnet Bay';
      else if (landDist(x, z) < 110 && x > 800) area = 'Token Beach';
      else area = 'Sonnet Coast';
    }
    return r && r.e.name && r.e.name !== 'City Street' ? `${r.e.name} · ${area}` : area;
  }

  update(dt, t) {
    const E = this.el, pl = G.player, v = pl.vehicle, pos = pl.worldPos;
    const police = G.police;
    // bars
    this.set('hp', Math.round(pl.health), (x) => { E.hp.style.width = `${x}%`; E.hp.parentElement.classList.toggle('low', x < 30); });
    this.set('ar', Math.round(pl.armor), (x) => { E.ar.style.width = `${x}%`; });
    // tokens tick up
    const target = G.save.tokens;
    if (this.shownTokens !== target) {
      const diff = target - this.shownTokens;
      this.shownTokens += Math.abs(diff) < 4 ? diff : Math.sign(diff) * Math.max(1, Math.round(Math.abs(diff) * Math.min(1, dt * 6)));
    }
    this.set('tok', this.shownTokens, (x) => { E.tokens.textContent = formatTokens(x); });
    // stars
    const stars = police ? police.stars : 0;
    const ev = police ? police.evading : false;
    this.set('stars', stars + (ev ? 10 : 0), () => {
      this.stars.forEach((s, i) => s.classList.toggle('on', i < stars));
      E.flag.classList.toggle('wanted', stars > 0);
      E.flag.classList.toggle('evading', ev);
    });
    if (stars > 0) E.evade.style.width = `${(police.evadeProgress * 100).toFixed(0)}%`;
    // weapon
    const w = G.weapons;
    if (w) { this.set('wn', w.current.name, (x) => { E.wname.textContent = x; }); this.set('wa', w.ammoText(), (x) => { E.wammo.textContent = x; }); }
    // place + clock (a few times a second)
    this.placeT -= dt;
    if (this.placeT <= 0) {
      this.placeT = 0.4;
      this.set('place', this.placeName(pos.x, pos.z), (x) => { E.place.textContent = x; });
      this.set('clock', G.env.clockText(), (x) => { E.clock.textContent = x; });
    }
    // vehicle cluster
    this.set('inveh', !!v, (x) => E.veh.classList.toggle('hidden', !x));
    if (v) {
      this.set('vname', v.name, (x) => { E.vname.textContent = x; });
      this.set('spd', Math.round(v.speed * 3.6), (x) => { E.spd.textContent = x; });
      this.set('nitro', Math.round(v.nitro * 100), (x) => { E.nitro.style.width = `${x}%`; });
      this.set('boost', v.boosting, (x) => E.nitro.parentElement.classList.toggle('boost', x));
      this.set('vhp', Math.round(v.healthFrac * 100), (x) => { E.vhp.style.width = `${x}%`; E.vhp.parentElement.classList.toggle('low', x < 30); });
    }
    if (this.radioT > 0) { this.radioT -= dt; if (this.radioT <= 0) E.radio.classList.remove('on'); }
    // crosshair
    const aim = !v && pl.aiming && pl.state === 'foot';
    const hack = w && w.current.id === 'hack' && pl.state === 'foot';
    const drive = v && w && (w.current.id === 'pistol' || w.current.id === 'hack' || w.current.id === 'emp') && G.input?.mouse.locked;
    this.set('cross', aim || hack || drive ? (w.target && (w.target.kind === 'ped' || w.target.kind === 'vehicle' || w.target.kind === 'drone') ? 2 : 1) : 0, (x) => { E.cross.className = x === 2 ? 'on hot' : x === 1 ? 'on' : ''; });
    // prompt
    this.set('prompt', this.promptNext, (x) => { E.prompt.innerHTML = touchKeys(x); E.prompt.classList.toggle('on', !!x); });
    this.promptNext = '';
    // subtitles
    if (this.subT > 0) { this.subT -= dt; if (this.subT <= 0) E.subtitle.classList.remove('on'); }
    if (this.subT <= 0 && this.subQueue.length) {
      const s = this.subQueue.shift();
      E.subtitle.innerHTML = `<b>${s.speaker}</b>${s.text}`;
      E.subtitle.classList.add('on');
      this.subT = s.t;
      G.audio?.play(s.speaker === 'MERIDIAN' ? 'phone' : 'chatter', { volume: 0.5 });
    }
    if (this.bannerT > 0) { this.bannerT -= dt; if (this.bannerT <= 0) E.banner.className = ''; }
    // damage vignette
    if (this.dmgA > 0 || pl.health < 28) {
      this.dmgA = Math.max(0, this.dmgA - dt * 1.4);
      const low = pl.health < 28 && pl.alive ? 0.25 + 0.15 * Math.sin(t * 6) : 0;
      E.dmg.style.opacity = Math.max(this.dmgA, low).toFixed(2);
    } else this.set('dmg0', 0, () => { E.dmg.style.opacity = 0; });
    // fps
    if (G.settings.showFps) { this.fpsAcc += dt; this.fpsN++; if (this.fpsAcc > 0.5) { E.fps.textContent = `${Math.round(this.fpsN / this.fpsAcc)} fps`; this.fpsAcc = 0; this.fpsN = 0; } }
    else this.set('fps', '', () => { E.fps.textContent = ''; });

    // minimap at ~30 Hz
    this.miniT -= dt;
    this.map.updateRoute(dt, pos.x, pos.z, v && v.cls === 'boat');
    if (this.miniT <= 0) {
      this.miniT = 0.033;
      const speed = pl.worldSpeed;
      this.radius = (this.radius || 120) + ((v ? 130 + clamp(speed, 0, 60) * 2.2 : 105) - (this.radius || 120)) * 0.1;
      this.map.drawMini(this.ctx, 232, {
        x: pos.x, z: pos.z, yaw: G.cam.yaw, heading: v ? v.heading : pl.heading, radius: this.radius,
        blips: this.blips, cones: police ? police.cones : [], flash: Math.floor(t * 4) % 2 === 0,
      });
    }
  }
}
