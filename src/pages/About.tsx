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
      <p className="lede">A free tool for teaching data leakage in machine learning.</p>

      <h2>How it works</h2>
      <ul>
        <li>All data is synthetic, made in your browser from a seed. Same seed, same numbers.</li>
        <li>
          Models are logistic regression and k-nearest neighbours, written in TypeScript. Scores are
          ROC AUC.
        </li>
        <li>
          “New hospital” is a fresh dataset from the same population. For the time leak, it is the
          next period.
        </li>
        <li>
          Correct mode still shows small gaps. That is noise: usually within ±0.05, sometimes up to
          ±0.08.
        </li>
      </ul>

      <h2>Credits</h2>
      <p>
        The scenarios follow the leakage taxonomy by Kapoor and Narayanan (Patterns, 2023) and the
        REFORMS checklist (Science Advances, 2024), both at{' '}
        <a href="https://reproducible.cs.princeton.edu/">reproducible.cs.princeton.edu</a>. Not
        affiliated with Princeton.
      </p>

      <h2>Privacy</h2>
      <p>No cookies, no tracking, no server.</p>

      <h2>Contribute</h2>
      <p>
        Issues and pull requests are welcome
        {repo ? (
          <>
            {' '}
            on <a href={repo}>GitHub</a>
          </>
        ) : null}
        .
      </p>

      <h2>Licence</h2>
      <p>Code: MIT. Text: CC BY 4.0.</p>
    </article>
  );
}
