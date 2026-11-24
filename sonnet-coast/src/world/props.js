// Street furniture: lamps, traffic signals, benches, bins, hydrants, vending machines, bus shelters.
import * as THREE from 'three';
import { edges, nodes, edgePoint } from './roads.js';
import { CITY } from './layout.js';
import { blockAt, DISTRICTS } from './cityplan.js';
import { Batch, ChunkedInstances, tmpMatrix } from './geom.js';
import { addCircle, addBox } from './colliders.js';
import { registerBreakable } from './breakables.js';
import { makeGlowTexture } from './textures.js';
import { PAL } from './palette.js';
import { benchSpots, parkLamps, NEON } from './city.js';
import { setLamp, LAMP_SLOTS } from './citylight.js';
import { RNG } from '../util/rng.js';

const GY = CITY.y + 0.16;

function poleGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.09, 0.15, 7.2, 6), 0x33343a, 0, 3.6, 0);
  b.cbox(0.3, 0.5, 0.3, 0, 0.25, 0, 0x2a2b30);
  b.cbox(0.12, 0.12, 2.2, 0, 7.12, 1.0, 0x33343a);
  b.cbox(0.52, 0.16, 1.05, 0, 7.06, 2.0, 0x26272b);
  return b.merged();
}
function parkLampGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 6), 0x2c2d32, 0, 1.8, 0);
  b.cbox(0.5, 0.06, 0.5, 0, 3.92, 0, 0x2c2d32);
  return b.merged();
}
function signalGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.1, 0.15, 6.0, 6), 0x2c2d32, 0, 3.0, 0);
  b.cbox(4.0, 0.12, 0.12, -2.0, 5.9, 0, 0x2c2d32);          // mast arm over the lane
  b.cbox(0.42, 1.25, 0.3, -3.6, 5.4, 0, 0x17181b);          // head on the arm
  b.cbox(0.42, 1.25, 0.3, 0.0, 3.6, 0.2, 0x17181b);         // repeater on the pole
  b.cbox(0.5, 0.06, 0.4, -3.6, 6.05, 0.05, 0x17181b);       // visor
  return b.merged();
}
function signalLampGeo(dy) {
  const b = new Batch();
  b.cbox(0.26, 0.26, 0.06, -3.6, 5.4 + dy, 0.17, 0xffffff);
  b.cbox(0.26, 0.26, 0.06, 0.0, 3.6 + dy, 0.37, 0xffffff);
  return b.merged();
}
function benchGeo() {
  const b = new Batch();
  b.cbox(1.9, 0.08, 0.5, 0, 0.46, 0, 0x8a5a36);
  b.cbox(1.9, 0.5, 0.07, 0, 0.82, -0.24, 0x8a5a36, 0, -0.18);
  for (const sx of [-0.8, 0.8]) b.cbox(0.08, 0.46, 0.46, sx, 0.23, 0, 0x26272b);
  return b.merged();
}
function binGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.32, 0.27, 0.9, 8), 0x3a3c42, 0, 0.45, 0);
  b.add(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 8), PAL.terracotta, 0, 0.92, 0);
  return b.merged();
}
function hydrantGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.14, 0.17, 0.62, 8), PAL.terracottaLight, 0, 0.31, 0);
  b.add(new THREE.SphereGeometry(0.15, 8, 5), PAL.terracottaLight, 0, 0.64, 0);
  b.cbox(0.48, 0.12, 0.12, 0, 0.42, 0, PAL.cream);
  return b.merged();
}
function vendingGeo() {
  const b = new Batch();
  b.box(1.1, 1.95, 0.8, 0, 0, 0, 0x1d1e22);
  b.cbox(0.3, 0.5, 0.05, 0.3, 0.9, 0.41, 0x0e0e10);
  return b.merged();
}
function shelterGeo() {
  const b = new Batch();
  for (const sx of [-2.2, 2.2]) b.cbox(0.1, 2.5, 0.1, sx, 1.25, -0.7, 0x2c2d32);
  b.cbox(4.8, 0.1, 1.9, 0, 2.55, 0, 0x2c2d32);
  b.cbox(4.4, 1.9, 0.05, 0, 1.3, -0.72, 0x6f8793);
  b.cbox(3.0, 0.08, 0.45, 0, 0.5, -0.4, 0x8a5a36);
  return b.merged();
}

// Signals: N-S traffic gets green first, E-W second; neighbouring junctions are half a cycle apart.
const CYCLE = 22;
export function signalState(node, axis, t) {
  if (!node.grid || node.signalBroken) return 'g';
  const ph = (t + ((node.gi + node.gj) % 2) * (CYCLE / 2)) % CYCLE;
  if (axis === 'z') return ph < 8 ? 'g' : ph < 10 ? 'a' : 'r';
  return ph >= 11 && ph < 19 ? 'g' : ph >= 19 && ph < 21 ? 'a' : 'r';
}

