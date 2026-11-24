// Dev harness for the input module: a plain three.js 64 × 64 grid with a few landmark blocks, its own
// y = 0 pick, and fake hooks that tint planned tiles and paint applied ones (roads grey, zones in
// their colours, buildings purple, bulldozed back to grass). Exposes window.__input for
// tools/dev/input-touch.mjs. Imports only core, the input module and three.
import * as THREE from 'three';
import { BUILDINGS, ZONE_COLORS, buildingTypeOf } from '../core/defs';
import type { Plan, TilePos, ToolId } from '../core/types';
import { createInputController } from '../input/controller';
import { lPath, rectTiles, tileAt } from '../input/tiles';

const N = 64;
const canvas = document.getElementById('world') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLDivElement;

// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#bfe3f5');
const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
scene.add(new THREE.HemisphereLight('#ffffff', '#6b8f5a', 1.6));
const sun = new THREE.DirectionalLight('#fff6e0', 1.6);
sun.position.set(40, 80, 20);
scene.add(sun);

// tile colours live in a 64 × 64 texture, one texel per tile
const GRASS_A = [122, 190, 98];
const GRASS_B = [112, 178, 90];
const base = new Uint8Array(N * N * 4);
const baseTex = new THREE.DataTexture(base, N, N);
baseTex.magFilter = THREE.NearestFilter;
baseTex.minFilter = THREE.NearestFilter;
baseTex.colorSpace = THREE.SRGBColorSpace;
// texel row r is drawn at the plane's bottom (+z after the rotation below), so flip rows
const texel = (i: number) => {
  const x = i % N;
  const z = Math.floor(i / N);
  return ((N - 1 - z) * N + x) * 4;
};
function paint(i: number, rgb: number[]): void {
  const o = texel(i);
  base[o] = rgb[0];
  base[o + 1] = rgb[1];
  base[o + 2] = rgb[2];
  base[o + 3] = 255;
}
const grassOf = (i: number) => (((i % N) + Math.floor(i / N)) % 2 ? GRASS_A : GRASS_B);
for (let i = 0; i < N * N; i++) paint(i, grassOf(i));
baseTex.needsUpdate = true;

const groundGeo = new THREE.PlaneGeometry(N, N);
groundGeo.rotateX(-Math.PI / 2);
groundGeo.translate(N / 2, 0, N / 2);
scene.add(new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ map: baseTex })));

// a slab edge so the map reads as a board
const slab = new THREE.Mesh(new THREE.BoxGeometry(N, 1.5, N), new THREE.MeshLambertMaterial({ color: '#8a6a4a' }));
slab.position.set(N / 2, -0.76, N / 2);
scene.add(slab);

// preview overlay: a transparent texture just above the ground
const over = new Uint8Array(N * N * 4);
const overTex = new THREE.DataTexture(over, N, N);
overTex.magFilter = THREE.NearestFilter;
overTex.minFilter = THREE.NearestFilter;
overTex.colorSpace = THREE.SRGBColorSpace;
const overMesh = new THREE.Mesh(
  groundGeo.clone().translate(0, 0.03, 0),
  new THREE.MeshBasicMaterial({ map: overTex, transparent: true, depthWrite: false }),
);
scene.add(overMesh);

// grid lines: every tile faint, every 8 tiles stronger
function gridLines(step: number, color: string, opacity: number, y: number): THREE.LineSegments {
  const pts: number[] = [];
  for (let k = 0; k <= N; k += step) {
    pts.push(k, y, 0, k, y, N, 0, y, k, N, y, k);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}
scene.add(gridLines(1, '#24401c', 0.18, 0.01), gridLines(8, '#1d3318', 0.45, 0.012));

// landmarks so pans, zooms and turns are easy to read in screenshots
const blocks: Array<[number, number, number, string]> = [
  [8, 8, 4, '#e2574c'],
  [54, 10, 3, '#3d8bff'],
  [32, 32, 2, '#ffffff'],
  [12, 52, 5, '#f2b632'],
  [50, 50, 3, '#9b59b6'],
  [32, 4, 6, '#333a44'],
];
for (const [x, z, h, c] of blocks) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, h, 1), new THREE.MeshLambertMaterial({ color: c }));
  m.position.set(x + 0.5, h / 2, z + 0.5);
  scene.add(m);
}
// a north arrow on the north edge
const arrow = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 3), new THREE.MeshLambertMaterial({ color: '#d63b3b' }));
arrow.rotation.x = -Math.PI / 2;
arrow.position.set(N / 2, 0.3, -2.5);
scene.add(arrow);

