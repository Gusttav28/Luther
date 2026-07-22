# Current implementation progress

- Work item: app-performance (`specs/app-performance/`)
- Branch: `feature/app-performance`
- Spec package: 2026-07-22, human-approved (owner **GO** on 2026-07-22)
- Implementer session: 2026-07-22
- Handoff: **IMPLEMENTED**

## Files read

- `AGENTS.md`, `.agents/implementer.md`
- `specs/app-performance/{requirements,design,tasks}.md` (complete)

## Files changed

### T1 — Skip materialize on page reads

- `lib/queries/overview.ts`, `savings.ts`, `projects.ts` — default reads no longer materialize; only `{ materialize: true }` / legacy `{ skipMaterialize: false }`

### T2 — Materialize after mutations + Overview Refresh

- `lib/queries/materialize.ts` — `safeMaterializeMonth`
- Income / expenses / savings / projects / settings actions call safe materialize after writes
- `app/(app)/overview-actions.ts` + `components/overview/overview-refresh.tsx` — Refresh rematerializes then revalidates

### T3 — Shared Overview snapshot

- `lib/queries/overview.ts` — `loadMonthSnapshot` / `figuresFromSnapshot`
- `lib/queries/overview-dashboard.ts` — `getOverviewDashboard` derives MoM, cashflow, category spend
- `app/(app)/page.tsx` — uses dashboard helper only

### T4 — Aggregate history

- `lib/queries/savings-balance.ts` — lifetime `groupBy` currency sum
- `lib/queries/projects.ts` — contribution totals via `groupBy`
- `lib/queries/balance.ts` — select only needed income fields

### T5 — Unblock login / remove bootstrap

- `app/login/page.tsx` — navigate immediately after login
- `components/app-cache-provider.tsx` — prefetch only
- `lib/client-cache.ts` — prefetch routes only
- Deleted `app/api/bootstrap/route.ts`

### T6 — Auth + refresh cleanups

- `lib/auth.ts` — 5-minute verified-user TTL (still validates unknown JWTs)
- Category picker + export plan — dropped redundant `router.refresh`

### T7 — Handoff

- `progress/current.md` — this file

## Verification

- TV1–TV6: owner manual (Overview/Savings/Projects snappier; login no warm wait; Refresh rematerializes; mutation updates waterfall)
- No new npm dependencies
- `tsc` hung in this environment; IDE lints clean on touched files

## Notes for Reviewer

- Waterfall correctness now depends on mutation materialize + Overview Refresh escape hatch
- Savings contribution **list** still loads all rows for the history UI; balance uses aggregate
- Prior-month Overview still runs scope queries (planned income) — charts no longer re-fetch expenses/income
