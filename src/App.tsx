import { useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { LevelJourney } from "./components/LevelJourney";
import { FreePourPicker } from "./components/FreePourPicker";
import { getHighestCompleted } from "./game/progress";
import { tapMedium } from "./game/haptics";
import { clearAllLocalProgress, WATERSORT_STORAGE } from "./game/storage";

type Screen =
  | { kind: "journey" }
  | { kind: "level"; levelIndex: number }
  | { kind: "freepour-pick" }
  | { kind: "freepour"; tierId: number };

function currentLevelIndex(): number {
  return getHighestCompleted() + 1;
}

function loadScreen(): Screen {
  try {
    const raw = localStorage.getItem(WATERSORT_STORAGE.screen);
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
  localStorage.setItem(WATERSORT_STORAGE.screen, JSON.stringify(screen));
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(loadScreen);

  function navigate(s: Screen) {
    saveScreen(s);
    setScreen(s);
  }

  function handleClearLocalData() {
    if (
      !window.confirm(
        "Erase all saved progress on this device and start from level 1? This cannot be undone."
      )
    ) {
      return;
    }
    tapMedium();
    clearAllLocalProgress();
    navigate({ kind: "level", levelIndex: 0 });
  }

  const main =
    screen.kind === "journey" ? (
      <LevelJourney
        onSelectLevel={(idx) => navigate({ kind: "level", levelIndex: idx })}
        onBack={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
      />
    ) : screen.kind === "freepour-pick" ? (
      <FreePourPicker
        onSelect={(tierId) => navigate({ kind: "freepour", tierId })}
        onBack={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
      />
    ) : screen.kind === "level" ? (
      <GameScreen
        key={`level-${screen.levelIndex}`}
        mode="level"
        levelIndex={screen.levelIndex}
        freePourTierId={null}
        onJourney={() => navigate({ kind: "journey" })}
        onFreePour={() => navigate({ kind: "freepour-pick" })}
        onNextLevel={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
      />
    ) : (
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

  return (
    <>
      <div className="app-main">{main}</div>
      <footer className="app-data-reset">
        <button
          type="button"
          className="app-data-reset__trigger"
          onClick={handleClearLocalData}
          aria-label="Erase all saved progress on this device and start from level 1"
        >
          Local data…
        </button>
      </footer>
    </>
  );
}
