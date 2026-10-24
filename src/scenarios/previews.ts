/**
 * Leaky-mode scores at default settings (seed 42), shown on the home page
 * without running any simulation. tests/scenarios.test.ts checks that these
 * match the simulations; regenerate them if a scenario changes.
 */
export const PREVIEW_SEED = 42;

export const previews: Record<string, { reported: number; newHospital: number }> = {
  'same-patient': { reported: 0.9093, newHospital: 0.7341 },
  preprocessing: { reported: 0.6376, newHospital: 0.6496 },
  'feature-selection': { reported: 0.8925, newHospital: 0.5049 },
  duplicates: { reported: 0.907, newHospital: 0.7916 },
  'target-leakage': { reported: 0.9991, newHospital: 0.7674 },
  'time-leakage': { reported: 0.8698, newHospital: 0.7549 },
  'test-set-tuning': { reported: 0.6784, newHospital: 0.6187 },
  oversampling: { reported: 0.9924, newHospital: 0.838 },
};
