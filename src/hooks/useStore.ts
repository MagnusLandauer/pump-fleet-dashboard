import { useSyncExternalStore } from 'react';
import { getStore, type FleetStore } from '../domain/store';

export function useFleetStore(): FleetStore {
  return getStore();
}

export function useStoreSnapshot(): ReturnType<FleetStore['getSnapshot']> {
  const store = getStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
