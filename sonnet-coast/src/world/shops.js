// Shopfront kit: the parts of a ground-floor bay that are real geometry near the camera.
// A bay is 6 m wide (lobbies 9 m), 4.5 m tall, and reaches 3.8 m back into the building.
// Local axes: x along the wall, y up, +z out into the street (the glass sits at z = 0).
//   frame    - pillars, plinth, door surround (lit like any other wall)
//   glass    - window and door panes (additive reflections over whatever is inside)
//   awning   - canvas canopy, tinted per shop
//   interior - floor, walls, ceiling, furniture and a person or two; shaded once here and then
//              drawn unlit, so a shop looks lit from inside whatever the sun is doing
import * as THREE from 'three';
import { Batch } from './geom.js';
import { ellipseLoft } from '../entities/bodyGeo.js';

export const BAY = 6, LOBBY_BAY = 9, SHOP_D = 3.8, SHOP_CEIL = 3.3, LOBBY_CEIL = 3.9, PLINTH = 0.38, DOOR_W = 1.3;
const FRAME = 0x26282c, STONE = 0x8f8d88, STEEL = 0xb9bec4;

// tiny deterministic generator so every build lays the shelves out the same way
function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

// Bake a simple light into vertex colours: a ceiling wash plus a little from the window.
function bake(geo, depth) {
  const n = geo.getAttribute('normal'), c = geo.getAttribute('color'), p = geo.getAttribute('position');
  const lx = 0.22, ly = 0.86, lz = 0.46;
  for (let i = 0; i < p.count; i++) {
    const d = Math.max(0, n.getX(i) * lx + n.getY(i) * ly + n.getZ(i) * lz);
    const back = 1 - 0.22 * Math.min(1, Math.max(0, -p.getZ(i) / depth));
    const low = 0.86 + 0.14 * Math.min(1, p.getY(i) / 2.2);
    const s = (0.56 + 0.44 * d) * back * low;
    c.setXYZ(i, c.getX(i) * s, c.getY(i) * s, c.getZ(i) * s);
  }
  return geo;
}
function boost(geo, k) { const c = geo.getAttribute('color'); for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); return geo; }

// ---- the parts every bay shares -------------------------------------------------------------
function frameGeo(W, ceil) {
  const b = new Batch();
  const dx = W - DOOR_W - 0.16;                                  // where the door opening starts
  for (const x of [0.08, W - 0.08]) b.box(0.16, ceil, 0.34, x, 0, -0.07, FRAME);          // half pillars
  b.box(dx - 0.16, PLINTH, 0.22, (0.16 + dx) / 2, 0, -0.04, STONE);                       // plinth
  b.box(dx - 0.1, 0.05, 0.3, (0.16 + dx) / 2, PLINTH, -0.02, 0xa9a7a2);                  // sill
  b.box(W - 0.32, 0.1, 0.26, W / 2, ceil - 0.1, -0.05, FRAME);                            // head rail
  b.box(0.07, ceil - 0.1, 0.12, dx, 0, -0.04, FRAME);                                     // door post
  b.box(DOOR_W, 0.07, 0.12, dx + DOOR_W / 2, 2.55, -0.04, FRAME);                         // transom
  b.box(DOOR_W - 0.06, 0.05, 0.3, dx + DOOR_W / 2 + 0.03, 0, -0.02, 0x6f6d68);            // threshold
  const wl = dx - 0.16;
  for (let k = 1; k < Math.round(wl / 1.9); k++) b.box(0.05, ceil - PLINTH - 0.1, 0.08, 0.16 + (wl * k) / Math.round(wl / 1.9), PLINTH, -0.04, FRAME);   // mullions
  // door leaf: stiles, rails and a long bar handle
  for (const x of [dx + 0.1, dx + DOOR_W - 0.06]) b.box(0.06, 2.5, 0.05, x, 0.04, -0.05, 0x3a3d42);
  for (const y of [0.04, 2.48]) b.box(DOOR_W - 0.16, 0.07, 0.05, dx + DOOR_W / 2 + 0.02, y, -0.05, 0x3a3d42);
  b.add(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 8), STEEL, dx + 0.24, 1.25, 0.02);
  for (const y of [0.85, 1.65]) b.add(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 6), STEEL, dx + 0.24, y, -0.015, Math.PI / 2, 0, 0);
  if (W > BAY) {   // office entrances: a canopy over the door on two tie rods
    b.box(DOOR_W + 1.6, 0.1, 1.7, dx + DOOR_W / 2, 2.78, 0.85, 0xe9ecee);
    b.box(DOOR_W + 1.7, 0.05, 1.8, dx + DOOR_W / 2, 2.88, 0.85, 0x3a3d42);
    for (const x of [dx - 0.6, dx + DOOR_W + 0.6]) { const g = new THREE.CylinderGeometry(0.015, 0.015, 1.9, 5); b.add(g, STEEL, x, 3.3, 0.8, -1.05, 0, 0); }
  }
  // two downlights tucked under the head rail
  for (const x of [W * 0.25, W * 0.6]) b.add(new THREE.CylinderGeometry(0.05, 0.065, 0.09, 8), 0x1b1c1f, x, ceil - 0.15, 0.06);
  return b.merged();
}
function glassGeo(W, ceil) {
  const b = new Batch();
  const dx = W - DOOR_W - 0.16;
  const pane = (x0, x1, y0, y1) => { const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0); b.add(g, 0xffffff, (x0 + x1) / 2, (y0 + y1) / 2, -0.045); };
  pane(0.16, dx, PLINTH + 0.05, ceil - 0.1);
  pane(dx + 0.14, dx + DOOR_W - 0.08, 0.1, 2.48);
  pane(dx + 0.04, W - 0.16, 2.62, ceil - 0.1);
  return b.merged();
}
function awningGeo(W) {
  const b = new Batch();
  const w = W - 0.5, y0 = 3.24, drop = 0.42, out = 1.15;
  const g = new THREE.BoxGeometry(w, 0.04, Math.hypot(out, drop));
  b.add(g, 0xffffff, W / 2, y0 - drop / 2, 0.1 + out / 2, Math.atan2(drop, out), 0, 0);
  b.box(w, 0.22, 0.03, W / 2, y0 - drop - 0.2, 0.1 + out, 0xf2f2f2);                       // valance
  for (const x of [0.4, W - 0.4]) {
    const arm = new THREE.CylinderGeometry(0.014, 0.014, Math.hypot(out, drop) * 0.98, 5);
    b.add(arm, 0x888888, x, y0 - drop / 2 - 0.05, 0.1 + out / 2, Math.PI / 2 + Math.atan2(drop, out), 0, 0);
  }
  return b.merged();
}

