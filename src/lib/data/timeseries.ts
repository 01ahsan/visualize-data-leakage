import { normal, type Rng } from '../rng';
import type { Dataset } from './types';

export interface DriftOptions {
  n: number;
  tStart: number;
  tEnd: number;
  /** Half-turns per time unit that the decision boundary rotates. */
  drift: number;
  signal: number;
  /** Multiplier for the time column so it is on a scale similar to the features. */
  timeScale: number;
}

/**
 * Time-ordered rows with concept drift: the rule linking two features to the
 * label rotates as time passes. The last column of X is the (scaled) time,
 * as an admission date would be in a real table.
 */
export function makeDrifting(
  { n, tStart, tEnd, drift, signal, timeScale }: DriftOptions,
  rng: Rng,
): Dataset {
  const X: number[][] = [];
  const y: number[] = [];
  const time: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = tStart + ((tEnd - tStart) * (i + rng())) / n;
    const a = normal(rng);
    const b = normal(rng);
    const angle = drift * Math.PI * t;
    const z = signal * (a * Math.cos(angle) + b * Math.sin(angle)) + normal(rng);
    X.push([a, b, t * timeScale]);
    y.push(z > 0 ? 1 : 0);
    time.push(t);
  }
  return { X, y, time };
}
