import samePatient from './01-same-patient';
import preprocessing from './02-preprocessing';
import featureSelection from './03-feature-selection';
import duplicates from './04-duplicates';
import type { Scenario } from './types';

export const scenarios: Scenario[] = [samePatient, preprocessing, featureSelection, duplicates];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export type { Scenario } from './types';
