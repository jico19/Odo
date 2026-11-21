import { useFocusEffect } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type DataSyncContextValue = {
  revision: number;
  notifyDataChanged: () => void;
};

type LoadFn = () => (() => void) | void;

const DataSyncContext = createContext<DataSyncContextValue | null>(null);

export function DataSyncProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  const notifyDataChanged = useCallback(() => setRevision((current) => current + 1), []);
  const value = useMemo<DataSyncContextValue>(
    () => ({ revision, notifyDataChanged }),
    [revision, notifyDataChanged]
  );

  return <DataSyncContext.Provider value={value}>{children}</DataSyncContext.Provider>;
}

export function useDataSync(): DataSyncContextValue {
  const value = useContext(DataSyncContext);
  if (value === null) throw new Error('useDataSync must be used inside DataSyncProvider.');
  return value;
}

export function useDatabaseReload(load: LoadFn): void {
  const { revision } = useDataSync();
  const initialRevision = useRef(revision);

  useFocusEffect(
    useCallback(() => {
      const cleanup = load();
      return () => cleanup?.();
    }, [load])
  );

  useEffect(() => {
    if (revision === initialRevision.current) return;
    const cleanup = load();
    return cleanup;
  }, [load, revision]);
}
