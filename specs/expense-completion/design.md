# Design: Expense completion for monthly totals

- Governing requirements: R1–R6

## Goals

- Add a durable `completed` flag on expenses (R1, R5, R6)
- Expose complete / not-complete controls on each list row (R2)
- Make money “spent” totals and composition use only completed expenses (R3, R4)

## Current system observations

- `Expense` has `date`, `amountMinor`, `currency`, `categoryId`, `name`; no completion flag (`prisma/schema.prisma`).
- List UI: `ExpenseListRow` in `app/(app)/expenses/expense-forms.tsx` with Edit / Delete.
- Month list + totals: `getExpenses` in `lib/queries/expenses.ts`; page total + donut in `app/(app)/expenses/page.tsx`.
- Month copy: `copyExpensesMonthAction` in `app/(app)/expenses/actions.ts`.
- Other spent aggregations live under `lib/queries/` (plan actuals, overview, balance/savings) and must filter `completed: true` when summing expenses as spent.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `prisma/schema.prisma` | Add `completed Boolean @default(true)` on `Expense` (default true so raw inserts / migrate preserve history; application create/export set false explicitly) | R1, R5 |
| `app/(app)/expenses/actions.ts` | `setExpenseCompletedAction`; create + copy set `completed: false` | R1, R5, R6 |
| `lib/queries/expenses.ts` | Return `completed` on rows; money total from completed only | R3, R4 |
| `lib/queries/plan.ts` | Actual expense sums use `completed: true` | R4 |
| `lib/queries/overview.ts` | Spent aggregations use `completed: true` | R4 |
| `lib/queries/waterfall-scope.ts` | Expense legs of waterfall use `completed: true` | R4 |
| `app/(app)/expenses/expense-forms.tsx` | Two buttons (Complete / Not complete) on each row; visual active state | R2 |
| `app/(app)/expenses/page.tsx` | Pass completion into row; keep filters; money total already completed-only from query | R3 |
| `progress/current.md` | Implementation handoff log | — |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| None | — | — |

Schema push / migrate via existing Prisma workflow (`db push` or migrate) — no new dependency packages.

## Data and control flow

```
[Expense row] Complete | Not complete
        → setExpenseCompletedAction(id, completed)
        → prisma.expense.updateMany({ where: { id, userId }, data: { completed } })
        → revalidatePath /expenses, /plan, /
[getExpenses]
        → load all rows for month (both flags) for the list
        → totalMinor / composition inputs = sum converted where completed === true
[createExpense / copyExpensesMonth]
        → completed: false
[Existing DB]
        → column default true + backfill true
```

Row UI (conceptual order): name/meta · amount · Complete · Not complete · Edit · Delete.  
Active control: solid/brand style for the current state; the other remains secondary.

## Validation and failure handling

- Toggle: require `id` + boolean; `updateMany` with `userId`; `count === 0` → generic error.
- No Zod schema expansion required beyond optional tiny helper if desired; form fields `id`, `completed` (`"true"` / `"false"`).
- Unchanged amount/date validation on create/update.

## Security, privacy, accessibility, and performance

- All writes scoped by `requireUserId` + `userId` (R6).
- Buttons are real `<button type="submit">` (or button + action) with clear labels; `aria-pressed` on the active state when implemented as a toggle pair.
- No new client bundles beyond existing patterns; no secrets in repo.

## Dependencies

No new dependencies. Prisma schema field only.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Soft “status” enum (planned/paid/skipped) | Rejected for this item | Two-state matches the request; keep scope small |
| Hide incomplete from list | Rejected | Owner needs the checklist visible |
| Default new rows complete | Rejected | Breaks export-as-checklist (R5) |
| Only change Expenses page totals, not Plan/Overview | Rejected | Would make “spent” inconsistent (R4) |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `setExpenseCompletedAction` + schema field |
| R2 | `ExpenseListRow` controls |
| R3 | `getExpenses` total + page donut from completed rows |
| R4 | Query sweep for expense spent sums |
| R5 | create/copy `false`; schema default `true` for migration |
| R6 | `userId` scoping on toggle |
