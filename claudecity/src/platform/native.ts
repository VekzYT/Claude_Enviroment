// OWNER: audio agent (platform). Talks to the iOS app (GameViewController.swift) when running inside
// it, and falls back to the browser (localStorage, no haptics) everywhere else.
//
// The iOS app exposes one script message handler, window.webkit.messageHandlers.cubopolis, whose
// postMessage({op, ...}) returns a Promise (WKScriptMessageHandlerWithReply):
//   {op:'haptic', style}      -> true
//   {op:'save', slot, data}   -> true
//   {op:'load', slot}         -> the string, or null
//   {op:'delete', slot}       -> true
//
// Everything here is defensive: storage can be full, disabled (private mode) or cleared by the OS,
// and the bridge can be missing or fail. Nothing in this file throws to the caller except
// storeSave, which rejects only when the city could not be stored anywhere at all.
import { on } from '../core/events';
import type { HapticStyle, Quality, Settings } from '../core/types';

// ---------------------------------------------------------------------------------------------
// Environment (injectable so the logic can be unit-tested with fakes)
// ---------------------------------------------------------------------------------------------

/** The part of the iOS message handler we use. */
export interface NativeHandler {
  postMessage(message: unknown): unknown;
}

/** The part of the Web Storage API we use (localStorage, or a fake in tests). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PlatformEnv {
  /** The iOS message handler, or null outside the app. Looked up on every call. */
  handler(): NativeHandler | null;
  /** localStorage, or null where it is unavailable. Looked up on every call. */
  storage(): StorageLike | null;
  /** Milliseconds, monotonic enough for rate limiting. */
  now(): number;
  /** Haptic tick used outside the app, or null for none. */
  webHaptic: (() => void) | null;
  /** How long to wait for the app to answer before giving up (ms). */
  timeoutMs?: number;
}

export interface Platform {
  /** True when the iOS bridge is present right now. */
  readonly native: boolean;
  haptic(style: HapticStyle): void;
  setHapticsEnabled(enabled: boolean): void;
  storeSave(slot: string, data: string): Promise<void>;
  loadSave(slot: string): Promise<string | null>;
  deleteSave(slot: string): Promise<void>;
  loadSettings(): Settings;
  saveSettings(settings: Settings): void;
}

// ---------------------------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------------------------

export const SAVE_KEY_PREFIX = 'claudecity:save:';
export const SETTINGS_KEY = 'claudecity:settings';
/** Marks a slot whose localStorage copy is newer than the app's file (the native write failed). */
const PENDING_SUFFIX = ':pending';
/** ~15 haptics per second at most: the Taptic Engine blurs faster taps together anyway. */
export const HAPTIC_MIN_GAP_MS = 66;
const DEFAULT_TIMEOUT_MS = 5000;
const HAPTIC_STYLES: readonly HapticStyle[] = ['light', 'medium', 'heavy', 'selection', 'success', 'warning', 'error'];
const QUALITIES: readonly Quality[] = ['low', 'medium', 'high'];
const MAX_SEEN_TIPS = 200;
const MAX_TIP_ID = 64;

// ---------------------------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------------------------

/**
 * Slot names become file names in the app (letters, digits, '-' and '_', at most 40 characters),
 * so anything else is replaced. The same cleaned name is used for the localStorage key, so the
 * two stores always agree on which slot is which.
 */
export function safeSlot(slot: string): string {
  const cleaned = String(slot ?? '')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 40);
  return cleaned || 'default';
}

export function defaultSettings(): Settings {
  return { quality: 'high', sfxVolume: 0.8, musicVolume: 0.5, haptics: true, tips: true, seenTips: [], lookSensitivity: 1, invertY: false };
}

function unit(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
}

/**
 * Turns anything (parsed JSON, a settings object from the UI) into valid Settings: known fields
 * with the right type are kept (numbers clamped into range), everything else falls back to the
 * default. Never throws.
 */
