// Publishes the game as a Home Screen web app into the repository's docs/ folder, which GitHub Pages
// serves (Settings → Pages → Deploy from a branch → this branch, /docs).
//   node tools/pages.mjs
// Builds www/ first, then adds the manifest, icons, robots.txt and the offline service worker.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// CUBOPOLIS_OUT (see tools/build.mjs) keeps this build apart from www/, e.g. while a test is using it.
const www = process.env.CUBOPOLIS_OUT ? join(process.cwd(), process.env.CUBOPOLIS_OUT) : join(root, 'www');
// PAGES_OUT lets a test publish somewhere else (default: the repository's docs/ folder).
const docs = process.env.PAGES_OUT ? join(process.cwd(), process.env.PAGES_OUT) : join(root, '..', 'docs');
const iconSrc = join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');

// The version shown on the title screen and in the menu carries a build number (the commit count),
// so it is easy to tell which build a phone is running.
let buildNo = '';
try {
  buildNo = String(Number(execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()) + 1);
} catch {}
execFileSync(process.execPath, [join(root, 'tools/build.mjs')], { stdio: 'inherit', env: { ...process.env, CUBOPOLIS_BUILD: buildNo } });

rmSync(docs, { recursive: true, force: true });
mkdirSync(docs, { recursive: true });
for (const f of readdirSync(www)) copyFileSync(join(www, f), join(docs, f));
copyFileSync(join(root, 'pwa/manifest.webmanifest'), join(docs, 'manifest.webmanifest'));
copyFileSync(join(root, 'pwa/robots.txt'), join(docs, 'robots.txt'));
writeFileSync(join(docs, '.nojekyll'), '');

// The web-app page: manifest, Home Screen icon and full-screen launch, no indexing, and the offline
// service worker. (The plain www/ build and the iOS app do without these.)
const headTags = [
  '<meta name="robots" content="noindex, nofollow">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="Cubopolis">',
  '<meta name="theme-color" content="#9fd3f0">',
  '<link rel="apple-touch-startup-image" href="launch-landscape.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)">',
].join('\n');
// Registers the offline service worker, checks for a new version every time the app comes back to the
// front (a Home Screen app can stay open for days), and tells the game when one has taken over.
const swTag = `<script>
if ('serviceWorker' in navigator) addEventListener('load', function () {
  var had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (had) dispatchEvent(new Event('cubopolis-update'));
    had = true;
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') reg.update().catch(function () {});
    });
  }).catch(function () {});
});
</script>`;
let page = readFileSync(join(docs, 'index.html'), 'utf8');
if (!page.includes('</head>') || !page.includes('</body>')) throw new Error('www/index.html has no </head> or </body>');
page = page.replace('</head>', `${headTags}\n</head>`).replace('</body>', `${swTag}\n</body>`);
writeFileSync(join(docs, 'index.html'), page);

// Home Screen icons, resized from the 1024px app icon (opaque, as iOS wants).
if (!existsSync(iconSrc)) throw new Error('missing app icon at ' + iconSrc);
const sizes = { 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 };
const py = `
import sys
from PIL import Image
src = Image.open(sys.argv[1]).convert('RGB')
for spec in sys.argv[2:]:
    path, size = spec.rsplit(':', 1)
    src.resize((int(size), int(size)), Image.LANCZOS).save(path, optimize=True)
`;
execFileSync('python3', ['-c', py, iconSrc, ...Object.entries(sizes).map(([f, s]) => `${join(docs, f)}:${s}`)], { stdio: 'inherit' });

// Launch image for an iPhone 15 Pro held sideways (shown while the app starts).
const splashSrc = join(root, 'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png');
if (existsSync(splashSrc)) {
  const crop = `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
w, h = 2556, 1179
s = max(w / im.width, h / im.height)
im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
l, t = (im.width - w) // 2, (im.height - h) // 2
im.crop((l, t, l + w, t + h)).save(sys.argv[2], optimize=True)
`;
  execFileSync('python3', ['-c', crop, splashSrc, join(docs, 'launch-landscape.png')], { stdio: 'inherit' });
}

// The service worker caches exactly the files that were published, under a hash of their contents.
const files = readdirSync(docs).filter((f) => !f.startsWith('.') && f !== 'sw.js' && f !== 'robots.txt');
const hash = createHash('sha256');
for (const f of files.sort()) hash.update(f).update(readFileSync(join(docs, f)));
const buildId = hash.digest('hex').slice(0, 12);
const sw = readFileSync(join(root, 'pwa/sw.js'), 'utf8')
  .replace('__BUILD_ID__', buildId)
  .replace('__FILES__', JSON.stringify(['./', ...files.map((f) => './' + f)]));
writeFileSync(join(docs, 'sw.js'), sw);
console.log(`Published ${files.length} files to docs/ (build ${buildId})`);
