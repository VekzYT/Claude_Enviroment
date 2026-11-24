// The ground texture atlas: every ground look (grass, sand, lots, paving, all 16 road pieces) painted
// pixel by pixel into one canvas at 32 texels per tile. Sampled with NearestFilter up close so it
// reads as crisp pixel art that matches the voxel buildings.
import * as THREE from 'three';
import { hash01 } from '../core/rng';
import { ZONE_COLORS } from '../core/defs';

/** Texels per tile side. */
export const TEX = 32;
const GUTTER = 16;
const STRIDE = TEX + GUTTER * 2;
const COLS = 8;
const ROWS = 4;
const W = COLS * STRIDE;
const H = ROWS * STRIDE;

// Cell ids.
export const CELL_GRASS = 0; // 0..3 grass variants
export const CELL_SAND = 4;
export const CELL_BED = 5;
export const CELL_LOT = 6; // + zone - 1 (res, com, ind): zoned but empty
export const CELL_DEV = 9; // + zone - 1: developed lot ground (yard, paving, concrete)
export const CELL_PLAZA = 12;
export const CELL_GRAVEL = 13;
export const CELL_PARK = 14;
export const CELL_WHITE = 15;
export const CELL_ROAD = 16; // + 4-neighbour mask (N=1, E=2, S=4, W=8)

/** Pixel offsets of the asphalt inside a road tile, and the lane offset cars drive at. */
export const ROAD_ASPHALT_MIN = 5;
export const ROAD_ASPHALT_MAX = 27;
export const LANE_OFFSET = 5.5 / TEX;
/** Distance of the sidewalk centre from the tile centre (where street lamps stand). */
export const SIDEWALK_OFFSET = (TEX / 2 - ROAD_ASPHALT_MIN / 2) / TEX;

type RGB = [number, number, number];

function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function shade(a: RGB, f: number): RGB {
  return [a[0] * f, a[1] * f, a[2] * f];
}

export const GROUND_COLORS = {
  grass: hex('#86bd5e'),
  grassLight: hex('#93c76a'),
  grassDark: hex('#74ab50'),
  sand: hex('#efdca3'),
  sandDark: hex('#d9c088'),
  bed: hex('#5aa6a0'),
  asphalt: hex('#4d5361'),
  sidewalk: hex('#d8d2c4'),
  curb: hex('#b2ac9f'),
  marking: hex('#f4f0e4'),
  kerb: hex('#e9e4d6'),
  pavers: hex('#dcd5c6'),
  concrete: hex('#b7b5ad'),
  hazard: hex('#f0c040'),
  plaza: hex('#e6dcc6'),
  gravel: hex('#bdb6a6'),
  park: hex('#7fc25c'),
  path: hex('#e2d6bb'),
};

/** Paints a 32×32 cell; fn returns the colour of texel (u, v), v growing south (+z). */
type Painter = (u: number, v: number) => RGB;

export interface GroundAtlas {
  texture: THREE.CanvasTexture;
  /** UV rectangle of a cell's content: [u0, v0, u1, v1] (v0 = north edge, flipY is off). */
  rect(cell: number): [number, number, number, number];
}

