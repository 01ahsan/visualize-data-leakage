import { makeTabular, type Dataset } from '../lib/data';
import { mean } from '../lib/metrics';
import { LogisticRegression } from '../lib/models';
import { normal, stream, type Rng } from '../lib/rng';
import { stratifiedKFold } from '../lib/split';
import { crossValAuc, defineScenario, fitAndScore, SALT } from './define';

const ROWS = 1000;
const NEW_HOSPITAL_ROWS = 2000;
const TABULAR = { informative: 4, noise: 4, signal: 0.5 };

const makeModel = () => new LogisticRegression({ l2: 0.01, learningRate: 0.3 });

/** Adds a column recorded after the outcome: the label plus noise. */
function withLateFeature(d: Dataset, strength: number, rng: Rng): Dataset {
  return { X: d.X.map((row, i) => [...row, strength * (2 * d.y[i] - 1) + normal(rng)]), y: d.y };
}

export default defineScenario({
  id: 'target-leakage',
  number: 5,
  title: 'Target leakage',
  oneLiner: 'A feature recorded after the outcome is used to predict it.',
  medicalExample:
    'A sepsis model uses “antibiotics given”. Antibiotics are given because of sepsis.',
  explanation:
    'One column is filled in because of the outcome. In the training table it gives the answer away. At prediction time it does not exist yet, so the model is left with a weak signal. For every feature, ask: would I have this when I make the prediction?',
  setup: `${ROWS} rows, 8 real features plus 1 late feature, logistic regression, 5-fold cross-validation. New hospital: ${NEW_HOSPITAL_ROWS} rows, late feature unavailable (filled with the training mean).`,
  strength: {
    label: 'How closely the late feature tracks the outcome',
    min: 0,
    max: 3,
    step: 0.25,
    default: 2,
    format: (v) => v.toFixed(2),
    hint: 'The stronger the late feature, the harder the fall.',
  },
  evaluate({ leaky, strength, seed }) {
    const base = makeTabular({ n: ROWS, ...TABULAR }, stream(seed, SALT.data));
    const newBase = makeTabular(
      { n: NEW_HOSPITAL_ROWS, ...TABULAR },
      stream(seed, SALT.newHospital),
    );
    const folds = stratifiedKFold(base.y, 5, stream(seed, SALT.split));
    if (!leaky) {
      // The correct workflow drops the late column before modelling.
      return {
        reportedScore: crossValAuc(base.X, base.y, folds, makeModel),
        newHospitalScore: fitAndScore(base, newBase, makeModel),
      };
    }
    const dev = withLateFeature(base, strength, stream(seed, SALT.extra));
    const fill = mean(dev.X.map((row) => row[row.length - 1]));
    const newHospital = { X: newBase.X.map((row) => [...row, fill]), y: newBase.y };
    return {
      reportedScore: crossValAuc(dev.X, dev.y, folds, makeModel),
      newHospitalScore: fitAndScore(dev, newHospital, makeModel),
    };
  },
  wrongCode: `import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

rng = np.random.default_rng(0)
sepsis = rng.integers(0, 2, 1000)
X = rng.normal(size=(1000, 8)) + 0.5 * sepsis[:, None] * (np.arange(8) < 4)
# Recorded after diagnosis: antibiotics are given because of the outcome
antibiotics = 2 * (2 * sepsis - 1) + rng.normal(size=1000)

# Wrong: the model is allowed to use a column that encodes the answer
X_all = np.column_stack([X, antibiotics])
auc = cross_val_score(LogisticRegression(), X_all, sepsis, cv=5, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
  rightCode: `import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

rng = np.random.default_rng(0)
sepsis = rng.integers(0, 2, 1000)
X = rng.normal(size=(1000, 8)) + 0.5 * sepsis[:, None] * (np.arange(8) < 4)
# Recorded after diagnosis: antibiotics are given because of the outcome
antibiotics = 2 * (2 * sepsis - 1) + rng.normal(size=1000)

# Right: use only what is known at the moment of prediction
auc = cross_val_score(LogisticRegression(), X, sepsis, cv=5, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
});
