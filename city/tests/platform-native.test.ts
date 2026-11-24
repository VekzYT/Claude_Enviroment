// The platform bridge: slot names, settings validation, browser storage, the iOS app's message
// handler (with fakes for both), fallbacks when either store fails, and haptic rate limiting.
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { clearListeners, emit } from '../src/core/events';
import type { HapticStyle } from '../src/core/types';
import {
  type NativeHandler,
  type PlatformEnv,
  type StorageLike,
  HAPTIC_MIN_GAP_MS,
  SAVE_KEY_PREFIX,
  SETTINGS_KEY,
  connectHaptics,
  createPlatform,
  defaultSettings,
  deleteSave,
  haptic,
  isNative,
  loadSave,
  loadSettings,
  safeSlot,
  saveSettings,
  setHapticsEnabled,
  storeSave,
  validateSettings,
} from '../src/platform/native';

// ---------- fakes ----------

class FakeStorage implements StorageLike {
  map = new Map<string, string>();
  /** Total characters allowed (keys + values), like a quota. */
  quota = Infinity;
  /** When set, every access throws (Safari with storage blocked). */
  blocked = false;
  getItem(key: string): string | null {
    if (this.blocked) throw new Error('SecurityError');
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    if (this.blocked) throw new Error('SecurityError');
    let used = 0;
    for (const [k, v] of this.map) if (k !== key) used += k.length + v.length;
    if (used + key.length + value.length > this.quota) throw new Error('QuotaExceededError');
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    if (this.blocked) throw new Error('SecurityError');
    this.map.delete(key);
  }
}

type Msg = { op: string; slot?: string; data?: string; style?: string };

/** Mimics GameViewController: a file store keyed by slot, replies through a Promise. */
class FakeApp implements NativeHandler {
  files = new Map<string, string>();
  messages: Msg[] = [];
  /** 'ok' | 'reject' | 'hang' | 'throw' for each op */
  mode: Record<string, 'ok' | 'reject' | 'hang' | 'throw'> = {};
  postMessage(message: unknown): Promise<unknown> {
    const m = message as Msg;
    this.messages.push(m);
    const mode = this.mode[m.op] ?? 'ok';
    if (mode === 'throw') throw new Error('bridge exploded');
    if (mode === 'hang') return new Promise(() => {});
    if (mode === 'reject') return Promise.reject(new Error(`${m.op} failed`));
    switch (m.op) {
      case 'save':
        this.files.set(m.slot!, m.data!);
        return Promise.resolve(true);
      case 'load':
        return Promise.resolve(this.files.has(m.slot!) ? this.files.get(m.slot!)! : null);
      case 'delete':
        this.files.delete(m.slot!);
        return Promise.resolve(true);
      case 'haptic':
        return Promise.resolve(true);
      default:
        return Promise.reject(new Error('unknown op'));
    }
  }
  ops(op: string): Msg[] {
    return this.messages.filter((m) => m.op === op);
  }
}

