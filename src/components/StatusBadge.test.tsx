import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it.each(['green', 'yellow', 'red', 'maintenance'] as const)('renders %s status', (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByLabelText(`status-${status}`)).toBeTruthy();
  });

  it('uses "Running" for green', () => {
    render(<StatusBadge status="green" />);
    expect(screen.getByText('Running')).toBeTruthy();
  });

  it('uses "Maintenance" for the maintenance status', () => {
    render(<StatusBadge status="maintenance" />);
    expect(screen.getByText('Maintenance')).toBeTruthy();
  });
});
