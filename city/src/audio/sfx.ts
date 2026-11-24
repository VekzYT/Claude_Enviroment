// The sound effects: one small synthesis recipe per SfxId. A cohesive "toy" palette: soft sines
// and tuned bells, wooden thumps, filtered-noise crunches; nothing harsh or buzzy.
//
// A recipe schedules a few nodes into any BaseAudioContext, so it can play live or render into an
// OfflineAudioContext. The engine renders every recipe (in a few variants) into AudioBuffers once
// after unlock, and from then on plays each effect as one BufferSource with a slightly random
// playback rate and level, which is both the cheapest way to play them and keeps repeats from
// sounding identical.
import { hash01, makeRng } from '../core/rng';
import type { SfxId } from '../core/types';
import { bassWave, malletBuffer, malletRate, noiseBuffer, padWave } from './buffers';
import { asr, biquad, gainNode, glide, mtof, osc, perc, pick, play, rr, type Rng } from './util';

/** Schedules one effect starting at `t` into `out`. Everything must be silent by t + spec.length. */
export type Recipe = (ctx: BaseAudioContext, out: AudioNode, t: number, rng: Rng) => void;

export interface SfxSpec {
  /** Seconds the effect may last (the render slot). */
  length: number;
  /** Pre-rendered variations (different random details). */
  variants: number;
  /** Minimum milliseconds between two plays of this effect; extra requests are dropped. */
  gapMs: number;
  /** Random pitch variation, ± cents. */
  cents: number;
  recipe: Recipe;
}

// ---------------------------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------------------------

interface ToneOpts {
  type?: OscillatorType | PeriodicWave;
  f: number;
  /** Glide target frequency. */
  f2?: number;
  glideTime?: number;
  peak: number;
  attack: number;
  decay: number;
}

/** One enveloped oscillator. Returns when it is silent. */
function tone(ctx: BaseAudioContext, out: AudioNode, t: number, o: ToneOpts): number {
  const src = osc(ctx, o.type ?? 'sine', o.f);
  if (o.f2 !== undefined) glide(src.frequency, t, o.f, o.f2, o.glideTime ?? o.decay);
  const g = gainNode(ctx);
  const end = perc(g.gain, t, o.peak, o.attack, o.decay);
  src.connect(g).connect(out);
  play(src, t, end);
  return end;
}

interface NoiseOpts {
  filter: BiquadFilterType;
  f: number;
  f2?: number;
  sweep?: number;
  q?: number;
  peak: number;
  attack: number;
  decay: number;
}

/** A burst of filtered noise from the shared noise loop, starting at a random point in it. */
function noise(ctx: BaseAudioContext, out: AudioNode, t: number, rng: Rng, o: NoiseOpts): number {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const flt = biquad(ctx, o.filter, o.f, o.q ?? 0.7071);
  if (o.f2 !== undefined) glide(flt.frequency, t, o.f, o.f2, o.sweep ?? o.decay);
  const g = gainNode(ctx);
  const end = perc(g.gain, t, o.peak, o.attack, o.decay);
  src.connect(flt).connect(g).connect(out);
  src.start(t, rng() * 2);
  src.stop(end);
  return end;
}

/** A struck bell / chime: a few partials, upper ones fading faster. */
function bell(
  ctx: BaseAudioContext,
  out: AudioNode,
  t: number,
  f: number,
  peak: number,
  decay: number,
  partials: ReadonlyArray<readonly [ratio: number, amp: number, decayScale: number]> = [
    [1, 1, 1],
    [2, 0.22, 0.45],
    [3, 0.07, 0.25],
  ],
): void {
  for (const [ratio, amp, k] of partials) {
    tone(ctx, out, t, { f: f * ratio, peak: peak * amp, attack: 0.003, decay: decay * k });
  }
}

/** A small, bright metallic clank (inharmonic partials plus a tick). */
function clank(ctx: BaseAudioContext, out: AudioNode, t: number, rng: Rng, base: number, peak: number): void {
  const ratios = [1, 2.41, 3.77, 5.33];
  const amps = [1, 0.62, 0.4, 0.24];
  const decays = [0.2, 0.13, 0.085, 0.055];
  for (let k = 0; k < ratios.length; k++) {
    tone(ctx, out, t, { f: base * ratios[k], peak: peak * amps[k], attack: 0.001, decay: decays[k] });
  }
  noise(ctx, out, t, rng, { filter: 'highpass', f: 3500, peak: peak * 0.6, attack: 0.0005, decay: 0.012 });
}

