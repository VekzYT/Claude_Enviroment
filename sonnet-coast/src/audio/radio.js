// In-car radio: five stations of procedurally sequenced music, synthesized live with Web Audio.
// Each "track" is generated from a seed (key, chord progression, patterns), plays through a
// simple song structure, then hands over to the next one.

const STATIONS = [
  { id: 'claude', name: 'CLAUDE FM', freq: '88.2', genre: 'Synthwave', color: '#ff7a59', bpm: 100, bars: 40 },
  { id: 'token', name: 'TOKEN STREAM', freq: '94.7', genre: 'Drum & Bass', color: '#3df0ff', bpm: 172, bars: 64 },
  { id: 'bayou', name: 'BAYOU STATIC', freq: '101.5', genre: 'Swamp Funk', color: '#a6e65a', bpm: 96, bars: 40 },
  { id: 'haiku', name: 'HAIKU RADIO', freq: '77.7', genre: 'Lo-fi Chillhop', color: '#f7c873', bpm: 78, bars: 32 },
  { id: 'constitution', name: 'CONSTITUTION', freq: '106.1', genre: 'Techno', color: '#b18cff', bpm: 128, bars: 56 },
];

const TRACKS = {
  claude: [['Attention Is All You Need (Night Mix)', 'The Transformers'], ['Context Window Down', 'Long Horizon'], ['Tokens in the Rain', 'Neon Sonnet'],
    ['Gradient Descent', 'Loss Landscape'], ['Sunset on Shoreline Boulevard', 'Terracotta Drive'], ['Helpful, Harmless, Honest', 'The Constitution'], ['Midnight Inference', 'Opus & Haiku']],
  token: [['Temperature Zero', 'Greedy Decode'], ['Overfit', 'Batch Norm'], ['Rate Limit', '429'], ['Backprop Runner', 'Vanishing Gradient'],
    ['Latent Space Chase', 'Embedding Crew'], ['Stop Sequence', 'Max Tokens'], ['Parallel Tool Call', 'Async Collective']],
  bayou: [['Constitutional Groove', 'The Bayou Weights'], ['Gator Garage Shuffle', 'Mudflap Jackson Five'], ['Moonshine Hollow', 'Heron Jetty Band'],
    ['Low Temperature Blues', 'Swamp Sampler'], ['Fine-Tune My Heart', 'Cypress Knees'], ['Prompt Me Slow', 'Big Context & the Windows'], ['Marsh Road Boogie', 'The Lily Pads']],
  haiku: [['Seventeen Syllables', 'Small Model'], ['Quiet Parameters', 'kireji'], ['Rain on the Data Centre', 'Compute Ridge'], ['Soft Max', 'Warm Start'],
    ['Five Seven Five', 'Paper Lantern'], ['Idle Tokens', 'Sleep Mode'], ['Glowwood After Dark', 'Firefly Sampler']],
  constitution: [['Alignment', 'Red Team'], ['System Prompt', 'Root Access'], ['Safety Flag', 'Five Star'], ['Refusal', 'Hard Constraint'],
    ['Interpretability', 'Feature 34M'], ['Scaling Policy', 'ASL'], ['Sparse Autoencoder', 'Superposition']],
};

