// Calm generative background music. A soft mallet voice (marimba or mellow keys) over a warm
// pad and a quiet bass, moving through slow major-key progressions (I-vi-IV-V and friends) at
// 72-84 bpm, with a sparse pentatonic melody. It is organised as
//   piece   (a key, a tempo and a mallet voice; ~2-3 minutes)
//   section (one progression and one texture; ~20-30 s)
//   bar     (scheduled as a unit by the lookahead scheduler)
// and between pieces the pad breathes alone for two bars before moving to a related key, so the
// music keeps changing gently over minutes without ever stopping or jumping.
//
// It writes into any BaseAudioContext: the engine calls scheduleUntil() from a timer with a short
// lookahead; the offline test calls it once for 20 s and renders.
import { makeRng } from '../core/rng';
import { bassWave, malletBuffer, malletRate, padWave, type MalletKind } from './buffers';
import { asr, biquad, clamp, gainNode, kRate, mtof, osc, panner, pick, rr, weighted, type Rng } from './util';

type Texture = 'calm' | 'arp' | 'melody' | 'duet' | 'breath';

interface Section {
  prog: number[];
  barsPerChord: 1 | 2;
  bars: number;
  texture: Texture;
  /** Use add9 rather than maj7 colour on I and IV. */
  add9: boolean;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const PENTA = [0, 2, 4, 7, 9];
/** Keys that sit well in the mallet's range: C, D, Eb, F, G, Bb. Each has a neighbour a 4th/5th away. */
const KEYS = [0, 2, 3, 5, 7, 10];

/** Progressions as scale degrees (0 = I). All diatonic, all resolve softly. */
const PROGRESSIONS: number[][] = [
  [0, 5, 3, 4], // I vi IV V
  [0, 3, 5, 4], // I IV vi V
  [5, 3, 0, 4], // vi IV I V
  [0, 4, 5, 3], // I V vi IV
  [3, 0, 4, 5], // IV I V vi
  [0, 2, 3, 4], // I iii IV V
  [0, 3, 0, 4], // I IV I V
  [1, 4, 0, 5], // ii V I vi
  [0, 5, 1, 4], // I vi ii V
  [3, 4, 2, 5], // IV V iii vi
];

/** Rhythm cells for one bar of melody: [eighth-note slot, length in eighths]. */
const RHYTHMS: Array<Array<[number, number]>> = [
  [[0, 2], [2, 2], [4, 4]],
  [[0, 3], [3, 1], [4, 2], [6, 2]],
  [[0, 4], [4, 2], [6, 2]],
  [[0, 6], [6, 2]],
  [[2, 2], [4, 2], [6, 2]],
  [[0, 8]],
  [[0, 1], [1, 1], [2, 2], [4, 4]],
  [[0, 2], [3, 3], [6, 2]],
];
/** Which rhythm cells suit each bar of a four-bar phrase (question, answer, variation, rest). */
const PHRASE_RHYTHM_WEIGHTS = [
  [3, 3, 2, 1, 2, 0, 2, 2],
  [2, 1, 3, 3, 1, 1, 0, 2],
  [3, 3, 1, 1, 2, 0, 2, 2],
  [0, 0, 1, 3, 0, 4, 0, 0],
];

// Mix levels (the engine's music bus scales all of it).
const MELODY_GAIN = 0.42;
const ARP_GAIN = 0.17;
const PAD_GAIN = 0.016;
const BASS_GAIN = 0.048;

/** One scheduled note, reported to `Music.trace` (used by the dev harness to draw a piano roll). */
export interface NoteEvent {
  t: number;
  dur: number;
  midi: number;
  vel: number;
  voice: 'melody' | 'arp' | 'pad' | 'bass';
  texture: string;
}

export class Music {
  /** Optional observer of every note scheduled (debugging and tests only). */
  trace: ((e: NoteEvent) => void) | null = null;
  private rng: Rng;
  private next = 0;
  private bpm = 76;
  private key = 0;
  private voice: MalletKind = 'marimba';
  private section: Section;
  private barInSection = 0;
  private sectionsLeft = 0;
  private breathing = false;
  private lastTexture: Texture | null = null;
  private lastProg = -1;
  private padPrev: number[] | null = null;
  private melScale: number[] = [];
  private melIdx = 0;
  private arpStyle = 0;
  /** This piece's pad brightness (lowpass cutoff, Hz), and when its current ramp ends. */
  private padCutoff = 1000;
  private padRampEnd = 0;

