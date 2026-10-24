import { fmtGap, fmtScore, NOISE_BAND } from '../format';
import { useAnimatedNumber } from './hooks';

interface ScoreMeterProps {
  label: string;
  description: string;
  value: number | null;
  /** CSS colour for the bar fill. */
  color: string;
  pending: boolean;
}

/** A 0-to-1 score bar with a tick at chance level (0.5). */
export function ScoreMeter({ label, description, value, color, pending }: ScoreMeterProps) {
  const shown = useAnimatedNumber(value);
  const id = label.replace(/\W+/g, '-').toLowerCase();
  return (
    <div className="meter" aria-busy={pending}>
      <div className="meter-head">
        <span className="meter-label" id={`${id}-label`}>
          {label}
        </span>
        <span className="meter-value">{shown === null ? '…' : fmtScore(shown)}</span>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? 'Computing' : `ROC AUC ${fmtScore(value)}`}
      >
        <div
          className="meter-fill"
          style={{
            transform: `scaleX(${Math.max(0, Math.min(1, value ?? 0))})`,
            background: color,
          }}
        />
        <div className="meter-chance" style={{ left: '50%' }} aria-hidden="true" />
      </div>
      <p className="meter-desc" id={`${id}-desc`}>
        {description}
      </p>
    </div>
  );
}

interface GapMeterProps {
  value: number | null;
  pending: boolean;
}

const GAP_RANGE = 0.5;

/** Reported minus new-hospital score, drawn from a centre line. */
export function GapMeter({ value, pending }: GapMeterProps) {
  const shown = useAnimatedNumber(value);
  const v = value ?? 0;
  const clamped = Math.max(-GAP_RANGE, Math.min(GAP_RANGE, v));
  const fraction = Math.abs(clamped) / (2 * GAP_RANGE);
  const status =
    value === null
      ? null
      : Math.abs(v) < NOISE_BAND
        ? { kind: 'ok', icon: '✓', text: 'Within sampling noise' }
        : v > 0
          ? { kind: 'warn', icon: '▲', text: 'Optimistic: the reported score is too high' }
          : { kind: 'info', icon: '▼', text: 'Pessimistic: the reported score is too low' };
  return (
    <div className="meter" aria-busy={pending}>
      <div className="meter-head">
        <span className="meter-label" id="gap-label">
          Gap
        </span>
        <span className="meter-value">{shown === null ? '…' : fmtGap(shown)}</span>
      </div>
      <div
        className="meter-track gap-track"
        role="meter"
        aria-labelledby="gap-label"
        aria-describedby="gap-desc"
        aria-valuemin={-GAP_RANGE}
        aria-valuemax={GAP_RANGE}
        aria-valuenow={value ?? undefined}
        aria-valuetext={
          value === null ? 'Computing' : `${fmtGap(value)}. ${status ? status.text : ''}`
        }
      >
        <div
          className="gap-noise"
          style={{
            left: `${50 - (NOISE_BAND / (2 * GAP_RANGE)) * 100}%`,
            width: `${(NOISE_BAND / GAP_RANGE) * 100}%`,
          }}
          aria-hidden="true"
        />
        <div
          className={`gap-fill gap-${status?.kind ?? 'ok'}`}
          style={{
            left: clamped >= 0 ? '50%' : `${50 - fraction * 100}%`,
            width: `${fraction * 100}%`,
          }}
        />
        <div className="meter-chance" style={{ left: '50%' }} aria-hidden="true" />
      </div>
      <p className="meter-desc" id="gap-desc">
        {status ? (
          <span className={`status status-${status.kind}`}>
            <span className="status-icon" aria-hidden="true">
              {status.icon}
            </span>{' '}
            {status.text}
          </span>
        ) : (
          'Computing…'
        )}
      </p>
    </div>
  );
}
