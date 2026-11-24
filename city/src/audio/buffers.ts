// Sample data computed in plain JavaScript once per audio context and reused by every voice:
// a noise loop, two mallet instruments (sampled once at C5 and re-pitched by playback rate), bird
// calls, cricket chirps, a reverb impulse response and two soft oscillator waveforms.
// Building buffers once and playing them through one BufferSource each is far cheaper than
// synthesising every note from oscillators, which keeps the audio thread light on the phone.
import { makeRng } from '../core/rng';

/** Mallet samples are generated at C5; other notes are played by changing the playback rate. */
export const MALLET_BASE_MIDI = 72;
const MALLET_BASE_HZ = 523.2511;

export type MalletKind = 'marimba' | 'keys';

interface Kit {
  noise: AudioBuffer;
  marimba: AudioBuffer;
  keys: AudioBuffer;
  birds: AudioBuffer[];
  crickets: AudioBuffer[];
  reverb: AudioBuffer;
  padWave: PeriodicWave;
  bassWave: PeriodicWave;
}

const kits = new WeakMap<BaseAudioContext, Partial<Kit>>();

function cached<K extends keyof Kit>(ctx: BaseAudioContext, key: K, make: () => Kit[K]): Kit[K] {
  let kit = kits.get(ctx);
  if (!kit) {
    kit = {};
    kits.set(ctx, kit);
  }
  let v = kit[key];
  if (v === undefined) {
    v = make();
    kit[key] = v;
  }
  return v as Kit[K];
}

function monoBuffer(ctx: BaseAudioContext, data: Float32Array): AudioBuffer {
  const buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
  buf.getChannelData(0).set(data);
  return buf;
}

/** Scales so the loudest sample is `peak`. */
function normalize(data: Float32Array, peak: number): Float32Array {
  let max = 0;
  for (let i = 0; i < data.length; i++) max = Math.max(max, Math.abs(data[i]));
  if (max > 0) {
    const k = peak / max;
    for (let i = 0; i < data.length; i++) data[i] *= k;
  }
  return data;
}

// ---------------------------------------------------------------------------------------------
// Noise
// ---------------------------------------------------------------------------------------------

/** 2.5 s of white noise (seamless when looped: white noise has no memory). */
export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  return cached(ctx, 'noise', () => {
    const n = Math.floor(ctx.sampleRate * 2.5);
    const data = new Float32Array(n);
    const rng = makeRng(0xc0ffee);
    for (let i = 0; i < n; i++) data[i] = rng() * 2 - 1;
    return monoBuffer(ctx, data);
  });
}

// ---------------------------------------------------------------------------------------------
// Mallets
// ---------------------------------------------------------------------------------------------

interface MalletPartial {
  ratio: number;
  amp: number;
  /** Seconds for the partial to fall by 1/e. */
  decay: number;
}

/** Sum of exponentially decaying sines with a soft attack: the sound of a struck bar or tine. */
function malletData(sr: number, partials: MalletPartial[], attack: number, seconds: number): Float32Array {
  const n = Math.floor(sr * seconds);
  const out = new Float32Array(n);
  for (const p of partials) {
    const f = MALLET_BASE_HZ * p.ratio;
    // Keep partials below Nyquist even when played ~2.3x faster than recorded.
    if (f * 2.3 > sr / 2) continue;
    const w = (2 * Math.PI * f) / sr;
    const c2 = 2 * Math.cos(w);
    const k = Math.exp(-1 / (p.decay * sr));
    // Sine by recurrence (y[n] = 2cos(w)y[n-1] - y[n-2]), much cheaper than Math.sin per sample.
    let y1 = 0;
    let y2 = -Math.sin(w);
    let env = p.amp;
    const last = Math.min(n, Math.ceil(p.decay * sr * 9));
    for (let i = 0; i < last; i++) {
      const y = c2 * y1 - y2;
      y2 = y1;
      y1 = y;
      out[i] += y * env;
      env *= k;
    }
  }
  const a = Math.max(1, Math.floor(attack * sr));
  for (let i = 0; i < a && i < n; i++) out[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / a);
  // A long, smooth taper over the last quarter so the note can always play to its end.
  const fade = Math.floor(n * 0.25);
  for (let i = 0; i < fade; i++) out[n - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fade);
  return normalize(out, 0.8);
}

