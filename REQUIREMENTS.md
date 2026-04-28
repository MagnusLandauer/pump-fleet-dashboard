# Pump Fleet Dashboard — Requirements & Task Breakdown

## Overview

A frontend-only dashboard for monitoring a fleet of oil & gas pumps. Uses fake but plausible telemetry data. Most pumps behave normally; at least one pump shows clearly degraded performance that can be *inferred* from the data (not just a hardcoded label).

**Stack (already scaffolded):** Vite 8 · React 19 · TypeScript · MUI 9 · TanStack Router + Query

**Constraints:** ~4 hours · static deploy (GitHub Pages) · >80% test coverage · no backend

---

## Data Model

### Pump

| Field | Type | Notes |
|---|---|---|
| id | string | e.g. `"pump-001"` |
| name | string | Human-readable label |
| location | string | Site / area name |
| model | string | Equipment model |
| installedDate | Date | |
| status | `"running" \| "stopped" \| "maintenance"` | Derived from telemetry, not hardcoded health |

### Telemetry (per pump, per timestamp)

| Signal | Unit | Typical range |
|---|---|---|
| rotationSpeed | RPM | 2800–3200 |
| inletPressure | bar | 1.5–3.0 |
| outletPressure | bar | 8.0–12.0 |
| flowRate | m³/h | 40–60 |
| vibration | mm/s | 1.0–4.0 |
| temperature | °C | 55–75 |

### Alert

| Field | Type |
|---|---|
| id | string |
| pumpId | string |
| timestamp | Date |
| severity | `"warning" \| "critical"` |
| signal | string — which telemetry signal triggered it |
| message | string |
| acknowledged | boolean |

### WorkOrder

| Field | Type |
|---|---|
| id | string |
| pumpId | string |
| title | string |
| description | string |
| type | `"corrective" \| "planned"` |
| status | `"open" \| "in_progress" \| "completed" \| "overdue"` |
| createdAt | Date |
| dueDate | Date |
| completedAt | Date \| null |

### MaintenanceSchedule

| Field | Type |
|---|---|
| pumpId | string |
| task | string (e.g. "Vibration inspection") |
| intervalDays | number |
| lastPerformed | Date \| null |
| nextDue | Date |

---

## Degraded Pump Behaviour

One pump (e.g. `pump-003`) should exhibit a **worn impeller / internal leak** pattern:

1. **Rotation speed stays normal** (~3000 RPM) — the motor is fine.
2. **Outlet pressure drops** progressively over the last ~48 h (12 → 8 bar).
3. **Flow rate drops** relative to speed (60 → 35 m³/h).
4. **Vibration increases** (2 → 6 mm/s) — mechanical imbalance.
5. **Temperature creeps up** (65 → 85 °C) — friction from wear.

This should be clearly visible on the time-series charts without any hardcoded "bad" label — the user should be able to *infer* degradation from the trends.

Normal pumps have gentle noise around their baselines with no drift.

---

## Synthetic Data Generation

All data is generated client-side, deterministically seeded so it's reproducible.

| Concern | Approach |
|---|---|
| Historical data | Generate on first load for the requested time window (3h / 24h / 7d / 31d). Resolution can decrease for longer windows (e.g. 1-min points for 3h, 15-min for 31d). |
| Live updates | A `setInterval` (every ~5 s) appends a new data point and shifts the window. |
| Normal pumps | Baseline + small Gaussian noise. |
| Degraded pump | Baseline + noise + a time-varying drift function (e.g. sigmoid ramp starting ~48 h ago). |
| Alerting | Rules-based: if signal crosses a threshold → create an Alert. Run on generation, not hardcoded. |

---

## Pages & Features

### 1. Fleet Overview (route: `/`)

- Card or table for each pump showing: name, location, latest key readings (flow, pressure, vibration), status indicator.
- Status indicator is **derived**: green if all signals in range, yellow if any warning-level alert, red if any critical alert.
- Clicking a pump navigates to its detail page.
- At-a-glance: count of total pumps, pumps with active alerts, overdue maintenance items.

### 2. Pump Detail (route: `/pump/:id`)

- **Header:** pump name, model, location, overall status badge.
- **Time-series charts** for all 6 telemetry signals.
  - Time window selector: 3h · 24h · 7d · 31d.
  - Charts update live (new point every ~5 s).
  - Threshold lines drawn on charts where alert rules apply.
- **Alerts panel:** list of alerts for this pump, sortable by time, filterable by severity. Ability to acknowledge.
- **Work Orders panel:** list of work orders for this pump, with status badges.
  - Overdue items highlighted.
  - Button: **"Create Work Order"** → opens a form/dialog.
- **Maintenance schedule panel:** shows planned tasks, next due date, and highlights any that are **overdue or missing**.

### 3. Create Work Order (dialog/modal)

- Fields: title, description, type (corrective / planned), due date.
- Pre-filled pumpId from context.
- On submit: adds to in-memory work order list and shows in the panel.

---

## Architecture

```
src/
├── domain/                  # Pure logic, no React — easy to test
│   ├── models/              # TypeScript types/interfaces
│   ├── generators/          # Telemetry data generation (seeded, deterministic)
│   ├── alerts/              # Rules engine: signal → alert
│   └── store.ts             # In-memory state (pumps, work orders, alerts)
├── hooks/                   # React hooks bridging domain → UI
│   ├── useTelemetry.ts      # Provides data for a pump + time window, handles live tick
│   ├── useAlerts.ts
│   └── useWorkOrders.ts
├── components/              # Reusable UI pieces
│   ├── PumpCard.tsx
│   ├── TelemetryChart.tsx
│   ├── AlertList.tsx
│   ├── WorkOrderList.tsx
│   ├── WorkOrderForm.tsx
│   ├── MaintenanceTable.tsx
│   └── TimeWindowSelector.tsx
├── routes/                  # TanStack Router file-based routes
│   ├── __root.tsx
│   ├── index.tsx            # Fleet overview
│   └── pump.$id.tsx         # Pump detail
└── main.tsx
```

