// Owns every gameplay system, the update order, and the glue between them (events, audio, flow).
import * as THREE from 'three';
import { G, on, emit } from './state.js';
import { Input } from './input.js';
import { GameCamera } from './camera.js';
import { FX } from './fx/particles.js';
import { Player } from './entities/player.js';
import { Vehicle, collideVehicles } from './entities/vehicle.js';
import { Peds } from './entities/peds.js';
import { Traffic } from './entities/traffic.js';
import { Police } from './entities/police.js';
import { Weapons } from './entities/weapons.js';
import { Missions } from './missions/missions.js';
import { PED_LOOKS } from './entities/pedlooks.js';
import { POI } from './world/layout.js';
import { forestMask, swampMask, landDist } from './world/terrain.js';
import { addTokens, writeSave } from './save.js';
import { clamp } from './util/math.js';
import { rand, pick } from './util/rng.js';

export class Game {
  constructor(R, world) {
    this.R = R;
    this.world = world;
    G.game = this;
    G.env = world.env;
    G.world = world;
    G.input = Input;
    G.fx = new FX(R.scene);
    G.cam = new GameCamera(R.camera);
    G.player = new Player();
    G.peds = new Peds(R.scene);
    G.traffic = new Traffic();
    G.weapons = new Weapons(R.scene);
    G.police = new Police(R.scene);
    G.missions = new Missions(R.scene);
    this.headlight = new THREE.SpotLight(0xfff0d6, 0, 85, 0.52, 0.65, 1.3);
    R.scene.add(this.headlight, this.headlight.target);
    this.hydrants = [];
    this.respawnT = 0; this.respawnKind = null;
    this.saveT = 60;
    this.alarmT = 0;
    this.timeScale = 1;
    this.introT = 0;
    this.perf = { t: 0, frames: 0, settle: 3 };
    this.wire();
    this.applySave();
    const car = new Vehicle('sport', POI.safehouse.x + 8, POI.safehouse.z - 9.5, Math.PI / 2, { paint: 0xff7a59 });
    car.keep = true;
    this.starterCar = car;
  }

  applySave() {
    const s = G.save, pl = G.player, W = G.weapons;
    if (s.outfit) pl.applyOutfit(s.outfit);
    pl.armor = s.armor || 0;
    W.reserve = Math.max(0, (s.ammo.reserve || 0) - W.clip);
    W.emps = s.ammo.emps ?? 3;
    G.hud.shownTokens = s.tokens;
  }

  sfx(name, x, z, volume = 1) { if (G.audio) G.audio.play(name, x !== undefined ? { x, z, volume } : { volume }); }

