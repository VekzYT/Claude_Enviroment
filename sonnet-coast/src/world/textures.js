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
const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
export const UI_FONT = FONT;

// Three canvases painted in lock-step: colour, emissive, and roughness(G)/metalness(B).
class Layers {
  constructor(w, h, es = 0.5) {
    this.w = w; this.h = h;
    this.col = canvas(w, h); this.emi = canvas(w * es, h * es); this.orm = canvas(w * es, h * es);
    this.g = this.col.getContext('2d'); this.ge = this.emi.getContext('2d'); this.go = this.orm.getContext('2d');
    this.ge.scale(es, es); this.go.scale(es, es);
    this.ge.fillStyle = '#000'; this.ge.fillRect(0, 0, w, h);
  }
  // rough/metal 0..1
  static rm(r, m) { return `rgb(255,${Math.round(r * 255)},${Math.round(m * 255)})`; }
  rect(x, y, w, h, color, rough = 0.85, metal = 0) {
    this.g.fillStyle = color; this.g.fillRect(x, y, w, h);
    this.go.fillStyle = Layers.rm(rough, metal); this.go.fillRect(x, y, w, h);
    this.ge.fillStyle = '#000'; this.ge.fillRect(x, y, w, h);
  }
  glow(x, y, w, h, color, alpha = 1) {
    this.ge.globalAlpha = alpha; this.ge.fillStyle = color; this.ge.fillRect(x, y, w, h); this.ge.globalAlpha = 1;
  }
  textures() {
    return { map: tex(this.col), emissive: tex(this.emi), orm: tex(this.orm, { srgb: false }) };
  }
}

// interior light: soft whites, a little warm, a little cool — no saturated colour
const WARM = ['#fff0d8', '#ffe6c4', '#fff6e8', '#ffecd0', '#fffaf0'];
const COOL = ['#eef8ff', '#e2f2ff', '#f4fbff', '#dcefff'];

function windowPane(L, rng, x, y, w, h, litChance, opts = {}) {
  const { frame = 3, glassTone = 1 } = opts;
  // frame
  L.rect(x, y, w, h, '#2a2c30', 0.5, 0.4);
  const gx = x + frame, gy = y + frame, gw = w - frame * 2, gh = h - frame * 2;
  const v = (150 + rng.int(0, 60)) * glassTone;
  L.rect(gx, gy, gw, gh, `rgb(${v * 0.78 | 0},${v * 0.9 | 0},${v | 0})`, 0.06 + rng.next() * 0.08, 1);
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
}

