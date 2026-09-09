# Design: Received savings and Overview accounts

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10

## Goals

- Compute leftover from **received** income only, after reserving Planning bills; 70% lifetime take of that leftover (R1–R3).
- Drive Overview Saved, Savings/Projects leftover figures, and existing materialize from those inputs (R4, R5).
- Derive Main and Savings accounts without a new model; show them on Overview only; keep Balance’s cash series and the identity `Main + Savings = Current balance` (R6–R8).
- Leave the income planned checkbox as “not yet received”; no new flags, models, or npm packages (R9, R10).

## Current system observations

- `lib/queries/waterfall-scope.ts` — `incomeForScope` loads `planned: true` first and falls back to `planned: false` if none. Comment: “Prefer planned income; fall back to actual.” `expensesForScope` is `completed: true` only (same date rules: full month `gte` start `lt` next month for `BOTH`; half via `periodDateRange`). `getScopeAmounts` returns `{ plannedIncomeMinor, expensesMinor }`. `materializeHalfWaterfall` skips when either is `null`; otherwise `computeWaterfall` and upserts lifetime + priority project takes.
- `lib/waterfall.ts` — `WaterfallInput` is `{ plannedIncomeMinor, expensesMinor, projectAllocationPercent? }`. Leftover = `max(0, plannedIncome − expenses)`. Lifetime = `percentOf(leftover, 70)` (floor). Post-lifetime = leftover − take. Project take from post-lifetime.
- `lib/queries/overview.ts` — `loadMonthSnapshot` income is already `planned: false`; expenses `completed: true`. `figuresFromSnapshot` sets monthly **Saved** to `monthWf.lifetimeTakeMinor` when scope waterfall computes. Earned/spent/remaining use snapshot received + charged; remaining subtracts that Saved take. `getLifetimeSavingsBalance` groups `savingsContribution` by currency for `userId`.
- `lib/queries/overview-dashboard.ts` — loads current + prior snapshots and six `getScopeAmounts` calls; no account pair today.
- `lib/queries/savings.ts` / `lib/queries/projects.ts` — leftover / lifetime take / post-lifetime / project expected take from `getScopeAmounts` + `computeWaterfall` with `plannedIncomeMinor`.
- `lib/queries/balance.ts` — all-time received income (`planned: false`) and charged expenses (`completed: true`); running from Settings starting balance; `currentBalance` is the last running figure (Total cash).
- `lib/queries/settings.ts` — `startingBalanceMinor` / `startingBalanceCurrency` already exist.
- `lib/queries/materialize.ts` — `safeMaterializeMonth` after mutations; must keep swallowing materialize errors.
- `app/(app)/page.tsx` — KPI list: Earned, Spent, Saved, Remaining, Lifetime savings. Passes the same list into `MobileOverview` and `KpiCards`.
- `components/overview/kpi-cards.tsx` — desktop 2/3/5 grid; mobile 2×2 monthly + lifetime footer. `KpiItem` keys include `lifetime`.
- `components/overview/mobile-overview.tsx` — `KpiCardsMobile` then charts; no account pair.
- `app/(app)/income/income-forms.tsx` — checkbox **Planned (not yet received)** (`name="planned"`). Keep.
- `app/(app)/savings/page.tsx` and `components/savings/mobile-savings.tsx` — explainer says leftover is 70% of what remains from **planned income**.
- `tests/unit/waterfall.test.ts` — leftover described as planned income minus expenses; no Planning-reserve cases.
- `tests/unit/aggregations.test.ts` — Overview Saved/remaining may still expect contribution-row or pre-waterfall numbers; seed includes a planned income row. Update if assertions drift after R1–R4.
- Duplicate helper: `lib/queries/savings-balance.ts` also exports `getLifetimeSavingsBalance`. Prefer the existing Overview/savings import path; do not add a third copy. Do not spend this item unifying the duplicate unless a new accounts helper must pick one.
- No Prisma `Account` model. `Expense.completed` and `IncomeEntry.planned` are the only flags needed.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `lib/waterfall.ts` | Extend leftover inputs: received income, charged expenses, Planning reserve. Leftover = `max(0, received − charged − planning)`. Keep `percentOf` / 70% / project cap. Rename `plannedIncomeMinor` so callers cannot keep passing planned income by accident. | R1, R2, R3, R10 |
| `lib/queries/waterfall-scope.ts` | `incomeForScope`: `planned: false` only; no planned fallback. Add Planning expense sum (`completed: false`) with the same date scoping as `expensesForScope`. Extend `ScopeAmounts` (received / charged / planning). `getScopeAmounts` and `materializeHalfWaterfall` pass the new leftover into `computeWaterfall`. | R1, R2, R5, R9, R10 |
| `lib/queries/overview.ts` | `figuresFromSnapshot` / `getOverview` use renamed scope fields. Do not change snapshot earned (received) or spent (charged). | R4, R1 |
| `lib/queries/overview-dashboard.ts` | Load derived Main + Savings (R6) and return them on `OverviewDashboard` for the page. | R6, R7, R8 |
| `lib/queries/accounts.ts` (new) **or** a helper next to `getLifetimeSavingsBalance` | `getDerivedAccounts(userId, settings)`: Savings = lifetime balance; Total cash via starting + all received − all charged (reuse Balance filters or `getBalanceSeries().currentBalance`); Main = Total cash − Savings. All `userId`-scoped. | R6, R8, R10 |
| `lib/queries/savings.ts` | Call `computeWaterfall` with the new scope fields. | R4 |
| `lib/queries/projects.ts` | Same field/input update for month leftover, expected take, projections. | R4 |
| `app/(app)/page.tsx` | Render account pair + From planned salary; drop Lifetime savings from the monthly KPI list; pass accounts into `MobileOverview`. | R7, R6, R11 |
| `components/overview/mobile-overview.tsx` | Render the same account pair + optional hint on `md:hidden`. | R7 |
| `components/overview/kpi-cards.tsx` | Stop requiring a `lifetime` KPI on mobile (remove footer when no lifetime item). Keep monthly Earned/Spent/Saved/Remaining. | R7 |
| `components/overview/account-cards.tsx` (new) | Desktop + mobile presentation: **Main account**, **Savings account**, **From planned salary**, optional one-line hint. Reuse `Money` and existing card classes. | R7, R11 |
| `app/(app)/savings/page.tsx` | Replace “planned income” explainer with received salary + reserved bills wording. Figures already come from `getSavings`. | R4 |
| `components/savings/mobile-savings.tsx` | Same explainer update. | R4 |
| `tests/unit/waterfall.test.ts` | Leftover = received − charged − planning; ≤ 0 gate; 70% of leftover not gross; existing floor / project-cap cases updated to new input names. | R2, R3 |
| `tests/unit/aggregations.test.ts` | Update Overview Saved/remaining (and Savings leftover if asserted) so they match received leftover, not planned income or stale contribution Saved. | R4 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `lib/queries/accounts.ts` | Derived Main / Savings / Total cash helper. Skip this file only if the helper is placed in `overview.ts` without a third `getLifetimeSavingsBalance`. | R6, R8, R10 |
| `components/overview/account-cards.tsx` | Overview account pair (desktop + mobile exports or one component with a `compact` flag). Skip only if the pair is inlined into `kpi-cards.tsx` with the same labels. | R7 |

