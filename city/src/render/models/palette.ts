// The shared voxel palette. Every voxel stores a 16-bit index into this table; entry 0 is empty.
// Colours are given as sRGB hex and stored linear (three reads vertex colours as linear). An entry
// is either body (lit by the scene) or glow (windows, lamps, signs: its colour is the lit-at-night
// colour; by day the world's material turns glow faces into window glass).
import { hash01 } from '../../core/rng';

/** What a fill writes into each voxel: a palette index, or a function of the voxel position. */
export type Paint = number | ((x: number, y: number, z: number) => number);

export const PAL_R: number[] = [0];
export const PAL_G: number[] = [0];
export const PAL_B: number[] = [0];
export const PAL_GLOW: boolean[] = [false];
const lookup = new Map<string, number>();

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
  const n = parseInt(h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Palette index for an sRGB colour, optionally shaded (k < 1 darker, k > 1 lighter, applied in
 * sRGB so steps look even) and optionally a glow colour.
 */
export function col(hex: string, k = 1, glow = false): number {
  const key = `${hex}|${k.toFixed(3)}|${glow ? 1 : 0}`;
  const hit = lookup.get(key);
  if (hit !== undefined) return hit;
  let [r, g, b] = parseHex(hex);
  if (k <= 1) {
    r *= k;
    g *= k;
    b *= k;
  } else {
    // lighten toward white so saturated colours do not clip into a different hue
    const t = Math.min(1, k - 1);
    r += (1 - r) * t;
    g += (1 - g) * t;
    b += (1 - b) * t;
  }
  const index = PAL_R.length;
  if (index > 65535) throw new Error('voxel palette full');
  PAL_R.push(srgbToLinear(Math.min(1, r)));
  PAL_G.push(srgbToLinear(Math.min(1, g)));
  PAL_B.push(srgbToLinear(Math.min(1, b)));
  PAL_GLOW.push(glow);
  lookup.set(key, index);
  return index;
}

/** A glow palette entry: `hex` is the colour it shines with at night. */
export function glow(hex: string, k = 1): number {
  return col(hex, k, true);
}

export interface MatOpts {
  /** Share of cells drawn a shade darker / lighter. */
  dark?: number;
  light?: number;
  /** How much darker / lighter those cells are. */
  dk?: number;
  lk?: number;
  /** Cell size in voxels (x, y, z): bigger cells mean fewer, larger patches and fewer triangles. */
  cell?: [number, number, number];
  seed?: number;
}

/**
 * A crafted surface: mostly `hex`, with a few cells a shade darker or lighter, so walls and roofs
 * read as built from blocks. Cells are coarse on purpose to keep greedy meshing effective.
 */
export function mat(hex: string, o: MatOpts = {}): Paint {
  const base = col(hex);
  const dark = col(hex, o.dk ?? 0.93);
  const light = col(hex, o.lk ?? 1.05);
  const pd = o.dark ?? 0.14;
  const pl = o.light ?? 0.1;
  const [cx, cy, cz] = o.cell ?? [2, 1, 2];
  const seed = o.seed ?? 0;
  return (x, y, z) => {
    const h = hash01(Math.floor(x / cx) + seed * 7919, Math.floor(y / cy), Math.floor(z / cz) + seed * 104729);
    return h < pd ? dark : h > 1 - pl ? light : base;
  };
}

/** Horizontal courses: every `period` rows alternate between two shades (siding, brick courses). */
export function courses(hex: string, period = 2, k = 0.94, phase = 0): Paint {
  const a = col(hex);
  const b = col(hex, k);
  return (_x, y) => (Math.floor((y + phase) / period) % 2 === 0 ? a : b);
}

/** Vertical planks along x or z: alternating shades in columns. */
export function planks(hex: string, axis: 'x' | 'z', width = 1, k = 0.92): Paint {
  const a = col(hex);
  const b = col(hex, k);
  return axis === 'x'
    ? (x) => (Math.floor(x / width) % 2 === 0 ? a : b)
    : (_x, _y, z) => (Math.floor(z / width) % 2 === 0 ? a : b);
}

/** Two colours in diagonal stripes (awnings, hazard paint). */
export function stripes(a: string, b: string, axis: 'x' | 'z', width = 1): Paint {
  const ia = col(a);
  const ib = col(b);
  return axis === 'x'
    ? (x) => (Math.floor(x / width) % 2 === 0 ? ia : ib)
    : (_x, _y, z) => (Math.floor(z / width) % 2 === 0 ? ia : ib);
}

// ---------------------------------------------------------------- windows

export type WindowStyle = 'home' | 'office' | 'shop' | 'factory' | 'tower';

/** Lit colours by style. Most are warm; offices mix in cool white. */
const LIT: Record<WindowStyle, string[]> = {
  home: ['#ffd27a', '#ffc35e', '#ffe2a2', '#ffb555', '#ffd890', '#ffcb6e'],
  office: ['#fff1cc', '#e8f0ff', '#ffe6a8', '#dbe8ff', '#fff6dc'],
  shop: ['#ffe2a0', '#ffd27e', '#fff0c6'],
  factory: ['#ffd98e', '#ffcc73', '#f6e7b8'],
  tower: ['#ffd98a', '#ffe9b8', '#ffc86a', '#eaf0ff', '#ffdca0'],
};
const LIT_SHARE: Record<WindowStyle, number> = { home: 0.58, office: 0.68, shop: 0.9, factory: 0.6, tower: 0.62 };

/** The "lit" colour of a window that stays dark at night: faint blue, like glass catching sky. */
export const UNLIT = '#27324c';

/**
 * Palette index for one window. `h` is a per-window hash in [0, 1). Some stay dark, the lit ones
 * vary in warmth and brightness, so a night street never looks switched on all at once.
 */
export function windowColor(style: WindowStyle, h: number, litShare?: number): number {
  const share = litShare ?? LIT_SHARE[style];
  if (h >= share) return glow(UNLIT);
  const list = LIT[style];
  const t = h / share;
  const hex = list[Math.floor(t * list.length) % list.length];
  // a few dimmer windows (curtains drawn)
  const dim = hash01(Math.floor(h * 100003), 7) < 0.25 ? 0.78 : 1;
  return glow(hex, dim);
}

/** Lamp / sign glow helpers. */
export const LAMP = '#fff0c0';
