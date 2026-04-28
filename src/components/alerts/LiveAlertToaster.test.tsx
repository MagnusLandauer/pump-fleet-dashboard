import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStoreForTest, getStore } from '../../domain/store';
import { routeTree } from '../../routeTree.gen';
import type { Alert, AlertEvent } from '../../domain/models';

const NOW = new Date('2026-04-27T12:00:00Z');

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'a1',
    pumpId: 'pump-001',
    signal: 'vibration',
    startedAt: NOW,
    peakSeverity: 'critical',
    currentSeverity: 'critical',
    peakValue: 5.5,
    peakDirection: 'high',
    ...overrides,
  };
}

function renderApp(initialEntries: string[] = ['/']) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
  });
  return render(<RouterProvider router={router} />);
}

function emitEvent(event: AlertEvent) {
  // Reach into the singleton store and call the private listener set
  // indirectly by invoking emitAlertEvent through tick path is too heavy;
  // we use a public surface: subscribers receive events. We trigger via
  // a re-entrant call by attaching our own listener that re-broadcasts.
  // Simpler: directly invoke subscribed listeners via private API access.
  const store = getStore() as unknown as {
    alertEventListeners: Set<(e: AlertEvent) => void>;
  };
  for (const l of store.alertEventListeners) l(event);
}

describe('LiveAlertToaster (integration)', () => {
  beforeEach(() => {
    resetStoreForTest(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    resetStoreForTest(NOW);
  });

  it('replays currently-open unacknowledged incidents on mount', async () => {
    renderApp();
    // The seeded degraded pump (pump-003) has at least one open critical
    // incident at construction time; the toaster must surface it without
    // waiting for a future tick.
    const toasts = await screen.findAllByTestId(/^live-toast-/);
    expect(toasts.length).toBeGreaterThan(0);
  });

  it('combines multiple seeded incidents for the same pump into a single toast', async () => {
    const active = getStore().getActiveAlerts('pump-003');
    // Sanity: this test is meaningful only when the degraded pump has
    // multiple open incidents at construction time.
    expect(active.length).toBeGreaterThan(1);

    renderApp();
    const grouped = await screen.findByTestId('live-toast-pump-003-group');
    expect(grouped.textContent ?? '').toMatch(/active incidents/i);
    // No per-incident toasts for the same pump alongside the group.
    for (const a of active) {
      expect(screen.queryByTestId(`live-toast-${a.id}`)).toBeNull();
    }
  });

  it('renders a snackbar when an opened event is emitted', async () => {
    renderApp();
    await screen.findByText(/fleet overview/i);
    act(() => {
      emitEvent({ type: 'opened', alert: makeAlert() });
    });
    expect(await screen.findByTestId('live-toast-a1')).toBeTruthy();
  });

  it('does not render toasts for resolved events', async () => {
    renderApp();
    await screen.findByText(/fleet overview/i);
    act(() => {
      emitEvent({
        type: 'resolved',
        alert: makeAlert({ id: 'a2', endedAt: NOW, currentSeverity: 'nominal' }),
      });
    });
    expect(screen.queryByTestId('live-toast-a2')).toBeNull();
  });

  it('skips toasts for already-acknowledged incidents on opened/escalated', async () => {
    renderApp();
    await screen.findByText(/fleet overview/i);
    act(() => {
      emitEvent({
        type: 'escalated',
        alert: makeAlert({ id: 'a3', acknowledgedAt: NOW }),
      });
    });
    expect(screen.queryByTestId('live-toast-a3')).toBeNull();
  });

  it('navigates to the pump with ?from=alert when View pump is clicked', async () => {
    renderApp();
    await screen.findByText(/fleet overview/i);
    act(() => {
      emitEvent({ type: 'opened', alert: makeAlert({ id: 'a4', pumpId: 'pump-003' }) });
    });
    const toast = await screen.findByTestId('live-toast-a4');
    await userEvent.click(within(toast).getByRole('button', { name: 'View pump' }));
    // Detail page renders the back chip when arriving from a toast.
    expect(await screen.findByTestId('back-from-alert')).toBeTruthy();
  });

  it('View pump clears all toasts for the same pump', async () => {
    renderApp();
    await screen.findByText(/fleet overview/i);
    act(() => {
      emitEvent({ type: 'opened', alert: makeAlert({ id: 'p1-a', pumpId: 'pump-002' }) });
      emitEvent({ type: 'opened', alert: makeAlert({ id: 'p1-b', pumpId: 'pump-002' }) });
      emitEvent({ type: 'opened', alert: makeAlert({ id: 'p2-a', pumpId: 'pump-004' }) });
    });
    const toast = await screen.findByTestId('live-toast-p1-a');
    expect(screen.getByTestId('live-toast-p1-b')).toBeTruthy();
    expect(screen.getByTestId('live-toast-p2-a')).toBeTruthy();

    await userEvent.click(within(toast).getByRole('button', { name: 'View pump' }));

    expect(screen.queryByTestId('live-toast-p1-a')).toBeNull();
    expect(screen.queryByTestId('live-toast-p1-b')).toBeNull();
    // Toasts for unrelated pumps are kept.
    expect(screen.getByTestId('live-toast-p2-a')).toBeTruthy();
  });

  it('Dismiss does not call acknowledgeAlert', async () => {
    const ackSpy = vi.spyOn(getStore(), 'acknowledgeAlert');
    renderApp();
    await screen.findByText(/fleet overview/i);
    act(() => {
      emitEvent({ type: 'opened', alert: makeAlert({ id: 'a5' }) });
    });
    const toast = await screen.findByTestId('live-toast-a5');
    await userEvent.click(within(toast).getByRole('button', { name: 'Dismiss' }));
    expect(ackSpy).not.toHaveBeenCalled();
  });

  it('caps the visible toast queue at MAX_VISIBLE', async () => {
    renderApp();
    await screen.findByText(/fleet overview/i);
    act(() => {
      for (let i = 1; i <= 5; i++) {
        emitEvent({
          type: 'opened',
          alert: makeAlert({ id: `q${i}`, pumpId: 'pump-001' }),
        });
      }
    });
    expect(screen.queryByTestId('live-toast-q1')).toBeNull();
    expect(screen.queryByTestId('live-toast-q2')).toBeNull();
    expect(await screen.findByTestId('live-toast-q3')).toBeTruthy();
    expect(await screen.findByTestId('live-toast-q4')).toBeTruthy();
    expect(await screen.findByTestId('live-toast-q5')).toBeTruthy();
  });
});
