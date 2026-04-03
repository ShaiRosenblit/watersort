import { useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { LevelJourney } from "./components/LevelJourney";
import { getHighestCompleted } from "./game/progress";

type Screen =
  | { kind: "journey" }
  | { kind: "level"; levelIndex: number }
  | { kind: "endless" };

function currentLevelIndex(): number {
  return getHighestCompleted() + 1;
}

const STORAGE_KEY_SCREEN = "watersort:screen";

function loadScreen(): Screen {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCREEN);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.kind === "journey" || s.kind === "endless") return s;
      if (s.kind === "level" && typeof s.levelIndex === "number") return s;
    }
  } catch { /* ignore */ }
  return { kind: "level", levelIndex: currentLevelIndex() };
}

function saveScreen(screen: Screen) {
  localStorage.setItem(STORAGE_KEY_SCREEN, JSON.stringify(screen));
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(loadScreen);

  function navigate(s: Screen) {
    saveScreen(s);
    setScreen(s);
  }

  switch (screen.kind) {
    case "journey":
      return (
        <LevelJourney
          onSelectLevel={(idx) => navigate({ kind: "level", levelIndex: idx })}
          onBack={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
        />
      );

    case "level":
      return (
        <GameScreen
          mode="level"
          levelIndex={screen.levelIndex}
          onJourney={() => navigate({ kind: "journey" })}
          onEndless={() => navigate({ kind: "endless" })}
          onNextLevel={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
        />
      );

    case "endless":
      return (
        <GameScreen
          mode="endless"
          levelIndex={0}
          onJourney={() => navigate({ kind: "journey" })}
          onEndless={() => {}}
          onNextLevel={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
        />
      );
  }
}
