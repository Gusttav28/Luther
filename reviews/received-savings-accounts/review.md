# Review: Received savings and Overview accounts

- Work item: `received-savings-accounts`
- Branch: `cursor/received-savings-accounts-ef43`
- Approved spec: `specs/received-savings-accounts/` version 2026-09-09 (owner **GO** on 2026-09-09, including R11 From planned salary)
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED`
- Review start: 2026-09-09
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/_template/review.md`
- `specs/received-savings-accounts/{requirements,design,tasks}.md` (complete, including R11)
- `progress/current.md`
- Diff vs `main` (`git diff main...HEAD --stat` / per-file diffs)
- Authorized implementation files:
  - `lib/waterfall.ts`
  - `lib/queries/waterfall-scope.ts`
  - `lib/queries/overview.ts`
  - `lib/queries/overview-dashboard.ts`
  - `lib/queries/accounts.ts` (new)
  - `lib/queries/savings.ts`
  - `lib/queries/projects.ts`
  - `components/overview/account-cards.tsx` (new)
  - `components/overview/kpi-cards.tsx`
  - `components/overview/mobile-overview.tsx`
  - `app/(app)/page.tsx`
  - `app/(app)/savings/page.tsx`
  - `components/savings/mobile-savings.tsx`
  - `tests/unit/waterfall.test.ts`
  - `tests/unit/aggregations.test.ts`
  - `tests/unit/overview-dashboard.test.ts`
  - `progress/current.md`
- Out-of-scope / TV6 confirmation (unchanged vs `main`; current contents inspected):
  - `package.json` / `package-lock.json`
  - `prisma/schema.prisma` (no `Account` model)
  - `lib/queries/balance.ts` (filters and running math)
  - `app/(app)/balance/` (no account pair)
  - `app/(app)/income/income-forms.tsx` (planned checkbox still present)
- Spec package files on the branch (`specs/received-savings-accounts/*`) are the approved spec, not unauthorized implementation.

Implementation commit vs `main` (application/tests/progress): `9e755e8`. Spec package added in `c3d16e7`.

Reviewer did not implement this work and did not edit application code or tests.

## Commands run

| Command | Result |
| --- | --- |
| `git diff main...HEAD --stat` | PASS for scope. Changed paths: authorized implementation + new accounts helper/UI + spec package + `progress/current.md`. No `package.json`, Prisma schema, Balance math, or income-form rewrites. |
| `git diff main...HEAD -- package.json package-lock.json prisma/schema.prisma lib/queries/balance.ts app/(app)/income/income-forms.tsx app/(app)/balance` | PASS; empty. |
| `npx vitest run tests/unit/waterfall.test.ts --config vitest.waterfall.config.ts` (TV1) | PASS; 1 file, **9 passed**. |
| `npx vitest run tests/unit/aggregations.test.ts` (TV2, official `vitest.config.ts` `globalSetup`) | FAIL / environment: Prisma `db push` cannot reach Postgres at `127.0.0.1:5432` (`P1001`). No test file executed. |
| Source inspection of leftover / 70% / from-planned formulas | PASS; matches R2, R3, R11 locked math, including the spec’s 100/50/20/0 example. |
| Source inspection of `incomeForScope` vs `main` | PASS; planned-first fallback removed; query is `planned: false` only. |
| Secrets scan of `git diff main...HEAD` | PASS; matches are spec/progress prose about “no secrets”, not credentials. |

