export interface StrengthParam {
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Format a value for display, e.g. as a percentage. */
  format?: (value: number) => string;
  /** Short note on what moving the slider does. */
  hint: string;
}

export interface RunInput {
  leaky: boolean;
  strength: number;
  seed: number;
}

export interface Evaluation {
  /** The score the analysis would report (ROC AUC). */
  reportedScore: number;
  /** The score of the final model on an independently generated "new hospital". */
  newHospitalScore: number;
}

export interface CurvePoint {
  strength: number;
  /** reportedScore minus newHospitalScore. */
  gap: number;
}

export interface RunResult extends Evaluation {
  /** The gap across the strength range, for the same mode and seed. */
  curve: CurvePoint[];
}

export interface ScenarioDefinition {
  id: string;
  number: number;
  title: string;
  oneLiner: string;
  medicalExample: string;
  /** Plain-language explanation, under 120 words. */
  explanation: string;
  /** The model and validation setup used in the simulation. */
  setup: string;
  strength: StrengthParam;
  /** Score for one setting. Must be deterministic in (leaky, strength, seed). */
  evaluate(input: RunInput): Evaluation;
  wrongCode: string;
  rightCode: string;
}

export interface Scenario extends ScenarioDefinition {
  run(input: RunInput): RunResult;
  curve(leaky: boolean, seed: number): CurvePoint[];
  curveStrengths(): number[];
}
