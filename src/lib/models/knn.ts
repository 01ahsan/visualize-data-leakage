import type { Matrix } from '../matrix';
import type { Classifier } from './types';

export interface KnnOptions {
  k?: number;
  /** Weight neighbours by 1 / distance, like scikit-learn's weights="distance". */
  distanceWeighted?: boolean;
}

const LEAF_SIZE = 24;
/** Above this many features a k-d tree stops paying off and a plain scan is used. */
const TREE_MAX_DIMS = 4;

interface KdNode {
  /** Range [lo, hi) of points (in tree order) under this node. */
  lo: number;
  hi: number;
  dim: number;
  split: number;
  left: KdNode | null;
  right: KdNode | null;
}

/**
 * k-nearest neighbours classifier with Euclidean distance. Neighbours are
 * found exactly: with a k-d tree for low-dimensional data, else by a full scan.
 */
export class KNearestNeighbors implements Classifier {
  /** Training points packed in tree order. */
  private flat = new Float64Array(0);
  /** Label of each point in tree order. */
  private labels = new Float64Array(0);
  private p = 0;
  private root: KdNode | null = null;
  private readonly k: number;
  private readonly distanceWeighted: boolean;

  constructor({ k = 5, distanceWeighted = false }: KnnOptions = {}) {
    this.k = k;
    this.distanceWeighted = distanceWeighted;
  }

  fit(X: Matrix, y: readonly number[]): this {
    const n = X.length;
    const p = X[0]?.length ?? 0;
    this.p = p;
    const order = Array.from({ length: n }, (_, i) => i);
    this.root = n ? this.build(X, order, 0, n) : null;
    this.flat = new Float64Array(n * p);
    this.labels = new Float64Array(n);
    order.forEach((src, pos) => {
      this.flat.set(X[src], pos * p);
      this.labels[pos] = y[src];
    });
    return this;
  }

  private build(X: Matrix, order: number[], lo: number, hi: number): KdNode {
    const node: KdNode = { lo, hi, dim: 0, split: 0, left: null, right: null };
    if (hi - lo <= LEAF_SIZE || this.p > TREE_MAX_DIMS) return node;
    // Split on the dimension with the widest spread, at the median.
    let bestSpread = -1;
    for (let j = 0; j < this.p; j++) {
      let min = Infinity;
      let max = -Infinity;
      for (let i = lo; i < hi; i++) {
        const v = X[order[i]][j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (max - min > bestSpread) {
        bestSpread = max - min;
        node.dim = j;
      }
    }
    const dim = node.dim;
    const part = order.slice(lo, hi).sort((a, b) => X[a][dim] - X[b][dim]);
    for (let i = 0; i < part.length; i++) order[lo + i] = part[i];
    const mid = (lo + hi) >> 1;
    node.split = X[order[mid]][dim];
    node.left = this.build(X, order, lo, mid);
    node.right = this.build(X, order, mid, hi);
    return node;
  }

  predictProba(Q: Matrix): number[] {
    const n = this.labels.length;
    const k = Math.min(this.k, n);
    const { p, flat } = this;
    const bestD = new Float64Array(k);
    const bestI = new Int32Array(k);
    const q = new Float64Array(p);

    const scanLeaf = (lo: number, hi: number) => {
      for (let i = lo, base = lo * p; i < hi; i++, base += p) {
        let d = 0;
        for (let j = 0; j < p; j++) {
          const diff = flat[base + j] - q[j];
          d += diff * diff;
        }
        if (d < bestD[k - 1]) {
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
    };

    const search = (node: KdNode) => {
      if (!node.left || !node.right) {
        scanLeaf(node.lo, node.hi);
        return;
      }
      const diff = q[node.dim] - node.split;
      const [near, far] = diff < 0 ? [node.left, node.right] : [node.right, node.left];
      search(near);
      if (diff * diff <= bestD[k - 1]) search(far);
    };

    return Q.map((row) => {
      if (!this.root) return 0.5;
      q.set(row);
      bestD.fill(Infinity);
      search(this.root);
      let num = 0;
      let den = 0;
      for (let m = 0; m < k; m++) {
        const w = this.distanceWeighted ? 1 / (Math.sqrt(bestD[m]) + 1e-3) : 1;
        num += w * this.labels[bestI[m]];
        den += w;
      }
      return den ? num / den : 0.5;
    });
  }
}
