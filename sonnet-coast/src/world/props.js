// Street furniture: street lights with pools of light, placed along the road graph.
import * as THREE from 'three';
import { edges, edgePoint } from './roads.js';
import { Batch, ChunkedInstances, tmpMatrix } from './geom.js';
import { addCircle } from './colliders.js';
import { registerBreakable } from './breakables.js';
import { makeGlowTexture } from './textures.js';
import { PAL } from './palette.js';
import { parkingSlots } from './city.js';

function poleGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.09, 0.14, 7.2, 6), 0x3a3a3e, 0, 3.6, 0);
  b.cbox(0.14, 0.14, 2.2, 0, 7.1, 1.0, 0x3a3a3e);
  b.cbox(0.5, 0.16, 1.0, 0, 7.05, 2.0, 0x2a2a2e);
  return b.merged();
}

export function buildProps(scene, env) {
  const group = new THREE.Group();
  group.name = 'props';
  const poleMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.4 });
  const poles = new ChunkedInstances(poleGeo(), poleMat, { chunk: 400 });
  const lampBase = new THREE.Color(1.0, 0.82, 0.55);
  const lampMat = new THREE.MeshBasicMaterial({ color: lampBase.clone(), toneMapped: false });
  for (const ch of ['r', 'g', 'b']) env.nightLerp(lampMat.color, ch, lampBase[ch] * 0.5, lampBase[ch] * 3);
  const lamps = new ChunkedInstances(new THREE.BoxGeometry(0.42, 0.08, 0.9), lampMat, { chunk: 400 });
  const poolGeo = new THREE.PlaneGeometry(1, 1);
  poolGeo.rotateX(-Math.PI / 2);
  const poolMat = new THREE.MeshBasicMaterial({
    map: makeGlowTexture(), color: 0xffc98a, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6,
  });
  env.nightLerp(poolMat, 'opacity', 0, 0.55);
  const pools = new ChunkedInstances(poolGeo, poolMat, { chunk: 400 });

  const P = {};
  let alt = 0;
  for (const e of edges) {
    if (e.type === 'dirt') continue;
    const city = e.type === 'city';
    const step = city ? 32 : 52;
    const start = city ? 18 : 30;
    for (let s = start; s < e.len - start + 1; s += step) {
      const sides = city ? [-1, 1] : [alt++ % 2 ? 1 : -1];
      for (const side of sides) {
        const off = (e.spec.hw + (city ? 1.5 : 1.2)) * side;
        edgePoint(e, s, off, P);
        if (P.bridge && !city) continue;
        const y = city ? P.y + 0.16 : P.y - 0.05;
        // arm points back towards the centreline: heading of (-right * side)
        const hx = -(-P.dz) * side, hz = -(P.dx) * side;
        const heading = Math.atan2(hx, hz);
        const pr = poles.add(tmpMatrix(P.x, y, P.z, heading, 1));
        const lx = P.x + hx * 2.0, lz = P.z + hz * 2.0;
        const lr = lamps.add(tmpMatrix(lx, y + 6.93, lz, heading, 1));
        const pl = pools.add(tmpMatrix(lx + hx * 1.5, P.y + 0.09, lz + hz * 1.5, 0, 19, 1));
        const c = addCircle(P.x, P.z, 0.22, 0, y + 7, {});
        registerBreakable({ collider: c, fall: [pr], hide: [lr, pl], x: P.x, z: P.z, y, kind: 'light', minSpeed: 7 });
      }
    }
  }
  poles.build(group); lamps.build(group); pools.build(group);
  for (const m of pools.meshes) m.renderOrder = 2;
  scene.add(group);
  return group;
}
