// Bundles the game into www/ (one script, one stylesheet, index.html) and, with --ios,
// copies www/ into the Xcode project so the Mac only needs Xcode.
//   node tools/build.mjs            build once
//   node tools/build.mjs --ios      build and copy into ios/App/App/public
//   node tools/build.mjs --watch    rebuild on change
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const watch = process.argv.includes('--watch');
const ios = process.argv.includes('--ios');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

const options = {
  entryPoints: { game: join(root, 'src/main.ts') },
  bundle: true,
  format: 'iife',
  target: ['safari15', 'chrome100'],
  outdir: out,
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  legalComments: 'none',
  define: { __VERSION__: JSON.stringify(version) },
  loader: { '.css': 'css' },
  logLevel: 'info',
};

function copyStatic() {
  mkdirSync(out, { recursive: true });
  const html = readFileSync(join(root, 'src/index.html'), 'utf8').replaceAll('__VERSION__', version);
  writeFileSync(join(out, 'index.html'), html);
}

if (watch) {
  copyStatic();
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  rmSync(out, { recursive: true, force: true });
  copyStatic();
  await esbuild.build(options);
  if (ios) {
    const pub = join(root, 'ios/App/App/public');
    // Keep Capacitor's cordova shims; replace everything else with the fresh build.
    for (const f of ['index.html', 'game.js', 'game.css']) rmSync(join(pub, f), { force: true });
    cpSync(out, pub, { recursive: true });
    if (!existsSync(join(pub, 'game.js'))) throw new Error('copy to iOS failed');
    console.log('Copied www/ into ios/App/App/public');
  }
}
