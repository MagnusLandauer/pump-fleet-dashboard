import { Alert as MuiAlert, AlertTitle, Button, Snackbar, Stack } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Alert, AlertEvent } from '../../domain/models';
import { THRESHOLDS } from '../../domain/models';
import type { FleetStore } from '../../domain/store';
import { useFleetStore } from '../../hooks/useStore';
import { formatAlertMessage } from '../../utils/alertMessage';

interface ToastEntry {
  toastId: number;
  alerts: Alert[];
}

const MAX_VISIBLE = 3;
const WARNING_AUTO_HIDE_MS = 8000;

function highestSeverity(alerts: Alert[]): 'critical' | 'warning' {
  return alerts.some((a) => a.currentSeverity === 'critical') ? 'critical' : 'warning';
}

function formatGroupBody(alerts: Alert[]): string {
  const labels = alerts.map((a) => THRESHOLDS[a.signal].label).join(', ');
  return `${alerts.length} active incidents — ${labels}`;
}

// Replay currently-open, unacknowledged incidents so operators see what is
// already wrong on page load. Multiple incidents on the same pump collapse
// into one combined toast. Runs once per component instance (lazy state init)
// so React StrictMode's double-mount in dev does not double-seed.
function buildSeededToasts(store: FleetStore, allocId: () => number): ToastEntry[] {
  const active = store
    .getActiveAlerts()
    .filter((a) => a.acknowledgedAt == null);
  if (active.length === 0) return [];
  const byPump = new Map<string, Alert[]>();
  for (const a of active) {
    const list = byPump.get(a.pumpId) ?? [];
    list.push(a);
    byPump.set(a.pumpId, list);
  }
  const seeded: ToastEntry[] = [...byPump.values()]
    .map((alerts) => ({
      toastId: allocId(),
      alerts: alerts.slice().sort(
        (a, b) =>
          (a.currentSeverity === 'critical' ? 0 : 1) -
          (b.currentSeverity === 'critical' ? 0 : 1),
      ),
    }))
    .sort(
      (a, b) =>
        (highestSeverity(a.alerts) === 'critical' ? 0 : 1) -
        (highestSeverity(b.alerts) === 'critical' ? 0 : 1),
    );
  return seeded.slice(Math.max(0, seeded.length - MAX_VISIBLE));
}

export function LiveAlertToaster() {
  const store = useFleetStore();
  const navigate = useNavigate();
  const idCounterRef = useRef(0);
  const allocId = () => {
    idCounterRef.current += 1;
    return idCounterRef.current;
  };
  const [toasts, setToasts] = useState<ToastEntry[]>(() =>
    buildSeededToasts(store, allocId),
  );

  useEffect(() => {
    const handler = (event: AlertEvent) => {
      if (event.type === 'resolved') return;
      if (event.alert.acknowledgedAt != null) return;
      setToasts((prev) => {
        const entry: ToastEntry = { toastId: allocId(), alerts: [event.alert] };
        const next = [...prev, entry];
        if (next.length <= MAX_VISIBLE) return next;
        return next.slice(next.length - MAX_VISIBLE);
      });
    };
    return store.subscribeToAlertEvents(handler);
    // allocId is stable enough for our needs (refs are stable across renders).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const removeToast = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const removeToastsForPump = useCallback((pumpId: string) => {
    setToasts((prev) => prev.filter((t) => t.alerts[0]?.pumpId !== pumpId));
  }, []);

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: (t) => t.zIndex.snackbar,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const primary = t.alerts[0];
        const pump = store.getPump(primary.pumpId);
        const isGroup = t.alerts.length > 1;
        const isCritical = highestSeverity(t.alerts) === 'critical';
        const onClose = () => removeToast(t.toastId);
        const testIdSuffix = isGroup ? `${primary.pumpId}-group` : primary.id;

        return (
          <Snackbar
            key={t.toastId}
            open
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            autoHideDuration={isCritical ? null : WARNING_AUTO_HIDE_MS}
            onClose={(_, reason) => {
              if (reason === 'clickaway') return;
              onClose();
            }}
            sx={{ position: 'static', transform: 'none', pointerEvents: 'auto' }}
          >
            <MuiAlert
              severity={isCritical ? 'error' : 'warning'}
              variant="filled"
              data-testid={`live-toast-${testIdSuffix}`}
              sx={{ minWidth: 320 }}
              action={
                <Stack direction="row" spacing={1}>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      navigate({
                        to: '/pump/$id',
                        params: { id: primary.pumpId },
                        search: { from: 'alert' },
                      });
                      removeToastsForPump(primary.pumpId);
                    }}
                  >
                    View pump
                  </Button>
                  <Button color="inherit" size="small" onClick={onClose}>
                    Dismiss
                  </Button>
                </Stack>
              }
            >
              <AlertTitle>{pump?.name ?? primary.pumpId}</AlertTitle>
              {isGroup ? formatGroupBody(t.alerts) : formatAlertMessage(primary)}
            </MuiAlert>
          </Snackbar>
        );
      })}
    </Stack>
  );
}
