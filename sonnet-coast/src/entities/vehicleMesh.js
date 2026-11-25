// Procedural low-poly vehicle models. Geometry is cached per shape; paint is per vehicle.
import * as THREE from 'three';
import { Batch } from '../world/geom.js';
import { PAL } from '../world/palette.js';
import { makeGlowTexture } from '../world/textures.js';

const cache = new Map();
let shared = null;

function sharedMats() {
  if (shared) return shared;
  shared = {
    trim: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.2 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x0c1418, roughness: 0.12, metalness: 0.85 }),
    wheel: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }),
    head: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.95, 0.85).multiplyScalar(2.2), toneMapped: false }),
    headOff: new THREE.MeshStandardMaterial({ color: 0xbfc4c8, roughness: 0.3 }),
    tail: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.04, 0.06), toneMapped: false }),
    tailBrake: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.1, 0.1).multiplyScalar(3.2), toneMapped: false }),
    sirenRed: new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.policeRed).multiplyScalar(3), toneMapped: false }),
    sirenBlue: new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.police).multiplyScalar(3), toneMapped: false }),
    sirenOff: new THREE.MeshStandardMaterial({ color: 0x222830, roughness: 0.3 }),
    flareTex: makeGlowTexture(),
    glow: new Map(),
  };
  return shared;
}
function glowMat(hex) {
  const s = sharedMats();
  if (!s.glow.has(hex)) s.glow.set(hex, new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(1.4), toneMapped: false }));
  return s.glow.get(hex);
}

// Side profile [[z, y], ...] extruded across the car's width.
function profile(points, width, bevel = 0.07) {
  const shape = new THREE.Shape();
  points.forEach(([z, y], i) => (i ? shape.lineTo(z, y) : shape.moveTo(z, y)));
  shape.closePath();
  const depth = Math.max(0.02, width - bevel * 2);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, steps: 1 });
  g.translate(0, 0, -depth / 2);
  g.rotateY(-Math.PI / 2);
  return g;
}
// Top-down outline [[x, z], ...] extruded upwards from y0 to y1.
function plan(points, y0, y1, bevel = 0.05) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0 - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, steps: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + bevel, 0);
  return g;
}

function wheelGeo(r, w) {
  const b = new Batch();
  const tire = new THREE.CylinderGeometry(r, r, w, 14);
  tire.rotateZ(Math.PI / 2);
  b.add(tire, 0x141416);
  const hub = new THREE.CylinderGeometry(r * 0.58, r * 0.58, w + 0.03, 8);
  hub.rotateZ(Math.PI / 2);
  b.add(hub, 0x8f9499);
  const spoke = new THREE.BoxGeometry(w + 0.05, r * 1.05, r * 0.16);
  b.add(spoke, 0x3a3c40);
  const spoke2 = new THREE.BoxGeometry(w + 0.05, r * 0.16, r * 1.05);
  b.add(spoke2, 0x3a3c40);
  return b.merged();
}

