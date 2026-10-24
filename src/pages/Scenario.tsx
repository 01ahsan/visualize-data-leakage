import { useEffect, useMemo, useState } from 'react';
import { CodePanels } from '../components/CodePanels';
import { CopyButton } from '../components/CopyButton';
import { GapChart } from '../components/GapChart';
import { ReadingTip } from '../components/ReadingTip';
import { ScoreScale } from '../components/ScoreScale';
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
  if (gap === null) return 'Running…';
  if (Math.abs(gap) < NOISE_BAND) return 'Within noise. The score holds up.';
  return gap > 0 ? 'Too high. New patients get less.' : 'Too low. New patients get more.';
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
  const embedCode = `<iframe src="${embedUrl}" title="${s.title} (Data Leakage Playground)" width="100%" height="760" style="border:0" loading="lazy"></iframe>`;
  const index = scenarios.findIndex((x) => x.id === s.id);
  const prev = scenarios[index - 1];
  const next = scenarios[index + 1];
  const strengths = useMemo(() => s.curveStrengths(), [s]);
  const update = (patch: Partial<ScenarioState>) =>
    setState((prevState) => ({ ...prevState, ...patch }));
  const gapKind = gap === null || Math.abs(gap) < NOISE_BAND ? 'ok' : gap > 0 ? 'up' : 'down';
  const pct = ((strength - s.strength.min) / (s.strength.max - s.strength.min)) * 100;

  return (
    <article
      className={`scenario ${embed ? 'embed' : ''} ${leaky ? 'mode-leaky' : 'mode-correct'}`}
    >
      <div className="scenario-head">
        <p className="eyebrow">
          {!embed && <a href="#/">All leaks</a>}
          {!embed && <span aria-hidden="true"> / </span>}
          {String(s.number).padStart(2, '0')}
        </p>
        <h1>{s.title}</h1>
        <p className="lede">{s.oneLiner}</p>

        {!embed && <ReadingTip />}

        <div className="controls" aria-label="Simulation controls" role="group">
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
              aria-describedby="strength-hint"
              style={{ '--pct': `${pct}%` } as React.CSSProperties}
              onChange={(e) => update({ strength: Number(Number(e.target.value).toFixed(6)) })}
            />
            <p id="strength-hint" className="hint">
              {s.strength.hint}
            </p>
          </div>
        </div>

        <p className="verdict" aria-live="polite">
          <span className={`gap-pill gap-${gapKind}`}>{gap === null ? '…' : fmtGap(gap)}</span>
          <span>{verdict(gap)}</span>
        </p>
      </div>

      <section className="viz-card" aria-label="Results">
        <div className="viz-top">
          <span className="viz-label">Score, ROC AUC</span>
          <button
            type="button"
            className="ghost-button"
            onClick={() => update({ seed: Math.floor(Math.random() * 100000) })}
            title={`Seed ${seed}`}
          >
            <span aria-hidden="true">↻</span> New data
          </button>
        </div>
        <ScoreScale
          reported={sim.result?.reportedScore ?? null}
          newHospital={sim.result?.newHospitalScore ?? null}
          leaky={leaky}
        />
        <h2 className="viz-label viz-label-chart">Gap across the slider</h2>
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
          <div className="scenario-notes">
            <h2>Why</h2>
            <p className="explanation">{s.explanation}</p>
            <p className="example">
              <span className="tag">Example</span> {s.medicalExample}
            </p>
            <p className="setup">
              <span className="tag">Setup</span> {s.setup} Seed {seed}.
            </p>
            <div className="share-buttons">
              <CopyButton text={shareUrl} label="Copy link" />
              <CopyButton text={embedCode} label="Copy embed code" />
            </div>
          </div>

          <section className="code-section" aria-labelledby="code-title">
            <h2 id="code-title">The code</h2>
            <CodePanels wrongCode={s.wrongCode} rightCode={s.rightCode} />
          </section>

          <nav className="pager" aria-label="Other leaks">
            {prev ? (
              <a href={scenarioHash(prev.id)} rel="prev">
                <span className="pager-dir">← {String(prev.number).padStart(2, '0')}</span>
                {prev.title}
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a href={scenarioHash(next.id)} rel="next" className="pager-next">
                <span className="pager-dir">{String(next.number).padStart(2, '0')} →</span>
                {next.title}
              </a>
            ) : (
              <a href="#/checklist" className="pager-next">
                <span className="pager-dir">Next →</span>
                Checklist
              </a>
            )}
          </nav>
        </>
      )}
    </article>
  );
}
