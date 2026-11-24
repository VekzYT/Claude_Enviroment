// Renders the world team's harness (src/dev/world-harness.ts) with the real voxel models, into
// .cache/models/world/, to check the models inside the actual game renderer. Read-only use of
// their harness; output never touches their cache. Usage: node tools/dev/models-world.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, '.cache', 'models', 'world');
mkdirSync(out, { recursive: true });
await esbuild.build({
  entryPoints: [join(root, 'src/dev/world-harness.ts')],
  bundle: true,
  format: 'iife',
  target: ['safari15'],
  outfile: join(out, 'harness.js'),
  logLevel: 'warning',
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
await page.goto(`file://${join(out, 'harness.html')}?q=high`);
await page.waitForFunction(() => window.__world && window.__world.ready, null, { timeout: 180000 });
const SHOTS = {
  day: [0.42, [34, 32, 0.785, 0.9, 40]],
  dayClose: [0.45, [30, 24, 0.6, 0.75, 16]],
  dusk: [0.735, [34, 32, 0.785, 0.85, 38]],
  night: [0.92, [34, 30, 0.785, 0.9, 34]],
  nightClose: [0.95, [36, 22, -0.4, 0.7, 14]],
  civic: [0.4, [35, 41, 0.9, 0.8, 22]],
};
const pick = process.argv.slice(2);
for (const [name, [t, v]] of Object.entries(SHOTS)) {
  if (pick.length && !pick.includes(name)) continue;
  const stats = await page.evaluate(([t, v]) => {
    const w = window.__world;
    w.setTime(t);
    w.setView(...v);
    return w.frames(4, 0.5);
  }, [t, v]);
  const data = await page.evaluate(() => window.__world.snap());
  writeFileSync(join(out, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
  console.log(name, JSON.stringify(stats));
}
const errs = logs.filter((l) => /error|warn/i.test(l) && !/GPU stall|GL Driver/.test(l));
if (errs.length) console.log(errs.slice(0, 20).join('\n'));
await browser.close();
