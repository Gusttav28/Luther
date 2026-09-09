# Design: Balance user accounts

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10

## Goals

- Persist user-created Main, Savings, and Custom accounts without a new npm package (R1, R9).
- Put **Add account** on Balance (retitled **Balance and accounts**), not Overview (R2, R7, R8).
- Keep one current-cash number: Main opening ↔ Settings starting; running series stays Total cash; Main card = Total cash − Savings all-time (R3, R7).
- Show Savings month lines from existing leftover helpers (`fromMain`, `fromPlanned`, `projectedSum`); do not invent a second waterfall or typed Savings entries (R4, R5, R8).
- Let Custom accounts (e.g. Prizes) hold leftover the owner chooses to record; hint `postLifetimeMinor`; cascade delete (R6).
- Refresh `/balance` when leftover or cash inputs change (R10).

## Current system observations

- `prisma/schema.prisma` — no `Account`. Money is integer minor units; every financial row has `userId`. `Settings.startingBalanceMinor` / `startingBalanceCurrency` already drive Balance. Tests apply schema with `npx prisma db push` (`tests/global-setup.ts`). `npm run db:migrate` is `prisma migrate dev`. One historic migration `prisma/migrations/20260721140000_init_postgres/`.
- `lib/waterfall.ts` — leftover = `max(0, received − charged − planning)`; `lifetimeTakeMinor` = 70% floor; `plannedSalaryTakeMinor` = combinedTake − actualTake; `postLifetimeMinor` = leftover − take. **Do not change this formula.**
- `lib/queries/waterfall-scope.ts` — `getScopeAmounts` / `waterfallFromScope` / `plannedTakeFromScope` for month `BOTH` or a half. Materialize still writes `SavingsContribution` waterfall rows only.
- `lib/queries/accounts.ts` — derived Overview pair: Savings = `getLifetimeSavingsBalance`; Total cash = `getBalanceSeries().currentBalance`; Main = Total cash − Savings. Keep this for Overview (R8).
- `lib/queries/balance.ts` — received income (`planned: false`) and charged expenses (`completed: true`); `currentBalance` is Total cash. **Do not subtract Savings from the series.**
- `app/(app)/balance/page.tsx` + `components/balance/mobile-balance.tsx` — title **Balance**; start/current cards; charts; half-month table. No accounts section. `dynamic = "force-dynamic"`.
- `components/icons.ts` — nav `{ href: "/balance", label: "Balance" }`. Keep href; label may stay **Balance**.
- `components/overview/account-cards.tsx` — Overview snapshot only. Do not add create UI there.
- `app/(app)/savings/actions.ts` + `lib/validation.ts` `savingsContributionSchema` — signed amount, date, CRC/USD, optional note. Reuse for Custom entries.
- `components/add-savings-sheet.tsx` — mobile bottom sheet pattern to copy for **Add account**.
- Expense/income/savings actions revalidate `/`, `/savings`, `/projects` but **not** `/balance`. Settings uses `revalidatePath("/", "layout")`.
- `getLifetimeSavingsBalance` lives in `lib/queries/overview.ts` (duplicate in `savings-balance.ts`). Prefer the Overview import; do not add a third copy.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `prisma/schema.prisma` | `AccountKind` enum; `Account` and `AccountEntry` models; `User` relations. Index `[userId, kind]`. **No** full unique on `[userId, kind]`. `onDelete: Cascade` from User→Account and Account→AccountEntry. | R1, R9 |
| `prisma/migrations/<timestamp>_balance_user_accounts/migration.sql` | Create enum/tables/FKs/indexes. Partial unique indexes: one MAIN and one SAVINGS per `userId`. | R1 |
| `lib/validation.ts` | Account create/update and AccountEntry schemas (kind enum, name, opening, signed entry). Reuse `signedAmountSchema` / `isoDateSchema` / `anyCurrencySchema`. | R2, R3, R4, R6, R9 |
| `lib/queries/accounts.ts` | Keep `getDerivedAccounts` for Overview. Add loaders used by Balance: list user accounts; Savings all-time; current-month breakdown; Custom balances; `postLifetimeMinor` hint. All `userId`-scoped. | R3, R4, R5, R6, R8, R9 |
| `lib/waterfall.ts` | **Do not change leftover math.** Optional: a one-function composer `savingsMonthBreakdownFromTakes(actualTake, fromPlanned)` that only adds. Prefer composing in `accounts.ts` via `waterfallFromScope` + `plannedTakeFromScope` and leave this file untouched. | R5, R8 |
| `app/(app)/settings/actions.ts` | If a MAIN account exists, write opening/currency from starting balance; `revalidatePath("/balance")`. | R3, R10 |
| `app/(app)/income/actions.ts` | `revalidatePath("/balance")` on create/update/delete. | R5, R10 |
| `app/(app)/expenses/actions.ts` | `revalidatePath("/balance")` on mutations that change leftover or cash. | R5, R10 |
| `app/(app)/savings/actions.ts` | `revalidatePath("/balance")` (lifetime savings feeds Savings all-time / Main). | R3, R4, R10 |
| `app/(app)/overview-actions.ts` | `revalidatePath("/balance")` if Refresh rematerialize should refresh Balance Savings. | R5, R10 |
| `app/(app)/balance/page.tsx` | Title **Balance and accounts**; load accounts + breakdown; render desktop accounts section + forms; pass data into `MobileBalance`. Keep series/current as Total cash. | R2, R3, R4, R5, R6, R7 |
| `components/balance/mobile-balance.tsx` | Title **Balance and accounts**; empty CTA; account cards; Add account sheet trigger. Keep summary/charts/list. | R2, R5, R6, R7 |
| `tests/unit/waterfall.test.ts` | Keep existing leftover / from-planned cases. Add (here or in a sibling unit file) breakdown reuse: `projectedSum === actual + fromPlanned` and the received-100 / planned-50 / charged-20 case without changing leftover. | R5, R8 |
| `tests/unit/validation.test.ts` | Account/entry schema cases if that file already tests Zod money schemas. | R2, R6 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `prisma/migrations/<timestamp>_balance_user_accounts/migration.sql` | Tables + partial unique MAIN/SAVINGS | R1 |
| `app/(app)/balance/actions.ts` | Create account; update Main opening; rename Custom; delete Custom (cascade); create Custom entry. `requireUserId`; `userId` on every write. | R2, R3, R4, R6, R9, R10 |
| `app/(app)/balance/account-forms.tsx` | Desktop create form (card); Custom add/withdraw; rename; delete confirm. | R2, R6, R7 |
| `components/balance/add-account-sheet.tsx` | Mobile **Add account** bottom sheet wrapping the same fields. | R2, R7 |
| `components/balance/account-section.tsx` (or `account-cards.tsx`) | Main / Savings / Custom cards: labels, breakdown, leftover hint, actions. Shared by desktop + mobile where practical. | R3, R4, R5, R6, R7 |
| `tests/unit/account-breakdown.test.ts` | Optional sibling if breakdown helper is not in `waterfall.test.ts`. Pure composition tests; no second leftover implementation. | R5 |

