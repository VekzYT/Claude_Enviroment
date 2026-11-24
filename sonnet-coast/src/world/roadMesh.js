// Turns the road graph into ribbon meshes, junction patches, bridge decks and pillars.
import * as THREE from 'three';
import { edges, nodes, edgePoint } from './roads.js';
import { CITY } from './layout.js';
import { makeRoadTexture } from './textures.js';
import { rawHeight } from './terrain.js';
import { addCircle } from './colliders.js';

class GeoBuilder {
  constructor() { this.pos = []; this.uv = []; this.idx = []; this.nor = []; }
  vert(x, y, z, u, v, nx = 0, ny = 1, nz = 0) {
    this.pos.push(x, y, z); this.uv.push(u, v); this.nor.push(nx, ny, nz);
    return this.pos.length / 3 - 1;
  }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    return g;
  }
}

function nodeRadius(n) {
  if (n.edges.length < 2) return 0;
  let r = 0;
  for (const e of n.edges) r = Math.max(r, e.spec.hw);
  return r;
}

export function buildRoads(scene) {
  const builders = { asphalt: new GeoBuilder(), dirt: new GeoBuilder(), plain: new GeoBuilder(), deck: new GeoBuilder(), wood: new GeoBuilder(), stripes: new GeoBuilder() };
  const P = {};
  const LIFT = 0.035;

  for (const e of edges) {
    const isDirt = e.type === 'dirt';
    const b = isDirt ? builders.dirt : builders.asphalt;
    const hw = e.spec.hw;
    const trimA = nodeRadius(e.a) * (e.a.edges.length >= 3 || e.type === 'city' ? 1 : 0);
    const trimB = nodeRadius(e.b) * (e.b.edges.length >= 3 || e.type === 'city' ? 1 : 0);
    const s0 = trimA, s1 = e.len - trimB;
    if (s1 - s0 < 1) continue;
    const n = Math.max(1, Math.ceil((s1 - s0) / 5));
    let prevL = -1, prevR = -1, prevD = -1, prevBridge = false;
    let lastPillar = -99, lastRail = -99;
    for (let k = 0; k <= n; k++) {
      const s = s0 + ((s1 - s0) * k) / n;
      edgePoint(e, s, 0, P);
      const rx = -P.dz, rz = P.dx; // right
      const y = P.y + LIFT;
      const v = s / 16;
      const l = b.vert(P.x - rx * hw, y, P.z - rz * hw, 0, v);
      const r = b.vert(P.x + rx * hw, y, P.z + rz * hw, 1, v);
      if (prevL >= 0) b.quad(prevL, prevR, r, l);
      prevL = l; prevR = r;

      // Bridge deck: slab sides, rails and underside over water.
      const bridge = P.bridge;
      const db = isDirt ? builders.wood : builders.deck;
      if (bridge) {
        const ground = rawHeight(P.x, P.z);
        const t = isDirt ? 0.3 : 1.0, rail = isDirt ? 0.05 : 0.8, w = hw + (isDirt ? 0.1 : 0.45);
        const lx = P.x - rx * w, lz = P.z - rz * w, rxx = P.x + rx * w, rzz = P.z + rz * w;
        const d0 = db.vert(lx, y + rail, lz, v, 1);
        db.vert(lx, y - t, lz, v, 0);
        db.vert(rxx, y + rail, rzz, v, 1);
        db.vert(rxx, y - t, rzz, v, 0);
        if (prevBridge) {
          db.quad(prevD, d0, d0 + 1, prevD + 1);         // left wall
          db.quad(prevD + 2, d0 + 2, d0 + 3, prevD + 3); // right wall
          db.quad(prevD + 1, d0 + 1, d0 + 3, prevD + 3); // underside
        }
        prevD = d0;
        if (!isDirt && s - lastRail > 2.2) {
          lastRail = s;
          addCircle(lx, lz, 0.45, y - 1.2, y + 1.3, { rail: true });
          addCircle(rxx, rzz, 0.45, y - 1.2, y + 1.3, { rail: true });
        }
        if (s - lastPillar > (isDirt ? 9 : 26) && ground < y - 1.6) {
          lastPillar = s;
          const bottom = Math.min(ground, 0) - 1.5;
          const pw = isDirt ? 0.24 : 1.0;
          for (const side of isDirt ? [-1, 1] : [-0.5, 0.5]) {
            const px = P.x + rx * w * side, pz = P.z + rz * w * side;
            box(db, px, bottom, pz, pw, y - t - bottom, pw);
            if (!isDirt) addCircle(px, pz, 0.7, bottom, y - t, { pillar: true });
          }
        }
      }
      prevBridge = bridge;
    }
  }

  // Junction patches.
  const pl = builders.plain;
  for (const n of nodes) {
    if (n.edges.length < 2) continue;
    const isCity = n.edges.some((e) => e.type === 'city');
    const allDirt = n.edges.every((e) => e.type === 'dirt');
    const r = nodeRadius(n);
    const y = n.y + LIFT - 0.004;
    const target = allDirt ? builders.dirt : pl;
    if (isCity) {
      const a = target.vert(n.x - r, y, n.z - r, 0, 0), b = target.vert(n.x - r, y, n.z + r, 0, 1);
      const c = target.vert(n.x + r, y, n.z + r, 1, 1), d = target.vert(n.x + r, y, n.z - r, 1, 0);
      target.quad(a, b, c, d);
      // crosswalk bars
      crosswalk(builders, n, r, y + 0.006);
    } else {
      const rr = r * 1.35;
      const c0 = target.vert(n.x, y, n.z, 0.5, 0.5);
      const ring = [];
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        ring.push(target.vert(n.x + Math.sin(a) * rr, y, n.z + Math.cos(a) * rr, 0.5 + Math.sin(a) * 0.5, 0.5 + Math.cos(a) * 0.5));
      }
      for (let k = 0; k < 14; k++) target.idx.push(c0, ring[k], ring[(k + 1) % 14]);
    }
  }

  const group = new THREE.Group();
  group.name = 'roads';
  const add = (geo, mat) => {
    if (!geo.getAttribute('position').count) return;
    const m = new THREE.Mesh(geo, mat);
    m.receiveShadow = true;
    m.matrixAutoUpdate = false;
    group.add(m);
    return m;
  };
  const off = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  add(builders.asphalt.build(), new THREE.MeshStandardMaterial({ map: makeRoadTexture('city'), roughness: 0.82, metalness: 0.05, ...off }));
  add(builders.dirt.build(), new THREE.MeshStandardMaterial({ map: makeRoadTexture('dirt'), roughness: 1, ...off }));
  add(builders.plain.build(), new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.85, ...off, polygonOffsetFactor: -3 }));
  add(builders.stripes.build(), new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.7, ...off, polygonOffsetFactor: -4 }));
  const deck = add(builders.deck.build(), new THREE.MeshStandardMaterial({ color: 0xb9b2a4, roughness: 0.9, flatShading: true, side: THREE.DoubleSide }));
  if (deck) deck.castShadow = true;
  add(builders.wood.build(), new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 1, flatShading: true, side: THREE.DoubleSide }));
  scene.add(group);
  return group;
}

