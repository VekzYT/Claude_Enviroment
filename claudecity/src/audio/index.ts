// OWNER: audio agent. All sound is synthesised with the Web Audio API (no sound files).
//
// createAudio() returns the engine the game talks to. It does nothing until unlock() is called
// from a touch (iOS only starts audio after a gesture); then it builds the mixing graph, starts
// the ambience and the generative music on a lookahead timer, and pre-renders every sound effect
// into small buffers so play() costs one buffer source. If Web Audio is missing or fails, every
// method quietly does nothing: the game never has to check.
import { makeRng, randomSeed } from '../core/rng';
import type { SfxId } from './legacy';
import { Ambience, type AmbienceParams } from './ambience';
import { attachReverb, buildMixGraph, setMixVolumes, type MixGraph } from './mix';
import { Music } from './music';
import { prerenderSfx, SFX } from './sfx';
import { clamp, gainNode, rr } from './util';


export interface AudioEngine {
  /** Must be called from inside a touch/click handler once: iOS only starts audio after a gesture. */
  unlock(): void;
  play(sfx: SfxId): void;
  /** Background sound follows the city: busier with more people, crickets at night, quiet when paused. */
  setAmbience(opts: { population: number; night: number; paused: boolean }): void;
  /** 0..1 each. */
  setVolumes(sfx: number, music: number): void;
  /** Silence everything while the app is in the background. */
  suspend(): void;
  resume(): void;
}

/** Numbers for tests and debugging (not part of the game-facing contract). */
export interface AudioStats {
  state: string;
  voices: number;
  sfxReady: boolean;
  musicOn: boolean;
  sampleRate: number;
}

/** How far ahead music and ambience are scheduled, and how often the scheduler wakes. */
const LOOKAHEAD = 0.6;
const TICK_MS = 120;
/** At most this many effects sound at once; extra requests are dropped (milestones always play). */
const MAX_VOICES = 14;
/** Per-play random level variation (±). */
const LEVEL_JITTER = 0.08;

type AudioCtor = new () => AudioContext;

class Engine implements AudioEngine {
  private ctx: AudioContext | null = null;
  private failed = false;
  private graph: MixGraph | null = null;
  private music: Music | null = null;
  private ambience: Ambience | null = null;
  private sfxBuffers: Map<SfxId, AudioBuffer[]> | null = null;
  private rendering = false;
  private started = false;
  private volumes = { sfx: 0.8, music: 0.5 };
  private ambienceParams: AmbienceParams = { population: 0, night: 0, paused: false };
  private appSuspended = false;
  /** The page is hidden (a safety net in case the game forgets to call suspend()). */
  private hidden = false;
  private musicOn = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPlay = new Map<SfxId, number>();
  private lastVariant = new Map<SfxId, number>();
  private voices = 0;
  /** When resume() was last asked for: effects requested right after a tap still play. */
  private resumeAskedAt = -Infinity;
  private rng = makeRng(randomSeed());

  // ------------------------------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------------------------------

  unlock(): void {
    if (this.failed) return;
    if (!this.ctx && !this.create()) return;
    const ctx = this.ctx!;
    if (this.appSuspended || !this.wantsToRun()) return;
    if (ctx.state !== 'running') {
      this.resumeContext();
      // Older iOS also wants a sound started inside the gesture.
      this.playSilence();
    }
  }

  play(id: SfxId): void {
    const ctx = this.ctx;
    const graph = this.graph;
    if (!ctx || !graph || !this.wantsToRun() || this.volumes.sfx <= 0) return;
    // A context that is still starting up (just unlocked) plays these as soon as it runs; one that
    // is stuck suspended must not queue a burst of stale effects.
    if (ctx.state !== 'running' && Date.now() - this.resumeAskedAt > 300) return;
    const spec = SFX[id];
    if (!spec) return;
    const nowMs = Date.now();
    const last = this.lastPlay.get(id);
    if (last !== undefined && nowMs - last < spec.gapMs && nowMs >= last) return;
    if (this.voices >= MAX_VOICES && id !== 'milestone') return;
    this.lastPlay.set(id, nowMs);

    const t = ctx.currentTime;
    const level = gainNode(ctx, 1 + rr(this.rng, -LEVEL_JITTER, LEVEL_JITTER));
    level.connect(graph.sfx);
    const buffers = this.sfxBuffers?.get(id);
    this.voices++;
    if (buffers && buffers.length > 0) {
      // Pick a variant, never the same one twice in a row.
      let v = Math.floor(this.rng() * buffers.length);
      if (buffers.length > 1 && v === this.lastVariant.get(id)) v = (v + 1) % buffers.length;
      this.lastVariant.set(id, v);
      const src = ctx.createBufferSource();
      src.buffer = buffers[v];
      src.playbackRate.value = Math.pow(2, rr(this.rng, -spec.cents, spec.cents) / 1200);
      src.connect(level);
      src.onended = () => {
        this.voices = Math.max(0, this.voices - 1);
        level.disconnect();
      };
      src.start(t);
    } else {
      // Buffers not ready yet (the first moments after unlock): synthesise live.
      spec.recipe(ctx, level, t, this.rng);
      setTimeout(() => {
        this.voices = Math.max(0, this.voices - 1);
        level.disconnect();
      }, (spec.length + 0.2) * 1000);
    }
    if (id === 'milestone') this.duckMusic(t);
  }

