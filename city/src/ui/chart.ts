// A small two-line chart (money and population over the last months) drawn as inline SVG.
import type { MonthRecord } from '../core/types';

export const CHART_MONEY = '#ff7a3d';
export const CHART_POP = '#3fae5b';

function range(values: number[], includeZero: boolean): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (includeZero) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (hi - lo < 1e-6) {
    // A flat line sits in the middle rather than on the floor.
    const pad = Math.max(1, Math.abs(hi) * 0.1);
    return [lo - pad, hi + pad];
  }
  const pad = (hi - lo) * 0.08;
  return [lo - pad, hi + pad];
}

/** SVG markup for the chart, or '' when there is too little history to draw a line. */
export function historyChart(history: MonthRecord[], w: number, hgt: number): string {
  const recs = history.filter((r) => Number.isFinite(r.money) && Number.isFinite(r.population));
  if (recs.length < 2) return '';
  const padX = 4;
  const padY = 6;
  const iw = w - padX * 2;
  const ih = hgt - padY * 2;
  const n = recs.length;
  const xOf = (k: number) => padX + (iw * k) / (n - 1);

  const money = recs.map((r) => r.money);
  const pop = recs.map((r) => r.population);
  const [mLo, mHi] = range(money, money.some((v) => v < 0));
  const [pLo0, pHi] = range(pop, false);
  const pLo = Math.min(pLo0, 0);
  const yM = (v: number) => padY + ih - ((v - mLo) / (mHi - mLo)) * ih;
  const yP = (v: number) => padY + ih - ((v - pLo) / (pHi - pLo || 1)) * ih;

  const line = (vals: number[], y: (v: number) => number) => vals.map((v, k) => `${k ? 'L' : 'M'}${xOf(k).toFixed(1)} ${y(v).toFixed(1)}`).join('');
  const popLine = line(pop, yP);
  const popArea = `${popLine}L${xOf(n - 1).toFixed(1)} ${(padY + ih).toFixed(1)}L${xOf(0).toFixed(1)} ${(padY + ih).toFixed(1)}Z`;
  const moneyLine = line(money, yM);

  let grid = '';
  for (let k = 0; k <= 3; k++) {
    const y = (padY + (ih * k) / 3).toFixed(1);
    grid += `<line x1="${padX}" x2="${w - padX}" y1="${y}" y2="${y}" class="grid"/>`;
  }
  // Zero line for money when the treasury dipped below zero.
  const zero = mLo < 0 ? `<line x1="${padX}" x2="${w - padX}" y1="${yM(0).toFixed(1)}" y2="${yM(0).toFixed(1)}" class="zero"/>` : '';
  const last = n - 1;
  return (
    `<svg class="chart" viewBox="0 0 ${w} ${hgt}" width="${w}" height="${hgt}" aria-hidden="true">` +
    grid +
    zero +
    `<path d="${popArea}" fill="${CHART_POP}" fill-opacity=".16"/>` +
    `<path d="${popLine}" class="ln" stroke="${CHART_POP}"/>` +
    `<path d="${moneyLine}" class="ln" stroke="${CHART_MONEY}"/>` +
    `<circle cx="${xOf(last).toFixed(1)}" cy="${yP(pop[last]).toFixed(1)}" r="3.5" fill="${CHART_POP}" class="dot"/>` +
    `<circle cx="${xOf(last).toFixed(1)}" cy="${yM(money[last]).toFixed(1)}" r="3.5" fill="${CHART_MONEY}" class="dot"/>` +
    `</svg>`
  );
}
