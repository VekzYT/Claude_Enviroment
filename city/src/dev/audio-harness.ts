// Dev harness for the audio module (bundled by tools/dev/audio-check.mjs, run in Chromium).
// Renders every sound effect, the music and the ambience offline through the same code and mixing
// graph the game uses, measures levels, and exercises the live engine. Results go back to Node,
// which writes WAV files to .cache/audio/ and checks the numbers.
import type { SfxId } from '../core/types';
import { createAudio, type AudioStats } from '../audio/index';
import { Ambience, type AmbienceParams } from '../audio/ambience';
import { attachReverb, buildMixGraph, setMixVolumes } from '../audio/mix';
import { Music, type NoteEvent } from '../audio/music';
import { offlineContextCtor, prerenderSfx, renderOffline, SFX, SFX_IDS, sfxSeed } from '../audio/sfx';
import { makeRng } from '../core/rng';

const SR = 48000;

interface Levels {
  peak: number;
  rms: number;
  /** RMS over the loudest 50 ms window (how loud it feels). */
  loudRms: number;
  /** Seconds from start until the level first exceeds -40 dBFS. */
  onset: number;
}

function levels(channels: Float32Array[], from = 0, to = channels[0].length): Levels {
  let peak = 0;
  let sum = 0;
  let onset = -1;
  const n = Math.max(1, to - from);
  for (const ch of channels) {
    for (let i = from; i < to; i++) {
      const v = Math.abs(ch[i]);
      if (v > peak) peak = v;
      sum += ch[i] * ch[i];
      if (onset < 0 && v > 0.01) onset = (i - from) / SR;
    }
  }
  const win = Math.floor(0.05 * SR);
  let loud = 0;
  for (const ch of channels) {
    let acc = 0;
    for (let i = from; i < to; i++) {
      acc += ch[i] * ch[i];
      if (i - from >= win) acc -= ch[i - win] * ch[i - win];
      if (i - from >= win - 1) loud = Math.max(loud, acc / win);
    }
  }
  return { peak, rms: Math.sqrt(sum / (n * channels.length)), loudRms: Math.sqrt(loud), onset };
}

/** Per-second RMS, to find stretches of silence in long renders. */
function perSecond(channels: Float32Array[]): number[] {
  const out: number[] = [];
  for (let s = 0; (s + 1) * SR <= channels[0].length; s++) out.push(levels(channels, s * SR, (s + 1) * SR).rms);
  return out;
}

function channelsOf(buf: AudioBuffer): Float32Array[] {
  return Array.from({ length: buf.numberOfChannels }, (_, c) => buf.getChannelData(c));
}

