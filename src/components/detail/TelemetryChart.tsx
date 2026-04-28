import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { THRESHOLDS } from '../../domain/models';
import type { TelemetryPoint, TelemetrySignal, TimeWindow } from '../../domain/models';
import { useMeasured } from '../../hooks/useMeasured';
import { formatTimestamp } from '../../utils/format';

const CHART_HEIGHT = 200;

interface TelemetryChartProps {
  signal: TelemetrySignal;
  data: TelemetryPoint[];
  window: TimeWindow;
}

export function TelemetryChart({ signal, data, window }: TelemetryChartProps) {
  const theme = useTheme();
  const threshold = THRESHOLDS[signal];
  const chartData = data.map((p) => ({ t: p.timestamp.getTime(), v: p[signal] }));
  const [containerRef, size] = useMeasured<HTMLDivElement>();

  const grid = theme.palette.divider;
  const tick = theme.palette.text.secondary;
  const line = theme.palette.primary.main;
  const warn = theme.palette.warning.main;
  const err = theme.palette.error.main;
  const tooltipBg = theme.palette.background.paper;
  const tooltipBorder = theme.palette.divider;
  const tooltipText = theme.palette.text.primary;

  if (data.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {threshold.label} ({threshold.unit})
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: CHART_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              border: `1px dashed ${grid}`,
              borderRadius: 1,
            }}
            aria-label={`chart-${signal}-empty`}
          >
            <Typography variant="body2">No sensor data</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          {threshold.label} ({threshold.unit})
        </Typography>
        <Box
          ref={containerRef}
          sx={{ width: '100%', height: CHART_HEIGHT, minWidth: 0 }}
          aria-label={`chart-${signal}`}
        >
          {size && (
            <LineChart
              width={size.width}
              height={size.height}
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v: number) => formatTimestamp(v, window)}
                minTickGap={40}
                stroke={grid}
                tick={{ fill: tick, fontSize: 11 }}
                tickLine={{ stroke: grid }}
                axisLine={{ stroke: grid }}
              />
              <YAxis
                domain={['auto', 'auto']}
                width={50}
                stroke={grid}
                tick={{ fill: tick, fontSize: 11 }}
                tickLine={{ stroke: grid }}
                axisLine={{ stroke: grid }}
              />
              <Tooltip
                contentStyle={{
                  background: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: 8,
                  color: tooltipText,
                  fontSize: 12,
                }}
                labelStyle={{ color: tick }}
                itemStyle={{ color: tooltipText }}
                cursor={{ stroke: line, strokeOpacity: 0.3 }}
                labelFormatter={(label) =>
                  new Date(Number(label)).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                formatter={(value) => [`${Number(value)} ${threshold.unit}`, threshold.label]}
              />
              {threshold.warningHigh !== undefined && (
                <ReferenceLine y={threshold.warningHigh} stroke={warn} strokeDasharray="4 4" />
              )}
              {threshold.warningLow !== undefined && (
                <ReferenceLine y={threshold.warningLow} stroke={warn} strokeDasharray="4 4" />
              )}
              {threshold.criticalHigh !== undefined && (
                <ReferenceLine y={threshold.criticalHigh} stroke={err} strokeDasharray="4 4" />
              )}
              {threshold.criticalLow !== undefined && (
                <ReferenceLine y={threshold.criticalLow} stroke={err} strokeDasharray="4 4" />
              )}
              <Line
                type="monotone"
                dataKey="v"
                stroke={line}
                dot={false}
                isAnimationActive={false}
                strokeWidth={2}
              />
            </LineChart>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
