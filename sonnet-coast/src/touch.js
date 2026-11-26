// Touch controls: a thumb stick on the left, drag-to-look everywhere else, and icon buttons that press
// the same keys the keyboard does, so the rest of the game never needs to know which one is in use.
import { G } from './state.js';
import { Input } from './input.js';

const STICK_R = 56;      // px the knob can travel
const LOOK = 2.3;        // look-drag gain over a mouse
const SPRINT_AT = 0.93;  // stick deflection that turns a walk into a sprint

// ---- icons: 24×24 line drawings, stroked in the button's text colour ------------------------------
const I = {
  pause: '<path d="M8.5 5v14M15.5 5v14" stroke-width="3"/>',
  map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  cam: '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M15 10.5l6-3v9l-6-3"/>',
  aim: '<circle cx="12" cy="12" r="7.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  jump: '<path d="M12 17V5M6.5 10.5L12 5l5.5 5.5"/><path d="M5 21h14"/>',
  swap: '<path d="M19.5 9A8 8 0 005 7.5M4.5 15A8 8 0 0019 16.5"/><path d="M5 3v4.5h4.5M19 21v-4.5h-4.5"/>',
  car: '<path d="M3 15.5v-3l2-5h9.5l4 4 2.5 1v3"/><circle cx="7.5" cy="16" r="2.1"/><circle cx="16.5" cy="16" r="2.1"/><path d="M9.6 16h4.8M8 11.5h7"/>',
  exit: '<path d="M12 4H6v16h6"/><path d="M10.5 12H21M17 8l4 4-4 4"/>',
  use: '<path d="M9 12V5.5a1.5 1.5 0 013 0V11"/><path d="M12 9.8a1.5 1.5 0 013 0V12M15 10.8a1.5 1.5 0 013 0V15c0 3.5-2.4 6-6 6-2.6 0-4.2-1.100-5.600-3.500L4.300 14.200a1.500 1.500 0 012.500-1.600L9 15"/>',
  gas: '<path d="M6 13l6-7 6 7"/><path d="M6 19.5l6-7 6 7"/>',
  brake: '<path d="M6 11l6 7 6-7"/><path d="M6 4.5l6 7 6-7"/>',
  drift: '<circle cx="12" cy="12" r="6.5"/><path d="M12 8.500v4.500"/><circle cx="12" cy="15.600" r=".9" fill="currentColor" stroke="none"/><path d="M4 6.500a10 10 0 000 11M20 6.500a10 10 0 010 11"/>',
  nitro: '<path d="M12 3c.5 3.500 5 5.500 5 10.500a5 5 0 01-10 0c0-2 .8-3.300 2-4.500 0 2 .8 3 2 3 .3-3-1-5.500 1-9z"/>',
  radio: '<path d="M9 18V6l10-2v12"/><circle cx="6.500" cy="18" r="2.500"/><circle cx="16.500" cy="16" r="2.500"/>',
  horn: '<path d="M3.500 10v4h3l6.500 4V6l-6.500 4z"/><path d="M16.500 9.500a3.500 3.500 0 010 5M19 7a7 7 0 010 10"/>',
  siren: '<path d="M7 18v-5a5 5 0 0110 0v5"/><path d="M4.500 18h15v3h-15z"/><path d="M12 3v2M4.500 6l1.500 1.500M19.500 6L18 7.500"/>',
  scan: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.500"/><path d="M12 12l6.300-6.300"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  back: '<path d="M9 6.500L4 11.500l5 5"/><path d="M4 11.500h10.500a5.500 5.500 0 015.500 5.500v1"/>',
  // what the action button does depends on what is in your hand
  fists: '<path d="M7.500 11V7.800a1.600 1.600 0 013.200 0V7a1.600 1.600 0 013.200 0v.800a1.600 1.600 0 013.200 0v1.400a1.600 1.600 0 013.100.500V14c0 4-2.800 7-6.700 7-4 0-7-2.500-7-6.500v-2a1.500 1.500 0 011-1.500z"/><path d="M7.500 11c1.800 0 3.200 1 3.200 2.800"/>',
  baton: '<path d="M4.500 19.500L15 9"/><path d="M13.200 7.200l3.600 3.600"/><path d="M18.500 2.500l.8 2.200 2.200.8-2.200.8-.8 2.200-.8-2.200-2.200-.8 2.200-.8z"/>',
  pistol: '<path d="M3 7h17.500v4.200H12l-1.200 2.300H8.600L7.600 18.500H4L5.300 11.200H3z"/><path d="M12 11.200v2.300"/>',
  emp: '<circle cx="12" cy="12" r="8.500"/><path d="M13.200 6l-4.200 6.800h4.200L11 18.500"/>',
  hack: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7.500 10l3 2.200-3 2.200M13 14.500h3.500"/>',
};
const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[name]}</svg>`;
const FIRE_CAP = { fists: 'PUNCH', baton: 'STRIKE', pistol: 'FIRE', emp: 'THROW', hack: 'HACK' };

// The HUD's key prompts show the matching button's icon instead of a keyboard letter.
const KEY_ICON = { E: 'use', F: 'car', G: 'scan' };
export function touchKeys(html) {
  if (!Input.touch.on || !html) return html;
  return html.replace(/<kbd>([EFG])<\/kbd>/g, (m, k) => `<kbd class="ki">${svg(k === 'F' && G.player && G.player.vehicle ? 'exit' : KEY_ICON[k])}</kbd>`);
}

// id, icon, caption, what it presses, and where it shows: f = on foot, c = in a vehicle, s = always
const BUTTONS = [
  { id: 'pause', icon: 'pause', key: 'Escape', on: 's' },
  { id: 'map', icon: 'map', key: 'KeyM', on: 's' },
  { id: 'cam', icon: 'cam', key: 'KeyV', on: 's' },
  { id: 'mini', key: 'KeyM', on: 's' },   // tapping the minimap opens the map too
  { id: 'fire', icon: 'fists', cap: 'PUNCH', mouse: 'left', look: true, on: 'fch', when: (c, w) => c === 'f' || w === 'pistol' || w === 'emp' || w === 'hack' },
  { id: 'aim', icon: 'aim', cap: 'AIM', toggle: 'right', on: 'f', when: (c, w) => w === 'pistol' || w === 'emp' },
  { id: 'jump', icon: 'jump', cap: 'JUMP', key: 'Space', on: 'f' },
  { id: 'wpn', icon: 'swap', cap: 'WEAPON', wheel: 1, on: 'fch' },
  { id: 'enter', icon: 'car', cap: 'GET IN', key: 'KeyF', on: 'fc', when: (c) => c === 'c' || !!G.player.nearestVehicle() },
  { id: 'use', icon: 'use', cap: 'USE', key: 'KeyE', on: 'fch', when: () => G.interact.active },
  { id: 'gas', icon: 'gas', cap: 'GAS', key: 'KeyW', on: 'c' },
  { id: 'brake', icon: 'brake', cap: 'BRAKE', key: 'KeyS', on: 'c' },
  { id: 'hb', icon: 'drift', cap: 'DRIFT', key: 'Space', on: 'c' },
  { id: 'n2o', icon: 'nitro', cap: 'NITRO', key: 'ShiftLeft', on: 'c' },
  { id: 'radio', icon: 'radio', cap: 'RADIO', key: 'KeyR', on: 'c' },
  { id: 'horn', icon: 'horn', cap: 'HORN', key: 'KeyH', on: 'c' },
  { id: 'back', icon: 'back', cap: 'BEHIND', key: 'KeyC', on: 'c' },
  { id: 'scan', icon: 'scan', cap: 'SCAN', key: 'KeyG', on: 'c', when: () => !!G.player.vehicle?.isPolice },
];

// Feature modules can add buttons (same shape as above; `on` may use any context letters) and
// override how the current context letter is chosen. Call before the game boots.
export function addTouchButtons(list) { BUTTONS.push(...list); }
let contextOf = (pl) => (pl && pl.vehicle ? 'c' : 'f');
export function setTouchContext(fn) { contextOf = fn; }

const state = { stickId: null, lookId: null, sx: 0, sy: 0, lx: 0, ly: 0, sprint: false, mag: 0, moved: false, looked: false, hintT: 0 };
const held = new Map();   // touch identifier -> button
let root = null, base = null, knob = null, btns = null, hintMove = null, hintLook = null;
let shown = null, ctx = '', weapon = '', police = null, size = 0;
const els = {};
const portrait = window.matchMedia ? window.matchMedia('(orientation: portrait)') : { matches: false };

function buzz(ms = 8) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* no haptics here */ } }
function face(b, icon, cap) {
  if (b.icon === icon && b.cap === cap) return;
  b.icon = icon; b.cap = cap;
  els[b.id].innerHTML = `${svg(icon)}${cap ? `<small>${cap}</small>` : ''}`;
}
function press(b, t) {
  held.set(t.identifier, { b, x: t.clientX, y: t.clientY });
  els[b.id].classList.add('down');
  buzz(b.id === 'fire' ? 12 : 8);
  if (b.key) Input._press(b.key);
  if (b.mouse === 'left') { Input.mouse.left = true; Input.mouse.leftPressed = true; }
  if (b.wheel) Input.mouse.wheel += b.wheel;
  if (b.toggle) { Input.mouse.right = !Input.mouse.right; els[b.id].classList.toggle('on', Input.mouse.right); }
}
function release(id) {
  const h = held.get(id);
  if (!h) return;
  held.delete(id);
  const b = h.b;
  els[b.id].classList.remove('down');
  // another finger may still be on a button that holds the same key
  if (b.key && ![...held.values()].some((o) => o.b.key === b.key)) Input._release(b.key);
  if (b.mouse === 'left') Input.mouse.left = false;
}
// The stick sits in the corner until a thumb lands, then recentres under it.
function rest() {
  if (!base || state.stickId !== null) return;
  state.sx = 96; state.sy = window.innerHeight - 80;
  base.style.left = `calc(${state.sx}px + env(safe-area-inset-left, 0px))`; base.style.top = `${state.sy}px`;
  knob.style.transform = '';
  base.classList.remove('live');
}
function stick(x, y) {
  let dx = x - state.sx, dy = y - state.sy;
  const l = Math.hypot(dx, dy);
  if (l > STICK_R) { dx *= STICK_R / l; dy *= STICK_R / l; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  const mx = dx / STICK_R, mz = -dy / STICK_R;
  const dead = 0.14;
  Input.touch.mx = Math.abs(mx) < dead ? 0 : mx;
  Input.touch.mz = Math.abs(mz) < dead ? 0 : mz;
  state.mag = Math.min(1, l / STICK_R);
  if (state.mag > 0.4) state.moved = true;
}
function dropStick() {
  state.stickId = null; state.mag = 0;
  Input.touch.mx = 0; Input.touch.mz = 0;
  rest();
}
function releaseAll() {
  for (const id of [...held.keys()]) release(id);
  dropStick();
  state.lookId = null;
  if (state.sprint) { Input._release('ShiftLeft'); state.sprint = false; }
  Input.mouse.left = false; Input.mouse.right = false;
  if (els.aim) els.aim.classList.remove('on');
}

function onStart(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const el = t.target.closest ? t.target.closest('[data-b]') : null;
    if (el) { press(BUTTONS.find((b) => b.id === el.dataset.b), t); continue; }
    const w = window.innerWidth, h = window.innerHeight;
    if (state.stickId === null && t.clientX < w * 0.42 && t.clientY > h * 0.3) {
      state.stickId = t.identifier;
      state.sx = Math.max(STICK_R + 14, t.clientX); state.sy = Math.min(h - STICK_R - 14, t.clientY);
      base.style.left = `${state.sx}px`; base.style.top = `${state.sy}px`;
      base.classList.add('live');
      stick(t.clientX, t.clientY);
    } else if (state.lookId === null) { state.lookId = t.identifier; state.lx = t.clientX; state.ly = t.clientY; }
  }
}
function look(dx, dy) {
  Input.mouse.dx += dx * LOOK; Input.mouse.dy += dy * LOOK;
  if (Math.abs(dx) + Math.abs(dy) > 3) state.looked = true;
}
function onMove(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === state.stickId) stick(t.clientX, t.clientY);
    else if (t.identifier === state.lookId) { look(t.clientX - state.lx, t.clientY - state.ly); state.lx = t.clientX; state.ly = t.clientY; }
    else {
      // a finger resting on the action button can still drag the aim
      const h = held.get(t.identifier);
      if (h && h.b.look) { look(t.clientX - h.x, t.clientY - h.y); h.x = t.clientX; h.y = t.clientY; }
    }
  }
}
function onEnd(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === state.stickId) dropStick();
    else if (t.identifier === state.lookId) state.lookId = null;
    else release(t.identifier);
  }
}

export const Touch = {
  hooks: { pause: null },
  icon: svg,
  get on() { return Input.touch.on; },
  // Called once at boot. Touch mode turns on for phones and tablets, on the first touch anywhere,
  // or with ?touch=1 (and stays off with ?touch=0).
  init(ui, params) {
    const want = params.get('touch');
    if (want === '0') return;
    const coarse = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (want === '1' || coarse) this.enable(ui);
    else window.addEventListener('touchstart', () => this.enable(ui), { once: true, passive: true });
  },
  enable(ui) {
    if (Input.touch.on) return;
    Input.touch.on = true;
    document.body.classList.add('touch');
    root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = `<div id="t-stick"><i></i></div>
      <div class="t-hint" id="t-hint-move">MOVE</div><div class="t-hint" id="t-hint-look">DRAG TO LOOK</div>
      <div id="t-btns">${BUTTONS.map((b) => `<div class="tb" id="t-${b.id}" data-b="${b.id}">${b.icon ? svg(b.icon) : ''}${b.cap ? `<small>${b.cap}</small>` : ''}</div>`).join('')}</div>`;
    ui.appendChild(root);
    const rot = document.createElement('div');
    rot.id = 'rotate';
    rot.innerHTML = `<div>${svg('swap')}Turn your phone sideways to play</div>`;
    document.body.appendChild(rot);
    base = root.querySelector('#t-stick'); knob = base.firstChild;
    btns = root.querySelector('#t-btns');
    hintMove = root.querySelector('#t-hint-move'); hintLook = root.querySelector('#t-hint-look');
    for (const b of BUTTONS) els[b.id] = root.querySelector(`#t-${b.id}`);
    const opt = { passive: false };
    root.addEventListener('touchstart', onStart, opt);
    root.addEventListener('touchmove', onMove, opt);
    root.addEventListener('touchend', onEnd, opt);
    root.addEventListener('touchcancel', onEnd, opt);
    window.addEventListener('resize', rest);
    // nothing on the page should scroll, zoom or pop a callout while playing
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    rest();
    if (G.mode === 'play') Input.mouse.locked = true;
  },
  // Fullscreen, landscape and a screen that stays awake, where the browser allows it (it must be
  // asked from inside a tap).
  fullscreen() {
    if (!Input.touch.on) return;
    try {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req && !document.fullscreenElement) {
        const p = req.call(el, { navigationUI: 'hide' });
        const lock = () => { try { const q = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (q && q.catch) q.catch(() => {}); } catch (e) { /* not allowed here */ } };
        if (p && p.then) p.then(lock).catch(() => {}); else lock();
      }
      if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').catch(() => {});
    } catch (e) { /* not allowed here */ }
  },
  // Every frame: show the right buttons, with the right faces, for what the player is doing.
  update(dt = 0.016) {
    if (!Input.touch.on) return;
    const play = G.mode === 'play';
    if (play !== shown) {
      shown = play;
      root.style.display = play ? '' : 'none';
      if (!play) releaseAll(); else rest();
    }
    if (!play) return;
    if (portrait.matches && this.hooks.pause) { this.hooks.pause(); return; }   // phone was turned upright
    const pl = G.player, v = pl.vehicle;
    const c = contextOf(pl);
    const w = G.weapons ? G.weapons.current.id : 'fists';
    if (c !== ctx) {
      ctx = c;
      document.body.classList.toggle('in-car', c === 'c');
      // a finger left on a button that is about to vanish would otherwise hold its key forever
      for (const [id, h] of [...held]) if (!h.b.on.includes(c) && h.b.on !== 's') release(id);
      if (c === 'c' && Input.mouse.right) { Input.mouse.right = false; els.aim.classList.remove('on'); }
      const enter = BUTTONS.find((b) => b.id === 'enter');
      face(enter, c === 'c' ? 'exit' : 'car', c === 'c' ? 'GET OUT' : 'GET IN');
      police = null;
    }
    if (w !== weapon) {
      weapon = w;
      face(BUTTONS.find((b) => b.id === 'fire'), w, FIRE_CAP[w]);
      if (w !== 'pistol' && w !== 'emp' && Input.mouse.right) { Input.mouse.right = false; els.aim.classList.remove('on'); }
    }
    if (v && police !== !!v.isPolice) { police = !!v.isPolice; face(BUTTONS.find((b) => b.id === 'horn'), police ? 'siren' : 'horn', police ? 'SIREN' : 'HORN'); }
    for (const b of BUTTONS) {
      const vis = (b.on === 's' || b.on.includes(c)) && (!b.when || b.when(c, w));
      if (b.vis !== vis) { b.vis = vis; els[b.id].style.display = vis ? '' : 'none'; if (!vis) for (const [id, h] of [...held]) if (h.b === b) release(id); }
    }
    // the amber "use" button pulses so it gets noticed; nitro dims when the tank is empty
    if (v) els.n2o.classList.toggle('dim', v.nitro < 0.05);
    const s = G.settings.touchSize || 1;
    if (s !== size) { size = s; btns.style.zoom = String(s); }
    // first-run hints fade once each has been tried (or after a while)
    state.hintT += dt;
    hintMove.classList.toggle('gone', state.moved || state.hintT > 20);
    if (hintMove.dataset.c !== c) { hintMove.dataset.c = c; hintMove.textContent = c === 'c' ? 'STEER' : 'MOVE'; }
    hintLook.classList.toggle('gone', state.looked || state.hintT > 20 || c === 'c');
    // in a vehicle the stick only steers; on foot a full push is a sprint
    if (c === 'c') Input.touch.mz = 0;
    const sprint = c === 'f' && state.stickId !== null && state.mag > SPRINT_AT;
    if (sprint !== state.sprint) { state.sprint = sprint; if (sprint) Input._press('ShiftLeft'); else Input._release('ShiftLeft'); }
  },
};