export function validateSettings(raw: unknown): Settings {
  const d = defaultSettings();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return d;
  const r = raw as Record<string, unknown>;
  const seen: string[] = [];
  if (Array.isArray(r.seenTips)) {
    for (const id of r.seenTips) {
      if (typeof id !== 'string' || id.length === 0 || id.length > MAX_TIP_ID || seen.includes(id)) continue;
      seen.push(id);
      if (seen.length >= MAX_SEEN_TIPS) break;
    }
  }
  return {
    quality: QUALITIES.includes(r.quality as Quality) ? (r.quality as Quality) : d.quality,
    sfxVolume: unit(r.sfxVolume, d.sfxVolume),
    musicVolume: unit(r.musicVolume, d.musicVolume),
    haptics: typeof r.haptics === 'boolean' ? r.haptics : d.haptics,
    tips: typeof r.tips === 'boolean' ? r.tips : d.tips,
    seenTips: seen,
    lookSensitivity: typeof r.lookSensitivity === 'number' && Number.isFinite(r.lookSensitivity) ? Math.min(3, Math.max(0.2, r.lookSensitivity)) : d.lookSensitivity,
    invertY: typeof r.invertY === 'boolean' ? r.invertY : d.invertY,
  };
}

/** Calls the app and waits for its reply, giving up after `timeoutMs`. */
function post(handler: NativeHandler, message: Record<string, unknown>, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`the app did not answer '${String(message.op)}'`));
    }, timeoutMs);
    const finish = (ok: boolean, value: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (ok) resolve(value);
      else reject(value instanceof Error ? value : new Error(String(value)));
    };
    try {
      Promise.resolve(handler.postMessage(message)).then(
        (v) => finish(true, v),
        (e) => finish(false, e),
      );
    } catch (e) {
      finish(false, e);
    }
  });
}

// ---------------------------------------------------------------------------------------------
// The platform object
// ---------------------------------------------------------------------------------------------

