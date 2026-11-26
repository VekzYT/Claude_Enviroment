// Places you can walk into: a door on the street, a fade, a furnished room with people in it.
//
// Each room is built (on first use) high above its own street door, out of sight of the city,
// and only exists for the world while the player is inside: its floor, walls and lamps are
// registered on the way in and taken away on the way out. Standing right above the door keeps the
// minimap, place names and the street below as they were (the crowd and the traffic are still
// there when you come out). While inside, G.indoors = { id, name } pauses ambient spawning, the
// police stand down, the sun is switched off and the room's own lamps light everything.
import * as THREE from 'three';
import { G, on, emit, addPlugin } from '../state.js';
import { Input } from '../input.js';
import { addBox, removeCollider, restoreCollider, queryColliders } from '../world/colliders.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { platforms, groundHeight } from '../world/roads.js';
import { SHOP_ROWS, makeBlobTexture, makeCanvas, canvasToTexture, UI_FONT } from '../world/textures.js';
import { BLIP_STYLES } from '../ui/minimap.js';
import { addControls } from '../ui/menus.js';
import { Dialogue } from '../ui/dialogue.js';
import { Radio } from '../audio/radio.js';
import { setLamps, clearLamps, updateLamp } from './light.js';
import { Rhythm } from './rhythm.js';
import { CAFE } from './cafe.js';
import { CLUB } from './club.js';
import { BARBER } from './barber.js';
import { LOBBY, SKYDECK } from './tower.js';
import './street.js';

const PLACES = [CAFE, CLUB, BARBER, LOBBY, SKYDECK];
const ROOM_Y = 430;            // rooms float this high over their doors (above the tallest tower)
const FADE = 0.75;             // seconds of the fade to black (matches #fade in style.css)
const SHOP_GY = 2.16;          // street level of the shopfronts (CITY.y + KERB)
const BAY = 6, DOOR_W = 1.3;   // shopfront bay width and door (world/shops.js)
const INDOOR_FAR = 140;

BLIP_STYLES.door = { color: '#f0e8d8', glyph: '⌂' };

const CSS = `
.mini-wrap .venue { position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center;
  background: radial-gradient(circle at 50% 40%, #2b2622 0%, #171513 70%); border-radius: 50%; }
body.indoors .mini-wrap .venue { display: flex; }
.mini-wrap { position: relative; }
.mini-wrap .venue i { font-style: normal; font-size: 40px; line-height: 1; color: var(--terracotta); }
.mini-wrap .venue b { font-size: 17px; letter-spacing: .14em; color: var(--ivory); max-width: 80%; }
.mini-wrap .venue span { font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: rgba(240,232,216,.55); max-width: 76%; }
`;

class Interiors {
  constructor() {
    this.places = new Map();      // id -> { def, door, inst }
    this.cur = null;              // the place we are in
    this.fade = null;             // { t, to, spot } while the screen is fading out
    this.colliders = [];
    this.platform = null;
    this.npcs = [];
    this.hot = null;
    this.drunk = 0; this.drunkAmp = 0;
    this.radio = null; this.music = null;
    this.banned = {};             // id -> G.time until which security will not let you back in
    this.prev = {};
  }

