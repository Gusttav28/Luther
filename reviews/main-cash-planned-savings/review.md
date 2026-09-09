# Review: Main cash leftover and Overview cards

- Work item: `main-cash-planned-savings`
- Branch: `cursor/main-cash-planned-savings-ef43`
- Approved spec: `specs/main-cash-planned-savings/` version 2026-09-09 (amended same day: Already charged reduces Main; owner **GO** 2026-09-09)
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED` (re-review after `4adcc89`)
- Review start: 2026-09-09
- Re-review: 2026-09-09 (fix commit `4adcc89`)
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/_template/review.md`
- `specs/main-cash-planned-savings/{requirements,design,tasks}.md` (complete, R1–R10 / T1–T8)
- `progress/current.md`
- Implementation vs spec tip: `git diff 2ea9801..HEAD` (spec commits `6ab45f6`, `2ea9801`; implementation `da20e6e`; handoff `b3f4d38`; first review `c9f849f`; R10 fix `4adcc89`)
- Authorized implementation / test files:
  - `lib/waterfall.ts`
  - `lib/queries/waterfall-scope.ts`
  - `lib/queries/accounts.ts`
  - `lib/queries/overview.ts`
  - `lib/queries/overview-dashboard.ts`
  - `lib/queries/main-cash.ts` (new)
  - `app/(app)/expenses/actions.ts`
  - `app/(app)/page.tsx`
  - `components/overview/account-cards.tsx`
  - `components/overview/mobile-overview.tsx`
  - `components/balance/account-section.tsx`
  - `tests/unit/waterfall.test.ts`
  - `tests/unit/account-breakdown.test.ts`
  - `tests/unit/main-cash.test.ts` (new)
  - `tests/unit/overview-dashboard.test.ts`
  - `tests/unit/aggregations.test.ts`
  - `vitest.waterfall.config.ts`
  - `progress/current.md`
- Out-of-scope confirmation (unchanged in `2ea9801..HEAD`):
  - `package.json` / `package-lock.json`
  - `prisma/schema.prisma`
  - `lib/queries/balance.ts` (running series still received − charged)
  - `app/(app)/balance/actions.ts` (`updateMainOpeningAction` writes the typed opening; no historical charged walk)
- Related readers (not rewritten this item; leftover now via `waterfallFromScope`):
  - `lib/queries/savings.ts`, `lib/queries/projects.ts`
- Savings page still shows **From planned salary** (`app/(app)/savings/page.tsx`, `components/savings/mobile-savings.tsx`) — allowed; R3/R7 apply to Overview and Balance Savings only.

Reviewer did not implement this work and did not edit application code or tests.

## Commands run

| Command | Result |
| --- | --- |
| `git diff 2ea9801..HEAD --stat` | PASS for scope. 18 files: leftover/materialize/Overview/Balance/expense Main-delta + unit tests + handoff. No `package.json` or Prisma schema in this item. |
| `git diff 2ea9801..HEAD -- package.json package-lock.json prisma/schema.prisma` | PASS; empty. |
| `npx vitest run --config vitest.waterfall.config.ts` (TV1, first review) | PASS; 5 files, **48 passed**. |
| `npx vitest run --config vitest.waterfall.config.ts` (TV1, re-review after `4adcc89`) | PASS; 5 files, **49 passed** (includes abort-toggle-when-convert-missing). |
| `npx tsc --noEmit` (first review and re-review) | PASS; exit 0. |
| Source inspection of leftover / materialize-once / Overview cards / charge delta | Leftover, month take, Overview/Balance cards: PASS. Create/update/delete no-partial: PASS. Toggle convert-fail: FAIL on first review; PASS after `4adcc89`. |
| `git show 4adcc89` (re-review scope) | PASS. Touches `expenses/actions.ts`, `lib/queries/main-cash.ts`, `tests/unit/main-cash.test.ts`, `progress/current.md` only. No leftover/card/materialize regressions. |
| Secrets scan of `2ea9801..HEAD` | PASS. Only hit is `AUTH_SECRET: "test-secret-not-used-in-production"` in `vitest.waterfall.config.ts` (dummy test env, not a credential). |

