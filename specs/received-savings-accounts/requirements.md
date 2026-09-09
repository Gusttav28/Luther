# Requirements: Received savings and Overview accounts

- Work item: specs/received-savings-accounts/
- Outcome: Show Main vs Savings accounts on Overview; compute the 70% lifetime take only from salary already received, after reserving unpaid (Planning) bills; do not treat planned/unreceived income as already saved
- Branch: cursor/received-savings-accounts-ef43
- Status: Specification
- Spec version: 2026-09-09

## Problem

Overview “Saved” and the lifetime waterfall treat **planned** income as already saveable: `incomeForScope` prefers `IncomeEntry.planned === true` and only falls back to received rows. That shows money the owner has not received as if it were already in savings. Unpaid **Planning** bills (`Expense.completed === false`) are ignored by the leftover math, so the 70% lifetime take can run before upcoming payments are covered.

The owner needs two derived accounts on Overview — **Main account** (cash currently available) and **Savings account** (money actually saved) — and a leftover rule that uses only received salary, after reserving Planning bills. Balance already tracks a cash running series from received income and charged expenses; that series stays. Accounts are shown on Overview, not Balance.

## In scope

- Waterfall income for a month or half is **received only** (`IncomeEntry.planned === false`). No fallback to planned rows.
- Reserve **Planning** expenses (`Expense.completed === false`) in the same scope before the lifetime take. If leftover ≤ 0, leftover and lifetime take are 0 (cannot save; pay Planning bills first).
- Keep the fixed **70%** lifetime take, applied only to that leftover (not to gross salary). Floor rounding unchanged.
- Overview monthly **Saved** (and Savings / Projects leftover, lifetime take, post-lifetime, and project take figures that use the same leftover) follow the new leftover.
- Materialize H1/H2 waterfall rows through the existing rematerialize path with the new inputs.
- Derived **Main account** and **Savings account** (no Prisma `Account` model). Show both on Overview desktop and mobile, labels exactly **Main account** and **Savings account**. Optional one-line hint that savings only move after received salary and reserved bills.
- Balance running series stays received income + charged expenses. Do not add a second account pair on Balance. Main must not invent a conflicting current-cash story (see R8).
- Unit tests for leftover, the Planning reserve gate, and 70%-of-leftover (update `tests/unit/waterfall.test.ts`).
- Auth / privacy (`requireUserId`, `userId` scope, no secrets).
- No new npm dependencies. No new Prisma models. Reuse `Expense.completed` and `IncomeEntry.planned`.

## Out of scope

- New bank integrations or real transfers.
- A new Account table or multi-account ledger.
- Making the 70% rate user-editable.
- Removing the income “Planned (not yet received)” checkbox (keep it; it means not received).
- Changing expense Planning vs Already charged create UX.
- Redesigning Balance as a bank-account manager.
- Auto-pay of Planning expenses.
- New notifications.
- Soft-delete.
- New npm dependencies.

## Definitions

- **Received income**: sum of `IncomeEntry` rows with `planned === false` in the active waterfall scope (calendar month = H1+H2, or a single half), converted to reporting currency. This is salary (or other income) already received. **Do not** add a new income flag.
- **Planned income**: `IncomeEntry.planned === true` — “Planned (not yet received)”. May remain on Income for forecasting. Must not enter `incomeForScope`, leftover, Overview Saved, materialized savings, or Savings/Projects waterfall figures.
- **Charged expenses**: sum of `Expense` rows with `completed === true` in the same date scope as today’s `expensesForScope`.
- **Planning expenses**: sum of `Expense` rows with `completed === false` in that same date scope. Upcoming bills that are listed but not yet paid.
- **Leftover** (scope: month or half):

  ```
  leftover = receivedIncome − chargedExpenses − planningExpenses
  if leftover ≤ 0:
    leftover = 0
    lifetimeTake = 0
    postLifetime = 0
  else:
    lifetimeTake = floor(70% of leftover)
    postLifetime = leftover − lifetimeTake
  ```

