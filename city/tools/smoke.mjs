// End-to-end smoke test: builds the game, serves www/, and plays it in headless Chromium emulating an
// iPhone 15 Pro held sideways, using REAL touch input sent through the DevTools protocol
// (Input.dispatchTouchEvent): taps on interface buttons, one-finger drags on the map, a two-finger pinch.
//
//   node tools/smoke.mjs            (exit code 1 on any failed check, console error/warning or page error)
//
// It starts a new city, lays a road grid, zones homes/shops/industry, places a coal plant and water
// towers, parks and services, runs at top speed until lots reach level 2-3, opens the inspect card,
// budget, map layers and settings, waits for night, then saves, reloads and continues the city.
// Screenshots of every step go to .cache/smoke/.
//
// The page's Math.random is seeded so every run plays the same map. The game exposes a small read-only
// window.cubopolis (state, tileToScreen) that the test uses to find tiles on screen and to watch the
// city grow; it never changes the city through it except to add money if a run would stall (reported).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '.cache', 'smoke');
const PORT = Number(process.env.SMOKE_PORT || 5199);
/** Real-time cap for the growth phase (ms). */
const GROW_BUDGET_MS = Number(process.env.SMOKE_GROW_MS || 420000);
const W = 852;
const H = 393;
const SAFE = { left: 59, right: 59, bottom: 21 };

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

console.log('== build');
execFileSync(process.execPath, [join(root, 'tools/build.mjs')], { stdio: 'inherit' });

const { serve } = await import('./serve.mjs');
const server = await serve(PORT);
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
// A seeded Math.random: the same map and names every run.
await context.addInitScript(() => {
  let a = 0x51c0b0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
});
const page = await context.newPage();

// ------------------------------------------------------------------------------------------------
// Logging and checks
// ------------------------------------------------------------------------------------------------

const problems = [];
const noise = [];
let bootOks = 0;
/** Headless SwiftShader reports every WebGL frame read back for compositing; any WebGL page does it. */
const ENV_NOISE = /GL Driver Message \(OpenGL, Performance/;
page.on('console', (m) => {
  const text = m.text();
  if (text.includes('CUBOPOLIS_BOOT_OK')) bootOks++;
  const t = m.type();
  if (t === 'error' || t === 'warning') {
    if (ENV_NOISE.test(text)) noise.push(text);
    else problems.push(`[console.${t}] ${text}`);
  }
});
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => problems.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText ?? ''}`));

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  return !!ok;
}
const shots = [];
let shotN = 0;
async function shot(name) {
  await frames(2);
  const file = join(out, `${String(++shotN).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file });
  shots.push(file);
  console.log(`      shot ${file}`);
}
const notes = [];
function note(text) {
  notes.push(text);
  console.log(`NOTE  ${text}`);
}

// ------------------------------------------------------------------------------------------------
// Touch through the DevTools protocol
// ------------------------------------------------------------------------------------------------

const cdp = await context.newCDPSession(page);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = (n = 1) =>
  page.evaluate(
    (n) =>
      new Promise((r) => {
        let k = 0;
        const f = () => (++k >= n ? r() : requestAnimationFrame(f));
        requestAnimationFrame(f);
      }),
    n,
  );
/** `ts` (seconds since the epoch) sets the event's own timestamp. */
const touch = (type, pts, ts) =>
  cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: pts.map(([id, x, y]) => ({ id, x, y, radiusX: 10, radiusY: 10, force: 1 })),
    ...(ts ? { timestamp: ts } : {}),
  });
const lerp = (a, b, t) => a + (b - a) * t;

// A 60 ms tap. The two events carry their own timestamps: the game times taps from them, and a slow
// software-rendered frame between the two must not turn the tap into a long press.
async function tapAt(x, y) {
  const t = Date.now() / 1000;
  await touch('touchStart', [[1, x, y]], t);
  await sleep(60);
  await touch('touchEnd', [], t + 0.06);
  await frames(1);
}

