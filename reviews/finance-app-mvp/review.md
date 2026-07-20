# Review: Finance App MVP

- Work item: `specs/finance-app-mvp/`
- Branch: `feature/finance-app-mvp` (5 commits over `main`, HEAD `e65e80a`, clean working tree)
- Approved spec: `specs/finance-app-mvp/{requirements,design,tasks}.md`, version 2026-07-20 v2, approved by the owner 2026-07-20
- Implementer progress: `progress/current.md` (handoff **IMPLEMENTED**, 2026-07-20)
- Review start: 2026-07-20, independent Reviewer agent (did not implement this work)
- Final verdict: **APPROVED**

## Files inspected

Spec package and progress log in full; then source verification (read, not trusted from the log):

- Auth: `middleware.ts`, `lib/auth.ts`, `lib/auth.config.ts`, `app/login/*`, `prisma/seed.ts`
- Domain: `lib/money.ts`, `lib/periods.ts`, `lib/projections.ts`, `lib/validation.ts`, `lib/env.ts`, `lib/prisma.ts`
- Queries: `lib/queries/{settings,income,expenses,plan,savings,overview,balance,projects}.ts`
- Actions: `app/(app)/{savings,projects,plan,settings}/actions.ts`
- Data: `prisma/schema.prisma`
- UI spot-checks: `components/money.tsx`, `components/nav.tsx`, `README.md`
- Tests: `tests/unit/money.test.ts`, `tests/unit/aggregations.test.ts` (fixtures), `tests/e2e/smoke.spec.ts`, `tests/e2e/responsive.spec.ts`, `playwright.config.ts`
- Hygiene: `.gitignore`, `.env.example`, `git ls-files` output

## Commands run

