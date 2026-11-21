import type { Document, NewDocument } from '@/types/document';
import type { FuelLog, FuelSaveResult, NewFuelLog } from '@/types/fuel';
import type { MechanicVisit, NewMechanicVisit } from '@/types/mechanic';
import type { MaintenanceLog, MaintenanceType, NewMaintenanceLog } from '@/types/maintenance';
import type { NewPmsItem, PmsItem, PmsItemUpdate, TransmissionType } from '@/types/pms';
import type { GeoPoint, NewTripPoint, Trip, TripPoint } from '@/types/trip';
import type { NewVehicle, Vehicle } from '@/types/vehicle';

import { getDatabase } from './database';

type VehicleRow = {
  id: number;
  name: string;
  plate: string | null;
  odometer: number;
  transmission_type: string | null;
  is_liquid_cooled: number;
  onboarding_completed: number;
};

const VEHICLE_COLUMNS =
  'id, name, plate, odometer, transmission_type, is_liquid_cooled, onboarding_completed';

function toTransmission(value: string | null): TransmissionType | null {
  return value === 'automatic' || value === 'manual' || value === 'semi_automatic' ? value : null;
}

function toVehicle(row: VehicleRow | null): Vehicle | null {
  if (row === null) return null;

  return {
    id: row.id,
    name: row.name,
    plate: row.plate,
    odometer: row.odometer,
    transmissionType: toTransmission(row.transmission_type),
    isLiquidCooled: row.is_liquid_cooled === 1,
    onboardingCompleted: row.onboarding_completed === 1,
  };
}

export function getFirstVehicle(): Vehicle | null {
  const row = getDatabase().getFirstSync<VehicleRow>(
    `SELECT ${VEHICLE_COLUMNS} FROM vehicles ORDER BY id ASC LIMIT 1`
  );
  return toVehicle(row ?? null);
}

export function getVehicle(id: number): Vehicle | null {
  const row = getDatabase().getFirstSync<VehicleRow>(
    `SELECT ${VEHICLE_COLUMNS} FROM vehicles WHERE id = ?`,
    id
  );
  return toVehicle(row ?? null);
}

export function getVehicles(): Vehicle[] {
  const rows = getDatabase().getAllSync<VehicleRow>(
    `SELECT ${VEHICLE_COLUMNS} FROM vehicles ORDER BY id ASC`
  );
  return rows.map((row) => {
    const vehicle = toVehicle(row);
    if (vehicle === null) throw new Error('Could not read a vehicle.');
    return vehicle;
  });
}

type VehicleInsert = {
  name: string;
  plate: string | null;
  odometer: number;
  transmissionType: TransmissionType;
  isLiquidCooled: boolean;
  onboardingCompleted: boolean;
};

