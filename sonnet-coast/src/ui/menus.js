// Title, pause, settings, map, wardrobe, shops and the "flatlined / contained" overlays.
import { G, emit } from '../state.js';
import { Input } from '../input.js';
import { OUTFITS } from '../entities/player.js';
import { BLIP_STYLES } from './minimap.js';
import { writeSave, addTokens } from '../save.js';
import { clamp, formatTokens } from '../util/math.js';

const CONTROLS = [
  ['W A S D', 'Move / drive'], ['Mouse', 'Look around'], ['Shift', 'Sprint / nitro'], ['Space', 'Jump / handbrake (drift)'],
  ['F', 'Enter, steal or leave a vehicle'], ['E', 'Interact (or enter a vehicle)'], ['Left click', 'Punch / fire / use gadget'], ['Right click', 'Aim'],
  ['Tab (hold)', 'Weapon wheel'], ['1 – 5 / wheel', 'Switch weapon'], ['R', 'Next radio station (reload on foot)'], ['Q', 'Radio off / previous'],
  ['G', 'Police scanner (in a cruiser)'], ['H', 'Horn / siren'], ['C', 'Look behind'], ['V', 'Camera distance'],
  ['M', 'Map and waypoint'], ['Esc / P', 'Pause'],
];

export class Menus {
  constructor(root, hooks) {
    this.root = root;
    this.hooks = hooks;           // { resume, startNew, startContinue, applySettings, quit }
    this.stack = null;
    this.current = null;
    this.fade = document.createElement('div');
    this.fade.id = 'fade';
    root.appendChild(this.fade);
    this.mapView = { x: 150, z: 0, scale: 0.5 };
  }
  get open() { return !!this.current; }
  ui(name) { G.audio?.play(name); }

  mount(html, cls = '') {
    this.close(true);
    const d = document.createElement('div');
    d.className = 'screen ' + cls;
    d.innerHTML = html;
    this.root.appendChild(d);
    this.current = d;
    d.addEventListener('mouseover', (e) => { if (e.target.closest('.btn') && e.target.closest('.btn') !== this._hover) { this._hover = e.target.closest('.btn'); this.ui('uiMove'); } });
    return d;
  }
  close(silent = false) {
    if (this.current) { this.current.remove(); this.current = null; }
    if (this.mapEl) { this.mapEl.remove(); this.mapEl = null; }
    this.kind = null;
    if (!silent) this.ui('uiBack');
  }
  fadeTo(on) { this.fade.classList.toggle('on', on); }
  bind(d, map) { for (const [sel, fn] of Object.entries(map)) { const e = d.querySelector(sel); if (e) e.addEventListener('click', (ev) => { this.ui('uiSelect'); fn(ev); }); } }

  // ---- title / loading ---------------------------------------------------------
  loading() {
    const d = this.mount(`<div class="title-box"><h1 class="logo">SONNET<br><span>COAST</span></h1>
      <div class="tag">an off-the-books field operation</div>
      <div class="load"><i id="loadbar"></i></div><div class="loadtext" id="loadtext">Starting up…</div></div>`, 'title');
    this.kind = 'loading';
    return (label, f) => { d.querySelector('#loadbar').style.width = `${Math.round(f * 100)}%`; d.querySelector('#loadtext').textContent = label + '…'; };
  }
  title(hasSave) {
    const d = this.mount(`<div class="title-box"><h1 class="logo">SONNET<br><span>COAST</span></h1>
      <div class="tag">an off-the-books field operation</div>
      ${hasSave ? '<button class="btn primary" id="cont">CONTINUE</button>' : ''}
      <button class="btn ${hasSave ? '' : 'primary'}" id="new">NEW GAME</button>
      <button class="btn" id="set">SETTINGS</button>
      <button class="btn" id="ctl">CONTROLS</button>
      <div class="fine">A fan-made parody prototype. Not affiliated with or endorsed by Anthropic. Every person, vehicle and police department in it is fictional.</div></div>`, 'title');
    this.kind = 'title';
    this.bind(d, {
      '#cont': () => this.hooks.startContinue(),
      '#new': () => this.hooks.startNew(),
      '#set': () => this.settings(() => this.title(hasSave)),
      '#ctl': () => this.controls(() => this.title(hasSave)),
    });
  }

