// Weapons and gadgets: fists, shock baton, pulse pistol, EMP charges, the Prompt Injector hack tool,
// plus the bolt projectiles police fire back.
import * as THREE from 'three';
import { G, emit } from '../state.js';
import { Input } from '../input.js';
import { groundHeight } from '../world/roads.js';
import { rayBoxes } from '../world/colliders.js';
import { clamp, wrapAngle } from '../util/math.js';
import { rand } from '../util/rng.js';
import { PAL } from '../world/palette.js';

export const WEAPONS = [
  { id: 'fists', name: 'Fists', hint: 'Left click to punch', held: null },
  { id: 'baton', name: 'Shock Baton', hint: 'Knocks people flat', held: 'baton' },
  { id: 'pistol', name: 'Pulse Pistol', hint: 'Hold right click to aim', held: 'pistol', clip: 12 },
  { id: 'emp', name: 'EMP Charge', hint: 'Throws an arc — kills engines and drones', held: 'emp' },
  { id: 'hack', name: 'Prompt Injector', hint: 'Aim at a vehicle or drone and click', held: 'hack' },
];

const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _m = new THREE.Vector3(), _h = new THREE.Vector3();

// Ray against a vehicle's oriented box. Returns distance or Infinity.
function rayVehicle(v, ox, oy, oz, dx, dy, dz, maxD) {
  const s = Math.sin(v.heading), c = Math.cos(v.heading);
  const rx = ox - v.pos.x, rz = oz - v.pos.z;
  // local axes: forward (s,c), left (c,-s)
  const lo = [rx * c - rz * s, oy - v.pos.y, rx * s + rz * c];
  const ld = [dx * c - dz * s, dy, dx * s + dz * c];
  const mn = [-v.T.wid / 2, v.cls === 'hover' ? -v.T.hover : 0, -v.T.len / 2], mx = [v.T.wid / 2, v.T.hgt, v.T.len / 2];
  let t0 = 0, t1 = maxD;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(ld[k]) < 1e-7) { if (lo[k] < mn[k] || lo[k] > mx[k]) return Infinity; continue; }
    let a = (mn[k] - lo[k]) / ld[k], b = (mx[k] - lo[k]) / ld[k];
    if (a > b) { const q = a; a = b; b = q; }
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    if (t0 > t1) return Infinity;
  }
  return t0;
}

