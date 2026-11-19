import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ensureDatabase } from '@/db/database';
import { deleteTrip, listTripPreviewRoutes, listTrips } from '@/db/queries';
import type { GeoPoint, Trip } from '@/types/trip';

type TripStatus = 'loading' | 'ready' | 'error';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function useTrips(vehicleId: number) {
  const [status, setStatus] = useState<TripStatus>('loading');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Map<number, GeoPoint[]>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (vehicleId <= 0) return;

    let active = true;
    ensureDatabase()
      .then(() => {
        if (!active) return;
        setTrips(listTrips(vehicleId));
        setRoutes(new Map(listTripPreviewRoutes(vehicleId).map((route) => [route.tripId, route.points])));
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

  useFocusEffect(
    useCallback(() => {
      const cleanup = load();
      return () => cleanup?.();
    }, [load])
  );

  const refresh = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  const remove = useCallback(
    (id: number) => {
      deleteTrip(id);
      setTrips(listTrips(vehicleId));
      setRoutes(new Map(listTripPreviewRoutes(vehicleId).map((route) => [route.tripId, route.points])));
    },
    [vehicleId]
  );

  return { status, trips, routes, error, refresh, remove };
}
