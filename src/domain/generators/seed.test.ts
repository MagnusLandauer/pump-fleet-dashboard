import { describe, expect, it } from 'vitest';
import { buildMaintenanceSchedules, buildPumpRoster, DEGRADED_PUMP_ID } from './seed';

const NOW = new Date('2026-04-27T12:00:00Z');

describe('buildPumpRoster', () => {
  it('produces five pumps with unique ids', () => {
    const roster = buildPumpRoster(NOW);
    expect(roster).toHaveLength(5);
    expect(new Set(roster.map((p) => p.id)).size).toEqual(5);
  });

  it('includes the degraded pump id', () => {
    expect(buildPumpRoster(NOW).some((p) => p.id === DEGRADED_PUMP_ID)).toBe(true);
  });
});

describe('buildMaintenanceSchedules', () => {
  it('produces schedules for every pump', () => {
    const schedules = buildMaintenanceSchedules(NOW);
    const pumpIds = new Set(schedules.map((s) => s.pumpId));
    expect(pumpIds.size).toEqual(5);
  });

  it('marks the degraded pump vibration inspection as overdue', () => {
    const schedules = buildMaintenanceSchedules(NOW);
    const target = schedules.find(
      (s) => s.pumpId === DEGRADED_PUMP_ID && s.task === 'Vibration inspection',
    );
    expect(target).toBeDefined();
    expect(target!.nextDue.getTime()).toBeLessThan(NOW.getTime());
  });

  it('produces a missing maintenance entry for pump-002 oil change', () => {
    const schedules = buildMaintenanceSchedules(NOW);
    const target = schedules.find((s) => s.pumpId === 'pump-002' && s.task === 'Oil change');
    expect(target!.lastPerformed).toBeNull();
  });
});
