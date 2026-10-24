import type { CurvePoint, Evaluation } from '../scenarios/types';

export interface EvalRequest {
  kind: 'eval';
  reqId: number;
  scenarioId: string;
  leaky: boolean;
  strength: number;
  seed: number;
}

export interface CurveRequest {
  kind: 'curve';
  scenarioId: string;
  seed: number;
  /** Modes to compute, in priority order. */
  modes: boolean[];
}

export type WorkerRequest = EvalRequest | CurveRequest;

export type WorkerResponse =
  | { kind: 'eval'; reqId: number; result: Evaluation; ms: number }
  | { kind: 'curve'; key: string; points: CurvePoint[]; done: boolean };

export const curveKey = (scenarioId: string, leaky: boolean, seed: number) =>
  `${scenarioId}|${leaky ? 'leaky' : 'correct'}|${seed}`;
