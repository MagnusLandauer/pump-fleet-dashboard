import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AlertList } from './AlertList';
import type { Alert } from '../../domain/models';

const NOW = new Date('2026-04-27T12:00:00Z');

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'a1',
    pumpId: 'pump-001',
    signal: 'vibration',
    startedAt: new Date(NOW.getTime() - 10 * 60_000),
    peakSeverity: 'critical',
    currentSeverity: 'critical',
    peakValue: 5.5,
    peakDirection: 'high',
    ...overrides,
  };
}

const activeCritical = makeAlert({ id: 'a1' });
const activeWarning = makeAlert({
  id: 'a2',
  signal: 'temperature',
  peakSeverity: 'warning',
  currentSeverity: 'warning',
  peakValue: 80,
});
const resolved = makeAlert({
  id: 'a3',
  signal: 'inletPressure',
  peakSeverity: 'warning',
  currentSeverity: 'nominal',
  peakValue: 1.2,
  peakDirection: 'low',
  startedAt: new Date(NOW.getTime() - 45 * 60_000),
  endedAt: new Date(NOW.getTime() - 5 * 60_000),
});

describe('AlertList', () => {
  it('shows only active incidents by default', () => {
    render(
      <AlertList
        alerts={[activeCritical, activeWarning, resolved]}
        now={NOW}
        onAcknowledge={() => {}}
      />,
    );
    expect(screen.getByTestId('alert-a1')).toBeTruthy();
    expect(screen.getByTestId('alert-a2')).toBeTruthy();
    expect(screen.queryByTestId('alert-a3')).toBeNull();
  });

  it('shows resolved incidents when the resolved filter is selected', async () => {
    render(
      <AlertList
        alerts={[activeCritical, resolved]}
        now={NOW}
        onAcknowledge={() => {}}
      />,
    );
    await userEvent.click(screen.getByLabelText(/state/i));
    await userEvent.click(screen.getByRole('option', { name: 'Resolved' }));
    expect(screen.getByTestId('alert-a3')).toBeTruthy();
    expect(screen.queryByTestId('alert-a1')).toBeNull();
  });

  it('renders one incident per signal — no warning + critical pair for the same metric', () => {
    render(
      <AlertList
        alerts={[activeCritical, activeWarning]}
        now={NOW}
        onAcknowledge={() => {}}
      />,
    );
    const rows = screen.getAllByTestId(/^alert-/);
    expect(rows).toHaveLength(2);
  });

  it('shows active critical incident with the right state chip', () => {
    render(
      <AlertList alerts={[activeCritical]} now={NOW} onAcknowledge={() => {}} />,
    );
    expect(screen.getByText('Active · Critical')).toBeTruthy();
  });

  it('labels start time as "Started X ago"', () => {
    render(
      <AlertList alerts={[activeCritical]} now={NOW} onAcknowledge={() => {}} />,
    );
    expect(screen.getByText(/Started 10 min ago/)).toBeTruthy();
  });

  it('shows "Peaked at: critical" only when current severity de-escalated', () => {
    const peaked = makeAlert({
      id: 'a4',
      peakSeverity: 'critical',
      currentSeverity: 'warning',
    });
    render(<AlertList alerts={[peaked]} now={NOW} onAcknowledge={() => {}} />);
    expect(screen.getByText('Peaked at: critical')).toBeTruthy();
  });

  it('hides the acknowledge button on already-acknowledged alerts', () => {
    const acked = makeAlert({
      id: 'a5',
      acknowledgedAt: new Date(NOW.getTime() - 60_000),
    });
    render(<AlertList alerts={[acked]} now={NOW} onAcknowledge={() => {}} />);
    expect(screen.queryByLabelText('acknowledge-a5')).toBeNull();
    expect(screen.getByText('Acknowledged')).toBeTruthy();
  });

  it('calls onAcknowledge when the button is clicked', async () => {
    const onAck = vi.fn();
    render(<AlertList alerts={[activeCritical]} now={NOW} onAcknowledge={onAck} />);
    await userEvent.click(screen.getByLabelText('acknowledge-a1'));
    expect(onAck).toHaveBeenCalledWith('a1');
  });

  it('filters by peak severity', async () => {
    render(
      <AlertList
        alerts={[activeCritical, activeWarning]}
        now={NOW}
        onAcknowledge={() => {}}
      />,
    );
    await userEvent.click(screen.getByLabelText(/severity/i));
    await userEvent.click(screen.getByRole('option', { name: 'Critical' }));
    expect(screen.getByTestId('alert-a1')).toBeTruthy();
    expect(screen.queryByTestId('alert-a2')).toBeNull();
  });

  it('shows empty state copy when no incidents match the filter', () => {
    render(<AlertList alerts={[resolved]} now={NOW} onAcknowledge={() => {}} />);
    expect(screen.getByText(/no active alerts/i)).toBeTruthy();
  });
});
