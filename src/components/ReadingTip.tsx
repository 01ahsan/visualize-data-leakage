import { useState } from 'react';

const KEY = 'dlp-reading-tip-dismissed';

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** A short, dismissible guide to the scenario page, shown until the visitor closes it. */
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
      <ol>
        <li>
          <strong>Switch</strong> between the leaky and the correct workflow.
        </li>
        <li>
          <strong>Drag</strong> the slider to make the leak stronger or weaker.
        </li>
        <li>
          <strong>Compare</strong> the coloured dot (the score the study reports) with the dark dot
          (the score on new patients). The wider the gap, the more the score misleads.
        </li>
      </ol>
      <button type="button" className="button" onClick={close}>
        Got it
      </button>
    </aside>
  );
}
