import { OPEN_TAP_TIERS } from "../game/config";
import { tapLight } from "../game/haptics";

interface OpenTapPickerProps {
  onSelect: (tierId: number) => void;
  onCraft: () => void;
  onBack: () => void;
  onJourney: () => void;
}

export function OpenTapPicker({ onSelect, onCraft, onBack, onJourney }: OpenTapPickerProps) {
  function handlePick(id: number) {
    tapLight();
    onSelect(id);
  }

  function handleCraft() {
    tapLight();
    onCraft();
  }

  function handleBack() {
    tapLight();
    onBack();
  }

  function handleJourney() {
    tapLight();
    onJourney();
  }

  return (
    <div className="picker-screen">
      <header className="picker-header">
        <button className="btn btn--small" onClick={handleBack}>
          ← Play
        </button>
        <h2 className="picker-title">Open Tap</h2>
        <button className="btn btn--small" onClick={handleJourney}>
          ← Journey
        </button>
      </header>

      <p className="picker-subtitle">Pick your pour</p>

      <div className="picker-list">
        {OPEN_TAP_TIERS.map((tier) => (
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
        <button className="picker-card picker-card--custom" onClick={handleCraft}>
          <span className="picker-card__rank picker-card__rank--custom">✦</span>
          <div className="picker-card__text">
            <span className="picker-card__name">Craft</span>
            <span className="picker-card__sub">Mix your own recipe</span>
          </div>
        </button>
      </div>
    </div>
  );
}
