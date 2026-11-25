// Deterministic plan of city blocks, districts and buildings (pure data, no three.js).
import { CITY } from './layout.js';
import { RNG } from '../util/rng.js';

const rng = new RNG(4242);
export const SIDEWALK = 4.5;

export const blocks = [];
export const buildings = [];

const SPECIAL = {
  '6,4': 'tower', '9,1': 'vanta', '4,7': 'police', '8,2': 'clinic', '4,3': 'retune', '7,5': 'supply', '1,6': 'safehouse',
  '5,5': 'park', '2,3': 'park', '10,6': 'biodome', '0,8': 'park', '12,2': 'park', '0,1': 'biodome', '8,9': 'park',
  '5,7': 'parking', '9,8': 'parking', '3,1': 'parking', '11,7': 'parking', '2,9': 'parking',
  '7,3': 'plaza', '3,5': 'plaza', '10,8': 'dome',
  '5,3': 'twin', '8,6': 'twin', '6,1': 'twin',
};

// Mostly white, pearl and glass; bronze and terracotta are the warm accents.
export const BUILDING_COLORS = {
  white: [0.93, 0.94, 0.95],
  pearl: [0.86, 0.87, 0.88],
  silver: [0.68, 0.71, 0.75],
  glass: [0.52, 0.70, 0.82],
  ice: [0.78, 0.87, 0.92],
  sky: [0.42, 0.62, 0.80],
  cream: [0.93, 0.89, 0.81],
  sand: [0.86, 0.78, 0.62],
  terracotta: [0.78, 0.39, 0.23],
  clay: [0.66, 0.32, 0.19],
  bronze: [0.74, 0.50, 0.33],
  blush: [0.90, 0.76, 0.68],
  sage: [0.62, 0.72, 0.66],
  slate: [0.32, 0.33, 0.35],
  graphite: [0.19, 0.20, 0.22],
  obsidian: [0.10, 0.11, 0.14],
};

