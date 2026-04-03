import { useState } from "react";
import type { GameMode } from "./game/types";
import { MenuScreen } from "./components/MenuScreen";
import { GameScreen } from "./components/GameScreen";
import { LevelJourney } from "./components/LevelJourney";

type Screen =
  | { kind: "menu" }
  | { kind: "journey" }
  | { kind: "game"; mode: GameMode; levelIndex: number };

const STORAGE_KEY_SCREEN = "watersort:screen";

function loadScreen(): Screen {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCREEN);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.kind === "journey" || s.kind === "game" || s.kind === "menu") return s;
    }
  } catch { /* ignore */ }
  return { kind: "menu" };
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
    case "menu":
      return (
        <MenuScreen
          onSelectMode={(mode) => {
            if (mode === "level") {
              navigate({ kind: "journey" });
            } else {
              navigate({ kind: "game", mode: "endless", levelIndex: 0 });
            }
          }}
        />
      );

    case "journey":
      return (
        <LevelJourney
          onSelectLevel={(idx) => navigate({ kind: "game", mode: "level", levelIndex: idx })}
          onBack={() => navigate({ kind: "menu" })}
        />
      );

    case "game":
      return (
        <GameScreen
          mode={screen.mode}
          levelIndex={screen.levelIndex}
          onBack={() => {
            if (screen.mode === "level") {
              navigate({ kind: "journey" });
            } else {
              navigate({ kind: "menu" });
            }
          }}
          onLevelComplete={() => navigate({ kind: "journey" })}
        />
      );
  }
}
