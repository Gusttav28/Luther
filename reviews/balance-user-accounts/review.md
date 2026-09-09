# Review: Balance user accounts

- Work item: `balance-user-accounts`
- Branch: `cursor/balance-user-accounts-ef43`
- Approved spec: `specs/balance-user-accounts/` version 2026-09-09 (owner **GO** on 2026-09-09)
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED`
- Review start: 2026-09-09
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/_template/review.md`
- `specs/balance-user-accounts/{requirements,design,tasks}.md` (complete)
- `progress/current.md`
- Prior leftover lock: `reviews/received-savings-accounts/review.md` (not re-litigated)
- Diff vs spec commit `7dfbef0` (`git diff 7dfbef0...HEAD` / `--stat` / per-file)
- Implementation commits: `89950a1` (implement), `15b66c8` (test evidence / Vitest include)
- Authorized implementation files:
  - `prisma/schema.prisma`
  - `prisma/migrations/20260909090000_balance_user_accounts/migration.sql`
  - `lib/validation.ts`
  - `lib/queries/accounts.ts`
  - `lib/waterfall.ts`
  - `app/(app)/settings/actions.ts`
  - `app/(app)/income/actions.ts`
  - `app/(app)/expenses/actions.ts`
  - `app/(app)/savings/actions.ts`
  - `app/(app)/overview-actions.ts`
  - `app/(app)/balance/page.tsx`
  - `app/(app)/balance/actions.ts`
  - `app/(app)/balance/account-forms.tsx`
  - `components/balance/mobile-balance.tsx`
  - `components/balance/add-account-sheet.tsx`
  - `components/balance/account-section.tsx`
  - `tests/unit/waterfall.test.ts`
  - `tests/unit/account-breakdown.test.ts`
  - `tests/unit/validation.test.ts`
  - `vitest.waterfall.config.ts`
  - `progress/current.md`
- Locked leftover / Overview / series confirmation (empty or add-only vs `7dfbef0`; current contents inspected):
  - `lib/waterfall.ts` leftover helpers unchanged; add-only `savingsMonthBreakdownFromTakes`
  - `lib/queries/balance.ts` (filters and running math)
  - `lib/queries/waterfall-scope.ts` (unchanged in this item)
  - `components/overview/account-cards.tsx` (no Add account UI)
  - `app/(app)/page.tsx` (Overview snapshot only)
  - `components/icons.ts` (`href: "/balance"`, label **Balance**)
  - `package.json` / `package-lock.json`
- Spec package files on the branch (`specs/balance-user-accounts/*`) are the approved spec, not unauthorized implementation.

Reviewer did not implement this work and did not edit application code or tests.

## Commands run

| Command | Result |
| --- | --- |
| `git diff 7dfbef0...HEAD --stat` | PASS for scope. 21 files, +1536/−38. Authorized schema/UI/actions/queries/tests/progress plus `vitest.waterfall.config.ts`. No `package.json` / lockfile. |
| `git diff 7dfbef0...HEAD -- package.json package-lock.json lib/queries/balance.ts components/overview/account-cards.tsx lib/queries/waterfall-scope.ts app/(app)/page.tsx components/icons.ts` | PASS; empty. |
| `git diff 7dfbef0...HEAD -- lib/waterfall.ts` | PASS; leftover / 70% / from-planned helpers unchanged. Only add-only `savingsMonthBreakdownFromTakes`. |
| `npx vitest run tests/unit/waterfall.test.ts tests/unit/account-breakdown.test.ts --config vitest.waterfall.config.ts` (TV1+TV2) | PASS; 2 files, **12 passed**. |
| `npx vitest run tests/unit/validation.test.ts --config vitest.waterfall.config.ts` (TV3) | PASS; 1 file, **27 passed**. |
| `npx prisma generate` | PASS; Prisma Client generated (includes `account` / `accountEntry`). |
| `npx prisma db push --skip-generate` (TV4) | FAIL / environment: Prisma `P1001` cannot reach Postgres at `127.0.0.1:5432`. No `.env`; `DATABASE_URL` points at localhost with no listener. |
| Source inspection of leftover formula vs received-savings lock | PASS; `leftoverAfterReserves` / `computeWaterfall` / `plannedSalaryTakeMinor` match the locked formula. |
| Source inspection of Overview create UI | PASS; no Add account / kind picker on `page.tsx` or `components/overview/account-cards.tsx`. |
| Secrets scan of `git diff 7dfbef0...HEAD` | PASS; matches are existing `loginSchema` password field and progress prose about `DATABASE_URL`, not credentials. |

