# Tasks: Received savings and Overview accounts

## Implementation checklist

- [ ] T1 — Leftover math: received − charged − planning; 70% of leftover; ≤ 0 gate
  - Files: `lib/waterfall.ts`, `tests/unit/waterfall.test.ts`
  - Requirements: R2, R3, R1
  - Preconditions: Human-approved spec; branch `cursor/received-savings-accounts-ef43`
  - Expected evidence: `computeWaterfall` (or a helper it calls) takes received, charged, and planning minor amounts. Leftover = `max(0, received − charged − planning)`. Leftover ≤ 0 → leftover, lifetime take, post-lifetime, and project take are 0. Lifetime take = `percentOf(leftover, 70)` when leftover > 0, never 70% of gross received when reserves exist. `LIFETIME_SAVINGS_PERCENT` remains 70. Input type no longer uses `plannedIncomeMinor`. Existing floor and project 1–70 cap cases still pass under the new names.

- [ ] T2 — Scope loaders: received-only income; Planning expense reserve
  - Files: `lib/queries/waterfall-scope.ts`
  - Requirements: R1, R2, R5, R9, R10
  - Preconditions: T1
  - Expected evidence: `incomeForScope` queries `planned: false` only; no planned-first fallback. Planning expenses use `completed: false` and the same date bounds as `expensesForScope`. `getScopeAmounts` returns received, charged, and planning (null if FX missing). `materializeHalfWaterfall` uses the new leftover; still skips on null legs; still `userId`-scoped upserts. Empty received → `0`, not planned income.

- [ ] T3 — Overview, Savings, and Projects consume the new scope fields
  - Files: `lib/queries/overview.ts`, `lib/queries/savings.ts`, `lib/queries/projects.ts`
  - Requirements: R4, R1, R3
  - Preconditions: T1, T2
  - Expected evidence: Every `computeWaterfall` / `plannedIncomeMinor` call site in these files uses the new inputs. Overview Saved remains month `lifetimeTake`. Earned stays received; Spent stays charged. Savings leftover / take / post-lifetime and Projects expected take / projections follow the new leftover.

- [ ] T4 — Derived Main and Savings accounts
  - Files: `lib/queries/accounts.ts` (or helper beside `getLifetimeSavingsBalance`), `lib/queries/overview-dashboard.ts`
  - Requirements: R6, R8, R10
  - Preconditions: T2 (lifetime balance already exists)
  - Expected evidence: Savings = `getLifetimeSavingsBalance`. Total cash = Balance `currentBalance` (starting + all received − all charged) or the same filters as `lib/queries/balance.ts`. Main = Total cash − Savings. `userId` on every query. Null if a needed rate is missing. `getBalanceSeries` math unchanged. Dashboard returns the pair for Overview.

- [ ] T5 — Overview account cards (desktop + mobile)
  - Files: `components/overview/account-cards.tsx` (or equivalent in `kpi-cards.tsx`), `app/(app)/page.tsx`, `components/overview/mobile-overview.tsx`, `components/overview/kpi-cards.tsx`
  - Requirements: R7, R6
  - Preconditions: T4
  - Expected evidence: Labels **Main account** and **Savings account** on `md:hidden` and `md+`. Optional hint about received salary and reserved bills, consistent on both viewports if shown. No MoM on accounts. Monthly KPIs remain Earned / Spent / Saved / Remaining. Lifetime savings KPI / mobile lifetime footer not shown beside Savings account.

- [ ] T6 — Savings explainer copy (received + reserved bills)
  - Files: `app/(app)/savings/page.tsx`, `components/savings/mobile-savings.tsx`
  - Requirements: R4
  - Preconditions: T3
  - Expected evidence: Copy no longer says leftover / 70% take comes from **planned income**. Wording matches received salary after reserved / Planning bills. No Savings layout redesign.

- [ ] T7 — Aggregation tests that assert Overview Saved / leftover
  - Files: `tests/unit/aggregations.test.ts`
  - Requirements: R4, R1
  - Preconditions: T3
  - Expected evidence: Overview Saved/remaining (and any leftover assertions) match received − charged − planning leftover and 70% take. Planned seed income does not inflate Saved. Skip this task only if those tests already match without edits (document in the handoff).

