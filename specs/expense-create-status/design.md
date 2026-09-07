# Design: Expense create status (Planning vs Already charged)

- Governing requirements: R1, R2, R3, R4, R5

## Goals

- Let the owner choose Planning vs Already charged when adding an expense, on both the mobile sheet and the desktop card (R1).
- Persist that choice as `Expense.completed` on create, with validation (R2).
- Keep planned rows listed and excluded from spent money totals; charged rows included — using existing completed-only aggregations (R3).
- Keep the after-create row toggle; align labels to Planning / Already charged (R4).
- Preserve auth, `userId` scoping, and no new dependencies (R5).

## Current system observations

- `prisma/schema.prisma` — `Expense.completed Boolean @default(true)` already exists (migration default preserves history). Application create currently forces `completed: false`.
- `createExpenseAction` in `app/(app)/expenses/actions.ts` always writes `completed: false`. `parseForm` uses `expenseSchema` and does not read `completed`.
- `setExpenseCompletedAction` already parses `formData.get("completed") === "true"` and updates with `where: { id, userId }`.
- `copyExpensesMonthAction` already writes `completed: false` (export plan). **Do not change.**
- Add UI: `components/add-expense-sheet.tsx` hosts `AddExpenseForm` `variant="sheet"`; desktop `/expenses` renders `AddExpenseForm` `variant="card"` (`app/(app)/expenses/page.tsx`). Both call `createExpenseAction`.
- `AddExpenseForm` in `app/(app)/expenses/expense-forms.tsx` has name, amount, date, currency, category, submit — no status control.
- `ExpenseListRow` in the same file: desktop button “Complete” / “Not complete”; desktop meta “ · Not complete”; mobile badge “Done” / “Pending”; mobile ⋮ menu uses the same Complete / Not complete action labels.
- Spent totals already filter `completed: true` in `lib/queries/expenses.ts` (`totalMinor`), `lib/queries/plan.ts`, `lib/queries/overview.ts`, `lib/queries/balance.ts`, `lib/queries/waterfall-scope.ts`, and the Expenses page composition in `app/(app)/expenses/page.tsx`.
- Income sheet already uses a two-button `role="group"` + `aria-pressed` pattern with a hidden input (`period`). Reuse that interaction pattern for status.
- `expenseSchema` in `lib/validation.ts` is shared by create and update via `parseForm`. Update must **not** start writing `completed` from the edit form (edit form stays out of scope).
- Do **not** use `z.coerce.boolean()` on the form string: the string `"false"` is truthy and would persist Already charged.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `lib/validation.ts` | Parse create-time `completed` as `"true"` \| `"false"` (missing/empty → `false` / Planning). Reject any other value. Keep this parse out of `updateExpenseAction`’s write path (shared `expenseSchema` may include an optional field that update ignores, or split a create-only schema / parse). | R2, R5 |
| `app/(app)/expenses/actions.ts` | `createExpenseAction`: parse validated `completed` from the form and pass it to `prisma.expense.create` instead of hard-coding `false`. Keep `requireUserId` + `userId` on create. Leave `copyExpensesMonthAction` at `completed: false`. Leave `setExpenseCompletedAction` and `updateExpenseAction` write sets unchanged. | R2, R3, R5 |
| `app/(app)/expenses/expense-forms.tsx` | `AddExpenseForm` (sheet **and** card): two-option Planning / Already charged control; default Planning; submit `completed` `"false"` / `"true"`. `ExpenseListRow`: replace Complete / Not complete / Done / Pending with Planning / Already charged as specified in R4. Keep `setExpenseCompletedAction` wiring. | R1, R4 |
| `tests/unit/validation.test.ts` | Cover default Planning, `"true"` → charged, `"false"` → planning, reject invalid `completed`; existing expense cases still pass when `completed` is omitted. | R2 |
| `progress/current.md` | Implementation handoff log (implementer). | — |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| None | Sheet host and desktop page already render `AddExpenseForm`. No schema files. | — |

`components/add-expense-sheet.tsx` and `app/(app)/expenses/page.tsx` need no change unless a layout tweak is required to fit the new control; prefer keeping them unchanged.

Do **not** change: `prisma/schema.prisma`, spent query files listed above, `copyExpensesMonthAction`, `EditExpenseForm`.

## Data and control flow

