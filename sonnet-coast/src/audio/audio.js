// Sonnet Coast audio layer.
// Every sound is synthesised at runtime with the Web Audio API: no audio files, no network,
// no libraries. Public contract: see the AudioSystem class at the bottom of this file.

const MAX_VOICES = 24;        // simultaneous one-shot voices; the quietest / most decayed is dropped
const MAX_SAME = 5;           // simultaneous copies of one sound name
const HEAR_DIST = 160;        // metres at which a positional one-shot has faded to nothing
const SIREN_DIST = 240;       // sirens carry further than ordinary sounds
const ROTOR_DIST = 420;       // and a helicopter further still
const CONTROL_DT = 0.022;     // continuous sounds are re-targeted at ~30-45 Hz, not every frame
const STALE_FRAMES = 15;      // engine()/skid()/sirens()/ambient() not called for this many updates = off

// Master limiter (DynamicsCompressor, hard knee). The node applies an automatic make-up gain of
// (1 / curve(1.0)) ^ 0.6, which LIM_TRIM undoes so the chain is unity gain below the threshold.
const LIM_THRESHOLD = -5;
const LIM_RATIO = 20;
const LIM_TRIM = Math.pow(10, (0.6 * LIM_THRESHOLD * (1 - 1 / LIM_RATIO)) / 20);
const OUT_GAIN = 1.35;        // post-limiter gain: limited peaks land near -2 dBFS at full master volume

// Bus trims (linear), balanced by measurement in the test harness.
const BUS = { sfx: 0.9, ui: 0.9, engine: 0.2, skid: 0.9, siren: 0.9, ambient: 1.0, music: 0.75 };

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fin = (v, d) => (typeof v === 'number' && v === v && v !== Infinity && v !== -Infinity ? v : d);
const c01 = (v) => clamp(fin(v, 0), 0, 1);
const EMPTY = Object.freeze({});

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------------------------
// Buffers generated once at unlock and shared by everything
// ---------------------------------------------------------------------------------------------

function makeWhite(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const r = mulberry32(0x9e3779b9);
  for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
  return buf;
}

// Pink noise (Paul Kellet's filter), with the tail cross-faded into the head so the loop is seamless.
function makePink(ctx, seconds) {
  const sr = ctx.sampleRate, len = Math.floor(sr * seconds), fade = Math.floor(sr * 0.06);
  const tmp = new Float32Array(len + fade);
  const r = mulberry32(0x51f15e11);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, peak = 0;
  for (let i = -4000; i < len + fade; i++) {
    const w = r() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    const p = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
    if (i >= 0) { tmp[i] = p; const a = Math.abs(p); if (a > peak) peak = a; }
  }
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0), k = 0.95 / (peak || 1);
  for (let i = 0; i < len; i++) {
    let s = tmp[i];
    if (i < fade) { const x = i / fade; s = s * Math.sqrt(x) + tmp[len + i] * Math.sqrt(1 - x); }
    d[i] = s * k;
  }
  return buf;
}

// Smooth random control signal in [-1, 1] (about 10 direction changes a second at rate 1).
// Stored at 8 kHz to keep it small; used as a modulator, never heard directly.
function makeLfNoise(ctx) {
  const sr = 8000, seg = 800, points = 160, len = seg * points;
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const r = mulberry32(0x1f2e3d4c);
  const p = new Float32Array(points + 1);
  for (let i = 0; i < points; i++) p[i] = r() * 2 - 1;
  p[points] = p[0];
  for (let i = 0; i < points; i++) {
    for (let j = 0; j < seg; j++) {
      const m = (1 - Math.cos((j / seg) * Math.PI)) * 0.5;
      d[i * seg + j] = p[i] + (p[i + 1] - p[i]) * m;
    }
  }
  return buf;
}

// Night crickets: a few chirping individuals plus a faint continuous trill. Stereo, loops seamlessly.
function makeCrickets(ctx) {
  const sr = 24000, dur = 5.9, len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(2, len, sr);
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  const r = mulberry32(0xc41c7e7);
  const pulse = (t, f, d, amp, pan) => {
    const n = Math.floor(d * sr), s0 = Math.floor(t * sr);
    const gl = amp * Math.cos((pan + 1) * Math.PI / 4), gr = amp * Math.sin((pan + 1) * Math.PI / 4);
    const w = (2 * Math.PI * f) / sr;
    for (let i = 0; i < n; i++) {
      const e = Math.sin((Math.PI * i) / n);
      const s = Math.sin(w * i) * e * e;
      const k = (s0 + i) % len;
      L[k] += s * gl; R[k] += s * gr;
    }
  };
  const voices = [
    { f: 4350, rate: 2.05, n: 3, pr: 62, pan: -0.65, amp: 0.42 },
    { f: 4780, rate: 1.62, n: 4, pr: 55, pan: 0.55, amp: 0.36 },
    { f: 3920, rate: 2.5, n: 2, pr: 70, pan: 0.15, amp: 0.26 },
    { f: 5150, rate: 1.31, n: 3, pr: 58, pan: -0.2, amp: 0.2 },
    { f: 4560, rate: 1.88, n: 3, pr: 66, pan: 0.8, amp: 0.14 },
  ];
  for (const v of voices) {
    let t = r() * 0.5;
    while (t < dur - 0.02) {
      const f = v.f * (0.995 + r() * 0.01);
      for (let p = 0; p < v.n; p++) pulse(t + p / v.pr, f, 0.011, v.amp * (0.8 + r() * 0.2), v.pan);
      t += (1 / v.rate) * (0.86 + r() * 0.28);
      if (r() < 0.1) t += 0.5 + r() * 0.7;
    }
  }
  // trill bed: carrier and modulation periods divide the loop length exactly
  const fc = Math.round(3300 * dur) / dur, fm = Math.round(34 * dur) / dur, fs = 1 / dur;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const am = 0.5 + 0.5 * Math.sin(2 * Math.PI * fm * t);
    const sw = 0.6 + 0.4 * Math.sin(2 * Math.PI * fs * t);
    const s = Math.sin(2 * Math.PI * fc * t) * am * am * sw * 0.05;
    L[i] += s * 0.8; R[i] += s * 0.55;
  }
  return buf;
}

// Swamp chorus: bullfrogs, "ribbit" frogs, peepers, a cicada-like buzz and the odd bubble.
function makeSwamp(ctx) {
  const sr = 24000, dur = 10.3, len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(2, len, sr);
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  const r = mulberry32(0x5a4b0b06);
  const put = (k, s, pan) => {
    k %= len;
    L[k] += s * Math.cos((pan + 1) * Math.PI / 4); R[k] += s * Math.sin((pan + 1) * Math.PI / 4);
  };
  // FM "croak": carrier f0 modulated by itself (index idx) with a growl AM at `am` Hz
  const croak = (t, f0, d, amp, pan, idx, am, bend) => {
    const n = Math.floor(d * sr), s0 = Math.floor(t * sr);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const x = i / n;
      const env = Math.pow(Math.sin(Math.PI * x), 0.7);
      ph += (2 * Math.PI * f0 * (1 + bend * x)) / sr;
      const growl = 0.55 + 0.45 * Math.sin((2 * Math.PI * am * i) / sr);
      put(s0 + i, Math.sin(ph + idx * env * Math.sin(ph)) * env * growl * amp, pan);
    }
  };
  const pip = (t, f, d, amp, pan, bend) => {
    const n = Math.floor(d * sr), s0 = Math.floor(t * sr);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const x = i / n, env = Math.sin(Math.PI * x);
      ph += (2 * Math.PI * f * (1 + bend * x)) / sr;
      put(s0 + i, Math.sin(ph) * env * env * amp, pan);
    }
  };
  for (let k = 0; k < 6; k++) {                    // bullfrogs
    const t = r() * dur, f0 = 92 + r() * 40, pan = r() * 1.4 - 0.7, amp = 0.3 + r() * 0.16;
    croak(t, f0, 0.34 + r() * 0.22, amp, pan, 2.6, 26 + r() * 6, 0.12);
    if (r() < 0.5) croak(t + 0.62 + r() * 0.1, f0 * 0.97, 0.3 + r() * 0.15, amp * 0.8, pan, 2.4, 27, 0.1);
  }
  for (let k = 0; k < 7; k++) {                    // ribbits
    const t = r() * dur, f0 = 360 + r() * 170, pan = r() * 1.6 - 0.8, amp = 0.12 + r() * 0.08;
    croak(t, f0, 0.085, amp, pan, 1.8, 44, 0.05);
    croak(t + 0.13, f0 * 1.07, 0.14, amp, pan, 2.0, 41, 0.18);
  }
  for (let k = 0; k < 10; k++) {                   // peepers
    let t = r() * dur;
    const f = 2250 + r() * 900, pan = r() * 1.8 - 0.9, amp = 0.05 + r() * 0.05, n = 2 + Math.floor(r() * 4);
    for (let p = 0; p < n; p++) { pip(t, f, 0.065, amp, pan, 0.07); t += 0.15 + r() * 0.03; }
  }
  for (let k = 0; k < 2; k++) {                    // cicada swells
    const t = k * 5 + r() * 2, d = 3.2 + r(), f = 5300 + r() * 900, am = 120 + r() * 60, pan = k ? 0.6 : -0.6;
    const n = Math.floor(d * sr), s0 = Math.floor(t * sr);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const x = i / n, env = Math.pow(Math.sin(Math.PI * x), 1.5);
      ph += (2 * Math.PI * f) / sr + (r() - 0.5) * 0.25;
      const saw = 1 - (((am * i) / sr) % 1);
      put(s0 + i, Math.sin(ph) * env * saw * 0.045, pan);
    }
  }
  for (let k = 0; k < 5; k++) pip(r() * dur, 300 + r() * 250, 0.055, 0.1, r() * 1.2 - 0.6, 1.3);   // bubbles
  return buf;
}

// Band-limited LFO shapes with Lanczos-smoothed harmonics: a rounded square and a rounded falling
// saw (fast rise, slow fall). Used instead of low-passing a raw LFO, because a biquad tuned to a few
// hertz is numerically unstable in single precision and can blow up.
function lfoWave(ctx, kind, harmonics) {
  const real = new Float32Array(harmonics + 1), imag = new Float32Array(harmonics + 1);
  for (let k = 1; k <= harmonics; k++) {
    const x = (Math.PI * k) / (harmonics + 1), sigma = Math.sin(x) / x;
    if (kind === 'square') imag[k] = k % 2 ? (4 / Math.PI / k) * sigma : 0;
    else imag[k] = ((k % 2 ? -2 : 2) / Math.PI / k) * sigma;
  }
  return ctx.createPeriodicWave(real, imag);
}

function tanhCurve(k) {
  const n = 1025, c = new Float32Array(n), norm = Math.tanh(k);
  for (let i = 0; i < n; i++) c[i] = Math.tanh(((i / (n - 1)) * 2 - 1) * k) / norm;
  return c;
}

// Final safety stage. The input is pre-scaled by 0.5, so the table spans [-2, 2]: exactly linear up
// to 0.72, then a tanh knee that can never exceed 0.97. Whatever reaches it, the output cannot clip.
function softClipCurve() {
  const n = 4097, c = new Float32Array(n), lin = 0.72, top = 0.97;
  for (let i = 0; i < n; i++) {
    const x = ((i / (n - 1)) * 2 - 1) * 2, a = Math.abs(x);
    const y = a <= lin ? a : lin + (top - lin) * Math.tanh((a - lin) / (top - lin));
    c[i] = x < 0 ? -y : y;
  }
  return c;
}

// ---------------------------------------------------------------------------------------------
// One-shot voices
// ---------------------------------------------------------------------------------------------

// A Shot is one playing one-shot: a throwaway node graph plus the bookkeeping needed to stop and
// disconnect all of it when it ends. Recipes build the graph through these helpers; every time
// is relative to the shot's start and every frequency is scaled by the shot's pitch.
class Shot {
  constructor(sys, t0, pitch) {
    this.sys = sys; this.ctx = sys.ctx; this.t0 = t0; this.P = pitch;
    this.nodes = []; this.srcs = []; this.end = t0 + 0.05;
    this.out = this._add(this.ctx.createGain());
  }

