import type { MaintenanceSchedule, Pump } from '../models';

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildPumpRoster(now: Date): Pump[] {
  return [
    {
      id: 'pump-001',
      name: 'Alpha Centrifuge',
      location: 'North Field A',
      model: 'CT-3200X',
      installedDate: new Date(now.getTime() - 720 * DAY_MS),
      status: 'running',
    },
    {
      id: 'pump-002',
      name: 'Bravo Booster',
      location: 'North Field B',
      model: 'CT-3200X',
      installedDate: new Date(now.getTime() - 540 * DAY_MS),
      status: 'running',
    },
    {
      id: 'pump-003',
      name: 'Charlie Injector',
      location: 'South Field A',
      model: 'IJ-4500',
      installedDate: new Date(now.getTime() - 1090 * DAY_MS),
      status: 'running',
    },
    {
      id: 'pump-004',
      name: 'Delta Transfer',
      location: 'South Field B',
      model: 'TR-2800',
      installedDate: new Date(now.getTime() - 300 * DAY_MS),
      status: 'running',
    },
    {
      id: 'pump-005',
      name: 'Echo Standby',
      location: 'Compound Yard',
      model: 'CT-3200X',
      installedDate: new Date(now.getTime() - 95 * DAY_MS),
      status: 'maintenance',
    },
  ];
}

export const DEGRADED_PUMP_ID = 'pump-003';

export function buildMaintenanceSchedules(now: Date): MaintenanceSchedule[] {
  const schedules: MaintenanceSchedule[] = [];
  const tasks: { task: string; intervalDays: number; lastDaysAgo: number }[] = [
    { task: 'Vibration inspection', intervalDays: 30, lastDaysAgo: 12 },
    { task: 'Oil change', intervalDays: 90, lastDaysAgo: 70 },
    { task: 'Seal inspection', intervalDays: 60, lastDaysAgo: 40 },
  ];

  const pumpIds = ['pump-001', 'pump-002', 'pump-003', 'pump-004', 'pump-005'];
  for (const pumpId of pumpIds) {
    for (const t of tasks) {
      let lastPerformed: Date | null = new Date(now.getTime() - t.lastDaysAgo * DAY_MS);
      let nextDue = new Date(lastPerformed.getTime() + t.intervalDays * DAY_MS);

      if (pumpId === DEGRADED_PUMP_ID && t.task === 'Vibration inspection') {
        lastPerformed = new Date(now.getTime() - 65 * DAY_MS);
        nextDue = new Date(now.getTime() - 35 * DAY_MS);
      }
      if (pumpId === 'pump-002' && t.task === 'Oil change') {
        lastPerformed = null;
        nextDue = new Date(now.getTime() - 5 * DAY_MS);
      }

      schedules.push({
        pumpId,
        task: t.task,
        intervalDays: t.intervalDays,
        lastPerformed,
        nextDue,
      });
    }
  }

  return schedules;
}
