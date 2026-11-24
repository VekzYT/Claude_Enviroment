// OWNER: sim agent. Month-end budget, history, milestones and the helpful (rate-limited) toasts.

import { DAYS_PER_MONTH, HISTORY_MONTHS, MILESTONES } from '../core/config';
import { BUILDING_TYPES, BUILDINGS } from '../core/defs';
import { emit } from '../core/events';
import type { BuildingType, GameState, MonthRecord } from '../core/types';
import { Problem, TileKind, ZoneType } from '../core/types';
import { growthBlocker, UNHAPPY_HAPPINESS } from './growth';
import type { SimCache } from './util';
import { formatMoney } from './util';

/** A toast of one kind is shown at most once per this many months. */
const TOAST_COOLDOWN_MONTHS = 6;

/** Building types whose unlock population lies in (fromPop, toPop]. */
export function typesUnlockedBetween(fromPop: number, toPop: number): BuildingType[] {
  return BUILDING_TYPES.filter((t) => BUILDINGS[t].unlockPop > fromPop && BUILDINGS[t].unlockPop <= toPop);
}

/** Award every milestone the population has reached. Safe to call any time after a recompute. */
export function checkMilestones(state: GameState): void {
  const pop = state.stats.population;
  while (state.milestone + 1 < MILESTONES.length && pop >= MILESTONES[state.milestone + 1].population) {
    const prev = MILESTONES[state.milestone];
    state.milestone++;
    const m = MILESTONES[state.milestone];
    state.money += m.reward;
    const unlocked = typesUnlockedBetween(prev.population, m.population);
    emit({ type: 'milestone', index: state.milestone, name: m.name, reward: m.reward, unlocked });
    const names = unlocked.map((t) => BUILDINGS[t].name);
    let text = `${state.name} is now a ${m.name}!`;
    if (m.reward > 0) text += ` +${formatMoney(m.reward)}.`;
    if (names.length) text += ` New: ${names.join(', ')}.`;
    emit({ type: 'toast', text, tone: 'good' });
  }
}

function monthNumber(state: GameState): number {
  return Math.floor(state.day / DAYS_PER_MONTH);
}

function toast(state: GameState, c: SimCache, kind: string, text: string, tone: 'info' | 'good' | 'bad'): boolean {
  const now = monthNumber(state);
  const last = c.lastToast.get(kind);
  if (last !== undefined && now - last < TOAST_COOLDOWN_MONTHS) return false;
  c.lastToast.set(kind, now);
  emit({ type: 'toast', text, tone });
  return true;
}