  _add(n) { this.nodes.push(n); return n; }
  _f(f) { return clamp(f * this.P, 10, this.sys._fmax); }

  // Gain envelope: linear attack, then either an exponential decay to silence at `dur`
  // (percussive) or a hold followed by a linear release (hold = true).
  _env(p, t, dur, g, a, hold, r) {
    g = Math.max(0.0002, g);
    a = Math.min(a, dur * 0.45);
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(g, t + a);
    if (hold) {
      r = Math.min(r, dur * 0.45);
      p.setValueAtTime(g, t + dur - r);
      p.linearRampToValueAtTime(0, t + dur);
    } else {
      p.exponentialRampToValueAtTime(g * 0.001, t + dur);
      p.linearRampToValueAtTime(0, t + dur + 0.004);
    }
  }

  _src(node, t, dur) {
    node.start(t);
    node.stop(t + dur + 0.03);
    this.srcs.push(node);
    if (t + dur + 0.06 > this.end) this.end = t + dur + 0.06;
  }

  // Oscillator note. o: { t, dur, g, a, hold, r, f1 (glide target), ft (glide time), det, to }
  osc(type, f, o) {
    const c = this.ctx, t = this.t0 + (o.t || 0), dur = o.dur || 0.2;
    const n = this._add(c.createOscillator());
    n.type = type;
    n.frequency.setValueAtTime(this._f(f), t);
    if (o.f1) n.frequency.exponentialRampToValueAtTime(this._f(o.f1), t + (o.ft || dur));
    if (o.det) n.detune.value = o.det;
    const g = this._add(c.createGain());
    this._env(g.gain, t, dur, o.g === undefined ? 0.3 : o.g, o.a === undefined ? 0.004 : o.a, !!o.hold, o.r === undefined ? 0.03 : o.r);
    n.connect(g); g.connect(o.to || this.out);
    this._src(n, t, dur);
    return n;
  }

  // Two-operator FM note (metallic / bell tones). idx is the modulation index at the attack,
  // decaying to idx * i1 over `it` seconds.
  fm(fc, ratio, idx, o) {
    const c = this.ctx, t = this.t0 + (o.t || 0), dur = o.dur || 0.2;
    const car = this.osc(o.type || 'sine', fc, o);
    const mod = this._add(c.createOscillator());
    mod.frequency.value = this._f(fc * ratio);
    const mg = this._add(c.createGain());
    const dev = idx * fc * ratio * this.P;
    mg.gain.setValueAtTime(dev, t);
    mg.gain.exponentialRampToValueAtTime(Math.max(0.01, dev * (o.i1 === undefined ? 0.05 : o.i1)), t + (o.it || dur));
    mod.connect(mg); mg.connect(car.frequency);
    this._src(mod, t, dur);
    return car;
  }

  // Noise burst. o: { t, dur, g, a, hold, r, type (filter type), f, q, to }. Returns { src, f, g }.
  noise(kind, o) {
    const c = this.ctx, t = this.t0 + (o.t || 0), dur = o.dur || 0.2;
    const buf = this.sys._buf[kind] || this.sys._buf.white;
    const src = this._add(c.createBufferSource());
    src.buffer = buf; src.loop = true;
    let tail = src, flt = null;
    if (o.type) {
      flt = this._add(c.createBiquadFilter());
      flt.type = o.type; flt.frequency.value = this._f(o.f || 1000); flt.Q.value = o.q === undefined ? 0.7 : o.q;
      tail.connect(flt); tail = flt;
    }
    const g = this._add(c.createGain());
    this._env(g.gain, t, dur, o.g === undefined ? 0.3 : o.g, o.a === undefined ? 0.003 : o.a, !!o.hold, o.r === undefined ? 0.03 : o.r);
    tail.connect(g); g.connect(o.to || this.out);
    src.start(t, Math.random() * (buf.duration - 0.05));
    src.stop(t + dur + 0.03);
    this.srcs.push(src);
    if (t + dur + 0.06 > this.end) this.end = t + dur + 0.06;
    return { src, f: flt, g };
  }

  // Filter used as a shared destination for several sources.
  filt(type, f, q, to, g) {
    const n = this._add(this.ctx.createBiquadFilter());
    n.type = type; n.frequency.value = this._f(f); n.Q.value = q === undefined ? 0.7 : q;
    if (g !== undefined && g !== 1) {
      const gn = this._add(this.ctx.createGain());
      gn.gain.value = g; n.connect(gn); gn.connect(to || this.out);
    } else n.connect(to || this.out);
    return n;
  }

  bus(g, to) {
    const n = this._add(this.ctx.createGain());
    n.gain.value = g; n.connect(to || this.out);
    return n;
  }

  split() {
    const n = this._add(this.ctx.createGain());
    for (let i = 0; i < arguments.length; i++) n.connect(arguments[i]);
    return n;
  }

  shape(drive, to) {
    const n = this._add(this.ctx.createWaveShaper());
    n.curve = this.sys._curve(drive);
    n.connect(to || this.out);
    return n;
  }

  // Automate a parameter through [[time, value], ...]; frequencies are pitch-scaled unless raw.
  sweep(param, pts, raw, lin) {
    for (let i = 0; i < pts.length; i++) {
      const t = this.t0 + pts[i][0], v = raw ? pts[i][1] : this._f(pts[i][1]);
      if (i === 0) param.setValueAtTime(v, t);
      else if (lin) param.linearRampToValueAtTime(v, t);
      else param.exponentialRampToValueAtTime(Math.max(1e-4, v), t);
    }
  }

  lfo(type, f, depth, param, o) {
    const c = this.ctx, t = this.t0 + ((o && o.t) || 0), dur = (o && o.dur) || 0.3;
    const n = this._add(c.createOscillator());
    n.type = type; n.frequency.value = f;
    const g = this._add(c.createGain());
    g.gain.value = depth;
    n.connect(g); g.connect(param);
    this._src(n, t, dur);
    return n;
  }
}

const rnd = Math.random;

