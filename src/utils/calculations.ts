import type { StatusTone } from '@/components/ui/status-chip';
import type { DocumentStatus } from '@/types/document';
import type { FuelLog } from '@/types/fuel';
import type { MechanicVisit } from '@/types/mechanic';
import type { MaintenanceLog } from '@/types/maintenance';
import type { Trip } from '@/types/trip';

export type ChartPoint = {
  label: string;
  value: number;
};

export type FuelSegment = {
  fromDate: string;
  toDate: string;
  fromOdometer: number;
  toOdometer: number;
  distanceKm: number;
  liters: number;
  kmPerLiter: number;
  startIndex: number;
  endIndex: number;
};

export type FuelStats = {
  segments: FuelSegment[];
  averageKmPerLiter: number | null;
  monthlySpend: number;
  costPerKm: number | null;
  kmPerLiterSeries: ChartPoint[];
  monthlySpendSeries: ChartPoint[];
};

export function getTripDurationSeconds(
  startedAt: string,
  endedAt: string | null,
  now: Date = new Date()
): number {
  const end = Date.parse(endedAt ?? now.toISOString());
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, (end - start) / 1000);
}

export type TodayRideStats = {
  distanceKm: number;
  durationSeconds: number;
  count: number;
};

export function getTodayRideStats(trips: Trip[], today: string, now: Date = new Date()): TodayRideStats {
  const todayTrips = trips.filter((trip) => trip.startedAt.slice(0, 10) === today);

  return {
    distanceKm: roundTo(
      todayTrips.reduce((sum, trip) => sum + (trip.distanceKm ?? 0), 0),
      1
    ),
    durationSeconds: todayTrips.reduce(
      (sum, trip) => sum + getTripDurationSeconds(trip.startedAt, trip.endedAt, now),
      0
    ),
    count: todayTrips.length,
  };
}

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function getFuelLogCost(log: Pick<FuelLog, 'liters' | 'pricePerLiter' | 'totalCost'>): number {
  if (log.totalCost !== null) return log.totalCost;
  if (log.pricePerLiter !== null) return roundTo(log.liters * log.pricePerLiter, 2);
  return 0;
}

function compareAscending(a: FuelLog, b: FuelLog): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return a.id - b.id;
}

function monthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function shortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
  });
}

function shortMonth(date: Date): string {
  return date.toLocaleString(undefined, { month: 'short' });
}

function buildSegments(logs: FuelLog[]): FuelSegment[] {
  const segments: FuelSegment[] = [];
  let previousFull: { log: FuelLog; index: number } | null = null;
  let litersSincePreviousFull = 0;

  logs.forEach((log, index) => {
    if (log.fullTank) {
      if (previousFull !== null && log.odometer !== null && previousFull.log.odometer !== null) {
        const distance = log.odometer - previousFull.log.odometer;
        const liters = litersSincePreviousFull + log.liters;

        if (distance > 0 && liters > 0) {
          segments.push({
            fromDate: previousFull.log.date,
            toDate: log.date,
            fromOdometer: previousFull.log.odometer,
            toOdometer: log.odometer,
            distanceKm: distance,
            liters,
            kmPerLiter: distance / liters,
            startIndex: previousFull.index,
            endIndex: index,
          });
        }
      }

      previousFull = { log, index };
      litersSincePreviousFull = 0;
      return;
    }

    if (previousFull !== null) litersSincePreviousFull += log.liters;
  });

  return segments;
}

function buildMonthlySpendSeries(logs: FuelLog[], now: Date): ChartPoint[] {
  const spendByMonth = new Map<string, number>();
  for (const log of logs) {
    const key = log.date.slice(0, 7);
    spendByMonth.set(key, (spendByMonth.get(key) ?? 0) + getFuelLogCost(log));
  }

  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      label: shortMonth(monthDate),
      value: roundTo(spendByMonth.get(monthKey(monthDate)) ?? 0, 2),
    };
  });
}

