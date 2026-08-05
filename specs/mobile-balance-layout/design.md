# Design: Mobile Balance Layout

- Governing requirements: R1, R2, R3, R4, R5

## Goals

- Mobile Balance IA matching the owner mock (R1–R4).
- Preserve balance math and desktop layout (R1, R5).

## Current system observations

- `app/(app)/balance/page.tsx` — two summary cards (starting → Settings link; current), `LineChart` + `BarChart`, HTML table of periods.
- `lib/queries/balance.ts` — `getBalanceSeries` supplies starting/current and per-period income/expenses/net/runningBalance.
- `components/charts/bar-chart.tsx` already supports `embedded`/`compact`; `line-chart.tsx` needs the same optional props for nesting.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/balance/page.tsx` | Split mobile vs desktop; pass series/chart props into mobile composition. | R1–R4 |
| `components/charts/line-chart.tsx` | Optional `embedded` / `compact` for nesting in mobile cards. | R3 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `components/balance/mobile-balance.tsx` | Client/server-friendly mobile stack: summary card, charts, expandable period list. | R1–R4 |

## Data and control flow

```
balance/page.tsx (server)
  getBalanceSeries → starting, current, rows
  chartRows mapping (unchanged)
        │
        ├─► Desktop (md+): existing page
        │
        └─► MobileBalance (md:hidden)
              Summary: Starting + Edit(/settings) | Current
              LineChart(runningBalance) embedded
              BarChart(income/expenses) embedded
              PeriodList (useState expandedIds)
                collapsed: label + runningBalance
                expanded: Income | Expenses | Net
```

### Visual notes

- Cards ~20px radius; stacked gaps ~18px.
- Summary 2-column grid; Current may use brand/negative color tokens.
- Period rows: alternating soft background optional; rounded 14px; expand via button/row with `aria-expanded`.
- No mock bottom nav reimplementation.

## Validation and failure handling

- No new forms on Balance for this item.
- Expand state is ephemeral.

## Security, privacy, accessibility, and performance

- Auth unchanged.
- Expand controls are buttons (or rows with keyboard activation) with accessible names.
- Do not ship the standalone HTML into the client bundle.
- No new dependencies.

## Dependencies

- **No new npm dependencies.**

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Inline edit starting balance on Balance | Rejected for this item | Would add mutation surface; Settings already owns it |
| Keep wide table only on mobile | Rejected | Owner wants expandable list |
| Custom SVG instead of Recharts | Rejected | Existing charts already correct |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | page split + MobileBalance |
| R2 | summary card + Settings Edit |
| R3 | stacked LineChart / BarChart |
| R4 | expandable period list |
| R5 | no new deps; auth unchanged |