function insertVehicleRow(input: VehicleInsert): Vehicle {
  const result = getDatabase().runSync(
    `INSERT INTO vehicles
     (name, plate, odometer, transmission_type, is_liquid_cooled, onboarding_completed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.name,
    input.plate,
    input.odometer,
    input.transmissionType,
    input.isLiquidCooled ? 1 : 0,
    input.onboardingCompleted ? 1 : 0
  );
  const created = getVehicle(Number(result.lastInsertRowId));
  if (created === null) throw new Error('Could not read the vehicle after saving it.');
  return created;
}

export function createVehicle(input: NewVehicle): Vehicle {
  return insertVehicleRow({
    name: input.name,
    plate: input.plate,
    odometer: input.odometer,
    transmissionType: input.transmissionType,
    isLiquidCooled: input.isLiquidCooled,
    onboardingCompleted: input.onboardingCompleted === true,
  });
}

export type VehicleSettings = Pick<
  NewVehicle,
  'name' | 'plate' | 'transmissionType' | 'isLiquidCooled'
>;

export function updateVehicle(id: number, input: VehicleSettings): Vehicle | null {
  getDatabase().runSync(
    `UPDATE vehicles
        SET name = ?, plate = ?, transmission_type = ?, is_liquid_cooled = ?
      WHERE id = ?`,
    input.name,
    input.plate,
    input.transmissionType,
    input.isLiquidCooled ? 1 : 0,
    id
  );
  return getVehicle(id);
}

export function setOnboardingComplete(id: number): Vehicle | null {
  getDatabase().runSync('UPDATE vehicles SET onboarding_completed = 1 WHERE id = ?', id);
  return getVehicle(id);
}

export function setOdometer(id: number, next: number): Vehicle {
  getDatabase().runSync('UPDATE vehicles SET odometer = ? WHERE id = ?', next, id);

  const updated = getVehicle(id);
  if (updated === null) throw new Error('Vehicle not found.');

  return updated;
}

export function createVehicleWithItems(input: NewVehicle, items: NewPmsItem[]): Vehicle {
  const db = getDatabase();
  const saved: Vehicle[] = [];

  db.withTransactionSync(() => {
    const vehicle = insertVehicleRow({
      name: input.name,
      plate: input.plate,
      odometer: input.odometer,
      transmissionType: input.transmissionType,
      isLiquidCooled: input.isLiquidCooled,
      onboardingCompleted: true,
    });
    for (const item of items) insertPmsItemRow(vehicle.id, item);
    saved.push(vehicle);
  });

  const result = saved[0];
  if (result === undefined) throw new Error('Vehicle setup did not return a result.');
  return result;
}

type PmsItemRow = {
  id: number;
  vehicle_id: number;
  type: string;
  label: string;
  interval_km: number | null;
  interval_days: number | null;
  default_interval_km: number | null;
  default_interval_days: number | null;
  enabled: number;
  is_custom: number;
  last_done_odometer: number | null;
  last_done_date: string | null;
  started_odometer: number | null;
  started_date: string | null;
};

const PMS_ITEM_COLUMNS = `id, vehicle_id, type, label, interval_km, interval_days,
  default_interval_km, default_interval_days, enabled, is_custom,
  last_done_odometer, last_done_date, started_odometer, started_date`;

function toPmsItem(row: PmsItemRow): PmsItem {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    type: row.type,
    label: row.label,
    intervalKm: row.interval_km,
    intervalDays: row.interval_days,
    defaultIntervalKm: row.default_interval_km,
    defaultIntervalDays: row.default_interval_days,
    enabled: row.enabled === 1,
    isCustom: row.is_custom === 1,
    lastDoneOdometer: row.last_done_odometer,
    lastDoneDate: row.last_done_date,
    startedOdometer: row.started_odometer,
    startedDate: row.started_date,
  };
}

function insertPmsItemRow(vehicleId: number, input: NewPmsItem): PmsItem {
  const result = getDatabase().runSync(
    `INSERT INTO pms_items
     (vehicle_id, type, label, interval_km, interval_days, default_interval_km,
      default_interval_days, enabled, is_custom, last_done_odometer, last_done_date,
      started_odometer, started_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    vehicleId,
    input.type,
    input.label,
    input.intervalKm,
    input.intervalDays,
    input.defaultIntervalKm,
    input.defaultIntervalDays,
    input.enabled ? 1 : 0,
    input.isCustom ? 1 : 0,
    input.lastDoneOdometer,
    input.lastDoneDate,
    input.startedOdometer,
    input.startedDate
  );
  const created = getPmsItem(Number(result.lastInsertRowId));
  if (created === null) throw new Error('Could not read the PMS item after saving it.');
  return created;
}

export function listPmsItems(vehicleId: number): PmsItem[] {
  const rows = getDatabase().getAllSync<PmsItemRow>(
    `SELECT ${PMS_ITEM_COLUMNS} FROM pms_items
      WHERE vehicle_id = ?
      ORDER BY is_custom ASC, id ASC`,
    vehicleId
  );
  return rows.map(toPmsItem);
}

export function getPmsItem(id: number): PmsItem | null {
  const row = getDatabase().getFirstSync<PmsItemRow>(
    `SELECT ${PMS_ITEM_COLUMNS} FROM pms_items WHERE id = ?`,
    id
  );
  return row === null || row === undefined ? null : toPmsItem(row);
}

export function getPmsItemByType(vehicleId: number, type: string): PmsItem | null {
  const row = getDatabase().getFirstSync<PmsItemRow>(
    `SELECT ${PMS_ITEM_COLUMNS} FROM pms_items WHERE vehicle_id = ? AND type = ?`,
    vehicleId,
    type
  );
  return row === null || row === undefined ? null : toPmsItem(row);
}

export function insertPmsItem(vehicleId: number, input: NewPmsItem): PmsItem {
  return insertPmsItemRow(vehicleId, input);
}

export function updatePmsItem(id: number, input: PmsItemUpdate): PmsItem | null {
  const result = getDatabase().runSync(
    `UPDATE pms_items
        SET label = ?, interval_km = ?, interval_days = ?,
            last_done_odometer = ?, last_done_date = ?
      WHERE id = ?`,
    input.label,
    input.intervalKm,
    input.intervalDays,
    input.lastDoneOdometer,
    input.lastDoneDate,
    id
  );
  if (result.changes === 0) return null;
  return getPmsItem(id);
}

export function setPmsItemEnabled(id: number, enabled: boolean): PmsItem | null {
  getDatabase().runSync('UPDATE pms_items SET enabled = ? WHERE id = ?', enabled ? 1 : 0, id);
  return getPmsItem(id);
}

export function deleteCustomPmsItem(id: number): void {
  const result = getDatabase().runSync(
    'DELETE FROM pms_items WHERE id = ? AND is_custom = 1',
    id
  );
  if (result.changes === 0) throw new Error('Custom PMS item not found.');
}

export function applyTemplateItems(vehicleId: number, items: NewPmsItem[]): PmsItem[] {
  const db = getDatabase();
  const added: PmsItem[] = [];

  db.withTransactionSync(() => {
    for (const item of items) {
      if (getPmsItemByType(vehicleId, item.type) !== null) continue;
      added.push(insertPmsItemRow(vehicleId, item));
    }
  });

  return added;
}

export function resetPmsItemToDefault(id: number): PmsItem | null {
  getDatabase().runSync(
    `UPDATE pms_items
        SET interval_km = default_interval_km, interval_days = default_interval_days
      WHERE id = ? AND is_custom = 0`,
    id
  );
  return getPmsItem(id);
}

const RESET_ALL_SQL =
  `UPDATE pms_items SET interval_km = default_interval_km, interval_days = default_interval_days
    WHERE vehicle_id = ? AND is_custom = 0`;

const RESET_UNCUSTOMIZED_SQL =
  `UPDATE pms_items SET interval_km = default_interval_km, interval_days = default_interval_days
    WHERE vehicle_id = ? AND is_custom = 0
      AND (interval_km IS NOT default_interval_km OR interval_days IS NOT default_interval_days)`;

export function resetAllPmsItems(vehicleId: number, onlyUncustomized: boolean): void {
  getDatabase().runSync(
    onlyUncustomized ? RESET_UNCUSTOMIZED_SQL : RESET_ALL_SQL,
    vehicleId
  );
}

export function getPreference(key: string): string | null {
  const row = getDatabase().getFirstSync<{ value: string }>(
    'SELECT value FROM preferences WHERE key = ?',
    key
  );
  return row === null || row === undefined ? null : row.value;
}

export function setPreference(key: string, value: string): void {
  getDatabase().runSync(
    `INSERT INTO preferences (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
}

type FuelRow = {
  id: number;
  vehicle_id: number;
  date: string;
  liters: number;
  price_per_liter: number | null;
  total_cost: number | null;
  odometer: number | null;
  full_tank: number;
};

function toFuelLog(row: FuelRow): FuelLog {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    date: row.date,
    liters: row.liters,
    pricePerLiter: row.price_per_liter,
    totalCost: row.total_cost,
    odometer: row.odometer,
    fullTank: row.full_tank === 1,
  };
}

export function listFuelLogs(vehicleId: number): FuelLog[] {
  const rows = getDatabase().getAllSync<FuelRow>(
    `SELECT id, vehicle_id, date, liters, price_per_liter, total_cost, odometer, full_tank
     FROM fuel_logs
     WHERE vehicle_id = ?
     ORDER BY date DESC, id DESC`,
    vehicleId
  );
  return rows.map(toFuelLog);
}

export function getFuelLog(id: number): FuelLog | null {
  const row = getDatabase().getFirstSync<FuelRow>(
    `SELECT id, vehicle_id, date, liters, price_per_liter, total_cost, odometer, full_tank
     FROM fuel_logs
     WHERE id = ?`,
    id
  );
  return row === null || row === undefined ? null : toFuelLog(row);
}

function raiseOdometerTo(id: number, next: number): Vehicle {
  const current = getVehicle(id);
  if (current === null) throw new Error('Vehicle not found.');
  if (next <= current.odometer) return current;

  const result = getDatabase().runSync(
    'UPDATE vehicles SET odometer = ? WHERE id = ? AND odometer < ?',
    next,
    id,
    next
  );
  if (result.changes === 0) throw new Error('Could not update the odometer.');

  const updated = getVehicle(id);
  if (updated === null) throw new Error('Could not read the vehicle after saving it.');
  return updated;
}

export function insertFuelLogWithOdometer(vehicleId: number, input: NewFuelLog): FuelSaveResult {
  const db = getDatabase();
  const saved: FuelSaveResult[] = [];

  db.withTransactionSync(() => {
    const result = db.runSync(
      `INSERT INTO fuel_logs
       (vehicle_id, date, liters, price_per_liter, total_cost, odometer, full_tank)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      vehicleId,
      input.date,
      input.liters,
      input.pricePerLiter,
      input.totalCost,
      input.odometer,
      input.fullTank ? 1 : 0
    );

    const log = getFuelLog(Number(result.lastInsertRowId));
    if (log === null) throw new Error('Could not read the fuel log after saving it.');
    saved.push({ log, vehicle: raiseOdometerTo(vehicleId, input.odometer) });
  });

  const result = saved[0];
  if (result === undefined) throw new Error('Fuel log save did not return a result.');
  return result;
}

