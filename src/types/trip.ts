export type Trip = {
  id: number;
  vehicleId: number | null;
  startedAt: string;
  endedAt: string | null;
  distanceKm: number | null;
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type TripPoint = GeoPoint & {
  id: number;
  tripId: number;
  timestamp: string;
};

export type NewTripPoint = Omit<TripPoint, 'id' | 'tripId'>;
