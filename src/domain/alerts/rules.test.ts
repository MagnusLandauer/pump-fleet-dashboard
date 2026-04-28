import { describe, expect, it } from 'vitest';
import type { TelemetryPoint, TelemetrySignal } from '../models';
import { evaluatePoint, evaluateSignal } from './rules';

function point(overrides: Partial<TelemetryPoint> = {}): TelemetryPoint {
  return {
    timestamp: new Date('2026-04-27T12:00:00Z'),
    rotationSpeed: 3000,
    inletPressure: 2.2,
    outletPressure: 11,
    flowRate: 55,
    vibration: 2,
    temperature: 65,
    ...overrides,
  };
}

function findEval(
  evals: ReturnType<typeof evaluatePoint>,
  signal: TelemetrySignal,
) {
  return evals.find((e) => e.signal === signal)!;
}

describe('evaluateSignal', () => {
  it('returns nominal when the value is within range', () => {
    const r = evaluateSignal(point(), 'vibration');
    expect(r.state).toEqual('nominal');
    expect(r.direction).toBeNull();
  });

  it('returns critical with high direction when above critical threshold', () => {
    const r = evaluateSignal(point({ vibration: 6 }), 'vibration');
    expect(r.state).toEqual('critical');
    expect(r.direction).toEqual('high');
    expect(r.value).toEqual(6);
  });

  it('returns warning when in the warning band', () => {
    const r = evaluateSignal(point({ temperature: 80 }), 'temperature');
    expect(r.state).toEqual('warning');
    expect(r.direction).toEqual('high');
  });

  it('detects below-threshold critical with low direction', () => {
    const r = evaluateSignal(point({ outletPressure: 8 }), 'outletPressure');
    expect(r.state).toEqual('critical');
    expect(r.direction).toEqual('low');
  });
});

describe('evaluatePoint', () => {
  it('returns one entry per signal', () => {
    const evals = evaluatePoint(point());
    expect(evals).toHaveLength(6);
  });

  it('marks all-nominal points', () => {
    const evals = evaluatePoint(point());
    expect(evals.every((e) => e.state === 'nominal')).toBe(true);
  });

  it('reflects multiple out-of-range signals in their entries', () => {
    const evals = evaluatePoint(point({ vibration: 6, temperature: 90 }));
    expect(findEval(evals, 'vibration').state).toEqual('critical');
    expect(findEval(evals, 'temperature').state).toEqual('critical');
    expect(findEval(evals, 'rotationSpeed').state).toEqual('nominal');
  });
});
