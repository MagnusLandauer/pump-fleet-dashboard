import type {
  Alert,
  AlertEvent,
  AlertSeverity,
  DerivedStatus,
  MaintenanceSchedule,
  Pump,
  TelemetryPoint,
  TelemetrySignal,
  TimeWindow,
  WorkOrder,
} from './models';
import { TIME_WINDOWS } from './models';
import { evaluatePoint } from './alerts/rules';
import type { SignalEvaluation } from './alerts/rules';
import {
  buildMaintenanceSchedules,
  buildPumpRoster,
} from './generators/seed';
import {
  generateHistory,
  generateNextPoint,
} from './generators/telemetry';

type TelemetryCache = Map<string, Map<TimeWindow, TelemetryPoint[]>>;
type OpenIncidentMap = Map<string, Map<TelemetrySignal, string>>;

interface StoreState {
  pumps: Pump[];
  telemetry: TelemetryCache;
  alerts: Alert[];
  workOrders: WorkOrder[];
  maintenance: MaintenanceSchedule[];
  now: Date;
}

type Listener = () => void;
type AlertEventListener = (event: AlertEvent) => void;

export interface CreateWorkOrderInput {
  pumpId: string;
  title: string;
  description: string;
  type: WorkOrder['type'];
  dueDate: Date;
}

export interface UpdateWorkOrderInput {
  title: string;
  description: string;
  type: WorkOrder['type'];
  status: WorkOrder['status'];
  dueDate: Date;
}

const DEFAULT_WINDOW: TimeWindow = '24h';
const NO_TELEMETRY: TelemetryPoint[] = [];

function severityRank(s: AlertSeverity): number {
  return s === 'critical' ? 2 : 1;
}

export class FleetStore {
  private state: StoreState;
  private listeners: Set<Listener> = new Set();
  private alertEventListeners: Set<AlertEventListener> = new Set();
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private liveSubscribers = 0;
  private workOrderCounter = 0;
  private alertCounter = 0;
  private openBySignal: OpenIncidentMap = new Map();

  constructor(now: Date = new Date()) {
    const pumps = buildPumpRoster(now);
    const telemetry: TelemetryCache = new Map();
    const alerts: Alert[] = [];
    const alertsById = new Map<string, Alert>();

    for (const pump of pumps) {
      if (pump.status === 'maintenance') continue;
      const points = generateHistory(pump.id, DEFAULT_WINDOW, now);
      telemetry.set(pump.id, new Map([[DEFAULT_WINDOW, points]]));
      for (const point of points) {
        this.applyEvaluations(
          pump.id,
          point.timestamp,
          evaluatePoint(point),
          alerts,
          alertsById,
          /* emit */ false,
        );
      }
    }

    this.state = {
      pumps,
      telemetry,
      alerts,
      workOrders: this.seedWorkOrders(now),
      maintenance: buildMaintenanceSchedules(now),
      now,
    };
  }

  private seedWorkOrders(now: Date): WorkOrder[] {
    const DAY = 24 * 60 * 60 * 1000;
    const orders: WorkOrder[] = [
      {
        id: this.nextWorkOrderId(),
        pumpId: 'pump-001',
        title: 'Replace inlet filter',
        description: 'Quarterly replacement of inlet strainer.',
        type: 'planned',
        status: 'open',
        createdAt: new Date(now.getTime() - 5 * DAY),
        dueDate: new Date(now.getTime() + 9 * DAY),
        completedAt: null,
      },
      {
        id: this.nextWorkOrderId(),
        pumpId: 'pump-003',
        title: 'Bearing inspection',
        description: 'Investigate elevated vibration on impeller bearing.',
        type: 'corrective',
        status: 'overdue',
        createdAt: new Date(now.getTime() - 14 * DAY),
        dueDate: new Date(now.getTime() - 2 * DAY),
        completedAt: null,
      },
      {
        id: this.nextWorkOrderId(),
        pumpId: 'pump-005',
        title: 'Oil change',
        description: 'Routine oil change per maintenance schedule.',
        type: 'planned',
        status: 'in_progress',
        createdAt: new Date(now.getTime() - 1 * DAY),
        dueDate: new Date(now.getTime() + 4 * DAY),
        completedAt: null,
      },
    ];
    return orders;
  }

  private nextWorkOrderId(): string {
    this.workOrderCounter += 1;
    return `wo-${String(this.workOrderCounter).padStart(4, '0')}`;
  }

  private nextAlertId(): string {
    this.alertCounter += 1;
    return `alert-${this.alertCounter}`;
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }

