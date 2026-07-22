# Design: Percentage savings waterfall & Supabase

- Governing requirements: R1–R9

## Goals

- Encode the owner’s income → expenses → 70% lifetime → priority project % waterfall (R1–R6).
- Move Prisma from SQLite to Supabase Postgres with safe secret handling (R7–R8).
- Preserve a minimal manual lifetime adjustment path (R9).

## Current system observations

- `prisma/schema.prisma` uses SQLite; money in integer minor units; Auth.js credentials user.
- Lifetime: `SavingsContribution` dated amount rows; overview “saved” = month contributions.
- Projects: `Project` (name, cost, currency, priority int) + `ProjectContribution` + global `AllocationSetting` fixed amount per half.
- Queries in `lib/queries/savings.ts`, `lib/queries/projects.ts`, `lib/projections.ts`; UI in `app/(app)/savings/*`, `app/(app)/projects/*`.
- `.env` is gitignored; Supabase URL / publishable / service role / DB password stored locally for this work (not committed).

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `prisma/schema.prisma` | `provider = "postgresql"`; `url` + `directUrl`; extend `Project` (`allocationPercent`, `periodMode`, `goalDate`, `isPriority`); retire or stop using `AllocationSetting`; keep `SavingsContribution` for R9 | R3–R5, R7, R9 |
| `prisma/migrations/*` | New migration(s) for Postgres + column changes | R5, R7 |
| `.env.example` | Document `DATABASE_URL`, `DIRECT_URL`, Supabase public vars; never real secrets | R7, R8 |
| `lib/env.ts` | Assert Postgres-related env as needed; never require service role in runtime web path unless a server-only admin tool needs it | R7, R8 |
| `lib/waterfall.ts` (new) | Pure functions: leftover, lifetime 70%, post-lifetime, project take | R1–R3, R6 |
| `lib/queries/savings.ts` | Prefer derived lifetime for period; keep balance from contributions/adjustments + derived posts as designed | R2, R6, R9 |
| `lib/queries/projects.ts` / `lib/projections.ts` | Priority project % of post-lifetime leftover; drop fixed allocation setting path | R3–R6 |
| `lib/queries/overview.ts` | “Saved” / remaining use waterfall for the month | R1, R2, R6 |
| `app/(app)/savings/*` | Show derived 70% take; de-emphasize amount entry; keep adjustment UI | R2, R6, R9 |
| `app/(app)/projects/*` | Form: name, cost, %, period mode, goal date, priority; remove fixed allocation control | R3–R5 |
| `app/(app)/projects/actions.ts` | Validate % 1–70; enforce single `isPriority` | R3, R4 |
| Unit tests under `tests/unit/` | Waterfall math + priority invariant | R1–R6 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `lib/waterfall.ts` | Integer-safe waterfall helpers | R1–R3, R6 |
| `specs/percentage-savings-projects/*` | This spec package | — |

## Data and control flow

### Waterfall (reporting currency, integer minor units)

```
plannedIncome = Σ planned IncomeEntry (month; or H1/H2 when period-scoped)
expenses      = Σ Expense in same scope
leftover      = max(0, plannedIncome − expenses)          // R1

lifetimeTake  = floor(leftover * 70 / 100)                 // R2 always 70%
postLifetime  = leftover − lifetimeTake                    // ≈ 30%

projectTake   = floor(postLifetime * allocationPercent / 100)  // R3, percent ∈ [1,70]
```

Rounding: use **floor** on percentage takes so we never over-allocate; document in tests.

### Period scope

- Month view (default overview/savings): income = H1+H2 planned; expenses = full month.
- Project `periodMode`:
  - `H1` / `H2`: compute leftover using that half’s planned income and expenses dated in that half (days 1–15 vs 16–end).
  - `BOTH`: use full-month leftover (or apply once at month scope — same as month view).

### Priority

- `Project.isPriority` boolean; partial unique index / app-level: at most one row with `isPriority = true` and `completedAt IS NULL` per `userId`.
- Ordering field `priority` (int) may remain for display sort of non-priority backlog; funding commit uses `isPriority` only.

### Persistence strategy for derived amounts

**Recommended for MVP of this item:**

1. **Settings / constants:** lifetime percent = 70 (constant in code; not a settings field unless needed later).
2. **On demand derivation** for display (overview, savings summary, project projection).
3. **Optional period snapshot** (nice-to-have in same PR if cheap): when viewing/confirming a month, upsert a ledger row so history survives if later expenses change — **not required** if owner accepts that figures always recompute from current income/expenses.
4. **R9 adjustments:** keep `SavingsContribution` for manual corrections; lifetime **balance** = sum(adjustments) + sum(derived period takes that were posted).

**Posting rule (R6):** Implementer should **auto-materialize** lifetime take (and priority project contribution) for a closed half/month when income+expenses for that scope are present — idempotent upsert by `(userId, year, month, period, kind)` so refresh does not double-count. If auto-post is ambiguous for “open” current half, show **projected** values and post when the half ends or when the user opens Savings and the scope is complete; prefer idempotent upsert over silent double posts.

### Supabase / Prisma

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- `DATABASE_URL`: pooled connection (transaction mode) for the app.
- `DIRECT_URL`: direct connection for `prisma migrate`.
- Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in client components or `NEXT_PUBLIC_*`.
- Auth remains Auth.js + `User.passwordHash` in Postgres unless a later work item migrates auth.

### Project model (delta)

```text
Project {
  ...
  allocationPercent Int      // 1–70
  periodMode        String   // H1 | H2 | BOTH
  goalDate          DateTime
  isPriority        Boolean  @default(false)
}
```

Remove UI/API dependence on `AllocationSetting`; migration may drop the table after data no longer needed.

## Validation and failure handling

- `allocationPercent` zod: int 1–70.
- `periodMode` enum; `goalDate` required valid date.
- Setting `isPriority=true` clears other active priorities in the same transaction.
- FX: reuse existing rate helpers; null rate → null reporting amounts + RatesNote.
- Migrate failure: fail fast; do not half-write SQLite and Postgres.

## Security, privacy, accessibility, and performance

- Secrets only in `.env` (R8). Rotate any credentials that were pasted into chat.
- Financial rows remain `userId`-scoped; `requireUserId()` on all mutations.
- Forms: labels for %, period, goal date; errors announced with existing patterns.
- Waterfall is O(n) over month entries — fine for single-owner volumes.

## Dependencies

- **No new npm dependency required** for waterfall math.
- Supabase JS client **not required** if Prisma speaks Postgres directly; add `@supabase/supabase-js` only if a later auth migration needs it (out of scope).
- Prisma Postgres already supported by `prisma` / `@prisma/client` — provider switch only.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| User-editable lifetime % | Rejected for this item | Owner: always 70% |
| All projects funded in parallel sharing leftover | Rejected | Owner: single priority commit |
| Keep SQLite locally + Supabase later | Rejected for this item | Owner provided Supabase now |
| Project % of pre-lifetime leftover | Rejected | Owner: % of amount left **after** lifetime (the 30% bucket), max 70% of that |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | Waterfall leftover formula |
| R2 | `lifetimeTake = 70%` |
| R3 | `allocationPercent` + cap; `projectTake` |
| R4 | `isPriority` invariant |
| R5 | Project fields + UI |
| R6 | Derived + idempotent materialization |
| R7 | Prisma Postgres + Supabase URLs |
| R8 | `.env` / example / no service role in browser |
| R9 | Keep `SavingsContribution` adjustments |
