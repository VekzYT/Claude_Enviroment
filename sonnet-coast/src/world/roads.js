// Road graph (city grid + highways + dirt trails), road height profiles with bridges,
// and the final ground-height / surface queries used by physics.
import { CITY, ROADS, WATER_Y } from './layout.js';
import { rawHeight, biomeAt, BIOME, swampMask } from './terrain.js';
import { SegmentIndex } from '../util/segindex.js';
import { catmullRom, smoothstep, lerp, clamp, segProject } from '../util/math.js';

export const ROAD_SPEC = {
  city: { hw: 7, lanes: [1.9, 5.2], speed: 15, bridge: 4, surface: 'asphalt' },
  highway: { hw: 9, lanes: [2.3, 6.6], speed: 24, bridge: 5.5, surface: 'asphalt' },
  road: { hw: 6.5, lanes: [1.9, 4.9], speed: 18, bridge: 4.2, surface: 'asphalt' },
  dirt: { hw: 3.8, lanes: [1.6], speed: 11, bridge: 2.4, surface: 'dirt' },
};

export const nodes = [];
export const edges = [];
export const roadIndex = new SegmentIndex(40);

function makeNode(x, z) {
  const n = { id: nodes.length, x, z, y: 0, edges: [] };
  nodes.push(n);
  return n;
}
function findNode(x, z, r = 14) {
  let best = null, bd = r * r;
  for (const n of nodes) {
    const d = (n.x - x) ** 2 + (n.z - z) ** 2;
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}
function makeEdge(a, b, pts, type, name) {
  const e = { id: edges.length, a, b, pts, type, name, spec: ROAD_SPEC[type] };
  edges.push(e);
  a.edges.push(e);
  if (b !== a) b.edges.push(e);
  return e;
}
function removeEdge(e) {
  e.dead = true;
  e.a.edges = e.a.edges.filter((x) => x !== e);
  e.b.edges = e.b.edges.filter((x) => x !== e);
}
// Snap an endpoint to an existing node, or split an existing edge to create one.
function attach(x, z) {
  const n = findNode(x, z);
  if (n) return n;
  let best = null, bd = 14 * 14;
  for (const e of edges) {
    if (e.dead) continue;
    for (let i = 1; i < e.pts.length - 1; i++) {
      const d = (e.pts[i].x - x) ** 2 + (e.pts[i].z - z) ** 2;
      if (d < bd) { bd = d; best = { e, i }; }
    }
  }
  if (!best) return makeNode(x, z);
  const { e, i } = best;
  const p = e.pts[i];
  const mid = makeNode(p.x, p.z);
  removeEdge(e);
  makeEdge(e.a, mid, e.pts.slice(0, i + 1), e.type, e.name);
  makeEdge(mid, e.b, e.pts.slice(i), e.type, e.name);
  return mid;
}

function buildGraph() {
  const { xs, zs } = CITY;
  const grid = [];
  for (let i = 0; i < xs.length; i++) {
    grid[i] = [];
    for (let j = 0; j < zs.length; j++) grid[i][j] = makeNode(xs[i], zs[j]);
  }
  const straight = (a, b) => {
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(2, Math.ceil(len / 10));
    const pts = [];
    for (let k = 0; k <= n; k++) pts.push({ x: lerp(a.x, b.x, k / n), z: lerp(a.z, b.z, k / n) });
    return pts;
  };
  for (let i = 0; i < xs.length; i++) for (let j = 0; j < zs.length; j++) {
    if (i + 1 < xs.length) makeEdge(grid[i][j], grid[i + 1][j], straight(grid[i][j], grid[i + 1][j]), 'city', 'City Street');
    if (j + 1 < zs.length) makeEdge(grid[i][j], grid[i][j + 1], straight(grid[i][j], grid[i][j + 1]), 'city', 'City Street');
  }
  for (const r of ROADS) {
    const ctrl = r.pts.map(([x, z]) => ({ x, z }));
    let pts = catmullRom(ctrl, 6, !!r.closed);
    if (r.closed) pts.push({ x: pts[0].x, z: pts[0].z });
    const a = attach(pts[0].x, pts[0].z);
    pts[0] = { x: a.x, z: a.z };
    // For closed loops both ends are the same node.
    const b = r.closed ? a : attach(pts[pts.length - 1].x, pts[pts.length - 1].z);
    pts[pts.length - 1] = { x: b.x, z: b.z };
    makeEdge(a, b, pts, r.type, r.name);
  }
  // Second pass: dirt connectors that landed on edges created after them.
  for (let k = edges.length - 1; k >= 0; k--) if (edges[k].dead) edges.splice(k, 1);
  edges.forEach((e, i) => { e.id = i; });
}

function computeProfiles() {
  for (const n of nodes) {
    let y = rawHeight(n.x, n.z);
    const types = n.edges.map((e) => e.type);
    if (types.includes('city')) y = CITY.y;
    n.y = Math.max(y, 0.9);
  }
  for (const e of edges) {
    const pts = e.pts;
    const N = pts.length;
    // Arc length
    let s = 0;
    for (let i = 0; i < N; i++) {
      if (i > 0) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
      pts[i].s = s;
    }
    e.len = s;
    if (e.type === 'city') { for (const p of pts) { p.y = CITY.y; p.bridge = false; } continue; }
    const raw = pts.map((p) => rawHeight(p.x, p.z));
    const under = raw.map((h) => h < 0.7);
    // Smooth the ground profile.
    const W = e.type === 'dirt' ? 2 : 5;
    let ys = raw.map((_, i) => {
      let sum = 0, cnt = 0;
      for (let k = -W; k <= W; k++) {
        const j = clamp(i + k, 0, N - 1);
        sum += Math.max(raw[j], 0.9); cnt++;
      }
      return sum / cnt;
    });
    // Bridge decks with ramps.
    const deck = e.spec.bridge;
    const req = new Array(N).fill(-Infinity);
    for (let j = 0; j < N; j++) {
      if (!under[j]) continue;
      for (let i = 0; i < N; i++) {
        const r = deck - Math.abs(pts[i].s - pts[j].s) * 0.07;
        if (r > req[i]) req[i] = r;
      }
    }
    ys = ys.map((y, i) => Math.max(y, req[i]));
    // Pin ends to node heights.
    const ya = e.a.y, yb = e.b.y;
    for (let i = 0; i < N; i++) {
      const wa = smoothstep(40, 0, pts[i].s), wb = smoothstep(40, 0, e.len - pts[i].s);
      let y = ys[i];
      y = lerp(y, ya, wa);
      y = lerp(y, yb, wb);
      pts[i].y = y;
      pts[i].bridge = under[i] || (i > 0 && under[i - 1]) || (i < N - 1 && under[i + 1]);
      pts[i].raw = raw[i];
    }
  }
  for (const e of edges) {
    for (let i = 0; i < e.pts.length - 1; i++) {
      const a = e.pts[i], b = e.pts[i + 1];
      roadIndex.add(a.x, a.z, b.x, b.z, e.spec.hw + 26, { e, i });
    }
  }
}

buildGraph();
computeProfiles();

// ---- Queries -------------------------------------------------------------

// Nearest road surface at (x,z). Returns null if no road within maxD of centreline.
export function roadAt(x, z, maxD = 30) {
  const list = roadIndex.cellList(x, z);
  if (!list) return null;
  let best = null, bd = maxD;
  for (let k = 0; k < list.length; k++) {
    const s = list[k];
    const p = segProject(x, z, s.ax, s.az, s.bx, s.bz);
    const d = Math.sqrt(p.d2);
    if (d < bd) {
      bd = d;
      const { e, i } = s.data;
      const a = e.pts[i], b = e.pts[i + 1];
      best = { d, e, i, t: p.t, y: lerp(a.y, b.y, p.t), hw: e.spec.hw, bridge: a.bridge || b.bridge, type: e.type };
    }
  }
  return best;
}

// Terrain including road cuts/fills (what the terrain mesh shows). The ground is held
// flat a little past the road edge so coarse terrain triangles never poke through the ribbon.
export const ROAD_FLAT_MARGIN = 7.5;
export function terrainHeight(x, z) {
  const raw = rawHeight(x, z);
  const r = roadAt(x, z, 36);
  if (!r || r.bridge) return raw;
  const flat = r.hw + ROAD_FLAT_MARGIN;
  const shoulder = r.type === 'dirt' ? 9 : 14;
  const w = smoothstep(flat + shoulder, flat, r.d);
  return lerp(raw, r.y - 0.07, w);
}

// City blocks are raised kerbs.
export const KERB = 0.16;
function kerbAt(x, z) {
  if (x <= CITY.x0 || x >= CITY.x1 || z <= CITY.z0 || z >= CITY.z1) return 0;
  const fx = (x - CITY.x0) % 100, fz = (z - CITY.z0) % 100;
  const hw = CITY.roadW / 2;
  return fx > hw && fx < 100 - hw && fz > hw && fz < 100 - hw ? KERB : 0;
}

export const ramps = [];
export function addRamp(x, z, heading, len, wid, height) {
  ramps.push({ x, z, heading, len, wid, height, s: Math.sin(heading), c: Math.cos(heading) });
}
function rampHeight(x, z) {
  for (let i = 0; i < ramps.length; i++) {
    const r = ramps[i];
    const dx = x - r.x, dz = z - r.z;
    if (dx * dx + dz * dz > r.len * r.len) continue;
    const f = dx * r.s + dz * r.c; // along heading
    const l = dx * r.c - dz * r.s; // sideways
    if (Math.abs(l) > r.wid / 2 || f < -r.len / 2 || f > r.len / 2) continue;
    return { h: ((f + r.len / 2) / r.len) * r.height, ramp: r };
  }
  return null;
}

// Flat raised decks (piers, jetties, loading docks).
export const platforms = [];
export function addPlatform(x0, z0, x1, z1, y) { platforms.push({ x0, z0, x1, z1, y }); }

// Height a wheel/foot rests on. refY lets things under a bridge ignore the deck.
export function groundHeight(x, z, refY = Infinity) {
  let h = terrainHeight(x, z);
  const r = roadAt(x, z, 12);
  if (r && r.d < r.hw + 0.6 && r.y <= refY + 2.2) h = r.bridge ? r.y : Math.max(h, r.y);
  else h += kerbAt(x, z);
  if (ramps.length) {
    const rh = rampHeight(x, z);
    if (rh) h += rh.h;
  }
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1 && p.y > h && p.y <= refY + 2.2) h = p.y;
  }
  return h;
}

