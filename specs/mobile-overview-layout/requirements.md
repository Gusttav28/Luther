# Requirements: Mobile Overview Layout

- Work item: specs/mobile-overview-layout/
- Outcome: On small viewports only, present the Overview page using the layout and visual structure of the owner-provided mobile mock (rounded cards, compact month controls, unified KPI card, tabbed Breakdown, stacked sections), while desktop Overview and all financial semantics remain unchanged.
- Branch: feature/mobile-overview-layout
- Status: Specification
- Spec version: 2026-08-04

## Problem

The Overview page currently uses one layout for all breakpoints. The owner supplied a mobile-specific design (`Luther Overview - Standalone.html`) that reorganizes header controls, KPIs, cashflow, category/composition breakdown, half-month schedule, and projects into a denser card stack suited to phones. That presentation must appear below the desktop breakpoint without regressing desktop Overview or changing money calculations, auth, or data loading.

## In scope

- Mobile-only (`md` and below / `md:hidden` presentation) Overview layout and chrome matching the mock’s information architecture and card styling.
- Compact month navigation (circular prev/next) and circular refresh control on mobile Overview.
- Unified KPI card: 2×2 grid of Earned, Spent, Saved, Remaining with MoM deltas; Lifetime balance as a footer row inside the same card (not a fifth grid cell).
- Cashflow section as a rounded card (reuse existing cashflow series/data).
- Breakdown card with Category / Composition segmented control (reuse existing category spend and composition figures).
- Half-month schedule as two side-by-side period cards with Current badge when applicable.
- Projects funded card with progress bars and View all → `/projects`.
- Dark-mode readability using existing theme tokens; no new npm dependencies; no new webfont packages.
- Preserve existing Overview query helpers (`getOverviewDashboard`, MoM, rates note behavior) and reporting-currency formatting via existing `Money` / format helpers.

## Out of scope

- Desktop (`md+`) Overview layout redesign (keep current grid/widgets).
- Bottom navigation / pill bar (owned by `mobile-pill-nav`).
- Mobile app header / Sign out redesign (already in shell).
- Changing financial formulas, materialize behavior, Prisma schema, or auth.
- Adding Space Grotesk or other new fonts/packages (mock font is illustrative).
- Replacing Recharts with custom SVG charts from the mock (optional visual restyle of existing charts is allowed; new chart libraries are not).
- Expenses / Income / other routes’ page layouts.
- Exact pixel parity with mock demo amounts/currency symbols (demo uses placeholder ¢ data).

## Definitions

- **Mobile Overview**: Authenticated `/` content when the viewport is below the app’s `md` breakpoint.
- **Desktop Overview**: Same route at `md` and above; existing layout.
- **Mock reference**: `specs/mobile-overview-layout/reference-overview-standalone.html` and the markup extract `reference-overview-markup-extract.html`.
- **Breakdown tabs**: Client toggle between category spend view and composition view inside one card; does not change server data.

## Requirements

### R1 — Mobile-only presentation; desktop unchanged

- Trigger: Authenticated user opens Overview at a narrow viewport vs at `md+`.
- Preconditions: Existing Overview page and data load succeed.
- Actor/system: `app/(app)/page.tsx` and Overview components.
- Expected response: Below `md`, Overview follows the mobile card-stack layout described in R2–R7. At `md+`, the current desktop Overview structure (separate KPI grid and multi-column widgets) remains.
- State change: Layout/CSS/component composition only.
- Visible/resulting evidence: Resize across `md` switches between mobile and desktop presentations without missing data on either.
- Failure behavior: Prefer showing existing desktop widgets on mobile over showing an empty page if a mobile variant fails to mount.
- Acceptance evidence: Manual check at ~375px and ≥768px on `/`.

### R2 — Mobile header: title, subtitle, circular month + refresh

- Trigger: Mobile Overview renders.
- Preconditions: Year/month search params and refresh action exist.
- Actor/system: Overview header region + month picker / refresh controls.
- Expected response: Shows “Overview” title and “{Month} {Year} · Finance analytics” subtitle. Month control is prev / centered label / next as circular bordered buttons; Refresh is a circular icon button that keeps existing rematerialize + `router.refresh` behavior. Desktop may keep its current header/control arrangement.
- State change: Navigation/rematerialize only as today.
- Visible/resulting evidence: User can change months and refresh on mobile without a wide `btn-secondary` row dominating the header.
- Failure behavior: Disabled/pending states remain during transitions; no silent failure of refresh.
- Acceptance evidence: Change month and refresh at ~375px; values update as today.

### R3 — Unified KPI card with lifetime footer

