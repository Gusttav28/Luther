# Tasks: Expense create status (Planning vs Already charged)

## Implementation checklist

- [ ] T1 — Parse and validate create-time `completed` (Planning / Already charged)
  - Files: `lib/validation.ts`, `tests/unit/validation.test.ts`
  - Requirements: R2, R5
  - Preconditions: Human-approved spec; branch `cursor/expense-create-status-ef43`
  - Expected evidence: `"false"` and missing/empty → `completed === false`. `"true"` → `completed === true`. Other values fail. Existing expense schema cases still pass when `completed` is omitted. Do not use `z.coerce.boolean()`. Update path must not start writing `completed` from this parse.

- [ ] T2 — Persist the chosen flag in `createExpenseAction`
  - Files: `app/(app)/expenses/actions.ts`
  - Requirements: R2, R3, R5
  - Preconditions: T1
  - Expected evidence: `createExpenseAction` passes parsed `completed` into `prisma.expense.create` (no hard-coded `false`). Still `requireUserId` + `userId` on create. `copyExpensesMonthAction` still sets `completed: false`. `updateExpenseAction` still does not write `completed`. `setExpenseCompletedAction` unchanged.

- [ ] T3 — Two-option control on Add expense (sheet and desktop card)
  - Files: `app/(app)/expenses/expense-forms.tsx` (`AddExpenseForm` only)
  - Requirements: R1
  - Preconditions: T2 (form can land before T2 if the field is ignored, but merge only with T2 so submit persists)
  - Expected evidence: Both `variant="sheet"` and `variant="card"` show **Planning** and **Already charged**; Planning selected by default; submit sends `completed` `"false"` or `"true"`. Date/amount/category independent. Sheet host `components/add-expense-sheet.tsx` unchanged unless a trivial layout fit is required.

- [ ] T4 — List/row copy: Planning vs Already charged; keep existing toggle
  - Files: `app/(app)/expenses/expense-forms.tsx` (`ExpenseListRow`)
  - Requirements: R4, R3
  - Preconditions: T2 (toggle already exists)
  - Expected evidence: No Complete / Not complete / Done / Pending on expense rows. Mobile badge and desktop/menu actions use Planning / Already charged per design mapping. `setExpenseCompletedAction` still flips the boolean. Edit form unchanged.

- [ ] T5 — Record handoff in progress log
  - Files: `progress/current.md`
  - Requirements: — (process)
  - Preconditions: T1–T4 done
  - Expected evidence: Handoff `IMPLEMENTED` for `expense-create-status`

## Verification

- [ ] TV1 — Manual: Add expense as **Planning** on mobile sheet (~375px) and desktop card
  - Covers: R1, R2, R3
  - Expected result: Control visible both places; default Planning. New row appears in the list; Expenses spent money total does **not** increase. DB/row state is incomplete / Planning.

- [ ] TV2 — Manual: Add expense as **Already charged**
  - Covers: R1, R2, R3
  - Expected result: New row appears; Expenses money total increases by that converted amount. Plan/Overview spent (spot-check) include it.

- [ ] TV3 — Manual: Flip a Planning row to Already charged via desktop button and via mobile ⋮ menu; flip back
  - Covers: R4, R3
  - Expected result: Labels match R4. Charging increases the money total; marking Planning decreases it. Row stays listed. Complete / Not complete / Done / Pending absent.

- [ ] TV4 — Automated: `npx vitest run tests/unit/validation.test.ts`
  - Covers: R2
  - Expected result: Completed parse cases pass; existing expense schema tests still pass.

- [ ] TV5 — Code review: auth, export plan, aggregations, dependencies
  - Covers: R5, R2, R3
  - Expected result: `requireUserId` + `userId` on create/toggle; no secrets committed; `package.json` dependencies unchanged; `copyExpensesMonthAction` still `completed: false`; spent query files not rewritten (still `completed: true` filters).

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R2, R5 |
| T2 | R2, R3, R5 |
| T3 | R1 |
| T4 | R4, R3 |
| T5 | — |
| TV1 | R1, R2, R3 |
| TV2 | R1, R2, R3 |
| TV3 | R4, R3 |
| TV4 | R2 |
| TV5 | R5, R2, R3 |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
