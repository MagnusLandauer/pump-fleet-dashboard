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
import type { CreateWorkOrderInput } from '../../domain/store';
import type { WorkOrderType } from '../../domain/models';

interface WorkOrderFormProps {
  open: boolean;
  pumpId: string;
  onClose: () => void;
  onSubmit: (input: CreateWorkOrderInput) => void;
}

function defaultDueDate(): string {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export function WorkOrderForm({ open, pumpId, onClose, onSubmit }: WorkOrderFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkOrderType>('corrective');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [titleError, setTitleError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setType('corrective');
    setDueDate(defaultDueDate());
    setTitleError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    onSubmit({
      pumpId,
      title: title.trim(),
      description: description.trim(),
      type,
      dueDate: new Date(dueDate),
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit} aria-label="create-work-order-form">
        <DialogTitle>Create Work Order</DialogTitle>
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
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
