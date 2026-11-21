import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ensureDatabase } from '@/db/database';
import {
  createVehicle,
  createVehicleWithItems,
  getFirstVehicle,
  setOdometer,
  setOnboardingComplete,
  updateVehicle,
  type VehicleSettings,
} from '@/db/queries';
import type { NewPmsItem } from '@/types/pms';
import type { NewVehicle, Vehicle } from '@/types/vehicle';

type VehicleStatus = 'loading' | 'ready' | 'error';

type VehicleContextValue = {
  status: VehicleStatus;
  vehicle: Vehicle | null;
  error: string | null;
  retry: () => void;
  applyVehicle: (next: Vehicle) => void;
  create: (input: NewVehicle) => Vehicle;
  createWithItems: (input: NewVehicle, items: NewPmsItem[]) => Vehicle;
  update: (id: number, input: VehicleSettings) => void;
  completeOnboarding: (id: number) => void;
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

  const createWithItems = useCallback((input: NewVehicle, items: NewPmsItem[]) => {
    const created = createVehicleWithItems(input, items);
    setVehicle(created);
    return created;
  }, []);

  const update = useCallback((id: number, input: VehicleSettings) => {
    const updated = updateVehicle(id, input);
    if (updated !== null) setVehicle(updated);
  }, []);

  const completeOnboarding = useCallback((id: number) => {
    const updated = setOnboardingComplete(id);
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
    () => ({
      status,
      vehicle,
      error,
      retry,
      applyVehicle,
      create,
      createWithItems,
      update,
      completeOnboarding,
      updateOdometer,
    }),
    [
      status,
      vehicle,
      error,
      retry,
      applyVehicle,
      create,
      createWithItems,
      update,
      completeOnboarding,
      updateOdometer,
    ]
  );

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicle(): VehicleContextValue {
  const value = useContext(VehicleContext);
  if (value === null) throw new Error('useVehicle must be used inside VehicleProvider.');

  return value;
}
