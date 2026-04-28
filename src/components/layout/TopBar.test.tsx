import { render, screen } from '@testing-library/react';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';
import { resetStoreForTest } from '../../domain/store';

const NOW = new Date('2026-04-27T12:00:00Z');

function renderTopBar({
  initialPath = '/',
  showMenuButton = false,
  onMenuClick = () => {},
}: {
  initialPath?: string;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
} = {}) {
  const root = createRootRoute({
    component: () => (
      <>
        <TopBar onMenuClick={onMenuClick} showMenuButton={showMenuButton} />
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
    component: () => <div>Detail</div>,
  });
  const router = createRouter({
    routeTree: root.addChildren([index, detail]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('TopBar', () => {
  beforeEach(() => {
    resetStoreForTest(NOW);
  });

  it('shows the fleet overview title on the index route', async () => {
    renderTopBar({ initialPath: '/' });
    const title = await screen.findByTestId('page-title');
    expect(title.textContent).toBe('Fleet Overview');
  });

  it('shows the pump detail title on a pump route', async () => {
    renderTopBar({ initialPath: '/pump/pump-001' });
    const title = await screen.findByTestId('page-title');
    expect(title.textContent).toBe('Pump Detail');
  });

  it('renders a live indicator with a clock', async () => {
    renderTopBar();
    const live = await screen.findByLabelText('live status');
    expect(live.textContent).toMatch(/live\s*•\s*\d{2}:\d{2}:\d{2}/);
  });

  it('hides the menu button on desktop', async () => {
    renderTopBar({ showMenuButton: false });
    await screen.findByLabelText('live status');
    expect(screen.queryByLabelText('open navigation')).toBeNull();
  });

  it('shows and triggers the menu button on mobile', async () => {
    const onMenuClick = vi.fn();
    renderTopBar({ showMenuButton: true, onMenuClick });
    const button = await screen.findByLabelText('open navigation');
    button.click();
    expect(onMenuClick).toHaveBeenCalled();
  });
});
