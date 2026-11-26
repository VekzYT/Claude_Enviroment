// Conversations: a speaker, a line, and up to four choices. Mouse, keyboard (1-4, Space / E / Enter
// to continue, Esc to leave) and touch all work. While a conversation is open the game runs on in
// 'talk' mode with gameplay input switched off (so the number keys do not change weapons) and the
// camera frames the two people talking.
//
// A node: { who, role, color, text, choices: [{ label, note, disabled, then }], next }
//   then() / next() return the next node, or nothing to end the conversation.
import * as THREE from 'three';
import { G, addPlugin } from '../state.js';
import { Input } from '../input.js';
import { rayBoxes } from '../world/colliders.js';
import { clamp } from '../util/math.js';

const CSS = `
#dlg { position: absolute; left: 50%; bottom: 5.5vh; transform: translateX(-50%); width: min(660px, 92vw); pointer-events: auto; opacity: 0; transition: opacity .18s, transform .18s; }
#dlg.on { opacity: 1; transform: translateX(-50%) translateY(-6px); }
#dlg .box { background: linear-gradient(180deg, rgba(22,21,19,.9), rgba(14,13,12,.92)); border: 1px solid rgba(240,232,216,.16); border-radius: 14px; padding: 16px 20px 14px; box-shadow: 0 14px 40px rgba(0,0,0,.45); backdrop-filter: blur(6px); }
#dlg .who { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
#dlg .who b { font-size: 13px; letter-spacing: .16em; color: var(--c, var(--terracotta)); }
#dlg .who span { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: rgba(240,232,216,.5); }
#dlg .txt { font-size: 18px; line-height: 1.42; color: var(--ivory); min-height: 2.8em; }
#dlg .ch { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
#dlg .ch button { display: flex; align-items: center; gap: 12px; text-align: left; background: rgba(240,232,216,.06); border: 1px solid rgba(240,232,216,.12); color: var(--cream); border-radius: 9px; padding: 9px 12px; font-size: 15px; cursor: pointer; transition: background .12s, border-color .12s; }
#dlg .ch button:hover:not(:disabled), #dlg .ch button.sel { background: rgba(217,119,87,.2); border-color: var(--terracotta); }
#dlg .ch button:disabled { opacity: .42; cursor: default; }
#dlg .ch i { font-style: normal; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; background: var(--cream); color: var(--ink); font-weight: 900; font-size: 12px; flex: none; }
#dlg .ch em { margin-left: auto; font-style: normal; font-size: 13px; color: var(--amber); white-space: nowrap; }
#dlg .more { margin-top: 8px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: rgba(240,232,216,.45); text-align: right; }
body.touch #dlg { bottom: 3vh; width: min(640px, 96vw); }
body.touch #dlg .txt { font-size: 16px; }
body.touch #dlg .ch button { padding: 11px 14px; font-size: 15px; }
body.touch #dlg .ch i { display: none; }
`;

const KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _l = new THREE.Vector3(), _q = new THREE.Quaternion();

class DialogueBox {
  constructor() {
    this.node = null; this.el = null; this.typed = 0; this.full = ''; this.npc = null; this.onClose = null;
    this.armed = false;      // input is read from the frame after it opened (the key that opened it is still down)
    this.shot = null;        // camera framing, eased in
    this.release = 0;        // seconds left of easing back to the game camera
    this.from = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
  }
  get open() { return !!this.node; }