TV2 official aggregations (default `vitest.config.ts` / Postgres) were not run. TV3–TV5 live ₡73,233 household walkthrough was not run. Reviewer did not invent browser evidence.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Overview and Balance Main show the typed cash | PASS (code; TV3 not run) | `getDerivedAccounts` sets `mainAccountMinor` from `scope.mainCashMinor` (`accounts.ts` 41–42). That value is `getMainCashMinor` → `loadMainCashStore`: MAIN `openingMinor` or Settings `startingBalanceMinor` (else 0), converted with `sumInCurrency` (`waterfall-scope.ts` 126–136; `main-cash.ts` 64–94). Not Total cash − Savings. Overview desktop + mobile pass `accounts.mainAccountMinor` into `AccountCards`. Balance Main card still renders stored `openingMinor` (`account-section.tsx` 49). Charge events rewrite that opening (R10). No MAIN + starting 0 → store opening 0. Missing FX → `sumInCurrency` null → `Money` “—”, not coerced to 0. Live Overview = Balance ₡73,233 remains TV3. |
| R2 — Overview Planned expenses is remaining Planning this month | PASS (code; TV4 not run) | Third card value is `planningExpensesMinor` from `getScopeAmounts(..., "BOTH")` (`accounts.ts` 44; `overview.ts` 219). Loader sums `completed: false` in the calendar month (`waterfall-scope.ts` 106–123, 29–31). Charged rows excluded. Empty Planning → 0. Missing FX → null. Label exactly **Planned expenses**. |
| R3 — Remove From planned salary on Overview | PASS (code; TV5 not run) | `account-cards.tsx` third card is **Planned expenses** (desktop `field-label`, compact footer). `page.tsx` / `mobile-overview.tsx` pass `plannedExpensesMinor`, not `plannedSalaryTakeMinor`. Grep of `components/overview/` and `app/(app)/page.tsx`: no “From planned salary”. Savings page still has that label (out of R3). |
| R4 — Cannot save unless Main covers remaining planned expenses | PASS (code + TV1) | `leftoverAfterPlannedBills` = `max(0, main − planning)`. Main 100_000 / planning 100_000 or 120_000 → leftover 0, take 0, project 0 (`waterfall.test.ts`). `waterfallFromScope` returns null (skip materialize, no invented take) if `mainCashMinor` or `planningExpensesMinor` is null (`waterfall-scope.ts` 173–175). |
| R5 — 70% of leftover after planned expenses, not 70% of Main | PASS (code + TV1) | `lifetimeTake = percentOf(leftover, LIFETIME_SAVINGS_PERCENT)` with `LIFETIME_SAVINGS_PERCENT === 70` and existing floor `percentOf`. Canonical: main 100_000 / planning 40_000 → leftover 60_000, take 42_000, post 18_000; take `!== percentOf(100_000, 70)`. Empty Planning → leftover = Main. Overview Savings card = `wf.lifetimeTakeMinor` (`accounts.ts` 43). Overview `saved` = same month take (`overview.ts` 210). Received income is not a leftover input. |
| R6 — Materialize and monthly Saved use the new leftover | PASS (code) | `materializeMonthWaterfall` loads month `BOTH` once, then passes that `monthWaterfall` into both halves (`waterfall-scope.ts` 342–361). `materializeHalfWaterfall` writes `lifetimeTakeMinor` on H1 and `0` on H2 (same for project take) (`245–246`). Fallback without a precomputed month result still loads `"BOTH"`, then H1/H2 split, so independent per-half leftover cannot double-count Main. `safeMaterializeMonth` still swallows after the primary write. Overview Saved uses `monthWf.lifetimeTakeMinor`. |
| R7 — Balance Savings card follows the same leftover | PASS (code; TV5 not run) | `getCurrentMonthBreakdown` uses `waterfallFromScope` (Main + remaining Planning). `fromMain` = month take; `fromPlanned` hardcoded `0`; `leftoverHintMinor` = `postLifetimeMinor` (`accounts.ts` 153–158). Card lines: **This month (70%)** and **Leftover after save**; copy that 70% is of Main after remaining planned expenses (`account-section.tsx` 14–15, 110–125). No **From planned salary**. All-time Savings still opening + lifetime contributions. |
| R8 — Leftover does not subtract charged a second time | PASS (code + TV1) | `WaterfallInput` / `leftoverAfterPlannedBills` take only `mainCashMinor` and `remainingPlanningMinor`. `chargedExpensesMinor` is still loaded on `ScopeAmounts` but is not passed into `computeWaterfall`. TV1: helper arity 2; after Main is already 6_323_300, leftover with planning 0 is 6_323_300 (charged not subtracted again). |
| R9 — Auth, privacy, dependencies | PASS (code) | Expense actions and Overview/Balance loaders keep `requireUserId`. Scope queries include `userId`. Main store load is `where: { userId, kind: "MAIN" }`. Settings upsert is `where: { userId }`. Expense mutations use `id` + `userId`. `package.json` / Prisma schema unchanged in this item (no new npm packages or models). No secrets or financial dumps in the diff. Account opening update inside `applyMainCashDelta` uses the server-loaded MAIN id (not a client id). |
| R10 — Already charged reduces stored Main; un-charge restores it | PASS (code + TV1; first review CHANGES_REQUESTED, fixed in `4adcc89`) | Happy-path wiring: Planning→charged / create-as-charged subtract converted amount; un-charge and delete-charged add it back; amount edit while charged applies `old − new`; Planning create/delete/edit is 0 (`main-cash.ts` 39–56; `expenses/actions.ts`). Writes go to MAIN `openingMinor` and Settings `startingBalanceMinor` in one transaction; missing MAIN is created from current store then delta applied. Revalidate includes `/` and `/balance`. `updateMainOpeningAction` writes the typed opening only — no historical charged walk. Unit: `7_323_300 − 1_000_000 → 6_323_300`; un-charge restores. Create / update / delete abort when convert returns null. Toggle: `cannotApplyChargeToggle(was, will, converted)` is `was !== will && converted === null`; `setExpenseCompletedAction` returns before `updateMany` / `applyMainCashDelta` when that is true (`actions.ts` 130). Delta is computed only after a successful convert (`132–135`); `converted ?? 0` is gone. Unit: Planning→charged and charged→Planning with null abort; successful convert and same-status+null do not abort (`main-cash.test.ts` 40–45). |

