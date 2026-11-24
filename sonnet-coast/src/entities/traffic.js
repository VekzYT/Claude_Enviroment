// Civilian traffic: lane-following AI on the road graph, signals, spawning and despawning
// around the player, plus parked cars and fixed spawns (boats, bikes, trucks).
import { G, emit } from '../state.js';
import { Vehicle } from './vehicle.js';
import { VEHICLES, TRAFFIC_POOL } from './vehicleTypes.js';
import { edges, edgePoint, junctionTrim } from '../world/roads.js';
import { signalState } from '../world/props.js';
import { parkingSlots } from '../world/city.js';
import { boatSpawns } from '../world/landmarks.js';
import { POI, CITY } from '../world/layout.js';
import { driveToward, stopVehicle } from '../ai/driver.js';
import { clamp, wrapAngle } from '../util/math.js';
import { pick, rand, chance, hash2 } from '../util/rng.js';
import { PED_LOOKS } from './pedlooks.js';

const P = {};
const SPAWN_MIN = 120, SPAWN_MAX = 270, DESPAWN = 330;

// Follows lanes; one instance per traffic vehicle.
export class LaneDriver {
  constructor(edge, dir, s, lane) {
    this.edge = edge; this.dir = dir; this.s = s; this.lane = lane;
    this.pace = rand(0.82, 1.12);
    this.next = null;
    this.panic = 0;
    this.blockedT = 0;
    this.honkT = 0;
    this.wait = 0;
  }
  // distance left on this edge in the direction of travel
  remaining() { return this.dir > 0 ? this.edge.len - this.s : this.s; }
  endNode() { return this.dir > 0 ? this.edge.b : this.edge.a; }
  chooseNext() {
    const node = this.endNode();
    let opts = node.edges.filter((e) => e !== this.edge && e.type !== 'dirt');
    if (this.only) { const f = opts.filter(this.only); if (f.length) opts = f; }
    if (!opts.length) { this.next = { edge: this.edge, dir: -this.dir }; return; }
    // prefer carrying straight on
    const inPt = edgePoint(this.edge, this.dir > 0 ? this.edge.len - 1 : 1, 0, P);
    const hx = inPt.dx * this.dir, hz = inPt.dz * this.dir;
    let best = null, bw = -1;
    for (const e of opts) {
      const d = e.a === node ? 1 : -1;
      const q = edgePoint(e, d > 0 ? 2 : e.len - 2, 0, P);
      const dot = q.dx * d * hx + q.dz * d * hz;
      const w = (dot > 0.7 ? 3 : dot > -0.3 ? 1.3 : 0.15) * Math.random();
      if (w > bw) { bw = w; best = { edge: e, dir: d }; }
    }
    this.next = best;
  }
  lanePoint(edge, dir, s, lane, out) {
    const off = edge.spec.lanes[Math.min(lane, edge.spec.lanes.length - 1)] * dir;
    return edgePoint(edge, s, off, out);
  }
  control(v, dt, t) {
    const edge = this.edge;
    // project our position onto the edge to track progress
    const guess = edgePoint(edge, this.s, 0, P);
    const along = (v.pos.x - guess.x) * guess.dx + (v.pos.z - guess.z) * guess.dz;
    this.s = clamp(this.s + along, 0, edge.len);
    const node = this.endNode();
    const trim = junctionTrim(node, edge);
    const rem = this.remaining();
    if (!this.next) this.chooseNext();

    // target point: a little way ahead in our lane, or the start of the next edge's lane
    const look = clamp(v.speed * 0.9 + 5, 7, 22);
    let tx, tz;
    if (rem > trim + look * 0.5) {
      const p = this.lanePoint(edge, this.dir, this.s + this.dir * look, this.lane, P);
      tx = p.x; tz = p.z;
    } else {
      const n = this.next;
      const t2 = junctionTrim(node, n.edge) + 4;
      const p = this.lanePoint(n.edge, n.dir, n.dir > 0 ? t2 : n.edge.len - t2, this.lane, P);
      tx = p.x; tz = p.z;
      if (rem < 1.5 || Math.hypot(v.pos.x - node.x, v.pos.z - node.z) < Math.max(3, trim * 0.6)) {
        // hand over to the next edge
        this.edge = n.edge; this.dir = n.dir; this.s = n.dir > 0 ? 0.5 : n.edge.len - 0.5;
        this.next = null;
        this.lane = Math.min(this.lane, this.edge.spec.lanes.length - 1);
      }
    }

    let want = edge.spec.speed * this.pace;
    const panicking = this.panic > t;
    if (panicking) want *= 1.7;

    // signals: stop at the line unless we are already committed
    if (node.grid && edge.grid && !panicking) {
      const stopAt = trim + 6.5;
      const dStop = rem - stopAt;
      if (dStop > -2) {
        const sig = signalState(node, edge.axis, t);
        const brakeDist = (v.speed * v.speed) / (2 * v.T.brake * 0.55) + 3;
        if (sig === 'r' || (sig === 'a' && dStop > brakeDist * 0.7)) {
          if (dStop < brakeDist + 6) want = Math.min(want, Math.max(0, dStop) * 0.8);
          if (dStop < 1.2) want = 0;
        }
      }
    }

    // keep a gap to whatever is in front
    const fx = Math.sin(v.heading), fz = Math.cos(v.heading);
    let gap = 999, lead = null;
    for (const o of G.vehicles) {
      if (o === v || o.sunk) continue;
      const dx = o.pos.x - v.pos.x, dz = o.pos.z - v.pos.z;
      const f = dx * fx + dz * fz;
      if (f < 0 || f > 34) continue;
      const side = Math.abs(dx * -fz + dz * fx);
      if (side > 1.4 + o.T.wid * 0.5) continue;
      const g = f - v.T.len / 2 - o.T.len / 2;
      if (g < gap) { gap = g; lead = o; }
    }
    // pedestrians and the player on foot count too
    const pl = G.player;
    if (pl && !pl.vehicle && !panicking) {
      const dx = pl.pos.x - v.pos.x, dz = pl.pos.z - v.pos.z;
      const f = dx * fx + dz * fz;
      if (f > 0 && f < 16 && Math.abs(dx * -fz + dz * fx) < 1.8) gap = Math.min(gap, f - v.T.len / 2 - 0.6);
    }
    if (G.peds && !panicking) gap = Math.min(gap, G.peds.gapAhead(v, fx, fz));
    if (gap < 999) {
      const safe = 2.2 + v.speed * 0.7;
      if (gap < safe) want = Math.min(want, Math.max(0, (gap - 1.6) * 1.1));
      if (gap < 2.2) want = 0;
    }
    if (want < 0.5 && v.speed < 0.6) {
      this.blockedT += dt;
      if (this.blockedT > 3 && lead && (lead.driver === 'player' || !lead.driver) && t > this.honkT) {
        this.honkT = t + rand(2.5, 5);
        emit('horn', v);
      }
      // give up waiting behind a wreck: squeeze round it
      if (this.blockedT > 9 && lead && (lead.destroyed || !lead.driver)) { this.lane = this.lane ? 0 : Math.min(1, edge.spec.lanes.length - 1); this.blockedT = 4; }
    } else this.blockedT = 0;

    if (want <= 0.05) stopVehicle(v);
    else driveToward(v, tx, tz, want, dt);
  }
}

