import samePatient from './01-same-patient';
import preprocessing from './02-preprocessing';
import featureSelection from './03-feature-selection';
import duplicates from './04-duplicates';
import targetLeakage from './05-target-leakage';
import timeLeakage from './06-time-leakage';
import testSetTuning from './07-test-set-tuning';
import oversampling from './08-oversampling';
import type { Scenario } from './types';

export const scenarios: Scenario[] = [
  samePatient,
  preprocessing,
  featureSelection,
  duplicates,
  targetLeakage,
  timeLeakage,
  testSetTuning,
  oversampling,
];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export type { Scenario } from './types';