Do **not** add: npm packages; Overview create-account UI; a new `/accounts` route; changes to `incomeForScope` received-only / Planning reserve; bank sync.

Do **not** change unless a one-line revalidate is required: leftover formula in `lib/waterfall.ts`, `lib/queries/balance.ts` running math, Overview `account-cards.tsx` labels.

## Data and control flow

### Schema (locked fields)

```
enum AccountKind { MAIN SAVINGS CUSTOM }

Account
  id, userId, name, kind, openingMinor, currency, createdAt
  index (userId, kind)
  UNIQUE partial: (userId) WHERE kind = MAIN
  UNIQUE partial: (userId) WHERE kind = SAVINGS

AccountEntry
  id, userId, accountId, date, amountMinor (signed), currency, note?
  FK account ON DELETE CASCADE
  index (userId, accountId)
```

`db push` may omit partial unique indexes; **actions must still reject** a second MAIN/SAVINGS (`findFirst` + unique-violation handling). Allowed extra column: nullable `kindSlot` unique with `(userId, kindSlot)` if that is the only way to get uniqueness under `db push` without blocking CUSTOM — not a product field.

Savings KIND: **no** free-typed waterfall amounts as entries. Create-entry action: load account by `id` + `userId`; if `kind !== CUSTOM` reject (MAIN has no entry UI; SAVINGS forbidden).

Opening lives on `Account.openingMinor`, not as an `AccountEntry`.

### Create account

```
Add account (sheet | card)
  → kind + name + opening + currency
  → Zod
  → requireUserId
  → if MAIN or SAVINGS: fail if one exists
  → if MAIN: upsert Settings starting = opening/currency (same transaction if practical)
  → insert Account
  → revalidate /balance and / (layout if Main/Settings changed)
```

Defaults: Main name “Main account”; Savings name “Savings account”; Savings/Custom opening 0. Main opening prefilled from Settings.

### Main cash identity

```
Settings starting  ←→  Account(MAIN).opening   // bidirectional
Total cash         = getBalanceSeries.currentBalance
Savings all-time   = convert(SAVINGS.opening) + getLifetimeSavingsBalance
                     or getLifetimeSavingsBalance if no SAVINGS row
Main card          = Total cash − Savings all-time
Current balance UI = Total cash                  // unchanged
```

Custom balances do **not** enter Main or Total cash (set-asides are owner bookkeeping, not a second cash series).

### Savings month breakdown (current calendar month, period BOTH)

```
scope        = getScopeAmounts(userId, year, month, "BOTH", reporting, rates)
wf           = waterfallFromScope(scope)              // actual leftover take
fromMain     = wf.lifetimeTakeMinor
fromPlanned  = plannedTakeFromScope(scope)
projectedSum = fromMain + fromPlanned                 // === combinedTake
postLifetime = wf.postLifetimeMinor                   // Custom hint
```

Null any leg → show “—” for that figure. Do not call a new leftover formula.

Labels on the Savings card:

| UI label | Field |
| --- | --- |
| (all-time) balance | opening + lifetime |
| From main account | fromMain |
| From planned salary | fromPlanned |
| This month (after expenses) | projectedSum |

