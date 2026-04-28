import { describe, expect, it } from 'vitest';
import { formatTimestamp } from './format';

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
