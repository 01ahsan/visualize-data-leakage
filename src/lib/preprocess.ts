import type { Matrix } from './matrix';

export interface Transformer {
  transform(X: Matrix): Matrix;
}

/**
 * Mean imputation (NaN = missing) followed by standard scaling, with every
 * statistic computed only from the rows passed in.
 */
export function fitImputeScale(X: Matrix): Transformer {
  const p = X[0]?.length ?? 0;
  const means = new Array<number>(p).fill(0);
  const counts = new Array<number>(p).fill(0);
  for (const row of X) {
    for (let j = 0; j < p; j++) {
      if (!Number.isNaN(row[j])) {
        means[j] += row[j];
        counts[j]++;
      }
    }
  }
  for (let j = 0; j < p; j++) means[j] = counts[j] ? means[j] / counts[j] : 0;
  const sds = new Array<number>(p).fill(0);
  for (const row of X) {
    for (let j = 0; j < p; j++) {
      const v = Number.isNaN(row[j]) ? means[j] : row[j];
      sds[j] += (v - means[j]) ** 2;
    }
  }
  for (let j = 0; j < p; j++) sds[j] = Math.sqrt(sds[j] / Math.max(1, X.length)) || 1;
  return {
    transform: (Z) =>
      Z.map((row) => row.map((v, j) => ((Number.isNaN(v) ? means[j] : v) - means[j]) / sds[j])),
  };
}
