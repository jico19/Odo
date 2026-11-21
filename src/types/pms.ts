export const TRANSMISSION_KEYS = ['automatic', 'manual', 'semi_automatic'] as const;
export type TransmissionType = (typeof TRANSMISSION_KEYS)[number];

export const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  automatic: 'Automatic (including CVT)',
  manual: 'Manual',
  semi_automatic: 'Semi-Automatic',
};

export type PmsTimeUnit = 'days' | 'weeks' | 'months';
export type PmsStatus = 'ok' | 'due_soon' | 'overdue';
export type PmsDueBasis = 'last_done' | 'setup';

export type PmsItem = {
  id: number;
  vehicleId: number;
  type: string;
  label: string;
  intervalKm: number | null;
  intervalDays: number | null;
  defaultIntervalKm: number | null;
  defaultIntervalDays: number | null;
  enabled: boolean;
  isCustom: boolean;
  lastDoneOdometer: number | null;
  lastDoneDate: string | null;
  startedOdometer: number | null;
  startedDate: string | null;
};

export type NewPmsItem = Omit<PmsItem, 'id' | 'vehicleId'>;

export type PmsItemLike = Omit<PmsItem, 'id' | 'vehicleId'> & { id?: number };

export type PmsItemWithStatus = {
  item: PmsItem;
  status: PmsStatusInfo;
};

export type PmsItemUpdate = Pick<
  PmsItem,
  'label' | 'intervalKm' | 'intervalDays' | 'lastDoneOdometer' | 'lastDoneDate'
>;

export type PmsTemplateItem = {
  key: string;
  label: string;
  defaultIntervalKm: number | null;
  defaultIntervalDays: number | null;
  appliesTo: readonly TransmissionType[];
  liquidCooledOnly: boolean;
  hint: string;
};

export type PmsStatusInfo = {
  status: PmsStatus;
  kmLeft: number | null;
  daysLeft: number | null;
  basis: PmsDueBasis;
  nextDueKm: number | null;
  nextDueDate: string | null;
};

export type PmsItemDraft = {
  label: string;
  intervalKm: string;
  intervalValue: string;
  intervalUnit: PmsTimeUnit;
  lastDoneOdometer: string;
  lastDoneDate: string;
  isCustom: boolean;
};

export type PmsItemFieldErrors = Partial<
  Record<'label' | 'intervalKm' | 'intervalValue' | 'lastDoneOdometer' | 'lastDoneDate', string>
>;
