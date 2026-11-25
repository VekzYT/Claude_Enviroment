// Places outside the city grid: the port, Compute Ridge, bayou hideouts, Sonnet Pier with its
// big wheel, the lighthouse, the radio mast and the stunt ramps.
import * as THREE from 'three';
import { grain } from './citylight.js';
import { POI, CITY } from './layout.js';
import { Batch, ChunkedInstances, tmpMatrix } from './geom.js';
import { addBox, addCircle } from './colliders.js';
import { addPlatform, addRamp, groundHeight, terrainHeight } from './roads.js';
import { addSign } from './city.js';
import { RNG } from '../util/rng.js';
import { PAL } from './palette.js';
import { coastSouthZ, coastEastX } from './terrain.js';

export const boatSpawns = [];   // {x, z, heading}
export const PIER = { x0: CITY.promenade.x1, x1: 0, z0: -8, z1: 8, y: 2.2 };

function pier(b, x0, z0, x1, z1, y, wood = true) {
  const col = wood ? 0x7a5636 : 0x9a968c;
  b.box(x1 - x0, 0.35, z1 - z0, (x0 + x1) / 2, y - 0.35, (z0 + z1) / 2, col);
  const nx = Math.max(1, Math.round((x1 - x0) / 7)), nz = Math.max(1, Math.round((z1 - z0) / 7));
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
    if (i > 0 && i < nx && j > 0 && j < nz) continue;
    const px = x0 + ((x1 - x0) * i) / nx, pz = z0 + ((z1 - z0) * j) / nz;
    b.cyl(0.22, 0.22, y + 4, px, -4, pz, 0x4a3524, 6);
  }
  addPlatform(x0, z0, x1, z1, y);
}