/** One note of the C5-sampled mallet, re-pitched, faded out by `end`. */
function mallet(ctx: BaseAudioContext, out: AudioNode, t: number, midi: number, peak: number, end: number): void {
  const src = ctx.createBufferSource();
  src.buffer = malletBuffer(ctx, 'marimba');
  src.playbackRate.value = malletRate(midi);
  const g = gainNode(ctx, peak);
  g.gain.setValueAtTime(peak, Math.max(t, end - 0.25));
  g.gain.linearRampToValueAtTime(0, end);
  src.connect(g).connect(out);
  play(src, t, end);
}

// ---------------------------------------------------------------------------------------------
// The effects
// ---------------------------------------------------------------------------------------------

const PENTA_HIGH = [96, 98, 100, 103, 105, 108]; // C7 D7 E7 G7 A7 C8

export const SFX: Record<SfxId, SfxSpec> = {
  // A small wooden tick for buttons.
  click: {
    length: 0.08,
    variants: 3,
    gapMs: 35,
    cents: 60,
    recipe(ctx, out, t, rng) {
      const f = rr(rng, 1700, 1900);
      tone(ctx, out, t, { f, f2: f * 0.72, glideTime: 0.03, peak: 0.3, attack: 0.0008, decay: 0.04 });
      tone(ctx, out, t, { f: f * 2.71, peak: 0.06, attack: 0.0005, decay: 0.01 });
      noise(ctx, out, t, rng, { filter: 'highpass', f: 4200, peak: 0.05, attack: 0.0004, decay: 0.006 });
    },
  },

  // Picking a tool: a rounded upward "bloop".
  tool: {
    length: 0.2,
    variants: 2,
    gapMs: 60,
    cents: 35,
    recipe(ctx, out, t, rng) {
      const f = mtof(74) * rr(rng, 0.99, 1.01); // D5
      tone(ctx, out, t, { f, f2: f * 1.5, glideTime: 0.05, peak: 0.3, attack: 0.004, decay: 0.13 });
      tone(ctx, out, t, { f: f * 2, f2: f * 3, glideTime: 0.05, peak: 0.05, attack: 0.003, decay: 0.06 });
      noise(ctx, out, t, rng, { filter: 'bandpass', f: 2400, q: 1.2, peak: 0.04, attack: 0.0005, decay: 0.01 });
    },
  },

  // Laying road: a soft asphalt "thunk", felt more than heard.
  road: {
    length: 0.3,
    variants: 3,
    gapMs: 70,
    cents: 70,
    recipe(ctx, out, t, rng) {
      const f = rr(rng, 150, 170);
      tone(ctx, out, t, { f, f2: f * 0.37, glideTime: 0.13, peak: 0.55, attack: 0.002, decay: 0.2 });
      tone(ctx, out, t, { f: f * 2, f2: f * 0.74, glideTime: 0.11, peak: 0.2, attack: 0.002, decay: 0.12 });
      noise(ctx, out, t, rng, { filter: 'lowpass', f: rr(rng, 900, 1300), q: 0.8, peak: 0.38, attack: 0.001, decay: 0.07 });
      noise(ctx, out, t + 0.004, rng, { filter: 'bandpass', f: rr(rng, 2200, 3000), q: 1.3, peak: 0.07, attack: 0.001, decay: 0.025 });
    },
  },

  // Zoning: a soft two-note chime, always a perfect fifth so it sits with the music.
  zone: {
    length: 0.85,
    variants: 3,
    gapMs: 80,
    cents: 12,
    recipe(ctx, out, t, rng) {
      const root = pick(rng, [84, 86, 88]); // C6, D6, E6
      bell(ctx, out, t, mtof(root), 0.2, 0.42);
      bell(ctx, out, t + 0.055, mtof(root + 7), 0.15, 0.5);
    },
  },

  // Placing a building: a low thud and two small clanks, like a toy block landing on a toy crane.
  build: {
    length: 0.7,
    variants: 3,
    gapMs: 100,
    cents: 45,
    recipe(ctx, out, t, rng) {
      const f = rr(rng, 120, 135);
      tone(ctx, out, t, { f, f2: f * 0.38, glideTime: 0.18, peak: 0.6, attack: 0.002, decay: 0.3 });
      tone(ctx, out, t, { f: f * 2, f2: f * 0.76, glideTime: 0.15, peak: 0.2, attack: 0.002, decay: 0.14 });
      noise(ctx, out, t, rng, { filter: 'lowpass', f: 700, q: 0.9, peak: 0.35, attack: 0.001, decay: 0.1 });
      const base = rr(rng, 560, 650);
      clank(ctx, out, t + 0.075, rng, base, 0.12);
      clank(ctx, out, t + 0.2, rng, base * 1.13, 0.06);
    },
  },

  // Bulldozing: a crunchy burst of grit over a low rumble.
  bulldoze: {
    length: 0.6,
    variants: 3,
    gapMs: 90,
    cents: 80,
    recipe(ctx, out, t, rng) {
      noise(ctx, out, t, rng, { filter: 'lowpass', f: 240, q: 0.9, peak: 0.55, attack: 0.008, decay: 0.38 });
      tone(ctx, out, t, { f: 95, f2: 42, glideTime: 0.15, peak: 0.35, attack: 0.002, decay: 0.2 });
      const grains = 8 + Math.floor(rng() * 3);
      const times = Array.from({ length: grains }, (_, k) => (k === 0 ? 0 : rng() * 0.3)).sort((a, b) => a - b);
      for (const dt of times) {
        noise(ctx, out, t + dt, rng, {
          filter: 'bandpass',
          f: rr(rng, 600, 2800),
          q: rr(rng, 0.8, 2),
          peak: rr(rng, 0.14, 0.3) * (1 - dt * 1.6),
          attack: 0.001,
          decay: rr(rng, 0.015, 0.05),
        });
      }
    },
  },

  // Not allowed: a soft, low two-note "bu-boop" downwards. Rounded, never a buzzer.
  denied: {
    length: 0.42,
    variants: 1,
    gapMs: 250,
    cents: 15,
    recipe(ctx, out, t) {
      const lp = biquad(ctx, 'lowpass', 900, 0.6);
      lp.connect(out);
      for (const [dt, a, b, peak, decay] of [
        [0, 63, 62, 0.22, 0.11],
        [0.12, 58, 57, 0.26, 0.22],
      ] as const) {
        tone(ctx, lp, t + dt, { type: 'triangle', f: mtof(a), f2: mtof(b), glideTime: decay, peak, attack: 0.012, decay });
        tone(ctx, lp, t + dt, { f: mtof(a - 12), peak: peak * 0.4, attack: 0.012, decay });
      }
    },
  },

  // Money: a metallic tick and two sweet bells a major third apart.
  cash: {
    length: 0.75,
    variants: 2,
    gapMs: 120,
    cents: 12,
    recipe(ctx, out, t, rng) {
      noise(ctx, out, t, rng, { filter: 'highpass', f: 5000, peak: 0.08, attack: 0.0005, decay: 0.012 });
      const metal: ReadonlyArray<readonly [number, number, number]> = [
        [1, 1, 1],
        [2, 0.3, 0.4],
        [4.2, 0.08, 0.15],
      ];
      bell(ctx, out, t + 0.004, mtof(91), 0.2, 0.42, metal); // G6
      bell(ctx, out, t + 0.04, mtof(95), 0.17, 0.55, metal); // B6
      tone(ctx, out, t + 0.07, { f: mtof(107), peak: 0.025, attack: 0.002, decay: 0.14 }); // B7 shimmer
    },
  },

  // A new milestone: a rising arpeggio landing on a warm, bright chord with sparkles. ~1.7 s.
  milestone: {
    length: 2.2,
    variants: 1,
    gapMs: 1500,
    cents: 0,
    recipe(ctx, dest, t, rng) {
      // Built at full scale, then trimmed as a whole so it sits just above the other effects.
      const out = gainNode(ctx, 0.7);
      out.connect(dest);
      const arp = [72, 76, 79, 84, 88];
      const stop = t + 2.15;
      arp.forEach((m, k) => mallet(ctx, out, t + k * 0.085, m, 0.3 + k * 0.025, stop));
      arp.forEach((m, k) => tone(ctx, out, t + k * 0.085, { f: mtof(m + 12), peak: 0.025, attack: 0.002, decay: 0.12 }));

      // The chord: soft-saw voices through a lowpass that opens and settles, like a gentle horn section.
      const t0 = t + 0.43;
      const hold = t0 + 0.85;
      const lp = biquad(ctx, 'lowpass', 700, 0.9);
      lp.frequency.setValueAtTime(700, t0);
      lp.frequency.linearRampToValueAtTime(3200, t0 + 0.08);
      lp.frequency.exponentialRampToValueAtTime(1300, t0 + 0.9);
      const chordGain = gainNode(ctx);
      const end = asr(chordGain.gain, t0, 1, 0.05, hold, 0.55);
      lp.connect(chordGain).connect(out);
      const wave = padWave(ctx);
      for (const m of [60, 67, 72, 74, 76]) {
        for (const det of [-7, 7]) {
          const o = osc(ctx, wave, mtof(m));
          o.detune.value = det;
          const v = gainNode(ctx, 0.026);
          o.connect(v).connect(lp);
          play(o, t0, end);
        }
      }
      const bass = osc(ctx, bassWave(ctx), mtof(48));
      const bg = gainNode(ctx);
      asr(bg.gain, t0, 0.14, 0.03, hold, 0.5);
      bass.connect(bg).connect(out);
      play(bass, t0, end);
      mallet(ctx, out, t0, 84, 0.26, stop);
      mallet(ctx, out, t0, 72, 0.2, stop);

      // Sparkles above the chord, fading out.
      for (let k = 0; k < 7; k++) {
        const dt = 0.47 + k * 0.12 + rng() * 0.05;
        tone(ctx, out, t + dt, { f: mtof(pick(rng, PENTA_HIGH)), peak: 0.05 * (1 - k / 9), attack: 0.002, decay: 0.12 });
      }
    },
  },

  // A lot grew: two or three tiny high pings.
  grow: {
    length: 0.3,
    variants: 4,
    gapMs: 333,
    cents: 30,
    recipe(ctx, out, t, rng) {
      const count = 2 + Math.floor(rng() * 2);
      let k0 = Math.floor(rng() * 3);
      for (let k = 0; k < count; k++) {
        const m = PENTA_HIGH[Math.min(PENTA_HIGH.length - 1, k0)];
        k0 += 1 + Math.floor(rng() * 2);
        tone(ctx, out, t + k * 0.055, { f: mtof(m), peak: 0.11 - k * 0.025, attack: 0.002, decay: 0.07 });
        tone(ctx, out, t + k * 0.055, { f: mtof(m) * 2, peak: 0.015, attack: 0.002, decay: 0.03 });
      }
    },
  },

  // Undo: a swoosh played "backwards" (swells up, then stops), sweeping down like a rewind.
  undo: {
    length: 0.36,
    variants: 1,
    gapMs: 120,
    cents: 30,
    recipe(ctx, out, t, rng) {
      const dur = 0.28;
      const swell = (peak: number) => {
        const g = gainNode(ctx);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + dur);
        g.gain.linearRampToValueAtTime(0, t + dur + 0.035);
        return g;
      };
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      src.loop = true;
      const bp = biquad(ctx, 'bandpass', 3000, 1.6);
      glide(bp.frequency, t, 3200, 650, dur);
      src.connect(bp).connect(swell(0.5)).connect(out);
      src.start(t, rng() * 2);
      src.stop(t + dur + 0.04);
      const o = osc(ctx, 'sine', 1200);
      glide(o.frequency, t, 1200, 520, dur);
      o.connect(swell(0.09)).connect(out);
      play(o, t, t + dur + 0.04);
    },
  },

  // A panel opening: a little bubble "pop" upwards.
  open: {
    length: 0.13,
    variants: 2,
    gapMs: 80,
    cents: 40,
    recipe(ctx, out, t, rng) {
      const f = rr(rng, 400, 440);
      tone(ctx, out, t, { f, f2: f * 2.3, glideTime: 0.05, peak: 0.28, attack: 0.002, decay: 0.07 });
      tone(ctx, out, t, { f: f * 2, f2: f * 4.6, glideTime: 0.05, peak: 0.035, attack: 0.002, decay: 0.04 });
    },
  },

  // A panel closing: the same pop, downwards.
  close: {
    length: 0.13,
    variants: 2,
    gapMs: 80,
    cents: 40,
    recipe(ctx, out, t, rng) {
      const f = rr(rng, 880, 940);
      tone(ctx, out, t, { f, f2: f * 0.44, glideTime: 0.06, peak: 0.26, attack: 0.002, decay: 0.075 });
    },
  },

  // A new month: a quiet paper tick.
  month: {
    length: 0.12,
    variants: 2,
    gapMs: 400,
    cents: 50,
    recipe(ctx, out, t, rng) {
      noise(ctx, out, t, rng, { filter: 'bandpass', f: rr(rng, 3400, 4200), q: 0.9, peak: 0.14, attack: 0.0008, decay: 0.018 });
      noise(ctx, out, t + 0.01, rng, { filter: 'highpass', f: 5500, peak: 0.04, attack: 0.02, decay: 0.05 });
      tone(ctx, out, t, { f: rr(rng, 1250, 1400), peak: 0.035, attack: 0.001, decay: 0.03 });
    },
  },
};

