/** Fraction of predictions (score >= threshold) that match the labels. */
export function accuracy(
  yTrue: readonly number[],
  scores: readonly number[],
  threshold = 0.5,
): number {
  if (yTrue.length === 0) return NaN;
  let correct = 0;
  for (let i = 0; i < yTrue.length; i++) {
    if ((scores[i] >= threshold ? 1 : 0) === yTrue[i]) correct++;
  }
  return correct / yTrue.length;
}

/**
 * Area under the ROC curve via the Mann-Whitney U statistic, with tied
 * scores given their average rank. Returns 0.5 when only one class is present.
 */
export function rocAuc(yTrue: readonly number[], scores: readonly number[]): number {
  const n = yTrue.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => scores[a] - scores[b]);
  let rankSumPos = 0;
  let nPos = 0;
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && scores[order[j + 1]] === scores[order[i]]) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      if (yTrue[order[k]] === 1) {
        rankSumPos += avgRank;
        nPos++;
      }
    }
    i = j + 1;
  }
  const nNeg = n - nPos;
  if (nPos === 0 || nNeg === 0) return 0.5;
  return (rankSumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

export function mean(values: readonly number[]): number {
  let s = 0;
  for (const v of values) s += v;
  return values.length ? s / values.length : NaN;
}
