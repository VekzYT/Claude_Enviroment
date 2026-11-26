// "Take the decks": a short rhythm game at the club. Pads light up on the beat of the music that
// is playing; hit them in time (A S W D or the arrow keys, or tap the pads on a phone) to keep
// the dance floor going. Pays Tokens by how well you did.
import * as THREE from 'three';
import { G, emit } from '../state.js';
import { Input } from '../input.js';
import { addTokens, writeSave } from '../save.js';

const CSS = `
#rhythm { position: absolute; left: 50%; bottom: 4vh; transform: translateX(-50%); width: min(460px, 92vw); pointer-events: auto; display: none; }
#rhythm.on { display: block; }
#rhythm .top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; text-shadow: 0 1px 3px rgba(0,0,0,.8); }
#rhythm .top b { font-size: 30px; font-weight: 900; color: var(--ivory); }
#rhythm .top span { font-size: 13px; letter-spacing: .2em; color: var(--amber); font-weight: 700; }
#rhythm .lanes { position: relative; height: 300px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: linear-gradient(180deg, rgba(12,11,14,0) 0%, rgba(12,11,14,.6) 40%, rgba(12,11,14,.82) 100%); border-radius: 14px; padding: 0 8px; overflow: hidden; }
#rhythm .lane { position: relative; border-left: 1px solid rgba(240,232,216,.06); border-right: 1px solid rgba(240,232,216,.06); }
#rhythm .note { position: absolute; left: 6%; width: 88%; height: 18px; margin-top: -9px; border-radius: 9px; background: var(--c); box-shadow: 0 0 14px var(--c); }
#rhythm .pad { position: absolute; left: 4%; width: 92%; bottom: 14px; height: 48px; border-radius: 12px; border: 2px solid var(--c); background: rgba(12,11,14,.55); display: flex; align-items: center; justify-content: center; color: var(--c); font-weight: 900; font-size: 18px; transition: background .08s, transform .08s; }
#rhythm .pad.hit { background: var(--c); color: #120f14; transform: scale(1.06); }
#rhythm .judge { position: absolute; left: 0; right: 0; top: 38%; text-align: center; font-size: 30px; font-weight: 900; letter-spacing: .1em; opacity: 0; transition: opacity .2s; pointer-events: none; text-shadow: 0 2px 8px rgba(0,0,0,.7); }
#rhythm .judge.on { opacity: 1; transition: none; }
#rhythm .hint { margin-top: 8px; text-align: center; font-size: 12px; letter-spacing: .12em; color: rgba(240,232,216,.6); text-transform: uppercase; }
body.touch #rhythm { width: min(520px, 96vw); }
body.touch #rhythm .lanes { height: 230px; }
body.touch #rhythm .pad { height: 64px; }
`;
const LANES = [
  { keys: ['KeyA', 'ArrowLeft'], label: '←', c: '#ffb347' },
  { keys: ['KeyS', 'ArrowDown'], label: '↓', c: '#2fd6c6' },
  { keys: ['KeyW', 'ArrowUp'], label: '↑', c: '#b48cff' },
  { keys: ['KeyD', 'ArrowRight'], label: '→', c: '#ff5f8a' },
];
const BARS = 12, AHEAD = 2.2;           // song length in bars, and how many beats ahead notes show
const PERFECT = 0.075, GOOD = 0.15;     // seconds either side of the beat
const _p = new THREE.Vector3();

class RhythmGame {
  constructor() { this.on = false; this.pending = null; this.hype = 0; this.el = null; }

