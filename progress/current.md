# Current implementation progress

- Work item: balance-user-accounts (`specs/balance-user-accounts/`)
- Branch: `cursor/balance-user-accounts-ef43`
- Spec package: 2026-09-09, human-approved (owner **GO** on 2026-09-09)
- Implementer session: 2026-09-09
- Handoff: **IMPLEMENTED**

## Files read

- `AGENTS.md`, `.agents/implementer.md`
- `specs/balance-user-accounts/{requirements,design,tasks}.md` (complete)
- Prisma schema/migration, validation, waterfall, waterfall-scope, accounts, balance page/mobile, savings sheet, settings/income/expense/savings/overview actions

## Files changed

### T1 — Schema

- `prisma/schema.prisma` — `AccountKind`, `Account`, `AccountEntry`; User relations; index `[userId, kind]`; no `@@unique([userId, kind])`
- `prisma/migrations/20260909090000_balance_user_accounts/migration.sql` — tables, FKs, cascade, partial unique MAIN/SAVINGS

### T2 — Validation

- `lib/validation.ts` — `accountCreateSchema`, opening schemas, `accountEntrySchema` (signed via add/withdraw), rename/delete/Main opening
- `tests/unit/validation.test.ts` — Custom name required; Savings negative opening rejected; Main negative opening allowed; signed Custom amounts

### T3 — Queries

- `lib/queries/accounts.ts` — `getDerivedAccounts` unchanged (lifetime only). List + Savings all-time (opening + lifetime) + month breakdown via `getScopeAmounts("BOTH")` + `waterfallFromScope` + `plannedTakeFromScope`. Custom hint = `postLifetimeMinor`. Main display = Total cash − Savings all-time.
- `lib/waterfall.ts` — leftover formula **unchanged**. Added add-only `savingsMonthBreakdownFromTakes`.

### T4 — Actions

- `app/(app)/balance/actions.ts` — create; reject second MAIN/SAVINGS; Main opening ↔ Settings; Custom entry/rename/cascade delete; `requireUserId`
- `app/(app)/settings/actions.ts` — writes MAIN opening when the row exists

### T5–T8 — Balance UI

- `app/(app)/balance/page.tsx` — title **Balance and accounts**; accounts section; desktop Add account card; series/current stay Total cash
- `components/balance/mobile-balance.tsx` — same title; empty + populated **Add account** CTA; sheet
- `app/(app)/balance/account-forms.tsx`, `components/balance/add-account-sheet.tsx`, `components/balance/account-section.tsx` — kind picker, Savings labels, Custom leftover hint / add-withdraw / rename / confirm delete, Main opening edit

### T9 — Revalidate `/balance`

- income, expense (including completed + copy month), savings, settings, overview refresh, account actions

### T10 — Tests

- `tests/unit/waterfall.test.ts` — leftover cases kept; `actual + fromPlanned === combined`
- `tests/unit/account-breakdown.test.ts` — `projectedSum === fromMain + fromPlanned`; received 100 / planned 50 / charged 20 / planning 0 → 56 / 91 / 35
- `vitest.waterfall.config.ts` — includes both waterfall files

### T11 — this file

## Verification

- TV1/TV2: `npx vitest run tests/unit/waterfall.test.ts tests/unit/account-breakdown.test.ts --config vitest.waterfall.config.ts` — **12 passed**
- TV3: `npx vitest run tests/unit/validation.test.ts --config vitest.waterfall.config.ts` — **27 passed** (default vitest `globalSetup` needs `DATABASE_URL`; used the no-DB waterfall config)
- TV4: `npx prisma generate` and `npx tsc --noEmit` succeeded. `db push` not run (Postgres unset). Partial unique indexes are in the migration; actions still reject a second MAIN/SAVINGS.
- TV5–TV8: live browser/DB not available in this environment
- TV9: no new npm deps; Overview `account-cards.tsx` unchanged; `lib/queries/balance.ts` series math unchanged; leftover helpers reused

## Notes for Reviewer

- Overview snapshot still uses `getDerivedAccounts` (lifetime only; Savings opening is not included)
- Savings waterfall takes are not written as `AccountEntry`
- Custom leftover hint is `postLifetimeMinor` only — no auto-transfer
- Nav href remains `/balance`