- [ ] T8 — From planned salary display
  - Files: `lib/waterfall.ts` (helper), `lib/queries/waterfall-scope.ts`, `lib/queries/overview.ts`, `components/overview/account-cards.tsx`, `app/(app)/page.tsx`, `components/overview/mobile-overview.tsx`, `lib/queries/savings.ts`, `app/(app)/savings/page.tsx`, `components/savings/mobile-savings.tsx`, `tests/unit/waterfall.test.ts`
  - Requirements: R11
  - Preconditions: T1, T2, T5
  - Expected evidence: `fromPlanned = combinedTake − actualTake`. Overview shows **From planned salary**. Figure is not materialized into Savings. Unit case covers the subtract formula.

- [ ] T9 — Record handoff in progress log
  - Files: `progress/current.md`
  - Requirements: — (process)
  - Preconditions: T1–T8 done (T7 N/A documented if skipped)
  - Expected evidence: Handoff `IMPLEMENTED` for `received-savings-accounts`

## Verification

- [ ] TV1 — Automated: leftover / gate / 70% unit tests
  - Covers: R1, R2, R3
  - Command: `npx vitest run tests/unit/waterfall.test.ts` (or `vitest.waterfall.config.ts` if that is the documented isolated target)
  - Expected result: Leftover uses received − charged − planning. Leftover ≤ 0 → lifetime take 0. 70% of leftover with floor. At least one case where take ≠ 70% of gross received. Project cap still holds. All cases in that file pass.

- [ ] TV2 — Automated: aggregations that touch Overview Saved (when T7 applies)
  - Covers: R4, R1
  - Command: `npx vitest run tests/unit/aggregations.test.ts`
  - Expected result: Saved/remaining match the new leftover. Planned income in the seed does not count as waterfall income. If this file cannot run here (Prisma globalSetup / missing Postgres), record that and rely on TV1 + code review.

- [ ] TV3 — Manual: planned income does not save
  - Covers: R1, R4, R5, R9
  - Expected result: Month with only **Planned (not yet received)** income → Overview Saved and Savings lifetime take are 0 (after Refresh if needed). Uncheck Planned → leftover can become positive if bills are covered. Income checkbox still present.

- [ ] TV4 — Manual: Planning bills block the lifetime take
  - Covers: R2, R3, R4
  - Expected result: Received salary plus Planning expenses larger than leftover → Saved / lifetime take 0. Reduce or charge the Planning bill so leftover > 0 → take = floor(70% of leftover), not 70% of gross salary.

- [ ] TV5 — Manual: Overview accounts + Balance identity
  - Covers: R6, R7, R8
  - Expected result: Desktop and mobile show **Main account** and **Savings account**. Savings equals lifetime balance. Main + Savings = Balance Current balance. Planning-only expense does not change Main. Balance has no second account pair. Current balance / running series still received − charged from starting.

- [ ] TV6 — Code review: auth, schema, dependencies, materialize, Balance
  - Covers: R5, R8, R9, R10
  - Expected result: `requireUserId` + `userId` on changed queries/upserts; `prisma/schema.prisma` unchanged; `package.json` dependencies unchanged; no secrets; income planned checkbox unchanged; `incomeForScope` has no planned fallback; `balance.ts` filters and running math unchanged; materialize uses the new leftover via existing rematerialize path.

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R2, R3 |
| T2 | R1, R2, R5, R9, R10 |
| T3 | R1, R3, R4 |
| T4 | R6, R8, R10 |
| T5 | R6, R7 |
| T6 | R4 |
| T7 | R1, R4 |
| T8 | R11 |
| T9 | — |
| TV1 | R1, R2, R3 |
| TV2 | R1, R4 |
| TV3 | R1, R4, R5, R9 |
| TV4 | R2, R3, R4 |
| TV5 | R6, R7, R8 |
| TV6 | R5, R8, R9, R10 |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