Key principle: **domain logic is a pure TypeScript library with zero React imports**, making it trivially unit-testable. UI components are thin wrappers.

---

## Testing Strategy

Target: **>80% coverage** with both unit and integration tests.

| Layer | Tool | What to test |
|---|---|---|
| `domain/generators` | Vitest | Deterministic output for a given seed; degraded pump drift is measurably different from normal; correct data point count for each time window |
| `domain/alerts` | Vitest | Threshold crossing produces correct alert; no alert when in range; severity levels |
| `domain/store` | Vitest | CRUD for work orders; maintenance overdue logic; alert acknowledgement |
| Components | Vitest + React Testing Library | PumpCard renders status correctly; WorkOrderForm validates and submits; TimeWindowSelector calls callback |
| Integration | Vitest + RTL | Fleet overview shows alert badge when degraded pump exists; navigating to pump detail shows charts; creating a work order appears in list |

---

## Task Breakdown

Below are the implementation tasks in dependency order. Estimated times assume AI-assisted coding.

### Phase 1 — Domain Layer (~45 min)

| # | Task | Description | Est. |
|---|---|---|---|
| 1.1 | **Define data models** | Types/interfaces for Pump, Telemetry, Alert, WorkOrder, MaintenanceSchedule in `domain/models/`. | 10 min |
| 1.2 | **Build telemetry generator** | Seeded generator that produces time-series arrays for normal + degraded pumps. Support all 4 time windows. | 20 min |
| 1.3 | **Build alert rules engine** | Evaluate telemetry against thresholds, produce Alert objects. | 10 min |
| 1.4 | **Build in-memory store** | State container for pumps, alerts, work orders, maintenance schedule. Expose CRUD. | 5 min |

### Phase 2 — Core UI & Routing (~60 min)

| # | Task | Description | Est. |
|---|---|---|---|
| 2.1 | **Set up routing** | TanStack Router with `/` and `/pump/:id` routes, layout with app bar. | 10 min |
| 2.2 | **Fleet overview page** | Grid of PumpCards with derived status, summary stats bar, click-to-navigate. | 20 min |
| 2.3 | **Pump detail page — layout** | Header, tabbed or sectioned layout for charts / alerts / work orders / maintenance. | 15 min |
| 2.4 | **Time-series charts** | Charting component (recharts or similar) for each signal, time window selector, threshold lines. | 15 min |

### Phase 3 — Live Data & Interactions (~30 min)

| # | Task | Description | Est. |
|---|---|---|---|
| 3.1 | **Live telemetry tick** | `setInterval` that appends new data points every ~5 s and triggers re-render. | 10 min |
| 3.2 | **Alerts panel** | List with severity icons, timestamps, acknowledge action. | 10 min |
| 3.3 | **Work orders panel + form** | List with status badges, overdue highlighting. "Create Work Order" dialog with validation. | 10 min |

### Phase 4 — Maintenance & Polish (~30 min)

| # | Task | Description | Est. |
|---|---|---|---|
| 4.1 | **Maintenance schedule panel** | Table showing planned tasks, next due, overdue/missing highlighting. | 10 min |
| 4.2 | **Visual polish** | Consistent spacing, colour palette, responsive layout, loading states, empty states. | 15 min |
| 4.3 | **Seed data review** | Verify the degraded pump is clearly distinguishable on all chart views. Tune drift params if needed. | 5 min |

### Phase 5 — Testing (~45 min)

| # | Task | Description | Est. |
|---|---|---|---|
| 5.1 | **Set up Vitest + RTL** | Configure vitest, jsdom, React Testing Library, coverage reporter. | 5 min |
| 5.2 | **Unit tests — generators** | Test normal vs degraded output, time window point counts, determinism. | 15 min |
| 5.3 | **Unit tests — alerts & store** | Test threshold logic, CRUD operations, overdue calculations. | 10 min |
| 5.4 | **Integration tests** | Fleet overview rendering, pump detail navigation, work order creation flow. | 15 min |

### Phase 6 — Deploy & Docs (~10 min)

| # | Task | Description | Est. |
|---|---|---|---|
| 6.1 | **GitHub Pages deploy** | Vite config for base path, GitHub Actions workflow for build + deploy. | 5 min |
| 6.2 | **README** | Setup instructions, design choices, data generation explanation, tradeoffs, AI usage notes. | 5 min |

---

## Charting Library Decision

**Recommendation: recharts** — already widely used with React, lightweight, supports line/area charts with custom reference lines (for thresholds), and plays well with MUI theming. Add via `npm install recharts`.

Alternative: if more control is needed, use `@nivo/line` or raw d3 — but recharts is likely sufficient and faster to implement.

---

## Acceptance Criteria

1. Fleet overview clearly surfaces the problematic pump without hardcoded labels.
2. Pump detail charts show all 6 signals with selectable time windows (3h, 24h, 7d, 31d).
3. Charts update live every ~5 seconds.
4. Degraded pump's charts show visually obvious drift / anomalies.
5. Alerts are generated from rules, not hardcoded.
6. Work orders list shows per-pump, with overdue items highlighted.
7. User can create a new work order from the pump detail page.
8. Missing/overdue planned maintenance is clearly indicated.
9. Test coverage >80%.
10. App deploys to GitHub Pages as a static site.
11. `npm install && npm run dev` works out of the box.
