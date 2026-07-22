# Tasks: Expense completion for monthly totals

## Implementation checklist

- [ ] T1 — Add `Expense.completed` to schema and push to the database
  - Files: `prisma/schema.prisma`
  - Requirements: R1, R5
  - Preconditions: Spec approved; branch `feature/expense-completion`
  - Expected evidence: Column exists; existing rows read as `completed = true` (schema default true)

- [ ] T2 — Server actions: toggle completion; create/export default incomplete
  - Files: `app/(app)/expenses/actions.ts`
  - Requirements: R1, R5, R6
  - Preconditions: T1
  - Expected evidence: `setExpenseCompletedAction`; `createExpenseAction` and `copyExpensesMonthAction` set `completed: false`

- [ ] T3 — Queries: expose flag; money totals / spent aggregations completed-only
  - Files: `lib/queries/expenses.ts`, `lib/queries/plan.ts`, `lib/queries/overview.ts`, `lib/queries/waterfall-scope.ts`, and any other `prisma.expense.findMany` spent paths found while implementing
  - Requirements: R3, R4
  - Preconditions: T1
  - Expected evidence: List still returns incomplete rows; `totalMinor` and spent/actual sums filter `completed: true`

- [ ] T4 — Expense row UI: Complete / Not complete controls
  - Files: `app/(app)/expenses/expense-forms.tsx`, `app/(app)/expenses/page.tsx` (if props wiring needed)
  - Requirements: R2, R3
  - Preconditions: T2, T3
  - Expected evidence: Two controls per row; active state visible; total updates after toggle + refresh

- [ ] T5 — Record handoff in progress log
  - Files: `progress/current.md`
  - Requirements: — (process)
  - Preconditions: T1–T4 done
  - Expected evidence: Handoff `IMPLEMENTED` for `expense-completion`

## Verification

- [ ] TV1 — Manual: on `/expenses`, mark one row not complete → money total drops by that amount; mark complete → rises again
  - Covers: R1, R2, R3
  - Expected result: List still shows the row; total matches completed-only sum

- [ ] TV2 — Manual: Export plan into an empty month → rows appear, money total is zero until marked complete
  - Covers: R5
  - Expected result: Incomplete checklist with ₡0 (or unset) spent total

- [ ] TV3 — Spot-check Plan/Overview spent after toggling an expense incomplete
  - Covers: R4
  - Expected result: Actual/spent figures exclude that expense

- [ ] TV4 — Confirm create expense starts incomplete (total unchanged until Complete)
  - Covers: R5
  - Expected result: New row visible; money total unchanged until Complete

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R5 |
| T2 | R1, R5, R6 |
| T3 | R3, R4 |
| T4 | R2, R3 |
| T5 | — |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
