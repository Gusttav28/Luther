# Current implementation progress

- Work item: balance-savings-consistency (`specs/balance-savings-consistency/`)
- Branch: `cursor/balance-savings-consistency-ef43`
- Spec package: 2026-09-11
- Human approval: **GO** 2026-09-11
- Handoff: **IMPLEMENTED** (amendment in progress: remove Starting/Current; Spent = Overview charged)
- Review: prior **APPROVED**; re-review needed after this amendment

## Outcome

Balance and Overview Savings headlines are this month’s leftover take. Creating Savings no longer shows opening + lifetime. Savings page leftover/take uses Main − remaining Planning; From planned salary is gone. Balance Accounts sit at the top. Half-month running table/charts are gone. Month table compares Spent vs Saved (newest first).

## Tasks

- T1 Balance Savings headline = leftover take
- T2 Savings page leftover copy; drop From planned salary
- T3 Accounts first on Balance
- T4 Remove half-month running UI
- T5 Month Spent / Saved table
- T6 Tests
- T7 this handoff

## Verification

- TV1: `npx vitest run --config vitest.waterfall.config.ts` — 56 passed.
- TV2–TV4: not run against a live household in this environment (no owner session).
- TV5: no new npm packages or Prisma models; month loader and account queries stay `userId`-scoped; leftover still omits charged.

## Notes

Independent Reviewer **APPROVED**. Live TV2–TV4 walkthrough was not run. Waiting for owner completion.
