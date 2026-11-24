// Keyboard + mouse (pointer lock) input with "pressed this frame" tracking.
import { G } from './state.js';

const down = new Set();
const pressed = new Set();
const mouse = { dx: 0, dy: 0, wheel: 0, left: false, right: false, leftPressed: false, rightPressed: false, locked: false, x: 0, y: 0 };
let canvas = null;
let enabled = true;

const GAME_KEYS = new Set(['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyF', 'Slash', 'Quote']);

export const Input = {
  mouse,
  init(el) {
    canvas = el;
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (GAME_KEYS.has(e.code) || (mouse.locked && e.code !== 'F11' && e.code !== 'F12')) e.preventDefault();
      if (!e.repeat) pressed.add(e.code);
      down.add(e.code);
    });
    window.addEventListener('keyup', (e) => { down.delete(e.code); });
    window.addEventListener('blur', () => { down.clear(); mouse.left = mouse.right = false; });
    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (!mouse.locked) return;
      mouse.dx += e.movementX || 0;
      mouse.dy += e.movementY || 0;
    });
    canvas.addEventListener('mousedown', (e) => {
      if (!mouse.locked) return;
      if (e.button === 0) { mouse.left = true; mouse.leftPressed = true; }
      if (e.button === 2) { mouse.right = true; mouse.rightPressed = true; }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) mouse.left = false;
      if (e.button === 2) mouse.right = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('wheel', (e) => { if (mouse.locked) mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
    document.addEventListener('pointerlockchange', () => {
      mouse.locked = document.pointerLockElement === canvas;
      if (!mouse.locked) { mouse.left = mouse.right = false; if (Input.onUnlock) Input.onUnlock(); }
    });
  },
  lock() {
    if (!canvas || mouse.locked) return;
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
  },
  unlock() { if (mouse.locked) document.exitPointerLock(); },
  setEnabled(v) { enabled = v; },
  key(code) { return enabled && down.has(code); },
  any(...codes) { if (!enabled) return false; for (const c of codes) if (down.has(c)) return true; return false; },
  hit(...codes) { if (!enabled) return false; for (const c of codes) if (pressed.has(c)) return true; return false; },
  // Raw versions ignore the enabled flag (menus use these).
  rawHit(...codes) { for (const c of codes) if (pressed.has(c)) return true; return false; },
  rawKey(code) { return down.has(code); },
  axis(neg, pos, neg2, pos2) {
    if (!enabled) return 0;
    return (down.has(pos) || down.has(pos2) ? 1 : 0) - (down.has(neg) || down.has(neg2) ? 1 : 0);
  },
  // Call at the end of each frame.
  endFrame() {
    pressed.clear();
    mouse.dx = 0; mouse.dy = 0; mouse.wheel = 0;
    mouse.leftPressed = false; mouse.rightPressed = false;
  },
  // Test hooks
  _press(code) { pressed.add(code); down.add(code); },
  _release(code) { down.delete(code); },
};
