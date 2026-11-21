import type { DistanceUnit } from '@/types/preferences';

const odometerFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const decimalFormatters = new Map<number, Intl.NumberFormat>();
const currencyFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export function formatOdometer(value: number): string {
  return odometerFormatter.format(value);
}

export function formatDistance(valueKm: number, unit: DistanceUnit = 'km', digits = 2): string {
  const value = unit === 'mi' ? valueKm / 1.609344 : valueKm;
  if (digits === 0) return odometerFormatter.format(Math.round(value));
  return formatNumber(value, digits);
}

export function distanceUnitLabel(unit: DistanceUnit): string {
  return unit === 'mi' ? 'mi' : 'km';
}

export function distanceValue(valueKm: number, unit: DistanceUnit = 'km'): number {
  return unit === 'mi' ? valueKm / 1.609344 : valueKm;
}

export function distanceToKm(value: number, unit: DistanceUnit = 'km'): number {
  return unit === 'mi' ? value * 1.609344 : value;
}

export function formatNumber(value: number, digits = 2): string {
  let formatter = decimalFormatters.get(digits);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    decimalFormatters.set(digits, formatter);
  }
  return formatter.format(value);
}

export function formatCurrency(value: number, currency = 'PHP'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${currencyFormatter.format(value)}`;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = String(seconds % 60).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${remainder}`;
  return `${String(minutes).padStart(2, '0')}:${remainder}`;
}

export function formatDateShort(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
