import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

import { ensureDatabase } from '@/db/database';
import { getPreference } from '@/db/queries';
import { PREFERENCE_KEYS, type AppearanceMode } from '@/types/preferences';
import { parseAppearance } from '@/utils/preferences';

import { useDataSync } from './use-data-sync';

export function useAppearanceSync(): void {
  const { revision } = useDataSync();
  const [appearance, setAppearance] = useState<AppearanceMode>('system');

  useEffect(() => {
    let active = true;
    ensureDatabase()
      .then(() => {
        if (active) setAppearance(parseAppearance(getPreference(PREFERENCE_KEYS.appearance)));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [revision]);

  useEffect(() => {
    Appearance.setColorScheme(appearance === 'system' ? 'auto' : appearance);
  }, [appearance]);
}
