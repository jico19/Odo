import { useCallback, useState } from 'react';

import { ensureDatabase } from '@/db/database';
import {
  applyTemplateItems,
  deleteCustomPmsItem,
  getPreference,
  getPmsItem,
  insertPmsItem,
  listPmsItems,
  resetAllPmsItems,
  resetPmsItemToDefault,
  setPmsItemEnabled,
  updatePmsItem,
} from '@/db/queries';
import type { NewPmsItem, PmsItem, PmsItemUpdate } from '@/types/pms';
import { PREFERENCE_KEYS } from '@/types/preferences';
import { cancelPmsReminders, syncPmsReminder } from '@/utils/notifications';
import { parseReminderLeadDays } from '@/utils/preferences';

import { useDataSync, useDatabaseReload } from './use-data-sync';
import { localDateKey } from './use-today';

type PmsItemsStatus = 'loading' | 'ready' | 'error';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function syncReminder(item: PmsItem): void {
  const leadDays = parseReminderLeadDays(getPreference(PREFERENCE_KEYS.reminderLeadDays));
  void syncPmsReminder(item, leadDays, localDateKey(new Date()));
}

export function usePmsItems(vehicleId: number) {
  const { notifyDataChanged } = useDataSync();
  const [status, setStatus] = useState<PmsItemsStatus>('loading');
  const [items, setItems] = useState<PmsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const next = listPmsItems(vehicleId);
    setItems(next);
    for (const item of next) syncReminder(item);
  }, [vehicleId]);

  const load = useCallback(() => {
    let active = true;

    ensureDatabase()
      .then(() => {
        if (!active) return;
        refresh();
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
  }, [refresh]);

  useDatabaseReload(load);

  const create = useCallback(
    (input: NewPmsItem) => {
      const created = insertPmsItem(vehicleId, input);
      refresh();
      notifyDataChanged();
      return created;
    },
    [notifyDataChanged, refresh, vehicleId]
  );

  const update = useCallback(
    (id: number, input: PmsItemUpdate) => {
      const updated = updatePmsItem(id, input);
      if (updated === null) throw new Error('PMS item not found.');
      refresh();
      notifyDataChanged();
      return updated;
    },
    [notifyDataChanged, refresh]
  );

  const setEnabled = useCallback(
    (id: number, enabled: boolean) => {
      const updated = setPmsItemEnabled(id, enabled);
      if (updated === null) throw new Error('PMS item not found.');
      if (!enabled) void cancelPmsReminders(id);
      refresh();
      notifyDataChanged();
      return updated;
    },
    [notifyDataChanged, refresh]
  );

  const remove = useCallback(
    (id: number) => {
      const existing = getPmsItem(id);
      if (existing === null || !existing.isCustom) throw new Error('Custom PMS item not found.');
      deleteCustomPmsItem(id);
      void cancelPmsReminders(id);
      refresh();
      notifyDataChanged();
    },
    [notifyDataChanged, refresh]
  );

  const addFromTemplate = useCallback(
    (newItems: NewPmsItem[]) => {
      const added = applyTemplateItems(vehicleId, newItems);
      refresh();
      notifyDataChanged();
      return added;
    },
    [notifyDataChanged, refresh, vehicleId]
  );

  const resetOne = useCallback(
    (id: number) => {
      const updated = resetPmsItemToDefault(id);
      if (updated === null) throw new Error('PMS item not found.');
      refresh();
      notifyDataChanged();
      return updated;
    },
    [notifyDataChanged, refresh]
  );

  const resetAll = useCallback(
    (onlyChanged: boolean) => {
      resetAllPmsItems(vehicleId, onlyChanged);
      refresh();
      notifyDataChanged();
    },
    [notifyDataChanged, refresh, vehicleId]
  );

  const retry = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  return {
    status,
    items,
    error,
    retry,
    create,
    update,
    setEnabled,
    remove,
    addFromTemplate,
    resetOne,
    resetAll,
  };
}
