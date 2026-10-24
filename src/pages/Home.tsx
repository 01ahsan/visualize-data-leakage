import { scenarioHash } from '../router';
import { scenarios } from '../scenarios';

export function Home() {
  return (
    <>
      <section className="hero">
        <h1>Data Leakage Playground</h1>
        <p className="lede">
          Switch a leak on and off, watch the reported score inflate, then see what a new hospital
          would really get.
        </p>
        <p className="muted">
          Eight common ways that information from the test set slips into training, each simulated
          in your browser on synthetic data, with the wrong and the right scikit-learn code side by
          side.
        </p>
      </section>
      <ul className="card-grid" aria-label="Scenarios">
        {scenarios.map((s) => (
          <li key={s.id}>
            <a className="card" href={scenarioHash(s.id)}>
              <span className="card-number">Scenario {s.number}</span>
              <span className="card-title">{s.title}</span>
              <span className="card-text">{s.oneLiner}</span>
            </a>
          </li>
        ))}
      </ul>
      <section className="home-more">
        <a className="card card-wide" href="#/checklist">
          <span className="card-title">Printable checklist</span>
          <span className="card-text">
            Eight checks to run before you trust a validation score.
          </span>
        </a>
      </section>
    </>
  );
}