  setAmbience(opts: { population: number; night: number; paused: boolean }): void {
    if (!opts) return;
    this.ambienceParams = {
      population: Number.isFinite(opts.population) ? Math.max(0, opts.population) : 0,
      night: Number.isFinite(opts.night) ? clamp(opts.night, 0, 1) : 0,
      paused: !!opts.paused,
    };
    if (this.ambience && this.ctx) this.ambience.set(this.ambienceParams, this.ctx.currentTime);
  }

  setVolumes(sfx: number, music: number): void {
    this.volumes = {
      sfx: Number.isFinite(sfx) ? clamp(sfx, 0, 1) : this.volumes.sfx,
      music: Number.isFinite(music) ? clamp(music, 0, 1) : this.volumes.music,
    };
    if (!this.ctx || !this.graph) return;
    setMixVolumes(this.graph, this.volumes.sfx, this.volumes.music, this.ctx.currentTime);
    this.updateMusicOn();
    this.updateRunState();
  }

  suspend(): void {
    this.appSuspended = true;
    this.updateRunState();
  }

  resume(): void {
    this.appSuspended = false;
    this.updateRunState();
  }

  stats(): AudioStats {
    return {
      state: this.ctx ? this.ctx.state : this.failed ? 'unavailable' : 'locked',
      voices: this.voices,
      sfxReady: this.sfxBuffers !== null,
      musicOn: this.musicOn,
      sampleRate: this.ctx ? this.ctx.sampleRate : 0,
    };
  }

  // ------------------------------------------------------------------------------------------
  // Setup
  // ------------------------------------------------------------------------------------------

  private create(): boolean {
    const g = globalThis as unknown as {
      AudioContext?: AudioCtor;
      webkitAudioContext?: AudioCtor;
      navigator?: { audioSession?: { type: string } };
    };
    const Ctor = g.AudioContext ?? g.webkitAudioContext;
    if (!Ctor) {
      this.failed = true;
      return false;
    }
    try {
      // iOS 16.4+: mix with the player's own music instead of stopping it, and follow the
      // silent switch like other games.
      const session = g.navigator?.audioSession;
      if (session && session.type !== 'ambient') session.type = 'ambient';
    } catch {
      // not supported: fine
    }
    try {
      const ctx = new Ctor();
      this.ctx = ctx;
      this.graph = buildMixGraph(ctx);
      setMixVolumes(this.graph, this.volumes.sfx, this.volumes.music);
      ctx.onstatechange = () => this.onStateChange();
      this.watchVisibility();
    } catch (err) {
      console.warn('Claude City: audio is unavailable', err);
      this.failed = true;
      this.ctx = null;
      this.graph = null;
      return false;
    }
    // The heavier setup (sample generation, pre-rendering) happens just after the touch.
    setTimeout(() => this.guard(() => this.startBackground()), 0);
    return true;
  }

  private startBackground(): void {
    const ctx = this.ctx;
    const graph = this.graph;
    if (this.started || !ctx || !graph) return;
    this.started = true;
    attachReverb(ctx, graph);
    this.ambience = new Ambience(ctx, graph.ambience, graph.ambienceWet, randomSeed());
    this.ambience.set(this.ambienceParams, ctx.currentTime);
    this.music = new Music(ctx, graph.music, graph.musicWet, randomSeed());
    this.updateMusicOn();
    this.updateRunState();
    this.prerender();
  }

  private async prerender(): Promise<void> {
    const ctx = this.ctx;
    if (!ctx || this.rendering || this.sfxBuffers) return;
    this.rendering = true;
    try {
      this.sfxBuffers = await prerenderSfx(ctx.sampleRate);
    } catch (err) {
      // Effects keep playing live (slightly more work per sound); nothing else changes.
      console.warn('Claude City: could not pre-render sound effects', err);
    } finally {
      this.rendering = false;
    }
  }

