import type { TransmissionType } from './pms';

export type { TransmissionType } from './pms';

export type Vehicle = {
  id: number;
  name: string;
  plate: string | null;
  odometer: number;
  transmissionType: TransmissionType | null;
  isLiquidCooled: boolean;
  onboardingCompleted: boolean;
};

export type VehicleDraft = {
  name: string;
  plate: string;
  odometer: string;
};

export type NewVehicle = {
  name: string;
  plate: string | null;
  odometer: number;
  transmissionType: TransmissionType;
  isLiquidCooled: boolean;
  onboardingCompleted?: boolean;
};