TV3–TV5 were not run (no live app / owner session in this environment). Reviewer did not invent browser evidence.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Waterfall income is received only | PASS (code + TV1; aggregations source) | `incomeForScope` queries `planned: false` only (`waterfall-scope.ts` 43–51). No planned-first fallback (removed vs `main`). Empty rows → `sumInCurrency([])` returns `0`, not planned income. `WaterfallInput` uses `receivedIncomeMinor`; `plannedIncomeMinor` is gone from application code. Planned salary is loaded only by `plannedSalaryForScope` for R11 display. July aggregations seed includes planned `999900` USD; expected Saved `38_500_000` is 70% of received leftover `(62_500_000 − 7_500_000)`, so the planned row cannot be in waterfall income if that assertion is honored. |
| R2 — Reserve Planning expenses; leftover ≤ 0 blocks saving | PASS (code + TV1) | `planningExpensesForScope` uses `completed: false` and the same `expenseDateFilter` as charged (`BOTH`: `gte` month start / `lt` next month; H1/H2: `periodDateRange` `gte`/`lte`). `leftoverAfterReserves` = `max(0, received − charged − planning)`. TV1: Planning 20k leaves leftover 40k; Planning 70k (raw −10k) and exact 0 both yield leftover/take/post/project `0`. Empty Planning is `0` (callers pass the summed amount; empty set sums to `0`). Null FX on any of received/charged/planning → `waterfallFromScope` returns `null` (no invented leftover). |
| R3 — Lifetime take is 70% of leftover, not of gross salary | PASS (code + TV1) | `LIFETIME_SAVINGS_PERCENT === 70`. Take is `percentOf(leftover, 70)` (floor). TV1: received 200k, charged 80k, planning 20k → leftover 100k → take `70_000`, post `30_000`, and take `!== percentOf(200_000, 70)`. Leftover `0` → all takes `0`. Project cap still 1–70 of post-lifetime (`99%` → `21_000` of leftover 100k). |
| R4 — Overview, Savings, Projects leftover figures use the new leftover | PASS (code; TV2 source) | Overview `figuresFromSnapshot` uses `waterfallFromScope` for month/H1/H2 Saved and remaining (`overview.ts` 163–220). Earned still snapshot `planned: false`; Spent still `completed: true`. `getSavings` leftover / lifetime take / post-lifetime from `waterfallFromScope`. `getProjectsView` post-lifetime and expected take from `waterfallFromScope`. Savings explainer no longer says leftover comes from planned income (desktop `savings/page.tsx` 124–129; mobile `mobile-savings.tsx` 96–101). Aggregations July Saved/remaining updated from contribution-row `300000` to waterfall take `38_500_000`. |
| R5 — Materialize waterfall with the new leftover inputs | PASS (code) | `materializeHalfWaterfall` calls `waterfallFromScope(scope, allocation)` then upserts `waterfall.lifetimeTakeMinor` (`waterfall-scope.ts` 217–249). Existing rematerialize entrypoints unchanged (`materializeMonthWaterfall`, `safeMaterializeMonth` not rewritten). Leftover `0` still upserts lifetime `0` (result object is non-null). Null legs skip (`if (!waterfall) return`). Project upsert still only when `projectTakeMinor > 0`. Planned salary is not an input to this upsert. Dedupe window `45_000` ms unchanged. `userId` remains on unique `where` / `create`. |
| R6 — Derived Main and Savings accounts (no Account model) | PASS (code) | New `getDerivedAccounts`: Savings = `getLifetimeSavingsBalance`; Total cash = `getBalanceSeries(userId, settings).currentBalance`; Main = Total cash − Savings; null if either leg is null; Main is not clamped at 0 (`accounts.ts` 18–31). No Prisma `Account`. Planning expenses do not enter Total cash (`balance.ts` still `completed: true` only). All-time, not month-scoped. `userId` passed into both helpers. |
| R7 — Show Main and Savings on Overview (desktop and mobile) | PASS (code; TV5 not run) | Labels exactly **Main account** and **Savings account** in `account-cards.tsx` for both `compact` (mobile) and desktop. `page.tsx` renders `AccountCards` then monthly KPIs on `md+`; `MobileOverview` renders compact `AccountCards` then `KpiCardsMobile` on `md:hidden`. Lifetime savings KPI removed from the Overview `kpis` array; mobile footer only renders if a `lifetime` item is passed (it is not). No MoM on the account pair. Same optional hint on both viewports. Null amounts go through existing `Money` (link to set rate, not fabricated 0). Live 375px / `md+` layout remains TV5. |
| R8 — Balance stays the cash series and stays consistent with Main | PASS (code; TV5 identity not run live) | `lib/queries/balance.ts` and `app/(app)/balance/` have empty diffs vs `main`. Filters remain `planned: false` / `completed: true`; running series still starting + period net; `currentBalance` is last running figure (Total cash). No Main/Savings cards on Balance. Identity `Main + Savings = currentBalance` is implemented by subtracting Savings from that series total, not by rewriting Balance. |
| R9 — Planned income stays on Income; no new income flag | PASS (code) | `income-forms.tsx` unchanged vs `main`. Create still has **Planned (not yet received)** (`name="planned"`). Edit still has Planned checkbox. No Prisma column/enum added. Waterfall does not treat `planned: true` as income. |
| R11 — Show the savings amount that still comes from planned salary | PASS (code + TV1) | `plannedSalaryTakeMinor` = `combinedTake − actualTake` with the same leftover rule (`waterfall.ts` 74–90). TV1: received 100k, planned 50k, charged 20k, planning 0 → actual `56_000`, combined `91_000`, from planned `35_000` (spec example). `waterfallFromScope` ignores planned salary; materialize therefore cannot write it. Overview desktop + mobile show **From planned salary** next to the account pair; Savings desktop + mobile show the same label. Empty planned → `0`; missing FX on any planned-take leg → `null`. Not added into Main or Savings. |
| R10 — Security, privacy, and dependencies | PASS (code) | Overview and Savings pages keep `requireUserId`. Every new/changed Prisma `where` / upsert includes `userId` (`incomeForScope`, `plannedSalaryForScope`, charged/planning expenses, materialize, `getDerivedAccounts` via existing helpers). `package.json` dependencies unchanged vs `main`. `prisma/schema.prisma` unchanged. No secrets, `.env`, or financial dumps in the diff. No new npm packages. No new Prisma models. |

