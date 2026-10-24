export type Matrix = number[][];

/** Items at the given indices (rows are shared references, not copies). */
export function takeRows<T>(rows: readonly T[], idx: readonly number[]): T[] {
  return idx.map((i) => rows[i]);
}

/** Copy of `X` restricted to the given column indices. */
export function takeColumns(X: Matrix, cols: readonly number[]): Matrix {
  return X.map((row) => cols.map((c) => row[c]));
}

/** Pearson correlation between column `j` of X and y. */
export function columnCorrelation(X: Matrix, y: readonly number[], j: number): number {
  const n = X.length;
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += X[i][j];
    my += y[i];
  }
  mx /= n;
  my /= n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = X[i][j] - mx;
    const dy = y[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
}

/** Indices of the k columns with the largest absolute correlation to y. */
export function selectTopK(X: Matrix, y: readonly number[], k: number): number[] {
  const p = X[0]?.length ?? 0;
  const scored = Array.from({ length: p }, (_, j) => ({
    j,
    r: Math.abs(columnCorrelation(X, y, j)),
  }));
  scored.sort((a, b) => b.r - a.r || a.j - b.j);
  return scored.slice(0, k).map((s) => s.j);
}