export function createPlatform(env: PlatformEnv): Platform {
  const timeoutMs = env.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let hapticsOn = true;
  let lastHaptic = -Infinity;

  const handler = (): NativeHandler | null => {
    try {
      return env.handler();
    } catch {
      return null;
    }
  };
  const storage = (): StorageLike | null => {
    try {
      return env.storage();
    } catch {
      return null;
    }
  };
  const readLocal = (key: string): string | null => {
    try {
      const v = storage()?.getItem(key);
      return typeof v === 'string' ? v : null;
    } catch {
      return null;
    }
  };
  /** Returns false if the value could not be written (quota, private mode, no storage). */
  const writeLocal = (key: string, value: string): boolean => {
    try {
      const s = storage();
      if (!s) return false;
      s.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  };
  const removeLocal = (key: string): void => {
    try {
      storage()?.removeItem(key);
    } catch {
      // nothing to do: the key stays, which is harmless
    }
  };

  const platform: Platform = {
    get native() {
      return handler() !== null;
    },

    haptic(style: HapticStyle): void {
      try {
        if (!hapticsOn) return;
        const t = env.now();
        if (t - lastHaptic < HAPTIC_MIN_GAP_MS) return;
        lastHaptic = t;
        const h = handler();
        if (h) {
          const s = HAPTIC_STYLES.includes(style) ? style : 'light';
          post(h, { op: 'haptic', style: s }, timeoutMs).catch(() => {});
        } else if (env.webHaptic) {
          env.webHaptic();
        }
      } catch {
        // haptics are decoration: never let them break a tap
      }
    },

    setHapticsEnabled(enabled: boolean): void {
      hapticsOn = enabled !== false;
    },

    async storeSave(slot: string, data: string): Promise<void> {
      const s = safeSlot(slot);
      const key = SAVE_KEY_PREFIX + s;
      // Best-effort mirror first (synchronous); quota errors only mean there is no backup.
      const localOk = writeLocal(key, data);
      const h = handler();
      if (h) {
        try {
          const reply = await post(h, { op: 'save', slot: s, data }, timeoutMs);
          if (reply === false) throw new Error('the app refused the save');
          removeLocal(key + PENDING_SUFFIX);
          return;
        } catch (err) {
          if (localOk) {
            // The browser copy is now the newest one; loadSave prefers it until the app has it.
            writeLocal(key + PENDING_SUFFIX, '1');
            console.warn('Claude City: saving to the app failed, kept a browser copy:', err);
            return;
          }
          throw new Error(`Could not save the city: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      if (!localOk) throw new Error('Could not save the city: storage is full or unavailable.');
      requestPersistence();
    },

    async loadSave(slot: string): Promise<string | null> {
      const s = safeSlot(slot);
      const key = SAVE_KEY_PREFIX + s;
      const local = readLocal(key);
      const h = handler();
      if (!h) return local;
      if (local !== null && readLocal(key + PENDING_SUFFIX) !== null) {
        // The last native write failed but the browser copy succeeded: it is the newest city.
        // Try to hand it to the app again in the background.
        post(h, { op: 'save', slot: s, data: local }, timeoutMs).then(
          () => removeLocal(key + PENDING_SUFFIX),
          () => {},
        );
        return local;
      }
      try {
        const v = await post(h, { op: 'load', slot: s }, timeoutMs);
        if (typeof v === 'string' && v.length > 0) return v;
      } catch (err) {
        console.warn('Claude City: loading from the app failed, using the browser copy:', err);
      }
      return local;
    },

    async deleteSave(slot: string): Promise<void> {
      const s = safeSlot(slot);
      const key = SAVE_KEY_PREFIX + s;
      removeLocal(key);
      removeLocal(key + PENDING_SUFFIX);
      const h = handler();
      if (!h) return;
      try {
        await post(h, { op: 'delete', slot: s }, timeoutMs);
      } catch (err) {
        // The next save to this slot overwrites the file anyway.
        console.warn('Claude City: deleting the save in the app failed:', err);
      }
    },

    loadSettings(): Settings {
      let parsed: unknown = null;
      const text = readLocal(SETTINGS_KEY);
      if (text !== null) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = null;
        }
      }
      const settings = validateSettings(parsed);
      hapticsOn = settings.haptics;
      return settings;
    },

    saveSettings(settings: Settings): void {
      const clean = validateSettings(settings);
      hapticsOn = clean.haptics;
      writeLocal(SETTINGS_KEY, JSON.stringify(clean));
    },
  };
  return platform;
}

// ---------------------------------------------------------------------------------------------
// The real browser / app environment
// ---------------------------------------------------------------------------------------------

type GlobalLike = {
  webkit?: { messageHandlers?: Record<string, NativeHandler | undefined> };
  localStorage?: StorageLike;
  navigator?: Navigator;
  document?: Document;
  performance?: { now(): number };
};
const g = globalThis as unknown as GlobalLike;

function findHandler(): NativeHandler | null {
  try {
    const h = g.webkit?.messageHandlers?.cubopolis;
    return h && typeof h.postMessage === 'function' ? h : null;
  } catch {
    return null;
  }
}

function findStorage(): StorageLike | null {
  try {
    const s = g.localStorage;
    return s && typeof s.getItem === 'function' ? s : null;
  } catch {
    // Safari throws SecurityError on access when storage is blocked.
    return null;
  }
}

/** Home Screen web apps on iPhone: Safari 17.4+ plays the system tick when a switch toggles. */
function isAppleTouchWeb(): boolean {
  try {
    const nav = g.navigator;
    if (!nav || !g.document) return false;
    const ua = nav.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1);
  } catch {
    return false;
  }
}

let switchLabel: HTMLLabelElement | null = null;
/**
 * Haptics outside the app. There is no vibration API on iPhone, but toggling an
 * `<input type=checkbox switch>` makes WebKit play the system selection tick, and a click on its
 * label toggles it. The pair is hidden, inert to assistive tech, and stops its events from
 * bubbling, so the game's own listeners never see these synthetic clicks.
 */
function webSwitchTick(): void {
  const doc = g.document;
  if (!doc || !doc.body) return;
  if (!switchLabel || !switchLabel.isConnected) {
    const label = doc.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.display = 'none';
    const input = doc.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    const stop = (e: Event) => e.stopPropagation();
    for (const el of [label, input]) {
      el.addEventListener('click', stop);
      el.addEventListener('change', stop);
      el.addEventListener('input', stop);
    }
    label.appendChild(input);
    doc.body.appendChild(label);
    switchLabel = label;
  }
  switchLabel.click();
}

let askedPersistence = false;
/** Ask the browser to keep our storage when space runs low (best effort, once). */
function requestPersistence(): void {
  if (askedPersistence) return;
  askedPersistence = true;
  try {
    const storageManager = g.navigator?.storage as { persist?: () => Promise<boolean> } | undefined;
    storageManager?.persist?.().catch(() => {});
  } catch {
    // not supported: fine
  }
}

const platform = createPlatform({
  handler: findHandler,
  storage: findStorage,
  now: () => {
    try {
      return g.performance ? g.performance.now() : Date.now();
    } catch {
      return Date.now();
    }
  },
  webHaptic: isAppleTouchWeb() ? webSwitchTick : null,
});

// ---------------------------------------------------------------------------------------------
// Public API (signatures used by the rest of the game)
// ---------------------------------------------------------------------------------------------

/** True inside the iOS app. */
export const isNative: boolean = findHandler() !== null;

/**
 * A haptic tap: through the app when native, the Home Screen web-app switch tick on iPhone
 * otherwise. Rate-limited to ~15/s, silent while haptics are off in the settings, never throws.
 */
export function haptic(style: HapticStyle): void {
  platform.haptic(style);
}

/** Turn haptics on/off. loadSettings and saveSettings call this for you from `settings.haptics`. */
export function setHapticsEnabled(enabled: boolean): void {
  platform.setHapticsEnabled(enabled);
}

/**
 * Store a save. In the app it goes to the app's file store with a best-effort localStorage mirror;
 * in a browser to localStorage ('cubopolis:save:<slot>'). Rejects only if it was stored nowhere.
 */
export async function storeSave(slot: string, data: string): Promise<void> {
  return platform.storeSave(slot, data);
}

/** The saved text for a slot, or null if there is none. Never rejects. */
export async function loadSave(slot: string): Promise<string | null> {
  return platform.loadSave(slot);
}

/** Remove a save from every store. Never rejects. */
export async function deleteSave(slot: string): Promise<void> {
  return platform.deleteSave(slot);
}

/** Settings from localStorage, merged over the defaults and validated. Never throws. */
export function loadSettings(): Settings {
  return platform.loadSettings();
}

/** Validates and stores the settings in localStorage (silently skipped if storage is unavailable). */
export function saveSettings(settings: Settings): void {
  platform.saveSettings(settings);
}

/**
 * Optional wiring: haptics for game events (crashes, landings, pickups, missions).
 * Returns a function that removes the listeners. Respects the haptics setting and rate limit.
 */
export function connectHaptics(): () => void {
  const offs = [
    on('crash', (e) => haptic(e.force > 14 ? 'heavy' : e.force > 5 ? 'medium' : 'light')),
    on('land', (e) => haptic(e.airTime > 0.8 ? 'heavy' : 'medium')),
    on('enter', () => haptic('light')),
    on('exit', () => haptic('light')),
    on('pickup', () => haptic('selection')),
    on('pulse', (e) => {
      if (e.mine) haptic('light');
    }),
    on('heat', (e) => {
      if (e.level > e.prev) haptic('warning');
    }),
    on('busted', () => haptic('error')),
    on('mission', (e) => {
      if (e.phase === 'complete') haptic('success');
      else if (e.phase === 'fail') haptic('error');
    }),
  ];
  return () => offs.forEach((off) => off());
}
