import { WATERSORT_STORAGE } from "./storage";

/** Get the highest level index the player has completed (0-indexed). -1 if none. */
export function getHighestCompleted(): number {
  const val = localStorage.getItem(WATERSORT_STORAGE.completedLevel);
  if (val === null) return -1;
  const n = parseInt(val, 10);
  return isNaN(n) ? -1 : n;
}

/** Mark a level as completed (only advances the high-water mark). */
export function markLevelCompleted(levelIndex: number) {
  const current = getHighestCompleted();
  if (levelIndex > current) {
    localStorage.setItem(WATERSORT_STORAGE.completedLevel, String(levelIndex));
  }
}

export function isGodMode(): boolean {
  return localStorage.getItem(WATERSORT_STORAGE.godMode) === "1";
}

export function toggleGodMode(): boolean {
  const next = !isGodMode();
  if (next) {
    localStorage.setItem(WATERSORT_STORAGE.godMode, "1");
  } else {
    localStorage.removeItem(WATERSORT_STORAGE.godMode);
  }
  return next;
}
