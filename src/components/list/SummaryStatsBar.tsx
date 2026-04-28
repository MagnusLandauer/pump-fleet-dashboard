import { Box, Paper, Stack, Typography } from '@mui/material';

interface SummaryStatsBarProps {
  total: number;
  withAlerts: number;
  overdueMaintenance: number;
}

export function SummaryStatsBar({ total, withAlerts, overdueMaintenance }: SummaryStatsBarProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={4} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Stat label="Total pumps" value={total} />
        <Stat label="With active alerts" value={withAlerts} highlight={withAlerts > 0 ? 'warning' : undefined} />
        <Stat
          label="Overdue maintenance"
          value={overdueMaintenance}
          highlight={overdueMaintenance > 0 ? 'error' : undefined}
        />
      </Stack>
    </Paper>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: 'warning' | 'error';
}) {
  const color = highlight === 'error' ? 'error.main' : highlight === 'warning' ? 'warning.main' : 'text.primary';
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="div">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  );
}
