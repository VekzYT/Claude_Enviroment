// Pedestrians: a crowd simulated on the CPU and drawn with instanced body parts (see pedKit.js),
// in a detailed tier near the camera and a cheap one further off.
//
// Contract for scripted people (missions, interiors, conversations):
//   G.peds.spawn(x, z, look, opts) returns the person, or null when the crowd is full.
//     look: any entry of PED_LOOKS / SPORT_LOOKS / BEACH_LOOKS, COP_LOOK, or an older
//           { skin, top, bottom, hair, hat } look (dressed up automatically).
//     opts: role ('civ' = ambient and removed when far away; 'cop', 'goon', 'ally' or any other
//           name for scripted people), health, heading, brain(p, dt, t) returning the speed wanted
//           (set p.dest = { x, z } to walk somewhere), pose.
//   p.pose:  null (walk / stand by itself), 'idle', 'talk', 'phone', 'wave', 'dance', 'lean',
//            'cross' (arms crossed), 'sit' (onto a seat p.seatH metres high, default 0.46, with
//            p.pos on the floor under the seat and the back to p.heading + PI), 'sitGround',
//            'lie', 'cower'. The seated and lying poses keep the person in place.
//   p.talkT: while > 0 (seconds, counts down) the person stands still, turns to face p.faceH when
//            it is set, and talks with their hands. Works on ambient and scripted people alike.
//   p.keep:  never removed for distance. Ambient spawning pauses while G.indoors is set; people
//            who already exist are left alone.
import * as THREE from 'three';
import { G, emit, DETAIL_LAYER } from '../state.js';
import { groundHeight, surfaceAt } from '../world/roads.js';
import { resolveCircle } from '../world/colliders.js';
import { blocks, blockAt } from '../world/cityplan.js';
import { CITY } from '../world/layout.js';
import { PIER } from '../world/landmarks.js';
import { benchSpots } from '../world/city.js';
import { breakables } from '../world/breakables.js';
import { PED_LOOKS, SPORT_LOOKS, BEACH_LOOKS, COP_LOOK, fullLook, kitData, STRIDE, HEAD_STRIDE } from './pedlooks.js';
import { makePedMaterials, torsoKit, pelvisKit, headKit, upperArmKit, forearmKit, farArmKit, thighKit, shinKit, footKit, FARM, PELVIS, LIMB } from './pedKit.js';
import { makeBlobTexture } from '../world/textures.js';
import { clamp, wrapAngle, smoothstep } from '../util/math.js';
import { rand, pick, chance } from '../util/rng.js';

const MAX = 250;           // everyone, scripted people included
const AMBIENT_MAX = 215;   // ambient civilians leave room for cops, goons and mission people
const NEAR_MAX = 56;       // people drawn with the detailed parts
const DENSITY = { strip: 1.3, downtown: 1.2, ocean: 1.2, midtown: 0.9, oldtown: 0.9, riverside: 0.6, uptown: 0.5, docks: 0.3 };
const out = { x: 0, z: 0, broken: [] };
const { UA_LEN, FA_LEN, TH_LEN, SH_LEN } = LIMB;
const LEG = TH_LEN + SH_LEN;
let nextId = 1;

// ---- pose channels -------------------------------------------------------------------------
// Each person carries the current value of every channel and eases it towards the target of
// what they are doing, so every change of activity blends smoothly. The walk cycle is added on top.
const DROP = 0, PITCH = 1, SP = 2, SY = 3, SR = 4, HP = 5, HY = 6, HRL = 7,
  LAP = 8, LAR = 9, LAY = 10, LEL = 11, RAP = 12, RAR = 13, RAY = 14, REL = 15,
  LTP = 16, LTR = 17, LKN = 18, LFT = 19, RTP = 20, RTR = 21, RKN = 22, RFT = 23,
  HIPY = 24, HIPR = 25, SWL = 26, SWR = 27, SWAY = 28, LIE = 29;
const NJ = 30;
const REST = new Float32Array(NJ);
REST[SP] = 0.02; REST[HP] = 0.03; REST[LAR] = REST[RAR] = 0.1; REST[LEL] = REST[REL] = -0.2;
REST[LTR] = REST[RTR] = 0.025; REST[LKN] = REST[RKN] = 0.04; REST[SWL] = REST[SWR] = 1;
const T = new Float32Array(NJ), F = new Float32Array(NJ);

// ---- tiny affine matrices (3x3 columns + translation) ---------------------------------------
const mk = () => new Float32Array(12);
const Mroot = mk(), Mpel = mk(), Mtor = mk(), Mhead = mk(), Mua = mk(), Mfa = mk(), Mth = mk(), Msh = mk(), Mft = mk(), Mtmp = mk();
function child(o, p, x, y, z) {
  for (let i = 0; i < 9; i++) o[i] = p[i];
  o[9] = p[9] + p[0] * x + p[3] * y + p[6] * z;
  o[10] = p[10] + p[1] * x + p[4] * y + p[7] * z;
  o[11] = p[11] + p[2] * x + p[5] * y + p[8] * z;
  return o;
}
// right-multiply by a rotation about a local axis
function rx(m, a) {
  if (!a) return m;
  const c = Math.cos(a), s = Math.sin(a);
  for (let i = 0; i < 3; i++) { const u = m[3 + i], v = m[6 + i]; m[3 + i] = c * u + s * v; m[6 + i] = c * v - s * u; }
  return m;
}
function ry(m, a) {
  if (!a) return m;
  const c = Math.cos(a), s = Math.sin(a);
  for (let i = 0; i < 3; i++) { const u = m[i], v = m[6 + i]; m[i] = c * u - s * v; m[6 + i] = s * u + c * v; }
  return m;
}
function rz(m, a) {
  if (!a) return m;
  const c = Math.cos(a), s = Math.sin(a);
  for (let i = 0; i < 3; i++) { const u = m[i], v = m[3 + i]; m[i] = c * u + s * v; m[3 + i] = c * v - s * u; }
  return m;
}

// One instanced body part: matrices plus an interleaved buffer of per-instance colours and bits.
class Part {
  constructor(scene, geo, mat, cap, stride, shadow) {
    this.cap = cap; this.stride = stride; this.n = 0;
    this.data = new Float32Array(cap * stride);
    const ib = new THREE.InstancedInterleavedBuffer(this.data, stride, 1);
    ib.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iColA', new THREE.InterleavedBufferAttribute(ib, 3, 0));
    geo.setAttribute('iColB', new THREE.InterleavedBufferAttribute(ib, 3, 3));
    geo.setAttribute('iColC', new THREE.InterleavedBufferAttribute(ib, 3, 6));
    geo.setAttribute('iColD', new THREE.InterleavedBufferAttribute(ib, 3, 9));
    geo.setAttribute('iBits', new THREE.InterleavedBufferAttribute(ib, 2, 12));
    if (stride > 14) geo.setAttribute('iHair', new THREE.InterleavedBufferAttribute(ib, 4, 14));
    this.ib = ib;
    const m = new THREE.InstancedMesh(geo, mat.mat, cap);
    m.customDepthMaterial = mat.depth;
    m.count = 0; m.frustumCulled = false; m.castShadow = shadow; m.receiveShadow = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.layers.set(DETAIL_LAYER);
    scene.add(m);
    this.mesh = m; this.mat = m.instanceMatrix.array;
  }
  add(M, sx, sy, sz, rec, flash) {
    const k = this.n;
    if (k >= this.cap) return -1;
    const a = this.mat, o = k * 16;
    a[o] = M[0] * sx; a[o + 1] = M[1] * sx; a[o + 2] = M[2] * sx; a[o + 3] = 0;
    a[o + 4] = M[3] * sy; a[o + 5] = M[4] * sy; a[o + 6] = M[5] * sy; a[o + 7] = 0;
    a[o + 8] = M[6] * sz; a[o + 9] = M[7] * sz; a[o + 10] = M[8] * sz; a[o + 11] = 0;
    a[o + 12] = M[9]; a[o + 13] = M[10]; a[o + 14] = M[11]; a[o + 15] = 1;
    const d = k * this.stride;
    this.data.set(rec, d);
    if (flash) this.data.fill(1, d, d + 12);
    this.n = k + 1;
    return d;
  }
  flush() {
    const m = this.mesh, n = this.n;
    m.count = n; m.visible = n > 0;
    if (!n) return;
    m.instanceMatrix.clearUpdateRanges(); m.instanceMatrix.addUpdateRange(0, n * 16); m.instanceMatrix.needsUpdate = true;
    this.ib.clearUpdateRanges(); this.ib.addUpdateRange(0, n * this.stride); this.ib.needsUpdate = true;
  }
}

const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sph = new THREE.Sphere(), _bm = new THREE.Matrix4();

