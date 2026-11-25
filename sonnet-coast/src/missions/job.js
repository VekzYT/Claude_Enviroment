// Base class and shared helpers for jobs (missions and activities).
import { G, on, emit } from '../state.js';
import { Vehicle } from '../entities/vehicle.js';
import { LaneDriver } from '../entities/traffic.js';
import { driveToward, stopVehicle } from '../ai/driver.js';
import { nearestNode, findPath, edges, edgePoint } from '../world/roads.js';
import { segmentBlocked } from '../world/colliders.js';
import { clamp, wrapAngle } from '../util/math.js';
import { rand, pick } from '../util/rng.js';
import { PAL } from '../world/palette.js';
import { PED_LOOKS } from '../entities/pedlooks.js';

export const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const P = {};

export class Job {
  constructor(M) { this.M = M; this.vehicles = []; this.rings = []; this.goons = []; this.step = ''; this.t = 0; this.offs = []; }
  obj(text, dest = null, blips = null) { this.M.setObjective(text, dest, blips); }
  say(who, text) { G.hud.say(who, text); }
  spawn(type, x, z, heading, opts = {}) { const v = new Vehicle(type, x, z, heading, { ...opts, mission: true }); this.vehicles.push(v); return v; }
  ring(x, z, r = 6, color = PAL.neonAmber, y = null) { const m = this.M.makeRing(x, z, r, color, y); this.rings.push(m); return m; }
  dropRing(m) { if (!m) return; G.scene.remove(m.mesh); const i = this.rings.indexOf(m); if (i >= 0) this.rings.splice(i, 1); }
  inRing(m, pos, extra = 0) { return m && Math.hypot(pos.x - m.x, pos.z - m.z) < m.r + extra && Math.abs(pos.y - m.y) < 6; }
  listen(name, fn) { on(name, fn); this.offs.push([name, fn]); }
  pass(reward, sub = '') { this.M.finish(true, reward, sub); }
  fail(reason) { this.M.finish(false, 0, reason); }
  cleanup() {
    for (const r of this.rings.slice()) this.dropRing(r);
    for (const v of this.vehicles) { v.mission = false; v.keep = false; if (v !== G.player.vehicle) v.lastUsed = -999; }
    for (const p of this.goons) { p.keep = false; p.brain = null; p.aim = 0; if (p.state !== 'down') { p.role = 'gone'; p.state = 'flee'; p.fleeFrom = { x: G.player.worldPos.x, z: G.player.worldPos.z }; p.stateT = 30; } }
    for (const [name, fn] of this.offs) { const l = G.events.get(name); if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } }
    G.hud.progress(null);
  }
  update() {}
}

// A lane-following vehicle that drives a planned route from near (x,z) to near (tx,tz).
export function spawnOnRoute(job, type, x, z, tx, tz, opts = {}) {
  const from = nearestNode(x, z, (n) => n.edges.some((e) => e.type !== 'dirt'));
  const to = nearestNode(tx, tz, (n) => n.edges.some((e) => e.type !== 'dirt'));
  const path = findPath(from, to, false) || [];
  let first = path[0];
  if (!first) { const e = from.edges.find((q) => q.type !== 'dirt'); first = { e, forward: e.a === from }; }
  const dir = first.forward ? 1 : -1;
  const s = first.forward ? Math.min(14, first.e.len / 2) : Math.max(first.e.len - 14, first.e.len / 2);
  const lp = edgePoint(first.e, s, first.e.spec.lanes[0] * dir, {});
  const heading = Math.atan2(lp.dx * dir, lp.dz * dir);
  const v = job.spawn(type, lp.x, lp.z, heading, opts);
  const ld = new LaneDriver(first.e, dir, s, 0);
  ld.route = path.slice(1).map((q) => ({ edge: q.e, dir: q.forward ? 1 : -1 }));
  v.ai = ld; v.driver = 'npc'; v.keep = true; v.npc = pick(PED_LOOKS);
  return v;
}