  private readonly melBus: GainNode;
  private readonly arpBus: GainNode;
  private readonly padBus: GainNode;
  private readonly padFilter: BiquadFilterNode;
  private readonly bassBus: GainNode;

  constructor(
    private readonly ctx: BaseAudioContext,
    dry: AudioNode,
    wet: AudioNode | null,
    seed: number,
  ) {
    this.rng = makeRng(seed);
    const send = (from: AudioNode, amount: number) => {
      from.connect(dry);
      if (wet && amount > 0) from.connect(gainNode(ctx, amount)).connect(wet);
    };
    // Persistent buses: notes only add a source and a gain each.
    this.melBus = gainNode(ctx, 1);
    send(this.melBus.connect(panner(ctx, 0.18)), 0.42);
    this.arpBus = gainNode(ctx, 1);
    send(this.arpBus.connect(panner(ctx, -0.22)), 0.38);
    this.padBus = gainNode(ctx, 1);
    this.padFilter = biquad(ctx, 'lowpass', 1000, 0.5);
    send(this.padBus.connect(this.padFilter), 0.6);
    // The pad's brightness drifts slowly: each chord ramps it to a new value near the piece's cutoff.
    kRate(this.padFilter.frequency);
    this.bassBus = gainNode(ctx, 1);
    send(this.bassBus.connect(biquad(ctx, 'lowpass', 420, 0.6)), 0.05);

    this.newPiece(true);
    this.section = this.makeSection(pick(this.rng, ['calm', 'arp'] as const));
  }

  /** Mutes or scales the layers (tests use it to measure each layer's level on its own). */
  setLayerLevels(levels: Partial<Record<'melody' | 'arp' | 'pad' | 'bass', number>>): void {
    const buses = { melody: this.melBus, arp: this.arpBus, pad: this.padBus, bass: this.bassBus };
    for (const [k, v] of Object.entries(levels)) {
      if (typeof v === 'number' && Number.isFinite(v)) buses[k as keyof typeof buses].gain.value = Math.max(0, v);
    }
  }

  /** Context time of the next bar to be scheduled. */
  get nextTime(): number {
    return this.next;
  }

  /** Begin again at `t` with a quiet section (after a mute, an interruption or a long stall). */
  restart(t: number): void {
    this.next = t;
    this.padPrev = null;
    this.breathing = false;
    this.section = this.makeSection('calm');
    this.barInSection = 0;
  }

  /** Schedules every bar that starts before `until`. */
  scheduleUntil(until: number): void {
    // A safety bound: never schedule more than a few bars in one call.
    for (let n = 0; n < 8 && this.next < until; n++) {
      const barDur = (4 * 60) / this.bpm;
      this.bar(this.next, barDur);
      this.next += barDur;
      this.barInSection++;
      if (this.barInSection >= this.section.bars) this.nextSection();
    }
  }

  // ------------------------------------------------------------------------------------------
  // Form
  // ------------------------------------------------------------------------------------------

  private newPiece(first: boolean): void {
    const r = this.rng;
    if (first) this.key = pick(r, KEYS);
    else {
      // Move to a closely related key (up a fourth or fifth) when it is one of ours.
      const options = KEYS.filter((k) => k === (this.key + 5) % 12 || k === (this.key + 7) % 12 || k === this.key);
      this.key = options.length > 1 ? pick(r, options.filter((k) => k !== this.key)) : pick(r, KEYS);
    }
    this.bpm = Math.round(rr(r, 72, 84));
    this.voice = first ? 'marimba' : r() < 0.55 ? 'marimba' : 'keys';
    this.sectionsLeft = 4 + Math.floor(r() * 3);
    this.arpStyle = Math.floor(r() * 3);
    // Melody notes: the major pentatonic of the key between G4 and E6.
    this.melScale = [];
    for (let m = 67; m <= 88; m++) if (PENTA.includes((((m - this.key) % 12) + 12) % 12)) this.melScale.push(m);
    this.melIdx = Math.floor(this.melScale.length / 2);
    this.padCutoff = rr(r, 850, 1250);
  }

