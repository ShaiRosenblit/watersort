import { useState } from "react";
import { decodeBoard } from "../game/sharing";
import { tapLight, tapError } from "../game/haptics";

interface PlayCodeProps {
  onPlay: (encoded: string) => void;
  onBack: () => void;
}

export function PlayCode({ onPlay, onBack }: PlayCodeProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  function handlePlay() {
    const trimmed = code.trim();
    if (!trimmed) return;
    const puzzle = decodeBoard(trimmed);
    if (puzzle) {
      tapLight();
      onPlay(trimmed);
    } else {
      tapError();
      setError(true);
    }
  }

  function handleChange(value: string) {
    setCode(value);
    if (error) setError(false);
  }

  function handleBack() {
    tapLight();
    onBack();
  }

  function handlePaste() {
    navigator.clipboard.readText().then((text) => {
      const trimmed = text.trim();
      if (trimmed) {
        setCode(trimmed);
        setError(false);
      }
    }).catch(() => {});
  }

  return (
    <div className="picker-screen">
      <header className="picker-header">
        <button className="btn btn--small" onClick={handleBack}>
          ← Back
        </button>
        <h2 className="picker-title">Play Code</h2>
        <span />
      </header>

      <p className="picker-subtitle">Paste a puzzle code from a friend</p>

      <div className="play-code">
        <div className="play-code__input-row">
          <input
            type="text"
            className={"play-code__input" + (error ? " play-code__input--error" : "")}
            placeholder="Paste puzzle code…"
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePlay()}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="btn btn--small"
            onClick={handlePaste}
            title="Paste from clipboard"
          >
            Paste
          </button>
        </div>
        {error && (
          <p className="play-code__error">Invalid code — check and try again</p>
        )}
      </div>

      <div className="custom-play">
        <button
          className="btn btn--primary btn--large"
          onClick={handlePlay}
          disabled={!code.trim()}
        >
          Play
        </button>
      </div>
    </div>
  );
}
