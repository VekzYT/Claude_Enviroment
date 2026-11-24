// Optional wiring from game events to sound effects, so main.ts needs one line:
//   const offAudio = connectAudio(audio);
// UI buttons (click / tool / open / close) are played by the UI through its own actions.
import { on } from '../core/events';
import type { SfxId, ToolId } from '../core/types';

interface Player {
  play(sfx: SfxId): void;
}

/** The effect for successfully applying a tool, or null for tools that make no sound. */
export function sfxForTool(tool: ToolId): SfxId | null {
  if (tool === 'road') return 'road';
  if (tool === 'zone_res' || tool === 'zone_com' || tool === 'zone_ind') return 'zone';
  if (tool === 'bulldoze') return 'bulldoze';
  if (tool.startsWith('build:')) return 'build';
  return null;
}

/** A coin for the month's taxes at most this often (real ms), so fast speeds don't jingle. */
const CASH_EVERY_MS = 20000;

/**
 * Plays effects for sim events: applied tools, denied actions, milestones, lots growing, undo and
 * month ends (a coin when the month made money, at most every 20 s; otherwise a page tick).
 * Returns a function that removes the listeners.
 */
export function connectAudio(audio: Player): () => void {
  let lastCash = -Infinity;
  const offs = [
    on('applied', (e) => {
      const s = sfxForTool(e.tool);
      if (s) audio.play(s);
    }),
    on('denied', () => audio.play('denied')),
    on('milestone', () => audio.play('milestone')),
    on('grew', (e) => {
      if (e.up) audio.play('grow');
    }),
    on('undo', () => audio.play('undo')),
    on('month', (e) => {
      const now = Date.now();
      if (e.record.income - e.record.expenses > 0 && now - lastCash >= CASH_EVERY_MS) {
        lastCash = now;
        audio.play('cash');
      } else {
        audio.play('month');
      }
    }),
  ];
  return () => offs.forEach((off) => off());
}
