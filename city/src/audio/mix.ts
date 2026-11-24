// The mixing graph, shared by the live engine and the offline tests so both sound the same:
//
//   sfx ─────────────────┐
//   ambience (dry) ──────┤
//   music (dry) ─ duck ──┼─ master ─ compressor ─ trim ─ destination
//   reverb ◄─ sends ─────┘    (music, ambience and a touch of sfx send into one shared reverb)
import { reverbBuffer } from './buffers';
import { biquad, gainNode } from './util';

/** Bus levels at full volume. The music is deliberately modest: it should sit under the game. */
export const SFX_LEVEL = 0.9;
export const AMBIENCE_LEVEL = 1.05;
export const MUSIC_LEVEL = 1.9;
const SFX_REVERB_SEND = 0.08;
const REVERB_RETURN = 0.55;
/** Final trim after the compressor (its automatic make-up gain lifts everything a little). */
const OUTPUT_TRIM = 0.8;

export interface MixGraph {
  /** Fades everything (used around suspend/resume). */
  master: GainNode;
  sfx: GainNode;
  ambience: GainNode;
  ambienceWet: GainNode;
  music: GainNode;
  musicWet: GainNode;
  /** Lowers the music briefly under big moments (milestones). */
  duck: GainNode;
  reverb: ConvolverNode;
  compressor: DynamicsCompressorNode;
}

/** Slider position (0..1) to gain: squared, which feels even across the slider's travel. */
export function volumeCurve(v: number): number {
  const x = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
  return x * x;
}

export function buildMixGraph(ctx: BaseAudioContext): MixGraph {
  const trim = gainNode(ctx, OUTPUT_TRIM);
  trim.connect(ctx.destination);
  // A gentle bus compressor: glues the mix and catches the odd pile-up of effects.
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.knee.value = 10;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.25;
  compressor.connect(trim);
  const master = gainNode(ctx, 1);
  master.connect(compressor);

  const reverb = ctx.createConvolver();
  const reverbIn = gainNode(ctx, 1);
  const reverbOut = gainNode(ctx, REVERB_RETURN);
  // Low frequencies stay dry: reverberant bass and thumps only make the mix muddy.
  const reverbHp = biquad(ctx, 'highpass', 240, 0.6);
  reverbIn.connect(reverbHp).connect(reverb).connect(reverbOut).connect(master);

  const sfx = gainNode(ctx, 0);
  sfx.connect(master);
  sfx.connect(gainNode(ctx, SFX_REVERB_SEND)).connect(reverbIn);

  const ambience = gainNode(ctx, 0);
  ambience.connect(master);
  const ambienceWet = gainNode(ctx, 0);
  ambienceWet.connect(reverbIn);

  const duck = gainNode(ctx, 1);
  duck.connect(master);
  const music = gainNode(ctx, 0);
  music.connect(duck);
  const musicWet = gainNode(ctx, 0);
  musicWet.connect(reverbIn);

  return { master, sfx, ambience, ambienceWet, music, musicWet, duck, reverb, compressor };
}

/** Fills the reverb (a couple of hundred thousand samples of maths, so done after unlock). */
export function attachReverb(ctx: BaseAudioContext, graph: MixGraph): void {
  if (!graph.reverb.buffer) graph.reverb.buffer = reverbBuffer(ctx);
}

/** Sets bus gains for slider positions, immediately (t < 0) or smoothly from time t. */
export function setMixVolumes(graph: MixGraph, sfx: number, music: number, t = -1): void {
  const s = volumeCurve(sfx);
  const m = volumeCurve(music);
  const set = (p: AudioParam, v: number) => {
    if (t < 0) p.value = v;
    else p.setTargetAtTime(v, t, 0.05);
  };
  set(graph.sfx.gain, SFX_LEVEL * s);
  set(graph.ambience.gain, AMBIENCE_LEVEL * s);
  set(graph.ambienceWet.gain, AMBIENCE_LEVEL * s);
  set(graph.music.gain, MUSIC_LEVEL * m);
  set(graph.musicWet.gain, MUSIC_LEVEL * m);
}
