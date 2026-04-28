import { describe, expect, it } from 'vitest';
import { TIME_WINDOWS } from '../models';
import type { TimeWindow } from '../models';
import { generateHistory, generateNextPoint, getDegradationProfile } from './telemetry';
import { DEGRADED_PUMP_ID } from './seed';

const NOW = new Date('2026-04-27T12:00:00Z');

describe('generateHistory', () => {
  it('produces deterministic output for the same inputs', () => {
    const a = generateHistory('pump-001', '24h', NOW);
    const b = generateHistory('pump-001', '24h', NOW);
    expect(a.map((p) => p.flowRate)).toEqual(b.map((p) => p.flowRate));
  });

  it.each(['3h', '24h', '7d', '31d'] as TimeWindow[])(
    'produces the expected point count for the %s window',
    (window) => {
      const cfg = TIME_WINDOWS[window];
      const expected = Math.floor(cfg.durationMs / cfg.resolutionMs) + 1;
      const points = generateHistory('pump-001', window, NOW);
      expect(points).toHaveLength(expected);
    },
  );

  it('keeps timestamps strictly increasing', () => {
    const points = generateHistory('pump-002', '7d', NOW);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].timestamp.getTime()).toBeGreaterThan(points[i - 1].timestamp.getTime());
    }
  });

  it('keeps normal pump signals near baseline', () => {
    const points = generateHistory('pump-001', '24h', NOW);
    const last = points[points.length - 1];
    expect(last.outletPressure).toBeGreaterThan(10);
    expect(last.flowRate).toBeGreaterThan(50);
    expect(last.vibration).toBeLessThan(3);
    expect(last.temperature).toBeLessThan(70);
  });

  it('shows clearly degraded latest readings on the degraded pump', () => {
    const normal = generateHistory('pump-001', '24h', NOW);
    const degraded = generateHistory(DEGRADED_PUMP_ID, '24h', NOW);
    const normalLast = normal[normal.length - 1];
    const degradedLast = degraded[degraded.length - 1];

    expect(degradedLast.outletPressure).toBeLessThan(normalLast.outletPressure - 2);
    expect(degradedLast.flowRate).toBeLessThan(normalLast.flowRate - 10);
    expect(degradedLast.vibration).toBeGreaterThan(normalLast.vibration + 2);
    expect(degradedLast.temperature).toBeGreaterThan(normalLast.temperature + 10);
    expect(Math.abs(degradedLast.rotationSpeed - normalLast.rotationSpeed)).toBeLessThan(150);
  });

  it('shows drift over time on the degraded pump', () => {
    const points = generateHistory(DEGRADED_PUMP_ID, '24h', NOW);
    const first = points[0];
    const last = points[points.length - 1];
    expect(last.outletPressure).toBeLessThan(first.outletPressure);
    expect(last.flowRate).toBeLessThan(first.flowRate);
    expect(last.vibration).toBeGreaterThan(first.vibration);
    expect(last.temperature).toBeGreaterThan(first.temperature);
  });
});

describe('generateNextPoint', () => {
  it('appends a point at the next resolution step', () => {
    const cfg = TIME_WINDOWS['24h'];
    const last = generateHistory('pump-001', '24h', NOW).at(-1)!;
    const next = generateNextPoint('pump-001', last.timestamp, NOW, cfg.resolutionMs);
    expect(next.timestamp.getTime() - last.timestamp.getTime()).toEqual(cfg.resolutionMs);
  });
});

describe('getDegradationProfile', () => {
  it('returns null for normal pumps', () => {
    expect(getDegradationProfile('pump-001', NOW)).toBeNull();
  });
  it('returns a profile for the degraded pump', () => {
    const p = getDegradationProfile(DEGRADED_PUMP_ID, NOW);
    expect(p).not.toBeNull();
    expect(p!.deltas.outletPressure).toBeLessThan(0);
    expect(p!.deltas.vibration!).toBeGreaterThan(0);
  });
});