export function buildLandmarks(scene, env) {
  const group = new THREE.Group();
  group.name = 'landmarks';
  const rng = new RNG(5150);
  const solid = new Batch();
  const glow = { cyan: new Batch(), coral: new Batch(), amber: new Batch(), lime: new Batch(), magenta: new Batch() };
  // soft accents rather than neon: pale ice, warm white, a muted coral
  const glowCols = { cyan: 0xcfe9ff, coral: 0xff9a78, amber: 0xffe6c4, lime: 0xd9f2c4, magenta: 0xf2e2ee };
  const glowMats = {};
  for (const k of Object.keys(glow)) {
    const base = new THREE.Color(glowCols[k]);
    const mat = new THREE.MeshBasicMaterial({ color: base.clone(), toneMapped: false });
    for (const ch of ['r', 'g', 'b']) env.nightLerp(mat.color, ch, base[ch] * 0.92, base[ch] * 1.5);
    glowMats[k] = mat;
  }
  const updaters = [];

  // ---- Port of Sonnet -------------------------------------------------
  const PY = 2;
  const whCols = [PAL.terracotta, PAL.cream, PAL.slateLight, PAL.clay];
  [[470, 900, 560, 940], [470, 1010, 560, 1060], [600, 1040, 700, 1085], [780, 960, 850, 1040]].forEach(([x0, z0, x1, z1], i) => {
    const h = 13 + (i % 2) * 3;
    solid.box(x1 - x0, h, z1 - z0, (x0 + x1) / 2, PY, (z0 + z1) / 2, whCols[i]);
    solid.box(x1 - x0 + 1.5, 0.8, z1 - z0 + 1.5, (x0 + x1) / 2, PY + h, (z0 + z1) / 2, PAL.slate);
    for (let x = x0 + 10; x < x1 - 6; x += 16) solid.box(8, 7, 0.3, x, PY, z0 - 0.1, 0x55575c);
    glow.amber.box(x1 - x0, 0.3, 0.3, (x0 + x1) / 2, PY + h - 1.2, z0 - 0.2, 0xffffff);
    addBox(x0, z0, x1, z1, 0, PY + h, {});
  });
  addSign(group, 'PORT OF SONNET', 650, PY + 11, 1039.5, Math.PI, 30, '#2f7d8f', 'restricted hardware terminal');

  const contGeo = new THREE.BoxGeometry(12, 2.8, 2.6);
  const contMat = grain(new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.35 }), 0.9, 0.3, 0.2);
  const containers = new ChunkedInstances(contGeo, contMat, { chunk: 600, shadow: true, colors: true, maxDist: 1000 });
  const contCols = [PAL.terracotta, PAL.cream, PAL.slateLight, PAL.teal, PAL.clay, 0x2a4a5a, PAL.neonAmber].map((c) => new THREE.Color(c));
  for (let row = 0; row < 5; row++) for (let colm = 0; colm < 6; colm++) {
    if (rng.chance(0.2)) continue;
    const x = 600 + colm * 14.5, z = 905 + row * 9.5;
    if (z > 925 && z < 975 && x > 610 && x < 670) continue; // keep the pickup yard clear
    const stack = rng.int(1, 3);
    for (let s = 0; s < stack; s++) containers.add(tmpMatrix(x, PY + 1.4 + s * 2.8, z, 0, 1), rng.pick(contCols));
    addBox(x - 6, z - 1.3, x + 6, z + 1.3, 0, PY + stack * 2.8, {});
  }
  containers.build(group);

  for (const cx of [520, 720]) {
    const cz = 1118;
    for (const [dx, dz] of [[-9, -7], [9, -7], [-9, 7], [9, 7]]) {
      solid.box(1.4, 34, 1.4, cx + dx, PY, cz + dz, PAL.terracotta);
      addCircle(cx + dx, cz + dz, 1.1, 0, 40, {});
    }
    solid.box(22, 2, 2, cx, PY + 34, cz - 7, PAL.terracotta);
    solid.box(22, 2, 2, cx, PY + 34, cz + 7, PAL.terracotta);
    solid.box(3, 2.5, 60, cx, PY + 36, cz + 16, PAL.terracottaLight);
    solid.box(5, 4, 6, cx, PY + 31.5, cz + 2, PAL.cream);
    glow.coral.box(0.5, 0.5, 60, cx, PY + 38.5, cz + 16, 0xffffff);
  }
  pier(solid, 440, 1100, 870, 1136, PY, false);
  for (const px of [600, 660, 760]) {
    const cz = coastSouthZ(px);
    pier(solid, px - 2.5, 1136, px + 2.5, cz + 46, 1.6);
    boatSpawns.push({ x: px + 8, z: cz + 34, heading: 0 });
  }
  for (let i = 0; i < 3; i++) {
    solid.cyl(8, 8, 12, 820 - i * 20, PY, 905, PAL.cream, 14);
    glow.cyan.cyl(8.1, 8.1, 0.4, 820 - i * 20, PY + 9, 905, 0xffffff, 14);
    addCircle(820 - i * 20, 905, 8, 0, 14, {});
  }

  // ---- Compute Ridge data centres -------------------------------------
  const RY = 6;
  const halls = [[330, -880, 440, -840], [470, -880, 580, -840], [610, -880, 720, -840],
    [330, -790, 440, -750], [470, -790, 580, -750], [610, -790, 720, -750]];
  halls.forEach(([x0, z0, x1, z1], i) => {
    const h = 14;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    solid.box(x1 - x0, h, z1 - z0, cx, RY, cz, i % 2 ? PAL.cream : PAL.terracotta);
    solid.box(x1 - x0 + 1, 0.7, z1 - z0 + 1, cx, RY + h, cz, PAL.slate);
    solid.box(x1 - x0 + 0.3, 3, z1 - z0 + 0.3, cx, RY + 2, cz, PAL.slateLight);
    glow.cyan.box(x1 - x0 + 0.5, 0.35, z1 - z0 + 0.5, cx, RY + 6.5, cz, 0xffffff);
    glow.cyan.box(x1 - x0 + 0.5, 0.2, z1 - z0 + 0.5, cx, RY + 11, cz, 0xffffff);
    for (let x = x0 + 8; x < x1 - 4; x += 13) {
      solid.box(7, 2.6, 7, x, RY + h + 0.7, cz, 0x6c6d72);
      solid.cyl(2.4, 2.4, 0.5, x, RY + h + 3.3, cz, 0x2c2c30, 10);
    }
    addBox(x0, z0, x1, z1, 0, RY + h, {});
  });
  for (let i = 0; i < 4; i++) {
    const x = 470 + i * 34, z = -705;
    solid.cyl(8, 11, 20, x, RY, z, PAL.cream, 14);
    glow.coral.cyl(8.2, 8.2, 0.5, x, RY + 19, z, 0xffffff, 14);
    addCircle(x, z, 11, 0, 28, {});
  }
  solid.cyl(0.3, 1.0, 60, 730, RY, -700, PAL.slateLight, 6);
  glow.coral.sphere(1.4, 730, RY + 61, -700, 0xffffff);
  addCircle(730, -700, 1, 0, 60, {});
  addSign(group, 'COMPUTE RIDGE', 380, RY + 9, -672, 0, 40, '#c8643b', 'anthropic inference campus');
  solid.box(1, 7, 1, 362, RY, -672, PAL.slate); solid.box(1, 7, 1, 398, RY, -672, PAL.slate);

  // ---- Gator Garage (chop shop) -------------------------------------------
  {
    const g = POI.gator, y = 1.3;
    const wood = 0x5d4630, tin = 0x7d8a86;
    solid.box(18, 6.5, 12, g.x + 2, y, g.z - 20, wood);
    solid.cbox(19.5, 0.4, 7.2, g.x + 2, y + 7.6, g.z - 23.2, tin, 0, 0.32);
    solid.cbox(19.5, 0.4, 7.2, g.x + 2, y + 7.6, g.z - 16.8, tin, 0, -0.32);
    solid.box(9, 5, 0.3, g.x + 2, y, g.z - 13.9, 0x33373a);
    addBox(g.x - 7, g.z - 26, g.x + 11, g.z - 14, 0, y + 9, {});
    addSign(group, 'GATOR GARAGE', g.x + 2, y + 8.6, g.z - 13.6, 0, 12, '#4f8f3f', 'no questions · no receipts');
    for (let i = 0; i < 6; i++) {
      const a = rng.float(0, 6.28), d = rng.float(16, 30);
      const x = g.x + Math.cos(a) * d, z = g.z + Math.sin(a) * d;
      if (z < g.z - 10) continue;
      solid.cyl(0.9, 0.9, 0.6 * rng.int(1, 4), x, y, z, 0x1c1c1e, 10);
      addCircle(x, z, 0.9, 0, y + 2, {});
    }
    for (let i = 0; i < 10; i++) glow.amber.sphere(0.22, g.x - 6 + i * 1.8, y + 6.2 - Math.sin((i / 9) * Math.PI) * 0.8, g.z - 13.5, 0xffffff);
    glow.lime.box(12.4, 0.12, 0.12, g.x + 2, y + 6.9, g.z - 13.6, 0xffffff);
  }

  // ---- Moonshine Hollow (smuggler camp) -----------------------------------
  {
    const c = POI.camp, y = 1.3;
    for (const [dx, dz, w, d] of [[-14, -10, 8, 6], [-16, 6, 7, 7], [-2, -16, 6, 5]]) {
      solid.box(w, 3.6, d, c.x + dx, y + 1, c.z + dz, 0x5b4630);
      solid.cbox(w + 1.2, 0.3, d + 1.2, c.x + dx, y + 5.0, c.z + dz, 0x6f7a72, 0, 0.12);
      for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) solid.cyl(0.2, 0.2, 1.2, c.x + dx + px * (w / 2 - 0.4), y - 0.1, c.z + dz + pz * (d / 2 - 0.4), 0x3d2e20, 6);
      addBox(c.x + dx - w / 2, c.z + dz - d / 2, c.x + dx + w / 2, c.z + dz + d / 2, 0, y + 5, {});
      glow.amber.sphere(0.3, c.x + dx + w / 2 + 0.3, y + 3.6, c.z + dz, 0xffffff);
    }
    for (let i = 0; i < 7; i++) {
      const x = c.x - 6 + rng.float(-5, 5), z = c.z + rng.float(-6, 8);
      solid.box(1.2, 1.2, 1.2, x, y, z, i % 2 ? 0x8a6a42 : PAL.terracotta, rng.float(0, 1.5));
    }
    pier(solid, c.x + 6, c.z - 2.2, c.x + 40, c.z + 2.2, 1.2);
    boatSpawns.push({ x: c.x + 44, z: c.z + 8, heading: Math.PI });
    addSign(group, 'MOONSHINE HOLLOW', c.x - 6, y + 4.5, c.z + 12, 0, 9, '#b07a2a');
  }

  // ---- Heron Jetty ----------------------------------------------------
  {
    const j = POI.jetty, y = 1.6;
    pier(solid, j.x - 2.5, j.z + 4, j.x + 2.5, j.z + 44, 1.2);
    pier(solid, j.x - 9, j.z + 38, j.x + 9, j.z + 44, 1.2);
    boatSpawns.push({ x: j.x - 7, z: j.z + 51, heading: -Math.PI / 2 });
    boatSpawns.push({ x: j.x + 9, z: j.z + 51, heading: -Math.PI / 2 });
    solid.box(5, 3.4, 4, j.x - 10, y, j.z - 6, 0x5b4630);
    solid.cbox(6.4, 0.3, 5.2, j.x - 10, y + 3.8, j.z - 6, 0x6f7a72, 0, 0.1);
    addBox(j.x - 12.5, j.z - 8, j.x - 7.5, j.z - 4, 0, y + 4, {});
    addSign(group, 'HERON JETTY', j.x - 10, y + 4.8, j.z - 3.8, 0, 6, '#2f7d8f');
    glow.cyan.sphere(0.3, j.x + 2.6, y + 2.4, j.z + 4, 0xffffff);
    solid.cyl(0.1, 0.1, 2.6, j.x + 2.6, y - 0.2, j.z + 4, 0x3d2e20, 5);
  }

  // ---- Sonnet Pier and the Attention Wheel ----------------------------------------
  {
    const endX = coastEastX(0) + 78;
    PIER.x1 = endX;
    pier(solid, PIER.x0, PIER.z0, endX, PIER.z1, PIER.y, true);
    pier(solid, endX - 44, -24, endX, 24, PIER.y, true);
    boatSpawns.push({ x: endX - 60, z: 16, heading: Math.PI / 2 });
    boatSpawns.push({ x: endX - 80, z: -16, heading: Math.PI / 2 });
    // arcade hall
    solid.box(16, 6, 12, endX - 30, PIER.y, -15, PAL.cream);
    solid.cbox(17, 0.4, 13, endX - 30, PIER.y + 6.3, -15, PAL.terracotta);
    addBox(endX - 38, -21, endX - 22, -9, 0, PIER.y + 7, {});
    addSign(group, 'ATTENTION SPAN ARCADE', endX - 30, PIER.y + 4.6, -8.8, 0, 13, '#7a5a9a');
    for (let x = PIER.x0 + 8; x < endX - 46; x += 14) {
      for (const z of [-7.6, 7.6]) { solid.cyl(0.07, 0.07, 3.2, x, PIER.y, z, 0x2c2d32, 5); glow.amber.sphere(0.24, x, PIER.y + 3.3, z, 0xffffff); }
    }
    // the wheel: axle along x so it faces the boulevard
    const R = 24, cx = endX - 16, cy = PIER.y + R + 5, cz = 6;
    const wheel = new THREE.Group();
    wheel.position.set(cx, cy, cz);
    const rimA = new THREE.Mesh(new THREE.TorusGeometry(R, 0.28, 6, 72), glowMats.coral);
    const rimB = new THREE.Mesh(new THREE.TorusGeometry(R * 0.72, 0.18, 6, 60), glowMats.cyan);
    for (const [rim, dx] of [[rimA, 1.3], [rimA.clone(), -1.3], [rimB, 0]]) { rim.rotation.y = Math.PI / 2; rim.position.x = dx; wheel.add(rim); }
    const spokeMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.5, metalness: 0.6 });
    const cabins = [];
    const cabinGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
    const cabCols = [PAL.terracottaLight, PAL.cream, PAL.teal, PAL.neonAmber];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.22, R, 0.22), spokeMat);
      spoke.position.set(0, Math.cos(a) * R / 2, Math.sin(a) * R / 2);
      spoke.rotation.x = a;
      wheel.add(spoke);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, R * 0.9, 0.1), k % 2 ? glowMats.amber : glowMats.magenta);
      strip.position.set(0.25, Math.cos(a) * R * 0.52, Math.sin(a) * R * 0.52);
      strip.rotation.x = a;
      wheel.add(strip);
      const cab = new THREE.Mesh(cabinGeo, new THREE.MeshStandardMaterial({ color: cabCols[k % 4], roughness: 0.5 }));
      cab.position.set(0, Math.cos(a) * R, Math.sin(a) * R);
      wheel.add(cab);
      cabins.push(cab);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4, 12), spokeMat);
    hub.rotation.z = Math.PI / 2;
    wheel.add(hub);
    group.add(wheel);
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
      // A-frame legs
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, R + 7.5, 0.7), spokeMat);
      leg.position.set(cx + sx * 2.6, PIER.y + (R + 5) / 2, cz + sz * 5.5);
      leg.rotation.x = -sz * 0.36;
      group.add(leg);
      addCircle(cx + sx * 2.6, cz + sz * 10.5, 0.6, 0, PIER.y + 6, {});
    }
    updaters.push((dt) => { wheel.rotation.x += dt * 0.12; for (const c of cabins) c.rotation.x = -wheel.rotation.x; });
  }
  // a second, plain pier further south
  {
    const z = 380, cx = coastEastX(z);
    pier(solid, CITY.promenade.x1, z - 3, cx + 55, z + 3, 2.2);
    boatSpawns.push({ x: cx + 34, z: z + 12, heading: Math.PI / 2 });
  }
  for (const z of [-430, -260, -120, 140, 250, 520]) {
    const x = coastEastX(z) - 40;
    const y = terrainHeight(x, z);
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) solid.cyl(0.14, 0.14, 3, x + dx, y, z + dz, 0xd8d0c0, 5);
    solid.box(3.4, 2.4, 3.4, x, y + 3, z, PAL.terracotta);
    solid.cbox(4.4, 0.25, 4.4, x, y + 5.7, z, PAL.cream, 0, 0, 0.12);
    addCircle(x, z, 2, 0, y + 6, {});
  }

  // ---- Lighthouse on the south-east point ------------------------------------------
  {
    const x = 905, z = 1128, y = Math.max(terrainHeight(x, z), 1);
    solid.cyl(2.2, 3.6, 26, x, y, z, PAL.cream, 14);
    solid.cyl(2.8, 3.0, 2.5, x, y + 8, z, PAL.terracotta, 14);
    solid.cyl(2.5, 2.7, 2.5, x, y + 17, z, PAL.terracotta, 14);
    solid.cyl(3.2, 3.2, 0.4, x, y + 26, z, PAL.slate, 14);
    glow.amber.cyl(1.6, 1.6, 2.2, x, y + 26.4, z, 0xffffff, 10);
    solid.cone(2.6, 2.4, x, y + 28.6, z, PAL.terracotta, 10);
    addCircle(x, z, 3.6, 0, y + 30, {});
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    env.nightLerp(beamMat, 'opacity', 0, 0.16);
    const geo = new THREE.CylinderGeometry(9, 0.8, 150, 12, 1, true);
    geo.rotateZ(Math.PI / 2);
    geo.translate(75, 0, 0);
    const beam = new THREE.Group();
    beam.add(new THREE.Mesh(geo, beamMat));
    const b2 = new THREE.Mesh(geo, beamMat); b2.rotation.y = Math.PI; beam.add(b2);
    beam.position.set(x, y + 27.5, z);
    group.add(beam);
    updaters.push((dt) => { beam.rotation.y += dt * 0.5; });
  }

  // ---- CLAUDE FM radio mast in the hills ----------------------------------------
  {
    const x = 120, z = -1270, y = terrainHeight(x, z);
    const H = 78;
    for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) solid.cbox(0.35, H, 0.35, x + dx * 0.55, y + H / 2, z + dz * 0.55, 0xc9c2b4, 0, dz * 0.012, -dx * 0.012);
    for (let k = 1; k < 9; k++) solid.box(2.6 - k * 0.14, 0.25, 2.6 - k * 0.14, x, y + k * 8.5, z, PAL.terracotta);
    for (let k = 1; k <= 4; k++) glow.coral.sphere(0.6, x, y + k * (H / 4), z, 0xffffff, 1, 1, 1, 0);
    solid.box(7, 3.4, 5, x + 9, y, z, PAL.cream);
    solid.cbox(7.8, 0.3, 5.8, x + 9, y + 3.6, z, PAL.slate);
    addBox(x + 5.5, z - 2.5, x + 12.5, z + 2.5, 0, y + 4, {});
    addCircle(x, z, 2.2, 0, y + H, {});
    addSign(group, 'CLAUDE FM 88.2', x + 9, y + 5, z + 2.7, 0, 7, '#7a5a9a', 'the long context');
  }

  // ---- Stunt ramps -------------------------------------------------------
  const rampMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true, side: THREE.DoubleSide });
  const rampB = new Batch();
  const ramp = (x, z, heading, len = 12, wid = 7, height = 3.2) => {
    const y = groundHeight(x - Math.sin(heading) * (len / 2 + 0.5), z - Math.cos(heading) * (len / 2 + 0.5));
    addRamp(x, z, heading, len, wid, height);
    const g = new THREE.BufferGeometry();
    const hw = wid / 2, hl = len / 2;
    const v = [-hw, 0, -hl, hw, 0, -hl, hw, 0, hl, -hw, 0, hl, -hw, height, hl, hw, height, hl];
    const idx = [0, 1, 5, 0, 5, 4, 3, 4, 5, 3, 5, 2, 0, 4, 3, 1, 2, 5];
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    rampB.add(g, PAL.terracottaLight, x, y, z, 0, heading, 0);
    glow.amber.cbox(wid, 0.12, 0.5, x + Math.sin(heading) * hl * 0.2, y + height * 0.62, z + Math.cos(heading) * hl * 0.2, 0xffffff, heading, -Math.atan2(height, len));
  };
  ramp(905, 130, 0, 13, 8, 3.4);            // beach, launching south along the sand
  ramp(650, 990, -Math.PI / 2, 12, 7, 3);   // port yard
  ramp(-1000, 566, 0, 12, 6, 3.2);          // behind Gator Garage, over the channel
  ramp(64, 34, Math.PI / 2, 10, 6, 2.6);    // Alignment Park
  ramp(-262, -752, Math.PI, 12, 6, 3.4);    // Glowwood lookout
  ramp(848, -210, Math.PI / 2, 12, 7, 3);   // off the boardwalk onto the sand
  ramp(PIER.x1 - 8, -16, Math.PI / 2, 10, 6, 2.8); // end of the pier, into the sea
  group.add(rampB.mesh(rampMat));

  group.add(solid.mesh(grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }), 0.55, 0.6, 0.22)));
  for (const k of Object.keys(glow)) if (!glow[k].empty) group.add(glow[k].mesh(glowMats[k], { shadow: false, receive: false }));
  scene.add(group);
  return { group, update(dt) { for (const u of updaters) u(dt); } };
}