// the inspected tile
const sel = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.62, 4, 1), new THREE.MeshBasicMaterial({ color: '#ffd400', side: THREE.DoubleSide }));
sel.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
sel.visible = false;
scene.add(sel);

// ---------- fake game hooks ----------
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ndc = new THREE.Vector2();
const hit = new THREE.Vector3();
function pick(x: number, y: number): TilePos | null {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return null;
  ndc.set((x / w) * 2 - 1, 1 - (y / h) * 2);
  camera.updateMatrixWorld();
  raycaster.setFromCamera(ndc, camera);
  if (!raycaster.ray.intersectPlane(plane, hit)) return null;
  return tileAt(hit.x, hit.z, N);
}

function planOf(tool: ToolId, a: TilePos, b: TilePos): Plan {
  const type = buildingTypeOf(tool);
  if (type) {
    const s = BUILDINGS[type].size;
    const off = Math.floor((s - 1) / 2);
    const x0 = b.x - off;
    const z0 = b.z - off;
    const tiles: number[] = [];
    const ok: boolean[] = [];
    for (let z = z0; z < z0 + s; z++)
      for (let x = x0; x < x0 + s; x++) {
        if (x < 0 || z < 0 || x >= N || z >= N) continue;
        tiles.push(z * N + x);
        ok.push(true);
      }
    const valid = tiles.length === s * s;
    return { tool, tiles, ok, cost: BUILDINGS[type].cost, valid, reason: valid ? undefined : 'Too close to the edge', building: { type, x: x0, z: z0, w: s, h: s, rot: 0 } };
  }
  const tiles = tool === 'road' ? lPath(a, b, N) : rectTiles(a, b, N);
  return { tool, tiles, ok: tiles.map(() => true), cost: tiles.length * (tool === 'road' ? 10 : 5), valid: true };
}

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const TOOL_PAINT: Record<string, number[]> = {
  road: [88, 92, 100],
  zone_res: hex(ZONE_COLORS.res),
  zone_com: hex(ZONE_COLORS.com),
  zone_ind: hex(ZONE_COLORS.ind),
};

const log: string[] = [];
const events = { plans: 0, previews: 0, applied: [] as Plan[], inspected: [] as Array<TilePos | null>, touches: 0, lastPreview: null as Plan | null };
let lastText = 'ready';

function showPreview(p: Plan | null): void {
  over.fill(0);
  if (p) {
    const rgb = p.tool === 'bulldoze' ? [230, 70, 60] : p.valid ? [255, 255, 255] : [230, 70, 60];
    for (const i of p.tiles) {
      const o = texel(i);
      over[o] = rgb[0];
      over[o + 1] = rgb[1];
      over[o + 2] = rgb[2];
      over[o + 3] = 150;
    }
  }
  overTex.needsUpdate = true;
}

function applyPlan(p: Plan): void {
  const rgb = p.tool === 'bulldoze' ? null : p.building ? [150, 90, 200] : TOOL_PAINT[p.tool];
  for (const i of p.tiles) paint(i, rgb ?? grassOf(i));
  baseTex.needsUpdate = true;
}

const input = createInputController(canvas, {
  pick,
  plan(tool, a, b) {
    events.plans++;
    return planOf(tool, a, b);
  },
  apply(p) {
    events.applied.push(p);
    applyPlan(p);
    lastText = `applied ${p.tool}: ${p.tiles.length} tiles`;
    log.push(lastText);
  },
  preview(p) {
    events.previews++;
    events.lastPreview = p;
    showPreview(p);
    if (p) lastText = `plan ${p.tool}: ${p.tiles.length} tiles`;
  },
  inspect(t) {
    events.inspected.push(t);
    sel.visible = !!t;
    if (t) sel.position.set(t.x + 0.5, 0.05, t.z + 0.5);
    lastText = t ? `inspect ${t.x},${t.z}` : 'inspect: off the map';
    log.push(lastText);
  },
  touched() {
    events.touches++;
  },
}, N);

