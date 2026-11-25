// Touch controls: a floating stick on the left, drag-to-look everywhere else, and buttons that press the
// same keys the keyboard does, so the rest of the game never needs to know which one is in use.
import { G } from './state.js';
import { Input } from './input.js';

const STICK_R = 56;      // px the knob can travel
const LOOK = 2.3;        // look-drag gain over a mouse
const SPRINT_AT = 0.93;  // stick deflection that turns a walk into a sprint

// id, label, caption, what it presses, and where it shows: f = on foot, c = in a vehicle, s = always
const BUTTONS = [
  { id: 'pause', text: 'II', key: 'Escape', on: 's' },
  { id: 'map', text: 'MAP', key: 'KeyM', on: 's' },
  { id: 'cam', text: 'CAM', key: 'KeyV', on: 's' },
  { id: 'fire', text: '◎', cap: 'FIRE', mouse: 'left', look: true, on: 'fc' },
  { id: 'aim', text: '⌖', cap: 'AIM', toggle: 'right', on: 'f' },
  { id: 'jump', text: '⤒', cap: 'JUMP', key: 'Space', on: 'f' },
  { id: 'wpn', text: '⟳', cap: 'WEAPON', wheel: 1, on: 'fc' },
  { id: 'enter', text: 'F', cap: 'VEHICLE', key: 'KeyF', on: 'fc' },
  { id: 'use', text: 'E', cap: 'USE', key: 'KeyE', on: 'fc', when: () => G.interact.active },
  { id: 'gas', text: '▲', cap: 'GAS', key: 'KeyW', on: 'c' },
  { id: 'brake', text: '▼', cap: 'BRAKE', key: 'KeyS', on: 'c' },
  { id: 'hb', text: '◐', cap: 'DRIFT', key: 'Space', on: 'c' },
  { id: 'n2o', text: '»', cap: 'NITRO', key: 'ShiftLeft', on: 'c' },
  { id: 'radio', text: 'R', cap: 'RADIO', key: 'KeyR', on: 'c' },
  { id: 'horn', text: 'H', cap: 'HORN', key: 'KeyH', on: 'c' },
  { id: 'scan', text: 'G', cap: 'SCAN', key: 'KeyG', on: 'c', when: () => !!G.player.vehicle?.isPolice },
];

const state = { stickId: null, lookId: null, sx: 0, sy: 0, lx: 0, ly: 0, sprint: false };
const held = new Map();   // touch identifier -> button
let root = null, base = null, knob = null, shown = null, ctx = '';
const els = {};

function press(b, t) {
  held.set(t.identifier, { b, x: t.clientX, y: t.clientY });
  els[b.id].classList.add('down');
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
}
function dropStick() {
  state.stickId = null; state.mag = 0;
  Input.touch.mx = 0; Input.touch.mz = 0;
  if (base) base.style.opacity = '0';
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
    if (state.stickId === null && t.clientX < w * 0.42 && t.clientY > h * 0.28) {
      state.stickId = t.identifier;
      state.sx = Math.max(STICK_R + 14, t.clientX); state.sy = Math.min(h - STICK_R - 14, t.clientY);
      base.style.left = `${state.sx}px`; base.style.top = `${state.sy}px`; base.style.opacity = '1';
      stick(t.clientX, t.clientY);
    } else if (state.lookId === null) { state.lookId = t.identifier; state.lx = t.clientX; state.ly = t.clientY; }
  }
}
function onMove(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === state.stickId) stick(t.clientX, t.clientY);
    else if (t.identifier === state.lookId) {
      Input.mouse.dx += (t.clientX - state.lx) * LOOK; Input.mouse.dy += (t.clientY - state.ly) * LOOK;
      state.lx = t.clientX; state.ly = t.clientY;
    } else {
      // a finger resting on FIRE can still drag the aim
      const h = held.get(t.identifier);
      if (h && h.b.look) { Input.mouse.dx += (t.clientX - h.x) * LOOK; Input.mouse.dy += (t.clientY - h.y) * LOOK; h.x = t.clientX; h.y = t.clientY; }
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
    root.innerHTML = `<div id="t-stick"><i></i></div>${BUTTONS.map((b) => `<div class="tb" id="t-${b.id}" data-b="${b.id}"><b>${b.text}</b>${b.cap ? `<small>${b.cap}</small>` : ''}</div>`).join('')}`;
    ui.appendChild(root);
    const rot = document.createElement('div');
    rot.id = 'rotate';
    rot.innerHTML = '<div><b>⟳</b>Turn your phone sideways to play</div>';
    document.body.appendChild(rot);
    base = root.querySelector('#t-stick'); knob = base.firstChild;
    for (const b of BUTTONS) els[b.id] = root.querySelector(`#t-${b.id}`);
    const opt = { passive: false };
    root.addEventListener('touchstart', onStart, opt);
    root.addEventListener('touchmove', onMove, opt);
    root.addEventListener('touchend', onEnd, opt);
    root.addEventListener('touchcancel', onEnd, opt);
    // nothing on the page should scroll, zoom or pop a callout while playing
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    if (G.mode === 'play') Input.mouse.locked = true;
  },
  // Fullscreen and landscape where the browser allows it (it must be asked from inside a tap).
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
    } catch (e) { /* not allowed here */ }
  },
  // Every frame: show the right set of buttons for what the player is doing.
  update() {
    if (!Input.touch.on) return;
    const play = G.mode === 'play';
    if (play !== shown) {
      shown = play;
      root.style.display = play ? '' : 'none';
      if (!play) releaseAll();
    }
    if (!play) return;
    const pl = G.player;
    const c = pl && pl.vehicle ? 'c' : 'f';
    if (c !== ctx) {
      ctx = c;
      document.body.classList.toggle('in-car', c === 'c');
      // a finger left on a button that is about to vanish would otherwise hold its key forever
      for (const [id, h] of [...held]) if (!h.b.on.includes(c) && h.b.on !== 's') release(id);
      if (c === 'c' && Input.mouse.right) { Input.mouse.right = false; els.aim.classList.remove('on'); }
    }
    for (const b of BUTTONS) {
      const vis = (b.on === 's' || b.on.includes(c)) && (!b.when || b.when());
      if (b.vis !== vis) { b.vis = vis; els[b.id].style.display = vis ? '' : 'none'; if (!vis) for (const [id, h] of [...held]) if (h.b === b) release(id); }
    }
    // in a vehicle the stick only steers; on foot a full push is a sprint
    if (c === 'c') Input.touch.mz = 0;
    const sprint = c === 'f' && state.stickId !== null && state.mag > SPRINT_AT;
    if (sprint !== state.sprint) { state.sprint = sprint; if (sprint) Input._press('ShiftLeft'); else Input._release('ShiftLeft'); }
  },
};
