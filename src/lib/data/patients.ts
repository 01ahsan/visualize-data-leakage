import { normal, type Rng } from '../rng';
import type { Dataset } from './types';

export interface PatientOptions {
  nPatients: number;
  recordsPerPatient: number;
  dims: number;
  /** How strongly the label depends on the first general feature. */
  signal: number;
  /** Spread of a patient's records around their personal signature. */
  recordNoise: number;
  /** First patient id, so different cohorts never share ids. */
  firstId?: number;
}

/**
 * Patients with several records each. Every record sits close to a
 * patient-specific signature, and the label (a per-patient diagnosis)
 * depends only weakly on the general features.
 */
export function makePatients(
  { nPatients, recordsPerPatient, dims, signal, recordNoise, firstId = 0 }: PatientOptions,
  rng: Rng,
): Dataset {
  const X: number[][] = [];
  const y: number[] = [];
  const groups: number[] = [];
  for (let p = 0; p < nPatients; p++) {
    const signature = Array.from({ length: dims }, () => normal(rng));
    const label = signal * signature[0] + normal(rng) > 0 ? 1 : 0;
    for (let r = 0; r < recordsPerPatient; r++) {
      X.push(signature.map((s) => s + normal(rng, 0, recordNoise)));
      y.push(label);
      groups.push(firstId + p);
    }
  }
  return { X, y, groups };
}
