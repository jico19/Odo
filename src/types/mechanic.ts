export type MechanicVisit = {
  id: number;
  vehicleId: number;
  date: string;
  shop: string | null;
  workDone: string | null;
  parts: string | null;
  cost: number | null;
  odometer: number | null;
  receiptUri: string | null;
};

export type NewMechanicVisit = Omit<MechanicVisit, 'id' | 'vehicleId'>;

export type MechanicVisitDraft = {
  date: string;
  shop: string;
  workDone: string;
  parts: string;
  cost: string;
  odometer: string;
  receiptUri: string | null;
};