export function surfaceAt(x, z, h) {
  const r = roadAt(x, z, 12);
  if (r && r.d < r.hw + 0.4) return r.type === 'dirt' ? 'dirt' : 'asphalt';
  if (h < WATER_Y - 0.25) return 'water';
  const b = biomeAt(x, z, h);
  if (b === BIOME.SWAMP && h < 1.4) return 'mud';
  if (b === BIOME.BEACH) return 'sand';
  if (b === BIOME.CITY || b === BIOME.PORT || b === BIOME.RIDGE) return 'concrete';
  if (swampMask(x, z) > 0.4) return 'mud';
  return 'grass';
}

// Position along an edge at arc length s with lateral offset (positive = right of a->b).
export function edgePoint(e, s, offset = 0, out = {}) {
  const pts = e.pts;
  s = clamp(s, 0, e.len);
  let lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].s <= s) lo = m; else hi = m; }
  const a = pts[lo], b = pts[hi];
  const segLen = b.s - a.s || 1;
  const t = (s - a.s) / segLen;
  const dx = (b.x - a.x) / segLen, dz = (b.z - a.z) / segLen;
  // right vector of heading (dx,dz) is (-dz, dx)
  out.x = lerp(a.x, b.x, t) - dz * offset;
  out.z = lerp(a.z, b.z, t) + dx * offset;
  out.y = lerp(a.y, b.y, t);
  out.dx = dx; out.dz = dz;
  out.bridge = !!(a.bridge || b.bridge);
  return out;
}

