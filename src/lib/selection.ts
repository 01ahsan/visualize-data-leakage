/**
 * Correlation-based feature selection that can exclude one fold.
 *
 * Per-fold sums are computed once, so "select on the training folds only"
 * costs the same as "select on all rows": the training statistics are the
 * totals minus the held-out fold.
 */
export interface FoldSelector {
  /** Top-k columns by |correlation| with y, ignoring rows in fold `excludeFold`. */
  topK(k: number, excludeFold?: number): number[];
}

export function makeFoldSelector(
  columns: readonly Float64Array[],
  y: readonly number[],
  folds: readonly number[][],
): FoldSelector {
  const p = columns.length;
  const F = folds.length;
  const foldOf = new Int32Array(y.length);
  folds.forEach((fold, f) => fold.forEach((i) => (foldOf[i] = f)));

  const count = new Float64Array(F);
  const sy = new Float64Array(F);
  const syy = new Float64Array(F);
  for (let i = 0; i < y.length; i++) {
    count[foldOf[i]]++;
    sy[foldOf[i]] += y[i];
    syy[foldOf[i]] += y[i] * y[i];
  }
  const sx = new Float64Array(F * p);
  const sxx = new Float64Array(F * p);
  const sxy = new Float64Array(F * p);
  for (let j = 0; j < p; j++) {
    const col = columns[j];
    for (let i = 0; i < col.length; i++) {
      const at = foldOf[i] * p + j;
      const v = col[i];
      sx[at] += v;
      sxx[at] += v * v;
      sxy[at] += v * y[i];
    }
  }

  return {
    topK(k, excludeFold) {
      let n = 0;
      let Sy = 0;
      let Syy = 0;
      for (let f = 0; f < F; f++) {
        if (f === excludeFold) continue;
        n += count[f];
        Sy += sy[f];
        Syy += syy[f];
      }
      const varY = Syy - (Sy * Sy) / n;
      const score = new Float64Array(p);
      for (let j = 0; j < p; j++) {
        let Sx = 0;
        let Sxx = 0;
        let Sxy = 0;
        for (let f = 0; f < F; f++) {
          if (f === excludeFold) continue;
          Sx += sx[f * p + j];
          Sxx += sxx[f * p + j];
          Sxy += sxy[f * p + j];
        }
        const varX = Sxx - (Sx * Sx) / n;
        const cov = Sxy - (Sx * Sy) / n;
        score[j] = varX > 0 && varY > 0 ? Math.abs(cov) / Math.sqrt(varX * varY) : 0;
      }
      // Partial selection: keep a sorted list of the best k seen so far.
      const best: number[] = [];
      for (let j = 0; j < p; j++) {
        if (best.length === k && score[j] <= score[best[k - 1]]) continue;
        let pos = best.length === k ? k - 1 : best.length;
        best[pos] = j;
        while (pos > 0 && score[best[pos - 1]] < score[j]) {
          best[pos] = best[pos - 1];
          best[pos - 1] = j;
          pos--;
        }
      }
      return best;
    },
  };
}
