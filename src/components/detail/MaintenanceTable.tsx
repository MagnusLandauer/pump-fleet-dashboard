import {
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { MaintenanceSchedule } from '../../domain/models';

interface MaintenanceTableProps {
  schedules: MaintenanceSchedule[];
  now: Date;
}

export function MaintenanceTable({ schedules, now }: MaintenanceTableProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Maintenance Schedule
      </Typography>
      {schedules.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No scheduled tasks for this pump.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Interval</TableCell>
                <TableCell>Last Performed</TableCell>
                <TableCell>Next Due</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((s) => {
                const overdue = s.nextDue.getTime() < now.getTime();
                const missing = s.lastPerformed === null;
                return (
                  <TableRow
                    key={`${s.pumpId}-${s.task}`}
                    sx={overdue ? { bgcolor: (t) => alpha(t.palette.error.main, 0.1) } : undefined}
                  >
                    <TableCell>{s.task}</TableCell>
                    <TableCell>{s.intervalDays} days</TableCell>
                    <TableCell>
                      {s.lastPerformed ? s.lastPerformed.toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>{s.nextDue.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {overdue && <Chip size="small" color="error" label="Overdue" />}
                        {missing && <Chip size="small" color="warning" label="Never performed" />}
                        {!overdue && !missing && <Chip size="small" color="success" label="On track" />}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
