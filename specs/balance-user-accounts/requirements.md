# Requirements: Balance user accounts

- Work item: specs/balance-user-accounts/
- Outcome: On Balance (retitled Balance and accounts), the owner can create accounts. Main holds current money. Savings shows how much can be saved from Main vs from planned salary (and their sum). The owner can also create other named accounts (e.g. Prizes) for leftover set-asides.
- Branch: cursor/balance-user-accounts-ef43
- Status: Specification
- Spec version: 2026-09-09

## Problem

Received-savings already derives Overview **Main account**, **Savings account**, and **From planned salary** from leftover math (70% of `max(0, received − charged − planning)`, plus display-only planned take). Gustavo does not want that snapshot to be the only accounts UI. He wants an **option to create accounts** on **Balance**, retitled **Balance and accounts**, so he can:

1. Create a **Main** account with the money he currently has.
2. Create a **Savings** account that shows, for this month, the saveable amount **from Main** (received leftover 70% already in hand), the amount **from planned salary**, and their **sum** (what he could have at month end after expenses) — and have the planned figure **update** when expenses or income change.
3. Later create other named accounts (e.g. **Prizes**) and move leftover into them by choice (not automatically).

Accounts are user-created Prisma rows. Leftover math from `specs/received-savings-accounts/` must not be replaced or duplicated.

## In scope

- Prisma `Account` and `AccountEntry` models (fields and uniqueness as locked below). Existing Prisma migrate / `db push` workflow. No new npm packages.
- Balance page title **Balance and accounts** (desktop + mobile). Route stays `/balance`. Nav pill may stay **Balance**.
- Optional **Add account** on Balance: kind Main / Savings / Custom; name; opening amount. Empty state CTA; CTA remains after the first account so more Custom accounts can be added.
- Main: opening is current cash; creating or updating it also updates Settings `startingBalanceMinor` / currency so the running Balance series stays one current-cash number. Display = Total cash − Savings (received-savings identity).
- Savings: at most one; name default “Savings account”; opening optional default 0 (extra seed only). Card shows current-month **From main account**, **From planned salary**, and **This month (after expenses)** from existing waterfall helpers — not a second waterfall and not typed waterfall `AccountEntry` rows.
- Custom accounts (e.g. Prizes): name + balance; add / withdraw; leftover hint; rename; delete with confirm and cascade entries.
- Keep Overview Main / Savings / From planned salary snapshot. No create-account UI on Overview. Creating accounts does not change leftover math.
- Revalidate `/balance` when income, expenses, savings, or starting balance change so the Savings planned figure and Main cash stay current.
- Auth / privacy (`requireUserId`, `userId` on Account and AccountEntry, no secrets).
- Tests that leftover breakdown is reused (received leftover 70% + `plannedSalaryTakeMinor`), not rewritten.

## Out of scope

- Bank sync, real transfers, shared/household accounts.
- Multiple currencies per account beyond CRC/USD entry (same as today).
- Auto-moving leftover into Prizes or any Custom account.
- Changing the 70% rate.
- Removing the income **Planned (not yet received)** checkbox.
- A new nav route (stay `/balance`).
- Create-account UI on Overview.
- Deleting the unique Main or Savings account (edit opening / name is enough).
- Main add/withdraw ledger UI (Main adjustments in this item are opening ↔ Settings only).
- New npm dependencies.
- Soft-delete.

## Definitions

