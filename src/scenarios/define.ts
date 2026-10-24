import type { Classifier } from '../lib/models';
import { mean, rocAuc } from '../lib/metrics';
import { takeRows, type Matrix } from '../lib/matrix';
import { complement } from '../lib/split';
import type { CurvePoint, Scenario, ScenarioDefinition, StrengthParam } from './types';

export const CURVE_POINTS = 7;

/** Evenly spaced slider values from min to max, snapped to the step. */
export function strengthGrid(s: StrengthParam, points = CURVE_POINTS): number[] {
  const values = Array.from({ length: points }, (_, i) => {
    const raw = s.min + ((s.max - s.min) * i) / (points - 1);
    return Number((Math.round((raw - s.min) / s.step) * s.step + s.min).toFixed(6));
  });
  return Array.from(new Set(values));
}

export function defineScenario(def: ScenarioDefinition): Scenario {
  const curveStrengths = () => strengthGrid(def.strength);
  const curve = (leaky: boolean, seed: number): CurvePoint[] =>
    curveStrengths().map((strength) => {
      const e = def.evaluate({ leaky, strength, seed });
      return { strength, gap: e.reportedScore - e.newHospitalScore };
    });
  return {
    ...def,
    curveStrengths,
    curve,
    run: (input) => ({ ...def.evaluate(input), curve: curve(input.leaky, input.seed) }),
  };
}

/**
 * Mean ROC AUC over folds, as scikit-learn's cross_val_score reports it.
 * `fitPredict` returns scores for the test rows of one fold.
 */
export function meanFoldAuc(
  y: readonly number[],
  folds: readonly number[][],
  fitPredict: (trainIdx: number[], testIdx: number[]) => number[],
): number {
  const n = y.length;
  return mean(
    folds.map((test) => rocAuc(takeRows(y, test), fitPredict(complement(n, test), test))),
  );
}

/** Cross-validated ROC AUC of a model on (X, y). */
export function crossValAuc(
  X: Matrix,
  y: readonly number[],
  folds: readonly number[][],
  makeModel: () => Classifier,
): number {
  return meanFoldAuc(y, folds, (train, test) =>
    makeModel().fit(takeRows(X, train), takeRows(y, train)).predictProba(takeRows(X, test)),
  );
}

/** Fit on one set, ROC AUC on another. */
export function fitAndScore(
  train: { X: Matrix; y: readonly number[] },
  test: { X: Matrix; y: readonly number[] },
  makeModel: () => Classifier,
): number {
  return rocAuc(test.y, makeModel().fit(train.X, train.y).predictProba(test.X));
}

/** Salts for independent random streams within one simulation. */
export const SALT = {
  data: 1,
  split: 2,
  newHospital: 3,
  extra: 4,
} as const;

export const percent = (v: number) => `${Math.round(v * 100)}%`;
