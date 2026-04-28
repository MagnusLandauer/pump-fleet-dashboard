import { describe, expect, it } from 'vitest';
import { formatAlertMessage } from './alertMessage';
import type { Alert } from '../domain/models';

function alert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'a1',
    pumpId: 'pump-001',
    signal: 'vibration',
    startedAt: new Date('2026-04-27T11:00:00Z'),
    peakSeverity: 'critical',
    currentSeverity: 'critical',
    peakValue: 5.5,
    peakDirection: 'high',
    ...overrides,
  };
}

describe('formatAlertMessage', () => {
  it('includes label, direction word, severity and value with unit', () => {
    expect(formatAlertMessage(alert())).toEqual(
      'Vibration above critical threshold (5.50 mm/s)',
    );
  });

  it('uses "below" for low-direction incidents', () => {
    expect(
      formatAlertMessage(
        alert({ signal: 'outletPressure', peakValue: 8.2, peakDirection: 'low', peakSeverity: 'critical' }),
      ),
    ).toEqual('Outlet Pressure below critical threshold (8.20 bar)');
  });

  it('reflects peakSeverity even when current severity has de-escalated', () => {
    const a = alert({ peakSeverity: 'critical', currentSeverity: 'warning', peakValue: 5.5 });
    expect(formatAlertMessage(a)).toMatch(/critical/);
  });
});
