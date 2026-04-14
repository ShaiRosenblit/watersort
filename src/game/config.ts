import type { GameMode, LevelConfig } from "./types";

/**
 * Tube liquid colors: order is used by the generator (first N for N colors).
 * Tuned for dark UI: strong hue gaps, mixed lightness (some dark, some neon)
 * so pink/orange/blue/cyan/purple families do not blend on screen.
 */
export const COLORS = [
  "#e42138", // scarlet
  "#ffd600", // yellow (early triad: far from red & blue)
  "#0051d5", // cobalt blue
  "#00a832", // green
  "#ff7a00", // pure orange (not red-orange)
  "#6a00d4", // electric purple
  "#00b8d9", // turquoise (brighter than teal below)
  "#b0006f", // wine / dark raspberry (not hot pink)
  "#5d4037", // brown
  "#cdda00", // lime yellow‑green
  "#004d40", // deep teal (nearly black‑green, reads vs cyan)
  "#3f2373", // deep indigo (vs cobalt & purple)
];

export const COLOR_NAMES: Record<string, string> = {
  "#e42138": "Red",
  "#ffd600": "Yellow",
  "#0051d5": "Blue",
  "#00a832": "Green",
  "#ff7a00": "Orange",
  "#6a00d4": "Purple",
  "#00b8d9": "Turquoise",
  "#b0006f": "Raspberry",
  "#5d4037": "Brown",
  "#cdda00": "Lime",
  "#004d40": "Deep teal",
  "#3f2373": "Indigo",
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
  const tier = Math.min(4, Math.floor(levelIndex / 60));
  return Math.max(4, Math.min(9, 5 + Math.floor(numColors / 3) - tier));
}

/**
 * Difficulty curve for 1000 levels — steep ramp, easy start.
 *
 *   1–10   : 3 colors   (brief warm-up)
 *   11–20  : 3→4 colors (getting started)
 *   21–40  : 4→6 colors (intermediate)
 *   41–80  : 6→8 colors (hard)
 *   81–150 : 8→10 colors (very hard)
 *   151–300: 10→12 colors (extreme)
 *   301+   : 12 colors, maxed out
 */
export function configForLevel(levelIndex: number): LevelConfig {
  const n = levelIndex; // 0-indexed

  let numColors: number;
  let shuffleSteps: number;

  if (n < 10) {
    numColors = 3;
    shuffleSteps = 20 + n * 4;
  } else if (n < 20) {
    const t = (n - 10) / 10;
    numColors = Math.round(3 + t);        // 3 → 4
    shuffleSteps = 60 + Math.round(t * 30);
  } else if (n < 40) {
    const t = (n - 20) / 20;
    numColors = Math.round(4 + t * 2);    // 4 → 6
    shuffleSteps = 90 + Math.round(t * 40);
  } else if (n < 80) {
    const t = (n - 40) / 40;
    numColors = Math.round(6 + t * 2);    // 6 → 8
    shuffleSteps = 130 + Math.round(t * 50);
  } else if (n < 150) {
    const t = (n - 80) / 70;
    numColors = Math.round(8 + t * 2);    // 8 → 10
    shuffleSteps = 180 + Math.round(t * 40);
  } else if (n < 300) {
    const t = (n - 150) / 150;
    numColors = Math.round(10 + t * 2);   // 10 → 12
    shuffleSteps = 220 + Math.round(t * 30);
  } else {
    numColors = 12;
    shuffleSteps = 250;
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
