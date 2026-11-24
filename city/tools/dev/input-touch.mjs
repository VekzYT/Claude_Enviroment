// Drives the input harness (src/dev/input-harness.ts) in headless Chromium emulating an iPhone 15 Pro
// in landscape, with REAL multi-touch sent through the DevTools protocol, checks what each gesture
// did to the camera and the fake game, and saves screenshots to .cache/input/.
//   node tools/dev/input-touch.mjs            (exit code 1 if any check fails)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, '.cache', 'input');
mkdirSync(out, { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'src/dev/input-harness.ts')],
  bundle: true,
  format: 'iife',
  target: ['safari15'],
  outfile: join(out, 'harness.js'),
  logLevel: 'warning',
});
writeFileSync(
  join(out, 'harness.html'),
  `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}canvas{display:block;width:100vw;height:100vh}</style></head>
<body><canvas id="world"></canvas><div id="ui"></div><script src="harness.js"></script></body></html>`,
);

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const pageLog = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') pageLog.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => pageLog.push(`[pageerror] ${e.message}`));
await page.goto(`file://${join(out, 'harness.html')}`);
await page.waitForFunction(() => window.__input && window.__input.ready && window.__input.frames() > 2, null, { timeout: 60000 });
const cdp = await context.newCDPSession(page);

// ---------- helpers ----------
const N = 64;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const H = (fn, arg) => page.evaluate(fn, arg);
/** Send a touch event; `ts` (seconds since the epoch) sets the event's timestamp, so a flick can be
 * timed like a real one even though SwiftShader renders only a few frames a second here. */
const touch = (type, pts, ts) =>
  cdp.send('Input.dispatchTouchEvent', {
    type,
    ...(ts ? { timestamp: ts } : {}),
    touchPoints: pts.map(([id, x, y]) => ({ id, x, y, radiusX: 12, radiusY: 12, force: 1 })),
  });