// One tile = 8 bays x 8 floors (28 m x 28 m).
export function makeFacade(style, seed) {
  const rng = new RNG(seed);
  const S = 1024, N = 8, c = S / N;
  const L = new Layers(S, S);
  L.rect(0, 0, S, S, '#f4f1ea', 0.86, 0);
  // wall grain
  for (let i = 0; i < 2600; i++) {
    const v = rng.int(205, 255);
    L.g.fillStyle = `rgba(${v},${v},${v},0.5)`;
    L.g.fillRect(rng.float(0, S), rng.float(0, S), rng.float(2, 9), rng.float(1, 4));
  }
  for (let fy = 0; fy < N; fy++) {
    const floorLit = 0.1 + rng.next() * 0.55;
    const y0 = fy * c;
    if (style === 'grid') {
      for (let fx = 0; fx < N; fx++) windowPane(L, rng, fx * c + 22, y0 + 26, c - 44, c - 56, floorLit);
      L.rect(0, y0 + c - 10, S, 6, '#d6d0c4', 0.9, 0);                 // string course
    } else if (style === 'glass') {
      L.rect(0, y0 + c - 18, S, 18, '#c9cdd2', 0.35, 0.8);             // spandrel
      for (let fx = 0; fx < N; fx++) windowPane(L, rng, fx * c + 1, y0, c - 2, c - 18, floorLit * 0.8, { frame: 2 });
    } else if (style === 'bands') {
      L.rect(0, y0 + 22, S, c - 62, '#2a2c30', 0.5, 0.4);
      for (let fx = 0; fx < N; fx += 2) windowPane(L, rng, fx * c + 2, y0 + 24, c * 2 - 4, c - 66, floorLit, { frame: 2 });
      L.rect(0, y0 + c - 34, S, 4, '#bdb6a8', 0.9, 0);
    } else if (style === 'fins') {
      for (let fx = 0; fx < N; fx++) {
        windowPane(L, rng, fx * c + 34, y0 + 8, c - 68, c - 16, floorLit, { frame: 3 });
        L.rect(fx * c - 6, y0, 12, c, '#e2dccf', 0.8, 0);              // vertical pier
        // balcony slab
        L.rect(fx * c + 26, y0 + c - 12, c - 52, 9, '#b9b2a4', 0.8, 0);
      }
    } else if (style === 'panel') {
      for (let fx = 0; fx < N; fx++) {
        const r = rng.next();
        if (r < 0.62) windowPane(L, rng, fx * c + 4, y0 + 4, c - 8, c - 8, floorLit * 0.7, { frame: 2, glassTone: 0.85 });
        else if (r < 0.85) L.rect(fx * c + 4, y0 + 4, c - 8, c - 8, rng.pick(['#d9d4ca', '#bfc3c8', '#8f949b']), 0.4, 0.7);
        else {
          L.rect(fx * c + 4, y0 + 4, c - 8, c - 8, '#3a3d44', 0.5, 0.6);
          for (let k = 0; k < 5; k++) L.rect(fx * c + 12, y0 + 16 + k * 20, c - 24, 8, '#22242a', 0.6, 0.5); // louvres
        }
      }
      if (fy % 2 === 0) L.rect(0, y0 + c - 4, S, 4, '#eef1f3', 0.35, 0.6);
    } else if (style === 'diagrid') {
      // all glass, floor by floor; the lattice is painted over the top afterwards
      for (let fx = 0; fx < N; fx++) windowPane(L, rng, fx * c, y0 + 2, c, c - 6, floorLit * 0.75, { frame: 1 });
      L.rect(0, y0 + c - 5, S, 5, '#cfd6dc', 0.3, 0.8);
    } else if (style === 'brick') {
      // courses
      L.g.fillStyle = 'rgba(120,90,70,0.16)';
      for (let k = 0; k < c; k += 9) L.g.fillRect(0, y0 + k, S, 1.5);
      for (let fx = 0; fx < N; fx++) {
        const wx = fx * c + 30, ww = c - 60;
        windowPane(L, rng, wx, y0 + 22, ww, c - 52, floorLit, { frame: 5 });
        L.rect(wx - 8, y0 + c - 30, ww + 16, 8, '#d9d2c2', 0.9, 0);      // sill
        if (rng.next() < 0.3) L.rect(wx, y0 + 22, ww * 0.5, c - 52, '#5b7a72', 0.8, 0); // shutter
        if (rng.next() < 0.22) { // balcony rail
          L.rect(wx - 14, y0 + c - 46, ww + 28, 3, '#2c2c30', 0.5, 0.6);
          for (let k = 0; k <= ww + 28; k += 9) L.rect(wx - 14 + k, y0 + c - 46, 2, 18, '#2c2c30', 0.5, 0.6);
        }
      }
    }
  }
  if (style === 'glass') { for (let fx = 0; fx <= N; fx++) L.rect(fx * c - 2, 0, 4, S, '#e9edf0', 0.3, 0.9); }
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
    for (const y of [0, S / 2]) L.rect(0, y - 6, S, 12, '#c79068', 0.4, 0.7);
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

// Ground-floor strip atlas: 4 rows (retail, food, lobby, industrial); one tile = 36 m x 4.5 m.
export function makeStorefronts(seed = 7) {
  const rng = new RNG(seed);
  const W = 2048, RH = 256, L = new Layers(W, RH * 4);
  const names = SHOP_NAMES.slice();
  const nextName = () => names.splice(rng.int(0, names.length - 1), 1)[0] || rng.pick(SHOP_NAMES);
  for (let row = 0; row < 4; row++) {
    const y0 = row * RH;
    const wall = ['#f1efea', '#ece6dc', '#eef1f4', '#c9c9cb'][row];
    L.rect(0, y0, W, RH, wall, 0.85, 0);
    L.rect(0, y0 + RH - 22, W, 22, '#9a9892', 0.9, 0);                 // plinth
    const bays = row === 2 ? 4 : 6;
    const bw = W / bays;
    for (let b = 0; b < bays; b++) {
      const x0 = b * bw;
      if (row === 3) {
        // roller shutters and a loading door
        const sx = x0 + 26, sw = bw - 52;
        L.rect(sx, y0 + 46, sw, RH - 68, '#7d838a', 0.55, 0.7);
        for (let k = 0; k < RH - 68; k += 9) L.rect(sx, y0 + 46 + k, sw, 2, '#5e646b', 0.6, 0.7);
        if (rng.next() < 0.5) { L.rect(sx + 10, y0 + 18, sw - 20, 20, '#2b2d31', 0.6, 0.3); L.glow(sx + 10, y0 + 18, sw - 20, 20, '#ffb347', 0.5); }
        // hazard stripe
        for (let k = 0; k < sw; k += 28) L.rect(sx + k, y0 + RH - 30, 14, 8, '#e0a530', 0.8, 0);
        continue;
      }
      const [name, color] = nextName();
      const lobby = row === 2;
      // shop window
      const wx = x0 + 22, wy = y0 + (lobby ? 30 : 74), ww = bw - 44, wh = RH - 22 - (lobby ? 30 : 74);
      L.rect(wx - 6, wy - 6, ww + 12, wh + 6, '#26282c', 0.5, 0.5);
      L.rect(wx, wy, ww, wh, '#8fa3ad', 0.07, 1);
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
      for (let k = 1; k < 4; k++) L.rect(wx + (ww * k) / 4 - 2, wy, 4, wh, '#26282c', 0.5, 0.5);
      const dx = wx + ww * (rng.next() < 0.5 ? 0.02 : 0.76);
      L.rect(dx, wy + 8, ww * 0.22, wh - 8, '#1d1f22', 0.4, 0.6);
      L.rect(dx + 6, wy + 16, ww * 0.22 - 12, wh - 30, '#7f939c', 0.08, 1);
      L.glow(dx + 6, wy + 16, ww * 0.22 - 12, wh - 30, interior, 0.6);
      if (!lobby) {
        // lightbox sign: a softly lit white band with dark lettering and one small colour mark
        L.rect(wx - 6, y0 + 14, ww + 12, 48, '#f6f4ef', 0.5, 0.1);
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
  const c = canvas(W, H), r = canvas(W / 2, H / 2);
  const g = c.getContext('2d'), gr = r.getContext('2d');
  gr.scale(0.5, 0.5);
  const rng = new RNG(type.length * 17 + 3);
  const rough = (v) => `rgb(255,${Math.round(v * 255)},0)`;
  if (type === 'dirt') {
    g.fillStyle = '#7a5b3a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2500; i++) {
      const v = rng.int(70, 140);
      g.fillStyle = `rgba(${v + 20},${v},${v - 30},0.35)`;
      g.fillRect(rng.float(0, W), rng.float(0, H), rng.float(1, 4), rng.float(1, 4));
    }
    g.fillStyle = 'rgba(40,28,18,0.35)';
    g.fillRect(W * 0.22, 0, W * 0.1, H); g.fillRect(W * 0.68, 0, W * 0.1, H);
    const grd = g.createLinearGradient(0, 0, W, 0);
    grd.addColorStop(0, 'rgba(60,90,40,0.9)'); grd.addColorStop(0.1, 'rgba(60,90,40,0)');
    grd.addColorStop(0.9, 'rgba(60,90,40,0)'); grd.addColorStop(1, 'rgba(60,90,40,0.9)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    return { map: tex(c), rough: null };
  }
  g.fillStyle = '#4a4a4f'; g.fillRect(0, 0, W, H);
  gr.fillStyle = rough(0.72); gr.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) {
    const v = rng.int(52, 96);
    g.fillStyle = `rgba(${v},${v},${v + 4},0.5)`;
    g.fillRect(rng.float(0, W), rng.float(0, H), 2, 2);
  }
  for (let i = 0; i < 7; i++) {
    const x = rng.float(0, W), y = rng.float(0, H), w = rng.float(20, 70), h = rng.float(20, 120);
    g.fillStyle = `rgba(30,30,33,${rng.float(0.15, 0.35)})`; g.fillRect(x, y, w, h);
    gr.fillStyle = rough(rng.float(0.35, 0.55)); gr.fillRect(x, y, w, h);
  }
  const line = (u, color, dashed, width = 5) => {
    g.fillStyle = color;
    if (!dashed) g.fillRect(u * W - width / 2, 0, width, H);
    else for (let y = 0; y < H; y += 128) g.fillRect(u * W - width / 2, y, width, 64);
  };
  // polished wheel tracks
  const track = (u, w) => {
    const grd = gr.createLinearGradient((u - w) * W, 0, (u + w) * W, 0);
    grd.addColorStop(0, 'rgba(255,90,0,0)'); grd.addColorStop(0.5, 'rgba(255,90,0,0.55)'); grd.addColorStop(1, 'rgba(255,90,0,0)');
    gr.fillStyle = grd; gr.fillRect((u - w) * W, 0, 2 * w * W, H);
  };
  if (type === 'blvd') {
    // 22 m: median 3 m, two 3.5 m lanes each way, cycle lane at the kerb
    const m = (off) => 0.5 + off / 22;
    g.fillStyle = '#3d4a3a'; g.fillRect(m(-1.5) * W, 0, (3 / 22) * W, H);          // planted median
    gr.fillStyle = rough(0.95); gr.fillRect(m(-1.5) * W, 0, (3 / 22) * W, H);
    line(m(-1.5), '#d8d2c4', false, 5); line(m(1.5), '#d8d2c4', false, 5);
    for (const s of [-1, 1]) {
      line(m(s * 5.25), '#d8d2c4', true, 4);
      line(m(s * 8.75), '#e9e4d8', false, 4);
      g.fillStyle = 'rgba(46,196,182,0.22)';
      g.fillRect(Math.min(m(s * 8.75), m(s * 10.8)) * W, 0, (2.05 / 22) * W, H);   // cycle lane tint
      line(m(s * 10.8), '#e8e2d4', false, 4);
      for (const o of [2.6, 4.4, 6.1, 7.9]) track(m(s * o), 0.016);
    }
    return { map: tex(c), rough: tex(r, { srgb: false }) };
  }
  line(0.03, '#e8e2d4', false, 4); line(0.97, '#e8e2d4', false, 4);
  line(0.49, '#e9e4d8', false, 3); line(0.51, '#e9e4d8', false, 3);
  line(0.25, '#d8d2c4', true, 4); line(0.75, '#d8d2c4', true, 4);
  for (const u of [0.08, 0.19, 0.31, 0.43, 0.57, 0.69, 0.81, 0.92]) track(u, 0.03);
  return { map: tex(c), rough: tex(r, { srgb: false }) };
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
