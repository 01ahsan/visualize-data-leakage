import { makeNoiseColumns, makeNoiseFeatures, makeRandomLabels } from '../lib/data';
import { rowsFromColumns, takeRows } from '../lib/matrix';
import { mean, rocAuc } from '../lib/metrics';
import { LogisticRegression } from '../lib/models';
import { stream } from '../lib/rng';
import { makeFoldSelector } from '../lib/selection';
import { stratifiedKFold } from '../lib/split';
import { defineScenario, meanFoldAuc, SALT } from './define';

const ROWS = 80;
const SELECTED = 10;
const REPEATS = 16;
const NEW_HOSPITAL_ROWS = 1000;

const makeModel = () => new LogisticRegression({ l2: 0.05, iterations: 100 });

export default defineScenario({
  id: 'feature-selection',
  number: 3,
  title: 'Feature selection on all data',
  oneLiner: 'Features are picked using every row, test rows included.',
  medicalExample:
    '80 patients, 1,000 gene measurements. Keep the 10 genes most correlated with the outcome, then cross-validate.',
  explanation:
    'Every feature is noise and the labels are coin flips, so the true AUC is 0.5. Some features match the labels by chance. Pick them on all rows and cross-validation rewards the chance match. Pick them inside each training fold and the score drops back to 0.5.',
  setup: `${ROWS} rows, random labels, top ${SELECTED} features by correlation, logistic regression, 5-fold cross-validation, averaged over ${REPEATS} studies. New hospital: ${NEW_HOSPITAL_ROWS} rows.`,
  strength: {
    label: 'Candidate features',
    min: 100,
    max: 3000,
    step: 100,
    default: 1000,
    hint: 'More features, more chance matches.',
  },
  evaluate({ leaky, strength, seed }) {
    const p = Math.round(strength);
    const reported: number[] = [];
    const fresh: number[] = [];
    for (let r = 0; r < REPEATS; r++) {
      const columns = makeNoiseColumns(ROWS, p, stream(seed, SALT.data, r));
      const y = makeRandomLabels(ROWS, stream(seed, SALT.data, r, 1));
      const folds = stratifiedKFold(y, 5, stream(seed, SALT.split, r));
      const selector = makeFoldSelector(columns, y, folds);
      const selectedOnAll = selector.topK(SELECTED);
      reported.push(
        meanFoldAuc(y, folds, (train, test) => {
          const cols = leaky ? selectedOnAll : selector.topK(SELECTED, folds.indexOf(test));
          return makeModel()
            .fit(rowsFromColumns(columns, train, cols), takeRows(y, train))
            .predictProba(rowsFromColumns(columns, test, cols));
        }),
      );
      // Final model: select on all rows, fit, apply to new patients. The new
      // features are independent noise, so only the chosen columns are drawn.
      const all = Array.from({ length: ROWS }, (_, i) => i);
      const model = makeModel().fit(rowsFromColumns(columns, all, selectedOnAll), y);
      const newX = makeNoiseFeatures(
        NEW_HOSPITAL_ROWS,
        SELECTED,
        stream(seed, SALT.newHospital, r),
      );
      const newY = makeRandomLabels(NEW_HOSPITAL_ROWS, stream(seed, SALT.newHospital, r, 1));
      fresh.push(rocAuc(newY, model.predictProba(newX)));
    }
    return { reportedScore: mean(reported), newHospitalScore: mean(fresh) };
  },
  wrongCode: `import numpy as np
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

rng = np.random.default_rng(0)
X = rng.normal(size=(80, 1000))   # pure noise
y = rng.integers(0, 2, 80)        # coin-flip labels

# Wrong: the 10 "best" features are chosen using every row, test rows included
X_top = SelectKBest(f_classif, k=10).fit_transform(X, y)
auc = cross_val_score(LogisticRegression(), X_top, y, cv=5, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")  # far above 0.5`,
  rightCode: `import numpy as np
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline

rng = np.random.default_rng(0)
X = rng.normal(size=(80, 1000))   # pure noise
y = rng.integers(0, 2, 80)        # coin-flip labels

# Right: selection is refitted inside each training fold
model = make_pipeline(SelectKBest(f_classif, k=10), LogisticRegression())
auc = cross_val_score(model, X, y, cv=5, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")  # near 0.5`,
});
