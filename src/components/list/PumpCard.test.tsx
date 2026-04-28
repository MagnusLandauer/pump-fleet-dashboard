import { render, screen } from '@testing-library/react';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { PumpCard } from './PumpCard';
import type { Pump, TelemetryPoint } from '../../domain/models';

const pump: Pump = {
  id: 'pump-001',
  name: 'Alpha',
  location: 'North',
  model: 'CT-3200X',
  installedDate: new Date('2023-01-01'),
  status: 'running',
};

const telemetry: TelemetryPoint = {
  timestamp: new Date('2026-04-27T12:00:00Z'),
  rotationSpeed: 3000,
  inletPressure: 2.2,
  outletPressure: 11,
  flowRate: 55,
  vibration: 2,
  temperature: 65,
};

function renderWithRouter(children: React.ReactNode) {
  const root = createRootRoute({ component: () => <Outlet /> });
  const detail = createRoute({
    getParentRoute: () => root,
    path: '/pump/$id',
    component: () => <div>Detail</div>,
  });
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => <>{children}</>,
  });
  const router = createRouter({
    routeTree: root.addChildren([index, detail]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('PumpCard', () => {
  it('renders pump name and latest readings', async () => {
    renderWithRouter(<PumpCard pump={pump} status="green" latest={telemetry} />);
    expect(await screen.findByText('Alpha')).toBeTruthy();
    expect(screen.getByText('55.0 m³/h')).toBeTruthy();
    expect(screen.getByText('11.00 bar')).toBeTruthy();
    expect(screen.getByLabelText('status-green')).toBeTruthy();
  });

  it('shows the no-sensor-data placeholder when latest is undefined', async () => {
    const offline: Pump = { ...pump, status: 'maintenance' };
    renderWithRouter(<PumpCard pump={offline} status="maintenance" latest={undefined} />);
    expect(await screen.findByText('Alpha')).toBeTruthy();
    expect(screen.getByText(/no sensor data/i)).toBeTruthy();
    expect(screen.queryByText(/m³\/h/)).toBeNull();
  });
});
