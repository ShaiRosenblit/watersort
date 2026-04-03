import { useEffect, useRef, useState } from "react";
import type { GameMode, GameState, LevelConfig } from "../game/types";
import { checkWin, executeMove, isValidMove } from "../game/logic";
import { generateLevel } from "../game/generator";
import { configForLevel, ENDLESS_DEFAULT_CONFIG } from "../game/config";
import { markLevelCompleted } from "../game/progress";
import { tapLight, tapMedium, tapError, tapCelebration } from "../game/haptics";
import { Board } from "./Board";

interface GameScreenProps {
  mode: GameMode;
  levelIndex: number;
  onJourney: () => void;
  onEndless: () => void;
  onNextLevel: () => void;
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

const ANIM_MS = 350;

export function GameScreen({ mode, levelIndex, onJourney, onEndless, onNextLevel }: GameScreenProps) {
  const [game, setGame] = useState<GameState>(() => {
    const saved = loadGame(mode, levelIndex);
    if (saved) return { ...saved, selectedContainer: null };
    const config = mode === "level" ? configForLevel(levelIndex) : ENDLESS_DEFAULT_CONFIG;
    return buildGameState(config);
  });
  const [shakingIndex, setShakingIndex] = useState<number | null>(null);
  const [pouredIndex, setPouredIndex] = useState<number | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pourTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      saveGame(mode, levelIndex, game);
    }
    initialized.current = true;
  }, [game, levelIndex, mode]);

  function flashAnim(
    setter: (v: number | null) => void,
    timerRef: React.RefObject<ReturnType<typeof setTimeout> | undefined>,
    index: number
  ) {
    setter(index);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setter(null), ANIM_MS);
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
      flashAnim(setPouredIndex, pourTimer, index);
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
      flashAnim(setShakingIndex, shakeTimer, index);
      setGame((prev) => ({ ...prev, selectedContainer: null }));
    }
  }

  function handleRestart() {
    tapLight();
    const config = mode === "level" ? configForLevel(levelIndex) : ENDLESS_DEFAULT_CONFIG;
    setGame(buildGameState(config));
  }

  function handleContinue() {
    clearSavedGame();
    onNextLevel();
  }

  const title = mode === "level" ? `Level ${levelIndex + 1}` : "Endless";

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
          pouredIndex={pouredIndex}
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
                <button className="btn btn--primary" onClick={handleContinue}>
                  Next Level →
                </button>
              )}
              <button className="btn" onClick={handleRestart}>
                {mode === "endless" ? "New Puzzle" : "Replay"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <button className="btn btn--small" onClick={handleRestart}>
          Restart
        </button>
        <div className="game-footer__nav">
          {mode === "level" ? (
            <button className="btn btn--small btn--subtle" onClick={onEndless}>
              Endless
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
