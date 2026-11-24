// Drives the interface harness with real touch taps and checks what the fake game was asked to do.
//   node tools/dev/ui-interact.mjs        (run tools/dev/ui-shots.mjs first: it builds the harness)
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const url = `file://${join(root, '.cache', 'ui', 'harness.html')}`;
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

let fails = 0;
const check = (name, ok, detail = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + detail}`);
};
const probe = () => page.evaluate(() => window.__ui.probe());
const fresh = async (scenario = 'hud') => {
  await page.goto(url);
  await page.waitForFunction(() => window.__ui && window.__ui.ready);
  await page.evaluate((n) => window.__ui.run(n), scenario);
  await page.waitForTimeout(250);
};
const dock = (label) => page.locator('.dock-btn', { hasText: label });
const visible = (sel) => page.locator(sel).first().isVisible();

// ---- dock, tray, chip
await fresh();
await dock('Zones').tap();
check('category opens tray', await visible('.tray'));
await page.locator('.card', { hasText: 'Shops' }).tap();
let p = await probe();
check('card selects tool', p.tool === 'zone_com', p.tool);
check('tray collapses to chip', !(await visible('.tray')) && (await visible('.chip')));
await page.locator('.chip-x').tap();
p = await probe();
check('chip x returns to Look', p.tool === 'inspect' && !(await visible('.chip')), p.tool);
await dock('Roads').tap();
p = await probe();
check('single-tool category selects directly', p.tool === 'road', p.tool);
await dock('Roads').tap();
p = await probe();
check('tapping it again puts it down', p.tool === 'inspect', p.tool);
await dock('Utilities').tap();
await page.locator('.card', { hasText: 'Solar Farm' }).tap();
p = await probe();
check('locked card does not select', p.tool === 'inspect' && (await visible('.tray')), p.tool);
await page.touchscreen.tap(120, 330);
await page.waitForTimeout(100);
check('tap on the map folds the tray', !(await visible('.tray')));

// ---- preview pill replaces chip
await dock('Roads').tap();
await page.evaluate(() => window.__ui.preview(true));
check('pill shows while dragging', (await visible('.pill')) && !(await visible('.chip')));
check('pill text', (await page.locator('.pill').innerText()).replace(/\s+/g, ' ').includes('14 tiles'));
await page.evaluate(() => window.__ui.preview(false));
check('chip returns after drag', (await visible('.chip')) && !(await visible('.pill')));

// ---- undo
await fresh();
check('undo visible when canUndo', await visible('.undo-btn'));
await page.locator('.undo-btn').tap();
await page.locator('.undo-btn').tap();
await page.waitForTimeout(250);
p = await probe();
check('undo calls actions.undo and hides at zero', p.undoDepth === 0 && !(await visible('.undo-btn')), String(p.undoDepth));

// ---- speed
await page.locator('.speed-btn').nth(3).tap();
p = await probe();
check('speed 3x', p.speed === 3, String(p.speed));
await page.locator('.speed-btn').nth(0).tap();
p = await probe();
check('pause', p.speed === 0, String(p.speed));

// ---- budget: modal + tax slider
await page.locator('.tool-btn').nth(1).tap();
await page.waitForTimeout(250);
p = await probe();
check('budget is modal', p.modal === true);
const slider = page.locator('.b-zone .slider').first();
const box = await slider.boundingBox();
await page.mouse.click(box.x + box.width * 0.95, box.y + box.height / 2);
await page.waitForTimeout(150);
p = await probe();
check('tax slider sets tax', p.taxes.res >= 18, JSON.stringify(p.taxes));
check('income column follows', (await page.locator('.b-income').first().innerText()).includes('$2,'));
await page.locator('.sh-close').first().tap();
await page.waitForTimeout(300);
p = await probe();
check('closing budget ends modal', p.modal === false);

// ---- layers
await page.locator('.tool-btn').nth(0).tap();
check('layers popover opens', await visible('.layers-pop'));
check('layers popover is not modal', (await probe()).modal === false);
await page.locator('.layer-opt', { hasText: 'Water' }).tap();
p = await probe();
check('overlay picked', p.overlay === 'water' && !(await visible('.layers-pop')), p.overlay);
await page.waitForTimeout(200);
check('legend shows', (await page.locator('.legend').innerText()).includes('Has water'));
await page.locator('.legend .round').tap();
await page.waitForTimeout(200);
p = await probe();
check('legend x turns overlay off', p.overlay === 'none' && !(await visible('.legend')), p.overlay);

// ---- inspect
await page.evaluate(() => window.__ui.inspect(true));
check('inspect card shows', await visible('.inspect'));
await page.locator('.in-locate').tap();
p = await probe();
check('inspect icon centres the map', p.log.some((l) => l.startsWith('focus 24,28')), p.log.join('|'));
await page.locator('.inspect .round').tap();
check('inspect closes', !(await visible('.inspect')));

// ---- settings
await page.locator('.tool-btn').nth(2).tap();
await page.waitForTimeout(250);
await page.locator('.switch').nth(1).tap();
p = await probe();
check('tips toggle off', p.settings.tips === false);
await page.locator('.switch').nth(1).tap();
p = await probe();
check('tips back on clears seen', p.settings.tips === true && p.settings.seenTips.length === 0);
await page.locator('.seg-btn', { hasText: 'Low' }).tap();
p = await probe();
check('quality low', p.settings.quality === 'low');
await page.locator('.set-action', { hasText: 'Back up' }).tap();
const code = await page.locator('.set-backup textarea').inputValue();
check('backup shows code', code.startsWith('CUBO1.'));
await page.locator('.set-backup .pbtn').tap();
await page.waitForTimeout(200);
const status = await page.locator('.set-backup .set-status').innerText();
check('copy reports a result', status.length > 0, status);
await page.locator('.set-backup .set-subhead .round').tap();
await page.locator('.set-action', { hasText: 'Restore' }).tap();
await page.locator('.set-restore textarea').fill(code);
await page.locator('.set-restore .pbtn').tap();
await page.waitForTimeout(300);
check('restore with a good code closes the menu', (await probe()).modal === false);
check('restore toast', (await page.locator('.toast').allInnerTexts()).some((t) => t.includes('City restored')));

// ---- new city from the menu, with confirm
await page.locator('.tool-btn').nth(2).tap();
await page.waitForTimeout(250);
await page.locator('.set-action', { hasText: 'New city' }).tap();
await page.locator('.set-confirm .pbtn.danger').tap();
await page.waitForTimeout(400);
check('new city screen opens', await visible('.newcity'));
await page.locator('.nc-name input').fill('  My   Town ');
await page.locator('.newcity .pbtn.primary').tap();
await page.waitForTimeout(400);
p = await probe();
check('start building passes a tidy name', p.log.some((l) => /^start \d+ My Town$/.test(l)), p.log.join('|'));
check('nothing modal after start', p.modal === false);

// ---- title flow
await fresh('title');
await page.waitForTimeout(300);
check('title is modal', (await probe()).modal === true);
check('continue shown when there is a save', await visible('.title-btns .pbtn.primary >> text=Continue'));
await page.locator('.title-btns .pbtn', { hasText: 'Continue' }).tap();
await page.waitForTimeout(400);
check('continue closes the title', (await probe()).modal === false);

// ---- toasts: at most three
await fresh();
await page.evaluate(() => {
  for (let k = 0; k < 6; k++) window.__ui.emitToast('Message ' + k);
});
await page.waitForTimeout(300);
check('at most three toasts', (await page.locator('.toast:not(.out)').count()) === 3);
await page.evaluate(() => window.__ui.emitToast('Message 5'));
await page.waitForTimeout(100);
check('duplicate toast is merged', (await page.locator('.toast:not(.out)').count()) === 3);

// ---- milestone celebration swallows the matching sim toast
await fresh('milestone');
await page.waitForTimeout(400);
check('milestone card is modal', (await probe()).modal === true);
check('milestone toast suppressed', (await page.locator('.toast').count()) === 0);
await page.locator('.celebrate .pbtn').tap();
await page.waitForTimeout(400);
check('milestone dismiss', (await probe()).modal === false);
check('new buildings flagged on the dock', await page.locator('.dock-btn.has-new').count() >= 2);

// ---- tips: show, step aside while followed, retire when done, next one appears
await fresh('tipRoads');
await page.waitForTimeout(2000);
check('roads tip shows', (await page.locator('.tip').innerText()).includes('Roads'));
await dock('Roads').tap();
await page.waitForTimeout(300);
check('tip steps aside while the player follows it', !(await visible('.tip')));
await page.evaluate(() => window.__ui.buildRoad());
await page.waitForTimeout(2200);
p = await probe();
check('roads tip retired once a road exists', p.settings.seenTips.includes('roads'), JSON.stringify(p.settings.seenTips));
check('zones tip appears with the road tool still in hand', (await visible('.tip')) && (await page.locator('.tip').innerText()).includes('Zones'));
await page.locator('.tip .pbtn').tap();
p = await probe();
check('Got it marks the tip seen', p.settings.seenTips.includes('zones') && !(await visible('.tip')));

check('no page errors', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
