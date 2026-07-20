# Design: Finance App MVP

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12
- Spec version: 2026-07-20 v2

## Goals

- Provide a secure, single-user, credential-protected web app (R1, R2).
- Model the Excel workbook faithfully: half-month income (R3), dual-currency expenses with CRC reporting (R4, R5), category-by-month plan (R6), monthly overview (R7), running balance (R8), purchase projects with fixed per-period allocations and projections (R9), and lifetime personal savings distinct from per-project savings (R12).
- Ship a responsive UI usable on a phone (R10) with robust validation (R11).
- Keep the architecture open to future email ingestion, an AI assistant, and multi-user support without building any of them now.

## Current system observations

- The repository contains only the engineering harness (`AGENTS.md`, `.agents/`, `.cursor/rules/`, `specs/`, `progress/`, `reviews/`, `README.md`). There is no application code; this work item bootstraps the application.
- Work happens on branch `feature/finance-app-mvp` off `main`.
- The reference Excel workbook is not yet available; the data model below follows the owner's verbal description and must be validated against the workbook (see requirements Open questions).

## Technology choice (proposed for owner approval)

Recommended stack: **Next.js (App Router, TypeScript) + SQLite via Prisma ORM + Auth.js (credentials provider) + Tailwind CSS + Zod validation + Vitest/Playwright for tests.**

Rationale: a single full-stack framework keeps the MVP small (server actions/route handlers instead of a separate API service); SQLite is zero-ops and local-first, and Prisma makes a later move to Postgres a connection-string change; Auth.js gives session handling with a credentials provider and HttpOnly cookies; Tailwind accelerates a responsive mobile-first UI. All monetary values stored as integer minor units (cents/centavos) to avoid floating-point drift (R11).

### Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Next.js + SQLite (Prisma) + Auth.js | **Chosen** | One framework for UI+API, zero-ops DB, easy Postgres migration path, mature ecosystem for future AI/email features. |
| Next.js + Postgres (hosted) | Rejected for MVP | Adds hosting/ops cost and setup for a solo local-first user; Prisma keeps this as a later switch. |
| SvelteKit + SQLite | Rejected | Viable and lighter, but smaller ecosystem for auth and future AI integrations; owner familiarity assumed higher with React. |
| Django + Postgres | Rejected | Solid batteries-included option, but two languages across stack if AI/edge features later use JS tooling; heavier for MVP. |
| Plain Excel replacement (Google Sheets/Airtable) | Rejected | Does not meet security/ownership goals nor future AI-assistant integration. |
| Local desktop app (Electron/Tauri) | Rejected | Owner wants phone access; responsive web covers both. |

## New files