function setup(opts: { app?: FakeApp | null; storage?: FakeStorage | null; web?: () => void } = {}) {
  const storage = opts.storage === undefined ? new FakeStorage() : opts.storage;
  const app = opts.app === undefined ? null : opts.app;
  const clock = { t: 1000 };
  const env: PlatformEnv = {
    handler: () => app,
    storage: () => storage,
    now: () => clock.t,
    webHaptic: opts.web ?? null,
    timeoutMs: 40,
  };
  return { p: createPlatform(env), storage: storage!, app: app!, clock };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

// Silence the expected warnings from fallback paths.
const warn = console.warn;
console.warn = () => {};
afterEach(() => clearListeners());
process.on('exit', () => (console.warn = warn));

// ---------- pure helpers ----------

test('slot names are cleaned to what the app accepts as a file name', () => {
  assert.equal(safeSlot('city-1_A'), 'city-1_A');
  assert.equal(safeSlot('my city/../x'), 'my_city____x');
  assert.equal(safeSlot(''), 'default');
  assert.equal(safeSlot('x'.repeat(60)).length, 40);
  assert.equal(safeSlot('héllo'), 'h_llo');
});

test('settings are merged over the defaults and validated', () => {
  assert.deepEqual(validateSettings(null), defaultSettings());
  assert.deepEqual(validateSettings('nope'), defaultSettings());
  assert.deepEqual(validateSettings([1, 2]), defaultSettings());
  const s = validateSettings({
    quality: 'ultra',
    sfxVolume: 3,
    musicVolume: -1,
    haptics: 'yes',
    tips: false,
    seenTips: ['a', 'a', 7, '', 'b', 'x'.repeat(200)],
    extra: 1,
  });
  assert.deepEqual(s, { quality: 'high', sfxVolume: 1, musicVolume: 0, haptics: true, tips: false, seenTips: ['a', 'b'] });
  assert.equal(validateSettings({ sfxVolume: NaN }).sfxVolume, defaultSettings().sfxVolume);
  assert.equal(validateSettings({ musicVolume: Infinity }).musicVolume, defaultSettings().musicVolume);
  assert.deepEqual(validateSettings({ quality: 'low', sfxVolume: 0.25 }), { ...defaultSettings(), quality: 'low', sfxVolume: 0.25 });
  assert.equal(validateSettings({ seenTips: Array.from({ length: 500 }, (_, i) => `t${i}`) }).seenTips.length, 200);
});

test('defaultSettings returns a fresh object each time', () => {
  const a = defaultSettings();
  a.seenTips.push('x');
  assert.deepEqual(defaultSettings().seenTips, []);
});

// ---------- browser (no app) ----------

test('in a browser saves live in localStorage under cubopolis:save:<slot>', async () => {
  const { p, storage } = setup();
  assert.equal(p.native, false);
  assert.equal(await p.loadSave('main'), null);
  await p.storeSave('main', '{"city":1}');
  assert.equal(storage.map.get(SAVE_KEY_PREFIX + 'main'), '{"city":1}');
  assert.equal(await p.loadSave('main'), '{"city":1}');
  await p.storeSave('main', '{"city":2}');
  assert.equal(await p.loadSave('main'), '{"city":2}');
  await p.deleteSave('main');
  assert.equal(await p.loadSave('main'), null);
  assert.equal(storage.map.size, 0);
});

test('in a browser a full or blocked storage makes storeSave reject, never throw synchronously', async () => {
  const { p, storage } = setup();
  storage.quota = 10;
  await assert.rejects(p.storeSave('main', 'x'.repeat(100)), /Could not save/);
  storage.quota = Infinity;
  storage.blocked = true;
  await assert.rejects(p.storeSave('main', 'data'), /Could not save/);
  assert.equal(await p.loadSave('main'), null);
  await p.deleteSave('main');
  assert.deepEqual(p.loadSettings(), defaultSettings());
  p.saveSettings({ ...defaultSettings(), quality: 'low' });
});

test('with no storage at all everything degrades quietly', async () => {
  const { p } = setup({ storage: null });
  assert.equal(await p.loadSave('main'), null);
  await assert.rejects(p.storeSave('main', 'data'));
  await p.deleteSave('main');
  assert.deepEqual(p.loadSettings(), defaultSettings());
  p.saveSettings(defaultSettings());
});

// ---------- inside the app ----------

test('in the app saves go to the file store and are mirrored to localStorage', async () => {
  const app = new FakeApp();
  const { p, storage } = setup({ app });
  assert.equal(p.native, true);
  await p.storeSave('main', 'CITY');
  assert.deepEqual(app.ops('save'), [{ op: 'save', slot: 'main', data: 'CITY' }]);
  assert.equal(app.files.get('main'), 'CITY');
  assert.equal(storage.map.get(SAVE_KEY_PREFIX + 'main'), 'CITY');
  assert.equal(await p.loadSave('main'), 'CITY');
  assert.equal(app.ops('load').length, 1);
});

test('the slot sent to the app is cleaned', async () => {
  const app = new FakeApp();
  const { p } = setup({ app });
  await p.storeSave('my city!', 'x');
  assert.equal(app.ops('save')[0].slot, 'my_city_');
  assert.equal(await p.loadSave('my city!'), 'x');
});

test('a full localStorage does not stop a native save', async () => {
  const app = new FakeApp();
  const { p, storage } = setup({ app });
  storage.quota = 5;
  await p.storeSave('main', 'A BIG CITY');
  assert.equal(app.files.get('main'), 'A BIG CITY');
  assert.equal(storage.map.has(SAVE_KEY_PREFIX + 'main'), false);
  assert.equal(await p.loadSave('main'), 'A BIG CITY');
});

test('loadSave falls back to localStorage when the app has nothing, fails or hangs', async () => {
  const app = new FakeApp();
  const { p, storage } = setup({ app });
  storage.map.set(SAVE_KEY_PREFIX + 'main', 'BACKUP');
  assert.equal(await p.loadSave('main'), 'BACKUP'); // app returns null
  app.mode.load = 'reject';
  assert.equal(await p.loadSave('main'), 'BACKUP');
  app.mode.load = 'throw';
  assert.equal(await p.loadSave('main'), 'BACKUP');
  app.mode.load = 'hang';
  assert.equal(await p.loadSave('main'), 'BACKUP'); // after the timeout
  storage.map.clear();
  assert.equal(await p.loadSave('main'), null);
});

test('an empty string from the app counts as no save', async () => {
  const app = new FakeApp();
  const { p, storage } = setup({ app });
  app.files.set('main', '');
  storage.map.set(SAVE_KEY_PREFIX + 'main', 'BACKUP');
  assert.equal(await p.loadSave('main'), 'BACKUP');
});

test('if the app fails to save, the browser copy is kept and preferred until the app has it', async () => {
  const app = new FakeApp();
  const { p, storage } = setup({ app });
  await p.storeSave('main', 'OLD');
  app.mode.save = 'reject';
  await p.storeSave('main', 'NEW'); // resolves: the browser copy holds it
  assert.equal(app.files.get('main'), 'OLD');
  assert.equal(storage.map.get(SAVE_KEY_PREFIX + 'main'), 'NEW');
  // The app still has the older city, but the newer browser copy wins.
  assert.equal(await p.loadSave('main'), 'NEW');
  // ...and is handed to the app again once it works.
  app.mode.save = 'ok';
  assert.equal(await p.loadSave('main'), 'NEW');
  await tick();
  assert.equal(app.files.get('main'), 'NEW');
  assert.equal(await p.loadSave('main'), 'NEW');
  assert.equal(storage.map.has(SAVE_KEY_PREFIX + 'main:pending'), false);
});

test('a successful native save clears the pending marker', async () => {
  const app = new FakeApp();
  const { p, storage } = setup({ app });
  app.mode.save = 'hang';
  await p.storeSave('main', 'A'); // times out, browser copy kept
  assert.equal(storage.map.get(SAVE_KEY_PREFIX + 'main:pending'), '1');
  app.mode.save = 'ok';
  await p.storeSave('main', 'B');
  assert.equal(storage.map.has(SAVE_KEY_PREFIX + 'main:pending'), false);
  assert.equal(await p.loadSave('main'), 'B');
});

test('storeSave rejects only when neither store took the city', async () => {
  const app = new FakeApp();
  const { p, storage } = setup({ app });
  app.mode.save = 'reject';
  storage.blocked = true;
  await assert.rejects(p.storeSave('main', 'X'), /Could not save the city/);
  app.mode.save = 'throw';
  await assert.rejects(p.storeSave('main', 'X'), /Could not save the city/);
});

test('deleteSave removes the file and the browser copy, and survives a failing app', async () => {
  const app = new FakeApp();
  const { p, storage } = setup({ app });
  await p.storeSave('main', 'CITY');
  await p.deleteSave('main');
  assert.equal(app.files.has('main'), false);
  assert.equal(storage.map.size, 0);
  assert.equal(await p.loadSave('main'), null);
  app.mode.delete = 'reject';
  await p.deleteSave('main'); // resolves
});

// ---------- settings ----------

test('settings round-trip through localStorage and survive corrupt data', () => {
  const { p, storage } = setup();
  assert.deepEqual(p.loadSettings(), defaultSettings());
  const mine = { quality: 'medium' as const, sfxVolume: 0.3, musicVolume: 0.1, haptics: false, tips: false, seenTips: ['pan', 'zone'] };
  p.saveSettings(mine);
  assert.deepEqual(JSON.parse(storage.map.get(SETTINGS_KEY)!), mine);
  assert.deepEqual(p.loadSettings(), mine);
  storage.map.set(SETTINGS_KEY, '{not json');
  assert.deepEqual(p.loadSettings(), defaultSettings());
  storage.map.set(SETTINGS_KEY, JSON.stringify({ musicVolume: 0.2 }));
  assert.deepEqual(p.loadSettings(), { ...defaultSettings(), musicVolume: 0.2 });
  storage.map.set(SETTINGS_KEY, 'null');
  assert.deepEqual(p.loadSettings(), defaultSettings());
});

test('saveSettings stores the validated version', () => {
  const { p, storage } = setup();
  p.saveSettings({ ...defaultSettings(), sfxVolume: 7 } as never);
  assert.equal(JSON.parse(storage.map.get(SETTINGS_KEY)!).sfxVolume, 1);
});

// ---------- haptics ----------

test('haptics go to the app, are rate limited to ~15/s and never throw', () => {
  const app = new FakeApp();
  const { p, clock } = setup({ app });
  p.haptic('light');
  p.haptic('heavy'); // same instant: dropped
  clock.t += HAPTIC_MIN_GAP_MS - 1;
  p.haptic('medium'); // still too soon
  clock.t += 2;
  p.haptic('success');
  assert.deepEqual(
    app.ops('haptic').map((m) => m.style),
    ['light', 'success'],
  );
  // Over one second of constant requests at 120 Hz, at most ~15 get through.
  const before = app.ops('haptic').length;
  for (let k = 0; k < 120; k++) {
    clock.t += 1000 / 120;
    p.haptic('selection');
  }
  const sent = app.ops('haptic').length - before;
  assert.ok(sent >= 13 && sent <= 16, `sent ${sent}`);
  clock.t += 1000;
  p.haptic('sparkly' as HapticStyle);
  assert.equal(app.ops('haptic').at(-1)!.style, 'light');
  app.mode.haptic = 'throw';
  clock.t += 1000;
  assert.doesNotThrow(() => p.haptic('light'));
  app.mode.haptic = 'reject';
  clock.t += 1000;
  assert.doesNotThrow(() => p.haptic('light'));
});

test('haptics follow the settings switch', () => {
  const app = new FakeApp();
  const { p, clock } = setup({ app });
  p.saveSettings({ ...defaultSettings(), haptics: false });
  p.haptic('light');
  assert.equal(app.ops('haptic').length, 0);
  p.setHapticsEnabled(true);
  p.haptic('light');
  assert.equal(app.ops('haptic').length, 1);
  p.saveSettings({ ...defaultSettings(), haptics: false });
  p.loadSettings(); // stored as off
  clock.t += 1000;
  p.haptic('light');
  assert.equal(app.ops('haptic').length, 1);
});

test('outside the app the web haptic is used when there is one', () => {
  let ticks = 0;
  const { p, clock } = setup({ web: () => ticks++ });
  p.haptic('light');
  clock.t += 100;
  p.haptic('medium');
  assert.equal(ticks, 2);
  const broken = setup({
    web: () => {
      throw new Error('no switch');
    },
  });
  assert.doesNotThrow(() => broken.p.haptic('light'));
  const none = setup();
  assert.doesNotThrow(() => none.p.haptic('light'));
});

test('a handler lookup that throws counts as not native', async () => {
  const p = createPlatform({
    handler: () => {
      throw new Error('boom');
    },
    storage: () => null,
    now: () => 0,
    webHaptic: null,
  });
  assert.equal(p.native, false);
  assert.equal(await p.loadSave('x'), null);
});

// ---------- the module-level API reads the real globals ----------

test('module functions use globalThis.localStorage and the webkit handler when present', async () => {
  const g = globalThis as unknown as { localStorage?: StorageLike; webkit?: unknown };
  const hadStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new FakeStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  try {
    assert.equal(isNative, false); // decided when the module loaded (no app in Node)
    await storeSave('slot1', 'hello');
    assert.equal(storage.map.get('cubopolis:save:slot1'), 'hello');
    assert.equal(await loadSave('slot1'), 'hello');
    saveSettings({ ...defaultSettings(), musicVolume: 0.25 });
    assert.equal(loadSettings().musicVolume, 0.25);

    // Now pretend to be inside the app.
    const app = new FakeApp();
    g.webkit = { messageHandlers: { cubopolis: app } };
    await storeSave('slot1', 'native!');
    assert.equal(app.files.get('slot1'), 'native!');
    assert.equal(await loadSave('slot1'), 'native!');
    setHapticsEnabled(true);
    haptic('selection');
    assert.equal(app.ops('haptic').length, 1);

    // Event wiring.
    const off = connectHaptics();
    await new Promise((r) => setTimeout(r, HAPTIC_MIN_GAP_MS + 5));
    emit({ type: 'milestone', index: 1, name: 'Hamlet', reward: 1000, unlocked: [] });
    assert.equal(app.ops('haptic').at(-1)!.style, 'success');
    off();
    await new Promise((r) => setTimeout(r, HAPTIC_MIN_GAP_MS + 5));
    emit({ type: 'denied', tool: 'road', reason: 'x' });
    assert.equal(app.ops('haptic').at(-1)!.style, 'success');

    await deleteSave('slot1');
    assert.equal(app.files.has('slot1'), false);
    assert.equal(storage.map.has('cubopolis:save:slot1'), false);
  } finally {
    delete g.webkit;
    if (hadStorage) Object.defineProperty(globalThis, 'localStorage', hadStorage);
    else delete g.localStorage;
  }
});
