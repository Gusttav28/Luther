# Design: Income/expense form UX polish

- Governing requirements: R1, R2, R3, R4

## Goals

- Fix Add Income field alignment (R1).
- Replace CategoryPicker chip/datalist UX with a dropdown of existing categories plus a clear new-category path (R2).
- Add half-month filter beside the expenses table total, URL-backed (R3).
- Keep all data user-scoped (R4).

## Current system observations

- `app/(app)/income/income-forms.tsx` — Add income uses `sm:grid-cols-4`; Label is a fourth column that visually offsets (label wrapping / default stretch).
- `components/category-picker.tsx` — text input + datalist + chip buttons; used by expense forms.
- `app/(app)/expenses/page.tsx` — category chip filters in a separate row; table header shows count + `Money` total only.
- `lib/queries/expenses.ts` — `getExpenses` already filters by year/month/categoryId; half-month filter can be client-side on the loaded month list or added to the query.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/income/income-forms.tsx` | Align Add income grid (`items-end` and/or consistent label height / nowrap) so Label matches Period/Amount/Currency | R1 |
| `components/category-picker.tsx` | Dropdown of existing categories; “New category…” reveals name field; preserve hidden `categoryId` / `categoryName` for actions | R2 |
| `app/(app)/expenses/page.tsx` | Half-month controls beside total; read `period` searchParam; filter list + total; compose with category filter | R3, R4 |
| `app/(app)/expenses/expense-forms.tsx` | Only if CategoryPicker API props need minor wiring updates | R2 |

## New files

None required.

## Data and control flow

1. **Income alignment (R1):** CSS-only on the Add income field grid; no action changes.
2. **Category dropdown (R2):** Server still passes `getActiveCategories(userId)`. Picker:
   - `<select>` options = active categories + sentinel value `__new__`.
   - When an existing id is selected → `categoryId` set, `categoryName` = that name.
   - When `__new__` (or empty + typed name) → `categoryId` empty, `categoryName` from text input.
   - Existing create/update actions and validation unchanged.
3. **Half filter (R3):** `searchParams.period` = unset | `H1` | `H2`.
   - Filter expenses where local `date.getDate() <= 15` (H1) or `>= 16` (H2).
   - Recompute displayed total from filtered rows (same conversion rules as today).
   - Header UI: segmented controls / links next to the total (`All` | `1–15` | `16–end`), preserving `year`, `month`, `category` query params.
4. **Auth (R4):** No new endpoints; pages remain behind `requireUserId`.

## Validation and failure handling

- Invalid `period` → treat as All.
- Category actions: unchanged Zod / server validation.
- Zero categories: dropdown shows placeholder + New category path only.

## Security and privacy

- Categories and expenses remain filtered by `userId`.
- No new secrets or logging of amounts.

## Observability

- None beyond existing server errors.

## Rollout / migration

- No schema migration.
- Branch: `feature/income-expense-form-ux` from current working branch / `main` as owner prefers.

## Verification plan

- Visual: `/income` Label aligned with siblings at desktop width.
- Manual: `/expenses` dropdown lists existing categories; new category path still creates.
- Manual: H1/H2 filter changes list + total; URL includes `period=`; works with category chip filter.
- Smoke: create expense with existing category; create with new category name.
