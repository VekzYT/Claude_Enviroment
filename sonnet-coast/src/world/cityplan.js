// Deterministic plan of city blocks, districts and buildings (pure data, no three.js).
import { CITY } from './layout.js';
import { RNG } from '../util/rng.js';

const rng = new RNG(4242);
export const SIDEWALK = 4.5;

export const blocks = [];
export const buildings = [];

const SPECIAL = {
  '6,4': 'tower', '9,1': 'vanta', '4,7': 'police', '8,2': 'clinic', '4,3': 'retune', '7,5': 'supply', '1,6': 'safehouse',
  '5,5': 'park', '2,3': 'park', '10,6': 'park', '0,8': 'park', '12,2': 'park', '0,1': 'park', '8,9': 'park',
  '5,7': 'parking', '9,8': 'parking', '3,1': 'parking', '11,7': 'parking', '2,9': 'parking',
  '7,3': 'plaza', '3,5': 'plaza', '10,8': 'dome',
};

export const BUILDING_COLORS = {
  terracotta: [0.78, 0.39, 0.23],
  clay: [0.66, 0.32, 0.19],
  cream: [0.93, 0.89, 0.81],
  sand: [0.86, 0.78, 0.62],
  slate: [0.30, 0.30, 0.29],
  graphite: [0.17, 0.17, 0.18],
  glass: [0.55, 0.70, 0.78],
  ice: [0.78, 0.86, 0.90],
  obsidian: [0.10, 0.11, 0.14],
  teal: [0.30, 0.56, 0.55],
  blush: [0.90, 0.72, 0.62],
};

