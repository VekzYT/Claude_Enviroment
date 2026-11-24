// The budget sheet: projected monthly income per zone with a tax slider each (and that zone's
// demand beside it), upkeep, the net per month, and a chart of money and people over time.
import { DEFAULT_TAX, MAX_TAX } from '../core/config';
import { ZONE_COLORS } from '../core/defs';
import type { GameState } from '../core/types';
import { CHART_MONEY, CHART_POP, historyChart } from './chart';
import { Sheet, sheetHeader, type Ctx } from './ctx';
import { h, isolateField, setHTML, setStyle, setText, toggleClass } from './dom';
import { count, demandWord, money, recordMonthLabel, signedMoney } from './format';
import { icon } from './icons';

type Zone = 'res' | 'com' | 'ind';
const ZONES: Array<[Zone, string, string]> = [
  ['res', 'Homes', 'house'],
  ['com', 'Shops', 'shop'],
  ['ind', 'Industry', 'factory'],
];

const CHART_W = 232;
const CHART_H = 118;

export interface Budget {
  readonly sheet: Sheet;
  open(): void;
  update(state: GameState): void;
}

export function createBudget(ctx: Ctx): Budget {
  const sheet = new Sheet(ctx, { cls: 'budget', modal: true, backdropCloses: true, layer: 'sheet' });
  const head = sheetHeader(ctx, sheet, 'coins', 'Budget', '#f0a01c');
  const treasury = h('span', 'treasury');
  const treasuryVal = h('b', 'num');
  treasury.append(h('span', '', 'Treasury'), treasuryVal);
  head.extra.appendChild(treasury);

  const body = h('div', 'sh-body budget-body');
  const left = h('section', 'b-left');
  const right = h('section', 'b-right');
  body.append(left, right);
  sheet.card.append(head.el, body);

  // ---- taxes and income ----
  const cols = h('div', 'b-cols', '<span>Tax</span><span>Demand</span><span>Income</span>');
  left.appendChild(cols);
  const rows = ZONES.map(([zone, label, ic]) => {
    const row = h('div', 'b-zone');
    row.style.setProperty('--c', ZONE_COLORS[zone]);
    const name = h('span', 'b-name', `<span class="tile xs">${icon(ic)}</span><span>${label}</span>`);
    const slider = h('input', 'slider');
    slider.type = 'range';
    slider.min = '0';
    slider.max = String(MAX_TAX);
    slider.step = '1';
    slider.setAttribute('aria-label', `${label} tax`);
    isolateField(slider);
    const pct = h('span', 'b-pct num');
    const dem = h('span', 'b-demand');
    const meter = h('span', 'meter');
    const fill = h('i');
    meter.appendChild(fill);
    const word = h('small');
    dem.append(meter, word);
    const inc = h('span', 'b-income num');
    row.append(name, slider, pct, dem, inc);
    left.appendChild(row);

    let pending = -1;
    let raf = 0;
    const apply = () => {
      raf = 0;
      if (pending < 0) return;
      const v = pending;
      pending = -1;
      ctx.actions.setTax(zone, v);
      refresh(ctx.actions.getState());
    };
    slider.addEventListener('input', () => {
      const v = Math.round(Number(slider.value));
      setText(pct, `${v}%`);
      setStyle(slider, '--p', `${(v / MAX_TAX) * 100}%`);
      pending = v;
      // Recomputing the city is not free: at most once per frame while the thumb moves.
      if (!raf) raf = requestAnimationFrame(apply);
    });
    slider.addEventListener('change', () => {
      if (raf) {
        cancelAnimationFrame(raf);
        apply();
      }
      ctx.click();
    });
    return { zone, slider, pct, fill, word, inc, meter };
  });

  // ---- expenses and net ----
  const exp = h('div', 'b-lines');
  const roadsVal = h('b', 'num');
  const bldVal = h('b', 'num');
  const netVal = h('b', 'num');
  const l1 = h('div', 'b-line', `${icon('road')}<span>Road upkeep</span>`);
  l1.appendChild(roadsVal);
  const l2 = h('div', 'b-line', `${icon('civic')}<span>Building upkeep</span>`);
  l2.appendChild(bldVal);
  const l3 = h('div', 'b-line b-net', `<span>Net per month</span>`);
  l3.appendChild(netVal);
  exp.append(l1, l2, l3);
  left.appendChild(exp);

  // ---- chart ----
  right.appendChild(h('h4', 'b-sub', 'Money and people'));
  const chartBox = h('div', 'b-chart');
  const legend = h('div', 'b-legend');
  const legMoney = h('b', 'num');
  const legPop = h('b', 'num');
  const lm = h('span', '', `<i style="background:${CHART_MONEY}"></i>Money `);
  lm.appendChild(legMoney);
  const lp = h('span', '', `<i style="background:${CHART_POP}"></i>People `);
  lp.appendChild(legPop);
  legend.append(lm, lp);
  const axis = h('div', 'b-axis');
  const axisFrom = h('span');
  axis.append(axisFrom, h('span', '', 'Now'));
  right.append(chartBox, axis, legend, h('p', 'b-note', `Taxes above ${DEFAULT_TAX}% slow growth. Lower taxes bring people in but earn less.`));

  let chartKey = '';

  function refresh(state: GameState): void {
    const s = state.stats;
    setText(treasuryVal, money(state.money));
    toggleClass(treasuryVal, 'bad', state.money < 0);
    for (const r of rows) {
      const tax = Math.round(state.taxes[r.zone]);
      // Do not fight the player's thumb while they drag.
      if (document.activeElement !== r.slider && r.slider.value !== String(tax)) r.slider.value = String(tax);
      const shown = Math.round(Number(r.slider.value));
      setText(r.pct, `${shown}%`);
      setStyle(r.slider, '--p', `${(shown / MAX_TAX) * 100}%`);
      const d = Math.max(-1, Math.min(1, s.demand[r.zone] || 0));
      setStyle(r.fill, 'width', `${Math.round(Math.abs(d) * 50)}%`);
      toggleClass(r.fill, 'neg', d < 0);
      setText(r.word, demandWord(d));
      setText(r.inc, signedMoney(s.income[r.zone]));
    }
    setText(roadsVal, signedMoney(-s.expenses.roads));
    setText(bldVal, signedMoney(-s.expenses.buildings));
    const net = s.income.total - s.expenses.total;
    setText(netVal, signedMoney(net));
    toggleClass(netVal, 'bad', net < 0);
    toggleClass(netVal, 'good', net > 0);

    const hist = state.history;
    const lastRec = hist[hist.length - 1];
    const key = `${hist.length}|${lastRec ? lastRec.day + ':' + lastRec.money : ''}`;
    if (key !== chartKey) {
      chartKey = key;
      const svg = historyChart(hist, CHART_W, CHART_H);
      setHTML(
        chartBox,
        svg ||
          `<div class="b-empty">${icon('chart')}<span>The chart fills in as the months go by.</span></div>`,
      );
      setText(axisFrom, hist.length >= 2 ? recordMonthLabel(hist[0].day) : '');
      axis.hidden = hist.length < 2;
    }
    setText(legMoney, money(state.money));
    setText(legPop, count(s.population));
  }

  return {
    sheet,
    open() {
      chartKey = '';
      refresh(ctx.actions.getState());
      sheet.open();
    },
    update(state) {
      if (sheet.isOpen) refresh(state);
    },
  };
}