export function calculateFuelStats(logs: FuelLog[], now: Date = new Date()): FuelStats {
  const chronological = [...logs].sort(compareAscending);
  const segments = buildSegments(chronological);
  const totalDistance = segments.reduce((sum, segment) => sum + segment.distanceKm, 0);
  const totalLiters = segments.reduce((sum, segment) => sum + segment.liters, 0);
  const segmentCost = segments.reduce(
    (sum, segment) =>
      chronological
        .slice(segment.startIndex + 1, segment.endIndex + 1)
        .reduce((inner, log) => inner + getFuelLogCost(log), sum),
    0
  );
  const currentMonth = monthKey(now);
  const monthlySpend = chronological
    .filter((log) => log.date.slice(0, 7) === currentMonth)
    .reduce((sum, log) => sum + getFuelLogCost(log), 0);

  return {
    segments,
    averageKmPerLiter: totalLiters > 0 ? totalDistance / totalLiters : null,
    monthlySpend: roundTo(monthlySpend, 2),
    costPerKm: totalDistance > 0 ? segmentCost / totalDistance : null,
    kmPerLiterSeries: segments.map((segment) => ({
      label: shortDate(segment.toDate),
      value: roundTo(segment.kmPerLiter, 1),
    })),
    monthlySpendSeries: buildMonthlySpendSeries(chronological, now),
  };
}

function getMonthlyEfficiencyAverages(
  stats: FuelStats,
  today: string
): { recent: number | null; previous: number | null } {
  const average = (fromAge: number, toAge: number): number | null => {
    const matching = stats.segments.filter((segment) => {
      const age = daysBetween(segment.toDate, today);
      return age >= fromAge && age < toAge;
    });
    if (matching.length === 0) return null;
    return matching.reduce((sum, segment) => sum + segment.kmPerLiter, 0) / matching.length;
  };

  return { recent: average(0, 30), previous: average(30, 60) };
}

export function getEfficiencyTrend(stats: FuelStats, today: string): number | null {
  const { recent, previous } = getMonthlyEfficiencyAverages(stats, today);
  if (recent === null || previous === null) return null;
  return roundTo(recent - previous, 1);
}

export function getEfficiencyTrendPercent(stats: FuelStats, today: string): number | null {
  const { recent, previous } = getMonthlyEfficiencyAverages(stats, today);
  if (recent === null || previous === null || previous === 0) return null;
  return roundTo(((recent - previous) / previous) * 100, 1);
}

export function getLogEfficiencies(stats: FuelStats, logs: FuelLog[]): Map<number, number> {
  const chronological = [...logs].sort(compareAscending);
  const byId = new Map<number, number>();
  for (const segment of stats.segments) {
    const log = chronological[segment.endIndex];
    if (log !== undefined) byId.set(log.id, roundTo(segment.kmPerLiter, 1));
  }
  return byId;
}

export function getBestEfficiency(stats: FuelStats): number | null {
  return stats.segments.reduce<number | null>(
    (best, segment) => (best === null ? segment.kmPerLiter : Math.max(best, segment.kmPerLiter)),
    null
  );
}

export const SOON_KM = 200;
export const SOON_DAYS = 7;

export type DueRecord = Pick<MaintenanceLog, 'date' | 'odometer' | 'nextDueKm' | 'nextDueDate'>;

export type DueInfo = {
  status: StatusTone;
  kmLeft: number | null;
  daysLeft: number | null;
};

function dayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}

export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

export function getDueInfo(
  record: DueRecord,
  currentOdometer: number,
  today: string
): DueInfo {
  const kmLeft = record.nextDueKm === null ? null : record.nextDueKm - currentOdometer;
  const daysLeft = record.nextDueDate === null ? null : daysBetween(today, record.nextDueDate);

  let status: StatusTone = 'ok';
  if ((kmLeft !== null && kmLeft <= 0) || (daysLeft !== null && daysLeft < 0)) {
    status = 'overdue';
  } else if (
    (kmLeft !== null && kmLeft <= SOON_KM) ||
    (daysLeft !== null && daysLeft <= SOON_DAYS)
  ) {
    status = 'dueSoon';
  }

  return { status, kmLeft, daysLeft };
}

export function getMaintenanceStatus(
  record: DueRecord,
  currentOdometer: number,
  today: string
): StatusTone {
  return getDueInfo(record, currentOdometer, today).status;
}

export type DueProgress = {
  value: number;
  max: number;
  tone: StatusTone;
  basis: 'km' | 'date';
};