// Recipes. Keep them short, distinct and soft-edged: bright sources always pass through a filter.
const SFX = Object.assign(Object.create(null), {
  // ---- UI -------------------------------------------------------------------------------
  uiMove(v) {
    v.osc('sine', 1250, { dur: 0.06, g: 0.14, f1: 1500, a: 0.002 });
    v.osc('triangle', 625, { dur: 0.045, g: 0.07, a: 0.002 });
  },
  uiSelect(v) {
    v.osc('triangle', 784, { dur: 0.09, g: 0.17 });
    v.osc('triangle', 1175, { t: 0.07, dur: 0.18, g: 0.17 });
    v.osc('sine', 2350, { t: 0.07, dur: 0.14, g: 0.04 });
  },
  uiBack(v) {
    v.osc('triangle', 880, { dur: 0.08, g: 0.16 });
    v.osc('triangle', 554, { t: 0.065, dur: 0.16, g: 0.16 });
  },
  uiError(v) {
    const lp = v.filt('lowpass', 1100, 0.8);
    v.osc('square', 196, { dur: 0.09, g: 0.16, hold: true, to: lp });
    v.osc('square', 185, { t: 0.13, dur: 0.17, g: 0.16, hold: true, to: lp });
    v.osc('sawtooth', 92.5, { t: 0.13, dur: 0.17, g: 0.1, hold: true, to: lp });
  },

  // ---- Player ---------------------------------------------------------------------------
  punch(v) {
    v.osc('sine', 150, { dur: 0.12, g: 0.55, f1: 48, ft: 0.08, a: 0.002 });
    v.noise('white', { dur: 0.05, g: 0.3, type: 'bandpass', f: 1300, q: 0.8, a: 0.001 });
    v.noise('pink', { dur: 0.09, g: 0.25, type: 'lowpass', f: 500 });
  },
  whoosh(v) {
    const n = v.noise('white', { dur: 0.3, g: 0.34, a: 0.1, type: 'bandpass', f: 450, q: 1.4 });
    v.sweep(n.f.frequency, [[0, 450], [0.11, 2400], [0.3, 700]]);
  },
  hurt(v) {
    const fa = v.filt('bandpass', 640, 3.5), fb = v.filt('bandpass', 1180, 4.5, null, 0.6);
    const sp = v.split(fa, fb);
    v.osc('sawtooth', 230, { dur: 0.2, g: 0.9, f1: 120, a: 0.008, to: sp });
    v.noise('pink', { dur: 0.07, g: 0.2, type: 'lowpass', f: 600 });
    v.osc('sine', 110, { dur: 0.09, g: 0.3, f1: 60 });
  },
  jump(v) {
    v.osc('sine', 240, { dur: 0.14, g: 0.22, f1: 560, ft: 0.1, a: 0.01 });
    v.noise('white', { dur: 0.1, g: 0.08, a: 0.03, type: 'bandpass', f: 1800, q: 0.8 });
  },
  land(v) {
    v.osc('sine', 115, { dur: 0.14, g: 0.5, f1: 42, ft: 0.1, a: 0.002 });
    v.noise('pink', { dur: 0.11, g: 0.4, type: 'lowpass', f: 420, a: 0.002 });
    v.noise('white', { dur: 0.04, g: 0.08, type: 'highpass', f: 2500, a: 0.001 });
  },
  splash(v) {
    const n = v.noise('white', { dur: 0.55, g: 0.4, a: 0.012, type: 'bandpass', f: 2600, q: 0.6 });
    v.sweep(n.f.frequency, [[0, 2600], [0.5, 600]]);
    v.noise('pink', { dur: 0.3, g: 0.4, type: 'lowpass', f: 500, a: 0.005 });
    for (let i = 0; i < 4; i++) {
      const t = 0.12 + i * 0.07 + rnd() * 0.04, f = 500 + rnd() * 700;
      v.osc('sine', f, { t, dur: 0.06, g: 0.1, f1: f * 1.9, a: 0.004 });
    }
  },
  pickup(v) {
    v.osc('triangle', 880, { dur: 0.08, g: 0.2 });
    v.osc('triangle', 1318.5, { t: 0.06, dur: 0.2, g: 0.2 });
    v.osc('sine', 2637, { t: 0.06, dur: 0.16, g: 0.05 });
  },
  collectible(v) {
    [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => {
      const t = i * 0.065;
      v.osc('triangle', f, { t, dur: 0.5, g: 0.12, a: 0.004 });
      v.osc('sine', f * 2.005, { t, dur: 0.38, g: 0.05, a: 0.004 });
    });
    v.osc('sine', 3135.96, { t: 0.39, dur: 0.7, g: 0.035, a: 0.05 });
  },
  token(v) {
    const lp = v.filt('lowpass', 5000, 0.5);
    v.osc('square', 987.77, { dur: 0.06, g: 0.1, hold: true, r: 0.01, to: lp });
    v.osc('square', 1318.5, { t: 0.06, dur: 0.24, g: 0.1, to: lp });
    v.osc('sine', 2637, { t: 0.06, dur: 0.2, g: 0.04 });
  },
  armor(v) {
    v.fm(420, 1.41, 2.2, { dur: 0.4, g: 0.2, a: 0.002 });
    v.fm(640, 2.76, 1.2, { dur: 0.28, g: 0.1, a: 0.002 });
    const lp = v.filt('lowpass', 900, 3);
    v.sweep(lp.frequency, [[0, 500], [0.35, 2400]]);
    v.osc('sawtooth', 110, { dur: 0.42, g: 0.16, f1: 330, a: 0.05, hold: true, r: 0.12, to: lp });
  },

  // ---- Weapons / gadgets ----------------------------------------------------------------
  pistol(v) {
    const lp = v.filt('lowpass', 5200, 1.2);
    v.sweep(lp.frequency, [[0, 6000], [0.16, 900]]);
    v.osc('sawtooth', 1900, { dur: 0.17, g: 0.34, f1: 210, ft: 0.13, a: 0.001, to: lp });
    v.osc('square', 2850, { dur: 0.09, g: 0.1, f1: 420, ft: 0.08, a: 0.001, to: lp });
    v.noise('white', { dur: 0.035, g: 0.4, type: 'highpass', f: 1800, a: 0.0005 });
    v.osc('sine', 170, { dur: 0.11, g: 0.55, f1: 55, ft: 0.07, a: 0.001 });
  },
  policeShot(v) {
    const lp = v.filt('lowpass', 2600, 0.9);
    v.fm(520, 0.5, 3.5, { dur: 0.22, g: 0.42, f1: 85, ft: 0.16, a: 0.001, to: lp, type: 'triangle' });
    v.noise('pink', { dur: 0.12, g: 0.5, type: 'bandpass', f: 900, q: 0.7, a: 0.001 });
    v.osc('sine', 120, { dur: 0.2, g: 0.6, f1: 40, ft: 0.12, a: 0.001 });
  },
  baton(v) {
    const bp = v.filt('bandpass', 3000, 0.9);
    const am = v.bus(0.5, bp);
    v.lfo('square', 86, 0.5, am.gain, { dur: 0.24 });
    v.noise('white', { dur: 0.22, g: 0.5, a: 0.002, hold: true, r: 0.06, to: am });
    const lp = v.filt('lowpass', 1800, 2);
    v.osc('sawtooth', 86, { dur: 0.22, g: 0.2, f1: 70, a: 0.002, hold: true, r: 0.06, to: lp });
    v.osc('square', 1720, { dur: 0.05, g: 0.06, f1: 600 });
  },
  reload(v) {
    v.noise('white', { dur: 0.03, g: 0.3, type: 'highpass', f: 2500, a: 0.001 });
    v.osc('triangle', 900, { dur: 0.03, g: 0.12, f1: 500 });
    const s = v.noise('white', { t: 0.09, dur: 0.1, g: 0.14, a: 0.03, type: 'bandpass', f: 900, q: 2 });
    v.sweep(s.f.frequency, [[0.09, 800], [0.19, 1900]]);
    v.noise('white', { t: 0.24, dur: 0.04, g: 0.4, type: 'bandpass', f: 2100, q: 1.2, a: 0.001 });
    v.osc('sine', 320, { t: 0.24, dur: 0.06, g: 0.25, f1: 140, a: 0.001 });
    v.osc('sine', 1400, { t: 0.3, dur: 0.12, g: 0.05, f1: 2100, a: 0.01 });
  },
  empty(v) {
    v.noise('white', { dur: 0.018, g: 0.28, type: 'highpass', f: 3200, a: 0.0005 });
    v.osc('triangle', 1250, { dur: 0.025, g: 0.1, f1: 800, a: 0.0005 });
    v.osc('sine', 260, { t: 0.004, dur: 0.03, g: 0.1, a: 0.001 });
  },
  empThrow(v) {
    const o = v.osc('sine', 320, { dur: 0.38, g: 0.16, f1: 1500, a: 0.03, hold: true, r: 0.08 });
    v.lfo('sine', 28, 40, o.frequency, { dur: 0.4 });
    v.osc('triangle', 640, { dur: 0.38, g: 0.06, f1: 3000, a: 0.05, hold: true, r: 0.08 });
    const n = v.noise('white', { dur: 0.3, g: 0.12, a: 0.1, type: 'bandpass', f: 700, q: 1.5 });
    v.sweep(n.f.frequency, [[0, 600], [0.3, 2500]]);
  },
  empBlast(v) {
    v.osc('sine', 130, { dur: 1.1, g: 0.85, f1: 26, ft: 0.8, a: 0.004 });
    const bp = v.filt('bandpass', 5000, 0.8);
    v.sweep(bp.frequency, [[0, 6500], [0.7, 250]]);
    const am = v.bus(0.55, bp);
    v.lfo('square', 47, 0.45, am.gain, { dur: 0.8 });
    v.noise('white', { dur: 0.75, g: 0.6, a: 0.002, to: am });
    const lp = v.filt('lowpass', 4000, 2);
    v.osc('sawtooth', 2400, { dur: 0.35, g: 0.22, f1: 70, ft: 0.3, a: 0.001, to: lp });
    v.osc('square', 1200, { t: 0.02, dur: 0.25, g: 0.08, f1: 45, to: lp });
    for (let i = 0; i < 5; i++) {
      v.noise('white', { t: 0.35 + i * 0.09 + rnd() * 0.05, dur: 0.02, g: 0.14, type: 'highpass', f: 4000, a: 0.0005 });
    }
  },
  hack(v) {
    const lp = v.filt('lowpass', 4500, 0.7);
    [700, 1050, 880, 1400, 1180, 1760, 2100].forEach((f, i) => {
      v.osc('square', f, { t: i * 0.052, dur: 0.042, g: 0.09, hold: true, r: 0.008, a: 0.002, to: lp });
    });
    v.osc('sine', 2100, { t: 0.364, dur: 0.22, g: 0.1, f1: 2800 });
  },
  hackFail(v) {
    const lp = v.filt('lowpass', 2200, 0.7);
    [520, 390, 233].forEach((f, i) => {
      const last = i === 2;
      v.osc('square', f, { t: i * 0.085, dur: last ? 0.26 : 0.07, g: 0.12, hold: true, r: last ? 0.1 : 0.01, a: 0.002, to: lp });
    });
    v.osc('sawtooth', 116.5, { t: 0.17, dur: 0.26, g: 0.1, hold: true, r: 0.1, to: lp });
  },
  bulletHit(v) {
    v.noise('white', { dur: 0.03, g: 0.35, type: 'highpass', f: 3000, a: 0.0005 });
    const f = 2400 + rnd() * 1400;
    v.osc('sine', f, { dur: 0.16, g: 0.12, f1: f * 0.45, ft: 0.14, a: 0.001 });
    v.osc('triangle', 800, { dur: 0.04, g: 0.15, f1: 300, a: 0.001 });
  },

  // ---- Vehicles -------------------------------------------------------------------------
  crashSmall(v) {
    v.osc('sine', 100, { dur: 0.16, g: 0.6, f1: 45, a: 0.002 });
    v.noise('pink', { dur: 0.2, g: 0.6, type: 'lowpass', f: 1800, a: 0.002 });
    v.noise('white', { dur: 0.07, g: 0.25, type: 'bandpass', f: 2600, q: 0.8, a: 0.001 });
    [523, 811, 1240].forEach((f, i) => {
      v.osc('triangle', f * (0.94 + rnd() * 0.12), { dur: 0.14 + i * 0.03, g: 0.07, a: 0.001 });
    });
  },
  crashBig(v) {
    v.osc('sine', 78, { dur: 0.5, g: 0.9, f1: 30, ft: 0.3, a: 0.002 });
    const sh = v.shape(3);
    const n = v.noise('pink', { dur: 0.6, g: 0.8, type: 'lowpass', f: 3800, a: 0.002, to: sh });
    v.sweep(n.f.frequency, [[0, 4200], [0.5, 350]]);
    v.noise('white', { dur: 0.12, g: 0.35, type: 'bandpass', f: 2200, q: 0.7, a: 0.001 });
    [310, 467, 705, 1130].forEach((f, i) => {
      v.osc('triangle', f * (0.93 + rnd() * 0.14), { t: 0.01 * i, dur: 0.3 + i * 0.05, g: 0.08, a: 0.001 });
    });
    for (let i = 0; i < 5; i++) {
      v.noise('white', { t: 0.18 + i * 0.07 + rnd() * 0.04, dur: 0.035, g: 0.16, type: 'bandpass', f: 1500 + rnd() * 2500, q: 2, a: 0.001 });
    }
  },
  glass(v) {
    v.noise('white', { dur: 0.09, g: 0.45, type: 'highpass', f: 4200, a: 0.0005 });
    v.noise('white', { dur: 0.35, g: 0.14, type: 'highpass', f: 6000, a: 0.01 });
    for (let i = 0; i < 9; i++) {
      const f = 2600 + rnd() * 5200, t = 0.015 + rnd() * 0.3;
      v.osc('sine', f, { t, dur: 0.05 + rnd() * 0.12, g: 0.06 + rnd() * 0.05, a: 0.001 });
    }
  },
  explosion(v) {
    v.osc('sine', 95, { dur: 1.6, g: 1.0, f1: 24, ft: 1.0, a: 0.003 });
    v.noise('white', { dur: 0.05, g: 0.7, type: 'highpass', f: 1200, a: 0.0005 });
    const sh = v.shape(4);
    const n = v.noise('pink', { dur: 2.6, g: 1.0, type: 'lowpass', f: 3200, q: 0.6, a: 0.004, to: sh });
    v.sweep(n.f.frequency, [[0, 3600], [0.5, 900], [2.6, 110]]);
    const r = v.noise('pink', { t: 0.15, dur: 3.2, g: 0.35, type: 'lowpass', f: 300, a: 0.25 });
    v.sweep(r.f.frequency, [[0.15, 320], [3.3, 70]]);
    for (let i = 0; i < 4; i++) {
      v.noise('white', { t: 0.3 + i * 0.16 + rnd() * 0.1, dur: 0.06, g: 0.1, type: 'bandpass', f: 900 + rnd() * 1500, q: 1.5, a: 0.002 });
    }
  },
  doorOpen(v) {
    v.noise('white', { dur: 0.025, g: 0.25, type: 'highpass', f: 2000, a: 0.0005 });
    v.osc('triangle', 720, { dur: 0.035, g: 0.14, f1: 480, a: 0.001 });
    const n = v.noise('white', { t: 0.04, dur: 0.2, g: 0.09, a: 0.06, type: 'bandpass', f: 900, q: 1.5 });
    v.sweep(n.f.frequency, [[0.04, 700], [0.24, 2200]]);
    v.osc('sine', 300, { t: 0.04, dur: 0.18, g: 0.06, f1: 620, a: 0.03 });
  },
  doorClose(v) {
    v.osc('sine', 135, { dur: 0.11, g: 0.55, f1: 58, a: 0.002 });
    v.noise('pink', { dur: 0.09, g: 0.5, type: 'lowpass', f: 700, a: 0.001 });
    v.noise('white', { dur: 0.02, g: 0.16, type: 'highpass', f: 2600, a: 0.0005 });
    v.osc('triangle', 410, { t: 0.01, dur: 0.05, g: 0.08, a: 0.001 });
  },
  engineStart(v) {
    const lp = v.filt('lowpass', 900, 1.5);
    v.sweep(lp.frequency, [[0, 500], [0.5, 1600], [0.95, 700]]);
    const am = v.bus(0.6, lp);
    v.lfo('sine', 13, 0.4, am.gain, { dur: 0.5 });
    v.osc('sawtooth', 58, { dur: 0.5, g: 0.35, f1: 110, a: 0.02, hold: true, r: 0.05, to: am });
    v.osc('sawtooth', 70, { t: 0.45, dur: 0.5, g: 0.4, f1: 62, a: 0.03, to: lp });
    v.osc('square', 35, { t: 0.45, dur: 0.5, g: 0.3, f1: 31, a: 0.03, to: lp });
    v.noise('pink', { t: 0.45, dur: 0.22, g: 0.3, type: 'lowpass', f: 1200, a: 0.01 });
    v.osc('sine', 350, { t: 0.1, dur: 0.8, g: 0.05, f1: 1100, a: 0.2 });
  },
  horn(v) {
    const lp = v.filt('lowpass', 2600, 0.7);
    v.osc('sawtooth', 415, { dur: 0.36, g: 0.16, a: 0.012, hold: true, r: 0.05, to: lp });
    v.osc('sawtooth', 523, { dur: 0.36, g: 0.14, a: 0.012, hold: true, r: 0.05, to: lp });
    v.osc('square', 207.5, { dur: 0.36, g: 0.06, a: 0.012, hold: true, r: 0.05, to: lp });
  },
  hornTruck(v) {
    const lp = v.filt('lowpass', 1500, 0.8);
    [155.5, 185, 233].forEach((f, i) => {
      v.osc('sawtooth', f, { dur: 0.62, g: 0.17, a: 0.03, hold: true, r: 0.09, to: lp, det: (i - 1) * 9 });
    });
    v.osc('square', 77.8, { dur: 0.62, g: 0.12, a: 0.03, hold: true, r: 0.09, to: lp });
  },
  alarm(v) {
    const bp = v.filt('bandpass', 1700, 0.9);
    v.osc('square', 1480, { dur: 0.3, g: 0.2, a: 0.004, hold: true, r: 0.012, to: bp });
    v.osc('square', 1110, { t: 0.3, dur: 0.3, g: 0.2, a: 0.004, hold: true, r: 0.012, to: bp });
  },
  nitro(v) {
    const n = v.noise('white', { dur: 0.7, g: 0.4, a: 0.06, type: 'bandpass', f: 350, q: 0.9 });
    v.sweep(n.f.frequency, [[0, 300], [0.3, 3200], [0.7, 1500]]);
    const lp = v.filt('lowpass', 1200, 3);
    v.sweep(lp.frequency, [[0, 400], [0.35, 2600]]);
    v.osc('sawtooth', 90, { dur: 0.6, g: 0.3, f1: 360, ft: 0.35, a: 0.03, to: lp });
    v.osc('sine', 80, { dur: 0.25, g: 0.5, f1: 45, a: 0.003 });
  },
  propBreak(v) {
    v.noise('white', { dur: 0.03, g: 0.35, type: 'highpass', f: 1500, a: 0.0005 });
    [[312, 0.45, 0.16], [487, 0.36, 0.12], [743, 0.3, 0.1], [1117, 0.22, 0.08], [1642, 0.16, 0.05]].forEach((p) => {
      v.fm(p[0] * (0.96 + rnd() * 0.08), 1.414, 1.4, { dur: p[1], g: p[2], a: 0.001 });
    });
    v.osc('sine', 150, { dur: 0.08, g: 0.3, f1: 70, a: 0.001 });
  },
  thud(v) {
    v.osc('sine', 88, { dur: 0.18, g: 0.7, f1: 36, ft: 0.12, a: 0.002 });
    v.noise('pink', { dur: 0.12, g: 0.4, type: 'lowpass', f: 300, a: 0.002 });
    v.osc('triangle', 260, { t: 0.02, dur: 0.07, g: 0.06, f1: 190, a: 0.004 });
    v.noise('white', { t: 0.03, dur: 0.04, g: 0.07, type: 'bandpass', f: 1800, q: 2, a: 0.002 });
  },
  sink(v) {
    const n = v.noise('pink', { dur: 1.4, g: 0.35, a: 0.1, type: 'lowpass', f: 500, q: 1 });
    v.sweep(n.f.frequency, [[0, 700], [1.4, 180]]);
    for (let i = 0; i < 13; i++) {
      const t = rnd() * 1.2, f = 160 + rnd() * 420;
      v.osc('sine', f, { t, dur: 0.07 + rnd() * 0.05, g: 0.14 + rnd() * 0.1, f1: f * (1.7 + rnd()), a: 0.006 });
    }
  },

  // ---- Police ---------------------------------------------------------------------------
  starUp(v) {
    const lp = v.filt('lowpass', 3800, 1);
    [659.25, 783.99, 987.77].forEach((f, i) => {
      const last = i === 2;
      v.osc('sawtooth', f, { t: i * 0.085, dur: last ? 0.42 : 0.075, g: 0.13, a: 0.003, hold: !last, r: 0.01, to: lp });
      v.osc('square', f * 0.5, { t: i * 0.085, dur: last ? 0.4 : 0.075, g: 0.06, a: 0.003, hold: !last, r: 0.01, to: lp });
    });
    v.osc('sawtooth', 82.4, { dur: 0.5, g: 0.22, a: 0.004, to: lp });
    v.noise('white', { dur: 0.04, g: 0.12, type: 'highpass', f: 3000, a: 0.001 });
  },
  evaded(v) {
    [783.99, 659.25, 523.25, 392].forEach((f, i) => {
      v.osc('sine', f, { t: i * 0.13, dur: 0.75, g: 0.13, a: 0.006 });
      v.osc('triangle', f * 2, { t: i * 0.13, dur: 0.4, g: 0.035, a: 0.006 });
    });
  },
  scanner(v) {
    [0, 0.24, 0.48].forEach((t, i) => {
      const g = 0.2 * Math.pow(0.42, i);
      v.osc('sine', 1245, { t, dur: 0.5, g, a: 0.004, f1: 1225 });
      v.osc('sine', 2490, { t, dur: 0.2, g: g * 0.2, a: 0.004 });
    });
  },
  chatter(v) {
    const band = v.filt('bandpass', 1500, 1.1);
    const hp = v.filt('highpass', 400, 0.7, band);
    v.noise('white', { dur: 0.035, g: 0.3, a: 0.001, to: hp });               // squelch open
    v.noise('white', { t: 0.47, dur: 0.05, g: 0.3, a: 0.001, to: hp });       // squelch close
    v.noise('white', { dur: 0.5, g: 0.035, hold: true, to: hp });             // carrier hiss
    const fa = v.filt('bandpass', 700, 5, hp), fb = v.filt('bandpass', 1900, 6, hp, 0.7);
    const sp = v.split(fa, fb);
    let t = 0.045;
    for (let i = 0; i < 7 && t < 0.42; i++) {                                 // garbled syllables
      const d = 0.045 + rnd() * 0.05, p = 110 + rnd() * 70;
      v.osc('sawtooth', p, { t, dur: d, g: 1.2, a: 0.01, hold: true, r: 0.015, f1: p * (0.85 + rnd() * 0.35), to: sp });
      fa.frequency.setValueAtTime(v._f(400 + rnd() * 500), v.t0 + t);
      fb.frequency.setValueAtTime(v._f(1300 + rnd() * 1200), v.t0 + t);
      t += d + 0.012 + rnd() * 0.03;
    }
  },

  // ---- Missions -------------------------------------------------------------------------
  missionStart(v) {
    const lp = v.filt('lowpass', 2600, 0.8);
    const chord = (t, fs, dur) => fs.forEach((f, i) => {
      v.osc('sawtooth', f, { t, dur, g: 0.085, a: 0.008, det: i % 2 ? 7 : -7, to: lp });
    });
    chord(0, [220, 329.63, 440], 0.22);
    chord(0.16, [261.63, 392, 523.25], 0.6);
    v.osc('sine', 110, { dur: 0.2, g: 0.25, a: 0.004 });
    v.osc('sine', 130.81, { t: 0.16, dur: 0.6, g: 0.25, a: 0.004 });
    v.osc('sine', 1046.5, { t: 0.16, dur: 0.5, g: 0.05, a: 0.005 });
  },
  missionPass(v) {
    const lp = v.filt('lowpass', 3600, 0.7);
    [[392, 0, 0.13], [523.25, 0.12, 0.13], [659.25, 0.24, 0.13], [783.99, 0.36, 0.25], [659.25, 0.6, 0.13], [1046.5, 0.72, 1.3]].forEach((m) => {
      const short = m[2] < 0.3;
      v.osc('sawtooth', m[0], { t: m[1], dur: m[2], g: 0.11, a: 0.006, hold: short, r: 0.02, to: lp, det: -6 });
      v.osc('square', m[0], { t: m[1], dur: m[2], g: 0.045, a: 0.006, hold: short, r: 0.02, to: lp, det: 7 });
    });
    const chord = (t, fs, dur) => fs.forEach((f, i) => {
      v.osc('sawtooth', f, { t, dur, g: 0.06, a: 0.02, det: i % 2 ? 5 : -5, to: lp });
    });
    chord(0, [130.81, 196, 261.63], 0.4);
    chord(0.36, [174.61, 220, 261.63], 0.28);
    chord(0.6, [196, 246.94, 293.66], 0.16);
    chord(0.72, [130.81, 196, 261.63, 329.63, 392], 1.35);
    v.osc('sine', 65.41, { t: 0.72, dur: 1.3, g: 0.3, a: 0.01 });
    v.osc('sine', 98, { t: 0.6, dur: 0.14, g: 0.2, a: 0.01, hold: true });
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => v.osc('sine', f, { t: 0.9 + i * 0.07, dur: 0.6, g: 0.035, a: 0.004 }));
    v.noise('white', { t: 0.72, dur: 0.5, g: 0.06, type: 'highpass', f: 6000, a: 0.003 });
  },
  missionFail(v) {
    const lp = v.filt('lowpass', 1500, 1);
    v.sweep(lp.frequency, [[0, 1800], [1.3, 350]]);
    [[392, 0], [369.99, 0.26], [349.23, 0.52]].forEach((m) => {
      v.osc('sawtooth', m[0], { t: m[1], dur: 0.26, g: 0.14, a: 0.01, hold: true, r: 0.03, to: lp });
      v.osc('sawtooth', m[0] * 0.5, { t: m[1], dur: 0.26, g: 0.1, a: 0.01, hold: true, r: 0.03, to: lp });
    });
    const o = v.osc('sawtooth', 329.63, { t: 0.78, dur: 0.65, g: 0.15, f1: 150, ft: 0.6, a: 0.01, to: lp });
    v.lfo('sine', 6, 9, o.frequency, { t: 0.78, dur: 0.65 });
    v.osc('sawtooth', 164.81, { t: 0.78, dur: 0.65, g: 0.11, f1: 75, ft: 0.6, a: 0.01, to: lp });
  },
  checkpoint(v) {
    v.osc('triangle', 987.77, { dur: 0.07, g: 0.16 });
    v.osc('sine', 1318.5, { t: 0.055, dur: 0.32, g: 0.18, a: 0.003 });
    v.osc('sine', 1975.5, { t: 0.055, dur: 0.26, g: 0.07, a: 0.003 });
  },
  countdown(v) {
    v.osc('sine', 660, { dur: 0.13, g: 0.22, a: 0.004, hold: true, r: 0.04 });
    v.osc('triangle', 1320, { dur: 0.1, g: 0.04, a: 0.004, hold: true, r: 0.04 });
  },
  go(v) {
    v.osc('sine', 1320, { dur: 0.5, g: 0.22, a: 0.004, hold: true, r: 0.2 });
    v.osc('triangle', 1980, { dur: 0.4, g: 0.05, a: 0.004 });
    v.osc('sine', 660, { dur: 0.45, g: 0.08, a: 0.004, hold: true, r: 0.2 });
  },
  busted(v) {
    const lp = v.filt('lowpass', 1900, 0.9);
    [[311.13, 0, 0.2], [261.63, 0.2, 0.2], [207.65, 0.4, 0.8]].forEach((m) => {
      const short = m[2] < 0.5;
      v.osc('sawtooth', m[0], { t: m[1], dur: m[2], g: 0.13, a: 0.008, hold: short, r: 0.03, to: lp });
      v.osc('square', m[0] * 0.5, { t: m[1], dur: m[2], g: 0.09, a: 0.008, hold: short, r: 0.03, to: lp });
    });
    v.osc('sine', 51.9, { t: 0.4, dur: 0.8, g: 0.4, a: 0.006 });
    [0.44, 0.56].forEach((t) => {                                             // cuffs ratchet
      v.noise('white', { t, dur: 0.025, g: 0.2, type: 'bandpass', f: 3200, q: 2, a: 0.0005 });
      v.osc('triangle', 2100, { t, dur: 0.04, g: 0.06, a: 0.0005 });
    });
  },
  wasted(v) {
    const lp = v.filt('lowpass', 1300, 1.2);
    v.sweep(lp.frequency, [[0, 1600], [1.8, 160]]);
    [220, 261.63, 311.13].forEach((f, i) => {
      v.osc('sawtooth', f, { dur: 1.8, g: 0.11, f1: f * 0.7, ft: 1.7, a: 0.03, to: lp, det: (i - 1) * 8 });
    });
    v.osc('sine', 55, { dur: 1.7, g: 0.5, f1: 36, ft: 1.5, a: 0.01 });
    v.noise('pink', { dur: 1.2, g: 0.15, type: 'lowpass', f: 400, a: 0.02 });
  },
  phone(v) {
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 4; i++) {
        const t = k * 0.24 + i * 0.045;
        v.osc('sine', i % 2 ? 2093 : 1568, { t, dur: 0.045, g: 0.14, a: 0.003, hold: true, r: 0.008 });
        v.osc('triangle', i % 2 ? 1046.5 : 784, { t, dur: 0.045, g: 0.035, a: 0.003, hold: true, r: 0.008 });
      }
    }
  },
});

