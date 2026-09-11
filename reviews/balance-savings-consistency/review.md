# Review: Savings leftover everywhere and Balance month compare

- Work item: `balance-savings-consistency`
- Branch: `cursor/balance-savings-consistency-ef43`
- Approved spec: `specs/balance-savings-consistency/` version 2026-09-11 (owner **GO** 2026-09-11)
- Spec commit: `b086626`
- Implementation: `8cbd747`, `fcc5de8`, `42a906b`
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED`
- Review start: 2026-09-11
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/_template/review.md`
- `specs/balance-savings-consistency/{requirements,design,tasks}.md` (complete, R1–R6 / T1–T7)
- `progress/current.md`
- Implementation vs spec tip: `git diff b086626..HEAD` (spec `b086626`; implementation `8cbd747`; null-spend fix `fcc5de8`; handoff `42a906b`)
- Authorized implementation / test files:
  - `lib/queries/accounts.ts`
  - `lib/queries/savings.ts`
  - `lib/queries/balance-months.ts` (new)
  - `app/(app)/balance/page.tsx`
  - `app/(app)/savings/page.tsx`
  - `components/balance/account-section.tsx`
  - `components/balance/mobile-balance.tsx`
  - `components/savings/mobile-savings.tsx`
  - `tests/unit/balance-months.test.ts` (new)
  - `tests/unit/account-breakdown.test.ts`
  - `vitest.waterfall.config.ts`
  - `progress/current.md`
- Related readers (not rewritten this item; leftover already via `waterfallFromScope`):
  - `lib/queries/waterfall-scope.ts`, `lib/waterfall.ts`
  - `lib/queries/overview-dashboard.ts` / `app/(app)/page.tsx` / `components/overview/account-cards.tsx`
- Out-of-scope confirmation (unchanged in `b086626..HEAD`):
  - `package.json` / `package-lock.json`
  - `prisma/schema.prisma`
  - `lib/queries/balance.ts` (half-month series still computed; UI no longer renders `series.rows`)
  - Main card / charge-reduces-Main / Custom math / Savings history form

Reviewer did not implement this work and did not edit application code or tests.

## Commands run

| Command | Result |
| --- | --- |
| `git diff b086626..HEAD --stat` | PASS for scope. 12 files: Balance/Savings loaders + pages + month helper + unit tests + handoff. |
| `git diff b086626..HEAD -- package.json package-lock.json prisma/schema.prisma` | PASS; empty. |
| `npx vitest run --config vitest.waterfall.config.ts` (TV1) | PASS; 6 files, **56 passed**. |
| `npx tsc --noEmit` | PASS; exit 0. |
| Source inspection of Savings headline / Savings page copy / Balance section order / half-month removal / month rows | PASS. |
| Grep `getSavingsAllTimeMinor` as Balance headline | PASS; function remains defined, not called from `getBalanceAccountsPage`. Headline is `savingsCardHeadline(fromMain)`. |
| Grep `From planned salary` in `*.ts` / `*.tsx` | PASS; no matches. |
| Grep Balance `Running balance by half-month` / `LineChart` / `series.rows` | PASS; none on Balance desktop or mobile. |
| Secrets scan of `b086626..HEAD` | PASS; empty. Pre-existing dummy `AUTH_SECRET` in `vitest.waterfall.config.ts` only. |

TV2–TV4 live household walkthroughs were not run. Reviewer did not invent browser evidence.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Savings card is this month’s leftover take on Overview and Balance | PASS (code + TV1; TV2 not run) | Overview: `getDerivedAccounts` sets `savingsAccountMinor` to `waterfallFromScope(...).lifetimeTakeMinor` (`accounts.ts` 41–44). Overview desktop/mobile pass that into `AccountCards`. Balance: `getCurrentMonthBreakdown` sets `fromMain` to the same month take (`accounts.ts` 154–157). `getBalanceAccountsPage` sets SAVINGS `balanceMinor` to `savingsCardHeadline(month.breakdown.fromMain)` (`accounts.ts` 194–195). `savingsCardHeadline` is identity of the take, including `null` (`balance-months.ts` 20–22). Opening and lifetime contributions are not added. `getSavingsAllTimeMinor` is no longer invoked on the Balance page path (removed from `getBalanceAccountsPage`; still defined, unused). Missing FX: take/`fromMain` null → headline null → `Money` set-rate prompt, not 0. Unit: take 42_000; headline is not opening + lifetime (`account-breakdown.test.ts` 30–37; `balance-months.test.ts` 10–20). Live create-Savings card vs Overview remains TV2. |
| R2 — Savings page uses the same leftover, no From planned salary | PASS (code; TV4 not run) | `getSavings` leftover/take/post come only from `waterfallFromScope` (Main + remaining Planning). `plannedTakeFromScope` / `plannedSalaryTakeMinor` removed from the loader and `SavingsSummary` (`savings.ts` 4, 79–84, 87–94). Desktop: leftover label **Leftover after planned expenses**; 70% card **This month (70%)** binds `lifetimeTakeMinor`; copy is 70% of Main after still-planned expenses (`savings/page.tsx` 97–122). Mobile: same leftover/take fields; **From planned salary** block removed; copy is “70% of Main after remaining planned expenses” (`mobile-savings.tsx` 62–91). Grep of `*.ts`/`*.tsx`: no “From planned salary”. Missing FX: `waterfallFromScope` null when Main or Planning convert is null → leftover/take stay null. Live 70% match vs Overview remains TV4. |
| R3 — Accounts section is at the top of Balance | PASS (code; TV3 not run) | Desktop (`balance/page.tsx` 49–155): title → **Accounts** (`AccountCards` + `AddAccountForm`) → Starting/Current → month bar → month table. Mobile (`mobile-balance.tsx` 54–181): title → Accounts (cards + Add) → Starting/Current → month bar → month list. Starting/Current remain below Accounts (out of scope to remove). Live layout remains TV3. |
| R4 — Remove half-month running table | PASS (code; TV3 not run) | Balance desktop and mobile no longer render a running-balance table, accordion, line chart, or half-month income vs expenses bars. Grep of `app/(app)/balance/` and `components/balance/`: no “Running balance by half-month”, no `LineChart`, no `series.rows`. `getBalanceSeries` is still called only for `startingBalance` / `currentBalance` (`balance/page.tsx` 18–21, 82–97; mobile 91–121). Optional calendar-month Spent vs Saved bar is present (design-allowed). |
| R5 — Month compare table: spent vs saved | PASS (code + TV1; TV3 not run) | `getBalanceMonthRows` (`balance-months.ts` 90–142): spent = `Expense.completed === true` grouped by calendar month; past saved = `SavingsContribution` `source = "waterfall"` summed by year/month (H1+H2); current saved = live `waterfallFromScope` take. `composeMonthSpendSaveRows` newest-first; includes a month if spent or saved is non-zero or a cell is null; current take overrides stored waterfall (`balance-months.ts` 33–76). Desktop table columns Month / Spent / Saved; empty “No spent or saved months yet.” (`balance/page.tsx` 114–154). Mobile list same columns and empty copy (`mobile-balance.tsx` 141–180). Null spend kept (`fcc5de8`; test 83–93). Unit: charged 10_000 + take 42_000 → one August row; current saved 42_000 not stored 99_000; past August waterfall 14_000; sort `[8, 7]`. Live August/September walkthrough remains TV3. |
| R6 — Auth, privacy, dependencies | PASS (code) | Balance and Savings pages keep `requireUserId`. New month loader queries `expense` and `savingsContribution` with `userId`; current take via `getScopeAmounts(userId, ...)`. Account load stays `where: { userId }`. `package.json` / Prisma schema unchanged (no new npm packages or models). No secrets or financial dumps in the diff. Leftover still omits charged (`waterfallFromScope` → `computeWaterfall({ mainCashMinor, remainingPlanningMinor })`). |

