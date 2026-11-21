# AGENTS.md: Odo

Odo is a personal, offline-first mobile app for tracking motorcycle/vehicle maintenance, fuel, mechanic visits, and GPS trips. Single user, no backend, no accounts. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (this repo is currently on SDK 58 — still verify before use).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Tech Stack (do not change without asking)

- React Native + **Expo** (managed workflow), tested in **Expo Go**
- **TypeScript** (strict mode — `strict: true` in `tsconfig.json`)
- **Expo Router** (file-based routing in `src/app/`)
- **expo-sqlite** for all persistent data (sync API: `openDatabaseSync`)
- `expo-location`, `expo-task-manager`, `expo-notifications`, `expo-image-picker`, `react-native-maps`
- No Redux or other global state libraries. Use React state, Context, and custom hooks.
- Prefer recommended Expo modules over third-party libraries; check available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project Structure

```
src/
  app/            # Screens and layouts (Expo Router)
    (tabs)/       # dashboard, fuel, maintenance, mechanic, trips
    onboarding.tsx, settings.tsx
  components/     # Reusable UI components, incl. documents/, onboarding/, pms/, settings/
  db/             # database.ts (open + migrations), queries.ts (all SQL)
  hooks/          # Data hooks (useFuelLogs, useTrips, usePmsItems, usePreferences, ...)
  utils/          # Pure functions (calculations, PMS status, document status, formatters, haversine, app-files)
  types/          # Shared TypeScript types
  constants/      # Shared theme (theme.ts) and editable PMS defaults (pmsTemplates.ts)
assets/           # Images, fonts, icons
```

Import with the `@/` alias (`./src/*`) rather than deep relative paths. Keep non-route code outside `src/app/`.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present). This repo currently uses npm (`package-lock.json`), so use `npx`.

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Do NOT run `eas build`, `eas submit`, `eas update`, or deploy anything unless I ask.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators.
- The five bottom tabs stay as-is. Settings is a modal/pushed screen at `/settings`, opened from the Dashboard header gear — never add a Settings tab.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Data Rules

- All SQL lives in `src/db/queries.ts`. Screens and components never write SQL.
- Always use **parameterized queries** (`?` placeholders). Never build SQL with string concatenation.
- Schema changes go through a numbered migration in `src/db/database.ts`. Never edit existing tables destructively.
- Dates are stored as ISO 8601 strings. Money as numbers in the base currency unit. Distances in km, fuel in liters (convert only at display time).
- `documents.expiry_date` is stored as an ISO 8601 date string (YYYY-MM-DD), entered manually exactly as shown on the document.
- Tables: `vehicles`, `fuel_logs`, `maintenance_logs`, `mechanic_visits`, `trips`, `trip_points`, `documents`, `pms_items`, `preferences`.

### Documents schema (migration 3)

Applied as migration 3 in `src/db/database.ts` (after migration 1's initial schema and migration 2's `diy` column). Future changes append a new numbered migration; never edit or remove existing migrations.

```sql
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
```

`vehicle_id` is nullable because a driver's license belongs to the person, not the vehicle. `renewed_from_id` links a renewal to the record it replaces, which stays in history.

### Mechanic visits schema (migration 4)

`mechanic_visits` came from migration 1; migration 4 adds `parts TEXT` and `maintenance_logs.visit_id INTEGER`. Links are enforced in `src/db/queries.ts` (same-vehicle check) because SQLite cannot add a foreign key to an existing table via `ALTER TABLE`.

### PMS, onboarding and preferences schema (migration 6)

Migration 6 adds `vehicles.transmission_type` (nullable), `vehicles.is_liquid_cooled`, `vehicles.onboarding_completed`, `maintenance_logs.pms_item_id`, and these tables:

