import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MaintenanceTable } from './MaintenanceTable';
import type { MaintenanceSchedule } from '../../domain/models';

const NOW = new Date('2026-04-27T12:00:00Z');

const schedules: MaintenanceSchedule[] = [
  {
    pumpId: 'pump-001',
    task: 'Vibration inspection',
    intervalDays: 30,
    lastPerformed: new Date('2026-03-01'),
    nextDue: new Date('2026-03-31'),
  },
  {
    pumpId: 'pump-001',
    task: 'Oil change',
    intervalDays: 90,
    lastPerformed: null,
    nextDue: new Date('2026-04-20'),
  },
  {
    pumpId: 'pump-001',
    task: 'Seal inspection',
    intervalDays: 60,
    lastPerformed: new Date('2026-04-10'),
    nextDue: new Date('2026-06-10'),
  },
];

describe('MaintenanceTable', () => {
  it('flags overdue tasks', () => {
    render(<MaintenanceTable schedules={schedules} now={NOW} />);
    expect(screen.getAllByText('Overdue').length).toBeGreaterThanOrEqual(2);
  });

  it('flags missing tasks', () => {
    render(<MaintenanceTable schedules={schedules} now={NOW} />);
    expect(screen.getByText('Never performed')).toBeTruthy();
  });

  it('marks healthy tasks as on track', () => {
    render(<MaintenanceTable schedules={schedules} now={NOW} />);
    expect(screen.getByText('On track')).toBeTruthy();
  });

  it('shows empty message when no schedules', () => {
    render(<MaintenanceTable schedules={[]} now={NOW} />);
    expect(screen.getByText(/no scheduled tasks/i)).toBeTruthy();
  });
});