const SHAPES = {
  sport(T) {
    const W = T.wid;
    return {
      paint: [profile([[-2.25, 0.3], [-2.25, 0.72], [-2.05, 0.86], [-0.9, 0.9], [0.55, 0.82], [1.7, 0.62], [2.25, 0.5], [2.25, 0.3]], W)],
      glass: [profile([[-1.5, 0.86], [-1.0, 1.17], [-0.05, 1.2], [0.9, 0.8]], W * 0.8, 0.05)],
      trim(b) {
        b.box(W * 0.9, 0.06, 0.5, 0, 0.98, -2.05, 0x16161a);           // spoiler
        b.box(0.08, 0.14, 0.3, W * 0.38, 0.86, -2.05, 0x16161a); b.box(0.08, 0.14, 0.3, -W * 0.38, 0.86, -2.05, 0x16161a);
        b.box(W * 0.96, 0.16, 0.2, 0, 0.26, 2.2, 0x16161a);           // splitter
      },
      head: [[W * 0.33, 0.56, 2.2, 0.36, 0.09], [-W * 0.33, 0.56, 2.2, 0.36, 0.09]],
      tail: [[0, 0.74, -2.27, W * 0.82, 0.07]],
      seat: [0.42, 0.45, -0.25],
    };
  },
  prototype(T) {
    const W = T.wid;
    return {
      paint: [profile([[-2.35, 0.26], [-2.35, 0.66], [-2.1, 0.82], [-0.8, 0.84], [0.6, 0.74], [1.9, 0.5], [2.35, 0.36], [2.35, 0.26]], W)],
      glass: [profile([[-1.3, 0.82], [-0.8, 1.07], [0.0, 1.09], [1.0, 0.72]], W * 0.74, 0.05)],
      trim(b) {
        b.box(W * 1.0, 0.05, 0.55, 0, 1.12, -2.1, 0x101014);
        b.box(0.08, 0.3, 0.34, W * 0.42, 0.82, -2.1, 0x101014); b.box(0.08, 0.3, 0.34, -W * 0.42, 0.82, -2.1, 0x101014);
      },
      glowParts(b) {
        b.box(0.05, 0.05, 3.6, W * 0.5 + 0.02, 0.5, 0, 0xffffff); b.box(0.05, 0.05, 3.6, -W * 0.5 - 0.02, 0.5, 0, 0xffffff);
        b.box(W * 0.9, 0.04, 0.06, 0, 0.66, 2.0, 0xffffff);
      },
      head: [[W * 0.34, 0.5, 2.3, 0.4, 0.06], [-W * 0.34, 0.5, 2.3, 0.4, 0.06]],
      tail: [[0, 0.7, -2.37, W * 0.9, 0.05]],
      seat: [0.42, 0.4, -0.2],
    };
  },
  sedan(T) {
    const W = T.wid;
    return {
      paint: [profile([[-2.35, 0.35], [-2.35, 0.95], [-1.6, 1.0], [1.2, 0.98], [2.2, 0.85], [2.35, 0.7], [2.35, 0.35]], W)],
      glass: [profile([[-1.55, 1.0], [-1.1, 1.45], [0.35, 1.45], [1.05, 0.98]], W * 0.84, 0.05)],
      trim(b) {
        b.box(W * 0.98, 0.2, 0.16, 0, 0.36, 2.32, 0x1c1c20); b.box(W * 0.98, 0.2, 0.16, 0, 0.36, -2.32, 0x1c1c20);
      },
      head: [[W * 0.34, 0.74, 2.33, 0.4, 0.12], [-W * 0.34, 0.74, 2.33, 0.4, 0.12]],
      tail: [[W * 0.34, 0.82, -2.37, 0.42, 0.1], [-W * 0.34, 0.82, -2.37, 0.42, 0.1]],
      seat: [0.42, 0.6, 0],
    };
  },
  compact(T) {
    const W = T.wid;
    return {
      paint: [profile([[-1.9, 0.35], [-1.9, 1.0], [1.0, 0.98], [1.8, 0.82], [1.9, 0.65], [1.9, 0.35]], W)],
      glass: [profile([[-1.88, 1.0], [-1.66, 1.5], [0.2, 1.5], [0.86, 0.98]], W * 0.86, 0.05)],
      trim(b) { b.box(W * 0.98, 0.2, 0.14, 0, 0.36, 1.88, 0x1c1c20); b.box(W * 0.98, 0.2, 0.14, 0, 0.36, -1.88, 0x1c1c20); },
      head: [[W * 0.33, 0.72, 1.88, 0.34, 0.14], [-W * 0.33, 0.72, 1.88, 0.34, 0.14]],
      tail: [[W * 0.36, 0.9, -1.92, 0.2, 0.3], [-W * 0.36, 0.9, -1.92, 0.2, 0.3]],
      seat: [0.4, 0.6, 0],
    };
  },
  truck(T) {
    const W = T.wid;
    return {
      paint: [profile([[-2.65, 0.78], [-2.65, 1.45], [-0.4, 1.45], [-0.4, 1.52], [1.4, 1.52], [2.5, 1.4], [2.65, 1.2], [2.65, 0.78]], W)],
      glass: [profile([[-0.42, 1.5], [-0.3, 2.05], [0.9, 2.05], [1.38, 1.5]], W * 0.86, 0.05)],
      trim(b) {
        b.box(W * 0.84, 0.06, 2.0, 0, 1.46, -1.5, 0x121214);          // bed liner
        b.box(W * 1.02, 0.28, 0.22, 0, 0.72, 2.62, 0x1a1a1e); b.box(W * 1.02, 0.28, 0.22, 0, 0.72, -2.62, 0x1a1a1e);
        b.box(W * 0.9, 0.1, 0.1, 0, 2.2, 0.2, 0x1a1a1e);              // light bar
        b.box(W * 1.08, 0.12, 4.4, 0, 0.72, 0, 0x1a1a1e);             // side steps / chassis
      },
      head: [[W * 0.36, 1.2, 2.66, 0.36, 0.16], [-W * 0.36, 1.2, 2.66, 0.36, 0.16], [0, 2.2, 0.27, W * 0.7, 0.07]],
      tail: [[W * 0.42, 1.2, -2.67, 0.16, 0.34], [-W * 0.42, 1.2, -2.67, 0.16, 0.34]],
      seat: [0.45, 1.1, 0.3],
    };
  },
  buggy(T) {
    const W = T.wid;
    return {
      paint: [profile([[-1.5, 0.55], [-1.5, 0.98], [-0.3, 1.02], [0.6, 0.92], [1.6, 0.72], [1.7, 0.55]], W * 0.62)],
      glass: [],
      trim(b) {
        // roll cage
        const c = 0x24242a;
        for (const sx of [-1, 1]) {
          b.cbox(0.08, 1.0, 0.08, sx * W * 0.3, 1.45, -0.9, c, 0, 0.1);
          b.cbox(0.08, 1.05, 0.08, sx * W * 0.3, 1.42, 0.45, c, 0, -0.45);
          b.cbox(0.08, 0.08, 1.2, sx * W * 0.3, 1.92, -0.3, c);
        }
        b.cbox(W * 0.62, 0.08, 0.08, 0, 1.93, -0.85, c); b.cbox(W * 0.62, 0.08, 0.08, 0, 1.9, 0.22, c);
        b.box(0.5, 0.6, 0.5, 0.3, 0.98, -0.5, 0x33343a); b.box(0.5, 0.6, 0.5, -0.3, 0.98, -0.5, 0x33343a); // seats
        b.box(W * 0.5, 0.4, 0.5, 0, 0.9, -1.35, 0x44464c);            // engine
        b.box(W * 0.9, 0.1, 0.14, 0, 0.5, 1.7, c);
      },
      head: [[W * 0.2, 0.86, 1.62, 0.2, 0.14], [-W * 0.2, 0.86, 1.62, 0.2, 0.14], [0, 1.98, 0.24, W * 0.5, 0.08]],
      tail: [[W * 0.2, 0.9, -1.52, 0.16, 0.1], [-W * 0.2, 0.9, -1.52, 0.16, 0.1]],
      seat: [0.3, 0.85, -0.45],
    };
  },
  van(T) {
    const W = T.wid;
    return {
      paint: [profile([[-3.1, 0.5], [-3.1, 2.7], [1.5, 2.7], [2.3, 1.95], [3.0, 1.65], [3.1, 1.1], [3.1, 0.5]], W)],
      glass: [profile([[1.55, 2.55], [2.25, 1.98], [2.32, 1.98], [1.62, 2.62]], W * 0.86, 0.02)],
      trim(b) {
        b.box(W * 1.01, 0.35, 4.4, 0, 1.3, -0.85, PAL.terracotta);    // stripe
        b.box(W * 1.02, 0.3, 0.2, 0, 0.5, 3.05, 0x1c1c20); b.box(W * 1.02, 0.3, 0.2, 0, 0.5, -3.05, 0x1c1c20);
        b.box(1.2, 0.5, 1.6, 0, 2.7, -1.2, 0x55585e);                 // roof unit
      },
      glowParts(b) { b.box(W * 1.02, 0.08, 4.4, 0, 1.75, -0.85, 0xffffff); },
      head: [[W * 0.36, 1.25, 3.1, 0.36, 0.16], [-W * 0.36, 1.25, 3.1, 0.36, 0.16]],
      tail: [[W * 0.42, 1.4, -3.12, 0.14, 0.5], [-W * 0.42, 1.4, -3.12, 0.14, 0.5]],
      seat: [0.5, 1.2, 1.6],
    };
  },
  police(T) {
    const W = T.wid;
    return {
      paint: [profile([[-2.45, 0.36], [-2.45, 0.98], [-1.7, 1.04], [1.25, 1.02], [2.3, 0.88], [2.45, 0.72], [2.45, 0.36]], W)],
      glass: [profile([[-1.6, 1.04], [-1.15, 1.5], [0.35, 1.5], [1.1, 1.02]], W * 0.84, 0.05)],
      trim(b) {
        b.box(W * 1.012, 0.5, 1.9, 0, 0.5, -0.2, 0xe9e2d2);           // cream doors
        b.box(W * 1.0, 0.5, 0.18, 0, 0.3, 2.5, 0x15161a);             // push bar
        b.box(0.1, 0.6, 0.1, W * 0.3, 0.4, 2.56, 0x15161a); b.box(0.1, 0.6, 0.1, -W * 0.3, 0.4, 2.56, 0x15161a);
        b.box(W * 1.0, 0.2, 0.16, 0, 0.36, -2.42, 0x15161a);
        b.box(W * 0.6, 0.06, 0.32, 0, 1.5, -0.4, 0x15161a);           // lightbar base
      },
      glowParts(b) { b.box(W * 1.02, 0.06, 4.2, 0, 0.94, 0, 0xffffff); },
      head: [[W * 0.34, 0.78, 2.44, 0.4, 0.12], [-W * 0.34, 0.78, 2.44, 0.4, 0.12]],
      tail: [[0, 0.86, -2.47, W * 0.86, 0.08]],
      siren: [0, 1.6, -0.4, W * 0.56],
      seat: [0.42, 0.62, 0],
    };
  },
  policeTruck(T) {
    const W = T.wid;
    return {
      paint: [profile([[-2.6, 0.76], [-2.6, 1.5], [-1.0, 1.5], [1.4, 1.52], [2.45, 1.4], [2.6, 1.2], [2.6, 0.76]], W)],
      glass: [profile([[-1.9, 1.5], [-1.7, 2.0], [0.9, 2.0], [1.38, 1.5]], W * 0.86, 0.05)],
      trim(b) {
        b.box(W * 1.012, 0.5, 2.2, 0, 0.9, -0.2, 0xe9e2d2);
        b.box(W * 1.04, 0.5, 0.22, 0, 0.66, 2.62, 0x15161a); b.box(W * 1.02, 0.28, 0.2, 0, 0.72, -2.6, 0x15161a);
        b.box(W * 1.08, 0.12, 4.2, 0, 0.72, 0, 0x15161a);
        b.box(W * 0.6, 0.06, 0.32, 0, 2.0, -0.3, 0x15161a);
      },
      glowParts(b) { b.box(W * 1.02, 0.06, 4.4, 0, 1.44, 0, 0xffffff); },
      head: [[W * 0.36, 1.2, 2.61, 0.36, 0.16], [-W * 0.36, 1.2, 2.61, 0.36, 0.16]],
      tail: [[0, 1.3, -2.62, W * 0.86, 0.08]],
      siren: [0, 2.1, -0.3, W * 0.56],
      seat: [0.45, 1.1, 0.2],
    };
  },
  swat(T) {
    const W = T.wid;
    return {
      paint: [profile([[-3.3, 0.72], [-3.3, 2.9], [1.6, 2.9], [1.95, 2.3], [2.9, 2.1], [3.3, 1.5], [3.3, 0.72]], W, 0.1)],
      glass: [profile([[1.66, 2.75], [1.98, 2.32], [2.04, 2.32], [1.72, 2.8]], W * 0.8, 0.02)],
      trim(b) {
        b.box(W * 1.1, 0.9, 0.3, 0, 0.5, 3.35, 0x0e0f12);             // ram
        b.box(W * 1.012, 0.45, 3.6, 0, 1.6, -1.2, 0xe9e2d2);
        b.box(W * 1.06, 0.16, 5.8, 0, 0.7, 0, 0x0e0f12);
        b.box(W * 0.6, 0.06, 0.36, 0, 2.9, 0.8, 0x0e0f12);
      },
      glowParts(b) { b.box(W * 1.02, 0.08, 4.6, 0, 2.2, -0.8, 0xffffff); },
      head: [[W * 0.38, 1.5, 3.31, 0.36, 0.2], [-W * 0.38, 1.5, 3.31, 0.36, 0.2]],
      tail: [[W * 0.42, 1.5, -3.32, 0.16, 0.5], [-W * 0.42, 1.5, -3.32, 0.16, 0.5]],
      siren: [0, 3.02, 0.8, W * 0.56],
      seat: [0.5, 1.4, 1.2],
    };
  },
  hoverbike(T) {
    return {
      paint: [profile([[-1.3, 0.3], [-1.3, 0.62], [-0.6, 0.86], [0.3, 0.82], [1.1, 0.62], [1.3, 0.42], [1.1, 0.3]], 0.46, 0.08)],
      glass: [profile([[0.5, 0.78], [0.85, 1.08], [0.95, 1.06], [1.05, 0.64]], 0.4, 0.02)],
      trim(b) {
        b.box(0.3, 0.1, 0.8, 0, 0.84, -0.45, 0x1a1a1e);               // seat
        b.cbox(0.8, 0.05, 0.05, 0, 1.02, 0.55, 0x1a1a1e);             // bars
        b.cyl(0.42, 0.42, 0.14, 0, 0.18, 0.9, 0x24242a, 10); b.cyl(0.42, 0.42, 0.14, 0, 0.18, -0.9, 0x24242a, 10);
        b.box(0.9, 0.06, 0.3, 0, 0.36, -1.1, 0x24242a);               // fins
      },
      glowParts(b) {
        b.cyl(0.34, 0.34, 0.05, 0, 0.14, 0.9, 0xffffff, 10); b.cyl(0.34, 0.34, 0.05, 0, 0.14, -0.9, 0xffffff, 10);
        b.box(0.04, 0.04, 1.6, 0.25, 0.56, 0, 0xffffff); b.box(0.04, 0.04, 1.6, -0.25, 0.56, 0, 0xffffff);
      },
      head: [[0, 0.56, 1.3, 0.22, 0.1]],
      tail: [[0, 0.6, -1.32, 0.3, 0.06]],
      seat: [0, 0.78, -0.4],
    };
  },
  boat(T) {
    const W = T.wid, L = T.len;
    const hull = [[-W / 2, -L / 2], [W / 2, -L / 2], [W / 2, L * 0.12], [W * 0.3, L * 0.36], [0, L / 2], [-W * 0.3, L * 0.36], [-W / 2, L * 0.12]];
    const deck = hull.map(([x, z]) => [x * 0.82, z * 0.9 - 0.1]);
    return {
      paint: [plan(hull, -0.35, 0.62, 0.06)],
      glass: [profile([[0.5, 0.78], [0.3, 1.22], [0.42, 1.22], [0.95, 0.78]], W * 0.8, 0.02)],
      trim(b) {
        b.add(plan(deck, 0.6, 0.72, 0.02), 0x2a2f33);
        b.box(0.55, 0.5, 0.55, 0.45, 0.72, -0.3, 0xe9e2d2); b.box(0.55, 0.5, 0.55, -0.45, 0.72, -0.3, 0xe9e2d2);
        b.box(W * 0.7, 0.4, 0.5, 0, 0.72, -2.2, 0xe9e2d2);
        b.box(0.5, 0.9, 0.5, 0, 0.2, -L / 2 - 0.2, 0x1c1c20);         // outboard
        b.box(W * 1.01, 0.12, L * 0.55, 0, 0.3, -L * 0.2, PAL.terracotta);
      },
      head: [[0, 0.66, L / 2 - 0.5, 0.3, 0.08]],
      tail: [[W * 0.38, 0.55, -L / 2 - 0.02, 0.14, 0.08], [-W * 0.38, 0.55, -L / 2 - 0.02, 0.14, 0.08]],
      seat: [0.45, 0.95, -0.25],
    };
  },
  policeBoat(T) {
    const s = SHAPES.boat(T);
    const W = T.wid, L = T.len;
    const base = s.trim;
    s.trim = (b) => { base(b); b.box(W * 1.012, 0.14, L * 0.5, 0, 0.44, -L * 0.2, 0xe9e2d2); b.box(0.7, 0.06, 0.3, 0, 1.3, 0.2, 0x15161a); b.box(0.08, 0.6, 0.08, 0, 0.72, 0.2, 0x15161a); };
    s.siren = [0, 1.4, 0.2, 0.66];
    return s;
  },
};