All commands re-run by the Reviewer on this machine (not copied from the implementer's log):

| Command | Result |
| --- | --- |
| `git status` / `git log --oneline` | On `feature/finance-app-mvp`, clean tree, 5 commits over `main` |
| `npm run lint` | Pass, exit 0, no errors |
| `npx tsc --noEmit` | Pass, exit 0, no errors |
| `npm test` (Vitest) | **56/56 tests passed** (5 files; fresh `test.db` migrated by global setup) |
| `npm run build` | Production build succeeded, all routes compiled, exit 0 |
| `npx playwright test` | **6/6 e2e tests passed** (3 smoke incl. auth round trip, 3 responsive at 360 px/1280 px) |
| Seed without env vars (`.env` moved aside, `OWNER_EMAIL`/`OWNER_PASSWORD` unset) | Fails fast, exit 1, clear message — restored `.env` afterward |
| `git check-ignore -v .env prisma/dev.db test.db` | All ignored (`.gitignore` lines 13/22/18) |
| `git grep` for secret-like literals (excluding lockfile) | No matches |
| `git ls-files` review | Only `.env.example` (keys, no values) tracked; no `.env`, no `*.db`, no personal data |

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Credential auth | **PASS** | `middleware.ts:6-10` gates every route except `api/auth`, static assets; `lib/auth.config.ts:15-25` `authorized` callback redirects logged-out users to `/login`. Credentials provider in `lib/auth.ts:35-66` with bcrypt compare, dummy-hash timing uniformity (lines 51-56), generic `null` on failure, and in-memory throttle (5 failures → 60 s, lines 13-33). Seed stores bcrypt hash only (`prisma/seed.ts:10`). E2E verified logged-out redirect, generic wrong-password error, login/logout round trip (all passed). |
| R2 — Secrets hygiene | **PASS** | `.gitignore` excludes `.env*` (keeping `.env.example`) and all `*.db`; `git check-ignore` confirmed. `.env.example` documents `DATABASE_URL`, `AUTH_SECRET`, `OWNER_EMAIL`, `OWNER_PASSWORD` with no values. Fail-fast asserts in `lib/env.ts` wired into `lib/prisma.ts:4` (runtime) and `prisma/seed.ts:8` (seed); seed-without-env re-tested by me: exit 1 with clear message. Secret grep over tracked files: clean. No anonymous data surface — every query/action calls `requireUserId()` (`lib/auth.ts:69-74`). |
| R3 — Income per half-month | **PASS** | `IncomeEntry` model has `year`, `month`, `period` (H1/H2), `amountMinor`, `currency`, `label`, `planned` (`prisma/schema.prisma:44-58`). `lib/queries/income.ts:51-56` computes H1/H2/month totals. H1/H2 boundary at day 15/16 in `lib/periods.ts:16-22`, unit-tested incl. year rollover and Feb end. Aggregation test asserts per-period and monthly totals; e2e creates an H1 entry. |
| R4 — Dual-currency expenses | **PASS** | `Expense` stores `amountMinor` + `currency` (USD/MXN, `schema.prisma:89-102`); converted values computed at read time only (`lib/queries/expenses.ts:47-67`), never persisted. Month + category filters (lines 33-44). Native + converted display in the expenses page via `components/money.tsx`. Aggregation tests cover USD and MXN expenses with conversion and filters. |
| R5 — Exchange rates / reporting currency | **PASS** | `Settings` stores `usdToCrcRate`, `mxnToCrcRate` as decimal strings, `reportingCurrency` default `"CRC"` (`schema.prisma:31-42`). CRC-pivot conversion in exact bigint rational math with round-half-up (`lib/money.ts:31-89`); USD↔MXN derived through CRC, verified in unit tests (`tests/unit/money.test.ts:29-42`) including rate-change sensitivity. Missing rate → `MissingRateError` → aggregates return `null` → UI renders "Set exchange rate" link (`components/money.tsx:17-23`) instead of a wrong number. `RatesNote` annotates totals with the rates in effect. Settings action validates rates via `isValidRate` (rejects 0, negatives, non-numeric). |
| R6 — Category plan matrix | **PASS** | `Category` (archive flag) + `PlanCell` unique per (category, year, month) (`schema.prisma:60-87`). `lib/queries/plan.ts:48-109` builds the 12-month matrix with row totals, column totals, grand total, and actuals joined from expenses. Delete blocked when expenses exist, archive offered instead (`app/(app)/plan/actions.ts:61-85`); negative plan amounts rejected by `planCellSchema`. Two-category totals asserted in aggregation tests. |
| R7 — Monthly overview | **PASS** | `lib/queries/overview.ts:27-87`: earned = month income, spent = month expenses, saved = month's **SavingsContribution** rows only (project allocations excluded — disjointness verified below), remaining = earned − spent − saved, all in reporting currency; H1/H2 breakdown split at day 16 (line 36); lifetime savings balance included (line 85). Empty month renders zeros (tested). Overview is the landing page (`app/(app)/page.tsx`). |
| R8 — Running balance | **PASS** | `lib/queries/balance.ts:29-112`: starting balance (from Settings, converted) + cumulative income − expenses per half-month period, sorted by `periodIndex`; derived only, nothing editable. Two-month fixture test asserts the series and current balance. |
| R9 — Projects / allocation / projections | **PASS** | `Project` + `ProjectContribution` + `AllocationSetting` (fixed `amountMinor`, `schema.prisma:104-142`). `applyAllocationAction` (`app/(app)/projects/actions.ts:126-214`) applies the fixed per-period amount to incomplete projects in priority order, records `ProjectContribution` rows, refuses to double-apply the same period, and refuses when rates are missing. Pure projection simulation in `lib/projections.ts` (priority order, overflow rollover, 30-year cap, zero allocation → no projection), unit-tested. Priority reorder via neighbor swap; funded % and affordable period in `lib/queries/projects.ts`. Non-positive costs rejected by `projectSchema`/`amountSchema`. |
| R10 — Responsive UI | **PASS** | Bottom nav on `<md`, sidebar on `≥md` (`components/nav.tsx`, `app/(app)/layout.tsx`). Checklist automated as `tests/e2e/responsive.spec.ts`: every view asserted at 360 px with `scrollWidth ≤ 360` and visible bottom nav, plus desktop sidebar at 1280 px — re-run by me, passed. README records the checklist. |
| R11 — Validation / integer money | **PASS** | All amounts parsed to integer minor units, ≤ 2 fraction digits (`lib/money.ts:121-129`); Zod schemas server-side in every action (`lib/validation.ts`); conversion in bigint math — no floats anywhere in money paths. Invalid submissions return field errors and persist nothing; unexpected errors return a generic message (`GENERIC_ERROR`), no stack traces. Rejection cases unit-tested (`validation.test.ts`, 56-test suite green). |
| R12 — Lifetime savings | **PASS** | `SavingsContribution` (signed `amountMinor`, CRC/USD/MXN) entirely separate from `ProjectContribution` — no code path sums the two (verified: overview reads only `savingsContribution`, projects read only `projectContribution`). Over-withdrawal rejected before write (`wouldGoNegative`, `lib/queries/savings.ts:65-88`, called from create and update actions with the edited row excluded). Balance and monthly "saved" asserted across two months in aggregation tests; e2e records a contribution. |

## Design verdicts

- **Stack matches the approved design**: Next.js App Router + TypeScript, Prisma 6/SQLite, Auth.js v5 credentials, Tailwind, Zod, Vitest, Playwright. Runtime dependencies in `package.json` are exactly the approved list (`next`, `react`, `react-dom`, `@prisma/client`, `next-auth`, `bcryptjs`, `zod`). Dev tooling (`tsx`, `postcss`, `autoprefixer`, `eslint-config-next`, `@types/*`) is standard scaffolding implied by the approved stack; no unapproved *runtime* dependency (design's stated constraint).
- **File layout matches the design's file plan**; extra helper files (`lib/env.ts`, `lib/prisma.ts`, `lib/action-state.ts`, `lib/projections.ts`, form components) are within the design's "exact file names may vary" allowance and serve listed purposes.
- **All 10 Prisma models** match the design schema, integer minor units throughout, every row `userId`-scoped, converted values never persisted.
- **Invariants hold**: CRC pivot at read time only; lifetime vs project savings disjoint; category delete blocked with expenses; derived values never editable.

## Task/checkpoint verdicts

- T1–T14: all verified done (see requirement evidence above; T13/TV5 automated via responsive spec, T14 README verified).
- TV1 unit tests: **re-run, 56/56 pass**. TV2 e2e: **re-run, 6/6 pass**. TV3 lint + typecheck: **re-run, both clean**. TV4 hygiene: **re-run, clean**. TV5 responsive: **re-run via e2e, pass**. Production build: **re-run, succeeds**.

## Findings

No blocking findings. Non-blocking observations (no correction required):

### Info — Overview "earned" counts actual income only

- Requirement/design/task: R7
- File: `lib/queries/overview.ts`
- Lines: 39
- Observed: `planned: false` filter — planned income entries are excluded from "earned".
- Expected: Spec says "total earned (income)"; excluding *planned* entries is the sensible reading (planned figures remain visible on the income view).
- Evidence: `getIncomeForMonth` totals also use actual-only entries, consistently.
- Required correction: none; flagged so the owner can confirm the interpretation against the Excel workbook when it arrives.

### Info — Expense currency is editable on update

- Requirement/design/task: R4 ("original amount and currency are always preserved")
- File: `app/(app)/expenses/actions.ts`
- Observed: the owner can edit an expense's amount/currency like any field.
- Expected: the spec's preservation clause targets conversion behavior (converted values never overwrite/persist the original), which holds; deliberate user edits are normal CRUD.
- Required correction: none.

### Info — Prisma pinned to v6

- File: `package.json`
- Observed: `prisma`/`@prisma/client` ^6.19.3 (v7 exists). Spec approves the dependency without a version; the implementer documented the pin rationale in `progress/current.md`.
- Required correction: none.

### Info — Spec's own open blocker remains

- The reference Excel workbook has still not been delivered; schema validation against it is pending per the spec's Open questions. This was explicitly not a blocker for implementation or review, but the owner must supply the workbook and confirm the model before treating the data model as final.

## Cleanup signal

- Durable spec package: `specs/finance-app-mvp/` — keep as-is.
- Durable progress evidence: `progress/current.md` — accurate against my independent verification; keep.
- Durable review report: this file, `reviews/finance-app-mvp/review.md`.
- Scratch context to reset: e2e smoke rows ("E2E …" labels) exist in the local `prisma/dev.db` (gitignored); deletable in-app. `test.db` is throwaway and gitignored. Nothing else to clean.

**APPROVED**
