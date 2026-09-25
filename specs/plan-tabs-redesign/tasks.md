# Tasks: Plan Month / Year / Totals redesign

## Implementation checklist

- [ ] T1 — Group helper + tests
  - Files: `lib/plan-groups.ts`, `tests/unit/plan-groups.test.ts`, `vitest.waterfall.config.ts`
  - Requirements: R3, R4
  - Preconditions: human-approved spec
  - Expected evidence: tests for parent + children month sum, year total, null propagation, parent without children, orphan child

- [ ] T2 — Move-under action
  - Files: `app/(app)/plan/actions.ts`, `lib/validation.ts`, `app/(app)/plan/plan-forms.tsx`
  - Requirements: R6, R8
  - Preconditions: T1 not required
  - Expected evidence: move to parent, move back to main, reject self / non-parent / category with children

- [ ] T3 — Plan board
  - Files: `components/plan/plan-board.tsx`
  - Requirements: R1, R2, R3, R4, R5, R7
  - Preconditions: T1
  - Expected evidence: header, tabs, pills, collapsible groups starting collapsed, Year bars, Totals bars + year total

- [ ] T4 — Page wiring and cleanup
  - Files: `app/(app)/plan/page.tsx`, remove `components/plan/mobile-plan.tsx`
  - Requirements: R7, R8
  - Preconditions: T3
  - Expected evidence: no charts or matrix table; `requireUserId` kept

## Verification

- [ ] TV1 — `npx vitest run tests/unit/plan-groups.test.ts --config vitest.waterfall.config.ts`
  - Covers: R3, R4
  - Expected result: all pass
- [ ] TV2 — `npm run typecheck` and `npm run lint`
  - Covers: all
  - Expected result: clean
- [ ] TV3 — Browser walkthrough at 360 px and 1280 px: tabs, pills, expand Subscriptions, edit a plan cell, move a category under Subscriptions
  - Covers: R1–R7
  - Expected result: matches screenshots; no horizontal page scroll at 360 px
- [ ] TV4 — Diff hygiene
  - Covers: R8
  - Expected result: no schema / migration / package / secret changes

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R3, R4 |
| T2 | R6, R8 |
| T3 | R1, R2, R3, R4, R5, R7 |
| T4 | R7, R8 |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
