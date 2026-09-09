# Tasks: Balance user accounts

## Implementation checklist

- [ ] T1 — Prisma Account + AccountEntry schema and migration
  - Files: `prisma/schema.prisma`, `prisma/migrations/<timestamp>_balance_user_accounts/migration.sql`
  - Requirements: R1, R9
  - Preconditions: Human-approved spec; branch `cursor/balance-user-accounts-ef43`
  - Expected evidence: Models match locked fields (`Account`: id, userId, name, kind MAIN|SAVINGS|CUSTOM, openingMinor, currency, createdAt; `AccountEntry`: id, userId, accountId, date, amountMinor signed, currency, note?). User relations + cascade. Index `(userId, kind)`. No `@@unique([userId, kind])` that caps Custom at one. Partial unique indexes (or equivalent) for one MAIN and one SAVINGS per user. `package.json` dependencies unchanged. `npx prisma generate` succeeds. `db push` / migrate can apply the tables.

- [ ] T2 — Validation schemas for create account and custom entries
  - Files: `lib/validation.ts`, `tests/unit/validation.test.ts` (if that file already covers Zod money)
  - Requirements: R2, R3, R4, R6
  - Preconditions: T1
  - Expected evidence: Kind enum Main/Savings/Custom. Name required for Custom (trim, max ~120); Main/Savings names defaultable. Main opening required (Settings-like, 0 and negative allowed). Savings/Custom opening optional → 0, non-negative. Entry reuses signed amount, date, CRC/USD, optional note. Invalid input does not transform into a persistable object.

- [ ] T3 — Balance account queries: list, Main identity, Savings all-time, month breakdown, leftover hint
  - Files: `lib/queries/accounts.ts` (keep `getDerivedAccounts`), optionally `tests/unit/account-breakdown.test.ts`
  - Requirements: R3, R4, R5, R6, R8, R9
  - Preconditions: T1
  - Expected evidence: All queries filter `userId`. Savings month breakdown uses `getScopeAmounts(..., "BOTH")` + `waterfallFromScope` + `plannedTakeFromScope` (or `computeWaterfall` + `plannedSalaryTakeMinor` with the same inputs). `fromMain` / `fromPlanned` / `projectedSum = fromMain + fromPlanned`. Custom hint = `postLifetimeMinor`. Savings all-time = converted opening + `getLifetimeSavingsBalance`. Main display = Total cash − Savings all-time. `getDerivedAccounts` still used by Overview and still uses lifetime only (no opening). `lib/waterfall.ts` leftover formula unchanged.

- [ ] T4 — Server actions: create account, Main/Settings sync, custom entry, rename, cascade delete
  - Files: `app/(app)/balance/actions.ts`, `app/(app)/settings/actions.ts`
  - Requirements: R2, R3, R4, R6, R9, R10
  - Preconditions: T1, T2
  - Expected evidence: Every action `requireUserId`. Create rejects a second MAIN or SAVINGS. Main create/update opening upserts Settings starting. Settings update writes Main opening when a MAIN row exists. Opening is not inserted as `AccountEntry`. Entry create allowed only for `kind=CUSTOM` owned by the user; SAVINGS (and MAIN) entry writes rejected. Custom rename updates name. Custom delete confirms in UI (T7) and deletes account + entries (`onDelete: Cascade`). Revalidate `/balance` (and `/` when starting cash changes).

- [ ] T5 — Add account UI (empty CTA, desktop card form, mobile bottom sheet)
  - Files: `app/(app)/balance/account-forms.tsx`, `components/balance/add-account-sheet.tsx`, `app/(app)/balance/page.tsx`, `components/balance/mobile-balance.tsx`
  - Requirements: R2, R7
  - Preconditions: T2, T4
  - Expected evidence: CTA **Add account**. Empty state shows it; populated state still shows it. Mobile sheet (`md:hidden`); desktop card form (`hidden md:block`). Kind picker Main / Savings / Custom; existing MAIN/SAVINGS omitted or disabled. Defaults: Main name “Main account”, opening prefilled from Settings; Savings name “Savings account”, opening optional; Custom name placeholder e.g. Prizes. Success shows the new card without a new route.

