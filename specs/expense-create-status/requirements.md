# Requirements: Expense create status (Planning vs Already charged)

- Work item: specs/expense-create-status/
- Outcome: When adding an expense, the owner chooses Planning vs Already charged so planned spend is listed but not counted as spent until charged
- Branch: `cursor/expense-create-status-ef43`
- Status: Specification
- Spec version: 2026-09-07

## Problem

On Expenses, **Add expense** (mobile bottom sheet and desktop card) always persists `Expense.completed = false`. There is no create-time choice. The owner needs to say, at add time, whether the row is **Planning** (scheduled / not yet spent — must not enter spent totals until later) or **Already charged** (money already spent — must enter spent totals immediately). After create, the existing row toggle remains so Planning can become Already charged.

## In scope

- Two-option control on Add expense for both the mobile bottom sheet and the desktop card form (same `AddExpenseForm` / `createExpenseAction` path).
- Owner-facing labels: **Planning** (`completed: false`) and **Already charged** (`completed: true`).
- Persist the chosen flag on create (parse from the form; validate).
- Default selected: **Planning** (matches today’s create behavior).
- Planned rows still appear in the expenses list; they do not increase spent money totals (existing `completed: true` spent filters).
- Existing after-create toggle remains so Planning can later become Already charged.
- Light copy alignment on list/row so vocabulary matches Planning vs Already charged (replace Complete / Not complete and Done / Pending).
- Auth / privacy requirement (`requireUserId`, `userId` scope, no secrets).
- No new npm dependencies.

## Out of scope

- New Prisma field, status enum, or schema migration.
- Changing spent aggregation formulas beyond using the existing `completed` flag (those queries already filter `completed: true`).
- Recurring reminders, notifications, or bank sync.
- Hiding planned rows from the list.
- Export-plan copy behavior (keep current: copied rows start incomplete / Planning).
- Extra fields on the edit-expense form (the row toggle is enough after create).
- Changing date, amount, category, or currency validation rules except adding the create-time completed parse.

## Definitions

- **Planning**: owner-facing name for `Expense.completed === false`. Scheduled or not yet spent. Row is listed; amount is excluded from spent money totals.
- **Already charged**: owner-facing name for `Expense.completed === true`. Money already spent. Row is listed; amount is included in spent money totals (same completed-only rule as `specs/expense-completion/`).
- **Spent money total**: sum of converted amounts for `completed === true` expenses in the active filter (month, optional category, optional H1/H2), as already implemented on Expenses, Plan actuals, Overview spent, Balance, and waterfall.
- **Add expense control**: the two-option status chooser on `AddExpenseForm` (`variant="sheet"` in the mobile bottom sheet and `variant="card"` on desktop `/expenses`).
- **Row toggle**: existing `setExpenseCompletedAction` controls on `ExpenseListRow` (desktop button and mobile ⋮ menu).

## Requirements

### R1 — Create-time two-option control (sheet and desktop)

- Trigger: Owner opens Add expense on `/expenses` — mobile bottom sheet (`AddExpenseForm` `variant="sheet"` hosted by `components/add-expense-sheet.tsx`) or desktop inline card (`variant="card"`).
- Preconditions: Authenticated owner; categories and default date available as today.
- Actor/system: Luther UI (`AddExpenseForm` both variants).
- Expected response: The form shows two mutually exclusive options labeled **Planning** and **Already charged**. **Planning** is selected by default. Choosing one does not change the date, amount, name, currency, or category fields. Date stays independent: a Planning expense dated two weeks from now uses that date **and** Planning status. Both variants submit the same create path.
- State change: Local form field only until submit (then R2).
- Visible/resulting evidence: Both options are visible and distinguishable; the selected option is visually distinct (`aria-pressed` or equivalent radio semantics). Screenshot-level: control present in the sheet and in the desktop card.
- Failure behavior: If the control is left on the default, submit is Planning. Validation errors for other fields stay in the form / sheet as today (sheet does not close on error).
- Acceptance evidence: Manual UI check of the sheet at ~375px and the card at `md+`; default is Planning; switching to Already charged is possible before Add expense.

### R2 — Persist `completed` from the create-time choice

- Trigger: Owner submits Add expense with a chosen status (or the default).
- Preconditions: Authenticated owner; other expense fields pass existing `expenseSchema` / category resolution.
- Actor/system: `createExpenseAction` + `expenseSchema` (or a create-specific parse that wraps it) + Prisma `Expense`.
- Expected response: The new row is written with `completed: false` when Planning is submitted and `completed: true` when Already charged is submitted. The action parses `completed` from the form and validates it. Accepted values: `"false"` (Planning) and `"true"` (Already charged). Missing or empty `completed` is treated as Planning (`false`). Any other value fails validation; no row is written.
- State change: One new `Expense` for that `userId` with `completed` matching the choice. Other create fields unchanged from today (including `completed: false` remaining the default when unspecified).
- Visible/resulting evidence: After success, the list shows the new row in the matching visual state (R4). Planning does not change spent money totals; Already charged does (R3).
- Failure behavior: Invalid `completed` returns a field error (e.g. `completed`) via existing action-state errors; generic catch still returns `GENERIC_ERROR` without leaking internals. Sheet stays open on validation failure.
- Acceptance evidence: Create Planning → DB `completed = false`. Create Already charged → DB `completed = true`. Invalid `completed` → no insert. `copyExpensesMonthAction` still sets `completed: false` (unchanged).

