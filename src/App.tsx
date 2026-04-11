import { useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { LevelJourney } from "./components/LevelJourney";
import { FreePourPicker } from "./components/FreePourPicker";
import { getHighestCompleted } from "./game/progress";

type Screen =
  | { kind: "journey" }
  | { kind: "level"; levelIndex: number }
  | { kind: "freepour-pick" }
  | { kind: "freepour"; tierId: number };

function currentLevelIndex(): number {
  return getHighestCompleted() + 1;
}

const STORAGE_KEY_SCREEN = "watersort:screen";

function loadScreen(): Screen {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCREEN);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.kind === "journey" || s.kind === "freepour-pick") return s;
      if (s.kind === "level" && typeof s.levelIndex === "number") return s;
      if (s.kind === "freepour" && typeof s.tierId === "number") return s;
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

    case "freepour-pick":
      return (
        <FreePourPicker
          onSelect={(tierId) => navigate({ kind: "freepour", tierId })}
          onBack={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
        />
      );

    case "level":
      return (
        <GameScreen
          key={`level-${screen.levelIndex}`}
          mode="level"
          levelIndex={screen.levelIndex}
          freePourTierId={null}
          onJourney={() => navigate({ kind: "journey" })}
          onFreePour={() => navigate({ kind: "freepour-pick" })}
          onNextLevel={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
        />
      );

    case "freepour":
      return (
        <GameScreen
          key={`freepour-${screen.tierId}`}
          mode="endless"
          levelIndex={0}
          freePourTierId={screen.tierId}
          onJourney={() => navigate({ kind: "journey" })}
          onFreePour={() => navigate({ kind: "freepour-pick" })}
          onNextLevel={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
        />
      );
  }
}
