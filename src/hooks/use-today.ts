import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useToday(): string {
  const [today, setToday] = useState(() => localDateKey(new Date()));

  useEffect(() => {
    const refresh = () => {
      if (AppState.currentState === 'active') setToday(localDateKey(new Date()));
    };
    const subscription = AppState.addEventListener('change', refresh);
    refresh();
    return () => subscription.remove();
  }, []);

  return today;
}
