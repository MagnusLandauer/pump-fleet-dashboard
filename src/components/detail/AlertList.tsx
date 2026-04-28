import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import type { Alert, AlertSeverity } from '../../domain/models';

interface AlertListProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}

type SeverityFilter = AlertSeverity | 'all';

const MAX_VISIBLE = 50;

export function AlertList({ alerts, onAcknowledge }: AlertListProps) {
  const [filter, setFilter] = useState<SeverityFilter>('all');

  const { visible, hiddenCount } = useMemo(() => {
    const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter);
    const sorted = [...filtered].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return {
      visible: sorted.slice(0, MAX_VISIBLE),
      hiddenCount: Math.max(0, sorted.length - MAX_VISIBLE),
    };
  }, [alerts, filter]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Alerts</Typography>
        <TextField
          select
          size="small"
          label="Severity"
          value={filter}
          onChange={(e) => setFilter(e.target.value as SeverityFilter)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="warning">Warning</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
        </TextField>
      </Stack>
      {visible.length === 0 ? (
        <Box sx={{ py: 2, color: 'text.secondary' }}>
          <Typography variant="body2">No alerts to show.</Typography>
        </Box>
      ) : (
        <>
        <List dense disablePadding>
          {visible.map((a) => (
            <ListItem
              key={a.id}
              divider
              secondaryAction={
                !a.acknowledged && (
                  <Button size="small" onClick={() => onAcknowledge(a.id)} aria-label={`acknowledge-${a.id}`}>
                    Acknowledge
                  </Button>
                )
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip
                      size="small"
                      color={a.severity === 'critical' ? 'error' : 'warning'}
                      label={a.severity}
                    />
                    {a.acknowledged && <Chip size="small" variant="outlined" label="ack" />}
                    <span>{a.message}</span>
                  </Stack>
                }
                secondary={a.timestamp.toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
        {hiddenCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Showing {visible.length} most recent — {hiddenCount} older {hiddenCount === 1 ? 'alert' : 'alerts'} not shown.
          </Typography>
        )}
        </>
      )}
    </Paper>
  );
}
