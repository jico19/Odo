import type { Vehicle } from './vehicle';

export type FuelLog = {
  id: number;
  vehicleId: number;
  date: string;
  liters: number;
  pricePerLiter: number | null;
  totalCost: number | null;
  odometer: number | null;
  fullTank: boolean;
};

export type FuelDraft = {
  date: string;
  liters: string;
  pricePerLiter: string;
  odometer: string;
  fullTank: boolean;
};

export type NewFuelLog = {
  date: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  fullTank: boolean;
};

export type FuelSaveResult = {
  log: FuelLog;
  vehicle: Vehicle;
};
