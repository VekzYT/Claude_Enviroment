// Screenshots of the interface harness (src/dev/ui-harness.ts) at iPhone 15 Pro landscape size
// with the safe areas emulated, into .cache/ui/. Usage:
//   node tools/dev/ui-shots.mjs [scenario ...]      (no names = every scenario)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, '.cache', 'ui');
mkdirSync(out, { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'src/dev/ui-harness.ts')],
  bundle: true,
  format: 'iife',
  target: ['safari15'],
  outfile: join(out, 'harness.js'),
  define: { __VERSION__: JSON.stringify('0.1.0') },
  loader: { '.css': 'css' },
  logLevel: 'warning',
});
writeFileSync(
  join(out, 'harness.html'),
  `<!doctype html><html lang="en" style="--safe-left:59px;--safe-right:59px;--safe-bottom:21px">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<link rel="stylesheet" href="harness.css"></head>
<body><canvas id="world"></canvas><div id="ui"></div><script src="harness.js"></script></body></html>`,
);

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

const url = `file://${join(out, 'harness.html')}`;
await page.goto(url);
await page.waitForFunction(() => window.__ui && window.__ui.ready);
const all = await page.evaluate(() => window.__ui.names);
const pick = process.argv.slice(2);
const names = pick.length ? pick : all;

/** Wait long enough for tips (they settle for ~1.4 s) and entrance animations. */
const WAIT = { tipRoads: 2600, tipPower: 2600, tipBudget: 2600, tipZones: 2600, title: 1400, titleNoSave: 1400, titleBrokenSave: 1400, milestone: 1100, toasts: 600, restoreBad: 500 };

for (const name of names) {
  await page.goto(url);
  await page.waitForFunction(() => window.__ui && window.__ui.ready);
  await page.evaluate((n) => window.__ui.run(n), name);
  await page.waitForTimeout(WAIT[name] ?? 700);
  // Report anything poking outside the screen or into the safe areas.
  const issues = await page.evaluate(() => {
    const W = innerWidth;
    const H = innerHeight;
    const L = 59;
    const R = W - 59;
    const B = H - 21;
    const bad = [];
    for (const el of document.querySelectorAll('#ui button, #ui input, #ui textarea, #ui .panel')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
      if (el.closest('[hidden]')) continue;
      if (r.left < L - 0.5 || r.right > R + 0.5 || r.bottom > B + 0.5 || r.top < -0.5) {
        bad.push(`${el.className || el.tagName} [${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}]`);
      }
    }
    return bad;
  });
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log(`${name}.png${issues.length ? '  OUTSIDE SAFE AREA: ' + issues.slice(0, 4).join('; ') : ''}`);
}
await browser.close();
if (logs.length) console.log(logs.join('\n'));