// What each district builds. shop rows: 0 retail, 1 food, 2 lobby, 3 industrial.
// shapes: box | taper (leans in towards the top) | round | hyper (hourglass with a lattice skin)
export const DISTRICTS = {
  downtown: { name: 'Downtown', h: [70, 235], styles: ['glass', 'glass', 'panel', 'fins', 'bands'], colors: ['white', 'ice', 'glass', 'sky', 'pearl', 'silver', 'glass'],
    shapes: [['box', 2], ['taper', 3], ['round', 3], ['hyper', 1.6]], lots: [[1, 1, 4], [2, 1, 4], [1, 2, 4], [2, 2, 2]], shops: [2, 2, 0, 1], billboards: 0.12, halo: 0.55, garden: 0.6, lawn: 0.5 },
  strip: { name: 'Token Row', h: [18, 62], styles: ['panel', 'glass', 'bands', 'panel'], colors: ['white', 'pearl', 'silver', 'ice', 'blush', 'glass'],
    shapes: [['box', 4], ['round', 2], ['taper', 1]], lots: [[2, 2, 3], [3, 2, 4], [2, 1, 1]], shops: [1, 1, 0, 1], billboards: 0.4, halo: 0.5, garden: 0.5, lawn: 0 },
  ocean: { name: 'Oceanfront', h: [34, 105], styles: ['fins', 'bands', 'bands', 'glass'], colors: ['white', 'pearl', 'ice', 'sand', 'white', 'blush'],
    shapes: [['box', 2], ['round', 3], ['taper', 2], ['hyper', 0.6]], lots: [[1, 2, 5], [1, 3, 2], [1, 1, 1]], shops: [1, 0, 2], billboards: 0.08, halo: 0.5, garden: 0.7, lawn: 0.6 },
  oldtown: { name: 'Old Town', h: [9, 26], styles: ['brick', 'brick', 'grid', 'fins'], colors: ['cream', 'sand', 'terracotta', 'blush', 'white', 'clay'],
    shapes: [['box', 1]], lots: [[3, 2, 3], [3, 3, 4], [2, 3, 2]], shops: [1, 0, 0, -1, -1], billboards: 0.02, halo: 0.05, garden: 0.28, lawn: 0 },
  docks: { name: 'Docklands', h: [8, 20], styles: ['bands', 'grid', 'panel'], colors: ['silver', 'pearl', 'graphite', 'sand', 'white'],
    shapes: [['box', 1]], lots: [[1, 1, 2], [2, 1, 4], [1, 2, 3], [2, 2, 1]], shops: [3, 3, 3, -1], billboards: 0.06, halo: 0.1, garden: 0.15, lawn: 0 },
  uptown: { name: 'Uptown Tech Park', h: [26, 96], styles: ['glass', 'panel', 'bands', 'glass'], colors: ['white', 'ice', 'glass', 'sky', 'pearl'],
    shapes: [['round', 3], ['taper', 2], ['box', 2], ['hyper', 1.2]], lots: [[1, 1, 3], [2, 1, 3], [1, 2, 3], [2, 2, 1]], shops: [2, 2, -1], billboards: 0.08, halo: 0.5, garden: 0.7, lawn: 1, setback: 7 },
  riverside: { name: 'Riverside', h: [22, 58], styles: ['fins', 'bands', 'grid', 'bands'], colors: ['white', 'pearl', 'sage', 'sand', 'ice'],
    shapes: [['box', 2], ['round', 2], ['taper', 1]], lots: [[2, 2, 4], [2, 1, 2], [2, 3, 2]], shops: [0, 1, -1, -1], billboards: 0.03, halo: 0.25, garden: 0.7, lawn: 0.8, setback: 4 },
  midtown: { name: 'Midtown', h: [26, 96], styles: ['grid', 'bands', 'glass', 'panel', 'fins'], colors: ['white', 'pearl', 'cream', 'silver', 'glass', 'ice', 'sand'],
    shapes: [['box', 3], ['taper', 2], ['round', 2], ['hyper', 0.4]], lots: [[2, 2, 4], [2, 1, 3], [1, 2, 3], [1, 1, 1], [3, 2, 1]], shops: [0, 1, 0, 2], billboards: 0.1, halo: 0.3, garden: 0.42, lawn: 0.3 },
};

export function districtOf(i, j, cx, cz) {
  const dCore = Math.hypot(cx - CITY.core.x, cz - CITY.core.z);
  if (i >= 11) return 'ocean';
  if ((j === 4 || j === 5) && i >= 8) return 'strip';
  if (dCore < 235) return 'downtown';
  if (j <= 1) return 'uptown';
  if (i <= 4 && j >= 6) return 'oldtown';
  if (j >= 8 && i >= 6) return 'docks';
  if (i <= 1) return 'riverside';
  return 'midtown';
}

function addBuilding(b) {
  b.id = buildings.length;
  buildings.push(b);
  return b;
}

function weighted(list) {
  let total = 0;
  for (const l of list) total += l[l.length - 1];
  let r = rng.next() * total;
  for (const l of list) { r -= l[l.length - 1]; if (r <= 0) return l; }
  return list[0];
}

