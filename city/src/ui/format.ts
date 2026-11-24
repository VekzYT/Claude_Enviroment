// Number and date formatting for the interface. Kept free of DOM so it is easy to test.
import { DAYS_PER_MONTH, MILESTONES, MONTH_NAMES } from '../core/config';
import { monthIndex, yearNumber } from '../core/state';
import type { GameState } from '../core/types';

/** A real minus sign reads better than a hyphen next to a dollar sign. */
const MINUS = '−';

/** 12345 -> "12,345" (rounded, no sign). */
export function groupDigits(n: number): string {
  const s = String(Math.round(Math.abs(n)));
  let out = '';
  for (let k = 0; k < s.length; k++) {
    if (k > 0 && (s.length - k) % 3 === 0) out += ',';
    out += s[k];
  }
  return out;
}

/** Short form for big amounts: 1_234_567 -> "1.2M", 12_000_000 -> "12M". */
function compact(abs: number): string {
  const units: Array<[number, string]> = [
    [1e9, 'B'],
    [1e6, 'M'],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const v = abs / size;
      // One decimal below 100 (1.2M), none above (125M); never show a trailing ".0".
      const txt = v < 100 ? (Math.floor(v * 10) / 10).toFixed(1).replace(/\.0$/, '') : String(Math.floor(v));
      return txt + suffix;
    }
  }
  return groupDigits(abs);
}

/** $12,345 / $1.2M / −$500. */
export function money(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  const r = Math.round(n);
  return (r < 0 ? MINUS : '') + '$' + compact(Math.abs(r));
}

/** Money with an explicit sign: +$230 / −$120 / $0. */
export function signedMoney(n: number): string {
  const r = Math.round(Number.isFinite(n) ? n : 0);
  if (r === 0) return '$0';
  return (r > 0 ? '+' : MINUS) + '$' + compact(Math.abs(r));
}

/** People and other counts: 1,234 / 1.2M. */
export function count(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return compact(Math.max(0, Math.round(n)));
}

export function plural(n: number, one: string, many = one + 's'): string {
  return `${groupDigits(n)} ${n === 1 ? one : many}`;
}

/** "Mar, Year 2" for a game day. */
export function dateLabel(day: number): string {
  const d = Math.max(0, Math.floor(day));
  return `${MONTH_NAMES[monthIndex(d, DAYS_PER_MONTH)]}, Year ${yearNumber(d, DAYS_PER_MONTH)}`;
}

/** Label of the month a history record closed (records are stamped with the first day after it). */
export function recordMonthLabel(day: number): string {
  const d = Math.max(0, day - 1);
  return `${MONTH_NAMES[monthIndex(d, DAYS_PER_MONTH)]} Y${yearNumber(d, DAYS_PER_MONTH)}`;
}

/** Population needed for the next milestone, or null once the last one is reached. */
export function nextMilestone(state: GameState): { name: string; population: number; from: number } | null {
  const cur = Math.max(0, Math.min(MILESTONES.length - 1, state.milestone | 0));
  const next = MILESTONES[cur + 1];
  if (!next) return null;
  return { name: next.name, population: next.population, from: MILESTONES[cur].population };
}

/**
 * The toolbar unlock rule: a tool is available once the population reaches its unlockPop, or once a
 * milestone at or above that population has ever been reached (so a shrinking city keeps its tools).
 */
export function isUnlocked(state: GameState, unlockPop: number): boolean {
  if (unlockPop <= 0) return true;
  if (state.stats.population >= unlockPop) return true;
  const reached = MILESTONES[Math.max(0, Math.min(MILESTONES.length - 1, state.milestone | 0))];
  return reached.population >= unlockPop;
}

/** Demand (-1..1) in a word, for the budget sheet. */
export function demandWord(d: number): string {
  if (d > 0.55) return 'High';
  if (d > 0.2) return 'Some';
  if (d > -0.2) return 'Low';
  return 'None';
}
