import type { Container } from "../game/types";

interface TubeProps {
  segments: Container;
  capacity: number;
  selected: boolean;
  shaking: boolean;
  pouringFrom: boolean;
  pouringTo: boolean;
  /** When pouring from this tube, tilt toward destination (null = no tilt class). */
  pourTiltRight: boolean | null;
  onClick: () => void;
}

export function Tube({
  segments,
  capacity,
  selected,
  shaking,
  pouringFrom,
  pouringTo,
  pourTiltRight,
  onClick,
}: TubeProps) {
  const emptySlots = capacity - segments.length;

  const classes = [
    "tube",
    selected && "tube--selected",
    shaking && "tube--shake",
    pouringFrom && "tube--pour-from",
    pouringFrom && pourTiltRight === true && "tube--pour-from--right",
    pouringFrom && pourTiltRight === false && "tube--pour-from--left",
    pouringTo && "tube--pour-to",
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