/** What the topmost element at a point is (for "is this covered?" checks). */
const hitAt = (x, y) =>
  page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return 'none';
      if (el.id === 'world') return 'world';
      return (el.className && typeof el.className === 'string' ? el.className : el.tagName).slice(0, 60);
    },
    [x, y],
  );

/** Centre of the first visible element matching sel (and containing text), or null. */
const findEl = (sel, text) =>
  page.evaluate(
    ([sel, text]) => {
      for (const el of document.querySelectorAll(sel)) {
        if (text && !(el.textContent || '').includes(text) && el.getAttribute('aria-label') !== text) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue;
        if (el.closest('[hidden]')) continue;
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const top = document.elementFromPoint(x, y);
        return { x, y, w: r.width, h: r.height, covered: !(top && (el === top || el.contains(top))), by: top ? String(top.className || top.tagName) : '' };
      }
      return null;
    },
    [sel, text ?? null],
  );

async function waitEl(sel, text, timeout = 15000) {
  const t0 = Date.now();
  for (;;) {
    const r = await findEl(sel, text);
    if (r && !r.covered) return r;
    if (Date.now() - t0 > timeout) return r;
    await sleep(150);
  }
}

/** Tap an interface element like a finger would. */
async function tap(sel, text, what = `${sel}${text ? ` "${text}"` : ''}`) {
  let r = await waitEl(sel, text);
  if (r && r.covered && /tip/.test(r.by)) {
    await dismissTip();
    r = await waitEl(sel, text);
  }
  // A milestone card can pop up between two steps and cover everything: close it like a player would.
  if (r && r.covered && !sel.startsWith('.celebrate') && (await findEl('.celebrate .pbtn', 'Keep building'))) {
    await handleMilestone();
    r = await waitEl(sel, text);
  }
  if (!r) throw new Error(`could not find ${what}`);
  if (r.covered) throw new Error(`${what} is covered by ${r.by}`);
  if (r.x < SAFE.left || r.x > W - SAFE.right || r.y > H - SAFE.bottom) throw new Error(`${what} sits in a safe-area inset at ${r.x},${r.y}`);
  await tapAt(r.x, r.y);
}

async function dismissTip() {
  const r = await findEl('.tip .pbtn', 'Got it');
  if (r && !r.covered) {
    await tapAt(r.x, r.y);
    await sleep(300);
    return true;
  }
  return false;
}

// ------------------------------------------------------------------------------------------------
// The game through window.cubopolis (read-only)
// ------------------------------------------------------------------------------------------------

const G = (fn, arg) => page.evaluate(fn, arg);
const screenOf = (x, z) => G(([x, z]) => window.cubopolis.tileToScreen(x, z), [x, z]);
const cityInfo = () =>
  G(() => {
    const s = window.cubopolis.state;
    const T = s.tiles;
    const levels = [0, 0, 0, 0];
    let roads = 0;
    let lots = 0;
    for (let i = 0; i < T.kind.length; i++) {
      if (T.kind[i] === 1) roads++;
      if (T.kind[i] === 2) {
        lots++;
        levels[T.level[i]]++;
      }
    }
    return {
      day: s.day,
      money: s.money,
      pop: s.stats.population,
      speed: s.speed,
      roads,
      lots,
      levels,
      buildings: s.buildings.filter(Boolean).map((b) => b.type),
      timeOfDay: s.timeOfDay,
      milestone: s.milestone,
    };
  });
/** A fingerprint of everything the player built, to compare after a reload. */
const fingerprint = () =>
  G(() => {
    const s = window.cubopolis.state;
    const T = s.tiles;
    let h = 2166136261;
    for (const layer of [T.terrain, T.trees, T.kind, T.zone, T.level, T.variant]) {
      for (let i = 0; i < layer.length; i++) h = Math.imul(h ^ layer[i], 16777619) >>> 0;
    }
    return { name: s.name, day: s.day, money: s.money, pop: s.stats.population, buildings: s.buildings.filter(Boolean).length, hash: h };
  });