/** 16-bit PCM, interleaved, base64 — for Node to wrap as a WAV file. */
function pcm16(channels: Float32Array[]): string {
  const n = channels[0].length;
  const bytes = new Uint8Array(n * channels.length * 2);
  const view = new DataView(bytes.buffer);
  let o = 0;
  for (let i = 0; i < n; i++) {
    for (const ch of channels) {
      const v = Math.max(-1, Math.min(1, ch[i]));
      view.setInt16(o, Math.round(v * 32767), true);
      o += 2;
    }
  }
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function offline(channels: number, seconds: number): OfflineAudioContext {
  const Offline = offlineContextCtor();
  if (!Offline) throw new Error('no OfflineAudioContext');
  return new Offline(channels, Math.ceil(seconds * SR), SR);
}

// ---------------------------------------------------------------------------------------------

/** Every effect and variant, dry (recipe only) and through the full mix at full volume. */
async function renderSfx(wavIds: SfxId[]) {
  const rows: Array<Record<string, unknown>> = [];
  const wavs: Record<string, string> = {};
  for (const id of SFX_IDS) {
    const spec = SFX[id];
    for (let v = 0; v < spec.variants; v++) {
      // Dry, with 0.5 s of extra room to prove the effect is silent by the end of its slot.
      const ctx = offline(1, spec.length + 0.5);
      spec.recipe(ctx, ctx.destination, 0.01, makeRng(sfxSeed(id, v)));
      const t0 = performance.now();
      const dry = await renderOffline(ctx);
      const ms = performance.now() - t0;
      const ch = channelsOf(dry);
      const end = Math.round((0.01 + spec.length) * SR);
      const all = levels(ch);
      const tail = levels(ch, end, ch[0].length);
      // Through the mix (compressor, reverb send, output trim) at full effects volume.
      const mctx = offline(2, spec.length + 2.5);
      const g = buildMixGraph(mctx);
      attachReverb(mctx, g);
      setMixVolumes(g, 1, 0);
      spec.recipe(mctx, g.sfx, 0.01, makeRng(sfxSeed(id, v)));
      const mixed = await renderOffline(mctx);
      const mix = levels(channelsOf(mixed));
      rows.push({
        id,
        variant: v,
        length: spec.length,
        peak: all.peak,
        rms: levels(ch, 0, end).rms,
        loudRms: all.loudRms,
        onset: all.onset,
        tailPeak: tail.peak,
        mixPeak: mix.peak,
        renderMs: ms,
      });
      if (v === 0 && wavIds.includes(id)) wavs[`sfx-${id}`] = pcm16(channelsOf(mixed));
    }
  }
  // The engine's real path: one batch render of all effects.
  const t0 = performance.now();
  const batch = await prerenderSfx(SR);
  const batchMs = performance.now() - t0;
  let batchSamples = 0;
  for (const list of batch.values()) for (const b of list) batchSamples += b.length;
  return { rows, wavs, batchMs, batchSeconds: batchSamples / SR, batchCount: [...batch.values()].reduce((s, l) => s + l.length, 0) };
}

/** `seconds` of music through the mix at the given music volume (optionally only some layers). */
async function renderMusic(seconds: number, seed: number, volume: number, layers?: Partial<Record<'melody' | 'arp' | 'pad' | 'bass', number>>) {
  const ctx = offline(2, seconds + 3);
  const g = buildMixGraph(ctx);
  attachReverb(ctx, g);
  setMixVolumes(g, 0, volume);
  let nodes = 0;
  const count = countNodes(ctx, () => nodes++);
  const music = new Music(ctx, g.music, g.musicWet, seed);
  const notes: NoteEvent[] = [];
  music.trace = (e) => notes.push(e);
  if (layers) music.setLayerLevels(layers);
  music.restart(0.05);
  while (music.nextTime < seconds) music.scheduleUntil(seconds);
  count();
  const t0 = performance.now();
  const buf = await renderOffline(ctx);
  const ms = performance.now() - t0;
  const ch = channelsOf(buf);
  return { ...levels(ch), perSecond: perSecond(ch), renderMs: ms, nodes, seconds: seconds + 3, pcm: pcm16(ch), notes };
}

/** Just the score: every note the music schedules over `seconds` (no rendering). */
function score(seconds: number, seed: number): NoteEvent[] {
  const ctx = offline(2, 1);
  const g = buildMixGraph(ctx);
  const music = new Music(ctx, g.music, g.musicWet, seed);
  const notes: NoteEvent[] = [];
  music.trace = (e) => notes.push(e);
  music.restart(0.05);
  while (music.nextTime < seconds) music.scheduleUntil(seconds);
  return notes;
}

/** `seconds` of ambience through the mix at full effects volume. */
async function renderAmbience(seconds: number, params: AmbienceParams, seed: number) {
  const ctx = offline(2, seconds);
  const g = buildMixGraph(ctx);
  attachReverb(ctx, g);
  setMixVolumes(g, 1, 0);
  const amb = new Ambience(ctx, g.ambience, g.ambienceWet, seed);
  amb.set(params, 0);
  // Offline, the time constants would start from silence: begin from the settled levels instead.
  amb.scheduleUntil(0, seconds);
  const t0 = performance.now();
  const buf = await renderOffline(ctx);
  const ms = performance.now() - t0;
  const ch = channelsOf(buf);
  const settled = levels(ch, Math.floor(4 * SR), ch[0].length);
  return { ...settled, perSecond: perSecond(ch), renderMs: ms, pcm: pcm16(ch) };
}

/** Worst case: everything at full volume, a big city, and an effect every 0.12 s. */
async function renderWorstCase(seconds: number) {
  const ctx = offline(2, seconds);
  const g = buildMixGraph(ctx);
  attachReverb(ctx, g);
  setMixVolumes(g, 1, 1);
  const amb = new Ambience(ctx, g.ambience, g.ambienceWet, 5);
  amb.set({ population: 12000, night: 0.5, paused: false }, 0);
  amb.scheduleUntil(0, seconds);
  const music = new Music(ctx, g.music, g.musicWet, 9);
  music.restart(0.05);
  while (music.nextTime < seconds) music.scheduleUntil(seconds);
  const rng = makeRng(77);
  for (let t = 1, k = 0; t < seconds - 2.5; t += 0.12, k++) {
    const id = SFX_IDS[k % SFX_IDS.length];
    SFX[id].recipe(ctx, g.sfx, t, rng);
  }
  const buf = await renderOffline(ctx);
  const ch = channelsOf(buf);
  return { ...levels(ch), pcm: pcm16(ch) };
}

/** Counts nodes created on a context (wraps its factory methods). Returns an undo function. */
function countNodes(ctx: BaseAudioContext, hit: () => void): () => void {
  const names = ['createGain', 'createOscillator', 'createBufferSource', 'createBiquadFilter', 'createStereoPanner', 'createConvolver', 'createDynamicsCompressor'] as const;
  const originals = names.map((n) => (ctx as unknown as Record<string, (...a: unknown[]) => unknown>)[n]);
  names.forEach((n, k) => {
    (ctx as unknown as Record<string, unknown>)[n] = (...a: unknown[]) => {
      hit();
      return originals[k].apply(ctx, a);
    };
  });
  return () => names.forEach((n) => delete (ctx as unknown as Record<string, unknown>)[n]);
}

/** The live engine in this page: unlock, play everything, ambience, volumes, suspend/resume. */
async function realtime() {
  const fail: string[] = [];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  type Dbg = ReturnType<typeof createAudio> & { stats(): AudioStats };

  // Count every node the live engine creates.
  const proto = (window.BaseAudioContext ?? window.AudioContext).prototype as unknown as Record<string, (...a: unknown[]) => unknown>;
  let created = 0;
  for (const n of ['createGain', 'createOscillator', 'createBufferSource', 'createBiquadFilter', 'createStereoPanner']) {
    const orig = proto[n];
    proto[n] = function (this: unknown, ...a: unknown[]) {
      created++;
      return orig.apply(this, a);
    };
  }

  const audio = createAudio() as Dbg;
  // Calls before unlock are harmless no-ops.
  audio.play('click');
  audio.setAmbience({ population: 500, night: 0, paused: false });
  audio.setVolumes(0.8, 0.5);
  audio.suspend();
  audio.resume();
  if (audio.stats().state !== 'locked') fail.push(`before unlock state is ${audio.stats().state}`);

  audio.unlock();
  audio.unlock(); // idempotent
  await sleep(1500);
  const s1 = audio.stats();
  if (s1.state !== 'running') fail.push(`after unlock state is ${s1.state}`);
  if (!s1.sfxReady) fail.push('effects were not pre-rendered within 1.5 s');
  if (!s1.musicOn) fail.push('music is not on at the default volume');

  // Play every effect twice in quick succession: the second is rate-limited for most.
  for (const id of SFX_IDS) {
    audio.play(id);
    audio.play(id);
    await sleep(20);
  }
  // Garbage in: unknown ids and bad numbers must not throw.
  audio.play('nope' as SfxId);
  audio.setVolumes(NaN, Infinity);
  audio.setAmbience({ population: -5, night: NaN, paused: false });
  audio.setAmbience(null as unknown as AmbienceParams);

  // Ten seconds of a busy evening: ambience changing, effects every 150 ms.
  const before = created;
  const t0 = performance.now();
  let maxVoices = 0;
  for (let k = 0; k < 66; k++) {
    audio.setAmbience({ population: 3000 + k * 50, night: (k / 66) * 0.8, paused: false });
    audio.play(SFX_IDS[k % SFX_IDS.length]);
    maxVoices = Math.max(maxVoices, audio.stats().voices);
    await sleep(150);
  }
  const secs = (performance.now() - t0) / 1000;
  const nodesPerSecond = (created - before) / secs;

  // Background and back.
  audio.suspend();
  await sleep(400);
  const sSusp = audio.stats().state;
  if (sSusp !== 'suspended') fail.push(`after suspend state is ${sSusp}`);
  audio.play('cash'); // ignored while suspended
  audio.resume();
  await sleep(400);
  const sRes = audio.stats().state;
  if (sRes !== 'running') fail.push(`after resume state is ${sRes}`);

  // The page going hidden fades and suspends even without suspend(); coming back resumes.
  const vis = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  document.dispatchEvent(new Event('visibilitychange'));
  await sleep(400);
  const sHidden = audio.stats().state;
  if (sHidden !== 'suspended') fail.push(`hidden page state is ${sHidden}`);
  delete (document as unknown as { visibilityState?: string }).visibilityState;
  if (vis && document.visibilityState !== 'visible') Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  document.dispatchEvent(new Event('visibilitychange'));
  await sleep(400);
  const sVisible = audio.stats().state;
  if (sVisible !== 'running') fail.push(`visible again state is ${sVisible}`);

  // Both volumes at zero: the context sleeps; turning one up wakes it.
  audio.setVolumes(0, 0);
  await sleep(400);
  const sMuted = audio.stats().state;
  if (sMuted !== 'suspended') fail.push(`muted state is ${sMuted}`);
  audio.setVolumes(0.5, 0);
  await sleep(400);
  if (audio.stats().state !== 'running') fail.push(`unmuted state is ${audio.stats().state}`);
  if (audio.stats().musicOn) fail.push('music still on at volume 0');
  audio.setVolumes(0.8, 0.5);
  await sleep(300);
  const sEnd = audio.stats();

  // An engine in a browser without Web Audio does nothing, quietly.
  const saved = { a: window.AudioContext, w: (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext };
  (window as unknown as { AudioContext?: unknown }).AudioContext = undefined;
  (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext = undefined;
  const silent = createAudio() as Dbg;
  try {
    silent.unlock();
    silent.play('build');
    silent.setAmbience({ population: 1, night: 1, paused: true });
    silent.setVolumes(1, 1);
    silent.suspend();
    silent.resume();
    if (silent.stats().state !== 'unavailable') fail.push(`no-audio engine state ${silent.stats().state}`);
  } catch (e) {
    fail.push(`no-audio engine threw: ${e}`);
  } finally {
    (window as unknown as { AudioContext?: unknown }).AudioContext = saved.a;
    (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext = saved.w;
  }

  return { fail, s1, sEnd, nodesPerSecond, maxVoices, states: { sSusp, sRes, sHidden, sVisible, sMuted } };
}

(window as unknown as { __audio: unknown }).__audio = { renderSfx, renderMusic, score, renderAmbience, renderWorstCase, realtime, SR };
