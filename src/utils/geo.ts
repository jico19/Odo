import type { GeoPoint } from '@/types/trip';

import { roundTo } from './calculations';

export const MAX_POINT_ACCURACY_M = 50;

const EARTH_RADIUS_M = 6_371_008.8;
const DEGREES_TO_RADIANS = Math.PI / 180;

export type Coordinate = Pick<GeoPoint, 'latitude' | 'longitude'>;

export type PreviewPoint = { x: number; y: number };

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export function haversineMeters(from: Coordinate, to: Coordinate): number {
  const lat1 = from.latitude * DEGREES_TO_RADIANS;
  const lat2 = to.latitude * DEGREES_TO_RADIANS;
  const deltaLat = lat2 - lat1;
  const deltaLon = (to.longitude - from.longitude) * DEGREES_TO_RADIANS;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function filterUsablePoints(
  points: GeoPoint[],
  maxAccuracyM = MAX_POINT_ACCURACY_M
): GeoPoint[] {
  return points.filter(
    (point) =>
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude) &&
      (point.accuracy === null || point.accuracy <= maxAccuracyM)
  );
}

export function tripDistanceKm(points: GeoPoint[]): number {
  let meters = 0;
  for (let index = 1; index < points.length; index += 1) {
    meters += haversineMeters(points[index - 1], points[index]);
  }
  return roundTo(meters / 1000, 2);
}

function toLocalMeters(point: Coordinate, origin: Coordinate, latitudeScale: number) {
  return {
    x: (point.longitude - origin.longitude) * latitudeScale,
    y: (point.latitude - origin.latitude) * EARTH_RADIUS_M * DEGREES_TO_RADIANS,
  };
}

function perpendicularDistanceMeters(
  point: Coordinate,
  start: Coordinate,
  end: Coordinate
): number {
  const latitudeScale =
    EARTH_RADIUS_M * DEGREES_TO_RADIANS * Math.cos((start.latitude * DEGREES_TO_RADIANS + end.latitude * DEGREES_TO_RADIANS) / 2);
  const p = toLocalMeters(point, start, latitudeScale);
  const e = toLocalMeters(end, start, latitudeScale);
  const segmentLength = Math.hypot(e.x, e.y);
  if (segmentLength === 0) return Math.hypot(p.x, p.y);
  return Math.abs(e.y * p.x - e.x * p.y) / segmentLength;
}

/** Douglas-Peucker, iterative so long trips cannot overflow the call stack. */
export function simplifyPath<T extends GeoPoint>(points: T[], toleranceM = 5): T[] {
  if (points.length <= 2) return [...points];

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];

  while (stack.length > 0) {
    const segment = stack.pop();
    if (segment === undefined) break;
    const [start, end] = segment;
    let farthest = -1;
    let farthestIndex = -1;

    for (let index = start + 1; index < end; index += 1) {
      const distance = perpendicularDistanceMeters(points[index], points[start], points[end]);
      if (distance > farthest) {
        farthest = distance;
        farthestIndex = index;
      }
    }

    if (farthest > toleranceM && farthestIndex !== -1) {
      keep[farthestIndex] = 1;
      stack.push([start, farthestIndex], [farthestIndex, end]);
    }
  }

  return points.filter((_, index) => keep[index] === 1);
}

export function buildPreviewPath(
  points: GeoPoint[],
  width: number,
  height: number,
  padding = 6
): PreviewPoint[] {
  if (points.length === 0) return [];

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;
  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }
  const midLat = (minLat + maxLat) / 2;
  const latitudeScale =
    EARTH_RADIUS_M * DEGREES_TO_RADIANS * Math.cos(midLat * DEGREES_TO_RADIANS);
  const widthM = Math.max((maxLon - minLon) * latitudeScale, 1);
  const heightM = Math.max((maxLat - minLat) * EARTH_RADIUS_M * DEGREES_TO_RADIANS, 1);
  const scale = Math.min((width - padding * 2) / widthM, (height - padding * 2) / heightM);
  const left = padding + (width - padding * 2 - widthM * scale) / 2;
  const top = padding + (height - padding * 2 - heightM * scale) / 2;

  return points.map((point) => ({
    x: left + (point.longitude - minLon) * latitudeScale * scale,
    y: top + (maxLat - point.latitude) * EARTH_RADIUS_M * DEGREES_TO_RADIANS * scale,
  }));
}

export function tripRegion(points: GeoPoint[]): MapRegion {
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;
  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.004),
    longitudeDelta: Math.max((maxLon - minLon) * 1.4, 0.004),
  };
}
