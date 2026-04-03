import { FREE_POUR_TIERS } from "../game/config";
import { tapLight } from "../game/haptics";

interface FreePourPickerProps {
  onSelect: (tierId: number) => void;
  onBack: () => void;
}

export function FreePourPicker({ onSelect, onBack }: FreePourPickerProps) {
  function handlePick(id: number) {
    tapLight();
    onSelect(id);
  }

  return (
    <div className="picker-screen">
      <header className="picker-header">
        <button className="btn btn--small" onClick={onBack}>
          ← Play
        </button>
        <h2 className="picker-title">Free Pour</h2>
        <span />
      </header>

      <p className="picker-subtitle">Pick your poison</p>

      <div className="picker-list">
        {FREE_POUR_TIERS.map((tier) => (
          <button
            key={tier.id}
            className="picker-card"
            onClick={() => handlePick(tier.id)}
          >
            <span className="picker-card__rank">{tier.id}</span>
            <div className="picker-card__text">
              <span className="picker-card__name">{tier.name}</span>
              <span className="picker-card__sub">{tier.subtitle}</span>
            </div>
            <span className="picker-card__colors">{tier.config.numColors} colors</span>
          </button>
        ))}
      </div>
    </div>
  );
}