export function updateFuelLogWithOdometer(
  logId: number,
  vehicleId: number,
  input: NewFuelLog
): FuelSaveResult {
  const db = getDatabase();
  const saved: FuelSaveResult[] = [];

  db.withTransactionSync(() => {
    const result = db.runSync(
      `UPDATE fuel_logs
       SET date = ?, liters = ?, price_per_liter = ?, total_cost = ?, odometer = ?, full_tank = ?
       WHERE id = ? AND vehicle_id = ?`,
      input.date,
      input.liters,
      input.pricePerLiter,
      input.totalCost,
      input.odometer,
      input.fullTank ? 1 : 0,
      logId,
      vehicleId
    );
    if (result.changes === 0) throw new Error('Fuel log not found.');

    const log = getFuelLog(logId);
    if (log === null) throw new Error('Could not read the fuel log after saving it.');
    saved.push({ log, vehicle: raiseOdometerTo(vehicleId, input.odometer) });
  });

  const result = saved[0];
  if (result === undefined) throw new Error('Fuel log save did not return a result.');
  return result;
}

export function deleteFuelLog(logId: number, vehicleId: number): void {
  const result = getDatabase().runSync(
    'DELETE FROM fuel_logs WHERE id = ? AND vehicle_id = ?',
    logId,
    vehicleId
  );
  if (result.changes === 0) throw new Error('Fuel log not found.');
}

