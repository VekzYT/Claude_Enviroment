// The menu sheet: game settings on the left, the city's save / backup / restore / new city on the right.
import type { Quality, Settings } from '../core/types';
import { Sheet, sheetHeader, type Ctx } from './ctx';
import { btn, h, isolateField, setStyle, toggleClass } from './dom';
import { icon } from './icons';

export interface SettingsSheet {
  readonly sheet: Sheet;
  open(): void;
}

export interface SettingsHooks {
  /** The player confirmed they want a new city: show the new-city screen. */
  newCity(): void;
}

type View = 'list' | 'backup' | 'restore' | 'confirm';

function versionString(): string {
  try {
    return typeof __VERSION__ === 'string' && __VERSION__ ? __VERSION__ : 'dev';
  } catch {
    return 'dev';
  }
}

export function createSettings(ctx: Ctx, hooks: SettingsHooks): SettingsSheet {
  const sheet = new Sheet(ctx, { cls: 'settings', modal: true, backdropCloses: true, layer: 'sheet' });
  const head = sheetHeader(ctx, sheet, 'menu', 'Menu', '#687789');
  const body = h('div', 'sh-body settings-body');
  const left = h('section', 'set-left');
  const right = h('section', 'set-right');
  body.append(left, right);
  const foot = h('div', 'set-foot');
  foot.textContent = `Cubopolis ${versionString()} · made of little blocks`;
  sheet.card.append(head.el, body, foot);

  const get = (): Settings => ctx.actions.getSettings();
  const change = (patch: Partial<Settings>) => {
    ctx.actions.setSettings({ ...get(), ...patch });
  };

  // ---------- left: settings ----------
  const row = (ic: string, label: string, control: HTMLElement) => {
    const r = h('div', 'set-row', `${icon(ic, 'set-ic')}<span class="set-label">${label}</span>`);
    r.appendChild(control);
    left.appendChild(r);
    return r;
  };

  const seg = h('div', 'seg');
  const qBtns = (['low', 'medium', 'high'] as Quality[]).map((q) => {
    const b = btn('seg-btn', q === 'low' ? 'Low' : q === 'medium' ? 'Medium' : 'High');
    b.addEventListener('click', () => {
      ctx.click();
      change({ quality: q });
      sync();
    });
    seg.appendChild(b);
    return [q, b] as const;
  });
  row('sparkle', 'Graphics', seg);

  const volume = (key: 'sfxVolume' | 'musicVolume', label: string) => {
    const s = h('input', 'slider');
    s.type = 'range';
    s.min = '0';
    s.max = '100';
    s.step = '1';
    s.setAttribute('aria-label', label);
    isolateField(s);
    s.addEventListener('input', () => {
      const v = Math.round(Number(s.value));
      setStyle(s, '--p', `${v}%`);
      change({ [key]: v / 100 } as Partial<Settings>);
    });
    // Play the click at the new volume so the player hears what they picked.
    s.addEventListener('change', () => ctx.click());
    return s;
  };
  const sfx = volume('sfxVolume', 'Sound volume');
  const music = volume('musicVolume', 'Music volume');
  row('sound', 'Sound', sfx);
  row('music', 'Music', music);

  const toggle = (label: string, key: 'haptics' | 'tips') => {
    const t = btn('switch', '<i></i>', label);
    t.setAttribute('role', 'switch');
    t.addEventListener('click', () => {
      const on = !get()[key];
      // Turning tips back on starts them over, so a player can see them again.
      change(key === 'tips' && on ? { tips: true, seenTips: [] } : ({ [key]: on } as Partial<Settings>));
      ctx.click();
      sync();
    });
    return t;
  };
  const haptics = toggle('Vibration', 'haptics');
  const tips = toggle('Tips', 'tips');
  row('haptic', 'Vibration', haptics);
  row('bulb', 'Tips', tips);

  function sync(): void {
    const s = get();
    for (const [q, b] of qBtns) toggleClass(b, 'on', s.quality === q);
    for (const [el, v] of [
      [sfx, s.sfxVolume],
      [music, s.musicVolume],
    ] as const) {
      const pct = Math.round(Math.max(0, Math.min(1, Number(v) || 0)) * 100);
      el.value = String(pct);
      setStyle(el, '--p', `${pct}%`);
    }
    for (const [el, on] of [
      [haptics, s.haptics],
      [tips, s.tips],
    ] as const) {
      toggleClass(el, 'on', !!on);
      el.setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  // ---------- right: the city ----------
  const views = new Map<View, HTMLElement>();
  const mkView = (v: View) => {
    const el = h('div', `set-view set-${v}`);
    el.hidden = v !== 'list';
    views.set(v, el);
    right.appendChild(el);
    return el;
  };
  const show = (v: View) => {
    for (const [k, el] of views) el.hidden = k !== v;
  };
  const subHead = (el: HTMLElement, title: string) => {
    const hd = h('div', 'set-subhead');
    const back = btn('round xs', icon('back'), 'Back');
    back.addEventListener('click', () => {
      ctx.click();
      show('list');
    });
    const t = h('b');
    t.textContent = title;
    hd.append(back, t);
    el.appendChild(hd);
  };

  // List of city actions.
  const list = mkView('list');
  list.appendChild(h('h4', 'set-title', 'Your city'));
  const action = (ic: string, label: string, note: string, fn: () => void, cls = '') => {
    const b = btn(`set-action ${cls}`, `<span class="tile xs">${icon(ic)}</span><span class="sa-text"><b>${label}</b><small>${note}</small></span>`);
    b.addEventListener('click', () => {
      ctx.click();
      fn();
    });
    list.appendChild(b);
    return b;
  };
  const saveBtn = action('save', 'Save now', 'Your city also saves by itself', async () => {
    saveBtn.disabled = true;
    try {
      await ctx.actions.saveNow();
      ctx.toast('City saved', 'good');
    } catch {
      ctx.toast('Could not save right now. Try again in a moment.', 'bad');
    } finally {
      saveBtn.disabled = false;
    }
  });
  action('copy', 'Back up city', 'Get a code you can keep safe', () => {
    let code = '';
    try {
      code = ctx.actions.exportSave();
    } catch {
      code = '';
    }
    codeOut.value = code;
    copyStatus.textContent = code ? '' : 'Could not make a backup code right now.';
    copyStatus.className = code ? 'set-status' : 'set-status bad';
    show('backup');
  });
  action('restore', 'Restore city', 'Load a city from a backup code', () => {
    codeIn.value = '';
    restoreStatus.textContent = '';
    restoreStatus.className = 'set-status';
    show('restore');
  });
  action('plus', 'New city', 'Start fresh on a new map', () => show('confirm'), 'danger');

  // Backup: the code, read-only, with a copy button.
  const backup = mkView('backup');
  subHead(backup, 'Back up city');
  backup.appendChild(h('p', 'set-p', 'Copy this code and keep it somewhere safe, like your Notes.'));
  const codeOut = h('textarea', 'code');
  codeOut.readOnly = true;
  codeOut.rows = 3;
  codeOut.spellcheck = false;
  isolateField(codeOut);
  codeOut.addEventListener('focus', () => codeOut.select());
  const copyRow = h('div', 'set-btnrow');
  const copyBtn = btn('pbtn primary', `${icon('copy')}<span>Copy code</span>`);
  const copyStatus = h('span', 'set-status');
  copyRow.append(copyBtn, copyStatus);
  backup.append(codeOut, copyRow);
  copyBtn.addEventListener('click', async () => {
    ctx.click();
    const code = codeOut.value;
    if (!code) return;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext !== false) {
        await navigator.clipboard.writeText(code);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      // Fallback: select the text and try the old copy command; if that fails the text stays
      // selected so the player can use the system Copy menu.
      codeOut.focus();
      codeOut.select();
      codeOut.setSelectionRange(0, code.length);
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
    }
    copyStatus.textContent = ok ? 'Copied!' : 'Selected: tap and hold to copy';
    copyStatus.className = ok ? 'set-status good' : 'set-status';
  });

  // Restore: paste a code and load it.
  const restore = mkView('restore');
  subHead(restore, 'Restore city');
  restore.appendChild(h('p', 'set-p', 'Paste a backup code. It replaces the city you have now.'));
  const codeIn = h('textarea', 'code');
  codeIn.rows = 3;
  codeIn.spellcheck = false;
  codeIn.placeholder = 'Paste your code here';
  codeIn.setAttribute('autocapitalize', 'off');
  codeIn.setAttribute('autocomplete', 'off');
  isolateField(codeIn);
  const loadRow = h('div', 'set-btnrow');
  const loadBtn = btn('pbtn primary', `${icon('restore')}<span>Load city</span>`);
  const restoreStatus = h('span', 'set-status');
  loadRow.append(loadBtn, restoreStatus);
  restore.append(codeIn, loadRow);
  loadBtn.addEventListener('click', async () => {
    ctx.click();
    const code = codeIn.value.trim();
    if (!code) {
      restoreStatus.textContent = 'Paste a code first.';
      restoreStatus.className = 'set-status bad';
      return;
    }
    loadBtn.disabled = true;
    restoreStatus.textContent = 'Loading…';
    restoreStatus.className = 'set-status';
    let ok = false;
    try {
      ok = await ctx.actions.importSave(code);
    } catch {
      ok = false;
    }
    loadBtn.disabled = false;
    if (ok) {
      sheet.close();
      ctx.toast('City restored', 'good');
    } else {
      restoreStatus.textContent = 'That code did not work. Check it was copied completely.';
      restoreStatus.className = 'set-status bad';
    }
  });

  // Confirm a new city.
  const confirm = mkView('confirm');
  subHead(confirm, 'Start a new city?');
  confirm.appendChild(
    h('p', 'set-p', 'Your current city will be replaced. Back it up first if you might want it again.'),
  );
  const confirmRow = h('div', 'set-btnrow');
  const cancelBtn = btn('pbtn', '<span>Keep playing</span>');
  const newBtn = btn('pbtn danger', `${icon('plus')}<span>New city</span>`);
  confirmRow.append(cancelBtn, newBtn);
  confirm.appendChild(confirmRow);
  cancelBtn.addEventListener('click', () => {
    ctx.click();
    show('list');
  });
  newBtn.addEventListener('click', () => {
    ctx.click();
    sheet.closeNow();
    hooks.newCity();
  });

  return {
    sheet,
    open() {
      sync();
      show('list');
      sheet.open();
    },
  };
}
