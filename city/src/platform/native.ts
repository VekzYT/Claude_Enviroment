// OWNER: audio agent (platform). Talks to the iOS app (GameViewController.swift) when running inside
// it, and falls back to the browser (localStorage, no haptics) everywhere else.
import type { HapticStyle, Settings } from '../core/types';

/** True inside the iOS app. */
export const isNative = false;

export function haptic(_style: HapticStyle): void {}

export async function storeSave(_slot: string, _data: string): Promise<void> {}

export async function loadSave(_slot: string): Promise<string | null> {
  return null;
}

export async function deleteSave(_slot: string): Promise<void> {}

export function defaultSettings(): Settings {
  return { quality: 'high', sfxVolume: 0.8, musicVolume: 0.5, haptics: true, tips: true, seenTips: [] };
}

export function loadSettings(): Settings {
  return defaultSettings();
}

export function saveSettings(_settings: Settings): void {}
