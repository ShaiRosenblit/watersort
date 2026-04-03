import type { BoardState } from "../game/types";
import { Tube } from "./Tube";

interface BoardProps {
  board: BoardState;
  capacity: number;
  selectedIndex: number | null;
  onSelectContainer: (index: number) => void;
}

export function Board({ board, capacity, selectedIndex, onSelectContainer }: BoardProps) {
  return (
    <div className="board">
      {board.map((container, i) => (
        <Tube
          key={i}
          segments={container}
          capacity={capacity}
          selected={selectedIndex === i}
          onClick={() => onSelectContainer(i)}
        />
      ))}
    </div>
  );
}