  private watchVisibility(): void {
    const doc = (globalThis as unknown as { document?: Document }).document;
    if (!doc || typeof doc.addEventListener !== 'function') return;
    const update = () =>
      this.guard(() => {
        this.hidden = doc.visibilityState === 'hidden';
        this.updateRunState();
      });
    doc.addEventListener('visibilitychange', update);
    this.hidden = doc.visibilityState === 'hidden';
  }

  private playSilence(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      // ignore
    }
  }

  // ------------------------------------------------------------------------------------------
  // Running, pausing, scheduling
  // ------------------------------------------------------------------------------------------

  /**
   * Run only in the foreground, and only when something can be heard: with both volumes at zero
   * the context is suspended so the device can sleep the audio hardware.
   */
  private wantsToRun(): boolean {
    return !this.appSuspended && !this.hidden && (this.volumes.sfx > 0 || this.volumes.music > 0);
  }

  private updateRunState(): void {
    const ctx = this.ctx;
    const graph = this.graph;
    if (!ctx || !graph) return;
    const t = ctx.currentTime;
    if (this.wantsToRun()) {
      if (this.suspendTimer !== null) {
        clearTimeout(this.suspendTimer);
        this.suspendTimer = null;
      }
      graph.master.gain.cancelScheduledValues(t);
      graph.master.gain.setTargetAtTime(1, t, 0.04);
      if (ctx.state !== 'running') this.resumeContext();
      this.startTimer();
    } else {
      this.stopTimer();
      if (this.suspendTimer !== null) return;
      // Fade out over ~50 ms, then suspend, so going to the background never clicks.
      graph.master.gain.cancelScheduledValues(t);
      graph.master.gain.setTargetAtTime(0, t, 0.015);
      this.suspendTimer = setTimeout(
        () =>
          this.guard(() => {
            this.suspendTimer = null;
            if (this.wantsToRun() || !this.ctx || this.ctx.state !== 'running') return;
            const p = this.ctx.suspend();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          }),
        90,
      );
    }
  }

  private resumeContext(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      // On iOS this can stay suspended outside a gesture; the next unlock() from a touch fixes it.
      this.resumeAskedAt = Date.now();
      const p = ctx.resume();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      // ignore
    }
  }

  private onStateChange(): void {
    this.guard(() => {
      const ctx = this.ctx;
      if (!ctx) return;
      if (ctx.state === 'running' && !this.wantsToRun()) {
        // Something (the OS, an old resume) restarted us while we should be quiet.
        this.updateRunState();
      } else if (ctx.state === 'running') {
        this.tick();
      }
    });
  }

  private startTimer(): void {
    if (this.timer !== null || !this.started) return;
    this.timer = setInterval(() => this.guard(() => this.tick()), TICK_MS);
    this.tick();
  }

  private stopTimer(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private updateMusicOn(): void {
    const on = this.volumes.music > 0.001;
    if (on && !this.musicOn && this.music && this.ctx) this.music.restart(this.ctx.currentTime + 0.3);
    this.musicOn = on;
  }

  private tick(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.wantsToRun()) return;
    const now = ctx.currentTime;
    const until = now + LOOKAHEAD;
    if (this.music && this.musicOn) {
      // After a long stall the next bar is in the past: start a fresh phrase rather than cramming.
      if (this.music.nextTime < now - 0.05 || this.music.nextTime > now + 60) this.music.restart(now + 0.2);
      this.music.scheduleUntil(until);
    }
    if (this.ambience && this.volumes.sfx > 0) this.ambience.scheduleUntil(now, until);
  }

  private duckMusic(t: number): void {
    const duck = this.graph?.duck.gain;
    if (!duck) return;
    duck.cancelScheduledValues(t);
    duck.setTargetAtTime(0.4, t, 0.04);
    duck.setTargetAtTime(1, t + 1.6, 0.6);
  }

  /** Runs a callback, turning any exception into a warning (audio must never break the game). */
  guard(fn: () => void): void {
    try {
      fn();
    } catch (err) {
      console.warn('Claude City audio:', err);
    }
  }
}

/** The game's sound engine. Safe to create before any user gesture; nothing plays until unlock(). */
export function createAudio(): AudioEngine {
  const engine = new Engine();
  const safe =
    <A extends unknown[]>(fn: (...args: A) => void) =>
    (...args: A): void =>
      engine.guard(() => fn.apply(engine, args));
  return {
    unlock: safe(engine.unlock),
    play: safe(engine.play),
    setAmbience: safe(engine.setAmbience),
    setVolumes: safe(engine.setVolumes),
    suspend: safe(engine.suspend),
    resume: safe(engine.resume),
    // Not part of AudioEngine: read by the dev harness through a cast.
    stats: () => engine.stats(),
  } as AudioEngine;
}
