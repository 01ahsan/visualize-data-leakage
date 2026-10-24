import { useEffect, useState } from 'react';
import { fmtGap } from '../format';
import { scenarioHash } from '../router';
import { previews } from '../scenarios/previews';
import { ScoreScale } from './ScoreScale';

const DEMO_ID = 'feature-selection';
const FLIP_MS = 3000;

/**
 * A self-running miniature of a scenario page: the switch flips between the
 * leaky and the correct workflow until the visitor takes over. Uses
 * precomputed scores, so nothing is simulated on the home page.
 */
export function HeroDemo() {
  const [leaky, setLeaky] = useState(true);
  const [auto, setAuto] = useState(
    () => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => setLeaky((v) => !v), FLIP_MS);
    return () => window.clearInterval(id);
  }, [auto]);

  const p = previews[DEMO_ID][leaky ? 'leaky' : 'correct'];
  const gap = p.reported - p.newHospital;
  const choose = (value: boolean) => {
    setAuto(false);
    setLeaky(value);
  };

  return (
    <figure className={`hero-demo stage ${leaky ? 'mode-leaky' : 'mode-correct'}`}>
      <figcaption className="demo-caption">
        <span className="demo-live" aria-hidden="true" />
        Live: 1,000 noise features, coin-flip labels
      </figcaption>
      <div className="segmented" role="radiogroup" aria-label="Workflow in the example">
        {[true, false].map((v) => (
          <label
            key={String(v)}
            className={`seg ${v ? 'seg-leaky' : 'seg-correct'} ${v === leaky ? 'checked' : ''}`}
          >
            <input type="radio" name="demo-mode" checked={v === leaky} onChange={() => choose(v)} />
            <span className="seg-dot" aria-hidden="true" />
            {v ? 'Leaky' : 'Correct'}
          </label>
        ))}
      </div>
      <p className="demo-verdict" aria-live={auto ? 'off' : 'polite'}>
        <span className={`gap-pill ${Math.abs(gap) < 0.05 ? 'gap-ok' : 'gap-up'}`}>
          {fmtGap(gap)}
        </span>
        {leaky ? 'Reported far above reality.' : 'Reported matches reality.'}
      </p>
      <ScoreScale reported={p.reported} newHospital={p.newHospital} leaky={leaky} />
      <a className="demo-link" href={scenarioHash(DEMO_ID)}>
        Open this leak →
      </a>
    </figure>
  );
}