- [ ] T6 — Savings card: all-time balance + month breakdown labels + copy
  - Files: `components/balance/account-section.tsx` (or equivalent), Balance page/mobile
  - Requirements: R4, R5, R7
  - Preconditions: T3, T5
  - Expected evidence: When a Savings row exists, card shows all-time balance and exactly **From main account**, **From planned salary**, **This month (after expenses)**. Copy that planned figures update when expenses or planned/received income change. No entry form on Savings. Null → “—”. Desktop and mobile.

- [ ] T7 — Custom cards: balance, leftover hint, add/withdraw, rename, confirm+cascade delete
  - Files: `app/(app)/balance/account-forms.tsx`, `components/balance/account-section.tsx` (or equivalent)
  - Requirements: R6, R9
  - Preconditions: T3, T4, T5
  - Expected evidence: Name + balance. **Available leftover this month** hint = `postLifetimeMinor` (not auto-transferred). Add/withdraw signed amount + currency + date + optional note. Rename Custom. Delete Custom only after confirm; entries gone with the account. MAIN/SAVINGS have no delete control.

- [ ] T8 — Main card + page title + keep running series
  - Files: `app/(app)/balance/page.tsx`, `components/balance/mobile-balance.tsx`, `components/balance/account-section.tsx`
  - Requirements: R3, R7
  - Preconditions: T3, T5
  - Expected evidence: Page title **Balance and accounts** on mobile and desktop. Nav href still `/balance`. Starting / Current (Total cash) / charts / half-month table still received − charged from starting. Main card (when the row exists) = Total cash − Savings all-time. If Main does not exist, start/current still show; accounts section shows Add account. Optional: edit Main opening on the card (must stay synced with Settings).

- [ ] T9 — Revalidate `/balance` from leftover and cash mutations
  - Files: `app/(app)/income/actions.ts`, `app/(app)/expenses/actions.ts`, `app/(app)/savings/actions.ts`, `app/(app)/settings/actions.ts`, `app/(app)/overview-actions.ts`, `app/(app)/balance/actions.ts`
  - Requirements: R5, R10
  - Preconditions: T4
  - Expected evidence: Income/expense/savings/settings/refresh/account writes that change displayed Balance figures call `revalidatePath("/balance")` (or layout revalidate that includes it). Charging an expense then viewing Balance shows updated fromPlanned / projectedSum.

- [ ] T10 — Tests: leftover unchanged + breakdown reuse
  - Files: `tests/unit/waterfall.test.ts`, `tests/unit/account-breakdown.test.ts` (if helper is separate)
  - Requirements: R5, R8
  - Preconditions: T3
  - Expected evidence: Existing leftover / Planning gate / 70%-of-leftover / from-planned subtract tests still pass. New assertions: `projectedSum === fromMain + fromPlanned`; received 100 / planned 50 / charged 20 / planning 0 → actual 56, combined 91, fromPlanned 35 (same minor scale/floor as current waterfall tests). No second leftover implementation in production code.

- [ ] T11 — Record handoff in progress log
  - Files: `progress/current.md`
  - Requirements: — (process)
  - Preconditions: T1–T10 done
  - Expected evidence: Handoff `IMPLEMENTED` for `balance-user-accounts`

## Verification

- [ ] TV1 — Automated: leftover formula still locked
  - Covers: R5, R8
  - Command: `npx vitest run tests/unit/waterfall.test.ts --config vitest.waterfall.config.ts`
  - Expected result: Received − charged − planning leftover; ≤ 0 gate; 70% of leftover not gross; `plannedSalaryTakeMinor` subtract case unchanged. All cases in that file pass.