// Builds one building record. For round and hyper shapes the footprint is the inscribed circle.
export function makeTower(x0, x1, z0, z1, h, style, color, opts = {}) {
  let shape = opts.shape || 'box';
  const w = x1 - x0, d = z1 - z0;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if ((shape === 'round' || shape === 'hyper') && (Math.min(w, d) < 20 || Math.max(w, d) / Math.min(w, d) > 2.1)) shape = 'box';
  if (shape === 'hyper' && h < 56) shape = 'round';
  if (shape === 'taper' && (h < 30 || Math.min(w, d) < 18)) shape = 'box';
  const b = {
    x0, x1, z0, z1, h, style, color, shape, cx, cz, tiers: [],
    halo: opts.halo ?? false,
    spire: opts.spire ?? false,
    billboard: opts.billboard ?? false,
    shop: opts.shop ?? -1,
    roof: opts.roof || 'plant',
    kind: opts.kind || 'generic',
    district: opts.district || 'midtown',
    accent: opts.accent || null,
  };
  if (shape === 'round') {
    const r = Math.min(w, d) / 2;
    b.r = r;
    b.x0 = cx - r; b.x1 = cx + r; b.z0 = cz - r; b.z1 = cz + r;
    const two = h > 70 && rng.chance(0.6);
    const cut = two ? h * rng.float(0.55, 0.72) : h;
    const lean = opts.lean ?? rng.float(0, 0.12);
    b.tiers.push({ r0: r, r1: r * (1 - lean * (cut / h)), y0: 0, y1: cut });
    if (two) { const r2 = r * (1 - lean) * rng.float(0.74, 0.86); b.tiers.push({ r0: r2, r1: r2 * (1 - lean * 0.6), y0: cut, y1: h }); }
    b.topR = b.tiers[b.tiers.length - 1].r1;
  } else if (shape === 'hyper') {
    const r = Math.min(w, d) / 2;
    b.r = r;
    b.x0 = cx - r; b.x1 = cx + r; b.z0 = cz - r; b.z1 = cz + r;
    // hourglass: narrowest a little above the middle, flaring into a crown
    b.waist = opts.waist ?? rng.float(0.5, 0.64);
    b.waistAt = opts.waistAt ?? rng.float(0.52, 0.66);
    b.crown = opts.crown ?? rng.float(0.86, 1.02);
    const profile = [];
    const N = 12;
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const below = t < b.waistAt;
      const u = below ? (b.waistAt - t) / b.waistAt : (t - b.waistAt) / (1 - b.waistAt);
      const edge = below ? 1 : b.crown;
      profile.push([r * (b.waist + (edge - b.waist) * u * u), t * h]);
    }
    b.profile = profile;
    b.topR = profile[N][0];
    b.style = 'diagrid';
    b.roof = 'garden';
  } else {
    let base = 0, cx0 = x0, cx1 = x1, cz0 = z0, cz1 = z1;
    const inset = (fx, fz) => { const sx = (cx1 - cx0) * fx, sz = (cz1 - cz0) * fz; cx0 += sx; cx1 -= sx; cz0 += sz; cz1 -= sz; };
    if (opts.podium && h > 60 && w > 30 && d > 30) {
      const ph = 10.5 + rng.int(0, 2) * 3.5;
      b.tiers.push({ x0, x1, z0, z1, y0: 0, y1: ph });
      base = ph;
      inset(rng.float(0.1, 0.2), rng.float(0.1, 0.2));
    }
    if (shape === 'taper') {
      const ins = Math.min(cx1 - cx0, cz1 - cz0) * rng.float(0.14, 0.26);
      b.tiers.push({ x0: cx0, x1: cx1, z0: cz0, z1: cz1, y0: base, y1: h, ins });
    } else {
      const nT = h > 130 ? 3 : h > 55 ? 2 : 1;
      for (let t = 0; t < nT; t++) {
        const remain = h - base;
        const top = t === nT - 1 ? h : base + remain * (nT - t === 3 ? rng.float(0.45, 0.55) : rng.float(0.55, 0.7));
        b.tiers.push({ x0: cx0, x1: cx1, z0: cz0, z1: cz1, y0: base, y1: top });
        inset(rng.float(0.08, 0.16), rng.float(0.08, 0.16));
        base = top;
      }
    }
  }
  return addBuilding(b);
}

