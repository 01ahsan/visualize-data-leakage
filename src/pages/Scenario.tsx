import { useEffect, useMemo, useState } from 'react';
import { CodePanels } from '../components/CodePanels';
import { CopyButton } from '../components/CopyButton';
import { GapChart } from '../components/GapChart';
import { ReadingTip } from '../components/ReadingTip';
import { ScoreScale } from '../components/ScoreScale';
import { Tabs } from '../components/Tabs';
import { fmtGap, NOISE_BAND } from '../format';
import { appBaseUrl, scenarioHash, type ScenarioState } from '../router';
import { scenarios } from '../scenarios';
import type { Scenario as ScenarioDef } from '../scenarios/types';
import { useSimulation } from '../sim/useSimulation';

export const DEFAULT_SEED = 42;

function readState(s: ScenarioDef, params: URLSearchParams): ScenarioState {
  const { min, max, step } = s.strength;
  const raw = Number(params.get('strength'));
  const strength =
    Number.isFinite(raw) && params.has('strength')
      ? Math.min(max, Math.max(min, Math.round((raw - min) / step) * step + min))
      : s.strength.default;
  const seedRaw = Number(params.get('seed'));
  const seed =
    params.has('seed') && Number.isInteger(seedRaw) && seedRaw >= 0 ? seedRaw : DEFAULT_SEED;
  return {
    leaky: params.get('mode') !== 'correct',
    strength: Number(strength.toFixed(6)),
    seed,
  };
}

function verdict(gap: number | null): string {
  if (gap === null) return 'Running the simulation…';
  if (Math.abs(gap) < NOISE_BAND) return 'Reported score matches new patients, within noise';
  return gap > 0
    ? 'Reported score is higher than new patients will see'
    : 'Reported score is lower than new patients will see';
}

interface ScenarioPageProps {
  scenario: ScenarioDef;
  params: URLSearchParams;
  embed: boolean;
}