```sql
CREATE TABLE IF NOT EXISTS pms_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  interval_km REAL,
  interval_days INTEGER,
  default_interval_km REAL,
  default_interval_days INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1,
  is_custom INTEGER NOT NULL DEFAULT 0,
  last_done_odometer REAL,
  last_done_date TEXT,
  started_odometer REAL,
  started_date TEXT,
  UNIQUE (vehicle_id, type),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Existing bikes are marked `onboarding_completed = 1` but get no PMS items. Transmission stays NULL so the dismissible Dashboard banner can offer setup.

## Domain Rules

- Fuel efficiency (km/L) is calculated only between **full-tank** fill-ups.
- Maintenance has "next due" by km, by date, or both. Overdue is when current odometer or today's date passes it.
- Document status is date-only: `ok`, `due soon` (expiry within 30 days), or `expired`. No odometer involved. Recompute it every time the app opens and show it in the UI even if a notification was missed. Enter the expiry date manually, exactly as shown on the document; never auto-calculate it.
- Document reminders are local notifications at 30, 14, 7, and 1 day before expiry, plus one on the expiry day. Cancel and reschedule them on edit, renewal, or delete. Never schedule reminders for already-expired or superseded (`renewed_from_id`) records — iOS keeps only about 64 pending local notifications.
- "Mark as renewed" asks for the new expiry date, creates a new record linked by `renewed_from_id`, and keeps the old one in history. Document photos live in the app's private document directory and are excluded from exports unless the user opts in.
- Mechanic visits can link maintenance services through `maintenance_logs.visit_id`. Both records must belong to the same vehicle; deleting a visit unlinks its services instead of deleting them. Receipt photos live in the app's private document directory and are excluded from exports by default.
- Onboarding has four steps (Bike, Engine, Intervals, Alerts). Keep all draft state in `useOnboarding`; create no vehicle until Finish. Closing mid-flow leaves no partial vehicle. Notification permission is requested on Finish, and denial is not an error.
- Canonical transmission values are only `automatic`, `manual`, and `semi_automatic`. The UI label for `automatic` is "Automatic (including CVT)"; do not add a `CVT` value.
- Saved `pms_items` are the source of truth for every status, gauge, and due date. `src/constants/pmsTemplates.ts` is editable default data and may be read only by reset/add-template flows (onboarding setup, Settings reset/re-enable, transmission diff). Never read a template to compute current status.
- PMS status is date/odometer based: due when either interval is reached. An item with both editable intervals is due when either one is reached. Unknown last-done values fall back to the setup odometer/date. Disabled items are hidden from Upcoming and get no reminders.
- Saving a maintenance log linked to a PMS item updates that item's `last_done_*` values. Any interval, enabled, or last-done change must recompute status, refresh Dashboard/Maintenance screens, and cancel/reschedule that item's date-based local notifications.
- Changing transmission/cooling in Settings may offer add/re-enable/disable checklist changes, but only after confirmation. It never rewrites saved intervals or service history.
- Preferences are display-only: distance unit, currency, appearance, reminder lead time, and the dismissed setup banner flag. Data stays stored in km/L and the base currency.
- PMS reminders default to 1 day before the due date and on the due date; options are 1, 3, or 7 days. Use IDs `pms-${itemId}-${offset}` with offsets `[1,3,7,0]`. Skip expired and disabled items to conserve the limited local notification slots.
- GPS trips: manual Start/Stop. Sample by distance or time interval to save battery. Distance is computed with the Haversine formula over consecutive points.
- Location data stays on the device. Never send it anywhere or add analytics or network calls.

## Expo Go Constraints

- Code must run in Expo Go. Do not add libraries that need custom native code or a dev build without asking first.
- Background location tracking does not work reliably in Expo Go. Build foreground tracking first and flag any feature that would need a development build (e.g. `expo-task-manager` background tracking).
- Remote push notifications are out of scope. Local notifications only.
- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development` (only when asked).

## Building with EAS

EAS is the approved path when a build/sign/submit/update is explicitly requested: `eas build`, `eas submit`, `eas update` — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples. Docs: https://docs.expo.dev/eas/index.md

## Code Style

- For any UI work, read and follow DESIGN.md.
- When creating or changing UI, follow the design principles in `DESIGN.md`. If something isn't covered there, stay consistent with it and ask before inventing new patterns.
- Functional components and hooks only. No class components.
- Prioritize readability and maintainability over complexity.
- Give each function one task/responsibility; split it if it does more.
- Explicit types for props and function returns. No `any`; use `unknown` and narrow.
- Keep components small. Extract logic into hooks and `src/utils/`.
- Use `StyleSheet.create`. Keep a shared theme in `src/constants/theme.ts` (colors, spacing).
- Handle loading, empty, and error states on every screen.
- Validate form input (required fields, positive numbers) before saving.
- Keep calculations in pure functions in `src/utils/calculations.ts` and PMS status/interval helpers in `src/utils/pms.ts` so they are easy to test.

## Workflow

- Follow the build order: vehicle setup → fuel log → maintenance log → documents and registration reminders → mechanic visits → GPS trips → export/settings.
- Work on one feature at a time. Don't start the next until the current one runs without errors.
- Before making large changes or adding a dependency, explain the plan briefly and wait for my OK.
- After changes, run the type check and lint (`npx tsc --noEmit` and `npx expo lint`) and fix errors before reporting done.
- Don't refactor unrelated files, rename things, or reformat code outside the task.
- If something is ambiguous (units, UX, data model), ask one concise question instead of guessing.
- Prefer simple solutions over clever ones. This is a personal MVP, not an enterprise app.

## Don't

- Don't add a backend, authentication, or cloud sync.
- Don't use `localStorage`/web APIs. This is React Native.
- Don't hardcode API keys. If one is needed (e.g., Google Maps), put it in `app.json` extra or env and tell me.
- Don't delete or overwrite user data in migrations.
- Don't auto-calculate registration expiry dates.
- Don't include document photos in exports by default.
- Don't commit unless I ask.