export function createGroundAtlas(): GroundAtlas {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const data = img.data;

  const paint = (cell: number, fn: Painter) => {
    const cx = (cell % COLS) * STRIDE + GUTTER;
    const cy = Math.floor(cell / COLS) * STRIDE + GUTTER;
    // content plus clamped gutters so mipmaps and filtering never pull in a neighbouring cell
    for (let y = -GUTTER; y < TEX + GUTTER; y++) {
      for (let x = -GUTTER; x < TEX + GUTTER; x++) {
        const u = Math.min(TEX - 1, Math.max(0, x));
        const v = Math.min(TEX - 1, Math.max(0, y));
        const c = fn(u, v);
        const o = ((cy + y) * W + (cx + x)) * 4;
        data[o] = Math.max(0, Math.min(255, Math.round(c[0])));
        data[o + 1] = Math.max(0, Math.min(255, Math.round(c[1])));
        data[o + 2] = Math.max(0, Math.min(255, Math.round(c[2])));
        data[o + 3] = 255;
      }
    }
  };
  // memoise painters per texel so gutter repeats don't recompute (and stay consistent)
  const cached = (fn: Painter): Painter => {
    const memo: RGB[] = new Array(TEX * TEX);
    return (u, v) => memo[v * TEX + u] ?? (memo[v * TEX + u] = fn(u, v));
  };

  const G = GROUND_COLORS;

  // ---- grass: soft pixel noise, a few tufts, flowers on one variant
  for (let k = 0; k < 4; k++) {
    paint(
      CELL_GRASS + k,
      cached((u, v) => {
        const n = hash01(u, v, 11 + k);
        let c: RGB = shade(G.grass, 0.97 + n * 0.06);
        const t = hash01(u * 3 + 1, v * 7 + 2, 40 + k);
        if (t > 0.93) c = G.grassLight;
        else if (t < 0.05) c = G.grassDark;
        // a two-texel blade: light top, dark foot
        if (hash01(u, v - 1, 77 + k) > 0.975) c = G.grassDark;
        if (k === 3) {
          const f = hash01(u, v, 999);
          if (f > 0.992) c = hex('#fff6e0');
          else if (f > 0.987) c = hex('#ffd65a');
          else if (f > 0.983) c = hex('#ff9fb8');
        }
        return c;
      }),
    );
  }

  // ---- sand
  paint(
    CELL_SAND,
    cached((u, v) => {
      const n = hash01(u, v, 5);
      let c: RGB = shade(G.sand, 0.96 + n * 0.07);
      if (hash01(u * 5, v * 3, 6) > 0.96) c = G.sandDark;
      return c;
    }),
  );

  // ---- lake bed (seen through the water)
  paint(
    CELL_BED,
    cached((u, v) => {
      const n = hash01(u, v, 9);
      let c: RGB = shade(G.bed, 0.92 + n * 0.14);
      if (hash01(u * 3, v * 5, 10) > 0.95) c = shade(G.bed, 1.18);
      return c;
    }),
  );

  // ---- zoned, still empty lots: tinted ground, kerb outline, dashed zone line, light hatch
  const zoneHex = [ZONE_COLORS.res, ZONE_COLORS.com, ZONE_COLORS.ind];
  for (let z = 0; z < 3; z++) {
    const zc = hex(zoneHex[z]);
    const fill = mix(mix(G.grass, zc, 0.4), [255, 255, 255], 0.22);
    paint(
      CELL_LOT + z,
      cached((u, v) => {
        const edge = Math.min(u, v, TEX - 1 - u, TEX - 1 - v);
        if (edge === 0) return G.kerb;
        if (edge === 2) {
          const along = u === 2 || u === TEX - 3 ? v : u;
          if (along % 5 < 3) return shade(zc, 0.95);
        }
        let c = shade(fill, 0.98 + hash01(u, v, 30 + z) * 0.04);
        if ((u + v) % 7 === 0) c = shade(c, 0.94);
        return c;
      }),
    );
  }

  // ---- developed lot ground. Canonical front (facing the road) is the +z edge (v = 31).
  // Homes: a lush yard with a stone path to the door.
  paint(
    CELL_DEV + 0,
    cached((u, v) => {
      const edge = Math.min(u, v, TEX - 1 - u, TEX - 1 - v);
      if (edge === 0) return G.kerb;
      if (u >= 14 && u <= 17 && v >= 22) return shade(G.path, 0.95 + hash01(u, v, 3) * 0.08);
      let c: RGB = shade(mix(G.grass, G.grassLight, 0.45), 0.97 + hash01(u, v, 41) * 0.05);
      if (hash01(u * 7, v * 3, 42) > 0.95) c = G.grassDark;
      return c;
    }),
  );
  // Shops: pavers with joints.
  paint(
    CELL_DEV + 1,
    cached((u, v) => {
      const edge = Math.min(u, v, TEX - 1 - u, TEX - 1 - v);
      if (edge === 0) return shade(G.pavers, 0.86);
      if (u % 4 === 0 || v % 4 === 0) return shade(G.pavers, 0.91);
      const t = hash01(Math.floor(u / 4), Math.floor(v / 4), 50);
      return shade(G.pavers, 0.97 + t * 0.06);
    }),
  );
  // Industry: concrete yard, a few stains, a hazard-striped loading strip at the front.
  paint(
    CELL_DEV + 2,
    cached((u, v) => {
      const edge = Math.min(u, v, TEX - 1 - u, TEX - 1 - v);
      if (edge === 0) return shade(G.concrete, 0.82);
      if (v >= 26 && v <= 28 && u >= 3 && u <= 28) return (u + v) % 4 < 2 ? G.hazard : shade(G.asphalt, 1.2);
      let c: RGB = shade(G.concrete, 0.95 + hash01(u, v, 60) * 0.08);
      const s1 = Math.hypot(u - 9, v - 10);
      const s2 = Math.hypot(u - 23, v - 17);
      if (s1 < 3.5 || s2 < 2.5) c = shade(c, 0.88);
      if (u % 8 === 0 && v < 24) c = shade(c, 0.93);
      return c;
    }),
  );

  // ---- under service buildings
  paint(
    CELL_PLAZA,
    cached((u, v) => {
      const row = Math.floor(v / 4);
      const off = row % 2 === 0 ? 0 : 4;
      if (v % 4 === 0 || (u + off) % 8 === 0) return shade(G.plaza, 0.9);
      return shade(G.plaza, 0.97 + hash01(Math.floor((u + off) / 8), row, 70) * 0.06);
    }),
  );
  paint(
    CELL_GRAVEL,
    cached((u, v) => {
      const n = hash01(u, v, 80);
      return shade(G.gravel, 0.84 + n * 0.28);
    }),
  );
  paint(
    CELL_PARK,
    cached((u, v) => {
      const n = hash01(u, v, 90);
      let c: RGB = shade(G.park, 0.97 + n * 0.06);
      if (hash01(u * 3, v * 5, 91) > 0.95) c = G.grassLight;
      return c;
    }),
  );
  paint(CELL_WHITE, () => [255, 255, 255]);

  // ---- all 16 road pieces, chosen directly by the neighbour mask
  for (let mask = 0; mask < 16; mask++) paint(CELL_ROAD + mask, roadPainter(mask));

  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  const rects: Array<[number, number, number, number]> = [];
  for (let cell = 0; cell < COLS * ROWS; cell++) {
    const x = (cell % COLS) * STRIDE + GUTTER;
    const y = Math.floor(cell / COLS) * STRIDE + GUTTER;
    rects.push([x / W, y / H, (x + TEX) / W, (y + TEX) / H]);
  }
  return { texture, rect: (cell) => rects[cell] };
}