TV5–TV8 were not run (no live app / owner session in this environment). Reviewer did not invent browser evidence.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Prisma Account and AccountEntry; uniqueness; no new packages | PASS (code + generate; TV4 environment-blocked) | `AccountKind` enum MAIN/SAVINGS/CUSTOM (`schema.prisma` 168–172). `Account`: id, userId, name, kind, openingMinor, currency, createdAt (177–190). `AccountEntry`: id, userId, accountId, date, amountMinor, currency, note? (194–207). User→Account and Account→AccountEntry `onDelete: Cascade`. `@@index([userId, kind])`; **no** `@@unique([userId, kind])`. Migration `20260909090000_balance_user_accounts/migration.sql` creates tables/FKs and partial uniques `WHERE kind = 'MAIN'` / `'SAVINGS'` (34–35). Create action `findFirst` + P2002 handling rejects a second MAIN/SAVINGS (`actions.ts` 46–61, 90–98). `package.json` unchanged vs `7dfbef0`. `npx prisma generate` succeeded. Live `db push` / second-insert at the DB was not run (TV4). Existing financial models / `SavingsContribution` waterfall rows are untouched. |
| R2 — Add account option on Balance (kinds, names, openings) | PASS (code; TV5 not run) | CTA **Add account** on mobile header always (`mobile-balance.tsx` 230–237) and desktop card submit (`account-forms.tsx` 108, 174). Empty accounts: explanatory copy + CTA; populated: cards + CTA. Mobile sheet `md:hidden` (`add-account-sheet.tsx` 48, `role="dialog"`, Escape). Desktop form inside `hidden md:block` (`page.tsx` 51, 174–181). Kind picker omits existing MAIN/SAVINGS (`account-forms.tsx` 31–34). Defaults: Main name **Main account**, Savings **Savings account**, Custom placeholder Prizes; Main opening prefilled from Settings (`95–100`). Zod: Custom name required; Savings/Custom blank opening → 0; Main negative allowed (`validation.ts` 238–277). Opening is `Account.openingMinor`, not an `AccountEntry` (create path inserts Account only). Invalid parse returns field errors, no write. |
| R3 — Main account: opening is starting cash; display is Total cash − Savings | PASS (code; TV5/TV8 identity not run live) | Create MAIN upserts Settings starting in the same transaction (`actions.ts` 65–77). Update Main opening writes Account + Settings (`130–147`). Settings update writes MAIN opening/currency when a row exists (`settings/actions.ts` 41–47). Main card `balanceMinor` = `totalCash − savingsAllTime` with no clamp (`accounts.ts` 172–181). Savings all-time = converted opening + lifetime when a SAVINGS row exists, else lifetime (`92–109`, `164–174`). `getBalanceSeries` still starting + received − charged; Current balance is that series (`page.tsx` 67–71; `balance.ts` empty diff). No Main row → start/current still rendered; accounts section shows Add account, not a fake Main card (`AccountCards` returns null when `accounts.length === 0`). |
| R4 — Savings account row: extra seed opening; all-time; no waterfall entries | PASS (code) | At most one SAVINGS via action + partial unique. Blank opening → `openingMinor` 0 (`validation.ts` 221–236; test blank Savings). All-time card balance = converted opening + `getLifetimeSavingsBalance` (`getSavingsAllTimeMinor`). Create does not insert `AccountEntry`. `createAccountEntryAction` loads account by `id` + `userId` and rejects `kind !== CUSTOM` (`actions.ts` 220–227). No production path writes fromMain/fromPlanned/projectedSum as entries or extra `SavingsContribution`. `getDerivedAccounts` still lifetime-only (no opening) for Overview (`accounts.ts` 26–39). |
| R5 — Savings month breakdown reuses received-savings math | PASS (code + TV1/TV2) | `getCurrentMonthBreakdown` uses `getScopeAmounts(..., "BOTH")` + `waterfallFromScope` + `plannedTakeFromScope` (`accounts.ts` 112–131). `fromMain` = `lifetimeTakeMinor`; `fromPlanned` = planned take; `projectedSum` = add-only `savingsMonthBreakdownFromTakes` (`waterfall.ts` 93–103) — does not recompute leftover. Labels exactly **From main account**, **From planned salary**, **This month (after expenses)** (`account-section.tsx` 81–96). Copy that planned figures update when expenses or planned/received income change (78–98). Leftover formula in `leftoverAfterReserves` / `computeWaterfall` / `plannedSalaryTakeMinor` is unchanged vs `7dfbef0`. TV1/TV2: existing leftover cases still pass; canonical received 100 / planned 50 / charged 20 / planning 0 → 56 / 91 / 35; `projectedSum === fromMain + fromPlanned === combined`. Null legs stay null (not coerced to 0). |
| R6 — Custom accounts: balance, add/withdraw, leftover hint, rename, cascade delete | PASS (code; TV7 not run) | Custom balance = converted opening + Σ entries (`accounts.ts` 134–147, 184–190). Hint **Available leftover this month** = `postLifetimeMinor` with “Hint only — leftover is not moved automatically.” (`account-section.tsx` 102–111). Add/withdraw: positive amount + direction → signed minor via `accountEntrySchema` (`validation.ts` 290–306); date, CRC/USD, optional note. Rename Custom via `updateMany` `{ id, userId, kind: "CUSTOM" }`. Delete: two-step confirm copy then `findFirst` CUSTOM+userId and `account.delete` (cascade entries in schema). No delete control on MAIN/SAVINGS. Custom writes do not touch leftover/materialize. |
| R7 — Page title, nav, running series, empty vs populated | PASS (code; TV5 layout not run live) | Desktop `h1` and mobile header **Balance and accounts** (`page.tsx` 53; `mobile-balance.tsx` 71–73). Nav remains `{ href: "/balance", label: "Balance" }` (`components/icons.ts` 34). Starting / Current / charts / half-month table still use `getBalanceSeries` (Total cash). Accounts are a section with `aria-label="Accounts"`. Empty: CTA; populated: cards + CTA. No new route. |
| R8 — Overview snapshot stays; leftover math unchanged; no Overview create UI | PASS (code + TV1) | `getDerivedAccounts` still Savings = lifetime, Main = Total cash − lifetime (`accounts.ts` 26–39). Overview `page.tsx` still renders snapshot `AccountCards` with no create form. `components/overview/account-cards.tsx` empty diff vs `7dfbef0` (labels Main / Savings / From planned salary only). Creating Account rows is not an input to leftover, materialize, or Overview Saved. `lib/waterfall.ts` leftover helpers unchanged except the allowed add-only composer. `waterfall-scope.ts` unchanged in this item. Custom balances do not enter Overview Main/Savings. |
| R9 — Security, privacy, and dependencies | PASS (code) | Balance page and every new action call `requireUserId`. List/load queries use `where: { userId }`. Create writes `userId` on Account/AccountEntry. Rename/delete/Main update scope `userId` (delete loads CUSTOM+userId first). Entry create requires the account’s `userId` to match the session. `package.json` dependencies unchanged. No secrets, `.env`, or financial dumps in the diff. No `console.log` of amounts under `lib/` or new account files. |
| R10 — Revalidate Balance when leftover or cash inputs change | PASS (code; TV6 not run live) | `revalidatePath("/balance")` on income create/update/delete; expense create, set-completed, update, delete, copy-month (5 call sites); savings create/update/delete; settings (plus existing layout revalidate); overview rematerialize; account create/Main opening (also `/` layout), rename, delete, entry. `safeMaterializeMonth` remains on the existing mutation paths. |