  private emitAlertEvent(event: AlertEvent): void {
    for (const l of this.alertEventListeners) l(event);
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  subscribeToAlertEvents = (listener: AlertEventListener): (() => void) => {
    this.alertEventListeners.add(listener);
    return () => {
      this.alertEventListeners.delete(listener);
    };
  };

  getSnapshot = (): StoreState => this.state;

  getPumps(): Pump[] {
    return this.state.pumps;
  }

  getPump(id: string): Pump | undefined {
    return this.state.pumps.find((p) => p.id === id);
  }

  getTelemetry(pumpId: string, window: TimeWindow = DEFAULT_WINDOW): TelemetryPoint[] {
    const pump = this.getPump(pumpId);
    if (pump?.status === 'maintenance') return NO_TELEMETRY;

    let windowsMap = this.state.telemetry.get(pumpId);
    const cached = windowsMap?.get(window);
    if (cached) return cached;

    const points = generateHistory(pumpId, window, this.state.now);
    if (!windowsMap) {
      windowsMap = new Map();
      this.state.telemetry.set(pumpId, windowsMap);
    }
    windowsMap.set(window, points);
    return points;
  }

  getAlerts(pumpId?: string): Alert[] {
    if (!pumpId) return this.state.alerts;
    return this.state.alerts.filter((a) => a.pumpId === pumpId);
  }

  getActiveAlerts(pumpId?: string): Alert[] {
    return this.getAlerts(pumpId).filter((a) => a.endedAt == null);
  }

  acknowledgeAlert(id: string): void {
    const target = this.state.alerts.find((a) => a.id === id);
    if (!target || target.acknowledgedAt) return;
    const now = this.state.now;
    const alerts = this.state.alerts.map((a) =>
      a.id === id ? { ...a, acknowledgedAt: now } : a,
    );
    this.state = { ...this.state, alerts };
    this.emit();
  }

  getWorkOrders(pumpId?: string): WorkOrder[] {
    const all = this.state.workOrders;
    return pumpId ? all.filter((w) => w.pumpId === pumpId) : all;
  }

  createWorkOrder(input: CreateWorkOrderInput): WorkOrder {
    const now = this.state.now;
    const wo: WorkOrder = {
      id: this.nextWorkOrderId(),
      pumpId: input.pumpId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: input.dueDate.getTime() < now.getTime() ? 'overdue' : 'open',
      createdAt: new Date(now.getTime()),
      dueDate: input.dueDate,
      completedAt: null,
    };
    this.state = {
      ...this.state,
      workOrders: [...this.state.workOrders, wo],
    };
    this.emit();
    return wo;
  }

  updateWorkOrder(id: string, input: UpdateWorkOrderInput): WorkOrder | undefined {
    const now = this.state.now;
    const existing = this.state.workOrders.find((w) => w.id === id);
    if (!existing) return undefined;

    let status: WorkOrder['status'];
    if (input.status === 'completed' || input.status === 'in_progress') {
      status = input.status;
    } else {
      status = input.dueDate.getTime() < now.getTime() ? 'overdue' : 'open';
    }

    const completedAt =
      status === 'completed'
        ? existing.completedAt ?? new Date(now.getTime())
        : null;

    const updated: WorkOrder = {
      ...existing,
      title: input.title,
      description: input.description,
      type: input.type,
      status,
      dueDate: input.dueDate,
      completedAt,
    };
    this.state = {
      ...this.state,
      workOrders: this.state.workOrders.map((w) => (w.id === id ? updated : w)),
    };
    this.emit();
    return updated;
  }

  deleteWorkOrder(id: string): boolean {
    const exists = this.state.workOrders.some((w) => w.id === id);
    if (!exists) return false;
    this.state = {
      ...this.state,
      workOrders: this.state.workOrders.filter((w) => w.id !== id),
    };
    this.emit();
    return true;
  }

  getMaintenance(pumpId?: string): MaintenanceSchedule[] {
    return pumpId
      ? this.state.maintenance.filter((m) => m.pumpId === pumpId)
      : this.state.maintenance;
  }

  isMaintenanceOverdue(schedule: MaintenanceSchedule): boolean {
    return schedule.nextDue.getTime() < this.state.now.getTime();
  }

  getOverdueMaintenanceCount(): number {
    return this.state.maintenance.filter((m) => this.isMaintenanceOverdue(m)).length;
  }

  computeStatus(pumpId: string): DerivedStatus {
    const pump = this.getPump(pumpId);
    if (!pump) return 'green';
    if (pump.status === 'maintenance') return 'maintenance';
    const active = this.getActiveAlerts(pumpId);
    if (active.some((a) => a.currentSeverity === 'critical')) return 'red';
    if (active.some((a) => a.currentSeverity === 'warning')) return 'yellow';
    return 'green';
  }

  getFleetSummary(): {
    total: number;
    withAlerts: number;
    overdueMaintenance: number;
  } {
    const alertedPumpIds = new Set(
      this.getActiveAlerts().map((a) => a.pumpId),
    );
    return {
      total: this.state.pumps.length,
      withAlerts: alertedPumpIds.size,
      overdueMaintenance: this.getOverdueMaintenanceCount(),
    };
  }

  tick(): void {
    const now = new Date(this.state.now.getTime() + 5000);
    const telemetry: TelemetryCache = new Map(this.state.telemetry);
    const nextAlerts = [...this.state.alerts];
    const alertsById = new Map<string, Alert>(nextAlerts.map((a) => [a.id, a]));
    const queuedEvents: AlertEvent[] = [];

    for (const pump of this.state.pumps) {
      if (pump.status === 'maintenance') continue;
      const windows = telemetry.get(pump.id);
      if (!windows) continue;
      const updatedWindows = new Map(windows);
      let latestEval: SignalEvaluation[] | null = null;
      let latestTimestamp: Date = now;

      for (const [w, points] of windows) {
        const last = points[points.length - 1];
        if (!last) continue;
        const cfg = TIME_WINDOWS[w];
        const next = generateNextPoint(pump.id, last.timestamp, now, cfg.resolutionMs);
        updatedWindows.set(w, [...points.slice(1), next]);

        if (w === DEFAULT_WINDOW) {
          latestEval = evaluatePoint(next);
          latestTimestamp = next.timestamp;
        }
      }

      telemetry.set(pump.id, updatedWindows);

      if (latestEval) {
        this.applyEvaluations(
          pump.id,
          latestTimestamp,
          latestEval,
          nextAlerts,
          alertsById,
          /* emit */ true,
          queuedEvents,
        );
      }
    }

    this.state = {
      ...this.state,
      now,
      telemetry,
      alerts: nextAlerts,
    };
    this.emit();
    for (const event of queuedEvents) this.emitAlertEvent(event);
  }

  private applyEvaluations(
    pumpId: string,
    timestamp: Date,
    evaluations: SignalEvaluation[],
    alerts: Alert[],
    alertsById: Map<string, Alert>,
    emit: boolean,
    queuedEvents?: AlertEvent[],
  ): void {
    let openForPump = this.openBySignal.get(pumpId);
    if (!openForPump) {
      openForPump = new Map();
      this.openBySignal.set(pumpId, openForPump);
    }

    for (const ev of evaluations) {
      const openId = openForPump.get(ev.signal);

      if (ev.state === 'nominal') {
        if (!openId) continue;
        const existing = alertsById.get(openId);
        if (!existing) {
          openForPump.delete(ev.signal);
          continue;
        }
        const resolved: Alert = {
          ...existing,
          endedAt: timestamp,
          currentSeverity: 'nominal',
        };
        replaceAlert(alerts, alertsById, resolved);
        openForPump.delete(ev.signal);
        if (emit && queuedEvents) {
          queuedEvents.push({ type: 'resolved', alert: resolved });
        }
        continue;
      }

      // ev.state is 'warning' | 'critical'
      const direction = ev.direction!;
      const severity: AlertSeverity = ev.state;

      if (!openId) {
        const created: Alert = {
          id: this.nextAlertId(),
          pumpId,
          signal: ev.signal,
          startedAt: timestamp,
          peakSeverity: severity,
          currentSeverity: severity,
          peakValue: ev.value,
          peakDirection: direction,
        };
        alerts.push(created);
        alertsById.set(created.id, created);
        openForPump.set(ev.signal, created.id);
        if (emit && queuedEvents) {
          queuedEvents.push({ type: 'opened', alert: created });
        }
        continue;
      }

      const existing = alertsById.get(openId);
      if (!existing) {
        openForPump.delete(ev.signal);
        continue;
      }

      const escalated =
        severityRank(severity) > severityRank(existing.peakSeverity);
      const peakSeverity: AlertSeverity = escalated ? severity : existing.peakSeverity;
      const peakValue = isMoreExtreme(ev.value, existing.peakValue, direction)
        ? ev.value
        : existing.peakValue;
      const peakDirection = peakValue === ev.value ? direction : existing.peakDirection;

      const updated: Alert = {
        ...existing,
        currentSeverity: severity,
        peakSeverity,
        peakValue,
        peakDirection,
        acknowledgedAt: escalated ? undefined : existing.acknowledgedAt,
      };
      replaceAlert(alerts, alertsById, updated);

      if (escalated && emit && queuedEvents) {
        queuedEvents.push({ type: 'escalated', alert: updated });
      }
    }
  }

  startLiveUpdates(intervalMs = 5000): void {
    this.liveSubscribers += 1;
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      this.tick();
    }, intervalMs);
  }

  stopLiveUpdates(): void {
    this.liveSubscribers = Math.max(0, this.liveSubscribers - 1);
    if (this.liveSubscribers === 0 && this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  dispose(): void {
    this.liveSubscribers = 0;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.listeners.clear();
    this.alertEventListeners.clear();
  }
}

function isMoreExtreme(value: number, peak: number, direction: 'high' | 'low'): boolean {
  return direction === 'high' ? value > peak : value < peak;
}

function replaceAlert(
  alerts: Alert[],
  alertsById: Map<string, Alert>,
  next: Alert,
): void {
  const idx = alerts.findIndex((a) => a.id === next.id);
  if (idx >= 0) alerts[idx] = next;
  alertsById.set(next.id, next);
}

let storeSingleton: FleetStore | null = null;

export function getStore(): FleetStore {
  if (!storeSingleton) {
    storeSingleton = new FleetStore();
  }
  return storeSingleton;
}

export function resetStoreForTest(now?: Date): FleetStore {
  storeSingleton?.dispose();
  storeSingleton = new FleetStore(now);
  return storeSingleton;
}
