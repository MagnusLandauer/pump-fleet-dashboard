import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SummaryStatsBar } from './SummaryStatsBar';

describe('SummaryStatsBar', () => {
  it('shows the three stats', () => {
    render(<SummaryStatsBar total={5} withAlerts={2} overdueMaintenance={3} />);
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(/total pumps/i)).toBeTruthy();
    expect(screen.getByText(/with active alerts/i)).toBeTruthy();
    expect(screen.getByText(/overdue maintenance/i)).toBeTruthy();
  });

  it('renders with zeros without highlights', () => {
    render(<SummaryStatsBar total={0} withAlerts={0} overdueMaintenance={0} />);
    expect(screen.getAllByText('0').length).toBe(3);
  });
});
