import { useEffect, useRef, useState } from "react";
import type { GameMode, GameState, LevelConfig } from "../game/types";
import { checkWin, executeMove, isValidMove } from "../game/logic";
import { generateLevel } from "../game/generator";
import { configForLevel, ENDLESS_DEFAULT_CONFIG } from "../game/config";
import { markLevelCompleted } from "../game/progress";
import { Board } from "./Board";

interface GameScreenProps {
  mode: GameMode;
  levelIndex: number;
  onBack: () => void;
  onLevelComplete: () => void;
}

const STORAGE_KEY_GAME = "watersort:game";

interface SavedGame {
  mode: GameMode;
  levelIndex: number;
  game: GameState;
}

function saveGame(mode: GameMode, levelIndex: number, game: GameState) {
  localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify({ mode, levelIndex, game }));
}

function loadGame(mode: GameMode, levelIndex: number): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GAME);
    if (!raw) return null;
    const data: SavedGame = JSON.parse(raw);
    if (data.mode !== mode || data.levelIndex !== levelIndex) return null;
    if (!data.game?.board || !data.game?.config) return null;
    return data.game;
  } catch {
    return null;
  }
}

function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY_GAME);
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

export function GameScreen({ mode, levelIndex, onBack, onLevelComplete }: GameScreenProps) {
  const [game, setGame] = useState<GameState>(() => {
    const saved = loadGame(mode, levelIndex);
    if (saved) return { ...saved, selectedContainer: null };
    const config = mode === "level" ? configForLevel(levelIndex) : ENDLESS_DEFAULT_CONFIG;
    return buildGameState(config);
  });
  const [invalidShake, setInvalidShake] = useState<number | null>(null);
  const shakeTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      saveGame(mode, levelIndex, game);
    }
    initialized.current = true;
  }, [game, levelIndex, mode]);

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
      if (won && mode === "level") {
        markLevelCompleted(levelIndex);
      }
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
    const config = mode === "level" ? configForLevel(levelIndex) : ENDLESS_DEFAULT_CONFIG;
    const newGame = buildGameState(config);
    setGame(newGame);
  }

  function handleBackToJourney() {
    clearSavedGame();
    onLevelComplete();
  }

  const title = mode === "level" ? `Level ${levelIndex + 1}` : "Endless Mode";
  const backLabel = mode === "level" ? "← Levels" : "← Menu";

  return (
    <div className="game-screen">
      <header className="game-header">
        <button className="btn btn--small" onClick={onBack}>
          {backLabel}
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
                <button className="btn btn--primary" onClick={handleBackToJourney}>
                  Continue →
                </button>
              )}
              <button className="btn" onClick={handleRestart}>
                {mode === "endless" ? "New Puzzle" : "Replay"}
              </button>
              {mode === "endless" && (
                <button className="btn" onClick={onBack}>
                  Menu
                </button>
              )}
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
