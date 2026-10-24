import { bernoulli, normal, type Rng } from '../rng';
import type { Matrix } from '../matrix';

/** An n x p matrix of independent standard normal values. */
export function makeNoiseFeatures(n: number, p: number, rng: Rng): Matrix {
  return Array.from({ length: n }, () => Array.from({ length: p }, () => normal(rng)));
}

/** Labels that carry no information at all: fair coin flips. */
export function makeRandomLabels(n: number, rng: Rng): number[] {
  return Array.from({ length: n }, () => bernoulli(rng, 0.5));
}