export class Peds {
  constructor(scene) {
    this.list = [];
    this.timer = 0;
    this.density = 1;
    this.frame = 0;
    const mats = makePedMaterials();
    const P = (geo, mat, cap, stride = STRIDE, shadow = true) => new Part(scene, geo, mat, cap, stride, shadow);
    // near: full-detail parts with elbows and feet; far: a fraction of the triangles, straight limbs
    this.near = {
      torso: P(torsoKit(false), mats.body, NEAR_MAX), pelvis: P(pelvisKit(false), mats.body, NEAR_MAX), head: P(headKit(false), mats.head, NEAR_MAX, HEAD_STRIDE),
      uarm: P(upperArmKit(), mats.body, NEAR_MAX * 2), farm: P(forearmKit(), mats.body, NEAR_MAX * 2),
      thigh: P(thighKit(false), mats.body, NEAR_MAX * 2), shin: P(shinKit(false), mats.body, NEAR_MAX * 2), foot: P(footKit(), mats.body, NEAR_MAX * 2),
    };
    this.far = {
      torso: P(torsoKit(true), mats.body, MAX), pelvis: P(pelvisKit(true), mats.body, MAX), head: P(headKit(true), mats.head, MAX, HEAD_STRIDE),
      arm: P(farArmKit(), mats.body, MAX * 2), thigh: P(thighKit(true), mats.body, MAX * 2), shin: P(shinKit(true), mats.body, MAX * 2),
    };
    this.parts = [...Object.values(this.near), ...Object.values(this.far)];
    const blobGeo = new THREE.PlaneGeometry(0.95, 0.95);
    blobGeo.rotateX(-Math.PI / 2);
    this.blobs = new THREE.InstancedMesh(blobGeo, new THREE.MeshBasicMaterial({ map: makeBlobTexture(), transparent: true, depthWrite: false, opacity: 0.6, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7 }), MAX);
    this.blobs.count = 0; this.blobs.frustumCulled = false; this.blobs.renderOrder = 2;
    this.blobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.blobs.layers.set(DETAIL_LAYER);
    scene.add(this.blobs);
    // where people stroll, jog and hang out off the street grid
    this.regions = [
      { kind: 'prom', x0: CITY.promenade.x0 + 1.5, x1: CITY.promenade.x1 - 1.5, z0: CITY.promenade.z0 + 4, z1: CITY.promenade.z1 - 4, w: 1.5, long: true },
      { kind: 'pier', x0: PIER.x0 + 2, x1: PIER.x1 - 50, z0: -6, z1: 6, w: 1.3 },
    ];
    for (const b of blocks) if (b.park || b.plaza) this.regions.push({ kind: b.park ? 'park' : 'plaza', x0: b.x0 + 6, x1: b.x1 - 6, z0: b.z0 + 6, z1: b.z1 - 6, w: 1.1, avoid: { x: b.cx, z: b.cz, r: 12 } });
    this.benches = null;
    this.beach = null;
    // spatial hash for keeping people from walking through each other
    this.cellHead = new Int32Array(1024);
    this.cellNext = new Int32Array(MAX);
    this.vbuf = new Float32Array(256);
  }

  // ---- creation -------------------------------------------------------------------------------
  spawn(x, z, look = pick(PED_LOOKS), opts = {}) {
    if (this.list.length >= MAX) return null;
    const role = opts.role || 'civ';
    look = fullLook(look, role);
    const p = {
      id: nextId++, pos: { x, y: groundHeight(x, z, 9999), z }, vel: { x: 0, y: 0, z: 0 }, gx: x, gz: z, gy: 0,
      heading: opts.heading ?? rand(0, 6.28), look, kit: kitData(look), role, state: 'walk',
      health: opts.health ?? 60, phase: rand(0, 6), speedWant: rand(1.25, 1.65), speed: 0,
      dest: null, path: [], stateT: 0, lie: 0, aim: 0, alive: true, brain: opts.brain || null,
      block: null, region: null, cw: 1, corner: 0, lane: rand(-1.1, 0.7), fleeFrom: null, flash: 0,
      pose: opts.pose || null, talkT: 0, faceH: null, seatH: 0.46,
      mode: 'route', act: 'idle', habit: null, group: null, seat: null, modeT: 0,
      seed: Math.random(), lookH: 0, lookT: 0, acc: 0, near: false, j: Float32Array.from(REST), _d: { x: 0, z: 0 },
    };
    p.gy = p.pos.y;
    this.list.push(p);
    return p;
  }
  spawnCop(x, z, brain) {
    return this.spawn(x, z, COP_LOOK, { role: 'cop', health: 110, brain });
  }
  remove(p) {
    const i = this.list.indexOf(p);
    if (i >= 0) this.list.splice(i, 1);
    this.leaveSeat(p);
    if (p.group) { const k = p.group.members.indexOf(p); if (k >= 0) p.group.members.splice(k, 1); }
    p.alive = false; p.removed = true;
  }
  leaveSeat(p) {
    if (p.seat) { p.seat.occ = null; p.seat = null; }
  }

  // ---- places -----------------------------------------------------------------------------------
  // Benches (park and street) with two seats each, and the dry sand of the beach.
  findPlaces() {
    this.benches = [];
    const m = _bm;
    for (const b of breakables) {
      if (b.kind !== 'bench') continue;
      const ref = b.fall[0];
      if (!ref.bucket.mesh) continue;
      ref.bucket.mesh.getMatrixAt(ref.index, m);
      const e = m.elements, h = Math.atan2(e[8], e[10]);
      const s = Math.sin(h), c = Math.cos(h);
      const seats = [-0.45, 0.45].map((o) => ({ x: b.x + c * o - s * 0.04, z: b.z - s * o - c * 0.04, h, occ: null }));
      this.benches.push({ x: b.x, z: b.z, h, b, seats });
    }
    if (!this.benches.length) for (const b of benchSpots) {
      const s = Math.sin(b.heading), c = Math.cos(b.heading);
      this.benches.push({ x: b.x, z: b.z, h: b.heading, b: null, seats: [-0.45, 0.45].map((o) => ({ x: b.x + c * o, z: b.z - s * o, h: b.heading, occ: null })) });
    }
    // beach: strips of sand between the boardwalk and the water, sampled once
    this.beach = [];
    const x0 = CITY.promenade.x1 + 2;
    for (let z = CITY.promenade.z0 + 20; z < CITY.promenade.z1 - 20; z += 40) {
      // the longest run of dry sand (the dune trail cuts some strips in two)
      let a = null, best = null;
      for (let x = x0; x < x0 + 200; x += 2) {
        const h = groundHeight(x, z);
        if (h > 0.45 && surfaceAt(x, z, h) === 'sand') { if (a === null) a = x; if (!best || x - a > best[1] - best[0]) best = [a, x]; } else { a = null; if (h < 0.3) break; }
      }
      if (!best || best[1] - best[0] < 8) continue;
      // neighbouring strips that still overlap well become one long stretch of beach
      const last = this.beach[this.beach.length - 1];
      const x0b = best[0] + 1, x1b = best[1] - 3;
      if (last && last.z1 === z - 20 && Math.min(last.x1, x1b) - Math.max(last.x0, x0b) > 10) {
        last.x0 = Math.max(last.x0, x0b); last.x1 = Math.min(last.x1, x1b); last.z1 = z + 20;
      } else this.beach.push({ kind: 'beach', x0: x0b, x1: x1b, z0: z - 20, z1: z + 20, w: 1, long: true });
    }
    for (const r of this.beach) this.regions.push(r);
  }
  freeSeat(x, z, r) {
    let best = null, bd = r * r;
    for (const b of this.benches) {
      const d = (b.x - x) ** 2 + (b.z - z) ** 2;
      if (d > bd || (b.b && b.b.broken)) continue;
      const s = b.seats[0].occ ? (b.seats[1].occ ? null : b.seats[1]) : b.seats[1].occ || chance(0.5) ? b.seats[0] : b.seats[1];
      if (s) { bd = d; best = { s, b }; }
    }
    return best;
  }