/** A soft wooden marimba bar: strong fundamental, the bar's tuned 4th partial, a faint knock. */
export function malletBuffer(ctx: BaseAudioContext, kind: MalletKind): AudioBuffer {
  if (kind === 'keys') {
    return cached(ctx, 'keys', () =>
      monoBuffer(
        ctx,
        malletData(
          ctx.sampleRate,
          [
            { ratio: 1, amp: 1, decay: 1.25 },
            { ratio: 2, amp: 0.2, decay: 0.55 },
            { ratio: 3, amp: 0.05, decay: 0.3 },
            { ratio: 6.95, amp: 0.035, decay: 0.045 },
          ],
          0.005,
          4.2,
        ),
      ),
    );
  }
  return cached(ctx, 'marimba', () =>
    monoBuffer(
      ctx,
      malletData(
        ctx.sampleRate,
        [
          { ratio: 1, amp: 1, decay: 0.62 },
          { ratio: 3.98, amp: 0.2, decay: 0.12 },
          { ratio: 9.85, amp: 0.045, decay: 0.03 },
          { ratio: 0.5, amp: 0.04, decay: 0.25 },
        ],
        0.003,
        2.4,
      ),
    ),
  );
}

/** Playback rate that turns the C5 mallet sample into `midi`. */
export function malletRate(midi: number): number {
  return Math.pow(2, (midi - MALLET_BASE_MIDI) / 12);
}

// ---------------------------------------------------------------------------------------------
// Birds and crickets
// ---------------------------------------------------------------------------------------------

/**
 * Adds one swept, softly-enveloped whistle to `out`. `freq(x)` gives Hz for x in 0..1 across the
 * note. A faint second harmonic makes it sound less like a test tone.
 */
function whistle(out: Float32Array, sr: number, start: number, dur: number, amp: number, freq: (x: number) => number, shape = 1.5): void {
  const i0 = Math.floor(start * sr);
  const n = Math.floor(dur * sr);
  let phase = 0;
  for (let i = 0; i < n && i0 + i < out.length; i++) {
    const x = i / n;
    phase += (2 * Math.PI * freq(x)) / sr;
    const env = Math.pow(Math.sin(Math.PI * x), shape);
    out[i0 + i] += amp * env * (Math.sin(phase) + 0.1 * Math.sin(2 * phase));
  }
}

const expSweep = (a: number, b: number) => (x: number) => a * Math.pow(b / a, x);

export function birdBuffers(ctx: BaseAudioContext): AudioBuffer[] {
  return cached(ctx, 'birds', () => {
    const sr = ctx.sampleRate;
    const calls: Float32Array[] = [];
    const make = (seconds: number, draw: (out: Float32Array) => void) => {
      const out = new Float32Array(Math.floor(sr * seconds));
      draw(out);
      calls.push(normalize(out, 0.7));
    };
    // Rising "tsee-tsee-tsee".
    make(0.5, (o) => {
      for (let k = 0; k < 3; k++) whistle(o, sr, k * 0.15, 0.075, 1 - k * 0.15, expSweep(3100, 4300));
    });
    // A quick falling trill.
    make(0.5, (o) => {
      for (let k = 0; k < 9; k++) {
        const base = 5000 - k * 60;
        whistle(o, sr, k * 0.045, 0.03, 0.6 + 0.4 * Math.sin((k / 8) * Math.PI), expSweep(base, base * 0.74), 1.2);
      }
    });
    // Two clear notes, the second lower with a little vibrato.
    make(0.55, (o) => {
      whistle(o, sr, 0, 0.17, 1, expSweep(3650, 3500), 1.1);
      whistle(o, sr, 0.23, 0.25, 0.85, (x) => 2950 + 55 * Math.sin(2 * Math.PI * 9 * x * 0.25), 1.1);
    });
    // A bubbly warble.
    make(0.42, (o) => {
      whistle(o, sr, 0.01, 0.36, 1, (x) => 3150 + 430 * Math.sin(2 * Math.PI * 23 * x * 0.36), 1);
    });
    // "Chip, chip."
    make(0.3, (o) => {
      whistle(o, sr, 0, 0.04, 1, expSweep(4900, 3600), 1);
      whistle(o, sr, 0.13, 0.04, 0.8, expSweep(4800, 3550), 1);
    });
    return calls.map((c) => monoBuffer(ctx, c));
  });
}

