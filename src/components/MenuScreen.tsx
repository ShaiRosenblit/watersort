import type { GameMode } from "../game/types";

interface MenuScreenProps {
  onSelectMode: (mode: GameMode) => void;
}

export function MenuScreen({ onSelectMode }: MenuScreenProps) {
  return (
    <div className="menu-screen">
      <h1 className="menu-title">Water Sort</h1>
      <p className="menu-subtitle">Sort the colors!</p>
      <div className="menu-buttons">
        <button className="btn btn--primary btn--large" onClick={() => onSelectMode("level")}>
          Level Mode
        </button>
        <button className="btn btn--large" onClick={() => onSelectMode("endless")}>
          Endless Mode
        </button>
      </div>
    </div>
  );
}
