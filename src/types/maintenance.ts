// Kept for old records and derived PMS categories. New logs use 'other' unless linked to a PMS item.
export const MAINTENANCE_TYPES = [
  'oil',
  'tires',
  'brakes',
  'chain',
  'battery',
  'coolant',
  'inspection',
  'other',
] as const;

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
  oil: 'Oil change',
  tires: 'Tires',
  brakes: 'Brakes',
  chain: 'Chain',
  battery: 'Battery',
  coolant: 'Coolant',
  inspection: 'Inspection',
  other: 'Service',
};

export type MaintenanceLog = {
  id: number;
  vehicleId: number;
  type: MaintenanceType;
  date: string;
  odometer: number | null;
  cost: number | null;
  notes: string | null;
  nextDueKm: number | null;
  nextDueDate: string | null;
  diy: boolean;
  visitId: number | null;
  pmsItemId: number | null;
};

export type NewMaintenanceLog = {
  type: MaintenanceType;
  date: string;
  odometer: number | null;
  cost: number | null;
  notes: string | null;
  nextDueKm: number | null;
  nextDueDate: string | null;
  diy: boolean;
  pmsItemId?: number | null;
};

export type MaintenanceDraft = {
  type: MaintenanceType;
  date: string;
  odometer: string;
  cost: string;
  notes: string;
  nextDueKm: string;
  nextDueDate: string;
  diy: boolean;
  pmsItemId?: number | null;
};