Copy (both viewports): planned amount updates when expenses or planned/received income change.

### Custom

```
balance = convert(opening) + Σ convert(AccountEntry)
hint    = postLifetimeMinor
add/withdraw → AccountEntry (signed)
rename → Account.name where kind=CUSTOM
delete → confirm → prisma.account.delete (cascade entries) where kind=CUSTOM and userId
```

### Overview

```
getDerivedAccounts unchanged
AccountCards unchanged
No Add account on /
Creating Account rows does not feed leftover or Overview Saved
```

### UI structure (`/balance`)

```
h1: Balance and accounts
[existing start / current]
[existing charts / running table]     // desktop hidden md:block / mobile md:hidden as today

Accounts
  empty → Add account CTA
  else  → Main card? Savings card? Custom cards… + Add account
```

Kind picker omits or disables slots that already exist.

## Validation and failure handling

- Server Zod on every account/entry write; invalid → no persist.
- MAIN/SAVINGS duplicate → form error.
- AccountEntry only for CUSTOM in this item.
- Custom delete: confirm in UI; cascade in DB; `deleteMany`/`delete` always `userId` scoped.
- FX null → Money “—”; do not coerce to 0.
- Main not clamped at 0.
- `safeMaterializeMonth` still swallows materialize errors on Settings/income/expense paths.
- Unauthenticated: existing `requireUserId` redirect/deny.

## Security, privacy, accessibility, and performance

- `requireUserId` on Balance page and all new actions.
- `where: { id, userId }` (or `userId` + `accountId`) on every update/delete.
- Verify `account.userId === session user` before inserting an entry.
- No amount logging; no financial dumps; no secrets in schema/migrations (none needed).
- Accounts section `aria-label="Accounts"`. Sheet: `role="dialog"`, Escape to close, like `AddSavingsSheet`.
- Labels are visible text, not icon-only. Confirm delete is a real confirm (dialog or `confirm`).
- Extra queries: list accounts, group entries, one `getScopeAmounts(BOTH)` for breakdown + hint, reuse `getBalanceSeries` / lifetime. Acceptable. No new chart libraries.

## Dependencies

No new npm packages. Prisma schema change **is** in scope. Reuse `computeWaterfall`, `plannedSalaryTakeMinor`, `getLifetimeSavingsBalance`, `getBalanceSeries`, `savingsContributionSchema` pieces, existing sheets, `Money`. New packages are prohibited.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Derived-only Overview cards (received-savings) | **Rejected** | Owner asked for an **option to create accounts** on **Balance**, including Main with current money, Savings month lines, and later Prizes. Overview snapshot stays; it is not the create UI. |
| Put create-account UI on Overview | Rejected | Locked: Balance is the place to create accounts. Overview remains a snapshot. |
| `@@unique([userId, kind])` on all kinds | Rejected | Would allow only one Custom (no Prizes + others). Use partial unique / action checks. |
| No Prisma models; keep derived-only | Rejected | Owner explicitly allowed Account / AccountEntry. |
| Second waterfall for Savings card amounts | Rejected | Duplicate leftover would drift. Reuse `waterfallFromScope` + `plannedTakeFromScope`. |
| Persist fromMain/fromPlanned as AccountEntry or extra SavingsContribution | Rejected | Savings month breakdown is derived; materialize already owns waterfall rows. |
| Auto-transfer post-lifetime leftover into Prizes | Rejected | Owner: option to set aside; hint only. |
| Subtract Savings from Balance Current balance / series | Rejected | Received-savings R8: series stays Total cash. Main card does the subtraction. |
| Savings opening defaulted to Main cash / lifetime take | Rejected | Double-count with Main opening. Default 0; extra seed only. |
| New `/accounts` route | Rejected | Stay `/balance`. |
| New npm package (form lib, UUID, etc.) | Rejected | Prohibited. |
| Deleting Main/Savings | Deferred | Unique slots; opening/name edit is enough. Custom delete is in scope. |
| Main add/withdraw ledger | Deferred | One cash number is opening ↔ Settings. Schema may still allow AccountEntry on MAIN later. |
| Change 70% or planned checkbox | Rejected | Out of scope; leftover locked. |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `schema.prisma` + migration; partial unique MAIN/SAVINGS; no new deps |
| R2 | Add account sheet/card; kind picker; defaults; action uniqueness |
| R3 | Main opening ↔ Settings; Main card = Total cash − Savings all-time; series unchanged |
| R4 | Savings row; opening 0 seed; all-time = opening + lifetime; reject Savings entries |
| R5 | `getScopeAmounts(BOTH)` + existing takes; labels; copy; no leftover rewrite |
| R6 | Custom balance/entries/hint/rename/cascade delete |
| R7 | Title **Balance and accounts**; href `/balance`; empty CTA; keep series UI |
| R8 | Overview `getDerivedAccounts` / `AccountCards` untouched as create UI; leftover locked |
| R9 | `requireUserId` + `userId` on Account/AccountEntry; no secrets |
| R10 | `revalidatePath("/balance")` on income/expense/savings/settings/account actions |
