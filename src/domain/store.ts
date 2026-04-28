import type {
  Alert,
  DerivedStatus,
  MaintenanceSchedule,
  Pump,
  TelemetryPoint,
  TimeWindow,
  WorkOrder,
} from './models';
import { TIME_WINDOWS } from './models';
import { alertId, evaluateHistory, evaluatePoint } from './alerts/rules';
import type { EvaluatedAlert } from './alerts/rules';
import {
  buildMaintenanceSchedules,
  buildPumpRoster,
} from './generators/seed';
import {
  generateHistory,
  generateNextPoint,
} from './generators/telemetry';

type TelemetryCache = Map<string, Map<TimeWindow, TelemetryPoint[]>>;

interface StoreState {
  pumps: Pump[];
  telemetry: TelemetryCache;
  alerts: Alert[];
  workOrders: WorkOrder[];
  maintenance: MaintenanceSchedule[];
  now: Date;
}

type Listener = () => void;

export interface CreateWorkOrderInput {
  pumpId: string;
  title: string;
  description: string;
  type: WorkOrder['type'];
  dueDate: Date;
}

const DEFAULT_WINDOW: TimeWindow = '24h';
const NO_TELEMETRY: TelemetryPoint[] = [];

function openAlertKey(a: Pick<EvaluatedAlert, 'pumpId' | 'signal' | 'severity'>): string {
  return `${a.pumpId}:${a.signal}:${a.severity}`;
}

export class FleetStore {
  private state: StoreState;
  private listeners: Set<Listener> = new Set();
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private liveSubscribers = 0;
  private workOrderCounter = 0;
  private alertCounter = 0;

  constructor(now: Date = new Date()) {
    const pumps = buildPumpRoster(now);
    const telemetry: TelemetryCache = new Map();
    const alerts: Alert[] = [];
    const openKeys = new Set<string>();

    for (const pump of pumps) {
      if (pump.status === 'maintenance') continue;
      const points = generateHistory(pump.id, DEFAULT_WINDOW, now);
      telemetry.set(pump.id, new Map([[DEFAULT_WINDOW, points]]));
      for (const ev of evaluateHistory(pump.id, points)) {
        const key = openAlertKey(ev);
        if (openKeys.has(key)) continue;
        openKeys.add(key);
        alerts.push({
          id: alertId(ev),
          pumpId: ev.pumpId,
          timestamp: ev.timestamp,
          severity: ev.severity,
          signal: ev.signal,
          message: ev.message,
          acknowledged: false,
        });
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
    return `live-${this.alertCounter}`;
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
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
    return this.getAlerts(pumpId).filter((a) => !a.acknowledged);
  }

  acknowledgeAlert(id: string): void {
    const alerts = this.state.alerts.map((a) =>
      a.id === id ? { ...a, acknowledged: true } : a,
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
    if (active.some((a) => a.severity === 'critical')) return 'red';
    if (active.length > 0) return 'yellow';
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
    const newAlerts: Alert[] = [];
    const openKeys = new Set(this.getActiveAlerts().map(openAlertKey));

    for (const pump of this.state.pumps) {
      if (pump.status === 'maintenance') continue;
      const windows = telemetry.get(pump.id);
      if (!windows) continue;
      const updatedWindows = new Map(windows);

      for (const [w, points] of windows) {
        const last = points[points.length - 1];
        if (!last) continue;
        const cfg = TIME_WINDOWS[w];
        const next = generateNextPoint(pump.id, last.timestamp, now, cfg.resolutionMs);
        updatedWindows.set(w, [...points.slice(1), next]);

        for (const ev of evaluatePoint(pump.id, next)) {
          const key = openAlertKey(ev);
          if (openKeys.has(key)) continue;
          openKeys.add(key);
          newAlerts.push({
            id: this.nextAlertId(),
            pumpId: ev.pumpId,
            timestamp: ev.timestamp,
            severity: ev.severity,
            signal: ev.signal,
            message: ev.message,
            acknowledged: false,
          });
        }
      }

      telemetry.set(pump.id, updatedWindows);
    }

    this.state = {
      ...this.state,
      now,
      telemetry,
      alerts: newAlerts.length > 0 ? [...this.state.alerts, ...newAlerts] : this.state.alerts,
    };
    this.emit();
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
  }
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
