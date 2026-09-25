# Design: Plan Month / Year / Totals redesign

- Governing requirements: R1–R8

## Goals

- One Plan board component for mobile and desktop (R2, R7).
- Grouping math in a pure, tested helper (R3, R4).
- Reuse existing plan-cell and category actions; add one action for moving a category (R6).

## Current system observations

- `app/(app)/plan/page.tsx` renders `MobilePlan` (md:hidden) plus a desktop charts + table block.
- `components/plan/mobile-plan.tsx` has charts, Grid/Monthly toggle, and `·· name` child rows.
- `lib/queries/plan.ts` `getPlanMatrix` returns rows with `parentId`, `planned[12]`, `plannedRaw[12]`, `actual[12]`, `rowTotal`, plus `columnTotals` and `grandTotal`, sorted parent-then-children.
- `app/(app)/plan/plan-forms.tsx` has `AddCategoryForm` (with "Under"), `PlanCellInput`, `CategoryRowActions`.
- `app/(app)/plan/actions.ts` has create / rename / archive / delete / set-plan-cell actions, all `userId`-scoped.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/plan/page.tsx` | Load matrix + settings; render `PlanBoard` only; drop charts and table | R1, R7, R8 |
| `app/(app)/plan/plan-forms.tsx` | `CategoryRowActions`: add "Move under" select (parents list) | R6 |
| `app/(app)/plan/actions.ts` | New `setCategoryParentAction` | R6, R8 |
| `lib/validation.ts` | Schema for move (`id`, optional `parentId`) | R6 |
| `vitest.waterfall.config.ts` | Include new unit test | R3, R4 |
| `progress/current.md` | Implementation log | — |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `lib/plan-groups.ts` | `groupPlanRows(rows)` → groups with parent row, child rows, `planned[12]`, `actual[12]`, `total`; `sumNullable` helpers | R3, R4 |
| `components/plan/plan-board.tsx` | Client board: year switcher, header, tabs, pills, Month / Year / Totals panels | R1–R5, R7 |
| `tests/unit/plan-groups.test.ts` | Group math tests | R3, R4 |

## Removed files

| Path | Reason |
| --- | --- |
| `components/plan/mobile-plan.tsx` | Replaced by `plan-board.tsx` |

## Data and control flow

```
page.tsx (server, requireUserId)
  getSettings, getPlanMatrix(userId, year, reporting, rates)
  -> <PlanBoard year currency matrix parents />

PlanBoard (client)
  state: tab = month|year|totals, monthIndex, expanded:Set<parentId>
  groups = groupPlanRows(matrix.rows)
  header: budget = matrix.columnTotals[m]; spent = sum(rows.actual[m])
  Month:  groups -> plain row | collapsible group (General + children), PlanCellInput per row
  Year:   groups -> card with 12 bars (scaled to card max) | collapsible
  Totals: matrix.columnTotals bars + grandTotal
```

`groupPlanRows`:
- Parents = rows with `parentId` null. Children attach by `parentId`.
- A child whose parent row is missing from the matrix (e.g. archived parent without cells) is shown as its own group, so no plan data is hidden.
- `planned[m]` / `actual[m]` sum with null propagation (null if any part is null).
- `total` = sum of `planned`.

`setCategoryParentAction(id, parentId | "")`:
1. `requireUserId`.
2. Load category `{ id, userId }`; not found → error.
3. If `parentId` empty → set null.
4. Else load target `{ id: parentId, userId, parentId: null }`; reject if missing or equal to `id`.
5. Reject if `count({ userId, parentId: id }) > 0` ("Move its subcategories first.").
6. Update, `revalidatePath("/plan")` plus the paths the existing category actions revalidate.

## Validation and failure handling

- Missing rate: `Money` receives null and shows its unavailable state.
- Move errors return `{ errors: { _form } }` and render on the row.
- Plan input unchanged (same action and validation).

## Security, privacy, accessibility, and performance

- All queries and writes `userId`-scoped; parent lookup requires `userId` and `parentId: null`.
- Tabs use buttons with `aria-pressed`; group headers are buttons with `aria-expanded`; month pills are buttons with `aria-pressed`; bars carry an `aria-label` with month and amount.
- No extra queries: one matrix load per page, grouping is in memory.

## Dependencies

No new packages. No schema or migration.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep charts above tabs | Rejected | Owner chose to remove |
| Separate mobile and desktop components | Rejected | One responsive board is less code and keeps both in sync |
| Auto-move Netflix etc. under Subscription | Rejected | Owner data; do not rewrite silently |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `plan-board.tsx` header + year links |
| R2 | `plan-board.tsx` tabs + pills |
| R3 | `plan-groups.ts`, Month panel |
| R4 | `plan-groups.ts`, Year panel |
| R5 | Totals panel |
| R6 | `setCategoryParentAction`, `CategoryRowActions` |
| R7 | responsive classes in `plan-board.tsx`; `page.tsx` without table/charts |
| R8 | `requireUserId`, scoped queries, no deps |