## Design verdicts

- Schema matches the locked field list. Partial unique MAIN/SAVINGS live in migration SQL; actions still reject duplicates (as required if `db push` omits partial indexes).
- Add account is on Balance only (desktop card + mobile sheet). Kind picker omits taken MAIN/SAVINGS slots. Opening lives on `Account.openingMinor`.
- Main opening ↔ Settings starting is bidirectional. Running series / Current balance stay Total cash (`lib/queries/balance.ts` not rewritten). Main card subtracts Savings all-time (opening + lifetime when a Savings row exists).
- Savings month lines compose `waterfallFromScope` + `plannedTakeFromScope`; `savingsMonthBreakdownFromTakes` only adds. No second leftover implementation. Savings entries rejected.
- Custom balance/entries/hint/rename/cascade-delete match the locked flow. Hint is `postLifetimeMinor`; no auto-transfer.
- Overview `getDerivedAccounts` / `AccountCards` remain derived snapshot (lifetime only). No Overview create UI.
- `/balance` revalidate added to the listed mutation files. Extra `vitest.waterfall.config.ts` include of `account-breakdown.test.ts` and `validation.test.ts` is test-harness only (lets TV2/TV3 run without Postgres `globalSetup`).
- No new npm packages. No `/accounts` route. Leftover formula, Balance series math, and Overview account-card labels were not rewritten.

## Task/checkpoint verdicts

