import { makePatients } from '../lib/data';
import { KNearestNeighbors } from '../lib/models';
import { stream } from '../lib/rng';
import { groupKFold, stratifiedKFold } from '../lib/split';
import { crossValAuc, defineScenario, fitAndScore, SALT } from './define';

/** Visits in the study; the number of patients is this divided by visits per patient. */
const VISITS_TOTAL = 1600;
const NEW_HOSPITAL_VISITS = 1200;
const DIMS = 8;
const SIGNAL = 1.2;
const RECORD_NOISE = 0.15;

const makeModel = () => new KNearestNeighbors({ k: 10 });

export default defineScenario({
  id: 'same-patient',
  number: 1,
  title: 'Same patient in train and test',
  oneLiner: 'Records from one person end up on both sides of the split.',
  medicalExample:
    'A hospital has several visits per patient. Splitting visits at random puts some of a patient’s visits in training and others in testing.',
  explanation:
    'Visits from the same person look alike, so a model can recognise the patient instead of learning the disease. k-nearest neighbours does exactly that: the closest training rows to a test visit are that patient’s other visits, which carry the same diagnosis. The random split rewards this memory, and the score drops on patients the model has never seen. Split by patient (GroupKFold) so each person is entirely in training or entirely in testing. With one visit per patient there is nothing to memorise and both splits agree.',
  setup: `${VISITS_TOTAL} visits (fewer patients when each has more visits), 8 features, k-NN (k = 10), 5-fold cross-validation. New hospital: ${NEW_HOSPITAL_VISITS} visits from new patients.`,
  strength: {
    label: 'Visits per patient',
    min: 1,
    max: 8,
    step: 1,
    default: 4,
    hint: 'More visits per patient give the model more chances to recognise a person.',
  },
  evaluate({ leaky, strength, seed }) {
    const visits = Math.round(strength);
    const opts = {
      dims: DIMS,
      signal: SIGNAL,
      recordNoise: RECORD_NOISE,
      recordsPerPatient: visits,
    };
    const dev = makePatients(
      { ...opts, nPatients: Math.round(VISITS_TOTAL / visits) },
      stream(seed, SALT.data),
    );
    const folds = leaky
      ? stratifiedKFold(dev.y, 5, stream(seed, SALT.split))
      : groupKFold(dev.groups as number[], 5, stream(seed, SALT.split));
    const reportedScore = crossValAuc(dev.X, dev.y, folds, makeModel);
    const newHospital = makePatients(
      { ...opts, nPatients: Math.round(NEW_HOSPITAL_VISITS / visits), firstId: 1_000_000 },
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