export class Traffic {
  constructor() {
    this.timer = 0;
    this.density = 1;
    this.slotUsed = new Set();
    this.fixed = [];
    this.buildFixed();
  }

  buildFixed() {
    const add = (type, x, z, heading, r = 320) => this.fixed.push({ type, x, z, heading, r, v: null, cool: 0 });
    for (const b of boatSpawns) add('boat', b.x, b.z, b.heading, 360);
    // hover-bikes
    add('hoverbike', POI.safehouse.x + 27, POI.safehouse.z + 6, Math.PI / 2);
    add('hoverbike', 824, 14, 0);
    add('hoverbike', 470, -12, Math.PI / 2);
    add('hoverbike', POI.lookout.x + 8, POI.lookout.z + 6, 0);
    add('hoverbike', POI.gator.x + 16, POI.gator.z + 4, 0);
    add('hoverbike', POI.ridge.x - 60, POI.ridge.z + 40, 0);
    // off-roaders at the trail heads
    add('truck', POI.lookout.x - 8, POI.lookout.z + 8, Math.PI);
    add('buggy', POI.lookout.x - 14, POI.lookout.z + 4, Math.PI);
    add('truck', POI.gator.x - 14, POI.gator.z + 6, 0.4);
    add('buggy', POI.camp.x + 2, POI.camp.z + 12, 1.2);
    add('truck', POI.jetty.x + 12, POI.jetty.z - 10, 0);
    add('buggy', POI.port.x + 20, POI.port.z - 62, Math.PI / 2);
    add('buggy', 866, 120, 0);
    add('truck', 866, -330, 0);
    add('sedan', POI.safehouse.x - 18, POI.safehouse.z + 6, Math.PI / 2);
  }

  playerPos() {
    const p = G.player;
    return p.vehicle ? p.vehicle.pos : p.pos;
  }

