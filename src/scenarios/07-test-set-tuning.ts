import { makeTabular, type Dataset } from '../lib/data';
import { mean, rocAuc } from '../lib/metrics';
import { LogisticRegression } from '../lib/models';
import { permutation, randInt, stream } from '../lib/rng';
import { defineScenario, SALT } from './define';

const TRAIN_ROWS = 200;
/** Part of the training rows held out for validation in the correct workflow. */
const VALIDATION_ROWS = 60;
const TEST_ROWS = 60;
const NEW_HOSPITAL_ROWS = 500;
const REPEATS = 12;
const MAX_SETTINGS = 30;
const FEATURES = 10;
const TABULAR = { informative: 3, noise: FEATURES - 3, signal: 0.35 };
const L2_GRID = [0.001, 0.01, 0.1, 0.5];

interface Setting {
  columns: number[];
  l2: number;
}

interface SettingResult {
  /** Fitted on the full training set: test score and new-hospital score. */
  test: number;
  testModelNew: number;
  /** Fitted on training minus validation: validation score. */
  validation: number;
}

const project = (d: Dataset, cols: number[]) => d.X.map((row) => cols.map((c) => row[c]));

/** Fit one setting on `train` and return its ROC AUC on each evaluation set. */
const fitScore = (train: Dataset, evalSets: Dataset[], s: Setting) => {
  const model = new LogisticRegression({ l2: s.l2, learningRate: 1, iterations: 25 }).fit(
    project(train, s.columns),
    train.y,
  );
  return evalSets.map((d) => rocAuc(d.y, model.predictProba(project(d, s.columns))));
};

/**
 * Every setting is fitted once per (seed, study); slider moves then only
 * change how many of the precomputed settings are compared.
 */
const cache = new Map<number, SettingResult[][]>();

function results(seed: number): SettingResult[][] {
  const hit = cache.get(seed);
  if (hit) return hit;
  const newHospital = makeTabular(
    { n: NEW_HOSPITAL_ROWS, ...TABULAR },
    stream(seed, SALT.newHospital),
  );
  const studies: SettingResult[][] = [];
  for (let r = 0; r < REPEATS; r++) {
    const rng = stream(seed, SALT.extra, r);
    const settings: Setting[] = Array.from({ length: MAX_SETTINGS }, () => ({
      columns: permutation(FEATURES, rng).slice(0, 3 + randInt(rng, 6)),
      l2: L2_GRID[randInt(rng, L2_GRID.length)],
    }));
    const train = makeTabular({ n: TRAIN_ROWS, ...TABULAR }, stream(seed, SALT.data, r));
    const test = makeTabular({ n: TEST_ROWS, ...TABULAR }, stream(seed, SALT.data, r, 1));
    const cut = TRAIN_ROWS - VALIDATION_ROWS;
    const inner = { X: train.X.slice(0, cut), y: train.y.slice(0, cut) };
    const validation = { X: train.X.slice(cut), y: train.y.slice(cut) };
    studies.push(
      settings.map((s) => {
        const [testScore, newScore] = fitScore(train, [test, newHospital], s);
        return {
          test: testScore,
          testModelNew: newScore,
          validation: fitScore(inner, [validation], s)[0],
        };
      }),
    );
  }
  if (cache.size > 8) cache.delete(cache.keys().next().value as number);
  cache.set(seed, studies);
  return studies;
}

export default defineScenario({
  id: 'test-set-tuning',
  number: 7,
  title: 'Tuning on the test set',
  oneLiner: 'Many settings are tried and the best test score is reported.',
  medicalExample:
    'A team tries 20 combinations of features and regularisation for a readmission model, checks each one on the same 60 test patients, and publishes the best.',
  explanation:
    'Every test score is the true performance plus some luck. Try enough settings and pick the highest, and you mostly pick the luckiest, so the reported number overstates what the chosen model will do. With a weak signal and a small test set, as here, the inflation is moderate: about five to eight points of AUC, growing slowly with more settings. Choose settings with a validation split (or cross-validation inside the training data), then evaluate the single chosen model once on a test set that played no part in any decision.',
  setup: `${TRAIN_ROWS} training rows, ${TEST_ROWS} test rows, weak signal, logistic regression with random feature subsets and penalties, averaged over ${REPEATS} studies. Correct: chosen on a ${VALIDATION_ROWS}-row validation split. New hospital: ${NEW_HOSPITAL_ROWS} rows.`,
  strength: {
    label: 'Settings tried',
    min: 1,
    max: MAX_SETTINGS,
    step: 1,
    default: 20,
    hint: 'Each extra setting is another lottery ticket for a lucky test score.',
  },
  evaluate({ leaky, strength, seed }) {
    const k = Math.round(strength);
    const reported: number[] = [];
    const fresh: number[] = [];
    for (const study of results(seed)) {
      const tried = study.slice(0, k);
      const key = (r: SettingResult) => (leaky ? r.test : r.validation);
      const best = tried.reduce((a, b) => (key(b) > key(a) ? b : a));
      reported.push(best.test);
      fresh.push(best.testModelNew);
    }
    return { reportedScore: mean(reported), newHospitalScore: mean(fresh) };
  },
  wrongCode: `import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

rng = np.random.default_rng(0)
y = rng.integers(0, 2, 260)
X = rng.normal(size=(260, 10)) + 0.35 * y[:, None] * (np.arange(10) < 3)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=60, random_state=0)
settings = [(C, rng.choice(10, rng.integers(3, 9), replace=False))
            for C in [0.01, 0.1, 1, 10] for _ in range(5)]

# Wrong: every setting is scored on the test set and the best is reported
best = max(roc_auc_score(y_te, LogisticRegression(C=C).fit(X_tr[:, f], y_tr)
                         .predict_proba(X_te[:, f])[:, 1]) for C, f in settings)
print(f"Reported AUC: {best:.2f}")`,
  rightCode: `import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import cross_val_score, train_test_split

rng = np.random.default_rng(0)
y = rng.integers(0, 2, 260)
X = rng.normal(size=(260, 10)) + 0.35 * y[:, None] * (np.arange(10) < 3)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=60, random_state=0)
settings = [(C, rng.choice(10, rng.integers(3, 9), replace=False))
            for C in [0.01, 0.1, 1, 10] for _ in range(5)]

# Right: choose with cross-validation on training data, test once at the end
C, f = max(settings, key=lambda s: cross_val_score(
    LogisticRegression(C=s[0]), X_tr[:, s[1]], y_tr, cv=5, scoring="roc_auc").mean())
model = LogisticRegression(C=C).fit(X_tr[:, f], y_tr)
print(f"Reported AUC: {roc_auc_score(y_te, model.predict_proba(X_te[:, f])[:, 1]):.2f}")`,
});
