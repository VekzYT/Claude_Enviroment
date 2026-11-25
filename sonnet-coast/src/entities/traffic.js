// Civilian traffic: lane-following AI on the road graph (lane changes and overtaking, signals, giving way,
// reacting to the player), spawning and recycling around the player, buses on the boulevards, taxis that
// pull in to the kerb, parked cars in car parks and kerbside bays, and fixed spawns (boats, bikes, trucks).
import * as THREE from 'three';
import { G, emit, on } from '../state.js';
import { Vehicle } from './vehicle.js';
import { VEHICLES, TRAFFIC_POOL } from './vehicleTypes.js';
import { edges, edgePoint, junctionTrim } from '../world/roads.js';
import { signalState } from '../world/props.js';
import { parkingSlots } from '../world/city.js';
import { boatSpawns } from '../world/landmarks.js';
import { segmentBlocked } from '../world/colliders.js';
import { POI, CITY } from '../world/layout.js';
import { driveToward, stopVehicle } from '../ai/driver.js';
import { clamp } from '../util/math.js';
import { pick, rand, chance, hash2 } from '../util/rng.js';
import { PED_LOOKS } from './pedlooks.js';

const P = {}, Q = {};
// Moving traffic appears 40-150 m out, likelier nearer, but no closer than 115 m in plain view, and goes
// beyond 160 m (240 m while still in view): the streets around the player are the busy ones.
const SPAWN_HIDDEN = 40, SPAWN_VIEW = 115, SPAWN_MAX = 150, DESPAWN = 160, DESPAWN_SEEN = 240, ABANDON = 370;
const CITY_CARS = 70, OUT_CARS = 24, BUSES = 3, LOT_CARS = 36, KERB_CARS = 32;
const SLOT_CELL = 60;   // parking slots are bucketed on this grid
// what parks in a bay (nothing longer than the bay)
const PARK_POOL = TRAFFIC_POOL.filter((id) => VEHICLES[id].len < 5.5);
// how much more often each kind of road gets a car, per metre
const ROAD_WEIGHT = { blvd: 4, highway: 2, city: 1, road: 0.9, dirt: 0.05 };

// Which side of a street has kerbside parking (that lane is then closed to traffic): edge -> [dir +1, dir -1]
const kerbSides = new Map();
const kerbParked = (edge, dir) => { const k = kerbSides.get(edge); return !!k && k[dir > 0 ? 0 : 1]; };
// Bus stops: edge -> [s along the edge for dir +1 or null, same for dir -1]
const busStops = new Map();

// Vehicles bucketed on a coarse grid once a frame, for the drivers' look-ahead.
const CELL = 24, cells = new Map(), filled = [], near = [];
let gridAt = -1;
function around(x0, z0, x1, z1) {
  if (gridAt !== G.time) {
    gridAt = G.time;
    for (const a of filled) a.length = 0;
    filled.length = 0;
    for (const v of G.vehicles) {
      if (v.sunk) continue;
      const k = Math.floor(v.pos.x / CELL) * 1000 + Math.floor(v.pos.z / CELL);
      let a = cells.get(k);
      if (!a) cells.set(k, (a = []));
      if (!a.length) filled.push(a);
      a.push(v);
    }
  }
  near.length = 0;
  for (let cx = Math.floor(x0 / CELL), cx1 = Math.floor(x1 / CELL); cx <= cx1; cx++) {
    for (let cz = Math.floor(z0 / CELL), cz1 = Math.floor(z1 / CELL); cz <= cz1; cz++) {
      const a = cells.get(cx * 1000 + cz);
      if (a) for (let i = 0; i < a.length; i++) near.push(a[i]);
    }
  }
  return near;
}

let lastHorn = -9;
function honk(v, t) {
  // one horn at a time across the whole city, and only where it can be heard
  if (t - lastHorn < 0.7 || v.far) return;
  lastHorn = t;
  emit('horn', v);
}