  spawnOnRoad(pp) {
    // candidate edges by distance
    let tries = 14;
    while (tries-- > 0) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      if (e.type === 'dirt' && !chance(0.08)) continue;
      const s = rand(8, e.len - 8);
      if (s < 0) continue;
      edgePoint(e, s, 0, P);
      const d = Math.hypot(P.x - pp.x, P.z - pp.z);
      if (d < SPAWN_MIN || d > SPAWN_MAX) continue;
      if (P.bridge && chance(0.5)) continue;
      const dir = chance(0.5) ? 1 : -1;
      const lane = e.spec.lanes.length > 1 && chance(0.45) ? 1 : 0;
      const off = e.spec.lanes[lane] * dir;
      const lp = edgePoint(e, s, off, {});
      let clear = true;
      for (const o of G.vehicles) if ((o.pos.x - lp.x) ** 2 + (o.pos.z - lp.z) ** 2 < 15 * 15) { clear = false; break; }
      if (!clear) continue;
      const patrol = e.type !== 'dirt' && chance(0.06);
      const type = patrol ? 'police' : e.type === 'dirt' ? pick(['truck', 'buggy']) : e.type === 'highway' && chance(0.25) ? pick(['truck', 'van', 'sport']) : pick(TRAFFIC_POOL);
      const heading = Math.atan2(lp.dx * dir, lp.dz * dir);
      const v = new Vehicle(type, lp.x, lp.z, heading);
      v.driver = 'npc';
      v.npc = pick(PED_LOOKS);
      v.ai = new LaneDriver(e, dir, s, lane);
      v.traffic = true;
      v.patrol = patrol;
      const sp = e.spec.speed * 0.7;
      v.vel.set(Math.sin(heading) * sp, 0, Math.cos(heading) * sp);
      return v;
    }
    return null;
  }

  update(dt, t) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.35;
    const pp = this.playerPos();
    const night = G.env.night;
    const inCity = pp.x > CITY.x0 - 80 && pp.x < CITY.x1 + 80 && pp.z > CITY.z0 - 80 && pp.z < CITY.z1 + 80;
    const want = Math.round((inCity ? 20 : 8) * this.density * (1 - night * 0.3));
    let moving = 0;
    const cam = G.camera.position;
    for (let i = G.vehicles.length - 1; i >= 0; i--) {
      const v = G.vehicles[i];
      const d = Math.hypot(v.pos.x - pp.x, v.pos.z - pp.z);
      v.far = Math.hypot(v.pos.x - cam.x, v.pos.z - cam.z) > 150;
      v.lightsOn = night > 0.35 && !!v.driver;
      if (v === G.player.vehicle || v.mission || v.keep) continue;
      if (v.traffic && v.driver === 'npc') {
        if (d > DESPAWN) { v.dispose(); continue; }
        moving++;
        continue;
      }
      // everything else: parked cars, abandoned cars, wrecks
      const idle = t - v.lastUsed;
      if ((v.destroyed && ((v.wreckT > 25 && d > 90) || v.wreckT > 80 || v.sunk)) || (d > (v.slotKey !== undefined && !v.stolen ? 210 : DESPAWN + 40) && idle > 20) || (v.sunk && d > 60)) {
        if (v.slotKey !== undefined) this.slotUsed.delete(v.slotKey);
        if (v.fixedRef) { v.fixedRef.v = null; v.fixedRef.cool = t + 30; }
        v.dispose();
      }
    }
    if (moving < want) for (let k = 0; k < 2 && moving + k < want; k++) this.spawnOnRoad(pp);

    // parked cars in lots (a capped number, nearest lots first come first served)
    let parked = 0;
    for (const v of G.vehicles) if (v.slotKey !== undefined) parked++;
    for (let i = 0; i < parkingSlots.length && parked < 26; i++) {
      const sl = parkingSlots[i];
      if (this.slotUsed.has(i)) continue;
      const d = Math.hypot(sl.x - pp.x, sl.z - pp.z);
      if (d > 170 || d < 40) continue;
      const fill = sl.kind === 'police' ? 0.4 : sl.kind === 'vanta' ? 0.25 : 0.3;
      this.slotUsed.add(i);
      if (hash2(i, 7, Math.floor(t / 600)) > fill) continue;
      const type = sl.kind === 'police' ? 'police' : sl.kind === 'vanta' ? pick(['sport', 'sedan', 'sport']) : sl.kind === 'retune' ? pick(['sport', 'truck', 'sedan']) : pick(TRAFFIC_POOL);
      const v = new Vehicle(type, sl.x, sl.z, sl.heading + (chance(0.5) ? Math.PI : 0), { locked: type !== 'police' && chance(0.5) });
      v.slotKey = i;
      v.parked = true;
      parked++;
    }
    // forget empty slots once the player has moved away, so lots refill on the next visit
    if (this.slotUsed.size > 400) {
      for (const i of this.slotUsed) {
        const sl = parkingSlots[i];
        if (Math.hypot(sl.x - pp.x, sl.z - pp.z) > 260) this.slotUsed.delete(i);
      }
    }
    // fixed spawns
    for (const f of this.fixed) {
      if (f.v && (f.v.removed || f.v.destroyed)) { f.v = null; f.cool = t + 40; }
      if (f.v) continue;
      const d = Math.hypot(f.x - pp.x, f.z - pp.z);
      if (d > f.r || d < 35 || t < f.cool) continue;
      const v = new Vehicle(f.type, f.x, f.z, f.heading);
      v.fixedRef = f;
      v.parked = true;
      f.v = v;
    }
  }
}
