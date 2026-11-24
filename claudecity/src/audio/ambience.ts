// The world's background sound, following the city:
//  * a daytime breeze (two filtered-noise layers with slow gusts) and synthesised bird calls;
//  * crickets at night, chirping in trains, a few "individuals" spread across the stereo field;
//  * a low city hum plus distant traffic swells that grow with the population;
//  * everything quieter while the game is paused.
// The beds run continuously and crossfade by moving their gains with long time constants; birds,
// crickets and traffic are short sounds scheduled ahead by the engine's lookahead timer.
import { makeRng } from '../core/rng';
import { birdBuffers, cricketBuffers, noiseBuffer } from './buffers';
import { biquad, clamp, gainNode, kRate, lerp, panner, pick, rr, type Rng } from './util';

export interface AmbienceParams {
  population: number;
  /** 0 = full day, 1 = deep night. */
  night: number;
  paused: boolean;
}

interface Cricket {
  pan: AudioNode;
  rate: number;
  interval: number;
  level: number;
  next: number;
  /** Chirps left in the current train before a pause. */
  train: number;
  buffer: number;
}

/** 0..1 "how big a city does this sound like": ~0.2 at 1,000 people, ~0.8 at 6,000. */
export function cityAmount(population: number): number {
  return 1 - Math.exp(-Math.max(0, population) / 4000);
}

const SMOOTH = 1.2; // seconds: time constant for bed crossfades

export class Ambience {
  private rng: Rng;
  private readonly out: GainNode;
  private readonly breeze: GainNode;
  private readonly city: GainNode;
  private readonly wet: AudioNode | null;
  private crickets: Cricket[] = [];
  private day = 1;
  private night = 0;
  private pop = 0;
  private paused = false;
  private nextBird = 0;
  private nextTraffic = 0;
  /** Slowly wandering parameters of the breeze (a random walk of linear ramps, updated per block). */
  private readonly gusts: Array<{ param: AudioParam; lo: number; hi: number; minDur: number; maxDur: number; next: number }> = [];
  private applied = { breeze: -1, city: -1, out: -1 };

  constructor(
    private readonly ctx: BaseAudioContext,
    dry: AudioNode,
    wet: AudioNode | null,
    seed: number,
  ) {
    this.rng = makeRng(seed);
    this.wet = wet;
    const t = ctx.currentTime;
    this.out = gainNode(ctx, 1);
    this.out.connect(dry);
    // One looping noise source feeds every bed; the filters make them sound unrelated.
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    noise.loop = true;
    noise.start(t);
    const wander = (param: AudioParam, lo: number, hi: number, minDur: number, maxDur: number) => {
      kRate(param);
      param.setValueAtTime((lo + hi) / 2, t);
      this.gusts.push({ param, lo, hi, minDur, maxDur, next: t });
    };

    // Breeze: a gusting whoosh (a band of noise whose centre wanders), drifting across the stereo field...
    this.breeze = gainNode(ctx, 0);
    const band = biquad(ctx, 'bandpass', 480, 0.9);
    wander(band.frequency, 300, 720, 3, 8);
    const soft = biquad(ctx, 'lowpass', 1400, 0.5);
    const gust = gainNode(ctx, 0.6);
    wander(gust.gain, 0.3, 1, 1.5, 5);
    const drift = panner(ctx, 0);
    if (drift.pan) wander(drift.pan, -0.5, 0.5, 6, 14);
    noise.connect(band).connect(soft).connect(gust).connect(drift).connect(this.breeze);
    // ...and a softer, brighter rustle of leaves with its own gusts.
    const leaves = biquad(ctx, 'bandpass', 2300, 0.7);
    const leafGust = gainNode(ctx, 0.12);
    wander(leafGust.gain, 0.03, 0.22, 1, 4);
    noise.connect(leaves).connect(leafGust).connect(this.breeze);
    this.breeze.connect(this.out);

    // City: a deep rumble plus a faint mid-range wash (small speakers can't play the rumble).
    this.city = gainNode(ctx, 0);
    const rumble = biquad(ctx, 'lowpass', 170, 0.7);
    const rumble2 = biquad(ctx, 'lowpass', 260, 0.7);
    noise.connect(rumble).connect(rumble2).connect(this.city);
    const wash = biquad(ctx, 'bandpass', 650, 0.5);
    noise.connect(wash).connect(gainNode(ctx, 0.09)).connect(this.city);
    this.city.connect(this.out);

    // Crickets: a few individuals at fixed places in the stereo field.
    const buffers = cricketBuffers(ctx).length;
    for (const [pan, rate, interval, level] of [
      [-0.65, 1.0, 0.52, 1],
      [0.55, 0.93, 0.61, 0.8],
      [0.1, 1.06, 0.46, 0.55],
    ]) {
      const p = panner(ctx, pan);
      p.connect(this.out);
      this.crickets.push({ pan: p, rate, interval, level, next: t + rr(this.rng, 0.2, 1.5), train: 0, buffer: this.crickets.length % buffers });
    }
    this.nextBird = t + rr(this.rng, 0.8, 2.5);
    this.nextTraffic = t + rr(this.rng, 1, 4);
  }