type MaintenanceRow = {
  id: number;
  vehicle_id: number;
  type: string;
  date: string;
  odometer: number | null;
  cost: number | null;
  notes: string | null;
  next_due_km: number | null;
  next_due_date: string | null;
  diy: number;
  visit_id: number | null;
  pms_item_id: number | null;
};

function toMaintenanceLog(row: MaintenanceRow): MaintenanceLog {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    type: row.type as MaintenanceType,
    date: row.date,
    odometer: row.odometer,
    cost: row.cost,
    notes: row.notes,
    nextDueKm: row.next_due_km,
    nextDueDate: row.next_due_date,
    diy: row.diy === 1,
    visitId: row.visit_id,
    pmsItemId: row.pms_item_id,
  };
}

function requireVehicle(id: number): Vehicle {
  const vehicle = getVehicle(id);
  if (vehicle === null) throw new Error('Vehicle not found.');
  return vehicle;
}

const MAINTENANCE_COLUMNS = `id, vehicle_id, type, date, odometer, cost, notes, next_due_km,
  next_due_date, diy, visit_id, pms_item_id`;

type SyncDatabase = ReturnType<typeof getDatabase>;

function lastDoneMatchesLog(item: PmsItem, log: MaintenanceLog): boolean {
  if (item.lastDoneDate !== log.date) return false;
  if (item.lastDoneOdometer === null || log.odometer === null) return true;
  return item.lastDoneOdometer === log.odometer;
}

function logIsNewerThanLastDone(log: MaintenanceLog, item: PmsItem): boolean {
  if (item.lastDoneDate === null) return true;
  if (log.date > item.lastDoneDate) return true;
  if (log.date < item.lastDoneDate) return false;
  if (item.lastDoneOdometer === null) return log.odometer !== null;
  return log.odometer !== null && log.odometer > item.lastDoneOdometer;
}

function writePmsLastDone(db: SyncDatabase, item: PmsItem, log: MaintenanceLog): void {
  db.runSync(
    `UPDATE pms_items SET last_done_odometer = ?, last_done_date = ? WHERE id = ?`,
    log.odometer ?? item.lastDoneOdometer,
    log.date,
    item.id
  );
}

