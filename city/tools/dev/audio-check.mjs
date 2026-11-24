// Audio self-test in headless Chromium (phone-sized context):
//  * renders every sound effect (all variants) offline, dry and through the game's mix at full
//    volume, and checks each one is audible, never clips (peak < 0.9) and ends inside its slot;
//  * renders ~20 s of music and of four ambience scenes, checks levels and that nothing goes silent;
//  * renders a worst case (everything at full volume plus an effect every 0.12 s) and checks peaks;
//  * drives the live engine: unlock, play, rate limits, suspend/resume, mute, no-Web-Audio fallback,
//    and counts how many audio nodes per second it creates.
// WAV files of a few effects, the music and the ambience go to .cache/audio/. Exits non-zero on failure.
//   node tools/dev/audio-check.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, '.cache', 'audio');
mkdirSync(out, { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'src/dev/audio-harness.ts')],
  bundle: true,
  format: 'iife',
  target: ['safari15'],
  outfile: join(out, 'harness.js'),
  logLevel: 'warning',
});
writeFileSync(join(out, 'harness.html'), `<!doctype html><html><head><meta charset="utf-8"></head><body><script src="harness.js"></script></body></html>`);

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') pageErrors.push(m.text());
});
await page.goto(`file://${join(out, 'harness.html')}`);
await page.waitForFunction(() => window.__audio);

const fail = [];
const db = (v) => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : '-inf').padStart(6);
const SR = await page.evaluate(() => window.__audio.SR);

function wav(name, b64, channels) {
  const pcm = Buffer.from(b64, 'base64');
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * channels * 2, 28);
  h.writeUInt16LE(channels * 2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  const file = join(out, `${name}.wav`);
  writeFileSync(file, Buffer.concat([h, pcm]));
  return file;
}

// ---------- sound effects ----------
const wavIds = ['click', 'tool', 'road', 'zone', 'build', 'bulldoze', 'denied', 'cash', 'milestone', 'grow', 'undo', 'open', 'close', 'month'];
const sfx = await page.evaluate((ids) => window.__audio.renderSfx(ids), wavIds);
console.log('\nSound effects (dBFS; dry = recipe alone, mix = through compressor/reverb at full volume)');
console.log('id         var  len    peak  loud50ms   rms   mixPeak  tail   onset  render');
for (const r of sfx.rows) {
  console.log(
    `${r.id.padEnd(10)} ${String(r.variant).padStart(2)}  ${r.length.toFixed(2)}  ${db(r.peak)}  ${db(r.loudRms)}  ${db(r.rms)}  ${db(r.mixPeak)}  ${db(r.tailPeak)}  ${(r.onset * 1000).toFixed(0).padStart(4)}ms ${r.renderMs.toFixed(0).padStart(4)}ms`,
  );
  if (!(r.peak < 0.9)) fail.push(`${r.id}#${r.variant} dry peak ${r.peak.toFixed(3)} >= 0.9`);
  if (!(r.mixPeak < 0.9)) fail.push(`${r.id}#${r.variant} mixed peak ${r.mixPeak.toFixed(3)} >= 0.9`);
  if (!(r.peak > 0.05)) fail.push(`${r.id}#${r.variant} is nearly silent (peak ${r.peak.toFixed(4)})`);
  if (!(r.tailPeak < 0.003)) fail.push(`${r.id}#${r.variant} still sounding after its ${r.length}s slot (${r.tailPeak.toFixed(4)})`);
  const maxOnset = r.id === 'undo' ? 0.3 : 0.03;
  if (!(r.onset >= 0 && r.onset < maxOnset)) fail.push(`${r.id}#${r.variant} starts late (${r.onset}s)`);
}
console.log(`batch pre-render: ${sfx.batchCount} buffers, ${sfx.batchSeconds.toFixed(1)} s of audio in ${sfx.batchMs.toFixed(0)} ms`);
for (const [name, b64] of Object.entries(sfx.wavs)) wav(name, b64, 2);