function genericBlock(block, bx0, bx1, bz0, bz1) {
  const D = DISTRICTS[block.district];
  const dCore = Math.hypot(block.cx - CITY.core.x, block.cz - CITY.core.z);
  const [nx, nz] = weighted(D.lots);
  const gap = block.district === 'oldtown' ? 3.5 : 7;
  const sb = D.setback || 0;
  const X0 = bx0 + sb, X1 = bx1 - sb, Z0 = bz0 + sb, Z1 = bz1 - sb;
  const cutsX = [X0], cutsZ = [Z0];
  for (let k = 1; k < nx; k++) cutsX.push(X0 + ((X1 - X0) * k) / nx + rng.float(-5, 5));
  for (let k = 1; k < nz; k++) cutsZ.push(Z0 + ((Z1 - Z0) * k) / nz + rng.float(-5, 5));
  cutsX.push(X1); cutsZ.push(Z1);
  const coreK = Math.exp(-dCore / 260);
  for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
    const x0 = cutsX[a] + (a ? gap / 2 : 0), x1 = cutsX[a + 1] - (a < nx - 1 ? gap / 2 : 0);
    const z0 = cutsZ[b] + (b ? gap / 2 : 0), z1 = cutsZ[b + 1] - (b < nz - 1 ? gap / 2 : 0);
    if (block.district === 'oldtown' && rng.chance(0.08)) continue; // little courtyards
    let h = D.h[0] + (D.h[1] - D.h[0]) * Math.pow(rng.next(), 1.5);
    if (block.district === 'downtown') h = D.h[0] + (D.h[1] - D.h[0]) * rng.float(0.15, 1) * (0.35 + 0.65 * coreK * 1.6);
    if (nx * nz >= 6) h *= 0.8;
    h = Math.max(7, Math.round(h / 3.5) * 3.5);
    const shape = weighted(D.shapes)[0];
    const tall = h > 100;
    const roofs = block.district === 'ocean' ? ['pool', 'garden', 'garden', 'pool'] : block.district === 'oldtown' ? ['tank', 'garden', 'plant', 'garden']
      : block.district === 'downtown' ? ['helipad', 'garden', 'plant', 'garden'] : block.district === 'docks' ? ['vents', 'vents', 'plant'] : ['plant', 'garden', 'garden', 'vents'];
    makeTower(x0, x1, z0, z1, h, rng.pick(D.styles), rng.pick(D.colors), {
      district: block.district, shape,
      podium: block.district === 'downtown',
      halo: rng.chance(D.halo),
      spire: tall && shape !== 'hyper' && rng.chance(0.5),
      billboard: h > 14 && shape === 'box' && rng.chance(D.billboards),
      shop: rng.pick(D.shops),
      roof: rng.chance(D.garden) ? 'garden' : rng.pick(roofs),
      accent: rng.chance(0.3) ? rng.pick(['bronze', 'terracotta', 'bronze']) : null,
    });
  }
}