// A* over the node graph. Returns array of {e, forward} or null.
export function findPath(fromNode, toNode, allowDirt = true) {
  if (fromNode === toNode) return [];
  const open = new Map([[fromNode.id, 0]]);
  const g = new Map([[fromNode.id, 0]]);
  const came = new Map();
  const h = (n) => Math.hypot(n.x - toNode.x, n.z - toNode.z);
  const closed = new Set();
  while (open.size) {
    let cur = null, best = Infinity;
    for (const [id, f] of open) if (f < best) { best = f; cur = id; }
    open.delete(cur);
    if (cur === toNode.id) break;
    closed.add(cur);
    const node = nodes[cur];
    for (const e of node.edges) {
      if (!allowDirt && e.type === 'dirt') continue;
      const other = e.a === node ? e.b : e.a;
      if (closed.has(other.id)) continue;
      const cost = g.get(cur) + e.len * (e.type === 'dirt' ? 1.4 : e.type === 'highway' ? 0.8 : 1);
      if (cost < (g.get(other.id) ?? Infinity)) {
        g.set(other.id, cost);
        came.set(other.id, { from: cur, e, forward: e.a === node });
        open.set(other.id, cost + h(other));
      }
    }
  }
  if (!came.has(toNode.id)) return null;
  const path = [];
  let id = toNode.id;
  while (id !== fromNode.id) {
    const c = came.get(id);
    path.push({ e: c.e, forward: c.forward });
    id = c.from;
  }
  return path.reverse();
}

export function nearestNode(x, z, filter = null) {
  let best = null, bd = Infinity;
  for (const n of nodes) {
    if (filter && !filter(n)) continue;
    const d = (n.x - x) ** 2 + (n.z - z) ** 2;
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}
