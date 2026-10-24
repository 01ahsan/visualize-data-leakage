import { useState } from 'react';

const KEY = 'dlp-reading-tip-dismissed';

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** A one-line guide to the scenario page, shown until the visitor closes it. */
export function ReadingTip() {
  const [dismissed, setDismissed] = useState(readDismissed);
  if (dismissed) return null;
  const close = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      // Storage may be unavailable (private mode); the tip just shows again next time.
    }
  };
  return (
    <aside className="reading-tip" aria-label="How to read this page">
      <p>
        Flip the switch, move the slider. <span className="dot dot-leaky" aria-hidden="true" />
        Reported vs <span className="dot dot-new" aria-hidden="true" />
        real.
      </p>
      <button type="button" className="tip-close" onClick={close} aria-label="Hide tip">
        ×
      </button>
    </aside>
  );
}
