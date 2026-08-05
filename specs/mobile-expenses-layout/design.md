# Design: Mobile Expenses Layout and Add Sheet

- Governing requirements: R1, R2, R3, R4, R5, R6

## Goals

- Mobile Expenses list chrome per owner reference (R1, R5).
- Add expense as bottom sheet; no inline add card on mobile (R2, R3).
- External **N** control beside More opens the sheet (R4).
- Preserve create/filter/mutate semantics and avoid new deps (R6).

## Current system observations

- `app/(app)/expenses/page.tsx` — month frame, inline `AddExpenseForm`, donut, `ExpensesTable` + `ExpenseListRow`.
- `app/(app)/expenses/expense-forms.tsx` — `AddExpenseForm` via `createExpenseAction`; row edit/complete/delete.
- `app/(app)/expenses/expenses-table.tsx` — category chips + half filters + count/total.
- `components/nav.tsx` — floating dark pill + More; no external N yet.
- `app/(app)/layout.tsx` — renders `BottomNav` for authenticated mobile.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/expenses/page.tsx` | Split mobile vs desktop presentation; omit inline add on mobile; mount sheet host with categories/defaultDate. | R1, R2 |
| `app/(app)/expenses/expense-forms.tsx` | Support sheet-friendly layout/variant of Add form (2×2 denser fields + full-width primary); keep desktop card variant. | R2, R3 |
| `app/(app)/expenses/expenses-table.tsx` | Mobile filter/summary chrome (dropdown or compact category control + segmented half filter) without changing filter URLs/semantics. | R1, R5 |
| `app/(app)/expenses/expenses-month-frame.tsx` | Optional circular month controls on mobile (or reuse `MonthPicker variant="circles"`). | R1 |
| `components/nav.tsx` | Render external **N** circle outside pill; emit/open add-expense intent. | R4 |
| `app/(app)/layout.tsx` | Pass session initial only if needed; prefer not—N is literal. Wire provider if sheet state lives at layout. | R4 |
| `components/month-picker.tsx` | Reuse existing `circles` variant if not already used on Expenses. | R1 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `components/add-expense-sheet.tsx` (or under `app/(app)/expenses/`) | Client bottom sheet + backdrop; hosts Add form; open/close API. | R2, R3 |
| `components/add-expense-sheet-provider.tsx` (optional) | Client context so BottomNav **N** and Expenses page share open state / navigate-to-expenses behavior. | R4 |
| `components/overview/` — N/A | — | — |

Exact filenames may vary; responsibilities must exist.

## Data and control flow

```
BottomNav [N]
   │ click
   ├─ if pathname not /expenses → router.push('/expenses?…') 
   └─ openAddExpenseSheet()

AddExpenseSheetProvider (client)
   open | close
   └─► AddExpenseSheet
          backdrop + panel
          AddExpenseForm (sheet variant)
             createExpenseAction → on success close + refresh
```

### Visual structure

**N control**

- Sibling of the dark pill in the fixed bottom cluster (`flex` row: `[ pill ][ N ]`).
- Circle ~36–40px, brand fill, white **N**, gap from pill (~8–10px).
- `aria-label="Add expense"`.

**Sheet**

- `fixed inset-0 z-30` (above nav `z-20`): scrim + bottom panel `rounded-t-3xl`.
- Handle bar; header with title + close; form; sticky/full-width submit.
- Body scroll if keyboard open.

**Mobile Expenses page**

- Title “Expenses”; circular month + Export.
- No donut required on mobile (mock list-first); desktop keeps donut. If space is tight, hide composition donut below `md` only.
- List card: filters, “N expenses” + total, rows with status badge + ⋮ actions.

## Validation and failure handling

- Reuse action-state errors inside the sheet.
- Closing discards unsaved draft (acceptable); no draft persistence required.
- Pending submit disables double-submit via existing `PendingSubmitButton`.

## Security, privacy, accessibility, and performance

- Auth unchanged.
- Focus: move into sheet on open; restore on close; Escape closes.
- Do not put secrets in client bundles; no new deps.
- Sheet portal should not remount the entire app shell unnecessarily.

## Dependencies

- **No new npm dependencies.** CSS/Tailwind + existing dialog patterns only (native `<dialog>` or fixed overlay).

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep inline accordion Add on mobile | Rejected | Owner requires bottom sheet |
| Put N inside the dark pill | Rejected | Owner: outside container next to dots |
| N = user initial | Rejected under assumptions | Owner/mock letter N |
| N only on Expenses route | Deferred | Assumption: always visible next to nav for discoverability |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | Expenses page split + month frame + table chrome |
| R2 | Sheet-hosted AddExpenseForm; hide inline on mobile |
| R3 | `AddExpenseSheet` presentation |
| R4 | Nav N + provider / open intent |
| R5 | Filters/totals/rows semantics |
| R6 | No new deps; auth unchanged |