## Design verdicts

- Preferred leftover API is implemented: `WaterfallInput` is `{ receivedIncomeMinor, chargedExpensesMinor, planningExpensesMinor, projectAllocationPercent? }`. `plannedIncomeMinor` is not kept as a fallback shape.
- Scope loaders match the locked names: received / planned-salary (display) / charged / planning; `waterfallFromScope` null-checks the three leftover legs; `plannedTakeFromScope` also requires planned salary.
- Materialize path is the existing H1/H2 rematerialize, not a new entrypoint.
- Derived accounts prefer `getBalanceSeries().currentBalance` so Main cannot drift from Balance current cash (R8).
- Overview UI matches the locked layout: AccountCards then monthly KPIs; mobile compact pair; no Lifetime savings item; labels exact; hint shared.
- Balance files were not changed. Income planned checkbox was not changed.
- R11 display-only subtract formula is a pure helper plus Overview/Savings UI; it is not a materialize input.
- No new Prisma models, no new npm packages, no Balance account cards, no income/expense form redesign.
- Extra Overview work (Balance series + lifetime groupBy, including a second lifetime fetch inside `getDerivedAccounts`) is within the design’s accepted cost.

## Task/checkpoint verdicts

- T1: PASS. Leftover helper + `computeWaterfall` on received/charged/planning; ≤ 0 gate; 70% of leftover not gross; `LIFETIME_SAVINGS_PERCENT` 70; input renamed; floor / project-cap cases still pass. TV1: 9/9.
- T2: PASS. Received-only `incomeForScope`; planning reserve; `getScopeAmounts` returns the new fields; `materializeHalfWaterfall` uses `waterfallFromScope`; empty received is `0`; `userId` retained.
- T3: PASS. Overview / Savings / Projects call `waterfallFromScope`. Overview Saved remains month `lifetimeTake`. Earned/spent unchanged in meaning.
- T4: PASS. `lib/queries/accounts.ts` + dashboard `accounts`. Main = Total cash − Savings; Total cash from `getBalanceSeries`.
- T5: PASS. Account cards on desktop and mobile; lifetime KPI removed from the page list; monthly Earned/Spent/Saved/Remaining remain.
- T6: PASS. Savings copy is received salary after charged and Planning bills; “planned income” leftover wording is gone.
- T7: PASS (source). Aggregations July Saved/remaining updated to received leftover 70% take; planned seed cannot inflate Saved at `38_500_000`. Official run blocked by missing Postgres (TV2).
- T8: PASS. `fromPlanned = combinedTake − actualTake`; Overview + Savings **From planned salary**; not materialized; unit case matches the spec numbers.
- T9: PASS. `progress/current.md` records `IMPLEMENTED` for `received-savings-accounts`.
- TV1: PASS. Independent rerun: 9 passed.
- TV2: NOT RUN to completion — official command failed in `globalSetup` (Postgres unreachable). Test source matches R1/R4/R11 math. Spec allows recording this and relying on TV1 + code review.
- TV3: NOT RUN — owner-manual; no live app / session.
- TV4: NOT RUN — owner-manual; same.
- TV5: NOT RUN — owner-manual; same. Code for labels, identity helper, and unchanged Balance is present.
- TV6: PASS by code review (auth, schema, dependencies, materialize, Balance, income checkbox, no planned fallback, no secrets).

