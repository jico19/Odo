import { PMS_TEMPLATES } from '@/constants/pmsTemplates';
import type {
  NewPmsItem,
  PmsItem,
  PmsItemDraft,
  PmsItemLike,
  PmsItemWithStatus,
  PmsStatus,
  PmsStatusInfo,
  PmsTemplateItem,
  PmsTimeUnit,
  TransmissionType,
} from '@/types/pms';
import { MAINTENANCE_LABELS, type MaintenanceLog } from '@/types/maintenance';
import type { DistanceUnit } from '@/types/preferences';

import { distanceUnitLabel, distanceValue, formatDistance } from './format';

import {
  getDueInfo,
  getMaintenanceProgress,
  type DueProgress,
  type DueRecord,
} from './calculations';

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function pmsTimeUnitFor(days: number | null): PmsTimeUnit {
  if (days !== null && days > 0 && days % 30 === 0) return 'months';
  if (days !== null && days > 0 && days % 7 === 0) return 'weeks';
  return 'days';
}

export function pmsItemToDraft(
  item: PmsItemLike,
  distanceUnit: DistanceUnit = 'km'
): PmsItemDraft {
  const unit = pmsTimeUnitFor(item.intervalDays);
  return {
    label: item.label,
    intervalKm:
      item.intervalKm === null
        ? ''
        : String(Math.round(distanceValue(item.intervalKm, distanceUnit))),
    intervalValue: item.intervalDays === null ? '' : String(fromDays(item.intervalDays, unit)),
    intervalUnit: unit,
    lastDoneOdometer:
      item.lastDoneOdometer === null
        ? ''
        : String(Math.round(distanceValue(item.lastDoneOdometer, distanceUnit))),
    lastDoneDate: item.lastDoneDate ?? '',
    isCustom: item.isCustom,
  };
}

