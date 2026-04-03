/** A single container is a stack of color units, index 0 = bottom */
export type Container = string[];

/** The full board state: an array of containers */
export type BoardState = Container[];

export interface LevelConfig {
  numColors: number;
  containerCapacity: number;
  numEmpty: number;
  shuffleSteps: number;
}

export interface Level {
  initial: BoardState;
  config: LevelConfig;
}

export type GameMode = "menu" | "level" | "endless";

export interface GameState {
  board: BoardState;
  selectedContainer: number | null;
  moveCount: number;
  won: boolean;
  config: LevelConfig;
}
