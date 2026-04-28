import { Chip } from '@mui/material';
import type { DerivedStatus } from '../domain/models';

const COLORS: Record<DerivedStatus, 'success' | 'warning' | 'error'> = {
  green: 'success',
  yellow: 'warning',
  red: 'error',
  maintenance: 'warning',
};

const LABELS: Record<DerivedStatus, string> = {
  green: 'Running',
  yellow: 'Warning',
  red: 'Critical',
  maintenance: 'Maintenance',
};

export function StatusBadge({ status, size = 'small' }: { status: DerivedStatus; size?: 'small' | 'medium' }) {
  return <Chip color={COLORS[status]} label={LABELS[status]} size={size} aria-label={`status-${status}`} />;
}
