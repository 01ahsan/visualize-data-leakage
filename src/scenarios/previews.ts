/**
 * Scores at default settings (seed 42) for both workflows, shown on the home
 * page without running a simulation. tests/scenarios.test.ts checks that these
 * match the simulations; regenerate them if a scenario changes.
 */
export const PREVIEW_SEED = 42;

export interface PreviewScores {
  reported: number;
  newHospital: number;
}

export const previews: Record<string, { leaky: PreviewScores; correct: PreviewScores }> = {
  'same-patient': {
    leaky: { reported: 0.9093, newHospital: 0.7341 },
    correct: { reported: 0.7632, newHospital: 0.7341 },
  },
  preprocessing: {
    leaky: { reported: 0.6376, newHospital: 0.6496 },
    correct: { reported: 0.6362, newHospital: 0.6496 },
  },
  'feature-selection': {
    leaky: { reported: 0.8925, newHospital: 0.5049 },
    correct: { reported: 0.5069, newHospital: 0.5049 },
  },
  duplicates: {
    leaky: { reported: 0.907, newHospital: 0.7916 },
    correct: { reported: 0.8135, newHospital: 0.8046 },
  },
  'target-leakage': {
    leaky: { reported: 0.9991, newHospital: 0.7674 },
    correct: { reported: 0.7541, newHospital: 0.7667 },
  },
  'time-leakage': {
    leaky: { reported: 0.8698, newHospital: 0.7549 },
    correct: { reported: 0.7647, newHospital: 0.7549 },
  },
  'test-set-tuning': {
    leaky: { reported: 0.6784, newHospital: 0.6187 },
    correct: { reported: 0.6108, newHospital: 0.6131 },
  },
  oversampling: {
    leaky: { reported: 0.9924, newHospital: 0.838 },
    correct: { reported: 0.8095, newHospital: 0.838 },
  },
};