  wire() {
    const fx = G.fx;
    on('sfx', (name, x, z) => this.sfx(name, x, z));
    on('toast', (text) => G.hud.toast(text));
    on('vehicleImpact', (v, speed, x, z, other) => {
      if (v.far) return;
      fx.sparks(x, v.pos.y + 0.6, z, Math.min(18, 3 + speed), 0, 0);
      this.sfx(speed > 11 ? 'crashBig' : 'crashSmall', x, z, clamp(speed / 14, 0.3, 1));
      if (speed > 15) this.sfx('glass', x, z, 0.7);
      if (v === G.player.vehicle) {
        fx.addShake(clamp(speed / 22, 0.12, 1));
        if (speed > 13) G.player.hurt((speed - 13) * 1.1, 'crash');
      }
      if (v.driver === 'npc' && v.ai && speed > 6 && other && other.driver === 'player') v.ai.panic = G.time + 7;
    });
    on('vehicleLanded', (v, impact) => { if (v === G.player.vehicle) { fx.addShake(clamp(impact / 30, 0.1, 0.7)); this.sfx('thud'); } });
    on('propBroken', (b, v) => {
      fx.sparks(b.x, b.y + 1.2, b.z, b.kind === 'light' || b.kind === 'signal' ? 16 : 6, 0, 0, b.kind === 'light' ? [1, 0.9, 0.6] : [0.9, 0.8, 0.7]);
      this.sfx('propBreak', b.x, b.z);
      if (b.kind === 'hydrant') this.hydrants.push({ x: b.x, y: b.y, z: b.z, t: 14 });
      if (b.kind === 'vending') fx.zap(b.x, b.y + 1, b.z, 16, 0.6);
    });
    on('vehicleExploded', (v, source) => {
      this.sfx('explosion', v.pos.x, v.pos.z);
      const R2 = 11;
      const pl = G.player;
      for (const o of G.vehicles) {
        if (o === v || o.destroyed) continue;
        const d = Math.hypot(o.pos.x - v.pos.x, o.pos.z - v.pos.z);
        if (d < R2) {
          o.damage((1 - d / R2) * 70, source);
          const k = ((1 - d / R2) * 9) / Math.max(d, 1);
          o.vel.x += (o.pos.x - v.pos.x) * k; o.vel.z += (o.pos.z - v.pos.z) * k; o.vel.y += 3;
        }
      }
      for (const p of G.peds.list.slice()) {
        const d = Math.hypot(p.pos.x - v.pos.x, p.pos.z - v.pos.z);
        if (d < R2) G.peds.knock(p, ((p.pos.x - v.pos.x) / (d + 0.5)) * 8, 6, ((p.pos.z - v.pos.z) / (d + 0.5)) * 8, (1 - d / R2) * 120, source);
      }
      G.peds.scare(v.pos.x, v.pos.z, 60, 12);
      const d = Math.hypot(pl.worldPos.x - v.pos.x, pl.worldPos.z - v.pos.z);
      if (pl.vehicle === v) { pl.hurt(85, 'explosion'); if (pl.alive) pl.knockDown(rand(-3, 3), 7, rand(-3, 3), 2); }
      else if (d < R2 && !pl.vehicle) {
        pl.hurt((1 - d / R2) * 90, 'explosion');
        if (pl.alive) pl.knockDown(((pl.pos.x - v.pos.x) / (d + 0.5)) * 8, 6, ((pl.pos.z - v.pos.z) / (d + 0.5)) * 8, 1.8);
      }
    });
    on('driverEjected', (v, kind) => {
      const d = v.doorPos(-1);
      if (kind === 'cop') return;
      const ped = G.peds.spawn(d.x, d.z, v.npc || pick(PED_LOOKS));
      if (ped) { ped.pos.y = v.pos.y; ped.outlaw = !!v.outlaw; G.peds.knock(ped, rand(-1, 1), 2.4, rand(-1, 1), 0, null); ped.health = Math.max(ped.health, 30); }
    });
    on('vehicleSunk', (v) => { fx.splash(v.pos.x, v.pos.z, 2); this.sfx('sink', v.pos.x, v.pos.z); });
    on('splash', (x, z) => { fx.splash(x, z, 1); this.sfx('splash', x, z); });
    on('nitro', (v) => { if (v === G.player.vehicle) this.sfx('nitro'); });
    on('enterStart', (v, kind) => {
      if (kind === 'break') { this.sfx('glass', v.pos.x, v.pos.z); v.alarm = 7; G.peds.scare(v.pos.x, v.pos.z, 14, 5); }
      else this.sfx('doorOpen', v.pos.x, v.pos.z);
    });
    on('enteredVehicle', (v) => {
      this.sfx('doorClose'); this.sfx('engineStart');
      if (G.radio) { G.hud.radioPopup(G.radio.nowPlaying); }
      if (v.isPolice) G.hud.toast('H toggles the siren · G pings the scanner');
    });
    on('leftVehicle', (v) => this.sfx('doorOpen', v.pos.x, v.pos.z));
    on('vehicleStolen', (v, kind) => { G.save.stats.jacked++; if (kind === 'jack') G.peds.scare(v.pos.x, v.pos.z, 18, 8); });
    on('horn', (v) => this.sfx(v.T.mass > 2200 ? 'hornTruck' : 'horn', v.pos.x, v.pos.z, 0.7));
    on('playerHurt', (amount) => { this.sfx('hurt'); G.hud.damageFlash(clamp(amount / 30, 0.25, 0.9)); });
    on('playerJump', () => this.sfx('jump'));
    on('playerLand', () => this.sfx('land'));
    on('pedHit', (p) => this.sfx('thud', p.pos.x, p.pos.z));
    on('pedHurt', () => G.hud.hitMarker());
    on('droneDown', () => { G.hud.hitMarker(); });
    on('weaponChanged', () => this.sfx('uiMove'));
    on('wantedUp', (stars, label) => {
      this.sfx('starUp');
      G.save.stats.maxStars = Math.max(G.save.stats.maxStars, stars);
      if (label) G.hud.toast(`${label} — Safety Flag ${'★'.repeat(stars)}`, '#ffb347');
    });
    on('wantedCleared', (reason) => {
      if (reason === 'evaded') { G.save.stats.evaded++; this.sfx('evaded'); G.hud.banner('FLAG CLEARED', 'You are off the grid', 'cool', 3); }
      else if (reason === 'cleared') this.sfx('evaded');
    });
    on('playerDied', () => { this.respawnKind = 'dead'; this.respawnT = 5; this.sfx('wasted'); G.hud.banner('FLATLINED', 'Constitutional Care will bill you', 'bad', 5); G.save.stats.flatlined++; });
    on('playerBusted', () => { this.respawnKind = 'busted'; this.respawnT = 4.5; this.sfx('busted'); G.hud.banner('CONTAINED', 'The Safety Center has some questions', 'bad', 4.5); G.save.stats.busted++; });
    on('hacked', (v) => { G.hud.hitMarker(); if (v.driver === 'npc') { emit('driverEjected', v, 'npc'); v.driver = null; v.ai = null; } });
  }