  build() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = document.createElement('div');
    el.id = 'rhythm';
    el.innerHTML = `<div class="top"><span class="combo"></span><b class="score">0</b></div>
      <div class="lanes">${LANES.map((L, i) => `<div class="lane" data-i="${i}" style="--c:${L.c}"><div class="pad">${L.label}</div></div>`).join('')}<div class="judge"></div></div>
      <div class="hint"></div>`;
    document.getElementById('ui').appendChild(el);
    this.el = el;
    this.lanes = [...el.querySelectorAll('.lane')];
    this.pads = [...el.querySelectorAll('.pad')];
    // pads take taps and clicks straight away, timed at the moment of the touch
    this.lanes.forEach((ln, i) => ln.addEventListener('pointerdown', (e) => { e.preventDefault(); this.hit(i); }));
    this.judgeEl = el.querySelector('.judge');
  }

  // Asked from a conversation: begins on the next frame, once the conversation has closed.
  start(rooms, room, dancers) { this.pending = { rooms, room, dancers }; }

  begin() {
    const { rooms, room, dancers } = this.pending;
    this.pending = null;
    if (!this.el) this.build();
    this.rooms = rooms; this.room = room; this.dancers = dancers;
    const I = rooms.cur.inst, o = room.origin;
    this.bpm = rooms.bpm;
    // our own clock, lined up once with the music's beat (the radio restarts its bar count per
    // track); the audio clock when the music is really playing, the game clock otherwise
    const b = rooms.beat(), ctx = rooms.radio && rooms.radio.ctx;
    this.clock = { ctx: b !== null && ctx && ctx.state === 'running' ? ctx : null, b0: b ?? 0 };
    this.clock.t0 = this.clock.ctx ? ctx.currentTime : G.time;
    const start = Math.ceil(this.beatNow() + 0.001) + 4;   // one bar to get ready
    this.notes = [];
    let lane = 1, seed = (G.save.interiors.best.danceN || 0) * 977 + 13;
    const r = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let k = 0; k < BARS * 4; k++) {
      const beat = start + k, bar = Math.floor(k / 4);
      lane = (lane + 1 + Math.floor(r() * 3)) % 4;
      this.notes.push({ b: beat, lane, state: 0 });
      // the middle bars add off-beats, the last ones chords
      if (bar >= 4 && bar < 10 && r() < 0.35) this.notes.push({ b: beat + 0.5, lane: (lane + 2) % 4, state: 0 });
      if (bar >= 9 && k % 4 === 0) this.notes.push({ b: beat, lane: (lane + 1 + Math.floor(r() * 3)) % 4, state: 0 });
    }
    this.notes.sort((a, b) => a.b - b.b);
    this.end = start + BARS * 4 + 1;
    this.score = 0; this.combo = 0; this.best = 0; this.hits = 0; this.perfects = 0; this.hype = 0;
    this.max = this.notes.reduce((s, n, i) => s + 100 * (1 + Math.min(i, 20) / 20), 0);
    for (const n of this.notes) {
      n.el = document.createElement('div'); n.el.className = 'note'; n.el.style.display = 'none';
      this.lanes[n.lane].appendChild(n.el);
    }
    // the player steps up to the decks; the DJ steps aside
    const pl = G.player, sp = I.djSpot;
    this.back = { x: pl.pos.x, y: pl.pos.y, z: pl.pos.z, h: pl.heading };
    pl.teleport(o.x + sp.x, o.y + I.stage.y, o.z + sp.z, 0);
    const dj = I.people.find((p) => p.id === 'dj');
    this.dj = dj && dj.p;
    if (this.dj) { this.dj.pos.x = o.x + sp.x + 2.0; this.dj.pos.z = o.z + sp.z - 0.4; this.dj.pose = 'cross'; this.dj.heading = -0.5; }
    G.mode = 'talk';
    Input.unlock();
    this.el.classList.add('on');
    this.el.querySelector('.hint').textContent = Input.touch.on ? 'Tap the pads on the beat' : 'A S W D or arrow keys on the beat · Esc to stop';
    this.on = true;
    this.shot = 0;
    emit('sfx', 'missionStart');
  }

  beatNow() { return this.clock.b0 + ((this.clock.ctx ? this.clock.ctx.currentTime : G.time) - this.clock.t0) * this.bpm / 60; }

  hit(lane) {
    if (!this.on) return;
    const now = this.beatNow(), spb = 60 / this.bpm;
    let best = null, bd = GOOD;
    for (const n of this.notes) {
      if (n.state || n.lane !== lane) continue;
      const d = Math.abs(n.b - now) * spb;
      if (d < bd) { bd = d; best = n; }
      if (n.b - now > 1) break;
    }
    const pad = this.pads[lane];
    pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 90);
    if (!best) { this.miss(true); return; }
    best.state = 1; best.el.remove();
    const perfect = bd < PERFECT;
    this.combo++; this.best = Math.max(this.best, this.combo); this.hits++;
    if (perfect) this.perfects++;
    this.score += Math.round((perfect ? 100 : 55) * (1 + Math.min(this.combo, 20) / 20));
    this.judge(perfect ? 'PERFECT' : 'GOOD', perfect ? '#7dffb0' : '#ffd84a');
    emit('sfx', perfect ? 'checkpoint' : 'uiMove');
    if (this.combo % 10 === 0) this.cheer();
  }
  miss(stray = false) {
    this.combo = 0;
    this.judge(stray ? 'OFF BEAT' : 'MISS', '#ff4d5e');
    if (!stray) emit('sfx', 'uiError');
  }
  judge(text, color) {
    const j = this.judgeEl;
    j.textContent = text; j.style.color = color;
    j.classList.add('on'); clearTimeout(this.jt); this.jt = setTimeout(() => j.classList.remove('on'), 260);
  }
  // the crowd throws its hands up
  cheer() {
    emit('sfx', 'collectible');
    const list = this.dancers();
    for (let k = 0; k < 4 && list.length; k++) {
      const p = list[Math.floor(Math.random() * list.length)];
      if (p.removed) continue;
      p.pose = 'wave';
      setTimeout(() => { if (!p.removed) p.pose = 'dance'; }, 1400);
    }
  }

  // every frame from the club's lateUpdate: input, falling notes, the camera
  frame(dt) {
    if (this.pending) { this.begin(); return; }
    if (!this.on) return;
    if (Input.rawHit('Escape')) { this.stop(true); return; }
    LANES.forEach((L, i) => { if (Input.rawHit(...L.keys)) this.hit(i); });
    const now = this.beatNow(), spb = 60 / this.bpm;
    const H = this.lanes[0].clientHeight, hitY = H - 38;
    for (const n of this.notes) {
      if (n.state) continue;
      const ahead = n.b - now;
      if (ahead * spb < -GOOD) { n.state = 2; n.el.remove(); this.miss(); continue; }
      if (ahead > AHEAD) { n.el.style.display = 'none'; continue; }
      n.el.style.display = '';
      n.el.style.top = `${hitY - (ahead / AHEAD) * hitY}px`;
    }
    const cd = Math.ceil(this.notes[0].b - now);
    this.el.querySelector('.combo').textContent = cd > 0 && cd <= 4 ? `GET READY · ${cd}` : this.combo > 1 ? `COMBO ×${this.combo}` : '';
    this.el.querySelector('.score').textContent = this.score.toLocaleString();
    this.hype += (Math.min(1, this.combo / 16) - this.hype) * Math.min(1, dt * 3);
    if (now > this.end) this.stop(false);
    else this.camera(dt);
  }
  // from beside the decks, over the DJ's shoulder onto the crowd
  camera(dt) {
    const cam = G.camera, o = this.room.origin, sp = this.rooms.cur.inst.djSpot;
    this.shot = Math.min(1, this.shot + dt * 2);
    _p.set(o.x + sp.x + 1.6, o.y + 2.75, o.z + sp.z - 0.75);
    cam.position.lerp(_p, this.shot);
    cam.lookAt(o.x + 0.2, o.y + 0.9, o.z - 0.5);
    if (Math.abs(cam.fov - 58) > 0.05) { cam.fov = 58; cam.updateProjectionMatrix(); }
  }

  stop(abort) {
    if (!this.on) { this.pending = null; return; }
    this.on = false; this.hype = 0;
    this.el.classList.remove('on');
    for (const n of this.notes) if (n.el) n.el.remove();
    const b = this.back, o = this.room.origin, sp = this.rooms.cur && this.rooms.cur.inst.djSpot;
    if (b && sp) G.player.teleport(b.x, b.y, b.z, b.h);
    if (this.dj && !this.dj.removed && sp) { this.dj.pos.x = o.x + sp.x; this.dj.pos.z = o.z + sp.z - 0.05; this.dj.pose = 'dance'; this.dj.heading = 0; }
    if (G.mode === 'talk') { G.mode = 'play'; Input.lock(); }
    if (abort) return;
    const S = G.save.interiors.best;
    const acc = this.hits / this.notes.length;
    const grade = acc > 0.95 ? 'S' : acc > 0.85 ? 'A' : acc > 0.7 ? 'B' : acc > 0.5 ? 'C' : 'D';
    // the first good set of a visit pays in full, encores pay half
    const full = !this.paidThisVisit;
    const payK = Math.min(1, this.score / this.max);
    const pay = Math.round((payK * payK * 420 + (this.best >= 30 ? 60 : 0)) * (full ? 1 : 0.5) / 5) * 5;
    this.paidThisVisit = true;
    S.danceN = (S.danceN || 0) + 1;
    const record = this.score > (S.dance || 0);
    if (record) S.dance = this.score;
    if (pay > 0) addTokens(pay, 'DJ set');
    writeSave();
    G.hud.banner(`SET COMPLETE · ${grade}`, `${this.score.toLocaleString()} points · best combo ${this.best}${record ? ' · new record' : ''}`, grade === 'S' || grade === 'A' ? 'cool' : '', 4);
    emit('sfx', acc > 0.5 ? 'missionPass' : 'missionFail');
  }
}

export const Rhythm = new RhythmGame();
