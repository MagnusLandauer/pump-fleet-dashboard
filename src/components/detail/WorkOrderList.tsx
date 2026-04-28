import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrowOutlined';
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
  onEdit: (workOrder: WorkOrder) => void;
  onDelete: (workOrder: WorkOrder) => void;
  onBeginWork: (workOrder: WorkOrder) => void;
  onComplete: (workOrder: WorkOrder) => void;
}

export function WorkOrderList({
  workOrders,
  onCreate,
  onEdit,
  onDelete,
  onBeginWork,
  onComplete,
}: WorkOrderListProps) {
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
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {sorted.map((w, i) => {
            const actions =
              w.status === 'in_progress' ? (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  aria-label={`complete-${w.id}`}
                  onClick={() => onComplete(w)}
                >
                  Mark as completed
                </Button>
              ) : w.status === 'completed' ? null : (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexWrap: 'wrap', rowGap: 1 }}
                >
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    aria-label={`begin-${w.id}`}
                    onClick={() => onBeginWork(w)}
                  >
                    Begin work
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    aria-label={`edit-${w.id}`}
                    onClick={() => onEdit(w)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    aria-label={`delete-${w.id}`}
                    onClick={() => onDelete(w)}
                  >
                    Delete
                  </Button>
                </Stack>
              );

            return (
              <Box
                component="li"
                key={w.id}
                data-testid={`work-order-${w.id}`}
                sx={{
                  py: 1.25,
                  px: 1,
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'stretch', md: 'flex-start' },
                  gap: 1.5,
                  borderBottom: i < sorted.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  bgcolor:
                    w.status === 'overdue'
                      ? (t) => alpha(t.palette.error.main, 0.1)
                      : undefined,
                  borderRadius: w.status === 'overdue' ? 1 : 0,
                }}
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
                  >
                    <Chip
                      size="small"
                      color={STATUS_COLOR[w.status]}
                      label={STATUS_LABEL[w.status]}
                    />
                    <Chip size="small" variant="outlined" label={w.type} />
                    <Typography variant="body2">{w.title}</Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.75 }}
                  >
                    Due {w.dueDate.toLocaleDateString()} · {w.description}
                  </Typography>
                </Box>
                {actions && (
                  <Box
                    sx={{
                      flexShrink: 0,
                      alignSelf: { xs: 'flex-start', md: 'flex-start' },
                    }}
                  >
                    {actions}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
