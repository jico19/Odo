---
name: Cockpit Instrument Telemetry
colors:
  surface: '#101412'
  surface-dim: '#101412'
  surface-bright: '#363a38'
  surface-container-lowest: '#0b0f0d'
  surface-container-low: '#181c1a'
  surface-container: '#1c201e'
  surface-container-high: '#272b28'
  surface-container-highest: '#323633'
  on-surface: '#e0e3df'
  on-surface-variant: '#bccbb9'
  inverse-surface: '#e0e3df'
  inverse-on-surface: '#2d312f'
  outline: '#869585'
  outline-variant: '#3d4a3d'
  surface-tint: '#4ae176'
  primary: '#4be277'
  on-primary: '#003915'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#006e2f'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#ffb4ae'
  on-tertiary: '#68000a'
  tertiary-container: '#ff8a83'
  on-tertiary-container: '#860011'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#101412'
  on-background: '#e0e3df'
  surface-variant: '#323633'
typography:
  display-num-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-num-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  display-num-md:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-caps-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.1em
  unit-inline:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a calm, ultra-legible, instrument-cluster interface built specifically for motorcycle owners operating in varied lighting conditions and high-vibration contexts. Inspired by precision avionics and performance motorcycle LCD/TFT gauges, the interface prioritizes glanceable metrics, zero-latency feedback, and uncompromising contrast.

### Core Philosophy
- **Instrument-Grade Clarity**: Visual decoration is stripped away. Hierarchy is established exclusively through scale, optical weight, surface luminosity steps, and precise border delineations.
- **Glanceable Telemetry**: Riders absorb state in sub-second glances. Primary data points (kilometers, fuel volumes, currency) command immediate focus via dense tabular numerals, while operational contexts retreat into muted, uppercase technical sub-labels.
- **Offline-First Resilience**: Persistent visual indicators emphasize hardware connectivity, local caching status, and sensor sync without cluttering the operational display.

## Colors

The palette relies on a deep obsidian foundation calibrated to reduce eye strain during nighttime riding and maintain razor-sharp contrast under direct sunlight.

### Color Roles & Application
- **Canvas Base (`#0B0F0D`)**: Deep charcoal-black background representing the unlit backing of an electronic instrument cluster.
- **Surface Layer 1 (`#131A16`)**: Base fill for panels, telemetry tiles, and navigation bars.
- **Surface Layer 2 & Tracks (`#1B2420`)**: Recessed gauge arcs, progress backgrounds, and interactive hover states.
- **Stroke / Border (`#26322C`)**: Structural 1px boundary applied to all cards, dividers, and modal boundaries to replace drop shadows with crisp physical edges.
- **Primary Telemetry Accent (`#22C55E`)**: Electric tachometer green reserved for active status signals, gauge active sweeps, confirmed sync states, and primary actions. Text resting on green elements must use `#04130A`.
- **Warning State (`#F59E0B`)**: Amber caution indicator for preventative service due soon, low reserve warnings, and degraded telemetry inputs.
- **Critical Alert (`#EF4444`)**: Signal red strictly reserved for overdue maintenance, sensor faults, critical fluid thresholds, or critical error logs.
- **Text Layers**: Primary information renders in `#E8F1EC` for near-white luminescence; secondary labels, units, and structural metadata render in `#8FA398`.

## Typography

Typography functions as an analytical readout. Numerical precision requires proportional control and monospace stabilization to prevent interface twitching during real-time updates.

### Type Pairings & Behavioral Rules
- **Numerical Telemetry (`Space Grotesk`)**: All primary metrics (odometer reads, trip meters, speed, total liters, currency tallies) enforce tabular numerals (`tnum`) to eliminate lateral layout shift during rapid odometer increments.
- **Instrument Labels & Metadata (`JetBrains Mono`)**: Micro-labels, unit callouts (`km`, `L`, `₱`), and technical states are set in monospaced uppercase with open letter spacing (`0.08em` to `0.1em`). This enforces immediate visual separation from generic text copy.
- **Interface Copy & Data Tables (`Inter`)**: System descriptions, maintenance instruction steps, logs, and dialogs are set in clean, neutral geometric sans for effortless scan-ability.

## Layout & Spacing

The spatial architecture is grounded in a rigid 8px grid (0.5rem increments), ensuring that touch targets remain thumb-accessible even when operating with gloved hands.

### Grid & Responsiveness
- **Canvas Margins**: Compact mobile layouts enforce an edge-to-edge instrument feel with a strict `1rem` (16px) margin. Tablet and cockpit mounts expand this margin to `2rem` (32px).
- **Column Grids**:
  - Mobile (up to 768px): 4-column fluid layout with `1rem` gutters. Metric cards span 2 columns (duo-meter) or full 4 columns (primary gauge / master odometer).
  - Tablet & Desktop (769px+): 12-column layout with `1.5rem` gutters, facilitating telemetry dashboards alongside historical maintenance feeds.
