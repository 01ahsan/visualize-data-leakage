import { useEffect } from 'react';
import { About } from './pages/About';
import { Checklist } from './pages/Checklist';
import { Home } from './pages/Home';
import { ScenarioPage } from './pages/Scenario';
import { repoUrl, useRoute } from './router';
import { getScenario } from './scenarios';

export function App() {
  const route = useRoute();
  const scenario = route.scenarioId ? getScenario(route.scenarioId) : undefined;
  const embed = route.page === 'scenario' && route.params.get('embed') === '1';

  useEffect(() => {
    if (route.page === 'home') document.title = 'Data Leakage Playground';
    document.documentElement.classList.toggle('is-embed', embed);
  }, [route.page, embed]);

  let content;
  if (route.page === 'home') content = <Home />;
  else if (route.page === 'checklist') content = <Checklist />;
  else if (route.page === 'about') content = <About />;
  else if (route.page === 'scenario' && scenario)
    content = (
      <ScenarioPage key={scenario.id} scenario={scenario} params={route.params} embed={embed} />
    );
  else
    content = (
      <div className="prose">
        <h1>Page not found</h1>
        <p>
          <a href="#/">Go to the list of scenarios</a>
        </p>
      </div>
    );

  if (embed) return <main id="main">{content}</main>;

  const repo = repoUrl();
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#/">
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M16 3c5 7 9 11.5 9 16.5A9 9 0 0 1 7 19.5C7 14.5 11 10 16 3z"
              fill="currentColor"
            />
          </svg>
          Data Leakage Playground
        </a>
        <nav aria-label="Main">
          <a
            href="#/"
            className="nav-home"
            aria-current={route.page === 'home' ? 'page' : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 10.5 12 3l9 7.5M5.5 8.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V8.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Home
          </a>
          <a href="#/checklist" aria-current={route.page === 'checklist' ? 'page' : undefined}>
            Checklist
          </a>
          <a href="#/about" aria-current={route.page === 'about' ? 'page' : undefined}>
            About
          </a>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {content}
      </main>
      <footer className="site-footer">
        <p>All data is synthetic and generated in your browser. No cookies, no tracking.</p>
        <p>
          Code MIT, text CC BY 4.0.{' '}
          {repo && (
            <>
              <a href={repo}>Source on GitHub</a>.
            </>
          )}
        </p>
      </footer>
    </>
  );
}
