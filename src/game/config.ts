import type { LevelConfig } from "./types";

/**
 * Tube liquid colors: order is used by the generator (first N for N colors).
 * Tuned for dark UI: strong hue gaps, mixed lightness (some dark, some neon)
 * so adjacent families do not blend on screen.
 * First 12 are the "classic" set; extras unlock in Craft mode.
 */
export const COLORS = [
  "#e42138", //  1 scarlet
  "#ffd600", //  2 yellow
  "#0051d5", //  3 cobalt blue
  "#00a832", //  4 green
  "#ff7a00", //  5 pure orange
  "#6a00d4", //  6 electric purple
  "#00b8d9", //  7 turquoise
  "#b0006f", //  8 wine / dark raspberry
  "#5d4037", //  9 brown
  "#cdda00", // 10 lime yellow-green
  "#004d40", // 11 deep teal
  "#3f2373", // 12 deep indigo
  "#ff69b4", // 13 hot pink
  "#808080", // 14 gray
  "#00e676", // 15 neon green
  "#e040fb", // 16 magenta
  "#1a237e", // 17 navy
  "#ffab40", // 18 amber
  "#90caf9", // 19 sky blue
  "#a0522d", // 20 sienna
  "#76ff03", // 21 chartreuse
  "#ad1457", // 22 crimson
  "#69f0ae", // 23 mint
  "#b388ff", // 24 lavender
  "#ff6e40", // 25 deep orange
  "#455a64", // 26 blue-gray
  "#c62828", // 27 dark red
  "#00838f", // 28 dark cyan
  "#f8bbd0", // 29 blush
  "#d4e157", // 30 yellow-green
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
  "#004d40": "Deep Teal",
  "#3f2373": "Indigo",
  "#ff69b4": "Hot Pink",
  "#808080": "Gray",
  "#00e676": "Neon Green",
  "#e040fb": "Magenta",
  "#1a237e": "Navy",
  "#ffab40": "Amber",
  "#90caf9": "Sky Blue",
  "#a0522d": "Sienna",
  "#76ff03": "Chartreuse",
  "#ad1457": "Crimson",
  "#69f0ae": "Mint",
  "#b388ff": "Lavender",
  "#ff6e40": "Deep Orange",
  "#455a64": "Blue-Gray",
  "#c62828": "Dark Red",
  "#00838f": "Dark Cyan",
  "#f8bbd0": "Blush",
  "#d4e157": "Yellow-Green",
};

export const DEFAULT_CAPACITY = 4;
export const TOTAL_LEVELS = 1000;


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

export interface OpenTapTier {
  id: number;
  name: string;
  subtitle: string;
  config: LevelConfig;
}

export const OPEN_TAP_TIERS: OpenTapTier[] = [
  {
    id: 1,
    name: "Still",
    subtitle: "Calm and clear",
    config: { numColors: 3, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 40 },
  },
  {
    id: 2,
    name: "Ripple",
    subtitle: "A gentle stir",
    config: { numColors: 4, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 60 },
  },
  {
    id: 3,
    name: "Current",
    subtitle: "Steady momentum",
    config: { numColors: 6, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 80 },
  },
  {
    id: 4,
    name: "Rapids",
    subtitle: "Hold on tight",
    config: { numColors: 8, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 120 },
  },
  {
    id: 5,
    name: "Whirlpool",
    subtitle: "Pure liquid mayhem",
    config: { numColors: 10, containerCapacity: DEFAULT_CAPACITY, numEmpty: 2, shuffleSteps: 200 },
  },
];
