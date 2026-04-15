import { useEffect, useRef, useState } from "react";
import type { BoardState, GameMode, GameState, LevelConfig, UndoSnapshot } from "../game/types";
import { checkWin, cloneBoard, executeMove, isValidMove } from "../game/logic";
import { generateLevel } from "../game/generator";
import { configForLevel, OPEN_TAP_TIERS } from "../game/config";
import { markLevelCompleted } from "../game/progress";
import { WATERSORT_STORAGE } from "../game/storage";
import { tapLight, tapMedium, tapError, tapCelebration } from "../game/haptics";
import { buildShareUrl, buildWinMessage } from "../game/sharing";
import { Board } from "./Board";

interface GameScreenProps {
  mode: GameMode;
  levelIndex: number;
  openTapTierId: number | null;
  customConfig: LevelConfig | null;
  sharedBoard?: BoardState;
  sharedId?: string;
  onJourney: () => void;
  onOpenTap: () => void;
  onNextLevel: () => void;
}

interface SavedGame {
  mode: GameMode;
  levelIndex: number;
  openTapTierId: number | null;
  sharedId?: string;
  game: GameState;
  initialBoard?: BoardState;
  undoStack?: UndoSnapshot[];
  undosUsed?: number;
}

function saveGame(
  mode: GameMode,
  levelIndex: number,
  openTapTierId: number | null,
  game: GameState,
  initialBoard: BoardState,
  undoStack: UndoSnapshot[],
  undosUsed: number,
  sharedId?: string,
) {
  localStorage.setItem(
    WATERSORT_STORAGE.game,
    JSON.stringify({ mode, levelIndex, openTapTierId, sharedId, game, initialBoard, undoStack, undosUsed })
  );
}

function parseUndoStack(raw: unknown): UndoSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const out: UndoSnapshot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || !Array.isArray((item as UndoSnapshot).board)) continue;
    const u = item as UndoSnapshot;
    out.push({
      board: cloneBoard(u.board),
      moveCount: typeof u.moveCount === "number" ? u.moveCount : 0,
      won: Boolean(u.won),
    });
  }
  return out;
}

function configsMatch(a: LevelConfig, b: LevelConfig): boolean {
  return a.numColors === b.numColors
    && a.containerCapacity === b.containerCapacity
    && a.numEmpty === b.numEmpty;
}

function loadGame(
  mode: GameMode,
  levelIndex: number,
  openTapTierId: number | null,
  customConfig?: LevelConfig | null,
  sharedId?: string,
): { game: GameState; initialBoard: BoardState; undoStack: UndoSnapshot[]; undosUsed: number } | null {
  try {
    const raw = localStorage.getItem(WATERSORT_STORAGE.game);
    if (!raw) return null;
    const data: SavedGame = JSON.parse(raw);
    if (data.mode !== mode || data.levelIndex !== levelIndex) return null;
    if (mode === "endless" && data.openTapTierId !== openTapTierId) return null;
    const savedSharedId = typeof data.sharedId === "string" ? data.sharedId : undefined;
    if (sharedId !== savedSharedId) return null;
    if (!data.game?.board || !data.game?.config) return null;
    if (customConfig && !configsMatch(customConfig, data.game.config)) return null;
    const rawUsed = typeof data.undosUsed === "number" && data.undosUsed >= 0 ? data.undosUsed : 0;
    const initialBoard = Array.isArray(data.initialBoard)
      ? cloneBoard(data.initialBoard)
      : cloneBoard(data.game.board);
    return {
      game: data.game,
      initialBoard,
      undoStack: parseUndoStack(data.undoStack),
      undosUsed: rawUsed,
    };
  } catch {
    return null;
  }
}

function clearSavedGame() {
  localStorage.removeItem(WATERSORT_STORAGE.game);
}

function getConfig(mode: GameMode, levelIndex: number, tierId: number | null, customConfig: LevelConfig | null): LevelConfig {
  if (customConfig) return customConfig;
  if (mode === "level") return configForLevel(levelIndex);
  const tier = OPEN_TAP_TIERS.find((t) => t.id === tierId) ?? OPEN_TAP_TIERS[2];
  return tier.config;
}

function buildGameState(mode: GameMode, levelIndex: number, openTapTierId: number | null, customConfig: LevelConfig | null): GameState {
  const config = getConfig(mode, levelIndex, openTapTierId, customConfig);
  const level = generateLevel(config, mode === "level" ? levelIndex : undefined);
  return {
    board: level.initial,
    selectedContainer: null,
    moveCount: 0,
    won: false,
    config: level.config,
  };
}

