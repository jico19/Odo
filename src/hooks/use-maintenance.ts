import { useCallback, useState } from 'react';

import { ensureDatabase } from '@/db/database';
import {
  deleteMaintenanceLog,
  getMaintenanceLog,
  getPreference,
  getPmsItem,
  insertMaintenanceLogWithOdometer,
  listMaintenanceLogs,
  updateMaintenanceLogWithOdometer,
} from '@/db/queries';
import type { MaintenanceLog, NewMaintenanceLog } from '@/types/maintenance';
import { PREFERENCE_KEYS } from '@/types/preferences';
import {
  cancelMaintenanceReminder,
  syncMaintenanceReminder,
  syncPmsReminder,
} from '@/utils/notifications';
import { parseReminderLeadDays } from '@/utils/preferences';

import { useDataSync, useDatabaseReload } from './use-data-sync';
import { localDateKey } from './use-today';
import { useVehicle } from './use-vehicle';

type MaintenanceStatus = 'loading' | 'ready' | 'error';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function resyncLinkedPmsItem(pmsItemId: number | null | undefined): void {
  if (pmsItemId === null || pmsItemId === undefined) return;
  const item = getPmsItem(pmsItemId);
  if (item === null) return;
  const leadDays = parseReminderLeadDays(getPreference(PREFERENCE_KEYS.reminderLeadDays));
  void syncPmsReminder(item, leadDays, localDateKey(new Date()));
}

export function useMaintenanceLogs(vehicleId: number) {
  const { applyVehicle } = useVehicle();
  const { notifyDataChanged } = useDataSync();
  const [status, setStatus] = useState<MaintenanceStatus>('loading');
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;

    ensureDatabase()
      .then(() => {
        if (!active) return;
        setLogs(listMaintenanceLogs(vehicleId));
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
  }, [vehicleId]);

  useDatabaseReload(load);

  const create = useCallback(
    (input: NewMaintenanceLog) => {
      const result = insertMaintenanceLogWithOdometer(vehicleId, input);
      setLogs(listMaintenanceLogs(vehicleId));
      applyVehicle(result.vehicle);
      void syncMaintenanceReminder(result.log);
      resyncLinkedPmsItem(input.pmsItemId);
      notifyDataChanged();
      return result.log;
    },
    [applyVehicle, notifyDataChanged, vehicleId]
  );

  const update = useCallback(
    (logId: number, input: NewMaintenanceLog) => {
      const existing = getMaintenanceLog(logId);
      const result = updateMaintenanceLogWithOdometer(logId, vehicleId, input);
      setLogs(listMaintenanceLogs(vehicleId));
      applyVehicle(result.vehicle);
      void syncMaintenanceReminder(result.log);
      resyncLinkedPmsItem(existing?.pmsItemId);
      resyncLinkedPmsItem(input.pmsItemId);
      notifyDataChanged();
      return result.log;
    },
    [applyVehicle, notifyDataChanged, vehicleId]
  );

  const remove = useCallback(
    (logId: number) => {
      const existing = getMaintenanceLog(logId);
      deleteMaintenanceLog(logId, vehicleId);
      setLogs(listMaintenanceLogs(vehicleId));
      void cancelMaintenanceReminder(logId);
      resyncLinkedPmsItem(existing?.pmsItemId);
      notifyDataChanged();
    },
    [notifyDataChanged, vehicleId]
  );

  const retry = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  return { status, logs, error, retry, create, update, remove };
}
