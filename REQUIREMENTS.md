# REQUIREMENTS.md: Odo

Odo is a personal, offline-first mobile app for tracking motorcycle/vehicle maintenance, fuel, mechanic visits, and GPS trips. Single user, no backend, no accounts. All data stays on the device.

## Functional requirements

### FR-1 Vehicle setup
- Add and edit a vehicle with name, plate, and odometer.
- Switch the active vehicle from the Dashboard header.

### FR-2 Fuel log
- Log fill-ups with date, liters, price per liter, odometer, and a full-tank toggle.
- Calculate km/L only between full-tank fill-ups.

### FR-3 Maintenance log and reminders
- Log services with type, date, odometer, cost, notes, and next due by km, by date, or both.
- Check km-based status on app open and on odometer update; send date-based local notifications.

### FR-4 Mechanic visits
- Record visits with shop, work done, cost, odometer, and a receipt photo.

### FR-5 GPS trips
- Start and stop trips manually; sample points by distance or time to save battery.
- Compute distance with the Haversine formula over consecutive points.

### FR-6 Export and settings
- Export user data and manage app preferences.

### FR-7 Dashboard
- Show the odometer, fuel efficiency, next service due, monthly fuel spend, next expiring document, and recent activity at a glance.

### FR-8 Documents
- **FR-8.1** Add, edit, and delete documents. Types: Registration (OR/CR), Driver's License, Insurance, Other. Fields: optional name/number, issue date, renewal cost, notes, photo, nullable `vehicle_id`, and required expiry date entered manually exactly as shown on the document.
- **FR-8.2** Show expiry status (`ok` / `due soon` / `expired`) from the expiry date only, with no odometer involved. Recompute status on every app open and display it in the UI even if a notification was missed.
- **FR-8.3** Send local reminders at 30, 14, 7, and 1 day before expiry and on the expiry day. Cancel and reschedule on edit, renewal, or delete. Never schedule reminders for already-expired or superseded records.
- **FR-8.4** Mark a document as renewed by providing the new expiry date; create a new record linked by `renewed_from_id` and keep the old record in history.
- **FR-8.5** Attach an optional document photo, stored in the app's private document directory.
- **FR-8.6** Show a "Next expiring document" card on the Dashboard with days remaining.

## Non-functional requirements
- Offline-first: no backend, accounts, analytics, or network calls; location data stays on the device.
- Local notifications only. Keep pending notifications few — iOS retains only about 64 — so skip expired and renewed records.
- Document photos are stored in the app's private document directory and excluded from exports unless the user opts in.
- Runs in Expo Go; no feature may require a development build without prior approval.
- TypeScript strict mode. Calculations and status rules live in pure, testable functions under `src/utils/`.
