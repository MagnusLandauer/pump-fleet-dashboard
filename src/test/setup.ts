import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
}

// jsdom does not implement scrollTo/scroll; TanStack Router calls them on
// navigation and floods the test output with "Not implemented" warnings.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
  window.scroll = () => {};
}

afterEach(() => {
  cleanup();
});
