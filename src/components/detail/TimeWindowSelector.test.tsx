import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TimeWindowSelector } from './TimeWindowSelector';

describe('TimeWindowSelector', () => {
  it('renders all four windows', () => {
    render(<TimeWindowSelector value="24h" onChange={() => {}} />);
    for (const w of ['3h', '24h', '7d', '31d']) {
      expect(screen.getByLabelText(`window-${w}`)).toBeTruthy();
    }
  });

  it('calls onChange when a different window is selected', async () => {
    const onChange = vi.fn();
    render(<TimeWindowSelector value="24h" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('window-7d'));
    expect(onChange).toHaveBeenCalledWith('7d');
  });

  it('does not call onChange when the same window is clicked', async () => {
    const onChange = vi.fn();
    render(<TimeWindowSelector value="24h" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('window-24h'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
