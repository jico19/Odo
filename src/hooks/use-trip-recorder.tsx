import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Linking } from 'react-native';

import {
  createTrip,
  finishTrip,
  getActiveTrip,
  insertTripPoint,
  listTripPoints,
} from '@/db/queries';
import type { GeoPoint, Trip } from '@/types/trip';
import { filterUsablePoints, tripDistanceKm } from '@/utils/geo';

import { useDataSync } from './use-data-sync';
import { useVehicle } from './use-vehicle';

type PermissionState = 'unknown' | 'granted' | 'denied';
type RecordingStatus = 'idle' | 'starting' | 'recording' | 'stopping';

type TripRecorderValue = {
  permission: PermissionState;
  canAskAgain: boolean;
  status: RecordingStatus;
  activeTrip: Trip | null;
  points: GeoPoint[];
  distanceKm: number;
  elapsedSeconds: number;
  error: string | null;
  showPermissionSheet: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  allowLocation: () => Promise<void>;
  dismissPermissionSheet: () => void;
  openSettings: () => void;
};

const TripRecorderContext = createContext<TripRecorderValue | null>(null);

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function toGeoPoints(tripId: number): GeoPoint[] {
  return listTripPoints(tripId).map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy: point.accuracy,
  }));
}

export function TripRecorderProvider({ children }: { children: ReactNode }) {
  const { vehicle, status: vehicleStatus } = useVehicle();
  const { notifyDataChanged } = useDataSync();
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionSheet, setShowPermissionSheet] = useState(false);

  const permissionRef = useRef<PermissionState>('unknown');
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const tripRef = useRef<Trip | null>(null);
  const pointsRef = useRef<GeoPoint[]>([]);
  const startingRef = useRef(false);

  const handleLocation = useCallback((location: Location.LocationObject) => {
    const trip = tripRef.current;
    if (trip === null) return;

    const { latitude, longitude, accuracy } = location.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const point: GeoPoint = { latitude, longitude, accuracy: accuracy ?? null };
    try {
      insertTripPoint(trip.id, {
        timestamp: new Date(location.timestamp).toISOString(),
        ...point,
      });
    } catch (cause) {
      setError(toErrorMessage(cause));
      return;
    }

    pointsRef.current.push(point);
    setPoints([...pointsRef.current]);
    setDistanceKm(tripDistanceKm(filterUsablePoints(pointsRef.current)));
  }, []);

  const begin = useCallback(
    async (trip: Trip) => {
      tripRef.current = trip;
      pointsRef.current = toGeoPoints(trip.id);
      setPoints([...pointsRef.current]);
      setDistanceKm(tripDistanceKm(filterUsablePoints(pointsRef.current)));
      setActiveTrip(trip);
      setStatus('recording');
      setError(null);

      try {
        const subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 15_000, distanceInterval: 30 },
          handleLocation,
          (reason) => setError(reason)
        );
        if (tripRef.current?.id === trip.id) {
          subscriptionRef.current = subscription;
        } else {
          subscription.remove();
        }
      } catch (cause) {
        setError(toErrorMessage(cause));
      }
    },
    [handleLocation]
  );

  useEffect(() => {
    let active = true;
    Location.getForegroundPermissionsAsync()
      .then((response) => {
        if (!active) return;
        const next: PermissionState = response.status === 'granted' ? 'granted' : 'denied';
        permissionRef.current = next;
        setPermission(next);
        setCanAskAgain(response.canAskAgain);
      })
      .catch(() => {
        if (active) setPermission('denied');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      vehicleStatus !== 'ready' ||
      vehicle === null ||
      tripRef.current !== null ||
      startingRef.current
    ) {
      return;
    }
    const openTrip = getActiveTrip(vehicle.id);
    if (openTrip !== null) void begin(openTrip);
  }, [begin, vehicle, vehicleStatus]);

  useEffect(() => {
    if (activeTrip === null) return;
    const started = Date.parse(activeTrip.startedAt);
    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeTrip]);

  useEffect(
    () => () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    },
    []
  );

  const start = useCallback(async () => {
    if (status !== 'idle' || tripRef.current !== null || startingRef.current) return;

    try {
      const response = await Location.getForegroundPermissionsAsync();
      const next: PermissionState = response.status === 'granted' ? 'granted' : 'denied';
      permissionRef.current = next;
      setPermission(next);
      setCanAskAgain(response.canAskAgain);
    } catch {
      // Keep the last known state; the sheet still explains what is needed.
    }

    if (permissionRef.current !== 'granted') {
      setShowPermissionSheet(true);
      return;
    }
    if (vehicle === null) {
      setError('Add a vehicle before recording a trip.');
      return;
    }

    startingRef.current = true;
    setStatus('starting');
    try {
      await begin(createTrip(vehicle.id));
      notifyDataChanged();
    } catch (cause) {
      setStatus('idle');
      setError(toErrorMessage(cause));
    } finally {
      startingRef.current = false;
    }
  }, [begin, notifyDataChanged, status, vehicle]);

  const stop = useCallback(async () => {
    const trip = tripRef.current;
    if (trip === null) return;

    setStatus('stopping');
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;

    const distance = tripDistanceKm(filterUsablePoints(pointsRef.current));
    try {
      finishTrip(trip.id, new Date().toISOString(), distance);
      notifyDataChanged();
    } catch (cause) {
      setError(toErrorMessage(cause));
    }

    tripRef.current = null;
    pointsRef.current = [];
    setActiveTrip(null);
    setPoints([]);
    setDistanceKm(0);
    setElapsedSeconds(0);
    setStatus('idle');
  }, [notifyDataChanged]);

  const allowLocation = useCallback(async () => {
    try {
      const response = await Location.requestForegroundPermissionsAsync();
      const next: PermissionState = response.status === 'granted' ? 'granted' : 'denied';
      permissionRef.current = next;
      setPermission(next);
      setCanAskAgain(response.canAskAgain);
      setShowPermissionSheet(false);
      if (next === 'granted') {
        await start();
      } else {
        setError('Location access is off. Trips need it to record a route.');
      }
    } catch (cause) {
      setError(toErrorMessage(cause));
    }
  }, [start]);

  const dismissPermissionSheet = useCallback(() => setShowPermissionSheet(false), []);
  const openSettings = useCallback(() => {
    setShowPermissionSheet(false);
    void Linking.openSettings();
  }, []);

  const value = useMemo<TripRecorderValue>(
    () => ({
      permission,
      canAskAgain,
      status,
      activeTrip,
      points,
      distanceKm,
      elapsedSeconds,
      error,
      showPermissionSheet,
      start,
      stop,
      allowLocation,
      dismissPermissionSheet,
      openSettings,
    }),
    [
      permission,
      canAskAgain,
      status,
      activeTrip,
      points,
      distanceKm,
      elapsedSeconds,
      error,
      showPermissionSheet,
      start,
      stop,
      allowLocation,
      dismissPermissionSheet,
      openSettings,
    ]
  );

  return <TripRecorderContext.Provider value={value}>{children}</TripRecorderContext.Provider>;
}

export function useTripRecorder(): TripRecorderValue {
  const value = useContext(TripRecorderContext);
  if (value === null) throw new Error('useTripRecorder must be used inside TripRecorderProvider.');
  return value;
}
