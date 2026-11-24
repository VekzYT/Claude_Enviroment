// Renders the world harness (src/dev/world-harness.ts) in headless Chromium at iPhone 15 Pro
// landscape size and saves screenshots to .cache/world/. Usage:
//   node tools/dev/world-shots.mjs [shotName ...]     (no names = all shots)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, '.cache', 'world');
mkdirSync(out, { recursive: true });

// FAKE=1 swaps the models API for src/dev/world-fakemodels.ts (richer stand-ins with glow,
// smoke and spinners) so those paths can be checked before the real art lands.
const fakeModels = {
  name: 'fake-models',
  setup(build) {
    build.onResolve({ filter: /^\.\/models$/ }, (args) =>
      args.importer.includes(join('src', 'render')) ? { path: join(root, 'src/dev/world-fakemodels.ts') } : undefined,
    );
  },
};
await esbuild.build({
  entryPoints: [join(root, 'src/dev/world-harness.ts')],
  bundle: true,
  format: 'iife',
  target: ['safari15'],
  outfile: join(out, 'harness.js'),
  logLevel: 'warning',
  plugins: process.env.FAKE ? [fakeModels] : [],
});
writeFileSync(
  join(out, 'harness.html'),
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}canvas{display:block;width:100vw;height:100vh}</style></head>
<body><canvas id="world"></canvas><script src="harness.js"></script></body></html>`,
);

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const q = process.env.Q || 'high';
await page.goto(`file://${join(out, 'harness.html')}?q=${q}`);
await page.waitForFunction(() => window.__world && window.__world.ready, null, { timeout: 120000 });

// name: [time, view [tx, tz, yaw, pitch, dist], extra setup]
const SHOTS = {
  day: [0.42, [34, 32, 0.785, 0.9, 40]],
  dayClose: [0.45, [30, 24, 0.6, 0.75, 16]],
  dayFar: [0.5, [32, 32, 0.785, 1.0, 78]],
  dusk: [0.735, [34, 32, 0.785, 0.85, 38]],
  duskBack: [0.74, [34, 32, 2.3, 0.85, 38]],
  night: [0.92, [34, 30, 0.785, 0.9, 34]],
  nightClose: [0.95, [36, 22, -0.4, 0.7, 14]],
  sunrise: [0.27, [16, 14, -0.6, 0.8, 30]],
  lake: [0.45, [12, 10, 3.6, 0.7, 22]],
  roads: [0.45, [27, 52, 0.3, 1.25, 16]],
  civic: [0.4, [35, 41, 0.9, 0.8, 22]],
  overlay: [0.45, [34, 32, 0.785, 1.0, 46], 'overlay:power'],
  pollution: [0.45, [34, 32, 0.785, 1.0, 46], 'overlay:pollution'],
  preview: [0.45, [40, 46, 0.6, 0.85, 22], 'preview'],
  grow: [0.45, [29, 21, 0.7, 0.8, 14], 'grow'],
  edge: [0.45, [60, 60, 0.785, 0.55, 30]],
  tank: [0.45, [10, 3, 3.3, 0.45, 22]],
  pieces: [0.5, [31, 12, 0.0, 1.3, 9]],
  deadEnd: [0.5, [33, 54, 0.4, 1.2, 9]],
  lone: [0.5, [12.5, 34.5, 0.3, 1.1, 6]],
  junction: [0.5, [30.5, 26.5, 0.785, 1.0, 7]],
  select: [0.45, [26, 40, 0.785, 0.95, 14], 'select'],
  previewBad: [0.45, [30, 31, 0.785, 0.9, 16], 'previewBad'],
  zoneDrag: [0.45, [44, 50, 0.785, 0.95, 16], 'zoneDrag'],
  nightOverlay: [0.95, [34, 32, 0.785, 1.0, 46], 'overlay:landValue'],
};
const pick = process.argv.slice(2);
const results = {};
for (const [name, [t, v, extra]] of Object.entries(SHOTS)) {
  if (pick.length && !pick.includes(name)) continue;
  const t0 = Date.now();
  const stats = await page.evaluate(([t, v, extra]) => {
    const w = window.__world;
    w.setTime(t);
    w.setView(...v);
    w.setOverlay('none');
    w.preview('none');
    w.select(-1, -1);
    if (extra && extra.startsWith('overlay:')) w.setOverlay(extra.slice(8));
    if (extra === 'preview') {
      w.preview('building');
      w.select(36, 31);
    }
    if (extra === 'select') w.select(27, 37);
    if (extra === 'previewBad') w.preview('bad');
    if (extra === 'zoneDrag') {
      w.preview('zone');
      w.select(41, 46);
    }
    if (extra === 'grow') {
      w.change();
      return w.frames(6, 1 / 30);
    }
    return w.frames(4, 0.5);
  }, [t, v, extra ?? '']);
  const data = await page.evaluate(() => window.__world.snap());
  writeFileSync(join(out, `${process.env.FAKE ? 'f-' : ''}${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
  results[name] = { ...stats, ms: Date.now() - t0 };
  console.log(name, JSON.stringify(results[name]));
}
const errs = logs.filter((l) => /error|warn/i.test(l));
if (errs.length) console.log(errs.slice(0, 20).join('\n'));
await browser.close();
