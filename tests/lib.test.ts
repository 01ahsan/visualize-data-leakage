import { describe, expect, it } from 'vitest';
import { makeTabular } from '../src/lib/data';
import { accuracy, rocAuc } from '../src/lib/metrics';
import { KNearestNeighbors, LogisticRegression } from '../src/lib/models';
import { mulberry32, normal, permutation, shuffle, stream } from '../src/lib/rng';
import { groupKFold, kFold, stratifiedKFold } from '../src/lib/split';

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('gives different sequences for different seeds and salts', () => {
    expect(mulberry32(1)()).not.toEqual(mulberry32(2)());
    expect(stream(1, 10)()).not.toEqual(stream(1, 11)());
  });

  it('produces values in [0, 1) with a sensible mean', () => {
    const r = mulberry32(7);
    const xs = Array.from({ length: 10000 }, () => r());
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    expect(xs.reduce((s, x) => s + x, 0) / xs.length).toBeCloseTo(0.5, 1);
  });

  it('draws normal samples with mean 0 and sd 1', () => {
    const r = mulberry32(9);
    const xs = Array.from({ length: 20000 }, () => normal(r));
    const m = xs.reduce((s, x) => s + x, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length);
    expect(Math.abs(m)).toBeLessThan(0.03);
    expect(Math.abs(sd - 1)).toBeLessThan(0.03);
  });

  it('shuffles without losing items', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(items, mulberry32(3)).sort()).toEqual(items);
    expect(permutation(100, mulberry32(4)).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 100 }, (_, i) => i),
    );
  });
});

describe('metrics', () => {
  it('computes accuracy', () => {
    expect(accuracy([1, 0, 1, 0], [0.9, 0.2, 0.4, 0.6])).toBe(0.5);
  });

  it('computes ROC AUC, including ties', () => {
    expect(rocAuc([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9])).toBe(1);
    expect(rocAuc([0, 0, 1, 1], [0.9, 0.8, 0.2, 0.1])).toBe(0);
    expect(rocAuc([0, 1, 0, 1], [0.5, 0.5, 0.5, 0.5])).toBe(0.5);
    // One positive above one negative, one tie: (1 + 0.5) / 2.
    expect(rocAuc([0, 1, 0, 1], [0.1, 0.9, 0.5, 0.5])).toBeCloseTo(0.875);
  });
});

describe('splits', () => {
  it('kFold covers every row exactly once', () => {
    const folds = kFold(103, 5, mulberry32(1));
    expect(folds.flat().sort((a, b) => a - b)).toEqual(Array.from({ length: 103 }, (_, i) => i));
  });

  it('groupKFold never splits a group', () => {
    const groups = Array.from({ length: 60 }, (_, i) => Math.floor(i / 4));
    const folds = groupKFold(groups, 5, mulberry32(2));
    const foldOfGroup = new Map<number, number>();
    folds.forEach((f, fi) =>
      f.forEach((i) => {
        const g = groups[i];
        if (foldOfGroup.has(g)) expect(foldOfGroup.get(g)).toBe(fi);
        foldOfGroup.set(g, fi);
      }),
    );
  });

  it('stratifiedKFold keeps both classes in every fold', () => {
    const y = Array.from({ length: 100 }, (_, i) => (i < 10 ? 1 : 0));
    for (const fold of stratifiedKFold(y, 5, mulberry32(3))) {
      expect(fold.filter((i) => y[i] === 1)).toHaveLength(2);
    }
  });
});

describe('models', () => {
  const train = makeTabular({ n: 400, informative: 2, signal: 3 }, mulberry32(11));
  const test = makeTabular({ n: 400, informative: 2, signal: 3 }, mulberry32(12));

  it('logistic regression separates well-separated classes', () => {
    const model = new LogisticRegression().fit(train.X, train.y);
    const p = model.predictProba(test.X);
    expect(accuracy(test.y, p)).toBeGreaterThan(0.9);
    expect(rocAuc(test.y, p)).toBeGreaterThan(0.95);
  });

  it('k-NN separates well-separated classes', () => {
    const model = new KNearestNeighbors({ k: 7 }).fit(train.X, train.y);
    expect(accuracy(test.y, model.predictProba(test.X))).toBeGreaterThan(0.9);
  });

  it('k-NN with k=1 memorises its training set', () => {
    const model = new KNearestNeighbors({ k: 1 }).fit(train.X, train.y);
    expect(accuracy(train.y, model.predictProba(train.X))).toBe(1);
  });

  it('models score near chance on pure noise', () => {
    const noiseTrain = makeTabular({ n: 400, informative: 3, signal: 0 }, mulberry32(21));
    const noiseTest = makeTabular({ n: 2000, informative: 3, signal: 0 }, mulberry32(22));
    const lr = new LogisticRegression().fit(noiseTrain.X, noiseTrain.y);
    expect(Math.abs(rocAuc(noiseTest.y, lr.predictProba(noiseTest.X)) - 0.5)).toBeLessThan(0.05);
  });
});
