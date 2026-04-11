import type { GameMode, LevelConfig } from "./types";

/**
 * Tube liquid colors: order is used by the generator (first N for N colors).
 * Chosen for large hue/lightness separation so many colors stay readable at once
 * (avoids teal/cyan, orange/amber, indigo/lavender pairs from flatter palettes).
 */
export const COLORS = [
  "#e53935", // red
  "#1e88e5", // blue
  "#fdd835", // yellow
  "#43a047", // green
  "#fb8c00", // orange
  "#8e24aa", // purple
  "#00acc1", // cyan
  "#d81b60", // magenta pink
  "#558b2f", // olive
  "#b388ff", // light violet
  "#00897b", // teal
  "#6d4c41", // brown
];

export const COLOR_NAMES: Record<string, string> = {
  "#e53935": "Red",
  "#1e88e5": "Blue",
  "#fdd835": "Yellow",
  "#43a047": "Green",
  "#fb8c00": "Orange",
  "#8e24aa": "Purple",
  "#00acc1": "Cyan",
  "#d81b60": "Pink",
  "#558b2f": "Olive",
  "#b388ff": "Violet",
  "#00897b": "Teal",
  "#6d4c41": "Brown",
};

export const DEFAULT_CAPACITY = 4;
export const TOTAL_LEVELS = 1000;

/**
 * Max undo actions per puzzle. Tighter on harder journey tiers so undo feels earned;
 * Free Pour scales slightly with color count.
 */
export function undoBudgetForPuzzle(mode: GameMode, levelIndex: number, numColors: number): number {
  if (mode === "endless") {
    return Math.min(8, 4 + Math.min(4, numColors - 2));
  }
  const tier = Math.min(4, Math.floor(levelIndex / 200));
  return Math.max(4, Math.min(9, 5 + Math.floor(numColors / 3) - tier));
}

/**
 * Difficulty curve for 1000 levels.
 *
 *   1–20   : 3 colors, gentle shuffle          (warm-up)
 *   21–50  : 3→4 colors, moderate shuffle       (getting started)
 *   51–100 : 4→6 colors, growing shuffle        (intermediate)
 *   101–300: 6→8 colors, challenging shuffle     (hard)
 *   301–600: 8→10 colors, tough shuffle          (very hard)
 *   601–1000: 10→12 colors, maximum shuffle      (extreme)
 */
export function configForLevel(levelIndex: number): LevelConfig {
  const n = levelIndex; // 0-indexed

  let numColors: number;
  let shuffleSteps: number;

  if (n < 20) {
    numColors = 3;
    shuffleSteps = 20 + n * 2;
  } else if (n < 50) {
    const t = (n - 20) / 30;
    numColors = Math.round(3 + t);        // 3 → 4
    shuffleSteps = 60 + Math.round(t * 30);
  } else if (n < 100) {
    const t = (n - 50) / 50;
    numColors = Math.round(4 + t * 2);    // 4 → 6
    shuffleSteps = 90 + Math.round(t * 40);
  } else if (n < 300) {
    const t = (n - 100) / 200;
    numColors = Math.round(6 + t * 2);    // 6 → 8
    shuffleSteps = 130 + Math.round(t * 50);
  } else if (n < 600) {
    const t = (n - 300) / 300;
    numColors = Math.round(8 + t * 2);    // 8 → 10
    shuffleSteps = 180 + Math.round(t * 40);
  } else {
    const t = Math.min((n - 600) / 400, 1);
    numColors = Math.round(10 + t * 2);   // 10 → 12
    shuffleSteps = 220 + Math.round(t * 30);
  }

  numColors = Math.min(numColors, COLORS.length);

  return {
    numColors,
    containerCapacity: DEFAULT_CAPACITY,
    numEmpty: 2,
    shuffleSteps,
  };
}

export interface FreePourTier {
  id: number;
  name: string;
  subtitle: string;
  config: LevelConfig;
}

export const FREE_POUR_TIERS: FreePourTier[] = [
  {
    id: 1,
    name: "Puddle",
    subtitle: "Barely a challenge",
    config: { numColors: 3, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 40 },
  },
  {
    id: 2,
    name: "Juice Box",
    subtitle: "Nice and easy",
    config: { numColors: 4, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 60 },
  },
  {
    id: 3,
    name: "Smoothie",
    subtitle: "A decent blend",
    config: { numColors: 6, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 80 },
  },
  {
    id: 4,
    name: "Potion Lab",
    subtitle: "Things get serious",
    config: { numColors: 8, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 120 },
  },
  {
    id: 5,
    name: "Chaos Soup",
    subtitle: "Pure liquid doom",
    config: { numColors: 10, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 200 },
  },
];