function lightsGeo(list, zOff) {
  const b = new Batch();
  for (const [x, y, z, w, h] of list) b.cbox(w, h, 0.06, x, y, z + zOff, 0xffffff);
  return b.merged();
}

function shapeData(T) {
  if (cache.has(T.id)) return cache.get(T.id);
  const S = SHAPES[T.shape](T);
  const paint = new Batch();
  for (const g of S.paint) paint.add(g, 0xffffff);
  const glass = new Batch();
  for (const g of S.glass) glass.add(g, 0xffffff);
  const trim = new Batch();
  if (S.trim) S.trim(trim);
  const glow = new Batch();
  if (S.glowParts) S.glowParts(glow);
  const data = {
    paint: paint.merged(),
    glass: glass.empty ? null : glass.merged(),
    trim: trim.empty ? null : trim.merged(),
    glow: glow.empty ? null : glow.merged(),
    head: lightsGeo(S.head, 0.03),
    tail: lightsGeo(S.tail, -0.03),
    wheel: T.wheelR ? wheelGeo(T.wheelR, T.shape === 'buggy' || T.shape === 'truck' || T.shape === 'policeTruck' || T.shape === 'swat' ? 0.36 : 0.25) : null,
    siren: S.siren || null,
    seat: S.seat || [0.4, 0.6, 0],
    headPos: S.head,
  };
  cache.set(T.id, data);
  return data;
}

