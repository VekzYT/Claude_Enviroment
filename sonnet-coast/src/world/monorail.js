// Elevated monorail: two lines on ring-headed pylons down the boulevard medians, with trains
// that shuttle between arched glass stations.
import * as THREE from 'three';
import { grain } from './citylight.js';
import { CITY } from './layout.js';
import { Batch } from './geom.js';
import { addCircle } from './colliders.js';
import { PIER } from './landmarks.js';
import { PAL } from './palette.js';

const GY = CITY.y;
const LANE = 1.7;      // each beam sits this far either side of the centreline
const RING_R = 4.1;

// name, start, direction, length (filled in at build time for the pier line), deck height, station distances
export const MONORAIL_LINES = [
  { name: 'Boulevard Line', ax: -470, az: 0, ux: 1, uz: 0, len: 0, y: 13, stations: [] },
  { name: 'Constitution Line', ax: 100, az: -470, ux: 0, uz: 1, len: 1040, y: 19.5, stations: [40, 425, 850, 1010] },
];

function trainMeshes(mats) {
  const body = new Batch(), glass = new Batch(), lamp = new Batch();
  const CAR = 9.2;
  for (let c = -1; c <= 1; c++) {
    const z = c * CAR;
    const cap = new THREE.CapsuleGeometry(1.28, 5.9, 6, 14);
    cap.rotateX(Math.PI / 2);
    body.add(cap, 0xf4f5f6, 0, 0, z, 0, 0, 0, 1, 0.94, 1);
    glass.cbox(2.62, 0.72, 5.6, 0, 0.32, z, 0xffffff);
    body.cbox(2.6, 0.12, 6.4, 0, -0.42, z, PAL.terracotta);
    body.cbox(1.5, 0.5, 6.8, 0, -1.25, z, 0xc9ccd0);            // bogie skirt hugging the beam
    if (c !== 1) body.cbox(1.6, 1.5, 0.9, 0, 0, z + CAR / 2, 0xdcdee1); // gangway
  }
  for (const e of [-1, 1]) lamp.cbox(1.1, 0.16, 0.2, 0, -0.1, e * (CAR + 4.05), 0xffffff);
  const g = new THREE.Group();
  g.add(body.mesh(mats.body), glass.mesh(mats.glass, { shadow: false }), lamp.mesh(mats.lamp, { shadow: false, receive: false }));
  return g;
}

