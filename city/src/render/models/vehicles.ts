// Cars, vans and trucks, built on a finer voxel grid (48 per tile) than buildings so they still
// read as vehicles at about 0.3 tiles long. Front faces +z; headlights and tail lights glow.
import { col, glow, type Paint } from './palette';
import { C } from './shapes';
import { MeshAcc, VoxelGrid, meshGrid } from './voxel';

/** Voxels per world unit for vehicles. */
export const CAR_VPT = 48;

const HEAD = '#fff3cf';
const TAIL = '#ff3a2e';
const GLASS = '#3c5270';
const TYRE = '#26282d';

interface Body {
  paint: string;
  /** Second colour (roof, cargo box, stripe). */
  accent?: string;
  kind: 'sedan' | 'hatch' | 'van' | 'truck' | 'police' | 'fire' | 'bus' | 'ambulance';
}

/** Paint jobs for CAR_VARIANTS, in order. Variants 3 and 5 are the van and the small truck. */
const VARIANTS: Body[] = [
  { paint: '#e8483f', kind: 'sedan' },
  { paint: '#3f7fe6', kind: 'hatch' },
  { paint: '#f6c94a', kind: 'sedan', accent: '#fff4d8' },
  { paint: '#f2f2ee', kind: 'van', accent: '#5aa9e6' },
  { paint: '#3fbf86', kind: 'hatch' },
  { paint: '#f08a3c', kind: 'truck', accent: '#eceae2' },
];

function wheels(g: VoxelGrid, w: number, zs: number[]): void {
  const t = col(TYRE);
  const hub = col('#9aa2ad');
  for (const z of zs) {
    for (const x of [0, w - 1]) {
      g.box(x, 0, z, x + 1, 2, z + 3, t);
      g.set(x, 1, z + 1, hub);
    }
  }
}

function lights(g: VoxelGrid, w: number, front: number, back: number, y: number): void {
  g.set(1, y, front, glow(HEAD));
  g.set(w - 2, y, front, glow(HEAD));
  g.set(1, y, back, glow(TAIL));
  g.set(w - 2, y, back, glow(TAIL));
}

