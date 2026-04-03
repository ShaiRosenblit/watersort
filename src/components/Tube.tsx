import type { Container } from "../game/types";

interface TubeProps {
  segments: Container;
  capacity: number;
  selected: boolean;
  onClick: () => void;
}

export function Tube({ segments, capacity, selected, onClick }: TubeProps) {
  const emptySlots = capacity - segments.length;

  return (
    <button
      className={`tube ${selected ? "tube--selected" : ""}`}
      onClick={onClick}
      aria-label="Container"
    >
      <div className="tube__inner">
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className="tube__segment tube__segment--empty" />
        ))}
        {[...segments].reverse().map((color, i) => (
          <div
            key={`seg-${i}`}
            className="tube__segment"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </button>
  );
}