Do **not** add: Prisma models, `package.json` dependencies, Balance account cards, income/expense form redesigns.

Do **not** change (unless a rename import forces a one-line type fix): `lib/queries/balance.ts` filters and running math, `prisma/schema.prisma`, income planned checkbox, expense create status UX, `safeMaterializeMonth` error swallowing.

## Data and control flow

### Locked leftover (reporting currency, integer minor units)

```
receivedIncome   = Σ IncomeEntry where planned === false     // scope: month or half
chargedExpenses  = Σ Expense where completed === true        // same date scope as today
planningExpenses = Σ Expense where completed === false       // same date scope

raw              = receivedIncome − chargedExpenses − planningExpenses
leftover         = max(0, raw)
lifetimeTake     = leftover === 0 ? 0 : floor(leftover * 70 / 100)
postLifetime     = leftover − lifetimeTake
projectTake      = percentOf(postLifetime, clamp(allocationPercent))  // unchanged
```

`sumInCurrency([])` is already `0`. Missing rate → `null` for that sum → do not call `computeWaterfall` / do not materialize that half.

### Preferred leftover API

Keep one pure function so unit tests stay in `tests/unit/waterfall.test.ts` (no DB):

```ts
interface WaterfallInput {
  receivedIncomeMinor: number;
  chargedExpensesMinor: number;
  planningExpensesMinor: number;
  projectAllocationPercent?: number;
}
```

