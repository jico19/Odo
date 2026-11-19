export const DOCUMENT_TYPES = ['registration', 'license', 'insurance', 'other'] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  registration: 'Registration (OR/CR)',
  license: "Driver's License",
  insurance: 'Insurance',
  other: 'Other document',
};

export type DocumentStatus = 'ok' | 'dueSoon' | 'expired';

export type Document = {
  id: number;
  vehicleId: number | null;
  type: DocumentType;
  name: string | null;
  issueDate: string | null;
  expiryDate: string;
  cost: number | null;
  notes: string | null;
  photoUri: string | null;
  renewedFromId: number | null;
  superseded: boolean;
};

export type NewDocument = {
  vehicleId: number | null;
  type: DocumentType;
  name: string | null;
  issueDate: string | null;
  expiryDate: string;
  cost: number | null;
  notes: string | null;
  photoUri: string | null;
  renewedFromId: number | null;
};

export type DocumentDraft = {
  type: DocumentType;
  name: string;
  issueDate: string;
  expiryDate: string;
  cost: string;
  notes: string;
  photoUri: string | null;
};