export function buildVehicleMesh(T, paintHex) {
  const M = sharedMats();
  const D = shapeData(T);
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const paintMat = new THREE.MeshStandardMaterial({ color: paintHex, roughness: 0.32, metalness: 0.55 });
  const paint = new THREE.Mesh(D.paint, paintMat);
  paint.castShadow = true; paint.receiveShadow = true;
  body.add(paint);
  if (D.glass) body.add(new THREE.Mesh(D.glass, M.glass));
  if (D.trim) { const t = new THREE.Mesh(D.trim, M.trim); t.castShadow = true; body.add(t); }
  const glowHex = T.police ? 0xbfdcff : T.glow || (T.shape === 'van' ? 0xffe6c4 : null);
  let glow = null;
  if (D.glow && glowHex) { glow = new THREE.Mesh(D.glow, glowMat(glowHex)); body.add(glow); }
  const head = new THREE.Mesh(D.head, M.headOff);
  const tail = new THREE.Mesh(D.tail, M.tail);
  body.add(head, tail);

  const wheels = [];
  if (D.wheel) {
    const wx = T.wid / 2 - 0.1, wz = T.wheelbase / 2;
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * wx, T.wheelR, sz * wz);
      const w = new THREE.Mesh(D.wheel, M.wheel);
      w.castShadow = true;
      pivot.add(w);
      group.add(pivot);
      wheels.push({ pivot, mesh: w, front: sz > 0 });
    }
  }
  // underglow for flashy rides
  let under = null;
  if (T.glow && T.cls === 'car') {
    under = new THREE.Mesh(new THREE.PlaneGeometry(T.wid * 1.5, T.len * 1.25), new THREE.MeshBasicMaterial({
      map: M.flareTex, color: T.glow, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending,
      polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8,
    }));
    under.rotation.x = -Math.PI / 2;
    under.position.y = 0.08;
    group.add(under);
  }
  let siren = null;
  if (D.siren) {
    const [sx, sy, sz, sw] = D.siren;
    const geo = new THREE.BoxGeometry(sw / 2, 0.16, 0.28);
    const L = new THREE.Mesh(geo, M.sirenOff), Rm = new THREE.Mesh(geo, M.sirenOff);
    L.position.set(sx + sw / 4, sy, sz); Rm.position.set(sx - sw / 4, sy, sz);
    const mk = (hex) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.flareTex, color: hex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9, fog: false }));
      s.scale.setScalar(7);
      s.visible = false;
      return s;
    };
    const fl = mk(PAL.policeRed), fr = mk(PAL.police);
    fl.position.copy(L.position); fr.position.copy(Rm.position);
    body.add(L, Rm, fl, fr);
    siren = { L, R: Rm, fl, fr };
  }
  return { group, body, paintMat, head, tail, wheels, siren, glow, under, seat: D.seat, headPos: D.headPos, baseColor: new THREE.Color(paintHex) };
}

export function vehicleMats() { return sharedMats(); }
