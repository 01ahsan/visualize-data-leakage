import { permutation, type Rng } from './rng';

/** Split 0..n-1 into k folds of near-equal size, after shuffling. */
export function kFold(n: number, k: number, rng: Rng): number[][] {
  const folds: number[][] = Array.from({ length: k }, () => []);
  permutation(n, rng).forEach((idx, pos) => folds[pos % k].push(idx));
  return folds;
}

/** Like kFold, but all rows sharing a group id land in the same fold. */
export function groupKFold(groups: readonly number[], k: number, rng: Rng): number[][] {
  const unique = Array.from(new Set(groups));
  const foldOf = new Map<number, number>();
  permutation(unique.length, rng).forEach((u, pos) => foldOf.set(unique[u], pos % k));
  const folds: number[][] = Array.from({ length: k }, () => []);
  groups.forEach((g, i) => folds[foldOf.get(g) as number].push(i));
  return folds;
}

/** Stratified k-fold: each fold keeps roughly the class balance of y. */
export function stratifiedKFold(y: readonly number[], k: number, rng: Rng): number[][] {
  const folds: number[][] = Array.from({ length: k }, () => []);
  let offset = 0;
  for (const cls of [0, 1]) {
    const idx = y.flatMap((v, i) => (v === cls ? [i] : []));
    permutation(idx.length, rng).forEach((p, pos) => folds[(pos + offset) % k].push(idx[p]));
    offset += idx.length;
  }
  return folds;
}

/** Indices in 0..n-1 that are not in `testIdx`. */
export function complement(n: number, testIdx: readonly number[]): number[] {
  const inTest = new Uint8Array(n);
  for (const i of testIdx) inTest[i] = 1;
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (!inTest[i]) out.push(i);
  return out;
}

/**
 * Out-of-fold predictions: for each fold, `fitPredict(trainIdx, testIdx)`
 * returns scores for the test rows, which are placed back in row order.
 */
export function crossValPredict(
  n: number,
  folds: readonly number[][],
  fitPredict: (trainIdx: number[], testIdx: number[]) => number[],
): number[] {
  const out = new Array<number>(n).fill(NaN);
  for (const testIdx of folds) {
    const scores = fitPredict(complement(n, testIdx), testIdx);
    testIdx.forEach((row, i) => (out[row] = scores[i]));
  }
  return out;
}