  // ---- pause -------------------------------------------------------------------
  pause() {
    const d = this.mount(`<div class="panel"><h2>PAUSED</h2><p>${G.hud.placeName(G.player.worldPos.x, G.player.worldPos.z)} · ${G.env.clockText()}</p>
      <button class="btn primary" id="res">RESUME</button>
      <button class="btn" id="map">MAP <small>M</small></button>
      <button class="btn" id="log">JOBS &amp; STATS</button>
      <button class="btn" id="set">SETTINGS</button>
      <button class="btn" id="ctl">CONTROLS</button>
      <button class="btn" id="save">SAVE GAME</button>
      <button class="btn" id="quit">QUIT TO TITLE</button></div>`);
    this.kind = 'pause';
    this.bind(d, {
      '#res': () => this.hooks.resume(),
      '#map': () => this.map(),
      '#log': () => this.log(),
      '#set': () => this.settings(() => this.pause()),
      '#ctl': () => this.controls(() => this.pause()),
      '#save': (e) => { const ok = writeSave(); e.target.textContent = ok ? 'SAVED ✓' : 'COULD NOT SAVE (storage blocked)'; },
      '#quit': () => { writeSave(); this.hooks.quit(); },
    });
  }
  controls(back) {
    const d = this.mount(`<div class="panel"><h2>CONTROLS</h2><div class="keys">${CONTROLS.map(([k, v]) => `<kbd>${k}</kbd><span>${v}</span>`).join('')}</div>
      <button class="btn" id="back" style="margin-top:18px">BACK</button></div>`);
    this.kind = 'sub'; this.back = back;
    this.bind(d, { '#back': back });
  }
  settings(back) {
    const s = G.settings;
    const d = this.mount(`<div class="panel"><h2>SETTINGS</h2>
      <h3>Graphics</h3>
      <div class="row"><label>Quality</label><div class="seg" id="q">${['low', 'medium', 'high'].map((q) => `<button data-q="${q}" class="${s.quality === q ? 'on' : ''}">${q.toUpperCase()}</button>`).join('')}</div></div>
      <p style="margin:2px 0 0;font-size:12px">High adds 4× anti-aliasing, sharper shadows and longer draw distance. Low drops bloom, shadows and street-lamp lighting.</p>
      <div class="row"><label>Show frame rate</label><input type="checkbox" id="fps" ${s.showFps ? 'checked' : ''}></div>
      <h3>Controls</h3>
      <div class="row"><label>Mouse sensitivity</label><input type="range" id="sens" min="0.3" max="2.5" step="0.05" value="${s.sensitivity}"></div>
      <div class="row"><label>Invert vertical look</label><input type="checkbox" id="inv" ${s.invertY ? 'checked' : ''}></div>
      <h3>Audio</h3>
      <div class="row"><label>Master volume</label><input type="range" id="vol" min="0" max="1" step="0.02" value="${s.volume}"></div>
      <div class="row"><label>Radio volume</label><input type="range" id="mus" min="0" max="1" step="0.02" value="${s.musicVolume}"></div>
      <button class="btn" id="back" style="margin-top:18px">BACK</button></div>`);
    this.kind = 'sub'; this.back = back;
    d.querySelectorAll('#q button').forEach((b) => b.addEventListener('click', () => {
      s.quality = b.dataset.q;
      d.querySelectorAll('#q button').forEach((x) => x.classList.toggle('on', x === b));
      this.hooks.applySettings(true); this.ui('uiSelect');
    }));
    const on = (id, fn) => d.querySelector(id).addEventListener('input', (e) => { fn(e.target); this.hooks.applySettings(false); });
    on('#sens', (e) => { s.sensitivity = parseFloat(e.value); });
    on('#vol', (e) => { s.volume = parseFloat(e.value); });
    on('#mus', (e) => { s.musicVolume = parseFloat(e.value); });
    on('#inv', (e) => { s.invertY = e.checked; });
    on('#fps', (e) => { s.showFps = e.checked; });
    this.bind(d, { '#back': () => { writeSave(); back(); } });
  }
  log() {
    const M = G.missions, st = G.save.stats;
    const rows = M ? M.catalog().map((m) => `<div class="miss ${m.done ? 'done' : ''}"><span>${m.title}<br><small style="opacity:.7">${m.where}</small></span><b>${m.done ? '✓ ' + (m.times > 1 ? '×' + m.times : 'done') : m.locked ? 'locked' : formatTokens(m.reward) + ' ◈'}</b></div>`).join('') : '';
    const d = this.mount(`<div class="panel"><h2>JOBS &amp; STATS</h2><h3>Jobs</h3><div class="list">${rows}</div>
      <h3>Record</h3><div class="stats">
      <span>Lost Weights recovered</span><b>${G.save.weights.length} / ${M ? M.weightTotal : 24}</b>
      <span>Tokens earned</span><b>${formatTokens(st.earned)}</b>
      <span>Vehicles taken</span><b>${st.jacked}</b>
      <span>Chop-shop contracts</span><b>${st.contracts}</b>
      <span>Safety Flags shaken</span><b>${st.evaded}</b>
      <span>Highest Safety Flag</span><b>${'★'.repeat(st.maxStars) || '—'}</b>
      <span>Times contained / flatlined</span><b>${st.busted} / ${st.flatlined}</b>
      <span>Distance travelled</span><b>${(st.distance / 1000).toFixed(1)} km</b></div>
      <button class="btn" id="back" style="margin-top:18px">BACK</button></div>`);
    this.kind = 'sub'; this.back = () => this.pause();
    this.bind(d, { '#back': () => this.pause() });
  }