const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10],
  mixo: [0, 2, 4, 5, 7, 9, 10], pentMinor: [0, 3, 5, 7, 10], phryg: [0, 1, 3, 5, 7, 8, 10],
};
// chord progressions as scale degrees (0-based), one chord per bar unless noted
const PROGS = {
  claude: [[0, 5, 2, 6], [0, 3, 5, 4], [0, 6, 5, 6], [5, 6, 0, 0], [0, 2, 5, 3]],
  token: [[0, 0, 5, 6], [0, 0, 3, 4], [0, 6, 5, 4], [0, 0, 0, 5]],
  bayou: [[0, 0, 3, 0], [0, 3, 0, 4], [0, 0, 3, 3], [0, 6, 3, 0]],
  haiku: [[1, 4, 0, 5], [0, 5, 1, 4], [3, 4, 2, 5], [0, 2, 3, 4]],
  constitution: [[0, 0, 0, 0], [0, 0, 5, 5], [0, 0, 0, 6], [0, 3, 0, 5]],
};

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class Radio {
  constructor(audio) {
    this.audio = audio || null;
    this.stations = STATIONS.map((s) => ({ id: s.id, name: s.name, freq: s.freq, genre: s.genre, color: s.color }));
    this.onChange = null;
    this._idx = 0;
    this._active = false;
    this._built = false;
    this._timer = null;
    this._seed = (Date.now() & 0xffff) + 17;
    this._trackNo = {};
    this._song = null;
    this._step = 0; this._next = 0;
    this._voices = 0;
  }
  get index() { return this._idx; }
  set index(i) { this.set(i); }
  get stats() { return { voices: this._voices }; }
  get nowPlaying() {
    const s = STATIONS[this._idx];
    if (!s) return null;
    const t = this._song ? this._song.title : ['Tuning…', ''];
    return { station: s.name, freq: s.freq, track: t[0], artist: t[1], genre: s.genre, color: s.color };
  }
  next() { this.set(this._idx >= STATIONS.length - 1 ? -1 : this._idx + 1); }
  prev() { this.set(this._idx <= -1 ? STATIONS.length - 1 : this._idx - 1); }
  set(i) {
    try {
      i = Math.round(Number(i));
      if (!(i >= -1 && i < STATIONS.length) || i === this._idx) return;
      this._idx = i;
      if (this._built) {
        // duck, swap, come back
        const t = this.ctx.currentTime;
        this.stationBus.gain.cancelScheduledValues(t);
        this.stationBus.gain.setTargetAtTime(0, t, 0.03);
        this._swapAt = t + 0.16;
      }
      this._song = null;
      if (i >= 0) this._newSong(true);
      if (typeof this.onChange === 'function') this.onChange(this.nowPlaying);
    } catch (e) { /* never throw */ }
  }
  setActive(on) {
    this._active = !!on;
    try { if (this._built) this.out.gain.setTargetAtTime(this._active ? 1 : 0, this.ctx.currentTime, this._active ? 0.16 : 0.12); } catch (e) { /* ignore */ }
  }
  update() {
    try { if (!this._built) this._build(); } catch (e) { /* stay silent */ }
  }

  // ---- graph ------------------------------------------------------------------
  _build() {
    const a = this.audio;
    if (!a || !a.ctx || !a.musicBus) return;
    const ctx = this.ctx = a.ctx;
    this.out = ctx.createGain(); this.out.gain.value = this._active ? 1 : 0;
    this.stationBus = ctx.createGain(); this.stationBus.gain.value = 1;
    this.tone = ctx.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 16000;
    this.stationBus.connect(this.tone); this.tone.connect(this.out); this.out.connect(a.musicBus);
    this.dry = ctx.createGain(); this.dry.connect(this.stationBus);
    // tempo delay
    this.delay = ctx.createDelay(1.5); this.delayFb = ctx.createGain(); this.delayFb.gain.value = 0.34;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 3200;
    this.delaySend = ctx.createGain(); this.delaySend.gain.value = 1;
    this.delaySend.connect(this.delay); this.delay.connect(dlp); dlp.connect(this.delayFb); this.delayFb.connect(this.delay);
    const dOut = ctx.createGain(); dOut.gain.value = 0.5; dlp.connect(dOut); dOut.connect(this.stationBus);
    // reverb from a generated impulse
    const len = Math.floor(ctx.sampleRate * 2.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    const r = rng(99);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.reverb = ctx.createConvolver(); this.reverb.buffer = ir;
    this.revSend = ctx.createGain(); this.revSend.gain.value = 1;
    const rOut = ctx.createGain(); rOut.gain.value = 0.32;
    this.revSend.connect(this.reverb); this.reverb.connect(rOut); rOut.connect(this.stationBus);
    // noise
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
    this.noise = nb;
    // vinyl crackle loop for the lo-fi station
    const cb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const cd = cb.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = (r() * 2 - 1) * 0.02 + (r() < 0.0009 ? (r() * 2 - 1) * 0.7 : 0);
    this.crackle = ctx.createBufferSource(); this.crackle.buffer = cb; this.crackle.loop = true;
    this.crackleGain = ctx.createGain(); this.crackleGain.gain.value = 0;
    const chp = ctx.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 900;
    this.crackle.connect(chp); chp.connect(this.crackleGain); this.crackleGain.connect(this.stationBus);
    this.crackle.start();
    this._built = true;
    if (this._idx >= 0 && !this._song) this._newSong(true);
    this._next = ctx.currentTime + 0.1;
    this._timer = setInterval(() => { try { this._tick(); } catch (e) { /* keep the clock alive */ } }, 25);
  }

  // ---- song generation -----------------------------------------------------------
  _newSong(skipIntro) {
    const st = STATIONS[this._idx];
    if (!st) return;
    const n = (this._trackNo[st.id] = (this._trackNo[st.id] ?? Math.floor(this._seed % 7)) + 1);
    const R = rng(this._seed * 31 + n * 977 + this._idx * 13);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const id = st.id;
    const scaleName = id === 'claude' ? pick(['minor', 'minor', 'dorian']) : id === 'token' ? pick(['minor', 'phryg']) : id === 'bayou' ? pick(['dorian', 'mixo']) : id === 'haiku' ? pick(['major', 'dorian']) : pick(['minor', 'phryg']);
    const scale = SCALES[scaleName];
    const root = (id === 'token' ? 41 : id === 'constitution' ? 43 : 45) + Math.floor(R() * 6);
    const prog = pick(PROGS[id]);
    const deg = (d, oct = 0) => root + scale[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
    const chord = (d, n7) => { const c = [deg(d), deg(d + 2), deg(d + 4)]; if (n7) c.push(deg(d + 6)); return c; };
    // 16-step patterns
    const pat = (len, density, strong = [0, 8]) => { const p = []; for (let i = 0; i < len; i++) p.push(strong.includes(i % 16) ? 1 : R() < density * (i % 2 ? 0.6 : 1) ? 1 : 0); return p; };
    // lead melody: two 2-bar phrases built from a random walk on the scale
    const melody = [];
    let cur = 7 + Math.floor(R() * 3);
    for (let i = 0; i < 64; i++) {
      const on = i % 4 === 0 ? R() < 0.72 : i % 2 === 0 ? R() < 0.38 : R() < 0.1;
      if (on) { cur = Math.max(4, Math.min(13, cur + Math.round((R() - 0.5) * 4.2))); melody.push({ d: cur, len: R() < 0.3 ? 4 : 2 }); } else melody.push(null);
    }
    for (let i = 32; i < 56; i++) melody[i] = melody[i - 32]; // repeat the first phrase, then vary the ending
    const bassRiff = [];
    for (let i = 0; i < 16; i++) bassRiff.push(i === 0 ? 0 : R() < (id === 'bayou' ? 0.45 : 0.3) ? pick([0, 0, 4, 6, 7, 2]) : -1);
    const acid = [];
    for (let i = 0; i < 16; i++) acid.push(R() < 0.82 ? { n: pick([0, 0, 0, 7, 12, 3, 10]), acc: R() < 0.3, slide: R() < 0.2 } : null);
    const list = TRACKS[id];
    this._song = {
      st, id, R, scale, root, prog, deg, chord, melody, bassRiff, acid,
      hatPat: pat(16, 0.5, [0, 4, 8, 12]), ghost: pat(16, 0.2, []), kickVar: pat(16, 0.12, []),
      title: list[(n + Math.floor(this._seed)) % list.length],
      bar: skipIntro ? 4 : 0,
      swing: id === 'bayou' ? 0.18 : id === 'haiku' ? 0.14 : 0,
      stepDur: 60 / st.bpm / 4,
    };
    this._step = 0;
    if (this._built) {
      const t = this.ctx.currentTime;
      const beat = 60 / st.bpm;
      this.delay.delayTime.setTargetAtTime(Math.min(1.4, beat * (id === 'token' ? 1.5 : 0.75)), t, 0.05);
      this.tone.frequency.setTargetAtTime(id === 'haiku' ? 3600 : 16000, t, 0.1);
      this.crackleGain.gain.setTargetAtTime(id === 'haiku' ? 0.5 : 0, t, 0.2);
      this.stationBus.gain.setTargetAtTime(1, Math.max(t, this._swapAt || 0), 0.05);
    }
  }

  // which layers play in this bar
  _section(S) {
    const b = S.bar, n = S.st.bars;
    const intro = b < 4;
    const brk = b >= n * 0.5 - 4 && b < n * 0.5;
    const outro = b >= n - 4;
    const hi = (b >= 12 && !brk && b < n * 0.5 - 4) || (b >= n * 0.5 + 8 && !outro);
    return { drums: !intro && !brk, full: !intro && !brk && !outro, lead: hi, bass: !intro || b >= 2, pad: true, fillBar: (b + 1) % 8 === 0 && !intro && !brk };
  }

  _tick() {
    if (!this._built || this._idx < 0 || !this._song) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const S = this._song;
    if (this._next < now - 0.5) {
      // fell behind (tab in the background): jump forward on the grid instead of flooding notes
      const skip = Math.ceil((now - this._next) / S.stepDur);
      this._advance(S, skip);
      this._next += skip * S.stepDur;
    }
    let guard = 0;
    while (this._next < now + 0.13 && guard++ < 16) {
      if (this._active) {
        const sw = this._step % 2 ? S.swing * S.stepDur : 0;
        this._playStep(S, this._step, this._next + sw);
      }
      this._next += S.stepDur;
      this._advance(S, 1);
    }
  }
  _advance(S, n) {
    this._step += n;
    while (this._step >= 16) {
      this._step -= 16; S.bar++;
      if (S.bar >= S.st.bars) {
        this._newSong(false);
        if (typeof this.onChange === 'function') { try { this.onChange(this.nowPlaying); } catch (e) { /* ignore */ } }
        return;
      }
    }
  }

  // ---- instruments -----------------------------------------------------------------
  _v(t, dur) { this._voices++; setTimeout(() => { this._voices--; }, Math.max(0, (t - this.ctx.currentTime + dur) * 1000 + 60)); }
  _osc(type, f, t, dur, peak, { a = 0.005, r = 0.08, lp = 0, lpEnv = 0, lpDecay = 0.15, q = 1, detune = 0, dest = this.dry, send = 0, rev = 0, glideFrom = 0, vib = 0 } = {}) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    if (glideFrom) { o.frequency.setValueAtTime(glideFrom, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); } else o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.value = detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + Math.max(a, dur - 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
    let tail = g;
    if (lp) {
      const fl = ctx.createBiquadFilter();
      fl.type = 'lowpass'; fl.Q.value = q;
      fl.frequency.setValueAtTime(Math.min(18000, lp + lpEnv), t);
      fl.frequency.exponentialRampToValueAtTime(Math.max(60, lp), t + lpDecay);
      o.connect(fl); fl.connect(g);
    } else o.connect(g);
    let lfo = null;
    if (vib) { lfo = ctx.createOscillator(); lfo.frequency.value = 5.5; const lg = ctx.createGain(); lg.gain.value = vib; lfo.connect(lg); lg.connect(o.detune); lfo.start(t + 0.12); lfo.stop(t + dur + r + 0.05); }
    tail.connect(dest);
    if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(this.delaySend); }
    if (rev) { const s = ctx.createGain(); s.gain.value = rev; g.connect(s); s.connect(this.revSend); }
    o.start(t); o.stop(t + dur + r + 0.05);
    this._v(t, dur + r);
    return o;
  }
  _noise(t, dur, peak, type, f, q = 1, rev = 0) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(this.dry);
    if (rev) { const r = ctx.createGain(); r.gain.value = rev; g.connect(r); r.connect(this.revSend); }
    s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.02);
    this._v(t, dur);
  }
  kick(t, v = 1, deep = false) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(deep ? 130 : 165, t);
    o.frequency.exponentialRampToValueAtTime(deep ? 40 : 48, t + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.95 * v, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (deep ? 0.34 : 0.26));
    o.connect(g); g.connect(this.dry);
    o.start(t); o.stop(t + 0.4);
    this._v(t, 0.4);
    this._noise(t, 0.02, 0.25 * v, 'highpass', 2500);
  }
  snare(t, v = 1, gated = false, soft = false) {
    this._noise(t, gated ? 0.3 : soft ? 0.12 : 0.17, (soft ? 0.3 : 0.55) * v, 'bandpass', soft ? 1300 : 1900, 0.8, gated ? 0.6 : 0.12);
    this._osc('triangle', soft ? 170 : 195, t, 0.05, (soft ? 0.25 : 0.4) * v, { r: 0.07 });
  }
  hat(t, v = 1, open = false) { this._noise(t, open ? 0.22 : 0.045, 0.2 * v, 'highpass', 7500); }
  clap(t, v = 1) { for (let k = 0; k < 3; k++) this._noise(t + k * 0.012, 0.09, 0.3 * v, 'bandpass', 1500, 1.2, 0.2); }

  _playStep(S, i, t) {
    const sec = this._section(S);
    const id = S.id;
    const bar = S.bar;
    const d = S.prog[bar % S.prog.length];
    const beat = i % 4 === 0;
    const sd = S.stepDur;
    const fill = sec.fillBar && i >= 12;

    if (id === 'claude') {
      if (sec.drums) {
        if (i === 0 || i === 8 || (i === 10 && S.kickVar[bar % 16])) this.kick(t, 1);
        if (i === 4 || i === 12) this.snare(t, 1, true);
        if (i % 2 === 0) this.hat(t, i % 4 === 2 ? 0.9 : 0.55, i === 14 && bar % 4 === 3);
        if (fill) this.snare(t, 0.5 + (i - 12) * 0.12, false);
      }
      if (sec.bass && i % 2 === 0) this._osc('sawtooth', mtof(S.deg(d, -1) + (i % 8 === 6 ? 12 : 0)), t, sd * 1.5, 0.3, { lp: 500, lpEnv: 1400, lpDecay: 0.12, q: 3 });
      if (i === 0) for (const n of S.chord(d, true)) { this._osc('sawtooth', mtof(n + 12), t, sd * 15.5, 0.045, { a: 0.4, r: 0.6, lp: 1300, detune: -7, rev: 0.6 }); this._osc('sawtooth', mtof(n + 12), t, sd * 15.5, 0.045, { a: 0.4, r: 0.6, lp: 1300, detune: 8, rev: 0.6 }); }
      // arpeggio
      const ch = S.chord(d, true);
      const an = ch[(i + (bar % 2 ? 1 : 0)) % ch.length] + 12 * (1 + (Math.floor(i / 4) % 2));
      this._osc('square', mtof(an), t, sd * 0.8, sec.full ? 0.075 : 0.055, { lp: 1800, lpEnv: 2600, lpDecay: 0.1, send: 0.45 });
      if (sec.lead) { const m = S.melody[(bar % 4) * 16 + i]; if (m) this._osc('sawtooth', mtof(S.deg(m.d + d * 0, 1)), t, sd * m.len * 0.95, 0.11, { a: 0.02, r: 0.2, lp: 2600, vib: 9, send: 0.5, rev: 0.4 }); }
    } else if (id === 'token') {
      if (sec.drums) {
        if (i === 0 || i === 10) this.kick(t, 1);
        if (i === 4 || i === 12) this.snare(t, 1);
        if (i % 2 === 0) this.hat(t, 0.6); else if (S.ghost[i]) this.hat(t, 0.3);
        if (S.ghost[(i + 5) % 16] && (i === 7 || i === 15 || i === 9)) this.snare(t, 0.28, false, true);
        if (fill) this.snare(t, 0.55 + (i - 12) * 0.1);
      } else if (i % 4 === 0) this.hat(t, 0.35);
      // reese bass: two detuned saws through a moving low-pass
      if (sec.bass && (i === 0 || i === 6 || i === 10)) {
        const n = S.deg(d, -1) + (i === 6 ? S.scale[4] - S.scale[0] - 12 : 0);
        const len = sd * (i === 0 ? 5.5 : 3.5);
        this._osc('sawtooth', mtof(n), t, len, 0.26, { lp: 240 + (bar % 4) * 90, lpEnv: 700, lpDecay: 0.3, q: 5, detune: -14, r: 0.06 });
        this._osc('sawtooth', mtof(n), t, len, 0.26, { lp: 240 + (bar % 4) * 90, lpEnv: 700, lpDecay: 0.3, q: 5, detune: 14, r: 0.06 });
        this._osc('sine', mtof(n - 12), t, len, 0.3, { r: 0.06 });
      }
      if (sec.full && (i === 3 || i === 11) && bar % 2 === 1) for (const n of S.chord(d)) this._osc('sawtooth', mtof(n + 12), t, sd * 1.2, 0.05, { lp: 2400, lpEnv: 3000, lpDecay: 0.09, send: 0.6, rev: 0.4 });
      if (i === 0 && bar % 2 === 0) for (const n of S.chord(d, true)) this._osc('sine', mtof(n + 24), t, sd * 30, 0.03, { a: 1.2, r: 1.5, rev: 0.9 });
      if (sec.lead) { const m = S.melody[(bar % 4) * 16 + i]; if (m && i % 2 === 0) this._osc('triangle', mtof(S.deg(m.d, 1)), t, sd * 1.4, 0.08, { r: 0.25, send: 0.7, rev: 0.5 }); }
    } else if (id === 'bayou') {
      const seventh = d === 0 || d === 3 || d === 4;
      if (sec.drums) {
        if (i === 0 || i === 7 || i === 10) this.kick(t, i === 7 ? 0.7 : 1);
        if (i === 4 || i === 12) this.snare(t, 0.9);
        this.hat(t, i % 4 === 0 ? 0.55 : i % 2 ? 0.3 : 0.42, i === 6 && bar % 2 === 1);
        if (fill) this.snare(t, 0.5, false, true);
      }
      if (sec.bass) { const r = S.bassRiff[i]; if (r >= 0) this._osc('triangle', mtof(S.deg(d, -1) + S.scale[r % 7] - S.scale[0] + (r === 7 ? 12 : 0)), t, sd * 1.3, 0.42, { lp: 900, lpEnv: 900, lpDecay: 0.1, r: 0.05 }); }
      // organ stabs on the off-beats
      if (sec.full && (i === 2 || i === 6 || i === 11 || i === 14)) {
        for (const n of S.chord(d, seventh)) { this._osc('sine', mtof(n + 12), t, sd * 0.9, 0.055, { r: 0.05, rev: 0.25 }); this._osc('sine', mtof(n + 24), t, sd * 0.9, 0.022, { r: 0.05 }); this._osc('sine', mtof(n + 31), t, sd * 0.9, 0.012, { r: 0.05 }); }
      }
      if (sec.lead) { const m = S.melody[(bar % 4) * 16 + i]; if (m) this._osc('square', mtof(S.deg(m.d, 1)), t, sd * 0.9, 0.07, { lp: 1500, lpEnv: 3500, lpDecay: 0.06, q: 4, send: 0.3 }); }
    } else if (id === 'haiku') {
      const lazy = (S.R() - 0.5) * 0.012;
      if (sec.drums) {
        if (i === 0 || i === 10 || (i === 7 && S.kickVar[bar % 16])) this.kick(t + lazy, 0.8, true);
        if (i === 4 || i === 12) this.snare(t + 0.012, 0.8, false, true);
        if (i % 2 === 0) this.hat(t + lazy, 0.3);
      }
      const ch = S.chord(d, true);
      // electric-piano chords: a sine with a soft octave partial, rolled slightly
      if (i === 0 || (i === 10 && bar % 2 === 0)) ch.forEach((n, k) => {
        const tt = t + k * 0.022;
        this._osc('sine', mtof(n + 12), tt, sd * (i === 0 ? 8 : 5), 0.1, { a: 0.008, r: 0.5, rev: 0.35 });
        this._osc('triangle', mtof(n + 24), tt, sd * 2, 0.025, { a: 0.004, r: 0.3 });
      });
      if (sec.bass && (i === 0 || i === 10)) this._osc('sine', mtof(S.deg(d, -1)), t, sd * (i === 0 ? 7 : 4), 0.4, { r: 0.12 });
      if (sec.lead) { const m = S.melody[(bar % 4) * 16 + i]; if (m && i % 2 === 0) this._osc('triangle', mtof(S.deg(m.d, 1)), t + lazy, sd * m.len, 0.09, { a: 0.01, r: 0.35, send: 0.35, rev: 0.4 }); }
    } else {
      // techno
      const sweep = 0.5 + 0.5 * Math.sin((bar / 8) * Math.PI * 2 - 1.2);
      if (sec.drums) {
        if (beat) this.kick(t, 1, true);
        if (i % 4 === 2) this.hat(t, 0.75, true); else if (i % 2 === 1) this.hat(t, 0.3);
        if (i === 4 || i === 12) this.clap(t, 0.9);
        if (fill) this.snare(t, 0.45 + (i - 12) * 0.1);
      } else if (i % 4 === 2) this.hat(t, 0.5, true);
      if (sec.bass) {
        const a = S.acid[i];
        if (a) {
          const f = mtof(S.root - 12 + a.n + (S.scale[d % 7] - S.scale[0]));
          this._osc('sawtooth', f, t, sd * (a.slide ? 1.3 : 0.7), a.acc ? 0.3 : 0.2, { lp: 260 + sweep * 900, lpEnv: (a.acc ? 3400 : 1500) * (0.5 + sweep), lpDecay: 0.11, q: 12, r: 0.04, glideFrom: a.slide ? f * 0.84 : 0 });
        }
      }
      if (sec.full && i === 6 && bar % 2 === 1) for (const n of S.chord(d)) this._osc('sawtooth', mtof(n + 12), t, sd * 2, 0.05, { lp: 1600, lpEnv: 2400, lpDecay: 0.2, send: 0.7, rev: 0.5 });
      if (sec.lead && i % 4 === 3) { const m = S.melody[(bar % 4) * 16 + i - 3]; if (m) this._osc('square', mtof(S.deg(m.d, 1)), t, sd * 0.6, 0.05, { lp: 3000, send: 0.8 }); }
    }
  }
}