// Follows lanes; one instance per traffic vehicle (missions and the police reuse it for scripted drives).
export class LaneDriver {
  constructor(edge, dir, s, lane) {
    this.edge = edge; this.dir = dir; this.s = s; this.lane = lane;
    this.home = lane;            // the lane it returns to after overtaking
    this.off = edge.spec.lanes[Math.min(lane, edge.spec.lanes.length - 1)];   // distance right of the centre line
    this.pace = rand(0.82, 1.12);
    this.next = null;
    this.panic = 0;
    this.blockedT = 0;
    this.honkT = 0;
    this.wait = 0;
    this.laneT = rand(0, 1);     // next look at the other lane
    this.dodge = 0; this.dodgeT = 0;
    this.stopKind = null;        // 'taxi' | 'bus': pulls in to the kerb now and then
    this.stop = null; this.nextStopT = 0; this.lastStop = null;
    this.skip = false;
    this.stick = 1;
  }
  // distance left on this edge in the direction of travel
  remaining() { return this.dir > 0 ? this.edge.len - this.s : this.s; }
  endNode() { return this.dir > 0 ? this.edge.b : this.edge.a; }
  chooseNext() {
    // a planned route (jobs use this) takes priority over wandering
    if (this.route && this.route.length) { this.next = this.route.shift(); return; }
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
      // ambient drivers (stick > 1) tend to stay on the kind of road they are on, so the boulevards stay busy
      const w = (dot > 0.7 ? 3 : dot > -0.3 ? 1.3 : 0.15) * (e.type === this.edge.type ? this.stick : 1) * Math.random();
      if (w > bw) { bw = w; best = { edge: e, dir: d }; }
    }
    this.next = best;
  }
  // Is the other lane free from `back` metres behind to `ahead` metres in front?
  laneClear(v, lane, back, ahead) {
    const e = this.edge, off = e.spec.lanes[lane] * this.dir;
    const c = edgePoint(e, this.s, off, Q);
    const fx = c.dx * this.dir, fz = c.dz * this.dir;
    for (const o of around(c.x - 32, c.z - 32, c.x + 32, c.z + 32)) {
      if (o === v) continue;
      const dx = o.pos.x - c.x, dz = o.pos.z - c.z;
      if (dx * dx + dz * dz > 1600) continue;
      const f = dx * fx + dz * fz;
      if (f < -back || f > ahead) continue;
      if (Math.abs(dx * -fz + dz * fx) < 1.3 + o.T.wid * 0.5) return false;
    }
    return true;
  }
  control(v, dt, t) {
    // away from the camera the driver thinks every other frame; the pedals and wheel hold in between
    if (v.lite) { if ((this.skip = !this.skip)) return; dt *= 2; } else this.skip = false;
    const edge = this.edge, lanes = edge.spec.lanes, amb = v.traffic;
    // project our position onto the edge to track progress
    const guess = edgePoint(edge, this.s, 0, P);
    const along = (v.pos.x - guess.x) * guess.dx + (v.pos.z - guess.z) * guess.dz;
    this.s = clamp(this.s + along, 0, edge.len);
    const node = this.endNode();
    const trim = junctionTrim(node, edge);
    const rem = this.remaining();
    if (!this.next) this.chooseNext();
    const panicking = this.panic > t;
    let want = edge.spec.speed * this.pace;
    if (panicking) want *= 1.7;
    const fx = Math.sin(v.heading), fz = Math.cos(v.heading);

    // a kerbside stop (taxis and buses): ease over to the kerb, stand, let someone out, pull away
    let pull = 0;
    if (panicking) this.stop = null;
    else if (amb && this.stopKind) want = Math.min(want, this.kerbStop(v, t, rem, trim));
    if (this.stop) pull = edge.spec.hw - v.T.wid / 2 - 0.4;

    // lateral target: our lane, the kerb for a stop, or a swerve away from the player
    let offT = pull || lanes[Math.min(this.lane, lanes.length - 1)];
    if (this.dodgeT > t) offT += this.dodge;
    offT = clamp(offT, 0.9, edge.spec.hw - v.T.wid / 2 - 0.3);
    this.off += clamp(offT - this.off, -dt * 2.4, dt * 2.4);

    // target point: a little way ahead in our lane, or the start of the next edge's lane
    const look = clamp(v.speed * 0.9 + 5, 7, 22);
    let tx, tz;
    if (rem > trim + look * 0.5) {
      const p = edgePoint(edge, this.s + this.dir * look, this.off * this.dir, P);
      tx = p.x; tz = p.z;
    } else {
      const n = this.next, nl = n.edge.spec.lanes;
      const t2 = junctionTrim(node, n.edge) + 4;
      const p = edgePoint(n.edge, n.dir > 0 ? t2 : n.edge.len - t2, nl[Math.min(this.lane, nl.length - 1)] * n.dir, P);
      tx = p.x; tz = p.z;
      if (rem < 1.5 || Math.hypot(v.pos.x - node.x, v.pos.z - node.z) < Math.max(3, trim * 0.6)) {
        // hand over to the next edge, back in our own lane (the inner one where the kerb lane is parked up)
        this.edge = n.edge; this.dir = n.dir; this.s = n.dir > 0 ? 0.5 : n.edge.len - 0.5;
        this.next = null; this.stop = null;
        this.lane = Math.min(this.home, nl.length - 1);
        if (kerbParked(n.edge, n.dir)) this.lane = 0;
      }
    }

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
    let gap = 999, lead = null, why = null;
    const ex = v.pos.x + fx * 34, ez = v.pos.z + fz * 34;
    for (const o of around(Math.min(v.pos.x, ex) - 4, Math.min(v.pos.z, ez) - 4, Math.max(v.pos.x, ex) + 4, Math.max(v.pos.z, ez) + 4)) {
      if (o === v) continue;
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
      if (f > 0 && f < 16 && Math.abs(dx * -fz + dz * fx) < 1.8) { const g = f - v.T.len / 2 - 0.6; if (g < gap) { gap = g; why = 'player'; } }
    }
    if (G.peds && !panicking && v.lite !== 7) { const g = G.peds.gapAhead(v, fx, fz); if (g < gap) { gap = g; why = 'ped'; } }
    if (amb && !panicking) want = this.react(v, t, want, fx, fz);
    if (gap < 999) {
      const safe = 2.2 + v.speed * 0.7;
      if (gap < safe) want = Math.min(want, Math.max(0, (gap - 1.6) * 1.1));
      if (gap < 2.2) want = 0;
    }

    // overtake whatever holds us up on a two-lane carriageway, then drift back to our own lane
    if (amb && lanes.length > 1 && t > this.laneT && !this.stop) {
      this.laneT = t + rand(0.5, 0.9);
      const other = this.lane ? 0 : 1;
      const slowLead = lead && gap < 30 && (lead.speed < edge.spec.speed * this.pace * 0.7 || !lead.driver);
      const goHome = !slowLead && this.lane !== this.home;
      const open = rem > trim + 26 && !(other === 1 && kerbParked(edge, this.dir));
      if ((slowLead || goHome) && open && this.laneClear(v, other, 8 + v.speed * 0.5, goHome ? 30 : 22)) this.lane = other;
    }

    if (want < 0.5 && v.speed < 0.6) {
      this.blockedT += dt;
      // lean on the horn at the player, a parked-up wreck or someone dawdling in the road
      const rude = why || (lead && (lead.driver === 'player' || !lead.driver));
      if (this.blockedT > (why === 'ped' ? 4 : 2.5) && rude && t > this.honkT) { this.honkT = t + rand(2.5, 5); honk(v, t); }
      // give up waiting behind a wreck: squeeze round it
      if (this.blockedT > 9 && lead && (lead.destroyed || !lead.driver)) { this.lane = this.lane ? 0 : Math.min(1, lanes.length - 1); this.blockedT = 4; }
    } else this.blockedT = 0;

    if (want <= 0.05) stopVehicle(v);
    else driveToward(v, tx, tz, want, dt);
  }

  // The player driving at us: brake, swerve away from where they will pass and sound the horn.
  // A police car with its siren on behind us: move over to the kerb lane and ease off.
  react(v, t, want, fx, fz) {
    const pv = G.player.vehicle;
    if (pv && pv !== v && pv.speed > 6) {
      const rx = pv.pos.x - v.pos.x, rz = pv.pos.z - v.pos.z;
      if (rx * rx + rz * rz < 2000) {
        const ux = pv.vel.x - v.vel.x, uz = pv.vel.z - v.vel.z;
        const tc = -(rx * ux + rz * uz) / Math.max(ux * ux + uz * uz, 1);
        const cx = rx + ux * tc, cz = rz + uz * tc;
        if (tc > 0 && tc < 1.8 && cx * cx + cz * cz < 10) {
          if (t > this.dodgeT) {
            this.dodge = (cx * -fz + cz * fx > 0 ? -1 : 1) * 2.2;   // they pass on our right: go left, and vice versa
            if (chance(0.6)) honk(v, t);
          }
          this.dodgeT = t + 1.2;
          if (rx * fx + rz * fz > 0) want = Math.min(want, v.speed * 0.5);   // braking only helps if they are not behind us
        }
      }
    }
    const sirens = G.traffic.sirens;
    for (let i = 0; i < sirens.length; i++) {
      const s = sirens[i];
      const dx = s.pos.x - v.pos.x, dz = s.pos.z - v.pos.z;
      const f = dx * fx + dz * fz;
      if (f > -4 || f < -45 || Math.abs(dx * -fz + dz * fx) > 8) continue;
      if (Math.sin(s.heading) * fx + Math.cos(s.heading) * fz < 0.5) continue;
      if (this.edge.spec.lanes.length > 1 && !kerbParked(this.edge, this.dir)) this.lane = 1;
      want = Math.min(want, 6);
      break;
    }
    return want;
  }

  // Taxi and bus stops. Returns the speed limit the stop imposes.
  kerbStop(v, t, rem, trim) {
    const e = this.edge;
    if (!this.stop && t > this.nextStopT && this.lastStop !== e && e.grid && !kerbParked(e, this.dir)) {
      if (this.stopKind === 'bus') {
        const st = busStops.get(e), s = st && st[this.dir > 0 ? 0 : 1];
        const ahead = s === null || s === undefined ? -1 : (s - this.s) * this.dir;
        if (ahead > 25 && ahead < 70) this.stop = { s, t: 0 };
      } else if (rem > trim + 45 && (e.type === 'city' || e.type === 'blvd') && chance(0.3)) {
        this.stop = { s: this.s + this.dir * 32, t: 0 };
      }
      if (!this.stop) this.nextStopT = t + 2;
    }
    const st = this.stop;
    if (!st) return 99;
    const left = (st.s - this.s) * this.dir;
    if (!st.t) {
      if (left > 0.8 && !(left < 3 && v.speed < 0.4)) return Math.max(1.2, Math.sqrt(2 * 2.2 * Math.max(0, left - 0.5)));
      // arrived: wait a few seconds and let someone out on the kerb side
      st.t = t + (this.stopKind === 'bus' ? rand(7, 11) : rand(5, 9));
      if (G.peds && !G.indoors && !v.far) {
        for (let k = this.stopKind === 'bus' ? Math.floor(rand(1, 3.5)) : 1; k > 0; k--) {
          const d = v.doorPos(1);
          const along = this.stopKind === 'bus' ? v.T.len * 0.36 - k * 0.9 : -0.3;
          const p = G.peds.civ(d.x + Math.sin(v.heading) * along, d.z + Math.cos(v.heading) * along, pick(PED_LOOKS), 'idle');
          if (p) { p.heading = v.heading - Math.PI / 2; G.peds.wander(p); }
        }
      }
    }
    if (t < st.t) return 0;
    this.stop = null; this.lastStop = this.edge;
    this.nextStopT = t + (this.stopKind === 'bus' ? 4 : rand(35, 80));
    return 99;
  }
}

