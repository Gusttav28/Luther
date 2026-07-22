# Review: Analytics screens, responsive navigation, and dark mode

- Work item: `analytics-screens-and-dark-mode`
- Branch: `feature/analytics-screens-and-dark-mode`
- Approved spec: `specs/analytics-screens-and-dark-mode/` (human-approved 2026-07-20)
- Implementer progress: `progress/current.md` handoff **IMPLEMENTED**
- Review start: 2026-07-20
- Final verdict: **CHANGES_REQUESTED**

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`
- `specs/analytics-screens-and-dark-mode/{requirements,design,tasks}.md`
- `progress/current.md`
- `app/(app)/{income,balance,plan,projects,savings}/**`
- `components/{charts,nav.tsx,theme-toggle.tsx}`
- `app/globals.css`, `tailwind.config.ts`
- `lib/{money,validation}.ts`, `lib/queries/{balance,plan,projects,savings,settings}.ts`
- `prisma/schema.prisma` and the new migration
- relevant unit and e2e tests

The implementation is currently in the working tree on the requested branch; `HEAD` remains the dashboard-redesign commit and the analytics changes are uncommitted.

## Commands run

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS — 6 files, 58 tests |
| `npm run build` | PASS — Next production build compiled, typechecked, collected page data, and generated all routes |
| `npm run test:e2e` | BLOCKED/FAIL — 4 tests timed out at 60s with `page.goto` `net::ERR_ABORTED; maybe frame was detached?` against `http://localhost:3100`; 2 tests were skipped. This is a dev-server/browser environment failure before assertions, not an application assertion failure. |
| `git diff --check` | PASS |

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Income alignment | PASS | `app/(app)/income/income-forms.tsx:18-59` uses one responsive `grid-cols-1 sm:grid-cols-4` with the same `field-label`/`field-input` wrappers for Period, Amount, Currency, and Label. |
| R2 — Plan analytics | PARTIAL | `app/(app)/plan/page.tsx:27-46` derives monthly planned values from `columnTotals`, actuals from row actuals, and allocation segments from `rowTotal`; charts precede the matrix and use “planned allocation” wording. Missing-rate handling collapses allocation data to an empty chart and reports “No planned allocations” rather than an explicit unavailable state. |
| R3 — Savings analytics | PASS | `app/(app)/savings/page.tsx:20-50` aggregates dated signed rows, separates positive contributions from negative withdrawals, uses configured conversion, and does not infer categories from notes. Missing rates produce an explicit unavailable message. |
| R4 — Balance analytics | PARTIAL | `app/(app)/balance/page.tsx:16-21,46-66` maps `getBalanceSeries` rows directly to running-balance and income/expense charts before the table. The shared empty message does not distinguish missing-rate/unavailable values from an empty series. |
| R5 — Projects analytics/grid | PASS | `app/(app)/projects/page.tsx:23-35` adds status/funding visuals; `:55-74` uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` and preserves project card actions/data. |
| R6 — Analytics-first responsive structure | PASS | Charts precede the detailed matrix/history/table/card sections on all requested pages; chart shells use bounded responsive containers and pages use `min-w-0`/overflow containment where needed. Full viewport interaction evidence is unavailable because e2e could not reach the local server. |
| R7 — Theme persistence/readability | PASS with test limitation | `components/theme-toggle.tsx:6-42` validates to `light`/`dark`, toggles the root class, persists only `luther-theme`, and catches storage failures. Semantic chart CSS variables and dark surfaces are present. Browser persistence/contrast interaction was not independently exercised because e2e was blocked. |
| R8 — Mobile navigation/More | PASS with test limitation | `components/nav.tsx:45-94` filters the bottom bar to `/`, `/expenses`, `/plan`, exposes the five remaining routes through `More`, and provides `aria-expanded`/`aria-controls` plus close-on-selection behavior. Browser keyboard/viewport interaction was not independently exercised because e2e was blocked. |
| R9 — CRC/USD and financial semantics | **FAIL** | The working diff changes `lib/money.ts`, `lib/validation.ts`, settings/actions, forms, queries, and `prisma/schema.prisma` to remove MXN and alter accepted currencies/conversion behavior. This is a financial-semantics/schema change, not an analytics-only change. |
| R10 — Privacy/scope | **FAIL** | Theme storage itself is bounded to one theme value, and inspected queries remain user-scoped, but the diff includes a schema migration and unrelated expense/domain changes. The approved scope explicitly requires no schema/auth/business-rule changes. |

## Design verdicts

- Chart placement and the requested Plan/Savings/Balance/Projects data mappings are implemented.
- The Plan composition is honestly labeled as planned allocation rather than investment.
- Savings charts do not invent category data and preserve signed withdrawal direction.
- Project cards use the specified 1/2/3 responsive breakpoints.
- Theme storage is limited to `luther-theme` with a light fallback.
- The design boundary is violated by unrelated domain/schema changes: `prisma/schema.prisma` removes `mxnToCrcRate`, changes currency comments/enums, renames `Expense.note` to `Expense.name`, and adds `prisma/migrations/20260720220000_expense_name_crc_usd/migration.sql`.

## Task/checkpoint verdicts

- T1, T2, T3, T4, T5, T6, T7, T8, and T9: implementation evidence present, subject to the missing-rate messaging and unverified browser interaction limitations above.
- T10: **FAIL**. `package.json` dependency versions are unchanged, but the schema and money boundaries are changed and MXN is removed.
- TV1: PASS.
- TV2: PASS.
- TV3: PASS.
- TV4: PASS.
- TV5: BLOCKED by local dev-server/browser navigation failures, not proven by a passing run.
- TV6: NOT VERIFIED in browser; static responsive classes were inspected.
- TV7: PARTIAL; code paths were inspected, but representative browser/fixture edge-case checks were not independently executed.
- TV8: PARTIAL; storage code inspection passed, but reload/unavailable-storage browser checks were not independently executed.

## Findings

### blocker — Out-of-scope schema and money-semantics migration

- Requirement/design/task: R9, R10; design “No Prisma schema migration”; T10.
- File: `prisma/schema.prisma`, `prisma/migrations/20260720220000_expense_name_crc_usd/migration.sql`, `lib/money.ts`, `lib/validation.ts`, `app/(app)/settings/actions.ts`.
- Lines: `prisma/migrations/20260720220000_expense_name_crc_usd/migration.sql:1-5`; `prisma/schema.prisma:31-37,42-50,87-95,102-108,142-148`; `lib/money.ts:8-25`.
- Observed: The implementation drops `Settings.mxnToCrcRate`, removes MXN from currency sets, changes entry currencies to CRC/USD, changes the Expense field from `note` to `name`, and alters validation/actions accordingly.
- Expected: Analytics/layout/theme work must preserve existing schema, auth, currency choices/conversion rules, and financial semantics. No migration is approved for this work item.
- Evidence: `git diff -- prisma/schema.prisma lib/money.ts lib/validation.ts app/(app)/settings/actions.ts`; migration SQL explicitly drops the MXN rate column and renames the expense column.
- Required correction: Revert the schema migration and all unrelated domain/money/validation/action changes. Keep only the approved analytics, layout, navigation, theme, and necessary chart changes; preserve the existing CRC/USD behavior and existing financial model boundary exactly as specified.

### medium — Missing-rate chart states are not consistently explicit

- Requirement/design/task: R2, R4, R6; design validation/failure handling.
- File: `app/(app)/plan/page.tsx`, `app/(app)/balance/page.tsx`, `components/charts/{bar-chart,line-chart}.tsx`.
- Lines: `app/(app)/plan/page.tsx:38-46,75-82`; `app/(app)/balance/page.tsx:47-64`; shared chart empty-state branches at `components/charts/bar-chart.tsx:27-35` and `components/charts/line-chart.tsx:27-35`.
- Observed: Plan turns any unavailable allocation row into `allocations=[]` and renders the generic “No planned allocations” message; Plan and Balance pass generic empty messages even when nullable conversion data caused the chart to have no numeric points.
- Expected: Missing conversion rates should say that values are unavailable until rates are set, rather than resembling an empty dataset.
- Required correction: Carry an explicit unavailable state from the query-derived data into each affected chart, or provide an equivalent message that distinguishes empty from unavailable without converting nulls to zero.

## Cleanup signal

- Durable spec package: `specs/analytics-screens-and-dark-mode/`
- Durable progress evidence: `progress/current.md` (handoff exists, but its “no schema/currency changes” claim conflicts with the current diff)
- Durable review report: `reviews/analytics-screens-and-dark-mode/review.md`
- Scratch context to reset: none

CHANGES_REQUESTED -> reviews/analytics-screens-and-dark-mode/review.md