  /** Follow the city. Cheap to call every frame: gains only move when something really changed. */
  set(p: AmbienceParams, t: number): void {
    this.night = clamp(Number.isFinite(p.night) ? p.night : 0, 0, 1);
    this.day = 1 - this.night;
    this.pop = cityAmount(Number.isFinite(p.population) ? p.population : 0);
    this.paused = !!p.paused;
    const breeze = 0.15 * (0.4 + 0.6 * this.day) * (1 - 0.45 * this.pop);
    const city = 0.2 * Math.pow(this.pop, 0.8) * (1 - 0.35 * this.night);
    const out = this.paused ? 0.35 : 1;
    this.move(this.breeze.gain, 'breeze', breeze, t, SMOOTH);
    this.move(this.city.gain, 'city', city, t, SMOOTH * 2);
    this.move(this.out.gain, 'out', out, t, 0.4);
  }

  private move(param: AudioParam, key: keyof Ambience['applied'], value: number, t: number, tc: number): void {
    if (Math.abs(this.applied[key] - value) < 0.002) return;
    this.applied[key] = value;
    param.setTargetAtTime(value, t, tc);
  }

  /** Schedules gusts, birds, cricket chirps and traffic swells due before `until` (never before `now`). */
  scheduleUntil(now: number, until: number): void {
    const r = this.rng;
    const slow = this.paused ? 2 : 1;

    // Gusts: each wandering parameter ramps to a new random value, one segment at a time.
    for (const w of this.gusts) {
      if (w.next < now) {
        // Fell behind (a stall): hold the current value from now rather than jump.
        w.param.cancelScheduledValues(now);
        w.param.setValueAtTime(w.param.value, now);
        w.next = now;
      }
      while (w.next < until) {
        w.next += rr(r, w.minDur, w.maxDur);
        w.param.linearRampToValueAtTime(rr(r, w.lo, w.hi), w.next);
      }
    }

    // Birds: by day, fewer in a big city.
    const birds = this.day * (1 - 0.55 * this.pop);
    if (this.nextBird < now) this.nextBird = now + rr(r, 0.2, 1.5);
    while (this.nextBird < until) {
      if (birds > 0.08) {
        const pan = rr(r, -0.8, 0.8);
        this.bird(this.nextBird, pan, birds);
        // Sometimes another bird answers from the other side.
        if (r() < 0.35) this.bird(this.nextBird + rr(r, 0.45, 1), -pan * rr(r, 0.5, 1), birds * 0.8);
        this.nextBird += (rr(r, 2.5, 7.5) * slow) / Math.max(0.35, birds);
      } else {
        this.nextBird += 2;
      }
    }

    // Crickets: by night, chirping in trains with pauses, quieter in a big city.
    const crick = this.night * (1 - 0.6 * this.pop);
    for (const c of this.crickets) {
      if (c.next < now) c.next = now + rr(r, 0, 0.3);
      while (c.next < until) {
        if (crick > 0.04) {
          if (c.train <= 0) {
            c.train = 6 + Math.floor(r() * 10);
            c.next += rr(r, 0.8, 3.5) * slow;
            continue;
          }
          this.chirp(c, c.next, crick);
          c.train--;
          c.next += c.interval * rr(r, 0.96, 1.04);
        } else {
          c.next += 1;
        }
      }
    }

    // Traffic: distant cars swelling past, more often in a bigger city.
    if (this.nextTraffic < now) this.nextTraffic = now + rr(r, 0.5, 2);
    while (this.nextTraffic < until) {
      if (this.pop > 0.03) {
        this.swell(this.nextTraffic);
        this.nextTraffic += rr(r, 0.6, 1.4) * lerp(16, 2.8, this.pop) * slow;
      } else {
        this.nextTraffic += 2;
      }
    }
  }

