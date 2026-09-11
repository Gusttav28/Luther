# Requirements: Savings leftover everywhere and Balance month compare

- Work item: specs/balance-savings-consistency/
- Outcome: The Savings amount is the same leftover take on Overview, Balance, and Savings. Creating a Savings account does not invent a lifetime lump. Balance puts accounts first and replaces the half-month running table with a month-by-month spent vs saved compare.
- Branch: cursor/balance-savings-consistency-ef43
- Status: Specification
- Spec version: 2026-09-11

## Problem

Creating a Savings account on Balance shows a large number that is **opening + all historical waterfall contributions**, not the leftover rule (70% of Main after remaining Planning). Overview already shows this month’s take; Balance and Savings do not. The Balance page also leads with Starting/Current and a **running balance by half-month** table the owner does not use. What Balance should show after the account cards is a month compare: August spent X / saved Y, September spent X / saved Y.

## In scope

- Balance **Savings** headline = this month’s leftover take (same formula and same number as Overview Savings).
- Creating a Savings account does **not** display opening + lifetime contributions as the card amount.
- Savings page leftover / 70% take uses Main − remaining Planning (not received − charged − planning). Remove **From planned salary** on Savings.
- Balance **Accounts** block (the account cards + add account) moves to the **top** of the page (desktop and mobile), under the title.
- Remove the half-month running-balance table (desktop) and the matching mobile half-month accordion.
- Remove the running-balance line chart (it only exists to match that table).
- Add a calendar-month table: **Month | Spent | Saved**. Spent = charged expenses that month. Saved = that month’s leftover take (materialized waterfall sum; current month = live leftover take).
- Optional: one bar chart of the same month Spent vs Saved (no new half-month series).
- Unit tests for month rows and Savings card = month take.
- `requireUserId` / `userId`; no secrets; no new npm packages; no new Prisma models.

## Out of scope

- Changing the leftover formula (`max(0, mainCash − remainingPlanning)`, 70% floor).
- Changing Main card (typed opening) or charge-reduces-Main.
- Deleting Main/Savings accounts.
- Bank sync.
- Changing Custom account math.
- Removing the Savings page history list or manual contribution form.
- Removing Starting/Current summary cards (they stay, **below** Accounts).
- New `/accounts` route.

## Definitions

- **Leftover take (this month)**: `lifetimeTake = floor(70% of max(0, mainCash − remainingPlanning))` from `main-cash-planned-savings`.
- **Savings card amount**: that leftover take for the current calendar month. Same on Overview and Balance.
- **Spent (month)**: converted sum of `Expense.completed === true` in that calendar month.
- **Saved (month)**: leftover take for that month. Current month = live leftover take. Past months = sum of `SavingsContribution` `source = waterfall` for that year/month (H1+H2).
- **Accounts square**: the Accounts section (Main / Savings / Custom cards + add).

## Requirements

### R1 — Savings card is this month’s leftover take on Overview and Balance

- Trigger: Owner views Overview or Balance; or creates a Savings account.
- Preconditions: Human-approved spec. Leftover helper already exists.
- Actor/system: Overview account cards; Balance Savings card.
- Expected response: Both Savings headlines show the **same** leftover take for the current month. Creating Savings with opening 0 (or any opening) must **not** show opening + lifetime contributions as the headline.
- State change: None on read. Create Savings still stores the row (opening allowed) but the displayed amount is the take, not `getSavingsAllTimeMinor`.
- Visible/resulting evidence: Overview Savings equals Balance Savings. After create, if leftover take is 0, the card shows 0 — not a surprise historical total.
- Failure behavior: Missing FX → null / “—” on both, not 0 coerced.
- Acceptance evidence: `getBalanceAccountsPage` Savings `balanceMinor` = month `lifetimeTakeMinor`. Code review: `getSavingsAllTimeMinor` is not the Balance Savings headline.

### R2 — Savings page uses the same leftover, no From planned salary

- Trigger: Owner views `/savings` (desktop and mobile).
- Expected response: Leftover and 70% take come from Main − remaining Planning. Copy matches that rule. **From planned salary** is removed. The 70% take figure equals Overview/Balance Savings for the current month.
- State change: None on read.
- Visible/resulting evidence: No “From planned salary” label. No copy about leftover from received salary minus charged minus planning.
- Failure behavior: Missing FX → null / set-rate.
- Acceptance evidence: `getSavings` / waterfallFromScope; `savings/page.tsx` and `mobile-savings.tsx` props.

### R3 — Accounts section is at the top of Balance

- Trigger: Owner opens `/balance` (desktop and mobile).
- Expected response: After the page title, the first block is **Accounts** (cards + add). Starting/Current and remaining analytics sit **below**.
- Visible/resulting evidence: Accounts cards appear before Starting balance, Current balance, charts, and the month table.
- Acceptance evidence: `app/(app)/balance/page.tsx`, `components/balance/mobile-balance.tsx` order.

### R4 — Remove half-month running table

- Trigger: Balance desktop and mobile.
- Expected response: No “Running balance by half-month” table or accordion. No running-balance line chart. No half-month income vs expenses chart.
- Visible/resulting evidence: No H1/H2 period rows on Balance. Grep: no “Running balance by half-month”.
- Acceptance evidence: Those sections gone from page + mobile-balance.

### R5 — Month compare table: spent vs saved

- Trigger: Balance after Accounts (and after Starting/Current if those remain).
- Expected response: A table (desktop) / list (mobile) of calendar months that have spend or a leftover take, newest first or chronological — pick one and keep it. Columns: **Month**, **Spent**, **Saved**. Spent = charged that month. Saved = leftover take for that month (R1 definition). Empty: “No spent or saved months yet.”
- State change: None (read of expenses + waterfall / leftover).
- Visible/resulting evidence: August spent X, saved Y; September spent X, saved Y. Not a running cash total. Not half-month.
- Failure behavior: Missing FX on a row → that cell null / “—”.
- Acceptance evidence: New helper + unit tests (charged 10_000 and take 42_000 in one month → spent 10_000, saved 42_000). Manual: table matches leftover take for the current month.

### R6 — Auth, privacy, dependencies

- Trigger: All new/changed loaders.
- Expected response: `requireUserId`; `userId` on queries; no secrets; `package.json` unchanged; no new Prisma models.
- Acceptance evidence: Diff review.

## Traceability

| Source request | Requirement IDs |
| --- | --- |
| Savings amount from leftover, not a mystery lifetime lump on create | R1 |
| Same behavior on all screens (Overview, Balance, Savings) | R1, R2 |
| Move accounts square to the top | R3 |
| Remove running by half-month table | R4 |
| Month compare: spent this / saved this | R5 |
| Security / no new packages | R6 |

## Assumptions

- Current-month Saved uses the live leftover take (same as the cards). Past months use already-materialized waterfall rows for that month (sum H1+H2).
- Starting/Current cards stay below Accounts; they are not the month table.
- Custom accounts stay on the Accounts grid; leftover hint on Custom is unchanged.

## Open questions

- None blocking. Saved for a past month is the materialized take for that month, not a recomputation from today’s Main (today’s Main already moved with charges).
