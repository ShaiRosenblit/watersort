import type { BoardState } from "../game/types";
import { Tube } from "./Tube";

interface BoardProps {
  board: BoardState;
  capacity: number;
  selectedIndex: number | null;
  shakingIndex: number | null;
  pouredIndex: number | null;
  onSelectContainer: (index: number) => void;
}

export function Board({ board, capacity, selectedIndex, shakingIndex, pouredIndex, onSelectContainer }: BoardProps) {
  return (
    <div className="board">
      {board.map((container, i) => (
        <Tube
          key={i}
          segments={container}
          capacity={capacity}
          selected={selectedIndex === i}
          shaking={shakingIndex === i}
          poured={pouredIndex === i}
          onClick={() => onSelectContainer(i)}
        />
      ))}
    </div>
  );
}
