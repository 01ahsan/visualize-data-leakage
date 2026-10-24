import { makeTabular, type Dataset } from '../lib/data';
import { takeRows } from '../lib/matrix';
import { mean, rocAuc } from '../lib/metrics';
import { LogisticRegression } from '../lib/models';
import { fitImputeScale } from '../lib/preprocess';
import { stream, type Rng } from '../lib/rng';
import { stratifiedKFold } from '../lib/split';
import { defineScenario, meanFoldAuc, SALT } from './define';

const INFORMATIVE = 4;
const NOISE = 6;
const SIGNAL = 0.5;
const MISSING = 0.2;
/** Rows simulated in total across repeated studies, so precision is similar at every size. */
const TOTAL_ROWS = 1600;
const NEW_HOSPITAL_ROWS = 1000;

const makeModel = () => new LogisticRegression({ l2: 0.05, iterations: 100 });

/** Raw clinical-style columns: different units and offsets, with values missing at random. */
function makeRaw(n: number, rng: Rng): Dataset {
  const d = makeTabular({ n, informative: INFORMATIVE, noise: NOISE, signal: SIGNAL }, rng);
  const X = d.X.map((row) =>
    row.map((v, j) => (rng() < MISSING ? NaN : v * 10 ** (j % 3) + 50 * (j % 2))),
  );
  return { X, y: d.y };
}

export default defineScenario({
  id: 'preprocessing',
  number: 2,
  title: 'Preprocessing on all data',
  oneLiner: 'Imputation and scaling are fitted before the data is split.',
  medicalExample:
    'Lab values with gaps are filled with the column mean and standardised for the whole cohort, and only then split into training and test sets.',
  explanation:
    'Fitting the imputer and scaler on every row lets the test rows shape the means and standard deviations used in training. That is a real leak, but for mean imputation and scaling it carries very little information. In this simulation the leaky and correct versions differ by less than one point of AUC, even with 20 rows. The larger swings you see are ordinary sampling noise and small-sample pessimism of cross-validation, and they are the same in both modes. Other preprocessing leaks far more (see scenario 3). Use a Pipeline anyway: the fix costs nothing and protects you when a later step is less harmless.',
  setup: `Logistic regression with mean imputation and scaling, 5-fold cross-validation, averaged over repeated studies of the chosen size (${TOTAL_ROWS} rows in total). New hospital: ${NEW_HOSPITAL_ROWS} rows.`,
  strength: {
    label: 'Rows in the study',
    min: 20,
    max: 320,
    step: 10,
    default: 40,
    hint: 'Fewer rows give the test fold more weight in the shared statistics.',
  },
  evaluate({ leaky, strength, seed }) {
    const n = Math.round(strength);
    const repeats = Math.ceil(TOTAL_ROWS / n);
    const newHospital = makeRaw(NEW_HOSPITAL_ROWS, stream(seed, SALT.newHospital));
    const reported: number[] = [];
    const fresh: number[] = [];
    for (let r = 0; r < repeats; r++) {
      const dev = makeRaw(n, stream(seed, SALT.data, r));
      const folds = stratifiedKFold(dev.y, 5, stream(seed, SALT.split, r));
      const leakyX = leaky ? fitImputeScale(dev.X).transform(dev.X) : null;
      const score = meanFoldAuc(dev.y, folds, (train, test) => {
        const trainY = takeRows(dev.y, train);
        if (leakyX) {
          return makeModel()
            .fit(takeRows(leakyX, train), trainY)
            .predictProba(takeRows(leakyX, test));
        }
        const prep = fitImputeScale(takeRows(dev.X, train));
        return makeModel()
          .fit(prep.transform(takeRows(dev.X, train)), trainY)
          .predictProba(prep.transform(takeRows(dev.X, test)));
      });
      reported.push(score);
      // The final model is fitted on the whole study, then used unchanged.
      const prep = fitImputeScale(dev.X);
      const model = makeModel().fit(prep.transform(dev.X), dev.y);
      fresh.push(rocAuc(newHospital.y, model.predictProba(prep.transform(newHospital.X))));
    }
    return { reportedScore: mean(reported), newHospitalScore: mean(fresh) };
  },
  wrongCode: `import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(0)
y = rng.integers(0, 2, 40)
X = rng.normal(size=(40, 10)) + 0.5 * y[:, None] * (np.arange(10) < 4)
X[rng.random(X.shape) < 0.2] = np.nan

# Wrong: imputer and scaler see the test rows before the split
X_prep = StandardScaler().fit_transform(SimpleImputer().fit_transform(X))
auc = cross_val_score(LogisticRegression(), X_prep, y, cv=5, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
  rightCode: `import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(0)
y = rng.integers(0, 2, 40)
X = rng.normal(size=(40, 10)) + 0.5 * y[:, None] * (np.arange(10) < 4)
X[rng.random(X.shape) < 0.2] = np.nan

# Right: the pipeline refits imputer and scaler inside each training fold
model = make_pipeline(SimpleImputer(), StandardScaler(), LogisticRegression())
auc = cross_val_score(model, X, y, cv=5, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
});