```
AddExpenseForm (variant card | sheet)
  [Planning]  completed="false"   default selected
  [Already charged]  completed="true"
        → createExpenseAction
        → requireUserId()
        → expenseSchema (+ completed parse)
        → resolveCategoryId(userId, …)
        → prisma.expense.create({ userId, …, completed: <parsed boolean> })
        → revalidate /expenses, /plan, /, /savings, /projects

ExpenseListRow
  Planning → setExpenseCompletedAction(id, completed="true")  label: Already charged
  Already charged → setExpenseCompletedAction(id, completed="false")  label: Planning
        → prisma.expense.updateMany({ where: { id, userId }, data: { completed } })

[getExpenses / spent queries]
        → list all rows (both flags)
        → money totals / actuals / waterfall / balance: completed === true only
```

### Create control (R1)

- Place the control on both form variants, after the existing fields and before the submit button (or adjacent in the sheet stack so it is obvious before **Add expense**).
- Pattern (preferred): `role="radiogroup"` or `role="group"` with `aria-label` such as “Expense status”; two `type="button"` options with `aria-pressed`; hidden `<input name="completed" value="true"|"false" />`. Mirror income period on the sheet. Native radios with the same name are also acceptable.
- Labels exactly: **Planning** and **Already charged**.
- Default: Planning selected (`completed` value `"false"`) on first paint and after a failed submit unless the owner had selected Already charged (preserve submitted value on validation error when the action-state pattern allows; at minimum default Planning on a fresh form).
- Date / amount / category unchanged and independent.

### Mapping

| Owner label | Form value | `Expense.completed` | Listed | Spent totals |
| --- | --- | --- | --- | --- |
| Planning | `"false"` | `false` | Yes | No |
| Already charged | `"true"` | `true` | Yes | Yes |

### Row copy (R4)

| Surface | Today | After |
| --- | --- | --- |
| Mobile badge | Done / Pending | Already charged / Planning |
| Desktop meta | “ · Not complete” when incomplete | “ · Planning” when incomplete; no incomplete suffix when charged |
| Desktop button (Planning row) | Complete | Already charged (`completed=true`) |
| Desktop button (charged row) | Not complete | Planning (`completed=false`) |
| Mobile ⋮ action | Complete / Not complete | Same as desktop button labels |

Visual treatment of Planning vs charged rows (opacity, brand highlight) may stay as today; this item is copy + create-time flag, not a restyle.

## Validation and failure handling

- **Completed parse:** accept only `"true"` and `"false"`. Missing, `null`, or `""` → Planning (`false`) so a form without the control (or a forgotten field) matches today’s create default. Any other string → `safeParse` failure; `fieldErrors`; no `prisma.expense.create`.
- **Do not** use `z.coerce.boolean()` (would treat `"false"` as true).
- If `completed` is added to shared `expenseSchema`, `updateExpenseAction` must continue to omit `completed` from `updateMany` `data` so edit cannot clobber status. Prefer a dedicated `completedCreateSchema` (or parse `completed` only inside `createExpenseAction`) so update is obviously untouched.
- Other expense validation (date ISO, amount, currency, name, category) unchanged.
- Unauthenticated create: `requireUserId` throws → existing `GENERIC_ERROR` / redirect behavior.
- Invalid category still returns `categoryName` error as today, before or after completed parse; no partial write.
- Toggle failures unchanged.

## Security, privacy, accessibility, and performance

- All writes: `requireUserId` + `userId` on create `data` and toggle `where` (R5).
- Status control: real buttons or radios with accessible names **Planning** and **Already charged**; selected state announced (`aria-pressed` or native radio).
- Row actions keep clear labels (not icon-only).
- No new client libraries; no logging of amounts; no secrets in the repo.
- No new npm dependencies.

## Dependencies

No new dependencies. Reuse existing `Expense.completed` boolean. New packages are prohibited for this item.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| New Prisma enum / `status` field | Rejected | Owner: reuse `Expense.completed`; no schema change |
| Sheet-only control; desktop always Planning | Rejected | Same create path; desktop card must offer the choice (R1) |
| Default Already charged | Rejected | Would change today’s create behavior; owner asked default Planning |
| Hide Planning rows from the list | Rejected | Out of scope; checklist must stay visible |
| Change spent aggregation formulas | Rejected | Already `completed: true` only; risk of drift |
| Put status on EditExpenseForm | Rejected | Out of scope; row toggle is enough after create |
| `z.coerce.boolean()` on FormData | Rejected | `"false"` would persist as charged |
| Export plan copies inherit source completed | Rejected | Out of scope; keep copies Planning / incomplete |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `AddExpenseForm` two-option control in sheet and card variants; date independent; default Planning |
| R2 | `lib/validation.ts` parse + `createExpenseAction` writes `completed`; export copy unchanged |
| R3 | Persist flag only; existing spent queries unchanged; listed via `getExpenses` all rows |
| R4 | `ExpenseListRow` labels + existing `setExpenseCompletedAction` |
| R5 | `requireUserId` / `userId` retained; no secrets; no new deps |