- **Lifetime take**: `floor(leftover * 70 / 100)` when leftover > 0; otherwise 0. Same `percentOf` / floor rule as today. Not 70% of gross received income.
- **Post-lifetime leftover**: `leftover − lifetimeTake` when leftover > 0; otherwise 0. Priority project take remains a percent of this remainder (existing 1–70 cap).
- **Savings account**: lifetime savings balance = sum of `SavingsContribution` rows for the user (`getLifetimeSavingsBalance`). All-time, not month-scoped.
- **Main account**: `startingBalance + all received income − all charged expenses − Savings account`, in reporting currency. All-time. Planning expenses do not reduce Main (not paid) but they block new lifetime take via leftover.
- **Total cash**: `startingBalance + all received income − all charged expenses`. Equals today’s Balance `currentBalance` when rates exist. Identity: `Main + Savings = Total cash`.
- **Starting balance**: existing Settings `startingBalanceMinor` / `startingBalanceCurrency`, converted to reporting currency (same as Balance).
- **Overview Saved**: the selected month’s waterfall `lifetimeTake` (H1+H2 / `BOTH` scope), not planned-income leftover and not a raw sum of contribution rows when the waterfall is computable.
- **Account cards**: Overview UI pair labeled **Main account** and **Savings account** (desktop and mobile).

## Requirements

### R1 — Waterfall income is received only

- Trigger: Any leftover, lifetime take, Overview Saved, Savings/Projects waterfall figure, or H1/H2 materialize for a month or half.
- Preconditions: Authenticated owner; income rows may include a mix of `planned === true` and `planned === false` in the scope. Reporting currency and rates as today.
- Actor/system: `incomeForScope` / `getScopeAmounts` and every caller of those amounts (`computeWaterfall`, Overview, Savings, Projects, `materializeHalfWaterfall`).
- Expected response: Scope income is the converted sum of rows with `planned === false` only. If there are no received rows, income is `0` (empty `sumInCurrency`), not a fallback to planned rows. Planned rows never enter this sum, even when they are the only income in the month.
- State change: None on the read path. Materialize (R5) writes lifetime/project takes from this received-only income.
- Visible/resulting evidence: A month that has only planned income and no received income yields leftover `0` and lifetime take `0`. Adding or editing planned income does not increase Overview Saved, Savings leftover, or materialized waterfall amounts. Marking a row received (`planned === false`) allows it to enter leftover on the next compute / rematerialize.
- Failure behavior: Missing FX rate for a needed conversion → scope income `null`; existing rate-needed / skip-materialize behavior (do not invent a rate). Do not substitute planned income when received conversion fails.
- Acceptance evidence: Unit leftover cases use received amounts only. Code review: `incomeForScope` queries `planned: false` and has no planned-first fallback. Manual: planned-only month → Saved / lifetime take `0`; after unchecking Planned, leftover can become positive if bills are covered.

### R2 — Reserve Planning expenses; leftover ≤ 0 blocks saving

- Trigger: Waterfall leftover is computed for a month or half.
- Preconditions: R1 received income available or `0`. Charged and Planning expenses may exist in the same date scope as today’s `expensesForScope` (full month when period is `BOTH`; half date range when H1/H2).
- Actor/system: Scope expense loaders + leftover math in `computeWaterfall` (or a small leftover helper it calls).
- Expected response: `leftover = max(0, receivedIncome − chargedExpenses − planningExpenses)`. If that difference is ≤ 0, leftover is `0` and lifetime take is `0` (and post-lifetime / project take are `0`). Planning bills are reserved first; the owner cannot save until leftover is positive. Charged expenses remain in the subtraction (already spent). Planning expenses do not reduce Main (R6) because they are not paid.
- State change: Derived leftover only, until materialize writes takes (R5).
- Visible/resulting evidence: Example — received 100, charged 40, Planning 70 → leftover `0`, lifetime take `0`. Received 100, charged 40, Planning 20 → leftover `40`, then R3. Overview Saved / Savings “budget left” / materialized take follow this leftover.
- Failure behavior: Missing FX on charged or Planning sums → that leg `null`; do not compute leftover; do not materialize (same as today’s null-scope skip). Empty Planning set is `0`, not “ignore the reserve.”
- Acceptance evidence: Unit tests for leftover ≤ 0 gate (Planning consumes leftover; leftover exactly 0; leftover negative before clamp). Manual: add a large Planning bill in a month with received salary → Saved / lifetime take become `0` until the bill is smaller than leftover or is charged.

### R3 — Lifetime take is 70% of leftover, not of gross salary

