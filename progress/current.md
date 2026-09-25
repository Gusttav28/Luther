# Current implementation progress

- Work item: plan-tabs-redesign (`specs/plan-tabs-redesign/`)
- Branch: `cursor/plan-tabs-redesign-ef43`
- Spec package: 2026-09-24
- Human approval: owner "go" 2026-09-24
- Implementer session: 2026-09-24
- Handoff: **IMPLEMENTED**

## Outcome

Plan is one board on mobile and desktop: year switcher, month budget / spent header, Month / Year / Totals tabs, month pills. Parents with subcategories are collapsible (start collapsed) with the group total beside the name. Charts and the old matrix table are gone. Categories can be moved under a main category ("Move under" in the row ⋯ menu).

## Files

- `lib/plan-groups.ts` — `groupPlanRows`, `sumNullable`
- `tests/unit/plan-groups.test.ts` (+ `vitest.waterfall.config.ts`)
- `components/plan/plan-board.tsx` — new board
- `app/(app)/plan/page.tsx` — renders `PlanBoard` only
- `app/(app)/plan/actions.ts` — `setCategoryParentAction`
- `app/(app)/plan/plan-forms.tsx` — `MoveCategoryForm` in `CategoryRowActions`; `PlanCellInput` `inputClassName` replaces size classes, optional `ariaLabel`
- `lib/validation.ts` — `categoryMoveSchema`
- Removed `components/plan/mobile-plan.tsx`

## Verification

Run from a `/tmp` copy of the repo because the project folder is on iCloud Drive and many files (including `node_modules`) are offloaded; tools hang reading them in place.

- TV1: `npx vitest run --config vitest.waterfall.config.ts` — 11 files, **82 passed** (placeholder `DATABASE_URL`/`DIRECT_URL`; no DB access).
- TV2: `npx tsc --noEmit` clean; `npx eslint .` 0 errors (1 existing warning in `components/balance/account-section.tsx`).
- TV3: browser walkthrough — pending (Vercel preview / owner).
- TV4: no schema, migration, package, or secret changes.