// What each district builds. shop rows: 0 retail, 1 food, 2 lobby, 3 industrial.
export const DISTRICTS = {
  downtown: { name: 'Downtown', h: [70, 235], styles: ['glass', 'glass', 'panel', 'fins', 'bands'], colors: ['glass', 'ice', 'cream', 'obsidian', 'slate', 'terracotta', 'glass'],
    lots: [[1, 1, 4], [2, 1, 4], [1, 2, 4], [2, 2, 2]], shops: [2, 2, 0, 1], signs: 0.5, billboards: 0.45, neon: 0.8, podium: true },
  strip: { name: 'Token Row', h: [18, 62], styles: ['panel', 'grid', 'bands', 'panel'], colors: ['obsidian', 'graphite', 'slate', 'terracotta', 'teal', 'clay'],
    lots: [[2, 2, 2], [3, 2, 5], [3, 3, 2]], shops: [1, 1, 0, 1], signs: 2.6, billboards: 0.95, neon: 1, podium: false },
  ocean: { name: 'Oceanfront', h: [34, 105], styles: ['fins', 'fins', 'grid', 'glass'], colors: ['cream', 'sand', 'blush', 'terracotta', 'teal', 'ice'],
    lots: [[1, 2, 5], [1, 3, 3], [1, 1, 1]], shops: [1, 0, 2], signs: 1.0, billboards: 0.3, neon: 0.9, podium: false },
  oldtown: { name: 'Old Town', h: [9, 26], styles: ['brick', 'brick', 'grid', 'fins'], colors: ['terracotta', 'clay', 'cream', 'sand', 'blush', 'terracotta'],
    lots: [[3, 2, 3], [3, 3, 4], [2, 3, 2]], shops: [1, 0, 0, -1, -1], signs: 0.7, billboards: 0.05, neon: 0.25, podium: false },
  docks: { name: 'Docklands', h: [8, 20], styles: ['bands', 'grid', 'panel'], colors: ['slate', 'sand', 'clay', 'graphite', 'cream'],
    lots: [[1, 1, 2], [2, 1, 4], [1, 2, 3], [2, 2, 1]], shops: [3, 3, 3, -1], signs: 0.1, billboards: 0.15, neon: 0.3, podium: false },
  uptown: { name: 'Uptown Tech Park', h: [26, 86], styles: ['glass', 'panel', 'bands', 'glass'], colors: ['glass', 'ice', 'cream', 'slate', 'obsidian'],
    lots: [[1, 1, 3], [2, 1, 3], [1, 2, 3], [2, 2, 1]], shops: [2, 2, -1], signs: 0.15, billboards: 0.3, neon: 0.7, podium: false, setback: 7 },
  riverside: { name: 'Riverside', h: [22, 58], styles: ['fins', 'grid', 'brick', 'bands'], colors: ['cream', 'sand', 'teal', 'terracotta', 'blush'],
    lots: [[2, 2, 4], [2, 1, 2], [2, 3, 2]], shops: [0, 1, -1, -1], signs: 0.4, billboards: 0.1, neon: 0.4, podium: false },
  midtown: { name: 'Midtown', h: [26, 96], styles: ['grid', 'bands', 'glass', 'panel', 'fins'], colors: ['cream', 'terracotta', 'slate', 'glass', 'sand', 'clay', 'ice'],
    lots: [[2, 2, 4], [2, 1, 3], [1, 2, 3], [1, 1, 1], [3, 2, 1]], shops: [0, 1, 0, 2], signs: 1.0, billboards: 0.35, neon: 0.6, podium: false },
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

export function makeTower(x0, x1, z0, z1, h, style, color, opts = {}) {
  const tiers = [];
  const w = x1 - x0, d = z1 - z0;
  let base = 0, cx0 = x0, cx1 = x1, cz0 = z0, cz1 = z1;
  const inset = (fx, fz) => { const sx = (cx1 - cx0) * fx, sz = (cz1 - cz0) * fz; cx0 += sx; cx1 -= sx; cz0 += sz; cz1 -= sz; };
  if (opts.podium && h > 60 && w > 30 && d > 30) {
    const ph = 10.5 + rng.int(0, 2) * 3.5;
    tiers.push({ x0, x1, z0, z1, y0: 0, y1: ph });
    base = ph;
    inset(rng.float(0.1, 0.2), rng.float(0.1, 0.2));
  }
  const nT = h > 130 ? 3 : h > 55 ? 2 : 1;
  for (let t = 0; t < nT; t++) {
    const remain = h - base;
    const top = t === nT - 1 ? h : base + remain * (nT - t === 3 ? rng.float(0.45, 0.55) : rng.float(0.55, 0.7));
    tiers.push({ x0: cx0, x1: cx1, z0: cz0, z1: cz1, y0: base, y1: top });
    inset(rng.float(0.08, 0.16), rng.float(0.08, 0.16));
    base = top;
  }
  return addBuilding({
    x0, x1, z0, z1, h, style, color, tiers,
    neon: opts.neon !== undefined ? opts.neon : null,
    spire: opts.spire ?? false,
    billboard: opts.billboard ?? false,
    signs: opts.signs ?? 0,
    shop: opts.shop ?? -1,
    roof: opts.roof || 'plant',
    kind: opts.kind || 'generic',
    district: opts.district || 'midtown',
    edges: opts.edges ?? false,
  });
}

const NEONS = ['coral', 'cyan', 'amber', 'magenta', 'lime'];

function genericBlock(block, bx0, bx1, bz0, bz1) {
  const D = DISTRICTS[block.district];
  const dCore = Math.hypot(block.cx - CITY.core.x, block.cz - CITY.core.z);
  const [nx, nz] = weighted(D.lots);
  const gap = block.district === 'oldtown' ? 3.5 : 6;
  const sb = D.setback || 0;
  const X0 = bx0 + sb, X1 = bx1 - sb, Z0 = bz0 + sb, Z1 = bz1 - sb;
  const cutsX = [X0], cutsZ = [Z0];
  for (let k = 1; k < nx; k++) cutsX.push(X0 + ((X1 - X0) * k) / nx + rng.float(-5, 5));
  for (let k = 1; k < nz; k++) cutsZ.push(Z0 + ((Z1 - Z0) * k) / nz + rng.float(-5, 5));
  cutsX.push(X1); cutsZ.push(Z1);
  // the core is tallest; height eases off with distance
  const coreK = Math.exp(-dCore / 260);
  for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
    const x0 = cutsX[a] + (a ? gap / 2 : 0), x1 = cutsX[a + 1] - (a < nx - 1 ? gap / 2 : 0);
    const z0 = cutsZ[b] + (b ? gap / 2 : 0), z1 = cutsZ[b + 1] - (b < nz - 1 ? gap / 2 : 0);
    if (block.district === 'oldtown' && rng.chance(0.08)) continue; // little courtyards
    let h = D.h[0] + (D.h[1] - D.h[0]) * Math.pow(rng.next(), 1.5);
    if (block.district === 'downtown') h = D.h[0] + (D.h[1] - D.h[0]) * rng.float(0.15, 1) * (0.35 + 0.65 * coreK * 1.6);
    if (nx * nz >= 6) h *= 0.8;
    h = Math.max(7, Math.round(h / 3.5) * 3.5);
    const style = rng.pick(D.styles), color = rng.pick(D.colors);
    const tall = h > 100;
    const area = (x1 - x0) * (z1 - z0);
    makeTower(x0, x1, z0, z1, h, style, color, {
      district: block.district,
      podium: D.podium,
      neon: rng.chance(D.neon) ? rng.pick(NEONS) : null,
      spire: tall && rng.chance(0.55),
      billboard: h > 14 && rng.chance(D.billboards),
      signs: Math.max(0, Math.round(D.signs * rng.float(0.2, 1.6))),
      shop: rng.pick(D.shops),
      roof: rng.pick(block.district === 'ocean' ? ['pool', 'garden', 'plant', 'pool'] : block.district === 'oldtown' ? ['tank', 'garden', 'plant', 'tank']
        : block.district === 'downtown' ? ['helipad', 'plant', 'plant', 'garden'] : block.district === 'docks' ? ['vents', 'vents', 'plant'] : ['plant', 'garden', 'plant', 'vents']),
      edges: block.district === 'downtown' ? rng.chance(0.6) : block.district === 'strip' ? rng.chance(0.5) : rng.chance(0.12),
    });
    void area;
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
    switch (kind) {
      case 'generic': genericBlock(block, bx0, bx1, bz0, bz1); break;
      case 'tower':
        block.tower = makeTower(cx - 23, cx + 23, cz - 23, cz + 23, 262, 'glass', 'ice', { ...o, neon: 'coral', kind: 'tower', shop: 2, roof: 'none', edges: true });
        makeTower(bx0, bx0 + 15, bz0, bz0 + 24, 24.5, 'panel', 'terracotta', { ...o, neon: 'coral', shop: 0 });
        makeTower(bx1 - 15, bx1, bz0, bz0 + 24, 24.5, 'panel', 'terracotta', { ...o, neon: 'coral', shop: 1 });
        break;
      case 'vanta':
        makeTower(bx0, bx1, bz0, cz - 6, 154, 'glass', 'obsidian', { ...o, neon: 'magenta', spire: true, billboard: true, kind: 'vanta', shop: 2, podium: true, edges: true });
        block.lot = { x0: bx0, x1: bx1, z0: cz + 2, z1: bz1 };
        break;
      case 'police':
        makeTower(bx0 + 4, bx1 - 4, bz0, cz - 6, 31.5, 'bands', 'slate', { ...o, neon: 'cyan', kind: 'police', shop: 2, roof: 'helipad' });
        block.lot = { x0: bx0, x1: bx1, z0: cz, z1: bz1 };
        break;
      case 'clinic':
        makeTower(bx0 + 6, bx1 - 6, bz0 + 14, bz1 - 6, 42, 'bands', 'cream', { ...o, neon: 'coral', kind: 'clinic', shop: 2, roof: 'helipad' });
        break;
      case 'retune':
        makeTower(bx0, bx1, bz0, bz0 + 26, 10.5, 'bands', 'terracotta', { ...o, neon: 'amber', billboard: true, kind: 'retune', shop: 3, roof: 'vents' });
        block.lot = { x0: bx0, x1: bx1, z0: bz0 + 30, z1: bz1 };
        break;
      case 'supply':
        makeTower(cx - 18, cx + 18, bz0, bz0 + 22, 14, 'panel', 'sand', { ...o, neon: 'cyan', billboard: true, kind: 'supply', shop: 0, signs: 2 });
        makeTower(bx0, bx0 + 28, cz + 6, bz1, 59.5, 'grid', 'cream', { ...o, shop: 0, signs: 1 });
        makeTower(bx1 - 28, bx1, cz + 6, bz1, 77, 'glass', 'glass', { ...o, shop: 2, neon: 'cyan' });
        break;
      case 'safehouse':
        makeTower(bx0 + 4, bx1 - 4, bz0 + 12, bz1 - 6, 24.5, 'brick', 'clay', { ...o, neon: 'amber', kind: 'safehouse', shop: 0, roof: 'garden', signs: 1 });
        break;
      case 'park': block.park = true; break;
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