// name -> [nominal peak (0..1, also the voice-stealing priority), trim so the recipe hits that peak].
// The trims come from measuring every recipe in isolation (see the test harness, ?calib=1).
const SFX_LEVEL = Object.assign(Object.create(null), {
  uiMove: [0.16, 1], uiSelect: [0.2, 1], uiBack: [0.18, 1], uiError: [0.2, 1],
  punch: [0.4, 1], whoosh: [0.22, 1], hurt: [0.34, 1], jump: [0.2, 1], land: [0.36, 1], splash: [0.4, 1],
  pickup: [0.22, 1], collectible: [0.26, 1], token: [0.2, 1], armor: [0.3, 1],
  pistol: [0.6, 1], policeShot: [0.6, 1], baton: [0.34, 1], reload: [0.26, 1], empty: [0.18, 1],
  empThrow: [0.2, 1], empBlast: [0.9, 1], hack: [0.2, 1], hackFail: [0.22, 1], bulletHit: [0.3, 1],
  crashSmall: [0.55, 1], crashBig: [0.85, 1], glass: [0.4, 1], explosion: [1.15, 1], doorOpen: [0.2, 1],
  doorClose: [0.36, 1], engineStart: [0.36, 1], horn: [0.4, 1], hornTruck: [0.5, 1], alarm: [0.3, 1],
  nitro: [0.5, 1], propBreak: [0.45, 1], thud: [0.5, 1], sink: [0.34, 1],
  starUp: [0.36, 1], evaded: [0.25, 1], scanner: [0.22, 1], chatter: [0.26, 1],
  missionStart: [0.36, 1], missionPass: [0.42, 1], missionFail: [0.36, 1], checkpoint: [0.25, 1],
  countdown: [0.22, 1], go: [0.25, 1], busted: [0.4, 1], wasted: [0.45, 1], phone: [0.2, 1],
});
const DEF_LEVEL = [0.3, 1];

