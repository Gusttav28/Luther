# Tasks: Percentage savings waterfall & Supabase

## Implementation checklist

- [ ] T1 — Point Prisma at Supabase Postgres
  - Files: `prisma/schema.prisma`, `.env.example`, `lib/env.ts`, README note if needed
  - Requirements: R7, R8
  - Preconditions: human-approved spec; exact `DATABASE_URL` + `DIRECT_URL` from Supabase dashboard in local `.env`
  - Expected evidence: `prisma migrate` (or `db push` if agreed) succeeds against Supabase; app boots with Postgres

- [ ] T2 — Schema: project % fields + priority; retire fixed allocation
  - Files: `prisma/schema.prisma`, migration SQL
  - Requirements: R3, R4, R5
  - Preconditions: T1
  - Expected evidence: columns `allocationPercent`, `periodMode`, `goalDate`, `isPriority`; `AllocationSetting` dropped or unused

- [ ] T3 — Waterfall helpers + unit tests
  - Files: `lib/waterfall.ts`, `tests/unit/waterfall.test.ts`
  - Requirements: R1, R2, R3, R6
  - Preconditions: none beyond branch
  - Expected evidence: tests for leftover, 70% lifetime, post-lifetime, project take with floor rounding and 70% cap

- [ ] T4 — Queries/overview/projections use waterfall; idempotent period materialization
  - Files: `lib/queries/savings.ts`, `lib/queries/projects.ts`, `lib/queries/overview.ts`, `lib/projections.ts`, related actions
  - Requirements: R1, R2, R4, R6, R9
  - Preconditions: T2, T3
  - Expected evidence: overview saved/remaining and project funding follow waterfall; adjustments still guarded

- [ ] T5 — Savings UI: show derived 70%; keep adjustment escape hatch
  - Files: `app/(app)/savings/*`, components as needed
  - Requirements: R2, R6, R9
  - Preconditions: T4
  - Expected evidence: primary path is derived %; manual adjust still works and cannot go negative

- [ ] T6 — Projects UI/actions: %, period, goal date, single priority
  - Files: `app/(app)/projects/*`
  - Requirements: R3, R4, R5
  - Preconditions: T2, T4
  - Expected evidence: form fields validated; only one priority; fixed allocation UI gone

- [ ] T7 — Secrets & client hygiene check
  - Files: `.env.example`, grep client bundle / tracked files
  - Requirements: R8
  - Preconditions: T1
  - Expected evidence: no service-role or DB password in repo or client; example file placeholders only

## Verification

- [ ] TV1 — Unit: waterfall math (`npm test` / vitest target)
  - Covers: R1–R3, R6
  - Expected result: pass

- [ ] TV2 — Unit/integration: single priority + percent validation
  - Covers: R3, R4, R5
  - Expected result: pass

- [ ] TV3 — Manual smoke against Supabase
  - Covers: R7, R2, R5, R6
  - Expected result: login; set income/expenses; see 70% lifetime and priority project take; create project with % / period / goal date

- [ ] TV4 — `git status` / ignore check: `.env` untracked; no secrets staged
  - Covers: R8
  - Expected result: clean

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R7, R8 |
| T2 | R3, R4, R5 |
| T3 | R1, R2, R3, R6 |
| T4 | R1, R2, R4, R6, R9 |
| T5 | R2, R6, R9 |
| T6 | R3, R4, R5 |
| T7 | R8 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