  private makeSection(texture: Texture): Section {
    const r = this.rng;
    let p = Math.floor(r() * PROGRESSIONS.length);
    if (p === this.lastProg) p = (p + 1 + Math.floor(r() * (PROGRESSIONS.length - 1))) % PROGRESSIONS.length;
    this.lastProg = p;
    const barsPerChord: 1 | 2 = texture === 'calm' || r() < 0.4 ? 2 : 1;
    this.lastTexture = texture;
    return { prog: PROGRESSIONS[p], barsPerChord, bars: 8, texture, add9: r() < 0.5 };
  }

  private nextSection(): void {
    this.barInSection = 0;
    if (this.breathing) {
      this.breathing = false;
      this.newPiece(false);
      this.section = this.makeSection(pick(this.rng, ['calm', 'arp'] as const));
      return;
    }
    this.sectionsLeft--;
    if (this.sectionsLeft <= 0) {
      this.breathing = true;
      this.section = { prog: [0], barsPerChord: 2, bars: 2, texture: 'breath', add9: true };
      return;
    }
    const textures: Texture[] = ['calm', 'arp', 'melody', 'duet'];
    const weights = textures.map((t) => (t === this.lastTexture ? 0 : t === 'melody' ? 3 : t === 'duet' ? 1.5 : t === 'arp' ? 2 : 1));
    this.section = this.makeSection(textures[weighted(this.rng, weights)]);
  }

  // ------------------------------------------------------------------------------------------
  // Harmony
  // ------------------------------------------------------------------------------------------

  /** Pitch classes (0..11, absolute) of the chord on a scale degree, with one colour tone. */
  private chordPcs(degree: number): number[] {
    const st = (d: number) => MAJOR[d % 7] + 12 * Math.floor(d / 7);
    const tones = [st(degree), st(degree + 2), st(degree + 4)];
    // I and IV: maj7 or add9; V: add9 (bright, never tense); ii, iii, vi: minor 7th.
    if (degree === 4 || ((degree === 0 || degree === 3) && this.section.add9)) tones.push(st(degree + 8));
    else tones.push(st(degree + 6));
    return tones.map((s) => (s + this.key) % 12);
  }

  /** Four pad notes between E3 and D5 that move as little as possible from the last chord. */
  private voicing(pcs: number[]): number[] {
    const lo = 52;
    const hi = 76;
    const sorted = [...pcs].sort((a, b) => a - b);
    const candidates: number[][] = [];
    for (let rot = 0; rot < sorted.length; rot++) {
      const order = [...sorted.slice(rot), ...sorted.slice(0, rot)];
      const base = lo + ((((order[0] - lo) % 12) + 12) % 12);
      for (let shift = -12; shift <= 12; shift += 12) {
        // Stack the pitch classes upwards from the lowest, each just above the previous one.
        const notes: number[] = [];
        let prev = base + shift - 1;
        for (const pc of order) {
          const m = prev + 1 + ((((pc - (prev + 1)) % 12) + 12) % 12);
          notes.push(m);
          prev = m;
        }
        if (notes[0] >= lo && notes[notes.length - 1] <= hi) candidates.push(notes);
      }
    }
    if (candidates.length === 0) return sorted.map((pc) => 60 + pc);
    const prev = this.padPrev;
    let best = candidates[0];
    let bestCost = Infinity;
    for (const c of candidates) {
      const cost = prev ? c.reduce((s, m, k) => s + Math.abs(m - prev[k]), 0) : Math.abs((c[0] + c[c.length - 1]) / 2 - 62);
      if (cost < bestCost) {
        bestCost = cost;
        best = c;
      }
    }
    this.padPrev = best;
    return best;
  }

  // ------------------------------------------------------------------------------------------
  // One bar
  // ------------------------------------------------------------------------------------------

