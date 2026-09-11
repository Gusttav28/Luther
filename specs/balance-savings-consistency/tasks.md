# Tasks: Savings leftover everywhere and Balance month compare

## Implementation checklist

- [ ] T1 — Balance Savings headline = leftover take
  - Files: `lib/queries/accounts.ts`, `components/balance/account-section.tsx` as needed
  - Requirements: R1
  - Preconditions: Human-approved spec; branch `cursor/balance-savings-consistency-ef43`
  - Expected evidence: `balanceMinor` for SAVINGS is current-month `lifetimeTakeMinor`. `getSavingsAllTimeMinor` is not used for that headline. Overview and Balance Savings match when rates exist.

- [ ] T2 — Savings page leftover copy; remove From planned salary
  - Files: `lib/queries/savings.ts`, `app/(app)/savings/page.tsx`, `components/savings/mobile-savings.tsx`
  - Requirements: R2
  - Preconditions: T1 leftover helper already on `waterfallFromScope`
  - Expected evidence: No From planned salary. 70% take = leftover take. Copy is Main after remaining Planning.

- [ ] T3 — Accounts first on Balance
  - Files: `app/(app)/balance/page.tsx`, `components/balance/mobile-balance.tsx`
  - Requirements: R3
  - Preconditions: —
  - Expected evidence: After the title, Accounts (cards + add) render first on desktop and mobile.

- [ ] T4 — Remove half-month running UI
  - Files: `app/(app)/balance/page.tsx`, `components/balance/mobile-balance.tsx`
  - Requirements: R4
  - Preconditions: T3
  - Expected evidence: No running-balance line chart, no half-month income/expense chart, no half-month table/accordion. `getBalanceSeries` used only for Starting/Current if those cards remain.

- [ ] T5 — Month Spent / Saved table
  - Files: `lib/queries/balance-months.ts` or `lib/queries/balance.ts`, Balance desktop + mobile
  - Requirements: R5
  - Preconditions: T1
  - Expected evidence: Rows Month / Spent / Saved. Current Saved = leftover take. Past Saved = waterfall sum for that month. `userId` retained.

- [ ] T6 — Tests
  - Files: `tests/unit/balance-months.test.ts`, `tests/unit/account-breakdown.test.ts` as needed
  - Requirements: R1, R5
  - Preconditions: T1, T5
  - Expected evidence: Spent/saved composition tests; no test asserts Balance Savings = opening + lifetime.

- [ ] T7 — `progress/current.md` handoff **IMPLEMENTED**
  - Files: `progress/current.md`
  - Requirements: — (process)

## Verification

- [ ] TV1 — `npx vitest run --config vitest.waterfall.config.ts` plus new month tests
  - Covers: R1, R5
  - Expected result: Leftover take cases still pass; month row cases pass.

- [ ] TV2 — Manual: create Savings
  - Covers: R1
  - Expected result: Card amount equals Overview Savings (this month’s take), not a lifetime lump.

- [ ] TV3 — Manual: Balance layout and table
  - Covers: R3, R4, R5
  - Expected result: Accounts at top. No half-month running table. Months show spent vs saved.

- [ ] TV4 — Manual: Savings page
  - Covers: R2
  - Expected result: No From planned salary; 70% take matches Overview.

- [ ] TV5 — Code review: no new deps, `userId`, charged not in leftover
  - Covers: R6

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1 |
| T2 | R2 |
| T3 | R3 |
| T4 | R4 |
| T5 | R5 |
| T6 | R1, R5 |
| T7 | — |
| TV1 | R1, R5 |
| TV2 | R1 |
| TV3 | R3, R4, R5 |
| TV4 | R2 |
| TV5 | R6 |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
