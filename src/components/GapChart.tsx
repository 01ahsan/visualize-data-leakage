import { useState } from 'react';
import { fmtGap, NOISE_BAND } from '../format';
import type { CurvePoint, StrengthParam } from '../scenarios/types';
import { useElementWidth } from './hooks';

interface GapChartProps {
  leakyCurve: CurvePoint[];
  correctCurve: CurvePoint[];
  strengths: number[];
  strength: StrengthParam;
  current: number;
  leaky: boolean;
}

const HEIGHT = 260;
const M = { top: 16, right: 76, bottom: 44, left: 48 };

function niceTicks(min: number, max: number): number[] {
  const span = max - min;
  const step = span > 0.6 ? 0.2 : span > 0.3 ? 0.1 : 0.05;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

export function GapChart({
  leakyCurve,
  correctCurve,
  strengths,
  strength,
  current,
  leaky,
}: GapChartProps) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const fmtX = strength.format ?? ((v: number) => String(v));

  const gaps = [...leakyCurve, ...correctCurve].map((p) => p.gap);
  const yMin = Math.min(-0.1, Math.floor(Math.min(0, ...gaps) / 0.05) * 0.05);
  const yMax = Math.max(0.1, Math.ceil(Math.max(0, ...gaps) / 0.05) * 0.05);
  const innerW = Math.max(10, width - M.left - M.right);
  const innerH = HEIGHT - M.top - M.bottom;
  const x = (v: number) => M.left + ((v - strength.min) / (strength.max - strength.min)) * innerW;
  const y = (v: number) => M.top + ((yMax - v) / (yMax - yMin)) * innerH;
  const path = (pts: CurvePoint[]) =>
    pts
      .map((p, i) => `${i ? 'L' : 'M'}${x(p.strength).toFixed(1)},${y(p.gap).toFixed(1)}`)
      .join('');

  const series = [
    { key: 'correct', name: 'Correct', pts: correctCurve, color: 'var(--correct)', active: !leaky },
    { key: 'leaky', name: 'Leaky', pts: leakyCurve, color: 'var(--leaky)', active: leaky },
  ];
  // Draw the active series last so it sits on top.
  const ordered = series.slice().sort((a, b) => Number(a.active) - Number(b.active));
  const total = strengths.length * 2;
  const done = leakyCurve.length + correctCurve.length;

  const onPointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left + M.left;
    let best = 0;
    strengths.forEach((s, i) => {
      if (Math.abs(x(s) - px) < Math.abs(x(strengths[best]) - px)) best = i;
    });
    setHover(best);
  };

  const hoverStrength = hover === null ? null : strengths[hover];
  const valueAt = (pts: CurvePoint[], s: number) => pts.find((p) => p.strength === s)?.gap;

  // Direct labels at line ends, nudged apart if they would collide.
  const ends = series
    .filter((s) => s.pts.length === strengths.length)
    .map((s) => ({ ...s, ly: y(s.pts[s.pts.length - 1].gap) }));
  if (ends.length === 2 && Math.abs(ends[0].ly - ends[1].ly) < 16) {
    const mid = (ends[0].ly + ends[1].ly) / 2;
    const [lo, hi] = ends[0].ly < ends[1].ly ? [ends[0], ends[1]] : [ends[1], ends[0]];
    lo.ly = mid - 8;
    hi.ly = mid + 8;
  }

  return (
    <div className="chart">
      <div className="chart-legend" aria-hidden="true">
        {series.map((s) => (
          <span key={s.key} className={`legend-item ${s.active ? 'active' : ''}`}>
            <span className="legend-swatch" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-band" />
          Sampling noise (±{NOISE_BAND.toFixed(2)})
        </span>
      </div>
      <div className="chart-wrap" ref={wrapRef}>
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`Line chart of the gap between reported and new hospital score across ${strength.label.toLowerCase()}, for leaky and correct workflows. The data table below lists the values.`}
          >
            <rect
              x={M.left}
              width={innerW}
              y={y(NOISE_BAND)}
              height={y(-NOISE_BAND) - y(NOISE_BAND)}
              className="chart-noise"
            />
            {niceTicks(yMin, yMax).map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={M.left + innerW}
                  y1={y(t)}
                  y2={y(t)}
                  className={t === 0 ? 'chart-zero' : 'chart-grid'}
                />
                <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="chart-tick">
                  {fmtGap(t)}
                </text>
              </g>
            ))}
            {strengths.map((s) => (
              <text
                key={s}
                x={x(s)}
                y={M.top + innerH + 18}
                textAnchor="middle"
                className="chart-tick"
              >
                {fmtX(s)}
              </text>
            ))}
            <text
              x={M.left + innerW / 2}
              y={HEIGHT - 6}
              textAnchor="middle"
              className="chart-axis-label"
            >
              {strength.label}
            </text>
            <line
              x1={x(current)}
              x2={x(current)}
              y1={M.top}
              y2={M.top + innerH}
              className="chart-current"
            />
            {ordered.map((s) => (
              <g key={s.key} opacity={s.active ? 1 : 0.55}>
                <path
                  d={path(s.pts)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.active ? 2.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {s.pts.map((p) => (
                  <circle
                    key={p.strength}
                    cx={x(p.strength)}
                    cy={y(p.gap)}
                    r={4}
                    fill={s.color}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ))}
              </g>
            ))}
            {ends.map((s) => (
              <text
                key={s.key}
                x={M.left + innerW + 8}
                y={s.ly}
                dy="0.32em"
                className="chart-direct-label"
              >
                {s.name}
              </text>
            ))}
            {hoverStrength !== null && (
              <line
                x1={x(hoverStrength)}
                x2={x(hoverStrength)}
                y1={M.top}
                y2={M.top + innerH}
                className="chart-crosshair"
              />
            )}
            <rect
              x={M.left}
              y={M.top}
              width={innerW}
              height={innerH}
              fill="transparent"
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        )}
        {hoverStrength !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: Math.min(x(hoverStrength) + 12, Math.max(0, width - 170)),
              top: M.top,
            }}
            aria-hidden="true"
          >
            <div className="tooltip-title">
              {strength.label}: {fmtX(hoverStrength)}
            </div>
            {series.map((s) => {
              const v = valueAt(s.pts, hoverStrength);
              return (
                <div key={s.key} className="tooltip-row">
                  <span className="legend-swatch" style={{ background: s.color }} />
                  {s.name}
                  <span className="tooltip-value">{v === undefined ? '…' : fmtGap(v)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="muted small" aria-live="polite">
        {done < total
          ? `Computing the curve… ${done} of ${total} points`
          : 'The vertical line marks the current setting.'}
      </p>
      <details className="chart-table">
        <summary>Show the data table</summary>
        <table>
          <caption className="visually-hidden">
            Gap (reported minus new hospital) by {strength.label.toLowerCase()}
          </caption>
          <thead>
            <tr>
              <th scope="col">{strength.label}</th>
              <th scope="col">Leaky gap</th>
              <th scope="col">Correct gap</th>
            </tr>
          </thead>
          <tbody>
            {strengths.map((s) => {
              const l = valueAt(leakyCurve, s);
              const c = valueAt(correctCurve, s);
              return (
                <tr key={s}>
                  <th scope="row">{fmtX(s)}</th>
                  <td>{l === undefined ? '…' : fmtGap(l)}</td>
                  <td>{c === undefined ? '…' : fmtGap(c)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
}