export const SFX_IDS = Object.keys(SFX) as SfxId[];

/** A stable seed per effect and variant, so renders are repeatable. */
export function sfxSeed(id: SfxId, variant: number): number {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) | 0;
  return Math.floor(hash01(h, variant, 7) * 0x7fffffff) + 1;
}

// ---------------------------------------------------------------------------------------------
// Offline rendering
// ---------------------------------------------------------------------------------------------

type OfflineCtor = new (channels: number, length: number, sampleRate: number) => OfflineAudioContext;

export function offlineContextCtor(): OfflineCtor | null {
  const g = globalThis as unknown as { OfflineAudioContext?: OfflineCtor; webkitOfflineAudioContext?: OfflineCtor };
  return g.OfflineAudioContext ?? g.webkitOfflineAudioContext ?? null;
}

/** Renders an offline context, supporting both the promise and the older event form. */
export function renderOffline(ctx: OfflineAudioContext): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    ctx.oncomplete = (e) => resolve(e.renderedBuffer);
    try {
      const p = ctx.startRendering() as Promise<AudioBuffer> | undefined;
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Renders every variant of the given effects into AudioBuffers, all in one offline pass (one
 * context, effects laid end to end, then sliced). Trailing silence is trimmed.
 */
export async function prerenderSfx(sampleRate: number, ids: readonly SfxId[] = SFX_IDS): Promise<Map<SfxId, AudioBuffer[]>> {
  const Offline = offlineContextCtor();
  if (!Offline) throw new Error('OfflineAudioContext is not available');
  const gap = 0.02;
  const slots: Array<{ id: SfxId; variant: number; start: number }> = [];
  let cursor = gap;
  for (const id of ids) {
    for (let v = 0; v < SFX[id].variants; v++) {
      slots.push({ id, variant: v, start: cursor });
      cursor += SFX[id].length + gap;
    }
  }
  const ctx = new Offline(1, Math.ceil(cursor * sampleRate), sampleRate);
  for (const s of slots) SFX[s.id].recipe(ctx, ctx.destination, s.start, makeRng(sfxSeed(s.id, s.variant)));
  const rendered = await renderOffline(ctx);
  const data = rendered.getChannelData(0);
  const out = new Map<SfxId, AudioBuffer[]>();
  for (const s of slots) {
    const i0 = Math.round(s.start * sampleRate);
    let n = Math.min(Math.round(SFX[s.id].length * sampleRate), data.length - i0);
    while (n > 1 && Math.abs(data[i0 + n - 1]) < 1e-4) n--;
    const buf = ctx.createBuffer(1, Math.max(1, n), sampleRate);
    buf.getChannelData(0).set(data.subarray(i0, i0 + n));
    const list = out.get(s.id) ?? [];
    list.push(buf);
    out.set(s.id, list);
  }
  return out;
}
