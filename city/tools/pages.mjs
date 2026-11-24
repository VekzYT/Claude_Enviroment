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
const www = join(root, 'www');
const docs = join(root, '..', 'docs');
const iconSrc = join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');

execFileSync(process.execPath, [join(root, 'tools/build.mjs')], { stdio: 'inherit' });

rmSync(docs, { recursive: true, force: true });
mkdirSync(docs, { recursive: true });
for (const f of readdirSync(www)) copyFileSync(join(www, f), join(docs, f));
copyFileSync(join(root, 'pwa/manifest.webmanifest'), join(docs, 'manifest.webmanifest'));
copyFileSync(join(root, 'pwa/robots.txt'), join(docs, 'robots.txt'));
writeFileSync(join(docs, '.nojekyll'), '');

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
