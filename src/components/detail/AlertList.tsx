import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import type { Alert, AlertSeverity } from '../../domain/models';
import { THRESHOLDS } from '../../domain/models';
import { formatAlertMessage } from '../../utils/alertMessage';
import { formatDuration, formatRelativeTime } from '../../utils/format';

interface AlertListProps {
  alerts: Alert[];
  now: Date;
  onAcknowledge: (id: string) => void;
}

type StateFilter = 'active' | 'resolved' | 'all';
type SeverityFilter = AlertSeverity | 'all';

const MAX_VISIBLE = 50;

const ACK_TOOLTIP =
  'Mark as seen — silences future toasts for this incident, but it stays here until the metric returns to normal.';

function isResolved(alert: Alert): boolean {
  return alert.endedAt != null;
}

function severityRank(s: AlertSeverity): number {
  return s === 'critical' ? 2 : 1;
}

function compareIncidents(a: Alert, b: Alert): number {
  const aResolved = isResolved(a);
  const bResolved = isResolved(b);
  if (aResolved !== bResolved) return aResolved ? 1 : -1;
  if (!aResolved) {
    const sevDiff =
      severityRank(
        b.currentSeverity === 'nominal' ? 'warning' : b.currentSeverity,
      ) -
      severityRank(
        a.currentSeverity === 'nominal' ? 'warning' : a.currentSeverity,
      );
    if (sevDiff !== 0) return sevDiff;
    return b.startedAt.getTime() - a.startedAt.getTime();
  }
  return b.endedAt!.getTime() - a.endedAt!.getTime();
}

function stateLabel(alert: Alert): string {
  if (isResolved(alert)) return 'Resolved';
  return alert.currentSeverity === 'critical'
    ? 'Active · Critical'
    : 'Active · Warning';
}

function stateChipProps(alert: Alert): {
  color: 'error' | 'warning' | 'default';
  variant: 'filled' | 'outlined';
} {
  if (isResolved(alert)) return { color: 'default', variant: 'outlined' };
  if (alert.currentSeverity === 'critical')
    return { color: 'error', variant: 'filled' };
  return { color: 'warning', variant: 'filled' };
}

export function AlertList({ alerts, now, onAcknowledge }: AlertListProps) {
  const [stateFilter, setStateFilter] = useState<StateFilter>('active');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  const { visible, hiddenCount } = useMemo(() => {
    let filtered = alerts;
    if (stateFilter === 'active')
      filtered = filtered.filter((a) => !isResolved(a));
    else if (stateFilter === 'resolved') filtered = filtered.filter(isResolved);
    if (severityFilter !== 'all') {
      filtered = filtered.filter((a) => a.peakSeverity === severityFilter);
    }
    const sorted = [...filtered].sort(compareIncidents);
    return {
      visible: sorted.slice(0, MAX_VISIBLE),
      hiddenCount: Math.max(0, sorted.length - MAX_VISIBLE),
    };
  }, [alerts, stateFilter, severityFilter]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h6">Alerts</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            select
            size="small"
            label="State"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as StateFilter)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Severity"
            value={severityFilter}
            onChange={(e) =>
              setSeverityFilter(e.target.value as SeverityFilter)
            }
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </TextField>
        </Stack>
      </Stack>
      {visible.length === 0 ? (
        <Box sx={{ py: 2, color: 'text.secondary' }}>
          <Typography variant="body2">
            {stateFilter === 'active'
              ? 'No active alerts.'
              : 'No alerts to show.'}
          </Typography>
        </Box>
      ) : (
        <>
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {visible.map((a, i) => {
              const resolved = isResolved(a);
              const acknowledged = a.acknowledgedAt != null;
              const showAckButton = !resolved && !acknowledged;
              const peakedDownward =
                !resolved &&
                a.peakSeverity === 'critical' &&
                a.currentSeverity === 'warning';
              const durationMs = resolved
                ? a.endedAt!.getTime() - a.startedAt.getTime()
                : now.getTime() - a.startedAt.getTime();
              const startedAbsolute = a.startedAt.toLocaleString();
              const stateProps = stateChipProps(a);

              return (
                <Box
                  component="li"
                  key={a.id}
                  data-testid={`alert-${a.id}`}
                  sx={{
                    py: 1.25,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'flex-start' },
                    gap: 1,
                    borderBottom: i < visible.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        rowGap: 0.5,
                      }}
                    >
                      <Chip
                        size="small"
                        color={stateProps.color}
                        variant={stateProps.variant}
                        label={stateLabel(a)}
                      />
                      {peakedDownward && (
                        <Chip
                          size="small"
                          variant="outlined"
                          color="error"
                          label="Peaked at: critical"
                        />
                      )}
                      {acknowledged && !resolved && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="Acknowledged"
                        />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {THRESHOLDS[a.signal].label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatAlertMessage(a)}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{
                        mt: 0.5,
                        color: 'text.secondary',
                        flexWrap: 'wrap',
                        rowGap: 0.5,
                      }}
                    >
                      <Tooltip title={startedAbsolute}>
                        <Typography variant="body2" component="span">
                          Started {formatRelativeTime(a.startedAt, now)}
                        </Typography>
                      </Tooltip>
                      <Typography variant="body2" component="span">
                        {resolved ? 'Lasted' : 'Running'}{' '}
                        {formatDuration(Math.max(0, durationMs))}
                      </Typography>
                    </Stack>
                  </Box>
                  {showAckButton && (
                    <Tooltip title={ACK_TOOLTIP} placement="left">
                      <Button
                        size="small"
                        onClick={() => onAcknowledge(a.id)}
                        aria-label={`acknowledge-${a.id}`}
                        sx={{
                          alignSelf: { xs: 'flex-end', sm: 'flex-start' },
                          flexShrink: 0,
                        }}
                      >
                        Acknowledge
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              );
            })}
          </Box>
          {hiddenCount > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              Showing {visible.length} most recent — {hiddenCount} older{' '}
              {hiddenCount === 1 ? 'incident' : 'incidents'} not shown.
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
}
