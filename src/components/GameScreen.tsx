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
  const [levelIndex, setLevelIndex] = useState(0);
  const [game, setGame] = useState<GameState>(() => {
    const config = mode === "level" ? configForLevel(0) : ENDLESS_DEFAULT_CONFIG;
    return buildGameState(config);
  });
  const [invalidShake, setInvalidShake] = useState<number | null>(null);
  const shakeTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const startNewGame = useCallback(
    (lvlIdx: number) => {
      const config = mode === "level" ? configForLevel(lvlIdx) : ENDLESS_DEFAULT_CONFIG;
      setGame(buildGameState(config));
      setLevelIndex(lvlIdx);
    },
    [mode]
  );

  // Reset when mode changes
  useEffect(() => {
    startNewGame(0);
  }, [mode, startNewGame]);

  function handleSelect(index: number) {
    if (game.won) return;

    if (game.selectedContainer === null) {
      // Nothing selected yet — select if container is non-empty
      if (game.board[index].length > 0) {
        setGame((prev) => ({ ...prev, selectedContainer: index }));
      }
      return;
    }

    // Tapping the same container — deselect
    if (game.selectedContainer === index) {
      setGame((prev) => ({ ...prev, selectedContainer: null }));
      return;
    }

    // Attempt pour
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
      // Invalid move feedback
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
