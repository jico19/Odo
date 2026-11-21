# REQUIREMENTS.md: Odo

Odo is a personal, offline-first mobile app for tracking motorcycle/vehicle maintenance, fuel, mechanic visits, and GPS trips. Single user, no backend, no accounts. All data stays on the device.

## Functional requirements

### FR-1 Onboarding and vehicle setup
- **FR-1.1** On first launch, present four steps: Bike, Engine, Intervals, Alerts, with a progress indicator and Back on steps 2–4.
- **FR-1.2** Bike step collects name, optional plate, and starting odometer. Engine step collects transmission and liquid-cooled state.
- **FR-1.3** Canonical transmission values are `automatic` (labelled "Automatic (including CVT)"), `manual`, and `semi_automatic`.
- **FR-1.4** No vehicle row is created until Finish. Closing or navigating away mid-onboarding leaves no partial vehicle. Back preserves all entered state.
- **FR-1.5** Finish creates the vehicle, its saved PMS items, and marks `onboarding_completed = 1`, then requests local notification permission. Denial is graceful; dates still show in the app.
- **FR-1.6** Existing installs from earlier migrations are marked complete, get no auto-generated PMS items, and keep transmission unset until chosen in Settings.

### FR-2 Fuel log
- Log fill-ups with date, liters, price per liter, odometer, and a full-tank toggle.
- Calculate km/L only between full-tank fill-ups.

### FR-3 Maintenance log and reminders
- Log services with type, date, odometer, cost, notes, and next due by km, by date, or both.
- A log may be linked to one enabled PMS item ("Other" keeps the legacy form). Saving a linked log updates that item's last-done odometer/date.
- Check km-based status on app open and on odometer update; send date-based local notifications.
- Changing an item's interval, enabled state, or last-done values recomputes status and cancels/reschedules that item's date reminders.

### FR-4 Mechanic visits
- Record visits with shop, work done, cost, odometer, and a receipt photo.

### FR-5 GPS trips
- Start and stop trips manually; sample points by distance or time to save battery.
- Compute distance with the Haversine formula over consecutive points.

### FR-6 Settings and preferences
- Settings is opened from the Dashboard gear, never from a bottom tab.
- Sections: My motorcycle, PMS schedule, Reminders, Units and currency, Appearance, Data, About and privacy.
- My motorcycle edits name, plate, transmission, and cooling. Any checklist additions, re-enables, or disables require confirmation and never rewrite saved intervals or history.
- PMS schedule supports editing intervals, resetting one or all defaults, adding custom items, toggling enabled, and deleting custom items.
- Reminder lead time options are 1, 3, or 7 days before a dated PMS due date; a due-day reminder is always included.
- Units and currency are display-only. Stored values stay in km and liters; the default currency is PHP.
- Appearance options are System, Light, and Dark. Data shows a disabled "Export (coming soon)" row.

### FR-7 Dashboard
- Show the odometer, fuel efficiency, next PMS due, monthly fuel spend, next expiring document, and recent activity at a glance.
- Saved PMS items drive the next-service gauge and "Next service" list. Legacy maintenance dues are the fallback only when no PMS items exist.
- Show a dismissible setup banner when transmission is unset. Tapping it opens Settings > My motorcycle.

### FR-8 Documents
- **FR-8.1** Add, edit, and delete documents. Types: Registration (OR/CR), Driver's License, Insurance, Other. Fields: optional name/number, issue date, renewal cost, notes, photo, nullable `vehicle_id`, and required expiry date entered manually exactly as shown on the document.
- **FR-8.2** Show expiry status (`ok` / `due soon` / `expired`) from the expiry date only, with no odometer involved. Recompute status on every app open and display it in the UI even if a notification was missed.
- **FR-8.3** Send local reminders at 30, 14, 7, and 1 day before expiry and on the expiry day. Cancel and reschedule on edit, renewal, or delete. Never schedule reminders for already-expired or superseded records.
- **FR-8.4** Mark a document as renewed by providing the new expiry date; create a new record linked by `renewed_from_id` and keep the old record in history.
- **FR-8.5** Attach an optional document photo, stored in the app's private document directory.
- **FR-8.6** Show a "Next expiring document" card on the Dashboard with days remaining.

### FR-9 PMS checklist
- **FR-9.1** Saved `pms_items` are the source of truth for labels, intervals, enabled state, last-done values, status, and due dates. Templates are editable defaults used only by onboarding, reset, and add/transmission-diff flows.
- **FR-9.2** Status is `ok`, `due soon`, or `overdue` from remaining km and/or days. When both km and days are set, reaching either makes the item due. Unknown last-done values fall back to the setup odometer/date.
- **FR-9.3** The shared Edit PMS Item sheet validates a label and at least one interval, shows the saved default as a helper, supports optional last-done odometer/date, marks customized template items, and can reset them to default.
- **FR-9.4** Intervals are editable as km, weeks, months, or days. A saved value of 30 days displays as months only when evenly divisible by 30; 7-day multiples display as weeks.
- **FR-9.5** Default intervals: engine oil/oil filter 3,000 km or 180 days; gear oil 6,000 km/360 days (automatic); chain & sprocket 1,000 km/60 days (manual and semi-automatic); clutch adjustment 3,000 km/180 days (manual only); CVT belt/rollers/pulley 10,000 km/360 days (automatic); air filter 6,000 km/360 days; spark plug 8,000 km/360 days; brake pads/shoes 10,000 km/360 days; brake fluid 360 days only; tires 12,000 km/720 days; battery 180 days only; coolant 10,000 km/720 days for liquid-cooled engines.
- **FR-9.6** Maintenance Upcoming shows a health banner, a 240° next-PMS gauge, a component checklist with progress/status, and a row edit menu. Tabs are Upcoming / History / Documents only; static Rider Tip content is omitted.
- **FR-9.7** Disabled items are hidden from Upcoming and receive no local notifications.

## Non-functional requirements
- Offline-first: no backend, accounts, analytics, or network calls; location data stays on the device.
- Local notifications only. Keep pending notifications few — iOS retains only about 64 — so skip expired, superseded, and disabled records.
- Document and receipt photos are stored in the app's private document directory and excluded from exports unless the user opts in.
- Runs in Expo Go; no feature may require a development build without prior approval.
- TypeScript strict mode. Calculations and status rules live in pure, testable functions under `src/utils/`.