- Trigger: Mobile Overview renders with overview figures and MoM deltas.
- Preconditions: `getOverviewDashboard` / `computeMomDeltas` data available.
- Actor/system: Mobile KPI presentation.
- Expected response: One rounded card contains a 2×2 grid of Earned, Spent, Saved, Remaining (uppercase micro-labels, large values, MoM delta with direction affordance). Lifetime savings/balance appears as a bottom row (“Lifetime balance” + formatted amount) separated by a subtle top border—not as a fifth equal grid cell. Null/empty amounts use existing Money empty presentation.
- State change: None (display only).
- Visible/resulting evidence: Four primary KPIs + lifetime footer match existing numeric sources; MoM still derived from current helpers.
- Failure behavior: Missing MoM percent hides delta rather than inventing numbers.
- Acceptance evidence: Compare mobile KPI values to desktop for the same month/currency.

### R4 — Cashflow card

- Trigger: Mobile Overview renders.
- Preconditions: Cashflow points from dashboard helper.
- Actor/system: Cashflow widget wrapper on mobile.
- Expected response: Section titled “Cashflow” with subtitle “Cumulative earned vs spent this month” inside a rounded card; shows existing series (or empty state). Visual density may be tightened for mobile; legend remains understandable (e.g. Net / Spent or current series labels).
- State change: None.
- Visible/resulting evidence: Same underlying points as desktop CashflowChart.
- Failure behavior: Empty month shows existing empty copy.
- Acceptance evidence: Month with and without cashflow data at ~375px.

### R5 — Breakdown card with Category / Composition tabs

- Trigger: User views mobile Breakdown and toggles tabs.
- Preconditions: `spentByCategory` and earned/spent/saved figures available.
- Actor/system: New or adapted client Breakdown component for mobile.
- Expected response: One card titled “Breakdown” / “By category or composition” with a segmented Category | Composition control. Category view shows total spent, stacked share bar, and per-category rows (name, amount, %). Composition view shows the existing composition meaning (earned/spent/saved via current donut/helpers)—not a new financial definition. Tab state is local UI only.
- State change: Local tab state only; no persistence of financial data.
- Visible/resulting evidence: Totals and shares match desktop Spent by category / Composition widgets for the same month.
- Failure behavior: Empty categories show empty state; composition with all-null shows empty/placeholder as today.
- Acceptance evidence: Toggle both tabs; spot-check amounts vs desktop.

### R6 — Half-month schedule side-by-side

- Trigger: Mobile Overview renders.
- Preconditions: `perPeriod` and optional `highlightPeriod`.
- Actor/system: Half-month schedule mobile presentation.
- Expected response: Card titled “Half-month schedule” with H1 and H2 in a horizontal two-column layout; each shows range subtitle and Earned/Spent/Saved rows; Current badge when `highlightPeriod` matches.
- State change: None.
- Visible/resulting evidence: Same figures as desktop HalfMonthSchedule.
- Failure behavior: Null figures render via Money empty rules.
- Acceptance evidence: Current vs non-current month highlight behavior at ~375px.

### R7 — Projects funded card

- Trigger: Mobile Overview renders.
- Preconditions: Projects view from dashboard.
- Actor/system: Projects progress mobile presentation.
- Expected response: Card with “Projects funded” / “Active purchase goals”, View all link to `/projects`, and active project name + funded % + bar (or empty state).
- State change: None beyond navigation on View all.
- Visible/resulting evidence: Same active-project set and percents as desktop widget.
- Failure behavior: Empty list shows empty copy.
- Acceptance evidence: With/without active projects at ~375px.

### R8 — Security, privacy, and dependency boundary

- Trigger: Implementation and runtime of mobile Overview.
- Preconditions: Authenticated session required by app layout.
- Actor/system: Overview mobile UI.
- Expected response: No new auth bypass; no secrets or personal financial raw dumps beyond existing Overview displays; no new npm dependencies; no committing `.env` or live personal datasets into the repo (mock HTML may stay under `specs/` as design reference only).
- State change: None to auth/storage beyond existing refresh.
- Visible/resulting evidence: `package.json` dependencies unchanged for this work; Overview still behind login.
- Failure behavior: N/A.
- Acceptance evidence: Diff review of dependencies; Overview still redirects when logged out.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Apply HTML mock on responsive Overview only | R1–R7 |
| Desktop Overview unchanged | R1 |
| Circular month + refresh | R2 |
| 2×2 KPIs + lifetime footer | R3 |
| Cashflow / Breakdown tabs / H1-H2 / Projects | R4–R7 |
| No financial/auth/deps expansion | R8 |

## Assumptions

- Branch may be created from `main` or stacked after `feature/mobile-pill-nav`; this work does not modify bottom nav.
- Existing Geist/app sans stack is used instead of Space Grotesk from the mock.
- Composition tab keeps Luther’s earned/spent/saved composition semantics (mock’s earned-vs-spent-only donut is illustrative).
- `RatesNote` may remain at the bottom on both breakpoints.

## Open questions

- None blocking.
