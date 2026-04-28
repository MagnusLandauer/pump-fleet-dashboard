import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';
import { resetStoreForTest } from '../../domain/store';

const NOW = new Date('2026-04-27T12:00:00Z');

function renderSidebar(initialPath = '/') {
  const root = createRootRoute({
    component: () => (
      <>
        <Sidebar variant="permanent" open onClose={() => {}} />
        <Outlet />
      </>
    ),
  });
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => <div>Fleet</div>,
  });
  const detail = createRoute({
    getParentRoute: () => root,
    path: '/pump/$id',
    component: () => <div data-testid="detail">Detail</div>,
  });
  const router = createRouter({
    routeTree: root.addChildren([index, detail]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('Sidebar', () => {
  beforeEach(() => {
    resetStoreForTest(NOW);
  });

  it('renders the brand and primary nav', async () => {
    renderSidebar();
    expect(await screen.findByText('Pump Fleet')).toBeTruthy();
    expect(screen.getByText('Overview')).toBeTruthy();
  });

  it('renders one item per pump from the store', async () => {
    renderSidebar();
    expect(await screen.findByTestId('sidebar-pump-pump-001')).toBeTruthy();
    expect(screen.getByTestId('sidebar-pump-pump-002')).toBeTruthy();
    expect(screen.getByTestId('sidebar-pump-pump-003')).toBeTruthy();
    expect(screen.getByTestId('sidebar-pump-pump-004')).toBeTruthy();
    expect(screen.getByTestId('sidebar-pump-pump-005')).toBeTruthy();
  });

  it('marks the active route with aria-current', async () => {
    renderSidebar('/');
    const fleetLink = await screen.findByText('Overview');
    expect(fleetLink.closest('[aria-current="page"]')).toBeTruthy();
  });

  it('shows a red status dot for the degraded pump', async () => {
    renderSidebar();
    const item = await screen.findByTestId('sidebar-pump-pump-003');
    const dot = item.querySelector('[data-status]');
    expect(dot?.getAttribute('data-status')).toBe('red');
  });

  it('navigates when a pump item is clicked', async () => {
    renderSidebar('/');
    const item = await screen.findByTestId('sidebar-pump-pump-001');
    await userEvent.click(item);
    expect(await screen.findByTestId('detail')).toBeTruthy();
  });
});