// Soft bell for the night-forest "bioluminescent" chimes (internal; not reachable through play()).
const CHIME_NOTES = [523.25, 587.33, 698.46, 783.99, 880, 1046.5, 1174.66, 1396.91, 1567.98];
function chimeRecipe(v) {
  const i = Math.floor(rnd() * CHIME_NOTES.length);
  const one = (f, t, g) => {
    v.osc('sine', f, { t, dur: 2.6, g, a: 0.03 });
    v.osc('sine', f * 2.76, { t, dur: 0.9, g: g * 0.12, a: 0.02 });
    v.osc('sine', f * 1.003, { t, dur: 2.2, g: g * 0.5, a: 0.06 });
  };
  one(CHIME_NOTES[i], 0, 0.16);
  if (rnd() < 0.45) one(CHIME_NOTES[Math.min(CHIME_NOTES.length - 1, i + 1 + Math.floor(rnd() * 2))], 0.16 + rnd() * 0.2, 0.11);
}

// ---------------------------------------------------------------------------------------------
// AudioSystem
// ---------------------------------------------------------------------------------------------

export class AudioSystem {
  constructor() {
    // No AudioContext here: browsers refuse to start one before a user gesture. See unlock().
    this.ctx = null;
    this.musicBus = null;       // GainNode the radio connects into (exists after unlock)
    this.output = null;         // last node before the speakers (after limiter and master volume)
    this._master = 0.8;
    this._music = 0.6;
    this._paused = false;
    this._unlocked = false;
    this._built = false;
    this._fmax = 20000;
    this._buf = null;
    this._curves = new Map();
    this._lis = { x: 0, y: 0, z: 0, yaw: 0, fx: 0, fz: 1, rx: -1, rz: 0 };
    this._sp = { d: 0, gain: 0, pan: 0, lp: 0 };
    this._indoor = 0;           // 1 while the listener is inside a room: the world outside is muffled
    this._voices = [];
    this._dying = [];
    this._nodeCount = 0;
    this._stat = { played: 0, dropped: 0, peakVoices: 0 };
    this._pending = [];
    this._frame = 0;
    this._ctlT = -1; this._ambT = -1; this._nudgeT = 0;
    this._engS = { cls: 'car', rpm: 0, throttle: 0, speed: 0, nitro: false, heavy: 0, damaged: 0 };
    this._engOn = false; this._engFrame = -1e9;
    this._skidLevel = 0; this._skidSurface = 'asphalt'; this._skidFrame = -1e9;
    this._sirNear = [{ id: null, x: 0, z: 0, d2: 0, slot: null }, { id: null, x: 0, z: 0, d2: 0, slot: null }, { id: null, x: 0, z: 0, d2: 0, slot: null }];
    this._sirCount = 0; this._sirenFrame = -1e9;
    this._rotS = { on: false, x: 0, z: 0, level: 0 }; this._rotFrame = -1e9; this._rot = null;
    this._amb = { city: 0, forest: 0, swamp: 0, beach: 0, night: 0, rain: 0, wind: 0 };
    this._ambFrame = -1e9;
    this._chimeT = 1.5; this._chimeLevel = 0;
    this._eng = null; this._skid = null; this._sir = null; this._ambN = null;
  }

  // ---- lifecycle -------------------------------------------------------------------------

  /** Call from the first click / key press. Creates the context, or resumes it. Safe to repeat. */
  unlock() {
    try {
      this._unlocked = true;
      if (!this.ctx) {
        const AC = (typeof globalThis !== 'undefined') && (globalThis.AudioContext || globalThis.webkitAudioContext);
        if (!AC) return;
        let c;
        try { c = new AC({ latencyHint: 'interactive' }); } catch (e) { c = new AC(); }
        this.ctx = c;
        try {
          this._build();
        } catch (e) {
          // A half-built graph is worse than silence: drop the context and stay a no-op.
          this._built = false;
          try { c.close(); } catch (e2) { /* ignore */ }
          this.ctx = null; this.musicBus = null; this.output = null;
          return;
        }
        c.onstatechange = () => { try { if (c.state === 'running') this._flushPending(); } catch (e) { /* ignore */ } };
      }
      if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') {
        const p = this.ctx.resume();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) { /* never throw */ }
  }

  /** True once the context exists and is running. */
  get ready() {
    return !!(this.ctx && this._built && this.ctx.state === 'running');
  }

  /** True between suspend() and resume(). */
  get paused() { return this._paused; }

  /** Live counters for tests and debug overlays. */
  get stats() {
    return {
      voices: this._voices.length,
      dying: this._dying.length,
      nodes: this._nodeCount,
      peakVoices: this._stat.peakVoices,
      played: this._stat.played,
      dropped: this._stat.dropped,
    };
  }

  /** Volumes 0..1 (perceptual: gain = v squared). Works before unlock; the values are remembered. */
  setVolumes(master, music) {
    try {
      if (typeof master === 'number' && master === master) this._master = clamp(master, 0, 1);
      if (typeof music === 'number' && music === music) this._music = clamp(music, 0, 1);
      if (this._built) {
        const t = this.ctx.currentTime;
        this.output.gain.setTargetAtTime(this._master * this._master, t, 0.03);
        this.musicBus.gain.setTargetAtTime(this._music * this._music * BUS.music, t, 0.03);
      }
    } catch (e) { /* never throw */ }
  }

  /**
   * Pause menu. World sound (engine, sirens, ambience, music, in-flight effects) fades out, but the
   * context keeps running so `ui*` one-shots still play while the menu is open.
   */
  suspend() {
    try {
      this._paused = true;
      if (this._built) this._world.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    } catch (e) { /* never throw */ }
  }

  resume() {
    try {
      this._paused = false;
      if (this._built) {
        this._world.gain.setTargetAtTime(1, this.ctx.currentTime, 0.08);
        this._nudge(true);
      }
    } catch (e) { /* never throw */ }
  }

  // ---- per-frame inputs (cheap: they only record what the game wants) ------------------------

  /** Inside a room (interiors): positional sounds and the outdoor beds come through the walls. */
  setIndoor(on) { this._indoor = on ? 1 : 0; }

  setListener(x, y, z, yaw) {
    try {
      const L = this._lis;
      L.x = fin(x, L.x); L.y = fin(y, L.y); L.z = fin(z, L.z); L.yaw = fin(yaw, L.yaw);
      const s = Math.sin(L.yaw), c = Math.cos(L.yaw);
      L.fx = s; L.fz = c;       // forward on the ground plane
      L.rx = -c; L.rz = s;      // right
    } catch (e) { /* never throw */ }
  }

  engine(state) {
    try {
      this._engFrame = this._frame;
      if (!state || typeof state !== 'object') { this._engOn = false; return; }
      const s = this._engS;
      s.cls = state.cls === 'hover' || state.cls === 'boat' || state.cls === 'heli' ? state.cls : 'car';
      s.rpm = c01(state.rpm);
      s.throttle = c01(state.throttle);
      s.speed = clamp(Math.abs(fin(state.speed, 0)), 0, 150);
      s.nitro = !!state.nitro;
      s.heavy = c01(state.heavy);
      s.damaged = c01(state.damaged);
      this._engOn = true;
    } catch (e) { /* never throw */ }
  }

  /** The nearest helicopter with its rotor turning (not the one the player flies): { x, z, level } or null. */
  rotor(state) {
    try {
      this._rotFrame = this._frame;
      const R = this._rotS;
      R.on = !!state && typeof state === 'object';
      if (R.on) { R.x = fin(state.x, R.x); R.z = fin(state.z, R.z); R.level = c01(state.level); }
    } catch (e) { /* never throw */ }
  }

  skid(level, surface) {
    try {
      this._skidFrame = this._frame;
      this._skidLevel = c01(level);
      this._skidSurface = typeof surface === 'string' ? surface : 'asphalt';
    } catch (e) { /* never throw */ }
  }

  sirens(list) {
    try {
      this._sirenFrame = this._frame;
      const near = this._sirNear, L = this._lis;
      let n = 0;
      if (list && typeof list.length === 'number') {
        for (let i = 0; i < list.length; i++) {
          const e = list[i];
          if (!e || typeof e !== 'object') continue;
          const x = fin(e.x, NaN), z = fin(e.z, NaN);
          if (x !== x || z !== z) continue;
          const d2 = (x - L.x) * (x - L.x) + (z - L.z) * (z - L.z);
          // insertion into the (at most 3) nearest, kept sorted by distance
          let k = n < 3 ? n : 3;
          while (k > 0 && near[k - 1].d2 > d2) k--;
          if (k >= 3) continue;
          const last = n < 3 ? n : 2, spare = near[last];
          for (let j = last; j > k; j--) near[j] = near[j - 1];
          near[k] = spare;
          spare.id = e.id !== undefined && e.id !== null ? e.id : i;
          spare.x = x; spare.z = z; spare.d2 = d2;
          if (n < 3) n++;
        }
      }
      this._sirCount = n;
    } catch (e) { this._sirCount = 0; }
  }

  ambient(mix) {
    try {
      this._ambFrame = this._frame;
      const a = this._amb, m = mix && typeof mix === 'object' ? mix : EMPTY;
      a.city = c01(m.city); a.forest = c01(m.forest); a.swamp = c01(m.swamp); a.beach = c01(m.beach);
      a.night = c01(m.night); a.rain = c01(m.rain); a.wind = c01(m.wind);
    } catch (e) { /* never throw */ }
  }

  /** Every frame, after the calls above. */
  update(dt) {
    try {
      const c = this.ctx;
      if (!c || !this._built) return;
      this._frame++;
      if (c.state !== 'running') { this._nudge(false); return; }
      const now = c.currentTime;
      dt = clamp(fin(dt, 0.016), 0, 0.25);
      if (now - this._ctlT >= CONTROL_DT) {
        this._ctlT = now;
        this._applyEngine(now);
        this._applySkid();
        this._applySirens();
        this._applyRotor();
      }
      if (now - this._ambT >= 0.1) {
        this._ambT = now;
        this._applyAmbient();
      }
      this._sweep(now);
      if (this._chimeLevel > 0.02 && !this._paused) {
        this._chimeT -= dt;
        if (this._chimeT <= 0) {
          this._chimeT = (1.3 + Math.random() * 2.6) / (0.45 + this._chimeLevel);
          this._spawn('chime', { volume: this._chimeLevel, pitch: Math.random() < 0.25 ? 0.5 : 1 }, chimeRecipe, this._ambBus, (Math.random() * 2 - 1) * 0.7);
        }
      }
    } catch (e) { /* never throw */ }
  }

