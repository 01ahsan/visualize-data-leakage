import { getScenario } from '../scenarios';
import type { CurvePoint } from '../scenarios/types';
import {
  curveKey,
  type CurveRequest,
  type EvalRequest,
  type WorkerRequest,
  type WorkerResponse,
} from './protocol';

/**
 * Runs simulations off the main thread. Only the newest evaluation request is
 * kept, so dragging the slider never builds a backlog. Curves are computed
 * one point at a time between evaluations and cached per scenario, mode and seed.
 */
const ctx = self as unknown as {
  postMessage(message: WorkerResponse): void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

let latestEval: EvalRequest | null = null;
let curveJobs: { scenarioId: string; seed: number; leaky: boolean }[] = [];
const curves = new Map<string, CurvePoint[]>();
let scheduled = false;

function schedule() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(step, 0);
}

function step() {
  scheduled = false;
  if (latestEval) {
    const req = latestEval;
    latestEval = null;
    const scenario = getScenario(req.scenarioId);
    if (scenario) {
      const t = performance.now();
      const result = scenario.evaluate(req);
      ctx.postMessage({ kind: 'eval', reqId: req.reqId, result, ms: performance.now() - t });
    }
    schedule();
    return;
  }
  const job = curveJobs[0];
  if (!job) return;
  const scenario = getScenario(job.scenarioId);
  const key = curveKey(job.scenarioId, job.leaky, job.seed);
  const points = curves.get(key) ?? [];
  const strengths = scenario?.curveStrengths() ?? [];
  if (scenario && points.length < strengths.length) {
    const strength = strengths[points.length];
    const e = scenario.evaluate({ leaky: job.leaky, strength, seed: job.seed });
    points.push({ strength, gap: e.reportedScore - e.newHospitalScore });
    curves.set(key, points);
    const done = points.length === strengths.length;
    ctx.postMessage({ kind: 'curve', key, points: points.slice(), done });
  }
  if (!scenario || points.length >= strengths.length) curveJobs.shift();
  schedule();
}

function requestCurves(req: CurveRequest) {
  // A new page replaces any queued work for other scenarios or seeds.
  curveJobs = [];
  for (const leaky of req.modes) {
    const key = curveKey(req.scenarioId, leaky, req.seed);
    const points = curves.get(key);
    const total = getScenario(req.scenarioId)?.curveStrengths().length ?? 0;
    if (points)
      ctx.postMessage({
        kind: 'curve',
        key,
        points: points.slice(),
        done: points.length === total,
      });
    if (!points || points.length < total)
      curveJobs.push({ scenarioId: req.scenarioId, seed: req.seed, leaky });
  }
}

ctx.onmessage = (event) => {
  const msg = event.data;
  if (msg.kind === 'eval') latestEval = msg;
  else requestCurves(msg);
  schedule();
};
