import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AlertList } from './AlertList';
import type { Alert } from '../../domain/models';

const alerts: Alert[] = [
  {
    id: 'a1',
    pumpId: 'pump-001',
    timestamp: new Date('2026-04-27T11:00:00Z'),
    severity: 'critical',
    signal: 'vibration',
    message: 'Vibration above critical',
    acknowledged: false,
  },
  {
    id: 'a2',
    pumpId: 'pump-001',
    timestamp: new Date('2026-04-27T10:00:00Z'),
    severity: 'warning',
    signal: 'temperature',
    message: 'Temperature warning',
    acknowledged: true,
  },
];

describe('AlertList', () => {
  it('renders all alerts by default', () => {
    render(<AlertList alerts={alerts} onAcknowledge={() => {}} />);
    expect(screen.getByText('Vibration above critical')).toBeTruthy();
    expect(screen.getByText('Temperature warning')).toBeTruthy();
  });

  it('shows empty message when no alerts', () => {
    render(<AlertList alerts={[]} onAcknowledge={() => {}} />);
    expect(screen.getByText(/no alerts/i)).toBeTruthy();
  });

  it('calls onAcknowledge when the button is clicked', async () => {
    const onAck = vi.fn();
    render(<AlertList alerts={alerts} onAcknowledge={onAck} />);
    await userEvent.click(screen.getByLabelText('acknowledge-a1'));
    expect(onAck).toHaveBeenCalledWith('a1');
  });

  it('hides acknowledge button on already-acknowledged alerts', () => {
    render(<AlertList alerts={alerts} onAcknowledge={() => {}} />);
    expect(screen.queryByLabelText('acknowledge-a2')).toBeNull();
  });

  it('filters by severity', async () => {
    render(<AlertList alerts={alerts} onAcknowledge={() => {}} />);
    await userEvent.click(screen.getByLabelText(/severity/i));
    await userEvent.click(screen.getByRole('option', { name: 'Critical' }));
    expect(screen.queryByText('Temperature warning')).toBeNull();
    expect(screen.getByText('Vibration above critical')).toBeTruthy();
  });
});
