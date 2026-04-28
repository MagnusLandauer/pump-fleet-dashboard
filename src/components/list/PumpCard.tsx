import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from '@tanstack/react-router';
import type { Pump, TelemetryPoint } from '../../domain/models';
import type { DerivedStatus } from '../../domain/models';
import { StatusBadge } from '../StatusBadge';

interface PumpCardProps {
  pump: Pump;
  status: DerivedStatus;
  latest: TelemetryPoint | undefined;
}

export function PumpCard({ pump, status, latest }: PumpCardProps) {
  const navigate = useNavigate();
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        '&:hover': {
          borderColor: (t) => alpha(t.palette.primary.main, 0.5),
          transform: 'translateY(-1px)',
        },
      }}
      data-testid={`pump-card-${pump.id}`}
    >
      <CardActionArea
        onClick={() => navigate({ to: '/pump/$id', params: { id: pump.id } })}
        sx={{ height: '100%' }}
        aria-label={`open-${pump.id}`}
      >
        <CardContent>
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <Box>
              <Typography variant="h6" component="h2">
                {pump.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pump.location} · {pump.model}
              </Typography>
            </Box>
            <StatusBadge status={status} />
          </Stack>
          {latest ? (
            <Stack direction="row" spacing={3} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
              <Reading label="Flow" value={`${latest.flowRate.toFixed(1)} m³/h`} />
              <Reading label="Outlet" value={`${latest.outletPressure.toFixed(2)} bar`} />
              <Reading label="Vibration" value={`${latest.vibration.toFixed(2)} mm/s`} />
              <Reading label="Temp" value={`${latest.temperature.toFixed(1)} °C`} />
            </Stack>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, fontStyle: 'italic' }}
            >
              No sensor data
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="div">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}
