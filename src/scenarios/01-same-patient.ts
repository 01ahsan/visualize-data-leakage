import { makePatients } from '../lib/data';
import { KNearestNeighbors } from '../lib/models';
import { stream } from '../lib/rng';
import { groupKFold, stratifiedKFold } from '../lib/split';
import { crossValAuc, defineScenario, fitAndScore, SALT } from './define';

const PATIENTS = 350;
const NEW_PATIENTS = 300;
const DIMS = 8;
const SIGNAL = 1.2;
const RECORD_NOISE = 0.15;

const makeModel = () => new KNearestNeighbors({ k: 10 });

export default defineScenario({
  id: 'same-patient',
  number: 1,
  title: 'Same patient in train and test',
  oneLiner: 'Visits from one patient land in both train and test.',
  medicalExample: 'A hospital has several visits per patient and splits the visits at random.',
  explanation:
    'Visits from one patient look alike. With a random split, the model finds the same patient’s other visits in training and copies their diagnosis. On new patients that trick fails. Split by patient with GroupKFold. With one visit per patient, both splits agree.',
  setup: `${PATIENTS} patients, 8 features, k-NN (k = 10), 5-fold cross-validation. New hospital: ${NEW_PATIENTS} new patients.`,
  strength: {
    label: 'Visits per patient',
    min: 1,
    max: 6,
    step: 1,
    default: 4,
    hint: 'More visits per patient, more to memorise.',
  },
  evaluate({ leaky, strength, seed }) {
    const visits = Math.round(strength);
    const opts = {
      dims: DIMS,
      signal: SIGNAL,
      recordNoise: RECORD_NOISE,
      recordsPerPatient: visits,
    };
    const dev = makePatients({ ...opts, nPatients: PATIENTS }, stream(seed, SALT.data));
    const folds = leaky
      ? stratifiedKFold(dev.y, 5, stream(seed, SALT.split))
      : groupKFold(dev.groups as number[], 5, stream(seed, SALT.split));
    const reportedScore = crossValAuc(dev.X, dev.y, folds, makeModel);
    const newHospital = makePatients(
      { ...opts, nPatients: NEW_PATIENTS, firstId: 1_000_000 },
      stream(seed, SALT.newHospital),
    );
    return { reportedScore, newHospitalScore: fitAndScore(dev, newHospital, makeModel) };
  },
  wrongCode: `import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.neighbors import KNeighborsClassifier

rng = np.random.default_rng(0)
patients, visits = 300, 4
signature = rng.normal(size=(patients, 8))
diagnosis = (1.2 * signature[:, 0] + rng.normal(size=patients) > 0).astype(int)
X = np.repeat(signature, visits, axis=0) + rng.normal(0, 0.15, (patients * visits, 8))
y = np.repeat(diagnosis, visits)

# Wrong: visits are split at random, so one patient sits in train and test
cv = StratifiedKFold(5, shuffle=True, random_state=0)
auc = cross_val_score(KNeighborsClassifier(10), X, y, cv=cv, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
  rightCode: `import numpy as np
from sklearn.model_selection import GroupKFold, cross_val_score
from sklearn.neighbors import KNeighborsClassifier

rng = np.random.default_rng(0)
patients, visits = 300, 4
signature = rng.normal(size=(patients, 8))
diagnosis = (1.2 * signature[:, 0] + rng.normal(size=patients) > 0).astype(int)
X = np.repeat(signature, visits, axis=0) + rng.normal(0, 0.15, (patients * visits, 8))
y = np.repeat(diagnosis, visits)
groups = np.repeat(np.arange(patients), visits)

# Right: every patient is entirely in train or entirely in test
cv = GroupKFold(5)
auc = cross_val_score(KNeighborsClassifier(10), X, y, groups=groups, cv=cv, scoring="roc_auc")
print(f"Reported AUC: {auc.mean():.2f}")`,
});
