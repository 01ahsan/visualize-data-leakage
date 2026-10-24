import type { Matrix } from '../matrix';

export interface Dataset {
  X: Matrix;
  y: number[];
  /** Optional group id per row (for example, patient id). */
  groups?: number[];
  /** Optional timestamp per row. */
  time?: number[];
}