function build(b: Body): VoxelGrid {
  const body = col(b.paint);
  const bodyDark = col(b.paint, 0.86);
  const glass = col(GLASS);
  const trim = col('#5a5f68');
  const W = 7;
  if (b.kind === 'sedan' || b.kind === 'hatch' || b.kind === 'police') {
    const g = new VoxelGrid(W, 8, 14);
    // lower body and a darker skirt line
    g.box(0, 1, 0, W, 3, 14, body);
    g.box(0, 1, 0, W, 2, 14, bodyDark);
    // cabin
    const c0 = b.kind === 'hatch' ? 2 : 4;
    const c1 = b.kind === 'hatch' ? 10 : 10;
    g.box(1, 3, c0, W - 1, 5, c1, glass);
    // pillars and roof
    const roof: Paint = b.kind === 'police' ? col('#f7f7f4') : b.accent ? col(b.accent) : body;
    g.box(1, 5, c0 + (b.kind === 'hatch' ? 0 : 1), W - 1, 6, c1 - 1, roof);
    g.box(1, 3, c0 + 2, W - 1, 5, c0 + 3, roof);
    if (b.kind === 'police') {
      // white doors, light bar with red and blue
      g.box(0, 2, 4, W, 3, 10, col('#f7f7f4'));
      g.set(2, 6, 6, glow('#ff3b3b'));
      g.set(3, 6, 6, glow('#ffffff', 0.9));
      g.set(4, 6, 6, glow('#3b7bff'));
    }
    g.box(0, 1, 13, W, 2, 14, trim);
    g.box(0, 1, 0, W, 2, 1, trim);
    wheels(g, W, [2, 9]);
    lights(g, W, 13, 0, 2);
    return g;
  }
  if (b.kind === 'bus') {
    // a stubby yellow school bus with a row of windows
    const g = new VoxelGrid(W + 1, 11, 24);
    const BW = W + 1;
    g.box(0, 1, 0, BW, 8, 24, body);
    g.box(0, 1, 0, BW, 2, 24, col('#2c2f36'));
    g.box(0, 7, 0, BW, 8, 24, col(b.paint, 1.06));
    for (let z = 2; z < 20; z += 3) g.box(0, 4, z, BW, 6, z + 2, glass);
    g.box(1, 4, 23, BW - 1, 6, 24, glass);
    g.box(0, 3, 0, BW, 4, 24, col('#2c2f36'));
    wheels(g, BW, [2, 18]);
    lights(g, BW, 23, 0, 2);
    return g;
  }
  if (b.kind === 'van' || b.kind === 'ambulance') {
    const g = new VoxelGrid(W, 10, 15);
    g.box(0, 1, 0, W, 7, 15, body);
    g.box(0, 1, 0, W, 2, 15, bodyDark);
    // sloped nose and windscreen
    g.box(0, 6, 13, W, 7, 15, 0);
    g.box(1, 4, 14, W - 1, 6, 15, glass);
    g.box(0, 4, 11, W, 6, 13, glass);
    g.box(1, 4, 11, W - 1, 6, 13, body);
    g.box(1, 4, 13, W - 1, 6, 14, glass);
    // a stripe along the side
    if (b.accent) g.box(0, 3, 1, W, 4, 11, col(b.accent));
    if (b.kind === 'ambulance') {
      g.set(1, 7, 11, glow('#ff3b3b'));
      g.set(W - 2, 7, 11, glow('#3b7bff'));
      g.box(2, 7, 4, W - 2, 8, 6, col(b.accent ?? '#e0504a'));
    }
    g.box(0, 1, 14, W, 2, 15, trim);
    wheels(g, W, [2, 10]);
    lights(g, W, 14, 0, 2);
    return g;
  }
  if (b.kind === 'truck') {
    const g = new VoxelGrid(W, 11, 17);
    // cab
    g.box(0, 1, 12, W, 6, 17, body);
    g.box(0, 1, 12, W, 2, 17, bodyDark);
    g.box(1, 4, 16, W - 1, 6, 17, glass);
    g.box(0, 4, 13, W, 6, 15, glass);
    g.box(1, 4, 13, W - 1, 6, 15, body);
    g.box(1, 6, 12, W - 1, 7, 16, body);
    // cargo box
    const box = col(b.accent ?? '#eceae2');
    g.box(0, 2, 0, W, 9, 12, box);
    g.box(0, 8, 0, W, 9, 12, col(b.accent ?? '#eceae2', 0.92));
    g.box(0, 1, 0, W, 2, 12, trim);
    g.box(1, 4, 0, W - 1, 6, 1, col(b.paint));
    wheels(g, W, [1, 5, 13]);
    lights(g, W, 16, 0, 2);
    return g;
  }
  // fire engine: long red body, ladder on top, white stripe
  const g = new VoxelGrid(W + 1, 11, 22);
  const FW = W + 1;
  g.box(0, 1, 0, FW, 6, 22, body);
  g.box(0, 3, 0, FW, 4, 22, col('#f4f1ea'));
  g.box(1, 4, 20, FW - 1, 6, 22, glass);
  g.box(0, 4, 17, FW, 6, 19, glass);
  g.box(1, 6, 1, FW - 1, 7, 17, col(C.metal));
  g.box(2, 7, 2, FW - 2, 8, 16, col(C.metalDark));
  g.set(2, 6, 19, glow('#ff3b3b'));
  g.set(FW - 3, 6, 19, glow('#3b7bff'));
  g.box(0, 1, 21, FW, 2, 22, trim);
  wheels(g, FW, [2, 7, 16]);
  lights(g, FW, 21, 0, 2);
  return g;
}

const accCache = new Map<string, MeshAcc>();

function meshed(key: string, b: Body): MeshAcc {
  let acc = accCache.get(key);
  if (!acc) {
    const g = build(b);
    acc = new MeshAcc();
    // centred in x/z, wheels on y = 0
    meshGrid(g, acc, 1 / CAR_VPT, g.nx / 2, 0, g.nz / 2, true);
    accCache.set(key, acc);
  }
  return acc;
}

export const CAR_PAINTS = VARIANTS.length;

/** Triangles of car variant v in world units (front +z). */
export function carMesh(v: number): MeshAcc {
  const i = ((v % VARIANTS.length) + VARIANTS.length) % VARIANTS.length;
  return meshed(`car${i}`, VARIANTS[i]);
}

/** Height of a car variant in world units. */
export function carHeight(v: number): number {
  const i = ((v % VARIANTS.length) + VARIANTS.length) % VARIANTS.length;
  const k = VARIANTS[i].kind;
  return (k === 'truck' ? 9 : k === 'van' ? 7 : 6) / CAR_VPT;
}

export function policeCarMesh(): MeshAcc {
  return meshed('police', { paint: '#2f4f9a', kind: 'police' });
}

export function busMesh(): MeshAcc {
  return meshed('bus', { paint: '#f6c234', kind: 'bus' });
}

export function ambulanceMesh(): MeshAcc {
  return meshed('ambulance', { paint: '#f7f7f4', accent: '#e0504a', kind: 'ambulance' });
}

export function fireTruckMesh(): MeshAcc {
  return meshed('fire', { paint: '#e23b30', kind: 'fire' });
}
