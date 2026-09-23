# Current implementation progress

- Work item: expense-subcategories (`specs/expense-subcategories/`)
- Branch: `cursor/expense-subcategories-ef43`
- Spec package: 2026-09-23
- Human approval: owner request 2026-09-23 (subcategories under Expenses + table dropdown)
- Implementer session: 2026-09-23
- Handoff: **IMPLEMENTED**
- Review: **APPROVED** (`reviews/expense-subcategories/review.md`); TV2 owner/browser still open
- PR: GitHub rejected `create_pr` (`must be a collaborator`). Branch is pushed.

## Outcome

Expense categories can have one level of subcategories. The Expenses table shows general spend on a parent (Subscriptions, Supermarkets) and a dropdown/optgroup for each child (TV, AI, protein). Composition and Overview roll up to the parent.

## Files changed

### T1 — Schema and helper

- `prisma/schema.prisma` — `Category.parentId`
- `prisma/migrations/20260923021000_category_parent/migration.sql`
- `lib/category-tree.ts`
- `tests/unit/category-tree.test.ts`
- `vitest.waterfall.config.ts`

### T2 — Resolve / actions

- `lib/category-resolve.ts` — optional parent on create-by-name
- `lib/validation.ts` — optional `parentId`
- `app/(app)/plan/actions.ts` — create under parent; block delete parent with children
- `app/(app)/expenses/actions.ts` — pass `parentId` into resolve

### T3 — Queries

- `lib/queries/expenses.ts` — parent filter includes children; path label
- `lib/queries/overview.ts` / `overview-dashboard.ts` — roll spent-by-category to parent
- `lib/queries/plan.ts` — `parentId`, parent-then-children sort

### T4 — Expenses UI

- `components/category-picker.tsx` — parent + General / child / new subcategory
- `app/(app)/expenses/expenses-table.tsx` — chip dropdown + mobile optgroups
- `app/(app)/expenses/page.tsx` — donut rollup
- `app/(app)/expenses/expense-forms.tsx` — `Parent · Child` path

### T5 — Plan / manager

- `app/(app)/plan/plan-forms.tsx` — Under parent selector
- `app/(app)/plan/page.tsx`, `components/plan/mobile-plan.tsx` — indent children
- `components/category-manager.tsx` — nest children

### T6 — this file

## Verification

- TV1: `npx vitest run tests/unit/category-tree.test.ts tests/unit/validation.test.ts --config vitest.waterfall.config.ts` — **31 passed**. `tsc --noEmit` clean.
- TV2: browser walkthrough after deploy (create parent/children, general vs child filter).
- TV3: no new npm packages; schema is `parentId` only; queries stay `userId`-scoped.

## Notes for Reviewer

- Names stay unique per user. Owner picks “AI subscriptions” vs a second “AI”.
- Existing categories become parents (`parentId` null).
- Materialize / leftover math unchanged.