  // ---- civilian routing -------------------------------------------------------------------------
  loopPt(b, c, lane) {
    const m = 3.3 + lane;
    return { x: c === 1 || c === 2 ? b.x1 - m : b.x0 + m, z: c >= 2 ? b.z1 - m : b.z0 + m };
  }
  nextLeg(p) {
    if (p.region) {
      const r = p.region;
      for (let k = 0; k < 6; k++) {
        let x = rand(r.x0, r.x1), z = rand(r.z0, r.z1);
        // long thin places (boardwalk, beach): walk along them rather than across
        if (r.long) z = clamp(p.pos.z + (chance(0.5) ? 1 : -1) * rand(40, 130), r.z0, r.z1);
        if (r.avoid && Math.hypot(x - r.avoid.x, z - r.avoid.z) < r.avoid.r) continue;
        p.path.push({ x, z });
        return;
      }
      return;
    }
    const b = p.block;
    if (!b) return;
    const nBlocksZ = CITY.zs.length - 1;
    const from = this.loopPt(b, (p.corner - p.cw + 4) % 4, p.lane), at = this.loopPt(b, p.corner, p.lane);
    const dx = Math.sign(Math.round(at.x - from.x)), dz = Math.sign(Math.round(at.z - from.z));
    const ni = b.i + dx, nj = b.j + dz;
    const nb = ni >= 0 && ni < CITY.xs.length - 1 && nj >= 0 && nj < nBlocksZ ? blocks[ni * nBlocksZ + nj] : null;
    if (nb && !nb.dome && chance(0.3)) {
      // cross the street to the matching corner of the next block and keep going
      const entry = (p.corner - p.cw + 4) % 4;
      p.block = nb;
      p.path.push(this.loopPt(nb, entry, p.lane), this.loopPt(nb, p.corner, p.lane));
      p.waitCross = 8;
      return;
    }
    p.corner = (p.corner + p.cw + 4) % 4;
    const q = this.loopPt(b, p.corner, p.lane);
    p.path.push({ x: q.x + rand(-0.4, 0.4), z: q.z + rand(-0.4, 0.4) });
  }
  // Back to walking from wherever this person is (after fleeing, sitting, chatting...).
  wander(p) {
    this.leaveSeat(p);
    p.group = null; p.act = 'idle';
    p.dest = null; p.path.length = 0;
    if (p.region && p.pos.x > p.region.x0 - 3 && p.pos.x < p.region.x1 + 3 && p.pos.z > p.region.z0 - 3 && p.pos.z < p.region.z1 + 3) { p.mode = 'region'; return; }
    p.region = null;
    const b = blockAt(p.pos.x, p.pos.z);
    if (b && !b.park && !b.plaza && !b.dome) {
      p.block = b; p.mode = 'route';
      // join the sidewalk loop at the nearest corner
      let best = 0, bd = 1e9;
      for (let c = 0; c < 4; c++) { const q = this.loopPt(b, c, p.lane), d = (q.x - p.pos.x) ** 2 + (q.z - p.pos.z) ** 2; if (d < bd) { bd = d; best = c; } }
      p.corner = best; p.cw = chance(0.5) ? 1 : -1;
      p.path.push(this.loopPt(b, best, p.lane));
      return;
    }
    for (const r of this.regions) if (p.pos.x > r.x0 - 8 && p.pos.x < r.x1 + 8 && p.pos.z > r.z0 - 8 && p.pos.z < r.z1 + 8) { p.region = r; p.mode = 'region'; return; }
    p.mode = 'idle';
  }