const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sph = new THREE.Sphere();

export class Traffic {
  constructor() {
    this.timer = 0;
    this.density = 1;
    this.slotUsed = new Set();
    this.fixed = [];
    this.sirens = [];
    this.racing = false;
    this.cand = []; this.candW = 0;
    this.buildFixed();
    this.buildStreets();
    on('gunshot', (x, z) => this.alarm(x, z, 55));
    on('vehicleExploded', (v) => this.alarm(v.pos.x, v.pos.z, 70));
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
    add('moto', POI.safehouse.x - 22, POI.safehouse.z + 6.5, Math.PI / 2);
  }

  // Kerbside bays on about half the sides of the quieter grid streets (that lane is closed to traffic),
  // the bus stops beside the boulevard shelters, and every edge's bounding box for picking spawn roads.
  buildStreets() {
    this.slots = parkingSlots.slice();
    this.lotCount = this.slots.length;
    for (const e of edges) {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const p of e.pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
      e.box = [x0, x1, z0, z1];
      if (!e.grid) continue;
      if (e.type === 'city') {
        const sides = [hash2(e.id, 3, 11) < 0.45, hash2(e.id, 5, 11) < 0.45];
        if (!sides[0] && !sides[1]) continue;
        kerbSides.set(e, sides);
        const t0 = junctionTrim(e.a, e) + 14, t1 = e.len - junctionTrim(e.b, e) - 14;
        sides.forEach((on, k) => {
          if (!on) return;
          const dir = k ? -1 : 1;
          for (let s = t0; s < t1; s += 6.6) {
            const p = edgePoint(e, s, (e.spec.hw - 1.35) * dir, P);
            if (!p.bridge) this.slots.push({ x: p.x, z: p.z, heading: Math.atan2(p.dx * dir, p.dz * dir), kind: 'kerb' });
          }
        });
      } else if (e.type === 'blvd') {
        // a shelter sits 74 m along the edge on either side; its back wall is a collider we can feel for
        const st = [null, null];
        for (const [k, side] of [[0, 1], [1, -1]]) {
          const a = edgePoint(e, 72.5, (e.spec.hw + 3.42) * side, P), ax = a.x, az = a.z;
          const b = edgePoint(e, 75.5, (e.spec.hw + 3.42) * side, P);
          if (e.len > 90 && segmentBlocked(ax, az, b.x, b.z, CITY.y + 1.5)) st[k] = 74;
        }
        if (st[0] !== null || st[1] !== null) busStops.set(e, st);
      }
    }
    this.slotCells = new Map();
    this.slots.forEach((sl, i) => {
      const k = Math.floor(sl.x / SLOT_CELL) * 1000 + Math.floor(sl.z / SLOT_CELL);
      if (!this.slotCells.has(k)) this.slotCells.set(k, []);
      this.slotCells.get(k).push(i);
    });
  }