- **Account**: a user-created row (`MAIN` | `SAVINGS` | `CUSTOM`). Not the Overview derived snapshot by itself. Overview snapshot numbers may exist before any Account row.
- **Main account (row)**: at most one `kind=MAIN` per user. Opening is the money currently had; it is the Settings starting balance after create/update.
- **Savings account (row)**: at most one `kind=SAVINGS` per user. Month breakdown is **derived**. Opening is an extra seed only (default 0), not a copy of Main cash and not a typed waterfall amount.
- **Custom account**: any number of `kind=CUSTOM` rows (e.g. Prizes). Balance = opening + sum of `AccountEntry` amounts in reporting currency.
- **AccountEntry**: signed ledger row for Custom (and schema-allowed for Main). Amount, currency, date, optional note. **Savings does not store waterfall takes as entries.**
- **Total cash**: Settings starting + all received income − all charged expenses = Balance `currentBalance` when rates exist (unchanged).
- **Lifetime savings**: `getLifetimeSavingsBalance` (sum of `SavingsContribution`, including waterfall takes). Unchanged leftover materialize path.
- **Savings all-time (Balance card)**: converted `openingMinor` + lifetime savings. Opening default 0 so this equals Overview Savings unless the owner seeds extra.
- **Main display (Balance card)**: Total cash − Savings all-time when a Savings row exists; otherwise Total cash − lifetime savings (same identity as received-savings Main). Do not clamp at 0.
- **Current calendar month**: today’s local year/month, waterfall period `BOTH` (same month leftover as Overview Saved).
- **fromMain**: actual month lifetime take = `computeWaterfall` / `waterfallFromScope` `lifetimeTakeMinor` = 70% of `max(0, received − charged − planning)` for the current month. Money already in hand. Label **From main account**.
- **fromPlanned**: existing `plannedSalaryTakeMinor` / `plannedTakeFromScope` = `combinedTake − actualTake`. Label **From planned salary**.
- **projectedSum**: `fromMain + fromPlanned`. Label **This month (after expenses)**. What he could have saved this month after expenses if planned salary arrives. Identity: `projectedSum === combinedTake`.
- **Available leftover this month**: `computeWaterfall` `postLifetimeMinor` for the current month (actual received leftover after the 70% take). Hint on Custom cards only; do not auto-transfer.
- **Leftover formula (locked, do not change)**:

  ```
  leftover     = max(0, received − charged − planning)
  actualTake   = floor(70% of leftover)          // fromMain for the month
  combinedTake = floor(70% of max(0, received + plannedSalary − charged − planning))
  fromPlanned  = combinedTake − actualTake
  postLifetime = leftover − actualTake
  ```

## Requirements

### R1 — Prisma Account and AccountEntry; uniqueness; no new packages

- Trigger: Implementer applies schema for this work item.
- Preconditions: Existing Postgres Prisma schema (`User`, `Settings`, `SavingsContribution`, etc.). Human-approved spec.
- Actor/system: `prisma/schema.prisma` + a new migration under `prisma/migrations/` (and `db push` in test globalSetup).
- Expected response: Add:

  ```
  Account:      id, userId, name, kind (MAIN | SAVINGS | CUSTOM), openingMinor, currency, createdAt
  AccountEntry: id, userId, accountId, date, amountMinor (signed), currency, note?
  ```

  `userId` on both. `Account.kind` is an enum or equivalent string union of those three values. At most one `MAIN` and one `SAVINGS` per `userId`; many `CUSTOM`. Do **not** add `@@unique([userId, kind])` on all kinds (that would cap Custom at one). Enforce MAIN/SAVINGS uniqueness in create actions and with partial unique indexes in migration SQL (or a nullable discriminator unique that is null for CUSTOM, if that is required for `db push`). `AccountEntry` cascades when its Account is deleted. User cascade deletes accounts. `openingMinor` integer minor units. `currency` CRC | USD. No new npm packages. `package.json` dependencies unchanged.
- State change: New tables/enum in Postgres. Existing financial tables unchanged. Leftover / `SavingsContribution` waterfall rows unchanged.
- Visible/resulting evidence: `prisma migrate` or `npx prisma db push` applies the models. Prisma Client exposes `account` and `accountEntry`.
- Failure behavior: A second MAIN or SAVINGS insert is rejected (unique / action error), not silently duplicated.
- Acceptance evidence: Schema review against the field list. Migration file exists. `package.json` dependencies unchanged. Second MAIN/SAVINGS cannot persist for the same `userId`.

### R2 — Add account option on Balance (kinds, names, openings)

