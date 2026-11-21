import { useCallback, useState } from 'react';

import { ensureDatabase } from '@/db/database';
import { getPreference, setPreference } from '@/db/queries';
import { PREFERENCE_KEYS, PREFERENCE_DEFAULTS, type Preferences } from '@/types/preferences';
import { readPreferences } from '@/utils/preferences';

import { useDataSync, useDatabaseReload } from './use-data-sync';

type PreferencesStatus = 'loading' | 'ready' | 'error';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function readAll(): Preferences {
  return readPreferences((key) => getPreference(key));
}

export function usePreferences() {
  const { notifyDataChanged } = useDataSync();
  const [status, setStatus] = useState<PreferencesStatus>('loading');
  const [preferences, setPreferences] = useState<Preferences>(PREFERENCE_DEFAULTS);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;

    ensureDatabase()
      .then(() => {
        if (!active) return;
        setPreferences(readAll());
        setError(null);
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(toErrorMessage(cause));
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  useDatabaseReload(load);

  const update = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      const stored = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
      setPreference(PREFERENCE_KEYS[key], stored);
      setPreferences((current) => ({ ...current, [key]: value }));
      notifyDataChanged();
    },
    [notifyDataChanged]
  );

  const retry = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  return { status, preferences, error, retry, update };
}