All application code lives under `app/` (Next.js App Router), `lib/`, and `prisma/`. Exact file names may vary slightly in implementation; any new top-level area must be reflected here.

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` | Project scaffolding and approved dependencies | R1–R11 |
| `.env.example`, `.gitignore` | Documented env vars, exclusion of secrets and local DB | R2 |
| `prisma/schema.prisma` | Data model (User, Settings, IncomeEntry, Category, PlanCell, Expense, Project, ProjectContribution, AllocationSetting, SavingsContribution) | R2–R9, R12 |
| `prisma/seed.ts` | Owner account bootstrap from env vars (hashed password), default settings | R1, R2 |
| `lib/auth.ts` | Auth.js configuration, credentials provider, session helpers | R1, R2 |
| `middleware.ts` | Route protection: redirect unauthenticated requests to `/login` | R1, R2 |
| `lib/money.ts` | Minor-unit money type, three-currency (CRC/USD/MXN) conversion via stored USD→CRC and MXN→CRC rates, formatting | R4, R5, R11 |
| `lib/periods.ts` | Half-month period helpers (H1/H2 boundaries, ordering, projection math) | R3, R7, R8, R9 |
| `lib/validation.ts` | Zod schemas for all inputs (amounts, dates, rates, names) | R11 |
| `lib/queries/*.ts` | Server-side aggregation: overview figures, balance series, plan totals, project projections, lifetime savings balance | R5–R9, R12 |
| `app/login/page.tsx` | Login form | R1 |
| `app/(app)/layout.tsx` | Authenticated shell with responsive navigation (bottom nav on mobile) | R10 |
| `app/(app)/page.tsx` | Monthly overview dashboard (earned/spent/saved/remaining, per-period breakdown, lifetime savings balance) | R7, R12 |
| `app/(app)/savings/page.tsx` + server actions | Lifetime savings contributions CRUD and running balance | R12 |
| `app/(app)/income/page.tsx` + server actions | Income CRUD per month/period with totals | R3 |
| `app/(app)/expenses/page.tsx` + server actions | Expense CRUD with currency, category, filters, converted values | R4, R5 |
| `app/(app)/plan/page.tsx` + server actions | Category management and category-by-month plan matrix with totals | R6 |
| `app/(app)/balance/page.tsx` | Running balance view per month/period | R8 |
| `app/(app)/projects/page.tsx` + server actions | Projects CRUD, priority ordering, fixed per-period allocation, per-project saved totals, projected affordability | R9 |
| `app/(app)/settings/page.tsx` + server actions | USD→CRC and MXN→CRC exchange rates, reporting currency (default CRC), starting balance, fixed allocation amount | R5, R8, R9 |
| `tests/**` | Unit tests (money, periods, aggregations, projections, savings) and e2e smoke (auth, CRUD) | R1, R3–R9, R11, R12 |
| `README.md` (update) | Setup, env vars, run/test commands, responsive checklist | R2, R10 |

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `README.md` | Replace placeholder with setup/run documentation | R2, R10 |

(All other paths are new; the repository currently contains no application code.)

## Data and control flow

Schema (Prisma models, all amounts integer minor units, all rows carry `userId` to keep multi-user open):

- `User(id, email, passwordHash, createdAt)` — exactly one row in MVP, seeded from env.
- `Settings(userId, usdToCrcRate, mxnToCrcRate, reportingCurrency[CRC|USD|MXN, default CRC], startingBalanceMinor, startingBalanceCurrency)`.
- `IncomeEntry(id, userId, year, month, period[H1|H2], amountMinor, currency[USD|MXN], label, planned:boolean)`.
- `Category(id, userId, name, archived:boolean)`.
- `PlanCell(id, userId, categoryId, year, month, amountMinor, currency)` — unique per (category, year, month).
- `Expense(id, userId, date, amountMinor, currency, categoryId, note)`.
- `Project(id, userId, name, costMinor, currency, priority:int, completedAt?)`.
- `ProjectContribution(id, userId, projectId, year, month, period[H1|H2], amountMinor, currency)` — recorded when a period's allocation is applied to a project; a project's saved total is the sum of its contributions (separate from lifetime savings).
- `AllocationSetting(userId, amountMinor, currency)` — a fixed amount allocated to projects per half-month period (owner clarified: fixed amount, not a percentage of income).
- `SavingsContribution(id, userId, date, amountMinor, currency[CRC|USD|MXN], note?)` — lifetime savings contributions (negative = withdrawal); the lifetime balance is their cumulative sum.

Control flow: pages are React server components reading via `lib/queries`; mutations are server actions validating with Zod (R11), writing through Prisma in transactions, then revalidating the page. `middleware.ts` gates everything except `/login` (R1). Conversion happens only at read time in `lib/money.ts` using the current Settings rates: CRC is the pivot currency (USD→CRC and MXN→CRC stored; USD↔MXN derived through CRC); original amount+currency are never mutated (R4, R5).

Derived computations (pure functions in `lib/queries` + `lib/periods.ts`, unit-testable):

- Overview (R7, R12): earned = Σ income for month; spent = Σ expenses for month; saved = Σ lifetime savings contributions for month (project allocations are excluded — they are tracked per project); remaining = earned − spent − saved; all converted to reporting currency. The overview also shows the lifetime savings balance (cumulative Σ of all SavingsContribution rows).
- Balance (R8): startingBalance + cumulative(earned − spent) ordered by (year, month, period).
- Projections (R9): past periods' funding is read from ProjectContribution rows; future periods are simulated by adding the fixed per-period allocation to projects in priority order; a project's affordability period is the first period where its cumulative funded amount ≥ cost. Zero/unset allocation → "no projection".
- Plan totals (R6): row totals per category over 12 months, column totals per month, grand total; actuals joined from expenses grouped by category+month.

Invariants: amounts are positive integers in minor units (SavingsContribution may be negative for withdrawals but the lifetime balance never goes below zero); every financial row belongs to the owner user; converted values are never persisted; deleting a category with expenses is forbidden (archive only); lifetime savings and per-project savings are disjoint pools and are never summed together.

Future-proofing (not built now): the query layer isolates all financial reads behind typed functions, which a future AI assistant can consume; the schema's `userId` scoping supports multi-user; expense creation is a single server action that a future email-ingestion worker could call.

## Validation and failure handling

- All inputs validated server-side with Zod schemas (R11); client-side validation is a convenience only.
- Money: positive, ≤ 2 fraction digits, parsed to integer minor units; dates ISO-validated; both exchange rates (USD→CRC, MXN→CRC) must be positive decimals; currency inputs restricted to USD/MXN for income and expenses and CRC/USD/MXN for savings, settings, and projects.
- Writes wrapped in Prisma transactions; on failure nothing persists and the user sees a retry message without internals.
- Missing exchange rate for a currency present in the data: affected aggregates render an explicit "set exchange rate" prompt instead of a number (R5).
- Startup asserts required env vars (`DATABASE_URL`, `AUTH_SECRET`, `OWNER_EMAIL`, `OWNER_PASSWORD` for seed) and fails fast with a clear message (R2).
- Login failures return a generic message; a simple in-memory delay/rate-limit on repeated failures (R1).

## Security, privacy, accessibility, and performance

- Auth.js sessions in HttpOnly, SameSite=Lax cookies; passwords hashed with bcrypt (or argon2) at seed and never logged (R1).
- `middleware.ts` denies all app/API routes without a session; no anonymous data surface (R1, R2).
- `.gitignore` excludes `.env*` and `*.db`; `.env.example` has keys only; no personal financial data or secrets ever committed (R2).
- HTTPS assumed for any non-local deployment; secure cookie flag enabled outside development.
- Accessibility: semantic form labels, keyboard-operable controls, sufficient contrast; the plan matrix uses a real `<table>` with headers.
- Performance: dataset is single-user and small; server-rendered pages with indexed queries (`(userId, year, month)`) are sufficient; no caching layer needed.
- Mobile (R10): Tailwind mobile-first layouts; bottom navigation bar on small viewports; plan matrix horizontally scrollable within its container at narrow widths.

## Dependencies

New dependencies are required and are approved via this spec (owner sign-off on the spec constitutes dependency approval): `next`, `react`, `react-dom`, `typescript`, `prisma`/`@prisma/client`, `next-auth` (Auth.js v5), `bcryptjs`, `zod`, `tailwindcss`, `vitest`, `@playwright/test` (dev). No other runtime dependencies without a spec revision.

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `lib/auth.ts`, `middleware.ts`, `app/login/page.tsx`, `prisma/seed.ts`; Security section |
| R2 | `.env.example`, `.gitignore`, startup env assertions, session cookie policy; Security section |
| R3 | `IncomeEntry` model, `lib/periods.ts`, `app/(app)/income/page.tsx` |
| R4 | `Expense` model (original currency preserved), `app/(app)/expenses/page.tsx` |
| R5 | `Settings` model (usdToCrcRate, mxnToCrcRate, reportingCurrency default CRC), `lib/money.ts` CRC-pivot conversion, `app/(app)/settings/page.tsx` |
| R6 | `Category`/`PlanCell` models, plan totals in `lib/queries`, `app/(app)/plan/page.tsx` |
| R7 | Overview computation in `lib/queries`, `app/(app)/page.tsx` |
| R8 | Balance series in `lib/queries`, `Settings.startingBalance`, `app/(app)/balance/page.tsx` |
| R9 | `Project`/`ProjectContribution`/`AllocationSetting` (fixed amount) models, projection simulation in `lib/queries`, `app/(app)/projects/page.tsx` |
| R10 | `app/(app)/layout.tsx` responsive shell, Tailwind mobile-first, plan-matrix scroll strategy; README checklist |
| R11 | `lib/validation.ts` (Zod), `lib/money.ts` minor units, transactional server actions; Validation section |
| R12 | `SavingsContribution` model, savings balance in `lib/queries`, `app/(app)/savings/page.tsx`, overview integration in `app/(app)/page.tsx` |
