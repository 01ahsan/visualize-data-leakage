import { useEffect } from 'react';
import { repoUrl } from '../router';

export function About() {
  useEffect(() => {
    document.title = 'About · Data Leakage Playground';
  }, []);
  const repo = repoUrl();
  return (
    <article className="prose">
      <h1>About</h1>
      <p className="lede">
        Data Leakage Playground is a free, open-source teaching tool. It shows how common mistakes
        in machine learning workflows make a model look better than it is.
      </p>

      <h2>Credits</h2>
      <p>
        The scenarios follow the leakage taxonomy by Sayash Kapoor and Arvind Narayanan (
        <em>Leakage and the reproducibility crisis in machine-learning-based science</em>, Patterns,
        2023) and the REFORMS reporting checklist for ML-based science (Kapoor et al., Science
        Advances, 2024). Both are collected at{' '}
        <a href="https://reproducible.cs.princeton.edu/">reproducible.cs.princeton.edu</a>. This
        site is an independent project and is not affiliated with Princeton.
      </p>

      <h2>How the simulations work</h2>
      <ul>
        <li>
          All data is synthetic. No real patients or hospitals are involved, and the medical
          examples are illustrations.
        </li>
        <li>
          Data is generated in your browser with a seeded random number generator (mulberry32), so
          the same seed gives the same result on every device.
        </li>
        <li>
          Models (logistic regression and k-nearest neighbours) and metrics are written in plain
          TypeScript. Scores are ROC AUC; cross-validated scores are the mean over folds, as
          scikit-learn reports them.
        </li>
        <li>
          The <strong>new hospital</strong> score is the final model, trained on all the study data,
          applied to a fresh, independently generated dataset from the same population (for the time
          scenario, the next period). It stands in for what deployment would show.
        </li>
        <li>
          Correct mode shows small gaps too. They are sampling noise: usually within ±0.05 (the band
          the gap meter treats as noise), occasionally up to about ±0.08 for a particular seed and
          setting. Change the seed to see them move.
        </li>
        <li>
          Effects are not exaggerated. Preprocessing on all data, for example, leaks very little in
          this setting, and the page says so.
        </li>
      </ul>

      <h2>Privacy</h2>
      <p>
        The site is static. It uses no cookies, analytics, trackers or external services, and
        nothing you do leaves your browser.
      </p>

      <h2>Contribute</h2>
      <p>
        Corrections, new scenarios and translations are welcome.{' '}
        {repo ? (
          <>
            Open an issue or pull request on <a href={repo}>GitHub</a>.
          </>
        ) : (
          'Open an issue or pull request on the GitHub repository.'
        )}{' '}
        The README explains how to add a scenario: one file with the simulation, the explanation and
        the two code snippets, plus a test that checks the leak is real.
      </p>

      <h2>Licence</h2>
      <p>
        Code is released under the MIT licence. Written content (explanations, checklist) is
        released under CC BY 4.0.
      </p>
    </article>
  );
}