  private bar(t0: number, barDur: number): void {
    const sec = this.section;
    const chordIdx = Math.floor(this.barInSection / sec.barsPerChord) % sec.prog.length;
    const degree = sec.prog[chordIdx];
    const pcs = this.chordPcs(degree);
    const barInChord = this.barInSection % sec.barsPerChord;
    const chordDur = sec.barsPerChord * barDur;
    const eighth = barDur / 8;

    if (barInChord === 0) {
      const voiced = this.voicing(pcs);
      this.pad(t0, chordDur, voiced, sec.texture === 'breath' ? 0.75 : 1);
      const root = this.bassNote(degree);
      if (sec.texture === 'breath') {
        // the pad breathes alone
      } else if (sec.barsPerChord === 2 && this.rng() < 0.5) {
        // A long chord: root for one bar, then a soft fifth for a little movement.
        this.bass(t0, barDur, root, 1);
        this.bass(t0 + barDur, barDur, root + 7, 0.6);
      } else {
        this.bass(t0, chordDur, root, 1);
      }
    }

    switch (sec.texture) {
      case 'calm':
        this.calmBar(t0, eighth, pcs);
        break;
      case 'arp':
        this.arpBar(t0, eighth, pcs, 0.3, 60, 84);
        break;
      case 'melody':
        this.melodyBar(t0, eighth, pcs);
        if (this.rng() < 0.35) this.calmBar(t0, eighth, pcs, 0.5);
        break;
      case 'duet':
        this.melodyBar(t0, eighth, pcs);
        this.arpBar(t0, eighth, pcs, 0.5, 60, 76);
        break;
      case 'breath':
        if (barInChord === 0) this.note(this.arpBus, t0 + eighth * 2, this.nearestChordTone(76, pcs), 0.5, ARP_GAIN * 1.2);
        break;
    }
  }

  private bassNote(degree: number): number {
    const pc = (MAJOR[degree] + this.key) % 12;
    return 40 + ((((pc - 40) % 12) + 12) % 12); // E2..D#3
  }

  private nearestChordTone(target: number, pcs: number[]): number {
    for (let d = 0; d < 12; d++) {
      if (pcs.includes((((target - d) % 12) + 12) % 12)) return target - d;
      if (pcs.includes((((target + d) % 12) + 12) % 12)) return target + d;
    }
    return target;
  }

  /** A couple of high chord tones, far apart: the quietest texture. */
  private calmBar(t0: number, eighth: number, pcs: number[], scale = 1): void {
    const r = this.rng;
    const tones: number[] = [];
    for (let m = 70; m <= 86; m++) if (pcs.includes(m % 12)) tones.push(m);
    if (r() < 0.65 * scale) this.note(this.melBus, t0 + this.humanize(), pick(r, tones), rr(r, 0.4, 0.6), MELODY_GAIN * 0.8);
    if (r() < 0.45 * scale) this.note(this.melBus, t0 + eighth * pick(r, [4, 5, 6]) + this.humanize(), pick(r, tones), rr(r, 0.3, 0.5), MELODY_GAIN * 0.8);
  }

  /** Broken-chord eighths with gaps, very soft. */
  private arpBar(t0: number, eighth: number, pcs: number[], skip: number, lo: number, hi: number): void {
    const r = this.rng;
    const tones: number[] = [];
    for (let m = lo; m <= hi; m++) if (pcs.includes(m % 12)) tones.push(m);
    if (tones.length === 0) return;
    const n = Math.min(tones.length, 6);
    const start = Math.max(0, Math.floor((tones.length - n) / 2));
    const run = tones.slice(start, start + n);
    let seq: number[];
    if (this.arpStyle === 0) seq = run;
    else if (this.arpStyle === 1) seq = [...run, ...run.slice(1, -1).reverse()];
    else seq = run.flatMap((m, k) => (k % 2 === 0 ? [m] : [])).concat(run.filter((_, k) => k % 2 === 1));
    for (let slot = 0; slot < 8; slot++) {
      if (slot > 0 && r() < skip) continue;
      const vel = slot === 0 ? 0.9 : slot === 4 ? 0.75 : rr(r, 0.5, 0.65);
      this.note(this.arpBus, t0 + slot * eighth + this.humanize(), seq[slot % seq.length], vel, ARP_GAIN);
    }
  }

