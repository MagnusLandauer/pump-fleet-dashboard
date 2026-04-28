import { Container, Stack, Grid } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { PumpCard } from '../components/list/PumpCard';
import { SummaryStatsBar } from '../components/list/SummaryStatsBar';
import { useLiveTick } from '../hooks/useLiveTick';
import { useFleetStore, useStoreSnapshot } from '../hooks/useStore';

export const Route = createFileRoute('/')({
  component: FleetOverview,
});

function FleetOverview() {
  useLiveTick();
  const store = useFleetStore();
  useStoreSnapshot();

  const summary = store.getFleetSummary();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <SummaryStatsBar {...summary} />
        <Grid container spacing={2}>
          {store.getPumps().map((pump) => {
            const telemetry = store.getTelemetry(pump.id);
            return (
              <Grid key={pump.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <PumpCard
                  pump={pump}
                  status={store.computeStatus(pump.id)}
                  latest={telemetry[telemetry.length - 1]}
                />
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </Container>
  );
}
