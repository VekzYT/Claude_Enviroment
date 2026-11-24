// Bundles the game into www/ (one script, one stylesheet, index.html).
//   node tools/build.mjs            build once
//   node tools/build.mjs --watch    rebuild on change
// Environment:
//   GAME_OUT=.cache/x/www     build into another folder (relative to the current folder), so several
//                             builds can run side by side without touching www/
//   GAME_ENTRY=src/dev/x.ts   bundle a dev harness instead of src/main.ts (same index.html)
//   GAME_BUILD=57             build number shown next to the version
import * as esbuild from 'esbuild';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.GAME_OUT ? join(process.cwd(), process.env.GAME_OUT) : join(root, 'www');
const entry = process.env.GAME_ENTRY ? join(process.cwd(), process.env.GAME_ENTRY) : join(root, 'src/main.ts');
const watch = process.argv.includes('--watch');
const pkgVersion = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const version = process.env.GAME_BUILD ? `${pkgVersion} (build ${process.env.GAME_BUILD})` : pkgVersion;

const options = {
  entryPoints: { game: entry },
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
  // A harness that imports no CSS would leave index.html pointing at a missing stylesheet.
  writeFileSync(join(out, 'game.css'), '');
}

if (watch) {
  copyStatic();
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  rmSync(out, { recursive: true, force: true });
  copyStatic();
  await esbuild.build(options);
}
