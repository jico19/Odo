import { useCallback, useEffect, useState } from 'react';

import { ensureDatabase } from '@/db/database';
import {
  deleteMaintenanceLog,
  insertMaintenanceLogWithOdometer,
  listMaintenanceLogs,
  updateMaintenanceLogWithOdometer,
} from '@/db/queries';
import type { MaintenanceLog, NewMaintenanceLog } from '@/types/maintenance';
import {
  cancelMaintenanceReminder,
  syncMaintenanceReminder,
} from '@/utils/notifications';

import { useVehicle } from './use-vehicle';

type MaintenanceStatus = 'loading' | 'ready' | 'error';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function useMaintenanceLogs(vehicleId: number) {
  const { applyVehicle } = useVehicle();
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

  useEffect(() => load(), [load]);

  const create = useCallback(
    (input: NewMaintenanceLog) => {
      const result = insertMaintenanceLogWithOdometer(vehicleId, input);
      setLogs(listMaintenanceLogs(vehicleId));
      applyVehicle(result.vehicle);
      void syncMaintenanceReminder(result.log);
      return result.log;
    },
    [applyVehicle, vehicleId]
  );

  const update = useCallback(
    (logId: number, input: NewMaintenanceLog) => {
      const result = updateMaintenanceLogWithOdometer(logId, vehicleId, input);
      setLogs(listMaintenanceLogs(vehicleId));
      applyVehicle(result.vehicle);
      void syncMaintenanceReminder(result.log);
      return result.log;
    },
    [applyVehicle, vehicleId]
  );

  const remove = useCallback(
    (logId: number) => {
      deleteMaintenanceLog(logId, vehicleId);
      setLogs(listMaintenanceLogs(vehicleId));
      void cancelMaintenanceReminder(logId);
    },
    [vehicleId]
  );

  const retry = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  return { status, logs, error, retry, create, update, remove };
}
