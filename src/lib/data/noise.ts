import { bernoulli, normals, type Rng } from '../rng';
import type { Matrix } from '../matrix';

const SQRT12 = Math.sqrt(12);

/** An n x p matrix of independent standard normal values. */
export function makeNoiseFeatures(n: number, p: number, rng: Rng): Matrix {
  const values = normals(rng, n * p);
  return Array.from({ length: n }, (_, i) => Array.from(values.subarray(i * p, (i + 1) * p)));
}

/**
 * Pure-noise features stored column by column (p columns of length n), for
 * fast per-feature statistics over thousands of features. Values are uniform
 * with mean 0 and variance 1: the distribution does not matter for chance
 * correlations, and uniform draws are about ten times cheaper than normal ones.
 */
export function makeNoiseColumns(n: number, p: number, rng: Rng): Float64Array[] {
  const values = new Float64Array(n * p);
  for (let i = 0; i < values.length; i++) values[i] = (rng() - 0.5) * SQRT12;
  return Array.from({ length: p }, (_, j) => values.subarray(j * n, (j + 1) * n));
}

/** Labels that carry no information at all: fair coin flips. */
export function makeRandomLabels(n: number, rng: Rng): number[] {
  return Array.from({ length: n }, () => bernoulli(rng, 0.5));
}
