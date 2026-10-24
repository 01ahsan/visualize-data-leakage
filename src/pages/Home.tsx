import { MiniScale } from '../components/ScoreScale';
import { fmtGap, fmtScore, NOISE_BAND } from '../format';
import { scenarioHash } from '../router';
import { scenarios } from '../scenarios';
import { previews } from '../scenarios/previews';

export function Home() {
  return (
    <>
      <section className="hero">
        <h1>
          Your test score says <span className="hero-up">0.89</span>.
          <br />
          New patients say <span className="hero-real">0.50</span>.
        </h1>
        <p className="lede">
          Eight ways data leakage inflates machine learning results. Switch each leak on and off and
          watch the gap open and close, in your browser, on synthetic data.
        </p>
        <a className="cta" href={scenarioHash('feature-selection')}>
          Start with the most striking one →
        </a>
      </section>

      <ul className="card-grid" aria-label="Scenarios">
        {scenarios.map((s) => {
          const p = previews[s.id];
          return (
            <li key={s.id}>
              <a className="card" href={scenarioHash(s.id)}>
                <span className="card-top">
                  <span className="card-number">{s.number}</span>
                  {p && (
                    <span
                      className={
                        Math.abs(p.reported - p.newHospital) < NOISE_BAND
                          ? 'card-gap card-gap-ok'
                          : 'card-gap'
                      }
                      title="Leaky gap at default settings"
                    >
                      {fmtGap(p.reported - p.newHospital)}
                    </span>
                  )}
                </span>
                <span className="card-title">{s.title}</span>
                {p && (
                  <>
                    <MiniScale reported={p.reported} newHospital={p.newHospital} />
                    <span className="card-scores">
                      <span>
                        <span className="dot dot-leaky" aria-hidden="true" />
                        reported {fmtScore(p.reported)}
                      </span>
                      <span>
                        <span className="dot dot-new" aria-hidden="true" />
                        new {fmtScore(p.newHospital)}
                      </span>
                    </span>
                  </>
                )}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="home-note">
        Leaky workflow at default settings, ROC AUC. Before you trust your own score, run the{' '}
        <a href="#/checklist">eight-point checklist</a>.
      </p>
    </>
  );
}
