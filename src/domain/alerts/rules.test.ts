import { describe, expect, it } from 'vitest';
import type { TelemetryPoint } from '../models';
import { alertId, evaluateHistory, evaluatePoint } from './rules';

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

describe('evaluatePoint', () => {
  it('produces no alerts when all signals are within range', () => {
    expect(evaluatePoint('pump-001', point())).toEqual([]);
  });

  it('produces a critical alert when vibration is above critical threshold', () => {
    const alerts = evaluatePoint('pump-001', point({ vibration: 6 }));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toEqual('critical');
    expect(alerts[0].signal).toEqual('vibration');
  });

  it('produces a warning when temperature is in the warning band', () => {
    const alerts = evaluatePoint('pump-001', point({ temperature: 80 }));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toEqual('warning');
  });

  it('produces a critical alert when outlet pressure drops below critical low', () => {
    const alerts = evaluatePoint('pump-001', point({ outletPressure: 8 }));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toEqual('critical');
    expect(alerts[0].signal).toEqual('outletPressure');
    expect(alerts[0].message).toMatch(/below/);
  });

  it('produces multiple alerts when several signals are out of range', () => {
    const alerts = evaluatePoint('pump-001', point({ vibration: 6, temperature: 90 }));
    expect(alerts).toHaveLength(2);
  });
});

describe('evaluateHistory', () => {
  it('aggregates alerts from each point', () => {
    const history = [
      point({ vibration: 6 }),
      point({ vibration: 2 }),
      point({ vibration: 6 }),
    ];
    const all = evaluateHistory('pump-001', history);
    expect(all).toHaveLength(2);
  });
});

describe('alertId', () => {
  it('produces stable ids for the same input', () => {
    const ts = new Date('2026-04-27T12:00:00Z');
    const a = alertId({ pumpId: 'pump-001', signal: 'vibration', severity: 'warning', timestamp: ts });
    const b = alertId({ pumpId: 'pump-001', signal: 'vibration', severity: 'warning', timestamp: ts });
    expect(a).toEqual(b);
  });
});