  playerPos() {
    const p = G.player;
    return p.vehicle ? p.vehicle.pos : p.pos;
  }

  inView(x, y, z, r = 4) {
    _sph.center.set(x, y + 1, z); _sph.radius = r;
    return _fr.intersectsSphere(_sph);
  }

  // Panic: everyone driving near a gunshot or an explosion floors it, ignoring lights and people.
  alarm(x, z, r) {
    const t = G.time;
    for (const v of G.vehicles) {
      if (!v.traffic || v.driver !== 'npc' || !v.ai || v.ai.panic === undefined) continue;
      if ((v.pos.x - x) ** 2 + (v.pos.z - z) ** 2 > r * r) continue;
      v.ai.panic = Math.max(v.ai.panic, t + rand(6, 11));
      if (chance(0.3)) honk(v, t);
    }
  }

  // Roads with any part inside the spawn ring, weighted by length and how busy that kind of road is.
  candidates(pp) {
    this.cand.length = 0; this.candW = 0;
    for (const e of edges) {
      const [x0, x1, z0, z1] = e.box;
      const dx = Math.max(x0 - pp.x, 0, pp.x - x1), dz = Math.max(z0 - pp.z, 0, pp.z - z1);
      if (dx * dx + dz * dz > SPAWN_MAX * SPAWN_MAX) continue;
      // downtown is busier
      const cx = (x0 + x1) / 2 - CITY.core.x, cz = (z0 + z1) / 2 - CITY.core.z;
      const w = e.len * (ROAD_WEIGHT[e.type] ?? 1) * (1 + 1.2 * Math.max(0, 1 - Math.sqrt(cx * cx + cz * cz) / 400));
      this.cand.push(e, w); this.candW += w;
    }
  }
  pickEdge(filter) {
    for (let tries = 0; tries < 4; tries++) {
      let r = Math.random() * this.candW;
      for (let i = 0; i < this.cand.length; i += 2) {
        r -= this.cand[i + 1];
        if (r <= 0) { const e = this.cand[i]; if (!filter || filter(e)) return e; break; }
      }
    }
    return null;
  }

