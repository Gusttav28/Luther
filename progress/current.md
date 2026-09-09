# Current implementation progress

- Work item: main-cash-planned-savings (`specs/main-cash-planned-savings/`)
- Branch: `cursor/main-cash-planned-savings-ef43`
- Spec package: 2026-09-09 (amended same day: Already charged reduces Main)
- Human approval: **GO** 2026-09-09
- Handoff: **IMPLEMENTED**

## Outcome

Overview Main is stored Main cash. Charging an expense subtracts from Main (`7_323_300 − 1_000_000 → 6_323_300`). Leftover is `max(0, current Main − remaining Planning)`; 70% of leftover is the month take (H1 waterfall row; H2 is 0). Overview cards: Main, Savings (month take), Planned expenses.

## Tasks

- T1 leftover helper + waterfall tests
- T2 scope + materialize once per month
- T3 Overview loaders
- T4 Overview UI cards
- T5 Balance Savings month lines
- T6 leftover-encoding tests
- T8 charge/un-charge applies converted delta to Main
- T7 this handoff

## Verification

- TV1: `npx vitest run --config vitest.waterfall.config.ts` — 48 passed (waterfall, breakdown, main-cash, overview-dashboard, validation).
- TV2: default `vitest.config.ts` aggregations **skipped** — Postgres at `127.0.0.1:5432` unreachable (`P1001`).
- TV3–TV5: not run against a live household in this environment (no owner session / seed of ₡73,233).
- TV6: leftover helper has two inputs (Main, Planning); charged not subtracted again; no new npm packages or Prisma models; expense Main writes scoped by `userId` + `kind = MAIN`.

## Notes

Independent Reviewer first verdict was **CHANGES_REQUESTED** (`reviews/main-cash-planned-savings/review.md`): `setExpenseCompletedAction` persisted a charge when convert returned null. Fixed: toggle aborts when status would change and convert is missing (`cannotApplyChargeToggle`). Waiting for re-review.
