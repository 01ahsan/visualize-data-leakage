/** A score such as ROC AUC, two decimals. */
export const fmtScore = (v: number) => v.toFixed(2);

/** A signed difference, with a true minus sign. */
export const fmtGap = (v: number) => {
  const rounded = Math.round(v * 100) / 100;
  if (rounded === 0) return '0.00';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(2)}`;
};

/** Gaps smaller than this are treated as sampling noise in the UI. */
export const NOISE_BAND = 0.05;
