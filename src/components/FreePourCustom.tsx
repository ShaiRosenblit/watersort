import { useState } from "react";
import { COLORS } from "../game/config";
import { tapLight } from "../game/haptics";

interface FreePourCustomProps {
  onPlay: (numColors: number, numBottles: number, shuffleSteps: number) => void;
  onBack: () => void;
}

const MIN_COLORS = 2;
const MAX_COLORS = COLORS.length;
const MIN_EMPTY = 1;
const MAX_EMPTY = 5;
const MIN_SHUFFLES = 20;
const MAX_SHUFFLES = 300;
const SHUFFLE_STEP = 10;

export function FreePourCustom({ onPlay, onBack }: FreePourCustomProps) {
  const [numColors, setNumColors] = useState(6);
  const [numBottles, setNumBottles] = useState(8);
  const [shuffleSteps, setShuffleSteps] = useState(80);

  const minBottles = numColors + MIN_EMPTY;
  const maxBottles = numColors + MAX_EMPTY;

  function clampBottles(colors: number, bottles: number) {
    return Math.max(colors + MIN_EMPTY, Math.min(colors + MAX_EMPTY, bottles));
  }

  function handleColorsChange(delta: number) {
    tapLight();
    setNumColors((prev) => {
      const next = Math.max(MIN_COLORS, Math.min(MAX_COLORS, prev + delta));
      setNumBottles((b) => clampBottles(next, b));
      return next;
    });
  }

  function handleBottlesChange(delta: number) {
    tapLight();
    setNumBottles((prev) => Math.max(minBottles, Math.min(maxBottles, prev + delta)));
  }

  function handleShufflesChange(delta: number) {
    tapLight();
    setShuffleSteps((prev) =>
      Math.max(MIN_SHUFFLES, Math.min(MAX_SHUFFLES, prev + delta * SHUFFLE_STEP))
    );
  }

  function handlePlay() {
    tapLight();
    onPlay(numColors, numBottles, shuffleSteps);
  }

  function handleBack() {
    tapLight();
    onBack();
  }

  const emptyBottles = numBottles - numColors;

  return (
    <div className="picker-screen">
      <header className="picker-header">
        <button className="btn btn--small" onClick={handleBack}>
          ← Back
        </button>
        <h2 className="picker-title">Custom</h2>
        <span />
      </header>

      <p className="picker-subtitle">Dial in your challenge</p>

      <div className="custom-params">
        <div className="custom-param">
          <label className="custom-param__label">Colors</label>
          <div className="custom-param__control">
            <button
              className="custom-param__btn"
              onClick={() => handleColorsChange(-1)}
              disabled={numColors <= MIN_COLORS}
            >
              −
            </button>
            <span className="custom-param__value">{numColors}</span>
            <button
              className="custom-param__btn"
              onClick={() => handleColorsChange(1)}
              disabled={numColors >= MAX_COLORS}
            >
              +
            </button>
          </div>
        </div>

        <div className="custom-param">
          <label className="custom-param__label">Bottles</label>
          <div className="custom-param__control">
            <button
              className="custom-param__btn"
              onClick={() => handleBottlesChange(-1)}
              disabled={numBottles <= minBottles}
            >
              −
            </button>
            <span className="custom-param__value">{numBottles}</span>
            <button
              className="custom-param__btn"
              onClick={() => handleBottlesChange(1)}
              disabled={numBottles >= maxBottles}
            >
              +
            </button>
          </div>
          <span className="custom-param__hint">
            {numColors} filled + {emptyBottles} empty
          </span>
        </div>

        <div className="custom-param">
          <label className="custom-param__label">Shuffles</label>
          <div className="custom-param__control">
            <button
              className="custom-param__btn"
              onClick={() => handleShufflesChange(-1)}
              disabled={shuffleSteps <= MIN_SHUFFLES}
            >
              −
            </button>
            <span className="custom-param__value">{shuffleSteps}</span>
            <button
              className="custom-param__btn"
              onClick={() => handleShufflesChange(1)}
              disabled={shuffleSteps >= MAX_SHUFFLES}
            >
              +
            </button>
          </div>
          <span className="custom-param__hint">Higher = harder</span>
        </div>
      </div>

      <div className="custom-play">
        <button className="btn btn--primary btn--large" onClick={handlePlay}>
          Play
        </button>
      </div>
    </div>
  );
}