  // ---- one-shots ---------------------------------------------------------------------------

  /**
   * One-shot. opts = { x, z, volume = 1, pitch = 1 }. With x and z the sound is positional
   * (distance attenuation out to ~160 m, stereo pan from the listener yaw); without, flat and centred.
   * Unknown names are ignored.
   */
  play(name, opts) {
    try {
      if (typeof name !== 'string') return;
      const recipe = SFX[name];
      if (!recipe) return;
      const c = this.ctx;
      if (!c || !this._built) return;
      if (c.state !== 'running') { this._queue(name, opts); return; }
      this._spawn(name, opts, recipe, null, 0);
    } catch (e) { /* never throw */ }
  }

  // Sounds requested in the instant between unlock() and the context actually starting (the click
  // that unlocks audio usually also wants a UI blip) are held briefly and played when it starts.
  _queue(name, opts) {
    if (!this._unlocked || this._pending.length >= 4) return;
    const o = opts && typeof opts === 'object' ? opts : EMPTY;
    this._pending.push({ name, opts: { x: o.x, z: o.z, volume: o.volume, pitch: o.pitch }, at: Date.now() });
  }

  _flushPending() {
    const list = this._pending;
    this._pending = [];
    const wall = Date.now();
    for (const p of list) if (wall - p.at < 400) this.play(p.name, p.opts);
  }

  _curve(drive) {
    let c = this._curves.get(drive);
    if (!c) { c = tanhCurve(drive); this._curves.set(drive, c); }
    return c;
  }

  _spawn(name, opts, recipe, dest, panFlat) {
    const c = this.ctx, now = c.currentTime;
    const o = opts && typeof opts === 'object' ? opts : EMPTY;
    const vol = clamp(fin(o.volume, 1), 0, 3);
    if (vol < 0.001) return;
    const pitch = clamp(fin(o.pitch, 1), 0.25, 4);
    const lv = SFX_LEVEL[name] || DEF_LEVEL;
    const ui = name.charCodeAt(0) === 117 && name.charCodeAt(1) === 105;      // "ui..."
    let sp = null;
    if (typeof o.x === 'number' && typeof o.z === 'number' && isFinite(o.x) && isFinite(o.z)) {
      sp = this._spatial(o.x, o.z, 14, HEAR_DIST);
      if (!sp || sp.gain * vol < 0.004) return;                               // out of earshot
    }
    const level = vol * (sp ? sp.gain : 1) * lv[0];
    if (!this._admit(name, level, ui, now)) { this._stat.dropped++; return; }

    const v = new Shot(this, now + 0.003, pitch);
    try {
      recipe(v);
      v.out.gain.value = vol * lv[1] * (sp ? sp.gain * 1.3 : 1);
      let tail = v.out;
      if (sp) {
        if (sp.lp < 14000) {
          const f = v._add(c.createBiquadFilter());
          f.type = 'lowpass'; f.frequency.value = Math.min(sp.lp, this._fmax); f.Q.value = 0.5;
          tail.connect(f); tail = f;
        }
        if (c.createStereoPanner) {
          const p = v._add(c.createStereoPanner());
          p.pan.value = sp.pan;
          tail.connect(p); tail = p;
        }
      } else if (panFlat && c.createStereoPanner) {
        const p = v._add(c.createStereoPanner());
        p.pan.value = panFlat;
        tail.connect(p); tail = p;
      }
      tail.connect(dest || (ui ? this._uiBus : this._sfxBus));
    } catch (e) {
      this._dispose(v, false);
      return;
    }
    v.name = name; v.level = level; v.ui = ui; v.born = now; v.life = Math.max(0.05, v.end - now);
    this._voices.push(v);
    this._nodeCount += v.nodes.length;
    this._stat.played++;
    if (this._voices.length > this._stat.peakVoices) this._stat.peakVoices = this._voices.length;
  }

