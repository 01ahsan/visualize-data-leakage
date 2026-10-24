/** A function returning uniform random numbers in [0, 1). */
export type Rng = () => number;

/** mulberry32: a small, fast, seedable 32-bit PRNG. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derive an independent seed from a base seed and integer salts. Each part of
 * a simulation (data, split, new hospital) gets its own stream, so changing
 * one part never shifts the random numbers of another.
 */
export function deriveSeed(seed: number, ...salts: number[]): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (const s of salts) {
    h = Math.imul(h ^ (s >>> 0), 0x85ebca6b) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
  }
  return h;
}

/** A new generator seeded from `seed` and `salts`. */
export function stream(seed: number, ...salts: number[]): Rng {
  return mulberry32(deriveSeed(seed, ...salts));
}

/** One normal sample (Box-Muller). */
export function normal(rng: Rng, mean = 0, sd = 1): number {
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** 1 with probability p, else 0. */
export function bernoulli(rng: Rng, p: number): number {
  return rng() < p ? 1 : 0;
}

/** Random integer in [0, n). */
export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}

/** A shuffled copy of `items` (Fisher-Yates). */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A random permutation of 0..n-1. */
export function permutation(n: number, rng: Rng): number[] {
  return shuffle(
    Array.from({ length: n }, (_, i) => i),
    rng,
  );
}