export function buildMonorail(scene, env) {
  const group = new THREE.Group();
  group.name = 'monorail';
  const A = MONORAIL_LINES[0];
  A.len = PIER.x1 - 62 - A.ax;
  A.stations = [40, 520, 1040, A.len - 14];

  const white = new Batch(), glass = new Batch(), light = new Batch();
  for (const L of MONORAIL_LINES) {
    const heading = Math.atan2(L.ux, L.uz);
    const px = -L.uz, pz = L.ux; // sideways
    const top = GY + L.y;
    const mx = L.ax + L.ux * L.len / 2, mz = L.az + L.uz * L.len / 2;
    // twin beams with a faint light line underneath
    for (const s of [-1, 1]) {
      white.cbox(0.95, 1.15, L.len + 4, mx + px * LANE * s, top - 0.6, mz + pz * LANE * s, 0xf0f1f2, heading);
      light.cbox(0.3, 0.08, L.len, mx + px * LANE * s, top - 1.22, mz + pz * LANE * s, 0xffffff, heading);
    }
    // pylons: a slim column carrying a ring the trains run through
    const at = (d) => ({ x: L.ax + L.ux * d, z: L.az + L.uz * d });
    const spots = [];
    for (let d = 4; d < L.len; d += 1) {
      const q = at(d);
      const along = L.ux ? q.x : q.z;
      const inGrid = L.ux ? q.x > CITY.x0 && q.x < CITY.x1 - 8 : q.z > CITY.z0 && q.z < CITY.z1;
      if (inGrid) {
        const f = ((along - (L.ux ? CITY.x0 : CITY.z0)) % 100 + 100) % 100;
        if (Math.abs(f - 14) < 0.5 || Math.abs(f - 50) < 0.5 || Math.abs(f - 86) < 0.5) spots.push(d);
      } else if (L.ux && q.x > CITY.promenade.x0 + 4 && Math.round(q.x - 818) % 34 === 0) spots.push(d);
    }
    for (const d of spots) {
      const q = at(d);
      const ringY = top + 1.0;
      white.cyl(0.42, 0.62, ringY - RING_R - GY, q.x, GY, q.z, 0xf0f1f2, 10);
      const ring = new THREE.TorusGeometry(RING_R, 0.3, 8, 36);
      white.add(ring, 0xf0f1f2, q.x, ringY, q.z, 0, heading, 0);
      white.cbox(LANE * 2 + 1.4, 0.5, 0.9, q.x, top - 1.35, q.z, 0xe4e6e8, heading);
      addCircle(q.x, q.z, 0.65, 0, ringY, {});
    }
    // stations: a platform between the beams under an arched glass canopy
    for (const d of L.stations) {
      const q = at(d);
      const LEN = 30;
      white.cbox(2.2, 0.35, LEN, q.x, top - 0.05, q.z, 0xe9eaec, heading);
      for (let k = -2; k <= 2; k++) {
        const c = at(d + k * (LEN / 4));
        const arch = new THREE.TorusGeometry(6.4, 0.32, 6, 22, Math.PI);
        white.add(arch, 0xf4f5f6, c.x, top - 0.6, c.z, 0, heading, 0);
      }
      const shell = new THREE.CylinderGeometry(6.2, 6.2, LEN, 22, 1, true, 0, Math.PI);
      shell.rotateX(Math.PI / 2);   // axis along z
      shell.rotateZ(Math.PI / 2);   // open side down
      glass.add(shell, 0xffffff, q.x, top - 0.6, q.z, 0, heading, 0);
      // lift shaft down to the street
      glass.cyl(1.5, 1.5, L.y - 0.4, q.x, GY, q.z, 0xffffff, 14);
      white.cyl(1.7, 1.9, 0.5, q.x, GY, q.z, 0xf0f1f2, 14);
      addCircle(q.x, q.z, 1.8, 0, top, {});
      light.cbox(0.25, 0.1, LEN - 2, q.x, top + 0.2, q.z, 0xffffff, heading);
    }
  }
  const whiteMat = grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.15, envMapIntensity: 1.1 }), 0.8, 0.2, 0.08);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xcfe9f4, transparent: true, opacity: 0.32, roughness: 0.06, metalness: 0.9, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xf2f7ff, toneMapped: false });
  for (const ch of ['r', 'g', 'b']) env.nightLerp(lightMat.color, ch, 0.9, 1.5);
  group.add(white.mesh(whiteMat));
  const gm = glass.mesh(glassMat, { shadow: false });
  gm.renderOrder = 4;
  group.add(gm);
  group.add(light.mesh(lightMat, { shadow: false, receive: false }));

  // trains
  const trainMats = {
    body: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.35, envMapIntensity: 1.3 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1b2730, roughness: 0.08, metalness: 0.9, emissive: 0xfff1d8, emissiveIntensity: 0 }),
    lamp: new THREE.MeshBasicMaterial({ color: 0xfff6e6, toneMapped: false }),
  };
  env.nightLerp(trainMats.glass, 'emissiveIntensity', 0.0, 0.55);
  const trains = [];
  MONORAIL_LINES.forEach((L, li) => {
    for (const side of [-1, 1]) {
      const mesh = trainMeshes(trainMats);
      mesh.rotation.y = Math.atan2(L.ux, L.uz);
      group.add(mesh);
      const n = L.stations.length;
      trains.push({ L, side, mesh, i: side > 0 ? 0 : n - 1, dir: side > 0 ? 1 : -1, t: li * 3 + (side > 0 ? 0 : 6), state: 'dwell', d: L.stations[side > 0 ? 0 : n - 1] });
    }
  });
  scene.add(group);

  return {
    group, trains,
    update(dt) {
      for (const tr of trains) {
        const st = tr.L.stations;
        if (tr.state === 'dwell') {
          tr.t -= dt;
          if (tr.t <= 0) {
            if (tr.i + tr.dir < 0 || tr.i + tr.dir >= st.length) tr.dir = -tr.dir;
            tr.from = st[tr.i]; tr.i += tr.dir; tr.to = st[tr.i];
            tr.dur = Math.max(7, Math.abs(tr.to - tr.from) / 19);
            tr.t = 0; tr.state = 'move';
          }
        } else {
          tr.t += dt;
          const u = Math.min(1, tr.t / tr.dur);
          const e = u * u * u * (u * (u * 6 - 15) + 10);
          tr.d = tr.from + (tr.to - tr.from) * e;
          if (u >= 1) { tr.state = 'dwell'; tr.t = 6; }
        }
        const L = tr.L;
        tr.mesh.position.set(L.ax + L.ux * tr.d + -L.uz * LANE * tr.side, GY + L.y + 1.75, L.az + L.uz * tr.d + L.ux * LANE * tr.side);
      }
    },
  };
}