## Design verdicts

- Preferred leftover API is implemented: `leftoverAfterPlannedBills(mainCash, remainingPlanning)` and `WaterfallInput` `{ mainCashMinor, remainingPlanningMinor }`. Received/charged are not leftover bases for take/materialize/Saved.
- `waterfallFromScope` null-checks Main and remaining Planning only (charged is not required for take).
- Month leftover is materialized once: H1 = take, H2 = 0. Project take follows the same once-per-month split.
- Overview cards: Main = stored opening; Savings = month take; Planned expenses = remaining Planning. From planned salary removed on Overview.
- Balance Savings month lines reuse the leftover helpers; no from-planned salary.
- Charge apply uses `convertMinor` via `convertToStoredMain` into the stored Main currency; Settings starting stays in lockstep.
- No historical backfill on Main Edit or on load.
- No new Prisma models, no new npm packages.
- `plannedSalaryTakeMinor` remains for the Savings page only (design-allowed).
- Toggle convert-failure now matches the design “no half-applied charge”: abort before persist when status would change and convert is null (`4adcc89`).

## Task/checkpoint verdicts

- T1: PASS. Leftover helper + waterfall tests; gate; 70% of leftover not of Main; charged omitted; `percentOf` / 70 reused. TV1 includes these cases.
- T2: PASS. `waterfallFromScope` uses converted Main + `planningExpensesMinor`. H1+H2 sum to one `lifetimeTake`. `userId` retained. Received/charged not leftover inputs.
- T3: PASS. Main = opening/starting; Savings card = month take; Planned expenses = remaining Planning; Overview `saved` = same take; no from-planned figures on Overview cards.
- T4: PASS. Labels **Main account**, **Savings account**, **Planned expenses**; hint that 70% is saved only if Main covers remaining planned expenses; desktop + mobile.
- T5: PASS. Balance Savings month lines use leftover take / post-lifetime; no From planned salary.
- T6: PASS (source). Aggregations July Saved updated from received leftover (`38_500_000`) to `70_000` (70% of Settings starting `100_000` with default-`completed` expenses, remaining Planning 0). Breakdown tests use Main leftover. Official TV2 not run (no Postgres).
- T8: PASS after `4adcc89` (was CHANGES_REQUESTED). Delta helper and create/update/delete paths match the signed table and the 7_323_300 − 1_000_000 case. Toggle convert-failure now aborts via `cannotApplyChargeToggle` before `updateMany` / Main write; unit coverage added.
- T7: PASS. `progress/current.md` records `IMPLEMENTED` for `main-cash-planned-savings`.
- TV1: PASS. First review 48 passed; re-review after fix **49 passed**.
- TV2: NOT RUN — Postgres aggregations not executed here (implementer already recorded `P1001`). Test source matches the new take (`70_000`), not received leftover.
- TV3: NOT RUN — no live owner session / ₡73,233 seed.
- TV4: NOT RUN — same. Charge→Main and cannot-save are present in code/unit tests; live Area Service walkthrough was not run.
- TV5: NOT RUN — same. Code has no Overview/Balance “From planned salary”; Balance series file was not changed this item.
- TV6: PASS after `4adcc89`. No double month take; charged not in leftover; no new deps; `userId` scoping; no historical charged backfill; convert failure does not persist a partial toggle.

