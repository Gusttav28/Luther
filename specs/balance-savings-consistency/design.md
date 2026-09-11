# Design: Savings leftover everywhere and Balance month compare

- Governing requirements: R1, R2, R3, R4, R5, R6

## Goals

- One Savings headline: this month’s leftover take on Overview, Balance, and Savings (R1, R2).
- Accounts block first on Balance (R3).
- Drop half-month running series UI (R4).
- Month table Spent vs Saved (R5).
- No new packages or Prisma models (R6).

## Current system observations

- Overview Savings (`getDerivedAccounts`) already uses `waterfallFromScope` leftover take. Balance Savings (`getBalanceAccountsPage`) sets `balanceMinor` to `getSavingsAllTimeMinor` (opening + lifetime `SavingsContribution`). Creating Savings with opening 0 still shows the lifetime lump — that is the “amount from somewhere.”
- `getCurrentMonthBreakdown` already has the month take (`fromMain`) but the card headline ignores it.
- Savings page `getSavings` leftover/take now come from `waterfallFromScope` (Main − Planning) after `main-cash-planned-savings`, but UI still shows **From planned salary** and copy about received salary leftover (`plannedTakeFromScope`).
- Balance desktop: title → Starting/Current → running line + income/expense half-month bars → half-month table → Accounts. Mobile: same order, accordion instead of table.
- `getBalanceSeries` is half-month running cash (starting + received − charged). Still used for Starting/Current. Keep the query for those two cards only; do not render series rows.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `lib/queries/accounts.ts` | Savings `balanceMinor` = current month leftover take, not `getSavingsAllTimeMinor`. Keep `getSavingsAllTimeMinor` only if another caller needs it; otherwise stop using it on Balance. | R1 |
| `lib/queries/savings.ts` | Stop exposing `plannedSalaryTakeMinor` (or leave unused). Leftover/take already from `waterfallFromScope`. | R2 |
| `app/(app)/savings/page.tsx` | Remove From planned salary card and received-salary leftover copy. 70% take = leftover take. | R2 |
| `components/savings/mobile-savings.tsx` | Same: drop From planned salary; copy = Main after remaining Planning. | R2 |
| `app/(app)/balance/page.tsx` | Accounts section first. Drop half-month table, running line chart, half-month bar chart. Render month Spent/Saved table. Keep Starting/Current below Accounts. | R3, R4, R5 |
| `components/balance/mobile-balance.tsx` | Accounts first. Drop running chart, half-month bars, accordion. Month list Spent/Saved. Starting/Current below Accounts. | R3, R4, R5 |
| `components/balance/account-section.tsx` | Headline for Savings is `balanceMinor` (now the take). Keep the this-month / leftover-after-save lines or drop duplicates if the headline is already the take. | R1 |
| `lib/queries/balance-months.ts` (new) or `lib/queries/balance.ts` | Helper: list calendar months with `spentMinor` and `savedMinor`. Spent from charged expenses; saved from month leftover / waterfall sum. `userId` scoped. | R5 |
| `tests/unit/balance-months.test.ts` (new) | Pure composition: spent + saved row; current-month saved = leftover take. | R5 |
| `tests/unit/account-breakdown.test.ts` | Assert Balance Savings identity is leftover take, not opening + lifetime (if a helper is extracted). | R1 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `lib/queries/balance-months.ts` | Optional; month Spent/Saved loader. May live in `balance.ts` if smaller. | R5 |
| `tests/unit/balance-months.test.ts` | Month row math. | R5 |

## Data and control flow

Savings headline (Overview + Balance + Savings 70% take):

```
mainCash          = MAIN opening or Settings starting (converted)
remainingPlanning = month Planning expenses
leftover          = max(0, mainCash − remainingPlanning)
take              = percentOf(leftover, 70)
```

Balance Savings card `balanceMinor` = `take` (current month). Do **not** add `Account.openingMinor` or lifetime contributions.

Month table row:

```
spent  = sum(charged expenses in calendar month)
saved  = current month ? live take
       : sum(SavingsContribution waterfall for that year/month)
```

Include a month if spent ≠ 0 or saved ≠ 0 (or conversion null that should still list). Sort chronological ascending or newest first — implement newest first (owner compares recent months first).

Starting/Current: still `getBalanceSeries` totals only; do not render `series.rows`.

## Validation and failure handling

- Null FX: Savings headline null; month cell null; do not coerce to 0.
- No months: empty copy.
- Create Savings: existing validation; display path ignores opening for the headline.
- `safeMaterializeMonth` unchanged; past-month Saved reads stored waterfall rows.

## Security, privacy, accessibility, and performance

- All loaders `userId`-scoped; Balance/Savings/Overview `requireUserId`.
- No amount logging.
- Table headers: Month, Spent, Saved.
- Extra query: charged expenses grouped by month + waterfall contributions grouped by month. Do not load the full half-month series into the UI.

## Dependencies

No new npm packages. No Prisma models. Reuse `waterfallFromScope`, `percentOf`, `getScopeAmounts`, `convertMinor` / `sumInCurrency`.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep Balance Savings = opening + lifetime | **Rejected** | Owner: creating Savings shows an amount “from somewhere.” |
| Recompute past-month leftover from today’s Main | **Rejected** | Today’s Main already dropped with charges; would rewrite August when September is charged. |
| Keep half-month table under the new table | **Rejected** | Owner does not use it. |
| Remove Starting/Current | **Rejected for this item** | Not asked; only the half-month table/charts. |
| Overview Savings becomes lifetime | **Rejected** | Leftover take on Overview is already correct. |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `getBalanceAccountsPage` Savings = month take |
| R2 | Savings page/mobile drop from-planned; leftover copy |
| R3 | Balance page + mobile-balance section order |
| R4 | Remove table/chart/accordion |
| R5 | Month helper + Balance table/list |
| R6 | userId; no new deps/schema |
