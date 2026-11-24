// DEV ONLY. Renders the pieces of the app icon and launch splash for tools/make-icons.mjs:
// a floating voxel island with a little city block on it (built from the real models) and the
// word "Cubopolis" in voxel letters. Everything renders on a transparent background; the script
// composites the final opaque images with PIL.
import * as THREE from 'three';
import { ZoneType } from '../core/types';
import { hash01 } from '../core/rng';
import { buildingModel, treeModel, zoneModel, type ModelParts } from '../render/models';
import { col, mat, type Paint } from '../render/models/palette';
import { MeshAcc, VoxelGrid, meshGrid } from '../render/models/voxel';
import { combine, modelMaterial } from './models-material';

declare global {
  interface Window {
    __icon: { ready: boolean; render(kind: 'icon' | 'island' | 'title', w: number, h: number): void };
  }
}

const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const material = modelMaterial({ uNight: { value: 0 }, uGlass: { value: new THREE.Color('#6d9cc8') }, uGlowBoost: { value: 1.25 } });

function meshOf(parts: { body: THREE.BufferGeometry; glow: THREE.BufferGeometry | null }): THREE.Mesh {
  const m = new THREE.Mesh(combine(parts.body, parts.glow), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function accMesh(acc: MeshAcc): THREE.Mesh {
  return meshOf(acc.toGeometries());
}

// ---------------------------------------------------------------- island

type TileLook = 'grass' | 'paving' | 'park';

/**
 * A floating island n×n tiles: grass or paving on top with kerb lines between lots, earth and
 * rock tapering underneath, and a little waterfall over the front-right edge.
 */
function islandBase(n: number, looks: TileLook[][], seed: number): THREE.Mesh {
  const N = n * 16;
  const depth = 20;
  const g = new VoxelGrid(N + 2, depth + 1, N + 2);
  const top = depth;
  const grass = mat('#7fcf57', { cell: [2, 1, 2], dark: 0.18, light: 0.14, seed });
  const paving = mat('#ddd6c8', { cell: [4, 1, 4], dark: 0.2, dk: 0.95, seed: seed + 1 });
  const park = mat('#6cc457', { cell: [2, 1, 2], dark: 0.2, seed: seed + 2 });
  const kerb = col('#efe9dc');
  // top surface
  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      const tx = Math.floor(x / 16);
      const tz = Math.floor(z / 16);
      const lx = x % 16;
      const lz = z % 16;
      const look = looks[tz][tx];
      const edge = lx === 0 || lz === 0 || lx === 15 || lz === 15;
      const p: Paint = edge && look !== 'park' ? kerb : look === 'paving' ? paving : look === 'park' ? park : grass;
      g.put(x + 1, top, z + 1, p);
    }
  }
  // a grassy lip all round, then earth and rock tapering to a point underneath
  const earth = mat('#9a6b45', { cell: [2, 2, 2], dark: 0.25, dk: 0.88, light: 0.15, seed: seed + 3 });
  const rock = mat('#8b8478', { cell: [2, 2, 2], dark: 0.3, dk: 0.86, light: 0.15, seed: seed + 4 });
  const lip = col('#69b84a');
  const c = (N + 2) / 2;
  for (let y = top - 1; y >= 0; y--) {
    const d = top - 1 - y;
    // straight earth sides for a few rows, then rock tapering faster and faster to a point
    const t = Math.max(0, (d - 6) / (depth - 6));
    const inset = d < 7 ? 0 : (N / 2) * (0.08 + 0.9 * Math.pow(t, 1.25));
    for (let z = 0; z < N + 2; z++) {
      for (let x = 0; x < N + 2; x++) {
        const dx = Math.abs(x + 0.5 - c);
        const dz = Math.abs(z + 0.5 - c);
        // rounded-square cross-section with a ragged edge
        const r = Math.pow(Math.pow(dx, 4) + Math.pow(dz, 4), 0.25);
        const lim = c - inset - (d >= 5 ? hash01(Math.floor(x / 2), y, Math.floor(z / 2) + seed) * 2.5 : 0);
        if (r > lim) continue;
        g.put(x, y, z, d === 0 ? lip : d < 7 ? earth : rock);
      }
    }
  }
  g.box(0, top, 0, N + 2, top + 1, 1, lip);
  g.box(0, top, N + 1, N + 2, top + 1, N + 2, lip);
  g.box(0, top, 0, 1, top + 1, N + 2, lip);
  g.box(N + 1, top, 0, N + 2, top + 1, N + 2, lip);
  // waterfall over the right edge: a stream on top, a falling sheet, spray at the bottom
  const water = col('#5cc3f0');
  const foam = col('#ffffff');
  const wz = Math.floor(N * 0.62);
  g.box(N - 6, top, wz, N + 2, top + 1, wz + 3, water);
  for (let y = top - 9; y < top; y++) {
    const xOut = N + 2;
    g.box(xOut - 1, y, wz, xOut, y + 1, wz + 3, (y + wz) % 4 === 0 ? foam : water);
  }
  g.box(N + 1, top - 10, wz, N + 2, top - 9, wz + 3, foam);
  const acc = new MeshAcc();
  // the grid's top row sits at world y = 0
  meshGrid(g, acc, 1 / 16, (N + 2) / 2, top + 1, (N + 2) / 2);
  const m = accMesh(acc);
  return m;
}