  // ---- menus & flow ----------------------------------------------------------------
  openMenu(name) {
    G.mode = 'menu';
    Input.unlock();
    G.audio?.suspend();
    if (name === 'wardrobe') { G.cam.yaw = G.player.heading + Math.PI * 0.88; G.cam.pitch = 0.08; G.cam.idle = 0; G.cam.update(0.016, G.time); }
    G.menus[name]();
  }
  respawn() {
    const pl = G.player, kind = this.respawnKind;
    this.respawnKind = null;
    const spot = kind === 'busted' ? { x: POI.police.x, z: POI.police.z + 1, h: Math.PI } : { x: POI.clinic.x, z: POI.clinic.z - 3, h: 0 };
    const fee = Math.min(kind === 'busted' ? 2000 : 1500, Math.round(G.save.tokens * (kind === 'busted' ? 0.12 : 0.1)));
    pl.respawn(spot.x, spot.z, spot.h);
    G.police.setStars(0);
    G.police.clear('reset');
    if (kind === 'busted') { G.weapons.reserve = Math.floor(G.weapons.reserve / 2); G.weapons.emps = Math.min(G.weapons.emps, 1); pl.armor = 0; }
    if (fee > 0) addTokens(-fee, kind === 'busted' ? 'fine' : 'clinic bill');
    G.env.setHour(G.env.hour + 3);
    G.cam.yaw = spot.h; G.cam.first = true;
    writeSave();
    G.menus.fadeTo(false);
  }

  focus() { return G.player.worldPos; }

