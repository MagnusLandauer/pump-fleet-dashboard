import { describe, expect, it } from 'vitest';
import { formatDuration, formatRelativeTime, formatTimestamp } from './format';

describe('formatTimestamp', () => {
  const ts = new Date('2026-04-27T13:45:00').getTime();

  it('renders time-of-day for short windows', () => {
    for (const w of ['3h', '24h'] as const) {
      const out = formatTimestamp(ts, w);
      expect(out).toMatch(/\d{1,2}:\d{2}/);
      expect(out).not.toMatch(/Apr/);
    }
  });

  it('renders calendar date for long windows', () => {
    for (const w of ['7d', '31d'] as const) {
      const out = formatTimestamp(ts, w);
      expect(out).toMatch(/Apr/);
      expect(out).toMatch(/27/);
    }
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-04-27T12:00:00Z');

  it('returns "just now" for sub-45-second deltas', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 5_000), now)).toEqual('just now');
  });

  it('returns minutes for sub-hour deltas', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 12 * 60_000), now)).toEqual('12 min ago');
  });

  it('returns hours for sub-day deltas', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60_000), now)).toEqual('3 h ago');
  });

  it('returns days for older deltas', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 24 * 60 * 60_000), now)).toEqual('5 d ago');
  });
});

describe('formatDuration', () => {
  it('renders seconds under a minute', () => {
    expect(formatDuration(45_000)).toEqual('45 s');
  });

  it('renders minutes under an hour', () => {
    expect(formatDuration(20 * 60_000)).toEqual('20 min');
  });

  it('renders hours and minutes under a day', () => {
    expect(formatDuration(2 * 3600_000 + 30 * 60_000)).toEqual('2 h 30 min');
  });

  it('renders days and hours over a day', () => {
    expect(formatDuration(36 * 3600_000)).toEqual('1 d 12 h');
  });
});
