// Analytic terrain: heights, biomes and surface types are pure functions of (x, z),
// so physics can sample them anywhere without touching the render meshes.
import { makeNoise2D, fbm } from '../util/noise.js';
import { smoothstep, lerp, clamp, catmullRom } from '../util/math.js';
import { SegmentIndex } from '../util/segindex.js';
import { FLAT_ZONES, RIVER, RIVER_HALF_W, WATER_Y } from './layout.js';

const nHill = makeNoise2D(11);
const nSwamp = makeNoise2D(23);
const nChan = makeNoise2D(37);
const nDetail = makeNoise2D(41);
const nCoast = makeNoise2D(53);

export const riverIndex = new SegmentIndex(64);
export const riverPts = catmullRom(RIVER, 8);
for (let i = 0; i < riverPts.length - 1; i++) {
  const a = riverPts[i], b = riverPts[i + 1];
  riverIndex.add(a.x, a.z, b.x, b.z, 140, null);
}

export function coastEastX(z) { return 940 + 55 * Math.sin(z * 0.0061) + 25 * Math.sin(z * 0.017 + 1.3) + 12 * nCoast(z * 0.01, 3.1); }
export function coastSouthZ(x) {
  return 1190 + 45 * Math.sin(x * 0.007 + 0.5) + 18 * Math.sin(x * 0.021) + 12 * nCoast(x * 0.01, 7.7)
    + smoothstep(-500, -900, x) * 210;
}
function westEdgeX(z) { return -1430 + 30 * Math.sin(z * 0.009) + 15 * nCoast(z * 0.012, 1.7); }
function northEdgeZ(x) { return -1430 + 30 * Math.sin(x * 0.011 + 2) + 15 * nCoast(x * 0.012, 4.2); }

// Approximate signed distance to the sea: positive on land.
export function landDist(x, z) {
  return Math.min(coastEastX(z) - x, coastSouthZ(x) - z, x - westEdgeX(z), z - northEdgeZ(x));
}

export function riverDist(x, z) {
  const r = riverIndex.nearest(x, z, 140);
  return r ? r.d : 999;
}

export function forestMask(x, z) { return smoothstep(-400, -580, z); }
export function swampMask(x, z) {
  const west = smoothstep(-380, -520, x) * smoothstep(-260, -60, z);
  const south = smoothstep(420, 560, z) * smoothstep(520, 380, x);
  return clamp(Math.max(west, south), 0, 1) * (1 - forestMask(x, z));
}
export function meadowMask(x, z) {
  return smoothstep(-360, -480, x) * (1 - forestMask(x, z)) * (1 - swampMask(x, z));
}

function flatWeight(zone, x, z) {
  if (zone.r !== undefined) {
    const d = Math.hypot(x - zone.cx, z - zone.cz) - zone.r;
    return smoothstep(zone.m, 0, d);
  }
  const dx = Math.max(zone.x0 - x, 0, x - zone.x1);
  const dz = Math.max(zone.z0 - z, 0, z - zone.z1);
  return smoothstep(zone.m, 0, Math.hypot(dx, dz));
}

// Where the swamp opens into channels of open water. 0 = channel centre, 1 = dry.
export function channelFactor(x, z) {
  const c = Math.abs(fbm(nChan, x / 280, z / 280, 3));
  return smoothstep(0.05, 0.15, c);
}

// Terrain without roads carved in.
export function rawHeight(x, z) {
  let h = 2;
  const forest = forestMask(x, z);
  const swamp = swampMask(x, z);
  const meadow = meadowMask(x, z);
  const hills = fbm(nHill, x / 520, z / 520, 4) * 0.5 + 0.5;
  const detail = nDetail(x / 40, z / 40);

  if (forest > 0) h += forest * (6 + 34 * Math.pow(hills, 1.6) + detail * 1.2);
  if (meadow > 0) h += meadow * (5 * hills + detail * 0.4);
  if (swamp > 0) {
    const s = 0.75 + 0.9 * fbm(nSwamp, x / 110, z / 110, 3);
    const sh = lerp(-2.4, s, channelFactor(x, z));
    h = lerp(h, sh, swamp);
  }
  // Gentle undulation in the open land between biomes.
  h += (1 - forest) * (1 - swamp) * detail * 0.25;

  for (let i = 0; i < FLAT_ZONES.length; i++) {
    const zone = FLAT_ZONES[i];
    const w = flatWeight(zone, x, z);
    if (w > 0) h = lerp(h, zone.y === null ? h * 0.6 + 2 : zone.y, w);
  }

  // River channel.
  const rd = riverDist(x, z);
  const hw = RIVER_HALF_W + 4 * nDetail(x / 90, z / 90);
  if (rd < hw + 90) {
    const bank = 22 + forest * 55;
    h = lerp(-3.2, h, smoothstep(hw - 6, hw + bank, rd));
  }

  // Coast: beach slope into the seabed.
  const d = landDist(x, z);
  if (d < 130) {
    const sea = clamp(0.35 + d * 0.05, -14, 2.2);
    h = lerp(sea, h, smoothstep(5, 130, d));
    if (d < 0) h = Math.min(h, sea);
  }
  return h;
}

export const isUnderwater = (h) => h < WATER_Y - 0.15;

// Biome id used for colouring and surfaces.
export const BIOME = { SEA: 0, BEACH: 1, CITY: 2, FOREST: 3, SWAMP: 4, MEADOW: 5, GRASS: 6, PORT: 7, RIDGE: 8 };

export function biomeAt(x, z, h) {
  const d = landDist(x, z);
  if (h < WATER_Y - 0.2) return BIOME.SEA;
  if (d < 95 && h < 3.5 && forestMask(x, z) < 0.5) return BIOME.BEACH;
  if (x > -330 && x < 630 && z > -330 && z < 330) return BIOME.CITY;
  if (x > 430 && x < 880 && z > 880 && z < 1110) return BIOME.PORT;
  if (x > 300 && x < 740 && z > -700 && z < -460) return BIOME.RIDGE;
  if (forestMask(x, z) > 0.5) return BIOME.FOREST;
  if (swampMask(x, z) > 0.5) return BIOME.SWAMP;
  if (meadowMask(x, z) > 0.5) return BIOME.MEADOW;
  return BIOME.GRASS;
}