// A hostile on foot: closes to medium range and fires. Never draws police heat when hit.
export function spawnGoon(job, x, z) {
  const look = { skin: pick([0xe0ac8a, 0xc68863, 0x9a6645]), top: 0x17181c, bottom: 0x101114, hair: 0x0c0c0e, hat: false, glow: 0xdff2ff, scale: 1.03 };
  const p = G.peds.spawn(x, z, look, { role: 'goon', health: 55 });
  if (!p) return null;
  p.keep = true; p.outlaw = true;
  let shootT = rand(0.9, 1.9);
  p.brain = (ped, dt) => {
    const pl = G.player, pp = pl.worldPos;
    if (!pl.alive) { ped.aim = 0; return 0; }
    const dx = pp.x - ped.pos.x, dz = pp.z - ped.pos.z, d = Math.hypot(dx, dz);
    const sees = d < 60 && !segmentBlocked(ped.pos.x, ped.pos.z, pp.x, pp.z, ped.pos.y + 1.4);
    ped.aim = 0;
    if (sees && d < 30) {
      ped.heading += clamp(wrapAngle(Math.atan2(dx, dz) - ped.heading), -dt * 8, dt * 8);
      ped.aim = 1;
      shootT -= dt;
      if (shootT <= 0) {
        shootT = rand(1.1, 2.0);
        const acc = clamp(0.8 - d * 0.012 - pl.worldSpeed * 0.03, 0.3, 0.75);
        G.weapons.fireBolt(ped.pos.x + Math.sin(ped.heading) * 0.5, ped.pos.y + 1.35, ped.pos.z + Math.cos(ped.heading) * 0.5, pp.x, pp.y + 1.0, pp.z, 7, acc);
      }
      if (d > 15) { ped.dest = { x: pp.x, z: pp.z }; return 2.2; }
      return 0;
    }
    ped.dest = { x: pp.x, z: pp.z };
    return 4.8;
  };
  job.goons.push(p);
  return p;
}

// A carload of goons: drives to (tx,tz), stops, and everyone gets out.
export function spawnGoonCar(job, tx, tz, count = 2) {
  const pp = { x: tx, z: tz };
  for (let k = 0; k < 30; k++) {
    const e = edges[Math.floor(Math.random() * edges.length)];
    if (e.type === 'dirt') continue;
    const s = rand(6, e.len - 6);
    edgePoint(e, s, 0, P);
    const d = Math.hypot(P.x - pp.x, P.z - pp.z);
    if (d < 100 || d > 190 || P.bridge) continue;
    const toward = (pp.x - P.x) * P.dx + (pp.z - P.z) * P.dz >= 0 ? 1 : -1;
    const lp = edgePoint(e, s, e.spec.lanes[0] * toward, {});
    let clear = true;
    for (const o of G.vehicles) if ((o.pos.x - lp.x) ** 2 + (o.pos.z - lp.z) ** 2 < 144) { clear = false; break; }
    if (!clear) continue;
    const v = job.spawn('sedan', lp.x, lp.z, Math.atan2(P.dx * toward, P.dz * toward), { paint: 0x15161a });
    v.driver = 'goon'; v.keep = true; v.outlaw = true;
    let stuck = 0, out = false;
    v.ai = {
      control(car, dt) {
        const d2 = Math.hypot(tx - car.pos.x, tz - car.pos.z);
        if (car.speed < 1.2 && d2 < 45) stuck += dt; else stuck = Math.max(0, stuck - dt);
        if (!out && (d2 < 15 || stuck > 2.5)) {
          out = true;
          for (let i = 0; i < count; i++) { const q = car.doorPos(i % 2 ? 1 : -1); spawnGoon(job, q.x, q.z); }
          car.ai = null; car.driver = null;
          emit('sfx', 'doorOpen', car.pos.x, car.pos.z);
          return;
        }
        driveToward(car, tx, tz, 24, dt, { avoid: true, allowReverse: true, noWater: true, arrive: true });
      },
    };
    return v;
  }
  return null;
}

export { stopVehicle, driveToward };
