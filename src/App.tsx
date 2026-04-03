import { useState } from "react";
import type { GameMode } from "./game/types";
import { MenuScreen } from "./components/MenuScreen";
import { GameScreen } from "./components/GameScreen";

const STORAGE_KEY_MODE = "watersort:mode";

function loadMode(): GameMode {
  const saved = localStorage.getItem(STORAGE_KEY_MODE);
  if (saved === "level" || saved === "endless") return saved;
  return "menu";
}

export default function App() {
  const [mode, setMode] = useState<GameMode>(loadMode);

  function handleSetMode(m: GameMode) {
    localStorage.setItem(STORAGE_KEY_MODE, m);
    setMode(m);
  }

  if (mode === "menu") {
    return <MenuScreen onSelectMode={handleSetMode} />;
  }

  return <GameScreen mode={mode} onBack={() => handleSetMode("menu")} />;
}