function place(group: THREE.Group, parts: ModelParts, n: number, tx: number, tz: number, rot: number): void {
  const m = meshOf(parts);
  m.position.set(tx + 0.5 - n / 2, 0, tz + 0.5 - n / 2);
  m.rotation.y = rot * (Math.PI / 2);
  group.add(m);
}

/** The icon's city block: a tower in the middle, homes and shops around it. */
function cityIsland(): THREE.Group {
  const n = 3;
  const looks: TileLook[][] = [
    ['paving', 'grass', 'grass'],
    ['paving', 'grass', 'park'],
    ['grass', 'park', 'grass'],
  ];
  const group = new THREE.Group();
  group.add(islandBase(n, looks, 7));
  place(group, zoneModel(ZoneType.Res, 2, 2), n, 0, 0, 0);
  place(group, zoneModel(ZoneType.Res, 2, 1), n, 1, 0, 0);
  place(group, zoneModel(ZoneType.Res, 2, 0), n, 2, 0, 1);
  place(group, zoneModel(ZoneType.Com, 1, 0), n, 0, 1, 0);
  place(group, zoneModel(ZoneType.Com, 2, 3), n, 1, 1, 0);
  place(group, treeModel(1), n, 2, 1, 1);
  place(group, zoneModel(ZoneType.Res, 1, 0), n, 0, 2, 0);
  place(group, buildingModel('park_small'), n, 1, 2, 0);
  place(group, zoneModel(ZoneType.Res, 1, 1), n, 2, 2, 1);
  return group;
}

function cloud(seed: number, w: number): THREE.Mesh {
  const g = new VoxelGrid(w + 2, 8, Math.ceil(w * 0.6) + 2);
  const white = col('#ffffff');
  const shade = col('#e6f2fb');
  const d = Math.ceil(w * 0.6);
  g.box(1, 0, 1, w + 1, 2, d + 1, shade);
  g.box(1, 2, 1, w + 1, 3, d + 1, white);
  const bumps = 3;
  for (let k = 0; k < bumps; k++) {
    const bw = Math.floor(w * (0.3 + hash01(seed, k) * 0.25));
    const bx = 1 + Math.floor(hash01(seed, k, 2) * (w - bw));
    const bh = 2 + Math.floor(hash01(seed, k, 3) * 3);
    g.box(bx, 3, 2, bx + bw, 3 + bh, d, white);
  }
  const acc = new MeshAcc();
  meshGrid(g, acc, 1 / 16, (w + 2) / 2, 0, (d + 2) / 2);
  const geo = acc.toGeometries().body;
  // clouds glow softly so their shaded sides stay airy
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#9fb8cc') }));
  return m;
}

// ---------------------------------------------------------------- title

// 9-row pixel glyphs: rows 0–1 ascender, 2–6 x-height, 7–8 descender. Only the letters we need.
const FONT: Record<string, string[]> = {
  C: ['.###', '#...', '#...', '#...', '#...', '#...', '.###', '....', '....'],
  u: ['....', '....', '#..#', '#..#', '#..#', '#..#', '.###', '....', '....'],
  b: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '###.', '....', '....'],
  o: ['....', '....', '.##.', '#..#', '#..#', '#..#', '.##.', '....', '....'],
  p: ['....', '....', '###.', '#..#', '#..#', '#..#', '###.', '#...', '#...'],
  l: ['#.', '#.', '#.', '#.', '#.', '#.', '.#', '..', '..'],
  i: ['#', '.', '#', '#', '#', '#', '#', '.', '.'],
  s: ['....', '....', '.###', '#...', '.##.', '...#', '###.', '....', '....'],
};
const LETTER_COLOURS = ['#ff6b57', '#ffa53a', '#ffd23f', '#5ccf62', '#35b6f0', '#4f86ff', '#9b6bff', '#ff6fae', '#ff6b57'];

