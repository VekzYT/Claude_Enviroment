// Bundles src/ into one self-contained HTML file (play.html) that runs from file://
// with no server and no network: three.js is bundled in.
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const watch = process.argv.includes('--watch');

function writeHtml(js) {
  const template = readFileSync('src/index.template.html', 'utf8');
  const css = readFileSync('src/ui/style.css', 'utf8');
  // Function replacers: a string replacement would expand "$&" etc. inside minified code.
  const html = template
    .replace('/*__STYLE__*/', () => css)
    .replace('/*__SCRIPT__*/', () => js.replace(/<\/script/gi, '<\\/script'));
  writeFileSync('play.html', html);
  console.log(`play.html written (${(html.length / 1024).toFixed(0)} KB)`);
}

const options = {
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  minify: !watch,
  write: false,
  target: 'es2020',
  legalComments: 'none',
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [{
      name: 'html',
      setup(b) { b.onEnd((r) => { if (!r.errors.length) writeHtml(r.outputFiles[0].text); }); },
    }],
  });
  await ctx.watch();
} else {
  const result = await esbuild.build(options);
  writeHtml(result.outputFiles[0].text);
}
