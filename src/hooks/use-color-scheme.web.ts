import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// No real subscription: getSnapshot runs only on the client, after hydration.
function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