## Findings

No implementation defects against the approved spec. Remaining gaps are environment limits and the spec’s owner-manual UI checks, not code divergence.

### INFO — TV3–TV5 not executed here (owner-manual remaining)

- Requirement/design/task: R1/R4/R5/R9 (TV3), R2/R3/R4 (TV4), R6/R7/R8 (TV5)
- File: N/A (environment)
- Lines: N/A
- Observed: This environment has no owner session or running app. Reviewer did not invent browser evidence.
- Expected: Planned-only month → Saved 0 until unmarked planned; large Planning bill zeros take; Overview desktop+mobile show **Main account** / **Savings account** / **From planned salary**; Main + Savings = Balance current balance; Balance has no second account pair.
- Evidence: `progress/current.md` already recorded TV3–TV5 as owner/browser on a live session. Code for those behaviors is present and consistent with the spec.
- Required correction: None for the implementer. Owner should confirm TV3–TV5 on a live session.

### INFO — Official TV2 command cannot run against this environment’s database

- Requirement/design/task: TV2 / R1 / R4 / R11
- File: `vitest.config.ts` → `tests/global-setup.ts`
- Lines: globalSetup `prisma db push`
- Observed: Official `npx vitest run tests/unit/aggregations.test.ts` exited 1 with Prisma `P1001` (cannot reach `127.0.0.1:5432`). Tests never started. No `.env` with a reachable `DATABASE_URL` is present (only `.env.example`).
- Expected: Documented aggregations run green in an environment with Postgres.
- Evidence: Independent source check of `tests/unit/aggregations.test.ts`: July earned `62_500_000`, spent `7_500_000`, Saved `38_500_000` = floor(70% of 55_000_000 received leftover); remaining subtracts that take; `savedFromPlannedMinor` `349_965_000` = combined take `388_465_000` − actual take `38_500_000` with planned `999900` USD at rate 500 excluded from actual leftover. TV1 leftover math already passed.
- Required correction: None for this work item. Owner/CI with `DATABASE_URL` can run the official command; missing DB here is an environment limit, not missing or wrong test cases.

## Cleanup signal

- Durable spec package: `specs/received-savings-accounts/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/received-savings-accounts/review.md`
- Scratch context to reset: none. No application code or tests were edited by the Reviewer.

APPROVED -> reviews/received-savings-accounts/review.md
