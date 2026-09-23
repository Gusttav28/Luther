# Current implementation progress

- Work item: overview-category-select (`specs/overview-category-select/`)
- Branch: `cursor/overview-category-select-ef43`
- Spec package: 2026-09-23
- Human approval: owner request 2026-09-23 (selectable Breakdown totals + long-press subcategories)
- Implementer session: 2026-09-23
- Handoff: **IMPLEMENTED**

## Outcome

Overview Breakdown / Spent by category: tap to select and sum those parents; press-and-hold (or right-click) floats subcategory amounts.

## Files

- `lib/category-spend.ts` — selected sum + attach children
- `lib/queries/overview-dashboard.ts` — load categories (`userId`), attach children
- `components/overview/spent-by-category.tsx` — selection + popover
- `tests/unit/category-spend.test.ts`

## Verification

- TV1: `npx vitest run tests/unit/category-spend.test.ts --config vitest.waterfall.config.ts` — **6 passed**. `tsc --noEmit` clean.
- TV2: owner/browser
- TV3: no new packages / no schema
