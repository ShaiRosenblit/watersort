import { useState } from "react";
import type { GameMode } from "./game/types";
import { MenuScreen } from "./components/MenuScreen";
import { GameScreen } from "./components/GameScreen";

export default function App() {
  const [mode, setMode] = useState<GameMode>("menu");

  if (mode === "menu") {
    return <MenuScreen onSelectMode={setMode} />;
  }

  return <GameScreen mode={mode} onBack={() => setMode("menu")} />;
}
