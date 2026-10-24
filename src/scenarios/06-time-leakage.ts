import { makeDrifting } from '../lib/data';
import { takeRows } from '../lib/matrix';
import { mean } from '../lib/metrics';
import { KNearestNeighbors } from '../lib/models';
import { stream } from '../lib/rng';
import { stratifiedKFold } from '../lib/split';
import { crossValAuc, defineScenario, fitAndScore, SALT } from './define';

const ROWS = 2000;
const NEW_HOSPITAL_ROWS = 1500;
/** Forward-chaining splits, like scikit-learn's TimeSeriesSplit(n_splits=4). */
const TIME_SPLITS = 4;
const SIGNAL = 1.5;
const TIME_SCALE = 4;

const makeModel = () => new KNearestNeighbors({ k: 15 });

export default defineScenario({
  id: 'time-leakage',
  number: 6,
  title: 'Time leakage',
  oneLiner: 'A random split mixes past and future.',
  medicalExample:
    'Admissions from 2019 to 2023 are shuffled and split. The model will run in 2024.',
  explanation:
    'The link between features and outcome changes over time. A random split puts rows from the same weeks in train and test, so the model always sees the current rule. In use, the future is unseen. Train on the past and test on the next period. With no drift, both splits agree.',
  setup: `${ROWS} admissions over one period, 2 features plus the date, k-NN (k = 15). Leaky: 5-fold random split. Correct: ${TIME_SPLITS} forward-chaining splits. New hospital: ${NEW_HOSPITAL_ROWS} admissions from the next period.`,
  strength: {
    label: 'Drift speed',
    min: 0,
    max: 2,
    step: 0.25,
    default: 1.5,
    format: (v) => v.toFixed(2),
    hint: 'Faster drift, bigger gap.',
  },
  evaluate({ leaky, strength, seed }) {
    const opts = { drift: strength, signal: SIGNAL, timeScale: TIME_SCALE };
    const dev = makeDrifting({ ...opts, n: ROWS, tStart: 0, tEnd: 1 }, stream(seed, SALT.data));
    const block = 1 / (TIME_SPLITS + 1);
    const newHospital = makeDrifting(
      { ...opts, n: NEW_HOSPITAL_ROWS, tStart: 1, tEnd: 1 + block },
      stream(seed, SALT.newHospital),
    );
    const newHospitalScore = fitAndScore(dev, newHospital, makeModel);
    if (leaky) {
      const folds = stratifiedKFold(dev.y, 5, stream(seed, SALT.split));
      return { reportedScore: crossValAuc(dev.X, dev.y, folds, makeModel), newHospitalScore };
    }
    // Rows are generated in time order, so blocks of indices are time periods.
    const size = ROWS / (TIME_SPLITS + 1);
    const scores: number[] = [];
    for (let s = 1; s <= TIME_SPLITS; s++) {
      const train = Array.from({ length: s * size }, (_, i) => i);
      const test = Array.from({ length: size }, (_, i) => s * size + i);
      scores.push(
        fitAndScore(
          { X: takeRows(dev.X, train), y: takeRows(dev.y, train) },
          { X: takeRows(dev.X, test), y: takeRows(dev.y, test) },
          makeModel,
        ),
      );
    }
    return { reportedScore: mean(scores), newHospitalScore };
  },
  wrongCode: `import numpy as np
from sklearn.model_selection import KFold, cross_val_score
from sklearn.neighbors import KNeighborsClassifier

rng = np.random.default_rng(0)
t = np.sort(rng.random(2000))                      # admission date, in order
angle = 1.5 * np.pi * t                           # the rule drifts over time
a, b = rng.normal(size=(2, 2000))
y = (1.5 * (a * np.cos(angle) + b * np.sin(angle)) + rng.normal(size=2000) > 0).astype(int)
X = np.column_stack([a, b, 4 * t])

# Wrong: shuffled folds mix past and future admissions
cv = KFold(5, shuffle=True, random_state=0)
auc = cross_val_score(KNeighborsClassifier(15), X, y, cv=cv, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
  rightCode: `import numpy as np
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.neighbors import KNeighborsClassifier

rng = np.random.default_rng(0)
t = np.sort(rng.random(2000))                      # admission date, in order
angle = 1.5 * np.pi * t                           # the rule drifts over time
a, b = rng.normal(size=(2, 2000))
y = (1.5 * (a * np.cos(angle) + b * np.sin(angle)) + rng.normal(size=2000) > 0).astype(int)
X = np.column_stack([a, b, 4 * t])

# Right: always train on the past and test on the period that follows
cv = TimeSeriesSplit(n_splits=4)
auc = cross_val_score(KNeighborsClassifier(15), X, y, cv=cv, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
});