  // ---- main update ----------------------------------------------------------------
  update(rawDt, t) {
    const pl = G.player, hud = G.hud;
    // weapon wheel slows the world
    const wheel = Input.key('Tab') && pl.alive && G.mode === 'play';
    hud.openWheel(wheel);
    if (wheel) { hud.wheelMove(Input.mouse.dx, Input.mouse.dy); Input.mouse.dx = 0; Input.mouse.dy = 0; Input.mouse.left = false; Input.mouse.leftPressed = false; }
    this.timeScale += ((wheel ? 0.15 : this.respawnKind ? 0.45 : 1) - this.timeScale) * Math.min(1, rawDt * 10);
    const dt = rawDt * this.timeScale;
    G.dt = dt; G.time = t;

    // radio, horn, siren
    const v = pl.vehicle;
    if (v && G.radio) {
      if (Input.hit('KeyR')) G.radio.next();
      if (Input.hit('KeyQ')) G.radio.prev();
    }
    if (v && Input.hit('KeyH')) {
      if (v.isPolice) { v.sirenOn = !v.sirenOn; this.sfx('uiSelect'); }
      else { this.sfx(v.T.mass > 2200 ? 'hornTruck' : 'horn'); G.peds.scare(v.pos.x + Math.sin(v.heading) * 8, v.pos.z + Math.cos(v.heading) * 8, 9, 3); }
    }

    pl.update(dt, t);
    const vs = G.vehicles;
    for (let i = 0; i < vs.length; i++) vs[i].update(dt, t);
    collideVehicles(vs);
    G.peds.update(dt, t);
    G.traffic.update(dt, t);
    G.weapons.update(dt, t);
    G.police.update(dt, t);
    G.missions.update(dt, t);
    this.world.update(dt, t, this.focus());
    for (let i = this.hydrants.length - 1; i >= 0; i--) {
      const h = this.hydrants[i];
      h.t -= dt;
      if (h.t <= 0) { this.hydrants.splice(i, 1); continue; }
      for (let k = 0; k < 2; k++) G.fx.alpha.emit(h.x + rand(-0.1, 0.1), h.y + 0.3, h.z + rand(-0.1, 0.1), rand(-1.2, 1.2), rand(9, 13), rand(-1.2, 1.2), rand(0.9, 1.4), 0.7, 2.6, 0.82, 0.92, 0.97, 0.5, 14, 0.2);
    }
    // car alarms
    this.alarmT -= dt;
    if (this.alarmT <= 0) { this.alarmT = 0.62; for (const a of vs) if (a.alarm > 0 && !a.far) this.sfx('alarm', a.pos.x, a.pos.z, 0.6); }
    G.fx.update(dt);
    G.cam.update(rawDt, t);
    this.updateHeadlight(dt);
    hud.update(rawDt, t);
    this.updateAudio(rawDt);
    G.save.stats.distance += pl.worldSpeed * dt;
    // post effects that follow the action
    if (this.R.grade) {
      const u = this.R.grade.uniforms;
      const sp = v ? clamp((v.speed - 28) / 40, 0, 1) + (v.boosting ? 0.35 : 0) : 0;
      u.uSpeed.value += (sp - u.uSpeed.value) * Math.min(1, rawDt * 4);
      u.uDesat.value += ((pl.alive ? 0 : 0.85) - u.uDesat.value) * Math.min(1, rawDt * 2);
    }
    // death / arrest
    if (this.respawnKind) {
      this.respawnT -= rawDt;
      if (this.respawnT < 0.8) G.menus.fadeTo(true);
      if (this.respawnT <= 0) this.respawn();
    }
    this.autoQuality(rawDt);
    if (this.introT > 0) { this.introT -= rawDt; if (this.introT <= 0 && !G.missions.active) G.missions.begin(G.missions.jobById('intro')); }
    this.saveT -= rawDt;
    if (this.saveT <= 0) { this.saveT = 60; if (!G.missions.active && pl.alive) writeSave(); }
  }