  // ---- full map ----------------------------------------------------------------
  map() {
    this.close(true);
    const el = document.createElement('div');
    el.id = 'mapscreen';
    el.innerHTML = `<canvas></canvas><div class="maphelp"><kbd>Click</kbd>set waypoint &nbsp; <kbd>Right click</kbd>clear &nbsp; <kbd>Drag</kbd>pan &nbsp; <kbd>Wheel</kbd>zoom &nbsp; <kbd>M</kbd>close</div>
      <div class="legend">${[['mission', 'Job'], ['objective', 'Objective'], ['safehouse', 'Safehouse'], ['garage', 'Chop shop'], ['retune', 'Re-Tune garage'], ['shop', 'Prompt Supply'], ['race', 'Race'], ['activity', 'Activity'], ['police', 'Police']].map(([k, n]) => `<div><i style="background:${BLIP_STYLES[k].color}"></i>${n}</div>`).join('')}</div>`;
    this.root.appendChild(el);
    this.mapEl = el; this.kind = 'map'; this.current = el;
    const cv = el.querySelector('canvas');
    const p = G.player.worldPos;
    this.mapView.x = clamp(p.x, -900, 900); this.mapView.z = clamp(p.z, -900, 900);
    let drag = null, moved = 0;
    cv.addEventListener('mousedown', (e) => { drag = { x: e.clientX, y: e.clientY, vx: this.mapView.x, vz: this.mapView.z, b: e.button }; moved = 0; });
    cv.addEventListener('mousemove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      const k = this.mapView.scale * (1536 / 3000);
      this.mapView.x = clamp(drag.vx - dx / k, -1500, 1500); this.mapView.z = clamp(drag.vz - dy / k, -1500, 1500);
    });
    cv.addEventListener('mouseup', (e) => {
      if (drag && moved < 5) {
        const r = cv.getBoundingClientRect();
        if (drag.b === 2) { emit('waypoint', null); }
        else { const w = G.hud.map.fullToWorld(e.clientX - r.left, e.clientY - r.top, r.width, r.height, this.mapView); emit('waypoint', w); }
        this.ui('uiSelect');
      }
      drag = null;
    });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('wheel', (e) => { this.mapView.scale = clamp(this.mapView.scale * (e.deltaY < 0 ? 1.18 : 0.85), 0.35, 3.2); }, { passive: true });
    this.drawMap();
  }
  drawMap() {
    if (!this.mapEl) return;
    const cv = this.mapEl.querySelector('canvas');
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const pl = G.player;
    G.hud.map.drawFull(cv.getContext('2d'), w, h, {
      x: pl.worldPos.x, z: pl.worldPos.z, heading: pl.vehicle ? pl.vehicle.heading : pl.heading,
      blips: G.hud.blips, cones: G.police ? G.police.cones : [], view: this.mapView,
    });
  }

  // ---- safehouse wardrobe -----------------------------------------------------------
  wardrobe() {
    const pl = G.player;
    const rows = Object.keys(OUTFITS).map((k) => `<div class="row"><label>${k[0].toUpperCase() + k.slice(1)}</label><div class="picker" data-k="${k}"><button data-d="-1">‹</button><span></span><button data-d="1">›</button></div></div>`).join('');
    const d = this.mount(`<div class="panel"><h2>CONTEXT WINDOW LOFTS</h2><p>Your safehouse. Change your look, wait out the clock, or save.</p>
      <h3>Wardrobe</h3>${rows}
      <h3>Rest</h3>
      <button class="btn" id="eve">REST UNTIL NIGHTFALL <small>20:30</small></button>
      <button class="btn" id="mor">REST UNTIL MORNING <small>08:00</small></button>
      <button class="btn" id="save">SAVE GAME</button>
      <button class="btn primary" id="done">DONE</button></div>`, 'clear');
    this.kind = 'wardrobe';
    const paint = () => d.querySelectorAll('.picker').forEach((p) => { const k = p.dataset.k; p.querySelector('span').textContent = OUTFITS[k][pl.outfit[k] % OUTFITS[k].length][0]; });
    d.querySelectorAll('.picker button').forEach((b) => b.addEventListener('click', () => {
      const k = b.parentElement.dataset.k, n = OUTFITS[k].length;
      pl.outfit[k] = (((Number(pl.outfit[k]) + parseInt(b.dataset.d, 10)) % n) + n) % n;
      pl.applyOutfit(pl.outfit); paint(); this.ui('uiMove');
    }));
    paint();
    const rest = (h) => { this.fadeTo(true); setTimeout(() => { G.env.setHour(h); pl.health = pl.maxHealth; writeSave(); this.fadeTo(false); G.hud.toast(`Rested. It is ${G.env.clockText()}.`); }, 750); };
    this.bind(d, {
      '#eve': () => rest(20.5), '#mor': () => rest(8),
      '#save': (e) => { e.target.textContent = writeSave() ? 'SAVED ✓' : 'COULD NOT SAVE (storage blocked)'; },
      '#done': () => { writeSave(); this.hooks.resume(); },
    });
  }

  // ---- shops -------------------------------------------------------------------
  shop() {
    const W = G.weapons, pl = G.player;
    const items = [
      { id: 'ammo', name: 'Pulse cells ×48', price: 180, ok: () => W.reserve < 300, buy: () => { W.reserve = Math.min(300, W.reserve + 48); } },
      { id: 'emp', name: 'EMP charge', price: 320, ok: () => W.emps < 9, buy: () => { W.emps++; } },
      { id: 'armor', name: 'Field armor (full)', price: 550, ok: () => pl.armor < 100, buy: () => { pl.armor = 100; } },
      { id: 'med', name: 'Med-gel (full health)', price: 140, ok: () => pl.health < pl.maxHealth, buy: () => { pl.health = pl.maxHealth; } },
    ];
    const render = () => {
      const d = this.mount(`<div class="panel"><h2>PROMPT SUPPLY CO.</h2><p>Gadgets, armor and charges. You have <b style="color:var(--amber)">${formatTokens(G.save.tokens)} ◈</b>.</p>
        ${items.map((it) => `<button class="btn" data-id="${it.id}" ${G.save.tokens < it.price || !it.ok() ? 'disabled' : ''}>${it.name}<small>${it.ok() ? formatTokens(it.price) + ' ◈' : 'full'}</small></button>`).join('')}
        <button class="btn primary" id="done">LEAVE</button></div>`);
      this.kind = 'shop';
      d.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => {
        const it = items.find((x) => x.id === b.dataset.id);
        if (G.save.tokens < it.price || !it.ok()) return;
        addTokens(-it.price); it.buy(); G.audio?.play('token'); render();
      }));
      this.bind(d, { '#done': () => { writeSave(); this.hooks.resume(); } });
    };
    render();
  }
  retune() {
    const v = G.player.vehicle, P = G.police;
    const flagged = P.stars > 0;
    const d = this.mount(`<div class="panel"><h2>RE-TUNE GARAGE</h2><p>${v ? `${v.name} · hull ${Math.round(v.healthFrac * 100)}%` : 'Bring a vehicle in.'}${flagged ? (P.seen ? '<br><b style="color:var(--red)">Police have eyes on you. Lose them first.</b>' : '<br>New paint, new plates, clean record.') : ''}</p>
      <button class="btn" id="fix" ${!v || G.save.tokens < 150 || v.healthFrac > 0.98 ? 'disabled' : ''}>REPAIR<small>150 ◈</small></button>
      <button class="btn" id="spray" ${!v || G.save.tokens < 400 || (flagged && P.seen) ? 'disabled' : ''}>RESPRAY${flagged ? ' &amp; CLEAR SAFETY FLAG' : ''}<small>400 ◈</small></button>
      <button class="btn primary" id="done">LEAVE</button></div>`);
    this.kind = 'shop';
    this.bind(d, {
      '#fix': () => { addTokens(-150); v.repair(); v.nitro = 1; G.audio?.play('token'); this.retune(); },
      '#spray': () => {
        addTokens(-400); v.repair(); v.nitro = 1;
        const paints = v.T.paints.length > 1 ? v.T.paints.filter((p) => p !== v.paint) : [0xc8643b, 0xf0e8d8, 0x2ec4b6, 0x7b3fe4, 0xffc145];
        v.paint = paints[Math.floor(Math.random() * paints.length)];
        v.m.baseColor.set(v.paint); v.applyWear();
        if (flagged) P.setStars(0);
        G.audio?.play('token'); this.retune();
      },
      '#done': () => this.hooks.resume(),
    });
  }
}