- Trigger: Leftover for the scope is known (R2).
- Preconditions: Leftover is `0` or a positive integer minor amount. `LIFETIME_SAVINGS_PERCENT` remains `70` and is not user-editable.
- Actor/system: `computeWaterfall` / `percentOf`.
- Expected response: If leftover is `0`, `lifetimeTake = 0` and `postLifetime = 0`. If leftover > 0, `lifetimeTake = floor(leftover * 70 / 100)` and `postLifetime = leftover − lifetimeTake`. Project take (when a percent is passed) remains `percentOf(postLifetime, clamped 1–70)` as today. Do **not** take 70% of received (gross) income.
- State change: Derived takes; persist only via existing materialize upserts (R5).
- Visible/resulting evidence: Received 200, charged 80, Planning 20 → leftover 100 → lifetime take `70`, post-lifetime `30` (minor-unit scale as in tests). Received 200, expenses 0, Planning 0 → leftover 200 → take `140`, not `140` of a different base. Savings page still shows leftover, 70% take, and 30% remainder using these numbers.
- Failure behavior: Leftover `0` → all takes `0` (R2). Null leftover → no invented take.
- Acceptance evidence: Updated `tests/unit/waterfall.test.ts` asserts 70% of leftover, the ≤ 0 gate, and at least one case proving take ≠ 70% of gross received when expenses/reserves are non-zero. `LIFETIME_SAVINGS_PERCENT === 70`.

### R4 — Overview, Savings, and Projects leftover figures use the new leftover

- Trigger: Owner opens Overview, Savings, or Projects (or Overview Refresh rematerializes) for a month that has waterfall figures.
- Preconditions: R1–R3. Existing pages already call `getScopeAmounts` + `computeWaterfall` (Overview `figuresFromSnapshot`, `getSavings`, `getProjectsView`).
- Actor/system: Those query functions after the scope/waterfall input change.
- Expected response: Overview **Saved** for the selected month is the month-scope (`BOTH`) `lifetimeTake` from the new leftover, not planned-income leftover. Half-month Saved cells that already use H1/H2 waterfall takes follow the new per-half leftover. Overview **Earned** / **Spent** stay as today (received income; charged expenses only). Savings leftover / lifetime take / post-lifetime and Projects expected take / post-lifetime / projections that use month leftover follow the same leftover. Light owner-facing copy on Savings that currently says leftover comes from **planned income** is updated so it does not contradict R1–R3 (desktop `app/(app)/savings/page.tsx` and `components/savings/mobile-savings.tsx`).
- State change: None on read except via R5 when Refresh / mutation rematerialize runs.
- Visible/resulting evidence: Planned-only income no longer inflates Saved. Planning bills can zero Saved. Composition donut / half-month Saved that read `overview.saved` / `perPeriod.*.saved` stay consistent with the new take.
- Failure behavior: Unset rates still show “—” / existing rate note; do not fabricate Saved as planned leftover.
- Acceptance evidence: Manual Overview + Savings for a month with planned income + received income + one Planning bill: Saved/leftover match the locked leftover formula. `tests/unit/aggregations.test.ts` overview Saved/remaining updated if they still assume contribution-row Saved or planned-income leftover.

### R5 — Materialize waterfall with the new leftover inputs

- Trigger: Existing rematerialize path runs (`safeMaterializeMonth` after mutations, Overview Refresh, or explicit `{ materialize: true }` / `{ skipMaterialize: false }`).
- Preconditions: R1–R3. Owner exists. H1 and H2 upserts remain idempotent on `(userId, year, month, period, source: "waterfall")`.
- Actor/system: `materializeHalfWaterfall` / `materializeMonthWaterfall` via `getScopeAmounts` + `computeWaterfall` (no new materialize entrypoint required).
- Expected response: Each half upserts lifetime take (and priority project take when applicable) from received income minus charged minus Planning in that half. If leftover ≤ 0, upsert lifetime `amountMinor` to `0` (existing upsert still runs when scope numbers are non-null). If received/charged/Planning conversion is `null`, skip that half as today. Months that were previously materialized from planned income are rewritten to the received+reserve rule on the next rematerialize — that is intended, not a second ledger.
- State change: `SavingsContribution` and `ProjectContribution` waterfall rows for that user/month/half updated in place. Manual (non-waterfall) savings rows unchanged.
- Visible/resulting evidence: After Refresh (or a mutation that rematerializes), Savings account / lifetime balance and Overview Saved match the new take. Project waterfall rows drop to 0 when leftover ≤ 0.
- Failure behavior: `safeMaterializeMonth` still must not fail the primary write. Missing rates skip upsert. Dedupe window on `materializeMonthWaterfall` unchanged.
- Acceptance evidence: Code review that materialize uses the new scope fields / leftover. Manual: rematerialize a month that had planned income → waterfall contribution equals 70% of received leftover after reserves, not 70% of planned income.

