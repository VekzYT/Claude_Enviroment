// Places outside the city grid: the port, Compute Ridge, bayou hideouts, piers and stunt ramps.
import * as THREE from 'three';
import { POI, WATER_Y } from './layout.js';
import { Batch, ChunkedInstances, tmpMatrix } from './geom.js';
import { addBox, addCircle } from './colliders.js';
import { addPlatform, addRamp, groundHeight, terrainHeight } from './roads.js';
import { addSign } from './city.js';
import { RNG } from '../util/rng.js';
import { PAL } from './palette.js';
import { coastSouthZ, coastEastX, riverPts } from './terrain.js';

export const boatSpawns = [];   // {x, z, heading}
export const landSpawns = [];   // fixed special vehicle spawns {x,z,heading,type}

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
  const glow = { cyan: new Batch(), coral: new Batch(), amber: new Batch(), lime: new Batch() };

  // ---- Port of Sonnet -------------------------------------------------
  const PY = 2;
  const whCols = [PAL.terracotta, PAL.cream, PAL.slateLight, PAL.clay];
  [[470, 900, 560, 940], [470, 1010, 560, 1060], [600, 1040, 700, 1085], [780, 960, 850, 1040]].forEach(([x0, z0, x1, z1], i) => {
    const h = 13 + (i % 2) * 3;
    solid.box(x1 - x0, h, z1 - z0, (x0 + x1) / 2, PY, (z0 + z1) / 2, whCols[i]);
    solid.box(x1 - x0 + 1.5, 0.8, z1 - z0 + 1.5, (x0 + x1) / 2, PY + h, (z0 + z1) / 2, PAL.slate);
    // roller doors
    for (let x = x0 + 10; x < x1 - 6; x += 16) solid.box(8, 7, 0.3, x, PY, z0 - 0.1, 0x55575c);
    glow.amber.box(x1 - x0, 0.3, 0.3, (x0 + x1) / 2, PY + h - 1.2, z0 - 0.2, 0xffffff);
    addBox(x0, z0, x1, z1, 0, PY + h, {});
  });
  addSign(group, 'PORT OF SONNET', 600, PY + 11, 1039.5, Math.PI, 30, '#5ff3ff', 'restricted hardware terminal');

  // container stacks (instanced, coloured)
  const contGeo = new THREE.BoxGeometry(12, 2.8, 2.6);
  const contMat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.2 });
  const containers = new ChunkedInstances(contGeo, contMat, { chunk: 600, shadow: true, colors: true });
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

  // gantry cranes
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
  // quay + piers out to sea
  pier(solid, 440, 1100, 870, 1136, PY, false);
  for (const px of [600, 660, 760]) {
    const cz = coastSouthZ(px);
    pier(solid, px - 2.5, 1136, px + 2.5, cz + 46, 1.6);
    boatSpawns.push({ x: px + 8, z: cz + 34, heading: 0 });
  }
  // fuel tanks
  for (let i = 0; i < 3; i++) {
    solid.cyl(8, 8, 12, 820 - i * 20, PY, 905, PAL.cream, 14);
    glow.cyan.cyl(8.1, 8.1, 0.4, 820 - i * 20, PY + 9, 905, 0xffffff, 14);
    addCircle(820 - i * 20, 905, 8, 0, 14, {});
  }

  // ---- Compute Ridge data centres -------------------------------------
  const RY = 6;
  const halls = [[330, -690, 440, -650], [470, -690, 580, -650], [610, -690, 720, -650],
    [330, -540, 400, -480], [610, -540, 720, -500], [330, -630, 440, -600]];
  halls.forEach(([x0, z0, x1, z1], i) => {
    const h = 14;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    solid.box(x1 - x0, h, z1 - z0, cx, RY, cz, i % 2 ? PAL.cream : PAL.terracotta);
    solid.box(x1 - x0 + 1, 0.7, z1 - z0 + 1, cx, RY + h, cz, PAL.slate);
    // louvre band + LED stripes
    solid.box(x1 - x0 + 0.3, 3, z1 - z0 + 0.3, cx, RY + 2, cz, PAL.slateLight);
    for (const g of [glow.cyan]) {
      g.box(x1 - x0 + 0.5, 0.35, z1 - z0 + 0.5, cx, RY + 6.5, cz, 0xffffff);
      g.box(x1 - x0 + 0.5, 0.2, z1 - z0 + 0.5, cx, RY + 11, cz, 0xffffff);
    }
    // rooftop chillers
    for (let x = x0 + 8; x < x1 - 4; x += 13) {
      solid.box(7, 2.6, 7, x, RY + h + 0.7, cz, 0x6c6d72);
      solid.cyl(2.4, 2.4, 0.5, x, RY + h + 3.3, cz, 0x2c2c30, 10);
    }
    addBox(x0, z0, x1, z1, 0, RY + h, {});
  });
  // cooling towers
  for (let i = 0; i < 4; i++) {
    const x = 470 + i * 32, z = -515;
    solid.cyl(8, 11, 20, x, RY, z, PAL.cream, 14);
    glow.coral.cyl(8.2, 8.2, 0.5, x, RY + 19, z, 0xffffff, 14);
    addCircle(x, z, 11, 0, 28, {});
  }
  // mast
  solid.cyl(0.3, 1.0, 60, 700, RY, -470, PAL.slateLight, 6);
  glow.coral.sphere(1.4, 700, RY + 61, -470, 0xffffff);
  addCircle(700, -470, 1, 0, 60, {});
  addSign(group, 'COMPUTE RIDGE', 420, RY + 9, -595, 0, 40, '#ff8a5c', 'anthropic inference campus');
  solid.box(1, 7, 1, 402, RY, -595, PAL.slate); solid.box(1, 7, 1, 438, RY, -595, PAL.slate);

  // ---- Gator Garage (chop shop) -------------------------------------------
  {
    const g = POI.gator, y = 1.3;
    const wood = 0x5d4630, tin = 0x7d8a86;
    solid.box(18, 6.5, 12, g.x + 2, y, g.z - 20, wood);
    solid.cbox(19.5, 0.4, 7.2, g.x + 2, y + 7.6, g.z - 23.2, tin, 0, 0.32);
    solid.cbox(19.5, 0.4, 7.2, g.x + 2, y + 7.6, g.z - 16.8, tin, 0, -0.32);
    solid.box(9, 5, 0.3, g.x + 2, y, g.z - 13.9, 0x33373a); // roller door
    addBox(g.x - 7, g.z - 26, g.x + 11, g.z - 14, 0, y + 9, {});
    addSign(group, 'GATOR GARAGE', g.x + 2, y + 8.6, g.z - 13.6, 0, 12, '#b4ff5c', 'no questions · no receipts');
    // junk
    for (let i = 0; i < 6; i++) {
      const a = rng.float(0, 6.28), d = rng.float(16, 30);
      const x = g.x + Math.cos(a) * d, z = g.z + Math.sin(a) * d;
      if (z < g.z - 10) continue;
      solid.cyl(0.9, 0.9, 0.6 * rng.int(1, 4), x, y, z, 0x1c1c1e, 10);
      addCircle(x, z, 0.9, 0, y + 2, {});
    }
    for (let i = 0; i < 10; i++) glow.amber.sphere(0.22, g.x - 6 + i * 1.8, y + 6.2 - Math.sin((i / 9) * Math.PI) * 0.8, g.z - 13.5, 0xffffff);
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
    // jetty into the river (east)
    pier(solid, c.x + 6, c.z - 2.2, c.x + 40, c.z + 2.2, 1.2);
    boatSpawns.push({ x: c.x + 44, z: c.z + 8, heading: Math.PI });
    addSign(group, 'MOONSHINE HOLLOW', c.x - 6, y + 4.5, c.z + 12, 0, 9, '#ffb347');
  }

  // ---- Heron Jetty ----------------------------------------------------
  {
    const j = POI.jetty, y = 1.6;
    pier(solid, j.x - 2.5, j.z + 4, j.x + 2.5, j.z + 44, 1.2);
    pier(solid, j.x - 9, j.z + 38, j.x + 9, j.z + 44, 1.2);
    boatSpawns.push({ x: j.x - 7, z: j.z + 50, heading: -Math.PI / 2 });
    boatSpawns.push({ x: j.x + 9, z: j.z + 50, heading: -Math.PI / 2 });
    solid.box(5, 3.4, 4, j.x - 10, y, j.z - 6, 0x5b4630);
    solid.cbox(6.4, 0.3, 5.2, j.x - 10, y + 3.8, j.z - 6, 0x6f7a72, 0, 0.1);
    addBox(j.x - 12.5, j.z - 8, j.x - 7.5, j.z - 4, 0, y + 4, {});
    addSign(group, 'HERON JETTY', j.x - 10, y + 4.8, j.z - 3.8, 0, 6, '#5ff3ff');
    glow.cyan.sphere(0.3, j.x + 2.6, y + 2.4, j.z + 4, 0xffffff);
    solid.cyl(0.1, 0.1, 2.6, j.x + 2.6, y - 0.2, j.z + 4, 0x3d2e20, 5);
  }

  // ---- Beach piers & lifeguard towers ------------------------------------------
  for (const z of [-120, 260]) {
    const cx = coastEastX(z);
    pier(solid, cx - 60, z - 3, cx + 55, z + 3, 2.2);
    solid.box(9, 3.5, 9, cx + 48, 2.2, z, PAL.cream);
    solid.cone(7.5, 3, cx + 48, 5.7, z, PAL.terracotta, 4);
    addBox(cx + 43.5, z - 4.5, cx + 52.5, z + 4.5, 0, 9, {});
    glow.coral.box(9.2, 0.25, 9.2, cx + 48, 5.5, z, 0xffffff);
    boatSpawns.push({ x: cx + 30, z: z + 12, heading: Math.PI / 2 });
  }
  for (const z of [-260, 20, 140, 420]) {
    const x = coastEastX(z) - 38;
    const y = terrainHeight(x, z);
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) solid.cyl(0.14, 0.14, 3, x + dx, y, z + dz, 0xd8d0c0, 5);
    solid.box(3.4, 2.4, 3.4, x, y + 3, z, PAL.terracotta);
    solid.cbox(4.4, 0.25, 4.4, x, y + 5.7, z, PAL.cream, 0, 0, 0.12);
    addCircle(x, z, 2, 0, y + 6, {});
  }

  // ---- Stunt ramps -------------------------------------------------------
  const rampMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true, side: THREE.DoubleSide });
  const rampB = new Batch();
  const ramp = (x, z, heading, len = 12, wid = 7, height = 3.2) => {
    addRamp(x, z, heading, len, wid, height);
    const y = groundHeight(x - Math.sin(heading) * (len / 2 + 0.5), z - Math.cos(heading) * (len / 2 + 0.5));
    // wedge: a box sheared by building a prism geometry
    const g = new THREE.BufferGeometry();
    const hw = wid / 2, hl = len / 2;
    const v = [
      -hw, 0, -hl, hw, 0, -hl, hw, 0, hl, -hw, 0, hl, // base
      -hw, height, hl, hw, height, hl,                // top edge
    ];
    const idx = [0, 1, 5, 0, 5, 4, /* slope */ 3, 4, 5, 3, 5, 2, /* back */ 0, 4, 3, /* side */ 1, 2, 5];
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    rampB.add(g, PAL.terracottaLight, x, y, z, 0, heading, 0);
    // chevron stripe
    glow.amber.cbox(wid, 0.12, 0.5, x + Math.sin(heading) * hl * 0.2, y + height * 0.62, z + Math.cos(heading) * hl * 0.2, 0xffffff, heading, -Math.atan2(height, len));
  };
  ramp(905, 120, 0, 13, 8, 3.4);          // beach, launching south along the sand
  ramp(650, 990, -Math.PI / 2, 12, 7, 3); // port yard
  ramp(-1000, 566, 0, 12, 6, 3.2);         // behind Gator Garage, over the channel
  ramp(60, 40, Math.PI / 2, 10, 6, 2.6);  // Alignment Park
  ramp(-215, -590, Math.PI, 12, 6, 3.4);  // Glowwood lookout
  ramp(640, 320, Math.PI / 2, 12, 7, 3);  // city edge towards the shore
  group.add(rampB.mesh(rampMat));

  group.add(solid.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })));
  const glowCols = { cyan: PAL.neonCyan, coral: PAL.neonCoral, amber: PAL.neonAmber, lime: PAL.neonLime };
  for (const k of Object.keys(glow)) {
    if (glow[k].empty) continue;
    const base = new THREE.Color(glowCols[k]);
    const mat = new THREE.MeshBasicMaterial({ color: base.clone(), toneMapped: false });
    for (const ch of ['r', 'g', 'b']) env.nightLerp(mat.color, ch, base[ch] * 0.95, base[ch] * 2.2);
    group.add(glow[k].mesh(mat, { shadow: false, receive: false }));
  }
  scene.add(group);
  return group;
}
