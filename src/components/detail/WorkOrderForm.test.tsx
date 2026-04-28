import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkOrderForm } from './WorkOrderForm';

describe('WorkOrderForm', () => {
  it('does not render when closed', () => {
    render(<WorkOrderForm open={false} pumpId="pump-001" onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.queryByLabelText('create-work-order-form')).toBeNull();
  });

  it('blocks submission when title is empty', async () => {
    const onSubmit = vi.fn();
    render(<WorkOrderForm open pumpId="pump-001" onClose={() => {}} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/title is required/i)).toBeTruthy();
  });

  it('submits work order with the given fields', async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<WorkOrderForm open pumpId="pump-001" onClose={onClose} onSubmit={onSubmit} />);
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
    render(<WorkOrderForm open pumpId="pump-001" onClose={onClose} onSubmit={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
