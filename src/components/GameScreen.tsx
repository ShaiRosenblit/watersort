import { useEffect, useRef, useState } from "react";
import type { GameMode, GameState, LevelConfig } from "../game/types";
import { checkWin, executeMove, isValidMove } from "../game/logic";
import { generateLevel } from "../game/generator";
import { configForLevel, FREE_POUR_TIERS } from "../game/config";
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
}

function saveGame(mode: GameMode, levelIndex: number, freePourTierId: number | null, game: GameState) {
  localStorage.setItem(WATERSORT_STORAGE.game, JSON.stringify({ mode, levelIndex, freePourTierId, game }));
}

function loadGame(mode: GameMode, levelIndex: number, freePourTierId: number | null): GameState | null {
  try {
    const raw = localStorage.getItem(WATERSORT_STORAGE.game);
    if (!raw) return null;
    const data: SavedGame = JSON.parse(raw);
    if (data.mode !== mode || data.levelIndex !== levelIndex) return null;
    if (mode === "endless" && data.freePourTierId !== freePourTierId) return null;
    if (!data.game?.board || !data.game?.config) return null;
    return data.game;
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
    if (saved) return { ...saved, selectedContainer: null };
    return buildGameState(mode, levelIndex, freePourTierId);
  });
  const [shakingIndex, setShakingIndex] = useState<number | null>(null);
  const [pourPair, setPourPair] = useState<{ from: number; to: number } | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pourTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      saveGame(mode, levelIndex, freePourTierId, game);
    }
    initialized.current = true;
  }, [game, levelIndex, freePourTierId, mode]);

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
    setGame(buildGameState(mode, levelIndex, freePourTierId));
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
        <button className="btn btn--small" onClick={handleRestart}>
          Restart
        </button>
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
