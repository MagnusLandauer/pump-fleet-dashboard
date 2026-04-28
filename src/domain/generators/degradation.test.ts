import { describe, expect, it } from 'vitest';
import { applyDegradation, sigmoidProgress } from './degradation';

describe('sigmoidProgress', () => {
  it('returns 0.5 at the inflection point', () => {
    expect(sigmoidProgress(0, 0, 1)).toBeCloseTo(0.5, 5);
  });

  it('approaches 0 well before the inflection point', () => {
    expect(sigmoidProgress(-10, 0, 1)).toBeLessThan(0.001);
  });

  it('approaches 1 well after the inflection point', () => {
    expect(sigmoidProgress(10, 0, 1)).toBeGreaterThan(0.999);
  });
});

describe('applyDegradation', () => {
  const base = {
    rotationSpeed: 3000,
    inletPressure: 2.2,
    outletPressure: 11,
    flowRate: 55,
    vibration: 2,
    temperature: 65,
  };

  it('leaves baseline values unchanged before the ramp starts', () => {
    const past = new Date('2026-04-25T00:00:00Z');
    const profile = {
      start: new Date('2026-04-27T00:00:00Z'),
      rampHours: 36,
      deltas: { vibration: 4 },
    };
    const result = applyDegradation(base, profile, past);
    expect(result.vibration).toBeCloseTo(2, 1);
  });

  it('applies the full delta well after the ramp', () => {
    const future = new Date('2026-05-10T00:00:00Z');
    const profile = {
      start: new Date('2026-04-27T00:00:00Z'),
      rampHours: 12,
      deltas: { vibration: 4 },
    };
    const result = applyDegradation(base, profile, future);
    expect(result.vibration).toBeCloseTo(6, 1);
  });

  it('does not mutate signals not present in deltas', () => {
    const profile = {
      start: new Date('2026-04-27T00:00:00Z'),
      rampHours: 1,
      deltas: { vibration: 2 },
    };
    const result = applyDegradation(base, profile, new Date('2026-04-30T00:00:00Z'));
    expect(result.rotationSpeed).toEqual(base.rotationSpeed);
    expect(result.inletPressure).toEqual(base.inletPressure);
  });
});
