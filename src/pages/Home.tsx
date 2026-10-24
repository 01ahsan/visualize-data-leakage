import { HeroDemo } from '../components/HeroDemo';
import { MiniScale } from '../components/ScoreScale';
import { fmtGap, fmtScore, NOISE_BAND } from '../format';
import { scenarioHash } from '../router';
import { scenarios } from '../scenarios';
import { previews } from '../scenarios/previews';

const STEPS = [
  { title: 'Pick a leak', text: 'Eight common mistakes.' },
  { title: 'Flip the switch', text: 'Leaky or correct. Move the slider.' },
  { title: 'Read the gap', text: 'Reported score against new patients.' },
];

const scrollToLeaks = () => {
  const el = document.getElementById('leaks-title');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el?.focus({ preventScroll: true });
};

export function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>
            Your test score says <span className="hero-up">0.89</span>.
            <br />
            New patients say <span className="hero-real">0.50</span>.
          </h1>
          <p className="lede">
            Data leakage makes models look better than they are. See eight common leaks, switch them
            on and off, and fix them.
          </p>
          <div className="hero-actions">
            <button type="button" className="cta" onClick={scrollToLeaks}>
              See the eight leaks
            </button>
            <span className="hero-facts">Free. Runs in your browser.</span>
          </div>
        </div>
        <HeroDemo />
      </section>

      <ol className="steps" aria-label="How it works">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="step-number" aria-hidden="true">
              0{i + 1}
            </span>
            <span className="step-title">{s.title}</span>
            <span className="step-text">{s.text}</span>
          </li>
        ))}
      </ol>

      <section aria-labelledby="leaks-title" className="leaks">
        <div className="leaks-head">
          <h2 id="leaks-title" tabIndex={-1}>
            The eight leaks
          </h2>
          <p className="leaks-key">
            <span>
              <span className="dot dot-leaky" aria-hidden="true" />
              reported
            </span>
            <span>
              <span className="dot dot-new" aria-hidden="true" />
              new patients
            </span>
          </p>
        </div>
        <ul className="leak-list">
          {scenarios.map((s) => {
            const p = previews[s.id]?.leaky;
            const gap = p ? p.reported - p.newHospital : 0;
            return (
              <li key={s.id}>
                <a className="leak-row" href={scenarioHash(s.id)}>
                  <span className="leak-number">{String(s.number).padStart(2, '0')}</span>
                  <span className="leak-text">
                    <span className="leak-title">{s.title}</span>
                    <span className="leak-line">{s.oneLiner}</span>
                  </span>
                  {p && (
                    <span className="leak-viz">
                      <MiniScale reported={p.reported} newHospital={p.newHospital} />
                      <span className="leak-scores">
                        {fmtScore(p.reported)} → {fmtScore(p.newHospital)}
                      </span>
                    </span>
                  )}
                  {p && (
                    <span
                      className={Math.abs(gap) < NOISE_BAND ? 'leak-gap leak-gap-ok' : 'leak-gap'}
                    >
                      {fmtGap(gap)}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <a className="banner" href="#/checklist">
        <span className="banner-title">Check your own project</span>
        <span className="banner-text">Eight questions. One printable page.</span>
        <span className="banner-arrow" aria-hidden="true">
          →
        </span>
      </a>
    </>
  );
}