/**
 * One round trip to the page (each costs a frame in SwiftShader): where the tiles are on screen,
 * what the interface covers right now (HUD, dock, chip, tips, cards, with a margin), and whether
 * the map itself is the topmost thing under each tile.
 */
const probe = (tiles) =>
  G((tiles) => {
    const obs = [];
    for (const el of document.querySelectorAll('#ui .panel, #ui .dock-row, #ui .chip, #ui .pill, #ui .tip, #ui .toasts > *, .boot-banner')) {
      if (el.closest('[hidden]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      obs.push({ x0: r.left - 14, y0: r.top - 14, x1: r.right + 14, y1: r.bottom + 14 });
    }
    const pts = tiles.map(([x, z]) => {
      const p = window.cubopolis.tileToScreen(x, z);
      const el = p.inFront ? document.elementFromPoint(p.x, p.y) : null;
      return { ...p, world: !!el && el.id === 'world' };
    });
    return { obs, pts };
  }, tiles);
/** Edge auto-pan zone and a little extra stay clear too. */
const EDGE = { x0: 70, x1: W - 70, y0: 56, y1: H - 40 };
function freeAt(p, obs) {
  if (!p.inFront || p.x < EDGE.x0 || p.x > EDGE.x1 || p.y < EDGE.y0 || p.y > EDGE.y1) return false;
  if (p.world === false) return false;
  return !obs.some((o) => p.x >= o.x0 && p.x <= o.x1 && p.y >= o.y0 && p.y <= o.y1);
}
/** Centre of the biggest clear band of the screen (between the HUD and whatever sits on the dock). */
function freeCentre(obs) {
  let top = EDGE.y0;
  let bottom = EDGE.y1;
  for (const o of obs) {
    if (o.x1 < W * 0.25 || o.x0 > W * 0.75) continue; // side panels do not limit the band
    if (o.y1 < H / 2) top = Math.max(top, o.y1);
    else bottom = Math.min(bottom, o.y0);
  }
  return { x: W / 2, y: (top + bottom) / 2 };
}

/** One-finger drag along a straight line (Look tool: pans the map, the ground stays under the finger). */
async function fingerDrag(x0, y0, x1, y1, steps = 8) {
  await touch('touchStart', [[1, x0, y0]]);
  await frames(1);
  for (let s = 1; s <= steps; s++) await touch('touchMove', [[1, lerp(x0, x1, s / steps), lerp(y0, y1, s / steps)]]);
  await frames(1);
  await sleep(150); // hold still before lifting: no fling
  await touch('touchEnd', []);
  await frames(2);
}

/** Pan (Look tool) so that tile (x, z) moves to screen point (sx, sy). */
async function panTile(x, z, sx = W / 2, sy = H / 2 - 8) {
  const { obs, pts } = await probe([[x, z]]);
  const p = pts[0];
  // Grab the ground somewhere clear (the tile itself if it is), and move it by the tile's offset.
  let from = { x: Math.min(W - 140, Math.max(140, p.x)), y: Math.min(H - 110, Math.max(90, p.y)) };
  if (!freeAt({ ...from, inFront: true }, obs)) from = freeCentre(obs);
  const dx = sx - p.x;
  const dy = sy - p.y;
  // Long moves go in a few strokes so the finger stays on the map.
  const strokes = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 200));
  for (let k = 0; k < strokes; k++) await fingerDrag(from.x, from.y, from.x + dx / strokes, from.y + dy / strokes);
}

