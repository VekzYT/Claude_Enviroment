// Pedestrians. Simulated on the CPU, drawn with a handful of instanced meshes (one per body part).
import * as THREE from 'three';
import { G, emit } from '../state.js';
import { groundHeight } from '../world/roads.js';
import { resolveCircle } from '../world/colliders.js';
import { blocks, sidewalkLoop, blockAt, DISTRICTS } from '../world/cityplan.js';
import { CITY } from '../world/layout.js';
import { PIER } from '../world/landmarks.js';
import { PED_LOOKS, COP_LOOK } from './pedlooks.js';
import { makeBlobTexture } from '../world/textures.js';
import { clamp, wrapAngle } from '../util/math.js';
import { rand, pick, chance } from '../util/rng.js';

const MAX = 96;
const out = { x: 0, z: 0, broken: [] };
const _m = new THREE.Matrix4(), _l = new THREE.Matrix4(), _r = new THREE.Matrix4(), _c = new THREE.Color();
const _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const DENSITY = { strip: 1.6, downtown: 1.2, ocean: 1.2, midtown: 0.9, oldtown: 0.9, riverside: 0.6, uptown: 0.5, docks: 0.3 };
let nextId = 1;

export class Peds {
  constructor(scene) {
    this.list = [];
    this.timer = 0;
    this.density = 1;
    const std = (opts = {}) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...opts });
    const mk = (geo, mat, shadow = true) => {
      const m = new THREE.InstancedMesh(geo, mat, MAX);
      m.count = 0; m.frustumCulled = false; m.castShadow = shadow; m.receiveShadow = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.setColorAt(0, _c.set(0xffffff));
      scene.add(m);
      return m;
    };
    const head = new THREE.IcosahedronGeometry(0.135, 1);
    const hair = new THREE.SphereGeometry(0.15, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55);
    this.parts = {
      torso: mk(new THREE.BoxGeometry(0.44, 0.62, 0.25), std()),
      head: mk(head, std({ roughness: 0.6 })),
      hair: mk(hair, std()),
      armL: mk(new THREE.BoxGeometry(0.115, 0.58, 0.115), std()),
      armR: mk(new THREE.BoxGeometry(0.115, 0.58, 0.115), std()),
      legL: mk(new THREE.BoxGeometry(0.16, 0.78, 0.17), std()),
      legR: mk(new THREE.BoxGeometry(0.16, 0.78, 0.17), std()),
      glow: mk(new THREE.BoxGeometry(0.46, 0.06, 0.27), new THREE.MeshBasicMaterial({ toneMapped: false }), false),
    };
    const blobGeo = new THREE.PlaneGeometry(0.95, 0.95);
    blobGeo.rotateX(-Math.PI / 2);
    this.blobs = mk(blobGeo, new THREE.MeshBasicMaterial({ map: makeBlobTexture(), transparent: true, depthWrite: false, opacity: 0.6, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7 }), false);
    this.blobs.renderOrder = 2;
    this.regions = [
      { x0: CITY.promenade.x0 + 1.5, x1: CITY.promenade.x1 - 1.5, z0: CITY.promenade.z0 + 4, z1: CITY.promenade.z1 - 4, w: 1.4 },
      { x0: PIER.x0 + 2, x1: PIER.x1 - 50, z0: -6, z1: 6, w: 1.2 },
    ];
    for (const b of blocks) if (b.park || b.plaza) this.regions.push({ x0: b.x0 + 6, x1: b.x1 - 6, z0: b.z0 + 6, z1: b.z1 - 6, w: 1.1, avoid: { x: b.cx, z: b.cz, r: 12 } });
  }

  // ---- creation -------------------------------------------------------------
  spawn(x, z, look = pick(PED_LOOKS), opts = {}) {
    if (this.list.length >= MAX) return null;
    const p = {
      id: nextId++, pos: { x, y: groundHeight(x, z, 9999), z }, vel: { x: 0, y: 0, z: 0 },
      heading: opts.heading ?? rand(0, 6.28), look, role: opts.role || 'civ', state: 'walk',
      health: opts.health ?? 60, phase: rand(0, 6), speedWant: rand(1.25, 1.7), speed: 0,
      dest: null, path: [], stateT: 0, lie: 0, aim: 0, alive: true, brain: opts.brain || null,
      block: null, region: null, cw: 1, corner: 0, fleeFrom: null, flash: 0, gun: false,
    };
    this.list.push(p);
    return p;
  }
  spawnCop(x, z, brain) {
    return this.spawn(x, z, COP_LOOK, { role: 'cop', health: 110, brain });
  }
  remove(p) {
    const i = this.list.indexOf(p);
    if (i >= 0) this.list.splice(i, 1);
    p.alive = false; p.removed = true;
  }

  // ---- civilian routing ------------------------------------------------------
  nextLeg(p) {
    if (p.region) {
      const r = p.region;
      for (let k = 0; k < 6; k++) {
        const x = rand(r.x0, r.x1), z = rand(r.z0, r.z1);
        if (r.avoid && Math.hypot(x - r.avoid.x, z - r.avoid.z) < r.avoid.r) continue;
        p.path.push({ x, z });
        return;
      }
      return;
    }
    const b = p.block;
    if (!b) return;
    const loop = sidewalkLoop(b);
    const nBlocksZ = CITY.zs.length - 1;
    // travel direction along the side we just walked
    const from = loop[(p.corner - p.cw + 4) % 4], at = loop[p.corner];
    const dx = Math.sign(Math.round(at.x - from.x)), dz = Math.sign(Math.round(at.z - from.z));
    const nb = blocks[(b.i + dx) * nBlocksZ + (b.j + dz)];
    const canCross = nb && b.i + dx >= 0 && b.i + dx < CITY.xs.length - 1 && b.j + dz >= 0 && b.j + dz < nBlocksZ;
    if (canCross && chance(0.4)) {
      // cross the street to the matching corner of the next block and keep going
      const nl = sidewalkLoop(nb);
      const entry = (p.corner - p.cw + 4) % 4; // the corner "behind" us on the same side maps across the road
      p.block = nb;
      p.path.push({ x: nl[entry].x, z: nl[entry].z }, { x: nl[p.corner].x, z: nl[p.corner].z });
      return;
    }
    p.corner = (p.corner + p.cw + 4) % 4;
    p.path.push({ x: loop[p.corner].x + rand(-0.8, 0.8), z: loop[p.corner].z + rand(-0.8, 0.8) });
  }

  spawnAmbient(pp, t) {
    // pick a spot 35-115 m from the player
    for (let tries = 0; tries < 6; tries++) {
      const a = rand(0, 6.283), d = rand(38, 115);
      const x = pp.x + Math.cos(a) * d, z = pp.z + Math.sin(a) * d;
      let region = null;
      for (const r of this.regions) if (x > r.x0 - 8 && x < r.x1 + 8 && z > r.z0 - 8 && z < r.z1 + 8 && chance(0.5 * r.w)) { region = r; break; }
      if (region) {
        const sx = clamp(x, region.x0, region.x1), sz = clamp(z, region.z0, region.z1);
        if (region.avoid && Math.hypot(sx - region.avoid.x, sz - region.avoid.z) < region.avoid.r) continue;
        const p = this.spawn(sx, sz);
        if (p) { p.region = region; p.speedWant *= 0.85; }
        return p;
      }
      const b = blockAt(x, z);
      if (!b || b.park || b.plaza || b.dome) continue;
      if (!chance(Math.min(1, DENSITY[b.district] || 0.5))) continue;
      const loop = sidewalkLoop(b);
      const c = Math.floor(rand(0, 4)), cw = chance(0.5) ? 1 : -1;
      const A = loop[c], B = loop[(c + cw + 4) % 4];
      const f = rand(0.05, 0.95);
      const sx = A.x + (B.x - A.x) * f, sz = A.z + (B.z - A.z) * f;
      if (Math.hypot(sx - pp.x, sz - pp.z) < 30) continue;
      const p = this.spawn(sx, sz);
      if (!p) return null;
      p.block = b; p.cw = cw; p.corner = (c + cw + 4) % 4;
      p.path.push({ x: B.x, z: B.z });
      p.heading = Math.atan2(B.x - A.x, B.z - A.z);
      return p;
    }
    return null;
  }

  // ---- reactions --------------------------------------------------------------
  scare(x, z, radius, seconds = 8) {
    for (const p of this.list) {
      if (p.role !== 'civ' || p.state === 'ragdoll' || p.state === 'down') continue;
      const d = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (d < radius) { p.state = 'flee'; p.fleeFrom = { x, z }; p.stateT = seconds * rand(0.7, 1.3); }
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
    if (wasUp) emit('pedDown', p, source, dmg);
    return wasUp;
  }
  hurt(p, dmg, source = null, fromX = p.pos.x, fromZ = p.pos.z) {
    if (!p.alive || p.state === 'down') return;
    p.health -= dmg; p.flash = 0.15;
    if (p.health <= 0 || dmg >= 25) {
      const dx = p.pos.x - fromX, dz = p.pos.z - fromZ, d = Math.hypot(dx, dz) || 1;
      this.knock(p, (dx / d) * 3, 2.5, (dz / d) * 3, 0, source);
    } else if (p.role === 'civ') { p.state = 'flee'; p.fleeFrom = { x: fromX, z: fromZ }; p.stateT = 9; }
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
      if (y < -0.1 || y > (p.state === 'ragdoll' ? 0.6 : 1.85)) continue;
      bt = t; best = p;
    }
    return best ? { ped: best, t: bt } : null;
  }

  // ---- simulation ------------------------------------------------------------
  update(dt, t) {
    const pl = G.player;
    const pp = pl.vehicle ? pl.vehicle.pos : pl.pos;
    // population
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.25;
      const inCity = pp.x > CITY.x0 - 60 && pp.x < CITY.x1 + 80 && pp.z > CITY.z0 - 60 && pp.z < CITY.z1 + 60;
      const b = blockAt(pp.x, pp.z);
      const dk = b ? DENSITY[b.district] || 0.6 : 0.6;
      const want = inCity ? Math.round(46 * this.density * clamp(dk, 0.4, 1.3) * (1 - G.env.night * 0.35)) : 0;
      let civ = 0;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        const d = Math.hypot(p.pos.x - pp.x, p.pos.z - pp.z);
        if (p.role === 'civ') {
          if (d > 160 || (p.state === 'down' && p.stateT > 14 && d > 30) || (p.state === 'down' && p.stateT > 40)) { this.remove(p); continue; }
          civ++;
        } else if (p.role !== 'cop' && d > 220 && !p.keep) this.remove(p);
      }
      for (let k = 0; k < 3 && civ + k < want; k++) this.spawnAmbient(pp, t);
    }

    const vehicles = G.vehicles;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
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
        if (p.state === 'ragdoll' && p.stateT > 1.2 && Math.abs(p.vel.x) + Math.abs(p.vel.z) < 0.5) {
          if (p.health <= 0) { p.state = 'down'; p.stateT = 0; emit('pedOut', p); }
          else if (p.stateT > 3.2) { p.state = p.role === 'civ' ? 'flee' : 'walk'; p.stateT = 8; p.fleeFrom = { x: pp.x, z: pp.z }; if (p.role !== 'civ') p.stateT = 0; }
        }
        continue;
      }
      p.lie = Math.max(0, p.lie - dt * 4);

      // decide where to go
      let want = p.speedWant;
      if (p.brain) want = p.brain(p, dt, t) ?? 0;
      else if (p.state === 'flee') {
        const dx = p.pos.x - p.fleeFrom.x, dz = p.pos.z - p.fleeFrom.z, d = Math.hypot(dx, dz) || 1;
        p.dest = { x: p.pos.x + (dx / d) * 12, z: p.pos.z + (dz / d) * 12 };
        want = 5.6;
        p.stateT -= dt * 2; // stateT counts down while fleeing (it was set to a duration)
        if (p.stateT <= 0) { p.state = 'walk'; p.stateT = 0; p.dest = null; p.path.length = 0; }
      } else {
        if (!p.dest) { if (!p.path.length) this.nextLeg(p); p.dest = p.path.shift() || null; }
        if (!p.dest) want = 0;
      }

      // move
      let sp = 0;
      if (p.dest && want > 0) {
        const dx = p.dest.x - p.pos.x, dz = p.dest.z - p.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.9 && p.state !== 'flee' && !p.brain) p.dest = null;
        else if (d > 0.05) {
          const th = Math.atan2(dx, dz);
          p.heading += clamp(wrapAngle(th - p.heading), -dt * 7, dt * 7);
          sp = want;
          const nx = p.pos.x + Math.sin(p.heading) * sp * dt, nz = p.pos.z + Math.cos(p.heading) * sp * dt;
          const g = groundHeight(nx, nz, p.pos.y + 1);
          if (g > -0.45) { p.pos.x = nx; p.pos.z = nz; p.pos.y = g; } else sp = 0;
          const hit = resolveCircle(p.pos.x, p.pos.z, 0.32, p.pos.y, out, 1.6);
          if (hit) { p.pos.x = out.x; p.pos.z = out.z; if (!p.brain && p.state !== 'flee') { p.stuck = (p.stuck || 0) + dt; if (p.stuck > 1.5) { p.dest = null; p.stuck = 0; } } }
        }
      }
      p.speed += (sp - p.speed) * Math.min(1, dt * 8);
      p.phase += p.speed * dt * 2.6;

      // vehicles: get hit or step aside
      for (let k = 0; k < vehicles.length; k++) {
        const v = vehicles[k];
        const dx = p.pos.x - v.pos.x, dz = p.pos.z - v.pos.z;
        const rr = v.radius + 0.5;
        if (dx * dx + dz * dz > rr * rr || Math.abs(v.pos.y - p.pos.y) > 2.2) continue;
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
          p.pos.x = cx + (ex / d) * r; p.pos.z = cz + (ez / d) * r;
        }
        if (p.state === 'ragdoll') break;
      }
    }
    this.draw(t);
  }

  draw(t) {
    const P = this.parts;
    const n = this.list.length;
    for (let i = 0; i < n; i++) {
      const p = this.list[i];
      const L = p.look, sc = L.scale;
      const swing = Math.sin(p.phase) * clamp(p.speed / 2.2, 0, 1) * 0.75;
      const bob = Math.abs(Math.cos(p.phase)) * 0.03 * clamp(p.speed / 2, 0, 1);
      // root
      _e.set(-p.lie * 1.5, p.heading, 0);
      _q.setFromEuler(_e);
      _m.compose(_p.set(p.pos.x, p.pos.y + bob + p.lie * 0.16, p.pos.z), _q, _s.set(sc, sc, sc));
      const part = (mesh, x, y, z, rx = 0, py = 0, color) => {
        _l.makeRotationX(rx);
        _l.setPosition(x, y, z);
        if (py) { _r.makeTranslation(0, py, 0); _l.multiply(_r); }
        _l.premultiply(_m);
        mesh.setMatrixAt(i, _l);
        mesh.setColorAt(i, color);
      };
      const flash = p.flash > 0;
      const col = (hex) => (flash ? _c.set(0xffffff) : _c.set(hex));
      part(P.torso, 0, 1.1, 0, p.speed > 3 ? 0.14 : 0.02, 0, col(L.top));
      part(P.head, 0, 1.58, 0.01, 0, 0, col(L.skin));
      _l.makeScale(L.hat ? 1.12 : 1, L.hat ? 0.62 : 1, L.hat ? 1.25 : 1); _l.setPosition(0, L.hat ? 1.66 : 1.6, L.hat ? 0.03 : -0.01); _l.premultiply(_m);
      P.hair.setMatrixAt(i, _l); P.hair.setColorAt(i, col(L.hat ? (L.cop ? 0x1c1d22 : L.top) : L.hair));
      const armR = p.aim > 0.5 ? -1.45 : -swing;
      part(P.armL, 0.28, 1.38, 0, swing, -0.27, col(L.top));
      part(P.armR, -0.28, 1.38, 0, armR, -0.27, col(L.top));
      part(P.legL, 0.11, 0.78, 0, -swing, -0.39, col(L.bottom));
      part(P.legR, -0.11, 0.78, 0, swing, -0.39, col(L.bottom));
      if (L.glow) { part(P.glow, 0, 1.2, 0, 0, 0, _c.set(L.glow).multiplyScalar(1.6)); } else P.glow.setMatrixAt(i, ZERO);
      _l.makeTranslation(p.pos.x, p.pos.y + 0.05, p.pos.z);
      this.blobs.setMatrixAt(i, _l);
    }
    for (const k of Object.keys(P)) {
      const m = P[k];
      m.count = n;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    this.blobs.count = n;
    this.blobs.instanceMatrix.needsUpdate = true;
  }
}
