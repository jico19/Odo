import { useCallback, useState } from 'react';

import { ensureDatabase } from '@/db/database';
import {
  deleteFuelLog,
  insertFuelLogWithOdometer,
  listFuelLogs,
  updateFuelLogWithOdometer,
} from '@/db/queries';
import type { FuelLog, NewFuelLog } from '@/types/fuel';

import { useDataSync, useDatabaseReload } from './use-data-sync';
import { useVehicle } from './use-vehicle';

type FuelStatus = 'loading' | 'ready' | 'error';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function useFuelLogs(vehicleId: number) {
  const { applyVehicle } = useVehicle();
  const { notifyDataChanged } = useDataSync();
  const [status, setStatus] = useState<FuelStatus>('loading');
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;

    ensureDatabase()
      .then(() => {
        if (!active) return;
        setLogs(listFuelLogs(vehicleId));
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
    (input: NewFuelLog) => {
      const result = insertFuelLogWithOdometer(vehicleId, input);
      setLogs(listFuelLogs(vehicleId));
      applyVehicle(result.vehicle);
      notifyDataChanged();
      return result.log;
    },
    [applyVehicle, notifyDataChanged, vehicleId]
  );

  const update = useCallback(
    (logId: number, input: NewFuelLog) => {
      const result = updateFuelLogWithOdometer(logId, vehicleId, input);
      setLogs(listFuelLogs(vehicleId));
      applyVehicle(result.vehicle);
      notifyDataChanged();
      return result.log;
    },
    [applyVehicle, notifyDataChanged, vehicleId]
  );

  const remove = useCallback(
    (logId: number) => {
      deleteFuelLog(logId, vehicleId);
      setLogs(listFuelLogs(vehicleId));
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
