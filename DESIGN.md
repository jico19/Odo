# DESIGN.md: Odo

Design spec for the Odo app. Follow this when building or changing any UI. If something isn't covered here, stay consistent with the principles below and ask before inventing new patterns.

## Design Direction
- **Look:** dark dashboard, like a vehicle instrument cluster. Gauges, big numbers, glanceable status.
- **Theme:** follows the system setting (dark and light). Dark is the primary, hero design; light is a clean counterpart.
- **Accent:** green.
- **Feel:** precise, calm, technical. Numbers are the stars. Minimal decoration.

## Principles
1. **Glanceable first.** The dashboard answers "what do I need to know right now?" in under 3 seconds.
2. **Numbers are big, labels are small.** Values use large tabular numerals; labels are small and muted.
3. **Color means something.** Green = healthy/primary action, amber = due soon, red = overdue. Never use these colors decoratively.
4. **One primary action per screen.**
5. **Fast entry.** Logging fuel or maintenance should take under 15 seconds.

## Color Tokens
Define once in `theme/colors.ts` and read via a `useTheme()` hook that uses `useColorScheme()`. Never hardcode hex values in components.

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
- Gauge tracks use `surfaceAlt`; gauge fill uses `accent`, `warning`, or `danger` based on status.
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
- Screen horizontal padding: 16.
- Card radius: 16. Button radius: 12. Chip/pill radius: 999.
- Dark mode: no shadows; separate layers with `surface` color and a 1px `border`.
- Light mode: very soft shadow (opacity 0.06) plus a 1px `border`.

## Core Components

### Gauge (signature element)
- Built with `react-native-svg` (works in Expo Go).
- 240° arc with a `surfaceAlt` track and colored fill. The center shows a large value with a small unit below.
- Used for: **fuel efficiency (km/L)**, **service-due progress** (km remaining), and **monthly fuel spend vs. budget**.
- Fill color: `accent` when healthy, `warning` when under 20% remaining, `danger` when overdue.
- Animate the fill on mount (300-500 ms, ease-out). Respect reduced-motion settings.

### Stat Card
- Surface card with a `label` on top, a `display`-size value, and an optional small trend or unit line.

### Status Chip
- Pill with a soft background and matching text: `OK` (accent), `DUE SOON` (warning), `OVERDUE` (danger).

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
- Use Ionicons or Lucide-style outline icons. One icon family only.

## Safe Area & Notch Handling
- Use `react-native-safe-area-context` for all notch, status-bar, and home-indicator
  handling. Never hardcode top or bottom padding to clear the notch.
- **Screens:** wrap the screen in `SafeAreaView` with explicit `edges` (usually
  `['top']`) and set `backgroundColor: theme.background` on it.
- **Bottom sheets and modals:** use `SafeAreaView edges={['bottom']}` inside the
  sheet only, so the sheet's own background fills the inset.
- **Positioned elements** (FAB, floating controls, absolutely-positioned headers):
  read `useSafeAreaInsets()` and add the inset manually instead of wrapping in
  `SafeAreaView`.
- **Tab bar:** the bottom inset is already handled by the navigator. Do not pad
  for it a second time.
- `edges={[]}` is allowed on containers where a parent already applies the inset
  (e.g. nested detail views) — avoid double insets.

## Screens

### Dashboard
1. Vehicle header (name, plate).
2. **Odometer** hero card with large number and an "Update" ghost button.
3. Gauge row: fuel efficiency and next service due.
4. "Upcoming maintenance" list with status chips.
5. Last fuel-up and last trip summary cards.
6. Quick-add row: Fuel, Maintenance, Start Trip.

### Fuel
- Top: average km/L gauge and monthly spend stat cards.
- Below: chronological log list. FAB to add an entry.
- Add form: date, liters, price per liter (total auto-calculated), odometer, full-tank toggle.

### Maintenance
- Segmented filter: Upcoming / History.
- Upcoming rows show a progress bar to the next due km or date with a status chip.
- Add form: type (chips), date, odometer, cost, notes, next due km/date.

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
- **Empty:** icon, one short sentence, and one clear action ("Log your first fill-up").
- **Error:** inline message with a retry action. Never fail silently.

## Motion
- Keep it subtle: 200-300 ms, ease-out. Animate gauges, sheet presentation, and chip changes only.
- Respect the system "reduce motion" setting.

## Accessibility
- Minimum touch target 44x44.
- Support dynamic font sizes. Do not clip numbers.
- Color is never the only status indicator; chips also carry text.
- Add `accessibilityLabel` to icon-only buttons and gauges (e.g., "Fuel efficiency 32 kilometers per liter").

## Implementation Notes
- Theme lives in `theme/` (`colors.ts`, `typography.ts`, `spacing.ts`, `useTheme.ts`).
- Shared UI in `components/ui/` (Gauge, StatCard, StatusChip, Button, Input, ListRow, EmptyState).
- Everything must work in Expo Go: no custom native modules for UI. Use `react-native-svg` and `react-native-reanimated` only if already available in the Expo SDK.
- Don't introduce a UI kit or component library without asking.