/** Make sure every given tile is on screen and clear of the interface: dismiss tips, pan (in Look mode). */
async function ensureVisible(tiles, tool = null) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { obs, pts } = await probe(tiles);
    if (pts.every((p) => freeAt(p, obs))) return true;
    if (await dismissTip()) continue;
    await selectTool('inspect');
    // with the Look tool the chip is gone: measure the free band again, leaving room for the chip
    const again = await probe([]);
    const c = freeCentre(again.obs);
    const cx = tiles.reduce((a, t) => a + t[0], 0) / tiles.length;
    const cz = tiles.reduce((a, t) => a + t[1], 0) / tiles.length;
    await panTile(Math.round(cx), Math.round(cz), c.x, c.y - (tool && tool !== 'inspect' ? 40 : 0));
    if (tool) await selectTool(tool);
  }
  const { obs, pts } = await probe(tiles);
  return pts.every((p) => freeAt(p, obs));
}

/** Current tool, and picking tools through the dock like a player. */
const currentTool = () => G(() => window.cubopolis.tool);
const TOOL_PATH = {
  inspect: ['Look'],
  road: ['Roads'],
  bulldoze: ['Bulldoze'],
  zone_res: ['Zones', 'Homes'],
  zone_com: ['Zones', 'Shops'],
  zone_ind: ['Zones', 'Industry'],
  'build:power_coal': ['Utilities', 'Coal Power Plant'],
  'build:water_tower': ['Utilities', 'Water Tower'],
  'build:park_small': ['Parks', 'Small Park'],
  'build:police': ['Services', 'Police Station'],
  'build:fire': ['Services', 'Fire Station'],
  'build:school': ['Services', 'School'],
  'build:clinic': ['Services', 'Clinic'],
};
async function selectTool(tool) {
  if ((await currentTool()) === tool) return;
  const [cat, card] = TOOL_PATH[tool];
  await tap('.dock-btn', cat, `dock "${cat}"`);
  if (card) await tap('.tray .card', card, `card "${card}"`);
  const now = await currentTool();
  if (now !== tool) throw new Error(`picking ${tool} through the dock left the tool at ${now}`);
}

/** Drag a finger from tile a to tile b with the current tool (road / zone). */
async function dragTiles(a, b) {
  const { pts } = await probe([a, b]);
  const [p0, p1] = pts;
  for (const p of pts) if (!p.world) throw new Error(`map point ${Math.round(p.x)},${Math.round(p.y)} is covered`);
  const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const steps = Math.max(5, Math.round(dist / 18));
  await touch('touchStart', [[1, p0.x, p0.y]]);
  await frames(1);
  for (let s = 1; s <= steps; s++) {
    await touch('touchMove', [[1, lerp(p0.x, p1.x, s / steps), lerp(p0.y, p1.y, s / steps)]]);
    if (s % 3 === 0) await frames(1);
  }
  await frames(1);
  await touch('touchEnd', []);
  await frames(1);
}

/** Tap a map tile with the current tool (buildings place on lift). */
async function tapTile(x, z) {
  const { pts } = await probe([[x, z]]);
  const p = pts[0];
  if (!p.world) throw new Error(`tile ${x},${z} on screen is covered`);
  await tapAt(p.x, p.y);
}

/** Use a tool on the map the way a player would, and check that it took effect. */
async function build(tool, label, fn, tiles) {
  await selectTool(tool);
  if (!(await ensureVisible(tiles, tool))) throw new Error(`could not bring ${label} on screen, clear of the interface`);
  const before = await cityInfo();
  await fn();
  const after = await cityInfo();
  const ok = after.money < before.money;
  const why = ok ? '' : ` — ${await G(() => [...document.querySelectorAll('.toasts > *')].map((t) => t.textContent).join(' | '))}`;
  check(`${label}`, ok, `money ${before.money} -> ${after.money}${why}`);
  return ok;
}

/** Graphics quality through Menu → Graphics, like a player. */
async function setQuality(label) {
  await tap('.tool-btn', 'Menu');
  await sleep(400);
  await tap('.seg-btn', label);
  await sleep(200);
  await tap('.sh-close', undefined, 'menu close');
  await sleep(300);
}

