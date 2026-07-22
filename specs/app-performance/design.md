# Design: App read-path performance

- Governing requirements: R1–R7

## Goals

- Cut write work off page renders (R1, R2)
- Collapse Overview round-trips (R3)
- Stop loading full history into Node for sums (R4)
- Unblock login (R5)
- Small RTT cleanups (R6) under existing auth (R7)

## Current system observations

- `getOverview` / `getSavings` / `getProjectsView` call `materializeMonthWaterfall` unless `skipMaterialize` — Overview page calls two `getOverview`s plus `getSpentByCategory` + `getCashflowSeries` + `getProjectsView` (`app/(app)/page.tsx`).
- Login `await warmBootstrapCache()` before `router.replace("/")`; `readBootstrapCache()` is unused by pages (`lib/client-cache.ts`, `app/login/page.tsx`).
- Lifetime savings and balance pull all rows (`overview.ts`, `savings.ts`, `balance.ts`); projects load all contributions (`projects.ts`).
- `skipMaterialize` option already exists — page entrypoints simply do not pass it.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/page.tsx` | Use skipped-materialize overview snapshot API; drop duplicate dashboard queries | R1, R3 |
| `lib/queries/overview.ts` | Default skip on read helpers used by pages; expose snapshot suitable for MoM | R1, R3 |
| `lib/queries/overview-dashboard.ts` | Derive cashflow + category spend from snapshot (or pure helpers); stop independent `findMany` when called from Overview | R3 |
| `lib/queries/savings.ts` | Page path `skipMaterialize: true`; lifetime via aggregate | R1, R4 |
| `lib/queries/projects.ts` | Page path `skipMaterialize: true`; contribution totals via `groupBy`/aggregate | R1, R4 |
| `lib/queries/balance.ts` | Aggregate or window series query | R4 |
| `lib/queries/waterfall-scope.ts` | Keep materialize + dedupe; no behavior change beyond callers | R2 |
| `app/(app)/income/actions.ts` (and other mutation actions that affect waterfall inputs) | After successful write, `materializeMonthWaterfall` for affected month(s) | R2 |
| `app/(app)/expenses/actions.ts` | Same for expense create/update/delete/complete/export | R2 |
| `app/(app)/savings/actions.ts` | Same where waterfall-relevant | R2 |
| `app/(app)/projects/actions.ts` | Same after project mutations | R2 |
| `app/(app)/settings/actions.ts` (if rates change) | Materialize current month after rate changes | R2 |
| `components/overview/overview-refresh.tsx` | Keep refresh; ensure it rematerializes (call path that does **not** skip) | R2 |
| `app/login/page.tsx` | Navigate immediately after login; no warm await | R5 |
| `components/app-cache-provider.tsx` | Remove bootstrap warm (keep route prefetch if cheap) | R5 |
| `lib/client-cache.ts` / `app/api/bootstrap/route.ts` | Delete unused bootstrap cache + route **or** slim to unused offline helper — prefer delete if nothing reads it | R5 |
| `lib/auth.ts` | Lighten `requireUserId` if safe | R6 |
| `components/category-picker.tsx` | Drop redundant `router.refresh` when action revalidates | R6 |
| `app/(app)/expenses/export-plan-button.tsx` | Same if applicable | R6 |
| `progress/current.md` | Implementation log | — |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| Optional pure helpers colocated in `lib/queries/overview-dashboard.ts` | Derive series from in-memory rows | R3 |

No new dependencies.

## Data and control flow

```
[Page read Overview]
  getSettings
  loadMonthSnapshot(current) + loadMonthSnapshot(prior)   // skipMaterialize
  derive KPIs, MoM, cashflow, category spend
  getProjectsView({ skipMaterialize: true })              // aggregates for funding

[Mutation income/expense/…]
  write primary row
  materializeMonthWaterfall(affected month)
  revalidatePath …

[Login]
  ok → router.replace("/")   // no warmBootstrapCache await

[Overview Refresh]
  materialize current month (force) + router.refresh
```

### Snapshot shape (conceptual)

- Month income rows (actual for spent KPIs; planned only if already used by overview)
- Completed expenses for month (amount, currency, date, categoryId/name as needed)
- In-month savings contributions (for saved KPI)
- Lifetime savings: `aggregate` sum converted in reporting (or sum minors per currency then convert)
- Scope/waterfall display: compute from snapshot + existing stored contribution rows without re-upsert

Exact field list must preserve current Overview UI props.

### Balance window

Prefer period aggregation for all available periods if cheap; if full history remains heavy, cap Balance chart to **last 36 months** and document in UI subtitle only if capped (avoid silent truncation — if capped, show “Last 36 months”). Prefer no cap if aggregate-by-period keeps it fast.

## Validation and failure handling

- Materialize after mutation: wrap in try/catch; primary mutation already succeeded → do not return GENERIC_ERROR solely for materialize failure (log optional). Revalidate paths still run.
- Overview math: preserve null-on-missing-rate semantics.

## Security, privacy, accessibility, and performance

- `userId` on every query (R7).
- No secrets in repo; no new packages.
- Performance success: Overview cold navigations should drop from multi-second DB storms to a small parallel batch; login should not wait on bootstrap.

## Dependencies

None. New dependencies prohibited.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep materialize on read + longer dedupe | Rejected | Still pays writes; fails across serverless instances |
| Full React Query client cache | Rejected | Out of scope; larger architecture change |
| Keep login warm but make Overview read cache | Rejected | Cache unused today; faster to remove blocker |
| Background `waitUntil` materialize | Deferred | Nice-to-have; mutation-await is enough for single-user |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | skipMaterialize on page query entrypoints |
| R2 | mutation hooks + Overview Refresh |
| R3 | shared snapshot + derive dashboard series |
| R4 | aggregates / groupBy / optional Balance window |
| R5 | login + app-cache-provider + delete unused bootstrap |
| R6 | auth + drop duplicate refresh |
| R7 | existing session scoping |
