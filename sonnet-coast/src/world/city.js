// Sonnet City: merged tower meshes, neon trims, holo billboards, kerb slabs, special buildings.
import * as THREE from 'three';
import { G } from '../state.js';
import { CITY, POI } from './layout.js';
import { blocks, buildings, BUILDING_COLORS, SIDEWALK } from './cityplan.js';
import { KERB } from './roads.js';
import { Batch, FacadeBatch } from './geom.js';
import { makeFacade, makeNoiseTexture, makeCanvas, canvasToTexture } from './textures.js';
import { addBox } from './colliders.js';
import { RNG } from '../util/rng.js';
import { PAL } from './palette.js';

const NEON = { coral: PAL.neonCoral, cyan: PAL.neonCyan, amber: PAL.neonAmber, magenta: PAL.neonMagenta };
export const parkingSlots = [];   // {x, z, heading, kind}
export const parkSpots = [];      // {x, z} tree positions inside parks
export const cityLights = [];     // blinking spire lights {mesh}
const GY = CITY.y + KERB;

export function drawSpark(g, cx, cy, r, color, width = 0.16) {
  g.save();
  g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = r * width;
  const lens = [1, 0.72, 0.9, 0.66, 1, 0.75, 0.88, 0.7, 1, 0.68, 0.92, 0.74];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r * 0.14, cy + Math.sin(a) * r * 0.14);
    g.lineTo(cx + Math.cos(a) * r * lens[i], cy + Math.sin(a) * r * lens[i]);
    g.stroke();
  }
  g.restore();
}

const BILLBOARDS = [
  { bg: '#1c1410', fg: '#ff8a5c', big: 'CLAUDE', small: 'your co-pilot on the coast', spark: true },
  { bg: '#071a24', fg: '#5ff3ff', big: 'SONNET COAST', small: 'sun · surf · safety' },
  { bg: '#1a1420', fg: '#ffd27a', big: 'THINK', small: 'step by step' },
  { bg: '#f0e8d8', fg: '#c8643b', big: 'HELPFUL', small: 'harmless · honest', dark: true },
  { bg: '#200a1c', fg: '#ff5fd8', big: 'CLAUDE FM', small: '88.2 — the long context' },
  { bg: '#0d1f12', fg: '#b4ff5c', big: 'OPUS ENERGY', small: 'now with extended thinking' },
  { bg: '#1c1410', fg: '#f0e8d8', big: 'HAIKU EXPRESS', small: 'small. fast. on time.' },
  { bg: '#08121f', fg: '#6ab6ff', big: 'STAY ALIGNED', small: 'constitutional AI is watching out for you' },
];

