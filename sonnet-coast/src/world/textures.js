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

// Facade: one tile = 8 columns x 8 floors. Returns {map, emissive}.
export function makeFacade(style, seed) {
  const rng = new RNG(seed);
  const S = 512, N = 8, cw = S / N;
  const c = canvas(S, S), e = canvas(S, S);
  const g = c.getContext('2d'), ge = e.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  ge.fillStyle = '#000000'; ge.fillRect(0, 0, S, S);
  const warm = ['#ffd9a0', '#ffc27a', '#ffe8c4', '#ffb36b'];
  const cool = ['#a8f4ff', '#d4f7ff', '#7fe8ff'];
  for (let fy = 0; fy < N; fy++) {
    const floorLit = rng.next();
    for (let fx = 0; fx < N; fx++) {
      const lit = rng.next() < 0.18 + floorLit * 0.35;
      const col = rng.next() < 0.8 ? rng.pick(warm) : rng.pick(cool);
      let x, y, w, h;
      if (style === 'grid') { x = fx * cw + 9; y = fy * cw + 10; w = cw - 18; h = cw - 22; }
      else if (style === 'bands') { x = fx * cw; y = fy * cw + 16; w = cw; h = cw - 34; }
      else { x = fx * cw + 2; y = fy * cw + 3; w = cw - 4; h = cw - 6; }
      const shade = 40 + rng.int(0, 30);
      g.fillStyle = `rgb(${shade * 0.55},${shade * 0.75},${shade})`;
      g.fillRect(x, y, w, h);
      // reflection streak
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.fillRect(x, y, w * 0.35, h);
      if (lit) {
        ge.fillStyle = col;
        ge.globalAlpha = 0.55 + rng.next() * 0.45;
        ge.fillRect(x + 1, y + 1, w - 2, h - 2);
        ge.globalAlpha = 1;
        g.fillStyle = col;
        g.globalAlpha = 0.5;
        g.fillRect(x + 1, y + 1, w - 2, h - 2);
        g.globalAlpha = 1;
      }
    }
    if (style !== 'glass') {
      g.fillStyle = 'rgba(0,0,0,0.12)';
      g.fillRect(0, fy * cw + cw - 4, S, 4);
    }
  }
  if (style === 'glass') {
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let fx = 0; fx <= N; fx++) g.fillRect(fx * cw - 1, 0, 2, S);
  }
  return { map: tex(c), emissive: tex(e) };
}

export function makeNoiseTexture(seed = 3, size = 256, contrast = 0.25) {
  const rng = new RNG(seed);
  const c = canvas(size, size);
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  // Value noise at a few octaves, tileable by wrapping lattice.
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

// Road surface textures. u runs across the road (0..1), v along it (1 unit = 16 m).
export function makeRoadTexture(type) {
  const W = 256, H = 512;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const rng = new RNG(type.length * 17);
  if (type === 'dirt') {
    g.fillStyle = '#7a5b3a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2500; i++) {
      const v = rng.int(70, 140);
      g.fillStyle = `rgba(${v + 20},${v},${v - 30},0.35)`;
      g.fillRect(rng.float(0, W), rng.float(0, H), rng.float(1, 4), rng.float(1, 4));
    }
    // tyre ruts
    g.fillStyle = 'rgba(40,28,18,0.35)';
    g.fillRect(W * 0.22, 0, W * 0.1, H); g.fillRect(W * 0.68, 0, W * 0.1, H);
    // grassy edges
    const gr = g.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, 'rgba(60,90,40,0.9)'); gr.addColorStop(0.1, 'rgba(60,90,40,0)');
    gr.addColorStop(0.9, 'rgba(60,90,40,0)'); gr.addColorStop(1, 'rgba(60,90,40,0.9)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return tex(c);
  }
  g.fillStyle = '#2b2b2e'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4000; i++) {
    const v = rng.int(30, 70);
    g.fillStyle = `rgba(${v},${v},${v + 4},0.5)`;
    g.fillRect(rng.float(0, W), rng.float(0, H), 2, 2);
  }
  // patches
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(20,20,22,${rng.float(0.15, 0.35)})`;
    g.fillRect(rng.float(0, W), rng.float(0, H), rng.float(20, 70), rng.float(20, 120));
  }
  const line = (u, color, dashed, width = 5) => {
    g.fillStyle = color;
    if (!dashed) g.fillRect(u * W - width / 2, 0, width, H);
    else for (let y = 0; y < H; y += 128) g.fillRect(u * W - width / 2, y, width, 64);
  };
  const lanes = type === 'highway' ? 4 : 4;
  // edge lines
  line(0.03, '#e8e2d4', false, 4); line(0.97, '#e8e2d4', false, 4);
  // centre: terracotta double line (Claude orange)
  line(0.49, '#e07a4f', false, 4); line(0.51, '#e07a4f', false, 4);
  if (lanes === 4) { line(0.25, '#d8d2c4', true, 4); line(0.75, '#d8d2c4', true, 4); }
  return tex(c);
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

export function makeTextTexture(lines, opts = {}) {
  const { w = 512, h = 256, bg = 'rgba(0,0,0,0)', color = '#fff', font = 'bold 64px sans-serif' } = opts;
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, w / 2, (h / (lines.length + 1)) * (i + 1)));
  return tex(c, { repeat: false });
}

export { canvas as makeCanvas, tex as canvasToTexture };
