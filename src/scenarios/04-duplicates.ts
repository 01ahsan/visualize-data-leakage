import { makeTabular } from '../lib/data';
import { KNearestNeighbors } from '../lib/models';
import { normal, permutation, stream } from '../lib/rng';
import { stratifiedKFold } from '../lib/split';
import { crossValAuc, defineScenario, fitAndScore, percent, SALT } from './define';

const ROWS = 1000;
const NEW_HOSPITAL_ROWS = 1500;
const TABULAR = { informative: 4, noise: 2, signal: 0.7 };
/** Duplicates differ from the original by a tiny amount, like a re-entered record. */
const JITTER = 0.01;

const makeModel = () => new KNearestNeighbors({ k: 15, distanceWeighted: true });

export default defineScenario({
  id: 'duplicates',
  number: 4,
  title: 'Duplicate records',
  oneLiner: 'Copies of a record sit in both train and test.',
  medicalExample: 'Two record systems are merged, and some admissions appear twice.',
  explanation:
    'A test row with a copy in training is easy. The model reads the copy’s label. New patients have no copies. Remove duplicates before splitting, or keep each record and its copies in the same fold.',
  setup: `${ROWS} original rows, 6 features, distance-weighted k-NN (k = 15), 5-fold cross-validation. New hospital: ${NEW_HOSPITAL_ROWS} rows without duplicates.`,
  strength: {
    label: 'Rows duplicated',
    min: 0,
    max: 0.6,
    step: 0.05,
    default: 0.3,
    format: percent,
    hint: 'More copies, more test rows with a twin in training.',
  },
  evaluate({ leaky, strength, seed }) {
    const base = makeTabular({ n: ROWS, ...TABULAR }, stream(seed, SALT.data));
    const rng = stream(seed, SALT.extra);
    const copies = permutation(ROWS, rng).slice(0, Math.round(strength * ROWS));
    const dev = {
      X: [...base.X, ...copies.map((i) => base.X[i].map((v) => v + normal(rng, 0, JITTER)))],
      y: [...base.y, ...copies.map((i) => base.y[i])],
    };
    // The correct workflow removes the copies first.
    const data = leaky ? dev : base;
    const folds = stratifiedKFold(data.y, 5, stream(seed, SALT.split));
    const reportedScore = crossValAuc(data.X, data.y, folds, makeModel);
    const newHospital = makeTabular(
      { n: NEW_HOSPITAL_ROWS, ...TABULAR },
      stream(seed, SALT.newHospital),
    );
    return { reportedScore, newHospitalScore: fitAndScore(data, newHospital, makeModel) };
  },
  wrongCode: `import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.neighbors import KNeighborsClassifier

rng = np.random.default_rng(0)
y = rng.integers(0, 2, 1000)
X = rng.normal(size=(1000, 6)) + 0.7 * y[:, None] * (np.arange(6) < 4)
ids = np.arange(1000)
dup = rng.choice(1000, 300, replace=False)          # 30% re-entered records
X = np.vstack([X, X[dup] + rng.normal(0, 0.01, (300, 6))])
y, ids = np.concatenate([y, y[dup]]), np.concatenate([ids, ids[dup]])

# Wrong: copies of the same record fall into train and test
knn = KNeighborsClassifier(15, weights="distance")
cv = StratifiedKFold(5, shuffle=True, random_state=0)
auc = cross_val_score(knn, X, y, cv=cv, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
  rightCode: `import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.neighbors import KNeighborsClassifier

rng = np.random.default_rng(0)
y = rng.integers(0, 2, 1000)
X = rng.normal(size=(1000, 6)) + 0.7 * y[:, None] * (np.arange(6) < 4)
ids = np.arange(1000)
dup = rng.choice(1000, 300, replace=False)          # 30% re-entered records
X = np.vstack([X, X[dup] + rng.normal(0, 0.01, (300, 6))])
y, ids = np.concatenate([y, y[dup]]), np.concatenate([ids, ids[dup]])

# Right: keep one row per record id before splitting
_, first = np.unique(ids, return_index=True)
X, y = X[first], y[first]
knn = KNeighborsClassifier(15, weights="distance")
cv = StratifiedKFold(5, shuffle=True, random_state=0)
auc = cross_val_score(knn, X, y, cv=cv, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
});
