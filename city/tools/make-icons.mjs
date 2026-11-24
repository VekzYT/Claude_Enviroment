// Renders the app icon and launch splash from the real voxel models.
//   node tools/make-icons.mjs
// 1. Bundles src/dev/models-icon.ts and renders, in headless Chromium on transparent backgrounds:
//    the floating city island (with clouds, for the icon), the island alone and the voxel title.
// 2. Composites the final images with PIL (python3) and writes them, fully opaque (no alpha channel):
//    ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png   1024×1024, soft sky gradient
//    ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732*.png   2732×2732, #9fd3f0, island +
//    title kept inside the middle 35% of the height (the launch screen aspect-fills a landscape phone).
// Intermediate renders go to .cache/models/icons/.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const work = join(root, '.cache', 'models', 'icons');
mkdirSync(work, { recursive: true });
const assets = join(root, 'ios', 'App', 'App', 'Assets.xcassets');
// DRY=1 writes the final images into .cache/models/icons/ instead of the Xcode asset catalog.
const dry = !!process.env.DRY;
const iconOut = dry ? join(work, 'AppIcon-512@2x.png') : join(assets, 'AppIcon.appiconset', 'AppIcon-512@2x.png');
const splashOut = ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'].map((f) =>
  dry ? join(work, f) : join(assets, 'Splash.imageset', f),
);

await esbuild.build({
  entryPoints: [join(root, 'src/dev/models-icon.ts')],
  bundle: true,
  format: 'iife',
  target: ['safari15'],
  outfile: join(work, 'icon.js'),
  logLevel: 'warning',
});
writeFileSync(
  join(work, 'icon.html'),
  `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:transparent;overflow:hidden}canvas{display:block}</style></head>
<body><canvas id="c"></canvas><script src="icon.js"></script></body></html>`,
);

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 2048, height: 2048 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`file://${join(work, 'icon.html')}`);
await page.waitForFunction(() => window.__icon && window.__icon.ready, null, { timeout: 120000 });

// Rendered at twice the size they are used at, then downsampled for clean edges.
const renders = [
  ['icon', 2048, 2048],
  ['island', 1600, 1500],
  ['title', 2400, 560],
];
for (const [kind, w, h] of renders) {
  await page.setViewportSize({ width: w, height: h });
  await page.evaluate(([k, ww, hh]) => window.__icon.render(k, ww, hh), [kind, w, h]);
  await page.screenshot({ path: join(work, `${kind}.png`), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  console.log('rendered', kind);
}
await browser.close();
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const py = String.raw`
import sys
from PIL import Image, ImageDraw, ImageFilter
work, icon_out = sys.argv[1], sys.argv[2]
splash_outs = sys.argv[3:]

def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))

def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def trim(img):
    box = img.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    return img.crop(box) if box else img

# ---- icon: soft sky gradient, a pale sun glow, the island on top
S = 1024
top, mid, bottom = hexrgb('#5fb4ec'), hexrgb('#a9dcf7'), hexrgb('#e7f6ff')
bg = Image.new('RGB', (S, S))
px = bg.load()
for y in range(S):
    t = y / (S - 1)
    c = lerp(top, mid, t / 0.6) if t < 0.6 else lerp(mid, bottom, (t - 0.6) / 0.4)
    for x in range(S):
        px[x, y] = c
glow = Image.new('L', (S, S), 0)
ImageDraw.Draw(glow).ellipse((S * 0.08, S * 0.05, S * 0.62, S * 0.55), fill=120)
glow = glow.filter(ImageFilter.GaussianBlur(S * 0.09))
bg = Image.composite(Image.new('RGB', (S, S), (255, 250, 232)), bg, glow)
island = Image.open(work + '/icon.png').convert('RGBA').resize((S, S), Image.LANCZOS)
icon = bg.convert('RGBA')
icon.alpha_composite(island)
icon = icon.convert('RGB')
icon.save(icon_out, optimize=True)
icon.save(work + '/AppIcon-preview.png')
for size in (180, 120, 60, 40):
    icon.resize((size, size), Image.LANCZOS).save(work + '/icon-%d.png' % size)

# ---- splash: #9fd3f0, island above the title, both inside the middle 35% of the height
N = 2732
band_top, band_bottom = N * (0.5 - 0.175), N * (0.5 + 0.175)
splash = Image.new('RGBA', (N, N), hexrgb('#9fd3f0') + (255,))
isl = trim(Image.open(work + '/island.png').convert('RGBA'))
ttl = trim(Image.open(work + '/title.png').convert('RGBA'))
isl_h = 560
isl = isl.resize((round(isl.width * isl_h / isl.height), isl_h), Image.LANCZOS)
ttl_w = 1080
ttl = ttl.resize((ttl_w, round(ttl.height * ttl_w / ttl.width)), Image.LANCZOS)
gap = 46
total = isl.height + gap + ttl.height
y0 = round(N / 2 - total / 2)
assert y0 >= band_top and y0 + total <= band_bottom, (y0, total)
# soft shadow under the island so it floats
sh = Image.new('L', (N, N), 0)
cx = N // 2
sy = y0 + isl.height - 30
ImageDraw.Draw(sh).ellipse((cx - isl.width * 0.28, sy - 18, cx + isl.width * 0.28, sy + 18), fill=60)
sh = sh.filter(ImageFilter.GaussianBlur(22))
splash = Image.composite(Image.new('RGBA', (N, N), (70, 120, 160, 255)), splash, sh)
splash.alpha_composite(isl, (cx - isl.width // 2, y0))
splash.alpha_composite(ttl, (cx - ttl.width // 2, y0 + isl.height + gap))
splash = splash.convert('RGB')
for p in splash_outs:
    splash.save(p, optimize=True)
splash.resize((N // 4, N // 4), Image.LANCZOS).save(work + '/splash-preview.png')
# what a landscape iPhone shows (aspect fill 852x393)
vis_h = round(N * 393 / 852)
splash.crop((0, (N - vis_h) // 2, N, (N + vis_h) // 2)).resize((852, 393), Image.LANCZOS).save(work + '/splash-phone.png')
print('icon', icon.mode, icon.size, 'splash', splash.mode, splash.size, 'content rows', y0, y0 + total)
`;
const r = spawnSync('python3', ['-c', py, work, iconOut, ...splashOut], { encoding: 'utf8' });
process.stdout.write(r.stdout);
if (r.status !== 0) {
  process.stderr.write(r.stderr);
  process.exit(1);
}
console.log('wrote', iconOut);
for (const p of splashOut) console.log('wrote', p);
