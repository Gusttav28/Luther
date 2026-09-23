# Design: Expense subcategories

- Governing requirements: R1–R6

## Goals

- Store one optional child level on `Category` (R1).
- Let the owner create and assign subcategories (R2, R3).
- Expenses table: general parent filter + dropdown/optgroup for children (R4).
- Roll up composition to the parent (R5).
- No new packages; `userId` on every write (R6).

## Current system observations

- `Category` is flat (`userId`, `name`, `archived`), unique `(userId, name)`.
- Expenses store a single `categoryId`. Filters and the donut group by that id.
- `CategoryPicker` is a flat `<select>`. `ExpensesTable` is a flat chip row / mobile `<select>`.
- `resolveCategoryId` creates a root by name.
- Plan matrix is one row per category, A–Z.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `prisma/schema.prisma` | `Category.parentId` self-relation + index | R1 |
| `prisma/migrations/20260923021000_category_parent/migration.sql` | Add nullable `parentId` FK | R1 |
| `lib/category-tree.ts` | Pure helpers: roots, children, filter ids, path label, rollup key | R1, R4, R5 |
| `lib/category-resolve.ts` | Optional `parentId` when creating by name | R3 |
| `lib/validation.ts` | Optional `parentId` on category create | R2 |
| `lib/queries/expenses.ts` | Expand parent filter to child ids; expose `parentId` / path | R4 |
| `lib/queries/overview.ts` | Snapshot includes `parentId` | R5 |
| `lib/queries/overview-dashboard.ts` | Roll spent-by-category to parent | R5 |
| `lib/queries/plan.ts` | `parentId` on rows; sort parent then children | R2 |
| `app/(app)/plan/actions.ts` | Create with `parentId`; block delete parent with children | R2 |
| `app/(app)/expenses/page.tsx` | Pass tree into table; donut rollup / child slices | R4, R5 |
| `app/(app)/expenses/expenses-table.tsx` | Parent chips + child dropdown; mobile optgroups | R4 |
| `app/(app)/expenses/expense-forms.tsx` | Path label on rows | R3 |
| `components/category-picker.tsx` | Parent + General/child / new subcategory | R3 |
| `app/(app)/plan/plan-forms.tsx` | Add subcategory under a parent | R2 |
| `app/(app)/plan/page.tsx` | Indent child rows | R2 |
| `components/plan/mobile-plan.tsx` | Indent child rows if the desktop matrix does | R2 |
| `components/category-manager.tsx` | Nest children if still used | R2 |
| `tests/unit/category-tree.test.ts` | Filter ids, path, rollup | R1, R4, R5 |
| `tests/unit/validation.test.ts` | parentId on category schema if added | R2 |
| `vitest.waterfall.config.ts` | Include `category-tree` tests | R1, R4, R5 |
| `progress/current.md` | Log | — |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `lib/category-tree.ts` | Pure tree/filter/rollup | R1, R4, R5 |
| `tests/unit/category-tree.test.ts` | Unit tests | R1, R4, R5 |
| `prisma/migrations/20260923021000_category_parent/migration.sql` | Schema | R1 |
| `specs/expense-subcategories/*` | This package | — |

## Data and control flow

```
Category
  parent (parentId = null)     e.g. Subscriptions
    child                      e.g. TV, AI
Expense.categoryId → parent (General) or child

Filter parent  → categoryId IN (parent, children)
Filter child   → categoryId = child
Donut default  → group by root(parent or self)
```

Invariant: `parent.parentId` is always null. `resolveCategoryId` / create reject a parent that is itself a child.

Delete: child with expenses → archive message (existing). Parent with children → “Remove or archive subcategories first.”

## Validation and failure handling

- Name unique per user (existing unique). Duplicate “AI” under a second parent is rejected — owner uses “AI subscriptions”.
- Missing FX unchanged (null totals).
- Missing `parentId` on create → root.

## Security, privacy, accessibility, and performance

- Parent fetch: `findFirst({ where: { id, userId, parentId: null } })`.
- Dropdown buttons have `aria-expanded` / `aria-haspopup`. Mobile uses a labeled `<select>`.
- One extra `parentId` column; no N+1 if categories are loaded once per page.

## Dependencies

Prisma schema change **approved** in this spec (`Category.parentId` only). No new npm packages.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Hardcode TV / AI / protein | Rejected | Owner creates names |
| Separate Subcategory model | Rejected | Same Category row + `parentId` is enough |
| Unique `(userId, parentId, name)` | Rejected for v1 | Postgres NULL uniqueness is awkward; keep `(userId, name)` |
| Three+ levels | Out of scope | Owner asked for main + types |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | schema + `category-tree` |
| R2 | plan actions + nested Plan UI |
| R3 | picker + `resolveCategoryId` |
| R4 | `categoryFilterIds` + ExpensesTable |
| R5 | snapshot parentId + rollup helper |
| R6 | existing `userId` / `requireUserId` |
