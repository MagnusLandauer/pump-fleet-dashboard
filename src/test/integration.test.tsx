import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetStoreForTest } from '../domain/store';
import { routeTree } from '../routeTree.gen';

const NOW = new Date('2026-04-27T12:00:00Z');

function renderApp(initialEntries: string[] = ['/']) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
  });
  return render(<RouterProvider router={router} />);
}

describe('Fleet integration', () => {
  beforeEach(() => {
    resetStoreForTest(NOW);
  });
  afterEach(() => {
    resetStoreForTest(NOW);
  });

  it('renders the fleet overview with five pumps and a critical badge for the degraded pump', async () => {
    renderApp();
    expect(await screen.findByText(/fleet overview/i)).toBeTruthy();
    expect(screen.getByTestId('pump-card-pump-001')).toBeTruthy();
    expect(screen.getByTestId('pump-card-pump-003')).toBeTruthy();

    const degradedCard = screen.getByTestId('pump-card-pump-003');
    expect(within(degradedCard).getByLabelText('status-red')).toBeTruthy();
  });

  it('navigates to pump detail when a card is clicked', async () => {
    renderApp();
    const card = await screen.findByTestId('pump-card-pump-001');
    await userEvent.click(within(card).getByLabelText('open-pump-001'));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Alpha Centrifuge' }),
    ).toBeTruthy();
  });

  it('creates a work order from the detail page', async () => {
    renderApp(['/pump/pump-001']);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Alpha Centrifuge' }),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /create work order/i }));
    await userEvent.type(screen.getByLabelText('wo-title'), 'New inspection');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('New inspection')).toBeTruthy();
  });

  it('edits an existing work order', async () => {
    renderApp(['/pump/pump-001']);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Alpha Centrifuge' }),
    ).toBeTruthy();

    const row = await screen.findByTestId('work-order-wo-0001');
    await userEvent.click(within(row).getByRole('button', { name: /edit-/ }));

    const title = await screen.findByLabelText('wo-title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Replace inlet filter v2');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Replace inlet filter v2')).toBeTruthy();
    expect(screen.queryByText('Replace inlet filter')).toBeNull();
  });

  it('deletes a work order through the confirm dialog', async () => {
    renderApp(['/pump/pump-001']);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Alpha Centrifuge' }),
    ).toBeTruthy();

    const row = await screen.findByTestId('work-order-wo-0001');
    await userEvent.click(within(row).getByRole('button', { name: /delete-/ }));

    await screen.findByText(/will be permanently removed/i);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.queryByTestId('work-order-wo-0001')).toBeNull();
  });

  it('starts and completes a work order from the row actions', async () => {
    renderApp(['/pump/pump-001']);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Alpha Centrifuge' }),
    ).toBeTruthy();

    const row = await screen.findByTestId('work-order-wo-0001');
    await userEvent.click(within(row).getByRole('button', { name: /begin-/ }));

    const inProgressRow = await screen.findByTestId('work-order-wo-0001');
    expect(within(inProgressRow).getByText(/in progress/i)).toBeTruthy();
    expect(within(inProgressRow).queryByRole('button', { name: /edit-/ })).toBeNull();
    expect(within(inProgressRow).queryByRole('button', { name: /delete-/ })).toBeNull();

    await userEvent.click(within(inProgressRow).getByRole('button', { name: /complete-/ }));
    const finalRow = await screen.findByTestId('work-order-wo-0001');
    expect(within(finalRow).getByText(/completed/i)).toBeTruthy();
  });

  it('shows pump-not-found on unknown id', async () => {
    renderApp(['/pump/does-not-exist']);
    expect(await screen.findByText(/pump not found/i)).toBeTruthy();
  });

  it('shows the maintenance banner only for pumps in scheduled maintenance', async () => {
    const { unmount } = renderApp(['/pump/pump-005']);
    expect(await screen.findByTestId('maintenance-banner')).toBeTruthy();
    unmount();

    renderApp(['/pump/pump-001']);
    await screen.findByRole('heading', { level: 1, name: 'Alpha Centrifuge' });
    expect(screen.queryByTestId('maintenance-banner')).toBeNull();
  });
});
