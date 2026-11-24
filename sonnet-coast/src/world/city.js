// Sonnet City: merged tower meshes with PBR facades, storefronts, neon, holo screens,
// kerb slabs, parks, plazas and the landmark buildings.
import * as THREE from 'three';
import { CITY, POI } from './layout.js';
import { blocks, buildings, BUILDING_COLORS, DISTRICTS } from './cityplan.js';
import { KERB } from './roads.js';
import { Batch, FacadeBatch } from './geom.js';
import { makeFacade, makeStorefronts, makeNeonSigns, makeNoiseTexture, makeCanvas, canvasToTexture, FACADE_STYLES, UI_FONT } from './textures.js';
import { addBox, addCircle } from './colliders.js';
import { setNeon } from './citylight.js';
import { RNG } from '../util/rng.js';
import { PAL } from './palette.js';

export const NEON = { coral: PAL.neonCoral, cyan: PAL.neonCyan, amber: PAL.neonAmber, magenta: PAL.neonMagenta, lime: PAL.neonLime };
export const parkingSlots = [];   // {x, z, heading, kind}
export const parkSpots = [];      // {x, z} tree positions inside parks and plazas
export const benchSpots = [];     // {x, z, heading}
export const parkLamps = [];      // {x, z}
const GY = CITY.y + KERB;
const SHOP_H = 4.5;

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
  { bg: '#f0e8d8', fg: '#c8643b', big: 'HELPFUL', small: 'harmless · honest' },
  { bg: '#200a1c', fg: '#ff5fd8', big: 'CLAUDE FM', small: '88.2 — the long context' },
  { bg: '#0d1f12', fg: '#b4ff5c', big: 'OPUS ENERGY', small: 'now with extended thinking' },
  { bg: '#1c1410', fg: '#f0e8d8', big: 'HAIKU EXPRESS', small: 'small. fast. on time.' },
  { bg: '#08121f', fg: '#6ab6ff', big: 'STAY ALIGNED', small: 'constitutional AI is watching out for you' },
  { bg: '#140a1e', fg: '#c77dff', big: 'TOKEN ROW', small: 'open all night · every night' },
  { bg: '#1f1408', fg: '#ffb347', big: 'RE-TUNE', small: 'new paint. clean record.' },
  { bg: '#041a1a', fg: '#7dffb0', big: 'GLOWWOOD', small: 'visit the forest that looks back' },
  { bg: '#1a0a0a', fg: '#ff4d6d', big: 'TOKEN DOME', small: 'tonight: bots vs. humans' },
];
const BB_COLS = 2, BB_ROWS = 6;

function makeBillboardAtlas() {
  const c = makeCanvas(1024, BB_ROWS * 256);
  const g = c.getContext('2d');
  BILLBOARDS.forEach((b, i) => {
    const x = (i % BB_COLS) * 512, y = Math.floor(i / BB_COLS) * 256;
    const grd = g.createLinearGradient(x, y, x + 512, y + 256);
    grd.addColorStop(0, b.bg); grd.addColorStop(1, '#000');
    g.fillStyle = b.bg; g.fillRect(x, y, 512, 256);
    g.globalAlpha = 0.35; g.fillStyle = grd; g.fillRect(x, y, 512, 256); g.globalAlpha = 1;
    g.strokeStyle = b.fg; g.lineWidth = 6; g.strokeRect(x + 10, y + 10, 492, 236);
    g.fillStyle = b.fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let tx = x + 256;
    if (b.spark) { drawSpark(g, x + 96, y + 112, 62, b.fg); tx = x + 310; }
    let size = 92;
    const maxW = b.spark ? 330 : 450;
    g.font = `900 ${size}px ${UI_FONT}`;
    while (g.measureText(b.big).width > maxW && size > 30) { size -= 4; g.font = `900 ${size}px ${UI_FONT}`; }
    g.fillText(b.big, tx, y + 108);
    g.font = `600 26px ${UI_FONT}`;
    g.globalAlpha = 0.9;
    g.fillText(b.small, x + 256, y + 196);
    g.globalAlpha = 1;
  });
  return canvasToTexture(c, { repeat: false, aniso: 8 });
}

