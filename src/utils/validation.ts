import type { DocumentDraft, NewDocument } from '@/types/document';
import type { FuelDraft, NewFuelLog } from '@/types/fuel';
import type { MechanicVisitDraft, NewMechanicVisit } from '@/types/mechanic';
import type { MaintenanceDraft, NewMaintenanceLog } from '@/types/maintenance';
import type {
  PmsItemDraft,
  PmsItemFieldErrors,
  PmsItemUpdate,
} from '@/types/pms';
import type { NewVehicle, VehicleDraft } from '@/types/vehicle';
import type { DistanceUnit } from '@/types/preferences';

import { distanceToKm, distanceUnitLabel, formatDistance } from './format';
import { toDays } from './pms';

export type VehicleFieldErrors = Partial<Record<keyof VehicleDraft, string>>;

type ValidDraft = { ok: true; value: NewVehicle };
type InvalidDraft = { ok: false; errors: VehicleFieldErrors };

export function parseOdometer(raw: string): number | null {
  const text = raw.trim().replace(/,/g, '');
  if (text.length === 0) return null;

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function validateVehicleDraft(draft: VehicleDraft): ValidDraft | InvalidDraft {
  const errors: VehicleFieldErrors = {};
  const name = draft.name.trim();
  const plate = draft.plate.trim();
  const odometer = parseOdometer(draft.odometer);

  if (name.length === 0) errors.name = 'Enter a name for your bike.';
  if (odometer === null || odometer < 0) errors.odometer = 'Enter an odometer value of 0 or more.';

  if (Object.keys(errors).length > 0 || odometer === null) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      plate: plate.length > 0 ? plate : null,
      odometer,
      transmissionType: 'automatic',
      isLiquidCooled: false,
      onboardingCompleted: true,
    },
  };
}

export function validateOdometerUpdate(
  raw: string
): { ok: true; value: number } | { ok: false; error: string } {
  const next = parseOdometer(raw);

  if (next === null) return { ok: false, error: 'Enter a valid number.' };
  if (next < 0) return { ok: false, error: 'Enter a value of 0 or more.' };

  return { ok: true, value: next };
}

type FuelField = Exclude<keyof FuelDraft, 'fullTank'>;
export type FuelFieldErrors = Partial<Record<FuelField, string>>;

type ValidFuelDraft = { ok: true; value: NewFuelLog };
type InvalidFuelDraft = { ok: false; errors: FuelFieldErrors };

export function isValidDate(raw: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;

  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function todayDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function parseNonNegative(raw: string): number | null {
  const value = parseOdometer(raw);
  return value === null || value < 0 ? null : value;
}

export function validateFuelDraft(draft: FuelDraft): ValidFuelDraft | InvalidFuelDraft {
  const errors: FuelFieldErrors = {};
  const date = draft.date.trim();
  const liters = parseNonNegative(draft.liters);
  const pricePerLiter = parseNonNegative(draft.pricePerLiter);
  const odometer = parseNonNegative(draft.odometer);

  if (!isValidDate(date)) errors.date = 'Use a valid date in YYYY-MM-DD format.';
  if (liters === null || liters <= 0) errors.liters = 'Enter liters greater than 0.';
  if (pricePerLiter === null) errors.pricePerLiter = 'Enter a price of 0 or more.';
  if (odometer === null) errors.odometer = 'Enter an odometer value of 0 or more.';

  if (
    Object.keys(errors).length > 0 ||
    liters === null ||
    pricePerLiter === null ||
    odometer === null
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      date,
      liters,
      pricePerLiter,
      totalCost: Math.round((liters * pricePerLiter + Number.EPSILON) * 100) / 100,
      odometer,
      fullTank: draft.fullTank,
    },
  };
}

export type MaintenanceFieldErrors = Partial<Record<keyof MaintenanceDraft, string>>;

type ValidMaintenanceDraft = { ok: true; value: NewMaintenanceLog };
type InvalidMaintenanceDraft = { ok: false; errors: MaintenanceFieldErrors };

export function validateMaintenanceDraft(
  draft: MaintenanceDraft
): ValidMaintenanceDraft | InvalidMaintenanceDraft {
  const errors: MaintenanceFieldErrors = {};
  const date = draft.date.trim();
  const odometer = parseNonNegative(draft.odometer);
  const cost = parseNonNegative(draft.cost);
  const nextDueKm = parseNonNegative(draft.nextDueKm);
  const nextDueDate = draft.nextDueDate.trim();
  const notes = draft.notes.trim();

  if (!isValidDate(date)) errors.date = 'Use a valid date in YYYY-MM-DD format.';
  if (draft.odometer.trim() !== '' && odometer === null) {
    errors.odometer = 'Enter an odometer value of 0 or more.';
  }
  if (draft.cost.trim() !== '' && cost === null) errors.cost = 'Enter a cost of 0 or more.';
  if (draft.nextDueKm.trim() !== '' && nextDueKm === null) {
    errors.nextDueKm = 'Enter a due odometer of 0 or more.';
  }
  if (nextDueDate !== '' && !isValidDate(nextDueDate)) {
    errors.nextDueDate = 'Use a valid date in YYYY-MM-DD format.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      type: draft.type,
      date,
      odometer,
      cost,
      notes: notes === '' ? null : notes,
      nextDueKm,
      nextDueDate: nextDueDate === '' ? null : nextDueDate,
      diy: draft.diy,
      pmsItemId: draft.pmsItemId ?? null,
    },
  };
}

