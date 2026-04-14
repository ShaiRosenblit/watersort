import { useCallback, useEffect, useRef, useState } from "react";
import { getHighestCompleted, isGodMode, toggleGodMode } from "../game/progress";
import { TOTAL_LEVELS } from "../game/config";
import { tapLight } from "../game/haptics";

const WINDOW_BEFORE = 3;
const WINDOW_AFTER = 4;
const GOD_TAP_COUNT = 5;
const GOD_TAP_WINDOW_MS = 1200;

interface LevelJourneyProps {
  onSelectLevel: (levelIndex: number) => void;
  onBack: () => void;
  onOpenTap: () => void;
}

export function LevelJourney({ onSelectLevel, onBack, onOpenTap }: LevelJourneyProps) {
  const highestCompleted = getHighestCompleted();
  const currentLevel = Math.min(highestCompleted + 1, TOTAL_LEVELS - 1);
  const currentRef = useRef<HTMLButtonElement>(null);

  const [godActive, setGodActive] = useState(isGodMode);
  const tapTimestamps = useRef<number[]>([]);

  const windowStart = godActive
    ? 0
    : Math.max(0, currentLevel - WINDOW_BEFORE);
  const windowEnd = godActive
    ? TOTAL_LEVELS - 1
    : Math.min(TOTAL_LEVELS - 1, currentLevel + WINDOW_AFTER);
  const visibleLevels: number[] = [];
  for (let i = windowStart; i <= windowEnd; i++) visibleLevels.push(i);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleSecretTap = useCallback(() => {
    const now = Date.now();
    tapTimestamps.current.push(now);
    tapTimestamps.current = tapTimestamps.current.filter(
      (t) => now - t < GOD_TAP_WINDOW_MS
    );
    if (tapTimestamps.current.length >= GOD_TAP_COUNT) {
      tapTimestamps.current = [];
      const next = toggleGodMode();
      setGodActive(next);
    }
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
        <span
          className="journey-bar__label"
          onClick={handleSecretTap}
        >
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
          const locked = !godActive && i > currentLevel;

          let status: string;
          if (completed) status = "journey-node--done";
          else if (isCurrent && !godActive) status = "journey-node--current";
          else if (locked) status = "journey-node--locked";
          else status = godActive ? "journey-node--god" : "journey-node--current";

          const side = i % 2 === 0 ? "journey-row--left" : "journey-row--right";

          return (
            <div key={i} className={`journey-row ${side}`}>
              {i < windowEnd && (
                <div className={`journey-connector ${completed || godActive ? "journey-connector--done" : ""}`} />
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