function recomputePmsLastDone(
  db: SyncDatabase,
  vehicleId: number,
  pmsItemId: number,
  detachedLogId: number,
  detachedLog: MaintenanceLog
): void {
  const item = getPmsItem(pmsItemId);
  if (item === null || item.vehicleId !== vehicleId) return;
  if (!lastDoneMatchesLog(item, detachedLog)) return;

  const latest = db.getFirstSync<MaintenanceRow>(
    `SELECT ${MAINTENANCE_COLUMNS} FROM maintenance_logs
      WHERE vehicle_id = ? AND pms_item_id = ? AND id != ?
      ORDER BY date DESC, id DESC LIMIT 1`,
    vehicleId,
    pmsItemId,
    detachedLogId
  );

  if (latest === null || latest === undefined) {
    db.runSync(
      'UPDATE pms_items SET last_done_odometer = NULL, last_done_date = NULL WHERE id = ?',
      pmsItemId
    );
    return;
  }

  writePmsLastDone(db, item, toMaintenanceLog(latest));
}

export function listMaintenanceLogs(vehicleId: number): MaintenanceLog[] {
  const rows = getDatabase().getAllSync<MaintenanceRow>(
    `SELECT ${MAINTENANCE_COLUMNS} FROM maintenance_logs
     WHERE vehicle_id = ?
     ORDER BY date DESC, id DESC`,
    vehicleId
  );
  return rows.map(toMaintenanceLog);
}

export function getMaintenanceLog(id: number): MaintenanceLog | null {
  const row = getDatabase().getFirstSync<MaintenanceRow>(
    `SELECT ${MAINTENANCE_COLUMNS} FROM maintenance_logs WHERE id = ?`,
    id
  );
  return row === null || row === undefined ? null : toMaintenanceLog(row);
}

export type MaintenanceSaveResult = {
  log: MaintenanceLog;
  vehicle: Vehicle;
};

function saveMaintenanceLog(
  vehicleId: number,
  input: NewMaintenanceLog,
  write: () => number,
  existingLog: MaintenanceLog | null = null
): MaintenanceSaveResult {
  const db = getDatabase();
  const saved: MaintenanceSaveResult[] = [];

  db.withTransactionSync(() => {
    const logId = write();
    const log = getMaintenanceLog(logId);
    if (log === null) throw new Error('Could not read the maintenance log after saving it.');

    if (existingLog?.pmsItemId != null) {
      recomputePmsLastDone(db, vehicleId, existingLog.pmsItemId, logId, existingLog);
    }

    if (log.pmsItemId !== null) {
      const item = getPmsItem(log.pmsItemId);
      if (
        item !== null &&
        item.vehicleId === vehicleId &&
        logIsNewerThanLastDone(log, item)
      ) {
        writePmsLastDone(db, item, log);
      }
    }

    saved.push({
      log,
      vehicle: input.odometer === null ? requireVehicle(vehicleId) : raiseOdometerTo(vehicleId, input.odometer),
    });
  });

  const result = saved[0];
  if (result === undefined) throw new Error('Maintenance save did not return a result.');
  return result;
}

