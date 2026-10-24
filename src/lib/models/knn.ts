import type { Matrix } from '../matrix';
import type { Classifier } from './types';

export interface KnnOptions {
  k?: number;
  /** Weight neighbours by 1 / distance, like scikit-learn's weights="distance". */
  distanceWeighted?: boolean;
}

/** k-nearest neighbours classifier with Euclidean distance. */
export class KNearestNeighbors implements Classifier {
  private X: Matrix = [];
  private y: readonly number[] = [];
  private readonly k: number;
  private readonly distanceWeighted: boolean;

  constructor({ k = 5, distanceWeighted = false }: KnnOptions = {}) {
    this.k = k;
    this.distanceWeighted = distanceWeighted;
  }

  fit(X: Matrix, y: readonly number[]): this {
    this.X = X;
    this.y = y;
    return this;
  }

  predictProba(Q: Matrix): number[] {
    const n = this.X.length;
    const k = Math.min(this.k, n);
    const bestD = new Float64Array(k);
    const bestI = new Int32Array(k);
    return Q.map((q) => {
      bestD.fill(Infinity);
      const p = q.length;
      for (let i = 0; i < n; i++) {
        const row = this.X[i];
        let d = 0;
        for (let j = 0; j < p; j++) {
          const diff = row[j] - q[j];
          d += diff * diff;
        }
        if (d < bestD[k - 1]) {
          // Insert into the sorted top-k list.
          let pos = k - 1;
          while (pos > 0 && bestD[pos - 1] > d) {
            bestD[pos] = bestD[pos - 1];
            bestI[pos] = bestI[pos - 1];
            pos--;
          }
          bestD[pos] = d;
          bestI[pos] = i;
        }
      }
      let num = 0;
      let den = 0;
      for (let m = 0; m < k; m++) {
        const w = this.distanceWeighted ? 1 / (Math.sqrt(bestD[m]) + 1e-3) : 1;
        num += w * this.y[bestI[m]];
        den += w;
      }
      return den ? num / den : 0.5;
    });
  }
}
