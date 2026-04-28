import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
} from '../../domain/store';
import type {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderType,
} from '../../domain/models';

interface CreateMode {
  mode: 'create';
  pumpId: string;
  onSubmit: (input: CreateWorkOrderInput) => void;
}

interface EditMode {
  mode: 'edit';
  workOrder: WorkOrder;
  onSubmit: (id: string, input: UpdateWorkOrderInput) => void;
}

type WorkOrderFormProps = (CreateMode | EditMode) & {
  open: boolean;
  onClose: () => void;
};

function defaultDueDate(): string {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function WorkOrderForm(props: WorkOrderFormProps) {
  const { open, onClose } = props;
  const isEdit = props.mode === 'edit';
  const initial = props.mode === 'edit' ? props.workOrder : null;

  const [title, setTitle] = useState(() => initial?.title ?? '');
  const [description, setDescription] = useState(() => initial?.description ?? '');
  const [type, setType] = useState<WorkOrderType>(() => initial?.type ?? 'corrective');
  const [status, setStatus] = useState<WorkOrderStatus>(() => initial?.status ?? 'open');
  const [dueDate, setDueDate] = useState(() =>
    initial ? toDateInput(initial.dueDate) : defaultDueDate(),
  );
  const [titleError, setTitleError] = useState('');

  const handleClose = () => {
    setTitleError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    if (props.mode === 'edit') {
      props.onSubmit(props.workOrder.id, {
        title: title.trim(),
        description: description.trim(),
        type,
        status,
        dueDate: new Date(dueDate),
      });
    } else {
      props.onSubmit({
        pumpId: props.pumpId,
        title: title.trim(),
        description: description.trim(),
        type,
        dueDate: new Date(dueDate),
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <form
        onSubmit={handleSubmit}
        aria-label={isEdit ? 'edit-work-order-form' : 'create-work-order-form'}
      >
        <DialogTitle>{isEdit ? 'Edit Work Order' : 'Create Work Order'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError('');
              }}
              error={!!titleError}
              helperText={titleError}
              autoFocus
              slotProps={{ htmlInput: { 'aria-label': 'wo-title' } }}
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              slotProps={{ htmlInput: { 'aria-label': 'wo-description' } }}
            />
            <TextField
              label="Type"
              select
              value={type}
              onChange={(e) => setType(e.target.value as WorkOrderType)}
              slotProps={{ htmlInput: { 'aria-label': 'wo-type' } }}
            >
              <MenuItem value="corrective">Corrective</MenuItem>
              <MenuItem value="planned">Planned</MenuItem>
            </TextField>
            {isEdit && (
              <TextField
                label="Status"
                select
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
                slotProps={{ htmlInput: { 'aria-label': 'wo-status' } }}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </TextField>
            )}
            <TextField
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { 'aria-label': 'wo-due-date' },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
