# Tasks: Expense subcategories

## Implementation checklist

- [ ] T1 — Schema and tree helper
  - Files: `prisma/schema.prisma`, `prisma/migrations/20260923021000_category_parent/migration.sql`, `lib/category-tree.ts`, `tests/unit/category-tree.test.ts`, `vitest.waterfall.config.ts`
  - Requirements: R1, R4, R5
  - Expected evidence: `parentId` nullable FK. Tests: parent filter includes children; child filter is itself; rollup parent+child; reject treating a child as a parent in helpers.

- [ ] T2 — Resolve, validate, actions
  - Files: `lib/category-resolve.ts`, `lib/validation.ts`, `app/(app)/plan/actions.ts`
  - Requirements: R2, R3, R6
  - Expected evidence: create with `parentId` under a same-user root. Create without `parentId` is a root. Delete parent with children errors. All writes `userId`-scoped.

- [ ] T3 — Queries
  - Files: `lib/queries/expenses.ts`, `lib/queries/overview.ts`, `lib/queries/overview-dashboard.ts`, `lib/queries/plan.ts`
  - Requirements: R4, R5
  - Expected evidence: `getExpenses` uses `categoryFilterIds`. Snapshot + spent-by-category roll up to parent. Plan rows carry `parentId` and sort parent then children.

- [ ] T4 — Expenses UI
  - Files: `components/category-picker.tsx`, `app/(app)/expenses/expenses-table.tsx`, `app/(app)/expenses/page.tsx`, `app/(app)/expenses/expense-forms.tsx`
  - Requirements: R3, R4, R5
  - Expected evidence: picker parent + General/child. Table parent chip + child dropdown; mobile optgroups. Path label on rows. Donut rolled up (or child slices when parent-filtered).

- [ ] T5 — Plan / manager UI
  - Files: `app/(app)/plan/plan-forms.tsx`, `app/(app)/plan/page.tsx`, `components/plan/mobile-plan.tsx`, `components/category-manager.tsx`
  - Requirements: R2
  - Expected evidence: add subcategory under a parent; child rows indented.

- [ ] T6 — Implementation log
  - Files: `progress/current.md`
  - Requirements: all

## Verification

- [ ] TV1 — `npx vitest run tests/unit/category-tree.test.ts --config vitest.waterfall.config.ts`
  - Covers: R1, R4, R5
  - Expected result: pass

- [ ] TV2 — Browser: create Subscriptions → TV + AI; add expenses; parent filter shows both; child filter shows one; path label
  - Covers: R2–R4
  - Expected result: general + dropdown behave as specified

- [ ] TV3 — Diff hygiene
  - Covers: R6
  - Expected result: no new npm packages; only `parentId` schema; no secrets

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R4, R5 |
| T2 | R2, R3, R6 |
| T3 | R4, R5 |
| T4 | R3, R4, R5 |
| T5 | R2 |
| T6 | R1–R6 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No hardcoded streaming/AI vendor names.
- [ ] Required tests/checks are defined.