  init(game) {
    G.rooms = this;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const wrap = document.querySelector('.mini-wrap');
    if (wrap) { this.card = document.createElement('div'); this.card.className = 'venue'; this.card.innerHTML = '<i></i><b></b><span></span>'; wrap.appendChild(this.card); }
    const bays = findBays(game.world);
    let k = 0;
    for (const def of PLACES) {
      const door = def.door ? def.door(game.world) : bays && pickBay(bays, def.shop, def.near);
      if (!door && !def.hidden) continue;
      const P = { def, door, inst: null, y: ROOM_Y + 34 * k++ };
      this.places.set(def.id, P);
      if (def.hidden) continue;
      if (def.decorate) def.decorate(G.scene, door);
      G.missions.addMarker({
        id: 'door:' + def.id, x: door.mx, z: door.mz, r: 1.25, color: def.color, label: `Enter ${def.name}`, blip: 'door', name: def.name, foot: true,
        show: () => !G.indoors, use: () => this.tryEnter(def.id),
      });
    }
    this.signs(game);
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: makeBlobTexture(), transparent: true, depthWrite: false, opacity: 0.55 }));
    this.blob.visible = false; this.blob.renderOrder = 2;
    G.scene.add(this.blob);
    on('crime', (type) => { if (this.cur && !this.fade && type !== 'theft') this.eject(type === 'gunfire' || type === 'assault' ? 'Security walked you out' : 'You were asked to leave'); });
    on('playerDied', () => this.interrupted());
    on('playerBusted', () => this.interrupted());
    addControls([['E', 'Talk to people nearby, use doors and counters']], []);
  }

  // Blade signs over the doors, so the places you can go into read from the street.
  signs(game) {
    const list = [...this.places.values()].filter((P) => P.door && !P.def.hidden && !P.def.noSign);
    if (!list.length) return;
    const c = makeCanvas(512, 128 * list.length), g = c.getContext('2d');
    list.forEach((P, i) => {
      const y = i * 128;
      g.fillStyle = '#f6f2ea'; g.fillRect(0, y, 512, 128);
      g.fillStyle = P.def.css || '#d97757'; g.fillRect(0, y + 112, 512, 16);
      g.fillStyle = '#26282c'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 40px ${UI_FONT}`; g.fillText(P.def.signText || P.def.name.toUpperCase(), 256, y + 48);
      g.font = `700 22px ${UI_FONT}`; g.fillStyle = '#6b665e'; g.fillText(P.def.signSub || 'OPEN', 256, y + 88);
    });
    const tex = canvasToTexture(c, { repeat: false });
    const pos = [], uv = [], idx = [], rims = [];
    list.forEach((P, i) => {
      const d = P.door, tx = d.nz, tz = -d.nx;   // along the wall
      // over the door, standing out from the wall, readable from both ways along the pavement
      const cx = d.x + d.nx * 0.78, cz = d.z + d.nz * 0.78, y = d.y + 2.92;
      const v0 = 1 - (i + 1) / list.length + 0.004, v1 = 1 - i / list.length - 0.004;
      for (const side of [1, -1]) {
        const o = pos.length / 3;
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          pos.push(cx + d.nx * a * 0.55 + tx * side * 0.03, y + b * 0.17, cz + d.nz * a * 0.55 + tz * side * 0.03);
          // seen from either side the text runs from the street end towards the wall
          uv.push(side > 0 ? (1 - a) / 2 : (1 + a) / 2, b < 0 ? v0 : v1);
        }
        idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
      }
      const ax = Math.abs(d.nx), az = Math.abs(d.nz);
      rims.push([cx, y, cz, ax * 1.24 + az * 0.04, 0.42, az * 1.24 + ax * 0.04]);
      rims.push([d.x + d.nx * 0.7, y + 0.23, d.z + d.nz * 0.7, ax * 1.4 + az * 0.03, 0.03, az * 1.4 + ax * 0.03]);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    for (const ch of ['r', 'g', 'b']) G.env.nightLerp(mat.color, ch, 0.95, 1.5);
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false; m.matrixAutoUpdate = false;
    G.scene.add(m);
    // a dark frame round each blade (thinner than the gap between its faces) and the bracket
    const fb = rims.map(([x, y, z, sx, sy, sz]) => new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z));
    const fm = new THREE.Mesh(mergeGeometries(fb), new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.4, metalness: 0.6 }));
    fm.frustumCulled = false; fm.matrixAutoUpdate = false;
    G.scene.add(fm);
  }

  // ---- doors --------------------------------------------------------------------------------------
  tryEnter(id) {
    const pl = G.player;
    if (this.fade || this.cur || !pl.alive) return;
    if (G.police.stars > 0) { G.hud.toast('The door stays shut while you are flagged — lose the Safety Flag first', '#ffb347'); emit('sfx', 'uiError'); return; }
    if (G.missions.active) { G.hud.toast('Not now — you are on a job'); emit('sfx', 'uiError'); return; }
    if ((this.banned[id] || 0) > G.time) { G.hud.toast(`Security will not let you back in yet (${Math.ceil(this.banned[id] - G.time)} s)`, '#ff4d5e'); emit('sfx', 'uiError'); return; }
    this.go(id);
  }
  // Fade out, move, fade in. to = place id, or null for the street.
  go(to, spot = null) {
    if (this.fade) return;
    // gameplay input is off through the fade, so nothing (a car door, a punch) can happen on the way
    Dialogue.close();
    if (G.mode === 'play') { G.mode = 'talk'; this.fade = { t: FADE, to, spot, mode: true }; }
    else this.fade = { t: FADE, to, spot };
    G.menus.fadeTo(true);
    emit('sfx', 'doorOpen');
  }
  endFade() {
    const f = this.fade;
    this.fade = null;
    if (f && f.mode && G.mode === 'talk') G.mode = 'play';
    return f;
  }
  // flatlined or contained: whatever was going on in here (or on the street) stops
  interrupted() {
    Dialogue.close();
    Rhythm.stop(true);
    if (this.fade) { this.endFade(); G.menus.fadeTo(false); }
    this.drunk = 0;
    const g = G.game.R.grade;
    if (g) g.uniforms.uCA.value = 0.6;
  }
  eject(msg) {
    if (!this.cur) return;
    const id = this.cur.def.id;
    this.banned[id] = G.time + 90;
    Dialogue.close();
    G.hud.toast(msg, '#ff4d5e');
    this.go(null);
  }

  arrive(to, spot) {
    const from = this.cur, pl = G.player;
    // whatever happened during the fade can still call the visit off
    if (to !== null && !from && (!pl.alive || pl.vehicle || pl.state !== 'foot' || G.police.stars > 0)) {
      if (pl.alive && G.police.stars > 0) G.hud.toast('The door stays shut while you are flagged — lose the Safety Flag first', '#ffb347');
      G.menus.fadeTo(false);
      return;
    }
    if (from) this.leaveRoom();
    // the lift to the roof: the helicopter service places the player while the screen is still dark
    if (to === null && spot && spot.heli && G.heliTeleport(spot.heli, true)) {
      this.refreshProbe();
      G.menus.fadeTo(false);
      return;
    }
    if (to === null) {
      const d = from.door;
      const x = d.mx + d.nx * 0.8, z = d.mz + d.nz * 0.8, h = Math.atan2(d.nx, d.nz);
      G.player.teleport(x, groundHeight(x, z, d.y + 2), z, h);
      G.cam.yaw = h; G.cam.pitch = 0.18; G.cam.first = true;
      this.refreshProbe();
      emit('sfx', 'doorClose');
      G.menus.fadeTo(false);
      return;
    }
    const P = this.places.get(to);
    if (!P.inst) { P.inst = P.def.make({ x: (P.door || from.door).x, y: P.y, z: (P.door || from.door).z }, this); G.scene.add(P.inst.room.group); }
    if (!P.door) P.door = from.door;   // a room reached from another (the sky deck) leads back out the same street door
    this.enterRoom(P);
    const I = P.inst, e = spot || I.entry;
    const w = I.room.world(e.x, e.z);
    G.player.teleport(w.x, I.room.origin.y, w.z, e.h);
    G.cam.yaw = e.h; G.cam.pitch = 0.16; G.cam.first = true;
    this.refreshProbe();
    G.menus.fadeTo(false);
    emit('sfx', 'doorClose');
    const S = G.save.interiors;
    S.visits[to] = (S.visits[to] || 0) + 1;
    if (I.onEnter) I.onEnter(S.visits[to]);
  }

  enterRoom(P) {
    const I = P.inst, R = I.room, o = R.origin;
    this.cur = P;
    G.indoors = { id: P.def.id, name: P.def.name };
    R.group.visible = true;
    // each room keeps its own colliders between visits
    if (!I.cols) I.cols = R.boxes.map((b) => addBox(o.x + b[0], o.z + b[1], o.x + b[2], o.z + b[3], o.y + b[4], o.y + b[5], { interior: P.def.id }));
    else for (const c of I.cols) restoreCollider(c);
    this.colliders = I.cols;
    this.platform = { x0: o.x - R.W / 2 - 1, z0: o.z - R.D / 2 - 1, x1: o.x + R.W / 2 + 1, z1: o.z + R.D / 2 + 1, y: o.y };
    platforms.push(this.platform);
    setLamps(R.lamps.map((L) => ({ ...L, x: o.x + L.x, y: o.y + L.y, z: o.z + L.z })));
    this.prev.suppressed = G.police.suppressed;
    G.police.suppressed = true;
    if (I.tower) I.tower(true);
    this.spawnPeople(I);
    // the view stops at the walls; nothing outside needs drawing or a fresh shadow map
    const cam = G.camera;
    if (!I.outdoorView) { cam.far = INDOOR_FAR; cam.updateProjectionMatrix(); G.renderer.shadowMap.autoUpdate = false; }
    if (I.music) this.playMusic(I.music);
    // the street outside is muffled by the walls
    G.audio?.setIndoor(true);
    // the view starts close in (a wide view would only see walls); the street view comes back on the way out
    this.prev.zoom = G.cam.zoom; G.cam.zoom = Math.min(G.cam.zoom, 1);
    document.body.classList.add('indoors');
    if (this.card) {
      this.card.querySelector('i').textContent = P.def.icon || '⌂';
      this.card.querySelector('b').textContent = P.def.name;
      this.card.querySelector('span').textContent = P.def.sub || '';
    }
    this.blob.visible = !I.outdoorView;
  }
  leaveRoom() {
    const P = this.cur, I = P.inst;
    if (I.onLeave) I.onLeave();
    P.inst.room.group.visible = false;
    for (const c of this.colliders) removeCollider(c);
    this.colliders = [];
    const k = platforms.indexOf(this.platform);
    if (k >= 0) platforms.splice(k, 1);
    this.platform = null;
    clearLamps();
    for (const n of this.npcs) if (!n.p.removed) G.peds.remove(n.p);
    this.npcs.length = 0;
    if (I.tower) I.tower(false);
    G.police.suppressed = !!this.prev.suppressed;
    G.camera.far = G.game.R.q ? G.game.R.q.far : 2000; G.camera.updateProjectionMatrix();
    G.renderer.shadowMap.autoUpdate = true;
    G.audio?.setIndoor(false);
    G.cam.zoom = this.prev.zoom ?? G.cam.zoom;
    this.cur = null; G.indoors = null;
    this.stopMusic();
    this.probeFar();
    document.body.classList.remove('indoors');
    this.blob.visible = false;
    this.hot = null;
  }
  // change one of the room's lamps (room-local position)
  setLamp(i, L) { const o = this.cur.inst.room.origin; updateLamp(i, { ...L, x: o.x + L.x, y: o.y + L.y, z: o.z + L.z }); }
  // a fresh reflection capture where the player now is (the old one shows the other side of the door)
  refreshProbe() {
    this.probeFar();
    const P = G.env.probe;
    if (!P.every) return;
    P.face = 0; P.pos.copy(G.player.pos); P.pos.y += 1.6;
  }
  // inside, the probe only needs to see the room, not the city far below
  probeFar() {
    const P = G.env.probe, far = this.cur && !this.cur.inst.outdoorView ? 60 : 900;
    if (P.cam && P.cam.children[0].far !== far) for (const c of P.cam.children) { c.far = far; c.updateProjectionMatrix(); }
  }

  // ---- people ------------------------------------------------------------------------------------
  spawnPeople(I) {
    const o = I.room.origin;
    for (const s of I.people || []) {
      const w = I.room.world(s.x, s.z);
      let p = G.peds.spawn(w.x, w.z, s.look, { role: 'npc', heading: s.h ?? 0, pose: s.pose || 'idle', brain: (q, dt, t) => this.brain(q, s, dt, t), health: 80 });
      if (!p) { this.makeRoom(); p = G.peds.spawn(w.x, w.z, s.look, { role: 'npc', heading: s.h ?? 0, pose: s.pose || 'idle', brain: (q, dt, t) => this.brain(q, s, dt, t), health: 80 }); }
      if (!p) continue;
      p.keep = true; p.pos.y = o.y + (s.y || 0); p.gy = p.pos.y;
      if (s.seatH) p.seatH = s.seatH;
      p.spec = s; s.p = p;
      this.npcs.push({ p, s });
    }
  }
  // the crowd is full: let a few far-off strangers go home
  makeRoom() {
    const pp = G.player.pos;
    const civ = G.peds.list.filter((q) => q.role === 'civ' && !q.keep).sort((a, b) => Math.hypot(b.pos.x - pp.x, b.pos.z - pp.z) - Math.hypot(a.pos.x - pp.x, a.pos.z - pp.z));
    for (const q of civ.slice(0, 4)) G.peds.remove(q);
  }
  brain(p, s, dt, t) {
    const pl = G.player;
    // glance at the player when they come close, and look at whoever is talking to them
    const dx = pl.pos.x - p.pos.x, dz = pl.pos.z - p.pos.z, d2 = dx * dx + dz * dz;
    if (d2 < 12 && Math.abs(pl.pos.y - p.pos.y) < 2) p.lookAt = pl;
    if (s.brain) return s.brain(p, dt, t) ?? 0;
    return 0;
  }

  // ---- inside ---------------------------------------------------------------------------------------
  hotspots() {
    const I = this.cur.inst, out = [];
    for (const n of this.npcs) {
      const p = n.p;
      if (p.removed || p.state === 'ragdoll' || p.state === 'down' || !n.s.talk) continue;
      out.push({ x: p.pos.x, z: p.pos.z, r: n.s.reach || 1.7, label: n.s.prompt || `Talk to ${n.s.name}`, use: () => this.talk(n) });
    }
    const o = I.room.origin;
    for (const h of I.spots || []) {
      if (h.show && !h.show()) continue;
      out.push({ x: o.x + h.x, z: o.z + h.z, r: h.r || 1.3, label: typeof h.label === 'function' ? h.label() : h.label, use: h.use });
    }
    return out;
  }
  talk(n) {
    const p = n.p, pl = G.player;
    const node = n.s.talk(this.memory(n.s.id));
    if (!node) return;
    const seated = p.pose === 'sit' || p.pose === 'sitGround';
    if (!seated) { p.talkT = 600; p.faceH = Math.atan2(pl.pos.x - p.pos.x, pl.pos.z - p.pos.z); }
    pl.heading = Math.atan2(p.pos.x - pl.pos.x, p.pos.z - pl.pos.z);
    Dialogue.start(node, { npc: p, onClose: () => { p.talkT = 0; p.faceH = n.s.faceH ?? null; } });
  }
  // a conversation with no one in particular (a lift, a sign)
  talkTo(node) { Dialogue.start(node); }
  // what a person remembers about the player: how often you have talked, and anything they noted
  memory(id) {
    const S = G.save.interiors;
    const m = S.met[id] || (S.met[id] = { n: 0 });
    m.n++;
    return m;
  }

  update(dt, t) {
    const S = G.save;
    S.interiors ??= { visits: {}, met: {}, best: {} };
    if (this.fade) {
      this.fade.t -= dt;
      if (this.fade.t <= 0) { const f = this.endFade(); this.arrive(f.to, f.spot); }
      return;
    }
    if (!this.cur) return;
    const I = this.cur.inst, R = I.room, pl = G.player;
    // moved out by something else (a respawn after flatlining, a test): tidy up without a door
    if (Math.hypot(pl.pos.x - R.origin.x, pl.pos.z - R.origin.z) > Math.max(R.W, R.D) + 20 || Math.abs(pl.pos.y - R.origin.y) > 30) { this.leaveRoom(); return; }
    if (!I.outdoorView) { this.light(); this.probeFar(); }
    if (I.update) I.update(dt, t);
    // the street through the windows: daylight, then a deep blue evening
    const n = G.env.night;
    for (const m of R.views || []) m.color.setRGB(1.05 - n * 0.9, 1.05 - n * 0.86, 1.05 - n * 0.7);
    this.blob.position.set(pl.pos.x, R.origin.y + 0.015, pl.pos.z);
    // what E does here: the nearest thing in reach, preferring what you face
    this.hot = null;
    if (G.mode === 'play' && pl.state === 'foot' && pl.alive && !pl.aiming) {
      let best = 9;
      const fx = Math.sin(pl.heading), fz = Math.cos(pl.heading);
      for (const h of this.hotspots()) {
        const dx = h.x - pl.pos.x, dz = h.z - pl.pos.z, d = Math.hypot(dx, dz);
        if (d > h.r) continue;
        const score = d - ((dx * fx + dz * fz) / (d || 1)) * 0.6;
        if (score < best) { best = score; this.hot = h; }
      }
    }
    if (this.hot) {
      G.hud.prompt(`<kbd>E</kbd>${this.hot.label}`);
      G.interact.active = true;
      if (Input.hit('KeyE')) { emit('sfx', 'uiSelect'); this.hot.use(); }
    }
  }
  // the room's own light: no sun, a little bounce from the walls, its exposure and glow
  light() {
    const E = G.env, a = this.cur.inst.ambience || {};
    E.sun.intensity = 0;
    E.hemi.color.set(a.sky ?? 0xffe8d2); E.hemi.groundColor.set(a.ground ?? 0x5a4636);
    E.hemi.intensity = a.hemi ?? 0.45;
    G.scene.environmentIntensity = (a.env ?? 0.6) * (E.probe.every ? 1 : 0.5);
    E.exposure = a.exposure ?? 1;
    E.bloomThreshold = a.bloom ? a.bloom[0] : 0.95; E.bloomStrength = a.bloom ? a.bloom[1] : 0.3;
  }

  // ---- music --------------------------------------------------------------------------------------
  playMusic(m) {
    if (!G.audio) return;
    if (!this.radio) this.radio = new Radio(G.audio);
    this.radio.set(m.station);
    this.radio.setActive(true);
    this.music = m;
  }
  stopMusic() { if (this.radio) this.radio.setActive(false); this.music = null; this.vol = null; }
  // the music's clock in beats (for the dance mini-game and the lights): null until the music is
  // really playing. Reads the radio's sequencer: the step it will play next and when.
  beat() {
    const r = this.radio;
    if (!r || !r._built || !r._song || !this.music) return null;
    const S = r._song, now = r.ctx.currentTime;
    return (S.bar * 16 + r._step - (r._next - now) / S.stepDur) / 4;
  }
  get bpm() { return this.radio && this.radio._song ? this.radio._song.st.bpm : 128; }

  // ---- after the camera ---------------------------------------------------------------------------
  lateUpdate(dt, t) {
    if (this.radio) {
      this.radio.update();
      // the room's music level (the radio itself only knows on and off)
      const v = this.music ? (G.audio.paused ? 0 : this.music.volume ?? 1) : null;
      if (v !== null && v !== this.vol && this.radio.out) { this.vol = v; this.radio.out.gain.setTargetAtTime(v, this.radio.ctx.currentTime, 0.2); }
    }
    // a drink or two: the view sways and the edges swim for a while
    if (this.drunk > 0) {
      this.drunk = Math.max(0, this.drunk - dt);
      const k = this.drunkAmp * Math.min(1, this.drunk / 8), cam = G.camera;
      cam.rotateZ(Math.sin(t * 0.9) * 0.06 * k);
      cam.rotateX(Math.sin(t * 0.63 + 1) * 0.025 * k);
      cam.position.x += Math.sin(t * 0.71) * 0.12 * k; cam.position.y += Math.sin(t * 1.13) * 0.06 * k;
      const g = G.game.R.grade;
      if (g) g.uniforms.uCA.value = 0.6 + k * 5;
      if (!this.drunk && g) g.uniforms.uCA.value = 0.6;
    }
    if (this.cur && this.cur.inst.lateUpdate) this.cur.inst.lateUpdate(dt, t);
    if (this.cur) this.keepCamera();
  }
  // The camera stays inside the room: the follow camera keeps a minimum distance from the player
  // and a conversation keeps part of its framing, either of which can put it past a wall.
  keepCamera() {
    const R = this.cur.inst.room, o = R.origin, c = G.camera.position, m = 0.22;
    if (R.opts.round) {
      const dx = c.x - o.x, dz = c.z - o.z, d = Math.hypot(dx, dz), lim = R.W / 2 - m;
      if (d > lim) { c.x = o.x + (dx / d) * lim; c.z = o.z + (dz / d) * lim; }
    } else {
      c.x = Math.min(o.x + R.W / 2 - m, Math.max(o.x - R.W / 2 + m, c.x));
      c.z = Math.min(o.z + R.D / 2 - m, Math.max(o.z - R.D / 2 + m, c.z));
    }
    c.y = Math.min(o.y + R.H - m, Math.max(o.y + 0.15, c.y));
  }
  drink(seconds, amp) { this.drunk = Math.min(150, this.drunk + seconds); this.drunkAmp = Math.min(1.6, Math.max(this.drunkAmp * (this.drunk > seconds ? 1 : 0), 0) + amp); }
}

// ---- finding the shop doors -----------------------------------------------------------------------
// The city paints every shop's sign band into one strip mesh; its texture coordinates say which
// sign (atlas row and bay) each band shows. Reading them back finds where each named shop stands,
// so a door here always matches the sign over it.
function findBays(world) {
  let mesh = null;
  world.city.group.traverse((o) => { if (!mesh && o.isMesh && o.material.customProgramCacheKey && o.material.customProgramCacheKey() === 'shopfade') mesh = o; });
  if (!mesh) return null;
  const g = mesh.geometry, P = g.attributes.position.array, U = g.attributes.uv.array, N = g.attributes.normal.array;
  const rows = SHOP_ROWS.length, out = [];
  for (let q = 0; q < P.length / 18; q++) {
    const o = q * 18;
    // a shop's sign band runs from the top of the window (3.3 m) to the top of the strip (4.5 m)
    if (Math.abs(P[o + 1] - (SHOP_GY + 3.3)) > 0.02 || Math.abs(P[o + 7] - (SHOP_GY + 4.5)) > 0.02) continue;
    const u0 = U[q * 12], v0 = U[q * 12 + 1];
    const row = Math.floor((1 - v0) * rows), a = Math.round(u0 * 6);
    if (Math.abs(u0 * 6 - a) > 1e-3 || !SHOP_ROWS[row] || !SHOP_ROWS[row][a]) continue;
    const name = SHOP_ROWS[row][a][0];
    if (!name) continue;
    const ax = P[o], az = P[o + 2], w = Math.hypot(P[o + 3] - ax, P[o + 5] - az), nx = Math.round(N[o]), nz = Math.round(N[o + 2]);
    // the door is at the right-hand end of the bay as you face it (world/shops.js frameGeo)
    const s = (BAY - 0.16 - DOOR_W / 2) * (w / BAY);
    const x = ax + nz * s, z = az - nx * s;
    out.push({ name, x, z, y: SHOP_GY, nx, nz, mx: x + nx * 1.05, mz: z + nz * 1.05 });
  }
  return out;
}
function pickBay(bays, name, near) {
  let best = null, bd = Infinity;
  for (const b of bays) {
    if (b.name !== name) continue;
    // nothing in the way on the pavement in front (a shelter, a kiosk, a tree)
    if (queryColliders(b.mx, b.mz, 1.2).some((c) => c.type === 'circle' ? Math.hypot(c.x - b.mx, c.z - b.mz) < c.r + 0.9 : b.mx > c.x0 - 0.9 && b.mx < c.x1 + 0.9 && b.mz > c.z0 - 0.9 && b.mz < c.z1 + 0.9)) continue;
    const d = Math.hypot(b.x - near[0], b.z - near[1]);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}
export const Rooms = new Interiors();
addPlugin({
  init(game) { Rooms.init(game); },
  update(dt, t) { Rooms.update(dt, t); },
  lateUpdate(dt, t) { Rooms.lateUpdate(dt, t); },
});
