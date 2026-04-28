import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { WorkOrder, WorkOrderStatus } from '../../domain/models';

const STATUS_COLOR: Record<
  WorkOrderStatus,
  'default' | 'info' | 'success' | 'error'
> = {
  open: 'default',
  in_progress: 'info',
  completed: 'success',
  overdue: 'error',
};

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

interface WorkOrderListProps {
  workOrders: WorkOrder[];
  onCreate: () => void;
}

export function WorkOrderList({ workOrders, onCreate }: WorkOrderListProps) {
  const sorted = [...workOrders].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
      >
        <Typography variant="h6">Work Orders</Typography>
        <Button variant="contained" size="small" onClick={onCreate}>
          Create Work Order
        </Button>
      </Stack>
      {sorted.length === 0 ? (
        <Box sx={{ py: 2, color: 'text.secondary' }}>
          <Typography variant="body2">No work orders for this pump.</Typography>
        </Box>
      ) : (
        <List dense disablePadding>
          {sorted.map((w, i) => (
            <ListItem
              key={w.id}
              divider={i < sorted.length - 1}
              data-testid={`work-order-${w.id}`}
              sx={
                w.status === 'overdue'
                  ? { bgcolor: (t) => alpha(t.palette.error.main, 0.1) }
                  : undefined
              }
            >
              <ListItemText
                primary={
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center' }}
                  >
                    <Chip
                      size="small"
                      color={STATUS_COLOR[w.status]}
                      label={STATUS_LABEL[w.status]}
                    />
                    <Chip size="small" variant="outlined" label={w.type} />
                    <Typography variant="body2">{w.title}</Typography>
                  </Stack>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Due {w.dueDate.toLocaleDateString()} · {w.description}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