function title(text: string): THREE.Mesh {
  const glyphs = [...text].map((ch) => FONT[ch] ?? FONT.o);
  const width = glyphs.reduce((s, gl) => s + gl[0].length, 0) + glyphs.length - 1;
  const S = 3; // each font pixel is S×S voxels so the outline can stay thin
  const pad = 3;
  const W = width * S + pad * 2;
  const H = 9 * S + pad * 2;
  const D = 6;
  const g = new VoxelGrid(W, H, D);
  const mask = new Uint8Array(W * H);
  let x0 = 0;
  glyphs.forEach((gl, k) => {
    const face = col(LETTER_COLOURS[k % LETTER_COLOURS.length]);
    const side = col(LETTER_COLOURS[k % LETTER_COLOURS.length], 0.8);
    for (let r = 0; r < 9; r++) {
      for (let c2 = 0; c2 < gl[r].length; c2++) {
        if (gl[r][c2] !== '#') continue;
        for (let sy = 0; sy < S; sy++) {
          for (let sx = 0; sx < S; sx++) {
            const x = pad + (x0 + c2) * S + sx;
            const y = pad + (8 - r) * S + sy;
            mask[y * W + x] = 1;
            g.box(x, y, 1, x + 1, y + 1, D - 1, side);
            g.set(x, y, D - 1, face);
          }
        }
      }
    }
    x0 += gl[0].length + 1;
  });
  // a white backing one voxel wider than the letters, so the title pops off any background
  const white = col('#ffffff');
  const backShade = col('#dfe9f2');
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) if (Math.abs(dx) + Math.abs(dy) <= 3 && x + dx >= 0 && x + dx < W && mask[(y + dy) * W + (x + dx)]) near = true;
      if (!near || mask[y * W + x]) continue;
      g.set(x, y, 0, backShade);
      g.set(x, y, 1, white);
      g.set(x, y, 2, white);
    }
  }
  const acc = new MeshAcc();
  meshGrid(g, acc, 1 / 16, W / 2, H / 2, D / 2);
  return accMesh(acc);
}

// ---------------------------------------------------------------- scene and camera

const scene = new THREE.Scene();
const sun = new THREE.DirectionalLight(0xfff4e2, 2.4);
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x8a8466, 0.95);
scene.add(sun, sun.target, hemi);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.01;
sun.shadow.radius = 3;

let current: THREE.Object3D | null = null;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);

/** Point an orthographic camera along (yaw, pitch) and frame the object with a margin. */
function frame(obj: THREE.Object3D, yaw: number, pitch: number, aspect: number, margin: number, shiftY = 0, frontLight = false): void {
  const target = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  camera.position.copy(target).addScaledVector(dir, 100);
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  // bounds of every vertex in camera space
  const inv = camera.matrixWorldInverse;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const v = new THREE.Vector3();
  obj.updateMatrixWorld(true);
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const pos = m.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv);
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
  });
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2 + shiftY * (maxY - minY);
  let hw = (maxX - minX) / 2;
  let hh = (maxY - minY) / 2;
  if (hw / hh > aspect) hh = hw / aspect;
  else hw = hh * aspect;
  hw *= 1 + margin;
  hh *= 1 + margin;
  camera.left = cx - hw;
  camera.right = cx + hw;
  camera.top = cy + hh;
  camera.bottom = cy - hh;
  camera.updateProjectionMatrix();
  // light from the front left (more frontal for the flat title), shadows fitted to the object
  sun.position.copy(target).add(frontLight ? new THREE.Vector3(-8, 12, 22) : new THREE.Vector3(-14, 22, 12));
  sun.target.position.copy(target);
  const r = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3()).length();
  const sc = sun.shadow.camera;
  sc.left = -r;
  sc.right = r;
  sc.top = r;
  sc.bottom = -r;
  sc.near = 1;
  sc.far = 100;
  sc.updateProjectionMatrix();
}

function render(kind: 'icon' | 'island' | 'title', w: number, h: number): void {
  renderer.setSize(w, h, false);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  if (current) scene.remove(current);
  if (kind === 'title') {
    const t = title('Cubopolis');
    current = t;
    scene.add(t);
    hemi.intensity = 1.25;
    frame(t, 0.2, 0.18, w / h, 0.03, 0, true);
  } else {
    const g = new THREE.Group();
    const isl = cityIsland();
    g.add(isl);
    current = g;
    scene.add(g);
    hemi.intensity = 0.95;
    // frame the island alone; the icon's clouds may drift past the edges
    frame(isl, Math.PI / 4, 0.5, w / h, kind === 'icon' ? 0.1 : 0.03, kind === 'icon' ? 0.03 : 0);
    if (kind === 'icon') {
      // clouds placed by screen position, in the empty sky corners behind the island
      const fwd = camera.getWorldDirection(new THREE.Vector3());
      for (const [nx, ny, seed, w] of [
        [-0.64, 0.6, 3, 18],
        [0.62, 0.66, 5, 13],
      ] as Array<[number, number, number, number]>) {
        const c = cloud(seed, w);
        c.position.copy(new THREE.Vector3(nx, ny, -1).unproject(camera)).addScaledVector(fwd, 104);
        g.add(c);
      }
    }
  }
  renderer.render(scene, camera);
}

window.__icon = { ready: true, render };
