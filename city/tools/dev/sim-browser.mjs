// Dev tool (sim): bundle the sim harness and run it in headless Chromium with iPhone-like emulation.
// Usage: node tools/dev/sim-browser.mjs
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const root = new URL('../../', import.meta.url).pathname;
const out = `${root}.cache/sim`;
mkdirSync(out, { recursive: true });
execSync(`npx esbuild src/dev/sim-harness.ts --bundle --format=iife --target=safari15 --outfile=${out}/harness.js`, { cwd: root, stdio: 'inherit' });
writeFileSync(
  `${out}/harness.html`,
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:8px;font:12px system-ui;background:#fff"><script>${readFileSync(`${out}/harness.js`, 'utf8')}</script>`,
);
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`file://${out}/harness.html`);
await page.waitForFunction(() => window.__simResult, null, { timeout: 120000 });
console.log(await page.evaluate(() => window.__simResult));
await page.screenshot({ path: `${out}/harness.png`, fullPage: true });
console.log(errors.length ? `ERRORS: ${errors.join('\n')}` : 'no page errors');
await browser.close();
