import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { TimeWindow } from '../../domain/models';

const WINDOWS: TimeWindow[] = ['3h', '24h', '7d', '31d'];

interface TimeWindowSelectorProps {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
}

export function TimeWindowSelector({ value, onChange }: TimeWindowSelectorProps) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      onChange={(_, next: TimeWindow | null) => {
        if (next) onChange(next);
      }}
      aria-label="time window"
    >
      {WINDOWS.map((w) => (
        <ToggleButton key={w} value={w} aria-label={`window-${w}`}>
          {w}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