export function cricketBuffers(ctx: BaseAudioContext): AudioBuffer[] {
  return cached(ctx, 'crickets', () => {
    const sr = ctx.sampleRate;
    const chirp = (pulses: number[], hz: number, period: number, width: number) => {
      const out = new Float32Array(Math.floor(sr * (pulses.length * period + 0.03)));
      pulses.forEach((amp, k) => {
        const f = hz * (1 - 0.012 * k);
        whistle(out, sr, 0.004 + k * period, width, amp, () => f, 2);
      });
      return monoBuffer(ctx, normalize(out, 0.6));
    };
    return [chirp([0.6, 1, 0.92, 0.75], 4650, 0.023, 0.014), chirp([0.7, 1, 0.8], 4250, 0.026, 0.016)];
  });
}

// ---------------------------------------------------------------------------------------------
// Reverb and waveforms
// ---------------------------------------------------------------------------------------------

/**
 * A warm room/hall impulse response: decaying stereo noise whose brightness falls over time
 * (high frequencies die first, as in a real room), after a short pre-delay.
 */
export function reverbBuffer(ctx: BaseAudioContext): AudioBuffer {
  return cached(ctx, 'reverb', () => {
    const sr = ctx.sampleRate;
    const seconds = 1.6;
    const rt60 = 1.5;
    const n = Math.floor(sr * seconds);
    const buf = ctx.createBuffer(2, n, sr);
    const pre = Math.floor(0.014 * sr);
    const fadeIn = Math.floor(0.01 * sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      const rng = makeRng(0x5eed + ch * 977);
      let y = 0;
      let env = 1;
      const fall = Math.exp(-6.9 / (rt60 * sr));
      let a = 0;
      for (let i = pre; i < n; i++) {
        const k = i - pre;
        if ((k & 63) === 0) {
          // The damping filter's cutoff falls from 7.5 kHz to 1.2 kHz; updated every 64 samples.
          const cutoff = 7500 * Math.pow(1200 / 7500, Math.min(1, k / sr / seconds));
          a = Math.exp((-2 * Math.PI * cutoff) / sr);
        }
        y = (1 - a) * (rng() * 2 - 1) + a * y;
        data[i] = y * env * (k < fadeIn ? k / fadeIn : 1);
        env *= fall;
      }
      const fade = Math.floor(0.1 * sr);
      for (let i = 0; i < fade; i++) data[n - 1 - i] *= i / fade;
    }
    return buf;
  });
}

function wave(ctx: BaseAudioContext, harmonics: number[]): PeriodicWave {
  const imag = new Float32Array([0, ...harmonics]);
  const real = new Float32Array(imag.length);
  return ctx.createPeriodicWave(real, imag);
}

/** A soft, rounded saw: harmonics rolling off quickly, for the warm pad. */
export function padWave(ctx: BaseAudioContext): PeriodicWave {
  return cached(ctx, 'padWave', () => wave(ctx, [1, 0.42, 0.22, 0.12, 0.065, 0.035, 0.018, 0.009]));
}

/** A sine with a touch of 2nd and 3rd harmonic so bass notes are audible on small speakers. */
export function bassWave(ctx: BaseAudioContext): PeriodicWave {
  return cached(ctx, 'bassWave', () => wave(ctx, [1, 0.38, 0.1]));
}