`computeWaterfall` computes leftover from the three legs (or calls a tiny `leftoverAfterReserves` then existing `percentOf(70%)`). Do not keep `plannedIncomeMinor` on the input type.

Alternative allowed by the work item (not preferred): leave `computeWaterfall({ plannedIncomeMinor, expensesMinor })` and set `expensesMinor = charged + planning` at the caller after `incomeForScope` is received-only. Rejected as the primary shape because the field name `plannedIncomeMinor` invites regressions (R1) and hides the Planning reserve.

### Scope loaders

```
incomeForScope        → planned: false, period in [H1], [H2], or both
expensesForScope      → completed: true, existing date bounds (charged)
planningExpensesForScope → completed: false, identical date bounds
getScopeAmounts       → { receivedIncomeMinor, chargedExpensesMinor, planningExpensesMinor }
```

Date bounds stay as today:

- `BOTH`: `[monthStart, nextMonthStart)` (`gte` / `lt`)
- H1 / H2: `periodDateRange` (`gte` / `lte`)

Rename call sites in `overview.ts`, `savings.ts`, `projects.ts`, `materializeHalfWaterfall`. Null-check all three legs before `computeWaterfall`.

### Materialize

```
mutation / Overview Refresh / explicit materialize
  → safeMaterializeMonth / materializeMonthWaterfall
  → materializeHalfWaterfall × H1, H2
  → getScopeAmounts (received, charged, planning)
  → computeWaterfall
  → upsert SavingsContribution source=waterfall
  → upsert ProjectContribution source=waterfall when priority applies and projectTake > 0
```

When leftover ≤ 0, lifetime upsert amount is `0`. Existing project upsert runs only when `projectTakeMinor > 0` (already). Prior planned-income waterfall amounts are overwritten on rematerialize (R5).

Page reads stay skip-materialize (app-performance rule). Correctness after income/expense changes remains mutation rematerialize + Overview Refresh.

### Derived accounts

```
Savings = Σ savingsContribution (getLifetimeSavingsBalance)

Total cash = startingBalance + Σ received income − Σ charged expenses
           = getBalanceSeries(userId, settings).currentBalance
             (when the series is empty, currentBalance is startingBalance)

Main = Total cash − Savings
```

Planning expenses are omitted from Total cash / Main. Prefer computing Total cash from `getBalanceSeries` so Main cannot drift from Balance Current balance (R8). If the implementer inlines the same two Prisma filters instead, they must match `balance.ts` exactly (`planned: false`, `completed: true`, starting balance conversion).

All-time, not month-scoped. No MoM on account cards.

Invariant when rates exist:

```
Main + Savings === Balance currentBalance
```

### Overview UI

```
getOverviewDashboard
  → overview figures (Saved = new lifetimeTake)
  → accounts { mainAccountMinor, savingsAccountMinor }

Desktop (md+): AccountCards then KpiCards (earned, spent, saved, remaining)
Mobile:      AccountCards then KpiCardsMobile (four monthly KPIs, no lifetime footer)
```

Labels exactly **Main account** and **Savings account**. Optional hint (same on both viewports), e.g. “Savings only move after received salary and reserved upcoming bills.”

`KpiItem` may drop `"lifetime"` or keep it unused. Do not pass a Lifetime savings item.

### Balance

No UI or formula change. Current balance remains Total cash. Document the identity in code comments on the accounts helper if useful. No account cards on `/balance`.

### Income planned flag

No schema or form change. Planned rows stay on Income. Waterfall ignores them.

## Validation and failure handling