const SHAKE_MS = 350;
const POUR_MS = 520;

export function GameScreen({ mode, levelIndex, openTapTierId, customConfig, sharedBoard, sharedId, onJourney, onOpenTap, onNextLevel }: GameScreenProps) {
  const [game, setGame] = useState<GameState>(() => {
    const saved = loadGame(mode, levelIndex, openTapTierId, customConfig, sharedId);
    if (saved) return { ...saved.game, selectedContainer: null };
    if (sharedBoard && customConfig) {
      return { board: cloneBoard(sharedBoard), selectedContainer: null, moveCount: 0, won: false, config: customConfig };
    }
    return buildGameState(mode, levelIndex, openTapTierId, customConfig);
  });
  const [initialBoard, setInitialBoard] = useState<BoardState>(() => {
    const saved = loadGame(mode, levelIndex, openTapTierId, customConfig, sharedId);
    if (saved) return saved.initialBoard;
    if (sharedBoard) return cloneBoard(sharedBoard);
    return cloneBoard(game.board);
  });
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>(() => {
    return loadGame(mode, levelIndex, openTapTierId, customConfig, sharedId)?.undoStack ?? [];
  });
  const [undosUsed, setUndosUsed] = useState(() => {
    return loadGame(mode, levelIndex, openTapTierId, customConfig, sharedId)?.undosUsed ?? 0;
  });
  const [shakingIndex, setShakingIndex] = useState<number | null>(null);
  const [pourPair, setPourPair] = useState<{ from: number; to: number } | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pourTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const shareToastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialized = useRef(false);

  const canUndo = undoStack.length > 0 && !game.won;

  useEffect(() => {
    if (initialized.current) {
      saveGame(mode, levelIndex, openTapTierId, game, initialBoard, undoStack, undosUsed, sharedId);
    }
    initialized.current = true;
  }, [game, initialBoard, undoStack, undosUsed, levelIndex, openTapTierId, mode, sharedId]);

  function flashAnim(
    setter: (v: number | null) => void,
    timerRef: React.RefObject<ReturnType<typeof setTimeout> | undefined>,
    index: number,
    durationMs: number
  ) {
    setter(index);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setter(null), durationMs);
  }

  function flashPour(from: number, to: number) {
    setPourPair({ from, to });
    clearTimeout(pourTimer.current);
    pourTimer.current = setTimeout(() => setPourPair(null), POUR_MS);
  }

  function handleSelect(index: number) {
    if (game.won) return;

    if (game.selectedContainer === null) {
      if (game.board[index].length > 0) {
        tapLight();
        setGame((prev) => ({ ...prev, selectedContainer: index }));
      }
      return;
    }

    if (game.selectedContainer === index) {
      tapLight();
      setGame((prev) => ({ ...prev, selectedContainer: null }));
      return;
    }

    const { board, selectedContainer, config } = game;
    if (isValidMove(board, selectedContainer, index, config.containerCapacity)) {
      tapMedium();
      flashPour(selectedContainer, index);
      const snapshot: UndoSnapshot = {
        board: cloneBoard(board),
        moveCount: game.moveCount,
        won: game.won,
      };
      setUndoStack((prev) => [...prev, snapshot]);
      const nextBoard = executeMove(board, selectedContainer, index, config.containerCapacity);
      const won = checkWin(nextBoard, config.containerCapacity);
      if (won) {
        if (mode === "level") markLevelCompleted(levelIndex);
        setTimeout(tapCelebration, 250);
      }
      setGame((prev) => ({
        ...prev,
        board: nextBoard,
        selectedContainer: null,
        moveCount: prev.moveCount + 1,
        won,
      }));
    } else {
      tapError();
      flashAnim(setShakingIndex, shakeTimer, index, SHAKE_MS);
      setGame((prev) => ({ ...prev, selectedContainer: null }));
    }
  }

  function handleRestart() {
    tapLight();
    setUndoStack([]);
    setUndosUsed(0);
    if (mode === "endless") {
      setGame((prev) => ({
        ...prev,
        board: cloneBoard(initialBoard),
        selectedContainer: null,
        moveCount: 0,
        won: false,
      }));
    } else {
      setGame(buildGameState(mode, levelIndex, openTapTierId, customConfig));
    }
  }

  function handleNewGame() {
    tapLight();
    setUndoStack([]);
    setUndosUsed(0);
    const fresh = buildGameState(mode, levelIndex, openTapTierId, customConfig);
    setInitialBoard(cloneBoard(fresh.board));
    setGame(fresh);
  }

  function handleUndo() {
    if (!canUndo) {
      tapError();
      return;
    }
    tapMedium();
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const snap = prev[prev.length - 1];
      setGame((g) => ({
        ...g,
        board: cloneBoard(snap.board),
        moveCount: snap.moveCount,
        won: snap.won,
        selectedContainer: null,
      }));
      return prev.slice(0, -1);
    });
    setUndosUsed((n) => n + 1);
    setPourPair(null);
    clearTimeout(pourTimer.current);
  }

  function handleContinue() {
    tapLight();
    clearSavedGame();
    onNextLevel();
  }

  function goOpenTap() {
    tapLight();
    onOpenTap();
  }

  function goJourney() {
    tapLight();
    onJourney();
  }

  async function handleShare() {
    tapLight();
    const url = buildShareUrl(initialBoard, game.config.containerCapacity);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Water Sort Puzzle", url });
        return;
      } catch { /* user cancelled or share failed — fall through to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
      return;
    }
    setShareToast(true);
    clearTimeout(shareToastTimer.current);
    shareToastTimer.current = setTimeout(() => setShareToast(false), 2000);
  }

  async function handleShareWin() {
    tapLight();
    const url = buildShareUrl(initialBoard, game.config.containerCapacity);
    const message = buildWinMessage(url, game.moveCount);
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
        return;
      } catch { /* user cancelled or share failed — fall through to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      window.prompt("Copy this message:", message);
      return;
    }
    setShareToast(true);
    clearTimeout(shareToastTimer.current);
    shareToastTimer.current = setTimeout(() => setShareToast(false), 2000);
  }

  const tier = openTapTierId ? OPEN_TAP_TIERS.find((t) => t.id === openTapTierId) : null;
  const title = mode === "level"
    ? `Level ${levelIndex + 1}`
    : sharedId
      ? "Challenge"
      : customConfig
        ? "Craft"
        : tier?.name ?? "Open Tap";

  return (
    <div className="game-screen">
      <header className="game-header">
        <h2 className="game-title">{title}</h2>
        <span className="game-moves">Moves: {game.moveCount}</span>
      </header>

      <div className="board-wrapper">
        <Board
          board={game.board}
          capacity={game.config.containerCapacity}
          selectedIndex={game.selectedContainer}
          shakingIndex={shakingIndex}
          pourPair={pourPair}
          onSelectContainer={handleSelect}
        />
      </div>

      {game.won && (
        <div className="win-overlay">
          <div className="win-dialog">
            <h2>You Win!</h2>
            <p>Completed in {game.moveCount} moves</p>
            <div className="win-actions">
              {mode === "level" ? (
                <>
                  <button className="btn btn--primary" onClick={handleContinue}>
                    Next Level →
                  </button>
                  <button className="btn" onClick={handleShareWin}>
                    Challenge a Friend
                  </button>
                  <button className="btn" onClick={handleRestart}>
                    Replay
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn--primary" onClick={handleNewGame}>
                    New Puzzle
                  </button>
                  <button className="btn" onClick={handleShareWin}>
                    Challenge a Friend
                  </button>
                  <button className="btn" onClick={handleRestart}>
                    Replay
                  </button>
                  <button className="btn" onClick={goOpenTap}>
                    Change Difficulty
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <div className="game-footer__primary">
          <button className="btn btn--small" onClick={handleRestart}>
            Restart
          </button>
          {mode === "endless" && (
            <button className="btn btn--small" onClick={handleNewGame}>
              New
            </button>
          )}
          <button
            type="button"
            className="btn btn--small btn--subtle"
            disabled={!canUndo}
            onClick={handleUndo}
            title={
              game.won
                ? "Undo is disabled after a win"
                : "Take back your last pour"
            }
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn--small btn--subtle"
            onClick={handleShare}
            title="Share this puzzle"
          >
            Share
          </button>
          {undosUsed > 0 && (
            <span className="game-footer__undo-meta" aria-live="polite">
              {undosUsed} undo{undosUsed === 1 ? "" : "s"} used
            </span>
          )}
        </div>
        <div className="game-footer__nav">
          <button className="btn btn--small btn--subtle" onClick={goJourney}>
            Journey
          </button>
          <button className="btn btn--small btn--subtle" onClick={goOpenTap}>
            Open Tap
          </button>
        </div>
      </div>

      {shareToast && (
        <div className="share-toast" aria-live="polite">Link copied!</div>
      )}
    </div>
  );
}