  // Voice budget. Returns false when the new sound should not play.
  _admit(name, level, ui, now) {
    this._sweep(now);
    const vs = this._voices;
    let same = 0, oldestSame = -1, newest = -1;
    for (let i = 0; i < vs.length; i++) {
      if (vs[i].name !== name) continue;
      same++;
      if (oldestSame < 0 || vs[i].born < vs[oldestSame].born) oldestSame = i;
      if (vs[i].born > newest) newest = vs[i].born;
    }
    if (newest >= 0 && now - newest < 0.012) return false;                    // same sound, same instant
    if (same >= MAX_SAME) this._kill(oldestSame, now);
    if (vs.length >= MAX_VOICES) {
      let worst = -1, worstScore = Infinity;
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i];
        const score = v.level * (v.ui ? 4 : 1) * Math.max(0.05, 1 - (now - v.born) / v.life);
        if (score < worstScore) { worstScore = score; worst = i; }
      }
      if (!ui && worstScore > level) return false;                            // everything playing matters more
      this._kill(worst, now);
    }
    return true;
  }

  // Fade a voice out quickly and hand it to the dying list (it stops counting as a voice at once).
  _kill(i, now) {
    const v = this._voices[i];
    if (!v) return;
    this._voices.splice(i, 1);
    try {
      v.out.gain.cancelScheduledValues(now);
      v.out.gain.setTargetAtTime(0, now, 0.008);
    } catch (e) { /* ignore */ }
    v.end = now + 0.06;
    this._dying.push(v);
  }

  _sweep(now) {
    const vs = this._voices;
    for (let i = vs.length - 1; i >= 0; i--) {
      if (now >= vs[i].end) { this._dispose(vs[i], true); vs.splice(i, 1); }
    }
    const ds = this._dying;
    for (let i = ds.length - 1; i >= 0; i--) {
      if (now >= ds[i].end) { this._dispose(ds[i], true); ds.splice(i, 1); }
    }
  }

  _dispose(v, counted) {
    for (let i = 0; i < v.srcs.length; i++) { try { v.srcs[i].stop(); } catch (e) { /* already stopped */ } }
    for (let i = 0; i < v.nodes.length; i++) { try { v.nodes[i].disconnect(); } catch (e) { /* ignore */ } }
    if (counted) this._nodeCount -= v.nodes.length;
    v.srcs.length = 0; v.nodes.length = 0;
  }

  // Distance / direction of a world point relative to the listener. Returns null beyond `max`.
  _spatial(x, z, ref, max) {
    const L = this._lis, dx = x - L.x, dz = z - L.z, d = Math.sqrt(dx * dx + dz * dz);
    if (!(d < max)) return null;
    const sp = this._sp, k = d / max;
    let side = 0, front = 1;
    if (d > 0.01) { side = (dx * L.rx + dz * L.rz) / d; front = (dx * L.fx + dz * L.fz) / d; }
    const behind = front < 0 ? -front : 0;
    sp.d = d;
    sp.gain = (ref / (ref + d)) * (1 - k * k) * (1 - 0.15 * behind);
    sp.pan = clamp(side * Math.min(1, d / 6) * 0.85, -0.85, 0.85);
    sp.lp = clamp((17000 / (1 + d / 30)) * (1 - 0.35 * behind), 500, 17000);
    if (this._indoor) { sp.gain *= 0.12; sp.lp = Math.min(sp.lp, 650); }
    return sp;
  }

  // ---- persistent graph ----------------------------------------------------------------------

  _g(v) { const n = this.ctx.createGain(); n.gain.value = v; this._nodeCount++; return n; }
  _o(type, f) {
    const n = this.ctx.createOscillator();
    n.type = type; n.frequency.value = f; n.start();
    this._nodeCount++;
    return n;
  }
  _bq(type, f, q) {
    const n = this.ctx.createBiquadFilter();
    n.type = type; n.frequency.value = Math.min(f, this._fmax); n.Q.value = q;
    this._nodeCount++;
    return n;
  }
  _ws(curve) { const n = this.ctx.createWaveShaper(); n.curve = curve; this._nodeCount++; return n; }
  _pn(p) {
    const c = this.ctx, n = c.createStereoPanner ? c.createStereoPanner() : c.createGain();
    if (n.pan) n.pan.value = p;
    this._nodeCount++;
    return n;
  }
  _loop(buf, rate, offset) {
    const n = this.ctx.createBufferSource();
    n.buffer = buf; n.loop = true; n.playbackRate.value = rate;
    n.start(0, offset % buf.duration);
    this._nodeCount++;
    return n;
  }
  _stereo(a, b) {
    const m = this.ctx.createChannelMerger(2);
    a.connect(m, 0, 0); b.connect(m, 0, 1);
    this._nodeCount++;
    return m;
  }
  // LFO -> depth -> param (the param keeps its own base value; the LFO adds to it).
  _lfo(type, f, depth, param) {
    const o = this._o(type, f), g = this._g(depth);
    o.connect(g); g.connect(param);
    return g;
  }

  // Retarget a parameter smoothly; skipped when the target has not really changed, so steady
  // states cost nothing and the automation timeline stays short.
  _set(p, v, tc) {
    if (v !== v || v === Infinity || v === -Infinity) return;
    const last = p._tv;
    if (last !== undefined && Math.abs(v - last) <= 1e-5 + Math.abs(last) * 0.003) return;
    p._tv = v;
    p.setTargetAtTime(v, this.ctx.currentTime, tc);
  }

  _nudge(force) {
    // The browser can suspend a context on its own (tab switch on mobile, device change).
    const c = this.ctx, wall = Date.now();
    if (!c || !this._unlocked || c.state !== 'suspended') return;
    if (!force && wall - this._nudgeT < 1000) return;
    this._nudgeT = wall;
    const p = c.resume();
    if (p && p.catch) p.catch(() => {});
  }

  _build() {
    const c = this.ctx;
    this._fmax = Math.min(20000, c.sampleRate * 0.45);
    this._buf = { white: makeWhite(c, 2), pink: makePink(c, 4), lf: makeLfNoise(c), crickets: makeCrickets(c), swamp: makeSwamp(c) };

    // mix -> limiter -> make-up trim -> soft clip -> master volume -> speakers
    const mix = this._mix = this._g(1);
    const lim = this._lim = c.createDynamicsCompressor();
    this._nodeCount++;
    lim.threshold.value = LIM_THRESHOLD; lim.knee.value = 0; lim.ratio.value = LIM_RATIO;
    lim.attack.value = 0.002; lim.release.value = 0.16;
    const trim = this._g(LIM_TRIM * OUT_GAIN * 0.5);     // 0.5: the soft-clip table spans [-2, 2]
    const clip = this._ws(softClipCurve());
    const out = this.output = this._g(this._master * this._master);
    mix.connect(lim); lim.connect(trim); trim.connect(clip); clip.connect(out); out.connect(c.destination);

    this._uiBus = this._g(BUS.ui); this._uiBus.connect(mix);
    this._world = this._g(this._paused ? 0 : 1); this._world.connect(mix);
    const bus = (g) => { const n = this._g(g); n.connect(this._world); return n; };
    this._sfxBus = bus(BUS.sfx);
    this.musicBus = bus(this._music * this._music * BUS.music);
    this._engBus = bus(BUS.engine);
    this._skidBus = bus(BUS.skid);
    this._sirenBus = bus(BUS.siren);
    this._ambBus = bus(BUS.ambient);

    // Noise sources shared by every continuous sound; the stereo pairs are decorrelated copies.
    this._white = this._loop(this._buf.white, 1, 0);
    this._pink = this._loop(this._buf.pink, 1, 0);
    this._whiteSt = this._stereo(this._white, this._loop(this._buf.white, 1, 0.93));
    this._pinkSt = this._stereo(this._pink, this._loop(this._buf.pink, 1, 1.87));

    this._buildEngine();
    this._buildSkid();
    this._buildSirens();
    this._buildRotor();
    this._buildAmbient();
    this._built = true;
  }

  // ---- engine --------------------------------------------------------------------------------

  _buildEngine() {
    const E = {};
    E.out = this._g(0); E.out.connect(this._engBus);
    // tonal core: three oscillators -> drive -> low-pass (opens with throttle) -> roughness AM.
    // The high-pass keeps infrasonic rumble (half-order of a 20 Hz truck idle) out of the limiter.
    E.oscA = this._o('sawtooth', 60); E.oscB = this._o('square', 30); E.oscC = this._o('sawtooth', 90);
    E.gA = this._g(0.4); E.gB = this._g(0.3); E.gC = this._g(0.15);
    E.pre = this._g(0.3);
    E.sh = this._ws(tanhCurve(3));
    E.lp = this._bq('lowpass', 600, 1);
    E.am = this._g(1);
    E.tone = this._g(0.2);
    E.hp = this._bq('highpass', 55, 0.7);
    E.body = this._bq('peaking', 320, 0.9);   // lift the growl region small speakers can reproduce
    E.body.gain.value = 5;
    E.oscA.connect(E.gA); E.oscB.connect(E.gB); E.oscC.connect(E.gC);
    E.gA.connect(E.pre); E.gB.connect(E.pre); E.gC.connect(E.pre);
    E.pre.connect(E.sh); E.sh.connect(E.lp); E.lp.connect(E.am); E.am.connect(E.tone); E.tone.connect(E.hp); E.hp.connect(E.body); E.body.connect(E.out);
    E.lfo = this._o('sine', 12); E.lfoD = this._g(0.2);
    E.lfo.connect(E.lfoD); E.lfoD.connect(E.am.gain);
    // slow random pitch drift (always) and amplitude stumbles (when damaged)
    E.jitD = this._g(8);
    this._loop(this._buf.lf, 1.0, 0).connect(E.jitD);
    E.jitD.connect(E.oscA.detune); E.jitD.connect(E.oscB.detune); E.jitD.connect(E.oscC.detune);
    E.misD = this._g(0);
    this._loop(this._buf.lf, 2.7, 3.3).connect(E.misD);
    E.misD.connect(E.am.gain);
    // electric whine / turbine whistle
    E.whine = this._o('sine', 500); E.whG = this._g(0);
    E.whine.connect(E.whG); E.whG.connect(E.out);
    // breath: steady (air rush, water rush) straight out, pulsed (exhaust) through the roughness AM
    E.nBP = this._bq('bandpass', 500, 0.8); E.nG = this._g(0); E.nGm = this._g(0);
    this._pink.connect(E.nBP); E.nBP.connect(E.nG); E.nG.connect(E.out);
    E.nBP.connect(E.nGm); E.nGm.connect(E.am);
    // nitro: jet roar plus a resonant afterburner tone
    E.niBP = this._bq('bandpass', 1300, 0.7); E.niG = this._g(0);
    this._white.connect(E.niBP); E.niBP.connect(E.niG); E.niG.connect(E.out);
    E.niOsc = this._o('sawtooth', 160); E.niLP = this._bq('lowpass', 900, 4); E.niOG = this._g(0);
    E.niOsc.connect(E.niLP); E.niLP.connect(E.niOG); E.niOG.connect(E.out);
    E.cls = 'car'; E.pendingCls = null; E.switchAt = 0; E.audible = false;
    this._eng = E;
  }

  _applyEngine(now) {
    const E = this._eng;
    const on = this._engOn && this._frame - this._engFrame <= STALE_FRAMES;
    if (!on) {
      this._set(E.out.gain, 0, 0.05);          // silent within ~0.3 s
      E.audible = false;
      return;
    }
    const s = this._engS;
    // Changing class swaps an oscillator shape; do it behind a short dip so it cannot click.
    if (s.cls !== E.cls) {
      if (!E.audible) { this._engShape(s.cls); } else if (E.pendingCls !== s.cls) {
        E.pendingCls = s.cls; E.switchAt = now + 0.09;
        this._set(E.out.gain, 0, 0.02);
        return;
      } else if (now >= E.switchAt) { this._engShape(s.cls); } else return;
    }
    E.audible = true;
    const rpm = s.rpm, thr = s.throttle, spd = s.speed, heavy = s.heavy, dmg = s.damaged;
    const set = (p, v, tc) => this._set(p, v, tc);
    const FM = this._fmax;
    let f0, fB, fC, gA, gB, gC, pre, cut, q, lfoF, lfoD, jit, tone, whF, whG, nF, nQ, nG, nGm;
    if (E.cls === 'heli') {
      // turboshaft and rotor: a low drone and air rush chopped at the blade-pass rate, a thin turbine
      // whine over the top that climbs as the engine spools up
      f0 = 28 + 34 * rpm; fB = f0 * 0.5; fC = f0 * 3.02;
      gA = 0.3; gB = 0.35; gC = 0.06 + 0.06 * thr;
      pre = 0.2 + 0.2 * thr;
      cut = 260 + 900 * rpm + 400 * thr; q = 0.9;
      lfoF = 2 + 21 * rpm; lfoD = 0.15 + 0.65 * rpm + 0.1 * dmg;
      jit = 5 + 40 * dmg;
      tone = 0.55 + 0.25 * thr + 0.2 * rpm;
      whF = 1500 + 2900 * rpm; whG = 0.008 + 0.03 * rpm;
      nF = 300 + 320 * rpm + 120 * thr; nQ = 0.75;
      nG = 0.02 + 0.06 * Math.min(1, spd / 50); nGm = 0.25 + 0.75 * rpm;
    } else if (E.cls === 'hover') {
      // turbine: two beating saws through a resonant filter; pitch climbs with speed
      f0 = (170 + 5.5 * spd + 230 * rpm) * (1 - 0.3 * heavy);
      fB = (66 + 30 * rpm) * (1 - 0.3 * heavy); fC = f0 * 1.011;
      gA = 0.3; gB = 0.16 + 0.2 * heavy; gC = 0.3;
      pre = 0.22 + 0.14 * thr;
      cut = f0 * (1.5 + 2.2 * thr + rpm); q = 3.5 + 2 * thr;
      lfoF = 7 + 9 * rpm; lfoD = 0.1 + 0.12 * dmg;
      jit = 4 + 45 * dmg;
      tone = (0.7 + 0.36 * thr + 0.18 * rpm) * Math.pow(2, 0.25 * (1 - thr));
      whF = f0 * 2.98; whG = 0.02 + 0.045 * rpm;
      nF = 1500 + 2600 * rpm; nQ = 0.6; nG = 0.07 + 0.16 * thr + 0.002 * spd; nGm = 0;
    } else if (E.cls === 'boat') {
      // outboard: slow lumpy burble, plus water rushing past the hull as speed builds
      f0 = (26 + 50 * rpm) * (1 - 0.3 * heavy);
      fB = f0 * 0.5; fC = f0 * 2.01;
      gA = 0.5; gB = 0.3; gC = 0.16;
      pre = 0.35 + 0.5 * thr;
      cut = f0 * (4.5 + 7 * thr) + 160; q = 1.8;
      lfoF = f0 * 0.5; lfoD = 0.5 - 0.2 * rpm + 0.2 * dmg;
      jit = 14 + 50 * dmg;
      tone = (0.38 + 0.2 * thr) * Math.pow(2, 0.56 * (1 - thr));
      whF = 400; whG = 0;
      nF = 500 + 28 * spd; nQ = 0.5;
      nG = 0.03 + 0.3 * Math.pow(Math.min(1, spd / 22), 1.2); nGm = 0.25 + 0.4 * thr;
    } else {
      // hybrid car: combustion growl (firing order + half order + a fifth) with an electric whine on top
      f0 = (46 + 150 * Math.pow(rpm, 1.1)) * (1 - 0.36 * heavy);
      fB = f0 * 0.5; fC = f0 * 1.503;
      gA = 0.42; gB = 0.2 + 0.12 * heavy; gC = 0.14 + 0.16 * thr;
      pre = 0.26 + 0.5 * thr + 0.2 * dmg;
      cut = (f0 * (4.5 + 7 * Math.pow(thr, 1.3) + 2.5 * rpm) + 220) * (1 - 0.2 * heavy); q = 0.9 + 1.6 * thr;
      lfoF = f0 * 0.25; lfoD = 0.22 * (1 - 0.6 * rpm) + 0.1 * heavy + 0.25 * dmg;
      jit = 6 + 10 * (1 - rpm) + 50 * dmg;
      tone = (0.3 + 0.16 * thr + 0.06 * rpm) * Math.pow(2, (1 - thr) * (1 + 0.55 * (1 - rpm)));
      whF = 420 + 1500 * rpm + 4 * spd; whG = 0.012 + 0.035 * rpm * (0.5 + 0.5 * thr);
      nF = f0 * 5 + 300 * thr; nQ = 0.7;
      nG = 0.02 + 0.04 * thr; nGm = 0.15 + 0.5 * thr * (0.3 + 0.7 * rpm) + 0.3 * heavy + 0.4 * dmg;
    }
    set(E.oscA.frequency, f0, 0.05); set(E.oscB.frequency, fB, 0.05); set(E.oscC.frequency, fC, 0.05);
    set(E.gA.gain, gA, 0.08); set(E.gB.gain, gB, 0.08); set(E.gC.gain, gC, 0.08);
    set(E.pre.gain, pre, 0.06);
    set(E.lp.frequency, clamp(cut, 120, Math.min(7000, FM)), 0.06); set(E.lp.Q, q, 0.08);
    set(E.lfo.frequency, clamp(lfoF, 0.5, 200), 0.05); set(E.lfoD.gain, clamp(lfoD, 0, 0.8), 0.08);
    set(E.jitD.gain, jit, 0.1); set(E.misD.gain, 0.5 * dmg, 0.1);
    set(E.tone.gain, tone, 0.06);
    set(E.whine.frequency, clamp(whF, 50, Math.min(9000, FM)), 0.05); set(E.whG.gain, whG, 0.08);
    set(E.nBP.frequency, clamp(nF, 100, Math.min(8000, FM)), 0.08); set(E.nBP.Q, nQ, 0.1);
    set(E.nG.gain, nG, 0.08); set(E.nGm.gain, nGm, 0.08);
    const ni = s.nitro ? 1 : 0;
    set(E.niG.gain, 1.5 * ni, ni ? 0.07 : 0.16);
    set(E.niOG.gain, 0.45 * ni, ni ? 0.07 : 0.16);
    set(E.niBP.frequency, 900 + 1500 * rpm, 0.1);
    set(E.niOsc.frequency, 130 + 250 * rpm, 0.08);
    set(E.niLP.frequency, 700 + 1300 * rpm, 0.1);
    set(E.out.gain, 1, 0.05);
  }

  _engShape(cls) {
    const E = this._eng;
    E.cls = cls; E.pendingCls = null;
    E.oscB.type = cls === 'hover' || cls === 'heli' ? 'sine' : 'square';
  }

  // ---- tyre skid -----------------------------------------------------------------------------

  _buildSkid() {
    const K = {}, bus = this._skidBus;
    // squeal: two unstable oscillators and a little scrub noise through a resonator
    K.sqA = this._o('sawtooth', 950); K.sqB = this._o('triangle', 1270);
    const sm = this._g(1), gB = this._g(0.6), scr = this._g(0.45);
    K.sqA.connect(sm); K.sqB.connect(gB); gB.connect(sm); this._white.connect(scr); scr.connect(sm);
    K.sqBP = this._bq('bandpass', 1000, 3.5);
    const fl = this._g(1);
    K.sqG = this._g(0);
    sm.connect(K.sqBP); K.sqBP.connect(fl); fl.connect(K.sqG); K.sqG.connect(bus);
    const j = this._loop(this._buf.lf, 3.1, 7), jA = this._g(90), jB = this._g(-130);
    j.connect(jA); jA.connect(K.sqA.detune); j.connect(jB); jB.connect(K.sqB.detune);
    const j2 = this._loop(this._buf.lf, 1.7, 11), j2g = this._g(0.25);
    j2.connect(j2g); j2g.connect(fl.gain);
    // gravel / sand / grass hiss with a grainy amplitude
    K.hBP = this._bq('bandpass', 2000, 0.6);
    const hAM = this._g(0.7);
    K.hG = this._g(0);
    this._white.connect(K.hBP); K.hBP.connect(hAM); hAM.connect(K.hG); K.hG.connect(bus);
    const j3 = this._loop(this._buf.lf, 4.3, 1), j3g = this._g(0.3);
    j3.connect(j3g); j3g.connect(hAM.gain);
    // low rumble under loose surfaces
    const rLP = this._bq('lowpass', 240, 0.7);
    K.rG = this._g(0);
    this._pink.connect(rLP); rLP.connect(K.rG); K.rG.connect(bus);
    this._skid = K;
  }

  _applySkid() {
    const K = this._skid;
    const lv = this._frame - this._skidFrame <= STALE_FRAMES ? this._skidLevel : 0;
    const sf = this._skidSurface;
    let sq = 0, hiss, hf, hq, rum = 0, pitch = 1;
    switch (sf) {
      case 'dirt': hiss = 0.8; hf = 1500; hq = 0.7; rum = 0.5; break;
      case 'sand': hiss = 0.7; hf = 2900; hq = 0.5; rum = 0.3; break;
      case 'grass': hiss = 0.48; hf = 950; hq = 0.6; rum = 0.35; break;
      case 'mud': hiss = 0.16; hf = 420; hq = 0.8; rum = 0.3; break;
      case 'water': hiss = 0.16; hf = 1200; hq = 0.5; break;
      case 'concrete': hiss = 0.16; hf = 2600; hq = 0.6; pitch = 1.12;
        sq = 0.8 * Math.pow(clamp((lv - 0.12) / 0.88, 0, 1), 1.3); break;
      default: hiss = 0.13; hf = 2300; hq = 0.6;
        sq = Math.pow(clamp((lv - 0.12) / 0.88, 0, 1), 1.3);
    }
    const f = (870 + 420 * lv) * pitch;
    this._set(K.sqA.frequency, f, 0.08); this._set(K.sqB.frequency, f * 1.335, 0.08);
    this._set(K.sqBP.frequency, f * 1.04, 0.08);
    this._set(K.sqG.gain, sq * 0.2, 0.05);
    this._set(K.hBP.frequency, hf, 0.1); this._set(K.hBP.Q, hq, 0.1);
    this._set(K.hG.gain, hiss * lv * 0.28, 0.06);
    this._set(K.rG.gain, rum * lv * 0.3, 0.08);
  }

  // ---- police sirens -------------------------------------------------------------------------

  _buildSirens() {
    // Three voice slots. Each is a futuristic hi-lo siren: a saw and a square a fifth above it,
    // jumping between two tones with a short glide, while a slow wail drifts the whole thing.
    const base = [720, 772, 668], rate = [1.35, 1.53, 1.19], wail = [0.21, 0.17, 0.26];
    const hiLo = lfoWave(this.ctx, 'square', 13);
    this._sir = [];
    for (let i = 0; i < 3; i++) {
      const b = base[i], sl = { id: null, keep: false, fresh: false };
      const a = this._o('sawtooth', b), h = this._o('square', b * 1.498);
      const hl = this._o('sine', rate[i]);
      hl.setPeriodicWave(hiLo);                    // rounded square: the jump between tones glides
      const dA = this._g(b * 0.142), dH = this._g(b * 0.142 * 1.498);
      hl.connect(dA); dA.connect(a.frequency); hl.connect(dH); dH.connect(h.frequency);
      const w = this._o('sine', wail[i]), wA = this._g(b * 0.05), wH = this._g(b * 0.05 * 1.498);
      w.connect(wA); wA.connect(a.frequency); w.connect(wH); wH.connect(h.frequency);
      const gh = this._g(0.3), mix = this._g(1);
      a.connect(mix); h.connect(gh); gh.connect(mix);
      const bp = this._bq('bandpass', b * 1.8, 0.8);
      sl.lp = this._bq('lowpass', 6000, 0.5);
      sl.g = this._g(0);
      sl.pan = this._pn(0);
      mix.connect(bp); bp.connect(sl.lp); sl.lp.connect(sl.g); sl.g.connect(sl.pan); sl.pan.connect(this._sirenBus);
      this._sir.push(sl);
    }
  }

  _applySirens() {
    const S = this._sir, near = this._sirNear;
    const n = this._frame - this._sirenFrame <= STALE_FRAMES ? this._sirCount : 0;
    for (let k = 0; k < 3; k++) S[k].keep = false;
    // a siren that already owns a slot keeps it, so it never jumps between voices
    for (let i = 0; i < n; i++) {
      near[i].slot = null;
      for (let k = 0; k < 3; k++) {
        if (!S[k].keep && S[k].id !== null && S[k].id === near[i].id) { S[k].keep = true; near[i].slot = S[k]; break; }
      }
    }
    for (let i = 0; i < n; i++) {
      if (near[i].slot) continue;
      for (let k = 0; k < 3; k++) {
        if (!S[k].keep) { S[k].keep = true; S[k].id = near[i].id; S[k].fresh = true; near[i].slot = S[k]; break; }
      }
    }
    for (let i = 0; i < n; i++) {
      const sl = near[i].slot;
      if (!sl) continue;
      const sp = this._spatial(near[i].x, near[i].z, 24, SIREN_DIST);
      if (!sp) { this._set(sl.g.gain, 0, 0.1); continue; }
      if (sl.pan.pan) this._set(sl.pan.pan, sp.pan, sl.fresh ? 0.012 : 0.07);
      this._set(sl.lp.frequency, clamp(7000 / (1 + sp.d / 45), 900, 7000), 0.1);
      this._set(sl.g.gain, sp.gain * 0.55, sl.fresh ? 0.15 : 0.09);
      sl.fresh = false;
    }
    for (let k = 0; k < 3; k++) {
      if (!S[k].keep) { S[k].id = null; this._set(S[k].g.gain, 0, 0.1); }
    }
  }

  // ---- a helicopter passing: pink noise chopped at the blade rate, placed and filtered by distance --

  _buildRotor() {
    const R = {};
    const bp = this._bq('bandpass', 260, 0.8);
    R.am = this._g(0.5);
    R.lfo = this._o('sine', 16);
    const d = this._g(0.5);
    R.lfo.connect(d); d.connect(R.am.gain);
    this._pink.connect(bp); bp.connect(R.am);
    R.lp = this._bq('lowpass', 3000, 0.5);
    R.g = this._g(0);
    R.pan = this._pn(0);
    R.am.connect(R.lp); R.lp.connect(R.g); R.g.connect(R.pan); R.pan.connect(this._sirenBus);
    this._rot = R;
  }

  _applyRotor() {
    const R = this._rot, s = this._rotS;
    const sp = s.on && this._frame - this._rotFrame <= STALE_FRAMES ? this._spatial(s.x, s.z, 40, ROTOR_DIST) : null;
    if (!sp) { this._set(R.g.gain, 0, 0.2); return; }
    if (R.pan.pan) this._set(R.pan.pan, sp.pan, 0.08);
    this._set(R.lp.frequency, clamp(5000 / (1 + sp.d / 70), 400, 5000), 0.1);
    this._set(R.lfo.frequency, 3 + 14 * s.level, 0.2);
    this._set(R.g.gain, sp.gain * 0.7 * s.level, 0.12);
  }

  // ---- ambience ------------------------------------------------------------------------------

  _buildAmbient() {
    const A = {}, bus = this._ambBus, B = this._buf;
    const layer = () => { const g = this._g(0); g.connect(bus); return g; };
    const chain = (src, nodes, dest) => { let t = src; for (const n of nodes) { t.connect(n); t = n; } t.connect(dest); };

    // city: a mains-like hum under a slow wash of far-off traffic
    A.city = layer();
    const hum = this._g(1); hum.connect(A.city);
    chain(this._o('sine', 58), [this._g(0.1)], hum);
    chain(this._o('triangle', 116.4), [this._g(0.1)], hum);
    chain(this._o('sine', 174.9), [this._g(0.05)], hum);
    chain(this._o('sine', 233.1), [this._g(0.02)], hum);
    this._lfo('sine', 0.19, 0.25, hum.gain);
    const washBP = this._bq('bandpass', 380, 0.45), washG = this._g(0.9);
    chain(this._pinkSt, [washBP, washG], A.city);
    this._lfo('sine', 0.071, 0.3, washG.gain);
    this._lfo('sine', 0.043, 120, washBP.frequency);

    // forest: wind moving through the canopy, leaves rustling on top
    A.forest = layer();
    const treeBP = this._bq('bandpass', 620, 0.7), treeG = this._g(1);
    chain(this._pinkSt, [treeBP, treeG], A.forest);
    this._lfo('sine', 0.13, 0.35, treeG.gain);
    this._lfo('sine', 0.31, 170, treeBP.frequency);
    const leafG = this._g(0.055);
    chain(this._whiteSt, [this._bq('highpass', 2800, 0.5), leafG], A.forest);
    chain(this._loop(B.lf, 0.35, 5), [this._g(0.05)], leafG.gain);

    // night: crickets (the chimes are scheduled from update())
    A.night = layer();
    this._loop(B.crickets, 1, 0).connect(A.night);

    // swamp: frog and insect chorus over heavy air
    A.swamp = layer();
    this._loop(B.swamp, 1, 0).connect(A.swamp);
    chain(this._pinkSt, [this._bq('bandpass', 240, 0.6), this._g(0.3)], A.swamp);

    // beach: surf. Two slow inverted-saw swells (fast rise, long fall) drive level and brightness.
    A.beach = layer();
    const surfLP = this._bq('lowpass', 1100, 0.4), s1 = this._g(0.5), s2 = this._g(0.6);
    chain(this._pinkSt, [surfLP, s1, s2], A.beach);
    const swellWave = lfoWave(this.ctx, 'fall', 7);
    const swell = (f) => { const o = this._o('sine', f); o.setPeriodicWave(swellWave); return o; };
    const w1 = swell(0.105), w2 = swell(0.073);
    chain(w1, [this._g(0.3)], s1.gain);
    chain(w1, [this._g(0.4)], s2.gain);
    chain(w1, [this._g(700)], surfLP.frequency);
    chain(w2, [this._g(0.2)], s1.gain);
    chain(this._whiteSt, [this._bq('bandpass', 3200, 0.4), this._g(0.06)], s2);     // foam

    // rain: bright patter plus a low wash, with slowly varying density
    A.rain = layer();
    const rHiG = this._g(0.55);
    chain(this._whiteSt, [this._bq('bandpass', 3400, 0.35), rHiG], A.rain);
    chain(this._pinkSt, [this._bq('lowpass', 800, 0.5), this._g(0.5)], A.rain);
    chain(this._loop(B.lf, 0.8, 9), [this._g(0.12)], rHiG.gain);

    // wind: speed whoosh. Centre frequency rises with level; buffeting from the random LFO.
    A.wind = layer();
    A.windBP = this._bq('bandpass', 400, 1.1);
    const buff = this._g(1);
    chain(this._pinkSt, [A.windBP, buff], A.wind);
    const lf3 = this._loop(B.lf, 0.5, 2);
    chain(lf3, [this._g(110)], A.windBP.frequency);
    chain(lf3, [this._g(0.25)], buff.gain);

    this._ambN = A;
  }

  _applyAmbient() {
    const A = this._ambN, m = this._amb;
    const live = (this._frame - this._ambFrame <= STALE_FRAMES ? 1 : 0) * (1 - 0.85 * this._indoor);
    const city = m.city * live, forest = m.forest * live, swamp = m.swamp * live, beach = m.beach * live;
    const night = m.night * live, rain = m.rain * live, wind = m.wind * live;
    // Night life belongs to the wild places: full strength in forest and swamp, faint downtown.
    const wild = Math.max(forest, swamp * 0.85, beach * 0.4);
    const quiet = (1 - 0.7 * city) * (1 - 0.6 * rain);
    this._set(A.city.gain, city * 0.3, 0.6);
    this._set(A.forest.gain, forest * 0.3, 0.6);
    this._set(A.swamp.gain, swamp * 0.55, 0.6);
    this._set(A.beach.gain, beach * 0.5, 0.6);
    this._set(A.night.gain, night * (0.25 + 0.75 * wild) * quiet * 0.45, 0.6);
    this._set(A.rain.gain, Math.pow(rain, 1.2) * 0.3, 0.5);
    this._set(A.wind.gain, Math.pow(wind, 1.5) * 0.5, 0.25);
    this._set(A.windBP.frequency, 260 + 1100 * wind, 0.3);
    this._chimeLevel = night * (0.15 + 0.85 * forest) * quiet;
  }
}