export function makeScreenMaterial(map, { additive = false } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uMap: { value: null }, uTime: { value: 0 }, uBright: { value: 1 },
    }]),
    fog: true,
    side: THREE.DoubleSide,
    transparent: additive, depthWrite: !additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: /* glsl */`
      #include <common>
      varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vCityPos = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      uniform sampler2D uMap; uniform float uTime, uBright;
      varying vec2 vUv;
      #include <fog_pars_fragment>
      void main() {
        float seed = floor(vCityPos.x * 0.11) + floor(vCityPos.z * 0.13);
        float glitch = step(0.985, fract(sin(floor(uTime * 7.0) * 12.9 + seed) * 43758.5));
        vec2 uv = vUv;
        uv.x += glitch * 0.012 * sin(vCityPos.y * 3.0 + uTime * 40.0);
        vec3 c = texture2D(uMap, uv).rgb;
        float scan = 0.86 + 0.14 * sin(vCityPos.y * 9.0 - uTime * 3.0);
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

class QuadBatch {
  constructor() { this.pos = []; this.uv = []; this.col = []; }
  // quad centred at c, spanning along unit vector r (width w) and up (height h)
  add(cx, cy, cz, rx, rz, w, h, uv, color = null) {
    const p = [
      [cx - rx * w / 2, cy - h / 2, cz - rz * w / 2], [cx + rx * w / 2, cy - h / 2, cz + rz * w / 2],
      [cx + rx * w / 2, cy + h / 2, cz + rz * w / 2], [cx - rx * w / 2, cy + h / 2, cz - rz * w / 2],
    ];
    const t = [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]];
    for (const k of [0, 1, 2, 0, 2, 3]) {
      this.pos.push(...p[k]); this.uv.push(...t[k]);
      if (color) this.col.push(color.r, color.g, color.b);
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (this.col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    return g;
  }
}

export function makeSignTexture(text, fg = '#ffb347', bg = 'rgba(12,12,14,0.92)', sub = '') {
  const c = makeCanvas(512, 128);
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(5, 5, 502, 118);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 60;
  g.font = `900 ${size}px ${UI_FONT}`;
  while (g.measureText(text).width > 470 && size > 20) { size -= 3; g.font = `900 ${size}px ${UI_FONT}`; }
  g.fillText(text, 256, sub ? 52 : 66);
  if (sub) { g.font = `600 22px ${UI_FONT}`; g.fillText(sub, 256, 100); }
  return canvasToTexture(c, { repeat: false });
}

export function addSign(parent, text, x, y, z, heading, w = 14, fg = '#ffb347', sub = '') {
  const mat = new THREE.MeshBasicMaterial({ map: makeSignTexture(text, fg, undefined, sub), toneMapped: false, side: THREE.DoubleSide });
  mat.color.setScalar(1.3);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), mat);
  m.position.set(x, y, z);
  m.rotation.y = heading;
  parent.add(m);
  return m;
}

// Flat slab top with world-space UVs (so paving tiles line up across blocks) plus kerb skirts.
function slabGeometry(rects, y0, y1, uvScale = 4) {
  const pos = [], nor = [], uv = [], idx = [];
  const v = (x, y, z, nx, ny, nz, u, w) => { pos.push(x, y, z); nor.push(nx, ny, nz); uv.push(u, w); return pos.length / 3 - 1; };
  for (const [x0, z0, x1, z1] of rects) {
    let a = v(x0, y1, z1, 0, 1, 0, x0 / uvScale, z1 / uvScale), b = v(x1, y1, z1, 0, 1, 0, x1 / uvScale, z1 / uvScale);
    let c = v(x1, y1, z0, 0, 1, 0, x1 / uvScale, z0 / uvScale), d = v(x0, y1, z0, 0, 1, 0, x0 / uvScale, z0 / uvScale);
    idx.push(a, b, c, a, c, d);
    const side = (ax, az, bx, bz, nx, nz) => {
      const len = Math.hypot(bx - ax, bz - az) / uvScale;
      a = v(ax, y0, az, nx, 0, nz, 0, 0); b = v(bx, y0, bz, nx, 0, nz, len, 0);
      c = v(bx, y1, bz, nx, 0, nz, len, 0.2); d = v(ax, y1, az, nx, 0, nz, 0, 0.2);
      idx.push(a, b, c, a, c, d);
    };
    side(x0, z1, x1, z1, 0, 1); side(x1, z0, x0, z0, 0, -1); side(x1, z1, x1, z0, 1, 0); side(x0, z0, x0, z1, -1, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function makePavingTexture() {
  const S = 256, c = makeCanvas(S, S), r = makeCanvas(S / 2, S / 2);
  const g = c.getContext('2d'), gr = r.getContext('2d');
  gr.scale(0.5, 0.5);
  const rng = new RNG(88);
  g.fillStyle = '#8a857b'; g.fillRect(0, 0, S, S);
  gr.fillStyle = 'rgb(255,200,0)'; gr.fillRect(0, 0, S, S);
  const n = 4, t = S / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = rng.int(-12, 12);
    g.fillStyle = `rgb(${152 + v},${147 + v},${137 + v})`;
    g.fillRect(i * t + 2, j * t + 2, t - 4, t - 4);
    gr.fillStyle = `rgb(255,${rng.int(150, 215)},0)`; gr.fillRect(i * t + 2, j * t + 2, t - 4, t - 4);
  }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${rng.float(0.02, 0.08)})`; g.fillRect(rng.float(0, S), rng.float(0, S), 3, 3); }
  return { map: canvasToTexture(c), rough: canvasToTexture(r, { srgb: false }) };
}

