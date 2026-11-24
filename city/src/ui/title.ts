// The title screen (logo, Continue, New City) and the new-city screen (map preview, name, start).
import { START_MONEY } from '../core/config';
import { randomSeed } from '../core/rng';
import { Sheet, type Ctx } from './ctx';
import { accent, btn, h, isolateField } from './dom';
import { money } from './format';
import { icon } from './icons';
import { drawMinimap, mapFacts } from './minimap';
import { randomCityName } from './names';

export interface Screens {
  showTitle(): void;
  /** Open the new-city screen. `fromTitle` decides where its back button goes. */
  showNewCity(fromTitle: boolean): void;
  readonly title: Sheet;
  readonly newCity: Sheet;
  closeAll(): void;
  /** The new-city screen's back button (Escape): back to the title, or back to the game. */
  newCityBack(): void;
}

const LOGO_TOP = 'CUBO';
const LOGO_BOTTOM = 'POLIS';
const BLOCK_COLORS = ['#ff7a3d', '#f2b632', '#4cc764', '#3d8bff', '#9b6bff', '#ff5a7a', '#18a999', '#f2b632', '#ff7a3d'];
const NAME_MAX = 24;

function versionString(): string {
  try {
    return typeof __VERSION__ === 'string' && __VERSION__ ? __VERSION__ : 'dev';
  } catch {
    return 'dev';
  }
}

/** The logo: two rows of letter blocks stacked like toys (CUBO on top of POLIS). */
function logo(): HTMLElement {
  const el = h('div', 'logo');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Cubopolis');
  let k = 0;
  const rows = [LOGO_TOP, LOGO_BOTTOM];
  // The bottom row lands first, then the top row drops onto it.
  const order = [LOGO_TOP.length, 0];
  rows.forEach((word, r) => {
    const row = h('div', `logo-row r${r}`);
    for (let j = 0; j < word.length; j++) {
      const b = h('span', 'lb');
      b.textContent = word[j];
      accent(b, BLOCK_COLORS[k % BLOCK_COLORS.length]);
      // A gentle, fixed wobble so the stack looks hand-placed.
      const tilt = [-3, 2, -1.5, 3, -2.5, 1.5, -2, 2.5, -1][k % 9];
      b.style.setProperty('--tilt', `${tilt}deg`);
      b.style.animationDelay = `${0.08 + (order[r] + j) * 0.07}s`;
      row.appendChild(b);
      k++;
    }
    el.appendChild(row);
  });
  return el;
}