export function buildProps(scene, env, quality) {
  const group = new THREE.Group();
  group.name = 'props';
  const rng = new RNG(2024);
  const metal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.5 });
  const matte = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05 });
  const glowTex = makeGlowTexture();

  // ---- street lamps ---------------------------------------------------------
  const poles = new ChunkedInstances(poleGeo(), metal, { chunk: 300, maxDist: 520 });
  const lampBase = new THREE.Color(1.0, 0.8, 0.52);
  const lampMat = new THREE.MeshBasicMaterial({ color: lampBase.clone(), toneMapped: false });
  for (const ch of ['r', 'g', 'b']) env.nightLerp(lampMat.color, ch, lampBase[ch] * 0.45, lampBase[ch] * 3.4);
  const lamps = new ChunkedInstances(new THREE.BoxGeometry(0.4, 0.07, 0.92), lampMat, { chunk: 300, maxDist: 1300 });
  const poolGeo = new THREE.PlaneGeometry(1, 1);
  poolGeo.rotateX(-Math.PI / 2);
  const mkPool = (opacity) => {
    const m = new THREE.MeshBasicMaterial({
      map: glowTex, color: 0xffc98a, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6,
    });
    env.nightLerp(m, 'opacity', 0, opacity);
    return m;
  };
  // Outside the grid (and on the low preset) lamps fake their light with additive pools.
  const roadPools = new ChunkedInstances(poolGeo, mkPool(0.5), { chunk: 400, maxDist: 600 });
  const gridPoolMat = mkPool(quality === 'low' ? 0.5 : 0.0);
  const gridPools = new ChunkedInstances(poolGeo, gridPoolMat, { chunk: 400, maxDist: 500 });
  const P = {};
  let alt = 0;
  for (const e of edges) {
    if (e.type === 'dirt') continue;
    if (e.grid) {
      const line = e.axis === 'z' ? e.a.gi : e.a.gj;
      const cell = e.axis === 'z' ? e.a.gj : e.a.gi;
      LAMP_SLOTS.forEach((s, slot) => {
        for (const side of [-1, 1]) {
          edgePoint(e, s, (e.spec.hw + 1.5) * side, P);
          const hx = -(-P.dz) * side, hz = -(P.dx) * side;  // towards the centreline
          const heading = Math.atan2(hx, hz);
          const pr = poles.add(tmpMatrix(P.x, GY, P.z, heading, 1));
          const lx = P.x + hx * 2.0, lz = P.z + hz * 2.0;
          const lr = lamps.add(tmpMatrix(lx, GY + 6.96, lz, heading, 1));
          const pl = gridPools.add(tmpMatrix(lx + hx * 1.5, CITY.y + 0.09, lz + hz * 1.5, 0, 19, 1));
          const c = addCircle(P.x, P.z, 0.22, 0, GY + 7, {});
          const shaderSide = e.axis === 'z' ? (side === 1 ? 0 : 1) : (side === 1 ? 1 : 0);
          registerBreakable({ collider: c, fall: [pr], hide: [lr, pl], x: P.x, z: P.z, y: GY, kind: 'light', minSpeed: 7,
            onBreak: () => setLamp(e.axis, line, cell, slot, shaderSide, false) });
        }
      });
      continue;
    }
    for (let s = 30; s < e.len - 29; s += 52) {
      const side = alt++ % 2 ? 1 : -1;
      edgePoint(e, s, (e.spec.hw + 1.2) * side, P);
      if (P.bridge) continue;
      const y = P.y - 0.05;
      const hx = -(-P.dz) * side, hz = -(P.dx) * side;
      const heading = Math.atan2(hx, hz);
      const pr = poles.add(tmpMatrix(P.x, y, P.z, heading, 1));
      const lx = P.x + hx * 2.0, lz = P.z + hz * 2.0;
      const lr = lamps.add(tmpMatrix(lx, y + 6.96, lz, heading, 1));
      const pl = roadPools.add(tmpMatrix(lx + hx * 1.5, P.y + 0.09, lz + hz * 1.5, 0, 20, 1));
      const c = addCircle(P.x, P.z, 0.22, 0, y + 7, {});
      registerBreakable({ collider: c, fall: [pr], hide: [lr, pl], x: P.x, z: P.z, y, kind: 'light', minSpeed: 7 });
    }
  }

  // ---- park / plaza / car-park lamps -------------------------------------------
  const pLamps = new ChunkedInstances(parkLampGeo(), metal, { chunk: 400, maxDist: 350 });
  const bulbBase = new THREE.Color(1.0, 0.86, 0.62);
  const bulbMat = new THREE.MeshBasicMaterial({ color: bulbBase.clone(), toneMapped: false });
  for (const ch of ['r', 'g', 'b']) env.nightLerp(bulbMat.color, ch, bulbBase[ch] * 0.5, bulbBase[ch] * 3);
  const bulbs = new ChunkedInstances(new THREE.SphereGeometry(0.2, 8, 6), bulbMat, { chunk: 400, maxDist: 800 });
  const parkPools = new ChunkedInstances(poolGeo, mkPool(0.42), { chunk: 400, maxDist: 450 });
  for (const l of parkLamps) {
    pLamps.add(tmpMatrix(l.x, GY, l.z, 0, 1));
    bulbs.add(tmpMatrix(l.x, GY + 3.72, l.z, 0, 1));
    parkPools.add(tmpMatrix(l.x, GY + 0.07, l.z, 0, 15, 1));
    addCircle(l.x, l.z, 0.15, 0, GY + 4, {});
  }

  // ---- traffic signals ------------------------------------------------------
  const gridNodes = nodes.filter((n) => n.grid);
  const sigGeo = signalGeo();
  const sigMesh = new THREE.InstancedMesh(sigGeo, metal, gridNodes.length * 4);
  const lampGeos = { r: signalLampGeo(0.38), a: signalLampGeo(0), g: signalLampGeo(-0.38) };
  const ON = { r: new THREE.Color(3.2, 0.2, 0.2), a: new THREE.Color(3.0, 1.9, 0.2), g: new THREE.Color(0.2, 3.0, 1.2) };
  const OFF = { r: new THREE.Color(0.12, 0.02, 0.02), a: new THREE.Color(0.12, 0.08, 0.02), g: new THREE.Color(0.02, 0.1, 0.05) };
  const sigLamps = {};
  for (const k of ['r', 'a', 'g']) {
    sigLamps[k] = new THREE.InstancedMesh(lampGeos[k], new THREE.MeshBasicMaterial({ toneMapped: false }), gridNodes.length * 4);
    sigLamps[k].frustumCulled = false;
  }
  sigMesh.frustumCulled = false;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const approaches = []; // {node, axis, index}
  gridNodes.forEach((n, ni) => {
    for (let k = 0; k < 4; k++) {
      const idx = ni * 4 + k;
      const [dx, dz] = [[1, 0], [-1, 0], [0, 1], [0, -1]][k];   // side of the junction the traffic arrives from
      const e = n.edges.find((x) => { const o = x.a === n ? x.b : x.a; return x.grid && Math.sign(o.x - n.x) === dx && Math.sign(o.z - n.z) === dz; });
      let m = zero;
      if (e) {
        const reach = dx ? n.hx : n.hz;
        const vx = -dx, vz = -dz;                                // travel direction of arriving traffic
        const rx = -vz, rz = vx;                                 // its right-hand side
        const px = n.x + dx * (reach + 1.3) + rx * (e.spec.hw + 1.1), pz = n.z + dz * (reach + 1.3) + rz * (e.spec.hw + 1.1);
        m = tmpMatrix(px, GY, pz, Math.atan2(dx, dz), 1);       // faces the oncoming driver
        const c = addCircle(px, pz, 0.2, 0, GY + 6, {});
        const refs = ['r', 'a', 'g'].map((q) => ({ bucket: { mesh: sigLamps[q] }, index: idx }));
        registerBreakable({ collider: c, fall: [{ bucket: { mesh: sigMesh }, index: idx }], hide: refs, x: px, z: pz, y: GY, kind: 'signal', minSpeed: 8 });
        approaches.push({ node: n, axis: e.axis, index: idx, state: '' });
      }
      sigMesh.setMatrixAt(idx, m);
      for (const q of ['r', 'a', 'g']) { sigLamps[q].setMatrixAt(idx, m); sigLamps[q].setColorAt(idx, OFF[q]); }
    }
  });
  group.add(sigMesh);
  for (const q of ['r', 'a', 'g']) group.add(sigLamps[q]);

  // ---- sidewalk clutter ------------------------------------------------------
  const benches = new ChunkedInstances(benchGeo(), matte, { chunk: 200, maxDist: 190 });
  const bins = new ChunkedInstances(binGeo(), matte, { chunk: 200, maxDist: 190 });
  const hydrants = new ChunkedInstances(hydrantGeo(), matte, { chunk: 200, maxDist: 190 });
  const vending = new ChunkedInstances(vendingGeo(), matte, { chunk: 200, maxDist: 260 });
  const vendGlow = new ChunkedInstances(new THREE.PlaneGeometry(0.62, 1.5), new THREE.MeshBasicMaterial({ toneMapped: false }), { chunk: 200, colors: true, maxDist: 420 });
  const shelters = new ChunkedInstances(shelterGeo(), metal, { chunk: 200, maxDist: 320 });
  const shelterAds = new ChunkedInstances(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide }), { chunk: 200, colors: true, maxDist: 420 });
  const neonCols = Object.values(NEON).map((h) => new THREE.Color(h).multiplyScalar(1.7));

  const place = (ci, x, z, heading, r, kind, minSpeed, extra = [], y = GY) => {
    const ref = ci.add(tmpMatrix(x, y, z, heading, 1));
    const c = addCircle(x, z, r, 0, y + 1.6, {});
    registerBreakable({ collider: c, fall: [ref, ...extra], hide: [], x, z, y, kind, minSpeed });
    return ref;
  };
  for (const b of benchSpots) place(benches, b.x, b.z, b.heading, 0.7, 'bench', 4);
  for (const e of edges) {
    if (!e.grid) continue;
    for (const side of [-1, 1]) {
      // which block is this kerb part of?
      edgePoint(e, 50, (e.spec.hw + 3) * side, P);
      const block = blockAt(P.x, P.z);
      if (!block || block.park) continue;
      const D = block.district;
      const inward = { x: -(-P.dz) * side, z: -(P.dx) * side };      // towards the road
      const face = Math.atan2(inward.x, inward.z);
      const at = (s, off) => edgePoint(e, s, (e.spec.hw + off) * side, P);
      if (rng.chance(0.3)) { at(26, 0.9); place(hydrants, P.x, P.z, rng.float(0, 6), 0.2, 'hydrant', 3); }
      if (rng.chance(D === 'docks' ? 0.25 : 0.6)) { at(42, 1.2); place(bins, P.x, P.z, 0, 0.34, 'bin', 3); }
      if (D !== 'docks' && D !== 'uptown' && rng.chance(D === 'strip' ? 0.8 : 0.28)) {
        at(60, 3.9);
        const g = vendGlow.add(tmpMatrix(P.x + inward.x * 0.42, GY + 1.08, P.z + inward.z * 0.42, face, 1), rng.pick(neonCols));
        place(vending, P.x, P.z, face, 0.6, 'vending', 6, [g]);
      }
      if (D !== 'docks' && rng.chance(0.3)) { at(70, 4.0); place(benches, P.x, P.z, face, 0.6, 'bench', 4); }
      if (e.type === 'blvd' && rng.chance(0.55)) {
        at(74, 2.7);
        shelters.add(tmpMatrix(P.x, GY, P.z, face, 1));
        // glowing ad panel closing one end of the shelter
        shelterAds.add(tmpMatrix(P.x + P.dx * 2.3, GY + 1.3, P.z + P.dz * 2.3, Math.atan2(P.dx, P.dz), 1), rng.pick(neonCols));
        // back wall only: people can walk through the open front
        const bx = P.x - inward.x * 0.72, bz = P.z - inward.z * 0.72;
        const hx = Math.abs(inward.z) * 2.3 + 0.1, hz = Math.abs(inward.x) * 2.3 + 0.1;
        addBox(bx - hx, bz - hz, bx + hx, bz + hz, 0, GY + 2.6, {});
      }
    }
  }

  for (const ci of [poles, lamps, roadPools, gridPools, pLamps, bulbs, parkPools, benches, bins, hydrants, vending, vendGlow, shelters, shelterAds]) ci.build(group);
  for (const ci of [roadPools, gridPools, parkPools]) for (const m of ci.meshes) m.renderOrder = 2;
  scene.add(group);

  let lastTick = -1;
  return {
    group, gridPoolMat,
    // The low preset has no analytic lamp lighting, so it gets the painted pools instead.
    setQuality(q) {
      env.nightMaterials.filter((n) => n.mat === gridPoolMat).forEach((n) => { n.night = q === 'low' ? 0.5 : 0; });
      gridPools.forceHidden = q !== 'low';
    },
    update(dt, t) {
      const tick = Math.floor(t * 2);
      if (tick === lastTick) return;
      lastTick = tick;
      let dirty = false;
      for (const a of approaches) {
        const s = signalState(a.node, a.axis, t);
        if (s === a.state) continue;
        a.state = s; dirty = true;
        for (const q of ['r', 'a', 'g']) sigLamps[q].setColorAt(a.index, s === q ? ON[q] : OFF[q]);
      }
      if (dirty) for (const q of ['r', 'a', 'g']) sigLamps[q].instanceColor.needsUpdate = true;
    },
  };
}
