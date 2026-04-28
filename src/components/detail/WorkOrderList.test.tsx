import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkOrderList } from './WorkOrderList';
import type { WorkOrder, WorkOrderStatus } from '../../domain/models';

function makeOrder(id: string, status: WorkOrderStatus): WorkOrder {
  return {
    id,
    pumpId: 'pump-001',
    title: `Order ${id}`,
    description: 'desc',
    type: 'corrective',
    status,
    createdAt: new Date('2026-04-01'),
    dueDate: new Date('2026-04-10'),
    completedAt: status === 'completed' ? new Date('2026-04-09') : null,
  };
}

const noop = () => {};

interface ListProps {
  workOrders: WorkOrder[];
  onCreate?: () => void;
  onEdit?: (w: WorkOrder) => void;
  onDelete?: (w: WorkOrder) => void;
  onBeginWork?: (w: WorkOrder) => void;
  onComplete?: (w: WorkOrder) => void;
}

function renderList(props: ListProps) {
  return render(
    <WorkOrderList
      workOrders={props.workOrders}
      onCreate={props.onCreate ?? noop}
      onEdit={props.onEdit ?? noop}
      onDelete={props.onDelete ?? noop}
      onBeginWork={props.onBeginWork ?? noop}
      onComplete={props.onComplete ?? noop}
    />,
  );
}

describe('WorkOrderList', () => {
  it('shows the create button and existing orders', () => {
    renderList({ workOrders: [makeOrder('wo-1', 'overdue')] });
    expect(screen.getByText('Order wo-1')).toBeTruthy();
    expect(screen.getByRole('button', { name: /create work order/i })).toBeTruthy();
  });

  it('shows empty state when no orders', () => {
    renderList({ workOrders: [] });
    expect(screen.getByText(/no work orders/i)).toBeTruthy();
  });

  it('calls onCreate', async () => {
    const onCreate = vi.fn();
    renderList({ workOrders: [makeOrder('wo-1', 'open')], onCreate });
    await userEvent.click(screen.getByRole('button', { name: /create work order/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  it('shows edit, delete, and begin-work buttons for open orders', async () => {
    const onBeginWork = vi.fn();
    const order = makeOrder('wo-1', 'open');
    renderList({ workOrders: [order], onBeginWork });
    expect(screen.getByRole('button', { name: 'edit-wo-1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'delete-wo-1' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'begin-wo-1' }));
    expect(onBeginWork).toHaveBeenCalledWith(order);
  });

  it('shows begin-work alongside edit/delete for overdue orders', () => {
    renderList({ workOrders: [makeOrder('wo-1', 'overdue')] });
    expect(screen.getByRole('button', { name: 'begin-wo-1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'edit-wo-1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'delete-wo-1' })).toBeTruthy();
  });

  it('calls onEdit and onDelete with the work order', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const order = makeOrder('wo-1', 'open');
    renderList({ workOrders: [order], onEdit, onDelete });
    await userEvent.click(screen.getByRole('button', { name: 'edit-wo-1' }));
    expect(onEdit).toHaveBeenCalledWith(order);
    await userEvent.click(screen.getByRole('button', { name: 'delete-wo-1' }));
    expect(onDelete).toHaveBeenCalledWith(order);
  });

  it('shows only a complete button for in-progress orders', async () => {
    const onComplete = vi.fn();
    const order = makeOrder('wo-2', 'in_progress');
    renderList({ workOrders: [order], onComplete });
    expect(screen.queryByRole('button', { name: 'edit-wo-2' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'delete-wo-2' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'begin-wo-2' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'complete-wo-2' }));
    expect(onComplete).toHaveBeenCalledWith(order);
  });

  it('shows no row actions for completed orders', () => {
    renderList({ workOrders: [makeOrder('wo-3', 'completed')] });
    expect(screen.queryByRole('button', { name: 'begin-wo-3' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'edit-wo-3' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'delete-wo-3' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'complete-wo-3' })).toBeNull();
  });
});
