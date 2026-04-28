import type {
  AlertState,
  TelemetryPoint,
  TelemetrySignal,
} from '../models';
import { SIGNAL_ORDER, THRESHOLDS } from '../models';

export interface SignalEvaluation {
  signal: TelemetrySignal;
  state: AlertState;
  direction: 'high' | 'low' | null;
  value: number;
}

export function evaluateSignal(
  point: TelemetryPoint,
  signal: TelemetrySignal,
): SignalEvaluation {
  const value = point[signal];
  const t = THRESHOLDS[signal];
  if (t.criticalLow !== undefined && value < t.criticalLow) {
    return { signal, state: 'critical', direction: 'low', value };
  }
  if (t.criticalHigh !== undefined && value > t.criticalHigh) {
    return { signal, state: 'critical', direction: 'high', value };
  }
  if (t.warningLow !== undefined && value < t.warningLow) {
    return { signal, state: 'warning', direction: 'low', value };
  }
  if (t.warningHigh !== undefined && value > t.warningHigh) {
    return { signal, state: 'warning', direction: 'high', value };
  }
  return { signal, state: 'nominal', direction: null, value };
}

export function evaluatePoint(point: TelemetryPoint): SignalEvaluation[] {
  return SIGNAL_ORDER.map((signal) => evaluateSignal(point, signal));
}