### R6 — Derived Main and Savings accounts (no Account model)

- Trigger: Overview loads account figures (R7). Any future reader of the same helper uses the same formulas.
- Preconditions: Authenticated owner. Settings starting balance exists (default 0 as today). Lifetime contributions and income/expense rows are `userId`-scoped.
- Actor/system: Derived query helper (no Prisma `Account`). Reuse `getLifetimeSavingsBalance` and the same received / charged filters as Balance (`planned: false`, `completed: true`), plus Settings starting balance.
- Expected response:

  ```
  Savings account = getLifetimeSavingsBalance
  Total cash      = startingBalance + all received income − all charged expenses
                  (= Balance currentBalance when rates exist)
  Main account    = Total cash − Savings account
  ```

  Planning expenses do not reduce Main. All amounts in reporting currency; any missing needed rate → that account `null` (do not coerce to 0). Do not clamp Main at 0 (historical waterfall or manual contributions can make Savings larger than Total cash).
- State change: None (derived).
- Visible/resulting evidence: Savings account equals the existing lifetime savings balance. Main + Savings equals Balance current balance when all conversions succeed. Changing starting balance, receiving income, charging an expense, or a waterfall/manual savings row changes Main and/or Savings on the next Overview load.
- Failure behavior: Null rates → show “—” via existing `Money` / null handling. Do not invent a second persisted balance.
- Acceptance evidence: Code review of the formulas and `userId` filters. Manual: Settings starting + one received income − one charged expense − lifetime balance = Main. Planning-only expense does not change Main.

### R7 — Show Main and Savings on Overview (desktop and mobile)

- Trigger: Authenticated owner opens `/` (Overview) at mobile (~375px) and desktop (`md+`).
- Preconditions: R6 figures available (or null). Monthly KPIs still load.
- Actor/system: Overview page (`app/(app)/page.tsx`) and `components/overview/mobile-overview.tsx`, plus KPI/account presentation components.
- Expected response: Both viewports show two account values labeled **Main account** and **Savings account**. Optional one-line hint that savings only move after received salary and reserved upcoming bills. Place the pair as a distinct accounts row/section (above or immediately with the monthly KPIs). Do not add MoM deltas on the account pair (they are all-time, not monthly). Remove or stop showing the separate **Lifetime savings** monthly KPI / mobile lifetime footer so the same lifetime number is not shown twice; monthly **Saved** remains the selected month’s take (R4).
- State change: None.
- Visible/resulting evidence: Screenshot-level: both labels visible on mobile and desktop; amounts match R6; hint present or omitted consistently on both viewports if included. Balance route does not gain this pair (R8).
- Failure behavior: Null account amounts render as existing unavailable money (“—”), not fabricated zeroes. Layout wraps on narrow viewports without horizontal page overflow.
- Acceptance evidence: Manual UI check at ~375px and `md+`. Labels are exactly **Main account** and **Savings account**. Lifetime savings KPI not duplicated beside Savings account.

### R8 — Balance stays the cash series and stays consistent with Main

- Trigger: Owner views `/balance` or compares Balance current cash with Overview Main.
- Preconditions: R6 identity. `getBalanceSeries` already uses received income (`planned: false`) and charged expenses (`completed: true`).
- Actor/system: Balance page and `lib/queries/balance.ts` (no second account pair).
- Expected response: Keep the half-month running series as today (period net = received income − charged expenses; running from starting balance). **Current balance** remains that cash running total (`Total cash`). It must not contradict Main: `Main + Savings = Current balance` when rates exist. Do **not** add Main/Savings account cards on Balance (avoid duplicate UI). Do **not** subtract Savings from the running series or from Current balance (that would make the last table row disagree with Current balance and invent a second cash story).
- State change: None. Balance formulas stay as they are unless a bug would break the identity (implementer must not “fix” Current balance by subtracting Savings).
- Visible/resulting evidence: Balance table and Current balance unchanged in meaning. Overview Main is Total cash minus Savings. No second current-balance number appears on Balance.
- Failure behavior: Missing rates → Current balance / Main / Savings null as today; do not mix a converted Main with an unconverted series.
- Acceptance evidence: Code review: `balance.ts` filters unchanged; Balance page has no new account pair. Manual: Current balance − Savings account = Main account.

