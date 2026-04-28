import type { TimeWindow } from '../domain/models';

// No need for a full date formatting library for this simple use case, and we want to avoid the bundle size impact of something like date-fns or moment.
export function formatTimestamp(value: number, window: TimeWindow): string {
  const d = new Date(value);
  if (window === '3h' || window === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