- Trigger: Authenticated owner opens `/balance` with zero accounts, or chooses **Add account** when some accounts already exist.
- Preconditions: R1. Session via `requireUserId`.
- Actor/system: Balance page (desktop + mobile) + create-account form/action.
- Expected response: CTA label **Add account**. Mobile: bottom sheet (same pattern as existing add sheets). Desktop: card form on the page (not a new route). Kind picker: **Main** / **Savings** / **Custom**. If MAIN already exists, Main is unavailable in the picker (hidden or disabled) and create rejects. If SAVINGS already exists, Savings is unavailable and create rejects. Custom always available. Fields: kind, name, opening amount, opening currency (CRC | USD).

  - **Main**: name default **Main account**; opening **required** (money currently have; 0 allowed; same numeric rules as Settings starting balance, including negative). Prefill opening from Settings starting balance / currency when present.
  - **Savings**: name default **Savings account**; opening optional, empty → 0. Non-negative. No second `kind=SAVINGS`.
  - **Custom**: name **required** (placeholder e.g. Prizes); opening optional, empty → 0. Non-negative.

  Invalid submit persists nothing (Zod on the server).
- State change: One `Account` row for that `userId`. Main also writes Settings (R3). No `AccountEntry` on create unless opening is modeled only on `Account.openingMinor` (opening is **not** an entry).
- Visible/resulting evidence: After success, the new account card appears on Balance. Empty state is gone once at least one account exists; **Add account** remains so more Custom (or the missing Main/Savings slot) can be added.
- Failure behavior: Duplicate MAIN/SAVINGS → field/form error, no row. Unauthenticated → existing redirect/deny. Validation errors shown on the form.
- Acceptance evidence: Manual create of each kind. Second Savings/Main refused. Desktop card form + mobile sheet. Opening default 0 for Savings/Custom when left blank.

### R3 — Main account: opening is starting cash; display is Total cash − Savings

- Trigger: Owner creates or updates Main opening; or views the Main card; or edits Settings starting balance while a Main row exists.
- Preconditions: R1, R2. `getBalanceSeries` / `getDerivedAccounts` identity from received-savings.
- Actor/system: Account create/update actions, Settings update, Balance Main card.
- Expected response:

  ```
  Main display = Total cash − Savings all-time
  Total cash   = starting + received − charged   // Balance currentBalance
  Savings all-time = (Savings row opening converted + lifetime savings)
                     if a Savings row exists
                   else lifetime savings
  ```

  Creating or updating Main `openingMinor` / `currency` also upserts Settings `startingBalanceMinor` / `startingBalanceCurrency` (one current-cash number). Updating Settings starting while Main exists writes the same values onto Main opening/currency. After Main exists, opening **is** the starting balance. Running series still starts from that number (do not subtract Savings from the series or from Current balance). If Main does **not** exist yet, still show running Balance current/start as today; the accounts section shows the create CTA, not a fake Main row.
- State change: `Account` MAIN opening/currency and Settings starting fields stay aligned. No leftover rewrite.
- Visible/resulting evidence: Changing Main opening changes Starting balance and the running series start. Overview Main snapshot remains derived (R8). Main card amount equals Total cash minus Savings all-time when rates exist.
- Failure behavior: Missing FX → Main amount `null` / “—”. Do not clamp Main at 0. Duplicate Main rejected (R1).
- Acceptance evidence: Create Main with opening 1000 → Settings starting 1000 → Balance start 1000. Edit Settings starting → Main opening matches. Main card = current − Savings all-time. No Main row → start/current still shown; CTA visible.

### R4 — Savings account row: extra seed opening; all-time balance; derived month breakdown only

- Trigger: Owner creates the Savings account; views its card.
- Preconditions: R1, R2. `getLifetimeSavingsBalance` and waterfall scope helpers exist.
- Actor/system: Create action + Savings card query.
- Expected response: At most one Savings row. Opening default **0**; it is extra seed only, not current cash copied from Main, and not a waterfall entry. All-time Savings **balance** on the card = converted `openingMinor` + `getLifetimeSavingsBalance`. Lifetime waterfall / adjustment rows remain the source of “saved so far.” Do **not** insert `AccountEntry` (or new `SavingsContribution`) for fromMain / fromPlanned / projectedSum. Actions **reject** `AccountEntry` creates against `kind=SAVINGS`. Do not double-count Main opening as Savings seed: owners who put the same cash in both openings would reduce Main (R3); default 0 and copy in R5 prevent that.
- State change: One SAVINGS `Account`. No change to leftover materialize.
- Visible/resulting evidence: With opening 0, Balance Savings all-time equals Overview Savings. Card also shows R5 month lines. Second Savings cannot be created.
- Failure behavior: Missing FX on opening or lifetime → that balance `null` / “—”. Entry write to Savings → error, nothing persisted.
- Acceptance evidence: Create Savings with blank opening → openingMinor 0. All-time = lifetime. Code review: no waterfall amounts written as `AccountEntry`.

