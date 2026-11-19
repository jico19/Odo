# DESIGN.md: Odo

Design spec for the Odo app. Follow this when building or changing any UI. If something isn't covered here, stay consistent with the principles below and ask before inventing new patterns.

## Design Direction
- **Look:** modern dark dashboard — a clean grid of stat cards, big numbers, thin status bars, and focused data charts. No decorative dials, arcs, or speedometer styling.
- **Theme:** follows the system setting (dark and light). Dark is the primary, hero design; light is a clean counterpart.
- **Accent:** green.
- **Feel:** precise, calm, technical. Numbers are the stars. Minimal decoration.

## Principles
1. **Glanceable first.** The dashboard answers "what do I need to know right now?" in under 3 seconds.
2. **Numbers are big, labels are small.** Values use large tabular numerals; labels are small and muted.
3. **Color means something.** Green = healthy/primary action, amber = due soon, red = overdue. Never use these colors decoratively.
4. **One primary action per screen.**
5. **Fast entry.** Logging fuel or maintenance should take under 15 seconds.
6. **Charts for data, bars for status.** Use line, bar, and pie charts for real datasets. Show status with a thin progress bar plus a text value or chip. Never use gauges, dials, or speedometer arcs.

## Color Tokens
Define once in `src/constants/theme.ts` and read via the `useTheme()` hook in `src/hooks/use-theme.ts` (which uses `useColorScheme()`). Never hardcode hex values in components.

| Token | Dark | Light |
|---|---|---|
| `background` | `#0B0F0D` | `#F4F7F5` |
| `surface` | `#131A16` | `#FFFFFF` |
| `surfaceAlt` | `#1B2420` | `#EAF0EC` |
| `border` | `#26322C` | `#D5DFD9` |
| `text` | `#E8F1EC` | `#0F1A14` |
| `textMuted` | `#8FA398` | `#5B6E63` |
| `accent` | `#22C55E` | `#16A34A` |
| `accentSoft` | `#22C55E26` | `#16A34A1F` |
| `onAccent` | `#04130A` | `#FFFFFF` |
| `warning` | `#F59E0B` | `#D97706` |
| `danger` | `#EF4444` | `#DC2626` |

Rules:
- Text on `background` and `surface` must meet WCAG AA contrast (4.5:1).
- Progress bar tracks use `surfaceAlt`; fills use `accent`, `warning`, or `danger` based on status.
- Avoid pure black and pure white backgrounds.

## Typography
- Use the system font (San Francisco / Roboto) to keep Expo Go simple.
- **Always** use tabular numerals for numbers: `fontVariant: ['tabular-nums']`.

| Style | Size | Weight | Use |
|---|---|---|---|
| `display` | 40 | 700 | Odometer, hero numbers |
| `title` | 22 | 600 | Screen titles |
| `heading` | 17 | 600 | Card titles |
| `body` | 15 | 400 | General text |
| `label` | 12 | 500 | Muted captions, uppercase with letter spacing 0.6 |
| `mono` | 15 | 500 | Inline values (km, L, cost) |

## Spacing, Radius, Elevation
- Spacing scale: 4, 8, 12, 16, 24, 32. No other values.
- Screen horizontal padding: 16. Grid gap between cards: 12.
- Card radius: 16. Button radius: 12. Chip/pill radius: 999.
- Dark mode: no shadows; separate layers with `surface` color and a 1px `border`.
- Light mode: very soft shadow (opacity 0.06) plus a 1px `border`.

## Core Components

### Stat Card
- Surface card: 16 radius, 16 padding, 1px `border`.
- Top: small uppercase `label`. Middle: `display`-size value with a small unit.
- Optional bottom row: a status chip and/or a progress bar.
- Laid out in a two-column grid on phones. The odometer is a full-width hero card with an "Update" ghost button.
- No decorative icons inside stat cards. Keep the number dominant.
- If the whole card is tappable, keep the target at least 44x44.

### Progress Bar
- Thin 4 px track in `surfaceAlt`, pill radius 999, with a status-colored fill: `accent` when healthy, `warning` when under 20% remaining or near a limit, `danger` when overdue or over budget.
- Always paired with a text value or status chip — color is never the only signal.
- Only use one where a real target exists: service interval, budget. Don't invent a max for values without one (e.g. km/L). Show those numbers on their own or as a chart over time.
- Animate the fill width on change, 200-300 ms ease-out. Respect reduced-motion settings.

### Chart
- Use a **line chart** for trends over time: km/L by fill-up, monthly distance.
- Use a **bar chart** for comparisons across periods: spend by month, liters by month.
- Use a **pie or donut chart** only for real composition: cost split by category. Do not invent categories.
- Charts live inside a surface card with a small uppercase label and a text value nearby.
- Use theme colors, tabular numerals, and short axis labels. No gradients, 3D, or decorative effects.
- Do not turn a single value into a chart. Show the number on its own until there is a dataset.
- Every chart needs an `accessibilityLabel` that states what it shows. Add a text summary or accessible table for key values.

### Status Chip
- Pill with a soft background and matching text: `OK` (accent), `DUE SOON` (warning), `OVERDUE` (danger).
- Documents use the same chip with the danger tone labeled `EXPIRED`; the label text changes, not the token.

