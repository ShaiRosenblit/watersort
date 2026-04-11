import type { BoardState, Level, LevelConfig } from "./types";
import { COLORS } from "./config";
import { allValidMoves, checkWin, cloneBoard, executeMove } from "./logic";

/** Mulberry32 PRNG — returns floats in [0, 1), deterministic for a given seed. */
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Map journey level index to a 32-bit RNG seed. */
function journeySeed(levelIndex: number): number {
  return Math.imul(levelIndex, 2654435761) ^ 0x9e3779b9;
}

/** Fisher-Yates shuffle (in place) using `random` (default: Math.random). */
function shuffle<T>(arr: T[], random: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Create a random board by distributing color units randomly across containers.
 * Each color gets exactly `capacity` units, shuffled into the filled containers.
 */
function randomBoard(config: LevelConfig, random: () => number = Math.random): BoardState {
  const { numColors, containerCapacity, numEmpty } = config;

  const pool: string[] = [];
  for (let i = 0; i < numColors; i++) {
    for (let j = 0; j < containerCapacity; j++) {
      pool.push(COLORS[i]);
    }
  }
  shuffle(pool, random);

  const board: BoardState = [];
  for (let i = 0; i < numColors; i++) {
    board.push(pool.slice(i * containerCapacity, (i + 1) * containerCapacity));
  }
  for (let i = 0; i < numEmpty; i++) {
    board.push([]);
  }
  return board;
}

/**
 * Encode a board state as a string for visited-set dedup during BFS.
 * Sorts containers so equivalent arrangements share the same key.
 */
function boardKey(board: BoardState): string {
  return board
    .map((c) => c.join(","))
    .sort()
    .join("|");
}

/**
 * BFS solver — returns true if the board is solvable within a search budget.
 * Uses a generous but bounded search to avoid hanging on huge state spaces.
 */
function isSolvable(board: BoardState, capacity: number): boolean {
  const maxVisited = 50_000;
  const visited = new Set<string>();
  const queue: BoardState[] = [board];
  visited.add(boardKey(board));

  while (queue.length > 0 && visited.size < maxVisited) {
    const current = queue.shift()!;
    if (checkWin(current, capacity)) return true;

    for (const [s, d] of allValidMoves(current, capacity)) {
      const next = executeMove(current, s, d, capacity);
      const key = boardKey(next);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }
  return false;
}

/**
 * Generate a level: random distribution + solvability verification.
 * Retries with new random layouts until a solvable one is found.
 *
 * When `journeyLevelIndex` is set (journey mode), RNG is deterministic so that
 * level always produces the same initial board (restart / reload match).
 */
export function generateLevel(config: LevelConfig, journeyLevelIndex?: number): Level {
  const seed = journeyLevelIndex === undefined ? undefined : journeySeed(journeyLevelIndex);

  for (let attempt = 0; attempt < 100; attempt++) {
    const random =
      seed === undefined ? Math.random : mulberry32((seed ^ Math.imul(attempt, 0x85ebca6b)) >>> 0);

    const board = randomBoard(config, random);

    if (checkWin(board, config.containerCapacity)) continue;

    if (isSolvable(board, config.containerCapacity)) {
      return { initial: cloneBoard(board), config };
    }
  }

  // Fallback: should be extremely rare with 2 empty containers
  const random =
    seed === undefined ? Math.random : mulberry32((seed ^ 0xdeadbeef) >>> 0);
  return { initial: randomBoard(config, random), config };
}
