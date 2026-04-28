import { useEffect } from 'react';
import { useFleetStore } from './useStore';

export function useLiveTick(): void {
  const store = useFleetStore();
  useEffect(() => {
    store.startLiveUpdates();
    return () => {
      store.stopLiveUpdates();
    };
  }, [store]);
}