  /** One bar of a four-bar pentatonic phrase: stepwise, chord tones on strong beats. */
  private melodyBar(t0: number, eighth: number, pcs: number[]): void {
    const r = this.rng;
    const pos = this.barInSection % 4;
    const cells = RHYTHMS[weighted(r, PHRASE_RHYTHM_WEIGHTS[pos])];
    // The last bar of a phrase is sometimes a rest, to let the music breathe.
    if (pos === 3 && r() < 0.35) return;
    const scale = this.melScale;
    const centre = Math.floor(scale.length / 2);
    cells.forEach(([slot], k) => {
      const steps = [-3, -2, -1, 0, 1, 2, 3];
      const pull = (this.melIdx - centre) / scale.length; // drift back toward the middle
      const w = [0.04, 0.14, 0.3, 0.08, 0.3, 0.14, 0.04].map((x, j) => x * Math.max(0.05, 1 - pull * steps[j] * 0.9));
      this.melIdx = clamp(this.melIdx + steps[weighted(r, w)], 0, scale.length - 1);
      const strong = slot === 0 || slot === 4;
      const last = k === cells.length - 1 && pos === 3;
      if (strong || last) {
        // Snap to the nearest pentatonic note that belongs to the chord.
        let best = this.melIdx;
        for (let d = 0; d < scale.length; d++) {
          const a = this.melIdx - d;
          const b = this.melIdx + d;
          if (a >= 0 && pcs.includes(scale[a] % 12)) {
            best = a;
            break;
          }
          if (b < scale.length && pcs.includes(scale[b] % 12)) {
            best = b;
            break;
          }
        }
        this.melIdx = best;
      }
      const vel = (strong ? 0.8 : 0.62) + rr(r, -0.08, 0.08);
      this.note(this.melBus, t0 + slot * eighth + this.humanize(), scale[this.melIdx], vel, MELODY_GAIN);
    });
  }

  private humanize(): number {
    return rr(this.rng, 0, 0.012);
  }

  // ------------------------------------------------------------------------------------------
  // Voices
  // ------------------------------------------------------------------------------------------

  /** One mallet note: a re-pitched sample through a gain into a bus. */
  private note(bus: AudioNode, t: number, midi: number, vel: number, level: number): void {
    const ctx = this.ctx;
    this.trace?.({ t, dur: 0.5, midi, vel, voice: bus === this.melBus ? 'melody' : 'arp', texture: this.section.texture });
    const src = ctx.createBufferSource();
    src.buffer = malletBuffer(ctx, this.voice);
    const rate = malletRate(midi);
    src.playbackRate.value = rate;
    const g = gainNode(ctx, level * Math.pow(clamp(vel, 0, 1), 1.5));
    src.connect(g).connect(bus);
    // The sample fades out by itself; let it play to the end.
    src.start(t);
    src.onended = () => g.disconnect();
  }

  /** A warm chord: two slightly detuned soft-saw oscillators per note, slow swell and release. */
  private pad(t: number, dur: number, notes: number[], level: number): void {
    const ctx = this.ctx;
    const wave = padWave(ctx);
    const attack = Math.min(1.4, dur * 0.4);
    const release = 1.8;
    // Brighten or darken a little over the chord (one ramp per chord; restart() may leave a gap).
    const f = this.padFilter.frequency;
    if (t > this.padRampEnd + 0.01) f.setValueAtTime(f.value, t);
    this.padRampEnd = t + dur;
    f.linearRampToValueAtTime(this.padCutoff * rr(this.rng, 0.8, 1.25), this.padRampEnd);
    for (const m of notes) {
      this.trace?.({ t, dur, midi: m, vel: level, voice: 'pad', texture: this.section.texture });
      const g = gainNode(ctx);
      const end = asr(g.gain, t, PAD_GAIN * level * (m > 70 ? 0.75 : 1), attack, t + dur, release);
      g.connect(this.padBus);
      for (const det of [-6, 6]) {
        const o = osc(ctx, wave, mtof(m));
        o.detune.value = det + rr(this.rng, -2, 2);
        o.connect(g);
        o.start(t);
        o.stop(end);
        // Both oscillators stop together; either one can tidy the note's gain away.
        if (det > 0) o.onended = () => g.disconnect();
      }
    }
  }

  /** A soft bass note that blooms and settles. */
  private bass(t: number, dur: number, midi: number, level: number): void {
    const ctx = this.ctx;
    this.trace?.({ t, dur, midi, vel: level, voice: 'bass', texture: this.section.texture });
    const o = osc(ctx, bassWave(ctx), mtof(midi));
    const g = gainNode(ctx);
    const peak = BASS_GAIN * level;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.05);
    g.gain.setTargetAtTime(peak * 0.45, t + 0.05, 0.9);
    g.gain.setTargetAtTime(0, t + dur - 0.1, 0.18);
    o.connect(g).connect(this.bassBus);
    o.start(t);
    o.stop(t + dur + 1);
    o.onended = () => g.disconnect();
  }
}
