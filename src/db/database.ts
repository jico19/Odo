import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'odo.db';

let database: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (database === null) {
    throw new Error('Database is not initialized. Call initializeDatabase() first.');
  }
  return database;
}

// Each entry is a numbered migration. Index 0 is migration 1. Never edit an
// existing entry — append a new one so upgrades keep working on installed apps.
const MIGRATIONS: readonly string[] = [
  // Migration 1: initial schema.
  `
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    plate TEXT,
    odometer REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    liters REAL NOT NULL,
    price_per_liter REAL,
    total_cost REAL,
    odometer REAL,
    full_tank INTEGER DEFAULT 1,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    odometer REAL,
    cost REAL,
    notes TEXT,
    next_due_km REAL,
    next_due_date TEXT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS mechanic_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    shop TEXT,
    work_done TEXT,
    cost REAL,
    odometer REAL,
    receipt_uri TEXT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    distance_km REAL
  );

  CREATE TABLE IF NOT EXISTS trip_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id)
  );
  `,

  // Migration 2: track services done by the owner rather than a shop.
  `ALTER TABLE maintenance_logs ADD COLUMN diy INTEGER NOT NULL DEFAULT 0;`,

  // Migration 3: documents and registration expiry reminders.
  `
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    type TEXT NOT NULL,
    name TEXT,
    issue_date TEXT,
    expiry_date TEXT NOT NULL,
    cost REAL,
    notes TEXT,
    photo_uri TEXT,
    renewed_from_id INTEGER,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (renewed_from_id) REFERENCES documents(id)
  );
  `,

  // Migration 4: parts used at a visit and links from services to that visit.
  `
  ALTER TABLE mechanic_visits ADD COLUMN parts TEXT;
  ALTER TABLE maintenance_logs ADD COLUMN visit_id INTEGER;
  `,

  // Migration 5: GPS accuracy for trip points, recorded for every fix.
  `
  ALTER TABLE trip_points ADD COLUMN accuracy REAL;
  CREATE INDEX IF NOT EXISTS idx_trip_points_trip_id ON trip_points(trip_id);
  `,
];

export async function initializeDatabase(): Promise<void> {
  // On web, wa-sqlite runs in a worker that loads asynchronously. Awaiting a
  // single async open guarantees the synchronous API used everywhere else works.
  await SQLite.openDatabaseAsync(DATABASE_NAME);

  const db = SQLite.openDatabaseSync(DATABASE_NAME);
  database = db;

  // These pragmas must be set outside a transaction to take effect.
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');

  const versionRow = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  for (let index = currentVersion; index < MIGRATIONS.length; index++) {
    db.withTransactionSync(() => {
      db.execSync(MIGRATIONS[index]);
      db.execSync(`PRAGMA user_version = ${index + 1};`);
    });
  }

  if (__DEV__) {
    const tables = db.getAllSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    );
    console.log('[db] path:', db.databasePath, 'tables:', tables.map((row) => row.name));
  }
}

let initialization: Promise<void> | null = null;

export function ensureDatabase(): Promise<void> {
  if (initialization === null) {
    initialization = initializeDatabase().catch((error: unknown) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}