  spawnOnRoad(pp, kind = null) {
    const night = G.env.night;
    for (let tries = 0; tries < 10; tries++) {
      const e = this.pickEdge(kind === 'bus' ? (x) => x.type === 'blvd' : null);
      if (!e || e.len < 20 || (this.racing && e.type === 'dirt')) continue;
      const s = rand(8, e.len - 8);
      edgePoint(e, s, 0, P);
      const d = Math.hypot(P.x - pp.x, P.z - pp.z);
      if (d < SPAWN_HIDDEN || d > SPAWN_MAX || Math.random() > 1.3 - d / SPAWN_MAX) continue;
      if (d < SPAWN_VIEW && this.inView(P.x, P.y, P.z, 6)) continue;
      if (P.bridge && chance(0.5)) continue;
      const dir = chance(0.5) ? 1 : -1;
      let type;
      if (kind) type = kind;
      else if (e.type === 'dirt') type = pick(['truck', 'buggy']);
      else if (chance(0.05)) type = 'police';
      else if (e.type === 'highway' && chance(0.3)) type = pick(['truck', 'van', 'boxtruck', 'sport']);
      else type = pick(TRAFFIC_POOL);
      if (night > 0.5 && type === 'boxtruck' && chance(0.6)) type = 'taxi';
      // heavy vehicles keep to the kerb lane; the kerb lane is shut where cars are parked along it
      const two = e.spec.lanes.length > 1;
      let lane = two && (type === 'bus' || type === 'boxtruck' || type === 'van' || chance(0.5)) ? 1 : 0;
      if (kerbParked(e, dir)) lane = 0;
      const lp = edgePoint(e, s, e.spec.lanes[lane] * dir, Q);
      let clear = true;
      for (const o of G.vehicles) if ((o.pos.x - lp.x) ** 2 + (o.pos.z - lp.z) ** 2 < 14 * 14) { clear = false; break; }
      if (!clear || (G.peds && G.peds.nearest(lp.x, lp.z, 4))) continue;
      const heading = Math.atan2(lp.dx * dir, lp.dz * dir);
      const v = new Vehicle(type, lp.x, lp.z, heading);
      v.driver = 'npc';
      v.npc = pick(PED_LOOKS);
      const ai = new LaneDriver(e, dir, s, lane);
      ai.stick = 1.8;
      if (type === 'bus') { ai.stopKind = 'bus'; ai.only = (x) => x.type === 'blvd'; ai.pace = rand(0.8, 0.9); v.bus = true; }
      else if (type === 'taxi') { ai.stopKind = 'taxi'; ai.nextStopT = G.time + rand(8, 40); }
      v.ai = ai;
      v.traffic = true;
      v.patrol = type === 'police';
      const sp = e.spec.speed * 0.7;
      v.vel.set(Math.sin(heading) * sp, 0, Math.cos(heading) * sp);
      return v;
    }
    return null;
  }

