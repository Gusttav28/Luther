# Tasks: Main cash leftover and Overview cards

## Implementation checklist

- [ ] T1 — Leftover helper: Main − remaining Planning, 70% floor, ≤ 0 gate
  - Files: `lib/waterfall.ts`, `tests/unit/waterfall.test.ts`
  - Requirements: R4, R5, R8
  - Preconditions: Human-approved spec; branch `cursor/main-cash-planned-savings-ef43`
  - Expected evidence: leftover ignores received and charged. Canonical main 100_000 / planning 40_000 → leftover 60_000, take 42_000. Planning 100_000 or 120_000 vs main 100_000 → take 0. Take ≠ 70% of Main. Existing `percentOf` / 70 constant reused.

- [ ] T2 — Scope + materialize once per month
  - Files: `lib/queries/waterfall-scope.ts`
  - Requirements: R4, R5, R6, R8
  - Preconditions: T1
  - Expected evidence: `waterfallFromScope` (or replacement) uses converted Main cash + `planningExpensesMinor`. H1+H2 waterfall amounts for a month sum to one `lifetimeTake`. `userId` retained. Received/charged not leftover inputs.

- [ ] T3 — Overview Main / Savings take / Planned expenses loaders
  - Files: `lib/queries/accounts.ts`, `lib/queries/overview.ts`, `lib/queries/overview-dashboard.ts`
  - Requirements: R1, R2, R3, R5, R6
  - Preconditions: T1, T2
  - Expected evidence: Main = opening or Settings starting. Savings card amount = month take. Planned expenses = remaining Planning. Overview `saved` = same take. No from-planned on Overview figures used by cards.

- [ ] T4 — Overview UI cards
  - Files: `components/overview/account-cards.tsx`, `app/(app)/page.tsx`, `components/overview/mobile-overview.tsx`
  - Requirements: R1, R2, R3, R4
  - Preconditions: T3
  - Expected evidence: Labels **Main account**, **Savings account**, **Planned expenses**. Hint that 70% is saved only if Main covers remaining planned expenses. Desktop + mobile. No From planned salary.

- [ ] T5 — Balance Savings month lines
  - Files: `components/balance/account-section.tsx` (and page data if needed)
  - Requirements: R7
  - Preconditions: T1, T3
  - Expected evidence: No From planned salary. Month take/leftover from T1 helpers.

- [ ] T6 — Tests that encoded old leftover
  - Files: `tests/unit/account-breakdown.test.ts`, `tests/unit/aggregations.test.ts`, `tests/unit/overview-dashboard.test.ts` as needed
  - Requirements: R4, R5, R6
  - Preconditions: T1–T3
  - Expected evidence: No test still asserts received−charged−planning leftover or Overview from-planned identity.

- [ ] T7 — `progress/current.md` handoff **IMPLEMENTED**
  - Files: `progress/current.md`
  - Requirements: — (process)

## Verification

- [ ] TV1 — `npx vitest run tests/unit/waterfall.test.ts --config vitest.waterfall.config.ts`
  - Covers: R4, R5, R8
  - Expected result: Gate and 70%-of-leftover cases pass.

- [ ] TV2 — Overview/aggregations unit tests that still run without Postgres, plus those with DB if `DATABASE_URL` exists
  - Covers: R1, R5, R6
  - Expected result: Saved = new take; fixtures updated. Record skip if Postgres missing.

- [ ] TV3 — Manual: Overview Main equals Balance Main (typed 73,233)
  - Covers: R1
  - Expected result: Same amount both places.

- [ ] TV4 — Manual: Planned expenses and cannot-save
  - Covers: R2, R4, R5
  - Expected result: Planning remaining shown. If Planning ≥ Main, Savings take 0. If Planning < Main, Savings = 70% of difference. Charging a Planning row lowers Planned expenses and can raise take.

- [ ] TV5 — Manual: From planned salary gone; series unchanged
  - Covers: R3, R7
  - Expected result: No that label on Overview. Balance Current still Total cash series.

- [ ] TV6 — Code review: no double month take, charged not in leftover, no new deps, `userId`
  - Covers: R6, R8, R9

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R4, R5, R8 |
| T2 | R4, R5, R6, R8 |
| T3 | R1, R2, R3, R5, R6 |
| T4 | R1, R2, R3, R4 |
| T5 | R7 |
| T6 | R4, R5, R6 |
| T7 | — |
| TV1 | R4, R5, R8 |
| TV2 | R1, R5, R6 |
| TV3 | R1 |
| TV4 | R2, R4, R5 |
| TV5 | R3, R7 |
| TV6 | R6, R8, R9 |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