export function newCustomPmsType(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDays(value: number, unit: PmsTimeUnit): number {
  if (unit === 'weeks') return value * 7;
  if (unit === 'months') return value * 30;
  return value;
}

export function fromDays(days: number, unit: PmsTimeUnit): number {
  if (unit === 'weeks') return days / 7;
  if (unit === 'months') return days / 30;
  return days;
}

export function getTemplateItems(
  transmissionType: TransmissionType | null,
  isLiquidCooled: boolean
): PmsTemplateItem[] {
  if (transmissionType === null) return [];

  return PMS_TEMPLATES.filter(
    (item) =>
      item.appliesTo.includes(transmissionType) &&
      (!item.liquidCooledOnly || isLiquidCooled)
  );
}

export function newItemsFromTemplate(
  items: readonly PmsTemplateItem[],
  startedOdometer: number,
  startedDate: string
): NewPmsItem[] {
  return items.map((item) => ({
    type: item.key,
    label: item.label,
    intervalKm: item.defaultIntervalKm,
    intervalDays: item.defaultIntervalDays,
    defaultIntervalKm: item.defaultIntervalKm,
    defaultIntervalDays: item.defaultIntervalDays,
    enabled: true,
    isCustom: false,
    lastDoneOdometer: null,
    lastDoneDate: null,
    startedOdometer,
    startedDate,
  }));
}

function dueRecord(item: PmsItem, currentOdometer: number, today: string): DueRecord {
  const baseOdometer = item.lastDoneOdometer ?? item.startedOdometer;
  const baseDate = item.lastDoneDate ?? item.startedDate;

  return {
    date: baseDate ?? today,
    odometer: baseOdometer ?? currentOdometer,
    nextDueKm:
      item.intervalKm !== null && baseOdometer !== null ? baseOdometer + item.intervalKm : null,
    nextDueDate:
      item.intervalDays !== null && baseDate !== null ? addDays(baseDate, item.intervalDays) : null,
  };
}

export function getPmsDueDate(item: PmsItem): string | null {
  const baseDate = item.lastDoneDate ?? item.startedDate;
  if (item.intervalDays === null || baseDate === null) return null;
  return addDays(baseDate, item.intervalDays);
}

export function computePmsStatus(
  item: PmsItem,
  currentOdometer: number,
  today: string
): PmsStatusInfo {
  const basis =
    item.lastDoneOdometer === null && item.lastDoneDate === null ? 'setup' : 'last_done';
  const record = dueRecord(item, currentOdometer, today);

  if (record.nextDueKm === null && record.nextDueDate === null) {
    return {
      status: 'ok',
      kmLeft: null,
      daysLeft: null,
      basis,
      nextDueKm: null,
      nextDueDate: null,
    };
  }

  const due = getDueInfo(record, currentOdometer, today);
  const status: PmsStatus =
    due.status === 'dueSoon' ? 'due_soon' : due.status === 'overdue' ? 'overdue' : 'ok';

  return {
    status,
    kmLeft: due.kmLeft,
    daysLeft: due.daysLeft,
    basis,
    nextDueKm: record.nextDueKm,
    nextDueDate: record.nextDueDate,
  };
}

export function getPmsProgress(
  item: PmsItem,
  currentOdometer: number,
  today: string
): DueProgress | null {
  return getMaintenanceProgress(dueRecord(item, currentOdometer, today), currentOdometer, today);
}

export function diffTemplate(
  existingItems: PmsItem[],
  newTemplateItems: readonly PmsTemplateItem[]
): { toAdd: PmsTemplateItem[]; toEnable: PmsItem[]; toDisable: PmsItem[] } {
  const existingKeys = new Set(existingItems.map((item) => item.type));
  const applicableKeys = new Set(newTemplateItems.map((item) => item.key));

  return {
    toAdd: newTemplateItems.filter((item) => !existingKeys.has(item.key)),
    toEnable: existingItems.filter(
      (item) => !item.isCustom && !item.enabled && applicableKeys.has(item.type)
    ),
    toDisable: existingItems.filter(
      (item) => !item.isCustom && item.enabled && !applicableKeys.has(item.type)
    ),
  };
}

export function isCustomized(item: PmsItemLike): boolean {
  if (item.isCustom) return false;
  return (
    item.intervalKm !== item.defaultIntervalKm || item.intervalDays !== item.defaultIntervalDays
  );
}

export function formatInterval(
  km: number | null,
  days: number | null,
  distanceUnit: DistanceUnit = 'km'
): string {
  const parts: string[] = [];
  if (km !== null) {
    parts.push(`${formatDistance(km, distanceUnit, 0)} ${distanceUnitLabel(distanceUnit)}`);
  }
  if (days !== null) {
    const months = days % 30 === 0 ? days / 30 : null;
    parts.push(months === null ? `${days} days` : `${months} month${months === 1 ? '' : 's'}`);
  }
  return parts.length === 0 ? 'Not set' : parts.join(' or ');
}

export function sortPmsItems(
  items: PmsItem[],
  currentOdometer: number,
  today: string
): PmsItemWithStatus[] {
  return items
    .map((item) => ({ item, status: computePmsStatus(item, currentOdometer, today) }))
    .sort((a, b) => {
      const aScore = Math.min(
        a.status.kmLeft ?? Number.POSITIVE_INFINITY,
        (a.status.daysLeft ?? Number.POSITIVE_INFINITY) * 100
      );
      const bScore = Math.min(
        b.status.kmLeft ?? Number.POSITIVE_INFINITY,
        (b.status.daysLeft ?? Number.POSITIVE_INFINITY) * 100
      );
      return aScore - bScore;
    });
}

export function pmsRemainingText(
  status: PmsStatusInfo,
  distanceUnit: DistanceUnit = 'km'
): string {
  const parts: string[] = [];
  if (status.kmLeft !== null) {
    parts.push(
      status.kmLeft < 0
        ? `${formatDistance(Math.abs(status.kmLeft), distanceUnit, 0)} overdue`
        : `${formatDistance(status.kmLeft, distanceUnit, 0)} to go`
    );
  }
  if (status.daysLeft !== null) {
    parts.push(
      status.daysLeft < 0
        ? `${Math.abs(status.daysLeft)} day${Math.abs(status.daysLeft) === 1 ? '' : 's'} overdue`
        : status.daysLeft === 0
          ? 'due today'
          : `${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'} to go`
    );
  }
  return parts.length === 0 ? 'No interval set' : parts.join(' · ');
}

export function maintenanceTypeForPms(type: string): MaintenanceLog['type'] {
  if (type === 'engine_oil' || type === 'oil_filter' || type === 'gear_oil' || type === 'cvt_belt_rollers') {
    return 'oil';
  }
  if (type === 'chain_sprocket' || type === 'clutch_adjustment') return 'chain';
  if (type === 'brake_pads') return 'brakes';
  if (type === 'tires') return 'tires';
  if (type === 'battery') return 'battery';
  if (type === 'coolant') return 'coolant';
  return 'inspection';
}

export function maintenanceLabel(log: MaintenanceLog, items: readonly PmsItem[]): string {
  if (log.pmsItemId === null) return MAINTENANCE_LABELS[log.type];
  return items.find((item) => item.id === log.pmsItemId)?.label ?? MAINTENANCE_LABELS[log.type];
}
