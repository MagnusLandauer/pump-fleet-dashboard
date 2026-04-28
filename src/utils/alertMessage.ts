import type { Alert } from '../domain/models';
import { THRESHOLDS } from '../domain/models';

export function formatAlertMessage(alert: Alert): string {
  const t = THRESHOLDS[alert.signal];
  const direction = alert.peakDirection === 'high' ? 'above' : 'below';
  return `${t.label} ${direction} ${alert.peakSeverity} threshold (${alert.peakValue.toFixed(2)} ${t.unit})`;
}