/**
 * Road texel painter for a neighbour mask (N=1, E=2, S=4, W=8). Asphalt spans texels 5..27 across;
 * whatever is not asphalt is sidewalk, with a darker curb texel where it meets the asphalt.
 */
function roadPainter(mask: number): Painter {
  const A0 = ROAD_ASPHALT_MIN;
  const A1 = ROAD_ASPHALT_MAX;
  const HALF = (A1 - A0) / 2; // 11
  const n = (mask & 1) !== 0;
  const e = (mask & 2) !== 0;
  const s = (mask & 4) !== 0;
  const w = (mask & 8) !== 0;
  const count = +n + +e + +s + +w;
  const straight = mask === 5 || mask === 10;
  const corner = count === 2 && !straight;

  // 0 = sidewalk, 1 = asphalt, 2 = marking
  const cls = new Uint8Array(TEX * TEX);
  for (let v = 0; v < TEX; v++) {
    for (let u = 0; u < TEX; u++) {
      const px = u + 0.5;
      const pz = v + 0.5;
      const dx = px - 16;
      const dz = pz - 16;
      let asphalt = false;
      let mark = false;
      if (corner) {
        // a quarter ring around the tile corner between the two arms
        const cx = e ? TEX : 0;
        const cz = n ? 0 : TEX;
        const d = Math.hypot(px - cx, pz - cz);
        asphalt = d >= A0 && d <= A1;
        if (asphalt && Math.abs(d - 16) < 1) {
          const ang = Math.atan2(Math.abs(pz - cz), Math.abs(px - cx));
          mark = Math.floor((ang * 16) / 4) % 2 === 0;
        }
      } else if (count === 0) {
        // a lone tile: a small rounded square of asphalt (a turning bay)
        const qx = Math.max(Math.abs(dx) - 4, 0);
        const qz = Math.max(Math.abs(dz) - 4, 0);
        asphalt = Math.hypot(qx, qz) <= 6.5;
      } else if (count === 1) {
        // dead end: the arm runs in to the centre and ends in a rounded turning circle
        const dir = n ? 0 : e ? 1 : s ? 2 : 3;
        const across = dir === 0 || dir === 2 ? dx : dz;
        const fromEdge = dir === 0 ? pz : dir === 1 ? TEX - px : dir === 2 ? TEX - pz : px;
        asphalt = (Math.abs(across) <= HALF && fromEdge <= 16) || Math.hypot(dx, dz) <= HALF + 0.5;
        if (Math.abs(across) < 1 && fromEdge < 11 && Math.floor(fromEdge / 4) % 2 === 0) mark = true;
      } else {
        // straight, T and cross: a core square plus an arm for every road neighbour
        const inCore = Math.abs(dx) <= HALF && Math.abs(dz) <= HALF;
        const armN = n && Math.abs(dx) <= HALF && dz < 0;
        const armS = s && Math.abs(dx) <= HALF && dz > 0;
        const armE = e && Math.abs(dz) <= HALF && dx > 0;
        const armW = w && Math.abs(dz) <= HALF && dx < 0;
        asphalt = inCore || armN || armS || armE || armW;
        // round the curb where two arms meet
        if (!asphalt) {
          const corners: Array<[boolean, number, number]> = [
            [n && e, TEX, 0],
            [e && s, TEX, TEX],
            [s && w, 0, TEX],
            [w && n, 0, 0],
          ];
          for (const [on, cx, cz] of corners) {
            const inSquare = Math.abs(px - cx) <= A0 && Math.abs(pz - cz) <= A0;
            if (on && inSquare && Math.hypot(px - cx, pz - cz) > A0 + 1.2) asphalt = true;
          }
        }
        if (straight) {
          const along = mask === 5 ? pz : px;
          const across = mask === 5 ? dx : dz;
          if (Math.abs(across) < 1 && Math.floor(along / 4) % 2 === 0) mark = true;
        } else {
          // crosswalk stripes across every arm, right where it leaves the junction
          const stripe = (t: number) => t > A0 + 1 && t < A1 - 1 && Math.floor((t - A0 - 1) / 2) % 2 === 0;
          if (armN && pz < A0 && pz > 0.5 && stripe(px)) mark = true;
          if (armS && pz > A1 && pz < TEX - 0.5 && stripe(px)) mark = true;
          if (armE && px > A1 && px < TEX - 0.5 && stripe(pz)) mark = true;
          if (armW && px < A0 && px > 0.5 && stripe(pz)) mark = true;
        }
      }
      cls[v * TEX + u] = asphalt ? (mark ? 2 : 1) : 0;
    }
  }

  const G = GROUND_COLORS;
  return (u, v) => {
    const c = cls[v * TEX + u];
    if (c === 2) return shade(G.marking, 0.97 + hash01(u, v, 3) * 0.04);
    if (c === 1) return shade(G.asphalt, 0.95 + hash01(u, v, 100 + mask) * 0.09);
    // sidewalk: curb texel next to asphalt, otherwise paving with faint joints
    const near = (uu: number, vv: number) => uu >= 0 && vv >= 0 && uu < TEX && vv < TEX && cls[vv * TEX + uu] !== 0;
    if (near(u - 1, v) || near(u + 1, v) || near(u, v - 1) || near(u, v + 1)) return G.curb;
    if (u % 6 === 0 || v % 6 === 0) return shade(G.sidewalk, 0.95);
    return shade(G.sidewalk, 0.98 + hash01(u, v, 7) * 0.04);
  };
}
