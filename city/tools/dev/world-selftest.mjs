// Functional self-test of the world renderer in headless Chromium (phone-sized):
// picking, cars leaving a removed road, lots re-facing a new road, bulldozing a building,
// live quality switching, swapping to a tiny empty city and back. Exits non-zero on failure.
//   node tools/dev/world-selftest.mjs          (FAKE=1 uses the dev stand-in models)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, '.cache', 'world');
mkdirSync(out, { recursive: true });

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
  outfile: join(out, 'selftest.js'),
  logLevel: 'warning',
  plugins: process.env.FAKE ? [fakeModels] : [],
});
writeFileSync(
  join(out, 'selftest.html'),
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;overflow:hidden}canvas{display:block;width:100vw;height:100vh}</style></head>
<body><canvas id="world"></canvas><script src="selftest.js"></script></body></html>`,
);

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
await page.goto(`file://${join(out, 'selftest.html')}?q=medium`);
await page.waitForFunction(() => window.__world && window.__world.ready, null, { timeout: 120000 });
const report = await page.evaluate(() => window.__world.selfTest());
await browser.close();
console.log(JSON.stringify(report, null, 1));
const fail = [...report.fail, ...errors];
if (fail.length) {
  console.error('FAIL:\n' + fail.join('\n'));
  process.exit(1);
}
console.log('world self-test passed');
