import { bernoulli, normal, type Rng } from '../rng';
import type { Dataset } from './types';

export interface TabularOptions {
  n: number;
  /** Features whose class means differ by `signal` standard deviations. */
  informative: number;
  /** Extra pure-noise features. */
  noise?: number;
  signal: number;
  /** Probability of class 1. */
  prevalence?: number;
}

/** Two Gaussian classes: informative features are shifted by `signal` in class 1. */
export function makeTabular(
  { n, informative, noise = 0, signal, prevalence = 0.5 }: TabularOptions,
  rng: Rng,
): Dataset {
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    const label = bernoulli(rng, prevalence);
    const row: number[] = [];
    for (let j = 0; j < informative; j++) row.push(normal(rng, label * signal));
    for (let j = 0; j < noise; j++) row.push(normal(rng));
    X.push(row);
    y.push(label);
  }
  return { X, y };
}