## Findings

### RESOLVED — Toggle Already charged persists when convert fails (was HIGH)

- Requirement/design/task: R10 / T8 / TV6
- File: `app/(app)/expenses/actions.ts`, `lib/queries/main-cash.ts`, `tests/unit/main-cash.test.ts`
- Lines: helper `31–37`; action `125–144`; test `40–45`
- Observed on re-review (`4adcc89`): `cannotApplyChargeToggle` is true iff the completed flag would change and convert is null. `setExpenseCompletedAction` returns before `applyMainCashDelta` and `updateMany`. `converted ?? 0` is removed; delta is computed only when convert succeeded. Same-status submit with a null convert is a no-op persist of the existing flag (not a charge/un-charge). Fix commit does not touch leftover, Overview cards, or materialize.
- Expected: Abort the status change when convert returns null.
- Evidence: Independent TV1 re-run 49 passed, including “aborts a charge toggle when convert is missing”. `tsc --noEmit` exit 0. Create/update/delete no-partial paths unchanged.
- Required correction: None. First-review HIGH is closed.

### INFO — TV2 aggregations and TV3–TV5 live ₡73,233 walkthrough were not run

- Requirement/design/task: TV2 (R1/R5/R6), TV3 (R1), TV4 (R2/R4/R5/R10), TV5 (R3/R7)
- File: N/A (environment)
- Lines: N/A
- Observed: This environment has no reachable Postgres for the official aggregations suite and no owner session / household seed of ₡73,233. Reviewer did not invent browser evidence.
- Expected: Documented aggregations green with `DATABASE_URL`; Overview Main equals Balance Main at ₡73,233; charge Area Service ₡10,000 → Main ₡63,233 and Planned expenses down ₡10,000; toggle back restores; no “From planned salary” on Overview; Balance Current still the Total cash series.
- Evidence: `progress/current.md` already recorded TV2 skip (`P1001`) and TV3–TV5 not run. Code for those behaviors is present, including the R10 toggle abort after `4adcc89`. Aggregations source expects Saved `70_000` = 70% of starting `100_000` with remaining Planning 0, not the old received leftover.
- Required correction: None for the environment gap. Owner/CI with Postgres and a live session should still run TV2–TV5.

## Cleanup signal

- Durable spec package: `specs/main-cash-planned-savings/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/main-cash-planned-savings/review.md`
- Scratch context to reset: none. No application code or tests were edited by the Reviewer.

APPROVED -> reviews/main-cash-planned-savings/review.md
