import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TelemetryChart } from './TelemetryChart';

describe('TelemetryChart', () => {
  it('renders the no-sensor-data placeholder when data is empty', () => {
    render(<TelemetryChart signal="vibration" data={[]} window="24h" />);
    expect(screen.getByLabelText('chart-vibration-empty')).toBeTruthy();
    expect(screen.getByText(/no sensor data/i)).toBeTruthy();
  });

  it('renders the title with unit even in the empty state', () => {
    render(<TelemetryChart signal="outletPressure" data={[]} window="24h" />);
    expect(screen.getByText(/Outlet Pressure \(bar\)/)).toBeTruthy();
  });
});