export class Weapons {
  constructor(scene) {
    this.scene = scene;
    this.index = 0;
    this.owned = { fists: true, baton: true, pistol: true, emp: true, hack: true };
    this.clip = 12; this.reserve = 60; this.emps = 3;
    this.cool = 0; this.reloadT = 0; this.hackCool = 0;
    this.facingT = 0;
    this.spread = 0;
    this.target = null; // what the crosshair is over: {kind, obj, dist}
    // tracers
    this.tracers = [];
    const tgeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 5, 1, true);
    tgeo.rotateX(Math.PI / 2);
    tgeo.translate(0, 0, 0.5);
    this.tracerMats = {
      player: new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonCyan).multiplyScalar(2.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    };
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(tgeo, this.tracerMats.player.clone());
      m.visible = false; m.frustumCulled = false;
      scene.add(m);
      this.tracers.push({ mesh: m, t: 0 });
    }
    // bolts (enemy projectiles) and thrown charges
    this.bolts = [];
    const bgeo = new THREE.CylinderGeometry(0.07, 0.07, 1.6, 5);
    bgeo.rotateX(Math.PI / 2);
    this.boltMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.police).multiplyScalar(3), toneMapped: false });
    for (let i = 0; i < 28; i++) {
      const m = new THREE.Mesh(bgeo, this.boltMat);
      m.visible = false; m.frustumCulled = false;
      scene.add(m);
      this.bolts.push({ mesh: m, live: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, dmg: 8 });
    }
    this.charges = [];
    this.chargeGeo = new THREE.IcosahedronGeometry(0.16, 1);
    this.chargeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonCyan).multiplyScalar(2.5), toneMapped: false });
  }

  get current() { return WEAPONS[this.index]; }
  get facingCamera() { return this.facingT > 0; }
  select(i) {
    i = ((i % WEAPONS.length) + WEAPONS.length) % WEAPONS.length;
    if (!this.owned[WEAPONS[i].id]) return;
    if (i === this.index) return;
    this.index = i; this.reloadT = 0;
    G.player.setHeld(WEAPONS[i].held);
    emit('weaponChanged', WEAPONS[i]);
  }
  ammoText() {
    const w = this.current;
    if (w.id === 'pistol') return this.reloadT > 0 ? 'RELOADING' : `${this.clip} / ${this.reserve}`;
    if (w.id === 'emp') return `× ${this.emps}`;
    if (w.id === 'hack') return this.hackCool > 0 ? `${this.hackCool.toFixed(1)}s` : 'READY';
    return '';
  }

  // What is under the crosshair? Returns {kind, obj, dist, x,y,z}
  trace(maxD = 160, fromCamera = true) {
    const cam = G.camera;
    cam.getWorldPosition(_o); cam.getWorldDirection(_d);
    const pl = G.player;
    // start the ray at the player's depth so things between camera and player are ignored
    const skip = Math.max(0, _m.copy(pl.worldPos).sub(_o).dot(_d));
    const ox = _o.x + _d.x * skip, oy = _o.y + _d.y * skip, oz = _o.z + _d.z * skip;
    let best = { kind: 'none', obj: null, dist: maxD };
    const wall = rayBoxes(ox, oy, oz, _d.x, _d.y, _d.z, maxD);
    if (wall < best.dist) best = { kind: 'wall', obj: null, dist: wall };
    // terrain
    for (let t = 2; t < best.dist; t += 2.5) {
      const y = oy + _d.y * t;
      if (y < groundHeight(ox + _d.x * t, oz + _d.z * t, y + 1.5)) { best = { kind: 'ground', obj: null, dist: t }; break; }
    }
    for (const v of G.vehicles) {
      if (v === pl.vehicle || v.sunk) continue;
      const dx = v.pos.x - ox, dz = v.pos.z - oz;
      if (dx * dx + dz * dz > (best.dist + 6) * (best.dist + 6)) continue;
      const t = rayVehicle(v, ox, oy, oz, _d.x, _d.y, _d.z, best.dist);
      if (t < best.dist) best = { kind: 'vehicle', obj: v, dist: t };
    }
    const ph = G.peds.raycast(ox, oy, oz, _d.x, _d.y, _d.z, best.dist);
    if (ph) best = { kind: 'ped', obj: ph.ped, dist: ph.t };
    if (G.police) {
      const dr = G.police.rayDrones(ox, oy, oz, _d.x, _d.y, _d.z, best.dist);
      if (dr) best = { kind: 'drone', obj: dr.drone, dist: dr.t };
    }
    best.x = ox + _d.x * best.dist; best.y = oy + _d.y * best.dist; best.z = oz + _d.z * best.dist;
    best.dirX = _d.x; best.dirY = _d.y; best.dirZ = _d.z;
    return best;
  }

  tracer(from, to) {
    const tr = this.tracers.find((x) => x.t <= 0) || this.tracers[0];
    tr.mesh.position.copy(from);
    tr.mesh.lookAt(to);
    tr.mesh.scale.set(1, 1, from.distanceTo(to));
    tr.mesh.visible = true;
    tr.mesh.material.opacity = 1;
    tr.t = 0.09;
  }

  // Police / drone shot towards a point. accuracy 0..1
  fireBolt(x, y, z, tx, ty, tz, dmg = 8, accuracy = 0.8, owner = null) {
    const b = this.bolts.find((q) => !q.live);
    if (!b) return;
    const spread = (1 - accuracy) * 0.16;
    _m.set(tx - x, ty - y, tz - z).normalize();
    _m.x += rand(-spread, spread); _m.y += rand(-spread, spread) * 0.6; _m.z += rand(-spread, spread);
    _m.normalize();
    b.pos.set(x, y, z); b.vel.copy(_m).multiplyScalar(75);
    b.life = 2.2; b.live = true; b.dmg = dmg; b.owner = owner;
    b.mesh.visible = true;
    emit('sfx', 'policeShot', x, z);
  }

  throwEmp() {
    const pl = G.player;
    const cam = G.camera;
    cam.getWorldDirection(_d);
    const m = new THREE.Mesh(this.chargeGeo, this.chargeMat);
    const start = pl.vehicle ? _o.copy(pl.vehicle.pos).setY(pl.vehicle.pos.y + pl.vehicle.T.hgt + 0.4) : pl.muzzlePos(_o);
    m.position.copy(start);
    this.scene.add(m);
    const base = pl.vehicle ? pl.vehicle.vel : pl.vel;
    this.charges.push({ mesh: m, vel: new THREE.Vector3(_d.x * 19 + base.x, _d.y * 19 + 5.5, _d.z * 19 + base.z), life: 1.9 });
    emit('sfx', 'empThrow');
  }
  empBlast(x, y, z) {
    const fx = G.fx;
    fx.zap(x, y + 0.5, z, 60, 5);
    fx.glowPuff(x, y + 1, z, 0.3, 0.9, 1.0, 14, 0.35);
    fx.flash(x, y + 2, z, 0x66ddff, 700, 0.3);
    fx.addShake(0.5);
    emit('sfx', 'empBlast', x, z);
    const R = 14;
    let police = 0;
    for (const v of G.vehicles) {
      if (Math.hypot(v.pos.x - x, v.pos.z - z) > R + v.radius) continue;
      v.emp(v === G.player.vehicle ? 2.5 : 8);
      if (v.isPolice) police++;
    }
    for (const p of G.peds.list.slice()) {
      const d = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (d < R * 0.6) { G.peds.knock(p, (p.pos.x - x) * 0.6, 2.5, (p.pos.z - z) * 0.6, 12, 'player'); if (p.role === 'cop') police++; }
    }
    if (G.police) police += G.police.empDrones(x, y, z, R + 4);
    G.peds.scare(x, z, 45, 10);
    emit('crime', police ? 'empPolice' : 'emp', x, z);
  }

  update(dt, t) {
    const pl = G.player;
    this.cool -= dt; this.facingT -= dt;
    this.hackCool = Math.max(0, this.hackCool - dt);
    this.spread = Math.max(0, this.spread - dt * 2.5);
    // tracers fade
    for (const tr of this.tracers) if (tr.t > 0) { tr.t -= dt; tr.mesh.material.opacity = clamp(tr.t / 0.09, 0, 1); if (tr.t <= 0) tr.mesh.visible = false; }
    this.updateBolts(dt);
    this.updateCharges(dt);
    if (!pl.alive || pl.state !== 'foot' && !pl.vehicle) { this.target = null; return; }

    // selection
    if (Input.mouse.wheel) this.select(this.index + Math.sign(Input.mouse.wheel));
    for (let k = 0; k < WEAPONS.length; k++) if (Input.hit('Digit' + (k + 1))) this.select(k);
    const w = this.current;
    const inCar = !!pl.vehicle;
    if (pl.swimming) return;

    // reload
    if (w.id === 'pistol') {
      if (this.reloadT > 0) {
        this.reloadT -= dt;
        if (this.reloadT <= 0) { const n = Math.min(w.clip - this.clip, this.reserve); this.clip += n; this.reserve -= n; }
      } else if ((Input.hit('KeyR') && !inCar && this.clip < w.clip) || this.clip === 0) {
        if (this.reserve > 0) { this.reloadT = 1.15; emit('sfx', 'reload'); }
      }
    }
    // crosshair target (used by the HUD and the hack tool)
    this.target = (pl.aiming || w.id === 'hack' || inCar) ? this.trace(w.id === 'hack' ? 45 : 160) : null;

    const fire = Input.mouse.left, firePressed = Input.mouse.leftPressed;
    if (!Input.mouse.locked) return;
    if (inCar && w.id !== 'pistol' && w.id !== 'emp' && w.id !== 'hack') return;

    if (w.id === 'fists' || w.id === 'baton') {
      if (firePressed && this.cool <= 0) {
        this.cool = w.id === 'baton' ? 0.5 : 0.38;
        pl.punchT = 0.3;
        emit('sfx', 'whoosh');
        const s = Math.sin(pl.heading), c = Math.cos(pl.heading);
        const hx = pl.pos.x + s * 1.0, hz = pl.pos.z + c * 1.0;
        const ped = G.peds.nearest(hx, hz, 1.35, (p) => p.state !== 'down' && Math.abs(p.pos.y - pl.pos.y) < 1.5);
        if (ped) {
          if (w.id === 'baton') { G.peds.knock(ped, s * 4, 2.5, c * 4, 46, 'player'); G.fx.zap(ped.pos.x, ped.pos.y + 1.1, ped.pos.z, 12, 0.4); emit('sfx', 'baton', ped.pos.x, ped.pos.z); }
          else { G.peds.hurt(ped, 17, 'player', pl.pos.x, pl.pos.z); emit('sfx', 'punch', ped.pos.x, ped.pos.z); }
          emit('crime', ped.role === 'cop' ? 'assaultCop' : 'assault', ped.pos.x, ped.pos.z, ped);
        } else {
          const v = pl.nearestVehicle(1.6);
          if (v) { v.damage(w.id === 'baton' ? 5 : 1.5, 'player'); if (w.id === 'baton') { G.fx.zap(hx, pl.pos.y + 1, hz, 8, 0.4); emit('sfx', 'baton', hx, hz); } else emit('sfx', 'punch', hx, hz); if (v.driver === 'npc' && v.ai) v.ai.panic = t + 8; }
        }
      }
      return;
    }
    if (w.id === 'pistol') {
      if (fire && this.cool <= 0 && this.reloadT <= 0) {
        if (this.clip <= 0) { if (firePressed) emit('sfx', 'empty'); return; }
        this.cool = 0.2; this.clip--;
        this.facingT = 0.5; pl.recoil = 1;
        const hit = this.trace(170);
        // muzzle
        const from = inCar ? _h.copy(pl.vehicle.pos).setY(pl.vehicle.pos.y + pl.vehicle.T.hgt * 0.8) : pl.muzzlePos(_h);
        // spread grows when firing from the hip or on the move
        const sp = (pl.aiming ? 0.006 : 0.03) + this.spread * 0.02 + (inCar ? 0.02 : 0);
        _m.set(hit.x + rand(-sp, sp) * hit.dist, hit.y + rand(-sp, sp) * hit.dist, hit.z + rand(-sp, sp) * hit.dist);
        this.spread = Math.min(1.5, this.spread + 0.35);
        this.tracer(from, _m);
        G.fx.flash(from.x, from.y, from.z, 0x66e8ff, 60, 0.07);
        G.fx.glowPuff(from.x, from.y, from.z, 0.4, 0.95, 1.0, 0.9, 0.08);
        emit('sfx', 'pistol');
        emit('gunshot', pl.worldPos.x, pl.worldPos.z);
        G.peds.scare(pl.worldPos.x, pl.worldPos.z, 38, 9);
        if (hit.kind === 'ped') {
          G.peds.hurt(hit.obj, 34, 'player', pl.worldPos.x, pl.worldPos.z);
          G.fx.zap(hit.x, hit.y, hit.z, 8, 0.3);
          emit('crime', hit.obj.role === 'cop' ? 'assaultCop' : 'assault', hit.x, hit.z, hit.obj);
        } else if (hit.kind === 'vehicle') {
          hit.obj.damage(7, 'player');
          G.fx.sparks(hit.x, hit.y, hit.z, 7, -hit.dirX, -hit.dirZ, [0.5, 0.9, 1]);
          emit('sfx', 'bulletHit', hit.x, hit.z);
          if (hit.obj.driver === 'npc' && hit.obj.ai) hit.obj.ai.panic = t + 10;
          emit('crime', hit.obj.isPolice ? 'shootPolice' : 'shootVehicle', hit.x, hit.z, hit.obj);
        } else if (hit.kind === 'drone') {
          G.police.damageDrone(hit.obj, 16);
          G.fx.sparks(hit.x, hit.y, hit.z, 10, 0, 0, [0.5, 0.9, 1]);
        } else if (hit.kind !== 'none') {
          G.fx.sparks(hit.x, hit.y, hit.z, 5, -hit.dirX, -hit.dirZ, [0.5, 0.9, 1]);
          emit('sfx', 'bulletHit', hit.x, hit.z);
          emit('crime', 'gunfire', pl.worldPos.x, pl.worldPos.z);
        } else emit('crime', 'gunfire', pl.worldPos.x, pl.worldPos.z);
      }
      return;
    }
    if (w.id === 'emp') {
      if (firePressed && this.cool <= 0) {
        if (this.emps <= 0) { emit('sfx', 'empty'); return; }
        this.emps--; this.cool = 0.9; this.facingT = 0.5; pl.punchT = 0.3;
        this.throwEmp();
      }
      return;
    }
    if (w.id === 'hack') {
      if (firePressed) {
        const tg = this.target;
        if (this.hackCool > 0 || !tg || (tg.kind !== 'vehicle' && tg.kind !== 'drone')) { emit('sfx', 'hackFail'); return; }
        this.hackCool = 5; this.facingT = 0.6;
        emit('sfx', 'hack');
        if (tg.kind === 'drone') { G.police.hackDrone(tg.obj); emit('crime', 'hackPolice', tg.x, tg.z); }
        else {
          const v = tg.obj;
          v.emp(9); v.locked = false; v.sirenOn = false;
          G.fx.zap(v.pos.x, v.pos.y + 1, v.pos.z, 26, 1.4);
          emit('hacked', v);
          if (v.isPolice) emit('crime', 'hackPolice', v.pos.x, v.pos.z, v);
        }
        const from = inCar ? _h.copy(pl.vehicle.pos).setY(pl.vehicle.pos.y + 1.2) : pl.muzzlePos(_h);
        this.tracer(from, _m.set(tg.x, tg.y, tg.z));
      }
    }
  }

  updateBolts(dt) {
    const pl = G.player;
    for (const b of this.bolts) {
      if (!b.live) continue;
      b.life -= dt;
      const step = b.vel.length() * dt;
      const dx = b.vel.x / (step / dt), dy = b.vel.y / (step / dt), dz = b.vel.z / (step / dt);
      let hit = false;
      // player or their vehicle
      if (pl.alive) {
        if (pl.vehicle) {
          const t = rayVehicle(pl.vehicle, b.pos.x, b.pos.y, b.pos.z, dx, dy, dz, step);
          if (t < step) { pl.vehicle.damage(b.dmg * 0.7, 'police'); pl.hurt(b.dmg * 0.25, 'shot'); hit = true; G.fx.sparks(b.pos.x, b.pos.y, b.pos.z, 6, 0, 0, [0.4, 0.7, 1]); }
        } else {
          const px = pl.pos.x - b.pos.x, py = pl.pos.y + 1.0 - b.pos.y, pz = pl.pos.z - b.pos.z;
          const along = px * dx + py * dy + pz * dz;
          if (along > -0.5 && along < step + 0.5) {
            const cx = px - dx * along, cy = py - dy * along, cz = pz - dz * along;
            if (cx * cx + cz * cz < 0.28 && Math.abs(cy) < 1.0) { pl.hurt(b.dmg, 'shot'); hit = true; G.fx.zap(pl.pos.x, pl.pos.y + 1.1, pl.pos.z, 8, 0.3); }
          }
        }
      }
      if (!hit && rayBoxes(b.pos.x, b.pos.y, b.pos.z, dx, dy, dz, step) < step) { hit = true; G.fx.sparks(b.pos.x, b.pos.y, b.pos.z, 4, 0, 0, [0.4, 0.7, 1]); }
      b.pos.x += b.vel.x * dt; b.pos.y += b.vel.y * dt; b.pos.z += b.vel.z * dt;
      if (!hit && b.pos.y < groundHeight(b.pos.x, b.pos.z, b.pos.y + 1)) hit = true;
      if (hit || b.life <= 0) { b.live = false; b.mesh.visible = false; continue; }
      b.mesh.position.copy(b.pos);
      _m.copy(b.pos).add(b.vel);
      b.mesh.lookAt(_m);
    }
  }

  updateCharges(dt) {
    for (let i = this.charges.length - 1; i >= 0; i--) {
      const c = this.charges[i];
      c.life -= dt;
      c.vel.y -= 20 * dt;
      const p = c.mesh.position;
      p.x += c.vel.x * dt; p.y += c.vel.y * dt; p.z += c.vel.z * dt;
      c.mesh.rotation.x += dt * 9;
      let boom = c.life <= 0 || p.y <= groundHeight(p.x, p.z, p.y + 1) + 0.1;
      if (!boom) for (const v of G.vehicles) { if (v === G.player.vehicle) continue; if (Math.hypot(v.pos.x - p.x, v.pos.z - p.z) < v.radius && p.y < v.pos.y + v.T.hgt + 0.3) { boom = true; break; } }
      if (!boom && rayBoxes(p.x, p.y, p.z, c.vel.x, 0, c.vel.z, 0.02) < 0.02) boom = true;
      if (boom) {
        this.scene.remove(c.mesh);
        this.charges.splice(i, 1);
        this.empBlast(p.x, Math.max(p.y, groundHeight(p.x, p.z, p.y + 1)), p.z);
      }
    }
  }
}