/** Look for the city's most pressing real problems and say what to do, at most one per kind per ~6 months. */
function adviseToasts(state: GameState, c: SimCache): void {
  const s = state.stats;
  const T = state.tiles;
  const n = state.size * state.size;
  let zoned = 0;
  let developed = 0;
  let noPowerLots = 0;
  let noRoadLots = 0;
  let thirstyCottages = 0;
  let noWaterBig = 0;
  let powerFull = 0;
  let waterFull = 0;
  for (let i = 0; i < n; i++) {
    if (T.kind[i] !== TileKind.Zone) continue;
    zoned++;
    const L = T.level[i];
    if (L > 0) developed++;
    if (T.problems[i] & Problem.NoRoad) noRoadLots++;
    else if (T.problems[i] & Problem.NoPower) noPowerLots++;
    if (L === 1 && T.zone[i] === ZoneType.Res && !T.water[i]) thirstyCottages++;
    if (L >= 2 && !T.water[i]) noWaterBig++;
    // Lots that would grow but for a full plant or water tower nearby.
    if (L > 0 && L < 3) {
      const why = growthBlocker(state, c, i);
      if (why === 'powerCap') powerFull++;
      else if (why === 'waterCap') waterFull++;
    }
  }
  const hasPlant = c.powerProducers.length > 0;
  const hasWater = c.waterProducers.length > 0;

  // Power first: nothing grows without it.
  if (zoned >= 8 && !hasPlant) {
    toast(state, c, 'power', 'Zones need power to grow. Build a power plant near them.', 'bad');
  } else if (s.powerDemand > s.powerSupply && hasPlant) {
    toast(state, c, 'power', 'Power plants are at full capacity. Build another plant so the city can keep growing.', 'bad');
  } else if (noPowerLots >= 6 && hasPlant) {
    toast(state, c, 'powerReach', 'Some lots have no power: they are out of reach or the plants near them are full. Build a power plant close by.', 'bad');
  } else if (powerFull >= 8) {
    toast(state, c, 'powerReach', 'The power plants near some buildings are full, so they cannot grow. Build another plant near them.', 'info');
  }

  if (thirstyCottages >= 10 && !hasWater) {
    toast(state, c, 'water', 'Homes cannot grow past cottages without water. Build a water tower next to a road.', 'info');
  } else if (s.waterDemand > s.waterSupply && hasWater) {
    toast(state, c, 'water', 'Water demand is higher than supply. Add a water tower or a pump.', 'bad');
  } else if (noWaterBig >= 4 && hasWater) {
    toast(state, c, 'waterReach', 'Some buildings have no water. Put a water tower closer to them.', 'bad');
  } else if (waterFull >= 8) {
    toast(state, c, 'waterReach', 'The water supply near some buildings is used up, so they cannot grow. Add a water tower or pump.', 'info');
  }

  if (noRoadLots >= 10) {
    toast(state, c, 'road', 'Some zoned lots are too far from a road. Zones need a road within 3 tiles.', 'info');
  }

  if (state.money < 0) {
    toast(state, c, 'debt', 'The treasury is in the red. Raise taxes a little or cut costly buildings.', 'bad');
  } else if (state.monthsInDebt === 0 && s.income.total < s.expenses.total && state.money < 2000 && developed > 0) {
    toast(state, c, 'lowcash', 'Money is running low and the city is losing money each month.', 'bad');
  }

  // Unhappy residents move away: say why, from the biggest drag on happiness.
  if (s.population >= 40 && s.happiness < UNHAPPY_HAPPINESS + 5) {
    const p = c.happinessParts;
    const worst = (['jobs', 'taxes', 'utilities', 'pollution'] as const).reduce((a, b) => (p[b] < p[a] ? b : a));
    const why: Record<typeof worst, string> = {
      jobs: 'there are not enough jobs. Zone more industry or shops',
      taxes: 'taxes are too high. Lower them a little',
      utilities: 'homes are missing power or water. Fix the supply',
      pollution: 'pollution reaches their homes. Keep industry and smokestacks away',
    };
    const reason = p[worst] < -3 ? why[worst] : 'the city lacks services. Build police, fire, clinics, schools and parks';
    toast(state, c, 'unhappy', `People are unhappy and starting to leave: ${reason}.`, 'bad');
  }

  const jobs = s.jobsCom + s.jobsInd;
  if (s.population >= 40 && jobs === 0) {
    toast(state, c, 'jobs', 'Your residents need jobs. Zone some industry or shops.', 'info');
  } else if (s.workforce >= 60 && s.unemployment > 0.2) {
    toast(state, c, 'jobs', 'Many people are out of work. Zone more industry or shops.', 'bad');
  }
}

/** End of month: collect taxes, pay upkeep, record history, advise. Stats must be fresh. */
export function endOfMonth(state: GameState, c: SimCache): void {
  const s = state.stats;
  const net = s.income.total - s.expenses.total;
  state.money = Math.round(state.money + net);
  state.monthsInDebt = state.money < 0 ? state.monthsInDebt + 1 : 0;

  const record: MonthRecord = {
    day: state.day,
    population: s.population,
    money: state.money,
    income: s.income.total,
    expenses: s.expenses.total,
    happiness: Math.round(s.happiness),
  };
  state.history.push(record);
  if (state.history.length > HISTORY_MONTHS) state.history.splice(0, state.history.length - HISTORY_MONTHS);
  emit({ type: 'month', record });

  // One cheerful note the first time the city ends a month in profit with people living here.
  if (net > 0 && s.population > 0 && state.history.slice(0, -1).every((r) => r.income <= r.expenses || r.population === 0)) {
    toast(state, c, 'profit', `The city made a profit this month: +${formatMoney(net)}. Keep it up!`, 'good');
  }
  adviseToasts(state, c);
}
