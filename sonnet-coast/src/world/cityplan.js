// Deterministic plan of city blocks and buildings (pure data, no three.js).
import { CITY } from './layout.js';
import { RNG } from '../util/rng.js';

const rng = new RNG(4242);
export const SIDEWALK = 4.5;
const ROAD_HW = CITY.roadW / 2;

export const blocks = [];
export const buildings = [];

const SPECIAL = {
  '0,3': 'safehouse', '4,2': 'tower', '7,4': 'vanta', '1,5': 'police', '6,0': 'clinic',
  '2,1': 'retune', '5,3': 'supply', '3,3': 'park', '8,1': 'park', '2,4': 'parking', '6,5': 'parking',
};

const STYLES = ['grid', 'glass', 'bands'];
const COLORS = {
  terracotta: [0.78, 0.39, 0.23],
  clay: [0.66, 0.32, 0.19],
  cream: [0.93, 0.89, 0.81],
  sand: [0.86, 0.78, 0.62],
  slate: [0.26, 0.26, 0.25],
  graphite: [0.16, 0.16, 0.16],
  glass: [0.24, 0.38, 0.45],
  obsidian: [0.07, 0.08, 0.1],
};
export { COLORS as BUILDING_COLORS };

function addBuilding(b) {
  b.id = buildings.length;
  buildings.push(b);
  return b;
}

function tieredTower(x0, x1, z0, z1, h, style, color, opts = {}) {
  const tiers = [];
  const nT = h > 120 ? 3 : h > 60 ? 2 : 1;
  let cx0 = x0, cx1 = x1, cz0 = z0, cz1 = z1, base = 0;
  for (let t = 0; t < nT; t++) {
    const top = t === nT - 1 ? h : base + h * (t === 0 ? rng.float(0.45, 0.6) : rng.float(0.25, 0.35));
    tiers.push({ x0: cx0, x1: cx1, z0: cz0, z1: cz1, y0: base, y1: top });
    const sx = (cx1 - cx0) * rng.float(0.1, 0.18), sz = (cz1 - cz0) * rng.float(0.1, 0.18);
    cx0 += sx; cx1 -= sx; cz0 += sz; cz1 -= sz;
    base = top;
  }
  return addBuilding({
    x0, x1, z0, z1, h, style, color, tiers,
    neon: opts.neon ?? (rng.chance(0.55) ? rng.pick(['coral', 'cyan', 'amber', 'magenta']) : null),
    spire: opts.spire ?? (h > 110 && rng.chance(0.5)),
    billboard: opts.billboard ?? (h > 35 && rng.chance(0.35)),
    kind: opts.kind || 'generic',
  });
}

function genericBlock(bx0, bx1, bz0, bz1, cx, cz) {
  const dCore = Math.hypot(cx - CITY.core.x, cz - CITY.core.z);
  const maxH = 22 + 175 * Math.exp(-dCore / 210);
  const r = rng.next();
  const lots = [];
  const gap = 6;
  const mx = (bx0 + bx1) / 2 + rng.float(-8, 8), mz = (bz0 + bz1) / 2 + rng.float(-8, 8);
  if (r < 0.25) lots.push([bx0, bx1, bz0, bz1]);
  else if (r < 0.55) {
    if (rng.chance(0.5)) { lots.push([bx0, mx - gap / 2, bz0, bz1], [mx + gap / 2, bx1, bz0, bz1]); }
    else { lots.push([bx0, bx1, bz0, mz - gap / 2], [bx0, bx1, mz + gap / 2, bz1]); }
  } else {
    lots.push([bx0, mx - gap / 2, bz0, mz - gap / 2], [mx + gap / 2, bx1, bz0, mz - gap / 2],
      [bx0, mx - gap / 2, mz + gap / 2, bz1], [mx + gap / 2, bx1, mz + gap / 2, bz1]);
  }
  for (const [x0, x1, z0, z1] of lots) {
    const inset = rng.float(0, 3);
    const big = (x1 - x0) * (z1 - z0) > 2500;
    let h = maxH * rng.float(0.35, 1) * (big ? 1 : 0.75);
    h = Math.max(10, Math.round(h / 3.5) * 3.5);
    const palette = h > 90 ? ['glass', 'glass', 'cream', 'slate', 'terracotta', 'obsidian']
      : ['terracotta', 'cream', 'sand', 'slate', 'clay', 'glass', 'cream'];
    tieredTower(x0 + inset, x1 - inset, z0 + inset, z1 - inset, h, rng.pick(STYLES), rng.pick(palette));
  }
}

