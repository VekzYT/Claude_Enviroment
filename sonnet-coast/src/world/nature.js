// Vegetation: beach palms, the bioluminescent Glowwood, bayou cypress and mangroves, reeds, lilies.
import * as THREE from 'three';
import { WORLD_MIN, WORLD_MAX, FLAT_ZONES } from './layout.js';
import { forestMask, swampMask, meadowMask, landDist, rawHeight } from './terrain.js';
import { terrainHeight, roadAt, edges, edgePoint } from './roads.js';
import { blockAt } from './cityplan.js';
import { CITY } from './layout.js';
import { Batch, ChunkedInstances, tmpMatrix } from './geom.js';
import { addCircle } from './colliders.js';
import { parkSpots, roofTrees } from './city.js';
import { registerBreakable } from './breakables.js';
import { RNG, hash2 } from '../util/rng.js';
import { PAL } from './palette.js';
import { makeGlowTexture } from './textures.js';


function palmGeo() {
  const b = new Batch();
  // curved trunk
  let x = 0, y = 0;
  const segs = 4, h = 9;
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const lean = 0.12 + t * 0.18;
    const len = h / segs + 0.15;
    b.add(new THREE.CylinderGeometry(0.2 - t * 0.06, 0.26 - t * 0.06, len, 5, 1, true), 0x8a6a48, x + Math.sin(lean) * len / 2, y + Math.cos(lean) * len / 2, 0, 0, 0, -lean);
    x += Math.sin(lean) * (h / segs); y += Math.cos(lean) * (h / segs);
  }
  // fronds
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + (i % 2) * 0.2;
    const droop = 0.35 + (i % 3) * 0.14;
    const g = new THREE.PlaneGeometry(1.2, 4.6, 1, 3);
    g.translate(0, 2.3, 0);
    const p = g.getAttribute('position');
    for (let k = 0; k < p.count; k++) {
      const yy = p.getY(k), tt = yy / 4.6;
      p.setZ(k, tt * tt * 2.2);
      p.setX(k, p.getX(k) * (1 - tt * 0.75));
    }
    g.rotateX(Math.PI / 2 - droop - 0.5);
    g.computeVertexNormals();
    b.add(g, i % 2 ? 0x2f8f3e : 0x3fa64a, x, y, 0, 0, a, 0);
  }
  b.sphere(0.5, x, y - 0.1, 0, 0x5f4a2e, 1, 0.8, 1, 0);
  return b.merged();
}

function pineGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.32, 0.55, 7, 5, 1, true), 0x3b2a22, 0, 3.5, 0);
  const cols = [0x0f3d33, 0x13493a, 0x186045];
  for (let i = 0; i < 3; i++) b.add(new THREE.ConeGeometry(4.5 - i * 1.15, 6.6, 6, 1, i > 0), cols[i % 3], 0, 6.9 + i * 3.9, 0, 0, i * 0.5, 0);
  return b.merged();
}
function pineGlowGeo() {
  // glowing lantern fruit + bracket fungus on the trunk
  const b = new Batch();
  const pts = [[2.6, 6.2, 0.6], [-2.2, 6.6, 1.4], [0.6, 9.4, -2.2], [-1.2, 9.6, 1.8], [1.5, 12.5, 0.8], [-0.4, 3.2, 0.58], [0.5, 2.2, -0.5]];
  pts.forEach(([x, y, z], i) => b.add(new THREE.IcosahedronGeometry(i > 4 ? 0.34 : 0.3, 0), 0xffffff, x, y, z));
  return b.merged();
}
function broadleafGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.28, 0.45, 4.5, 5, 1, true), 0x4a382a, 0, 2.25, 0);
  b.sphere(3.0, 0, 6.2, 0, 0x2f7a3a, 1, 0.85, 1, 0);
  b.sphere(2.2, 1.8, 5.2, 0.6, 0x3a8c40, 1, 0.8, 1, 0);
  b.sphere(2.0, -1.5, 5.4, -0.9, 0x2a6e36, 1, 0.8, 1, 0);
  return b.merged();
}
function cypressGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.4, 1.5, 3.2, 7), 0x4d4034, 0, 1.6, 0);
  b.add(new THREE.CylinderGeometry(0.28, 0.4, 8.5, 6), 0x54463a, 0, 7.4, 0);
  b.sphere(3.6, 0, 12.2, 0, 0x2f4d2c, 1.15, 0.45, 1.15, 1);
  b.sphere(2.6, 1.2, 10.6, 0.8, 0x38552f, 1.1, 0.4, 1.1, 1);
  // hanging moss
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.28, r = 2.2 + (i % 3) * 0.7, len = 2.2 + (i % 4) * 0.8;
    const g = new THREE.PlaneGeometry(0.5, len);
    b.add(g, 0x7b8b62, Math.cos(a) * r, 11.2 - len / 2, Math.sin(a) * r, 0, a, 0);
    b.add(new THREE.PlaneGeometry(0.5, len), 0x7b8b62, Math.cos(a) * r, 11.2 - len / 2, Math.sin(a) * r, 0, a + Math.PI / 2, 0);
  }
  return b.merged();
}
function mangroveGeo() {
  const b = new Batch();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.28;
    b.add(new THREE.CylinderGeometry(0.07, 0.1, 3.2, 4), 0x4a3b2c, Math.cos(a) * 1.0, 0.9, Math.sin(a) * 1.0, 0, -a, 0.75);
  }
  b.add(new THREE.CylinderGeometry(0.16, 0.2, 2, 5), 0x4a3b2c, 0, 2.6, 0);
  b.sphere(2.3, 0, 4.4, 0, 0x2d5a33, 1.2, 0.6, 1.2, 1);
  b.sphere(1.6, 1.0, 3.9, 0.8, 0x3b6b38, 1.1, 0.6, 1.1, 1);
  return b.merged();
}
function mushroomGeo() {
  const stems = new Batch(), caps = new Batch();
  [[0, 0, 1], [0.7, 0.3, 0.7], [-0.5, 0.6, 0.55], [0.2, -0.7, 0.4]].forEach(([x, z, s]) => {
    stems.add(new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 0.9 * s, 5), 0xd8d2c0, x, 0.45 * s, z);
    const g = new THREE.SphereGeometry(0.42 * s, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    caps.add(g, 0xffffff, x, 0.85 * s, z, 0, 0, 0, 1, 0.6, 1);
  });
  return { stems: stems.merged(), caps: caps.merged() };
}
function glowFernGeo() {
  const b = new Batch();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.28;
    const g = new THREE.PlaneGeometry(0.28, 1.5);
    g.translate(0, 0.75, 0);
    g.rotateX(0.75);
    b.add(g, 0xffffff, 0, 0, 0, 0, a, 0);
  }
  return b.merged();
}
function reedGeo() {
  const b = new Batch();
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3, r = 0.25 * (i % 3);
    b.add(new THREE.PlaneGeometry(0.16, 1.9 + (i % 2) * 0.5), i % 2 ? 0x6f8f3c : 0x86a348, Math.cos(a) * r, 0.9, Math.sin(a) * r, 0, a, (i - 2) * 0.06);
  }
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 5), 0x5b3d22, 0.1, 1.9, 0);
  return b.merged();
}
function rockGeo() {
  const g = new THREE.IcosahedronGeometry(1, 0);
  const p = g.getAttribute('position');
  const r = new RNG(77);
  // jitter by position hash so duplicated verts stay welded
  for (let i = 0; i < p.count; i++) {
    const k = 0.75 + 0.5 * hash2(Math.round(p.getX(i) * 100), Math.round(p.getY(i) * 100 + p.getZ(i) * 37), 9);
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.7, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return new Batch().add(g, 0x6d6a66).merged();
}
function umbrellaGeo() {
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 5), 0xe8e0d0, 0, 1.2, 0);
  for (let i = 0; i < 8; i++) {
    const g = new THREE.ConeGeometry(1.7, 0.55, 1, 1, true, (i / 8) * 6.283, 6.283 / 8);
    b.add(g, i % 2 ? PAL.terracottaLight : PAL.cream, 0, 2.5, 0);
  }
  return b.merged();
}

function inFlatZone(x, z, pad = 6) {
  for (const zone of FLAT_ZONES) {
    if (zone.r !== undefined) { if (Math.hypot(x - zone.cx, z - zone.cz) < zone.r + pad) return true; }
    else if (x > zone.x0 - pad && x < zone.x1 + pad && z > zone.z0 - pad && z < zone.z1 + pad) return true;
  }
  return false;
}