export function createScreens(ctx: Ctx): Screens {
  // ---------------- title ----------------
  const title = new Sheet(ctx, { cls: 'title', modal: true, backdropCloses: false, layer: 'screen' });
  title.wrap.classList.add('title-wrap');
  const floaters = h('div', 'floaters');
  for (let k = 0; k < 9; k++) {
    const f = h('i');
    accent(f, BLOCK_COLORS[(k * 3) % BLOCK_COLORS.length]);
    f.style.left = `${6 + ((k * 37) % 88)}%`;
    f.style.top = `${10 + ((k * 53) % 76)}%`;
    f.style.animationDelay = `${-k * 1.7}s`;
    f.style.setProperty('--s', `${10 + ((k * 7) % 14)}px`);
    floaters.appendChild(f);
  }
  title.wrap.insertBefore(floaters, title.card);
  const logoBox = h('div', 'logo-box');
  const tagline = h('p', 'tagline', 'Build a little city, block by block.');
  const btns = h('div', 'title-btns');
  const cont = btn('pbtn big primary', `${icon('speed1')}<span>Continue</span>`);
  cont.hidden = true;
  const fresh = btn('pbtn big', `${icon('plus')}<span>New City</span>`);
  btns.append(cont, fresh);
  const ver = h('div', 'title-ver', versionString());
  title.card.append(logoBox, tagline, btns);
  title.wrap.appendChild(ver);

  let busy = false;
  cont.addEventListener('click', async () => {
    if (busy) return;
    ctx.click();
    busy = true;
    cont.disabled = true;
    let ok = false;
    try {
      ok = await ctx.actions.continueCity();
    } catch {
      ok = false;
    }
    busy = false;
    cont.disabled = false;
    if (ok) {
      title.close();
    } else {
      cont.hidden = true;
      fresh.classList.add('primary');
      ctx.toast('Your saved city could not be opened. Start a new one?', 'bad');
    }
  });
  fresh.addEventListener('click', () => {
    ctx.click();
    showNewCity(true);
  });

  function showTitle(): void {
    newCity.closeNow();
    logoBox.innerHTML = '';
    logoBox.appendChild(logo());
    cont.hidden = true;
    fresh.classList.add('primary');
    title.open();
    // Continue appears once we know there is a save to continue.
    ctx.actions
      .hasSave()
      .then((has) => {
        if (!title.isOpen) return;
        cont.hidden = !has;
        fresh.classList.toggle('primary', !has);
      })
      .catch(() => {
        /* no save: New City stays the main button */
      });
  }

  // ---------------- new city ----------------
  const newCity = new Sheet(ctx, { cls: 'newcity', modal: true, backdropCloses: false, layer: 'screen' });
  newCity.wrap.classList.add('title-wrap');
  const head = h('div', 'nc-head');
  const back = btn('round sm', icon('back'), 'Back');
  const hTitle = h('h2', 'sh-title', 'A new city');
  head.append(back, hTitle);

  const mapCol = h('div', 'nc-map');
  const frame = h('div', 'nc-frame');
  const canvas = h('canvas');
  frame.appendChild(canvas);
  const reroll = btn('pbtn', `${icon('dice')}<span>Another map</span>`);
  mapCol.append(frame, reroll);

  const side = h('div', 'nc-side');
  const label = h('label', 'nc-label', 'Name your city');
  const nameRow = h('div', 'nc-name');
  const input = h('input');
  input.type = 'text';
  input.maxLength = NAME_MAX;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'words');
  input.setAttribute('enterkeyhint', 'done');
  input.id = 'cubo-city-name';
  label.htmlFor = input.id;
  isolateField(input);
  const dice = btn('round', icon('dice'), 'Another name');
  nameRow.append(input, dice);
  const facts = h('div', 'nc-facts');
  const start = btn('pbtn big primary', `<span>Start building</span>${icon('speed1')}`);
  const hint = h(
    'p',
    'nc-hint',
    `You start with <b>${money(START_MONEY)}</b>. Lay roads, zone homes beside them, then bring in power and water so they grow.`,
  );
  side.append(label, nameRow, facts, hint, start);

  const nbody = h('div', 'nc-body');
  nbody.append(mapCol, side);
  newCity.card.append(head, nbody);

  let seed = randomSeed();
  let cameFromTitle = true;

  function renderMap(): void {
    frame.classList.add('loading');
    // Let the screen paint first; map generation takes a moment.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        try {
          const preview = ctx.actions.previewMap(seed);
          const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
          const css = frame.clientWidth || 200;
          const px = Math.round(css * dpr);
          // Whole pixels per tile keep the blocks crisp.
          const per = Math.max(1, Math.floor(px / preview.size));
          canvas.width = canvas.height = per * preview.size;
          drawMinimap(canvas, preview);
          const f = mapFacts(preview);
          facts.innerHTML =
            `<span class="fact">${icon('map')}<b>${f.kind}</b></span>` +
            `<span class="fact">${icon('drop')}${Math.round(f.water * 100)}% water</span>` +
            `<span class="fact">${icon('tree')}${Math.round(f.trees * 100)}% trees</span>`;
        } catch (err) {
          console.error('map preview failed', err);
          facts.textContent = '';
        }
        frame.classList.remove('loading');
      }),
    );
  }

  function showNewCity(fromTitle: boolean): void {
    cameFromTitle = fromTitle;
    seed = randomSeed();
    input.value = randomCityName();
    title.closeNow();
    newCity.open();
    renderMap();
  }

  function goBack(): void {
    input.blur();
    if (cameFromTitle) {
      newCity.closeNow();
      showTitle();
    } else {
      newCity.close();
    }
  }
  back.addEventListener('click', () => {
    ctx.click();
    goBack();
  });
  reroll.addEventListener('click', () => {
    ctx.click();
    seed = randomSeed();
    renderMap();
  });
  dice.addEventListener('click', () => {
    ctx.click();
    let name = randomCityName();
    for (let k = 0; k < 4 && name === input.value; k++) name = randomCityName();
    input.value = name;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });
  start.addEventListener('click', () => {
    ctx.click();
    input.blur();
    const name = input.value.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) || randomCityName();
    newCity.close();
    ctx.actions.startNewCity(seed, name);
  });

  return {
    showTitle,
    showNewCity,
    title,
    newCity,
    closeAll() {
      title.closeNow();
      newCity.closeNow();
    },
    newCityBack() {
      if (newCity.isOpen) goBack();
    },
  };
}