- T1: PASS. Models, migration, partial uniques, no `@@unique([userId, kind])`, no new deps. `prisma generate` succeeded. Live `db push` blocked (TV4).
- T2: PASS. Kind enum; Custom name required; Main opening Settings-like (0/negative); Savings/Custom opening optional → 0, non-negative; entry signed via add/withdraw. TV3: 27 passed.
- T3: PASS. `userId` on loaders. Breakdown via BOTH + existing takes. Main = Total cash − Savings all-time. `getDerivedAccounts` lifetime-only. Leftover formula unchanged.
- T4: PASS. `requireUserId`; duplicate MAIN/SAVINGS rejected; Main ↔ Settings; opening not an entry; CUSTOM-only entries; Custom rename; cascade delete after confirm UI; revalidate `/balance` (and `/` when cash changes).
- T5: PASS (code). Empty + populated **Add account**; sheet vs card; kind picker; defaults. Live 375px / `md+` remains TV5.
- T6: PASS (code). All-time + exact month labels + planned-update copy; no Savings entry form. Desktop + mobile share `account-section.tsx`.
- T7: PASS (code). Hint, add/withdraw, rename, confirm+cascade delete. MAIN/SAVINGS have no delete control.
- T8: PASS (code). Title **Balance and accounts**; nav href `/balance`; series Total cash; Main card identity; CTA when Main missing. Optional Main opening edit is present and synced.
- T9: PASS (code). Income/expense/savings/settings/overview refresh/account writes revalidate `/balance`.
- T10: PASS. Existing leftover cases kept; `projectedSum === fromMain + fromPlanned`; canonical 56/91/35. TV1+TV2: 12 passed. Helper does not reimplement leftover.
- T11: PASS. `progress/current.md` records `IMPLEMENTED` for `balance-user-accounts`.
- TV1: PASS. Independent rerun included in the 12 passing tests (9 leftover cases in `waterfall.test.ts` plus composition file).
- TV2: PASS. Independent rerun: composition + canonical from-planned numeric case.
- TV3: PASS. Independent rerun with the no-DB waterfall config: 27 passed, including account/entry schemas.
- TV4: NOT RUN to completion — `db push` failed in this environment (Postgres unreachable). Schema + migration + generate + action uniqueness are present. Spec allows recording this like the prior review’s missing-DB check.
- TV5: NOT RUN — owner-manual; no live app / session.
- TV6: NOT RUN — owner-manual; same. Revalidate + derived breakdown code is present.
- TV7: NOT RUN — owner-manual; same. Custom action/UI code is present.
- TV8: NOT RUN — owner-manual; same. Overview snapshot + leftover lock confirmed in source.
- TV9: PASS by code review (auth, leftover reuse, deps, Overview create UI absent, `balance.ts` series unchanged, `/balance` revalidated, no secrets).

## Findings

No implementation defects against the approved spec. Remaining gaps are environment limits and the spec’s owner-manual UI checks, not code divergence.

### INFO — TV5–TV8 not executed here (owner-manual remaining)

- Requirement/design/task: R2/R3/R4/R7 (TV5), R5/R10 (TV6), R6 (TV7), R8/R3 (TV8)
- File: N/A (environment)
- Lines: N/A
- Observed: This environment has no owner session or running app. Reviewer did not invent browser evidence.
- Expected: Title **Balance and accounts** at ~375px and `md+`; empty/populated **Add account** (sheet vs card); Main opening ↔ Settings/series start; second Main/Savings refused; Savings blank opening → 0; month labels update after expense/income; Custom hint/add/withdraw/rename/delete-with-confirm; Overview snapshot with **no** Add account; Main card = Total cash − Savings all-time.
- Evidence: `progress/current.md` already recorded TV5–TV8 as live browser/DB unavailable. Code for those behaviors is present and consistent with the spec.
- Required correction: None for the implementer. Owner should confirm TV5–TV8 on a live session.

### INFO — Official TV4 `db push` cannot run against this environment’s database

- Requirement/design/task: TV4 / R1
- File: `prisma/schema.prisma`, `prisma/migrations/20260909090000_balance_user_accounts/migration.sql`
- Lines: schema models 168–207; migration partial uniques 34–35
- Observed: `npx prisma db push --skip-generate` exited with Prisma `P1001` (cannot reach `127.0.0.1:5432`). No `.env` with a reachable `DATABASE_URL` (only `.env.example`). No Postgres listener on 5432. Second MAIN/SAVINGS insert was therefore not exercised at the database.
- Expected: Documented `db push` / migrate applies Account and AccountEntry; partial unique or action rejects a second MAIN/SAVINGS; two CUSTOM rows can insert.
- Evidence: Schema field list matches R1. Migration creates enum, tables, FKs, cascade, and partial unique indexes. Actions `findFirst` + P2002 reject duplicates. `npx prisma generate` succeeded. `package.json` unchanged.
- Required correction: None for this work item. Owner/CI with `DATABASE_URL` can run TV4; missing DB here is an environment limit, not missing schema or uniqueness code.

## Cleanup signal

- Durable spec package: `specs/balance-user-accounts/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/balance-user-accounts/review.md`
- Scratch context to reset: none. No application code or tests were edited by the Reviewer.

APPROVED -> reviews/balance-user-accounts/review.md