function makeBillboardAtlas() {
  const c = makeCanvas(1024, 1024);
  const g = c.getContext('2d');
  BILLBOARDS.forEach((b, i) => {
    const x = (i % 2) * 512, y = Math.floor(i / 2) * 256;
    g.fillStyle = b.bg; g.fillRect(x, y, 512, 256);
    // frame
    g.strokeStyle = b.fg; g.lineWidth = 6; g.strokeRect(x + 10, y + 10, 492, 236);
    g.fillStyle = b.fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let tx = x + 256;
    if (b.spark) { drawSpark(g, x + 96, y + 112, 62, b.fg); tx = x + 310; }
    let size = 92;
    g.font = `900 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
    const maxW = b.spark ? 330 : 450;
    while (g.measureText(b.big).width > maxW && size > 30) { size -= 4; g.font = `900 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`; }
    g.fillText(b.big, tx, y + 108);
    g.font = '600 26px "Trebuchet MS", "Segoe UI", sans-serif';
    g.globalAlpha = 0.9;
    g.fillText(b.small, x + 256, y + 196);
    g.globalAlpha = 1;
  });
  return canvasToTexture(c, { repeat: false, aniso: 8 });
}

export function makeScreenMaterial(map) {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uMap: { value: null }, uTime: { value: 0 }, uBright: { value: 1 },
    }]),
    fog: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uTime, uBright;
      varying vec2 vUv; varying vec3 vW;
      #include <fog_pars_fragment>
      void main() {
        float seed = floor(vW.x * 0.11) + floor(vW.z * 0.13);
        float glitch = step(0.985, fract(sin(floor(uTime * 7.0) * 12.9 + seed) * 43758.5));
        vec2 uv = vUv;
        uv.x += glitch * 0.012 * sin(vW.y * 3.0 + uTime * 40.0);
        vec3 c = texture2D(uMap, uv).rgb;
        float scan = 0.86 + 0.14 * sin(vW.y * 9.0 - uTime * 3.0);
        float flick = 0.94 + 0.06 * sin(uTime * 31.0 + seed);
        gl_FragColor = vec4(c * uBright * scan * flick, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  mat.uniforms.uMap.value = map;
  return mat;
}

function addScreenQuad(arr, cx, cy, cz, w, h, heading, uv) {
  // quad centred at (cx,cy,cz), facing direction (sin h, cos h)
  const rx = Math.cos(heading), rz = -Math.sin(heading);
  const p = [
    [cx - rx * w / 2, cy - h / 2, cz - rz * w / 2], [cx + rx * w / 2, cy - h / 2, cz + rz * w / 2],
    [cx + rx * w / 2, cy + h / 2, cz + rz * w / 2], [cx - rx * w / 2, cy + h / 2, cz - rz * w / 2],
  ];
  const t = [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]];
  for (const k of [0, 1, 2, 0, 2, 3]) { arr.pos.push(...p[k]); arr.uv.push(...t[k]); }
}

export function makeSignTexture(text, fg = '#ffb347', bg = 'rgba(12,12,14,0.92)', sub = '') {
  const c = makeCanvas(512, 128);
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(5, 5, 502, 118);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 60;
  g.font = `900 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  while (g.measureText(text).width > 470 && size > 20) { size -= 3; g.font = `900 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`; }
  g.fillText(text, 256, sub ? 52 : 66);
  if (sub) { g.font = '600 22px "Trebuchet MS", sans-serif'; g.fillText(sub, 256, 100); }
  return canvasToTexture(c, { repeat: false });
}

export function addSign(parent, text, x, y, z, heading, w = 14, fg = '#ffb347', sub = '') {
  const mat = new THREE.MeshBasicMaterial({ map: makeSignTexture(text, fg, undefined, sub), toneMapped: false, side: THREE.DoubleSide });
  mat.color.setScalar(1.25);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), mat);
  m.position.set(x, y, z);
  m.rotation.y = heading;
  parent.add(m);
  return m;
}