function crosswalk(builders, n, r, y) {
  const s = builders.stripes;
  // four sides; bars run parallel to traffic
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const hasEdge = n.edges.some((e) => {
      const o = e.a === n ? e.b : e.a;
      return Math.sign(o.x - n.x) === dx && Math.sign(o.z - n.z) === dz;
    });
    if (!hasEdge) continue;
    const cx = n.x + dx * (r + 2.2), cz = n.z + dz * (r + 2.2);
    for (let k = -4; k <= 4; k++) {
      const ox = dz * k * 1.45, oz = dx * k * 1.45;
      const hx = Math.abs(dx) * 1.5 + Math.abs(dz) * 0.42, hz = Math.abs(dz) * 1.5 + Math.abs(dx) * 0.42;
      const a = s.vert(cx + ox - hx, y, cz + oz - hz, 0, 0), b = s.vert(cx + ox - hx, y, cz + oz + hz, 0, 1);
      const c = s.vert(cx + ox + hx, y, cz + oz + hz, 1, 1), d = s.vert(cx + ox + hx, y, cz + oz - hz, 1, 0);
      s.quad(a, b, c, d);
    }
  }
}

function box(b, cx, y0, cz, w, h, d) {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
  const face = (p, n) => {
    const i = p.map(([x, y, z], k) => b.vert(x, y, z, k % 2, k > 1 ? 1 : 0, n[0], n[1], n[2]));
    b.quad(i[0], i[1], i[2], i[3]);
  };
  face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]);
  face([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]);
  face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0]);
  face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]);
}
export { GeoBuilder, box as addBoxGeo };