  // ---- ambient population ---------------------------------------------------------------------
  visible(x, y, z, r) {
    _sph.center.set(x, y + 1, z); _sph.radius = r;
    return _fr.intersectsSphere(_sph);
  }
  spawnAmbient(pp, minD, seen) {
    for (let tries = 0; tries < 8; tries++) {
      // closer spots are likelier, so the streets around the player are the busy ones
      const a = rand(0, 6.283), d = minD + (115 - minD) * Math.random() ** 2;
      const x = pp.x + Math.cos(a) * d, z = pp.z + Math.sin(a) * d;
      // out of sight where possible: nobody pops up in plain view nearby
      if (d < seen && this.visible(x, pp.y || 2, z, 2.5)) continue;
      let region = null;
      for (const r of this.regions) if (x > r.x0 - 8 && x < r.x1 + 8 && z > r.z0 - 8 && z < r.z1 + 8 && chance(0.55 * r.w)) { region = r; break; }
      if (region) {
        const sx = clamp(x, region.x0, region.x1), sz = clamp(z, region.z0, region.z1);
        if (region.avoid && Math.hypot(sx - region.avoid.x, sz - region.avoid.z) < region.avoid.r) continue;
        if (this.spawnInRegion(region, sx, sz)) return true;
        continue;
      }
      const b = blockAt(x, z);
      if (!b || b.park || b.plaza || b.dome) continue;
      if (!chance(Math.min(1, DENSITY[b.district] || 0.5))) continue;
      if (this.spawnOnBlock(b, x, z, pp)) return true;
    }
    return false;
  }
  civ(x, z, look, mode, seated = false) {
    // never inside a wall, a planter or a vending machine (a bench seat is meant to be in its bench)
    if (!seated && resolveCircle(x, z, 0.3, groundHeight(x, z, 9999), out, 1.6)) return null;
    const p = this.spawn(x, z, look);
    if (p) p.mode = mode;
    return p;
  }
  spawnOnBlock(b, x, z, pp) {
    const night = G.env ? G.env.night : 0;
    const r = Math.random();
    const c = Math.floor(rand(0, 4)), cw = chance(0.5) ? 1 : -1;
    const lane = r >= 0.52 && r < 0.7 ? rand(-0.6, 0.4) : rand(-1.1, 0.7);   // groups keep off the kerb
    const A = this.loopPt(b, c, lane), B = this.loopPt(b, (c + cw + 4) % 4, lane);
    const f = rand(0.05, 0.95);
    const sx = A.x + (B.x - A.x) * f, sz = A.z + (B.z - A.z) * f;
    if (Math.hypot(sx - pp.x, sz - pp.z) < 12) return false;
    const walker = (px, pz) => {
      const p = this.civ(px, pz, undefined, 'route');
      if (!p) return null;
      p.block = b; p.cw = cw; p.corner = (c + cw + 4) % 4; p.lane = lane;
      p.path.push(this.loopPt(b, p.corner, lane));
      p.heading = Math.atan2(B.x - A.x, B.z - A.z);
      return p;
    };
    if (r < 0.52) {
      const p = walker(sx, sz);
      if (p && chance(0.16)) { p.habit = 'phone'; p.speedWant *= 0.82; }
      return !!p;
    }
    if (r < 0.7) return this.walkGroup(walker(sx, sz), Math.floor(rand(1, night > 0.5 ? 2 : 3.6)));
    if (r < 0.84 && night < 0.7) {
      // a few people stopped to chat, on the building side of the pavement
      const inX = Math.abs(B.x - A.x) > Math.abs(B.z - A.z);
      const cx = sx + (inX ? 0 : Math.sign(b.cx - sx) * (0.4 - lane)), cz = sz + (inX ? Math.sign(b.cz - sz) * (0.4 - lane) : 0);
      return this.chatGroup(cx, cz, Math.floor(rand(2, 4.6)), { block: b });
    }
    if (r < 0.92) {
      const s = this.freeSeat(sx, sz, 40);
      if (s && !this.visible(s.s.x, 2, s.s.z, 2)) return !!this.seat(this.civ(s.s.x, s.s.z, undefined, 'sit', true), s.s, s.b, true);
    }
    // waiting at the kerb, facing the street
    const inX = Math.abs(B.x - A.x) > Math.abs(B.z - A.z);
    const kx = inX ? sx : (sx < b.cx ? b.x0 + 2 : b.x1 - 2), kz = inX ? (sz < b.cz ? b.z0 + 2 : b.z1 - 2) : sz;
    const p = this.civ(kx, kz, undefined, 'wait');
    if (!p) return false;
    p.block = b;
    p.faceH = inX ? (kz < b.cz ? Math.PI : 0) : (kx < b.cx ? -Math.PI / 2 : Math.PI / 2);
    p.heading = p.faceH; p.modeT = rand(15, 60); p.habit = chance(0.4) ? 'phone' : null;
    return true;
  }
  spawnInRegion(rg, x, z) {
    const night = G.env ? G.env.night : 0;
    const r = Math.random();
    const beach = rg.kind === 'beach';
    if (beach && night > 0.6) return false;
    const looks = beach ? BEACH_LOOKS : undefined;
    const stroll = (px, pz, look) => {
      const p = this.civ(px, pz, look ?? (looks ? pick(looks) : undefined), 'region');
      if (p) { p.region = rg; p.speedWant *= 0.85; }
      return p;
    };
    // joggers on the boardwalk, beach and park paths
    if (r < (rg.kind === 'pier' ? 0 : 0.14) && night < 0.6) {
      const p = stroll(x, z, pick(SPORT_LOOKS));
      if (p) { p.speedWant = rand(2.7, 3.4); p.habit = 'jog'; }
      return !!p;
    }
    if (r < 0.42) { const p = stroll(x, z); if (p && chance(0.12)) p.habit = 'phone'; return !!p; }
    if (r < 0.55) return this.walkGroup(stroll(x, z), Math.floor(rand(1, 3.6)));
    if (r < 0.7 && night < 0.7) return this.chatGroup(x, z, Math.floor(rand(2, 4.6)), { region: rg, looks });
    if (beach) {
      // sunbathing or sitting on the sand
      const p = this.civ(x, z, pick(BEACH_LOOKS), 'beach');
      if (!p) return false;
      p.region = rg; p.modeT = rand(40, 160);
      p.act = p.restAct = chance(0.45) ? 'lie' : 'sitGround';
      p.heading = rand(0, 6.28);
      p.j.set(this.target(p, 0, T));
      return true;
    }
    if (r < 0.86) {
      const s = this.freeSeat(x, z, 45);
      if (s && !this.visible(s.s.x, 2, s.s.z, 2)) return !!this.seat(this.civ(s.s.x, s.s.z, looks ? pick(looks) : undefined, 'sit', true), s.s, s.b, true);
    }
    if (rg.kind === 'park' && night < 0.5) {
      const p = this.civ(x, z, undefined, 'beach');
      if (!p) return false;
      p.region = rg; p.modeT = rand(30, 120); p.act = p.restAct = 'sitGround'; p.heading = rand(0, 6.28);
      p.j.set(this.target(p, 0, T));
      return true;
    }
    if (rg.kind === 'pier' || rg.kind === 'prom') {
      // at the rail, looking out to sea
      const pier = rg.kind === 'pier';
      const side = chance(0.5) ? 1 : -1;
      const px = pier ? x : rg.x1 + 0.6, pz = pier ? (side > 0 ? rg.z1 + 1.2 : rg.z0 - 1.2) : z;
      const p = this.civ(px, pz, undefined, 'wait');
      if (!p) return false;
      p.region = rg; p.faceH = pier ? (side > 0 ? 0 : Math.PI) : Math.PI / 2; p.heading = p.faceH; p.modeT = rand(20, 70);
      p.habit = chance(0.3) ? 'phone' : chance(0.5) ? 'cross' : null;
      return true;
    }
    return !!stroll(x, z);
  }
  walkGroup(lead, extra) {
    if (!lead) return false;
    const g = { kind: 'walk', members: [lead], talk: null, talkT: 0 };
    lead.group = g;
    lead.speedWant = Math.min(lead.speedWant, rand(1.15, 1.35));
    const slots = extra === 1 ? [[0.72, 0]] : [[0.72, -0.1], [-0.72, -0.1], [0, -0.9]];
    for (let k = 0; k < extra; k++) {
      const [lx, lz] = slots[k];
      const s = Math.sin(lead.heading), c = Math.cos(lead.heading);
      const p = this.civ(lead.pos.x + c * lx + s * lz, lead.pos.z - s * lx + c * lz, lead.region?.kind === 'beach' ? pick(BEACH_LOOKS) : undefined, 'follow');
      if (!p) break;
      p.group = g; p.slot = slots[k]; p.heading = lead.heading; p.region = lead.region; p.block = lead.block;
      g.members.push(p);
    }
    return true;
  }
  chatGroup(x, z, n, o) {
    const g = { kind: 'chat', members: [], x, z, speaker: 0, talkT: rand(2, 5), t: rand(25, 90) };
    const a0 = rand(0, 6.28);
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * 6.283 + rand(-0.25, 0.25), rr = n === 2 ? 0.55 : 0.7;
      const p = this.civ(x + Math.sin(a) * rr, z + Math.cos(a) * rr, o.looks ? pick(o.looks) : undefined, 'chat');
      if (!p) break;
      p.group = g; p.region = o.region || null; p.block = o.block || null;
      p.heading = a + Math.PI; p.habit = chance(0.3) ? 'cross' : null;
      g.members.push(p);
    }
    return g.members.length > 0;
  }
  // Sit p on seat s: at once (spawned out of sight) or by settling in from where they stand.
  seat(p, s, bench, snap) {
    if (!p) return null;
    s.occ = p; p.seat = s; p.bench = bench;
    p.mode = 'sit'; p.act = 'sit'; p.seatH = 0.46;
    p.modeT = rand(30, 120);
    p.habit = chance(0.35) ? 'phone' : null;
    p.dest = null; p.path.length = 0;
    if (snap) { p.heading = s.h; p.pos.x = s.x; p.pos.z = s.z; p.j.set(this.target(p, 0, T)); }
    return p;
  }

  // ---- reactions --------------------------------------------------------------------------------
  scare(x, z, radius, seconds = 8) {
    for (const p of this.list) {
      if (p.role !== 'civ' || p.state === 'ragdoll' || p.state === 'down') continue;
      const d = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (d >= radius) continue;
      if (p.mode !== 'route' && p.mode !== 'region') this.wander(p);
      p.talkT = 0;
      p.fleeFrom = { x, z };
      p.panic = chance(0.45);
      // close to gunfire or a blast some freeze and duck first
      if (seconds >= 5 && d < radius * 0.45 && p.state !== 'flee' && chance(0.35)) { p.state = 'cower'; p.stateT = 0; p.cowerT = rand(1.2, 3); p.fleeT = seconds; continue; }
      if (p.state === 'cower') { p.fleeT = Math.max(p.fleeT, seconds); continue; }
      p.state = 'flee'; p.stateT = seconds * rand(0.7, 1.3);
    }
  }
  // Knock a ped off their feet. Returns true if they were standing.
  knock(p, vx, vy, vz, dmg, source = null) {
    if (!p.alive) return false;
    const wasUp = p.state !== 'ragdoll' && p.state !== 'down';
    p.health -= dmg;
    p.state = 'ragdoll'; p.stateT = 0;
    p.vel.x = vx; p.vel.y = vy; p.vel.z = vz;
    p.flash = 0.15;
    this.leaveSeat(p);
    if (p.role === 'civ' && p.mode !== 'route' && p.mode !== 'region') this.wander(p);
    if (wasUp) emit('pedDown', p, source, dmg);
    return wasUp;
  }
  hurt(p, dmg, source = null, fromX = p.pos.x, fromZ = p.pos.z) {
    if (!p.alive || p.state === 'down') return;
    p.health -= dmg; p.flash = 0.15;
    if (p.health <= 0 || dmg >= 25) {
      const dx = p.pos.x - fromX, dz = p.pos.z - fromZ, d = Math.hypot(dx, dz) || 1;
      this.knock(p, (dx / d) * 3, 2.5, (dz / d) * 3, 0, source);
    } else if (p.role === 'civ') { if (p.mode !== 'route' && p.mode !== 'region') this.wander(p); p.state = 'flee'; p.fleeFrom = { x: fromX, z: fromZ }; p.stateT = 9; p.panic = true; }
    emit('pedHurt', p, source, dmg);
  }

  // distance to the nearest ped in front of vehicle v, in its lane (for traffic braking)
  gapAhead(v, fx, fz) {
    let gap = 999;
    for (const p of this.list) {
      if (p.state === 'down') continue;
      const dx = p.pos.x - v.pos.x, dz = p.pos.z - v.pos.z;
      const f = dx * fx + dz * fz;
      if (f < 0 || f > 15) continue;
      if (Math.abs(dx * -fz + dz * fx) > 1.7) continue;
      gap = Math.min(gap, f - v.T.len / 2 - 0.5);
    }
    return gap;
  }
  nearest(x, z, r, filter = null) {
    let best = null, bd = r * r;
    for (const p of this.list) {
      if (filter && !filter(p)) continue;
      const d = (p.pos.x - x) ** 2 + (p.pos.z - z) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  // Ray vs upright peds (cylinder r 0.42). Returns {ped, t} or null.
  raycast(ox, oy, oz, dx, dy, dz, maxD, ignore = null) {
    let best = null, bt = maxD;
    for (const p of this.list) {
      if (p === ignore || p.state === 'down') continue;
      const fx = ox - p.pos.x, fz = oz - p.pos.z;
      const a = dx * dx + dz * dz;
      if (a < 1e-6) continue;
      const b = 2 * (fx * dx + fz * dz), c = fx * fx + fz * fz - 0.2;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const t = (-b - Math.sqrt(disc)) / (2 * a);
      if (t < 0 || t > bt) continue;
      const y = oy + dy * t - p.pos.y;
      const top = p.state === 'ragdoll' || p.mode === 'beach' ? 0.6 : p.state === 'cower' || p.mode === 'sit' ? 1.3 : 1.85;
      if (y < -0.1 || y > top) continue;
      bt = t; best = p;
    }
    return best ? { ped: best, t: bt } : null;
  }

  // ---- simulation -------------------------------------------------------------------------------
  update(dt, t) {
    const pl = G.player;
    const pp = pl.vehicle ? pl.vehicle.pos : pl.pos;
    this.frame++;
    if (!this.benches) this.findPlaces();
    // population
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.25;
      const inCity = pp.x > CITY.x0 - 60 && pp.x < CITY.x1 + 260 && pp.z > CITY.z0 - 60 && pp.z < CITY.z1 + 60;
      const b = blockAt(pp.x, pp.z);
      const dk = b ? DENSITY[b.district] || 0.6 : pp.x > CITY.x1 ? 1.1 : 0.6;
      const night = G.env.night;
      const want = inCity && !G.indoors ? Math.min(AMBIENT_MAX, Math.round(140 * this.density * clamp(dk, 0.35, 1.25) * (1 - night * 0.55))) : 0;
      let civ = 0;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        const d = Math.hypot(p.pos.x - pp.x, p.pos.z - pp.z);
        if (p.role === 'civ' && !p.keep) {
          if (d > 150 || (p.state === 'down' && p.stateT > 14 && d > 30) || (p.state === 'down' && p.stateT > 40)) { this.remove(p); continue; }
          civ++;
        } else if (p.role !== 'cop' && d > 220 && !p.keep) this.remove(p);
      }
      // fill quickly when far short (a fresh game, or arriving downtown), trickle otherwise
      const short = want - civ;
      const n = short > 30 ? 8 : short > 8 ? 4 : short > 0 ? 2 : 0;
      // (an empty street on a fresh start fills in view too, but never right next to the player)
      for (let k = 0; k < n && this.list.length < MAX - 4; k++) this.spawnAmbient(pp, short > 40 ? 20 : 34, short > 60 ? 40 : 75);
    }

    // vehicles, packed for the quick distance test every person makes
    const V = G.vehicles;
    if (this.vbuf.length < V.length * 4) this.vbuf = new Float32Array(V.length * 8);
    for (let k = 0; k < V.length; k++) { const v = V[k], o = k * 4; this.vbuf[o] = v.pos.x; this.vbuf[o + 1] = v.pos.z; this.vbuf[o + 2] = v.pos.y; this.vbuf[o + 3] = (v.radius + 0.5) ** 2; }
    // neighbours, for keeping a little personal space
    const cellHead = this.cellHead, cellNext = this.cellNext, list = this.list;
    cellHead.fill(-1);
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const h = ((Math.floor(p.pos.x * 0.5) * 73856093) ^ (Math.floor(p.pos.z * 0.5) * 19349663)) & 1023;
      cellNext[i] = cellHead[h]; cellHead[h] = i;
    }

    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (!p) continue;
      const dxp = p.pos.x - pp.x, dzp = p.pos.z - pp.z;
      const dp2 = dxp * dxp + dzp * dzp;
      p.near = dp2 < 1600;
      // ordinary walkers off screen think a third as often, and half as often when far off on screen
      let every = 1;
      if (!p.brain && p.state === 'walk' && dp2 > 900) every = !this.visible(p.pos.x, p.pos.y, p.pos.z, 3) ? 3 : dp2 > 2500 ? 2 : 1;
      p.acc += dt;
      if ((this.frame + p.id) % every) continue;
      this.step(p, p.acc, t, i);
      p.acc = 0;
    }
    this.draw(t);
  }

  step(p, dt, t, idx) {
    p.stateT += dt;
    if (p.flash > 0) p.flash -= dt;
    if (p.state === 'ragdoll' || p.state === 'down') {
      p.vel.y -= 22 * dt;
      p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt; p.pos.z += p.vel.z * dt;
      const g = groundHeight(p.pos.x, p.pos.z, p.pos.y + 1);
      if (p.pos.y <= g) {
        p.pos.y = g;
        if (p.vel.y < -3) p.vel.y *= -0.25; else p.vel.y = 0;
        const f = Math.max(0, 1 - dt * 5);
        p.vel.x *= f; p.vel.z *= f;
      }
      if (resolveCircle(p.pos.x, p.pos.z, 0.3, p.pos.y, out, 1)) { p.pos.x = out.x; p.pos.z = out.z; p.vel.x *= 0.3; p.vel.z *= 0.3; }
      p.lie = Math.min(1, p.lie + dt * 6);
      p.speed = 0;
      p.act = 'ragdoll';
      if (p.state === 'ragdoll' && p.stateT > 1.2 && Math.abs(p.vel.x) + Math.abs(p.vel.z) < 0.5) {
        const pl = G.player, pp = pl.vehicle ? pl.vehicle.pos : pl.pos;
        if (p.health <= 0) { p.state = 'down'; p.stateT = 0; emit('pedOut', p); }
        else if (p.stateT > 3.2) { p.state = p.role === 'civ' ? 'flee' : 'walk'; p.stateT = 8; p.fleeFrom = { x: pp.x, z: pp.z }; if (p.role !== 'civ') p.stateT = 0; }
      }
      return;
    }
    const lying = p.act === 'lie' && (p.mode === 'beach' || p.pose === 'lie');
    p.lie = lying ? Math.min(1, p.lie + dt * 1.2) : Math.max(0, p.lie - dt * 4);

    // decide where to go and what to do
    let want = p.speedWant;
    p.act = 'idle';
    if (p.talkT > 0) {
      p.talkT -= dt;
      want = 0;
      if (p.faceH !== null && p.faceH !== undefined) p.heading += clamp(wrapAngle(p.faceH - p.heading), -dt * 4, dt * 4);
      p.act = 'talk';
    } else if (p.brain) {
      want = p.brain(p, dt, t) ?? 0;
      if (p.aim > 0.5) p.act = 'aim';
      else if (p.pose) { p.act = p.pose; if (p.pose === 'sit' || p.pose === 'sitGround' || p.pose === 'lie') want = 0; }
      else if (p.state === 'flee') p.act = 'panic';
    } else if (p.state === 'cower') {
      want = 0; p.act = 'cower';
      if (p.stateT > p.cowerT) { p.state = 'flee'; p.stateT = p.fleeT * rand(0.7, 1.2); }
    } else if (p.state === 'flee') {
      const dx = p.pos.x - p.fleeFrom.x, dz = p.pos.z - p.fleeFrom.z, d = Math.hypot(dx, dz) || 1;
      p.dest = p._d; p._d.x = p.pos.x + (dx / d) * 12; p._d.z = p.pos.z + (dz / d) * 12;
      want = 5.6;
      p.act = p.panic ? 'panic' : 'run';
      p.stateT -= dt * 2; // stateT counts down while fleeing (it was set to a duration)
      if (p.stateT <= 0) { p.state = 'walk'; p.stateT = 0; p.dest = null; p.path.length = 0; if (p.role === 'civ') this.wander(p); }
    } else if (p.pose) {
      want = p.pose === 'sit' || p.pose === 'sitGround' || p.pose === 'lie' ? 0 : want;
      p.act = p.pose;
      if (!want) p.dest = null;
    } else want = this.behave(p, dt, t);

    // move
    let sp = 0;
    if (p.dest && want > 0) {
      const dx = p.dest.x - p.pos.x, dz = p.dest.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.6 && p.state !== 'flee' && !p.brain && p.mode !== 'follow') p.dest = null;
      else if (d > 0.05) {
        const th = Math.atan2(dx, dz);
        p.heading += clamp(wrapAngle(th - p.heading), -dt * 6, dt * 6);
        sp = p.mode === 'follow' ? Math.min(want, d * 3) : want;
        const nx = p.pos.x + Math.sin(p.heading) * sp * dt, nz = p.pos.z + Math.cos(p.heading) * sp * dt;
        // the ground is sampled again only after a few steps (a few centimetres near the camera)
        const gx = nx - p.gx, gz = nz - p.gz;
        if (gx * gx + gz * gz > (p.farLod ? 1.4 : 0.06)) { p.gy = groundHeight(nx, nz, p.pos.y + 1); p.gx = nx; p.gz = nz; }
        if (p.gy > -0.45) { p.pos.x = nx; p.pos.z = nz; p.pos.y = p.gy; } else sp = 0;
        if ((p.near && !p.farLod) || (this.frame + p.id) % 4 === 0) {
          const hit = resolveCircle(p.pos.x, p.pos.z, 0.32, p.pos.y, out, 1.6);
          if (hit) { p.pos.x = out.x; p.pos.z = out.z; if (!p.brain && p.state !== 'flee') { p.stuck = (p.stuck || 0) + dt; if (p.stuck > 1.5) { p.dest = null; p.stuck = 0; } } }
        }
      }
    }
    p.speed += (sp - p.speed) * Math.min(1, dt * 7);
    p.phase += (dt * Math.PI * p.speed) / ((0.42 + 0.24 * p.speed) * p.look.scale);

    // personal space: walkers step around each other
    if (p.near && sp > 0 && p.mode !== 'sit') this.separate(p, idx);

    // vehicles: get hit or step aside
    const vehicles = G.vehicles, vb = this.vbuf;
    for (let k = 0; k < vehicles.length; k++) {
      const o = k * 4, dx = p.pos.x - vb[o], dz = p.pos.z - vb[o + 1];
      if (dx * dx + dz * dz > vb[o + 3] || Math.abs(vb[o + 2] - p.pos.y) > 2.2) continue;
      const v = vehicles[k];
      const s = Math.sin(v.heading), c = Math.cos(v.heading);
      for (let q = 0; q < 3; q++) {
        const cx = v.pos.x + s * v.cOff[q], cz = v.pos.z + c * v.cOff[q];
        const ex = p.pos.x - cx, ez = p.pos.z - cz;
        const r = v.cr + 0.3;
        const d2 = ex * ex + ez * ez;
        if (d2 >= r * r) continue;
        const d = Math.sqrt(d2) || 0.01;
        if (v.speed > 4) {
          const along = (v.vel.x * ex + v.vel.z * ez) / d;
          if (along > 2.5) {
            this.knock(p, v.vel.x * 0.85 + (ex / d) * 2, 3 + v.speed * 0.18, v.vel.z * 0.85 + (ez / d) * 2, v.speed * 3.2, v);
            emit('pedHit', p, v);
            break;
          }
        }
        if (p.mode === 'sit' || p.mode === 'beach') this.wander(p);
        p.pos.x = cx + (ex / d) * r; p.pos.z = cz + (ez / d) * r;
      }
      if (p.state === 'ragdoll') break;
    }
  }

  carNear(x, z, r) {
    const V = G.vehicles, vb = this.vbuf;
    for (let k = 0; k < V.length; k++) {
      const o = k * 4, dx = x - vb[o], dz = z - vb[o + 1];
      if (dx * dx + dz * dz < r * r && V[k].speed > 2) return true;
    }
    return false;
  }
  separate(p, idx) {
    const list = this.list, head = this.cellHead, next = this.cellNext;
    const cx = Math.floor(p.pos.x * 0.5), cz = Math.floor(p.pos.z * 0.5);
    for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
      for (let j = head[(((cx + ox) * 73856093) ^ ((cz + oz) * 19349663)) & 1023]; j >= 0; j = next[j]) {
        if (j === idx) continue;
        const q = list[j];
        if (!q || q === p) continue;
        const dx = p.pos.x - q.pos.x, dz = p.pos.z - q.pos.z, d2 = dx * dx + dz * dz;
        const min = p.group && p.group === q.group ? 0.5 : 0.62;
        if (d2 >= min * min || d2 < 1e-6) continue;
        const d = Math.sqrt(d2), push = (min - d) * 0.5;
        p.pos.x += (dx / d) * push; p.pos.z += (dz / d) * push;
      }
    }
  }

  // Ambient civilians: what they are up to when nothing is happening.
  behave(p, dt, t) {
    const g = p.group;
    p.modeT -= dt;
    switch (p.mode) {
      case 'route':
      case 'region': {
        if (p.habit === 'phone') p.act = 'phone';
        if (g && g.kind === 'walk') this.groupChatter(p, g, dt);
        if (!p.dest) { if (!p.path.length) this.nextLeg(p); p.dest = p.path.shift() || null; }
        if (!p.dest) return 0;
        // at the kerb: wait for a gap in the traffic before crossing (for a while, anyway)
        if (p.waitCross > 0) {
          if (this.carNear(p.pos.x, p.pos.z, 24)) { p.waitCross -= dt; return 0; }
          p.waitCross = 0;
        }
        if (!g && p.habit !== 'jog') {
          // strollers stop now and then to look around
          if (p.mode === 'region') {
            if (p.pauseT > 0) { p.pauseT -= dt; return 0; }
            if (chance(dt * 0.02)) p.pauseT = rand(2, 7);
          }
          // and anyone passing a free bench may take a seat
          if (p.near && chance(dt * 0.025)) {
            const f = this.freeSeat(p.pos.x, p.pos.z, 9);
            if (f) {
              f.s.occ = p; p.seat = f.s; p.bench = f.b; p.mode = 'toSeat';
              p.path.length = 0; p.dest = p._d; p._d.x = f.s.x + Math.sin(f.s.h) * 1.05; p._d.z = f.s.z + Math.cos(f.s.h) * 1.05;
            }
          }
        }
        return p.speedWant;
      }
      case 'toSeat': {
        const s = p.seat;
        if (!s || (p.bench.b && p.bench.b.broken)) { this.wander(p); return 0; }
        if (Math.hypot(p._d.x - p.pos.x, p._d.z - p.pos.z) < 0.45) { this.seat(p, s, p.bench, false); return 0; }
        p.dest = p._d;
        return p.speedWant * 0.9;
      }
      case 'follow': {
        const L = g && g.members[0];
        if (!L || L.removed || L.mode === 'follow' || L.state !== 'walk' || !g.members.includes(p)) { this.wander(p); return 0; }
        const s = Math.sin(L.heading), c = Math.cos(L.heading);
        const tx = L.pos.x + c * p.slot[0] + s * p.slot[1], tz = L.pos.z - s * p.slot[0] + c * p.slot[1];
        const ex = tx - p.pos.x, ez = tz - p.pos.z, d = Math.hypot(ex, ez);
        this.groupChatter(p, g, dt);
        if (p.habit === 'phone') p.act = 'phone';
        if (d < 0.2 && L.speed < 0.3) { p.heading += clamp(wrapAngle(L.heading - p.heading), -dt * 3, dt * 3); p.dest = null; return 0; }
        p.dest = p._d; p._d.x = tx; p._d.z = tz;
        return clamp(L.speed + d * 1.4, 0, 2.6);
      }
      case 'chat': {
        if (!g || g.kind !== 'chat') { this.wander(p); return 0; }
        // the first member keeps the conversation going
        if (g.members[0] === p) {
          if (g.speaker >= g.members.length) g.speaker = 0;
          g.t -= dt; g.talkT -= dt;
          if (g.talkT <= 0) { g.speaker = Math.floor(Math.random() * g.members.length); g.talkT = rand(2.5, 6); }
          if (g.t <= 0) { for (const m of g.members.slice()) if (!m.removed && m.mode === 'chat') { this.wander(m); if (m.mode === 'idle') m.mode = 'route'; } return 0; }
        }
        const face = Math.atan2(g.x - p.pos.x, g.z - p.pos.z);
        p.heading += clamp(wrapAngle(face - p.heading), -dt * 3, dt * 3);
        p.act = g.members[g.speaker] === p ? 'talk' : p.habit === 'cross' ? 'cross' : 'listen';
        p.dest = null;
        return 0;
      }
      case 'sit': {
        const s = p.seat;
        if (!s || (p.bench && p.bench.b && p.bench.b.broken)) { this.wander(p); return 0; }
        // turn round and settle back onto the seat
        p.heading += clamp(wrapAngle(s.h - p.heading), -dt * 5, dt * 5);
        const kk = Math.min(1, dt * 3);
        p.pos.x += (s.x - p.pos.x) * kk; p.pos.z += (s.z - p.pos.z) * kk;
        p.act = p.habit === 'phone' ? 'sitPhone' : 'sit';
        p.dest = null;
        if (p.modeT <= 0) { this.wander(p); if (p.mode === 'idle') p.mode = 'route'; }
        return 0;
      }
      case 'beach': {
        p.act = p.restAct || 'sitGround';
        p.dest = null;
        if (p.modeT <= 0) this.wander(p);
        return 0;
      }
      case 'wait': {
        p.act = p.habit === 'phone' ? 'phone' : p.habit === 'cross' ? 'cross' : 'idle';
        if (p.faceH !== null) p.heading += clamp(wrapAngle(p.faceH - p.heading), -dt * 3, dt * 3);
        p.dest = null;
        if (p.modeT <= 0) { p.faceH = null; this.wander(p); }
        return 0;
      }
      default:
        p.dest = null;
        return 0;
    }
  }
  // people walking together turn to each other and take turns talking
  groupChatter(p, g, dt) {
    if (g.members[0] === p) {
      g.talkT -= dt;
      if (g.talkT <= 0) { g.talk = chance(0.6) ? g.members[Math.floor(Math.random() * g.members.length)] : null; g.talkT = rand(2, 5); }
    }
    if (g.talk === p) p.act = 'walkTalk';
    else if (g.talk) { p.lookAt = g.talk; }
  }

  // ---- pose -------------------------------------------------------------------------------------
  // Target value of every channel for what p is doing right now (time t).
  target(p, t, o) {
    o.set(REST);
    const sd = p.seed * 10, L = p.look;
    const act = p.act;
    // standing idles: weight shifts from leg to leg, breathing, a glance around now and then
    if (act === 'idle' || act === 'listen' || act === 'phone' || act === 'cross' || act === 'talk' || act === 'wave') {
      const w = Math.sin(t * 0.33 + sd) * 1.6;
      const sh = clamp(w, -1, 1);
      o[HIPR] = sh * 0.07; o[SR] = -sh * 0.04; o[SWAY] = sh * 0.035;
      o[sh > 0 ? RKN : LKN] = 0.04 + Math.abs(sh) * 0.22;
      o[sh > 0 ? RTP : LTP] = -Math.abs(sh) * 0.08;
      o[sh > 0 ? RFT : LFT] = Math.abs(sh) * 0.12;
      o[SP] += Math.sin(t * 1.6 + sd) * 0.012;
      o[LAR] += Math.sin(t * 1.6 + sd) * 0.015; o[RAR] += Math.sin(t * 1.6 + sd) * 0.015;
      o[HY] = p.lookH; o[HP] += Math.sin(t * 0.7 + sd) * 0.04;
    }
    switch (act) {
      case 'talk': case 'walkTalk': {
        const k = act === 'talk' ? 1 : 0.55;
        o[RAP] = (-0.55 - 0.3 * Math.sin(t * 2.7 + sd)) * k; o[RAR] = 0.22; o[RAY] = 0.35 * k; o[REL] = -1.15 * k - 0.35 * Math.sin(t * 3.9 + sd) * k;
        o[LAP] = (-0.25 - 0.25 * Math.max(0, Math.sin(t * 1.9 + sd + 1))) * k; o[LEL] = -0.6 * k - 0.4 * Math.max(0, Math.sin(t * 2.2 + sd));
        o[HP] = 0.02 + Math.sin(t * 4.2 + sd) * 0.05; o[HRL] = Math.sin(t * 1.3 + sd) * 0.06;
        o[SY] = Math.sin(t * 1.1 + sd) * 0.08;
        o[SWL] = 0.5; o[SWR] = 0.15;
        break;
      }
      case 'listen':
        o[HP] = 0.06 + Math.max(0, Math.sin(t * 2.2 + sd)) * 0.08; o[HRL] = Math.sin(t * 0.8 + sd) * 0.07;
        if (p.seed > 0.6) { o[LAP] = o[RAP] = 0.18; o[LEL] = o[REL] = -0.35; o[LAR] = o[RAR] = 0.05; }   // hands behind the back
        break;
      case 'phone': case 'sitPhone':
        o[RAP] = -0.42; o[RAR] = -0.08; o[RAY] = 0.55; o[REL] = -1.7; o[SWR] = 0;
        o[HP] = 0.42; o[SP] += 0.05; o[HY] = 0;
        if (act === 'phone') break;
      // falls through: sitting with a phone
      case 'sit': {
        o[DROP] = (p.seatH + 0.25) / L.scale - 1.0;
        o[LTP] = o[RTP] = -1.48; o[LTR] = 0.06; o[RTR] = 0.06; o[LKN] = o[RKN] = 1.32;
        o[LFT] = o[RFT] = 0.12 - (p.seed - 0.5) * 0.2;
        if (p.seed > 0.5) { o[RTP] = -1.42; o[RTR] = -0.08; o[RKN] = 1.05; o[RFT] = 0.4; }
        o[SP] = -0.08 + Math.sin(t * 1.5 + sd) * 0.01; o[HP] = act === 'sitPhone' ? 0.45 : 0.05; o[HY] = act === 'sitPhone' ? 0 : p.lookH * 0.7;
        // hands resting on the thighs
        if (act !== 'sitPhone') { o[RAP] = -0.2; o[REL] = -0.8; o[RAR] = -0.02; o[RAY] = 0.35; }
        o[LAP] = -0.2; o[LEL] = -0.8; o[LAR] = -0.02; o[LAY] = 0.35;
        o[SWL] = o[SWR] = 0;
        break;
      }
      case 'sitGround':
        o[DROP] = 0.26 / L.scale - 1.0; o[SP] = -0.28; o[HP] = -0.05 + Math.sin(t * 0.4 + sd) * 0.05; o[HY] = p.lookH * 0.6;
        o[LTP] = o[RTP] = -1.2; o[LKN] = o[RKN] = 2.0; o[LTR] = 0.22; o[RTR] = 0.22; o[LFT] = o[RFT] = -0.3;
        if (p.seed > 0.5) { o[LAP] = o[RAP] = 0.75; o[LEL] = o[REL] = 0; o[LAR] = o[RAR] = 0.18; }            // leaning back on the hands
        else { o[LAP] = o[RAP] = -0.9; o[LEL] = o[REL] = -1.35; o[LAY] = o[RAY] = 0.45; o[SP] = 0.12; }       // hugging the knees
        o[SWL] = o[SWR] = 0;
        break;
      case 'lie':
        o[LIE] = 1; o[LAR] = o[RAR] = 0.35; o[LEL] = o[REL] = -0.3; o[HP] = -0.15; o[HY] = p.lookH * 0.3;
        if (p.seed > 0.4) { o[RTP] = -0.7; o[RKN] = 1.3; o[RFT] = -0.2; }
        if (p.seed > 0.7) { o[LAP] = o[RAP] = -2.9; o[LEL] = o[REL] = -1.9; o[LAR] = o[RAR] = 0.6; }          // hands behind the head
        o[SWL] = o[SWR] = 0;
        break;
      case 'cross':
        o[LAP] = o[RAP] = -0.42; o[LAR] = o[RAR] = 0.14; o[LAY] = o[RAY] = 1.05; o[LEL] = -1.95; o[REL] = -1.85;
        o[SWL] = o[SWR] = 0;
        break;
      case 'wave':
        o[RAP] = -0.3; o[RAR] = 2.5; o[RAY] = -0.2; o[REL] = -0.6 - 0.4 * Math.sin(t * 9); o[SWR] = 0; o[HP] = 0;
        break;
      case 'dance': {
        const b = t * Math.PI * 2 * 1.05 + sd;
        o[DROP] = -0.03 - 0.035 * Math.abs(Math.sin(b)); o[LKN] = o[RKN] = 0.12 + 0.12 * Math.abs(Math.sin(b));
        o[LTP] = o[RTP] = -0.06 - 0.06 * Math.abs(Math.sin(b));
        o[HIPR] = Math.sin(b * 0.5) * 0.12; o[SWAY] = Math.sin(b * 0.5) * 0.05; o[SY] = Math.sin(b * 0.5) * 0.25; o[SR] = -Math.sin(b * 0.5) * 0.06;
        o[LAP] = -1.0 - 0.5 * Math.sin(b); o[RAP] = -1.0 + 0.5 * Math.sin(b); o[LEL] = o[REL] = -1.3; o[LAR] = o[RAR] = 0.45;
        o[HP] = 0.05 + Math.sin(b * 2) * 0.06; o[SWL] = o[SWR] = 0;
        break;
      }
      case 'lean':
        o[PITCH] = -0.1; o[DROP] = -0.015;
        o[RTP] = -0.12; o[RTR] = -0.2; o[RKN] = 0.32; o[RFT] = 0.45;
        o[LAP] = o[RAP] = -0.42; o[LAR] = o[RAR] = 0.14; o[LAY] = o[RAY] = 1.05; o[LEL] = -1.95; o[REL] = -1.85;
        o[HY] = p.lookH; o[SWL] = o[SWR] = 0;
        break;
      case 'cower': {
        const tr = Math.sin(t * 23 + sd) * 0.02;
        o[DROP] = -0.44; o[PITCH] = 0.08; o[SP] = 0.72; o[HP] = 0.55;
        o[LTP] = o[RTP] = -1.3; o[LKN] = o[RKN] = 2.05; o[LTR] = o[RTR] = 0.12; o[LFT] = o[RFT] = -0.6;
        o[LAP] = o[RAP] = -2.55 + tr; o[LAR] = o[RAR] = 0.3; o[LEL] = o[REL] = -1.75; o[LAY] = o[RAY] = 0.3;
        o[SWL] = o[SWR] = 0;
        break;
      }
      case 'panic': {
        const w = Math.sin(t * 9 + sd);
        o[LAP] = -2.4 + w * 0.35; o[RAP] = -2.4 - w * 0.35; o[LAR] = o[RAR] = 0.45; o[LEL] = o[REL] = -1.1;
        o[SWL] = o[SWR] = 0.2;
        o[HY] = Math.sin(t * 1.7 + sd) > 0.75 ? 1.1 : 0;       // a look back over the shoulder
        break;
      }
      case 'run':
        o[HY] = Math.sin(t * 1.7 + sd) > 0.8 ? 1.0 : 0;
        break;
      case 'aim':
        o[RAP] = -1.48; o[RAR] = -0.06; o[REL] = -0.05; o[RAY] = 0; o[SWR] = 0;
        o[LAP] = -1.3; o[LAR] = 0.05; o[LAY] = 0.62; o[LEL] = -0.55; o[SWL] = 0; o[SY] = 0.18; o[HY] = -0.15;
        break;
      case 'ragdoll': {
        const air = p.state === 'ragdoll' && Math.abs(p.vel.y) > 0.5 ? 1 : 0;
        const fl = Math.sin(t * 15 + sd) * air;
        o[LAP] = -0.4 + fl * 0.6; o[RAP] = -0.2 - fl * 0.6; o[LAR] = o[RAR] = 1.15; o[LEL] = o[REL] = -0.55;
        o[LTR] = 0.22; o[RTR] = 0.18; o[LKN] = 0.35 + air * 0.4; o[RKN] = 0.6 - fl * 0.3; o[LTP] = -0.25; o[RTP] = 0.1;
        o[HP] = -0.3; o[HY] = (p.seed - 0.5) * 1.2; o[SWL] = o[SWR] = 0;
        break;
      }
    }
    // a glance at the player walking close by
    const pl = G.player;
    if (!p.lookAt && !pl.vehicle && p.role === 'civ' && (act === 'idle' || act === 'listen' || act === 'cross' || act === 'sit') && (pl.pos.x - p.pos.x) ** 2 + (pl.pos.z - p.pos.z) ** 2 < 20) p.lookAt = pl;
    if (p.lookAt && act !== 'talk') {
      const q = p.lookAt;
      o[HY] = clamp(wrapAngle(Math.atan2(q.pos.x - p.pos.x, q.pos.z - p.pos.z) - p.heading), -1.1, 1.1);
      p.lookAt = null;
    }
    return o;
  }

  // ---- drawing ----------------------------------------------------------------------------------
  draw(t) {
    const list = this.list, n = list.length;
    const camera = G.camera, cam = camera.position;
    camera.updateMatrixWorld();
    _fr.setFromProjectionMatrix(_pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const dt = Math.min(0.1, G.dt || 1 / 60);
    for (const P of this.parts) P.n = 0;
    const NT = this.near, FT = this.far;
    const blobs = this.blobs, ba = blobs.instanceMatrix.array;
    let nb = 0;
    const k = 1 - Math.exp(-dt * 7), k2 = 1 - Math.exp(-dt * 14);
    for (let i = 0; i < n; i++) {
      const p = list[i];
      if (!this.visible(p.pos.x, p.pos.y, p.pos.z, 2.2)) continue;
      const L = p.look, K = p.kit, sc = L.scale;
      const dx = p.pos.x - cam.x, dz = p.pos.z - cam.z, d2 = dx * dx + dz * dz;
      // detail tier, with a little hysteresis so nobody flickers at the boundary
      p.farLod = p.farLod ? d2 > 400 : d2 > 625;
      const nearT = !p.farLod && NT.torso.n < NEAR_MAX;
      // occasionally glance somewhere new
      p.lookT -= dt;
      if (p.lookT <= 0) { p.lookT = rand(2, 6); p.lookH = chance(0.5) ? 0 : rand(-0.9, 0.9); }
      // ease towards the activity's pose (every other frame for people further off)
      const J = p.j;
      if (!p.farLod || (this.frame + p.id) & 1) {
        const tg = this.target(p, t, T);
        let kk = p.farLod ? k2 : k;
        if (p.act === 'ragdoll' || p.act === 'panic' || p.act === 'cower') kk = Math.min(1, kk * 2);
        for (let q = 0; q < NJ; q++) J[q] += (tg[q] - J[q]) * kk;
      }
      // walk / run cycle on top
      F.set(J);
      const s = p.speed, amp = clamp(s / 1.3, 0, 1), run = Math.max(smoothstep(2.3, 4.4, s), p.habit === 'jog' ? smoothstep(1.2, 2.6, s) * 0.8 : 0);
      const ph = p.phase, sn = Math.sin(ph), cs = Math.cos(ph);
      let legDrop = 0;
      if (amp > 0.01) {
        const A = (0.2 + 0.14 * Math.min(s, 2.2)) * amp + run * 0.3;
        let hL = 0, hR = 0;
        for (let side = 0; side < 2; side++) {
          const ss = side ? -sn : sn, cc = side ? -cs : cs;
          const sw = Math.max(0, cc);
          const th = -A * ss - run * 0.12;
          const kn = amp * (0.06 + (0.85 + run * 0.95) * sw ** 1.4 + 0.12 * Math.max(0, -cc) * (1 - run)) + run * 0.22;
          const fw = amp * (0.55 * Math.max(0, -ss) ** 2 * clamp(cc + 0.7, 0, 1) - 0.25 * Math.max(0, ss) ** 2) * (1 - run * 0.5);
          const iT = side ? RTP : LTP, iK = side ? RKN : LKN, iF = side ? RFT : LFT;
          F[iT] += th; F[iK] += kn; F[iF] += fw - th - kn;
          const h = TH_LEN * Math.cos(th) + SH_LEN * Math.cos(th + kn);
          if (side) hR = h; else hL = h;
        }
        legDrop = Math.max(hL, hR) - LEG + run * 0.045 * Math.abs(cs);
        const Aa = amp * (0.3 + 0.08 * Math.min(s, 2)) * (1 - run) + run * 0.8;
        F[LAP] += Aa * sn * J[SWL]; F[RAP] -= Aa * sn * J[SWR];
        F[LEL] -= (amp * (0.12 + 0.3 * Math.max(0, -sn)) * (1 - run) + run * (1.3 + 0.25 * sn)) * J[SWL];
        F[REL] -= (amp * (0.12 + 0.3 * Math.max(0, sn)) * (1 - run) + run * (1.3 - 0.25 * sn)) * J[SWR];
        F[LAR] += run * 0.12; F[RAR] += run * 0.12;
        const hy = -0.12 * A * sn;
        F[HIPY] += hy; F[SY] -= hy * 1.7; F[HY] += hy * 0.6;
        F[HIPR] -= 0.05 * amp * cs * (1 - run); F[SR] += 0.035 * amp * cs * (1 - run);
        F[SWAY] -= 0.022 * amp * cs * (1 - run);
        F[SP] += 0.03 * amp + run * 0.17; F[HP] -= run * 0.12;
      }
      const flash = p.flash > 0;
      // root: position, heading, falling over backwards
      const lie = Math.max(p.lie, F[LIE]);
      const r = Mroot;
      const ch = Math.cos(p.heading), sh = Math.sin(p.heading);
      r[0] = ch * sc; r[1] = 0; r[2] = -sh * sc; r[3] = 0; r[4] = sc; r[5] = 0; r[6] = sh * sc; r[7] = 0; r[8] = ch * sc;
      r[9] = p.pos.x; r[10] = p.pos.y + lie * 0.16 + (legDrop + F[DROP]) * sc * (1 - lie); r[11] = p.pos.z;
      rx(r, F[PITCH] - lie * 1.5);
      // pelvis, torso, head
      rz(ry(child(Mpel, r, F[SWAY], 1.0, 0), F[HIPY]), F[HIPR]);
      rz(rx(ry(child(Mtor, Mpel, 0, 0, 0), F[SY]), F[SP]), F[SR]);
      const build = L.build || 1, hipW = L.hipW || 1, depth = L.depth || 1;
      const tier = nearT ? NT : FT;
      tier.torso.add(Mtor, build, 1, depth, K.torso, flash);
      const po = tier.pelvis.add(Mpel, build, 1, depth, K.pelvis, flash);
      if (po >= 0 && p.restAct === 'lie' && p.act === 'lie' && nearT) tier.pelvis.data[po + 12] = K.pelvis[12] + (1 << PELVIS.TOWEL);
      rz(rx(ry(child(Mhead, Mtor, 0, 0.56, 0), F[HY]), F[HP]), F[HRL]);
      child(Mtmp, Mhead, 0, 0.065, 0.006);
      tier.head.add(Mtmp, 1, 1, 1, K.head, flash);
      // arms and legs
      for (let side = 0; side < 2; side++) {
        const sg = side ? -1 : 1;
        const ap = F[side ? RAP : LAP], ar = F[side ? RAR : LAR], ay = F[side ? RAY : LAY], el = F[side ? REL : LEL];
        ry(rx(rz(child(Mua, Mtor, sg * 0.238 * build, 0.405, -0.008), sg * ar), ap), -sg * ay);
        if (nearT) {
          NT.uarm.add(Mua, 1, 1, 1, K.uarm, flash);
          rx(child(Mfa, Mua, 0, -UA_LEN, 0), el);
          const rec = side ? K.farmR : K.farmL;
          const o = NT.farm.add(Mfa, 1, 1, 1, rec, flash);
          if (o >= 0 && side && (p.act === 'phone' || p.act === 'sitPhone') && J[REL] < -1.1) NT.farm.data[o + 12] = rec[12] + (1 << FARM.PHONE);
        } else {
          rx(Mua, el * 0.45);
          FT.arm.add(Mua, 1, 1, 1, K.farArm, flash);
        }
        const tp = F[side ? RTP : LTP], tr = F[side ? RTR : LTR], kn = F[side ? RKN : LKN], ft = F[side ? RFT : LFT];
        rx(rz(child(Mth, Mpel, sg * 0.092 * hipW, -0.18, 0), sg * tr), tp);
        tier.thigh.add(Mth, 1, 1, 1, K.thigh, flash);
        rx(child(Msh, Mth, 0, -TH_LEN, 0), kn);
        tier.shin.add(Msh, 1, 1, 1, K.shin, flash);
        if (nearT) {
          rx(child(Mft, Msh, 0, -0.355, 0), ft);
          NT.foot.add(Mft, 1, 1, 1, K.foot, flash);
        }
      }
      // soft contact shadow
      const bo = nb * 16;
      const bs = p.mode === 'beach' || lie > 0.5 ? 1.6 : 1;
      ba[bo] = bs; ba[bo + 1] = 0; ba[bo + 2] = 0; ba[bo + 3] = 0; ba[bo + 4] = 0; ba[bo + 5] = 1; ba[bo + 6] = 0; ba[bo + 7] = 0;
      ba[bo + 8] = 0; ba[bo + 9] = 0; ba[bo + 10] = bs; ba[bo + 11] = 0;
      ba[bo + 12] = p.pos.x - sh * lie * 0.7; ba[bo + 13] = p.pos.y + 0.05; ba[bo + 14] = p.pos.z - ch * lie * 0.7; ba[bo + 15] = 1;
      nb++;
    }
    for (const P of this.parts) P.flush();
    blobs.count = nb;
    blobs.instanceMatrix.needsUpdate = true;
  }
}
