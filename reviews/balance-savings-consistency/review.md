# Review: Savings leftover everywhere and Balance month compare (re-review)

- Work item: `balance-savings-consistency`
- Branch: `cursor/balance-savings-consistency-ef43`
- Approved spec: `specs/balance-savings-consistency/` version 2026-09-11 (owner **GO** 2026-09-11; same-day amendment: remove Starting/Current; Spent matches Overview charged)
- Spec / amendment commit: `84c1743` (spec package + T8 implementation in the same commit)
- Prior review: APPROVED (`384d0c3` / `3c35190`) against pre-amendment R1–R6, when Starting/Current still rendered
- Implementation under review: `84c1743` (plus prior `8cbd747`, `fcc5de8`, `42a906b`)
- Implementer progress: `progress/current.md` (working tree handoff `IMPLEMENTED`; committed `84c1743` still said “amendment in progress / re-review needed”)
- Review start: 2026-09-11 (re-review)
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/_template/review.md`
- `specs/balance-savings-consistency/{requirements,design,tasks}.md` (amended; R1–R7 / T1–T8)
- `progress/current.md` (working tree + `git show 84c1743:progress/current.md`)
- Prior review: `reviews/balance-savings-consistency/review.md` (this file, previous APPROVED)
- Amendment: `git show 84c1743`
- Authorized implementation / test files for this re-review:
  - `app/(app)/balance/page.tsx`
  - `components/balance/mobile-balance.tsx`
  - `lib/queries/balance-months.ts`
  - `tests/unit/balance-months.test.ts`
  - `lib/queries/waterfall-scope.ts` (`expensesForScope`)
  - `lib/queries/overview.ts` (`loadMonthSnapshot` / Overview Spent)
  - `app/(app)/expenses/actions.ts` (charge / un-charge revalidate)
- Related (unchanged this amendment; still satisfy R1–R4, R6):
  - `lib/queries/accounts.ts`, `lib/queries/savings.ts`
  - `app/(app)/savings/page.tsx`, `components/savings/mobile-savings.tsx`
  - `components/balance/account-section.tsx`
  - `tests/unit/account-breakdown.test.ts`
- Out-of-scope confirmation (`384d0c3..84c1743` and working tree):
  - `package.json` / `package-lock.json` empty
  - `prisma/schema.prisma` empty
  - Settings “Starting balance” remains on `/settings` only

Reviewer did not implement this work and did not edit application code or tests.

## Commands run

| Command | Result |
| --- | --- |
| `git show 84c1743` | PASS for amendment scope. 8 files: Balance desktop/mobile, `balance-months.ts`, month tests, spec R5/R7 + T8, progress. |
| `git diff 384d0c3..84c1743 -- package.json package-lock.json prisma/schema.prisma` | PASS; empty. |
| Grep `Starting balance` / `Current balance` / `getBalanceSeries` in `app/(app)/balance/` and `components/balance/` | PASS; no matches. |
| Grep `revalidatePath("/balance")` on charge actions | PASS; `setExpenseCompletedAction`, create/update/delete expense still revalidate `/balance`. |
| Source inspection: `expensesForScope` vs Overview Spent (`loadMonthSnapshot` `completed === true`) | PASS; same filter and calendar-month range. |
| Source inspection: current month always listed in `composeMonthSpendSaveRows` | PASS. |
| `npx vitest run --config vitest.waterfall.config.ts` (TV1) | PASS; 6 files, **57 passed**. |
| `npx tsc --noEmit` | PASS; exit 0. |
| Secrets scan of `84c1743` | PASS; no secrets. Pre-existing dummy `AUTH_SECRET` in `vitest.waterfall.config.ts` only. |

Live Starting/Current removal and charge→Spent walkthrough were not run. Reviewer did not invent browser evidence.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Savings card is this month’s leftover take on Overview and Balance | PASS (prior review + unchanged this amendment) | Amendment does not touch Savings headline path. `getBalanceAccountsPage` still sets SAVINGS `balanceMinor` to `savingsCardHeadline(fromMain)` (`accounts.ts` 194–195). |
| R2 — Savings page uses the same leftover, no From planned salary | PASS (prior review + unchanged this amendment) | Savings loaders/pages not in `84c1743`. Grep still has no “From planned salary”. |
| R3 — Accounts section is at the top of Balance | PASS (code) | Desktop (`balance/page.tsx` 44–74): title → Accounts (cards + add) → Spent vs Saved chart → month table. Mobile (`mobile-balance.tsx` 50–141): title → Accounts → chart → month list. No Starting/Current between Accounts and the month compare. |
| R4 — Remove half-month running table | PASS (prior review + unchanged) | No half-month table/accordion/line chart. Amendment only removes Starting/Current and does not restore running UI. |
| R5 — Month compare table: spent vs saved | PASS (code + TV1) | Current-month Spent is `expensesForScope(userId, currentYear, currentMonth, "BOTH", …)` (`balance-months.ts` 103–114, 141–142). `expensesForScope` queries `userId` + `completed: true` + calendar month `{ gte: 1st, lt: next month }` (`waterfall-scope.ts` 86–103, 30–31). Overview Spent uses the same Already charged month set: `loadMonthSnapshot` `completed: true` and the same `gte`/`lt` bounds (`overview.ts` 92–101, 155). Planning (`completed: false`) is excluded. `composeMonthSpendSaveRows` always adds the current `year-month` key and does not skip `isCurrent` rows (`balance-months.ts` 44–48, 67). Desktop/mobile still render Month / Spent / Saved; empty copy remains as fallback. Charge/un-charge: `setExpenseCompletedAction` (and create/update/delete) call `revalidatePath("/balance")` (`expenses/actions.ts` 108, 153, 217, 258). Unit: charged 10_000 + take 42_000; current month always listed (`[9, 8, 7]`, spent/saved 0); current-month Spent 10_000 (`balance-months.test.ts` 24–40, 66–94). Live charge→Spent walkthrough not run. |
| R6 — Auth, privacy, dependencies | PASS (code) | `requireUserId` on Balance. Month loader queries stay `userId`-scoped. `package.json` / Prisma schema unchanged in `84c1743` and working tree. No new npm packages or models. No secrets. |
| R7 — Remove Starting and Current balance cards | PASS (code) | Desktop no longer imports `getBalanceSeries` or renders Starting/Current cards (`page.tsx` 1–9, 16–18; former summary section deleted). Mobile dropped `startingBalance` / `currentBalance` props and the two-column summary (`mobile-balance.tsx` 16–45, 84+). Grep of `app/(app)/balance/` and `components/balance/`: no “Starting balance” or “Current balance” labels; no `getBalanceSeries`. Remaining “Starting balance” string is Settings only (`settings-forms.tsx`). `getBalanceSeries` remains for Overview `totalCashMinor` (`accounts.ts` 30–46), which is not the Balance page. |

## Design verdicts

- Starting/Current cards are gone on Balance desktop and mobile (amendment alternative: Keep Starting/Current **Rejected**).
- `getBalanceSeries` is not called from the Balance page.
- Current-month Spent is `expensesForScope(..., BOTH)` so it matches Overview Spent for that month (`completed === true`).
- Current month always appears in the month table so a new charge is visible.
- Past-month Spent still groups `Expense.completed === true` by calendar month; current month overwrites that group with the Overview helper.
- Current Saved remains live leftover take; past Saved remains waterfall sum.
- No new Prisma models, no new npm packages.

## Task/checkpoint verdicts

- T1–T7: PASS (prior review). Amendment does not regress leftover headline, Savings copy, Accounts-first, or half-month removal.
- T8: PASS. No Starting/Current cards. Current month always listed. Current-month Spent uses `expensesForScope` (Already charged).
- TV1: PASS. **57 passed** (was 56 before the new current-month Spent / always-include cases).
- TV2–TV4: NOT RUN — no owner session / live household walkthrough.
- TV5: PASS (code). No new deps; `userId` scoping retained.

## Findings

### INFO — Live Starting/Current and charge→Spent walkthrough not run

- Requirement/design/task: R5, R7, TV3
- File: N/A (environment)
- Lines: N/A
- Observed: This environment has no owner session. Reviewer did not invent browser evidence. Code, greps, and unit tests cover card removal, `expensesForScope` identity, current-month inclusion, and `/balance` revalidate on charge actions.
- Expected: No Starting/Current square on a live `/balance`. Charge ₡10,000 → Balance current-month Spent equals Overview Spent.
- Evidence: `progress/current.md` (working tree) already recorded the live walkthrough gap. Independent TV1 57 passed; `tsc --noEmit` exit 0.
- Required correction: None for the environment gap. Owner with a live session should still confirm charge→Spent.

### INFO — Committed progress at `84c1743` still said re-review needed

- Requirement/design/task: T7
- File: `progress/current.md` (committed vs working tree)
- Lines: N/A
- Observed: `git show 84c1743:progress/current.md` still listed “amendment in progress” and “re-review needed.” The working-tree file records `IMPLEMENTED` and TV1 57 passed. Reviewer did not commit that working-tree progress edit.
- Expected: Handoff `IMPLEMENTED` after the amendment.
- Evidence: Working-tree `progress/current.md` lines 1–16.
- Required correction: None for this verdict. Implementer may commit the working-tree handoff separately.

## Cleanup signal

- Durable spec package: `specs/balance-savings-consistency/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/balance-savings-consistency/review.md`
- Scratch context to reset: none. No application code or tests were edited by the Reviewer.

APPROVED -> reviews/balance-savings-consistency/review.md
