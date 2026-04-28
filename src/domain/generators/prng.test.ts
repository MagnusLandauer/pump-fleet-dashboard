import { describe, expect, it } from 'vitest';
import { gaussian, hashSeed, mulberry32 } from './prng';

describe('mulberry32', () => {
  it('produces deterministic output for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces different output for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toEqual(b());
  });

  it('returns values in [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('gaussian', () => {
  it('respects seed determinism', () => {
    const a = mulberry32(99);
    const b = mulberry32(99);
    expect(gaussian(a, 0, 1)).toBeCloseTo(gaussian(b, 0, 1), 10);
  });

  it('approximates the requested mean and stddev', () => {
    const rng = mulberry32(123);
    const samples: number[] = [];
    for (let i = 0; i < 5000; i++) samples.push(gaussian(rng, 10, 2));
    const mean = samples.reduce((a, b) => a + b) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    expect(mean).toBeCloseTo(10, 0);
    expect(Math.sqrt(variance)).toBeCloseTo(2, 0);
  });
});

describe('hashSeed', () => {
  it('is deterministic', () => {
    expect(hashSeed('pump-001')).toEqual(hashSeed('pump-001'));
  });

  it('differs across inputs', () => {
    expect(hashSeed('pump-001')).not.toEqual(hashSeed('pump-002'));
  });
});