export function buildNature(scene, env, quality) {
  const group = new THREE.Group();
  group.name = 'nature';
  const rng = new RNG(31337);
  const dens = quality === 'low' ? 0.5 : quality === 'medium' ? 0.75 : 1;

  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
  const solidMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: true });
  const glowMat = (hex) => {
    const base = new THREE.Color(hex);
    const m = new THREE.MeshBasicMaterial({ color: base.clone(), toneMapped: false });
    for (const ch of ['r', 'g', 'b']) env.nightLerp(m.color, ch, base[ch] * 0.75, base[ch] * 2.6);
    return m;
  };

  const sh = quality === 'high';
  const palms = new ChunkedInstances(palmGeo(), leafMat, { shadow: sh, chunk: 250, maxDist: 900 });
  const pines = new ChunkedInstances(pineGeo(), solidMat, { shadow: sh, maxDist: 1250 });
  const gl = { maxDist: 520, colors: true };
  const glowCols = [PAL.neonCyan, PAL.neonMagenta, PAL.neonLime, 0x7dffb0, 0x35e0c8, 0xb46bff].map((h) => new THREE.Color(h));
  const white = () => { const m = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); for (const ch of ['r', 'g', 'b']) env.nightLerp(m.color, ch, 0.75, 2.6); return m; };
  const pineGlowAll = new ChunkedInstances(pineGlowGeo(), white(), gl);
  const pineGlow = [0, 1, 2].map((k) => ({ add: (m) => pineGlowAll.add(m, glowCols[k]) }));
  const broad = new ChunkedInstances(broadleafGeo(), solidMat, { shadow: sh, chunk: 250, maxDist: 1100 });
  const cypress = new ChunkedInstances(cypressGeo(), leafMat, { shadow: sh, maxDist: 950 });
  const mangrove = new ChunkedInstances(mangroveGeo(), leafMat, { shadow: false, maxDist: 600 });
  const mg = mushroomGeo();
  const near = { chunk: 200, maxDist: 260 };
  const stems = new ChunkedInstances(mg.stems, solidMat, near);
  const capsAll = new ChunkedInstances(mg.caps, white(), gl);
  const caps = [0, 1, 3].map((k) => ({ add: (m) => capsAll.add(m, glowCols[k]) }));
  const fernMat = white(); fernMat.side = THREE.DoubleSide;
  const fernsAll = new ChunkedInstances(glowFernGeo(), fernMat, gl);
  const ferns = [4, 5].map((k) => ({ add: (m) => fernsAll.add(m, glowCols[k]) }));
  const reeds = new ChunkedInstances(reedGeo(), leafMat, near);
  const rocks = new ChunkedInstances(rockGeo(), solidMat, { shadow: sh, maxDist: 500 });
  const umbrellas = new ChunkedInstances(umbrellaGeo(), leafMat, { chunk: 200, maxDist: 380 });
  const lilyGeo = new THREE.CircleGeometry(0.55, 7, 0.4, 5.6);
  lilyGeo.rotateX(-Math.PI / 2);
  const lilies = new ChunkedInstances(lilyGeo, new THREE.MeshStandardMaterial({ color: 0x3f8f45, roughness: 0.6, side: THREE.DoubleSide }), near);

  const placePalm = (x, z, y, breakable) => {
    const ref = palms.add(tmpMatrix(x, y - 0.1, z, rng.float(0, 6.28), rng.float(1.0, 1.5)));
    const c = addCircle(x, z, 0.3, 0, y + 6, {});
    if (breakable) registerBreakable({ collider: c, fall: [ref], hide: [], x, z, y: y - 0.1, kind: 'palm', minSpeed: 11 });
  };

  const STEP = 11;
  for (let gx = WORLD_MIN + 20; gx < WORLD_MAX - 20; gx += STEP) for (let gz = WORLD_MIN + 20; gz < WORLD_MAX - 20; gz += STEP) {
    const x = gx + rng.float(-5, 5), z = gz + rng.float(-5, 5);
    const roll = rng.next(), roll2 = rng.next();
    const d = landDist(x, z);
    if (d < -5) continue;
    const road = roadAt(x, z, 20);
    const roadGap = road ? road.d - road.hw : 99;
    if (roadGap < 3.5) continue;
    if (inFlatZone(x, z)) continue;
    const h = terrainHeight(x, z);
    const f = forestMask(x, z), s = swampMask(x, z);

    if (f > 0.5 && h > 0.6) {
      if (d < 14) continue;
      if (roll < 0.52 * dens && roadGap > 4.5) {
        const sc = rng.float(0.8, 1.5);
        const m = tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc);
        pines.add(m);
        if (roll2 < 0.42) pineGlow[rng.int(0, 2)].add(m);
        addCircle(x, z, 0.5 * sc, 0, h + 12, {});
      } else if (roll < 0.70) {
        const k = rng.int(0, 2);
        const m = tmpMatrix(x, h - 0.05, z, rng.float(0, 6.28), rng.float(0.8, 2.2));
        stems.add(m); caps[k].add(m);
      } else if (roll < 0.86) {
        ferns[rng.int(0, 1)].add(tmpMatrix(x, h - 0.05, z, rng.float(0, 6.28), rng.float(0.8, 1.7)));
      } else if (roll < 0.885) {
        const sc = rng.float(0.8, 2.6);
        rocks.add(tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc));
        addCircle(x, z, sc * 0.85, 0, h + sc * 0.6, {});
      }
      continue;
    }
    if (s > 0.5) {
      if (h > 0.25 && h < 2.6) {
        if (roll < 0.20 * dens && roadGap > 5) {
          const sc = rng.float(0.8, 1.35);
          cypress.add(tmpMatrix(x, h - 0.3, z, rng.float(0, 6.28), sc));
          addCircle(x, z, 0.9 * sc, -3, h + 10, {});
        } else if (roll < 0.36 && h < 0.9) {
          const sc = rng.float(0.8, 1.4);
          mangrove.add(tmpMatrix(x, h - 0.3, z, rng.float(0, 6.28), sc));
          addCircle(x, z, 0.5, -3, h + 3, {});
        } else if (roll < 0.47) {
          const k = rng.int(0, 2);
          const m = tmpMatrix(x, h - 0.05, z, rng.float(0, 6.28), rng.float(0.7, 1.6));
          stems.add(m); caps[k].add(m);
        } else if (roll < 0.62) reeds.add(tmpMatrix(x, h - 0.1, z, rng.float(0, 6.28), rng.float(0.8, 1.5)));
      } else if (h > -0.5 && h <= 0.25) {
        if (roll < 0.55) reeds.add(tmpMatrix(x, Math.max(h, -0.15) - 0.1, z, rng.float(0, 6.28), rng.float(0.9, 1.6)));
        else if (roll < 0.68) { mangrove.add(tmpMatrix(x, -0.2, z, rng.float(0, 6.28), rng.float(0.8, 1.3))); addCircle(x, z, 0.5, -3, 3, {}); }
      } else if (h <= -0.5 && h > -2.2 && roll < 0.22) {
        for (let k = 0; k < 3; k++) lilies.add(tmpMatrix(x + rng.float(-2, 2), 0.03, z + rng.float(-2, 2), rng.float(0, 6.28), rng.float(0.6, 1.4)));
      }
      continue;
    }
    // Beach & coast
    if (d < 110 && h > 0.9 && h < 4 && f < 0.3) {
      if (roll < 0.11 * dens && d > 28) placePalm(x, z, h, true);
      else if (roll < 0.135 && d > 14 && d < 60 && x > 700) umbrellas.add(tmpMatrix(x, h - 0.05, z, rng.float(0, 6.28), 1));
      else if (roll > 0.985) { const sc = rng.float(0.6, 1.6); rocks.add(tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc)); addCircle(x, z, sc * 0.8, 0, h + sc * 0.6, {}); }
      continue;
    }
    if (h < 0.6) continue;
    // Meadows and coastal parkland
    if (roll < 0.045 * dens && roadGap > 5) {
      if (x > 640 && roll2 < 0.7) placePalm(x, z, h, true);
      else {
        const sc = rng.float(0.8, 1.4);
        broad.add(tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc));
        addCircle(x, z, 0.45 * sc, 0, h + 5, {});
      }
    } else if (roll > 0.99) { const sc = rng.float(0.5, 1.4); rocks.add(tmpMatrix(x, h - 0.2, z, rng.float(0, 6.28), sc)); addCircle(x, z, sc * 0.8, 0, h + sc * 0.6, {}); }
  }
  // City parks and plaza planters
  const GY = CITY.y + 0.16;
  const placeBroad = (x, z, y, sc) => { broad.add(tmpMatrix(x, y - 0.15, z, rng.float(0, 6.28), sc)); addCircle(x, z, 0.4 * sc, 0, y + 5, {}); };
  for (const p of parkSpots) {
    const y = p.planter ? GY + 0.7 : GY;
    if (p.inside) {
      // under glass: no collisions, nobody can get in there
      if (rng.chance(0.55)) palms.add(tmpMatrix(p.x, y - 0.1, p.z, rng.float(0, 6.28), rng.float(0.9, 1.3)));
      else broad.add(tmpMatrix(p.x, y - 0.15, p.z, rng.float(0, 6.28), rng.float(0.7, 1.1)));
    } else if (rng.chance(p.planter ? 0.5 : 0.45)) placePalm(p.x, p.z, y, !p.planter);
    else placeBroad(p.x, p.z, y, rng.float(0.75, 1.15));
  }
  // trees on roofs, terraces and sky bridges
  for (const t of roofTrees) broad.add(tmpMatrix(t.x, t.y - 0.1, t.z, rng.float(0, 6.28), t.s));
  // Street trees along every kerb, palms down the boulevard medians and the boardwalk
  const P = {};
  const palmy = { ocean: 1, strip: 0.9, downtown: 0.55, midtown: 0.4, uptown: 0.25, riverside: 0.2, oldtown: 0.15 };
  for (const e of edges) {
    if (!e.grid) continue;
    for (const side of [-1, 1]) {
      edgePoint(e, 50, (e.spec.hw + 3) * side, P);
      const block = blockAt(P.x, P.z);
      const D = block ? block.district : 'ocean';
      if (D === 'docks' || (block && block.park)) continue;
      for (const s of [34, 66]) {
        if (!rng.chance(0.82 * dens + 0.1)) continue;
        edgePoint(e, s + rng.float(-2, 2), (e.spec.hw + 2.5) * side, P);
        if (rng.chance(palmy[D] ?? 0.3)) placePalm(P.x, P.z, GY, true);
        else placeBroad(P.x, P.z, GY, rng.float(0.6, 0.85));
      }
    }
    if (e.type === 'blvd') {
      // (the monorail pylons stand at 14, 50 and 86 m along each block)
      for (const s of [24, 34, 66, 76]) { edgePoint(e, s, 0, P); placePalm(P.x, P.z, CITY.y + 0.03, true); }
    }
  }
  for (let z = CITY.promenade.z0 + 12; z < CITY.promenade.z1 - 8; z += 15) {
    if (Math.abs(z) < 12) continue; // keep the pier entrance open
    placePalm(CITY.promenade.x0 + 3.5, z + rng.float(-2, 2), GY, true);
  }

  for (const ci of [palms, pines, pineGlowAll, broad, cypress, mangrove, stems, capsAll, fernsAll, reeds, rocks, umbrellas, lilies]) ci.build(group);

  // ---- Fireflies (GPU-wrapped point field following the camera) -------------
  const N = quality === 'low' ? 250 : 700;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = rng.float(0, 1); pos[i * 3 + 1] = rng.float(0, 1); pos[i * 3 + 2] = rng.float(0, 1); seed[i] = rng.float(0, 100); }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  fg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const fireflyMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uIntensity: { value: 0 }, uMap: { value: makeGlowTexture() }, uGround: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uGround; uniform vec3 uCenter;
      attribute float aSeed; varying float vA; varying vec3 vCol;
      void main() {
        vec3 box = vec3(110.0, 9.0, 110.0);
        vec3 p = position * box;
        p.xz += vec2(sin(uTime * 0.3 + aSeed), cos(uTime * 0.23 + aSeed * 1.7)) * 3.0;
        p.y += sin(uTime * 0.5 + aSeed * 3.1) * 1.2;
        vec3 rel = mod(p - uCenter + box * 0.5, box) - box * 0.5;
        vec3 wp = vec3(uCenter.x + rel.x, uGround + 0.6 + position.y * box.y + sin(uTime * 0.5 + aSeed) * 0.8, uCenter.z + rel.z);
        vec4 mv = viewMatrix * vec4(wp, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((150.0 + 60.0 * sin(aSeed)) / max(-mv.z, 1.0), 1.5, 16.0);
        vA = (0.5 + 0.5 * sin(uTime * (1.5 + fract(aSeed) * 2.0) + aSeed * 9.0)) * smoothstep(55.0, 35.0, length(rel.xz));
        vCol = mix(vec3(0.6, 1.0, 0.5), vec3(0.4, 0.95, 1.0), fract(aSeed * 0.37));
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uIntensity; varying float vA; varying vec3 vCol;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).r * vA * uIntensity;
        gl_FragColor = vec4(vCol * a * 1.6, a);
      }`,
  });
  const fireflies = new THREE.Points(fg, fireflyMat);
  fireflies.frustumCulled = false;
  group.add(fireflies);

  scene.add(group);
  return {
    group, palms,
    update(dt, t, focus) {
      const u = fireflyMat.uniforms;
      u.uTime.value = t;
      u.uCenter.value.copy(focus);
      u.uGround.value = Math.max(terrainHeight(focus.x, focus.z), 0);
      const wild = Math.max(forestMask(focus.x, focus.z), swampMask(focus.x, focus.z));
      u.uIntensity.value = wild * env.night;
      fireflies.visible = u.uIntensity.value > 0.02;
    },
  };
}