export function buildCity(scene, env) {
  const group = new THREE.Group();
  group.name = 'city';
  const rng = new RNG(909);

  // ---- Towers ----------------------------------------------------------
  const facades = { grid: new FacadeBatch(), glass: new FacadeBatch(), bands: new FacadeBatch() };
  const roofs = new Batch();
  const neon = { coral: new Batch(), cyan: new Batch(), amber: new Batch(), magenta: new Batch() };
  const frames = new Batch();
  const screens = { pos: [], uv: [] };

  for (const b of buildings) {
    const col = BUILDING_COLORS[b.color];
    const fb = facades[b.style];
    const uOff = rng.float(0, 1);
    for (const t of b.tiers) {
      fb.wallBox(t.x0, GY + t.y0, t.z0, t.x1, GY + t.y1, t.z1, col, uOff);
      // roof slab with parapet
      roofs.box(t.x1 - t.x0, 0.6, t.z1 - t.z0, (t.x0 + t.x1) / 2, GY + t.y1, (t.z0 + t.z1) / 2, 0x24242a);
      if (b.neon) {
        const nb = neon[b.neon], y = GY + t.y1 + 0.35, th = 0.45;
        nb.box(t.x1 - t.x0 + 0.5, th, 0.4, (t.x0 + t.x1) / 2, y, t.z0 - 0.1, 0xffffff);
        nb.box(t.x1 - t.x0 + 0.5, th, 0.4, (t.x0 + t.x1) / 2, y, t.z1 + 0.1, 0xffffff);
        nb.box(0.4, th, t.z1 - t.z0 + 0.5, t.x0 - 0.1, y, (t.z0 + t.z1) / 2, 0xffffff);
        nb.box(0.4, th, t.z1 - t.z0 + 0.5, t.x1 + 0.1, y, (t.z0 + t.z1) / 2, 0xffffff);
      }
    }
    const top = b.tiers[b.tiers.length - 1];
    const tcx = (top.x0 + top.x1) / 2, tcz = (top.z0 + top.z1) / 2;
    // rooftop clutter
    if (b.h > 20 && b.kind !== 'tower') {
      for (let k = 0; k < 3; k++) {
        const w = rng.float(2.5, 6), d = rng.float(2.5, 6);
        roofs.box(w, rng.float(1.5, 3.5), d, tcx + rng.float(-0.3, 0.3) * (top.x1 - top.x0), GY + b.h + 0.6, tcz + rng.float(-0.3, 0.3) * (top.z1 - top.z0), 0x3a3a40);
      }
    }
    if (b.spire) {
      const sh = b.h * 0.22;
      roofs.cyl(0.25, 0.9, sh, tcx, GY + b.h, tcz, 0x55555c, 6);
      const light = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3344, toneMapped: false }));
      light.position.set(tcx, GY + b.h + sh + 0.8, tcz);
      light.userData.phase = rng.float(0, 6);
      group.add(light);
      cityLights.push(light);
    }
    if (b.billboard) {
      const side = rng.int(0, 3);
      const heading = [0, Math.PI / 2, Math.PI, -Math.PI / 2][side];
      const fx = Math.sin(heading), fz = Math.cos(heading);
      const span = side % 2 === 0 ? top.x1 - top.x0 : top.z1 - top.z0;
      const w = Math.min(26, Math.max(12, span * 0.8)), h = w / 2;
      const ex = side % 2 === 0 ? (top.z1 - top.z0) / 2 : (top.x1 - top.x0) / 2;
      const cx = tcx + fx * (ex - 0.6), cz = tcz + fz * (ex - 0.6), cy = GY + b.h + 2.4 + h / 2;
      const idx = rng.int(0, BILLBOARDS.length - 1);
      const u0 = (idx % 2) * 0.5, v1 = 1 - Math.floor(idx / 2) * 0.25;
      addScreenQuad(screens, cx + fx * 0.3, cy, cz + fz * 0.3, w, h, heading, [u0, v1 - 0.25, u0 + 0.5, v1]);
      frames.box(w + 0.8, h + 0.8, 0.5, cx, cy - h / 2 - 0.4, cz, 0x1a1a1e, heading);
      const rx = Math.cos(heading), rz = -Math.sin(heading);
      for (const s of [-0.35, 0.35]) frames.box(0.5, 2.6, 0.5, cx + rx * w * s, GY + b.h, cz + rz * w * s, 0x2a2a2e);
    }
    addBox(b.x0, b.z0, b.x1, b.z1, 0, GY + b.h, { building: b });
  }

  const noise = makeNoiseTexture(9, 256, 0.12);
  const styleSeeds = { grid: 1, glass: 2, bands: 3 };
  for (const style of Object.keys(facades)) {
    const tx = makeFacade(style, styleSeeds[style] * 31);
    const mat = new THREE.MeshStandardMaterial({
      map: tx.map, emissiveMap: tx.emissive, emissive: 0xffffff, emissiveIntensity: 0.05,
      vertexColors: true, roughness: style === 'glass' ? 0.28 : 0.7, metalness: style === 'glass' ? 0.35 : 0.05,
    });
    env.nightLerp(mat, 'emissiveIntensity', 0.04, 1.15);
    const mesh = new THREE.Mesh(facades[style].geometry(), mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.add(roofs.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })));
  for (const k of Object.keys(neon)) {
    if (neon[k].empty) continue;
    const mat = new THREE.MeshBasicMaterial({ color: NEON[k], toneMapped: false });
    const base = new THREE.Color(NEON[k]);
    mat.userData.base = base;
    env.nightLerp(mat.color, 'r', base.r * 0.9, base.r * 2.2);
    env.nightLerp(mat.color, 'g', base.g * 0.9, base.g * 2.2);
    env.nightLerp(mat.color, 'b', base.b * 0.9, base.b * 2.2);
    group.add(neon[k].mesh(mat, { shadow: false, receive: false }));
  }

  // ---- Kerb slabs, parks, parking -----------------------------------------
  const slabs = new Batch();
  const lots = new Batch();
  const lines = new Batch();
  for (const bl of blocks) {
    const w = bl.x1 - bl.x0, d = bl.z1 - bl.z0;
    slabs.box(w, KERB + 0.6, d, bl.cx, CITY.y - 0.6, bl.cz, bl.park ? 0x4f8a3c : 0xb9b2a6);
    if (bl.park) {
      // path cross + plaza
      slabs.box(w - 8, 0.05, 5, bl.cx, GY, bl.cz, 0xd9cfbd);
      slabs.box(5, 0.05, d - 8, bl.cx, GY, bl.cz, 0xd9cfbd);
      slabs.cyl(9, 9, 0.5, bl.cx, GY, bl.cz, 0xcfc6b6, 20);
      slabs.cyl(7.6, 7.6, 0.55, bl.cx, GY + 0.02, bl.cz, 0x3aa7b5, 20);
      slabs.cyl(0.8, 1.2, 3.2, bl.cx, GY, bl.cz, 0xcfc6b6, 8);
      addBox(bl.cx - 1, bl.cz - 1, bl.cx + 1, bl.cz + 1, 0, GY + 3, {});
      for (let k = 0; k < 16; k++) {
        const px = rng.float(bl.x0 + 8, bl.x1 - 8), pz = rng.float(bl.z0 + 8, bl.z1 - 8);
        if (Math.abs(px - bl.cx) < 6 || Math.abs(pz - bl.cz) < 6 || Math.hypot(px - bl.cx, pz - bl.cz) < 13) continue;
        parkSpots.push({ x: px, z: pz });
      }
    }
    if (bl.lot) {
      const L = bl.lot;
      lots.box(L.x1 - L.x0, 0.04, L.z1 - L.z0, (L.x0 + L.x1) / 2, GY, (L.z0 + L.z1) / 2, 0x303034);
      const rows = [];
      const depth = L.z1 - L.z0;
      rows.push({ z: L.z0 + 3.2, heading: 0 });
      if (depth > 20) rows.push({ z: L.z1 - 3.2, heading: Math.PI });
      if (depth > 46) { rows.push({ z: (L.z0 + L.z1) / 2 - 3.2, heading: Math.PI }, { z: (L.z0 + L.z1) / 2 + 3.2, heading: 0 }); }
      for (const r of rows) {
        for (let x = L.x0 + 3; x <= L.x1 - 3; x += 3.2) {
          lines.box(0.14, 0.02, 5.6, x - 1.6, GY + 0.045, r.z, 0xe8e2d4);
          parkingSlots.push({ x, z: r.z, heading: r.heading, kind: bl.kind });
        }
      }
    }
  }
  const slabMesh = slabs.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, map: noise }), { shadow: false });
  group.add(slabMesh);
  if (!lots.empty) group.add(lots.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), { shadow: false }));
  if (!lines.empty) group.add(lines.mesh(new THREE.MeshBasicMaterial({ vertexColors: true }), { shadow: false, receive: false }));

  // ---- Claude Tower -------------------------------------------------------
  const tower = blocks.find((b) => b.kind === 'tower').tower;
  const tcx = (tower.x0 + tower.x1) / 2, tcz = (tower.z0 + tower.z1) / 2;
  const fins = new Batch();
  for (const t of tower.tiers) {
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const fx = sx > 0 ? t.x1 : t.x0, fz = sz > 0 ? t.z1 : t.z0;
      fins.box(2.2, t.y1 - t.y0, 2.2, fx, GY + t.y0, fz, PAL.terracotta);
    }
  }
  const topY = GY + tower.h;
  fins.cyl(7, 9, 5, tcx, topY, tcz, PAL.slate, 12);
  fins.cyl(1.2, 1.6, 22, tcx, topY + 5, tcz, PAL.slateLight, 8);
  group.add(fins.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 })));

  const sparkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonCoral).multiplyScalar(2.2), toneMapped: false });
  const spark = new THREE.Group();
  const lens = [1, 0.72, 0.9, 0.66, 1, 0.75, 0.88, 0.7, 1, 0.68, 0.92, 0.74];
  for (let i = 0; i < 12; i++) {
    const len = 24 * lens[i];
    const ray = new THREE.Mesh(new THREE.BoxGeometry(2.4, len, 2.4), sparkMat);
    const a = (i / 12) * Math.PI * 2;
    ray.position.set(Math.sin(a) * (len / 2 + 3), Math.cos(a) * (len / 2 + 3), 0);
    ray.rotation.z = -a;
    spark.add(ray);
  }
  spark.position.set(tcx, topY + 54, tcz);
  group.add(spark);
  // halo ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(34, 0.5, 6, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonAmber).multiplyScalar(1.6), toneMapped: false }));
  ring.position.copy(spark.position);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // vertical CLAUDE banners on two faces
  const vc = makeCanvas(128, 1024);
  const vg = vc.getContext('2d');
  vg.fillStyle = '#17110d'; vg.fillRect(0, 0, 128, 1024);
  drawSpark(vg, 64, 80, 46, '#ff8a5c');
  vg.fillStyle = '#ff8a5c'; vg.textAlign = 'center'; vg.textBaseline = 'middle';
  vg.font = '900 110px "Trebuchet MS", sans-serif';
  'CLAUDE'.split('').forEach((ch, i) => vg.fillText(ch, 64, 230 + i * 140));
  const vmat = new THREE.MeshBasicMaterial({ map: canvasToTexture(vc, { repeat: false }), toneMapped: false });
  vmat.color.setScalar(1.5);
  const base = tower.tiers[0];
  for (const [dx, dz, ry] of [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 72), vmat);
    m.position.set(tcx + dx * ((base.x1 - base.x0) / 2 + 0.3), GY + 70, tcz + dz * ((base.z1 - base.z0) / 2 + 0.3));
    m.rotation.y = ry;
    group.add(m);
  }
  // plaza sculpture
  const sculpt = spark.clone();
  sculpt.scale.setScalar(0.11);
  sculpt.position.set(tcx, GY + 5.2, tower.z1 + 14);
  group.add(sculpt);
  const ped = new Batch();
  ped.cyl(1.6, 2, 1.4, tcx, GY, tower.z1 + 14, PAL.cream, 10);
  group.add(ped.mesh(new THREE.MeshStandardMaterial({ vertexColors: true })));
  addBox(tcx - 1.8, tower.z1 + 12.2, tcx + 1.8, tower.z1 + 15.8, 0, GY + 8, {});

  // ---- POI signs ---------------------------------------------------------
  const signFor = (kind, text, fg, sub) => {
    const b = buildings.find((x) => x.kind === kind);
    if (!b) return;
    const cx = (b.x0 + b.x1) / 2;
    addSign(group, text, cx, GY + Math.min(b.h - 2, 9), b.z0 - 0.4, Math.PI, Math.min(22, b.x1 - b.x0 - 4), fg, sub);
    addSign(group, text, cx, GY + Math.min(b.h - 2, 9), b.z1 + 0.4, 0, Math.min(22, b.x1 - b.x0 - 4), fg, sub);
  };
  signFor('safehouse', 'CONTEXT WINDOW LOFTS', '#ffb347', 'safehouse · wardrobe · garage');
  signFor('police', 'SAFETY CENTER', '#6ab6ff', 'anthropic police department');
  signFor('clinic', 'CONSTITUTIONAL CARE', '#ff8a5c', 'clinic · open 24h');
  signFor('retune', 'RE-TUNE GARAGE', '#ffb347', 'repair · respray · reset your flags');
  signFor('supply', 'PROMPT SUPPLY CO.', '#5ff3ff', 'gadgets · armor · charges');
  signFor('vanta', 'VANTABLACK LABS', '#ff5fd8', 'executive parking only');

  // ---- Billboards --------------------------------------------------------
  const atlas = makeBillboardAtlas();
  const screenMat = makeScreenMaterial(atlas);
  env.nightLerp(screenMat.uniforms.uBright, 'value', 0.95, 1.9);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(screens.pos, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(screens.uv, 2));
  group.add(new THREE.Mesh(sg, screenMat));
  group.add(frames.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })));

  scene.add(group);
  return {
    group, atlas, screenMat,
    update(dt, t) {
      spark.rotation.y += dt * 0.35;
      sculpt.rotation.y -= dt * 0.6;
      ring.rotation.z += dt * 0.1;
      screenMat.uniforms.uTime.value = t;
      for (const l of cityLights) l.visible = Math.sin(t * 2.2 + l.userData.phase) > 0.2;
    },
  };
}
