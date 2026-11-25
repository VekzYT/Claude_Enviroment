// Procedurally painted canvas textures (no image files needed).
import * as THREE from 'three';
import { RNG } from '../util/rng.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function tex(c, { repeat = true, srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}
// A height canvas (white = high) turned into a tangent-space normal map.
export function normalFromCanvas(c, strength = 2.5, { repeat = true, aniso = 8 } = {}) {
  const w = c.width, h = c.height, src = c.getContext('2d').getImageData(0, 0, w, h).data;
  const out = new Uint8Array(w * h * 4);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = ((H(x - 1, y) - H(x + 1, y)) / 255) * strength, dy = ((H(x, y + 1) - H(x, y - 1)) / 255) * strength;
    const l = 1 / Math.hypot(dx, dy, 1), o = ((h - 1 - y) * w + x) * 4;   // rows flipped to match canvas textures
    out[o] = (dx * l * 0.5 + 0.5) * 255; out[o + 1] = (dy * l * 0.5 + 0.5) * 255; out[o + 2] = (l * 0.5 + 0.5) * 255; out[o + 3] = 255;
  }
  const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}
// Tiling value-noise field, 0..1, as a Float32Array (octaves: [[cells, weight], ...]).
function noiseField(size, seed, octs) {
  const rng = new RNG(seed);
  const out = new Float32Array(size * size);
  let total = 0;
  for (const [n, wgt] of octs) {
    total += wgt;
    const l = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) l[i] = rng.next();
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const fx = (x / size) * n, fy = (y / size) * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = l[(iy % n) * n + (ix % n)], b = l[(iy % n) * n + ((ix + 1) % n)], c = l[((iy + 1) % n) * n + (ix % n)], d = l[((iy + 1) % n) * n + ((ix + 1) % n)];
      out[y * size + x] += wgt * ((a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy);
    }
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}
// The world-space grain every matte surface can opt into (see citylight.js):
// RG = normal, B = slow colour mottling, A = fine roughness noise.
let grainTex = null;
export function makeGrainTexture() {
  if (grainTex) return grainTex;
  const S = 256;
  const fine = noiseField(S, 11, [[32, 0.3], [64, 0.35], [128, 0.35]]);
  const mott = noiseField(S, 23, [[4, 0.5], [8, 0.3], [16, 0.2]]);
  const out = new Uint8Array(S * S * 4);
  const F = (x, y) => fine[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (F(x - 1, y) - F(x + 1, y)) * 3.2, dy = (F(x, y - 1) - F(x, y + 1)) * 3.2, l = 1 / Math.hypot(dx, dy, 1), o = (y * S + x) * 4;
    out[o] = (dx * l * 0.5 + 0.5) * 255; out[o + 1] = (dy * l * 0.5 + 0.5) * 255;
    out[o + 2] = Math.min(255, mott[y * S + x] * 255); out[o + 3] = Math.min(255, fine[y * S + x] * 255);
  }
  const t = new THREE.DataTexture(out, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  grainTex = t;
  return t;
}

const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
export const UI_FONT = FONT;

// Three canvases painted in lock-step: colour, emissive, and roughness(G)/metalness(B).
class Layers {
  constructor(w, h, es = 0.5) {
    this.w = w; this.h = h;
    this.col = canvas(w, h); this.emi = canvas(w * es, h * es); this.orm = canvas(w * es, h * es); this.hgt = canvas(w * es, h * es);
    this.g = this.col.getContext('2d'); this.ge = this.emi.getContext('2d'); this.go = this.orm.getContext('2d');
    this.gh = this.hgt.getContext('2d', { willReadFrequently: true });
    this.ge.scale(es, es); this.go.scale(es, es); this.gh.scale(es, es);
    this.gh.fillStyle = '#808080'; this.gh.fillRect(0, 0, w, h);
    this.bumpK = 3;
    this.ge.fillStyle = '#000'; this.ge.fillRect(0, 0, w, h);
  }
  // rough/metal 0..1
  static rm(r, m) { return `rgb(255,${Math.round(r * 255)},${Math.round(m * 255)})`; }
  // lift: surface height 0..1 (0.5 = the wall plane); it becomes the normal map
  rect(x, y, w, h, color, rough = 0.85, metal = 0, lift = 0.5) {
    this.g.fillStyle = color; this.g.fillRect(x, y, w, h);
    this.go.fillStyle = Layers.rm(rough, metal); this.go.fillRect(x, y, w, h);
    this.ge.fillStyle = '#000'; this.ge.fillRect(x, y, w, h);
    this.bump(x, y, w, h, lift);
  }
  bump(x, y, w, h, lift) { const v = Math.round(lift * 255); this.gh.fillStyle = `rgb(${v},${v},${v})`; this.gh.fillRect(x, y, w, h); }
  glow(x, y, w, h, color, alpha = 1) {
    this.ge.globalAlpha = alpha; this.ge.fillStyle = color; this.ge.fillRect(x, y, w, h); this.ge.globalAlpha = 1;
  }
  textures() {
    return { map: tex(this.col), emissive: tex(this.emi), orm: tex(this.orm, { srgb: false }), normal: normalFromCanvas(this.hgt, this.bumpK) };
  }
}

// interior light: soft whites, a little warm, a little cool — no saturated colour
const WARM = ['#fff0d8', '#ffe6c4', '#fff6e8', '#ffecd0', '#fffaf0'];
const COOL = ['#eef8ff', '#e2f2ff', '#f4fbff', '#dcefff'];

function windowPane(L, rng, x, y, w, h, litChance, opts = {}) {
  const { frame = 3, glassTone = 1 } = opts;
  // frame
  L.rect(x, y, w, h, '#2a2c30', 0.5, 0.4, 0.62);
  const gx = x + frame, gy = y + frame, gw = w - frame * 2, gh = h - frame * 2;
  const v = (150 + rng.int(0, 60)) * glassTone;
  L.rect(gx, gy, gw, gh, `rgb(${v * 0.78 | 0},${v * 0.9 | 0},${v | 0})`, 0.06 + rng.next() * 0.08, 1, opts.recess ?? 0.24);
  // sky-gradient hint so glass reads as glass even without reflections
  const gr = L.g.createLinearGradient(0, gy, 0, gy + gh);
  gr.addColorStop(0, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(0,10,25,0.22)');
  L.g.fillStyle = gr; L.g.fillRect(gx, gy, gw, gh);
  if (rng.next() < litChance) {
    const c = rng.next() < 0.78 ? rng.pick(WARM) : rng.pick(COOL);
    const a = 0.5 + rng.next() * 0.5;
    L.glow(gx, gy, gw, gh, c, a);
    // interior: blinds or a darker lower third (furniture)
    const kind = rng.next();
    L.ge.fillStyle = 'rgba(0,0,0,0.35)';
    if (kind < 0.35) for (let k = 0; k < gh; k += 7) L.ge.fillRect(gx, gy + k, gw, 2.5);
    else if (kind < 0.7) L.ge.fillRect(gx, gy + gh * 0.62, gw, gh * 0.38);
    else L.ge.fillRect(gx + gw * rng.float(0.1, 0.6), gy + gh * 0.3, gw * 0.25, gh * 0.7);
    // light roughens the look of the glass a little from outside
    L.g.globalAlpha = 0.35; L.g.fillStyle = c; L.g.fillRect(gx, gy, gw, gh); L.g.globalAlpha = 1;
    L.go.fillStyle = Layers.rm(0.25, 0.3); L.go.fillRect(gx, gy, gw, gh);
  }
  // Red channel of the roughness/metal map = 0 marks glass: the facade shader puts a room behind it.
  L.go.globalCompositeOperation = 'multiply';
  L.go.fillStyle = 'rgb(0,255,255)'; L.go.fillRect(gx, gy, gw, gh);
  L.go.globalCompositeOperation = 'source-over';
}

// One tile = 8 bays x 8 floors (28 m x 28 m).
export function makeFacade(style, seed) {
  const rng = new RNG(seed);
  const S = 1024, N = 8, c = S / N;
  const L = new Layers(S, S);
  L.rect(0, 0, S, S, '#f4f1ea', 0.86, 0, 0.56);
  // wall grain, in colour and in relief
  for (let i = 0; i < 2600; i++) {
    const v = rng.int(205, 255), x = rng.float(0, S), y = rng.float(0, S), w = rng.float(2, 9), h = rng.float(1, 4);
    L.g.fillStyle = `rgba(${v},${v},${v},0.5)`;
    L.g.fillRect(x, y, w, h);
    L.gh.fillStyle = `rgba(${v > 230 ? 255 : 0},${v > 230 ? 255 : 0},${v > 230 ? 255 : 0},0.06)`;
    L.gh.fillRect(x, y, w, h);
  }
  // weathering: faint streaks running down from each floor line
  for (let i = 0; i < 90; i++) {
    const x = rng.float(0, S), y = Math.floor(rng.float(0, N)) * c + rng.float(-6, 10), len = rng.float(20, 90);
    const gr = L.g.createLinearGradient(0, y, 0, y + len);
    gr.addColorStop(0, `rgba(70,66,60,${rng.float(0.05, 0.13)})`); gr.addColorStop(1, 'rgba(70,66,60,0)');
    L.g.fillStyle = gr; L.g.fillRect(x, y, rng.float(3, 14), len);
  }
  for (let fy = 0; fy < N; fy++) {
    const floorLit = 0.1 + rng.next() * 0.55;
    const y0 = fy * c;
    if (style === 'grid') {
      for (let fx = 0; fx < N; fx++) windowPane(L, rng, fx * c + 22, y0 + 26, c - 44, c - 56, floorLit);
      L.rect(0, y0 + c - 10, S, 6, '#d6d0c4', 0.9, 0, 0.82);           // string course
      for (let fx = 0; fx < N; fx++) L.rect(fx * c + 16, y0 + c - 34, c - 32, 6, '#e2ddd2', 0.85, 0, 0.9);   // sills
    } else if (style === 'glass') {
      L.rect(0, y0 + c - 18, S, 18, '#c9cdd2', 0.35, 0.8, 0.6);        // spandrel
      for (let fx = 0; fx < N; fx++) windowPane(L, rng, fx * c + 1, y0, c - 2, c - 18, floorLit * 0.8, { frame: 2, recess: 0.44 });
    } else if (style === 'bands') {
      L.rect(0, y0 + 22, S, c - 62, '#2a2c30', 0.5, 0.4, 0.3);
      for (let fx = 0; fx < N; fx += 2) windowPane(L, rng, fx * c + 2, y0 + 24, c * 2 - 4, c - 66, floorLit, { frame: 2, recess: 0.2 });
      L.rect(0, y0 + c - 34, S, 4, '#bdb6a8', 0.9, 0, 0.85);
      L.rect(0, y0 + 14, S, 5, '#e6e1d6', 0.9, 0, 0.8);
    } else if (style === 'fins') {
      for (let fx = 0; fx < N; fx++) {
        windowPane(L, rng, fx * c + 34, y0 + 8, c - 68, c - 16, floorLit, { frame: 3 });
        L.rect(fx * c - 6, y0, 12, c, '#e2dccf', 0.8, 0, 1.0);         // vertical pier
        // balcony slab and its glass rail
        L.rect(fx * c + 26, y0 + c - 12, c - 52, 9, '#b9b2a4', 0.8, 0, 0.95);
        L.rect(fx * c + 28, y0 + c - 34, c - 56, 22, 'rgba(170,200,214,0.5)', 0.1, 0.9, 0.8);
      }
    } else if (style === 'panel') {
      for (let fx = 0; fx < N; fx++) {
        const r = rng.next();
        L.bump(fx * c, y0, c, c, 0.34);                                  // panel joints sit back
        if (r < 0.62) windowPane(L, rng, fx * c + 4, y0 + 4, c - 8, c - 8, floorLit * 0.7, { frame: 2, glassTone: 0.85, recess: 0.4 });
        else if (r < 0.85) L.rect(fx * c + 4, y0 + 4, c - 8, c - 8, rng.pick(['#d9d4ca', '#bfc3c8', '#8f949b']), 0.4, 0.7, 0.62);
        else {
          L.rect(fx * c + 4, y0 + 4, c - 8, c - 8, '#3a3d44', 0.5, 0.6, 0.4);
          for (let k = 0; k < 5; k++) L.rect(fx * c + 12, y0 + 16 + k * 20, c - 24, 8, '#22242a', 0.6, 0.5, 0.75); // louvres
        }
      }
      if (fy % 2 === 0) L.rect(0, y0 + c - 4, S, 4, '#eef1f3', 0.35, 0.6);
    } else if (style === 'diagrid') {
      // all glass, floor by floor; the lattice is painted over the top afterwards
      for (let fx = 0; fx < N; fx++) windowPane(L, rng, fx * c, y0 + 2, c, c - 6, floorLit * 0.75, { frame: 1, recess: 0.42 });
      L.rect(0, y0 + c - 5, S, 5, '#cfd6dc', 0.3, 0.8, 0.6);
    } else if (style === 'brick') {
      // courses: mortar lines in colour and relief, bricks staggered row to row
      L.g.fillStyle = 'rgba(120,90,70,0.2)';
      for (let k = 0; k < c; k += 9) {
        L.g.fillRect(0, y0 + k, S, 1.5); L.bump(0, y0 + k, S, 2, 0.38);
        for (let bx = (Math.round(k / 9) % 2) * 13; bx < S; bx += 26) { L.g.fillRect(bx, y0 + k, 1.5, 9); L.bump(bx, y0 + k, 2, 9, 0.4); }
      }
      for (let fx = 0; fx < N; fx++) {
        const wx = fx * c + 30, ww = c - 60;
        windowPane(L, rng, wx, y0 + 22, ww, c - 52, floorLit, { frame: 5 });
        L.rect(wx - 8, y0 + c - 30, ww + 16, 8, '#d9d2c2', 0.9, 0, 0.92);  // sill
        L.rect(wx - 6, y0 + 14, ww + 12, 8, '#e0d9ca', 0.9, 0, 0.86);      // lintel
        if (rng.next() < 0.3) { L.rect(wx, y0 + 22, ww * 0.5, c - 52, '#5b7a72', 0.8, 0, 0.72); for (let k = 0; k < c - 52; k += 6) L.bump(wx, y0 + 22 + k, ww * 0.5, 2, 0.6); } // shutter
        if (rng.next() < 0.22) { // balcony rail
          L.rect(wx - 14, y0 + c - 46, ww + 28, 3, '#2c2c30', 0.5, 0.6, 0.95);
          for (let k = 0; k <= ww + 28; k += 9) L.rect(wx - 14 + k, y0 + c - 46, 2, 18, '#2c2c30', 0.5, 0.6, 0.9);
        }
      }
    }
  }
  if (style === 'glass') { for (let fx = 0; fx <= N; fx++) L.rect(fx * c - 2, 0, 4, S, '#e9edf0', 0.3, 0.9, 0.9); }
  if (style === 'diagrid') {
    // structural lattice: diamonds two bays wide and four floors tall, in warm bronze
    const strut = (ctx, color, w) => {
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'butt';
      ctx.beginPath();
      for (let k = -4; k <= 8; k++) {
        ctx.moveTo(k * 256, 0); ctx.lineTo(k * 256 + 512, S);
        ctx.moveTo(k * 256, 0); ctx.lineTo(k * 256 - 512, S);
      }
      ctx.stroke();
    };
    strut(L.g, '#b9825a', 20);
    strut(L.g, '#d6a47c', 7);
    strut(L.go, Layers.rm(0.38, 0.75), 20);
    strut(L.ge, '#000000', 20);
    strut(L.gh, '#ffffff', 20);
    for (const y of [0, S / 2]) L.rect(0, y - 6, S, 12, '#c79068', 0.4, 0.7, 1.0);
  }
  return L.textures();
}
export const FACADE_STYLES = ['grid', 'glass', 'bands', 'fins', 'panel', 'brick', 'diagrid'];

export const SHOP_NAMES = [
  ['TOKEN TACOS', '#ffb347'], ['CONTEXT CAFÉ', '#ffd9a0'], ['LATENT SPACE BAR', '#ff5fd8'], ['FINE-TUNE BARBER', '#5ff3ff'],
  ['HAIKU NOODLES', '#ff7a59'], ['OPUS BOOKS', '#ffe8c4'], ['SONNET FLORIST', '#b4ff5c'], ['ATTENTION SPAN ARCADE', '#ff5fd8'],
  ['GRADIENT GELATO', '#8fe1ff'], ['BAYOU BYTES', '#b4ff5c'], ['EMBEDDINGS TATTOO', '#ff4d6d'], ['PARAMETER PIZZA', '#ffb347'],
  ['WEIGHTS & MEASURES GYM', '#5ff3ff'], ['ZERO-SHOT ESPRESSO', '#ffd9a0'], ['HALLUCINATION KARAOKE', '#c77dff'],
  ['SAFETY FIRST PHARMACY', '#7dffb0'], ['TEMP 0.7 SAUNA', '#ff7a59'], ['PROMPT & CIRCUMSTANCE', '#ffe8c4'],
  ['SYSTEM PROMPT TAILORS', '#8fe1ff'], ['EPOCH VINTAGE', '#ffb347'], ['THE LOSS FUNCTION PUB', '#ff7a59'], ['SOFTMAX SOFT SERVE', '#ff9ad5'],
];

// Which shop sits in each bay of the ground-floor atlas: [name, sign colour, interior type].
// Rows: 0 retail, 1 food, 2 lobbies, 3 industrial shutters, 4 retail, 5 food.
export const SHOP_ROWS = [
  [['OPUS BOOKS', '#d9b26a', 'books'], ['PROMPT & CIRCUMSTANCE', '#c8643b', 'clothes'], ['SONNET FLORIST', '#6aa84f', 'florist'], ['FINE-TUNE BARBER', '#4a8fd0', 'barber'], ['SAFETY FIRST PHARMACY', '#2ea86b', 'market'], ['ATTENTION SPAN ARCADE', '#c94fb8', 'arcade']],
  [['CONTEXT CAFÉ', '#b9825a', 'cafe'], ['HAIKU NOODLES', '#d9603b', 'bar'], ['TOKEN TACOS', '#e0a530', 'diner'], ['LATENT SPACE BAR', '#a14fc9', 'bar'], ['GRADIENT GELATO', '#4ab8d0', 'cafe'], ['PARAMETER PIZZA', '#d9603b', 'diner']],
  [[null, null, 'lobby'], [null, null, 'lobby'], [null, null, 'lobby'], [null, null, 'lobby']],
  null,
  [['EPOCH VINTAGE', '#e0a530', 'clothes'], ['BAYOU BYTES', '#2ea86b', 'tech'], ['EMBEDDINGS TATTOO', '#d9486e', 'gallery'], ['WEIGHTS & MEASURES GYM', '#4a8fd0', 'gym'], ['SYSTEM PROMPT TAILORS', '#6a7f9a', 'clothes'], ['GROUND TRUTH GROCER', '#6aa84f', 'market']],
  [['ZERO-SHOT ESPRESSO', '#b9825a', 'cafe'], ['THE LOSS FUNCTION PUB', '#d9603b', 'bar'], ['SOFTMAX SOFT SERVE', '#e07aa8', 'cafe'], ['HALLUCINATION KARAOKE', '#a14fc9', 'bar'], ['BEAM SEARCH BAKERY', '#d9b26a', 'cafe'], ['DROPOUT DINER', '#c8643b', 'diner']],
];
export const SHOP_ATLAS_ROWS = SHOP_ROWS.length;

// Ground-floor strip atlas; one tile = 36 m x 4.5 m.
export function makeStorefronts(seed = 7) {
  const rng = new RNG(seed);
  const W = 2048, RH = 256, L = new Layers(W, RH * SHOP_ATLAS_ROWS);
  for (let row = 0; row < SHOP_ATLAS_ROWS; row++) {
    const y0 = row * RH;
    const wall = ['#f1efea', '#ece6dc', '#eef1f4', '#c9c9cb', '#efece4', '#ebe4d8'][row];
    L.rect(0, y0, W, RH, wall, 0.85, 0, 0.56);
    L.rect(0, y0 + RH - 22, W, 22, '#9a9892', 0.9, 0, 0.72);           // plinth
    const bays = row === 2 ? 4 : 6;
    const bw = W / bays;
    for (let b = 0; b < bays; b++) {
      const x0 = b * bw;
      if (row === 3) {
        // roller shutters and a loading door
        const sx = x0 + 26, sw = bw - 52;
        L.rect(sx, y0 + 46, sw, RH - 68, '#7d838a', 0.55, 0.7, 0.42);
        for (let k = 0; k < RH - 68; k += 9) L.rect(sx, y0 + 46 + k, sw, 2, '#5e646b', 0.6, 0.7, 0.2);
        if (rng.next() < 0.5) { L.rect(sx + 10, y0 + 18, sw - 20, 20, '#2b2d31', 0.6, 0.3); L.glow(sx + 10, y0 + 18, sw - 20, 20, '#ffb347', 0.5); }
        // hazard stripe
        for (let k = 0; k < sw; k += 28) L.rect(sx + k, y0 + RH - 30, 14, 8, '#e0a530', 0.8, 0);
        continue;
      }
      const [name, color] = SHOP_ROWS[row][b];
      const lobby = row === 2;
      // shop window
      const wx = x0 + 22, wy = y0 + (lobby ? 30 : 74), ww = bw - 44, wh = RH - 22 - (lobby ? 30 : 74);
      L.rect(wx - 6, wy - 6, ww + 12, wh + 6, '#26282c', 0.5, 0.5, 0.66);
      L.rect(wx, wy, ww, wh, '#8fa3ad', 0.07, 1, 0.26);
      const interior = lobby ? '#dff3ff' : rng.pick(WARM);
      L.glow(wx, wy, ww, wh, interior, lobby ? 0.75 : 0.95);
      L.g.globalAlpha = 0.45; L.g.fillStyle = interior; L.g.fillRect(wx, wy, ww, wh); L.g.globalAlpha = 1;
      L.go.fillStyle = Layers.rm(0.2, 0.4); L.go.fillRect(wx, wy, ww, wh);
      // interior silhouettes: shelves / people / tables
      L.ge.fillStyle = 'rgba(0,0,0,0.5)';
      L.g.fillStyle = 'rgba(30,24,20,0.4)';
      for (let k = 0; k < 6; k++) {
        const ox = wx + rng.float(0.04, 0.9) * ww, oh = rng.float(0.25, 0.7) * wh, ow = rng.float(10, 46);
        L.ge.fillRect(ox, wy + wh - oh, ow, oh);
        L.g.fillRect(ox, wy + wh - oh, ow, oh);
      }
      // mullions + door
      for (let k = 1; k < 4; k++) L.rect(wx + (ww * k) / 4 - 2, wy, 4, wh, '#26282c', 0.5, 0.5, 0.66);
      const dx = wx + ww * (rng.next() < 0.5 ? 0.02 : 0.76);
      L.rect(dx, wy + 8, ww * 0.22, wh - 8, '#1d1f22', 0.4, 0.6);
      L.rect(dx + 6, wy + 16, ww * 0.22 - 12, wh - 30, '#7f939c', 0.08, 1);
      L.glow(dx + 6, wy + 16, ww * 0.22 - 12, wh - 30, interior, 0.6);
      if (!lobby) {
        // lightbox sign: a softly lit white band with dark lettering and one small colour mark
        L.rect(wx - 6, y0 + 14, ww + 12, 48, '#f6f4ef', 0.5, 0.1, 0.86);
        L.glow(wx - 6, y0 + 14, ww + 12, 48, '#fff8ec', 0.55);
        let size = 32;
        L.g.font = `800 ${size}px ${FONT}`;
        while (L.g.measureText(name).width > ww - 60 && size > 14) { size -= 2; L.g.font = `800 ${size}px ${FONT}`; }
        for (const ctx of [L.g, L.ge]) {
          ctx.font = `800 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = ctx === L.g ? '#2b2d31' : '#1a1a1a';
          ctx.fillText(name, wx + ww / 2 + 10, y0 + 39);
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(wx + ww / 2 - ctx.measureText(name).width / 2 - 12, y0 + 38, 8, 0, Math.PI * 2); ctx.fill();
        }
        // awning on some shops
        if (rng.next() < 0.45) {
          const ac = rng.pick(['#e8e0d0', '#d97757', '#cfd6dc', '#f4f2ee']);
          for (let k = 0; k < ww; k += 26) L.rect(wx + k, wy - 8, 13, 16, ac, 0.9, 0);
        }
      } else {
        L.rect(wx - 6, y0 + 8, ww + 12, 14, '#e4e7ea', 0.4, 0.5);
        L.glow(wx - 6, y0 + 18, ww + 12, 3, '#ffffff', 0.7);
      }
    }
  }
  return L.textures();
}

// Blade-sign atlas: glowing words on transparent black. Returns {map, items:[{u0,v0,u1,v1,aspect,color}]}
export function makeNeonSigns() {
  const words = [
    ['BAR', '#ff5fd8'], ['ARCADE', '#5ff3ff'], ['NOODLES', '#ff7a59'], ['HOTEL', '#ffb347'], ['24H', '#b4ff5c'], ['TOKENS', '#ffd27a'],
    ['KARAOKE', '#c77dff'], ['CLUB', '#ff4d6d'], ['TATTOO', '#ff7a59'], ['PIZZA', '#ffb347'], ['CAFÉ', '#ffe8c4'], ['GPU', '#7dffb0'],
    ['SUSHI', '#5ff3ff'], ['OPEN', '#ff4d6d'], ['VR', '#c77dff'], ['SYNTH', '#ff5fd8'],
  ];
  const W = 1024, H = 1024, cw = 256, ch = 256;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const items = [];
  words.forEach(([w, color], i) => {
    const x = (i % 4) * cw, y = Math.floor(i / 4) * ch;
    // vertical stacked letters inside a tube frame
    g.strokeStyle = color; g.lineWidth = 6; g.shadowColor = color; g.shadowBlur = 18;
    g.strokeRect(x + 78, y + 10, 100, ch - 20);
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = w.length;
    const size = Math.min(64, (ch - 40) / n);
    g.font = `900 ${size}px ${FONT}`;
    for (let k = 0; k < n; k++) g.fillText(w[k], x + 128, y + 22 + size / 2 + k * ((ch - 44) / n));
    g.shadowBlur = 0;
    items.push({ u0: (x + 70) / W, u1: (x + 186) / W, v0: 1 - (y + ch - 2) / H, v1: 1 - (y + 2) / H, aspect: 116 / 252, color });
  });
  return { map: tex(c, { repeat: false }), items };
}

export function makeNoiseTexture(seed = 3, size = 256, contrast = 0.25) {
  const rng = new RNG(seed);
  const c = canvas(size, size);
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const lat = (n) => { const a = []; for (let i = 0; i < n * n; i++) a.push(rng.next()); return a; };
  const octs = [[8, 0.5], [16, 0.25], [32, 0.15], [64, 0.1]].map(([n, w]) => ({ n, w, l: lat(n) }));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const o of octs) {
      const fx = (x / size) * o.n, fy = (y / size) * o.n;
      const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const g00 = o.l[(iy % o.n) * o.n + (ix % o.n)], g10 = o.l[(iy % o.n) * o.n + ((ix + 1) % o.n)];
      const g01 = o.l[((iy + 1) % o.n) * o.n + (ix % o.n)], g11 = o.l[((iy + 1) % o.n) * o.n + ((ix + 1) % o.n)];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      v += o.w * ((g00 * (1 - sx) + g10 * sx) * (1 - sy) + (g01 * (1 - sx) + g11 * sx) * sy);
    }
    const k = Math.round(255 * (1 - contrast + contrast * 2 * v));
    const i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.min(255, k);
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tex(c, { srgb: false });
}

// Road surfaces. u runs across the road (0..1), v along it (1 unit = 16 m).
// Returns {map, rough}: rough has worn, glossy wheel tracks so lamps streak across the asphalt.
export function makeRoadTexture(type) {
  const W = type === 'blvd' ? 512 : 256, H = 512;
  const c = canvas(W, H), r = canvas(W / 2, H / 2), hc = canvas(W, H);
  const g = c.getContext('2d'), gr = r.getContext('2d'), gh = hc.getContext('2d', { willReadFrequently: true });
  gr.scale(0.5, 0.5);
  const rng = new RNG(type.length * 17 + 3);
  const rough = (v) => `rgb(255,${Math.round(v * 255)},0)`;
  const grey = (v) => { const k = Math.round(v * 255); return `rgb(${k},${k},${k})`; };
  gh.fillStyle = grey(0.5); gh.fillRect(0, 0, W, H);
  if (type === 'dirt') {
    g.fillStyle = '#7a5b3a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2500; i++) {
      const v = rng.int(70, 140), x = rng.float(0, W), y = rng.float(0, H), sz = rng.float(1, 4);
      g.fillStyle = `rgba(${v + 20},${v},${v - 30},0.35)`;
      g.fillRect(x, y, sz, sz);
      gh.fillStyle = grey(rng.float(0.3, 0.75)); gh.fillRect(x, y, sz, sz);     // stones and pits
    }
    g.fillStyle = 'rgba(40,28,18,0.35)';
    g.fillRect(W * 0.22, 0, W * 0.1, H); g.fillRect(W * 0.68, 0, W * 0.1, H);
    for (const u of [0.22, 0.68]) { const gd = gh.createLinearGradient(u * W, 0, (u + 0.1) * W, 0); gd.addColorStop(0, 'rgba(0,0,0,0)'); gd.addColorStop(0.5, 'rgba(0,0,0,0.5)'); gd.addColorStop(1, 'rgba(0,0,0,0)'); gh.fillStyle = gd; gh.fillRect(u * W, 0, W * 0.1, H); }   // ruts
    const grd = g.createLinearGradient(0, 0, W, 0);
    grd.addColorStop(0, 'rgba(60,90,40,0.9)'); grd.addColorStop(0.1, 'rgba(60,90,40,0)');
    grd.addColorStop(0.9, 'rgba(60,90,40,0)'); grd.addColorStop(1, 'rgba(60,90,40,0.9)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    return { map: tex(c), rough: null, normal: normalFromCanvas(hc, 2.2) };
  }
  g.fillStyle = '#47474c'; g.fillRect(0, 0, W, H);
  gr.fillStyle = rough(0.72); gr.fillRect(0, 0, W, H);
  // aggregate: light and dark stones in the binder
  for (let i = 0; i < 9000; i++) {
    const v = rng.int(48, 104), x = rng.float(0, W), y = rng.float(0, H), sz = rng.float(1, 2.6);
    g.fillStyle = `rgba(${v},${v},${v + 4},0.55)`;
    g.fillRect(x, y, sz, sz);
    gh.fillStyle = grey(v > 76 ? 0.62 : 0.4); gh.fillRect(x, y, sz, sz);
  }
  // tar patches and repairs
  for (let i = 0; i < 7; i++) {
    const x = rng.float(0, W), y = rng.float(0, H), w = rng.float(20, 70), h = rng.float(20, 120);
    g.fillStyle = `rgba(30,30,33,${rng.float(0.15, 0.35)})`; g.fillRect(x, y, w, h);
    gr.fillStyle = rough(rng.float(0.35, 0.55)); gr.fillRect(x, y, w, h);
    gh.fillStyle = 'rgba(255,255,255,0.1)'; gh.fillRect(x, y, w, h);
  }
  // cracks, some sealed with tar
  for (let i = 0; i < 9; i++) {
    let x = rng.float(0, W), y = rng.float(0, H);
    const sealed = rng.next() < 0.5;
    g.strokeStyle = sealed ? 'rgba(18,18,20,0.75)' : 'rgba(25,25,27,0.6)'; g.lineWidth = sealed ? 3 : 1.2;
    gh.strokeStyle = sealed ? grey(0.6) : grey(0.12); gh.lineWidth = sealed ? 3 : 1.6;
    gr.strokeStyle = rough(sealed ? 0.3 : 0.8); gr.lineWidth = g.lineWidth;
    for (const ctx of [g, gh, gr]) { ctx.beginPath(); ctx.moveTo(x, y); }
    for (let k = 0; k < 10; k++) { x += rng.float(-16, 16); y += rng.float(8, 30); for (const ctx of [g, gh, gr]) ctx.lineTo(x, y); }
    for (const ctx of [g, gh, gr]) ctx.stroke();
  }
  const line = (u, color, dashed, width = 5) => {
    const put = (y, h) => {
      g.fillStyle = color; g.fillRect(u * W - width / 2, y, width, h);
      gh.fillStyle = grey(0.68); gh.fillRect(u * W - width / 2, y, width, h);
      gr.fillStyle = rough(0.5); gr.fillRect(u * W - width / 2, y, width, h);
      // worn paint
      g.fillStyle = 'rgba(71,71,76,0.35)';
      for (let k = 0; k < h / 5; k++) g.fillRect(u * W - width / 2 + rng.float(0, width), y + rng.float(0, h), rng.float(1, 3), rng.float(2, 9));
    };
    if (!dashed) put(0, H); else for (let y = 0; y < H; y += 128) put(y, 64);
  };
  // polished wheel tracks
  const track = (u, w) => {
    const grd = gr.createLinearGradient((u - w) * W, 0, (u + w) * W, 0);
    grd.addColorStop(0, 'rgba(255,90,0,0)'); grd.addColorStop(0.5, 'rgba(255,90,0,0.55)'); grd.addColorStop(1, 'rgba(255,90,0,0)');
    gr.fillStyle = grd; gr.fillRect((u - w) * W, 0, 2 * w * W, H);
    const gd = g.createLinearGradient((u - w) * W, 0, (u + w) * W, 0);
    gd.addColorStop(0, 'rgba(30,30,32,0)'); gd.addColorStop(0.5, 'rgba(30,30,32,0.16)'); gd.addColorStop(1, 'rgba(30,30,32,0)');
    g.fillStyle = gd; g.fillRect((u - w) * W, 0, 2 * w * W, H);
  };
  if (type === 'blvd') {
    // 22 m: median 3 m, two 3.5 m lanes each way, cycle lane at the kerb
    const m = (off) => 0.5 + off / 22;
    g.fillStyle = '#3d4a3a'; g.fillRect(m(-1.5) * W, 0, (3 / 22) * W, H);          // planted median
    gr.fillStyle = rough(0.95); gr.fillRect(m(-1.5) * W, 0, (3 / 22) * W, H);
    for (let i = 0; i < 900; i++) {
      const x = m(-1.5) * W + rng.float(0, (3 / 22) * W), y = rng.float(0, H), v = rng.int(50, 110);
      g.fillStyle = `rgba(${v - 20},${v + 20},${v - 30},0.5)`; g.fillRect(x, y, 2, rng.float(2, 6));
      gh.fillStyle = grey(rng.float(0.45, 0.95)); gh.fillRect(x, y, 2, 3);
    }
    gh.fillStyle = grey(0.9); gh.fillRect(m(-1.5) * W - 2, 0, 4, H); gh.fillRect(m(1.5) * W - 2, 0, 4, H);   // median kerbs
    line(m(-1.5), '#d8d2c4', false, 5); line(m(1.5), '#d8d2c4', false, 5);
    for (const s of [-1, 1]) {
      line(m(s * 5.25), '#d8d2c4', true, 4);
      line(m(s * 8.75), '#e9e4d8', false, 4);
      g.fillStyle = 'rgba(46,196,182,0.22)';
      g.fillRect(Math.min(m(s * 8.75), m(s * 10.8)) * W, 0, (2.05 / 22) * W, H);   // cycle lane tint
      line(m(s * 10.8), '#e8e2d4', false, 4);
      for (const o of [2.6, 4.4, 6.1, 7.9]) track(m(s * o), 0.016);
    }
    return { map: tex(c), rough: tex(r, { srgb: false }), normal: normalFromCanvas(hc, 1.6) };
  }
  line(0.03, '#e8e2d4', false, 4); line(0.97, '#e8e2d4', false, 4);
  line(0.49, '#e9e4d8', false, 3); line(0.51, '#e9e4d8', false, 3);
  line(0.25, '#d8d2c4', true, 4); line(0.75, '#d8d2c4', true, 4);
  for (const u of [0.08, 0.19, 0.31, 0.43, 0.57, 0.69, 0.81, 0.92]) track(u, 0.03);
  return { map: tex(c), rough: tex(r, { srgb: false }), normal: normalFromCanvas(hc, 1.6) };
}

// Ground surfaces that tile in world metres. Each returns { map, rough, normal }.
export function makeGround(kind) {
  const S = 512;
  const c = canvas(S, S), r = canvas(S / 2, S / 2), hc = canvas(S, S);
  const g = c.getContext('2d'), gr = r.getContext('2d'), gh = hc.getContext('2d', { willReadFrequently: true });
  gr.scale(0.5, 0.5);
  const rng = new RNG(kind.length * 31 + 5);
  const rough = (v) => `rgb(255,${Math.round(v * 255)},0)`;
  const grey = (v) => { const k = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${k},${k},${k})`; };
  gh.fillStyle = grey(0.5); gh.fillRect(0, 0, S, S);
  let bump = 2;
  if (kind === 'paving') {
    // large stone flags in a running bond, each a slightly different tone, with open joints
    g.fillStyle = '#7d7a74'; g.fillRect(0, 0, S, S);
    gr.fillStyle = rough(0.9); gr.fillRect(0, 0, S, S);
    gh.fillStyle = grey(0.2); gh.fillRect(0, 0, S, S);
    const rows = 8, th = S / rows;
    for (let j = 0; j < rows; j++) {
      const tw = S / 4, off = (j % 2) * tw * 0.5;
      for (let i = -1; i < 5; i++) {
        const x = i * tw + off, v = rng.int(-10, 10), warm = rng.int(-3, 5);
        for (const [xx, ww] of [[x, tw]]) {
          g.fillStyle = `rgb(${176 + v + warm},${173 + v},${166 + v - warm})`;
          g.fillRect(xx + 1.5, j * th + 1.5, ww - 3, th - 3);
          gr.fillStyle = rough(rng.float(0.55, 0.8)); gr.fillRect(xx + 1.5, j * th + 1.5, ww - 3, th - 3);
          gh.fillStyle = grey(0.6 + rng.float(-0.05, 0.05)); gh.fillRect(xx + 2, j * th + 2, ww - 4, th - 4);
        }
      }
    }
    for (let i = 0; i < 2600; i++) { const x = rng.float(0, S), y = rng.float(0, S), d = rng.next() < 0.5; g.fillStyle = `rgba(${d ? 0 : 255},${d ? 0 : 255},${d ? 0 : 250},${rng.float(0.02, 0.07)})`; g.fillRect(x, y, rng.float(1, 4), rng.float(1, 4)); gh.fillStyle = `rgba(${d ? 0 : 255},${d ? 0 : 255},${d ? 0 : 255},0.08)`; gh.fillRect(x, y, 2, 2); }
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(40,36,30,${rng.float(0.05, 0.14)})`; g.beginPath(); g.ellipse(rng.float(0, S), rng.float(0, S), rng.float(8, 30), rng.float(6, 20), rng.float(0, 3), 0, 6.3); g.fill(); }   // stains, gum
    bump = 2.6;
  } else if (kind === 'asphalt') {
    g.fillStyle = '#3f4045'; g.fillRect(0, 0, S, S);
    gr.fillStyle = rough(0.78); gr.fillRect(0, 0, S, S);
    for (let i = 0; i < 16000; i++) {
      const v = rng.int(44, 100), x = rng.float(0, S), y = rng.float(0, S), sz = rng.float(1, 2.6);
      g.fillStyle = `rgba(${v},${v},${v + 3},0.55)`; g.fillRect(x, y, sz, sz);
      gh.fillStyle = grey(v > 72 ? 0.63 : 0.4); gh.fillRect(x, y, sz, sz);
    }
    for (let i = 0; i < 10; i++) {   // oil spots and patches
      const x = rng.float(0, S), y = rng.float(0, S), rx = rng.float(10, 40), ry = rng.float(8, 30);
      g.fillStyle = `rgba(16,16,18,${rng.float(0.15, 0.4)})`; g.beginPath(); g.ellipse(x, y, rx, ry, rng.float(0, 3), 0, 6.3); g.fill();
      gr.fillStyle = rough(0.3); gr.beginPath(); gr.ellipse(x, y, rx, ry, 0, 0, 6.3); gr.fill();
    }
    for (let i = 0; i < 8; i++) {
      let x = rng.float(0, S), y = rng.float(0, S);
      g.strokeStyle = 'rgba(20,20,22,0.6)'; g.lineWidth = 1.4; gh.strokeStyle = grey(0.1); gh.lineWidth = 1.8;
      g.beginPath(); gh.beginPath(); g.moveTo(x, y); gh.moveTo(x, y);
      for (let k = 0; k < 9; k++) { x += rng.float(-22, 22); y += rng.float(-22, 22); g.lineTo(x, y); gh.lineTo(x, y); }
      g.stroke(); gh.stroke();
    }
    bump = 1.8;
  } else if (kind === 'grass') {
    g.fillStyle = '#4e8a3c'; g.fillRect(0, 0, S, S);
    gr.fillStyle = rough(0.95); gr.fillRect(0, 0, S, S);
    // soft patches, then thousands of blades
    for (let i = 0; i < 60; i++) { const v = rng.next(); g.fillStyle = v < 0.5 ? `rgba(98,150,62,${rng.float(0.1, 0.25)})` : `rgba(52,104,44,${rng.float(0.1, 0.25)})`; g.beginPath(); g.ellipse(rng.float(0, S), rng.float(0, S), rng.float(20, 70), rng.float(20, 60), rng.float(0, 3), 0, 6.3); g.fill(); }
    g.lineCap = 'round'; gh.lineCap = 'round';
    for (let i = 0; i < 22000; i++) {
      const x = rng.float(0, S), y = rng.float(0, S), a = rng.float(-0.9, 0.9) - Math.PI / 2, l = rng.float(3, 9), k = rng.next();
      const col = k < 0.34 ? [60, 118, 46] : k < 0.68 ? [92, 152, 62] : k < 0.92 ? [128, 176, 80] : [170, 178, 96];
      g.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.8)`; g.lineWidth = rng.float(0.8, 1.7);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      gh.strokeStyle = grey(0.3 + k * 0.6); gh.lineWidth = 1.5;
      gh.beginPath(); gh.moveTo(x, y); gh.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); gh.stroke();
    }
    bump = 2.4;
  } else if (kind === 'planks') {
    // weathered boardwalk: boards run across u, joints every 0.2 m of v
    const n = 16, bh = S / n;
    for (let j = 0; j < n; j++) {
      const v = rng.int(-14, 14);
      g.fillStyle = `rgb(${196 + v},${182 + v},${156 + v})`; g.fillRect(0, j * bh, S, bh);
      gh.fillStyle = grey(0.62 + rng.float(-0.06, 0.06)); gh.fillRect(0, j * bh + 1.5, S, bh - 3);
      gh.fillStyle = grey(0.15); gh.fillRect(0, j * bh, S, 1.5);
      g.fillStyle = 'rgba(60,46,30,0.55)'; g.fillRect(0, j * bh, S, 1.5);
      for (let k = 0; k < 26; k++) {   // grain
        const y = j * bh + rng.float(2, bh - 2), x = rng.float(0, S), l = rng.float(30, 160);
        g.fillStyle = `rgba(110,90,62,${rng.float(0.08, 0.22)})`; g.fillRect(x, y, l, 1);
        gh.fillStyle = 'rgba(0,0,0,0.12)'; gh.fillRect(x, y, l, 1);
      }
      const bx = rng.float(0, S);   // butt joint and nails
      g.fillStyle = 'rgba(50,38,26,0.6)'; g.fillRect(bx, j * bh, 2, bh); gh.fillStyle = grey(0.15); gh.fillRect(bx, j * bh, 2, bh);
      for (const dx of [-8, 8]) { g.fillStyle = 'rgba(40,40,44,0.7)'; g.beginPath(); g.arc(bx + dx, j * bh + bh / 2, 1.6, 0, 6.3); g.fill(); }
    }
    gr.fillStyle = rough(0.82); gr.fillRect(0, 0, S, S);
    bump = 2.6;
  } else if (kind === 'sand') {
    g.fillStyle = '#e4d3a8'; g.fillRect(0, 0, S, S);
    gr.fillStyle = rough(0.95); gr.fillRect(0, 0, S, S);
    for (let i = 0; i < 14000; i++) { const v = rng.int(-22, 18), x = rng.float(0, S), y = rng.float(0, S); g.fillStyle = `rgba(${228 + v},${212 + v},${170 + v},0.6)`; g.fillRect(x, y, 2, 2); gh.fillStyle = grey(0.5 + v / 80); gh.fillRect(x, y, 2, 2); }
    // wind ripples
    gh.lineWidth = 3;
    for (let k = 0; k < 40; k++) { const y = (k / 40) * S; gh.strokeStyle = 'rgba(255,255,255,0.16)'; gh.beginPath(); for (let x = 0; x <= S; x += 16) gh.lineTo(x, y + Math.sin(x * 0.049 + k * 1.7) * 5); gh.stroke(); }
    bump = 1.6;
  } else if (kind === 'detail') {
    // neutral and bright: it multiplies the biome colour, so it must not tint or darken it
    g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, S, S);
    gr.fillStyle = rough(0.95); gr.fillRect(0, 0, S, S);
    for (let i = 0; i < 70; i++) { const v = rng.next() < 0.5 ? 255 : 150; g.fillStyle = `rgba(${v},${v},${v},0.07)`; g.beginPath(); g.ellipse(rng.float(0, S), rng.float(0, S), rng.float(20, 80), rng.float(20, 60), rng.float(0, 3), 0, 6.3); g.fill(); }
    g.lineCap = 'round'; gh.lineCap = 'round';
    for (let i = 0; i < 16000; i++) {
      const x = rng.float(0, S), y = rng.float(0, S), a2 = rng.float(0, 6.3), l = rng.float(2, 8), k = rng.next(), v = Math.round(196 + k * 59);
      g.strokeStyle = `rgba(${v},${v},${v},0.7)`; g.lineWidth = rng.float(0.8, 1.8);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a2) * l, y + Math.sin(a2) * l); g.stroke();
      gh.strokeStyle = grey(0.25 + k * 0.65); gh.lineWidth = 1.6;
      gh.beginPath(); gh.moveTo(x, y); gh.lineTo(x + Math.cos(a2) * l, y + Math.sin(a2) * l); gh.stroke();
    }
    for (let i = 0; i < 500; i++) { const x = rng.float(0, S), y = rng.float(0, S), rr = rng.float(1.5, 4.5), v = rng.int(180, 240); g.fillStyle = `rgba(${v},${v},${v},0.6)`; g.beginPath(); g.arc(x, y, rr, 0, 6.3); g.fill(); gh.fillStyle = grey(0.9); gh.beginPath(); gh.arc(x, y, rr, 0, 6.3); gh.fill(); }   // pebbles
    bump = 2.2;
  } else {   // concrete
    g.fillStyle = '#b4b1aa'; g.fillRect(0, 0, S, S);
    gr.fillStyle = rough(0.85); gr.fillRect(0, 0, S, S);
    for (let i = 0; i < 9000; i++) { const v = rng.int(-16, 16), x = rng.float(0, S), y = rng.float(0, S); g.fillStyle = `rgba(${180 + v},${177 + v},${170 + v},0.5)`; g.fillRect(x, y, rng.float(1, 4), rng.float(1, 4)); gh.fillStyle = grey(0.5 + v / 90); gh.fillRect(x, y, 2, 2); }
    for (const p of [0, S / 2]) { g.fillStyle = 'rgba(70,68,64,0.5)'; g.fillRect(p, 0, 2, S); g.fillRect(0, p, S, 2); gh.fillStyle = grey(0.1); gh.fillRect(p, 0, 3, S); gh.fillRect(0, p, S, 3); }   // expansion joints
    bump = 1.8;
  }
  return { map: tex(c), rough: tex(r, { srgb: false }), normal: normalFromCanvas(hc, bump) };
}

export function makeGlowTexture(inner = 'rgba(255,255,255,1)', size = 128) {
  const c = canvas(size, size);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return tex(c, { repeat: false, srgb: false, aniso: 1 });
}

// Soft dark blob used as a fake contact shadow.
export function makeBlobTexture(size = 64) {
  const c = canvas(size, size);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return tex(c, { repeat: false, aniso: 1 });
}

export { canvas as makeCanvas, tex as canvasToTexture };
