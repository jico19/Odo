export type Vehicle = {
  id: number;
  name: string;
  plate: string | null;
  odometer: number;
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
};