- Leftover never negative after clamp; takes are 0 when leftover is 0.
- Floor on percent takes (existing `percentOf`) so we never over-allocate.
- FX `null`: skip waterfall compute and materialize for that scope; account amounts `null`; `Money` shows “—”.
- Empty received or empty Planning: `0`, not fallback / not skip.
- `safeMaterializeMonth` still catches errors so the primary mutation succeeds.
- Do not coerce Main to 0 when Savings > Total cash.
- Unauthenticated: existing `requireUserId` redirect / deny.
- Materialize upsert `where` stays user-scoped unique keys.

## Security, privacy, accessibility, and performance

- Every new query: `userId` from `requireUserId` (pages) or the same id already passed into query functions. Upserts keep `userId` in the unique where.
- Do not log amounts. Do not commit `.env` or financial dumps.
- Account section: `aria-label` such as “Accounts”; amounts via existing `Money`.
- Hint is supporting text, not the only name of the values.
- Extra work: one Balance-series (or equivalent all-time aggregate) plus lifetime groupBy already used on Overview. Acceptable. Do not add npm chart/account libraries.
- No new client-side financial aggregation that bypasses `userId`.

## Dependencies

No new npm dependencies. No new Prisma models or migrations. Reuse `IncomeEntry.planned`, `Expense.completed`, Settings starting balance, `SavingsContribution`, and existing `computeWaterfall` / `percentOf`. New packages are prohibited.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| 70% of gross received salary, then pay bills from the rest | Rejected | Diverges from the leftover waterfall; usually unaffordable after charged + Planning bills. Locked: 70% of leftover after received − charged − planning. Non-blocking assumption for Gustavo on approval. |
| Put Main / Savings on Balance | Rejected | Leader placement is Overview — that is where Saved is wrongly derived from planned income. Balance already has a cash series. Duplicate cards would create two current-balance stories. |
| Define Main as starting + received − charged **without** subtracting Savings | Rejected | Would equal Balance Current balance and leave no distinct Main. Locked formula subtracts Savings. Consistency is `Main + Savings = Current balance`. |
| Subtract Savings from Balance Current balance / running series so Current equals Main | Rejected | Last table row would no longer match Current balance (or the series would stop being income − expenses). User: keep the cash series; prefer Overview-only cards. |
| New Prisma `Account` model / bank sync / transfers | Rejected | Out of scope; derived pair is enough. |
| New `received` income flag | Rejected | `planned === false` already means received. |
| Keep `incomeForScope` planned-first fallback | Rejected | That is the bug: unreceived money looks saved. |
| Ignore Planning expenses in leftover (charged-only, as today) | Rejected | Owner cannot save if upcoming payments are not covered. |
| Pass `expensesMinor = charged + planning` but keep `plannedIncomeMinor` name | Allowed as a fallback, not preferred | Fewer type edits, higher regression risk. Prefer renamed received + explicit planning field. |
| Change leftover only in Overview; leave materialize on planned income | Rejected | Saved and lifetime rows would disagree after Refresh. |
| Editable 70% | Rejected | Out of scope. |
| Auto-pay Planning expenses | Rejected | Out of scope. |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `incomeForScope` received-only; `WaterfallInput.receivedIncomeMinor`; no planned fallback |
| R2 | `planningExpensesForScope` + leftover `max(0, received − charged − planning)`; take 0 when leftover 0 |
| R3 | Existing `percentOf` / `LIFETIME_SAVINGS_PERCENT = 70` on leftover only |
| R4 | Overview / Savings / Projects call sites + Savings explainer copy; aggregations test update |
| R5 | `materializeHalfWaterfall` via new `getScopeAmounts`; existing rematerialize entrypoints |
| R6 | `getDerivedAccounts` (or equivalent): Savings = lifetime; Main = Total cash − Savings |
| R7 | `account-cards` + Overview desktop/mobile; drop duplicate Lifetime KPI |
| R8 | Balance files unchanged; identity Main + Savings = `currentBalance` |
| R9 | Income forms untouched; waterfall does not read `planned: true` as income |
| R10 | `userId` / `requireUserId`; no schema; no new deps; no secrets |
| R11 | `plannedSalaryMinor` on scope; `fromPlanned = combinedTake − actualTake`; Overview account cards |