async function twoFingerPinch(cx, cy, r0, r1, steps = 14) {
  await touch('touchStart', [
    [1, cx - r0, cy],
    [2, cx + r0, cy],
  ]);
  await frames(1);
  for (let s = 1; s <= steps; s++) {
    const r = lerp(r0, r1, s / steps);
    await touch('touchMove', [
      [1, cx - r, cy + s * 0.3],
      [2, cx + r, cy - s * 0.3],
    ]);
    if (s % 2 === 0) await frames(1);
  }
  await sleep(150);
  await touch('touchEnd', []);
  await frames(3);
}

/** Every visible control must stay out of the safe-area insets. */
async function checkSafeAreas(step) {
  const bad = await G(
    ([W, H, S]) => {
      const out = [];
      for (const el of document.querySelectorAll('#ui button, #ui input, #ui textarea, #ui .panel, .boot-banner button')) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || el.closest('[hidden]')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
        if (r.right <= 0 || r.left >= W || r.bottom <= 0 || r.top >= H) continue;
        if (r.left < S.left - 0.5 || r.right > W - S.right + 0.5 || r.bottom > H - S.bottom + 0.5) {
          out.push(`${String(el.className).slice(0, 40)} @${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      return out;
    },
    [W, H, SAFE],
  );
  check(`no controls inside the safe areas (${step})`, bad.length === 0, bad.slice(0, 4).join('; '));
}

/** Close the milestone card if it is up (and take one picture of the first one). */
let milestoneShot = false;
async function handleMilestone() {
  const r = await findEl('.celebrate .pbtn', 'Keep building');
  if (!r) return false;
  await sleep(900); // let the card finish animating in
  if (!milestoneShot) {
    milestoneShot = true;
    await shot('milestone');
  }
  await tap('.celebrate .pbtn', 'Keep building');
  await sleep(400);
  return true;
}

// ------------------------------------------------------------------------------------------------
// The run
// ------------------------------------------------------------------------------------------------

let failed = false;
try {
  console.log('== boot');
  await page.goto(`http://localhost:${PORT}/?safe=${SAFE.left},${SAFE.right},${SAFE.bottom}`);
  const t0 = Date.now();
  while (bootOks === 0 && Date.now() - t0 < 60000) await sleep(100);
  check('CUBOPOLIS_BOOT_OK logged', bootOks === 1, `${bootOks} times, ${Date.now() - t0} ms`);
  await waitEl('.title-btns .pbtn', 'New City');
  await sleep(1500);
  await shot('title');
  await checkSafeAreas('title');

  console.log('== new city');
  await tap('.title-btns .pbtn', 'New City');
  await sleep(1500);
  await shot('new-city');
  await checkSafeAreas('new city');
  await tap('.newcity .pbtn', 'Start building');
  await sleep(800);
  check('a city is being played', await G(() => window.cubopolis.playing));
  const start = await cityInfo();
  check('new city starts empty with money', start.roads === 0 && start.money > 0, JSON.stringify({ money: start.money, roads: start.roads }));
  await shot('city-start');
  await checkSafeAreas('in game');

  // Pause while building, like a careful player.
  await tap('.speed-btn', 'Pause');
  // SwiftShader draws a frame in ~0.6 s at High: build and grow at Low (also checks the live switch),
  // and go back to High for the close-ups.
  await setQuality('Low');
  check('graphics switched to Low through the menu', (await G(() => JSON.parse(localStorage.getItem('cubopolis:settings')).quality)) === 'low');

  console.log('== roads');
  const ROADS = [
    [[25, 28], [39, 28]],
    [[25, 34], [39, 34]],
    [[25, 25], [25, 39]],
    [[39, 25], [39, 39]],
    [[32, 29], [32, 33]],
  ];
  for (const [a, b] of ROADS) {
    await build('road', `road ${a} -> ${b}`, () => dragTiles(a, b), [a, b]);
  }
  const afterRoads = await cityInfo();
  check('road grid laid', afterRoads.roads >= 61, `${afterRoads.roads} road tiles`);
  await shot('roads');

  console.log('== zones');
  const ZONES = [
    ['zone_res', [26, 25], [31, 27]],
    ['zone_res', [33, 25], [38, 27]],
    ['zone_com', [26, 29], [31, 30]],
    ['zone_ind', [33, 31], [38, 33]],
  ];
  for (const [tool, a, b] of ZONES) {
    await build(tool, `${tool} ${a} -> ${b}`, () => dragTiles(a, b), [a, b]);
  }
  await shot('zones');

  console.log('== utilities');
  await build('build:power_coal', 'coal power plant', () => tapTile(32, 36), [[31, 35], [33, 37]]);
  await build('build:water_tower', 'water tower 1', () => tapTile(31, 32), [[31, 32]]);
  await build('build:water_tower', 'water tower 2', () => tapTile(33, 29), [[33, 29]]);
  await build('build:park_small', 'park', () => tapTile(28, 31), [[28, 31]]);
  await build('build:park_small', 'park', () => tapTile(30, 31), [[30, 31]]);
  await build('build:park_small', 'park', () => tapTile(35, 24), [[35, 24]]);
  const placed = await cityInfo();
  console.log('      buildings: ' + (await G(() => window.cubopolis.state.buildings.filter(Boolean).map((b) => `${b.type}@${b.x},${b.z}`).join(' '))));
  check('coal plant and water towers placed', placed.buildings.includes('power_coal') && placed.buildings.filter((b) => b === 'water_tower').length === 2, placed.buildings.join(','));
  await shot('utilities');

  // A two-finger pinch to take a closer look at the new neighbourhood.
  await selectTool('inspect');
  await panTile(32, 31, W / 2, H / 2 - 20);
  const v0 = await G(() => window.cubopolis.view());
  await twoFingerPinch(W / 2, H / 2, 70, 120);
  const v1 = await G(() => window.cubopolis.view());
  check('two-finger pinch zooms in', v1.distance < v0.distance * 0.85, `${v0.distance.toFixed(1)} -> ${v1.distance.toFixed(1)}`);
  await shot('pinch-zoom');
  await twoFingerPinch(W / 2, H / 2, 120, 80);

  console.log('== grow');
  await tap('.speed-btn', 'Fastest');
  const tGrow = Date.now();
  let services1 = false;
  let services2 = false;
  let moneyAdded = 0;
  let lastLog = 0;
  let growShot = false;
  for (;;) {
    await sleep(1500);
    if (await handleMilestone()) continue;
    await dismissTip();
    const c = await cityInfo();
    if (Date.now() - lastLog > 10000) {
      lastLog = Date.now();
      console.log(`      day ${c.day}  pop ${c.pop}  $${c.money}  levels ${c.levels.join('/')}  ${Math.round((Date.now() - tGrow) / 1000)} s`);
    }
    if (c.speed !== 3) await tap('.speed-btn', 'Fastest');
    if (!services1 && c.pop >= 150) {
      services1 = true;
      await tap('.speed-btn', 'Pause');
      if (c.money < 4000) {
        moneyAdded += 4000;
        await G(() => (window.cubopolis.state.money += 4000));
        note('added $4,000 through the page before placing police and fire (the run would otherwise stall)');
      }
      await build('build:police', 'police station', () => tapTile(26, 32), [[26, 32], [27, 33]]);
      await build('build:fire', 'fire station', () => tapTile(29, 32), [[29, 32], [30, 33]]);
      await selectTool('inspect');
      await tap('.speed-btn', 'Fastest');
    }
    if (!services2 && c.pop >= 400) {
      services2 = true;
      await tap('.speed-btn', 'Pause');
      if (c.money < 5500) {
        moneyAdded += 5500;
        await G(() => (window.cubopolis.state.money += 5500));
        note('added $5,500 through the page before placing a school and a clinic (the run would otherwise stall)');
      }
      await build('build:school', 'school', () => tapTile(26, 35), [[26, 35], [27, 36]]);
      await build('build:clinic', 'clinic', () => tapTile(35, 35), [[35, 35], [36, 36]]);
      await selectTool('inspect');
      await tap('.speed-btn', 'Fastest');
    }
    if (!growShot && c.levels[1] >= 10) {
      growShot = true;
      await shot('growing');
    }
    const elapsed = Date.now() - tGrow;
    if (c.levels[3] >= 2 && elapsed > 60000) break;
    if (elapsed > GROW_BUDGET_MS) break;
  }
  const grown = await cityInfo();
  console.log(`      grown: day ${grown.day}, pop ${grown.pop}, levels ${grown.levels.join('/')}, $${grown.money}`);
  check('lots grew to level 2', grown.levels[2] + grown.levels[3] >= 5, `L1 ${grown.levels[1]}, L2 ${grown.levels[2]}, L3 ${grown.levels[3]}`);
  check('some lots reached level 3', grown.levels[3] >= 1, `L3 ${grown.levels[3]}`);
  check('the city did not go broke', grown.money > -2000, `$${grown.money}${moneyAdded ? `, $${moneyAdded} added` : ''}`);
  await tap('.speed-btn', 'Pause');
  await handleMilestone();
  await setQuality('High');
  check('graphics back to High', (await G(() => JSON.parse(localStorage.getItem('cubopolis:settings')).quality)) === 'high');
  await shot('city-grown');

  // Closer look at the tallest buildings.
  const tall = await G(() => {
    const s = window.cubopolis.state;
    let best = -1;
    for (let i = 0; i < s.tiles.kind.length; i++) if (s.tiles.kind[i] === 2 && (best < 0 || s.tiles.level[i] > s.tiles.level[best])) best = i;
    return best < 0 ? null : { x: best % s.size, z: Math.floor(best / s.size), level: s.tiles.level[best] };
  });
  await ensureVisible([[tall.x, tall.z]]);
  await panTile(tall.x, tall.z);
  await twoFingerPinch(W / 2, H / 2, 60, 130);
  await shot('city-close');

  console.log('== inspect');
  await selectTool('inspect');
  await ensureVisible([[tall.x, tall.z]]);
  await tapTile(tall.x, tall.z);
  await sleep(700);
  const insp = await findEl('.inspect');
  check('inspect card opens on a tap', !!insp, insp ? '' : 'no card');
  const inspTitle = await G(() => document.querySelector('.inspect h3')?.textContent ?? '');
  check('inspect card names the building', /Cottage|Apartments|Tower|Shop|Office|Workshop|Factory|Industr|Homes/i.test(inspTitle), inspTitle);
  await shot('inspect');
  await checkSafeAreas('inspect');
  await tap('.inspect .round', undefined, 'inspect close');
  await sleep(300);
  check('inspect card closes', !(await findEl('.inspect')));
  await twoFingerPinch(W / 2, H / 2, 120, 70);

  console.log('== budget');
  await tap('.tool-btn', 'Budget');
  await sleep(700);
  check('budget opens', !!(await findEl('.budget')));
  await shot('budget');
  await checkSafeAreas('budget');
  await page.keyboard.press('Escape');
  await sleep(500);
  check('Escape closes the budget', !(await findEl('.budget')));

  console.log('== layers');
  await tap('.tool-btn', 'Map layers');
  await sleep(500);
  await shot('layers-picker');
  await tap('.layer-opt', 'Power');
  await sleep(800);
  await shot('overlay-power');
  await tap('.tool-btn', 'Map layers');
  await sleep(400);
  await tap('.layer-opt', 'Pollution');
  await sleep(800);
  await shot('overlay-pollution');
  await checkSafeAreas('overlay');
  await tap('.tool-btn', 'Map layers');
  await sleep(400);
  await tap('.layer-opt', 'Off');
  await sleep(400);

  console.log('== settings');
  await tap('.tool-btn', 'Menu');
  await sleep(700);
  await shot('settings');
  await checkSafeAreas('settings');
  await tap('.sh-close', undefined, 'menu close');
  await sleep(400);

  console.log('== night');
  await tap('.speed-btn', 'Fastest');
  const tNight = Date.now();
  for (;;) {
    await sleep(1000);
    await handleMilestone();
    const tod = await G(() => window.cubopolis.state.timeOfDay);
    const sun = Math.sin((tod - 0.25) * Math.PI * 2);
    const night = Math.min(1, Math.max(0, (0.15 - sun) / 0.4));
    if (night >= 0.95) break;
    if (Date.now() - tNight > 240000) break;
  }
  await tap('.speed-btn', 'Pause');
  const tod = await G(() => window.cubopolis.state.timeOfDay);
  check('the clock reached night', tod > 0.8 || tod < 0.2, `timeOfDay ${tod.toFixed(2)}`);
  await sleep(500);
  await shot('night');
  await twoFingerPinch(W / 2, H / 2, 60, 120);
  await shot('night-close');

  console.log('== save, reload, continue');
  await tap('.tool-btn', 'Menu');
  await sleep(600);
  await tap('.set-action', 'Save now');
  await sleep(800);
  const savedToast = await G(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' | '));
  check('Save now confirms', /City saved/.test(savedToast), savedToast);
  await tap('.sh-close', undefined, 'menu close');
  const before = await fingerprint();
  await sleep(500);
  const bootsBefore = bootOks;
  await page.reload();
  const t1 = Date.now();
  while (bootOks === bootsBefore && Date.now() - t1 < 60000) await sleep(100);
  check('CUBOPOLIS_BOOT_OK logged once after reload', bootOks === bootsBefore + 1);
  const cont = await waitEl('.title-btns .pbtn', 'Continue', 20000);
  check('title offers Continue', !!cont && !cont.covered);
  await sleep(1200);
  await shot('title-with-save');
  await tap('.title-btns .pbtn', 'Continue');
  await sleep(1500);
  const after = await fingerprint();
  check(
    'Continue restores the city',
    after.hash === before.hash && after.day === before.day && after.money === before.money && after.buildings === before.buildings && after.name === before.name,
    `before ${JSON.stringify(before)} after ${JSON.stringify(after)}`,
  );
  check('restored population matches', after.pop === before.pop, `${before.pop} vs ${after.pop}`);
  await shot('continued');
  await checkSafeAreas('continued');
} catch (err) {
  failed = true;
  console.error('SMOKE RUN FAILED:', err);
  try {
    await shot('failure');
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------------------------------------------
// Verdict
// ------------------------------------------------------------------------------------------------

await browser.close();
server.close();

check('CUBOPOLIS_BOOT_OK appeared', bootOks > 0, `${bootOks}`);
check('no console errors, warnings or page errors', problems.length === 0, problems.slice(0, 12).join('\n      '));
if (noise.length) console.log(`(ignored ${noise.length} headless SwiftShader "GL Driver Message (Performance)" warnings; any WebGL page prints them here)`);
const fails = results.filter((r) => !r.ok);
console.log('');
console.log(`Screenshots (${readdirSync(out).filter((f) => f.endsWith('.png')).length}) in ${out}`);
for (const n of notes) console.log(`note: ${n}`);
console.log(failed || fails.length ? `SMOKE FAILED: ${fails.length} failed checks${failed ? ' and the run stopped early' : ''}` : `SMOKE PASSED: ${results.length} checks`);
process.exit(failed || fails.length ? 1 : 0);
