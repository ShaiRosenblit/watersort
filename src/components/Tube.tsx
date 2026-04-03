import type { Container } from "../game/types";

interface TubeProps {
  segments: Container;
  capacity: number;
  selected: boolean;
  shaking: boolean;
  poured: boolean;
  onClick: () => void;
}

export function Tube({ segments, capacity, selected, shaking, poured, onClick }: TubeProps) {
  const emptySlots = capacity - segments.length;

  const classes = [
    "tube",
    selected && "tube--selected",
    shaking && "tube--shake",
    poured && "tube--poured",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} onClick={onClick} aria-label="Container">
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
