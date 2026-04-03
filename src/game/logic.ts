import type { BoardState, Container } from "./types";

/** Deep-clone a board so mutations don't leak */
export function cloneBoard(board: BoardState): BoardState {
  return board.map((c) => [...c]);
}

/** Get the top color of a container, or null if empty */
export function topColor(container: Container): string | null {
  return container.length > 0 ? container[container.length - 1] : null;
}

/**
 * Count how many consecutive units of the same color sit on top.
 * e.g. ["red","blue","blue"] → 2
 */
export function topRunLength(container: Container): number {
  if (container.length === 0) return 0;
  const color = container[container.length - 1];
  let count = 0;
  for (let i = container.length - 1; i >= 0; i--) {
    if (container[i] === color) count++;
    else break;
  }
  return count;
}

/** Check whether a pour from `src` to `dst` is valid */
export function isValidMove(
  board: BoardState,
  srcIdx: number,
  dstIdx: number,
  capacity: number
): boolean {
  if (srcIdx === dstIdx) return false;
  const src = board[srcIdx];
  const dst = board[dstIdx];
  if (src.length === 0) return false;
  if (dst.length >= capacity) return false;
  if (dst.length === 0) return true;
  return topColor(src) === topColor(dst);
}

/**
 * Execute a pour move, returning a new board.
 * Transfers as many top units of the same color as possible (up to available space).
 */
export function executeMove(
  board: BoardState,
  srcIdx: number,
  dstIdx: number,
  capacity: number
): BoardState {
  const next = cloneBoard(board);
  const src = next[srcIdx];
  const dst = next[dstIdx];
  const run = topRunLength(src);
  const space = capacity - dst.length;
  const transferCount = Math.min(run, space);

  for (let i = 0; i < transferCount; i++) {
    dst.push(src.pop()!);
  }
  return next;
}

/** A container is solved if it's empty or full of a single color */
function isContainerSolved(container: Container, capacity: number): boolean {
  if (container.length === 0) return true;
  if (container.length !== capacity) return false;
  return container.every((c) => c === container[0]);
}

/** Check if the entire board is in a winning state */
export function checkWin(board: BoardState, capacity: number): boolean {
  return board.every((c) => isContainerSolved(c, capacity));
}

/** Get all valid moves for a given board state */
export function allValidMoves(
  board: BoardState,
  capacity: number
): [number, number][] {
  const moves: [number, number][] = [];
  for (let s = 0; s < board.length; s++) {
    for (let d = 0; d < board.length; d++) {
      if (isValidMove(board, s, d, capacity)) {
        moves.push([s, d]);
      }
    }
  }
  return moves;
}