### R5 — Savings month breakdown reuses received-savings math (not a second waterfall)

- Trigger: Owner views a Savings account card on `/balance` for the current calendar month; or received/planned income or charged/Planning expenses change.
- Preconditions: R4. Locked leftover from `specs/received-savings-accounts/` (`lib/waterfall.ts`, `plannedSalaryTakeMinor`, `getScopeAmounts` period `BOTH`).
- Actor/system: Balance Savings card. A small read helper may compose existing functions; it must not reimplement leftover.
- Expected response: When a Savings account exists, the card shows for the **current calendar month** (`BOTH`):

  ```
  fromMain     = actual lifetime take (70% of max(0, received − charged − planning))
  fromPlanned  = plannedSalaryTakeMinor (combinedTake − actualTake)
  projectedSum = fromMain + fromPlanned
  ```

  Labels exactly:

  - **From main account**
  - **From planned salary**
  - **This month (after expenses)** = projectedSum

  Copy: the planned figure updates when expenses or planned/received income change. This is display of the received-savings math; it is **not** a second waterfall and is **not** materialized as `AccountEntry`. Do not change `leftoverAfterReserves`, `computeWaterfall` leftover inputs, `incomeForScope` received-only rule, Planning reserve, or 70% of leftover.
- State change: None (derived). Page data refreshes via existing rematerialize + R10 revalidation.
- Visible/resulting evidence: Planned-only month: fromMain 0, fromPlanned can be positive, projectedSum = fromPlanned. Charging an expense shrinks fromPlanned and/or fromMain per leftover. Receiving planned income moves take from fromPlanned into fromMain. Unit case: received 100, planned 50, charged 20, planning 0 → actual 56, combined 91, fromPlanned 35 (minor-unit scale as in existing waterfall tests; floor).
- Failure behavior: Missing FX → breakdown amounts `null` / “—”. Empty planned salary → fromPlanned `0` when other legs convert.
- Acceptance evidence: Helper unit tests call `computeWaterfall` / `plannedSalaryTakeMinor` (or `waterfallFromScope` / `plannedTakeFromScope`). Existing `tests/unit/waterfall.test.ts` leftover cases still pass without formula changes. Manual: add expense → **From planned salary** and **This month (after expenses)** update after reload.

### R6 — Custom accounts (Prizes): balance, add/withdraw, leftover hint, rename, cascade delete

- Trigger: Owner creates a Custom account; adds or withdraws; renames; deletes; or reads the leftover hint.
- Preconditions: R1, R2. Savings contribution validation already accepts signed amount, CRC/USD, date, optional note.
- Actor/system: Custom card UI + account entry / rename / delete actions.
- Expected response: List **name** + **balance** = converted opening + sum(`AccountEntry.amountMinor`) in reporting currency. **Add** / **withdraw** on the card (one signed-amount control is enough): same money validation as savings contributions (`signedAmountSchema`, currency, date, note optional). Positive = add; negative = withdraw. Show **Available leftover this month** = `postLifetimeMinor` as a **hint only** — the owner may type that amount into the custom account; do **not** auto-transfer leftover into Prizes. Rename Custom (name required, trimmed, max length consistent with other names e.g. 120). Delete Custom only after confirm; **cascade delete entries** (simpler than requiring zero balance). Do not delete MAIN/SAVINGS in this item.
- State change: `AccountEntry` rows for that `accountId` + `userId`. Rename updates `Account.name`. Delete removes the account and its entries. Leftover / Main / Savings derived numbers unchanged (no auto-transfer).
- Visible/resulting evidence: Prizes balance moves only when the owner records add/withdraw. Hint visible on the custom card when rates exist. Confirm dialog/copy before delete; after delete the card is gone.
- Failure behavior: Entry on another user’s account or missing account → deny / generic error. Entry against SAVINGS rejected (R4). Missing FX → balance/hint “—”. Unauthenticated → existing deny. Validation errors on the form; nothing persisted.
- Acceptance evidence: Manual Prizes create, add, withdraw, rename, delete with confirm. Hint equals month `postLifetimeMinor`. No automatic Prizes row from leftover.

