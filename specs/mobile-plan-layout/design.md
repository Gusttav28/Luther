# Design: Mobile Category Plan Layout

- Governing requirements: R1, R2, R3, R4, R5, R6, R7

## Goals

- Stacked mobile Plan matching owner references (R1–R5).
- Keep plan/category mutations and desktop layout intact (R1, R6, R7).

## Current system observations

- `app/(app)/plan/page.tsx` — year links, `BarChart` + `DonutChart`, `AddCategoryForm`, wide HTML table with `PlanCellInput` + `CategoryRowActions`.
- `app/(app)/plan/plan-forms.tsx` — create/rename/archive/delete category; plan cell save on blur/Enter.
- `lib/queries/plan.ts` — `getPlanMatrix` supplies rows, planned/actual, column/row/grand totals.
- Existing Recharts wrappers: `components/charts/bar-chart.tsx`, `donut-chart.tsx` (donut already supports `embedded`).

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/plan/page.tsx` | Split mobile vs desktop; pass matrix/chart props into mobile composition. | R1–R6 |
| `app/(app)/plan/plan-forms.tsx` | Optional compact styling for cell inputs / category actions on mobile; no semantic change. | R4, R5, R6 |
| `components/charts/bar-chart.tsx` | Optional `embedded`/`compact` prop if needed to nest in mobile card without double chrome. | R3 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `components/plan/mobile-plan.tsx` | Client mobile shell: year circles, Planned vs actual toggle, Monthly plan Grid/Monthly toggle, wires charts + matrix + monthly list. | R1–R6 |
| `components/plan/mobile-monthly-list.tsx` (optional split) | Monthly view list + month circles + month total. | R5 |

## Data and control flow

```
plan/page.tsx (server)
  getPlanMatrix(year)
  planBars, allocations, matrix
        │
        ├─► Desktop (hidden on mobile): existing page
        │
        └─► MobilePlan (md:hidden)
              year ←→ /plan?year=
              chartMode: trend | allocation   (useState)
              planMode: grid | monthly       (useState)
              monthIndex: 0..11              (useState)
                    │
                    ├ trend → BarChart(planBars)
                    ├ allocation → DonutChart(allocations, embedded)
                    ├ grid → scrollable matrix + PlanCellInput
                    └ monthly → month controls + rows + PlanCellInput(month)
              AddCategoryForm (compact)
```

### Visual notes

- Cards: ~20px radius, stacked with ~18px gaps.
- Segmented controls: muted track, white/active chip (match Expenses/Income mobile patterns).
- Grid: `overflow-x-auto` inside card; sticky category column if practical.
- Monthly rows: palette dot · name · input · actual; footer “Month total”.
- FAB/nav unchanged by this work.

## Validation and failure handling

- Plan cell validation remains in `setPlanCellAction`.
- Toggle state is ephemeral; no persistence required.
- Empty chart/matrix states reuse existing messages.

## Security, privacy, accessibility, and performance

- Auth unchanged.
- Toggles expose selected state (`aria-pressed` / tab semantics).
- Year/month icon buttons have accessible names.
- No new dependencies; avoid loading unused chart mode heavy work beyond existing components.

## Dependencies

- **No new npm dependencies.**

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Only CSS-tighten existing table | Rejected | Owner requires Trend/Allocation and Grid/Monthly IA |
| Drop Allocation on mobile | Rejected | Present in reference toggle |
| New chart library | Rejected | Out of scope / deps |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | page split + MobilePlan |
| R2 | circular year controls |
| R3 | Trend/Allocation card |
| R4 | Grid matrix |
| R5 | Monthly list |
| R6 | compact AddCategoryForm / row actions |
| R7 | no new deps; auth unchanged |
