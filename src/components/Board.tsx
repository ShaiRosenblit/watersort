import type { BoardState } from "../game/types";
import { Tube } from "./Tube";

interface BoardProps {
  board: BoardState;
  capacity: number;
  selectedIndex: number | null;
  shakingIndex: number | null;
  pourPair: { from: number; to: number } | null;
  onSelectContainer: (index: number) => void;
}

export function Board({ board, capacity, selectedIndex, shakingIndex, pourPair, onSelectContainer }: BoardProps) {
  return (
    <div className="board">
      {board.map((container, i) => {
        const pouringFrom = pourPair?.from === i;
        const pouringTo = pourPair?.to === i;
        const pourTiltRight =
          pouringFrom && pourPair !== null ? pourPair.to > pourPair.from : null;

        return (
          <Tube
            key={i}
            segments={container}
            capacity={capacity}
            selected={selectedIndex === i}
            shaking={shakingIndex === i}
            pouringFrom={pouringFrom}
            pouringTo={pouringTo}
            pourTiltRight={pourTiltRight}
            onClick={() => onSelectContainer(i)}
          />
        );
      })}
    </div>
  );
}
