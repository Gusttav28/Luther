# Tasks: Overview breakdown category select

## Implementation checklist

- [ ] T1 — Pure helpers + tests
  - Files: `lib/category-spend.ts`, `tests/unit/category-spend.test.ts`, `vitest.waterfall.config.ts`
  - Requirements: R1, R2
  - Expected evidence: one/two/none/null selected totals; parent children include General + TV/AI.

- [ ] T2 — Dashboard attaches children
  - Files: `lib/queries/overview-dashboard.ts`
  - Requirements: R2, R3
  - Expected evidence: `spentByCategory.categories[].children` filled from user categories + snapshot expenses.

- [ ] T3 — Breakdown UI
  - Files: `components/overview/spent-by-category.tsx`
  - Requirements: R1, R2
  - Expected evidence: selectable rows/chips; headline follows selection; 500ms hold / contextmenu popover; hold does not toggle.

- [ ] T4 — Implementation log
  - Files: `progress/current.md`

## Verification

- [ ] TV1 — `npx vitest run tests/unit/category-spend.test.ts --config vitest.waterfall.config.ts`
- [ ] TV2 — Browser: tap one, tap two, deselect, long-press Subscriptions
- [ ] TV3 — no new packages / no schema / `userId` on category load

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R2 |
| T2 | R2, R3 |
| T3 | R1, R2 |
| T4 | R1–R3 |
