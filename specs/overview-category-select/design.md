# Design: Overview breakdown category select

- Governing requirements: R1–R3

## Goals

- Client selection set + summed headline (R1).
- Hold/context-menu popover of subcategory amounts (R2).
- No schema, no new packages (R3).

## Current system observations

- Mobile Overview **Breakdown** → Category tab uses `SpentByCategory` `variant="embedded"` (rows + “Total spent”).
- Desktop uses the same component as a card with a header total and chips.
- `spentByCategoryFromSnapshot` already rolls children into the parent slice. It does not list children.
- `MonthExpenseRow` already has `parentId` / `parentName`.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `lib/category-spend.ts` | New: `selectedCategoryTotal`, attach children to parent slices | R1, R2 |
| `lib/queries/overview-dashboard.ts` | Load user categories; attach children on the result | R2, R3 |
| `components/overview/spent-by-category.tsx` | Client: select, headline, long-press popover | R1, R2 |
| `tests/unit/category-spend.test.ts` | Selected sum + children attach | R1, R2 |
| `vitest.waterfall.config.ts` | Include the new test | R1, R2 |
| `progress/current.md` | Log | — |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `lib/category-spend.ts` | Pure select/child math | R1, R2 |
| `tests/unit/category-spend.test.ts` | Tests | R1, R2 |
| `specs/overview-category-select/*` | This package | — |

`CategorySpend` gains `children: { categoryId, name, amountMinor }[]` (General first when the parent itself has spend).

## Data and control flow

```
Tap category        → toggle id in selectedIds
Headline            → selectedIds empty ? totalMinor : selectedCategoryTotal(...)
Hold / contextmenu  → popover { category, x, y }; do not toggle
```

`getOverviewDashboard` loads `category.findMany({ where: { userId } })` and passes nodes into the attach helper.

## Validation and failure handling

- Missing FX on a selected slice → selected total null / “—”.
- Popover for a parent with no children: “No subcategories”.
- Pointer cancel / leave before 500ms: treat as cancelled hold, not a tap if the pointer left.

## Security, privacy, accessibility, and performance

- Category query `userId`-scoped.
- Category controls are `<button aria-pressed>`.
- Popover: `role="dialog"`, Escape + outside click to close.
- No extra network on tap/hold.

## Dependencies

No new npm packages. No Prisma model changes.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Navigate to Expenses on tap | Rejected | Owner wants an in-place combination total |
| Select children inside the popover | Out of scope | Hold is inspect-only |
| migrate on Vercel | Out of scope | Separate incident |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `selectedCategoryTotal` + SpentByCategory buttons |
| R2 | children on CategorySpend + hold popover |
| R3 | existing `userId` findMany |
