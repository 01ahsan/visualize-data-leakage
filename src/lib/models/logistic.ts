import type { Matrix } from '../matrix';
import type { Classifier } from './types';

export interface LogisticOptions {
  /** L2 penalty strength (applied to weights, not the intercept). */
  l2?: number;
  learningRate?: number;
  iterations?: number;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Logistic regression trained by full-batch gradient descent with L2 regularisation. */
export class LogisticRegression implements Classifier {
  weights: number[] = [];
  bias = 0;
  private readonly l2: number;
  private readonly lr: number;
  private readonly iterations: number;

  constructor({ l2 = 0.01, learningRate = 0.5, iterations = 150 }: LogisticOptions = {}) {
    this.l2 = l2;
    this.lr = learningRate;
    this.iterations = iterations;
  }

  fit(X: Matrix, y: readonly number[]): this {
    const n = X.length;
    const p = X[0]?.length ?? 0;
    const w = new Float64Array(p);
    const grad = new Float64Array(p);
    let b = 0;
    for (let it = 0; it < this.iterations; it++) {
      grad.fill(0);
      let gb = 0;
      for (let i = 0; i < n; i++) {
        const row = X[i];
        let z = b;
        for (let j = 0; j < p; j++) z += w[j] * row[j];
        const err = sigmoid(z) - y[i];
        gb += err;
        for (let j = 0; j < p; j++) grad[j] += err * row[j];
      }
      for (let j = 0; j < p; j++) w[j] -= this.lr * (grad[j] / n + this.l2 * w[j]);
      b -= (this.lr * gb) / n;
    }
    this.weights = Array.from(w);
    this.bias = b;
    return this;
  }

  predictProba(X: Matrix): number[] {
    return X.map((row) => {
      let z = this.bias;
      for (let j = 0; j < row.length; j++) z += this.weights[j] * row[j];
      return sigmoid(z);
    });
  }
}
