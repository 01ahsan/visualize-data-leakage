import type { Matrix } from '../matrix';

/** A binary classifier that outputs a score for class 1. */
export interface Classifier {
  fit(X: Matrix, y: readonly number[]): this;
  predictProba(X: Matrix): number[];
}