### R3 — Planning listed but not spent; Already charged counts as spent

- Trigger: Owner views Expenses (and other spent surfaces) after creating expenses with each status.
- Preconditions: Mix of Planning and Already charged rows may exist in the filtered month. Spent aggregations already filter `completed: true` (`lib/queries/expenses.ts`, `plan.ts`, `overview.ts`, `balance.ts`, `waterfall-scope.ts`, Expenses page composition).
- Actor/system: Existing list + spent-total queries (no formula change required if R2 writes the flag correctly).
- Expected response: Planning rows appear in the expenses list (and in the row-count label if that count means rows shown). Planning amounts are excluded from spent money totals. Already charged amounts are included in those totals (still respecting category + H1/H2 filters and FX “—” / unset-rate behavior). This work item does not change aggregation formulas.
- State change: None on the read path.
- Visible/resulting evidence: Adding Planning leaves the Expenses money total unchanged (row appears). Adding Already charged increases the money total by that converted amount. Plan actuals / Overview spent / Balance / waterfall continue to ignore Planning rows.
- Failure behavior: Missing FX rate still shows “—” / unset rate behavior as today for affected charged amounts.
- Acceptance evidence: Manual check with one Planning and one Already charged row in the same month; money total equals the charged row only.

### R4 — Later flip via existing toggle, with matching labels

- Trigger: Owner views an expense row and uses the existing completion control (desktop button pair/single action, or mobile ⋮ menu item).
- Preconditions: Authenticated owner; expense belongs to that user. `setExpenseCompletedAction` already exists.
- Actor/system: `ExpenseListRow` + `setExpenseCompletedAction` (no new action).
- Expected response: The after-create toggle remains. A Planning row can be flipped to Already charged (`completed: true`); an Already charged row can be flipped back to Planning (`completed: false`). Owner-facing copy uses **Planning** and **Already charged** instead of Complete / Not complete and Done / Pending:
  - Mobile badge: **Planning** when `completed === false`; **Already charged** when `completed === true`.
  - Desktop meta suffix that today says “Not complete”: **Planning** (charged rows need no incomplete suffix).
  - Desktop action button: **Already charged** on a Planning row (sets `completed=true`); **Planning** on an Already charged row (sets `completed=false`).
  - Mobile ⋮ menu item: same action labels as the desktop button.
- State change: Same as today’s toggle: `Expense.completed` updates for that row only; spent totals follow R3.
- Visible/resulting evidence: Labels match create-time vocabulary; flipping Planning → Already charged increases spent totals by that amount; the reverse decreases them. Row stays listed in both states.
- Failure behavior: Unchanged toggle failure (generic / no-op for wrong user); data unchanged on failure.
- Acceptance evidence: Manual UI check that Complete / Not complete / Done / Pending no longer appear on expense rows; toggle still works.

### R5 — Security and privacy

- Trigger: Any create with status, row toggle, or expense read involved in this item.
- Preconditions: Session required (existing app gate).
- Actor/system: Auth + `userId` scoping.
- Expected response: `createExpenseAction` and `setExpenseCompletedAction` call `requireUserId`. Creates attach `userId`. Updates use `where: { id, userId }`. Only the owning user can create, toggle, or see their expenses. No secrets, credentials, or personal financial dumps are committed to the repository. No new npm dependencies.
- State change: N/A beyond authorized writes.
- Visible/resulting evidence: Unauthenticated users cannot reach `/expenses` or the actions (existing redirect / deny).
- Failure behavior: Unauthenticated redirected / denied as today; unauthorized update is a no-op / generic error without leaking whether the id exists for another user.
- Acceptance evidence: Code review that create and toggle keep `requireUserId` + `userId` in `where` / `data`; `package.json` dependencies unchanged.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Two options on Add expense (sheet + desktop): Planning vs Already charged | R1 |
| Persist chosen flag on create; parse and validate | R2 |
| Default selected: Planning | R1, R2 |
| Planned spend listed but not in spent totals until charged | R3 |
| Already charged counts toward spent totals | R3 |
| Existing after-create toggle remains; Planning can become Already charged | R4 |
| List/row copy: Planning vs Already charged (replace Complete / Not complete and Done / Pending) | R4 |
| Reuse `Expense.completed`; no new status enum | R2 (and out of scope) |
| Date independent of Planning / Already charged | R1 |
| Auth / privacy / no secrets / no new deps | R5 |
| Export plan copy stays incomplete / Planning | R2 (unchanged copy path) |

## Assumptions

- Label **Already charged** is the owner-facing name (owner said “already charged or something like that”).
- Default **Planning** if the control is left on the default.
- Date field stays independent: a Planning expense for two weeks from now uses that date **and** Planning status.
- Spent aggregations already implemented in `specs/expense-completion/` remain the source of truth; this item only ensures create-time `completed` is chosen correctly.
- “Light copy alignment” means expense-row / list vocabulary only, not Plan / Overview / Balance headings.

## Open questions

None blocking. Assumptions above close the product choices.

SPEC_READY → specs/expense-create-status/