  build() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div');
    this.el.id = 'dlg';
    this.el.innerHTML = '<div class="box"><div class="who"><b></b><span></span></div><div class="txt"></div><div class="ch"></div><div class="more"></div></div>';
    document.getElementById('ui').appendChild(this.el);
    this.el.style.display = 'none';
    // a tap or click on the line itself finishes it or moves on
    this.el.querySelector('.txt').addEventListener('click', () => this.advance());
    this.el.querySelector('.more').addEventListener('click', () => this.advance());
  }

  // Start a conversation. opts: { npc: the person spoken to (framed by the camera), onClose }
  start(node, opts = {}) {
    if (!node) return;
    if (!this.el) this.build();
    this.npc = opts.npc || null; this.onClose = opts.onClose || null;
    G.mode = 'talk';
    Input.unlock();
    this.shot = null; this.release = 0;
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('on'));
    this.show(node);
  }
  show(node) {
    this.node = node;
    this.armed = false;
    const E = this.el;
    E.style.setProperty('--c', node.color || '');
    E.querySelector('.who b').textContent = node.who || '';
    E.querySelector('.who span').textContent = node.role || '';
    this.full = node.text || ''; this.typed = 0;
    E.querySelector('.txt').textContent = '';
    const ch = E.querySelector('.ch');
    ch.innerHTML = '';
    (node.choices || []).forEach((c, i) => {
      const b = document.createElement('button');
      b.disabled = !!c.disabled;
      b.innerHTML = `<i>${i + 1}</i><span></span>${c.note ? '<em></em>' : ''}`;
      b.querySelector('span').textContent = c.label;
      if (c.note) b.querySelector('em').textContent = c.note;
      b.addEventListener('click', (e) => { e.stopPropagation(); this.choose(i); });
      ch.appendChild(b);
    });
    ch.style.display = 'none';
    E.querySelector('.more').textContent = '';
    G.audio?.play('chatter', { volume: 0.35 });
  }
  get typing() { return this.typed < this.full.length; }
  finishTyping() {
    this.typed = this.full.length;
    this.el.querySelector('.txt').textContent = this.full;
    const has = (this.node.choices || []).length > 0;
    this.el.querySelector('.ch').style.display = has ? '' : 'none';
    this.el.querySelector('.more').textContent = has ? '' : Input.touch.on ? 'Tap to continue' : 'Space · continue';
  }
  advance() {
    if (!this.node) return;
    if (this.typing) { this.finishTyping(); return; }
    if ((this.node.choices || []).length) return;
    G.audio?.play('uiMove');
    this.go(this.node.next ? this.node.next() : null);
  }
  choose(i) {
    if (!this.node || this.typing) { if (this.node) this.finishTyping(); return; }
    const c = (this.node.choices || [])[i];
    if (!c || c.disabled) return;
    G.audio?.play('uiSelect');
    this.go(c.then ? c.then() : null);
  }
  go(next) {
    // a choice can close the conversation by opening something else (a menu, the mini-game)
    if (!this.node) return;
    if (next) { this.show(next); return; }
    this.close();
  }
  close() {
    if (!this.node) return;
    this.node = null;
    this.el.classList.remove('on');
    setTimeout(() => { if (!this.node) this.el.style.display = 'none'; }, 200);
    if (G.mode === 'talk') {
      G.mode = 'play';
      // a key or click a moment ago still counts as the gesture pointer lock needs (Esc does not: then
      // a click on the game locks it, as after any menu)
      Input.lock();
    }
    if (this.shot) { this.release = 0.45; this.from.p.copy(G.camera.position); this.from.q.copy(G.camera.quaternion); }
    const cb = this.onClose; this.onClose = null; this.npc = null;
    if (cb) cb();
  }

  update(dt) {
    if (!this.node) return;
    if (this.typing) {
      this.typed = Math.min(this.full.length, this.typed + dt * 70);
      this.el.querySelector('.txt').textContent = this.full.slice(0, Math.floor(this.typed));
      if (!this.typing) this.finishTyping();
    }
    if (!this.armed) { this.armed = true; return; }
    if (Input.rawHit('Escape')) { this.close(); return; }
    for (let i = 0; i < KEYS.length; i++) if (Input.rawHit(KEYS[i], 'Numpad' + (i + 1))) { this.choose(i); return; }
    if (Input.rawHit('Space', 'Enter', 'KeyE')) this.advance();
  }

  // Over the player's shoulder towards whoever they are talking to.
  frame(dt) {
    const cam = G.camera, pl = G.player;
    if (this.node && this.npc && !this.npc.removed) {
      const n = this.npc;
      _a.set(pl.pos.x, pl.pos.y + 1.55, pl.pos.z);
      _b.set(n.pos.x, n.pos.y + (n.act === 'sit' || n.act === 'sitPhone' ? n.seatH + 0.75 : 1.5), n.pos.z);
      const dx = _b.x - _a.x, dz = _b.z - _a.z, d = Math.hypot(dx, dz) || 1;
      const fx = dx / d, fz = dz / d;
      // behind and to the right of the player, a little above eye level
      const back = 1.25 + d * 0.35, side = 0.62;
      const ox = -fx * back + -fz * side, oz = -fz * back + fx * side;
      const ol = Math.hypot(ox, 0.28, oz);
      const hit = rayBoxes(_a.x, _a.y, _a.z, ox / ol, 0.28 / ol, oz / ol, ol + 0.3);
      const k = Math.min(1, Math.max(0.35, (hit - 0.3) / ol));
      _p.set(_a.x + ox * k, _a.y + 0.28 * k, _a.z + oz * k);
      _l.set(_a.x * 0.35 + _b.x * 0.65, _a.y * 0.3 + _b.y * 0.7 - 0.05, _a.z * 0.35 + _b.z * 0.65);
      if (!this.shot) { this.shot = { t: 0 }; this.from.p.copy(cam.position); this.from.q.copy(cam.quaternion); }
      this.shot.t = Math.min(1, this.shot.t + dt / 0.5);
      const e = this.shot.t * this.shot.t * (3 - 2 * this.shot.t);
      cam.position.copy(_p); cam.lookAt(_l); _q.copy(cam.quaternion);
      cam.position.lerpVectors(this.from.p, _p, e);
      cam.quaternion.slerpQuaternions(this.from.q, _q, e);
      if (Math.abs(cam.fov - 50) > 0.05) { cam.fov += (50 - cam.fov) * clamp(dt * 6, 0, 1); cam.updateProjectionMatrix(); }
      // leave the game camera looking the same way, so it carries on from here afterwards
      G.cam.yaw = Math.atan2(_b.x - _p.x, _b.z - _p.z);
      return;
    }
    if (this.release > 0) {
      this.release = Math.max(0, this.release - dt);
      const e = 1 - this.release / 0.45, s = e * e * (3 - 2 * e);
      _p.copy(cam.position); _q.copy(cam.quaternion);
      cam.position.lerpVectors(this.from.p, _p, s);
      cam.quaternion.slerpQuaternions(this.from.q, _q, s);
      if (!this.release) this.shot = null;
    }
  }
}

export const Dialogue = new DialogueBox();

addPlugin({
  lateUpdate(dt) {
    Dialogue.update(dt);
    Dialogue.frame(dt);
  },
});