export function ScenarioPage({ scenario: s, params, embed }: ScenarioPageProps) {
  const [state, setState] = useState(() => readState(s, params));
  const { leaky, strength, seed } = state;
  const sim = useSimulation(s.id, leaky, strength, seed);
  const fmt = s.strength.format ?? ((v: number) => String(v));
  const gap = sim.result ? sim.result.reportedScore - sim.result.newHospitalScore : null;

  // Keep the address bar in sync, so copying it shares the current view.
  useEffect(() => {
    window.history.replaceState(null, '', scenarioHash(s.id, { ...state, embed }));
  }, [s.id, state, embed]);

  useEffect(() => {
    document.title = embed ? s.title : `${s.title} · Data Leakage Playground`;
  }, [s.title, embed]);

  const shareUrl = `${appBaseUrl()}${scenarioHash(s.id, state)}`;
  const embedUrl = `${appBaseUrl()}${scenarioHash(s.id, { ...state, embed: true })}`;
  const embedCode = `<iframe src="${embedUrl}" title="${s.title} (Data Leakage Playground)" width="100%" height="720" style="border:0" loading="lazy"></iframe>`;
  const index = scenarios.findIndex((x) => x.id === s.id);
  const prev = scenarios[index - 1];
  const next = scenarios[index + 1];
  const strengths = useMemo(() => s.curveStrengths(), [s]);
  const update = (patch: Partial<ScenarioState>) =>
    setState((prevState) => ({ ...prevState, ...patch }));
  const gapKind = gap === null || Math.abs(gap) < NOISE_BAND ? 'ok' : gap > 0 ? 'up' : 'down';

  return (
    <article className={embed ? 'scenario embed' : 'scenario'}>
      <header className="scenario-head">
        <p className="eyebrow">
          {!embed && <a href="#/">Scenarios</a>}
          {!embed && <span aria-hidden="true"> / </span>}
          {s.number} of {scenarios.length}
        </p>
        <h1>{s.title}</h1>
        <p className="lede">{s.oneLiner}</p>
      </header>

      <section className={`stage ${leaky ? 'mode-leaky' : 'mode-correct'}`} aria-label="Simulation">
        {!embed && <ReadingTip />}
        <div className="stage-controls">
          <div className="segmented" role="radiogroup" aria-label="Workflow">
            {[true, false].map((isLeaky) => (
              <label
                key={String(isLeaky)}
                className={`seg ${isLeaky ? 'seg-leaky' : 'seg-correct'} ${isLeaky === leaky ? 'checked' : ''}`}
              >
                <input
                  type="radio"
                  name="mode"
                  checked={isLeaky === leaky}
                  onChange={() => update({ leaky: isLeaky })}
                />
                <span className="seg-dot" aria-hidden="true" />
                {isLeaky ? 'Leaky' : 'Correct'}
              </label>
            ))}
          </div>

          <div className="slider">
            <div className="slider-head">
              <label htmlFor="strength">{s.strength.label}</label>
              <output htmlFor="strength">{fmt(strength)}</output>
            </div>
            <input
              id="strength"
              type="range"
              min={s.strength.min}
              max={s.strength.max}
              step={s.strength.step}
              value={strength}
              aria-valuetext={fmt(strength)}
              style={
                {
                  '--pct': `${((strength - s.strength.min) / (s.strength.max - s.strength.min)) * 100}%`,
                } as React.CSSProperties
              }
              aria-describedby="strength-hint"
              onChange={(e) => update({ strength: Number(Number(e.target.value).toFixed(6)) })}
            />
            <span id="strength-hint" className="visually-hidden">
              {s.strength.hint}
            </span>
          </div>

          <button
            type="button"
            className="ghost-button"
            onClick={() => update({ seed: Math.floor(Math.random() * 100000) })}
            title={`Draw a new synthetic dataset (seed ${seed})`}
          >
            <span aria-hidden="true">↻</span> New data
          </button>
        </div>

        <p className="verdict" aria-live="polite">
          <span className={`gap-pill gap-${gapKind}`}>{gap === null ? '…' : fmtGap(gap)}</span>
          <span>{verdict(gap)}</span>
        </p>

        <ScoreScale
          reported={sim.result?.reportedScore ?? null}
          newHospital={sim.result?.newHospitalScore ?? null}
          leaky={leaky}
        />

        <h2 className="stage-subtitle">Gap as {s.strength.label.toLowerCase()} changes</h2>
        <GapChart
          leakyCurve={sim.leakyCurve}
          correctCurve={sim.correctCurve}
          strengths={strengths}
          strength={s.strength}
          current={strength}
          currentGap={gap}
          leaky={leaky}
        />
      </section>

      {embed ? (
        <p className="embed-link">
          <a href={shareUrl} target="_blank" rel="noopener">
            Open in Data Leakage Playground ↗
          </a>
        </p>
      ) : (
        <>
          <Tabs
            label="Details"
            tabs={[
              {
                id: 'why',
                label: 'Why it happens',
                content: (
                  <div className="why">
                    <p className="explanation">{s.explanation}</p>
                    <p className="example">
                      <strong>In practice: </strong>
                      {s.medicalExample}
                    </p>
                    <p className="setup">
                      <strong>Simulation:</strong> {s.setup} Scores are ROC AUC; seed {seed}.
                    </p>
                  </div>
                ),
              },
              {
                id: 'code',
                label: 'The code',
                content: <CodePanels wrongCode={s.wrongCode} rightCode={s.rightCode} />,
              },
              {
                id: 'share',
                label: 'Share',
                content: (
                  <div className="share">
                    <label htmlFor="share-url">Link to this exact view</label>
                    <div className="copy-field">
                      <input
                        id="share-url"
                        readOnly
                        value={shareUrl}
                        onFocus={(e) => e.target.select()}
                      />
                      <CopyButton text={shareUrl} label="Copy link" />
                    </div>
                    <label htmlFor="embed-code">Embed on a course page (compact view)</label>
                    <div className="copy-field">
                      <textarea
                        id="embed-code"
                        readOnly
                        rows={3}
                        value={embedCode}
                        onFocus={(e) => e.target.select()}
                      />
                      <CopyButton text={embedCode} label="Copy embed" />
                    </div>
                  </div>
                ),
              },
            ]}
          />

          <nav className="pager" aria-label="Other scenarios">
            {prev ? (
              <a href={scenarioHash(prev.id)} rel="prev">
                <span className="pager-dir">← Previous</span>
                {prev.title}
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a href={scenarioHash(next.id)} rel="next" className="pager-next">
                <span className="pager-dir">Next →</span>
                {next.title}
              </a>
            ) : (
              <a href="#/checklist" className="pager-next">
                <span className="pager-dir">Finally →</span>
                Printable checklist
              </a>
            )}
          </nav>
        </>
      )}
    </article>
  );
}