### R7 — Page title, nav, running series, empty vs populated accounts

- Trigger: Owner opens `/balance` at mobile (~375px) and desktop (`md+`).
- Preconditions: Existing Balance summary, charts, and half-month table (`app/(app)/balance/page.tsx`, `components/balance/mobile-balance.tsx`).
- Actor/system: Those pages + nav.
- Expected response: Visible page title **Balance and accounts** on both viewports. `href` remains `/balance`. Nav pill/label may stay **Balance** (narrow). Keep Starting balance, Current balance (Total cash), running series, and charts/table meaning unchanged (received − charged from starting; do **not** subtract Savings from Current balance). Accounts are a **section** on this page (cards + Add account). Empty accounts: CTA **Add account**. Populated: cards + CTA. Layout wraps; no horizontal page overflow.
- State change: None beyond R2–R6 writes.
- Visible/resulting evidence: Title string on mobile header and desktop `h1`. Address bar `/balance`. Current balance still matches Total cash.
- Failure behavior: Unauthenticated redirect as today. Null money still “—”.
- Acceptance evidence: Manual title + nav at ~375px and `md+`. Series still matches Settings start + received − charged.

### R8 — Overview snapshot stays; leftover math unchanged; no Overview create UI

- Trigger: Owner opens Overview `/` after this item; leftover is computed anywhere.
- Preconditions: `specs/received-savings-accounts/` implemented (`getDerivedAccounts`, Overview `AccountCards`, `computeWaterfall` leftover).
- Actor/system: Overview page and waterfall/materialize path. **Not** Overview create-account UI.
- Expected response: Keep Overview **Main account**, **Savings account**, and **From planned salary** snapshot even when no Account rows exist (already implemented). Do **not** add Add account / kind picker on Overview. Creating Balance accounts does **not** change leftover, lifetime take, post-lifetime, materialize, or Overview Saved. Overview Savings remains lifetime savings (does not add Savings `openingMinor`). Overview Main remains Total cash − lifetime savings (does not use Custom balances). Balance is the only place to create accounts.
- State change: None to leftover functions except an optional pure composer that only calls existing helpers (R5).
- Visible/resulting evidence: Overview cards still render without Account rows. After creating Main/Savings/Custom, Overview leftover/Saved/from-planned still match the locked formula. Diff does not rewrite `leftoverAfterReserves` / received-only income / Planning reserve.
- Failure behavior: Unchanged Overview null/rate behavior.
- Acceptance evidence: Code review: no create UI on `app/(app)/page.tsx` / overview components. Waterfall leftover tests still pass. Manual: Overview snapshot present before any Account; creating Prizes does not change Overview Saved.

### R9 — Security, privacy, and dependencies

- Trigger: Any Account / AccountEntry read or write, or Balance accounts UI load.
- Preconditions: Existing app session gate (`requireUserId`).
- Actor/system: Pages, server actions, Prisma queries.
- Expected response: Every page/action uses `requireUserId`. Every `Account` / `AccountEntry` query, create, update, and delete filters `userId`. One user cannot read or mutate another’s accounts or entries. AccountEntry `accountId` must belong to the same `userId`. No secrets, credentials, or personal financial dumps committed. No new npm dependencies. No logging of amounts.
- State change: N/A beyond authorized writes for that `userId`.
- Visible/resulting evidence: Unauthenticated users cannot open `/balance` or run account actions (existing redirect/deny).
- Failure behavior: Cross-user id in form → 0 rows updated / generic error, not another user’s data. Unauthenticated denied.
- Acceptance evidence: Code review of `userId` on all new queries/actions; `package.json` dependencies unchanged; no secrets in the diff.

