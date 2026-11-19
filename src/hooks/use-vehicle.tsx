import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ensureDatabase } from '@/db/database';
import {
  createVehicle,
  getFirstVehicle,
  setOdometer,
  updateVehicle,
} from '@/db/queries';
import type { NewVehicle, Vehicle } from '@/types/vehicle';

type VehicleStatus = 'loading' | 'ready' | 'error';

type VehicleContextValue = {
  status: VehicleStatus;
  vehicle: Vehicle | null;
  error: string | null;
  retry: () => void;
  applyVehicle: (next: Vehicle) => void;
  create: (input: NewVehicle) => Vehicle;
  update: (id: number, input: Pick<NewVehicle, 'name' | 'plate'>) => void;
  updateOdometer: (id: number, next: number) => Vehicle;
};

const VehicleContext = createContext<VehicleContextValue | null>(null);

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VehicleStatus>('loading');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;

    ensureDatabase()
      .then(() => {
        if (!active) return;
        setVehicle(getFirstVehicle());
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

  useEffect(() => load(), [load]);

  const applyVehicle = useCallback((next: Vehicle) => {
    setVehicle(next);
  }, []);

  const create = useCallback((input: NewVehicle) => {
    const created = createVehicle(input);
    setVehicle(created);
    return created;
  }, []);

  const update = useCallback((id: number, input: Pick<NewVehicle, 'name' | 'plate'>) => {
    const updated = updateVehicle(id, input);
    if (updated !== null) setVehicle(updated);
  }, []);

  const updateOdometer = useCallback((id: number, next: number) => {
    const updated = setOdometer(id, next);
    setVehicle(updated);
    return updated;
  }, []);

  const retry = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  const value = useMemo<VehicleContextValue>(
    () => ({ status, vehicle, error, retry, applyVehicle, create, update, updateOdometer }),
    [status, vehicle, error, retry, applyVehicle, create, update, updateOdometer]
  );

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicle(): VehicleContextValue {
  const value = useContext(VehicleContext);
  if (value === null) throw new Error('useVehicle must be used inside VehicleProvider.');

  return value;
}
