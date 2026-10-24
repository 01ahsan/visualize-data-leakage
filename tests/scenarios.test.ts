import { describe, expect, it } from 'vitest';
import { scenarios } from '../src/scenarios';
import { strengthGrid } from '../src/scenarios/define';
import type { Scenario } from '../src/scenarios/types';

const SEED = 42;

const gap = (s: Scenario, leaky: boolean, strength = s.strength.default, seed = SEED) => {
  const e = s.evaluate({ leaky, strength, seed });
  return e.reportedScore - e.newHospitalScore;
};

/**
 * Leaks whose effect is known to be small under realistic settings. The test
 * documents the expected size instead of demanding a dramatic gap.
 */
const SMALL_EFFECT = new Set(['preprocessing']);

describe.each(scenarios.map((s) => [s.id, s] as const))('scenario %s', (_, s) => {
  it('is deterministic for a given seed', () => {
    const input = { leaky: true, strength: s.strength.default, seed: SEED };
    expect(s.evaluate(input)).toEqual(s.evaluate(input));
  });

  it('changes with the seed', () => {
    const a = s.evaluate({ leaky: true, strength: s.strength.default, seed: 1 });
    const b = s.evaluate({ leaky: true, strength: s.strength.default, seed: 2 });
    expect(a).not.toEqual(b);
  });

  it('keeps the gap under 0.05 in correct mode', () => {
    expect(Math.abs(gap(s, false))).toBeLessThan(0.05);
  });

  if (SMALL_EFFECT.has(s.id)) {
    it('shows only a small difference between leaky and correct (expected)', () => {
      const difference = gap(s, true) - gap(s, false);
      expect(Math.abs(difference)).toBeLessThan(0.02);
      expect(Math.abs(gap(s, true))).toBeLessThan(0.05);
    });
  } else {
    it('inflates the reported score in leaky mode', () => {
      expect(gap(s, true)).toBeGreaterThan(0.05);
    });
  }

  it('returns scores in [0, 1] and a curve over the strength range', () => {
    const result = s.run({ leaky: true, strength: s.strength.default, seed: SEED });
    for (const v of [result.reportedScore, result.newHospitalScore]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(result.curve.map((p) => p.strength)).toEqual(strengthGrid(s.strength));
    expect(result.curve[0].strength).toBe(s.strength.min);
    expect(result.curve.at(-1)?.strength).toBe(s.strength.max);
  });

  it('has valid metadata', () => {
    const { min, max, step, default: def } = s.strength;
    expect(min).toBeLessThan(max);
    expect(def).toBeGreaterThanOrEqual(min);
    expect(def).toBeLessThanOrEqual(max);
    expect(step).toBeGreaterThan(0);
    expect(s.explanation.split(/\s+/).length).toBeLessThan(120);
    expect(s.wrongCode).toContain('sklearn');
    expect(s.rightCode).toContain('sklearn');
    expect(s.wrongCode).not.toEqual(s.rightCode);
  });

  it('runs one setting quickly', () => {
    s.evaluate({ leaky: true, strength: s.strength.max, seed: 7 });
    const t = performance.now();
    s.evaluate({ leaky: true, strength: s.strength.max, seed: 8 });
    // Generous bound for slow CI machines; in a browser this is well under 200 ms.
    expect(performance.now() - t).toBeLessThan(1500);
  });
});

it('scenario ids are unique', () => {
  expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length);
});

it('home-page previews match the simulations', async () => {
  const { previews, PREVIEW_SEED } = await import('../src/scenarios/previews');
  for (const s of scenarios) {
    for (const leaky of [true, false]) {
      const e = s.evaluate({ leaky, strength: s.strength.default, seed: PREVIEW_SEED });
      const p = previews[s.id][leaky ? 'leaky' : 'correct'];
      expect(p.reported).toBeCloseTo(e.reportedScore, 3);
      expect(p.newHospital).toBeCloseTo(e.newHospitalScore, 3);
    }
  }
});
