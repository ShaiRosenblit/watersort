import { useEffect, useMemo, useRef, useState } from "react";
import type { GameMode, GameState, LevelConfig, UndoSnapshot } from "../game/types";
import { checkWin, cloneBoard, executeMove, isValidMove } from "../game/logic";
import { generateLevel } from "../game/generator";
import { configForLevel, FREE_POUR_TIERS, undoBudgetForPuzzle } from "../game/config";
import { markLevelCompleted } from "../game/progress";
import { WATERSORT_STORAGE } from "../game/storage";
import { tapLight, tapMedium, tapError, tapCelebration } from "../game/haptics";
import { Board } from "./Board";

interface GameScreenProps {
  mode: GameMode;
  levelIndex: number;
  freePourTierId: number | null;
  onJourney: () => void;
  onFreePour: () => void;
  onNextLevel: () => void;
}

interface SavedGame {
  mode: GameMode;
  levelIndex: number;
  freePourTierId: number | null;
  game: GameState;
  undoStack?: UndoSnapshot[];
  undosUsed?: number;
}

function saveGame(
  mode: GameMode,
  levelIndex: number,
  freePourTierId: number | null,
  game: GameState,
  undoStack: UndoSnapshot[],
  undosUsed: number
) {
  localStorage.setItem(
    WATERSORT_STORAGE.game,
    JSON.stringify({ mode, levelIndex, freePourTierId, game, undoStack, undosUsed })
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

function loadGame(
  mode: GameMode,
  levelIndex: number,
  freePourTierId: number | null
): { game: GameState; undoStack: UndoSnapshot[]; undosUsed: number } | null {
  try {
    const raw = localStorage.getItem(WATERSORT_STORAGE.game);
    if (!raw) return null;
    const data: SavedGame = JSON.parse(raw);
    if (data.mode !== mode || data.levelIndex !== levelIndex) return null;
    if (mode === "endless" && data.freePourTierId !== freePourTierId) return null;
    if (!data.game?.board || !data.game?.config) return null;
    const rawUsed = typeof data.undosUsed === "number" && data.undosUsed >= 0 ? data.undosUsed : 0;
    const budget = undoBudgetForPuzzle(data.mode, data.levelIndex, data.game.config.numColors);
    return {
      game: data.game,
      undoStack: parseUndoStack(data.undoStack),
      undosUsed: Math.min(rawUsed, budget),
    };
  } catch {
    return null;
  }
}

function clearSavedGame() {
  localStorage.removeItem(WATERSORT_STORAGE.game);
}

function getConfig(mode: GameMode, levelIndex: number, tierId: number | null): LevelConfig {
  if (mode === "level") return configForLevel(levelIndex);
  const tier = FREE_POUR_TIERS.find((t) => t.id === tierId) ?? FREE_POUR_TIERS[2];
  return tier.config;
}

function buildGameState(mode: GameMode, levelIndex: number, freePourTierId: number | null): GameState {
  const config = getConfig(mode, levelIndex, freePourTierId);
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

export function GameScreen({ mode, levelIndex, freePourTierId, onJourney, onFreePour, onNextLevel }: GameScreenProps) {
  const [game, setGame] = useState<GameState>(() => {
    const saved = loadGame(mode, levelIndex, freePourTierId);
    if (saved) return { ...saved.game, selectedContainer: null };
    return buildGameState(mode, levelIndex, freePourTierId);
  });
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>(() => {
    return loadGame(mode, levelIndex, freePourTierId)?.undoStack ?? [];
  });
  const [undosUsed, setUndosUsed] = useState(() => {
    return loadGame(mode, levelIndex, freePourTierId)?.undosUsed ?? 0;
  });
  const [shakingIndex, setShakingIndex] = useState<number | null>(null);
  const [pourPair, setPourPair] = useState<{ from: number; to: number } | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pourTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialized = useRef(false);

  const undoBudget = useMemo(
    () => undoBudgetForPuzzle(mode, levelIndex, game.config.numColors),
    [mode, levelIndex, game.config.numColors]
  );

  const undosLeft = undoBudget - undosUsed;
  const canUndo = undoStack.length > 0 && undosLeft > 0 && !game.won;

  useEffect(() => {
    if (initialized.current) {
      saveGame(mode, levelIndex, freePourTierId, game, undoStack, undosUsed);
    }
    initialized.current = true;
  }, [game, undoStack, undosUsed, levelIndex, freePourTierId, mode]);

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
    setGame(buildGameState(mode, levelIndex, freePourTierId));
  }

  function handleUndo() {
    if (!canUndo) {
      tapError();
      return;
    }
    tapLight();
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
    clearSavedGame();
    onNextLevel();
  }

  const tier = freePourTierId ? FREE_POUR_TIERS.find((t) => t.id === freePourTierId) : null;
  const title = mode === "level" ? `Level ${levelIndex + 1}` : tier?.name ?? "Free Pour";

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
                <button className="btn btn--primary" onClick={handleContinue}>
                  Next Level →
                </button>
              ) : (
                <button className="btn btn--primary" onClick={handleRestart}>
                  Another Round
                </button>
              )}
              {mode === "endless" && (
                <button className="btn" onClick={onFreePour}>
                  Change Difficulty
                </button>
              )}
              {mode === "level" && (
                <button className="btn" onClick={handleRestart}>
                  Replay
                </button>
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
          <button
            type="button"
            className="btn btn--small btn--subtle"
            disabled={!canUndo}
            onClick={handleUndo}
            title={
              game.won
                ? "Undo is disabled after a win"
                : undosLeft <= 0
                  ? "No undo credits left"
                  : "Take back your last pour"
            }
          >
            Undo
          </button>
          <span className="game-footer__undo-meta" aria-live="polite">
            {undosUsed > 0 ? `${undosUsed} undo${undosUsed === 1 ? "" : "s"} used` : "No undos yet"}
            <span className="game-footer__undo-meta-sep"> · </span>
            {undosLeft > 0 ? `${undosLeft} left` : "0 left"}
          </span>
        </div>
        <div className="game-footer__nav">
          {mode === "level" ? (
            <button className="btn btn--small btn--subtle" onClick={onFreePour}>
              Free Pour
            </button>
          ) : (
            <button className="btn btn--small btn--subtle" onClick={onNextLevel}>
              Levels
            </button>
          )}
          <button className="btn btn--small btn--subtle" onClick={onJourney}>
            Journey
          </button>
        </div>
      </div>
    </div>
  );
}
