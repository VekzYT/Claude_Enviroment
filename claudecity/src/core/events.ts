// A tiny typed event bus. The simulation announces what happened; ui, audio, render fx, haptics and
// missions listen. Listeners must not throw (they are isolated if they do) and must not change the
// game state re-entrantly in ways the emitter does not expect: queue work for the next step instead.

import type { GadgetId, PickupKind, PropKind, SfxId } from './types';

export type GameEvent =
  /** A short message for the player. */
  | { type: 'toast'; text: string; tone: 'info' | 'good' | 'bad' }
  /** A line of dialogue (Claude or a contact speaks). */
  | { type: 'dialog'; speaker: string; text: string }
  | { type: 'enter'; vehicle: number }
  /** The player pulled a driver out (`driverLook` >= 0) or broke into a locked parked vehicle (-1). */
  | { type: 'jack'; vehicle: number; driverLook: number; x: number; z: number }
  /** Something the police care about happened. `weight` is how serious (1 minor .. 5 grave). */
  | { type: 'crime'; kind: 'theft' | 'hitPerson' | 'hitVehicle' | 'damage' | 'police' | 'speeding' | 'trespass'; x: number; z: number; weight: number }
  | { type: 'exit'; vehicle: number }
  /** A vehicle hit something. `force` is the closing speed in m/s. */
  | { type: 'crash'; vehicle: number; x: number; y: number; z: number; force: number; into: 'building' | 'vehicle' | 'prop' | 'ped' }
  /** A vehicle came back down after `airTime` seconds off the ground. */
  | { type: 'land'; vehicle: number; x: number; z: number; airTime: number }
  | { type: 'propBroken'; index: number; kind: PropKind; x: number; z: number }
  | { type: 'pedHit'; ped: number; x: number; z: number; force: number; byPlayer: boolean }
  /** A pulse was fired / hit something. */
  | { type: 'pulse'; x: number; y: number; z: number; mine: boolean }
  | { type: 'zap'; x: number; y: number; z: number; target: 'vehicle' | 'drone' | 'ped' | 'wall' }
  /** A gadget other than the pulse was used at this spot. */
  | { type: 'gadget'; id: GadgetId; x: number; y: number; z: number }
  | { type: 'pickup'; kind: PickupKind; x: number; y: number; z: number; value: number }
  | { type: 'heat'; level: number; prev: number }
  /** The police caught the player (they wake up at the safehouse, fined). */
  | { type: 'busted'; fine: number }
  /** The player was knocked out (they wake up at the safehouse). */
  | { type: 'down' }
  | { type: 'respawn'; x: number; z: number }
  | { type: 'splash'; x: number; z: number; vehicle: number }
  | { type: 'mission'; phase: 'start' | 'stage' | 'complete' | 'fail'; id: string; title: string; text: string; reward: number }
  | { type: 'checkpoint'; index: number; total: number }
  | { type: 'tokens'; amount: number; total: number; reason: string }
  | { type: 'radio'; station: number; name: string }
  | { type: 'boost'; vehicle: number; on: boolean }
  | { type: 'horn'; vehicle: number }
  /** Something worth cheering: a long jump, a long drift, a near miss. */
  | { type: 'stunt'; kind: 'air' | 'drift' | 'nearMiss'; value: number }
  /** Ask the audio engine for a one-off sound. */
  | { type: 'sfx'; id: SfxId; x?: number; z?: number }
  /** A new game or a loaded save replaced the game state. */
  | { type: 'reset' };

export type EventType = GameEvent['type'];
type Listener<T extends EventType> = (e: Extract<GameEvent, { type: T }>) => void;

const listeners = new Map<EventType, Set<(e: GameEvent) => void>>();

export function on<T extends EventType>(type: T, fn: Listener<T>): () => void {
  let set = listeners.get(type);
  if (!set) listeners.set(type, (set = new Set()));
  set.add(fn as (e: GameEvent) => void);
  return () => set!.delete(fn as (e: GameEvent) => void);
}

export function emit(e: GameEvent): void {
  const set = listeners.get(e.type);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(e);
    } catch (err) {
      console.error('Sonnet Coast: an event listener failed for', e.type, err);
    }
  }
}

export function clearListeners(): void {
  listeners.clear();
}