// ---------- music ----------
console.log('\nMusic (20 s through the mix)');
for (const [label, seed, vol] of [
  ['full volume', 1, 1],
  ['default volume (0.5)', 2, 0.5],
  ['another seed', 3, 1],
]) {
  const m = await page.evaluate(([s, v]) => window.__audio.renderMusic(20, s, v), [seed, vol]);
  const quiet = m.perSecond.slice(1, 20).filter((x) => x < 2e-4).length;
  console.log(
    `${label.padEnd(22)} peak ${db(m.peak)}  rms ${db(m.rms)}  loudest50ms ${db(m.loudRms)}  silent seconds ${quiet}  nodes ${m.nodes} (${(m.nodes / m.seconds).toFixed(1)}/s)  render ${m.renderMs.toFixed(0)} ms for ${m.seconds}s`,
  );
  console.log('   per-second rms dB: ' + m.perSecond.map((x) => db(x).trim()).join(' '));
  if (!(m.peak < 0.9)) fail.push(`music (${label}) peak ${m.peak.toFixed(3)}`);
  if (!(m.rms > 0.004)) fail.push(`music (${label}) too quiet: rms ${m.rms.toFixed(5)}`);
  if (quiet > 0) fail.push(`music (${label}) has ${quiet} silent seconds`);
  if (m.nodes / m.seconds > 60) fail.push(`music creates ${(m.nodes / m.seconds).toFixed(0)} nodes/s`);
  wav(`music-seed${seed}-vol${vol}`, m.pcm, 2);
}

// ---------- ambience ----------
console.log('\nAmbience (20 s through the mix at full volume; levels after the 4 s fade-in)');
const scenes = [
  ['day-empty', { population: 0, night: 0, paused: false }],
  ['day-town', { population: 3000, night: 0, paused: false }],
  ['night-town', { population: 3000, night: 1, paused: false }],
  ['night-metropolis', { population: 12000, night: 1, paused: false }],
  ['day-town-paused', { population: 3000, night: 0, paused: true }],
];
const amb = {};
for (const [name, params] of scenes) {
  const a = await page.evaluate(([p, s]) => window.__audio.renderAmbience(20, p, s), [params, 11]);
  amb[name] = a;
  const quiet = a.perSecond.slice(4).filter((x) => x < 1e-4).length;
  console.log(`${name.padEnd(18)} peak ${db(a.peak)}  rms ${db(a.rms)}  loudest50ms ${db(a.loudRms)}  silent seconds ${quiet}  render ${a.renderMs.toFixed(0)} ms`);
  if (!(a.peak < 0.9)) fail.push(`ambience ${name} peak ${a.peak.toFixed(3)}`);
  if (!(a.rms > 0.002)) fail.push(`ambience ${name} too quiet: rms ${a.rms.toFixed(5)}`);
  if (quiet > 0) fail.push(`ambience ${name} has ${quiet} silent seconds`);
  wav(`ambience-${name}`, a.pcm, 2);
}
if (!(amb['day-town-paused'].rms < amb['day-town'].rms * 0.6)) fail.push('paused ambience is not quieter');

// ---------- worst case ----------
const w = await page.evaluate(() => window.__audio.renderWorstCase(14));
console.log(`\nWorst case (all at full volume, effect every 0.12 s, big city): peak ${db(w.peak)} (${w.peak.toFixed(3)})  rms ${db(w.rms)}`);
if (!(w.peak < 0.9)) fail.push(`worst case peak ${w.peak.toFixed(3)} >= 0.9`);
wav('worst-case', w.pcm, 2);

// ---------- live engine ----------
const rt = await page.evaluate(() => window.__audio.realtime());
console.log(`\nLive engine: ${JSON.stringify(rt.s1)}  ${rt.nodesPerSecond.toFixed(1)} nodes/s while busy, max ${rt.maxVoices} effect voices, states ${JSON.stringify(rt.states)}`);
fail.push(...rt.fail);
if (rt.nodesPerSecond > 150) fail.push(`live engine creates ${rt.nodesPerSecond.toFixed(0)} nodes/s`);

await browser.close();
fail.push(...pageErrors.map((e) => `page error: ${e}`));
console.log(`\nWAV files in ${out}`);
if (fail.length) {
  console.error('\nFAIL:\n' + fail.join('\n'));
  process.exit(1);
}
console.log('audio check passed');