  // If nobody chose a preset and the machine is struggling, step the quality down once or twice.
  autoQuality(dt) {
    const P = this.perf;
    if (!P || G.settings.qualityChosen || G.settings.quality === 'low') return;
    if (P.settle > 0) { P.settle -= dt; return; }
    P.t += dt; P.frames++;
    if (P.t < 4) return;
    const fps = P.frames / P.t;
    P.t = 0; P.frames = 0;
    if (fps < 34) {
      G.settings.quality = G.settings.quality === 'high' ? 'medium' : 'low';
      G.hooks.applySettings(true);
      G.hud.toast(`Graphics set to ${G.settings.quality} to keep the frame rate up (change it in Settings)`);
      P.settle = 4;
    } else this.perf = null;
  }

  // Slow orbit of the skyline behind the title screen.
  titleUpdate(dt, t) {
    const cam = this.R.camera;
    const a = t * 0.045 + 2.2;
    cam.position.set(POI.tower.x + Math.cos(a) * 520, 130 + Math.sin(t * 0.1) * 20, POI.tower.z - 40 + Math.sin(a) * 520);
    cam.lookAt(POI.tower.x, 95, POI.tower.z - 40);
    if (cam.fov !== 50) { cam.fov = 50; cam.updateProjectionMatrix(); }
    this.world.update(dt, t, cam.position);
    G.fx.update(dt);
  }

  updateHeadlight(dt) {
    const v = G.player.vehicle;
    const night = G.env.night;
    const L = this.headlight;
    if (v && night > 0.25 && !v.destroyed && v.cls !== 'boat') {
      const s = Math.sin(v.heading), c = Math.cos(v.heading);
      L.position.set(v.pos.x + s * (v.T.len / 2 - 0.2), v.pos.y + 0.75, v.pos.z + c * (v.T.len / 2 - 0.2));
      L.target.position.set(v.pos.x + s * 30, v.pos.y - 1.5, v.pos.z + c * 30);
      L.intensity += (300 * night - L.intensity) * Math.min(1, dt * 6);
    } else L.intensity += (0 - L.intensity) * Math.min(1, dt * 8);
  }

  updateAudio(dt) {
    const A = G.audio;
    if (!A) return;
    const pl = G.player, v = pl.vehicle, cam = this.R.camera.position;
    A.setListener(cam.x, cam.y, cam.z, G.cam.yaw);
    if (v && !v.destroyed) {
      const ratio = clamp(Math.abs(v.fwd) / v.T.maxSpeed, 0, 1.3);
      let rpm;
      if (v.cls === 'car') { const g = Math.min(4, Math.floor(ratio * 5)); rpm = clamp(0.22 + 0.78 * (ratio * 5 - g) * (g < 4 ? 1 : 0.8) + (g === 4 ? 0.2 : 0), 0, 1); if (!v.onGround) rpm = 1; }
      else rpm = clamp(ratio, 0, 1);
      A.engine({ cls: v.cls, rpm: v.disabled > 0 ? 0 : rpm, throttle: v.disabled > 0 ? 0 : Math.abs(v.inThrottle), speed: v.speed, nitro: v.boosting, heavy: clamp((v.T.mass - 1000) / 4000, 0, 1), damaged: 1 - v.healthFrac });
      A.skid(v.slip, v.surface === 'hover' ? 'water' : v.surface);
    } else { A.engine(null); A.skid(0, 'asphalt'); }
    const sirens = [];
    for (const o of G.vehicles) if (o.sirenOn && !o.destroyed && o !== v) sirens.push({ id: o.id, x: o.pos.x, z: o.pos.z });
    A.sirens(sirens);
    const p = pl.worldPos;
    A.ambient({ city: G.env.cityK, forest: forestMask(p.x, p.z), swamp: swampMask(p.x, p.z), beach: clamp(1 - Math.abs(landDist(p.x, p.z)) / 120, 0, 1) * (p.x > 780 || p.z > 1000 ? 1 : 0.3), night: G.env.night, rain: 0, wind: clamp(pl.worldSpeed / 55, 0, 1) });
    A.update(dt);
    if (G.radio) { G.radio.setActive(!!v && pl.alive); G.radio.update(dt); }
  }
}
