# Current implementation progress

- Work item: expense-create-status (`specs/expense-create-status/`)
- Branch: `cursor/expense-create-status-ef43`
- Spec package: 2026-09-07, human-approved (owner **GO** on 2026-09-07)
- Implementer session: 2026-09-07
- Handoff: **IMPLEMENTED**

## Files read

- `AGENTS.md`, `.agents/implementer.md`
- `specs/expense-create-status/{requirements,design,tasks}.md` (complete)
- Existing expense create action, `expenseSchema`, AddExpenseForm sheet/card, ExpenseListRow, income period toggle pattern

## Files changed

### T1 — Parse and validate create-time `completed`

- `lib/validation.ts` — `completedCreateSchema` + `parseCompletedCreate` (missing/empty → false; `"true"`/`"false"` only; not on `expenseSchema`)
- `tests/unit/validation.test.ts` — default Planning, true/false mapping, reject invalid; expense schema still omits `completed`

### T2 — Persist chosen flag on create

- `app/(app)/expenses/actions.ts` — `createExpenseAction` writes parsed `completed`; `copyExpensesMonthAction` still `completed: false`; `updateExpenseAction` still does not write `completed`; `setExpenseCompletedAction` unchanged

### T3 — Two-option control on Add expense

- `app/(app)/expenses/expense-forms.tsx` — `ExpenseStatusControl` on sheet and card; default Planning; hidden `completed` `"false"`/`"true"`

### T4 — List/row copy

- `app/(app)/expenses/expense-forms.tsx` — `ExpenseListRow` labels: Planning / Already charged (badge, desktop meta, desktop button, mobile ⋮). Toggle still `setExpenseCompletedAction`. Edit form unchanged.

### T5 — Handoff

- `progress/current.md` — this file

## Verification

- TV4: `npx vitest run tests/unit/validation.test.ts` (run after this handoff)
- TV1–TV3: owner/browser check of sheet + desktop add and row toggle
- TV5: no new deps; spent queries untouched; export copy still incomplete

## Notes for Reviewer

- Reuses `Expense.completed`; no schema change
- Sheet host `components/add-expense-sheet.tsx` unchanged
- Visual row highlight (opacity / brand) unchanged; copy only
