import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { AlertList } from '../components/detail/AlertList';
import { MaintenanceTable } from '../components/detail/MaintenanceTable';
import { TelemetryChart } from '../components/detail/TelemetryChart';
import { TimeWindowSelector } from '../components/detail/TimeWindowSelector';
import { WorkOrderForm } from '../components/detail/WorkOrderForm';
import { WorkOrderList } from '../components/detail/WorkOrderList';
import type { TimeWindow, WorkOrder } from '../domain/models';
import { SIGNAL_ORDER } from '../domain/models';
import { useLiveTick } from '../hooks/useLiveTick';
import { useFleetStore, useStoreSnapshot } from '../hooks/useStore';

interface PumpDetailSearch {
  from?: 'alert';
}

export const Route = createFileRoute('/pump/$id')({
  component: PumpDetail,
  validateSearch: (search: Record<string, unknown>): PumpDetailSearch => {
    return search.from === 'alert' ? { from: 'alert' } : {};
  },
});

function PumpDetail() {
  useLiveTick();
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const store = useFleetStore();
  const snapshot = useStoreSnapshot();
  const navigate = useNavigate();
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: '/' });
    }
  };
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('24h');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [deleting, setDeleting] = useState<WorkOrder | null>(null);

  const pump = store.getPump(id);
  if (!pump) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h5">Pump not found</Typography>
          <Button variant="text" onClick={() => navigate({ to: '/' })}>
            Back to fleet
          </Button>
        </Stack>
      </Container>
    );
  }

  const telemetry = store.getTelemetry(pump.id, timeWindow);
  const status = store.computeStatus(pump.id);
  const alerts = store.getAlerts(pump.id);
  const workOrders = store.getWorkOrders(pump.id);
  const maintenance = store.getMaintenance(pump.id);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {search.from === 'alert' && (
          <Box>
            <Chip
              icon={<ArrowBackIcon fontSize="small" />}
              label="Back"
              variant="outlined"
              clickable
              onClick={handleBack}
              data-testid="back-from-alert"
              aria-label="back-from-alert"
            />
          </Box>
        )}
        <Stack
          direction="row"
          useFlexGap
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1">
              {pump.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pump.location} · {pump.model} · Installed{' '}
              {pump.installedDate.toLocaleDateString()}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <StatusBadge status={status} size="medium" />
            <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
          </Stack>
        </Stack>

        {pump.status === 'maintenance' && (
          <Alert
            severity="info"
            variant="outlined"
            data-testid="maintenance-banner"
          >
            <AlertTitle>Scheduled maintenance</AlertTitle>
            This pump is currently offline for routine service.
          </Alert>
        )}

        <Grid container spacing={2}>
          {SIGNAL_ORDER.map((signal) => (
            <Grid key={signal} size={{ xs: 12, md: 6 }}>
              <TelemetryChart
                signal={signal}
                data={telemetry}
                window={timeWindow}
              />
            </Grid>
          ))}
        </Grid>

        <AlertList
          alerts={alerts}
          now={snapshot.now}
          onAcknowledge={(aid) => store.acknowledgeAlert(aid)}
        />

        <WorkOrderList
          workOrders={workOrders}
          onCreate={() => setCreateOpen(true)}
          onEdit={(w) => setEditing(w)}
          onDelete={(w) => setDeleting(w)}
          onBeginWork={(w) =>
            store.updateWorkOrder(w.id, {
              title: w.title,
              description: w.description,
              type: w.type,
              status: 'in_progress',
              dueDate: w.dueDate,
            })
          }
          onComplete={(w) =>
            store.updateWorkOrder(w.id, {
              title: w.title,
              description: w.description,
              type: w.type,
              status: 'completed',
              dueDate: w.dueDate,
            })
          }
        />

        <MaintenanceTable schedules={maintenance} now={snapshot.now} />

        {createOpen && (
          <WorkOrderForm
            mode="create"
            open
            pumpId={pump.id}
            onClose={() => setCreateOpen(false)}
            onSubmit={(input) => store.createWorkOrder(input)}
          />
        )}

        {editing && (
          <WorkOrderForm
            mode="edit"
            open
            workOrder={editing}
            onClose={() => setEditing(null)}
            onSubmit={(id, input) => store.updateWorkOrder(id, input)}
          />
        )}

        <Dialog
          open={deleting !== null}
          onClose={() => setDeleting(null)}
          aria-label="delete-work-order-dialog"
        >
          <DialogTitle>Delete work order?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {deleting ? `"${deleting.title}" will be permanently removed.` : ''}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => {
                if (deleting) store.deleteWorkOrder(deleting.id);
                setDeleting(null);
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}
