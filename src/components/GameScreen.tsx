import { useCallback, useEffect, useRef, useState } from "react";
import type { GameMode, GameState, LevelConfig } from "../game/types";
import { checkWin, executeMove, isValidMove } from "../game/logic";
import { generateLevel } from "../game/generator";
import { configForLevel, ENDLESS_DEFAULT_CONFIG } from "../game/config";
import { Board } from "./Board";

interface GameScreenProps {
  mode: GameMode;
  onBack: () => void;
}

const STORAGE_KEY_GAME = "watersort:game";
const STORAGE_KEY_LEVEL = "watersort:levelIndex";

interface SavedProgress {
  mode: GameMode;
  levelIndex: number;
  game: GameState;
}

function saveProgress(mode: GameMode, levelIndex: number, game: GameState) {
  const data: SavedProgress = { mode, levelIndex, game };
  localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify(data));
  localStorage.setItem(STORAGE_KEY_LEVEL, String(levelIndex));
}

function loadProgress(mode: GameMode): { levelIndex: number; game: GameState } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GAME);
    if (!raw) return null;
    const data: SavedProgress = JSON.parse(raw);
    if (data.mode !== mode) return null;
    if (!data.game?.board || !data.game?.config) return null;
    return { levelIndex: data.levelIndex, game: data.game };
  } catch {
    return null;
  }
}

function buildGameState(config: LevelConfig): GameState {
  const level = generateLevel(config);
  return {
    board: level.initial,
    selectedContainer: null,
    moveCount: 0,
    won: false,
    config: level.config,
  };
}

export function GameScreen({ mode, onBack }: GameScreenProps) {
  const [levelIndex, setLevelIndex] = useState(() => {
    const saved = loadProgress(mode);
    return saved ? saved.levelIndex : 0;
  });
  const [game, setGame] = useState<GameState>(() => {
    const saved = loadProgress(mode);
    if (saved) return { ...saved.game, selectedContainer: null };
    const config = mode === "level" ? configForLevel(0) : ENDLESS_DEFAULT_CONFIG;
    return buildGameState(config);
  });
  const [invalidShake, setInvalidShake] = useState<number | null>(null);
  const shakeTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialized = useRef(false);

  // Save progress whenever game state or level changes
  useEffect(() => {
    if (initialized.current) {
      saveProgress(mode, levelIndex, game);
    }
    initialized.current = true;
  }, [game, levelIndex, mode]);

  const startNewGame = useCallback(
    (lvlIdx: number) => {
      const config = mode === "level" ? configForLevel(lvlIdx) : ENDLESS_DEFAULT_CONFIG;
      const newGame = buildGameState(config);
      setGame(newGame);
      setLevelIndex(lvlIdx);
    },
    [mode]
  );

  function handleSelect(index: number) {
    if (game.won) return;

    if (game.selectedContainer === null) {
      if (game.board[index].length > 0) {
        setGame((prev) => ({ ...prev, selectedContainer: index }));
      }
      return;
    }

    if (game.selectedContainer === index) {
      setGame((prev) => ({ ...prev, selectedContainer: null }));
      return;
    }

    const { board, selectedContainer, config } = game;
    if (isValidMove(board, selectedContainer, index, config.containerCapacity)) {
      const nextBoard = executeMove(board, selectedContainer, index, config.containerCapacity);
      const won = checkWin(nextBoard, config.containerCapacity);
      setGame((prev) => ({
        ...prev,
        board: nextBoard,
        selectedContainer: null,
        moveCount: prev.moveCount + 1,
        won,
      }));
    } else {
      setInvalidShake(index);
      clearTimeout(shakeTimeout.current);
      shakeTimeout.current = setTimeout(() => setInvalidShake(null), 400);
      setGame((prev) => ({ ...prev, selectedContainer: null }));
    }
  }

  function handleRestart() {
    setGame((prev) => {
      const level = generateLevel(prev.config);
      return {
        board: level.initial,
        selectedContainer: null,
        moveCount: 0,
        won: false,
        config: prev.config,
      };
    });
  }

  function handleNext() {
    startNewGame(levelIndex + 1);
  }

  const title = mode === "level" ? `Level ${levelIndex + 1}` : "Endless Mode";

  return (
    <div className="game-screen">
      <header className="game-header">
        <button className="btn btn--small" onClick={onBack}>
          ← Menu
        </button>
        <h2 className="game-title">{title}</h2>
        <span className="game-moves">Moves: {game.moveCount}</span>
      </header>

      <div className={`board-wrapper ${invalidShake !== null ? "" : ""}`}>
        <Board
          board={game.board}
          capacity={game.config.containerCapacity}
          selectedIndex={game.selectedContainer}
          onSelectContainer={handleSelect}
        />
      </div>

      {game.won && (
        <div className="win-overlay">
          <div className="win-dialog">
            <h2>You Win!</h2>
            <p>Completed in {game.moveCount} moves</p>
            <div className="win-actions">
              {mode === "level" && (
                <button className="btn btn--primary" onClick={handleNext}>
                  Next Level →
                </button>
              )}
              <button className="btn" onClick={handleRestart}>
                {mode === "endless" ? "New Puzzle" : "Replay"}
              </button>
              <button className="btn" onClick={onBack}>
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-actions">
        <button className="btn" onClick={handleRestart}>
          Restart
        </button>
      </div>
    </div>
  );
}
