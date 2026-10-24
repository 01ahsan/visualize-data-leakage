import { fmtScore } from '../format';
import { useAnimatedNumber, useElementWidth } from './hooks';

interface ScoreScaleProps {
  reported: number | null;
  newHospital: number | null;
  leaky: boolean;
}

const MIN = 0.3;
const MAX = 1;
const HEIGHT = 168;
const LINE_Y = 84;
const PAD = 28;

/**
 * The main visual: both scores as dots on one ROC AUC scale, with the gap
 * between them shaded. Reported is labelled above the line, new hospital below.
 */
export function ScoreScale({ reported, newHospital, leaky }: ScoreScaleProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const r = useAnimatedNumber(reported, 600);
  const n = useAnimatedNumber(newHospital, 600);
  const innerW = Math.max(10, width - 2 * PAD);
  const x = (v: number) => PAD + ((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * innerW;
  const clampLabel = (px: number) => Math.min(width - 40, Math.max(40, px));
  const color = leaky ? 'var(--leaky)' : 'var(--correct)';
  const ticks = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  // On narrow screens only the two reference points get a label.
  const compact = width < 520;
  const tickLabel = (t: number) =>
    t === 0.5 ? '0.5 chance' : t === 1 ? '1.0 perfect' : compact ? '' : t.toFixed(1);
  const label =
    reported === null || newHospital === null
      ? 'Computing scores'
      : `Reported ROC AUC ${fmtScore(reported)}, new hospital ${fmtScore(newHospital)}.`;

  return (
    <div className="scale" ref={ref}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={label}>
          <line x1={PAD} x2={PAD + innerW} y1={LINE_Y} y2={LINE_Y} className="scale-axis" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={LINE_Y - 4} y2={LINE_Y + 4} className="scale-tick" />
              <text x={x(t)} y={HEIGHT - 6} textAnchor="middle" className="scale-tick-label">
                {tickLabel(t)}
              </text>
            </g>
          ))}
          {r !== null && n !== null && (
            <>
              <rect
                x={Math.min(x(r), x(n))}
                width={Math.abs(x(r) - x(n))}
                y={LINE_Y - 7}
                height={14}
                rx={7}
                fill={color}
                opacity={0.22}
              />
              <circle cx={x(n)} cy={LINE_Y} r={11} className="scale-dot-new" />
              <circle cx={x(r)} cy={LINE_Y} r={11} fill={color} className="scale-dot" />
              <text x={clampLabel(x(r))} y={LINE_Y - 44} textAnchor="middle" className="scale-name">
                Reported
              </text>
              <text
                x={clampLabel(x(r))}
                y={LINE_Y - 20}
                textAnchor="middle"
                className="scale-value"
              >
                {fmtScore(r)}
              </text>
              <text
                x={clampLabel(x(n))}
                y={LINE_Y + 42}
                textAnchor="middle"
                className="scale-value"
              >
                {fmtScore(n)}
              </text>
              <text x={clampLabel(x(n))} y={LINE_Y + 60} textAnchor="middle" className="scale-name">
                New hospital
              </text>
            </>
          )}
        </svg>
      )}
    </div>
  );
}

/** A small static version for the home page cards. */
export function MiniScale({ reported, newHospital }: { reported: number; newHospital: number }) {
  const W = 200;
  const x = (v: number) => 8 + ((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * (W - 16);
  return (
    <svg viewBox={`0 0 ${W} 24`} className="mini-scale" aria-hidden="true">
      <line x1={8} x2={W - 8} y1={12} y2={12} className="scale-axis" />
      <line x1={x(0.5)} x2={x(0.5)} y1={8} y2={16} className="scale-tick" />
      <rect
        x={Math.min(x(reported), x(newHospital))}
        width={Math.abs(x(reported) - x(newHospital))}
        y={8}
        height={8}
        rx={4}
        fill="var(--leaky)"
        opacity={0.25}
      />
      <circle cx={x(newHospital)} cy={12} r={5.5} className="scale-dot-new" />
      <circle cx={x(reported)} cy={12} r={5.5} fill="var(--leaky)" className="scale-dot" />
    </svg>
  );
}