### R9 — Planned income stays on Income; no new income flag

- Trigger: Owner adds or edits income and uses **Planned (not yet received)**.
- Preconditions: Existing checkbox / `IncomeEntry.planned` (`app/(app)/income/income-forms.tsx`, income actions, `incomeSchema`).
- Actor/system: Income UI and validation (no change required except that waterfall no longer reads planned as saveable).
- Expected response: The planned checkbox remains. `planned === true` means not received. `planned === false` means received. No new column, enum, or “received” flag. Planned rows still appear on Income and may still feed Income-page forecasting / listing. They must not enter waterfall income (R1).
- State change: None required in this item for income writes.
- Visible/resulting evidence: Income create/edit still offers Planned (not yet received). Planned badge/list behavior unchanged.
- Failure behavior: Unchanged income validation.
- Acceptance evidence: Code review: no Prisma schema change; income forms still have the planned checkbox; waterfall queries do not read `planned: true` as income.

### R10 — Security, privacy, and dependencies

- Trigger: Any Overview / Savings / Projects / Balance / materialize / account derivation in this item.
- Preconditions: Existing app session gate.
- Actor/system: Auth + `userId` scoping.
- Expected response: Page loads keep `requireUserId`. Queries and materialize keep `userId` on every Prisma `where` / upsert. One user cannot read or rewrite another user’s income, expenses, savings, or derived accounts. No secrets, credentials, or personal financial dumps committed to the repository. No new npm dependencies. No new Prisma models.
- State change: N/A beyond authorized existing writes (materialize upserts for that `userId` only).
- Visible/resulting evidence: Unauthenticated users cannot open `/` or trigger rematerialize (existing redirect / deny).
- Failure behavior: Unauthenticated redirected / denied as today. Materialize no-ops when the user id is missing (`materializeMonthWaterfall` already checks the user exists).
- Acceptance evidence: Code review of `requireUserId` + `userId` on new/changed queries; `package.json` dependencies unchanged; `prisma/schema.prisma` unchanged; no secrets in the diff.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Show Main vs Savings on Overview (not Balance) | R6, R7, R8 |
| Main = cash with the owner; Savings = money actually saved | R6, R8 |
| Stop preferring planned income in the waterfall | R1, R9 |
| Savings only after salary is received (`planned === false`) | R1, R9 |
| Cannot save if Planning / upcoming bills are not covered | R2 |
| Keep 70% lifetime rule on money actually free (leftover, not gross salary) | R3 |
| Overview Saved uses new leftover | R4 |
| Materialize with new inputs / existing rematerialize path | R5 |
| Derived accounts; no Account model | R6 |
| Planning expenses do not reduce Main but block take | R2, R6 |
| Balance series unchanged; Current balance consistent with Main | R8 |
| Keep income planned checkbox; no new income flag | R9 |
| Unit tests for leftover / gate / 70% | R2, R3 |
| Auth / privacy / no secrets / no new deps | R10 |

## Assumptions

- **70% of leftover, not 70% of gross salary.** Taking 70% of received salary before bills would diverge from the leftover waterfall and is usually unaffordable after charged + Planning expenses. Gustavo can correct this on approval; it is not a blocker.
- Accounts belong on **Overview** only. Balance already has a cash running series; a second account pair there would duplicate UI and risk two current-balance stories.
- **Main + Savings = Balance current balance** (Total cash). Main is cash after savings set-aside. Balance Current balance stays Total cash (starting + received − charged) and is not rewritten to subtract Savings.
- The Overview **Lifetime savings** KPI / mobile lifetime footer is replaced by **Savings account** so the lifetime number appears once. Monthly **Saved** stays.
- Rematerialize **rewrites** existing `source: "waterfall"` rows that were computed from planned income. That is the intended correction.
- Empty received income is `0`, not “use planned.” Empty Planning is `0`.
- Light Savings explainer copy is in scope so it no longer says leftover comes from planned income. Income and expense create UX are unchanged.
- No new Prisma models and no new npm packages.

## Open questions

None blocking. The leftover formula, account placement, and “not 70% of gross salary” decision are locked above for approval.

SPEC_READY → specs/received-savings-accounts/