export function getMaintenanceProgress(
  record: DueRecord,
  currentOdometer: number,
  today: string
): DueProgress | null {
  const tone = getMaintenanceStatus(record, currentOdometer, today);
  const candidates: (DueProgress & { ratio: number })[] = [];

  if (
    record.nextDueKm !== null &&
    record.odometer !== null &&
    record.nextDueKm > record.odometer
  ) {
    const max = record.nextDueKm - record.odometer;
    const value = Math.min(Math.max(currentOdometer - record.odometer, 0), max);
    candidates.push({ value, max, tone, basis: 'km', ratio: value / max });
  }

  if (record.nextDueDate !== null) {
    const max = daysBetween(record.date, record.nextDueDate);
    if (max > 0) {
      const value = Math.min(Math.max(daysBetween(record.date, today), 0), max);
      candidates.push({ value, max, tone, basis: 'date', ratio: value / max });
    }
  }

  const nearest = candidates.reduce<(DueProgress & { ratio: number }) | null>((best, candidate) => {
    if (best === null) return candidate;
    return candidate.ratio > best.ratio ? candidate : best;
  }, null);

  if (nearest === null) return null;
  return { value: nearest.value, max: nearest.max, tone: nearest.tone, basis: nearest.basis };
}

function dueScore(record: DueRecord, currentOdometer: number, today: string): number {
  const { kmLeft, daysLeft } = getDueInfo(record, currentOdometer, today);
  const scores = [
    kmLeft === null ? Number.POSITIVE_INFINITY : kmLeft / SOON_KM,
    daysLeft === null ? Number.POSITIVE_INFINITY : daysLeft / SOON_DAYS,
  ];
  return Math.min(...scores);
}

export function getUpcoming<T extends DueRecord>(
  records: T[],
  currentOdometer: number,
  today: string
): T[] {
  return records
    .filter((record) => record.nextDueKm !== null || record.nextDueDate !== null)
    .sort(
      (a, b) => dueScore(a, currentOdometer, today) - dueScore(b, currentOdometer, today)
    );
}

export const DOCUMENT_SOON_DAYS = 30;

export type DocumentDueInfo = {
  status: DocumentStatus;
  daysLeft: number;
};

export function getDocumentStatus(expiryDate: string, today: string): DocumentDueInfo {
  const daysLeft = daysBetween(today, expiryDate);
  if (daysLeft < 0) return { status: 'expired', daysLeft };
  if (daysLeft <= DOCUMENT_SOON_DAYS) return { status: 'dueSoon', daysLeft };
  return { status: 'ok', daysLeft };
}

export type DocumentChip = { tone: StatusTone; label: string };

export function documentChip(status: DocumentStatus): DocumentChip {
  if (status === 'expired') return { tone: 'overdue', label: 'EXPIRED' };
  if (status === 'dueSoon') return { tone: 'dueSoon', label: 'DUE SOON' };
  return { tone: 'ok', label: 'OK' };
}

export function daysLeftLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} overdue`;
  if (daysLeft === 0) return 'expires today';
  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} to go`;
}

/** Collapses spacing and casing so shops entered differently group together. */
export function normalizeShopName(raw: string | null): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export type ShopSpend = {
  shop: string;
  total: number;
  visits: number;
};

export type MechanicSpend = {
  total: number;
  byShop: ShopSpend[];
};

export function getMechanicSpend(visits: MechanicVisit[]): MechanicSpend {
  const groups = new Map<string, ShopSpend>();
  let total = 0;

  for (const visit of visits) {
    const cost = visit.cost ?? 0;
    total += cost;
    const key = normalizeShopName(visit.shop);
    const groupKey = key === '' ? 'unspecified' : key;
    const existing = groups.get(groupKey);
    if (existing === undefined) {
      groups.set(groupKey, {
        shop: visit.shop?.trim() || 'Unspecified shop',
        total: cost,
        visits: 1,
      });
    } else {
      existing.total += cost;
      existing.visits += 1;
    }
  }

  const byShop = Array.from(groups.values())
    .map((group) => ({ ...group, total: roundTo(group.total, 2) }))
    .sort((a, b) => b.total - a.total || a.shop.localeCompare(b.shop));

  return { total: roundTo(total, 2), byShop };
}