export function insertMaintenanceLogWithOdometer(
  vehicleId: number,
  input: NewMaintenanceLog
): MaintenanceSaveResult {
  return saveMaintenanceLog(vehicleId, input, () => {
    const result = getDatabase().runSync(
      `INSERT INTO maintenance_logs
       (vehicle_id, type, date, odometer, cost, notes, next_due_km, next_due_date, diy, pms_item_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      vehicleId,
      input.type,
      input.date,
      input.odometer,
      input.cost,
      input.notes,
      input.nextDueKm,
      input.nextDueDate,
      input.diy ? 1 : 0,
      input.pmsItemId ?? null
    );
    return Number(result.lastInsertRowId);
  });
}

export function updateMaintenanceLogWithOdometer(
  logId: number,
  vehicleId: number,
  input: NewMaintenanceLog
): MaintenanceSaveResult {
  const existing = getMaintenanceLog(logId);
  return saveMaintenanceLog(vehicleId, input, () => {
    const result = getDatabase().runSync(
      `UPDATE maintenance_logs
       SET type = ?, date = ?, odometer = ?, cost = ?, notes = ?, next_due_km = ?,
           next_due_date = ?, diy = ?, pms_item_id = ?
       WHERE id = ? AND vehicle_id = ?`,
      input.type,
      input.date,
      input.odometer,
      input.cost,
      input.notes,
      input.nextDueKm,
      input.nextDueDate,
      input.diy ? 1 : 0,
      input.pmsItemId ?? null,
      logId,
      vehicleId
    );
    if (result.changes === 0) throw new Error('Maintenance log not found.');
    return logId;
  }, existing);
}

export function deleteMaintenanceLog(logId: number, vehicleId: number): void {
  const db = getDatabase();

  db.withTransactionSync(() => {
    const existing = getMaintenanceLog(logId);
    if (existing === null || existing.vehicleId !== vehicleId) {
      throw new Error('Maintenance log not found.');
    }

    const result = db.runSync(
      'DELETE FROM maintenance_logs WHERE id = ? AND vehicle_id = ?',
      logId,
      vehicleId
    );
    if (result.changes === 0) throw new Error('Maintenance log not found.');

    if (existing.pmsItemId !== null) {
      recomputePmsLastDone(db, vehicleId, existing.pmsItemId, logId, existing);
    }
  });
}

type DocumentRow = {
  id: number;
  vehicle_id: number | null;
  type: string;
  name: string | null;
  issue_date: string | null;
  expiry_date: string;
  cost: number | null;
  notes: string | null;
  photo_uri: string | null;
  renewed_from_id: number | null;
  superseded: number;
};

const DOCUMENT_COLUMNS = `id, vehicle_id, type, name, issue_date, expiry_date, cost, notes,
  photo_uri, renewed_from_id,
  EXISTS(SELECT 1 FROM documents AS renewal WHERE renewal.renewed_from_id = documents.id) AS superseded`;

function toDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    type: row.type as Document['type'],
    name: row.name,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    cost: row.cost,
    notes: row.notes,
    photoUri: row.photo_uri,
    renewedFromId: row.renewed_from_id,
    superseded: row.superseded === 1,
  };
}

export function listDocuments(): Document[] {
  const rows = getDatabase().getAllSync<DocumentRow>(
    `SELECT ${DOCUMENT_COLUMNS} FROM documents ORDER BY expiry_date DESC, id DESC`
  );
  return rows.map(toDocument);
}

export function getDocument(id: number): Document | null {
  const row = getDatabase().getFirstSync<DocumentRow>(
    `SELECT ${DOCUMENT_COLUMNS} FROM documents WHERE id = ?`,
    id
  );
  return row === null || row === undefined ? null : toDocument(row);
}

export function insertDocument(input: NewDocument): Document {
  const result = getDatabase().runSync(
    `INSERT INTO documents
     (vehicle_id, type, name, issue_date, expiry_date, cost, notes, photo_uri, renewed_from_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.vehicleId,
    input.type,
    input.name,
    input.issueDate,
    input.expiryDate,
    input.cost,
    input.notes,
    input.photoUri,
    input.renewedFromId
  );
  const created = getDocument(Number(result.lastInsertRowId));
  if (created === null) throw new Error('Could not read the document after saving it.');
  return created;
}

export function updateDocument(id: number, input: NewDocument): Document | null {
  const result = getDatabase().runSync(
    `UPDATE documents
     SET vehicle_id = ?, type = ?, name = ?, issue_date = ?, expiry_date = ?, cost = ?,
         notes = ?, photo_uri = ?, renewed_from_id = ?
     WHERE id = ?`,
    input.vehicleId,
    input.type,
    input.name,
    input.issueDate,
    input.expiryDate,
    input.cost,
    input.notes,
    input.photoUri,
    input.renewedFromId,
    id
  );
  if (result.changes === 0) return null;
  return getDocument(id);
}

export function deleteDocument(id: number): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync('UPDATE documents SET renewed_from_id = NULL WHERE renewed_from_id = ?', id);
    const result = db.runSync('DELETE FROM documents WHERE id = ?', id);
    if (result.changes === 0) throw new Error('Document not found.');
  });
}

type MechanicVisitRow = {
  id: number;
  vehicle_id: number;
  date: string;
  shop: string | null;
  work_done: string | null;
  parts: string | null;
  cost: number | null;
  odometer: number | null;
  receipt_uri: string | null;
};

const MECHANIC_COLUMNS = `id, vehicle_id, date, shop, work_done, parts, cost, odometer, receipt_uri`;

function toMechanicVisit(row: MechanicVisitRow): MechanicVisit {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    date: row.date,
    shop: row.shop,
    workDone: row.work_done,
    parts: row.parts,
    cost: row.cost,
    odometer: row.odometer,
    receiptUri: row.receipt_uri,
  };
}

export function listMechanicVisits(vehicleId: number): MechanicVisit[] {
  const rows = getDatabase().getAllSync<MechanicVisitRow>(
    `SELECT ${MECHANIC_COLUMNS} FROM mechanic_visits
     WHERE vehicle_id = ?
     ORDER BY date DESC, id DESC`,
    vehicleId
  );
  return rows.map(toMechanicVisit);
}