  update(dt, t) {
    this.timer -= dt;
    if (this.timer > 0) return;
    const step = 0.35 - this.timer;
    this.timer = 0.35;
    const pp = this.playerPos();
    const night = G.env.night;
    const cam = G.camera;
    cam.updateMatrixWorld();
    _fr.setFromProjectionMatrix(_pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const inCity = pp.x > CITY.x0 - 80 && pp.x < CITY.x1 + 80 && pp.z > CITY.z0 - 80 && pp.z < CITY.z1 + 80;
    // busy by day, thinner at night (when every car shows its lights), and thinned out for a street race
    const racing = this.racing = !!(G.missions && G.missions.active && G.missions.active.rivals);
    const want = G.indoors ? 0 : Math.round((inCity ? CITY_CARS : OUT_CARS) * this.density * (1 - night * 0.45) * (racing ? 0.35 : 1));
    let moving = 0, buses = 0, lots = 0, kerbs = 0;
    this.sirens.length = 0;
    const cp = cam.position;
    for (let i = G.vehicles.length - 1; i >= 0; i--) {
      const v = G.vehicles[i];
      const d = Math.sqrt((v.pos.x - pp.x) ** 2 + (v.pos.z - pp.z) ** 2);
      const dc = (v.pos.x - cp.x) ** 2 + (v.pos.z - cp.z) ** 2;
      v.far = dc > 150 * 150;
      // ambient traffic and parked cars away from the camera get a cheaper simulation (see Vehicle.update)
      v.lite = v !== G.player.vehicle && ((v.traffic && v.driver === 'npc') || v.parked) ? (v.far ? 7 : dc > 45 * 45 ? 3 : 0) : 0;
      v.lightsOn = night > 0.35 && !!v.driver;
      if (v.sirenOn && !v.destroyed) this.sirens.push(v);
      if (v.slotKey !== undefined) { if (v.slotKey < this.lotCount) lots++; else kerbs++; }
      if (v === G.player.vehicle || v.mission || v.keep) continue;
      if (v.traffic && v.driver === 'npc') {
        // stuck for half a minute (a jam behind a wreck, nosed into a wall): recycle it once nobody sees it
        const ai = v.ai;
        if (ai) ai.stillT = v.speed < 0.4 ? (ai.stillT || 0) + step : 0;
        const stuck = ai && ai.stillT > 30;
        // and during a race, the trails are cleared for the rally (and nobody is wiser)
        const trail = racing && ai && ai.edge.type === 'dirt';
        if (d > DESPAWN_SEEN || (stuck && d > 90) || ((d > DESPAWN || stuck || trail) && !this.inView(v.pos.x, v.pos.y, v.pos.z, v.radius))) { v.dispose(); continue; }
        moving++;
        if (v.bus) buses++;
        continue;
      }
      // everything else: parked cars, abandoned cars, wrecks
      const idle = t - v.lastUsed;
      if ((v.destroyed && ((v.wreckT > 25 && d > 90) || v.wreckT > 80 || v.sunk)) || (d > (v.slotKey !== undefined && !v.stolen ? 210 : ABANDON) && idle > 20) || (v.sunk && d > 60)) {
        if (v.slotKey !== undefined) this.slotUsed.delete(v.slotKey);
        if (v.fixedRef) { v.fixedRef.v = null; v.fixedRef.cool = t + 30; }
        v.dispose();
      }
    }
    if (moving < want) {
      this.candidates(pp);
      if (inCity && !racing && buses < Math.round(BUSES * (1 - night * 0.4)) && this.spawnOnRoad(pp, 'bus')) moving++;
      // a few at a time, so no single tick stalls a frame
      for (let k = moving < want * 0.5 ? 4 : 2; k > 0 && moving < want; k--) if (this.spawnOnRoad(pp)) moving++;
    }

    // parked cars in the lots and along the kerbs (capped; each slot is decided once per visit)
    if (!G.indoors) {
      let made = 0;
      const c0 = Math.floor((pp.x - 170) / SLOT_CELL), c1 = Math.floor((pp.x + 170) / SLOT_CELL);
      const r0 = Math.floor((pp.z - 170) / SLOT_CELL), r1 = Math.floor((pp.z + 170) / SLOT_CELL);
      for (let cx = c0; cx <= c1; cx++) for (let cz = r0; cz <= r1; cz++) for (const i of this.slotCells.get(cx * 1000 + cz) || []) {
        if (made >= 3) break;
        if (this.slotUsed.has(i)) continue;
        const kerb = i >= this.lotCount;
        if (kerb ? kerbs >= KERB_CARS * this.density : lots >= LOT_CARS * this.density) continue;
        const sl = this.slots[i];
        const d2 = (sl.x - pp.x) ** 2 + (sl.z - pp.z) ** 2;
        if (d2 > 170 * 170 || d2 < 40 * 40) continue;
        const d = Math.sqrt(d2);
        if (d < 110 && this.inView(sl.x, CITY.y, sl.z, 3)) continue;   // never appear in plain sight
        const fill = kerb ? 0.6 : sl.kind === 'police' ? 0.45 : sl.kind === 'vanta' ? 0.3 : 0.5;
        this.slotUsed.add(i);
        if (hash2(i, 7, Math.floor(t / 600)) > fill) continue;
        const type = sl.kind === 'police' ? 'police' : sl.kind === 'vanta' ? pick(['sport', 'roadster', 'sport']) : sl.kind === 'retune' ? pick(['sport', 'truck', 'roadster', 'moto']) : pick(PARK_POOL);
        const v = new Vehicle(type, sl.x, sl.z, sl.heading + (!kerb && chance(0.5) ? Math.PI : 0), { locked: type !== 'police' && chance(0.5) });
        v.slotKey = i;
        v.parked = true;
        made++;
        if (kerb) kerbs++; else lots++;
      }
    }
    // forget empty slots once the player has moved away, so streets refill on the next visit
    if (this.slotUsed.size > 900) {
      for (const i of this.slotUsed) {
        const sl = this.slots[i];
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