export function buildCity(scene, env) {
  const group = new THREE.Group();
  group.name = 'city';
  const rng = new RNG(909);

  const facades = {};
  for (const s of FACADE_STYLES) facades[s] = new FacadeBatch(28);
  const shopB = { pos: [], nor: [], uv: [], col: [] };
  const roofs = new Batch();
  const neon = {};
  for (const k of Object.keys(NEON)) neon[k] = new Batch();
  const pools = new Batch();
  const frames = new Batch();
  const screens = new QuadBatch();
  const blades = new QuadBatch();
  const signAtlas = makeNeonSigns();

  const shopWall = (ax, az, bx, bz, nx, nz, row, uOff, col) => {
    const len = Math.hypot(bx - ax, bz - az);
    const o = 0.07;
    const p = [[ax + nx * o, GY, az + nz * o], [bx + nx * o, GY, bz + nz * o], [bx + nx * o, GY + SHOP_H, bz + nz * o], [ax + nx * o, GY + SHOP_H, az + nz * o]];
    const u0 = uOff, u1 = uOff + len / 36, v0 = 1 - (row + 1) / 4 + 0.003, v1 = 1 - row / 4 - 0.003;
    const t = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    for (const k of [0, 1, 2, 0, 2, 3]) { shopB.pos.push(...p[k]); shopB.nor.push(nx, 0, nz); shopB.uv.push(...t[k]); shopB.col.push(col[0], col[1], col[2]); }
  };

  // the colour each block face throws onto the street: [r,g,b,weight] accumulated per face
  const faceGlow = new Map();
  const glow = (block, face, hex, w) => {
    const k = `${block.i},${block.j},${face}`;
    const c = new THREE.Color(hex);
    const e = faceGlow.get(k) || { r: 0, g: 0, b: 0, w: 0 };
    e.r += c.r * w; e.g += c.g * w; e.b += c.b * w; e.w += w;
    faceGlow.set(k, e);
  };

  for (const block of blocks) {
    const D = DISTRICTS[block.district];
    const line = { x0: block.x0 + 4.5, x1: block.x1 - 4.5, z0: block.z0 + 4.5, z1: block.z1 - 4.5 };
    for (let bi = block.first; bi < block.last; bi++) {
      const b = buildings[bi];
      const col = BUILDING_COLORS[b.color];
      const fb = facades[b.style];
      const uOff = rng.float(0, 1);
      for (const t of b.tiers) {
        fb.wallBox(t.x0, GY + t.y0, t.z0, t.x1, GY + t.y1, t.z1, col, uOff);
        roofs.box(t.x1 - t.x0 + 0.5, 0.7, t.z1 - t.z0 + 0.5, (t.x0 + t.x1) / 2, GY + t.y1, (t.z0 + t.z1) / 2, 0x26262b);
        if (b.neon) {
          const nb = neon[b.neon], y = GY + t.y1 + 0.42, th = 0.36;
          nb.box(t.x1 - t.x0 + 0.7, th, 0.3, (t.x0 + t.x1) / 2, y, t.z0 - 0.2, 0xffffff);
          nb.box(t.x1 - t.x0 + 0.7, th, 0.3, (t.x0 + t.x1) / 2, y, t.z1 + 0.2, 0xffffff);
          nb.box(0.3, th, t.z1 - t.z0 + 0.7, t.x0 - 0.2, y, (t.z0 + t.z1) / 2, 0xffffff);
          nb.box(0.3, th, t.z1 - t.z0 + 0.7, t.x1 + 0.2, y, (t.z0 + t.z1) / 2, 0xffffff);
          if (b.edges && t.y1 - t.y0 > 12) {
            for (const [ex, ez] of [[t.x0, t.z0], [t.x1, t.z0], [t.x0, t.z1], [t.x1, t.z1]]) nb.box(0.28, t.y1 - t.y0, 0.28, ex, GY + t.y0, ez, 0xffffff);
          }
        }
      }
      const base = b.tiers[0];
      // Which faces look onto a street?
      const faces = [
        { f: 'w', on: Math.abs(base.x0 - line.x0) < 9, ax: base.x0, az: base.z0, bx: base.x0, bz: base.z1, nx: -1, nz: 0 },
        { f: 'e', on: Math.abs(base.x1 - line.x1) < 9, ax: base.x1, az: base.z1, bx: base.x1, bz: base.z0, nx: 1, nz: 0 },
        { f: 'n', on: Math.abs(base.z0 - line.z0) < 9, ax: base.x1, az: base.z0, bx: base.x0, bz: base.z0, nx: 0, nz: -1 },
        { f: 's', on: Math.abs(base.z1 - line.z1) < 9, ax: base.x0, az: base.z1, bx: base.x1, bz: base.z1, nx: 0, nz: 1 },
      ];
      const street = faces.filter((f) => f.on);
      if (b.shop >= 0) {
        const tint = b.shop === 3 ? [0.8, 0.8, 0.8] : [1, 1, 1];
        for (const f of faces) {
          shopWall(f.ax, f.az, f.bx, f.bz, f.nx, f.nz, f.on ? b.shop : 3, rng.float(0, 1), f.on ? tint : [0.55, 0.55, 0.55]);
          if (f.on && b.shop !== 3) glow(block, f.f, b.shop === 2 ? 0xbfe8ff : b.shop === 1 ? 0xffc27a : 0xffe0b0, b.shop === 2 ? 0.5 : 0.8);
        }
      }
      // blade signs
      for (let k = 0; k < b.signs && street.length; k++) {
        const f = rng.pick(street);
        const t = rng.float(0.12, 0.88);
        const px = f.ax + (f.bx - f.ax) * t, pz = f.az + (f.bz - f.az) * t;
        const item = rng.pick(signAtlas.items);
        const w = rng.float(1.5, 2.3), h = w / item.aspect;
        const maxY = Math.min(base.y1 - h / 2 - 0.5, 16);
        if (maxY < SHOP_H + h / 2 + 0.3) continue;
        const cy = GY + rng.float(SHOP_H + h / 2 + 0.3, maxY);
        const cx = px + f.nx * (0.35 + w / 2), cz = pz + f.nz * (0.35 + w / 2);
        // two single-sided quads so the lettering reads correctly from both directions
        blades.add(cx, cy, cz, f.nx, f.nz, w, h, [item.u0, item.v0, item.u1, item.v1]);
        blades.add(cx, cy, cz, -f.nx, -f.nz, w, h, [item.u0, item.v0, item.u1, item.v1]);
        frames.cbox(Math.abs(f.nx) * 0.5 + 0.08, 0.08, Math.abs(f.nz) * 0.5 + 0.08, px + f.nx * 0.25, cy + h / 2 - 0.2, pz + f.nz * 0.25, 0x1a1a1e);
        glow(block, f.f, item.color, 1.4);
      }
      const top = b.tiers[b.tiers.length - 1];
      const tcx = (top.x0 + top.x1) / 2, tcz = (top.z0 + top.z1) / 2;
      const tw = top.x1 - top.x0, td = top.z1 - top.z0, ry = GY + b.h + 0.7;
      // roofs
      if (b.roof === 'plant' || b.roof === 'vents') {
        const n = b.roof === 'vents' ? 5 : 3;
        for (let k = 0; k < n; k++) {
          const w = rng.float(2, Math.min(6, tw * 0.3)), d = rng.float(2, Math.min(6, td * 0.3));
          roofs.box(w, rng.float(1.2, 3.2), d, tcx + rng.float(-0.32, 0.32) * tw, ry, tcz + rng.float(-0.32, 0.32) * td, 0x45464c);
        }
        if (b.roof === 'vents') roofs.cyl(0.5, 0.5, 4, tcx + tw * 0.3, ry, tcz - td * 0.3, 0x6a6b70, 8);
      } else if (b.roof === 'garden' && tw > 10 && td > 10) {
        roofs.box(tw * 0.72, 0.25, td * 0.72, tcx, ry, tcz, 0x3f7a35);
        for (let k = 0; k < 5; k++) roofs.sphere(rng.float(0.9, 1.7), tcx + rng.float(-0.3, 0.3) * tw, ry + 1, tcz + rng.float(-0.3, 0.3) * td, 0x2f6a30, 1, 0.8, 1, 0);
      } else if (b.roof === 'pool' && tw > 12 && td > 12) {
        roofs.box(tw * 0.8, 0.2, td * 0.8, tcx, ry, tcz, 0xcfc6b6);
        pools.box(tw * 0.42, 0.12, td * 0.3, tcx, ry + 0.2, tcz, 0xffffff);
      } else if (b.roof === 'helipad' && tw > 16 && td > 16) {
        roofs.cyl(7, 7, 0.3, tcx, ry, tcz, 0x34353a, 20);
        roofs.box(0.7, 0.06, 5, tcx - 1.6, ry + 0.3, tcz, 0xe8e2d4); roofs.box(0.7, 0.06, 5, tcx + 1.6, ry + 0.3, tcz, 0xe8e2d4); roofs.box(3.2, 0.06, 0.7, tcx, ry + 0.3, tcz, 0xe8e2d4);
        for (let k = 0; k < 8; k++) neon.amber.sphere(0.22, tcx + Math.cos(k * 0.785) * 6.6, ry + 0.4, tcz + Math.sin(k * 0.785) * 6.6, 0xffffff, 1, 1, 1, 0);
      } else if (b.roof === 'tank' && tw > 7 && td > 7) {
        const x = tcx + tw * 0.2, z = tcz - td * 0.2;
        for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) roofs.cyl(0.1, 0.1, 2.2, x + dx * 1.1, ry, z + dz * 1.1, 0x3a3a3e, 5);
        roofs.cyl(1.6, 1.6, 2.6, x, ry + 2.2, z, 0x7a5a3e, 10);
        roofs.cone(1.9, 1.0, x, ry + 4.8, z, 0x5a4634, 10);
      }
      if (b.spire) {
        const sh = b.h * 0.2;
        roofs.cyl(0.25, 0.9, sh, tcx, ry, tcz, 0x55555c, 6);
        neon.coral.sphere(0.9, tcx, ry + sh + 0.6, tcz, 0xffffff, 1, 1, 1, 0);
      }
      if (b.billboard) {
        const useWall = block.district === 'strip' && street.length && rng.chance(0.6);
        const idx = rng.int(0, BILLBOARDS.length - 1);
        const u0 = (idx % BB_COLS) / BB_COLS, v1 = 1 - Math.floor(idx / BB_COLS) / BB_ROWS;
        const uvr = [u0, v1 - 1 / BB_ROWS, u0 + 1 / BB_COLS, v1];
        if (useWall) {
          const f = rng.pick(street);
          const span = Math.hypot(f.bx - f.ax, f.bz - f.az);
          const w = Math.min(22, span * 0.8), h = w / 2;
          if (base.y1 > SHOP_H + h + 2) {
            const cx = (f.ax + f.bx) / 2 + f.nx * 0.45, cz = (f.az + f.bz) / 2 + f.nz * 0.45;
            const cy = GY + Math.min(base.y1 - h / 2 - 1, SHOP_H + 2 + h / 2 + rng.float(0, 6));
            screens.add(cx, cy, cz, f.nz, -f.nx, w, h, uvr);
            frames.cbox(Math.abs(f.nz) * (w + 0.8) + 0.3, h + 0.8, Math.abs(f.nx) * (w + 0.8) + 0.3, cx - f.nx * 0.25, cy, cz - f.nz * 0.25, 0x1a1a1e);
            glow(block, f.f, BILLBOARDS[idx].fg, 2.2);
          }
        } else {
          const side = rng.int(0, 3);
          const heading = [0, Math.PI / 2, Math.PI, -Math.PI / 2][side];
          const fx = Math.sin(heading), fz = Math.cos(heading);
          const span = side % 2 === 0 ? tw : td;
          const w = Math.min(26, Math.max(10, span * 0.8)), h = w / 2;
          const ex = side % 2 === 0 ? td / 2 : tw / 2;
          const cx = tcx + fx * (ex - 0.6), cz = tcz + fz * (ex - 0.6), cy = ry + 2.4 + h / 2;
          screens.add(cx + fx * 0.3, cy, cz + fz * 0.3, Math.cos(heading), -Math.sin(heading), w, h, uvr);
          frames.box(w + 0.8, h + 0.8, 0.5, cx, cy - h / 2 - 0.4, cz, 0x1a1a1e, heading);
          const rx = Math.cos(heading), rz = -Math.sin(heading);
          for (const s of [-0.35, 0.35]) frames.box(0.5, 2.8, 0.5, cx + rx * w * s, ry - 0.2, cz + rz * w * s, 0x2a2a2e);
        }
      }
      addBox(b.x0, b.z0, b.x1, b.z1, 0, GY + b.h, { building: b });
    }
    void D;
  }

  // ---- materials ------------------------------------------------------------
  FACADE_STYLES.forEach((style, i) => {
    if (!facades[style].pos.length) return;
    const tx = makeFacade(style, 31 + i * 17);
    const mat = new THREE.MeshStandardMaterial({
      map: tx.map, emissiveMap: tx.emissive, emissive: 0xffffff, emissiveIntensity: 0.05,
      roughnessMap: tx.orm, metalnessMap: tx.orm, roughness: 1, metalness: 1, vertexColors: true, envMapIntensity: 1.25,
    });
    env.nightLerp(mat, 'emissiveIntensity', 0.03, 1.2);
    const mesh = new THREE.Mesh(facades[style].geometry(), mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  });
  {
    const tx = makeStorefronts(7);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(shopB.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(shopB.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(shopB.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(shopB.col, 3));
    const mat = new THREE.MeshStandardMaterial({
      map: tx.map, emissiveMap: tx.emissive, emissive: 0xffffff, emissiveIntensity: 0.3,
      roughnessMap: tx.orm, metalnessMap: tx.orm, roughness: 1, metalness: 1, vertexColors: true,
    });
    env.nightLerp(mat, 'emissiveIntensity', 0.2, 0.8);
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = true;
    group.add(m);
  }
  group.add(roofs.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })));
  const neonMats = {};
  for (const k of Object.keys(neon)) {
    const base = new THREE.Color(NEON[k]);
    const mat = new THREE.MeshBasicMaterial({ color: base.clone(), toneMapped: false });
    for (const ch of ['r', 'g', 'b']) env.nightLerp(mat.color, ch, base[ch] * 0.9, base[ch] * 2.4);
    neonMats[k] = mat;
  }
  // blade signs (additive, HDR at night)
  {
    const mat = new THREE.MeshBasicMaterial({ map: signAtlas.map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    env.nightLerp(mat.color, 'r', 0.75, 2.3); env.nightLerp(mat.color, 'g', 0.75, 2.3); env.nightLerp(mat.color, 'b', 0.75, 2.3);
    const m = new THREE.Mesh(blades.geometry(), mat);
    m.renderOrder = 3;
    group.add(m);
  }

  // ---- storefront glow feeds the lighting shader -------------------------------
  const nzBlocks = CITY.zs.length - 1;
  for (const block of blocks) {
    const strength = { strip: 1, ocean: 0.7, downtown: 0.6, midtown: 0.6, oldtown: 0.45, riverside: 0.4, uptown: 0.4, docks: 0.25 }[block.district];
    for (const f of ['w', 'e', 'n', 's']) {
      const e = faceGlow.get(`${block.i},${block.j},${f}`);
      if (!e || e.w <= 0) continue;
      const c = new THREE.Color(e.r / e.w, e.g / e.w, e.b / e.w);
      // push the hue: averaged colours go muddy
      const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, Math.min(1, hsl.s * 1.25 + 0.1), Math.min(0.62, hsl.l));
      const k = Math.min(1, strength * (0.45 + e.w * 0.18));
      if (f === 'w') setNeon('z', block.i, block.j, 1, c, k);
      else if (f === 'e') setNeon('z', block.i + 1, block.j, 0, c, k);
      else if (f === 'n') setNeon('x', block.j, block.i, 1, c, k);
      else setNeon('x', block.j + 1, block.i, 0, c, k);
    }
  }
  void nzBlocks;

  // ---- ground: paving slabs, parks, plazas, parking ---------------------------
  const paveRects = [], lawnRects = [];
  const lots = new Batch(), lines = new Batch(), deco = new Batch();
  const holoGroup = new THREE.Group();
  const holos = [];
  for (const bl of blocks) {
    (bl.park ? lawnRects : paveRects).push([bl.x0, bl.z0, bl.x1, bl.z1]);
    const w = bl.x1 - bl.x0, d = bl.z1 - bl.z0;
    if (bl.park) {
      deco.box(w - 8, 0.05, 4.5, bl.cx, GY, bl.cz, 0xcfc6b4);
      deco.box(4.5, 0.05, d - 8, bl.cx, GY, bl.cz, 0xcfc6b4);
      deco.cyl(9.5, 9.5, 0.5, bl.cx, GY, bl.cz, 0xcfc6b6, 24);
      pools.cyl(8, 8, 0.56, bl.cx, GY, bl.cz, 0xffffff, 24);
      deco.cyl(0.8, 1.3, 3.4, bl.cx, GY, bl.cz, 0xd9cfbd, 8);
      deco.cyl(2.2, 0.6, 0.4, bl.cx, GY + 3.4, bl.cz, 0xd9cfbd, 10);
      addCircle(bl.cx, bl.cz, 9.4, 0, GY + 0.9, {});
      for (let k = 0; k < 26; k++) {
        const px = rng.float(bl.x0 + 7, bl.x1 - 7), pz = rng.float(bl.z0 + 7, bl.z1 - 7);
        if (Math.abs(px - bl.cx) < 5 || Math.abs(pz - bl.cz) < 5 || Math.hypot(px - bl.cx, pz - bl.cz) < 13) continue;
        parkSpots.push({ x: px, z: pz });
      }
      for (const [dx, dz, h] of [[14, 3.5, 0], [-14, 3.5, 0], [3.5, 14, Math.PI / 2], [3.5, -14, Math.PI / 2], [26, -3.5, Math.PI], [-26, -3.5, Math.PI]]) benchSpots.push({ x: bl.cx + dx, z: bl.cz + dz, heading: h });
      for (const [dx, dz] of [[20, 4], [-20, -4], [4, 22], [-4, -22], [32, -4], [-32, 4]]) parkLamps.push({ x: bl.cx + dx, z: bl.cz + dz });
    }
    if (bl.plaza) {
      // concentric paving, planters and a hologram on a plinth
      deco.cyl(22, 22, 0.06, bl.cx, GY, bl.cz, 0xc9c0ae, 32);
      deco.cyl(14, 14, 0.1, bl.cx, GY, bl.cz, 0x8f8a80, 32);
      deco.cyl(3.2, 3.8, 1.2, bl.cx, GY, bl.cz, 0x2c2c30, 12);
      neon.cyan.cyl(3.3, 3.3, 0.14, bl.cx, GY + 1.2, bl.cz, 0xffffff, 12);
      addCircle(bl.cx, bl.cz, 3.8, 0, GY + 3, {});
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + 0.39, r = 27;
        const px = bl.cx + Math.cos(a) * r, pz = bl.cz + Math.sin(a) * r;
        deco.box(3.2, 0.7, 3.2, px, GY, pz, 0x8c867a);
        addBox(px - 1.6, pz - 1.6, px + 1.6, pz + 1.6, 0, GY + 0.8, {});
        parkSpots.push({ x: px, z: pz, planter: true });
        benchSpots.push({ x: bl.cx + Math.cos(a + 0.39) * 19, z: bl.cz + Math.sin(a + 0.39) * 19, heading: -a - 0.39 + Math.PI / 2 });
      }
      for (let k = 0; k < 4; k++) parkLamps.push({ x: bl.cx + Math.cos(k * 1.57 + 0.78) * 33, z: bl.cz + Math.sin(k * 1.57 + 0.78) * 33 });
      holos.push({ x: bl.cx, z: bl.cz, kind: holos.length % 2 ? 'globe' : 'spark', block: bl });
    }
    if (bl.lot) {
      const L = bl.lot;
      lots.box(L.x1 - L.x0, 0.04, L.z1 - L.z0, (L.x0 + L.x1) / 2, GY, (L.z0 + L.z1) / 2, 0x38383c);
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
      for (const [dx, dz] of [[-0.3, -0.3], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3]]) parkLamps.push({ x: (L.x0 + L.x1) / 2 + dx * (L.x1 - L.x0), z: (L.z0 + L.z1) / 2 + dz * (L.z1 - L.z0) });
    }
  }
  const paving = makePavingTexture();
  const paveMat = new THREE.MeshStandardMaterial({ map: paving.map, roughnessMap: paving.rough, roughness: 1, metalness: 0 });
  paveMat.defines = { ...paveMat.defines, WET_SURFACE: '' };
  const paveMesh = new THREE.Mesh(slabGeometry(paveRects, CITY.y - 0.5, GY), paveMat);
  paveMesh.receiveShadow = true;
  group.add(paveMesh);
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x4d8a3a, map: makeNoiseTexture(21, 256, 0.3), roughness: 0.95 });
  const lawn = new THREE.Mesh(slabGeometry(lawnRects, CITY.y - 0.5, GY, 9), lawnMat);
  lawn.receiveShadow = true;
  group.add(lawn);
  // beach boardwalk
  {
    const p = CITY.promenade;
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, map: makeNoiseTexture(33, 256, 0.35), roughness: 0.85 });
    const m = new THREE.Mesh(slabGeometry([[p.x0, p.z0, p.x1, p.z1]], CITY.y - 1.2, GY, 3), boardMat);
    m.receiveShadow = true;
    group.add(m);
    for (let z = p.z0 + 30; z < p.z1 - 20; z += 46) benchSpots.push({ x: p.x1 - 2.2, z, heading: -Math.PI / 2 });
  }
  const flatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
  group.add(deco.mesh(flatMat, { shadow: false }));
  if (!lots.empty) { const lm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }); lm.defines = { ...lm.defines, WET_SURFACE: '' }; group.add(lots.mesh(lm, { shadow: false })); }
  if (!lines.empty) group.add(lines.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), { shadow: false }));

  // ---- plaza holograms -------------------------------------------------------
  const holoMat = (hex) => new THREE.LineBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(1.6), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  for (const h of holos) {
    const g = new THREE.Group();
    const hex = h.kind === 'globe' ? PAL.neonCyan : PAL.neonCoral;
    if (h.kind === 'globe') {
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(7, 2)), holoMat(hex)));
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 64 }, (_, k) => new THREE.Vector3(Math.cos(k / 64 * 6.283) * 10, 0, Math.sin(k / 64 * 6.283) * 10))), holoMat(PAL.neonAmber));
      ring.rotation.x = 0.4;
      g.add(ring);
    } else {
      const lens = [1, 0.72, 0.9, 0.66, 1, 0.75, 0.88, 0.7, 1, 0.68, 0.92, 0.74];
      for (let i = 0; i < 12; i++) {
        const len = 8 * lens[i];
        const ray = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.9, len, 0.9)), holoMat(hex));
        const a = (i / 12) * Math.PI * 2;
        ray.position.set(Math.sin(a) * (len / 2 + 1.2), Math.cos(a) * (len / 2 + 1.2), 0);
        ray.rotation.z = -a;
        g.add(ray);
      }
    }
    // projector beam
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 2.6, 11, 20, 1, true), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    beam.position.set(h.x, GY + 6.8, h.z);
    holoGroup.add(beam);
    g.position.set(h.x, GY + 14, h.z);
    holoGroup.add(g);
    h.obj = g;
  }
  group.add(holoGroup);

  // ---- Token Dome ------------------------------------------------------------
  const domeBlock = blocks.find((b) => b.dome);
  if (domeBlock) {
    const { cx, cz } = domeBlock;
    const db = new Batch();
    db.cyl(37, 37, 11, cx, GY, cz, 0xe6ddcb, 40);
    db.cyl(38, 38, 1.2, cx, GY + 11, cz, PAL.terracotta, 40);
    db.add(new THREE.SphereGeometry(36.5, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0xf0e8d8, cx, GY + 12, cz, 0, 0, 0, 1, 0.5, 1);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      db.box(1.6, 12.5, 2.4, cx + Math.cos(a) * 37.6, GY, cz + Math.sin(a) * 37.6, PAL.terracotta, -a);
    }
    db.cyl(3, 3, 3, cx, GY + 30, cz, PAL.slate, 12);
    group.add(db.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.1 })));
    neon.amber.cyl(38.3, 38.3, 0.35, cx, GY + 12.3, cz, 0xffffff, 40);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(38.4, 0.3, 6, 64), neonMats.amber);
    ring.rotation.x = Math.PI / 2; ring.position.set(cx, GY + 12.6, cz);
    group.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(26, 0.25, 6, 48), neonMats.coral);
    ring2.rotation.x = Math.PI / 2; ring2.position.set(cx, GY + 24.6, cz);
    group.add(ring2);
    addCircle(cx, cz, 38, 0, GY + 30, {});
    addSign(group, 'TOKEN DOME', cx, GY + 7.5, cz - 38.2, Math.PI, 26, '#ffb347', 'tonight: bots vs. humans');
    addSign(group, 'TOKEN DOME', cx, GY + 7.5, cz + 38.2, 0, 26, '#ffb347', 'tonight: bots vs. humans');
    setNeon('z', domeBlock.i, domeBlock.j, 1, new THREE.Color(PAL.neonAmber), 0.9);
    setNeon('z', domeBlock.i + 1, domeBlock.j, 0, new THREE.Color(PAL.neonAmber), 0.9);
    setNeon('x', domeBlock.j, domeBlock.i, 1, new THREE.Color(PAL.neonAmber), 0.9);
    setNeon('x', domeBlock.j + 1, domeBlock.i, 0, new THREE.Color(PAL.neonAmber), 0.9);
  }

  // ---- Claude Tower ----------------------------------------------------------
  const tower = blocks.find((b) => b.kind === 'tower').tower;
  const tcx = (tower.x0 + tower.x1) / 2, tcz = (tower.z0 + tower.z1) / 2;
  const fins = new Batch();
  for (const t of tower.tiers) {
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      fins.box(2.4, t.y1 - t.y0, 2.4, sx > 0 ? t.x1 : t.x0, GY + t.y0, sz > 0 ? t.z1 : t.z0, PAL.terracotta);
    }
  }
  const topY = GY + tower.h;
  fins.cyl(7, 9, 5, tcx, topY, tcz, PAL.slate, 12);
  fins.cyl(1.2, 1.6, 22, tcx, topY + 5, tcz, PAL.slateLight, 8);
  group.add(fins.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.2 })));

  const sparkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonCoral).multiplyScalar(2.4), toneMapped: false });
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
  const halo = new THREE.Mesh(new THREE.TorusGeometry(34, 0.5, 6, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonAmber).multiplyScalar(1.7), toneMapped: false }));
  halo.position.copy(spark.position);
  halo.rotation.x = Math.PI / 2;
  group.add(halo);

  const vc = makeCanvas(128, 1024);
  const vg = vc.getContext('2d');
  vg.fillStyle = '#17110d'; vg.fillRect(0, 0, 128, 1024);
  drawSpark(vg, 64, 80, 46, '#ff8a5c');
  vg.fillStyle = '#ff8a5c'; vg.textAlign = 'center'; vg.textBaseline = 'middle';
  vg.font = `900 110px ${UI_FONT}`;
  'CLAUDE'.split('').forEach((ch, i) => vg.fillText(ch, 64, 230 + i * 140));
  const vmat = new THREE.MeshBasicMaterial({ map: canvasToTexture(vc, { repeat: false }), toneMapped: false });
  env.nightLerp(vmat.color, 'r', 1.0, 1.9); env.nightLerp(vmat.color, 'g', 1.0, 1.9); env.nightLerp(vmat.color, 'b', 1.0, 1.9);
  const shaft = tower.tiers[0];
  for (const [dx, dz, ry] of [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 72), vmat);
    m.position.set(tcx + dx * ((shaft.x1 - shaft.x0) / 2 + 0.3), GY + Math.min(shaft.y1 - 40, 84), tcz + dz * ((shaft.z1 - shaft.z0) / 2 + 0.3));
    m.rotation.y = ry;
    group.add(m);
  }
  const sculpt = spark.clone();
  sculpt.scale.setScalar(0.11);
  sculpt.position.set(tcx, GY + 5.2, tower.z1 + 12);
  group.add(sculpt);
  const ped = new Batch();
  ped.cyl(1.6, 2, 1.4, tcx, GY, tower.z1 + 12, PAL.cream, 10);
  group.add(ped.mesh(new THREE.MeshStandardMaterial({ vertexColors: true })));
  addBox(tcx - 1.8, tower.z1 + 10.2, tcx + 1.8, tower.z1 + 13.8, 0, GY + 8, {});

  // ---- POI signs --------------------------------------------------------------
  const signFor = (kind, text, fg, sub) => {
    const b = buildings.find((x) => x.kind === kind);
    if (!b) return;
    const cx = (b.x0 + b.x1) / 2;
    const w = Math.min(22, b.x1 - b.x0 - 4), y = GY + Math.min(b.h - 2, 7.6);
    addSign(group, text, cx, y, b.z0 - 0.45, Math.PI, w, fg, sub);
    addSign(group, text, cx, y, b.z1 + 0.45, 0, w, fg, sub);
  };
  signFor('safehouse', 'CONTEXT WINDOW LOFTS', '#ffb347', 'safehouse · wardrobe · garage');
  signFor('police', 'SAFETY CENTER', '#6ab6ff', 'anthropic police department');
  signFor('clinic', 'CONSTITUTIONAL CARE', '#ff8a5c', 'clinic · open 24h');
  signFor('retune', 'RE-TUNE GARAGE', '#ffb347', 'repair · respray · reset your flags');
  signFor('supply', 'PROMPT SUPPLY CO.', '#5ff3ff', 'gadgets · armor · charges');
  signFor('vanta', 'VANTABLACK LABS', '#ff5fd8', 'executive parking only');

  // ---- screens ---------------------------------------------------------------
  const atlas = makeBillboardAtlas();
  const screenMat = makeScreenMaterial(atlas);
  env.nightLerp(screenMat.uniforms.uBright, 'value', 0.95, 2.0);
  group.add(new THREE.Mesh(screens.geometry(), screenMat));
  group.add(frames.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })));

  // emissive batches are built last: parks, plazas and the dome add to them
  for (const k of Object.keys(neon)) if (!neon[k].empty) group.add(neon[k].mesh(neonMats[k], { shadow: false, receive: false }));
  if (!pools.empty) {
    const pm = new THREE.MeshBasicMaterial({ color: 0x35d6e0, toneMapped: false });
    env.nightLerp(pm.color, 'r', 0.16, 0.3); env.nightLerp(pm.color, 'g', 0.62, 1.7); env.nightLerp(pm.color, 'b', 0.7, 1.9);
    group.add(pools.mesh(pm, { shadow: false, receive: false }));
  }

  scene.add(group);
  return {
    group, atlas, screenMat, neonMats, paveMat,
    update(dt, t) {
      spark.rotation.y += dt * 0.35;
      sculpt.rotation.y -= dt * 0.6;
      halo.rotation.z += dt * 0.1;
      screenMat.uniforms.uTime.value = t;
      for (const h of holos) { h.obj.rotation.y += dt * 0.5; h.obj.position.y = GY + 14 + Math.sin(t * 0.8 + h.x) * 0.6; }
    },
  };
}