export function getMechanicVisit(id: number): MechanicVisit | null {
  const row = getDatabase().getFirstSync<MechanicVisitRow>(
    `SELECT ${MECHANIC_COLUMNS} FROM mechanic_visits WHERE id = ?`,
    id
  );
  return row === null || row === undefined ? null : toMechanicVisit(row);
}

export function getLastMechanicVisit(vehicleId: number): MechanicVisit | null {
  const row = getDatabase().getFirstSync<MechanicVisitRow>(
    `SELECT ${MECHANIC_COLUMNS} FROM mechanic_visits
     WHERE vehicle_id = ?
     ORDER BY date DESC, id DESC
     LIMIT 1`,
    vehicleId
  );
  return row === null || row === undefined ? null : toMechanicVisit(row);
}

export function insertMechanicVisit(vehicleId: number, input: NewMechanicVisit): MechanicVisit {
  const result = getDatabase().runSync(
    `INSERT INTO mechanic_visits
     (vehicle_id, date, shop, work_done, parts, cost, odometer, receipt_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    vehicleId,
    input.date,
    input.shop,
    input.workDone,
    input.parts,
    input.cost,
    input.odometer,
    input.receiptUri
  );
  const created = getMechanicVisit(Number(result.lastInsertRowId));
  if (created === null) throw new Error('Could not read the mechanic visit after saving it.');
  return created;
}

export function updateMechanicVisit(
  id: number,
  vehicleId: number,
  input: NewMechanicVisit
): MechanicVisit | null {
  const result = getDatabase().runSync(
    `UPDATE mechanic_visits
     SET date = ?, shop = ?, work_done = ?, parts = ?, cost = ?, odometer = ?, receipt_uri = ?
     WHERE id = ? AND vehicle_id = ?`,
    input.date,
    input.shop,
    input.workDone,
    input.parts,
    input.cost,
    input.odometer,
    input.receiptUri,
    id,
    vehicleId
  );
  if (result.changes === 0) return null;
  return getMechanicVisit(id);
}

export function deleteMechanicVisit(id: number, vehicleId: number): void {
  const visit = getMechanicVisit(id);
  if (visit === null || visit.vehicleId !== vehicleId) throw new Error('Mechanic visit not found.');

  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync('UPDATE maintenance_logs SET visit_id = NULL WHERE visit_id = ?', id);
    const result = db.runSync('DELETE FROM mechanic_visits WHERE id = ?', id);
    if (result.changes === 0) throw new Error('Mechanic visit not found.');
  });
}

export function listMaintenanceLogsForVisit(visitId: number, vehicleId: number): MaintenanceLog[] {
  const rows = getDatabase().getAllSync<MaintenanceRow>(
    `SELECT ${MAINTENANCE_COLUMNS} FROM maintenance_logs
     WHERE visit_id = ? AND vehicle_id = ?
     ORDER BY date DESC, id DESC`,
    visitId,
    vehicleId
  );
  return rows.map(toMaintenanceLog);
}

export function listUnlinkedMaintenanceLogs(vehicleId: number): MaintenanceLog[] {
  const rows = getDatabase().getAllSync<MaintenanceRow>(
    `SELECT ${MAINTENANCE_COLUMNS} FROM maintenance_logs
     WHERE vehicle_id = ? AND visit_id IS NULL
     ORDER BY date DESC, id DESC`,
    vehicleId
  );
  return rows.map(toMaintenanceLog);
}

export function linkMaintenanceLogToVisit(
  logId: number,
  visitId: number,
  vehicleId: number
): void {
  const log = getMaintenanceLog(logId);
  const visit = getMechanicVisit(visitId);
  if (log === null || visit === null || log.vehicleId !== vehicleId || visit.vehicleId !== vehicleId) {
    throw new Error('The service and visit must belong to this vehicle.');
  }

  const result = getDatabase().runSync(
    'UPDATE maintenance_logs SET visit_id = ? WHERE id = ? AND vehicle_id = ?',
    visitId,
    logId,
    vehicleId
  );
  if (result.changes === 0) throw new Error('Could not link the service.');
}

export function unlinkMaintenanceLogFromVisit(
  logId: number,
  visitId: number,
  vehicleId: number
): void {
  const result = getDatabase().runSync(
    'UPDATE maintenance_logs SET visit_id = NULL WHERE id = ? AND visit_id = ? AND vehicle_id = ?',
    logId,
    visitId,
    vehicleId
  );
  if (result.changes === 0) throw new Error('Could not unlink the service.');
}

type TripRow = {
  id: number;
  vehicle_id: number | null;
  started_at: string;
  ended_at: string | null;
  distance_km: number | null;
};

const TRIP_COLUMNS = 'id, vehicle_id, started_at, ended_at, distance_km';

function toTrip(row: TripRow): Trip {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    distanceKm: row.distance_km,
  };
}

export function createTrip(vehicleId: number): Trip {
  const result = getDatabase().runSync(
    'INSERT INTO trips (vehicle_id, started_at) VALUES (?, ?)',
    vehicleId,
    new Date().toISOString()
  );
  const trip = getTrip(Number(result.lastInsertRowId));
  if (trip === null) throw new Error('Could not read the trip after saving it.');
  return trip;
}

export function getTrip(id: number): Trip | null {
  const row = getDatabase().getFirstSync<TripRow>(
    `SELECT ${TRIP_COLUMNS} FROM trips WHERE id = ?`,
    id
  );
  return row === null || row === undefined ? null : toTrip(row);
}

export function getActiveTrip(vehicleId: number): Trip | null {
  const row = getDatabase().getFirstSync<TripRow>(
    `SELECT ${TRIP_COLUMNS} FROM trips
     WHERE vehicle_id = ? AND ended_at IS NULL
     ORDER BY id DESC LIMIT 1`,
    vehicleId
  );
  return row === null || row === undefined ? null : toTrip(row);
}

export function listTrips(vehicleId: number): Trip[] {
  const rows = getDatabase().getAllSync<TripRow>(
    `SELECT ${TRIP_COLUMNS} FROM trips
     WHERE vehicle_id = ? AND ended_at IS NOT NULL
     ORDER BY started_at DESC, id DESC`,
    vehicleId
  );
  return rows.map(toTrip);
}

type TripPointRow = {
  id: number;
  trip_id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export function insertTripPoint(tripId: number, point: NewTripPoint): void {
  getDatabase().runSync(
    'INSERT INTO trip_points (trip_id, timestamp, latitude, longitude, accuracy) VALUES (?, ?, ?, ?, ?)',
    tripId,
    point.timestamp,
    point.latitude,
    point.longitude,
    point.accuracy
  );
}

export function listTripPoints(tripId: number): TripPoint[] {
  const rows = getDatabase().getAllSync<TripPointRow>(
    `SELECT id, trip_id, timestamp, latitude, longitude, accuracy
     FROM trip_points WHERE trip_id = ? ORDER BY id ASC`,
    tripId
  );
  return rows.map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    timestamp: row.timestamp,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
  }));
}

export type TripPreviewRoute = { tripId: number; points: GeoPoint[] };

export function listTripPreviewRoutes(vehicleId: number, maxPoints = 60): TripPreviewRoute[] {
  const rows = getDatabase().getAllSync<{
    trip_id: number;
    latitude: number;
    longitude: number;
    accuracy: number | null;
  }>(
    `SELECT p.trip_id, p.latitude, p.longitude, p.accuracy
     FROM trip_points AS p
     JOIN trips AS t ON t.id = p.trip_id
     WHERE t.vehicle_id = ? AND t.ended_at IS NOT NULL
     ORDER BY p.trip_id ASC, p.id ASC`,
    vehicleId
  );

  const grouped = new Map<number, GeoPoint[]>();
  for (const row of rows) {
    const points = grouped.get(row.trip_id) ?? [];
    points.push({ latitude: row.latitude, longitude: row.longitude, accuracy: row.accuracy });
    grouped.set(row.trip_id, points);
  }

  return Array.from(grouped, ([tripId, points]) => {
    const step = Math.max(1, Math.ceil(points.length / maxPoints));
    const sampled = points.filter((_, index) => index % step === 0);
    const last = points[points.length - 1];
    if (last !== undefined && sampled[sampled.length - 1] !== last) sampled.push(last);
    return { tripId, points: sampled };
  });
}

export function finishTrip(id: number, endedAt: string, distanceKm: number): Trip | null {
  const result = getDatabase().runSync(
    'UPDATE trips SET ended_at = ?, distance_km = ? WHERE id = ? AND ended_at IS NULL',
    endedAt,
    distanceKm,
    id
  );
  if (result.changes === 0) return null;
  return getTrip(id);
}

export function deleteTrip(id: number): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM trip_points WHERE trip_id = ?', id);
    const result = db.runSync('DELETE FROM trips WHERE id = ?', id);
    if (result.changes === 0) throw new Error('Trip not found.');
  });
}

export function addTripDistanceToOdometer(vehicleId: number, distanceKm: number): Vehicle {
  const current = requireVehicle(vehicleId);
  return raiseOdometerTo(vehicleId, current.odometer + distanceKm);
}