  private bird(t: number, pan: number, amount: number): void {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = pick(this.rng, birdBuffers(ctx));
    src.playbackRate.value = rr(this.rng, 0.88, 1.12);
    const g = gainNode(ctx, rr(this.rng, 0.05, 0.11) * Math.min(1, amount * 1.3));
    const p = panner(ctx, pan);
    src.connect(g).connect(p).connect(this.out);
    if (this.wet) g.connect(this.wet);
    src.start(t);
    src.onended = () => {
      g.disconnect();
      p.disconnect();
    };
  }

  private chirp(c: Cricket, t: number, amount: number): void {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = cricketBuffers(ctx)[c.buffer];
    src.playbackRate.value = c.rate * rr(this.rng, 0.99, 1.01);
    const g = gainNode(ctx, 0.075 * c.level * amount * rr(this.rng, 0.85, 1));
    src.connect(g).connect(c.pan);
    src.start(t);
    src.onended = () => g.disconnect();
  }

  /**
   * A car passing in the distance: an engine band and a fainter tyre hiss (both band-passed noise)
   * that swell, bend in pitch like a passing car and pan across.
   */
  private swell(t: number): void {
    const ctx = this.ctx;
    const r = this.rng;
    const dur = rr(r, 3, 6);
    const mid = t + dur * rr(r, 0.4, 0.6);
    const end = t + dur;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const f0 = rr(r, 300, 420);
    const bp = ctx.createGain();
    const sweep = (f: number, q: number, level: number) => {
      const b = biquad(ctx, 'bandpass', f, q);
      kRate(b.frequency);
      b.frequency.setValueAtTime(f, t);
      b.frequency.linearRampToValueAtTime(f * 1.35, mid);
      b.frequency.linearRampToValueAtTime(f * 0.88, end);
      src.connect(b).connect(gainNode(ctx, level)).connect(bp);
    };
    sweep(f0, 1.4, 1);
    sweep(f0 * 3.3, 1.8, 0.4);
    const peak = 0.1 * (0.45 + 0.55 * this.pop) * (1 - 0.45 * this.night) * rr(r, 0.6, 1);
    const g = gainNode(ctx);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak * 0.35, t + (mid - t) * 0.6);
    g.gain.linearRampToValueAtTime(peak, mid);
    g.gain.linearRampToValueAtTime(peak * 0.3, mid + (end - mid) * 0.5);
    g.gain.linearRampToValueAtTime(0, end);
    const side = r() < 0.5 ? -1 : 1;
    const p = panner(ctx, -0.7 * side);
    if (p.pan) {
      kRate(p.pan);
      p.pan.setValueAtTime(-0.7 * side, t);
      p.pan.linearRampToValueAtTime(0.7 * side, end);
    }
    bp.connect(g).connect(p).connect(this.out);
    src.start(t, r() * 2);
    src.stop(end + 0.05);
    src.onended = () => {
      src.disconnect();
      bp.disconnect();
      g.disconnect();
      p.disconnect();
    };
  }
}