### R10 — Revalidate Balance when leftover or cash inputs change

- Trigger: Owner adds/edits/deletes a charged or Planning expense, received or planned income, savings contribution, or Settings starting balance (or Main opening).
- Preconditions: R5, R3. Today expense/income actions revalidate `/`, `/savings`, etc., but not `/balance`.
- Actor/system: Existing mutation actions plus new account actions.
- Expected response: Those mutations also `revalidatePath("/balance")` (or a layout revalidate that includes it) so the Savings breakdown and Main cash refresh without a stale cache. Account create/entry/rename/delete revalidate `/balance` (and `/` if Main/Settings changed).
- State change: Cache invalidation only, plus the mutation’s own writes.
- Visible/resulting evidence: From Balance, using the global add-expense sheet (or returning to Balance after adding an expense) shows updated **From planned salary** / **This month (after expenses)** and running current.
- Failure behavior: Existing `safeMaterializeMonth` still must not fail the primary write.
- Acceptance evidence: Code review that `/balance` is revalidated from income, expense, savings, settings, and account actions that affect displayed amounts.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Option to create accounts on Balance (not only Overview cards) | R2, R7, R8 |
| Page title Balance and accounts; href `/balance`; nav may stay Balance | R7 |
| Create Main with money currently have; opening ↔ Settings starting | R2, R3 |
| Create Savings; from Main, from planned salary, and sum | R2, R4, R5 |
| Planned figure updates when expenses / income change | R5, R10 |
| Sum = what he could have at end of month after expenses | R5 |
| Create more named accounts (e.g. Prizes); leftover set-aside by choice | R2, R6 |
| Prisma Account + AccountEntry; unique MAIN/SAVINGS; many CUSTOM | R1 |
| Savings KIND no typed waterfall entries; month breakdown derived | R4, R5 |
| Do not undo received-savings leftover formula | R5, R8 |
| Main display = Total cash − Savings; series stays Total cash | R3, R7 |
| If Main missing, still show running current/start + create CTA | R3, R7 |
| Overview snapshot kept; no create UI on Overview | R8 |
| Custom add/withdraw; leftover hint; rename; cascade delete + confirm | R6 |
| Savings opening default 0 extra seed; no double-count with Main | R4 |
| No new npm packages; Prisma migrate/db push in scope | R1, R9 |
| requireUserId; userId on Account and AccountEntry; no secrets | R9 |
| Tests for leftover breakdown reuse | R5 |

## Assumptions

- **Derived-only Overview cards are not enough.** Gustavo asked to create accounts on Balance. Overview snapshot stays as a dashboard; Balance is the ledger UI.
- Savings **opening default 0** so Main cash is not double-counted as already saved. Opening is extra seed only; lifetime `SavingsContribution` remains “saved so far.”
- **fromMain** is the **current month** actual 70% leftover take (`BOTH`), not the all-time savings balance. All-time is a separate figure on the same card.
- **This month (after expenses)** is `fromMain + fromPlanned` (combined take), not Total cash and not all-time Savings.
- Main **AccountEntry** is allowed by the schema but **this item does not ship Main add/withdraw**. Main adjustments are opening ↔ Settings only.
- MAIN and SAVINGS are **not deletable** in this item (unique slots). Custom delete cascades entries after confirm.
- Nav label stays **Balance**; only the page title becomes **Balance and accounts**.
- Overview Savings does **not** include Savings `openingMinor` (lifetime only). With default opening 0 the two Savings figures match.
- Current calendar month on Balance uses today’s date (no new month picker).
- Partial unique indexes plus action checks satisfy “unique (userId, kind) for MAIN and SAVINGS” without blocking many CUSTOM.

## Open questions

None blocking. Uniqueness encoding (partial unique index vs nullable discriminator), Main non-delete, and Savings opening default 0 are locked above for approval.

SPEC_READY → specs/balance-user-accounts/
