/** All watersort localStorage keys in one place. */
export const WATERSORT_STORAGE = {
  screen: "watersort:screen",
  completedLevel: "watersort:completedLevel",
  game: "watersort:game",
  godMode: "watersort:godMode",
} as const;

/** Remove saved screen, journey progress, and in-progress game (this device only). */
export function clearAllLocalProgress(): void {
  for (const key of Object.values(WATERSORT_STORAGE)) {
    localStorage.removeItem(key);
  }
}