export type MechanicFieldErrors = Partial<Record<keyof MechanicVisitDraft, string>>;

type ValidMechanicDraft = { ok: true; value: NewMechanicVisit };
type InvalidMechanicDraft = { ok: false; errors: MechanicFieldErrors };

export function validateMechanicVisitDraft(
  draft: MechanicVisitDraft
): ValidMechanicDraft | InvalidMechanicDraft {
  const errors: MechanicFieldErrors = {};
  const date = draft.date.trim();
  const shop = draft.shop.trim();
  const workDone = draft.workDone.trim();
  const parts = draft.parts.trim();
  const cost = parseNonNegative(draft.cost);
  const odometer = parseNonNegative(draft.odometer);

  if (!isValidDate(date)) errors.date = 'Use a valid date in YYYY-MM-DD format.';
  if (draft.cost.trim() !== '' && cost === null) errors.cost = 'Enter a cost of 0 or more.';
  if (draft.odometer.trim() !== '' && odometer === null) {
    errors.odometer = 'Enter an odometer value of 0 or more.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      date,
      shop: shop === '' ? null : shop,
      workDone: workDone === '' ? null : workDone,
      parts: parts === '' ? null : parts,
      cost,
      odometer,
      receiptUri: draft.receiptUri,
    },
  };
}

export type DocumentFieldErrors = Partial<Record<keyof DocumentDraft, string>>;

type ValidDocumentDraft = {
  ok: true;
  value: Omit<NewDocument, 'vehicleId' | 'renewedFromId'>;
};
type InvalidDocumentDraft = { ok: false; errors: DocumentFieldErrors };

export function validateDocumentDraft(
  draft: DocumentDraft
): ValidDocumentDraft | InvalidDocumentDraft {
  const errors: DocumentFieldErrors = {};
  const name = draft.name.trim();
  const issueDate = draft.issueDate.trim();
  const expiryDate = draft.expiryDate.trim();
  const cost = parseNonNegative(draft.cost);
  const notes = draft.notes.trim();

  if (!isValidDate(expiryDate)) errors.expiryDate = 'Enter the expiry date shown on the document.';
  if (issueDate !== '' && !isValidDate(issueDate)) {
    errors.issueDate = 'Use a valid date in YYYY-MM-DD format.';
  }
  if (draft.cost.trim() !== '' && cost === null) {
    errors.cost = 'Enter a renewal cost of 0 or more.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      type: draft.type,
      name: name === '' ? null : name,
      issueDate: issueDate === '' ? null : issueDate,
      expiryDate,
      cost,
      notes: notes === '' ? null : notes,
      photoUri: draft.photoUri,
    },
  };
}

function parseWholeNumber(raw: string): number | null {
  const value = parseOdometer(raw);
  return value === null || !Number.isInteger(value) ? null : value;
}

type ValidPmsItemDraft = { ok: true; value: PmsItemUpdate };
type InvalidPmsItemDraft = { ok: false; errors: PmsItemFieldErrors };

export function validatePmsItemDraft(
  draft: PmsItemDraft,
  today: string = todayDateKey(),
  distanceUnit: DistanceUnit = 'km'
): ValidPmsItemDraft | InvalidPmsItemDraft {
  const errors: PmsItemFieldErrors = {};
  const label = draft.label.trim();
  const km = draft.intervalKm.trim() === '' ? null : parseWholeNumber(draft.intervalKm);
  const amount = draft.intervalValue.trim() === '' ? null : parseWholeNumber(draft.intervalValue);
  const lastDoneOdometer =
    draft.lastDoneOdometer.trim() === '' ? null : parseNonNegative(draft.lastDoneOdometer);
  const lastDoneDate = draft.lastDoneDate.trim();
  const days = amount === null ? null : toDays(amount, draft.intervalUnit);
  const unitLabel = distanceUnitLabel(distanceUnit);

  if (draft.isCustom && label.length === 0) errors.label = 'Enter a name for this item.';
  if (draft.intervalKm.trim() !== '' && (km === null || km <= 0)) {
    errors.intervalKm = 'Enter a whole number greater than 0.';
  } else if (km !== null && distanceToKm(km, distanceUnit) > 1000000) {
    errors.intervalKm = `Enter ${formatDistance(1000000, distanceUnit, 0)} ${unitLabel} or less.`;
  }
  if (draft.intervalValue.trim() !== '' && (amount === null || amount <= 0)) {
    errors.intervalValue = 'Enter a whole number greater than 0.';
  } else if (days !== null && days > 3650) {
    errors.intervalValue = 'Enter 10 years or less.';
  }
  if (km === null && days === null) {
    errors.intervalValue = `Set an interval in ${unitLabel}, in time, or both.`;
  }
  if (draft.lastDoneOdometer.trim() !== '' && lastDoneOdometer === null) {
    errors.lastDoneOdometer = 'Enter an odometer value of 0 or more.';
  }
  if (lastDoneDate !== '' && !isValidDate(lastDoneDate)) {
    errors.lastDoneDate = 'Use a valid date in YYYY-MM-DD format.';
  } else if (lastDoneDate !== '' && lastDoneDate > today) {
    errors.lastDoneDate = 'Last done cannot be in the future.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      label,
      intervalKm: km,
      intervalDays: days,
      lastDoneOdometer,
      lastDoneDate: lastDoneDate === '' ? null : lastDoneDate,
    },
  };
}