function buildPlan() {
  const { xs, zs } = CITY;
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const x0 = xs[i] + ROAD_HW, x1 = xs[i + 1] - ROAD_HW, z0 = zs[j] + ROAD_HW, z1 = zs[j + 1] - ROAD_HW;
    const kind = SPECIAL[`${i},${j}`] || 'generic';
    const block = { i, j, x0, x1, z0, z1, kind, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
    blocks.push(block);
    const bx0 = x0 + SIDEWALK, bx1 = x1 - SIDEWALK, bz0 = z0 + SIDEWALK, bz1 = z1 - SIDEWALK;
    const cx = block.cx, cz = block.cz;
    switch (kind) {
      case 'generic': genericBlock(bx0, bx1, bz0, bz1, cx, cz); break;
      case 'tower':
        block.tower = tieredTower(cx - 22, cx + 22, cz - 22, cz + 22, 252, 'glass', 'cream',
          { neon: 'coral', spire: false, billboard: false, kind: 'tower' });
        tieredTower(bx0, bx0 + 16, bz0, bz0 + 22, 28, 'grid', 'terracotta', { neon: 'coral', billboard: false });
        tieredTower(bx1 - 16, bx1, bz0, bz0 + 22, 28, 'grid', 'terracotta', { neon: 'coral', billboard: false });
        break;
      case 'vanta':
        tieredTower(bx0, bx1, bz0, cz - 4, 150, 'glass', 'obsidian', { neon: 'magenta', spire: true, billboard: true, kind: 'vanta' });
        block.lot = { x0: bx0, x1: bx1, z0: cz + 2, z1: bz1 };
        break;
      case 'police':
        tieredTower(bx0 + 4, bx1 - 4, bz0, cz - 6, 34, 'bands', 'slate', { neon: 'cyan', billboard: false, kind: 'police' });
        block.lot = { x0: bx0, x1: bx1, z0: cz, z1: bz1 };
        break;
      case 'clinic':
        tieredTower(bx0 + 6, bx1 - 6, bz0 + 14, bz1 - 6, 42, 'bands', 'cream', { neon: 'coral', billboard: false, kind: 'clinic' });
        break;
      case 'retune':
        tieredTower(bx0, bx1, bz0, bz0 + 26, 12, 'bands', 'terracotta', { neon: 'amber', billboard: true, kind: 'retune' });
        block.lot = { x0: bx0, x1: bx1, z0: bz0 + 30, z1: bz1 };
        break;
      case 'supply':
        tieredTower(cx - 18, cx + 18, bz0, bz0 + 22, 14, 'grid', 'sand', { neon: 'cyan', billboard: true, kind: 'supply' });
        tieredTower(bx0, bx0 + 28, cz + 6, bz1, 56, 'grid', 'cream');
        tieredTower(bx1 - 28, bx1, cz + 6, bz1, 77, 'glass', 'glass');
        break;
      case 'safehouse':
        tieredTower(bx0 + 4, bx1 - 4, bz0 + 4, bz1 - 10, 31.5, 'grid', 'clay', { neon: 'amber', billboard: false, kind: 'safehouse' });
        break;
      case 'park': block.park = true; break;
      case 'parking': block.lot = { x0: bx0, x1: bx1, z0: bz0, z1: bz1 }; break;
    }
  }
}
buildPlan();

// Where pedestrians walk: a rectangle loop just inside each block's kerb.
export function sidewalkLoop(block) {
  const m = 2.2;
  return [
    { x: block.x0 + m, z: block.z0 + m }, { x: block.x1 - m, z: block.z0 + m },
    { x: block.x1 - m, z: block.z1 - m }, { x: block.x0 + m, z: block.z1 - m },
  ];
}

export function blockAt(x, z) {
  for (const b of blocks) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) return b;
  return null;
}