- **Rhythm & Touch Density**: Input gaps, tile matrices, and status groups adhere strictly to `space-sm` (8px), `space-md` (16px), or `space-lg` (24px). Interactive elements preserve a minimum hitbox of 48x48px.

## Elevation & Depth

This design system deliberately eschews blurred drop shadows, ambient glow falloffs, and skeuomorphic gradients. The physical illusion of elevation is achieved purely through **monochromatic surface layering** and **high-definition 1px boundary vectors**.

### Elevation Stack
- **Level 0 (Chassis Ground - `#0B0F0D`)**: Main view background, under-screen canvas.
- **Level 1 (Card & Module Shells - `#131A16`)**: Data modules, list groups, map overlays, and telemetry tiles. Delineated entirely by an inner or outer stroke: `1px solid #26322C`.
- **Level 2 (In-Card Troughs & Gauge Tracks - `#1B2420`)**: Inset progress tracks, pill backgrounds, tabular column headers, and secondary control targets.
- **Level 3 (Interactive Modals & Overlays - `#131A16`)**: Floating sheets and quick-entry action drawers. Bound by a prominent `1px solid #26322C` edge, separated from content behind by a dark matte overlay (`#0B0F0D` at 85% opacity).

## Shapes

The form language balances aerodynamic chassis curves with structural discipline. 

### Geometric Ratios
- **Telemetry & Gauge Modules**: Enforce a standardized `16px` border-radius (`rounded-lg` under Level 2 token rules), echoing the perimeter casing of modern multi-function motorcycle displays.
- **Action Elements**: Buttons, text input boundaries, and tap targets utilize a tighter `12px` radius.
- **Indicators & Badges**: System status chips, connection dots, and parameter tags implement full continuous radii (`rounded-full` / pill geometry) to instantly visually isolate discrete states from structural tiles.
- **Line Consistency**: Strokes across cards, separators, inputs, and gauge outlines maintain an invariant 1px stroke weight.

## Components

### Buttons
- **Primary**: Solid `#22C55E` fill with `#04130A` text, 12px border radius, font `JetBrains Mono` weight 600, uppercase with `0.05em` tracking. Minimum height 48px.
- **Secondary / Technical**: Background `#1B2420`, border `1px solid #26322C`, text `#E8F1EC`. Hover and pressed states lighten the background to `#26322C`.
- **Destructive**: Outline with `#EF4444` border, background transparent, text `#EF4444`. On active press, fill becomes `#EF4444` with `#04130A` text.

### Telemetry Cards
- **Base Style**: Fill `#131A16`, border `1px solid #26322C`, radius 16px, padding 16px.
- **Header**: Contains small uppercase label (`label-caps-sm`, color `#8FA398`) alongside a status pill or sensor icon.
- **Value Readout**: Prominent `display-num-lg` in `#E8F1EC`, paired with an inline uppercase unit suffix (`km`, `L`, `₱`) in `#8FA398`.

### Status Chips & Pills
- **Geometry**: Pill-shaped (`rounded-full`), height 24px, padding 0 10px.
- **Normal / Nominal**: Background `#131A16`, border `1px solid #26322C`, text `#8FA398`.
- **Attention / Due Soon**: Background `#1B2420`, border `1px solid #F59E0B`, text `#F59E0B`. Includes 6px solid amber leading dot.
- **Critical / Overdue**: Background `#1B2420`, border `1px solid #EF4444`, text `#EF4444`. Includes 6px blinking or solid red leading dot.

### Gauge & Telemetry Tracks
- **Track**: `#1B2420` solid arc or bar, height 8px or stroke 8px, border-radius 9999px.
- **Fill**: Solid `#22C55E` indicator, sharp circular tip, zero blur. Shifts dynamically to `#F59E0B` or `#EF4444` when exceeding parameter tolerances.

### Input Fields
- **Container**: Fill `#0B0F0D`, border `1px solid #26322C`, radius 12px, height 48px, horizontal padding 16px.
- **Typography**: Text `#E8F1EC` (`body-md`), placeholder text `#8FA398` at 50% opacity.
- **Focus**: Border shifts to `#22C55E` with zero outer ring shadows.

### Lists & Maintenance Rows
- **Item Container**: Border-bottom `1px solid #26322C`, padding `12px 0`.
- **Structure**: Metric/date in tabular font on the right edge, task title in `#E8F1EC` bold on the left, maintenance interval countdown below in `#8FA398`.