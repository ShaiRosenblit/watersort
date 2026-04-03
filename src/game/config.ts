import type { LevelConfig } from "./types";

export const COLORS = [
  "#e74c3c", // red
  "#3498db", // blue
  "#2ecc71", // green
  "#f39c12", // orange
  "#9b59b6", // purple
  "#1abc9c", // teal
  "#e67e22", // dark orange
  "#e84393", // pink
  "#00cec9", // cyan
  "#fdcb6e", // yellow
  "#6c5ce7", // indigo
  "#a29bfe", // lavender
];

export const COLOR_NAMES: Record<string, string> = {
  "#e74c3c": "Red",
  "#3498db": "Blue",
  "#2ecc71": "Green",
  "#f39c12": "Orange",
  "#9b59b6": "Purple",
  "#1abc9c": "Teal",
  "#e67e22": "Dark Orange",
  "#e84393": "Pink",
  "#00cec9": "Cyan",
  "#fdcb6e": "Yellow",
  "#6c5ce7": "Indigo",
  "#a29bfe": "Lavender",
};

export const DEFAULT_CAPACITY = 4;

/**
 * Generate a LevelConfig for a given difficulty tier (0-indexed).
 * Gradually increases colors and shuffle steps.
 */
export function configForLevel(levelIndex: number): LevelConfig {
  const baseColors = 3;
  const extraColors = Math.min(Math.floor(levelIndex / 3), COLORS.length - baseColors);
  const numColors = baseColors + extraColors;
  const shuffleSteps = 30 + levelIndex * 10;

  return {
    numColors,
    containerCapacity: DEFAULT_CAPACITY,
    numEmpty: 2,
    shuffleSteps,
  };
}

export const ENDLESS_DEFAULT_CONFIG: LevelConfig = {
  numColors: 5,
  containerCapacity: DEFAULT_CAPACITY,
  numEmpty: 2,
  shuffleSteps: 80,
};
