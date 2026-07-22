# Requirements: Income/expense form UX polish

- Work item: specs/income-expense-form-ux/
- Outcome: Clearer income form alignment; expense category as a real dropdown of existing categories; expense list filterable by half-month
- Branch: `feature/income-expense-form-ux`
- Status: Specification
- Spec version: 2026-07-21

## Problem

On Income, the optional Label field does not line up with Period / Amount / Currency. On Expenses, category entry uses a free-text + chip picker instead of a clear dropdown of categories already in the account, and the expense list has no half-month (H1/H2) filter next to the month total.

## In scope

- Align the Add Income form fields (Period, Amount, Currency, Label) on one visual row baseline.
- Replace the expense category control with a dropdown populated from the user’s existing active categories (same list shown today via chips / CategoryManager data).
- Add H1 / H2 filter controls on the expenses table header (beside the total) to show expenses dated days 1–15 vs 16–end for the selected month.
- Preserve ability to create a new category when needed (without losing current create-on-save behavior).

## Out of scope

- Changes to waterfall / savings math
- Income half-month list redesign
- New dependencies
- Mobile-only redesign beyond keeping the forms usable on small screens

## Definitions

- H1: calendar days 1–15 of the selected month (local date of the expense)
- H2: calendar day 16 through the last day of the selected month
- Active category: a non-archived category belonging to the signed-in user

## Requirements

### R1 — Income Label field alignment

- Trigger: User opens Income and views the Add income form at `sm` breakpoint and above.
- Preconditions: Authenticated owner.
- Actor/system: Luther UI.
- Expected response: Label (optional) sits on the same row alignment as Period, Amount, and Currency (labels and inputs share one consistent baseline / top edge).
- State change: None (presentation only).
- Visible/resulting evidence: No vertical offset of the Label column relative to the other three fields.
- Failure behavior: N/A.
- Acceptance evidence: Visual check on `/income` at desktop width.

### R2 — Expense category dropdown of existing categories

- Trigger: User opens Add expense (and edit expense category control).
- Preconditions: Authenticated owner; zero or more active categories exist.
- Actor/system: Luther UI + existing category queries.
- Expected response: Category is chosen from a `<select>` (or equivalent dropdown) listing the user’s existing active categories by name. Options reflect what is already stored (same set CategoryManager / current chips use).
- State change: Selecting an existing category submits its id (current create/update actions still apply).
- Visible/resulting evidence: Dropdown shows existing category names; no chip strip required for picking.
- Failure behavior: If no categories exist, user can still create one via an explicit “new category” path (text field or dedicated option) so expense create does not soft-lock.
- Acceptance evidence: Manual check on `/expenses` with seeded/existing categories.

### R3 — Expense list half-month filter beside total

- Trigger: User is on Expenses for a given month and uses the filter next to the expense count / total amount.
- Preconditions: Authenticated owner; month selected via MonthPicker.
- Actor/system: Luther UI; expense list filtering by local date day-of-month.
- Expected response: Controls offer at least: All (default), First half (1–15), Second half (16–end). Selecting a half filters the listed expenses and the displayed total to that half. Category filter (if present) still composes with the half filter.
- State change: Filter may be reflected in the URL (`period=H1|H2` or equivalent) so refresh/share preserves selection.
- Visible/resulting evidence: Table header shows the half options beside the total; list and total match the chosen half.
- Failure behavior: Invalid period query param falls back to All.
- Acceptance evidence: Manual check with expenses on both sides of the 15th.

### R5 — Half-filter loading feedback without scroll jump

- Trigger: User selects All / 1–15 / 16–end on the expenses table.
- Expected response: Table shows a local loading state (rotating circle over a blurred table); viewport scroll position is preserved (no jump to top).
- Acceptance evidence: Manual check on `/expenses` while scrolled to the table.

### R6 — Action button pending dots

- Trigger: User presses Add expense, Save (edit), or Delete on an expense.
- Expected response: The pressed button shows an animated three-dot loading state and is disabled until the request finishes.
- Acceptance evidence: Manual check that buttons show dots during the server action.

### R4 — Auth and data boundaries

- Trigger: Any of the above.
- Preconditions: Session required (existing app gate).
- Actor/system: Existing `requireUserId` / user-scoped category and expense queries.
- Expected response: Only the signed-in user’s categories and expenses are listed or filtered. No secrets or cross-user data.
- State change: None beyond existing expense/category writes.
- Visible/resulting evidence: Unauthenticated users cannot reach the pages.
- Failure behavior: Existing auth redirects.
- Acceptance evidence: Unchanged auth gate; queries remain `userId`-scoped.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Align income Label with other Add income fields | R1 |
| Expenses category as dropdown of existing categories | R2 |
| Expenses table H1/H2 options beside total | R3 |
| Half-filter loading + scroll preserve | R5 |
| Save/Delete/Add pending dots | R6 |
| Financial/privacy boundary | R4 |

## Non-negotiables

- No new npm dependencies without explicit approval.
- No secrets or personal financial exports in the repo.
- Category create-on-save must remain possible when the user has no matching category.

## Open questions

- None blocking. Default: keep “type a new category name” as a secondary control under the dropdown (e.g. select “New category…” reveals the name field), so deploy shows existing categories immediately in the dropdown.
