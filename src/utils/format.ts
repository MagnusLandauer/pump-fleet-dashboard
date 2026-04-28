import type { TimeWindow } from '../domain/models';

// No need for a full date formatting library for this simple use case, and we want to avoid the bundle size impact of something like date-fns or moment.
export function formatTimestamp(value: number, window: TimeWindow): string {
  const d = new Date(value);
  if (window === '3h' || window === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeTime(from: Date, now: Date): string {
  const delta = now.getTime() - from.getTime();
  if (delta < 45 * 1000) return 'just now';
  if (delta < HOUR_MS) {
    const m = Math.round(delta / MINUTE_MS);
    return `${m} min ago`;
  }
  if (delta < DAY_MS) {
    const h = Math.round(delta / HOUR_MS);
    return `${h} h ago`;
  }
  const d = Math.round(delta / DAY_MS);
  return `${d} d ago`;
}

export function formatDuration(ms: number): string {
  if (ms < MINUTE_MS) {
    const s = Math.max(0, Math.round(ms / 1000));
    return `${s} s`;
  }
  if (ms < HOUR_MS) {
    const m = Math.round(ms / MINUTE_MS);
    return `${m} min`;
  }
  if (ms < DAY_MS) {
    const totalMin = Math.round(ms / MINUTE_MS);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }
  const totalHours = Math.round(ms / HOUR_MS);
  const d = Math.floor(totalHours / 24);
  const h = totalHours % 24;
  return h === 0 ? `${d} d` : `${d} d ${h} h`;
}
