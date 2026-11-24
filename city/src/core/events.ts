// A tiny typed event bus. The simulation and actions emit; UI, audio and haptics listen.
// Emitting never throws: a listener that fails is reported to the console and skipped.

import type { BuildingType, MonthRecord, ToolId } from './types';

export type GameEvent =
  /** A short message for the toast strip. */
  | { type: 'toast'; text: string; tone: 'info' | 'good' | 'bad' }
  /** The city reached a new milestone (index into config.MILESTONES). Reward already added to money. */
  | { type: 'milestone'; index: number; name: string; reward: number; unlocked: BuildingType[] }
  /** A month ended; the record was just appended to state.history. */
  | { type: 'month'; record: MonthRecord }
  /** The player applied a tool successfully. */
  | { type: 'applied'; tool: ToolId; tiles: number[]; spent: number }
  /** The player tried something that cannot be done; `reason` is plain language. */
  | { type: 'denied'; tool: ToolId; reason: string }
  /** A lot changed level (up or down). Emitted sparingly by the simulation. */
  | { type: 'grew'; i: number; level: number; up: boolean }
  /** The player undid an action. */
  | { type: 'undo'; tool: ToolId; refund: number }
  /** A new city was started or a save was loaded: everything should refresh. */
  | { type: 'reset' };

type Listener<T extends GameEvent['type']> = (e: Extract<GameEvent, { type: T }>) => void;

const listeners = new Map<string, Set<(e: GameEvent) => void>>();

export function on<T extends GameEvent['type']>(type: T, fn: Listener<T>): () => void {
  let set = listeners.get(type);
  if (!set) {
    set = new Set();
    listeners.set(type, set);
  }
  const wrapped = fn as (e: GameEvent) => void;
  set.add(wrapped);
  return () => set!.delete(wrapped);
}

export function emit(e: GameEvent): void {
  const set = listeners.get(e.type);
  if (!set) return;
  for (const fn of [...set]) {
    try {
      fn(e);
    } catch (err) {
      console.error('event listener failed for', e.type, err);
    }
  }
}

/** For tests: drop every listener. */
export function clearListeners(): void {
  listeners.clear();
}