### Buttons
- **Primary:** `accent` fill, `onAccent` text, 48 px height.
- **Secondary:** `surfaceAlt` fill, `text` color.
- **Ghost:** transparent, `accent` text.
- One primary button per screen. Minimum touch target 44x44.

### Inputs
- `surfaceAlt` background, 1px `border`, 12 radius, 48 px height. Focus: border becomes `accent`.
- Numeric fields use the numeric keypad. Show the unit inside the field (km, L, ₱).
- Show validation errors under the field in `danger`.

### List Row
- Icon in an `accentSoft` circle, a title and subtitle on the left, and the value and date aligned right. A 1px divider is used instead of heavy cards for long lists.

### Floating Action Button
- Bottom-right on list screens, `accent` fill, a plus icon, and a 56 px diameter. Opens a quick-add sheet.

## Navigation
- **Bottom tabs (5):** Dashboard, Fuel, Maintenance, Mechanic, Trips.
- Header: simple title, with the vehicle name (tap to switch vehicle) on the Dashboard.
- Add and edit forms open as bottom sheets or modal screens, not full navigation pushes.
- Use Ionicons outline icons. One icon family only.

## Screens

### Dashboard
1. Vehicle header (name, plate).
2. **Odometer** full-width hero card with large number and an "Update" ghost button.
3. Stat card grid: fuel efficiency (km/L) with a recent-trend line chart, next service due (with progress bar + chip), monthly fuel spend (with progress bar vs. budget), next expiring document (days remaining; `warning` when due soon, `danger` when expired).
4. "Upcoming maintenance" list with status chips.
5. Last fuel-up and last trip summary cards.
6. Quick-add row: Fuel, Maintenance, Start Trip.

### Fuel
- Top: average km/L stat card with a km/L line chart by fill-up, plus a monthly spend card with a spend-by-month bar chart.
- Below: chronological log list. FAB to add an entry.
- Add form: date, liters, price per liter (total auto-calculated), odometer, full-tank toggle.

### Maintenance
- Segmented control: Upcoming / History / Documents.
- Upcoming rows show a progress bar to the next due km or date with a status chip.
- Add form: type (chips), date, odometer, cost, notes, next due km/date.

### Documents
- Reached from the Maintenance tab via the Documents segment of the segmented control. Not a separate bottom tab.
- Rows use ListRow: icon in the accent circle, document type and name/number on the left, expiry date and days remaining on the right, plus a StatusChip. Reuse the existing `ListRow`, `StatusChip`, and Ionicons outline set; no new colors or fonts.
- Status is date-only: OK, DUE SOON (within 30 days), EXPIRED (danger tone). Recomputed on app open and shown in the UI even if a notification was missed.
- Add/Edit Document form opens as a bottom sheet or modal screen: type chips (Registration (OR/CR), Driver's License, Insurance, Other), optional name/number and issue date, required expiry date entered manually from the document, optional renewal cost in a numeric field with the currency symbol inside the field (₱), notes, and an optional photo.
- Photos are attached from the device and copied into the app's private document directory; they are excluded from exports unless the user opts in.
- "Mark as renewed" opens a bottom sheet that asks for the new expiry date, creates a new record linked by `renewed_from_id`, and keeps the old record in History. Reminders are cancelled and rescheduled on edit, renewal, or delete.

### Mechanic
- List of visits with shop, work done, cost, and a receipt thumbnail.
- Detail screen shows the full receipt and linked maintenance records.

### Trips
- Big Start/Stop control at the top (accent when idle, `danger` while recording, with a live timer and distance).
- History list with a mini route preview, distance, and duration.
- Trip detail: full map with polyline in `accent`, plus stats.
- Map uses a dark style in dark mode.

## States
- **Loading:** skeleton blocks in `surfaceAlt`, not spinners, for lists and cards.
- **Empty:** icon, one short sentence, and one clear action ("Log your first fill-up"). For Documents: "Add your registration to get renewal reminders" with a single Add document action.
- **Error:** inline message with a retry action. Never fail silently.

## Motion
- Keep it subtle: 200-300 ms, ease-out. Animate progress bar fills, chart reveals, sheet presentation, and chip changes only.
- Respect the system "reduce motion" setting.

## Accessibility
- Minimum touch target 44x44.
- Support dynamic font sizes. Do not clip numbers.
- Color is never the only status indicator; chips and text values carry the status too.
- Add `accessibilityLabel` to icon-only buttons, progress bars, and charts (e.g., "Fuel efficiency 32 kilometers per liter").

## Implementation Notes
- Theme tokens live in `src/constants/theme.ts`; read them through `useTheme()` in `src/hooks/use-theme.ts`.
- Shared UI lives in `src/components/ui/` (StatCard, ProgressBar, StatusChip, Button, Input, ListRow, EmptyState).
- Everything must work in Expo Go: no custom native modules for UI.
- Charts use `react-native-gifted-charts` with `react-native-svg`. Both run in Expo Go; install with `npx expo install react-native-gifted-charts react-native-svg`.
- Don't introduce a UI kit or component library without asking.
