import { useEffect, useRef } from "react";
import { getHighestCompleted } from "../game/progress";
import { TOTAL_LEVELS } from "../game/config";
import { tapLight } from "../game/haptics";

const WINDOW_BEFORE = 3;
const WINDOW_AFTER = 4;

interface LevelJourneyProps {
  onSelectLevel: (levelIndex: number) => void;
  onBack: () => void;
  onOpenTap: () => void;
}

export function LevelJourney({ onSelectLevel, onBack, onOpenTap }: LevelJourneyProps) {
  const highestCompleted = getHighestCompleted();
  const currentLevel = Math.min(highestCompleted + 1, TOTAL_LEVELS - 1);
  const currentRef = useRef<HTMLButtonElement>(null);

  const windowStart = Math.max(0, currentLevel - WINDOW_BEFORE);
  const windowEnd = Math.min(TOTAL_LEVELS - 1, currentLevel + WINDOW_AFTER);
  const visibleLevels: number[] = [];
  for (let i = windowStart; i <= windowEnd; i++) visibleLevels.push(i);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  function handleSelect(i: number) {
    tapLight();
    onSelectLevel(i);
  }

  function handleBack() {
    tapLight();
    onBack();
  }

  function handleOpenTap() {
    tapLight();
    onOpenTap();
  }

  const pct = Math.round(((highestCompleted + 1) / TOTAL_LEVELS) * 100);

  return (
    <div className="journey-screen">
      <header className="journey-header">
        <button className="btn btn--small" onClick={handleBack}>
          ← Play
        </button>
        <h2 className="journey-title">Journey</h2>
        <button className="btn btn--small" onClick={handleOpenTap}>
          Open Tap →
        </button>
      </header>

      <div className="journey-stats">
        <div className="journey-bar">
          <div className="journey-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="journey-bar__label">
          {highestCompleted + 1} / {TOTAL_LEVELS} completed
        </span>
      </div>

      <div className="journey-path">
        {windowStart > 0 && (
          <div className="journey-fade journey-fade--top">
            <span className="journey-fade__label">· · ·</span>
          </div>
        )}

        {visibleLevels.map((i) => {
          const completed = i <= highestCompleted;
          const isCurrent = i === currentLevel;
          const locked = i > currentLevel;

          let status: string;
          if (completed) status = "journey-node--done";
          else if (isCurrent) status = "journey-node--current";
          else status = "journey-node--locked";

          const side = i % 2 === 0 ? "journey-row--left" : "journey-row--right";

          return (
            <div key={i} className={`journey-row ${side}`}>
              {i < windowEnd && (
                <div className={`journey-connector ${completed ? "journey-connector--done" : ""}`} />
              )}
              <button
                ref={isCurrent ? currentRef : undefined}
                className={`journey-node ${status} ${isCurrent ? "journey-node--big" : ""}`}
                disabled={locked}
                onClick={() => handleSelect(i)}
              >
                <span className="journey-node__number">{i + 1}</span>
                {completed && <span className="journey-node__check">✓</span>}
              </button>
            </div>
          );
        })}

        {windowEnd < TOTAL_LEVELS - 1 && (
          <div className="journey-fade journey-fade--bottom">
            <span className="journey-fade__label">· · ·</span>
          </div>
        )}
      </div>
    </div>
  );
}
