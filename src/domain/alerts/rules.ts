import type {
  Alert,
  AlertSeverity,
  TelemetryPoint,
  TelemetrySignal,
} from '../models';
import { SIGNAL_ORDER, THRESHOLDS } from '../models';

export interface EvaluatedAlert {
  pumpId: string;
  timestamp: Date;
  severity: AlertSeverity;
  signal: TelemetrySignal;
  message: string;
}

interface SignalEvaluation {
  severity: AlertSeverity | null;
  direction: 'high' | 'low' | null;
}

function evaluateSignal(point: TelemetryPoint, signal: TelemetrySignal): SignalEvaluation {
  const value = point[signal];
  const t = THRESHOLDS[signal];
  if (t.criticalLow !== undefined && value < t.criticalLow) {
    return { severity: 'critical', direction: 'low' };
  }
  if (t.criticalHigh !== undefined && value > t.criticalHigh) {
    return { severity: 'critical', direction: 'high' };
  }
  if (t.warningLow !== undefined && value < t.warningLow) {
    return { severity: 'warning', direction: 'low' };
  }
  if (t.warningHigh !== undefined && value > t.warningHigh) {
    return { severity: 'warning', direction: 'high' };
  }
  return { severity: null, direction: null };
}

function buildAlert(
  pumpId: string,
  point: TelemetryPoint,
  signal: TelemetrySignal,
  severity: AlertSeverity,
  direction: 'high' | 'low',
): EvaluatedAlert {
  const t = THRESHOLDS[signal];
  const value = point[signal];
  return {
    pumpId,
    timestamp: point.timestamp,
    severity,
    signal,
    message: `${t.label} ${direction === 'high' ? 'above' : 'below'} ${severity} threshold (${value.toFixed(2)} ${t.unit})`,
  };
}

export function evaluatePoint(
  pumpId: string,
  point: TelemetryPoint,
): EvaluatedAlert[] {
  const alerts: EvaluatedAlert[] = [];
  for (const signal of SIGNAL_ORDER) {
    const { severity, direction } = evaluateSignal(point, signal);
    if (severity && direction) {
      alerts.push(buildAlert(pumpId, point, signal, severity, direction));
    }
  }
  return alerts;
}

export function evaluateHistory(
  pumpId: string,
  history: TelemetryPoint[],
): EvaluatedAlert[] {
  const out: EvaluatedAlert[] = [];
  for (const p of history) {
    out.push(...evaluatePoint(pumpId, p));
  }
  return out;
}

export function alertId(a: Pick<Alert, 'pumpId' | 'signal' | 'severity' | 'timestamp'>): string {
  return `${a.pumpId}:${a.signal}:${a.severity}:${a.timestamp.getTime()}`;
}
