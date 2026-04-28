export type PumpStatus = 'running' | 'stopped' | 'maintenance';

export interface Pump {
  id: string;
  name: string;
  location: string;
  model: string;
  installedDate: Date;
  status: PumpStatus;
}

export type TelemetrySignal =
  | 'rotationSpeed'
  | 'inletPressure'
  | 'outletPressure'
  | 'flowRate'
  | 'vibration'
  | 'temperature';

export interface TelemetryPoint {
  timestamp: Date;
  rotationSpeed: number;
  inletPressure: number;
  outletPressure: number;
  flowRate: number;
  vibration: number;
  temperature: number;
}

export type AlertSeverity = 'warning' | 'critical';

export type AlertState = AlertSeverity | 'nominal';

export interface Alert {
  id: string;
  pumpId: string;
  signal: TelemetrySignal;
  startedAt: Date;
  endedAt?: Date;
  peakSeverity: AlertSeverity;
  currentSeverity: AlertState;
  acknowledgedAt?: Date;
  peakValue: number;
  peakDirection: 'high' | 'low';
}

export type AlertEvent =
  | { type: 'opened'; alert: Alert }
  | { type: 'escalated'; alert: Alert }
  | { type: 'resolved'; alert: Alert };

export type WorkOrderType = 'corrective' | 'planned';
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'overdue';

export interface WorkOrder {
  id: string;
  pumpId: string;
  title: string;
  description: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  createdAt: Date;
  dueDate: Date;
  completedAt: Date | null;
}

export interface MaintenanceSchedule {
  pumpId: string;
  task: string;
  intervalDays: number;
  lastPerformed: Date | null;
  nextDue: Date;
}

export type DerivedStatus = 'green' | 'yellow' | 'red' | 'maintenance';

export type TimeWindow = '3h' | '24h' | '7d' | '31d';

export interface TimeWindowConfig {
  durationMs: number;
  resolutionMs: number;
}

export const TIME_WINDOWS: Record<TimeWindow, TimeWindowConfig> = {
  '3h': { durationMs: 3 * 60 * 60 * 1000, resolutionMs: 60 * 1000 },
  '24h': { durationMs: 24 * 60 * 60 * 1000, resolutionMs: 2 * 60 * 1000 },
  '7d': { durationMs: 7 * 24 * 60 * 60 * 1000, resolutionMs: 10 * 60 * 1000 },
  '31d': { durationMs: 31 * 24 * 60 * 60 * 1000, resolutionMs: 30 * 60 * 1000 },
};

export interface SignalThreshold {
  warningLow?: number;
  warningHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  unit: string;
  label: string;
}

export const THRESHOLDS: Record<TelemetrySignal, SignalThreshold> = {
  rotationSpeed: {
    warningLow: 2850,
    warningHigh: 3150,
    criticalLow: 2700,
    criticalHigh: 3300,
    unit: 'RPM',
    label: 'Rotation Speed',
  },
  inletPressure: {
    warningLow: 1.4,
    warningHigh: 3.2,
    criticalLow: 1.0,
    criticalHigh: 3.5,
    unit: 'bar',
    label: 'Inlet Pressure',
  },
  outletPressure: {
    warningLow: 9.0,
    criticalLow: 8.5,
    warningHigh: 12.5,
    criticalHigh: 13.0,
    unit: 'bar',
    label: 'Outlet Pressure',
  },
  flowRate: {
    warningLow: 42,
    criticalLow: 38,
    warningHigh: 62,
    criticalHigh: 65,
    unit: 'm³/h',
    label: 'Flow Rate',
  },
  vibration: {
    warningHigh: 4.0,
    criticalHigh: 5.0,
    unit: 'mm/s',
    label: 'Vibration',
  },
  temperature: {
    warningHigh: 78,
    criticalHigh: 85,
    unit: '°C',
    label: 'Temperature',
  },
};

export const SIGNAL_ORDER: TelemetrySignal[] = [
  'rotationSpeed',
  'inletPressure',
  'outletPressure',
  'flowRate',
  'vibration',
  'temperature',
];
