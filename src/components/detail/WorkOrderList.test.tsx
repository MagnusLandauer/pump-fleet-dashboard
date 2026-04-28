import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkOrderList } from './WorkOrderList';
import type { WorkOrder } from '../../domain/models';

const orders: WorkOrder[] = [
  {
    id: 'wo-1',
    pumpId: 'pump-001',
    title: 'Replace seal',
    description: 'desc',
    type: 'corrective',
    status: 'overdue',
    createdAt: new Date('2026-04-01'),
    dueDate: new Date('2026-04-10'),
    completedAt: null,
  },
];

describe('WorkOrderList', () => {
  it('shows the create button and existing orders', () => {
    render(<WorkOrderList workOrders={orders} onCreate={() => {}} />);
    expect(screen.getByText('Replace seal')).toBeTruthy();
    expect(screen.getByRole('button', { name: /create work order/i })).toBeTruthy();
  });

  it('shows empty state when no orders', () => {
    render(<WorkOrderList workOrders={[]} onCreate={() => {}} />);
    expect(screen.getByText(/no work orders/i)).toBeTruthy();
  });

  it('calls onCreate', async () => {
    const onCreate = vi.fn();
    render(<WorkOrderList workOrders={orders} onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: /create work order/i }));
    expect(onCreate).toHaveBeenCalled();
  });
});
