import { useEffect, useRef } from "react";
import { getHighestCompleted } from "../game/progress";
import { tapLight } from "../game/haptics";

const TOTAL_LEVELS = 50;

interface LevelJourneyProps {
  onSelectLevel: (levelIndex: number) => void;
  onBack: () => void;
}

export function LevelJourney({ onSelectLevel, onBack }: LevelJourneyProps) {
  const highestCompleted = getHighestCompleted();
  const currentLevel = highestCompleted + 1;
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  function handleSelect(i: number) {
    tapLight();
    onSelectLevel(i);
  }

  return (
    <div className="journey-screen">
      <header className="journey-header">
        <button className="btn btn--small" onClick={onBack}>
          ← Play
        </button>
        <h2 className="journey-title">Levels</h2>
        <span className="journey-progress">{currentLevel} / {TOTAL_LEVELS}</span>
      </header>

      <div className="journey-path">
        {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
          const completed = i <= highestCompleted;
          const isCurrent = i === currentLevel;
          const locked = i > currentLevel;

          let status: string;
          if (completed) status = "journey-node--done";
          else if (isCurrent) status = "journey-node--current";
          else status = "journey-node--locked";

          return (
            <div key={i} className={`journey-row ${i % 2 === 0 ? "journey-row--left" : "journey-row--right"}`}>
              {i < TOTAL_LEVELS - 1 && <div className={`journey-connector ${completed ? "journey-connector--done" : ""}`} />}
              <button
                ref={isCurrent ? currentRef : undefined}
                className={`journey-node ${status}`}
                disabled={locked}
                onClick={() => handleSelect(i)}
              >
                <span className="journey-node__number">{i + 1}</span>
                {completed && <span className="journey-node__check">✓</span>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