function buildPlan() {
  const { xs, zs, xw, zw } = CITY;
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const x0 = xs[i] + xw[i], x1 = xs[i + 1] - xw[i + 1], z0 = zs[j] + zw[j], z1 = zs[j + 1] - zw[j + 1];
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const kind = SPECIAL[`${i},${j}`] || 'generic';
    const district = districtOf(i, j, cx, cz);
    const block = { i, j, x0, x1, z0, z1, kind, cx, cz, district, first: buildings.length };
    blocks.push(block);
    const bx0 = x0 + SIDEWALK, bx1 = x1 - SIDEWALK, bz0 = z0 + SIDEWALK, bz1 = z1 - SIDEWALK;
    const o = { district };
    // towers standing in lawns rather than on paving
    block.lawn = kind === 'generic' ? rng.chance(DISTRICTS[district].lawn) : kind === 'twin' || kind === 'tower' || kind === 'clinic' || kind === 'vanta';
    switch (kind) {
      case 'generic': genericBlock(block, bx0, bx1, bz0, bz1); break;
      case 'tower':
        // Claude Tower: a tapering round shaft; city.js adds the ribs, ring decks and the spark
        block.tower = makeTower(cx - 25, cx + 25, cz - 25, cz + 25, 262, 'glass', 'ice', { ...o, shape: 'round', lean: 0.42, kind: 'tower', shop: 2, roof: 'none' });
        break;
      case 'twin': {
        // a pair of hourglass towers of different heights, linked by sky bridges
        const big = 150 + rng.int(0, 3) * 14, small = big * rng.float(0.62, 0.78);
        const flip = rng.chance(0.5) ? 1 : -1;
        block.twin = [
          makeTower(cx - flip * 20 - 19, cx - flip * 20 + 19, cz - 8 - 19, cz - 8 + 19, big, 'diagrid', 'ice', { ...o, shape: 'hyper', kind: 'twin', accent: 'bronze', shop: 2 }),
          makeTower(cx + flip * 21 - 15, cx + flip * 21 + 15, cz + 12 - 15, cz + 12 + 15, small, 'diagrid', 'white', { ...o, shape: 'hyper', kind: 'twin', accent: 'bronze', shop: 2 }),
        ];
        break;
      }
      case 'vanta':
        makeTower(bx0, bx1, bz0, cz - 6, 154, 'glass', 'obsidian', { ...o, shape: 'taper', halo: true, spire: true, kind: 'vanta', shop: 2, podium: true });
        block.lot = { x0: bx0, x1: bx1, z0: cz + 2, z1: bz1 };
        break;
      case 'police':
        makeTower(bx0 + 4, bx1 - 4, bz0, cz - 6, 31.5, 'bands', 'silver', { ...o, halo: true, kind: 'police', shop: 2, roof: 'helipad' });
        block.lot = { x0: bx0, x1: bx1, z0: cz, z1: bz1 };
        break;
      case 'clinic':
        makeTower(bx0 + 6, bx1 - 6, bz0 + 14, bz1 - 6, 42, 'bands', 'white', { ...o, halo: true, kind: 'clinic', shop: 2, roof: 'helipad' });
        break;
      case 'retune':
        makeTower(bx0, bx1, bz0, bz0 + 26, 10.5, 'bands', 'pearl', { ...o, kind: 'retune', shop: 3, roof: 'vents', accent: 'terracotta' });
        block.lot = { x0: bx0, x1: bx1, z0: bz0 + 30, z1: bz1 };
        break;
      case 'supply':
        makeTower(cx - 18, cx + 18, bz0, bz0 + 22, 14, 'panel', 'white', { ...o, halo: true, kind: 'supply', shop: 0 });
        makeTower(bx0, bx0 + 28, cz + 6, bz1, 59.5, 'bands', 'pearl', { ...o, shape: 'round', shop: 0, roof: 'garden' });
        makeTower(bx1 - 28, bx1, cz + 6, bz1, 77, 'glass', 'glass', { ...o, shape: 'taper', shop: 2, halo: true });
        break;
      case 'safehouse':
        makeTower(bx0 + 4, bx1 - 4, bz0 + 12, bz1 - 6, 24.5, 'brick', 'cream', { ...o, kind: 'safehouse', shop: 0, roof: 'garden', accent: 'terracotta' });
        break;
      case 'park': block.park = true; break;
      case 'biodome': block.park = true; block.biodome = true; break;
      case 'plaza': block.plaza = true; break;
      case 'dome': block.dome = true; break;
      case 'parking': block.lot = { x0: bx0, x1: bx1, z0: bz0, z1: bz1 }; break;
    }
    block.last = buildings.length;
  }
}
buildPlan();

// Where pedestrians walk: a rectangle loop just inside each block's kerb.
export function sidewalkLoop(block) {
  const m = 3.3;
  return [
    { x: block.x0 + m, z: block.z0 + m }, { x: block.x1 - m, z: block.z0 + m },
    { x: block.x1 - m, z: block.z1 - m }, { x: block.x0 + m, z: block.z1 - m },
  ];
}

export function blockAt(x, z) {
  const i = Math.floor((x - CITY.x0) / 100), j = Math.floor((z - CITY.z0) / 100);
  if (i < 0 || j < 0 || i >= CITY.xs.length - 1 || j >= CITY.zs.length - 1) return null;
  return blocks[i * (CITY.zs.length - 1) + j];
}
export function districtAt(x, z) {
  const b = blockAt(x, z);
  return b ? DISTRICTS[b.district].name : null;
}
