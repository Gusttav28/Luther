# Requirements: Expense completion for monthly totals

- Work item: specs/expense-completion/
- Outcome: Each expense can be marked complete or not; only completed amounts sum into spent totals
- Branch: `feature/expense-completion`
- Status: Specification
- Spec version: 2026-07-21

## Problem

When a month’s expenses are exported as a checklist (upcoming bills), every row currently counts toward the month total immediately. The owner needs to mark each expense complete when it is paid/done, and have the table total (and related “spent” figures on Expenses) sum only completed rows.

## In scope

- Persist a complete / not-complete flag per expense (user-scoped).
- Show two controls next to each expense row to mark complete vs not complete.
- Expenses table total and Expenses page composition (donut) sum only completed expenses (still respecting category + H1/H2 filters).
- Newly created expenses and expenses created by “Export plan” (month copy) start as not complete.
- Existing expenses already in the database migrate as complete so historical months keep their current totals.

## Out of scope

- Changing Plan matrix cell editing or PlanCell storage
- Savings / waterfall / balance formulas beyond whatever already reads expense totals (those spent queries must use the same “completed only” rule — see R4)
- Recurring reminders, notifications, or bank sync
- New npm dependencies
- Soft-delete or archive of expenses

## Definitions

- Complete: the expense has been paid / done; its amount counts toward spent totals.
- Not complete: planned or unpaid; row remains visible and editable but does not count toward spent totals.
- Spent total: sum of converted amounts for completed expenses in the current filter (month, optional category, optional H1/H2).

## Requirements

### R1 — Persist completion state

- Trigger: Owner toggles complete / not complete on an expense.
- Preconditions: Authenticated owner; expense belongs to that user.
- Actor/system: Luther server actions + Prisma `Expense`.
- Expected response: Flag updates; unauthorized or missing id fails without leaking internals.
- State change: `Expense.completed` boolean updated for that row only.
- Visible/resulting evidence: Row UI reflects new state after refresh; total updates.
- Failure behavior: Generic error; data unchanged.
- Acceptance evidence: DB flag flips; wrong-user update is a no-op / error.

### R2 — Two controls on each expense row

- Trigger: Owner views the expenses list for a month.
- Preconditions: One or more expenses in the filtered list.
- Actor/system: Expenses list UI.
- Expected response: Beside amount / Edit / Delete, two clear controls mark the row complete or not complete; the active state is visually distinct.
- State change: None until a control is used (then R1).
- Visible/resulting evidence: Screenshot-level: two buttons (or equivalent toggle pair) per row; incomplete rows remain fully editable/deletable.
- Failure behavior: N/A for display.
- Acceptance evidence: Manual UI check on `/expenses`.

### R3 — Table total and composition count only completed

- Trigger: Owner views Expenses for a month (any category / H1–H2 filter).
- Preconditions: Mix of complete and not-complete expenses may exist.
- Actor/system: `getExpenses` (or equivalent) + Expenses page.
- Expected response: Header total and Composition donut use only completed expenses within the active filters. Not-complete rows still appear in the list and in the expense count label if the count means “rows shown”; if the UI shows a money total, that money total is completed-only. Clarification: expense count may remain “N expenses” for all visible rows; money total is completed-only.
- State change: None (read path).
- Visible/resulting evidence: Marking a row complete increases the money total by that amount (converted); marking not complete decreases it.
- Failure behavior: Missing FX rate still shows “—” / unset rate behavior as today for affected amounts.
- Acceptance evidence: Manual check with one incomplete and one complete row.

### R4 — Shared spent queries use completed only

- Trigger: Any screen that reports actual spending from `Expense` rows (Plan actuals, Overview spent, Balance/savings inputs that sum expenses).
- Preconditions: Same as today for those screens.
- Actor/system: Expense aggregation queries.
- Expected response: Amounts treated as “spent” / “actual” include only `completed === true` expenses.
- State change: None (read path).
- Visible/resulting evidence: Incomplete expenses do not inflate Plan actuals or overview spent.
- Failure behavior: Unchanged rate-missing behavior.
- Acceptance evidence: Code review / spot check that spent aggregations filter `completed: true`.

### R5 — Defaults for create, export, and migration

- Trigger: Create expense; Export plan (copy previous month’s expenses); migrate existing DB rows.
- Preconditions: Authenticated owner for create/export.
- Actor/system: create / copy actions + schema migration default.
- Expected response:
  - New create → `completed = false`
  - Export plan copy → each new row `completed = false`
  - Existing rows at migration → `completed = true` (preserve current totals)
- State change: As above.
- Visible/resulting evidence: Fresh export into an empty month shows rows but money total ₡0 (or equivalent) until rows are marked complete.
- Failure behavior: Unchanged validation on create/export.
- Acceptance evidence: Create one expense (total unchanged until marked complete); export into empty month (total zero).

### R6 — Security and privacy

- Trigger: Any completion toggle or expense read.
- Preconditions: Session required.
- Actor/system: Auth + `userId` scoping.
- Expected response: Only the owning user can toggle or see their expenses; no secrets or personal financial dumps committed to the repo.
- State change: N/A.
- Visible/resulting evidence: Same auth gate as other expense actions.
- Failure behavior: Unauthenticated redirected / denied as today.
- Acceptance evidence: Actions use `requireUserId` + `userId` in `where`.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Two buttons per expense: complete / not | R2, R1 |
| Only complete amounts sum to total | R3, R4 |
| Export/checklist workflow | R5 |
| Auth / no secrets | R6 |

## Open questions

None blocking. Defaults in R5 assume exported months are checklists (start incomplete) and history should not suddenly zero out (migrate complete).

## Spec readiness

SPEC_READY → specs/expense-completion/