// ---- furniture ------------------------------------------------------------------------------
function shell(b, e, W, ceil, floor, wall, opts = {}) {
  const D = SHOP_D;
  b.box(W, 0.04, D + 0.1, W / 2, -0.02, -D / 2, floor);
  b.box(W, 0.05, D + 0.1, W / 2, ceil, -D / 2, opts.ceil ?? 0xdedbd4);
  b.box(W, ceil, 0.05, W / 2, 0, -D, opts.back ?? wall);
  b.box(0.05, ceil, D, 0.025, 0, -D / 2, wall); b.box(0.05, ceil, D, W - 0.025, 0, -D / 2, wall);
  // skirting and a floor pattern: boards or tiles
  b.box(W, 0.1, 0.02, W / 2, 0.02, -D + 0.04, opts.skirt ?? 0x55504a);
  const n = opts.tiles ?? 0;
  for (let i = 1; i < n; i++) b.box(0.015, 0.006, D, (W * i) / n, 0.02, -D / 2, opts.joint ?? 0x00000);
  // ceiling light panels
  for (const [x, z] of opts.lights ?? [[W * 0.3, -1.1], [W * 0.7, -1.1], [W * 0.5, -2.7]]) { e.box(1.1, 0.03, 0.34, x, ceil - 0.035, z, opts.lightCol ?? 0xfff3df); b.box(1.2, 0.02, 0.44, x, ceil - 0.02, z, 0xb9b6ae); }
}
function shelf(b, r, x, z, w, h, d, ry, cols, rows = 4) {
  const s = Math.sin(ry), c = Math.cos(ry);
  const at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  b.box(w, h, 0.03, ...ins(at(0, -d / 2 + 0.015), 0), 0x4a4640, ry);
  for (const lx of [-w / 2 + 0.015, w / 2 - 0.015]) b.box(0.03, h, d, ...ins(at(lx, 0), 0), 0x5a554e, ry);
  for (let k = 0; k <= rows; k++) {
    const y = 0.1 + ((h - 0.14) * k) / rows;
    b.box(w - 0.04, 0.025, d, ...ins(at(0, 0), y), 0x6a645c, ry);
    if (k === rows) break;
    const gap = (h - 0.14) / rows;
    let lx = -w / 2 + 0.06;
    while (lx < w / 2 - 0.1) {
      const iw = 0.16 + r() * 0.3, ih = gap * (0.5 + r() * 0.38);
      b.box(iw, ih, d * 0.7, ...ins(at(lx + iw / 2, 0.02), y + 0.025), cols[Math.floor(r() * cols.length)], ry);
      lx += iw + 0.012 + (r() < 0.15 ? 0.14 : 0);
    }
  }
}
const ins = (xz, y) => [xz[0], y, xz[1]];
function counter(b, x, z, w, d, ry, body, top = 0xd9d4c8, h = 1.0) {
  b.box(w, h - 0.04, d, x, 0.02, z, body, ry);
  b.box(w + 0.08, 0.04, d + 0.08, x, h - 0.02, z, top, ry);
}
function table(b, x, z, r, top = 0x9a7550, h = 0.74) {
  b.add(new THREE.CylinderGeometry(r, r, 0.035, 9), top, x, h, z);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, h, 6), 0x2d2e32, x, h / 2, z);
  b.add(new THREE.CylinderGeometry(0.2, 0.22, 0.025, 7), 0x2d2e32, x, 0.03, z);
}
function chair(b, x, z, ry, col = 0x3a3c41) {
  const s = Math.sin(ry), c = Math.cos(ry);
  void c;
  b.box(0.4, 0.045, 0.4, x, 0.44, z, col, ry);
  b.box(0.4, 0.42, 0.04, x - s * 0.18, 0.5, z - c * 0.18, col, ry);
  b.box(0.34, 0.42, 0.34, x, 0.02, z, 0x1e1f22, ry);
}
function stool(b, x, z, col = 0x8a5a3c) {
  b.add(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 8), col, x, 0.72, z);
  b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), STEEL, x, 0.36, z);
  b.add(new THREE.CylinderGeometry(0.16, 0.18, 0.02, 6), STEEL, x, 0.03, z);
}
function plant(b, x, z, h = 1.2, leaf = 0x3f7a3c) {
  b.add(new THREE.CylinderGeometry(0.17, 0.13, 0.34, 7), 0xc9b9a0, x, 0.19, z);
  b.add(new THREE.CylinderGeometry(0.02, 0.025, h * 0.5, 5), 0x4a3a2a, x, 0.36 + h * 0.25, z);
  for (const [dx, dy, dz, rr] of [[0, 0.9, 0, 0.3], [0.16, 0.7, 0.1, 0.22], [-0.15, 0.74, -0.08, 0.22], [0.02, 0.6, -0.16, 0.2]]) b.add(new THREE.IcosahedronGeometry(rr * h * 0.9, 0), dy > 0.8 ? 0x56984a : leaf, x + dx * h, 0.3 + dy * h, z + dz * h, 0, 0, 0, 1, 1.15, 1);
}
function pendant(b, e, x, z, ceil, drop = 0.9, col = 0x2a2b2f) {
  b.add(new THREE.CylinderGeometry(0.006, 0.006, drop, 4), 0x1a1a1c, x, ceil - drop / 2, z);
  b.add(new THREE.CylinderGeometry(0.05, 0.19, 0.2, 8, 1, true), col, x, ceil - drop - 0.08, z);
  e.add(new THREE.SphereGeometry(0.06, 5, 4), 0xffe7b8, x, ceil - drop - 0.13, z);
}
function frameArt(b, x, y, z, w, h, col, ry = 0) { b.box(w + 0.08, h + 0.08, 0.03, x, y - 0.04, z, 0x1f1f22, ry); b.box(w, h, 0.035, x, y, z, col, ry); }
// A person standing (or sitting) inside: a couple of hundred triangles, since nobody gets close.
function figure(b, x, z, ry, top, bottom, skin, hair, sit = false) {
  const y0 = sit ? 0.5 : 0.98;
  const sn = Math.sin(ry), cs = Math.cos(ry);
  const put = (g, col, lx, ly, lz, rx = 0) => b.add(g, col, x + lx * cs + lz * sn, ly, z - lx * sn + lz * cs, rx, ry, 0);
  put(ellipseLoft([[-0.02, 0.17, 0.11], [0.2, 0.18, 0.115], [0.38, 0.22, 0.125], [0.47, 0.15, 0.09], [0.54, 0.06, 0.06]], 7, 0.9), top, 0, y0, 0);
  put(ellipseLoft([[-0.26, 0.08, 0.07], [-0.14, 0.185, 0.12], [0.0, 0.17, 0.11]], 7, 0.9), bottom, 0, y0, 0);
  put(new THREE.SphereGeometry(0.105, 7, 5), skin, 0, y0 + 0.62, 0.006);
  put(new THREE.SphereGeometry(0.112, 7, 3, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, 0, y0 + 0.635, -0.008);
  const tube = (len, r0, r1) => { const g = new THREE.CylinderGeometry(r0, r1, len, 5, 1); g.translate(0, -len / 2, 0); return g; };
  for (const s of [-1, 1]) {
    put(tube(0.52, 0.055, 0.04), top, s * 0.24, y0 + 0.4, 0, sit ? -0.7 : -0.12 * s);
    if (sit) { put(tube(0.4, 0.08, 0.065), bottom, s * 0.095, y0 - 0.16, 0.0, -1.5); put(tube(0.44, 0.06, 0.05), bottom, s * 0.095, y0 - 0.16, 0.4, 0); }
    else put(tube(0.82, 0.082, 0.05), bottom, s * 0.095, y0 - 0.16, 0, 0);
  }
}
const SKIN = [0xf1c9a5, 0xe0ac8a, 0xc68863, 0x9a6645, 0x70452c];
const BOOKS = [0x8c3a2e, 0x2f5d73, 0xd9b26a, 0x3f6f4a, 0xe8e2d4, 0x4a3f6b, 0xc8643b, 0x1f2a33, 0xb9825a];
const GOODS = [0xe8e2d4, 0x2ec4b6, 0xd9486e, 0xe8b04a, 0x5c7f6b, 0xf2f3f4, 0x7b5ea7, 0xc8643b];
const CLOTH = [0xc8643b, 0xf0e8d8, 0x2f5d73, 0x1f2a33, 0xd9b26a, 0x5c7f6b, 0xd9486e, 0x7b5ea7];

const TYPES = {
  books(b, e, r, W, C) {
    shell(b, e, W, C, 0x8a6a48, 0xcbbfa9, { tiles: 9, joint: 0x6f5438 });
    shelf(b, r, 1.5, -SHOP_D + 0.2, 2.6, 2.5, 0.3, 0, BOOKS, 5); shelf(b, r, 4.3, -SHOP_D + 0.2, 2.4, 2.5, 0.3, 0, BOOKS, 5);
    shelf(b, r, 0.24, -1.9, 2.6, 2.3, 0.3, Math.PI / 2, BOOKS, 5);
    counter(b, 2.3, -1.3, 1.6, 0.8, 0, 0x5c4a36, 0x7a6248, 0.78);
    for (let k = 0; k < 7; k++) b.box(0.2 + r() * 0.1, 0.04 + r() * 0.12, 0.28, 1.7 + k * 0.2, 0.8, -1.3 + (r() - 0.5) * 0.4, BOOKS[k % BOOKS.length], r() * 0.6);
    b.box(0.7, 0.4, 0.7, 4.2, 0.02, -1.5, 0x7a4a3a); b.box(0.7, 0.5, 0.14, 4.2, 0.42, -1.82, 0x7a4a3a);   // armchair
    figure(b, 4.2, -1.45, 0, 0x5c7f6b, 0x26282e, SKIN[1], 0x3b2a1e, true);
    pendant(b, e, 2.3, -1.3, C, 0.9); plant(b, 5.4, -0.7, 1.3);
  },
  clothes(b, e, r, W, C) {
    shell(b, e, W, C, 0xb9b3a8, 0xe9e4da, { back: 0x30323a });
    for (const [x0, x1, z] of [[0.5, 2.6, -SHOP_D + 0.5], [3.2, 5.4, -SHOP_D + 0.5]]) {   // rails of hanging clothes
      b.add(new THREE.CylinderGeometry(0.015, 0.015, x1 - x0, 6), STEEL, (x0 + x1) / 2, 1.7, z, 0, 0, Math.PI / 2);
      for (const x of [x0, x1]) b.add(new THREE.CylinderGeometry(0.018, 0.018, 1.7, 6), STEEL, x, 0.85, z);
      for (let x = x0 + 0.12; x < x1 - 0.08; x += 0.13) b.box(0.05, 0.75 + r() * 0.35, 0.42, x, 1.68 - (0.75 + r() * 0.35), z, CLOTH[Math.floor(r() * CLOTH.length)]);
    }
    for (const [x, z, ry, top, bot] of [[1.0, -0.75, 0.3, 0xc8643b, 0x1f2a33], [2.6, -0.8, -0.2, 0xf0e8d8, 0x2f5d73]]) { b.add(new THREE.CylinderGeometry(0.3, 0.34, 0.14, 14), 0xe9e4da, x, 0.09, z); figure(b, x, z, ry, top, bot, 0xd8d4cc, 0xd8d4cc); }
    counter(b, 4.6, -1.5, 1.3, 0.6, 0, 0x2a2b2f, 0xd9d4c8, 0.95); e.box(0.3, 0.2, 0.02, 4.4, 0.98, -1.5, 0xbfe4ff, 0.3);
    figure(b, 4.7, -2.0, 0.1, 0x1f2a33, 0x26282e, SKIN[2], 0x1a1512);
    b.box(0.9, 1.9, 0.04, 5.94, 0.1, -1.4, 0xa9c4d0, Math.PI / 2);                        // mirror
    for (const x of [1.4, 4.4]) e.box(2.0, 0.03, 0.05, x, C - 0.06, -SHOP_D + 0.32, 0xfff3df);
  },
  florist(b, e, r, W, C) {
    shell(b, e, W, C, 0x8c8f88, 0xdfe6d8, { tiles: 6, joint: 0x6d706a });
    const bl = [0xd9486e, 0xe8b04a, 0xf2f3f4, 0xff9a78, 0x7b5ea7, 0xffd9e4];
    for (let t = 0; t < 3; t++) {                                                        // stepped stand of buckets
      b.box(3.2, 0.3 + t * 0.32, 0.5, 1.9, 0.02, -SHOP_D + 0.4 + (2 - t) * 0.5, 0x7d6a52);
      for (let k = 0; k < 6; k++) {
        const x = 0.55 + k * 0.54, z = -SHOP_D + 0.4 + (2 - t) * 0.5, y = 0.32 + t * 0.32;
        b.add(new THREE.CylinderGeometry(0.13, 0.1, 0.26, 8), 0x3a3d42, x, y + 0.13, z);
        b.add(new THREE.IcosahedronGeometry(0.2, 0), 0x3f7a3c, x, y + 0.42, z);
        b.add(new THREE.IcosahedronGeometry(0.15, 0), bl[Math.floor(r() * bl.length)], x + (r() - 0.5) * 0.1, y + 0.55, z);
      }
    }
    plant(b, 0.6, -0.8, 1.7); plant(b, 4.3, -3.2, 2.0, 0x356b3a); plant(b, 5.4, -1.2, 1.2);
    for (const x of [1.2, 2.6, 4.0]) { b.add(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 4), 0x1a1a1c, x, C - 0.25, -0.9); b.add(new THREE.IcosahedronGeometry(0.26, 0), 0x4c8f46, x, C - 0.62, -0.9, 0, 0, 0, 1, 0.8, 1); }
    counter(b, 4.6, -2.1, 1.2, 0.6, 0, 0xd9d4c8, 0x9a7550, 0.9);
    figure(b, 4.6, -2.6, 0, 0x5c7f6b, 0x3b4252, SKIN[0], 0xb8935a);
  },
  barber(b, e, r, W, C) {
    shell(b, e, W, C, 0x2c2d31, 0xe6e1d6, { tiles: 8, joint: 0xe6e1d6, back: 0x7a2f2a });
    for (const z of [-1.3, -2.7]) {
      b.box(0.9, 1.3, 0.04, 0.09, 1.0, z, 0xa9c4d0, Math.PI / 2); b.box(1.0, 0.05, 0.3, 0.2, 0.9, z, 0x3a3c41, Math.PI / 2);   // mirror + shelf
      e.box(0.9, 0.04, 0.04, 0.1, 2.36, z, 0xfff3df, Math.PI / 2);
      b.add(new THREE.CylinderGeometry(0.28, 0.3, 0.06, 12), STEEL, 1.1, 0.05, z); b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 8), STEEL, 1.1, 0.26, z);
      b.box(0.56, 0.12, 0.56, 1.1, 0.46, z, 0x7a2f2a); b.box(0.12, 0.62, 0.52, 1.36, 0.56, z, 0x7a2f2a);
    }
    figure(b, 1.1, -1.3, -Math.PI / 2, 0xe6e1d6, 0x26282e, SKIN[3], 0x1a1512, true);
    figure(b, 1.75, -1.25, -Math.PI / 2, 0x1f2a33, 0x1c1c1e, SKIN[1], 0x6b4a2e);
    b.box(2.2, 0.42, 0.5, 4.6, 0.02, -SHOP_D + 0.35, 0x3a3c41); b.box(2.2, 0.5, 0.1, 4.6, 0.44, -SHOP_D + 0.12, 0x3a3c41);   // waiting bench
    counter(b, 4.9, -1.2, 0.9, 0.5, 0, 0x2a2b2f, 0xd9d4c8, 1.0);
    // the pole in the window
    b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 10), 0xf2f3f4, 3.4, 1.6, -0.35); e.add(new THREE.CylinderGeometry(0.072, 0.072, 0.2, 10), 0xd9486e, 3.4, 1.75, -0.35); e.add(new THREE.CylinderGeometry(0.072, 0.072, 0.2, 10), 0x4a8fd0, 3.4, 1.35, -0.35);
    frameArt(b, 4.4, 1.6, -SHOP_D + 0.05, 0.7, 0.9, 0xd9b26a); frameArt(b, 5.3, 1.7, -SHOP_D + 0.05, 0.5, 0.6, 0x2f5d73);
  },
  market(b, e, r, W, C) {
    shell(b, e, W, C, 0xcfd3d6, 0xeef1f3, { tiles: 10, joint: 0xa9adb0, lightCol: 0xf4faff });
    for (const x of [1.2, 2.9]) { shelf(b, r, x, -2.0, 2.6, 1.7, 0.36, Math.PI / 2, GOODS, 4); shelf(b, r, x + 0.4, -2.0, 2.6, 1.7, 0.36, -Math.PI / 2, GOODS, 4); }
    b.box(1.9, 2.1, 0.6, 4.9, 0.02, -SHOP_D + 0.36, 0xe9ecee); e.box(1.7, 1.8, 0.02, 4.9, 0.2, -SHOP_D + 0.67, 0xcfe9f4);        // chiller
    for (let k = 0; k < 4; k++) b.box(1.7, 0.02, 0.5, 4.9, 0.3 + k * 0.44, -SHOP_D + 0.4, 0x9aa0a6);
    for (let k = 0; k < 10; k++) b.box(0.3, 0.2 + r() * 0.12, 0.12, 4.2 + (k % 5) * 0.34, 0.34 + Math.floor(k / 5) * 0.88, -SHOP_D + 0.55, GOODS[Math.floor(r() * GOODS.length)]);
    counter(b, 4.8, -0.9, 1.4, 0.55, 0, 0x2ec4b6, 0xf2f3f4, 0.95); e.box(0.3, 0.24, 0.03, 4.6, 1.0, -0.9, 0xbfe4ff);
    figure(b, 4.9, -1.45, 0, 0x2ec4b6, 0x26282e, SKIN[2], 0x1a1512);
    e.box(1.6, 0.3, 0.03, 4.9, 2.5, -SHOP_D + 0.06, 0x7dffb0);
  },
  arcade(b, e, r, W, C) {
    shell(b, e, W, C, 0x241f33, 0x191624, { ceil: 0x15131c, back: 0x231d3a, lights: [], skirt: 0x7b5ea7 });
    const scr = [0x5ff3ff, 0xff5fd8, 0xb4ff5c, 0xffb347, 0x8fe1ff, 0xff7a59];
    const cab = (x, z, ry, k) => {
      const s = Math.sin(ry), c = Math.cos(ry);
      b.box(0.7, 1.75, 0.7, x, 0.02, z, [0x2a2440, 0x3a2030, 0x1f2f3a][k % 3], ry);
      e.box(0.52, 0.42, 0.03, x + s * 0.34, 1.12, z + c * 0.34, scr[k % scr.length], ry, -0.25);
      b.box(0.62, 0.06, 0.3, x + s * 0.42, 0.9, z + c * 0.42, 0x16141f, ry);
      e.box(0.6, 0.16, 0.03, x + s * 0.36, 1.58, z + c * 0.36, scr[(k + 2) % scr.length], ry);
    };
    for (let k = 0; k < 4; k++) cab(0.5, -0.75 - k * 0.8, Math.PI / 2, k);
    for (let k = 0; k < 3; k++) cab(5.5, -1.3 - k * 0.8, -Math.PI / 2, k + 3);
    cab(2.0, -SHOP_D + 0.45, 0, 1); cab(2.9, -SHOP_D + 0.45, 0, 4);
    b.box(0.9, 1.9, 0.9, 4.0, 0.02, -SHOP_D + 0.55, 0xd9486e); e.box(0.8, 1.0, 0.8, 4.0, 0.8, -SHOP_D + 0.55, 0xbfe4ff);        // claw machine
    for (const [x0, col] of [[0.3, 0xff5fd8], [3.2, 0x5ff3ff]]) e.box(2.5, 0.04, 0.04, x0 + 1.25, C - 0.12, -SHOP_D + 0.1, col);
    e.box(0.04, 0.04, SHOP_D - 0.4, 0.08, C - 0.12, -SHOP_D / 2, 0xff5fd8); e.box(0.04, 0.04, SHOP_D - 0.4, W - 0.08, C - 0.12, -SHOP_D / 2, 0x5ff3ff);
    figure(b, 1.05, -1.55, Math.PI / 2 + Math.PI, 0xd9486e, 0x26282e, SKIN[1], 0x1a1512);
    figure(b, 2.9, -SHOP_D + 1.05, Math.PI, 0xe8b04a, 0x3b4252, SKIN[3], 0x3b2a1e);
  },
  cafe(b, e, r, W, C) {
    shell(b, e, W, C, 0x7a5a40, 0xe4dccb, { tiles: 9, joint: 0x5f4530, back: 0x3d4a45 });
    counter(b, 2.2, -SHOP_D + 0.9, 3.6, 0.7, 0, 0x3d4a45, 0x9a7550, 1.05);
    b.box(0.6, 0.5, 0.5, 1.0, 1.07, -SHOP_D + 0.9, 0xb9bec4); b.box(0.2, 0.3, 0.3, 1.5, 1.07, -SHOP_D + 0.85, 0x2a2b2f);          // machine, grinder
    b.box(1.2, 0.42, 0.55, 3.0, 1.07, -SHOP_D + 0.92, 0xcfe9f4);                                                               // pastry case
    for (let k = 0; k < 6; k++) b.add(new THREE.SphereGeometry(0.06, 5, 3), [0xd9b26a, 0xc8643b, 0xf0e8d8][k % 3], 2.55 + (k % 4) * 0.3, 1.18 + Math.floor(k / 4) * 0.16, -SHOP_D + 0.92, 0, 0, 0, 1.3, 0.7, 1.3);
    b.box(2.6, 0.8, 0.04, 2.2, 2.2, -SHOP_D + 0.05, 0x1f2523);                                                                 // menu board
    for (let k = 0; k < 9; k++) e.box(0.5 + r() * 0.5, 0.03, 0.02, 1.4 + (k % 3) * 0.85, 2.36 + Math.floor(k / 3) * 0.2, -SHOP_D + 0.08, 0xfff0d2);
    figure(b, 2.0, -SHOP_D + 0.35, 0, 0x1f2523, 0x26282e, SKIN[2], 0x3b2a1e);
    for (const [x, z] of [[1.1, -0.95], [3.2, -1.1]]) { table(b, x, z, 0.36); chair(b, x - 0.62, z, Math.PI / 2); chair(b, x + 0.62, z, -Math.PI / 2); b.add(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 8), 0xf2f3f4, x + 0.1, 0.8, z + 0.05); pendant(b, e, x, z, C, 1.05, 0x3d4a45); }
    figure(b, 0.52, -0.95, Math.PI / 2, 0xd97757, 0x3b4252, SKIN[0], 0x6b4a2e, true);
    plant(b, 5.3, -3.1, 1.6); b.box(1.0, 0.45, 0.5, 5.2, 0.02, -1.6, 0x8a6a48); b.box(1.0, 0.5, 0.1, 5.2, 0.47, -1.84, 0x8a6a48);
  },
  bar(b, e, r, W, C) {
    shell(b, e, W, C, 0x33271f, 0x2a1f1b, { ceil: 0x1c1614, back: 0x1c1614, lights: [], tiles: 9, joint: 0x241a14 });
    counter(b, 1.0, -2.0, 3.2, 0.6, Math.PI / 2, 0x4a2f22, 0x1c1614, 1.1);
    for (let k = 0; k < 4; k++) stool(b, 1.75, -0.8 - k * 0.78, 0x7a2f2a);
    // back bar: lit shelves of bottles
    e.box(0.04, 1.5, 3.0, 0.07, 1.2, -2.0, 0xffb347);
    const bot = [0x2f7d4f, 0xc8643b, 0xd9b26a, 0x4a8fd0, 0xf2f3f4, 0x7a2f2a];
    for (let t = 0; t < 3; t++) { b.box(0.22, 0.03, 3.0, 0.2, 1.25 + t * 0.48, -2.0, 0x1c1614); for (let k = 0; k < 9; k++) b.add(new THREE.CylinderGeometry(0.04, 0.045, 0.26 + r() * 0.1, 4), bot[Math.floor(r() * bot.length)], 0.2, 1.42 + t * 0.48, -0.65 - k * 0.31); }
    figure(b, 0.55, -1.7, Math.PI / 2, 0x1c1614, 0x1c1c1e, SKIN[3], 0x1a1512);
    figure(b, 1.78, -1.58, -Math.PI / 2, 0x2f5d73, 0x26282e, SKIN[1], 0xb8935a, true);
    for (const [x, z] of [[3.6, -1.0], [4.9, -2.3], [3.5, -3.0]]) { table(b, x, z, 0.32, 0x4a2f22, 1.05); stool(b, x + 0.5, z + 0.1, 0x7a2f2a); stool(b, x - 0.5, z - 0.1, 0x7a2f2a); }
    for (const [x, z] of [[1.4, -1.0], [1.4, -2.0], [1.4, -3.0], [3.6, -1.0], [4.9, -2.3]]) pendant(b, e, x, z, C, 0.8, 0xc8643b);
    e.box(1.6, 0.34, 0.03, 4.4, 2.2, -SHOP_D + 0.06, 0xff7a59); frameArt(b, 3.0, 1.5, -SHOP_D + 0.05, 0.8, 0.6, 0x2f5d73);
  },
  diner(b, e, r, W, C) {
    shell(b, e, W, C, 0xd9d4c8, 0xf0e8d8, { tiles: 10, joint: 0x7a2f2a, back: 0xc8643b });
    for (const [x, sgn] of [[0.55, 1], [5.45, -1]]) for (const z of [-0.95, -2.35]) {     // booths along both walls
      for (const dz of [-0.48, 0.48]) { b.box(0.9, 0.44, 0.34, x, 0.02, z + dz, 0x7a2f2a); b.box(0.9, 0.5, 0.08, x, 0.46, z + dz + Math.sign(dz) * 0.14, 0x8c3a2e); }
      b.box(0.8, 0.04, 0.5, x, 0.74, z, 0xf2f3f4); b.box(0.08, 0.72, 0.08, x, 0.02, z, STEEL);
      void sgn;
    }
    figure(b, 0.6, -0.5, Math.PI, 0x2f5d73, 0x26282e, SKIN[0], 0x3b2a1e, true);
    figure(b, 5.4, -2.8, 0, 0xe8b04a, 0x3b4252, SKIN[4], 0x1a1512, true);
    counter(b, 3.0, -SHOP_D + 0.75, 2.8, 0.6, 0, 0xf2f3f4, 0x7a2f2a, 1.05);
    b.box(1.1, 1.0, 0.7, 2.3, 1.07, -SHOP_D + 0.5, 0x8c5a40); e.add(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI), 0xff9a4a, 2.3, 1.3, -SHOP_D + 0.84, 0, 0, 0, 1, 0.6, 0.2);   // oven glow
    e.box(2.2, 0.6, 0.03, 3.4, 2.35, -SHOP_D + 0.06, 0xfff0d2);
    figure(b, 3.6, -SHOP_D + 0.3, 0, 0xf2f3f4, 0x26282e, SKIN[2], 0x1a1512);
    for (let k = 0; k < 3; k++) stool(b, 2.2 + k * 0.8, -SHOP_D + 1.5, 0xc8643b);
  },
  tech(b, e, r, W, C) {
    shell(b, e, W, C, 0xd4d7da, 0xf4f5f6, { tiles: 4, joint: 0xb9bdc1, lightCol: 0xf4faff, lights: [[1.5, -1.0], [4.5, -1.0], [1.5, -2.8], [4.5, -2.8]] });
    for (const z of [-1.1, -2.5]) {
      b.box(3.6, 0.07, 0.9, 2.5, 0.84, z, 0xcbb994); for (const x of [0.9, 4.1]) b.box(0.08, 0.84, 0.8, x, 0.02, z, 0xcbb994);
      for (let k = 0; k < 6; k++) { const x = 1.0 + k * 0.6; b.box(0.26, 0.015, 0.36, x, 0.915, z, 0x1b1c1f, r() * 0.4 - 0.2); e.box(0.22, 0.004, 0.32, x, 0.932, z, [0xbfe4ff, 0xffd9a0, 0xd9c4ff][k % 3], 0); }
    }
    for (const [x, col] of [[1.4, 0x8fe1ff], [3.0, 0xffb347], [4.6, 0xc4a4ff]]) { b.box(1.3, 0.8, 0.05, x, 1.4, -SHOP_D + 0.06, 0x101114); e.box(1.2, 0.7, 0.02, x, 1.45, -SHOP_D + 0.1, col); }
    figure(b, 5.1, -1.6, -0.6, 0x2f5d73, 0x26282e, SKIN[2], 0x1a1512);
    figure(b, 2.4, -1.75, Math.PI, 0xd9486e, 0x3b4252, SKIN[0], 0xb8935a);
  },
  gallery(b, e, r, W, C) {
    shell(b, e, W, C, 0x8f8a82, 0xf6f5f2, { lights: [], tiles: 0 });
    const art = [0xc8643b, 0x2f5d73, 0xd9b26a, 0x1f2a33, 0x5c7f6b, 0xd9486e, 0x7b5ea7];
    [[1.1, 1.3, 1.2], [2.8, 1.5, 0.8], [4.4, 1.2, 1.4]].forEach(([x, y, w], k) => { frameArt(b, x, y, -SHOP_D + 0.05, w, 1.0, art[k]); b.box(w * 0.5, 0.3, 0.036, x + w * 0.1, y + 0.3, -SHOP_D + 0.05, art[k + 3]); e.box(0.5, 0.04, 0.1, x, C - 0.1, -SHOP_D + 0.6, 0xfff3df); });
    frameArt(b, 0.06, 1.3, -1.6, 1.3, 0.9, art[5], Math.PI / 2); frameArt(b, W - 0.06, 1.4, -2.2, 0.9, 1.2, art[6], Math.PI / 2);
    b.box(0.5, 1.0, 0.5, 3.0, 0.02, -1.6, 0xf2f3f4); b.add(new THREE.TorusKnotGeometry(0.16, 0.055, 28, 4), 0xb9825a, 3.0, 1.3, -1.6);   // sculpture
    b.box(1.5, 0.42, 0.45, 1.4, 0.02, -1.7, 0x2a2b2f);
    figure(b, 4.4, -SHOP_D + 1.1, Math.PI, 0x1f2a33, 0x1c1c1e, SKIN[1], 0xd9d2c4);
    for (const x of [1.5, 4.5]) e.box(0.9, 0.03, 0.2, x, C - 0.035, -1.2, 0xfff3df);
  },
  gym(b, e, r, W, C) {
    shell(b, e, W, C, 0x2b2c30, 0xd8dadd, { tiles: 6, joint: 0x1c1d20, back: 0xa9c4d0, lightCol: 0xf4faff });
    for (let k = 0; k < 3; k++) {                                                        // treadmills facing the street
      const x = 1.0 + k * 1.25;
      b.box(0.75, 0.16, 1.6, x, 0.02, -1.3, 0x1f2023); b.box(0.06, 1.1, 0.06, x - 0.32, 0.18, -0.6, 0x3a3c41); b.box(0.06, 1.1, 0.06, x + 0.32, 0.18, -0.6, 0x3a3c41);
      b.box(0.7, 0.3, 0.08, x, 1.2, -0.58, 0x1f2023); e.box(0.4, 0.2, 0.02, x, 1.26, -0.63, 0x8fe1ff);
    }
    figure(b, 1.0, -1.3, 0, 0xd97757, 0x1c1c1e, SKIN[3], 0x1a1512);
    b.box(1.8, 0.9, 0.5, 4.9, 0.02, -SHOP_D + 0.36, 0x2a2b2f);                           // dumbbell rack
    for (let k = 0; k < 10; k++) { const x = 4.15 + (k % 5) * 0.36, y = 0.5 + Math.floor(k / 5) * 0.44; b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 5), 0x101114, x, y, -SHOP_D + 0.4, Math.PI / 2, 0, 0); }
    b.box(1.2, 0.45, 0.4, 4.9, 0.02, -1.6, 0x3a3c41);                                    // bench
    b.add(new THREE.SphereGeometry(0.32, 8, 6), 0x2ec4b6, 5.4, 0.34, -2.6);
    b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), STEEL, 3.0, 1.9, -SHOP_D + 0.5, 0, 0, Math.PI / 2);
  },
  lobby(b, e, r, W, C) {
    shell(b, e, W, C, 0xc9c6bf, 0xeeece7, { tiles: 6, joint: 0xa9a59c, back: 0x8a6a48, lights: [[2.2, -1.2], [6.8, -1.2], [4.5, -2.8]] });
    // timber wall with a lit logo strip, lift doors, reception
    for (let k = 0; k < 7; k++) b.box(0.04, C - 0.2, 0.02, 0.6 + k * 1.26, 0.1, -SHOP_D + 0.05, 0x6f5438);
    e.box(2.6, 0.08, 0.03, 3.0, 2.5, -SHOP_D + 0.08, 0xfff3df); e.box(0.5, 0.5, 0.03, 1.2, 2.3, -SHOP_D + 0.08, 0xff9a78);
    for (const x of [6.4, 7.7]) { b.box(1.05, 2.3, 0.05, x, 0.02, -SHOP_D + 0.06, 0xb9bec4); b.box(0.02, 2.3, 0.06, x, 0.02, -SHOP_D + 0.07, 0x6d7176); e.box(0.16, 0.06, 0.03, x, 2.45, -SHOP_D + 0.08, 0xffb347); }
    counter(b, 2.6, -SHOP_D + 1.1, 3.0, 0.7, 0, 0xf2f3f4, 0x2a2b2f, 1.05);
    e.box(2.8, 0.05, 0.03, 2.6, 0.2, -SHOP_D + 1.47, 0xfff3df);
    figure(b, 2.2, -SHOP_D + 0.55, 0, 0x1f2a33, 0x26282e, SKIN[1], 0x3b2a1e);
    for (const [x, ry] of [[6.2, 0], [7.9, 0]]) { b.box(1.4, 0.4, 0.75, x, 0.02, -1.4, 0x3d4a45, ry); b.box(1.4, 0.4, 0.14, x, 0.42, -1.74, 0x3d4a45, ry); }
    b.box(0.9, 0.36, 0.5, 7.05, 0.02, -0.75, 0x2a2b2f);
    figure(b, 6.2, -1.35, 0, 0xd97757, 0x3b4252, SKIN[0], 0x6b4a2e, true);
    plant(b, 0.7, -0.8, 1.9); plant(b, 8.4, -3.1, 2.2, 0x356b3a); plant(b, 4.9, -3.2, 1.5);
    for (const x of [3.4, 4.3]) { b.box(0.12, 0.95, 0.9, x, 0.02, -1.2, 0xb9bec4); e.box(0.13, 0.05, 0.3, x, 0.9, -1.2, 0x7dffb0); }   // turnstiles
  },
};

// Builds every geometry once. { frame, glass, awning, interiors: {type: geometry} } per bay width.
export function buildShopKit() {
  const kit = {
    shop: { W: BAY, ceil: SHOP_CEIL, frame: frameGeo(BAY, SHOP_CEIL), glass: glassGeo(BAY, SHOP_CEIL), awning: awningGeo(BAY), interiors: {} },
    lobby: { W: LOBBY_BAY, ceil: LOBBY_CEIL, frame: frameGeo(LOBBY_BAY, LOBBY_CEIL), glass: glassGeo(LOBBY_BAY, LOBBY_CEIL), awning: null, interiors: {} },
  };
  Object.keys(TYPES).forEach((name, i) => {
    const K = name === 'lobby' ? kit.lobby : kit.shop;
    const b = new Batch(), e = new Batch();
    TYPES[name](b, e, lcg(977 + i * 131), K.W, K.ceil);
    const lit = bake(b.merged(), SHOP_D);
    if (e.empty) { K.interiors[name] = lit; return; }
    const glow = boost(e.merged(), 1.45);
    const m = new Batch();
    m.geos.push(lit, glow);
    K.interiors[name] = m.merged();
  });
  return kit;
}
