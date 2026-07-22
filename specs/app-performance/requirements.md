# Requirements: App read-path performance

- Work item: specs/app-performance/
- Outcome: Faster page loads and login by cutting redundant DB work on reads
- Branch: `feature/app-performance`
- Status: Specification
- Spec version: 2026-07-22

## Problem

Luther feels slow on everyday navigation: Overview, Savings, Projects, and Balance often take multiple seconds after auth because page reads materialize waterfall rows (writes), re-query the same month data many times, and pull unbounded history. Login also waits on a bootstrap warm-up that does not speed the first Overview paint.

## In scope

- Stop automatic waterfall materialization on Overview / Savings / Projects **page reads**; keep correctness via mutation-triggered materialize and the existing Overview refresh control.
- Collapse Overview into one shared month data fetch; derive MoM, cashflow, and category spend without duplicate Prisma round-trips.
- Bound or aggregate all-time savings / balance / project contribution queries used for KPIs and series.
- Remove login-blocking bootstrap warm-up (and shell warm that only duplicates work); delete or leave unused client bootstrap cache without using it to block navigation.
- Small auth / refresh cleanups that save RTT without changing product math.
- No new npm dependencies.

## Out of scope

- Changing waterfall allocation formulas, half-month rules, or completion semantics
- CDN / edge hosting / database plan upgrades
- Full client-side SPA rewrite or React Query adoption
- Production-only A/B measurement infrastructure
- Visual redesign of Overview / Savings / Balance charts

## Definitions

- Page read: a Server Component / query invoked to render a route (not a form mutation).
- Materialize: upsert of waterfall savings / project contribution rows for a month’s H1/H2.
- Shared month snapshot: one load of the month’s income, completed expenses, and in-month savings (plus settings) reused for Overview KPIs and charts.

## Requirements

### R1 — No materialize on page reads

- Trigger: Owner opens Overview, Savings, or Projects (or any page that today calls `getOverview` / `getSavings` / `getProjectsView` without an explicit refresh intent).
- Preconditions: Authenticated owner.
- Actor/system: Query layer.
- Expected response: Those reads use `skipMaterialize: true` (or equivalent). No waterfall upserts run solely because the page rendered.
- State change: None from the read itself.
- Visible/resulting evidence: Network/DB: no materialize upserts on plain navigation; page still renders KPIs from existing stored contributions + live scope math.
- Failure behavior: Unchanged query errors.
- Acceptance evidence: Code review + timing/log check that materialize is not invoked from page entrypoints.

### R2 — Materialize after mutations that affect waterfall inputs

- Trigger: Owner successfully creates/updates/deletes income, expenses (including completion toggle and month export), savings adjustments, projects (create/update/delete/priority), or settings rates/currency that affect conversion used in materialize.
- Preconditions: Mutation succeeds.
- Actor/system: Relevant server actions.
- Expected response: Materialize the affected calendar month(s) once after the write (reuse existing `materializeMonthWaterfall` + 45s dedupe). Overview “Refresh” remains an explicit rematerialize + `router.refresh`.
- State change: Waterfall contribution rows updated for that month.
- Visible/resulting evidence: After editing an expense in the current month, Savings/Overview waterfall figures update without requiring a separate Sync beyond normal revalidation.
- Failure behavior: If materialize fails, mutation still commits; surface existing generic error only if the action already fails; do not roll back the primary write solely for materialize failure unless current code already does (prefer: log/swallow materialize failure after successful primary write — match safest existing pattern).
- Acceptance evidence: Mutation paths call materialize; page reads do not.

### R3 — Single Overview data path

- Trigger: Owner opens `/` for a year/month.
- Preconditions: Authenticated owner.
- Actor/system: `app/(app)/page.tsx` + overview query helpers.
- Expected response: One shared fetch of current-month (and prior-month for MoM) base rows; KPIs, cashflow series, and spent-by-category derived in memory. No parallel second `getOverview` that re-materializes/re-fetches scopes from scratch, and no separate `getSpentByCategory` / `getCashflowSeries` that re-query the same month expenses/income.
- State change: None.
- Visible/resulting evidence: Same KPI/chart numbers as before (within conversion rounding); fewer Prisma round-trips (target: roughly a handful of queries, not dozens).
- Failure behavior: Missing rates still show “—” / RatesNote as today.
- Acceptance evidence: Manual Overview check vs prior month MoM; code shows shared snapshot.

