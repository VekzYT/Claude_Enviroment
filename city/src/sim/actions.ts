// OWNER: sim agent. What the player's tools do. Keep these signatures.
import type { ApplyResult, GameState, Plan, TilePos, ToolId } from '../core/types';

/**
 * What `tool` would do if dragged from `a` to `b` (a == b for a tap). Pure: does not change state.
 * road: L-shaped path (long axis first). zones/bulldoze: the rectangle a..b. build:*: footprint
 * centred on b. inspect: empty plan.
 */
export function planTool(_state: GameState, tool: ToolId, _a: TilePos, _b: TilePos): Plan {
  return { tool, tiles: [], ok: [], cost: 0, valid: false, reason: 'not implemented' };
}

/** Carry out a plan made by planTool: spends money, changes tiles, pushes an undo record, emits 'applied'. */
export function applyPlan(_state: GameState, _plan: Plan): ApplyResult {
  return { ok: false, spent: 0, changed: [] };
}

export function canUndo(state: GameState): boolean {
  return state.undo.length > 0;
}

/** Take back the most recent action and refund it. Returns false if there was nothing to undo. */
export function undo(_state: GameState): boolean {
  return false;
}

/** True if the city's population has reached what this tool needs. */
export function isUnlocked(_state: GameState, _tool: ToolId): boolean {
  return true;
}
