# Design: Horizontal Lifetime Savings and Balance Layout

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8

## Goals

- Replace the narrow route shells with wide analytics containers (R1).
- Make Savings and Balance feel like the existing wide Expenses/Plan analytics pages, with side-by-side top regions and detail below (R2, R3).
- Preserve all existing data flow, actions, currency semantics, and authenticated boundaries (R4, R6, R8).
- Keep the composition readable and operable from desktop through mobile (R5, R7).

## Current system observations

- `app/(app)/savings/page.tsx` and `app/(app)/balance/page.tsx` currently use `mx-auto max-w-3xl space-y-6`; both already render summary cards, charts, and detail after server-side queries.
- Savings derives monthly signed contribution/withdrawal series from `getSavings`, uses `MissingRateError` to make chart data unavailable, and renders `AddSavingsForm` followed by editable/deletable `SavingsListRow` history.
- Balance derives chart rows directly from `getBalanceSeries`, renders starting/current balance cards, and keeps the detailed half-month table as the exact record view.
- Existing `BarChart`, `LineChart`, and `DonutChart` use `ResponsiveContainer`, `min-w-0`, fixed chart heights, semantic section labels, and explicit empty messages.
- `app/globals.css` provides the shared `.card`, `.field-input`, `.page-title`, and `.section-title` presentation primitives; no new CSS framework or dependency is needed.
- Expenses uses `max-w-5xl`, Plan uses the app shell’s wider layout, and both establish the requested analytics-first visual direction.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/savings/page.tsx` | Replace the narrow page shell with a wide container and arrange summary cards, rate note, charts, and `AddSavingsForm` in responsive horizontal sections; retain existing data derivation and history order. | R1, R2, R4, R5, R6, R7 |
| `app/(app)/balance/page.tsx` | Replace the narrow page shell with a wide container and arrange balance metrics, rate note, and charts in responsive horizontal sections before the unchanged table. | R1, R3, R4, R5, R6, R7 |
| `app/globals.css` | Adjust only shared presentation utilities if the implementation needs a small layout/accessibility surface; preserve existing theme, chart, form, and focus semantics. | R1, R5, R7 |
| `components/charts/bar-chart.tsx` | Change only if required to preserve readable responsive chart behavior in the wider grid; keep props, data semantics, empty states, and Recharts dependency stable. | R2, R3, R5, R6, R7 |
| `components/charts/line-chart.tsx` | Change only if required to preserve readable responsive chart behavior in the wider grid; keep props, data semantics, empty states, and Recharts dependency stable. | R3, R5, R6, R7 |
| `components/charts/donut-chart.tsx` | Change only if required for responsive sizing/accessibility in the wider Savings grid; do not change segment meaning or unavailable-state behavior. | R2, R5, R6, R7 |

No schema, query, action, auth, currency, money-conversion, or dependency file is expected to change.

## New files

None.

## Data and control flow

### Shared page composition

1. Keep `requireUserId`, settings loading, and route query calls unchanged.
2. Keep the existing page-derived chart datasets unchanged; presentation work must not move conversion or financial aggregation into a new semantic layer.
3. Use a wide bounded root container, such as the app’s established `max-w-5xl`/`max-w-7xl` convention, with `space-y-6`.
4. Use explicit responsive grids: one column by default, two columns at tablet widths, and wider multi-column regions at desktop widths where the content supports them. Each grid child must allow shrinking (`min-w-0` where applicable).
5. Keep page title and rate note visible before or within the top analytics composition, and keep detail sections after the composition.

### Lifetime Savings

1. Preserve the existing lifetime balance and current-month summary values.
2. Keep the two summary cards together in a responsive metric grid.
3. Keep the existing trend `BarChart` and contribution/withdrawal `DonutChart` together in a responsive chart grid; retain the current series, colors, labels, currency prop, and unavailable message.
4. Place `AddSavingsForm` in the upper composition as a full-width or responsive grid item, preserving its existing fields, actions, validation, and CRC/USD options.
5. Keep the History section below the top composition and render the existing `SavingsListRow` controls without changing ordering or action contracts.

### Balance

1. Preserve starting balance, current balance, and the Settings link.
2. Keep the metrics together in a responsive grid.
3. Keep the running-balance `LineChart` and income-versus-expenses `BarChart` together in a responsive chart grid, using the same `chartRows`, series keys, labels, and reporting currency.
4. Keep the detailed half-month table below the charts, including its horizontal table scroll behavior at narrow widths and all existing columns/values.

## Validation and failure handling

- Verify `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` after implementation.
- If available, run the existing authenticated route/e2e checks; otherwise manually smoke-test the two routes and their existing actions.
- Inspect 375px mobile, tablet, and wide desktop widths for page overflow, grid collapse, chart legends/tooltips, form controls, focus states, and detail reachability.
- Exercise Savings with no rows, positive rows, negative withdrawals, mixed CRC/USD rows, and missing rates. Confirm existing explicit unavailable messaging and no fabricated zeroes.
- Exercise Balance with no series and representative half-month rows. Compare chart labels/values to the detailed table.
- Confirm the rendered currency remains the configured CRC/USD reporting currency and that `RatesNote` remains visible.
- Review the final diff to ensure no schema, auth, action, query, dependency, unrelated analytics, expense-domain, storage, or Excel-validation change is included.

## Security, privacy, accessibility, and performance

- Preserve `requireUserId()` and existing user-scoped query boundaries; do not add client persistence or expose financial payloads to browser storage.
- Preserve semantic headings, chart `aria-label` regions, form labels, table headers, row labels, visible focus styles, and text-based empty/unavailable messages.
- Do not make chart color the sole encoding; retain existing legends/text labels and the detailed Balance/Savings records as exact-value sources.
- Use bounded responsive chart containers and derive no additional queries; a layout-only change should not increase financial data access or introduce an expensive aggregation path.
- Ensure wide grids can shrink and mobile content remains readable without clipped controls or horizontal page overflow.

## Dependencies

No new dependency is approved or needed. Use existing Tailwind/CSS, Recharts chart components, route components, queries, actions, and app shell.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep `max-w-3xl` and enlarge only chart height | Reject | Does not solve the narrow browser composition or horizontal analytics goal. |
| Introduce a new dashboard/layout component | Defer | The requested behavior can be expressed with existing page/grid primitives; a shared abstraction would expand scope without a demonstrated need. |
| Change chart aggregation or query contracts | Reject | The request is presentation-only and current datasets already preserve financial semantics. |
| Add a new chart library or dependency | Reject | Existing Recharts components satisfy the composition and responsive requirements. |
| Move or redesign the Savings history/Balance table | Reject | Detailed records must remain below the composition with behavior and exact values preserved. |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | Wide root containers in both route files; shared layout primitives |
| R2 | Savings composition flow and `savings/page.tsx` grid sections |
| R3 | Balance composition flow and `balance/page.tsx` grid sections |
| R4 | Existing Savings form/history and Balance table retained unchanged |
| R5 | Shared responsive grid rules, `min-w-0`, ResponsiveContainer, and viewport validation |
| R6 | Existing query/conversion/chart props, explicit unavailable states, and scope review |
| R7 | Existing semantic chart/form/table surfaces, focus/contrast checks, and accessibility validation |
| R8 | Files-to-change boundary, no new files/dependencies, auth/privacy and final diff review |
