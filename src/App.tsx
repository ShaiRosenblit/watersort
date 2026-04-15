import { useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { LevelJourney } from "./components/LevelJourney";
import { OpenTapPicker } from "./components/OpenTapPicker";
import { OpenTapCraft } from "./components/OpenTapCraft";
import { PlayCode } from "./components/PlayCode";
import { getHighestCompleted } from "./game/progress";
import { tapMedium } from "./game/haptics";
import { clearAllLocalProgress, WATERSORT_STORAGE } from "./game/storage";
import { DEFAULT_CAPACITY } from "./game/config";
import { decodeBoard } from "./game/sharing";
import type { LevelConfig } from "./game/types";

type Screen =
  | { kind: "journey" }
  | { kind: "level"; levelIndex: number }
  | { kind: "opentap-pick" }
  | { kind: "opentap"; tierId: number }
  | { kind: "opentap-craft" }
  | { kind: "opentap-craft-play"; numColors: number; numBottles: number; shuffleSteps: number }
  | { kind: "play-code" }
  | { kind: "play-code-game"; encoded: string };

function currentLevelIndex(): number {
  return getHighestCompleted() + 1;
}

function loadScreen(): Screen {
  try {
    const raw = localStorage.getItem(WATERSORT_STORAGE.screen);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.kind === "journey" || s.kind === "opentap-pick" || s.kind === "opentap-craft" || s.kind === "play-code") return s;
      if (s.kind === "level" && typeof s.levelIndex === "number") return s;
      if (s.kind === "opentap" && typeof s.tierId === "number") return s;
      if (
        s.kind === "opentap-craft-play" &&
        typeof s.numColors === "number" &&
        typeof s.numBottles === "number" &&
        typeof s.shuffleSteps === "number"
      ) return s;
      if (s.kind === "play-code-game" && typeof s.encoded === "string") return s;
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

  function customConfigFromScreen(s: Screen & { kind: "opentap-craft-play" }): LevelConfig {
    return {
      numColors: s.numColors,
      containerCapacity: DEFAULT_CAPACITY,
      numEmpty: s.numBottles - s.numColors,
      shuffleSteps: s.shuffleSteps,
    };
  }

  const codePuzzle = screen.kind === "play-code-game" ? decodeBoard(screen.encoded) : null;

  const main =
    screen.kind === "journey" ? (
      <LevelJourney
        onSelectLevel={(idx) => navigate({ kind: "level", levelIndex: idx })}
        onBack={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
        onOpenTap={() => navigate({ kind: "opentap-pick" })}
      />
    ) : screen.kind === "opentap-pick" ? (
      <OpenTapPicker
        onSelect={(tierId) => navigate({ kind: "opentap", tierId })}
        onCraft={() => navigate({ kind: "opentap-craft" })}
        onPlayCode={() => navigate({ kind: "play-code" })}
        onBack={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
        onJourney={() => navigate({ kind: "journey" })}
      />
    ) : screen.kind === "opentap-craft" ? (
      <OpenTapCraft
        onPlay={(numColors, numBottles, shuffleSteps) =>
          navigate({ kind: "opentap-craft-play", numColors, numBottles, shuffleSteps })
        }
        onBack={() => navigate({ kind: "opentap-pick" })}
      />
    ) : screen.kind === "opentap-craft-play" ? (
      <GameScreen
        key={`craft-${screen.numColors}-${screen.numBottles}-${screen.shuffleSteps}`}
        mode="endless"
        levelIndex={0}
        openTapTierId={null}
        customConfig={customConfigFromScreen(screen)}
        onJourney={() => navigate({ kind: "journey" })}
        onOpenTap={() => navigate({ kind: "opentap-pick" })}
        onNextLevel={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
      />
    ) : screen.kind === "play-code" ? (
      <PlayCode
        onPlay={(encoded) => navigate({ kind: "play-code-game", encoded })}
        onBack={() => navigate({ kind: "opentap-pick" })}
      />
    ) : screen.kind === "play-code-game" && codePuzzle ? (
      <GameScreen
        key={`code-${screen.encoded}`}
        mode="endless"
        levelIndex={0}
        openTapTierId={null}
        customConfig={codePuzzle.config}
        sharedBoard={codePuzzle.board}
        sharedId={screen.encoded}
        onJourney={() => navigate({ kind: "journey" })}
        onOpenTap={() => navigate({ kind: "opentap-pick" })}
        onNextLevel={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
      />
    ) : screen.kind === "level" ? (
      <GameScreen
        key={`level-${screen.levelIndex}`}
        mode="level"
        levelIndex={screen.levelIndex}
        openTapTierId={null}
        customConfig={null}
        onJourney={() => navigate({ kind: "journey" })}
        onOpenTap={() => navigate({ kind: "opentap-pick" })}
        onNextLevel={() => navigate({ kind: "level", levelIndex: currentLevelIndex() })}
      />
    ) : (
      <GameScreen
        key={`opentap-${(screen as { tierId: number }).tierId}`}
        mode="endless"
        levelIndex={0}
        openTapTierId={(screen as { tierId: number }).tierId}
        customConfig={null}
        onJourney={() => navigate({ kind: "journey" })}
        onOpenTap={() => navigate({ kind: "opentap-pick" })}
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
        <span className="app-build-info">
          build {new Date(__COMMIT_TIME__).toLocaleString()}
        </span>
      </footer>
    </>
  );
}
