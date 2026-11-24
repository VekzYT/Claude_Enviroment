// OWNER: audio agent. All sound is synthesised with the Web Audio API (no sound files).
import type { SfxId } from '../core/types';

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

export function createAudio(): AudioEngine {
  return {
    unlock() {},
    play() {},
    setAmbience() {},
    setVolumes() {},
    suspend() {},
    resume() {},
  };
}
