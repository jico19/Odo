import { useCallback, useEffect, useState } from 'react';

import { ensureDatabase } from '@/db/database';
import {
  insertFuelLogWithOdometer,
  listFuelLogs,
  updateFuelLogWithOdometer,
} from '@/db/queries';
import type { FuelLog, NewFuelLog } from '@/types/fuel';

import { useVehicle } from './use-vehicle';

type FuelStatus = 'loading' | 'ready' | 'error';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function useFuelLogs(vehicleId: number) {
  const { applyVehicle } = useVehicle();
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

  useEffect(() => load(), [load]);

  const create = useCallback(
    (input: NewFuelLog) => {
      const result = insertFuelLogWithOdometer(vehicleId, input);
      setLogs(listFuelLogs(vehicleId));
      applyVehicle(result.vehicle);
      return result.log;
    },
    [applyVehicle, vehicleId]
  );

  const update = useCallback(
    (logId: number, input: NewFuelLog) => {
      const result = updateFuelLogWithOdometer(logId, vehicleId, input);
      setLogs(listFuelLogs(vehicleId));
      applyVehicle(result.vehicle);
      return result.log;
    },
    [applyVehicle, vehicleId]
  );

  const retry = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  return { status, logs, error, retry, create, update };
}
