# ROADMAP.md: Odo

Build order for the MVP. Work on one phase at a time; don't start the next until the current one runs without errors.

## Phase 0: Foundation
- [x] Expo project, file-based routing, TypeScript strict mode.
- [x] Theme tokens (`theme.ts`, `useTheme()`) and core UI components (StatCard, ProgressBar, StatusChip, Button, Input, ListRow, EmptyState).
- [x] Database open and numbered migrations.

**Done when:** The app opens in Expo Go with working theme switching, the migration runner, and shared UI components available.

## Phase 1: Vehicle setup and dashboard shell
- [x] Add/edit vehicle with odometer; switch the active vehicle.
- [x] Dashboard layout with the odometer hero card and stat card grid placeholders.
- [x] Four-step onboarding (Bike, Engine, Intervals, Alerts) with no vehicle created until Finish.
- [x] Migration 6 vehicle setup columns and legacy-user handling.

**Done when:** A vehicle can be created through the four-step flow or loaded from legacy data, and the Dashboard handles loading, empty, and error states.

## Phase 2: Fuel log and km/L
- [x] Fuel log entries and full-tank toggle.
- [x] km/L calculated only between full-tank fill-ups; fuel charts and monthly spend card.

**Done when:** Fill-ups can be logged and edited, km/L is correct across full tanks, and the Dashboard reflects the latest data.

## Phase 3: Maintenance log and reminders
- [x] Maintenance entries with next due by km, by date, or both.
- [x] Km-based status checked on app open and odometer update; date-based local notifications.
- [x] Upcoming / History filter on the Maintenance tab.

**Done when:** Due and overdue services are visible on open and after odometer changes, and date-based reminders fire without duplicate pending notifications.

## Phase 3.5: Documents and registration reminders
- [x] `documents` table as the next numbered migration, with queries, hooks, and the pure date-only status function.
- [x] Documents screen in the Maintenance segmented control (Upcoming / History / Documents) with ListRow, StatusChip, and the Dashboard "Next expiring document" card.
- [x] Add/Edit Document form and "Mark as renewed" bottom sheet; photos copied into the app's private document directory.
- [x] Local reminders at 30, 14, 7, and 1 day before expiry plus the expiry day; cancel and reschedule on edit, renewal, or delete; skip expired and superseded records.

**Done when:** Documents can be added, edited, renewed, and deleted; status recomputes on app open with reminders rescheduled correctly and no photos included in exports by default.

## Phase 3.6: PMS checklist and settings redesign
- [x] `pms_items`, preferences, and `maintenance_logs.pms_item_id` in migration 6.
- [x] Editable `pmsTemplates.ts` defaults; saved `pms_items` are the runtime source of truth.
- [x] Shared Edit PMS Item sheet used by onboarding, Settings, and Maintenance.
- [x] Settings screen behind the Dashboard gear with motorcycle, PMS, reminders, units/currency, appearance, data, and privacy sections.
- [x] PMS-driven Dashboard gauge and Upcoming list with legacy fallback and dismissible setup banner.
- [x] Maintenance redesign: health banner, 240° gauge, component checklist, Documents tab, FAB, and real-data-only detail.
- [x] PMS date reminders rescheduled on interval, enabled, or last-done changes.

**Done when:** All six transmission/cooling combinations build the right checklist, saved intervals survive template/transmission changes, and reminders/status stay correct after edits.

## Phase 4: Mechanic visits
- [x] Visit list and detail with shop, work done, cost, and linked maintenance records.
- [x] Receipt photos copied into the app's document directory.

**Done when:** Visits and their receipts are stored locally, visible in the list and detail screens, and excluded from exports by default.

## Phase 5: GPS trips
- [x] Foreground Start/Stop tracking, distance/time sampling, and Haversine distance.
- [x] Trip history and detail map with polyline.
- [ ] Expo Go ride test: believable route and distance with the screen on.

**Done when:** A trip can be recorded in Expo Go with an accurate distance, and history and detail screens render without a development build.

## Phase 6: Export, settings, polish
- [x] Settings sections, preferences, appearance sync, and disabled Export placeholder.
- [ ] Data export with an explicit opt-in for photos and a final accessibility pass.

**Done when:** All data is exportable, document and receipt photos are opt-in only, and the app passes lint, type check, and Expo Go review.

## Later
- [ ] Background GPS tracking (requires a development build).
- [ ] Multiple vehicles.
- [ ] Charts.
- [ ] Widget.
- [ ] Cloud backup.

**Done when:** Each item is revisited after the MVP ships and is approved as a separate feature with its own requirements and design updates.
