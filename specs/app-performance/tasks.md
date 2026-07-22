# Tasks: App read-path performance

## Implementation checklist

- [ ] T1 — Skip materialize on Overview / Savings / Projects page reads
  - Files: `app/(app)/page.tsx`, `lib/queries/overview.ts`, `lib/queries/savings.ts`, `lib/queries/projects.ts`, callers of those page entrypoints
  - Requirements: R1
  - Preconditions: Spec approved; branch `feature/app-performance`
  - Expected evidence: Page loads pass `skipMaterialize: true` (or default flipped for read helpers)

- [ ] T2 — Materialize after waterfall-affecting mutations + keep Overview Refresh strong
  - Files: income/expenses/savings/projects/settings actions as applicable; `components/overview/overview-refresh.tsx`
  - Requirements: R2
  - Preconditions: T1
  - Expected evidence: Actions call `materializeMonthWaterfall` after successful writes; Refresh forces rematerialize

- [ ] T3 — Shared Overview snapshot; derive MoM, cashflow, category spend
  - Files: `app/(app)/page.tsx`, `lib/queries/overview.ts`, `lib/queries/overview-dashboard.ts`
  - Requirements: R3
  - Preconditions: T1
  - Expected evidence: No parallel duplicate expense/income `findMany` for the same month on Overview

- [ ] T4 — Aggregate / bound history queries
  - Files: `lib/queries/overview.ts`, `lib/queries/savings.ts`, `lib/queries/balance.ts`, `lib/queries/projects.ts`
  - Requirements: R4
  - Preconditions: T1
  - Expected evidence: Lifetime/project sums use aggregate/`groupBy`; Balance not hydrating every raw row solely to sum

- [ ] T5 — Unblock login; remove unused bootstrap warm path
  - Files: `app/login/page.tsx`, `components/app-cache-provider.tsx`, `lib/client-cache.ts`, `app/api/bootstrap/route.ts` (delete if unused)
  - Requirements: R5
  - Preconditions: none beyond branch
  - Expected evidence: Login navigates without awaiting warm; no critical-path bootstrap

- [ ] T6 — Auth + redundant refresh cleanups
  - Files: `lib/auth.ts`, `components/category-picker.tsx`, `app/(app)/expenses/export-plan-button.tsx` (if needed)
  - Requirements: R6, R7
  - Preconditions: none
  - Expected evidence: Safer lighter `requireUserId`; no duplicate refresh where revalidate suffices

- [ ] T7 — Progress handoff
  - Files: `progress/current.md`
  - Requirements: — (process)
  - Preconditions: T1–T6 done
  - Expected evidence: `IMPLEMENTED` for `app-performance`

## Verification

- [ ] TV1 — Navigate Overview / Savings / Projects without editing: no materialize upsert storm (optional Prisma log / timing); pages render
  - Covers: R1
  - Expected result: Snappier loads vs baseline

- [ ] TV2 — Edit an expense in the current month; Overview/Savings waterfall figures update after navigation
  - Covers: R2
  - Expected result: Contributions catch up without relying on page-read materialize

- [ ] TV3 — Overview KPIs, MoM, cashflow, category donut match prior behavior for a known month
  - Covers: R3
  - Expected result: Visual/numeric parity

- [ ] TV4 — Savings lifetime / Balance / Projects funded totals match pre-change for current data
  - Covers: R4
  - Expected result: Same totals, less data transferred

- [ ] TV5 — Login: no prolonged “Loading your data…” before Overview starts
  - Covers: R5
  - Expected result: Immediate navigation to `/`

- [ ] TV6 — Category edit + Export plan still refresh UI correctly
  - Covers: R6
  - Expected result: No stale UI; no double full reload required

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1 |
| T2 | R2 |
| T3 | R3 |
| T4 | R4 |
| T5 | R5 |
| T6 | R6, R7 |
| T7 | — |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
