# Tasks: Horizontal Lifetime Savings and Balance Layout

## Implementation checklist

- [ ] T1 — Replace the Savings narrow page shell with a wide bounded container and define the responsive top composition.
  - Files: `app/(app)/savings/page.tsx`
  - Requirements: R1, R2, R5, R7
  - Preconditions: Human approval of this specification; existing Savings query and chart props remain authoritative.
  - Expected evidence: Lifetime metrics, rate note, charts, and recording form occupy intentional horizontal regions on desktop/tablet and stack in readable order on mobile; History remains below.

- [ ] T2 — Replace the Balance narrow page shell with a wide bounded container and define the responsive top composition.
  - Files: `app/(app)/balance/page.tsx`
  - Requirements: R1, R3, R5, R7
  - Preconditions: Human approval of this specification; `getBalanceSeries` remains unchanged.
  - Expected evidence: Balance metrics, rate note, and both charts form a horizontal desktop/tablet composition; the detailed half-month table remains below and readable on mobile.

- [ ] T3 — Verify existing chart and shared CSS surfaces in the wider grids and make only presentation-safe adjustments if necessary.
  - Files: `components/charts/bar-chart.tsx`, `components/charts/line-chart.tsx`, `components/charts/donut-chart.tsx`, `app/globals.css` only if required.
  - Requirements: R2, R3, R5, R6, R7
  - Preconditions: T1 and T2 expose any real sizing, shrinking, focus, or readable-state issue.
  - Expected evidence: Existing chart props, Recharts usage, `ResponsiveContainer`, labels, legends, tooltips, empty/unavailable messages, and semantic regions remain stable; no financial data behavior changes.

- [ ] T4 — Confirm Savings recording, editing, deletion, history, and Balance detail behavior are preserved.
  - Files: `app/(app)/savings/page.tsx`, `app/(app)/savings/savings-forms.tsx` for inspection only unless a layout-only fix is required, `app/(app)/balance/page.tsx`.
  - Requirements: R4, R7
  - Preconditions: T1 and T2 are implemented.
  - Expected evidence: Existing form fields/actions, validation, pending states, edit/delete controls, settings link, table columns, row order, and detail values remain available and usable at every breakpoint.

- [ ] T5 — Verify currency, rates, empty states, and financial scope boundaries.
  - Files: Final implementation diff; `lib/money.ts`, query/action/schema/auth files must remain unchanged.
  - Requirements: R6, R8
  - Preconditions: T1–T4 complete.
  - Expected evidence: CRC/USD behavior, reporting-currency formatting, signed savings semantics, missing-rate unavailable messaging, authenticated query scope, and no browser financial persistence are unchanged; no new dependency or unrelated work appears.

## Verification

- [ ] TV1 — Run `npm run lint`.
  - Covers: R1–R8 and changed route/shared presentation files.
  - Expected result: No new lint errors.

- [ ] TV2 — Run `npm run typecheck`.
  - Covers: Route composition, chart props, form/table composition, and unchanged data contracts.
  - Expected result: TypeScript completes successfully.

- [ ] TV3 — Run `npm run test`.
  - Covers: Existing money, query, action, and financial behavior.
  - Expected result: Existing test suite passes without financial-semantic changes.

- [ ] TV4 — Run `npm run build`.
  - Covers: Server/client boundaries, Tailwind/CSS compilation, route rendering, and Recharts integration.
  - Expected result: Production build succeeds.

- [ ] TV5 — Smoke-test Savings and Balance at 375px mobile, tablet, and wide desktop widths.
  - Covers: R1, R2, R3, R5, R7.
  - Expected result: Desktop uses wide columns, tablet uses two columns where legible, mobile uses one column, no page-level horizontal overflow occurs, and all controls/details remain reachable.

- [ ] TV6 — Exercise empty, mixed-currency, negative-savings, and missing-rate states.
  - Covers: R2, R3, R6.
  - Expected result: Existing explicit empty/unavailable messages appear; no values are fabricated, silently zeroed, or displayed in a new currency.

- [ ] TV7 — Keyboard and semantic accessibility inspection.
  - Covers: R4, R5, R7.
  - Expected result: Headings, chart labels, form labels/errors, focus states, action buttons, and Balance table headers/row labels remain perceivable and operable.

- [ ] TV8 — Review final diff and changed-file list against scope.
  - Covers: R4, R6, R8.
  - Expected result: Only approved presentation/layout files changed; no schema, auth, query/action, dependency, storage, unrelated analytics, expense-domain, Excel-validation, secret, or personal-financial-data change is present.

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R2, R5, R7 |
| T2 | R1, R3, R5, R7 |
| T3 | R2, R3, R5, R6, R7 |
| T4 | R4, R7 |
| T5 | R6, R8 |
| TV1–TV4 | R1–R8 as applicable |
| TV5 | R1, R2, R3, R5, R7 |
| TV6 | R2, R3, R6 |
| TV7 | R4, R5, R7 |
| TV8 | R4, R6, R8 |

## Final scope check

- [ ] Every requirement maps to at least one implementation task and verification check.
- [ ] Every changed file is listed in the design.
- [ ] Existing Savings and Balance behavior, forms, history, tables, and financial semantics remain unchanged.
- [ ] No unrelated analytics or earlier expense-domain work is included.
- [ ] No schema, auth, currency, conversion, dependency, browser-storage, secret, or personal-financial-data change is included.
- [ ] Excel workbook validation is recorded as unrelated pending work, not implemented here.
- [ ] Human owner approval is recorded before the Implementer begins.
