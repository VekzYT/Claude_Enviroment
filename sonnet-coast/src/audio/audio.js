// Sonnet Coast audio layer.
// Every sound is synthesised at runtime with the Web Audio API: no audio files, no network,
// no libraries. Public contract: see the AudioSystem class at the bottom of this file.

const MAX_VOICES = 24;        // simultaneous one-shot voices; the quietest / most decayed is dropped
const MAX_SAME = 5;           // simultaneous copies of one sound name
const HEAR_DIST = 160;        // metres at which a positional one-shot has faded to nothing
const SIREN_DIST = 240;       // sirens carry further than ordinary sounds
const CONTROL_DT = 0.022;     // continuous sounds are re-targeted at ~30-45 Hz, not every frame
const STALE_FRAMES = 15;      // engine()/skid()/sirens()/ambient() not called for this many updates = off

// Master limiter (DynamicsCompressor, hard knee). The node applies an automatic make-up gain of
// (1 / curve(1.0)) ^ 0.6, which LIM_TRIM undoes so the chain is unity gain below the threshold.
const LIM_THRESHOLD = -5;
const LIM_RATIO = 20;
const LIM_TRIM = Math.pow(10, (0.6 * LIM_THRESHOLD * (1 - 1 / LIM_RATIO)) / 20);

// Bus trims (linear), balanced by measurement in the test harness.
const BUS = { sfx: 0.9, ui: 0.9, engine: 1.0, skid: 0.9, siren: 0.9, ambient: 1.0, music: 0.75 };

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