const lerp = (a, b, t) => a + (b - a) * t;
/** Move fingers [[id, x0, y0, x1, y1], ...] in steps, a frame per step. */
async function slide(paths, steps = 12, pause = 0) {
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    await touch('touchMove', paths.map(([id, x0, y0, x1, y1]) => [id, lerp(x0, x1, t), lerp(y0, y1, t)]));
    await frame();
    if (pause) await sleep(pause);
  }
}
const view = () => H(() => window.__input.view());
const ground = (x, y) => H(([x, y]) => window.__input.groundAt(x, y), [x, y]);
const pick = (x, y) => H(([x, y]) => window.__input.pick(x, y), [x, y]);
const events = () => H(() => JSON.parse(JSON.stringify(window.__input.events)));
const setTool = (t) => H((t) => window.__input.setTool(t), t);
async function resetView() {
  await H(() => {
    window.__input.resetView();
    window.__input.resetEvents();
  });
  await frame();
}
const shot = async (name) => {
  await frame();
  await page.screenshot({ path: join(out, `${name}.png`) });
};
const d2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function lPath(a, b) {
  const out = [];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const sx = Math.sign(dx);
  const sz = Math.sign(dz);
  if (Math.abs(dx) >= Math.abs(dz)) {
    for (let x = a.x; ; x += sx) {
      out.push(a.z * N + x);
      if (x === b.x) break;
    }
    if (sz) for (let z = a.z + sz; ; z += sz) {
      out.push(z * N + b.x);
      if (z === b.z) break;
    }
  } else {
    for (let z = a.z; ; z += sz) {
      out.push(z * N + a.x);
      if (z === b.z) break;
    }
    if (sx) for (let x = a.x + sx; ; x += sx) {
      out.push(b.z * N + x);
      if (x === b.x) break;
    }
  }
  return out;
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

await shot('01-start');

// ---------- 1. one-finger pan in inspect mode ----------
{
  await resetView();
  const g0 = await ground(420, 220);
  await touch('touchStart', [[1, 420, 220]]);
  await slide([[1, 420, 220, 300, 150]]);
  await sleep(200); // rest before lifting, so no fling
  await frame();
  await shot('02-pan-held');
  const g1 = await ground(300, 150);
  check('one-finger pan keeps the grabbed ground under the finger', d2(g0, g1) < 0.05, `drift ${d2(g0, g1).toFixed(4)} tiles`);
  await touch('touchEnd', []);
  await frame();
  const v0 = await view();
  await sleep(300);
  await frame();
  const v1 = await view();
  check('a resting release does not coast', Math.hypot(v1.tx - v0.tx, v1.tz - v0.tz) < 1e-6);
  const ev = await events();
  check('a pan is not a tap', ev.inspected.length === 0);
}

// ---------- 2. tap to inspect ----------
{
  const expected = await pick(500, 260);
  // an 80 ms tap (timestamped: a slow software-rendered frame must not make it look like a press)
  const t0 = Date.now() / 1000;
  await touch('touchStart', [[2, 500, 260]], t0);
  await touch('touchEnd', [], t0 + 0.08);
  await frame();
  const ev = await events();
  const got = ev.inspected[ev.inspected.length - 1];
  check('tap inspects the tile under the finger', !!got && got.x === expected.x && got.z === expected.z, `${JSON.stringify(got)} vs ${JSON.stringify(expected)}`);
  await shot('03-tap-inspect');
}

// ---------- 3. road drag: L-shaped plan, applied on release ----------
{
  await resetView();
  await setTool('road');
  const a = await pick(250, 280);
  const b = await pick(600, 140);
  await touch('touchStart', [[3, 250, 280]]);
  await frame();
  await slide([[3, 250, 280, 600, 140]], 24);
  let ev = await events();
  const want = lPath(a, b);
  const shown = ev.lastPreview?.tiles ?? [];
  check('road drag previews the L from start to finger', JSON.stringify(shown) === JSON.stringify(want), `${shown.length} tiles, corner at ${want.length ? JSON.stringify([(want[Math.abs(b.x - a.x)] % N), Math.floor(want[Math.abs(b.x - a.x)] / N)]) : '-'}`);
  check('plan recomputed only on tile changes', ev.plans <= 25, `${ev.plans} plans for 24 moves`);
  await shot('04-road-drag-held');
  await touch('touchEnd', []);
  await frame();
  ev = await events();
  check('release applies the plan', ev.applied.length === 1 && JSON.stringify(ev.applied[0].tiles) === JSON.stringify(want));
  check('release clears the preview', ev.lastPreview === null);
  // a quick tap with a drag tool applies one tile
  const t = await pick(420, 300);
  await touch('touchStart', [[3, 420, 300]]);
  await touch('touchEnd', []);
  await frame();
  ev = await events();
  check('a tap with the road tool lays one tile', ev.applied.length === 2 && ev.applied[1].tiles.length === 1 && ev.applied[1].tiles[0] === t.z * N + t.x);
  await shot('05-road-applied');
}

// ---------- 4. pinch zoom about the midpoint ----------
{
  await resetView();
  await setTool('inspect');
  const v0 = await view();
  const gm = await ground(426, 196);
  await touch('touchStart', [[4, 346, 196]]);
  await touch('touchStart', [[4, 346, 196], [5, 506, 196]]);
  await frame();
  await slide([
    [4, 346, 196, 246, 196],
    [5, 506, 196, 606, 196],
  ]);
  await shot('06-pinch-held');
  const v1 = await view();
  const expectD = v0.distance / (360 / 160);
  check('pinch apart zooms in by the spread ratio', Math.abs(v1.distance - expectD) / expectD < 0.03, `distance ${v0.distance.toFixed(1)} -> ${v1.distance.toFixed(1)}, expected ${expectD.toFixed(1)}`);
  const gm1 = await ground(426, 196);
  check('pinch keeps the ground under the midpoint', d2(gm, gm1) < 0.1, `drift ${d2(gm, gm1).toFixed(4)}`);
  check('a pinch does not rotate', Math.abs(v1.yaw - v0.yaw) < 1e-6);
  await touch('touchEnd', []);
  await frame();
}

// ---------- 5. twist rotate ----------
{
  await resetView();
  const v0 = await view();
  const gm = await ground(426, 196);
  const r = 150;
  await touch('touchStart', [[6, 426 - r, 196]]);
  await touch('touchStart', [[6, 426 - r, 196], [7, 426 + r, 196]]);
  await frame();
  const steps = 15;
  for (let s = 1; s <= steps; s++) {
    const ang = (Math.PI / 4) * (s / steps); // 45 degrees clockwise on screen
    await touch('touchMove', [
      [6, 426 - Math.cos(ang) * r, 196 - Math.sin(ang) * r],
      [7, 426 + Math.cos(ang) * r, 196 + Math.sin(ang) * r],
    ]);
    await frame();
  }
  await shot('07-twist-held');
  const v1 = await view();
  const turned = v1.yaw - v0.yaw;
  check('twisting two fingers rotates the view the same way', turned > 0.55 && turned < 0.8, `yaw +${((turned * 180) / Math.PI).toFixed(1)} deg for a 45 deg twist`);
  const gm1 = await ground(426, 196);
  check('rotation pivots on the fingers', d2(gm, gm1) < 0.1, `drift ${d2(gm, gm1).toFixed(4)}`);
  check('a twist does not zoom', Math.abs(v1.distance - v0.distance) / v0.distance < 0.02);
  await touch('touchEnd', []);
  await frame();
}

// ---------- 6. tilt with two fingers sliding up ----------
{
  await resetView();
  const v0 = await view();
  await touch('touchStart', [[8, 330, 260]]);
  await touch('touchStart', [[8, 330, 260], [9, 530, 260]]);
  await frame();
  await slide([
    [8, 330, 260, 331, 170],
    [9, 530, 260, 528, 170],
  ]);
  await shot('08-tilt-held');
  const v1 = await view();
  check('two fingers sliding up tilt toward the horizon', v1.pitch < v0.pitch - 0.3, `pitch ${v0.pitch.toFixed(2)} -> ${v1.pitch.toFixed(2)}`);
  check('tilting does not pan', Math.hypot(v1.tx - v0.tx, v1.tz - v0.tz) < 1e-6);
  await touch('touchEnd', []);
  await frame();
}

// ---------- 7. a second finger cancels a plan ----------
{
  await resetView();
  await setTool('zone_res');
  await touch('touchStart', [[10, 300, 220]]);
  await frame();
  await slide([[10, 300, 220, 400, 270]], 8);
  let ev = await events();
  check('a one-finger zone drag shows a rectangle plan', !!ev.lastPreview && ev.lastPreview.tiles.length > 4, `${ev.lastPreview?.tiles.length} tiles`);
  await shot('09-zone-plan-held');
  const v0 = await view();
  await touch('touchStart', [[10, 400, 270], [11, 600, 220]]);
  await frame();
  ev = await events();
  check('the second finger clears the preview', ev.lastPreview === null);
  const plans = ev.plans;
  await slide([
    [10, 400, 270, 340, 250],
    [11, 600, 220, 540, 200],
  ]);
  const v1 = await view();
  check('the two fingers then move the camera', Math.hypot(v1.tx - v0.tx, v1.tz - v0.tz) > 0.5);
  // lift one finger, keep sliding the other: still camera-only
  await touch('touchEnd', [[11, 540, 200]]);
  await frame();
  await slide([[10, 340, 250, 300, 300]], 6);
  await touch('touchEnd', []);
  await frame();
  ev = await events();
  check('nothing is planned or applied after the cancel', ev.plans === plans && ev.applied.length === 0, `plans ${plans} -> ${ev.plans}, applied ${ev.applied.length}`);
  await shot('10-after-cancel');
}

// ---------- 8. fling ----------
{
  await resetView();
  await setTool('inspect');
  // 30 px every 16 ms (about 1900 px/s), then lift
  const t0 = Date.now() / 1000;
  await touch('touchStart', [[12, 640, 200]], t0);
  for (let s = 1; s <= 8; s++) await touch('touchMove', [[12, 640 - s * 30, 200 + s * 4]], t0 + s * 0.016);
  await touch('touchEnd', [], t0 + 9 * 0.016);
  const vRel = await view();
  await sleep(150);
  await frame();
  const vA = await view();
  const coast = Math.hypot(vA.tx - vRel.tx, vA.tz - vRel.tz);
  check('a flick keeps the map coasting after release', coast > 0.5, `coasted ${coast.toFixed(2)} tiles in 150 ms`);
  await sleep(2500);
  await frame();
  const vB = await view();
  await sleep(300);
  await frame();
  const vC = await view();
  check('the coast comes to rest', Math.hypot(vC.tx - vB.tx, vC.tz - vB.tz) < 1e-3);
}

// ---------- 9. auto-pan at the screen edge while planning ----------
{
  await resetView();
  await setTool('road');
  await touch('touchStart', [[13, 420, 230]]);
  await frame();
  await slide([[13, 420, 230, 842, 230]], 16);
  let ev = await events();
  const before = ev.lastPreview.tiles.length;
  const v0 = await view();
  await sleep(1000);
  await frame();
  const v1 = await view();
  ev = await events();
  check('holding a plan at the edge auto-pans', Math.hypot(v1.tx - v0.tx, v1.tz - v0.tz) > 3, `camera moved ${Math.hypot(v1.tx - v0.tx, v1.tz - v0.tz).toFixed(1)} tiles`);
  check('and the plan keeps extending', ev.lastPreview.tiles.length > before + 3, `${before} -> ${ev.lastPreview.tiles.length} tiles`);
  await shot('11-autopan-held');
  // keep holding: once the finger points past the map's border the slide stops
  await sleep(4000);
  await frame();
  const v2 = await view();
  await sleep(400);
  await frame();
  const v3 = await view();
  const gEdge = await ground(842, 230);
  check(
    'auto-pan comes to rest at the map border',
    Math.hypot(v3.tx - v2.tx, v3.tz - v2.tz) < 1e-6 && gEdge.x > N - 2 && gEdge.x < N + 2,
    `finger over ${gEdge.x.toFixed(1)}, ${gEdge.z.toFixed(1)}`,
  );
  await shot('11b-autopan-rest');
  await touch('touchEnd', []);
  await frame();
  ev = await events();
  check('the extended road is applied', ev.applied.length === 1 && ev.applied[0].tiles.length > before + 3);
}

// ---------- 10. building tool: ghost follows the finger, lift places ----------
{
  await resetView();
  await setTool('build:police');
  await touch('touchStart', [[14, 380, 180]]);
  await frame();
  await slide([[14, 380, 180, 470, 210]], 6);
  let ev = await events();
  const end = await pick(470, 210);
  const g = ev.lastPreview?.building;
  check('the building ghost sits at the tile under the finger', !!g && g.x === end.x && g.z === end.z, `${JSON.stringify(g)} vs ${JSON.stringify(end)}`);
  await shot('12-build-ghost-held');
  await touch('touchEnd', []);
  await frame();
  ev = await events();
  check('lifting places the building', ev.applied.length === 1 && ev.applied[0].tool === 'build:police');
}

// ---------- 11. touches on UI controls never reach the world ----------
{
  const before = (await events()).touches;
  const box = await page.locator('.tools button', { hasText: 'Homes' }).boundingBox();
  await touch('touchStart', [[15, box.x + box.width / 2, box.y + box.height / 2]]);
  await touch('touchEnd', []);
  await sleep(50);
  await frame();
  const ev = await events();
  const tool = await H(() => window.__input.input.getTool());
  check('a tap on a UI button is not a world touch', ev.touches === before && tool === 'zone_res', `touches ${before} -> ${ev.touches}, tool ${tool}`);
}

// ---------- 12. map edges: panning far stops at the border ----------
{
  await resetView();
  await setTool('inspect');
  for (let k = 0; k < 6; k++) {
    await touch('touchStart', [[16, 150, 120]]);
    await slide([[16, 150, 120, 700, 330]], 6);
    await sleep(120);
    await touch('touchEnd', []);
    await frame();
  }
  const v = await view();
  check('the target stays on the map', v.tx >= 0 && v.tz >= 0 && v.tx <= N && v.tz <= N, `target ${v.tx.toFixed(1)}, ${v.tz.toFixed(1)}`);
  await shot('13-map-edge');
}

// ---------- 13. desktop mouse and keys (real DOM mouse, wheel and key events) ----------
{
  await resetView();
  await setTool('road');
  const g = await ground(620, 130);
  const v0 = await view();
  await page.mouse.move(620, 130);
  await page.mouse.wheel(0, -400);
  await sleep(700);
  await frame();
  await frame();
  const v1 = await view();
  const g1 = await ground(620, 130);
  check('wheel zooms toward the cursor', v1.distance < v0.distance * 0.75 && d2(g, g1) < 0.1, `distance ${v0.distance.toFixed(1)} -> ${v1.distance.toFixed(1)}, drift ${d2(g, g1).toFixed(3)}`);

  const grabbed = await ground(400, 200);
  await page.mouse.move(400, 200);
  await page.mouse.down({ button: 'right' });
  for (let s = 1; s <= 8; s++) {
    await page.mouse.move(400 - s * 12, 200 + s * 6);
    await frame();
  }
  await sleep(150);
  await frame();
  const under = await ground(304, 248);
  await page.mouse.up({ button: 'right' });
  const ev = await events();
  check('right-drag pans, ground-anchored, without planning', d2(grabbed, under) < 0.05 && ev.plans === 0, `drift ${d2(grabbed, under).toFixed(4)}, plans ${ev.plans}`);

  const y0 = (await view()).yaw;
  await page.keyboard.down('KeyE');
  await sleep(400);
  await frame();
  await page.keyboard.up('KeyE');
  await sleep(300);
  await frame();
  const y1 = (await view()).yaw;
  check('E key rotates the view', Math.abs(y1 - y0) > 0.2, `yaw ${((y0 * 180) / Math.PI).toFixed(0)} -> ${((y1 * 180) / Math.PI).toFixed(0)} deg`);

  // left-drag plans like one finger; Escape abandons it
  await page.mouse.move(300, 220);
  await page.mouse.down();
  for (let s = 1; s <= 5; s++) {
    await page.mouse.move(300 + s * 20, 220);
    await frame();
  }
  const planned = (await events()).lastPreview;
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await frame();
  const after = await events();
  check('mouse left-drag plans; Escape cancels it', !!planned && planned.tiles.length > 2 && after.lastPreview === null && after.applied.length === 0);
}

// overview of everything painted
await resetView();
await H(() => {
  const r = window.__input.input.rig;
  r.distance = 70;
  r.pitch = 1.1;
});
await shot('14-overview');

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots in ${out}`);
if (pageLog.length) console.log('page log:\n' + pageLog.join('\n'));
await browser.close();
process.exit(failed.length ? 1 : 0);