### R4 — Bound or aggregate history queries

- Trigger: Owner opens Overview lifetime KPI, Savings, Balance, or Projects contribution totals; bootstrap if retained in slim form.
- Preconditions: Authenticated owner; possibly years of waterfall rows.
- Actor/system: `lib/queries/{overview,savings,balance,projects}.ts` (and bootstrap if kept).
- Expected response:
  - Lifetime savings totals use aggregate/`SUM` (or equivalent), not loading every contribution row into Node solely to sum.
  - Balance series may still show history but must not require unbounded full-row hydration beyond what the chart needs — prefer aggregating by period in the query or capping to a documented window (e.g. last 24 months) if full history is too heavy; document the window in design if capped.
  - Project funded amounts use grouped sums (`groupBy` / aggregate), not loading every contribution row for display math.
- State change: None.
- Visible/resulting evidence: Totals match previous math for the owner’s current dataset; pages feel faster as history grows.
- Failure behavior: Unchanged rate-missing behavior.
- Acceptance evidence: Code review of query shapes + manual KPI spot-check.

### R5 — Login and shell must not block on unused bootstrap

- Trigger: Successful login; app shell mount.
- Preconditions: Authenticated session.
- Actor/system: `app/login/page.tsx`, `components/app-cache-provider.tsx`, `lib/client-cache.ts`, optional `app/api/bootstrap/route.ts`.
- Expected response: After login, navigate to `/` immediately (prefetch optional). Do not `await warmBootstrapCache()` before navigation. Remove or no-op shell warm that only duplicates DB work unused by SSR pages. If bootstrap route remains, it must not be on the critical path; prefer delete unused client cache helpers if nothing reads them.
- State change: None required.
- Visible/resulting evidence: Login no longer shows a long “Loading your data…” wait before Overview starts loading.
- Failure behavior: Login failure unchanged.
- Acceptance evidence: Manual login timing; no warm await on success path.

### R6 — Light RTT cleanups

- Trigger: Any authenticated navigation / post-mutation refresh.
- Preconditions: As today.
- Actor/system: Auth helpers, category picker / export refresh patterns.
- Expected response:
  - Avoid redundant `user.findUnique` on every `requireUserId` if session already carries a trusted `user.id` (keep a safe check if required for security; document choice).
  - Where a server action already `revalidatePath`s the current route, drop an extra client `router.refresh()` that forces a duplicate full RSC reload — except Overview Refresh which is intentional.
- State change: None.
- Visible/resulting evidence: Slightly snappier nav/CRUD; no functional regression on category CRUD or export.
- Failure behavior: Unchanged.
- Acceptance evidence: Code review of auth + refresh call sites.

### R7 — Security and privacy

- Trigger: All changed queries/actions.
- Preconditions: Session required for app data.
- Actor/system: Existing auth gates.
- Expected response: All queries remain `userId`-scoped; no secrets or personal financial dumps in the repo; no new dependencies.
- State change: N/A.
- Visible/resulting evidence: Same auth redirects.
- Failure behavior: Unauthenticated denied as today.
- Acceptance evidence: Actions/queries still use `requireUserId` / session `userId`.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Faster Overview / navigation | R1, R3, R6 |
| Waterfall still correct after edits | R2 |
| History pages don’t get slower forever | R4 |
| Faster login | R5 |
| Auth / no secrets | R7 |

## Assumptions

- Owner dataset remains single-user; indexes already present on `(userId, date)` remain sufficient for this item unless a composite `(userId, completed, date)` is trivial to add (optional, not required).
- Overview Refresh button stays as the manual rematerialize escape hatch.

## Open questions

None blocking. Materialize-on-mutation list in R2 is the chosen correctness strategy.

## Spec readiness

SPEC_READY → specs/app-performance/
