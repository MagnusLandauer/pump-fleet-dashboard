import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMeasured, type Size } from './useMeasured';

let trigger: ((rect: { width: number; height: number }) => void) | null = null;

class CapturingResizeObserver {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(el: Element) {
    trigger = ({ width, height }) => {
      this.cb(
        [{ contentRect: { width, height }, target: el } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    };
  }
  unobserve() {}
  disconnect() {
    trigger = null;
  }
}

const originalRO = globalThis.ResizeObserver;

function Probe({ onSize }: { onSize: (s: Size | null) => void }) {
  const [ref, size] = useMeasured<HTMLDivElement>();
  useEffect(() => onSize(size), [size, onSize]);
  return <div ref={ref} />;
}

describe('useMeasured', () => {
  beforeEach(() => {
    globalThis.ResizeObserver = CapturingResizeObserver as unknown as typeof ResizeObserver;
  });
  afterEach(() => {
    globalThis.ResizeObserver = originalRO;
    trigger = null;
  });

  it('starts as null until a measurement arrives', () => {
    const onSize = vi.fn();
    render(<Probe onSize={onSize} />);
    expect(onSize).toHaveBeenLastCalledWith(null);
  });

  it('returns the rounded measured size when ResizeObserver fires', () => {
    const onSize = vi.fn();
    render(<Probe onSize={onSize} />);
    expect(trigger).toBeTruthy();
    act(() => trigger!({ width: 600.4, height: 199.7 }));
    expect(onSize).toHaveBeenLastCalledWith({ width: 600, height: 200 });
  });

  it('ignores zero-or-negative dimensions', () => {
    const onSize = vi.fn();
    render(<Probe onSize={onSize} />);
    act(() => trigger!({ width: 0, height: 200 }));
    act(() => trigger!({ width: 600, height: 0 }));
    expect(onSize).toHaveBeenLastCalledWith(null);
  });

  it('does not re-render when the size is unchanged', () => {
    const onSize = vi.fn();
    render(<Probe onSize={onSize} />);
    act(() => trigger!({ width: 600, height: 200 }));
    const calls = onSize.mock.calls.length;
    act(() => trigger!({ width: 600, height: 200 }));
    expect(onSize.mock.calls.length).toEqual(calls);
  });

  it('updates when the size changes', () => {
    const onSize = vi.fn();
    render(<Probe onSize={onSize} />);
    act(() => trigger!({ width: 600, height: 200 }));
    act(() => trigger!({ width: 800, height: 200 }));
    expect(onSize).toHaveBeenLastCalledWith({ width: 800, height: 200 });
  });

  it('disconnects on unmount', () => {
    const onSize = vi.fn();
    const { unmount } = render(<Probe onSize={onSize} />);
    expect(trigger).toBeTruthy();
    unmount();
    expect(trigger).toBeNull();
  });
});
