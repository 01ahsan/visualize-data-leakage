import { useEffect, useRef, useState } from 'react';
import type { CurvePoint, Evaluation } from '../scenarios/types';
import { curveKey, type WorkerRequest, type WorkerResponse } from './protocol';

let worker: Worker | null = null;
const listeners = new Set<(msg: WorkerResponse) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => listeners.forEach((l) => l(e.data));
  }
  return worker;
}

const send = (msg: WorkerRequest) => getWorker().postMessage(msg);

let nextReqId = 1;

export interface SimulationState {
  result: Evaluation | null;
  /** True while the shown result is for an older setting. */
  pending: boolean;
  /** Milliseconds the last evaluation took. */
  ms: number | null;
  leakyCurve: CurvePoint[];
  correctCurve: CurvePoint[];
}

export function useSimulation(
  scenarioId: string,
  leaky: boolean,
  strength: number,
  seed: number,
): SimulationState {
  const latestReq = useRef(0);
  const [evalState, setEvalState] = useState<{ reqId: number; result: Evaluation; ms: number }>();
  const [curves, setCurves] = useState<Record<string, CurvePoint[]>>({});

  useEffect(() => {
    const onMessage = (msg: WorkerResponse) => {
      if (msg.kind === 'eval') {
        if (msg.reqId === latestReq.current) setEvalState(msg);
      } else {
        setCurves((prev) => ({ ...prev, [msg.key]: msg.points }));
      }
    };
    listeners.add(onMessage);
    return () => {
      listeners.delete(onMessage);
    };
  }, []);

  useEffect(() => {
    const reqId = nextReqId++;
    latestReq.current = reqId;
    send({ kind: 'eval', reqId, scenarioId, leaky, strength, seed });
  }, [scenarioId, leaky, strength, seed]);

  useEffect(() => {
    // Current mode first, so its line appears first.
    send({ kind: 'curve', scenarioId, seed, modes: [leaky, !leaky] });
    // The mode only sets priority; changing it must not restart the curves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, seed]);

  return {
    result: evalState?.result ?? null,
    pending: evalState?.reqId !== latestReq.current,
    ms: evalState?.ms ?? null,
    leakyCurve: curves[curveKey(scenarioId, true, seed)] ?? [],
    correctCurve: curves[curveKey(scenarioId, false, seed)] ?? [],
  };
}
