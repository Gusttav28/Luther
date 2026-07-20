# Tasks: Finance App MVP

## Implementation checklist

- [ ] T1 — Scaffold Next.js (App Router, TypeScript) project with Tailwind, Prisma (SQLite), Vitest, Playwright; add `.env.example` and `.gitignore` entries for env files and local DB.
  - Files: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.example`, `.gitignore`
  - Requirements: R2, R10, R11
  - Preconditions: spec approved by owner; branch `feature/finance-app-mvp` created off `main`.
  - Expected evidence: `npm run dev` serves a page; repo scan shows no secrets; startup fails fast without required env vars.

- [ ] T2 — Define Prisma schema (User, Settings with USD→CRC and MXN→CRC rates and CRC default reporting currency, IncomeEntry, Category, PlanCell, Expense, Project, ProjectContribution, AllocationSetting as fixed amount, SavingsContribution; amounts as integer minor units, all rows scoped by `userId`) and seed script creating the owner account from env vars with a hashed password.
  - Files: `prisma/schema.prisma`, `prisma/seed.ts`
  - Requirements: R1, R2, R3, R4, R5, R6, R8, R9, R12
  - Preconditions: T1.
  - Expected evidence: migration applies; seeded DB contains one user with a password hash (not plaintext) and default settings.

- [ ] T3 — Implement authentication: Auth.js credentials provider, login page, logout, and `middleware.ts` protecting all app routes; generic login errors with basic rate limiting/delay.
  - Files: `lib/auth.ts`, `middleware.ts`, `app/login/page.tsx`
  - Requirements: R1, R2
  - Preconditions: T2.
  - Expected evidence: logged-out access to any app route redirects to `/login`; login/logout round trip works; cookies are HttpOnly.

- [ ] T4 — Implement shared domain libraries: money (minor units; CRC/USD/MXN conversion with CRC as pivot using the stored USD→CRC and MXN→CRC rates; formatting including ₡), half-month period helpers, and Zod validation schemas.
  - Files: `lib/money.ts`, `lib/periods.ts`, `lib/validation.ts`
  - Requirements: R3, R4, R5, R11
  - Preconditions: T2.
  - Expected evidence: unit tests for three-currency conversion (including USD↔MXN derived through CRC), rounding, period boundaries (day 15/16), and validation rejections pass.

- [ ] T5 — Implement settings page and server actions: USD→CRC and MXN→CRC exchange rates, reporting currency selector (CRC/USD/MXN, default CRC), starting balance, and the fixed per-period project allocation amount.
  - Files: `app/(app)/settings/page.tsx` and its server actions
  - Requirements: R5, R8, R9, R11
  - Preconditions: T3, T4.
  - Expected evidence: rate/currency changes persist and alter displayed converted totals; invalid rates rejected; fresh install defaults to CRC reporting.

- [ ] T6 — Implement income module: CRUD for entries per month and H1/H2 period, per-period and monthly totals.
  - Files: `app/(app)/income/page.tsx` and server actions, `lib/queries/income.ts`
  - Requirements: R3, R11
  - Preconditions: T3, T4.
  - Expected evidence: test creating H1/H2 entries asserts correct per-period and monthly totals; invalid amounts rejected.

- [ ] T7 — Implement expenses module: CRUD with date, dual currency, category, note; month/category filters; native plus converted display.
  - Files: `app/(app)/expenses/page.tsx` and server actions, `lib/queries/expenses.ts`
  - Requirements: R4, R5, R11
  - Preconditions: T3, T4, T5 (rates available), T8 (categories) may land in either order with a default category.
  - Expected evidence: USD and MXN expenses both display original and converted values; filters work; invalid input rejected.

- [ ] T8 — Implement category plan module: category CRUD (archive instead of delete when expenses exist) and the category-by-month matrix for a year with row, column, and grand totals plus planned-vs-actual.
  - Files: `app/(app)/plan/page.tsx` and server actions, `lib/queries/plan.ts`
  - Requirements: R6, R11
  - Preconditions: T3, T4.
  - Expected evidence: totals test passes for a two-category matrix; category deletion blocked when expenses reference it.

- [ ] T9 — Implement lifetime savings module: contributions CRUD (with withdrawals that cannot drive the balance negative) and the running lifetime savings balance.
  - Files: `app/(app)/savings/page.tsx` and server actions, `lib/queries/savings.ts`
  - Requirements: R11, R12
  - Preconditions: T3, T4, T5.
  - Expected evidence: test recording contributions across two months asserts the running balance; over-withdrawal rejected.

- [ ] T10 — Implement monthly overview dashboard: earned, spent, saved (month's lifetime savings contributions — not project allocations), remaining in reporting currency with per-period breakdown and the lifetime savings balance; set as post-login landing page.
  - Files: `app/(app)/page.tsx`, `lib/queries/overview.ts`
  - Requirements: R5, R7, R12
  - Preconditions: T5, T6, T7, T9.
  - Expected evidence: test with known fixtures asserts all four figures and the savings balance; empty month renders zeros.

- [ ] T11 — Implement running balance view: starting balance plus cumulative income minus expenses, per month and per period.
  - Files: `app/(app)/balance/page.tsx`, `lib/queries/balance.ts`
  - Requirements: R5, R8
  - Preconditions: T5, T6, T7.
  - Expected evidence: two-month fixture test asserts the running series and current balance.

- [ ] T12 — Implement projects module: CRUD with priority ordering and completion; per-project saved totals from recorded contributions; fixed-allocation funding simulation showing funded %, accumulated amount, and projected affordability period per project (per-project savings kept separate from lifetime savings).
  - Files: `app/(app)/projects/page.tsx` and server actions, `lib/queries/projects.ts`
  - Requirements: R9, R11
  - Preconditions: T4, T5.
  - Expected evidence: projection test with a fixed per-period allocation and two prioritized projects asserts each affordability period and accumulated saved totals; unset allocation shows "no projection".

- [ ] T13 — Implement responsive app shell and mobile pass: authenticated layout with bottom navigation on small viewports, plan-matrix horizontal scroll strategy, and a viewport check of every view at ~360 px and desktop widths.
  - Files: `app/(app)/layout.tsx`, style adjustments across pages
  - Requirements: R10
  - Preconditions: T5–T12 (views exist).
  - Expected evidence: responsive checklist executed and recorded in `progress/current.md`; no horizontal page scroll at 360 px.

- [ ] T14 — Documentation and hygiene wrap-up: README with setup, env vars, run/test commands, and the responsive checklist; final repo scan for secrets or personal data.
  - Files: `README.md`, `.env.example`
  - Requirements: R2, R10
  - Preconditions: T1–T13.
  - Expected evidence: a fresh clone following the README reaches a working login; scan shows no secrets.

## Verification

- [ ] TV1 — Run unit test suite (`npm test` / Vitest)
  - Covers: R3, R4, R5, R6, R7, R8, R9, R11, R12 (money, periods, aggregations, projections, savings, validation)
  - Expected result: all tests pass.
- [ ] TV2 — Run e2e smoke (`npx playwright test`): logged-out redirect, login, create income/expense/category/project/savings contribution, logout
  - Covers: R1, R3, R4, R6, R9, R12
  - Expected result: all scenarios pass.
- [ ] TV3 — Run lint and type check (`npm run lint`, `tsc --noEmit`)
  - Covers: R11 (code-level hygiene)
  - Expected result: no errors.
- [ ] TV4 — Secrets and data hygiene check (e.g., `git grep` for keys, review `.gitignore`, confirm `.env*` and `*.db` untracked)
  - Covers: R2
  - Expected result: no secrets or personal financial data tracked by git.
- [ ] TV5 — Manual responsive checklist at ~360 px and desktop for all views, recorded in `progress/current.md`
  - Covers: R10
  - Expected result: all views usable on mobile; no blocking layout defects.

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R2, R10, R11 |
| T2 | R1, R2, R3, R4, R5, R6, R8, R9, R12 |
| T3 | R1, R2 |
| T4 | R3, R4, R5, R11 |
| T5 | R5, R8, R9, R11 |
| T6 | R3, R11 |
| T7 | R4, R5, R11 |
| T8 | R6, R11 |
| T9 | R11, R12 |
| T10 | R5, R7, R12 |
| T11 | R5, R8 |
| T12 | R9, R11 |
| T13 | R10 |
| T14 | R2, R10 |
| TV1 | R3–R9, R11, R12 |
| TV2 | R1, R3, R4, R6, R9, R12 |
| TV3 | R11 |
| TV4 | R2 |
| TV5 | R10 |

## Final scope check

- [ ] Every requirement maps to at least one task. (R1: T2, T3; R2: T1–T3, T14; R3: T2, T4, T6; R4: T2, T4, T7; R5: T2, T4, T5, T7, T10, T11; R6: T2, T8; R7: T10; R8: T2, T5, T11; R9: T2, T5, T12; R10: T1, T13, T14; R11: T1, T4–T9, T12; R12: T2, T9, T10.)
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined (TV1–TV5).