// ---------- harness UI: HUD, a tool strip, finger markers ----------
const style = document.createElement('style');
style.textContent = `
#ui{position:fixed;inset:0;pointer-events:none;font:13px -apple-system,system-ui,sans-serif;color:#2a2a2a}
.hud{position:absolute;left:68px;top:8px;background:rgba(255,250,240,.92);border-radius:12px;padding:6px 10px;box-shadow:0 2px 8px rgba(0,0,0,.18);white-space:pre;line-height:1.35}
.tools{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);display:flex;gap:6px;background:rgba(255,250,240,.92);padding:6px;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,.2)}
.tools button{pointer-events:auto;min-width:64px;height:44px;border:0;border-radius:12px;background:#efe6d6;font:600 13px -apple-system,system-ui,sans-serif;color:#333}
.tools button.on{background:#3d8bff;color:#fff}
.finger{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid rgba(255,64,64,.9);background:rgba(255,255,255,.35);pointer-events:none;z-index:9}`;
document.head.appendChild(style);
const hud = document.createElement('div');
hud.className = 'hud';
uiRoot.appendChild(hud);
const strip = document.createElement('div');
strip.className = 'tools';
uiRoot.appendChild(strip);
const TOOLS: Array<[ToolId, string]> = [
  ['inspect', 'Look'],
  ['road', 'Road'],
  ['zone_res', 'Homes'],
  ['zone_com', 'Shops'],
  ['bulldoze', 'Clear'],
  ['build:police', 'Police'],
];
const buttons = new Map<ToolId, HTMLButtonElement>();
function setTool(t: ToolId): void {
  input.setTool(t);
  for (const [id, b] of buttons) b.classList.toggle('on', id === t);
}
for (const [id, label] of TOOLS) {
  const b = document.createElement('button');
  b.textContent = label;
  b.addEventListener('click', () => setTool(id));
  strip.appendChild(b);
  buttons.set(id, b);
}
setTool('inspect');

// markers where fingers are (harness only; passive, never interferes)
const fingers = new Map<number, HTMLDivElement>();
const showFinger = (e: PointerEvent) => {
  if (e.pointerType !== 'touch') return;
  let f = fingers.get(e.pointerId);
  if (!f) {
    f = document.createElement('div');
    f.className = 'finger';
    document.body.appendChild(f);
    fingers.set(e.pointerId, f);
  }
  f.style.left = `${e.clientX}px`;
  f.style.top = `${e.clientY}px`;
};
const hideFinger = (e: PointerEvent) => {
  fingers.get(e.pointerId)?.remove();
  fingers.delete(e.pointerId);
};
window.addEventListener('pointerdown', showFinger, { capture: true, passive: true });
window.addEventListener('pointermove', showFinger, { capture: true, passive: true });
window.addEventListener('pointerup', hideFinger, { capture: true, passive: true });
window.addEventListener('pointercancel', hideFinger, { capture: true, passive: true });

// ---------- loop ----------
function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
let frames = 0;
const deg = (r: number) => ((r * 180) / Math.PI).toFixed(0);
function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  input.update(dt);
  input.rig.apply(camera);
  renderer.render(scene, camera);
  frames++;
  const r = input.rig;
  hud.textContent = `tool ${input.getTool()}   target ${r.target.x.toFixed(1)}, ${r.target.z.toFixed(1)}\nyaw ${deg(r.yaw)}°  pitch ${deg(r.pitch)}°  distance ${r.distance.toFixed(1)}\n${lastText}`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- test API ----------
declare global {
  interface Window {
    __input: unknown;
  }
}
window.__input = {
  ready: true,
  input,
  events,
  log,
  setTool,
  frames: () => frames,
  view: () => ({ ...input.rig.current }),
  groundAt: (x: number, y: number) => input.groundAt(x, y),
  pick,
  /** Where a ground point shows up on screen (CSS px), via the real camera. */
  screenOf: (x: number, z: number) => {
    const v = new THREE.Vector3(x, 0, z).project(camera);
    return { x: ((v.x + 1) / 2) * canvas.clientWidth, y: ((1 - v.y) / 2) * canvas.clientHeight };
  },
  resetView: () => {
    input.rig.reset(true);
  },
  resetEvents: () => {
    events.plans = 0;
    events.previews = 0;
    events.applied.length = 0;
    events.inspected.length = 0;
    events.lastPreview = null;
  },
};
