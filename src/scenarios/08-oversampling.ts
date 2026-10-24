import { makeTabular, type Dataset } from '../lib/data';
import { takeRows } from '../lib/matrix';
import { KNearestNeighbors } from '../lib/models';
import { randInt, stream, type Rng } from '../lib/rng';
import { stratifiedKFold } from '../lib/split';
import { crossValAuc, defineScenario, fitAndScore, meanFoldAuc, percent, SALT } from './define';

const ROWS = 1000;
const NEW_HOSPITAL_ROWS = 1000;
const PREVALENCE = 0.15;
const TABULAR = { informative: 4, noise: 2, signal: 0.8, prevalence: PREVALENCE };

const makeModel = () => new KNearestNeighbors({ k: 15, distanceWeighted: true });

/** Random oversampling: copy minority rows until minority / majority reaches `ratio`. */
function oversample(d: Dataset, ratio: number, rng: Rng): Dataset {
  const minority = d.y.flatMap((v, i) => (v === 1 ? [i] : []));
  const majority = d.y.length - minority.length;
  const extra = Math.max(0, Math.round(ratio * majority) - minority.length);
  const copies = Array.from({ length: extra }, () => minority[randInt(rng, minority.length)]);
  return { X: [...d.X, ...takeRows(d.X, copies)], y: [...d.y, ...copies.map(() => 1)] };
}

export default defineScenario({
  id: 'oversampling',
  number: 8,
  title: 'Oversampling before splitting',
  oneLiner: 'Copies of rare cases are made first, so copies end up in the test set.',
  medicalExample:
    'Only 15% of patients have the rare complication, so the minority rows are duplicated until the classes are balanced, and only then is the data split for cross-validation.',
  explanation:
    'Random oversampling copies minority rows. If you oversample before splitting, most rare cases in a test fold have identical copies in the training folds, and a model that looks at close neighbours simply recognises them. The reported score jumps, but new patients have no copies anywhere. Oversample (or use SMOTE) inside each training fold only, so test folds keep the real class balance and contain no copies. The more you oversample, the more copies leak across the split.',
  setup: `${ROWS} rows with ${percent(PREVALENCE)} positives, 6 features, distance-weighted k-NN (k = 15), stratified 5-fold cross-validation. New hospital: ${NEW_HOSPITAL_ROWS} rows at the real class balance.`,
  strength: {
    label: 'Minority size after oversampling (share of majority)',
    min: 0.15,
    max: 1,
    step: 0.05,
    default: 1,
    format: percent,
    hint: 'More oversampling means more copies of each rare case on both sides of the split.',
  },
  evaluate({ leaky, strength, seed }) {
    const base = makeTabular({ n: ROWS, ...TABULAR }, stream(seed, SALT.data));
    const rng = stream(seed, SALT.extra);
    const newHospital = makeTabular(
      { n: NEW_HOSPITAL_ROWS, ...TABULAR },
      stream(seed, SALT.newHospital),
    );
    const newHospitalScore = fitAndScore(oversample(base, strength, rng), newHospital, makeModel);
    if (leaky) {
      const dev = oversample(base, strength, rng);
      const folds = stratifiedKFold(dev.y, 5, stream(seed, SALT.split));
      return { reportedScore: crossValAuc(dev.X, dev.y, folds, makeModel), newHospitalScore };
    }
    const folds = stratifiedKFold(base.y, 5, stream(seed, SALT.split));
    const reportedScore = meanFoldAuc(base.y, folds, (train, test) => {
      const balanced = oversample(
        { X: takeRows(base.X, train), y: takeRows(base.y, train) },
        strength,
        rng,
      );
      return makeModel().fit(balanced.X, balanced.y).predictProba(takeRows(base.X, test));
    });
    return { reportedScore, newHospitalScore };
  },
  wrongCode: `import numpy as np
from sklearn.model_selection import cross_val_score
from sklearn.neighbors import KNeighborsClassifier
from sklearn.utils import resample

rng = np.random.default_rng(0)
y = (rng.random(1000) < 0.15).astype(int)         # 15% rare complication
X = rng.normal(size=(1000, 6)) + 0.8 * y[:, None] * (np.arange(6) < 4)

# Wrong: copies of rare cases are made before the split
extra = resample(X[y == 1], n_samples=(y == 0).sum() - (y == 1).sum(), random_state=0)
X_bal, y_bal = np.vstack([X, extra]), np.concatenate([y, np.ones(len(extra), int)])
knn = KNeighborsClassifier(15, weights="distance")
auc = cross_val_score(knn, X_bal, y_bal, cv=5, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
  rightCode: `import numpy as np
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.neighbors import KNeighborsClassifier
from sklearn.utils import resample

rng = np.random.default_rng(0)
y = (rng.random(1000) < 0.15).astype(int)         # 15% rare complication
X = rng.normal(size=(1000, 6)) + 0.8 * y[:, None] * (np.arange(6) < 4)

# Right: oversample inside each training fold; test folds stay untouched
aucs = []
for tr, te in StratifiedKFold(5, shuffle=True, random_state=0).split(X, y):
    Xt, yt = X[tr], y[tr]
    extra = resample(Xt[yt == 1], n_samples=(yt == 0).sum() - (yt == 1).sum(), random_state=0)
    knn = KNeighborsClassifier(15, weights="distance")
    knn.fit(np.vstack([Xt, extra]), np.concatenate([yt, np.ones(len(extra), int)]))
    aucs.append(roc_auc_score(y[te], knn.predict_proba(X[te])[:, 1]))
print(f"Reported AUC: {np.mean(aucs):.2f}")`,
});