## Design verdicts

- Balance Savings headline is current-month leftover take via `savingsCardHeadline(fromMain)`, not opening + lifetime.
- Overview Savings remains `getDerivedAccounts` month take; same leftover helper as Balance and Savings 70%.
- Savings page dropped **From planned salary** and received-salary leftover copy; leftover/take stay on `waterfallFromScope`.
- Balance Accounts block is first on desktop and mobile; Starting/Current stay below.
- Half-month running table, line chart, and half-month income/expense chart are gone. `getBalanceSeries` totals only.
- Month Spent/Saved helper lists newest first; current Saved = live take; past Saved = materialized waterfall sum.
- Optional month bar chart of the same series is present (allowed).
- No new Prisma models, no new npm packages.
- `getSavingsAllTimeMinor` is unused after this item; design allowed keeping it if another caller needed it. It is not the Balance headline.

## Task/checkpoint verdicts

- T1: PASS. SAVINGS `balanceMinor` = `savingsCardHeadline(fromMain)` = current-month `lifetimeTakeMinor`. `getSavingsAllTimeMinor` is not used for that headline.
- T2: PASS. No From planned salary. 70% take = leftover take. Copy is Main after remaining Planning. Desktop + mobile.
- T3: PASS. After the title, Accounts (cards + add) render first on desktop and mobile.
- T4: PASS. No running-balance line chart, no half-month income/expense chart, no half-month table/accordion. `getBalanceSeries` used only for Starting/Current.
- T5: PASS. Month / Spent / Saved. Current Saved = leftover take. Past Saved = waterfall sum. `userId` retained. Newest first.
- T6: PASS. `tests/unit/balance-months.test.ts` composition + current/past/sort/null cases. `account-breakdown.test.ts` asserts headline is leftover take, not opening + lifetime. No test asserts Balance Savings = opening + lifetime.
- T7: PASS. `progress/current.md` records `IMPLEMENTED` for `balance-savings-consistency`.
- TV1: PASS. **56 passed**.
- TV2: NOT RUN — no owner session / live create-Savings walkthrough.
- TV3: NOT RUN — no live Balance layout / month-table walkthrough.
- TV4: NOT RUN — no live Savings page vs Overview 70% walkthrough.
- TV5: PASS (code). No new deps; `userId` scoping; leftover omits charged.

## Findings

### INFO — TV2–TV4 live household walkthroughs were not run

- Requirement/design/task: TV2 (R1), TV3 (R3/R4/R5), TV4 (R2)
- File: N/A (environment)
- Lines: N/A
- Observed: This environment has no owner session. Reviewer did not invent browser evidence. Code and unit tests cover the headline identity, Savings copy, section order, half-month removal, and month-row math.
- Expected: Create Savings card equals Overview leftover take (not a lifetime lump). Balance Accounts at top; no half-month running table; months show spent vs saved. Savings page has no From planned salary; 70% take matches Overview.
- Evidence: `progress/current.md` already recorded TV2–TV4 not run. Independent TV1 56 passed; `tsc --noEmit` exit 0.
- Required correction: None for the environment gap. Owner with a live session should still run TV2–TV4.

## Cleanup signal

- Durable spec package: `specs/balance-savings-consistency/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/balance-savings-consistency/review.md`
- Scratch context to reset: none. No application code or tests were edited by the Reviewer.

APPROVED -> reviews/balance-savings-consistency/review.md