- [ ] TV2 — Automated: breakdown reuse / projected sum
  - Covers: R5
  - Command: `npx vitest run tests/unit/waterfall.test.ts tests/unit/account-breakdown.test.ts --config vitest.waterfall.config.ts` (omit the sibling file if tests live only in `waterfall.test.ts`)
  - Expected result: `fromMain + fromPlanned === projectedSum`. Canonical from-planned numeric case still holds. Helper does not recompute leftover with a different formula.

- [ ] TV3 — Automated: validation (when T2 touched `validation.test.ts`)
  - Covers: R2, R6
  - Command: `npx vitest run tests/unit/validation.test.ts`
  - Expected result: Account/entry schemas reject empty Custom name, reject Savings negative opening if specified, accept signed Custom amounts. Skip with a note if that file was not extended.

- [ ] TV4 — Schema apply
  - Covers: R1
  - Command: `npx prisma db push` (test/dev) and/or `npx prisma migrate dev` / `migrate deploy` per existing README workflow
  - Expected result: Account and AccountEntry exist. Second MAIN/SAVINGS insert fails at DB and/or action. Custom can insert two rows. `package.json` dependencies unchanged.

- [ ] TV5 — Manual: create Main, Savings, Custom on Balance
  - Covers: R2, R3, R4, R7
  - Expected result: Title **Balance and accounts** at ~375px and `md+`. Empty CTA **Add account** (sheet vs card). Main opening becomes Settings starting and series start. Second Main/Savings refused. Savings opening blank → 0. Custom named Prizes appears. Href `/balance`. Current balance still Total cash.

- [ ] TV6 — Manual: Savings breakdown updates with expenses/income
  - Covers: R5, R10
  - Expected result: Savings card shows **From main account**, **From planned salary**, **This month (after expenses)** = sum. Add planned salary → fromPlanned rises. Charge/add expense → planned/sum update after returning to Balance. Uncheck Planned → take moves into fromMain. All-time Savings with opening 0 equals Overview Savings.

- [ ] TV7 — Manual: Custom leftover hint, add/withdraw, rename, delete
  - Covers: R6
  - Expected result: Hint matches month post-lifetime leftover; recording Prizes does not change leftover math or auto-fill. Add/withdraw change Prizes balance only. Rename works. Delete asks confirm and removes entries.

- [ ] TV8 — Manual: Overview snapshot + leftover identity
  - Covers: R8, R3
  - Expected result: Overview still shows Main / Savings / From planned salary with **no** Add account. Creating accounts does not change Overview Saved leftover. Main card on Balance = Total cash − Savings all-time. Planning-only expense does not reduce Total cash / Main cash but can zero fromMain.

- [ ] TV9 — Code review: auth, leftover, deps, Overview, series
  - Covers: R1, R4, R5, R8, R9, R10
  - Expected result: `requireUserId` + `userId` on Account/AccountEntry reads/writes; no secrets; no new npm deps; Savings entries rejected; leftover helpers reused not copied; Overview has no create-account UI; `balance.ts` series math unchanged; `/balance` revalidated from relevant mutations.

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R9 |
| T2 | R2, R3, R4, R6 |
| T3 | R3, R4, R5, R6, R8, R9 |
| T4 | R2, R3, R4, R6, R9, R10 |
| T5 | R2, R7 |
| T6 | R4, R5, R7 |
| T7 | R6, R9 |
| T8 | R3, R7 |
| T9 | R5, R10 |
| T10 | R5, R8 |
| T11 | — |
| TV1 | R5, R8 |
| TV2 | R5 |
| TV3 | R2, R6 |
| TV4 | R1 |
| TV5 | R2, R3, R4, R7 |
| TV6 | R5, R10 |
| TV7 | R6 |
| TV8 | R3, R8 |
| TV9 | R1, R4, R5, R8, R9, R10 |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
