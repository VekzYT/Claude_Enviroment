// Small Web Audio helpers shared by the sound effects, ambience and music. Everything takes a
// BaseAudioContext so the same code renders live (AudioContext) and offline (OfflineAudioContext).

export type Rng = () => number;

/** MIDI note number to frequency in Hz (69 = A4 = 440 Hz). */
export function mtof(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Uniform float in [a, b). */
export function rr(rng: Rng, a: number, b: number): number {
  return a + (b - a) * rng();
}

/** Picks one element. */
export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}

/** Picks an index using relative weights. */
export function weighted(rng: Rng, weights: readonly number[]): number {
  let total = 0;
  for (const w of weights) total += w;
  let r = rng() * total;
  for (let k = 0; k < weights.length; k++) {
    r -= weights[k];
    if (r < 0) return k;
  }
  return weights.length - 1;
}

/**
 * A percussive gain envelope: silent, up to `peak` in `attack` seconds, then an exponential fall to
 * silence over `decay` seconds. Returns the time it is fully silent.
 */
export function perc(param: AudioParam, t: number, peak: number, attack: number, decay: number): number {
  const a = Math.max(0.0005, attack);
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + a);
  param.exponentialRampToValueAtTime(Math.max(peak * 0.0005, 1e-6), t + a + decay);
  param.linearRampToValueAtTime(0, t + a + decay + 0.005);
  return t + a + decay + 0.006;
}

/**
 * Attack / hold / release envelope for sustained notes: rises to `peak` in `attack`, holds until
 * `releaseAt`, then falls to silence over `release`. Returns the silent time.
 */
export function asr(param: AudioParam, t: number, peak: number, attack: number, releaseAt: number, release: number): number {
  const top = Math.max(t + 0.001, Math.min(releaseAt, t + attack));
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, top);
  const r0 = Math.max(top, releaseAt);
  param.setValueAtTime(peak, r0);
  // A setTarget curve gives a natural release. With tau = release/6 it is at -36 dB after
  // `release` and at -73 dB (inaudible) when it is finally set to zero at 1.4 x release.
  param.setTargetAtTime(0, r0, release / 6);
  param.setValueAtTime(0, r0 + release * 1.4);
  return r0 + release * 1.4 + 0.01;
}

/** Exponential frequency glide (both values must be > 0). */
export function glide(param: AudioParam, t: number, from: number, to: number, time: number): void {
  param.setValueAtTime(from, t);
  param.exponentialRampToValueAtTime(to, t + Math.max(0.001, time));
}

export function gainNode(ctx: BaseAudioContext, value = 0): GainNode {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
}

export function osc(ctx: BaseAudioContext, type: OscillatorType | PeriodicWave, freq: number): OscillatorNode {
  const o = ctx.createOscillator();
  if (typeof type === 'string') o.type = type as OscillatorType;
  else o.setPeriodicWave(type);
  o.frequency.value = freq;
  return o;
}

export function biquad(ctx: BaseAudioContext, type: BiquadFilterType, freq: number, q = 0.7071): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/**
 * Updates a parameter once per 128-sample block instead of every sample. For slowly moving
 * parameters (LFOs on filter cutoffs, pans, sweeps over seconds) this sounds the same and saves a
 * lot of work: a biquad with a per-sample cutoff recomputes its coefficients every sample.
 * Ignored where automationRate is not supported.
 */
export function kRate(...params: AudioParam[]): void {
  for (const p of params) {
    try {
      (p as AudioParam & { automationRate?: string }).automationRate = 'k-rate';
    } catch {
      // not supported or not allowed for this parameter: stays a-rate
    }
  }
}

/** A stereo panner, or a plain pass-through gain where StereoPannerNode is missing. */
export function panner(ctx: BaseAudioContext, pan: number): AudioNode & { pan?: AudioParam } {
  if (typeof ctx.createStereoPanner === 'function') {
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    return p;
  }
  return gainNode(ctx, 1);
}

/** Starts a source at `t` and stops it at `end`, disconnecting it afterwards so it can be collected. */
export function play(src: AudioScheduledSourceNode, t: number, end: number): void {
  src.start(t);
  src.stop(end);
}

/** Disconnects a node when a source ends (keeps long-running graphs from accumulating). */
export function disconnectOnEnd(src: AudioScheduledSourceNode, ...nodes: AudioNode[]): void {
  src.onended = () => {
    try {
      src.disconnect();
      for (const n of nodes) n.disconnect();
    } catch {
      // already disconnected
    }
  };
}
