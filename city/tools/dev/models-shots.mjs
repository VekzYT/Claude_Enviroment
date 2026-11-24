// Renders the models gallery (src/dev/models-gallery.ts) in headless Chromium at iPhone 15 Pro
// landscape size and saves screenshots to .cache/models/. Usage:
//   node tools/dev/models-shots.mjs [shotName ...]     (no names = all shots)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, '.cache', 'models');
mkdirSync(out, { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'src/dev/models-gallery.ts')],
  bundle: true,
  format: 'iife',
  target: ['safari15'],
  outfile: join(out, 'gallery.js'),
  logLevel: 'warning',
});
writeFileSync(
  join(out, 'gallery.html'),
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}canvas{display:block;width:100vw;height:100vh}</style></head>
<body><canvas id="c"></canvas><script src="gallery.js"></script></body></html>`,
);

// name: options for window.__gallery.shot
const SHOTS = {
  zonesDay: { target: [8.5, 4], dist: 24, pitch: 0.7, yaw: 0.35 },
  zonesNight: { night: 1, target: [8.5, 4], dist: 24, pitch: 0.7, yaw: 0.35 },
  resClose: { target: [2, 4], dist: 10, pitch: 0.55, yaw: 0.3 },
  resL1: { target: [2, 6.5], dist: 4.6, pitch: 0.6, yaw: 0.35 },
  resL2: { target: [2, 3.6], dist: 6, pitch: 0.45, yaw: 0.35 },
  resL3: { target: [2, 0.8], dist: 11, pitch: 0.3, yaw: 0.3 },
  comClose: { target: [8, 4], dist: 10, pitch: 0.55, yaw: 0.3 },
  comL1: { target: [8, 6.5], dist: 4.6, pitch: 0.6, yaw: 0.35 },
  comL2: { target: [8, 3.6], dist: 6, pitch: 0.45, yaw: 0.35 },
  comL3: { target: [8, 0.8], dist: 11, pitch: 0.3, yaw: 0.3 },
  indClose: { target: [14, 4], dist: 10, pitch: 0.55, yaw: 0.3 },
  indL1: { target: [14, 6.5], dist: 4.6, pitch: 0.6, yaw: 0.35 },
  indL2: { target: [14, 3.6], dist: 6, pitch: 0.45, yaw: 0.35 },
  indL3: { target: [14, 0.8], dist: 11, pitch: 0.3, yaw: 0.3 },
  towersNight: { night: 1, target: [8.5, 1.5], dist: 16, pitch: 0.3, yaw: 0.3 },
  lowNight: { night: 1, target: [8.5, 5], dist: 9, pitch: 0.6, yaw: 0.3 },
  buildingsDay: { target: [8, 27], dist: 22, pitch: 0.8, yaw: 0.5 },
  buildingsNight: { night: 1, target: [8, 27], dist: 22, pitch: 0.8, yaw: 0.5 },
  buildingsA: { target: [5, 22], dist: 10, pitch: 0.6, yaw: 0.45 },
  buildingsB: { target: [11, 22], dist: 10, pitch: 0.6, yaw: 0.45 },
  buildingsC: { target: [5, 29], dist: 12, pitch: 0.6, yaw: 0.45 },
  buildingsD: { target: [12, 30], dist: 13, pitch: 0.6, yaw: 0.45 },
  nature: { target: [22, 2], dist: 4.5, pitch: 0.6, yaw: 0.45 },
  natureNight: { night: 1, target: [22, 2], dist: 4.5, pitch: 0.6, yaw: 0.45 },
  cityDay: { target: [50, 10], dist: 40, pitch: 0.9, yaw: 0.785 },
  cityNight: { night: 1, target: [50, 10], dist: 40, pitch: 0.9, yaw: 0.785 },
  cityClose: { target: [50, 11], dist: 16, pitch: 0.75, yaw: 0.6 },
  cityCloseNight: { night: 1, target: [50, 11], dist: 16, pitch: 0.75, yaw: 0.6 },
};

// contact sheets: [keys, cols, rows, night]
const res = (l) => [0, 1, 2, 3].map((v) => `res${l}-${v}`);
const com = (l) => [0, 1, 2, 3].map((v) => `com${l}-${v}`);
const ind = (l) => [0, 1, 2, 3].map((v) => `ind${l}-${v}`);
const SHEETS = {
  sheetRes: [[...res(1), ...res(2), ...res(3)], 4, 3, 0],
  sheetCom: [[...com(1), ...com(2), ...com(3)], 4, 3, 0],
  sheetInd: [[...ind(1), ...ind(2), ...ind(3)], 4, 3, 0],
  sheetResNight: [[...res(1), ...res(2), ...res(3)], 4, 3, 1],
  sheetComNight: [[...com(1), ...com(2), ...com(3)], 4, 3, 1],
  sheetIndNight: [[...ind(1), ...ind(2), ...ind(3)], 4, 3, 1],
  sheetUtil: [['power_coal', 'power_wind', 'power_solar', 'water_tower', 'water_pump', 'park_small', 'park_plaza', 'police'], 4, 2, 0],
  sheetCivic: [['fire', 'clinic', 'school', 'hospital', 'college', 'stadium', 'landmark'], 4, 2, 0],
  sheetUtilNight: [['power_coal', 'power_wind', 'power_solar', 'water_tower', 'water_pump', 'park_small', 'park_plaza', 'police'], 4, 2, 1],
  sheetCivicNight: [['fire', 'clinic', 'school', 'hospital', 'college', 'stadium', 'landmark'], 4, 2, 1],
  sheetBig: [['landmark', 'stadium', 'power_coal', 'college'], 2, 2, 0],
  sheetBigNight: [['landmark', 'stadium', 'power_coal', 'hospital'], 2, 2, 1],
  sheetTowers: [['res3-0', 'res3-1', 'res3-2', 'res3-3', 'com3-0', 'com3-1', 'com3-2', 'com3-3'], 8, 1, 0],
  sheetHeavy: [['ind3-0', 'ind3-1', 'ind3-2', 'ind3-3', 'ind2-0', 'ind2-1', 'ind2-2', 'ind2-3'], 8, 1, 0],
  sheetSmall: [['tree1', 'tree2', 'tree3', 'car0', 'car1', 'car2', 'car3', 'car4', 'car5'], 3, 3, 0],
  sheetSmallNight: [['tree1', 'tree2', 'tree3', 'car0', 'car1', 'car2', 'car3', 'car4', 'car5'], 3, 3, 1],
};

const want = process.argv.slice(2);
const names = want.length ? want : [...Object.keys(SHOTS), ...Object.keys(SHEETS)];

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(`file://${join(out, 'gallery.html')}`);
await page.waitForFunction(() => window.__gallery && window.__gallery.ready, null, { timeout: 120000 });
for (const name of names) {
  if (SHEETS[name]) {
    const [keys, cols, rows, night] = SHEETS[name];
    await page.evaluate(([k, c, r, n]) => window.__gallery.sheet(k, c, r, n), [keys, cols, rows, night]);
    await page.screenshot({ path: join(out, `${name}.png`) });
    console.log('saved', name);
    continue;
  }
  const opts = SHOTS[name];
  if (!opts) {
    console.log('unknown shot', name);
    continue;
  }
  await page.evaluate(([n, o]) => window.__gallery.shot(n, o), [name, opts]);
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log('saved', name);
}
if (logs.length) console.log(logs.join('\n'));
await browser.close();
