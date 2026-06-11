import type { SaveData } from '../types';

const KEY = 'gravehorde-save-v1';

const DEFAULTS: SaveData = {
  bestTimeSec: 0,
  bestKills: 0,
  wins: 0,
  runs: 0,
  muted: false
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function storeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable (private mode etc.) — play on without persistence */
  }
}
