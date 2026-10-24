import { HeroDemo } from '../components/HeroDemo';
import { MiniScale } from '../components/ScoreScale';
import { fmtGap, fmtScore, NOISE_BAND } from '../format';
import { scenarioHash } from '../router';
import { scenarios } from '../scenarios';
import { previews } from '../scenarios/previews';

const STEPS = [
  {
    title: 'Pick a mistake',
    text: 'Eight common ways test information sneaks into training, from duplicate records to tuning on the test set.',
  },
  {
    title: 'Flip the switch',
    text: 'Run the same study the leaky way and the correct way, and turn the leak up with a slider.',
  },
  {
    title: 'Watch the gap',
    text: 'Orange is the score the analysis would publish. Green is what the model really scores on new patients.',
  },
];

const scrollToScenarios = () => {
  const el = document.getElementById('scenarios-title');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el?.focus({ preventScroll: true });
};

export function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <p className="hero-kicker">An interactive guide to data leakage</p>
          <h1>See how a machine learning score can mislead, and how to stop it.</h1>
          <p className="lede">
            A leak makes a model look better in testing than it will ever be in practice. Switch
            leaks on and off and watch the reported score pull away from reality, right in your
            browser.
          </p>
          <div className="hero-actions">
            <button type="button" className="cta" onClick={scrollToScenarios}>
              Explore the 8 leaks ↓
            </button>
            <span className="hero-facts">Free · no sign-up · nothing leaves your browser</span>
          </div>
        </div>
        <HeroDemo />
      </section>

      <section className="how" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="step-number" aria-hidden="true">
                {i + 1}
              </span>
              <span className="step-title">{s.title}</span>
              <span className="step-text">{s.text}</span>
            </li>
          ))}
        </ol>
        <p className="how-note">
          Every scenario also shows the wrong and the right scikit-learn code side by side, so you
          can fix the same mistake in your own work. Made for students, reviewers and teachers; each
          demo can be embedded in a course page.
        </p>
      </section>

      <section aria-labelledby="scenarios-title" className="scenarios-section">
        <h2 id="scenarios-title" tabIndex={-1}>
          The eight leaks
        </h2>
        <p className="section-sub">
          Each card shows the leaky workflow at default settings:{' '}
          <span className="dot dot-leaky" aria-hidden="true" />
          reported score vs <span className="dot dot-new" aria-hidden="true" />
          new hospital score (ROC AUC).
        </p>
        <ul className="card-grid">
          {scenarios.map((s) => {
            const p = previews[s.id]?.leaky;
            const gap = p ? p.reported - p.newHospital : 0;
            return (
              <li key={s.id}>
                <a className="card" href={scenarioHash(s.id)}>
                  <span className="card-top">
                    <span className="card-number">{s.number}</span>
                    {p && (
                      <span
                        className={Math.abs(gap) < NOISE_BAND ? 'card-gap card-gap-ok' : 'card-gap'}
                        title="Gap between reported and new hospital score"
                      >
                        {fmtGap(gap)}
                      </span>
                    )}
                  </span>
                  <span className="card-title">{s.title}</span>
                  <span className="card-text">{s.oneLiner}</span>
                  {p && (
                    <>
                      <MiniScale reported={p.reported} newHospital={p.newHospital} />
                      <span className="card-scores">
                        <span>reported {fmtScore(p.reported)}</span>
                        <span>new {fmtScore(p.newHospital)}</span>
                      </span>
                    </>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
        <p className="home-note">
          Before you trust your own score, run the <a href="#/checklist">eight-point checklist</a>.
        </p>
      </section>
    </>
  );
}
