import { useEffect, useMemo, useState } from 'react';
import { CodePanels } from '../components/CodePanels';
import { CopyButton } from '../components/CopyButton';
import { GapChart } from '../components/GapChart';
import { GapMeter, ScoreMeter } from '../components/Meter';
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

  // Keep the address bar in sync, so copying it shares the current view.
  useEffect(() => {
    const hash = scenarioHash(s.id, { ...state, embed });
    window.history.replaceState(null, '', hash);
  }, [s.id, state, embed]);

  useEffect(() => {
    document.title = embed ? s.title : `${s.title} · Data Leakage Playground`;
  }, [s.title, embed]);

  const shareUrl = `${appBaseUrl()}${scenarioHash(s.id, state)}`;
  const embedUrl = `${appBaseUrl()}${scenarioHash(s.id, { ...state, embed: true })}`;
  const embedCode = `<iframe src="${embedUrl}" title="${s.title} (Data Leakage Playground)" width="100%" height="1050" style="border:0" loading="lazy"></iframe>`;
  const index = scenarios.findIndex((x) => x.id === s.id);
  const prev = scenarios[index - 1];
  const next = scenarios[index + 1];
  const strengths = useMemo(() => s.curveStrengths(), [s]);
  const update = (patch: Partial<ScenarioState>) =>
    setState((prevState) => ({ ...prevState, ...patch }));

  return (
    <article className={embed ? 'scenario embed' : 'scenario'}>
      {!embed && (
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <a href="#/">All scenarios</a>
        </nav>
      )}
      <header className="scenario-head">
        <p className="eyebrow">
          Scenario {s.number} of {scenarios.length}
        </p>
        <h1>{s.title}</h1>
        <p className="lede">{s.oneLiner}</p>
        {!embed && (
          <p className="example">
            <strong>Example: </strong>
            {s.medicalExample}
          </p>
        )}
      </header>

      <section className="panel controls" aria-label="Simulation controls">
        <fieldset className="mode-toggle">
          <legend className="control-label">Workflow</legend>
          <div className="segmented">
            <label className={leaky ? 'seg seg-leaky checked' : 'seg seg-leaky'}>
              <input
                type="radio"
                name="mode"
                value="leaky"
                checked={leaky}
                onChange={() => update({ leaky: true })}
              />
              Leaky
            </label>
            <label className={!leaky ? 'seg seg-correct checked' : 'seg seg-correct'}>
              <input
                type="radio"
                name="mode"
                value="correct"
                checked={!leaky}
                onChange={() => update({ leaky: false })}
              />
              Correct
            </label>
          </div>
        </fieldset>

        <div className="slider-row">
          <label className="control-label" htmlFor="strength">
            {s.strength.label}
          </label>
          <output htmlFor="strength" className="slider-value">
            {fmt(strength)}
          </output>
          <input
            id="strength"
            type="range"
            min={s.strength.min}
            max={s.strength.max}
            step={s.strength.step}
            value={strength}
            aria-valuetext={fmt(strength)}
            aria-describedby="strength-hint"
            onChange={(e) => update({ strength: Number(Number(e.target.value).toFixed(6)) })}
          />
          <p className="muted small" id="strength-hint">
            {s.strength.hint}
          </p>
        </div>

        <div className="seed-row">
          <label className="control-label" htmlFor="seed">
            Seed
          </label>
          <input
            id="seed"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={seed}
            onChange={(e) => {
              const v = Math.floor(Number(e.target.value));
              if (Number.isFinite(v) && v >= 0) update({ seed: v });
            }}
          />
          <button
            type="button"
            className="button button-small"
            onClick={() => update({ seed: Math.floor(Math.random() * 100000) })}
          >
            New data
          </button>
          <p className="muted small">The same seed gives the same data and scores for everyone.</p>
        </div>
      </section>

      <section className="meters" aria-label="Results">
        <ScoreMeter
          label="Reported score"
          description={
            leaky
              ? 'What the leaky analysis would publish (ROC AUC).'
              : 'What the correct analysis would publish (ROC AUC).'
          }
          value={sim.result?.reportedScore ?? null}
          color={leaky ? 'var(--leaky)' : 'var(--correct)'}
          pending={sim.pending}
        />
        <ScoreMeter
          label="New hospital score"
          description="The final model on fresh data from the same population (ROC AUC)."
          value={sim.result?.newHospitalScore ?? null}
          color="var(--neutral-fill)"
          pending={sim.pending}
        />
        <GapMeter
          value={sim.result ? sim.result.reportedScore - sim.result.newHospitalScore : null}
          pending={sim.pending}
        />
      </section>
      <p className="muted small setup">
        <strong>Simulation:</strong> {s.setup} The thin mark on each bar is 0.50, chance level.
      </p>

      <section className="panel" aria-labelledby="chart-title">
        <h2 id="chart-title">Gap across {s.strength.label.toLowerCase()}</h2>
        <GapChart
          leakyCurve={sim.leakyCurve}
          correctCurve={sim.correctCurve}
          strengths={strengths}
          strength={s.strength}
          current={strength}
          leaky={leaky}
        />
      </section>

      {embed ? (
        <p className="embed-link">
          <a href={shareUrl} target="_blank" rel="noopener">
            Open the full scenario in Data Leakage Playground ↗
          </a>
        </p>
      ) : (
        <>
          <section aria-labelledby="why-title">
            <h2 id="why-title">Why this happens</h2>
            <p className="explanation">{s.explanation}</p>
          </section>

          <section aria-labelledby="code-title">
            <h2 id="code-title">The code</h2>
            <CodePanels wrongCode={s.wrongCode} rightCode={s.rightCode} />
          </section>

          <section className="panel share" aria-labelledby="share-title">
            <h2 id="share-title">Share or embed</h2>
            <div className="share-row">
              <label className="control-label" htmlFor="share-url">
                Link to this exact view
              </label>
              <div className="copy-field">
                <input
                  id="share-url"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                />
                <CopyButton text={shareUrl} label="Copy link" />
              </div>
            </div>
            <div className="share-row">
              <label className="control-label" htmlFor="embed-code">
                Embed on a course page
              </label>
              <div className="copy-field">
                <textarea
                  id="embed-code"
                  readOnly
                  rows={3}
                  value={embedCode}
                  onFocus={(e) => e.target.select()}
                />
                <CopyButton text={embedCode} label="Copy embed code" />
              </div>
              <p className="muted small">
                The embed shows a compact version: controls, scores and chart.
              </p>
            </div>
          </section>

          <nav className="pager" aria-label="Other scenarios">
            {prev ? (
              <a href={scenarioHash(prev.id)} rel="prev">
                ← {prev.number}. {prev.title}
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a href={scenarioHash(next.id)} rel="next">
                {next.number}. {next.title} →
              </a>
            ) : (
              <a href="#/checklist">Printable checklist →</a>
            )}
          </nav>
        </>
      )}
    </article>
  );
}
