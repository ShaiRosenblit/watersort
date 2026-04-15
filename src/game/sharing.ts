import type { BoardState, LevelConfig } from "./types";
import { COLORS } from "./config";

const SHARE_VERSION = 1;

function colorToIndex(color: string): number {
  const idx = COLORS.indexOf(color);
  if (idx === -1) throw new Error(`Unknown color: ${color}`);
  return idx;
}

export function encodeBoard(board: BoardState, capacity: number): string {
  const bytes: number[] = [SHARE_VERSION, capacity, board.length];
  for (const tube of board) {
    bytes.push(tube.length);
    for (const color of tube) {
      bytes.push(colorToIndex(color));
    }
  }
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export interface DecodedPuzzle {
  board: BoardState;
  config: LevelConfig;
}

export function decodeBoard(encoded: string): DecodedPuzzle | null {
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const bytes = Array.from(binary, (c) => c.charCodeAt(0));

    if (bytes.length < 3 || bytes[0] !== SHARE_VERSION) return null;

    const capacity = bytes[1];
    const numTubes = bytes[2];

    let offset = 3;
    const board: BoardState = [];
    const colorsSeen = new Set<string>();
    let numEmpty = 0;

    for (let i = 0; i < numTubes; i++) {
      if (offset >= bytes.length) return null;
      const count = bytes[offset++];
      if (count === 0) {
        numEmpty++;
        board.push([]);
        continue;
      }
      const tube: string[] = [];
      for (let j = 0; j < count; j++) {
        if (offset >= bytes.length) return null;
        const colorIdx = bytes[offset++];
        if (colorIdx >= COLORS.length) return null;
        tube.push(COLORS[colorIdx]);
        colorsSeen.add(COLORS[colorIdx]);
      }
      board.push(tube);
    }

    return {
      board,
      config: {
        numColors: colorsSeen.size,
        containerCapacity: capacity,
        numEmpty,
        shuffleSteps: 0,
      },
    };
  } catch {
    return null;
  }
}

export function buildShareUrl(board: BoardState, capacity: number): string {
  const encoded = encodeBoard(board, capacity);
  return window.location.origin + import.meta.env.BASE_URL + encoded;
}

/**
 * Check for a shared puzzle payload. Sources (in priority order):
 * 1. Path segment after base URL — e.g. /watersort/ENCODED
 *    (works because 404.html is a copy of index.html, so the SPA loads on any path)
 * 2. URL hash #s=… — backward compatibility
 */
export function parseSharePayload(): string | null {
  const base = import.meta.env.BASE_URL;
  const path = window.location.pathname;
  if (path.startsWith(base)) {
    const segment = path.slice(base.length);
    if (segment && segment !== "index.html") {
      return segment;
    }
  }
  const hash = window.location.hash;
  if (hash.startsWith("#s=")) return hash.slice(3);
  return null;
}
