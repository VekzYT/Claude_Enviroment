// A little life outside the city: wheeling bird flocks, bayou gators, and air traffic over downtown.
import * as THREE from 'three';
import { G, emit } from '../state.js';
import { terrainHeight } from './roads.js';
import { Batch } from './geom.js';
import { POI, WATER_Y, CITY } from './layout.js';
import { RNG, rand } from '../util/rng.js';
import { clamp, wrapAngle } from '../util/math.js';
import { PAL } from './palette.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

export function buildWildlife(scene, env) {
  const rng = new RNG(606);

  // ---- birds ---------------------------------------------------------------
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.35, -1, 0.1, -0.25, 0, 0, -0.2, 0, 0, 0.35, 0, 0, -0.2, 1, 0.1, -0.25], 3));
  bg.computeVertexNormals();
  const flocks = [
    { x: -1000, z: 620, r: 70, h: 26, n: 9 }, { x: -880, z: 120, r: 50, h: 20, n: 7 }, { x: 940, z: 220, r: 80, h: 30, n: 10 },
    { x: 700, z: 1160, r: 60, h: 24, n: 8 }, { x: -320, z: -1100, r: 90, h: 55, n: 8 }, { x: 1050, z: 0, r: 45, h: 34, n: 7 }, { x: -200, z: 900, r: 70, h: 22, n: 8 },
  ];
  const total = flocks.reduce((a, f) => a + f.n, 0);
  const birds = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ color: 0x2a2a30, side: THREE.DoubleSide }), total);
  birds.frustumCulled = false;
  scene.add(birds);
  for (const f of flocks) { f.speed = rng.float(0.16, 0.26) * (rng.chance(0.5) ? 1 : -1); f.phase = rng.float(0, 6); }

  // ---- gators --------------------------------------------------------------
  const gb = new Batch();
  gb.box(0.7, 0.32, 2.2, 0, 0, 0, 0x33452a);
  gb.box(0.5, 0.2, 0.9, 0, 0.02, 1.45, 0x3a4d2e);
  gb.cbox(0.28, 0.16, 1.6, 0, 0.14, -1.7, 0x2d3d25);
  for (let k = 0; k < 5; k++) gb.box(0.12, 0.12, 0.12, 0, 0.3, -0.8 + k * 0.4, 0x24321e);
  const gGeo = gb.merged();
  const gMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true });
  const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonAmber).multiplyScalar(1.6), toneMapped: false });
  const eyeGeo = new THREE.SphereGeometry(0.06, 6, 4);
  const gators = [];
  const anchors = [[POI.gator.x, POI.gator.z + 40], [POI.gator.x - 60, POI.gator.z - 30], [POI.camp.x + 40, POI.camp.z - 30], [POI.jetty.x + 30, POI.jetty.z + 50],
    [-900, 400], [-1100, 300], [-820, 700], [-200, 860], [-1150, 760], [100, 900], [-960, 60], [-700, 520]];
  for (const [ax, az] of anchors) {
    for (let k = 0; k < 40; k++) {
      const x = ax + rng.float(-70, 70), z = az + rng.float(-70, 70);
      const a = rng.float(0, 6.28), len = rng.float(14, 30);
      const x2 = x + Math.cos(a) * len, z2 = z + Math.sin(a) * len;
      const ok = (px, pz) => terrainHeight(px, pz) < -0.9;
      if (!ok(x, z) || !ok(x2, z2) || !ok((x + x2) / 2, (z + z2) / 2)) continue;
      const g = new THREE.Group();
      g.add(new THREE.Mesh(gGeo, gMat));
      for (const sx of [-0.2, 0.2]) { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(sx, 0.34, 1.0); g.add(e); }
      scene.add(g);
      gators.push({ mesh: g, a: { x, z }, b: { x: x2, z: z2 }, x, z, heading: a, to: 1, bite: 0, mood: 0 });
      break;
    }
  }

  // ---- air traffic over the boulevards -----------------------------------------
  const lanes = [
    { ax: 100, az: CITY.z0 - 300, bx: 100, bz: CITY.z1 + 300, y: 150 }, { ax: 112, az: CITY.z1 + 300, bx: 112, bz: CITY.z0 - 300, y: 168 },
    { ax: CITY.x0 - 300, az: 0, bx: CITY.x1 + 500, bz: 0, y: 186 }, { ax: CITY.x1 + 500, az: 12, bx: CITY.x0 - 300, bz: 12, y: 132 },
    { ax: CITY.x0, az: CITY.z0, bx: CITY.x1, bz: CITY.z1, y: 215 },
  ];
  const N = 46;
  const flyers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.5, 4.2), new THREE.MeshBasicMaterial({ toneMapped: false }), N);
  flyers.frustumCulled = false;
  scene.add(flyers);
  const cols = [0xffe8c0, 0x5ff3ff, 0xff7a59, 0xffffff];
  const fl = [];
  for (let i = 0; i < N; i++) { fl.push({ lane: lanes[i % lanes.length], s: rng.float(0, 1), v: rng.float(34, 58), wob: rng.float(0, 6) }); flyers.setColorAt(i, _c.set(cols[i % cols.length]).multiplyScalar(2.2)); }
  flyers.instanceColor.needsUpdate = true;

  return {
    gators,
    update(dt, t) {
      // birds: wheel around their flock centre, wings "flap" by squashing the span
      let i = 0;
      for (const f of flocks) {
        for (let k = 0; k < f.n; k++, i++) {
          const a = t * f.speed + f.phase + (k / f.n) * 6.283 * 0.5 + Math.sin(t * 0.3 + k) * 0.3;
          const r = f.r * (0.7 + 0.3 * Math.sin(t * 0.21 + k * 1.7));
          _e.set(0, a + (f.speed > 0 ? Math.PI / 2 : -Math.PI / 2) + Math.PI / 2, Math.sin(t * 0.7 + k) * 0.3);
          _q.setFromEuler(_e);
          _m.compose(_p.set(f.x + Math.sin(a) * r, f.h + Math.sin(t * 0.5 + k * 2.1) * 4, f.z + Math.cos(a) * r), _q, _s.set(0.55 + 0.75 * Math.abs(Math.sin(t * 7 + k * 1.3)), 1.4, 1.4));
          birds.setMatrixAt(i, _m);
        }
      }
      birds.instanceMatrix.needsUpdate = true;

      // gators
      const pl = G.player;
      for (const g of gators) {
        if (g.bite > 0) g.bite -= dt;
        const dpx = pl.pos.x - g.x, dpz = pl.pos.z - g.z, dp = Math.hypot(dpx, dpz);
        let tx, tz, sp = 1.1;
        const hunting = !pl.vehicle && pl.alive && dp < 16 && terrainHeight(pl.pos.x, pl.pos.z) < -0.2;
        if (hunting) { tx = pl.pos.x; tz = pl.pos.z; sp = 3.6; }
        else { const q = g.to ? g.b : g.a; tx = q.x; tz = q.z; if (Math.hypot(tx - g.x, tz - g.z) < 1.5) g.to = 1 - g.to; }
        const want = Math.atan2(tx - g.x, tz - g.z);
        g.heading += clamp(wrapAngle(want - g.heading), -dt * 2, dt * 2);
        const nx = g.x + Math.sin(g.heading) * sp * dt, nz = g.z + Math.cos(g.heading) * sp * dt;
        if (terrainHeight(nx, nz) < -0.5) { g.x = nx; g.z = nz; }
        if (hunting && dp < 1.9 && g.bite <= 0) {
          g.bite = 2.2;
          pl.hurt(18, 'gator');
          if (pl.alive) pl.knockDown((dpx / (dp + 0.1)) * 4, 3, (dpz / (dp + 0.1)) * 4, 0.9);
          emit('toast', 'Gator! Get out of the water.');
          emit('sfx', 'splash', g.x, g.z);
          G.fx.splash(g.x, g.z, 0.8);
        }
        g.mesh.position.set(g.x, WATER_Y - 0.12 + Math.sin(t * 1.4 + g.x) * 0.03, g.z);
        g.mesh.rotation.y = g.heading + Math.sin(t * (hunting ? 9 : 3) + g.z) * 0.12;
      }

      // flyers
      const k = 0.75 + env.night * 0.6;
      for (let j = 0; j < N; j++) {
        const f = fl[j], L = f.lane;
        const len = Math.hypot(L.bx - L.ax, L.bz - L.az);
        f.s += (f.v * dt) / len;
        if (f.s > 1) f.s -= 1;
        _e.set(0, Math.atan2(L.bx - L.ax, L.bz - L.az), 0);
        _q.setFromEuler(_e);
        _m.compose(_p.set(L.ax + (L.bx - L.ax) * f.s, L.y + Math.sin(t * 0.6 + f.wob) * 4, L.az + (L.bz - L.az) * f.s), _q, _s.set(k, k, 1.6));
        flyers.setMatrixAt(j, _m);
      }
      flyers.instanceMatrix.needsUpdate = true;
    },
  };
}
