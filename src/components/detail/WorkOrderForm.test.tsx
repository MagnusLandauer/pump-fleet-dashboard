import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkOrderForm } from './WorkOrderForm';
import type { WorkOrder } from '../../domain/models';

const sampleOrder: WorkOrder = {
  id: 'wo-9',
  pumpId: 'pump-001',
  title: 'Inspect bearing',
  description: 'Listen for grinding',
  type: 'corrective',
  status: 'in_progress',
  createdAt: new Date('2026-04-01'),
  dueDate: new Date('2026-05-01'),
  completedAt: null,
};

describe('WorkOrderForm (create)', () => {
  it('does not render when closed', () => {
    render(
      <WorkOrderForm
        mode="create"
        open={false}
        pumpId="pump-001"
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByLabelText('create-work-order-form')).toBeNull();
  });

  it('blocks submission when title is empty', async () => {
    const onSubmit = vi.fn();
    render(
      <WorkOrderForm
        mode="create"
        open
        pumpId="pump-001"
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/title is required/i)).toBeTruthy();
  });

  it('submits work order with the given fields', async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <WorkOrderForm
        mode="create"
        open
        pumpId="pump-001"
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.type(screen.getByLabelText('wo-title'), 'Replace seal');
    await userEvent.type(screen.getByLabelText('wo-description'), 'Routine');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.pumpId).toEqual('pump-001');
    expect(arg.title).toEqual('Replace seal');
    expect(arg.description).toEqual('Routine');
    expect(onClose).toHaveBeenCalled();
  });

  it('cancels via the cancel button', async () => {
    const onClose = vi.fn();
    render(
      <WorkOrderForm
        mode="create"
        open
        pumpId="pump-001"
        onClose={onClose}
        onSubmit={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('WorkOrderForm (edit)', () => {
  it('pre-fills fields from the work order', () => {
    render(
      <WorkOrderForm
        mode="edit"
        open
        workOrder={sampleOrder}
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect((screen.getByLabelText('wo-title') as HTMLInputElement).value).toEqual(
      'Inspect bearing',
    );
    expect(
      (screen.getByLabelText('wo-description') as HTMLInputElement).value,
    ).toEqual('Listen for grinding');
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  it('submits the updated fields with the work order id', async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <WorkOrderForm
        mode="edit"
        open
        workOrder={sampleOrder}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );
    const title = screen.getByLabelText('wo-title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Inspect bearing v2');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [id, input] = onSubmit.mock.calls[0];
    expect(id).toEqual('wo-9');
    expect(input.title).toEqual('Inspect bearing v2');
    expect(input.status).toEqual('in_progress');
    expect(onClose).toHaveBeenCalled();
  });
});
