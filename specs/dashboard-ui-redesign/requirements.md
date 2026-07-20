# Requirements: Dashboard UI Redesign

- Work item: specs/dashboard-ui-redesign/
- Outcome: Redesign Luther's UI to match the owner's reference Revenue Analytics aesthetic (light cards, coral accent, outline icon sidebar, analytics-style Overview), default all displayed money to Costa Rican colones (₡), and replace emoji/symbol nav with Lucide outline icons.
- Branch: feature/dashboard-ui-redesign
- Status: Specification
- Spec version: 2026-07-20

## Problem

Luther's current UI is a functional but utilitarian finance shell (stone/green palette, emoji/unicode nav icons, simple KPI cards and table). The owner provided a WhatsApp photo of a Revenue Analytics dashboard and asked to redesign the app — especially Overview — to that look while keeping Luther's real finance semantics. Money must clearly show the colón (₡) for CRC; navigation must use a proper thin outline icon set instead of emoji/symbols.

## In scope

- Visual redesign of the whole app shell (layout, desktop sidebar, mobile bottom nav, cards, typography, color tokens) to match the reference aesthetic.
- Full redesign of the Overview/dashboard page into an analytics-style composition wired to existing overview / expenses / income / savings / projects query data.
- Apply the same card/button/field visual language to other pages (income, expenses, plan, savings, balance, projects, settings, login) so the app feels consistent; those pages may keep similar information architecture.
- Currency display: reporting currency remains CRC by default; all CRC money displays must show ₡ (never bare `$` for CRC). Fix any UI that incorrectly shows dollars for CRC amounts. `RatesNote` may still mention `$1` / `MX$1` as source currencies when describing exchange rates.
- Icons: replace current emoji/unicode icons in nav (and shell affordances as needed) with **lucide-react** outline icons.
- Responsive: desktop narrow icon sidebar + dashboard grid; mobile stacks cards and keeps bottom nav with Lucide icons.
- Optional chart dependency: **recharts** only, for line / donut / horizontal bar charts required by the Overview composition. Prefer CSS/SVG for simple segmented bars when sufficient.

## Out of scope

- Changing finance business rules, Prisma schema, authentication, or money math.
- Email ingestion, AI assistant, bank integrations, or Excel workbook import (workbook still pending separately).
- Pixel-perfect clone of every e-commerce widget label from the reference photo.
- Generating custom PNG icons via external AI APIs.
- New dependencies other than lucide-react and (if used) recharts.

## Definitions

- Reference aesthetic: the owner's Revenue Analytics photo — light gray/white background, white rounded cards with soft shadows, muted coral/red accent, soft green for positive deltas, coral/red for negative, clean modern sans-serif, narrow outline-icon sidebar.
- Reporting currency: unchanged from MVP — user-selectable CRC / USD / MXN; default CRC. Aggregated totals display in the selected reporting currency with the correct symbol (`₡`, `$`, `MX$`).
- Overview analytics composition: KPI row + cashflow chart + spent-by-category card + composition donut + half-month schedule card + projects progress bars (see R4–R9).
- MoM delta: optional month-over-month percentage or absolute comparison for a KPI versus the prior calendar month, when both values are computable; omitted gracefully when data or rates are missing.
- Empty/placeholder chart state: a calm empty illustration or short message inside a card when series data is sparse or all zeros — never fake e-commerce numbers.

## Requirements

### R1 — App shell matches reference aesthetic

- Trigger: any authenticated app page is rendered (desktop or mobile).
- Preconditions: authenticated session (existing auth unchanged).
- Actor/system: owner; app layout / global styles.
- Expected response: light gray/off-white page background; white rounded cards with soft shadows; muted coral accent (not purple, not the prior green-primary brand); clean modern sans-serif typography; consistent card / button / field / label tokens applied app-wide.
- State change: none (presentation only).
- Visible/resulting evidence: shell and shared components visually align with the reference photo's palette and card language.
- Failure behavior: N/A (static styling).
- Acceptance evidence: visual review of layout on Overview plus at least one other page shows coral accent, soft white cards, and no purple-primary theme.

### R2 — Narrow outline-icon sidebar and Lucide bottom nav

- Trigger: authenticated user navigates the app.
- Preconditions: authenticated session.
- Actor/system: owner; `SideNav` / `BottomNav` / app layout.
- Expected response: desktop shows a narrow left icon sidebar with Lucide outline icons, clear active state (coral highlight), Luther mark/logo affordance at top, and avatar or sign-out control at bottom; mobile keeps a bottom nav using the same Lucide icons (no emoji/unicode symbols). Labels remain accessible (visible text on mobile; `aria-label` / title on icon-only desktop items).
- State change: none.
- Visible/resulting evidence: no emoji/unicode nav icons remain; Lucide icons for Overview, Income, Expenses, Plan, Savings, Balance, Projects, Settings.
- Failure behavior: N/A.
- Acceptance evidence: code review / UI check that nav imports Lucide icons only; active route highlighted; keyboard/`aria` labels present for icon-only controls.

### R3 — Consistent visual system on all existing pages

- Trigger: user opens income, expenses, plan, savings, balance, projects, settings, or login.
- Preconditions: none beyond existing page access rules.
- Actor/system: owner; page UI.
- Expected response: those pages use the same card, button, field, table, and typography tokens as the redesigned shell; layout structure may stay similar; login matches the same palette without requiring the full analytics dashboard.
- State change: none.
- Visible/resulting evidence: no page still uses the old green-primary stone card system as the primary look.
- Failure behavior: N/A.
- Acceptance evidence: spot-check each listed route for shared tokens; no orphaned pre-redesign primary styles as the dominant look.

### R4 — Overview header and KPI row

- Trigger: user opens Overview for a selected year/month.
- Preconditions: authenticated; existing `getOverview` (and prior-month figures if MoM shown).
- Actor/system: owner; Overview page.
- Expected response: header title in the style of the reference (e.g. "Overview" or "Finance Overview") with month picker and a last-updated / refresh affordance (refresh = reload current month view); top row of 5 KPI cards — **Earned**, **Spent**, **Saved** (lifetime contributions that month), **Remaining**, **Lifetime savings balance** — large bold amounts via existing `Money`, optional MoM delta labels in green (positive) / coral-red (negative) when prior month is computable.
- State change: none.
- Visible/resulting evidence: five KPI cards with real Luther figures; no fake e-commerce KPI labels.
- Failure behavior: if a figure is null (missing rate), show existing "Set exchange rate" behavior; omit MoM delta when prior month unavailable.
- Acceptance evidence: Overview with seeded or real data shows five correct KPIs; null-rate path still links to settings.

### R5 — Cashflow chart card

- Trigger: Overview render for selected month.
- Preconditions: income and expense data for the month (may be empty).
- Actor/system: owner; Overview cashflow widget.
- Expected response: large card titled Cashflow (or equivalent) showing a line chart of monthly / half-month cashflow derived from real income vs expenses for the selected month (e.g. cumulative remaining or earned-vs-spent series across H1/H2 and/or day buckets). Uses **recharts** if a proper line chart is required.
- State change: none.
- Visible/resulting evidence: chart reflects Luther data; empty/sparse months show a graceful empty state (no invented series).
- Failure behavior: missing rates → same null money handling; empty data → empty state, not an error crash.
- Acceptance evidence: month with income/expenses shows a coherent series; empty month shows placeholder; no console crash.

### R6 — Spent by category card

- Trigger: Overview render for selected month.
- Preconditions: expense categories and expenses for the month (may be empty).
- Actor/system: owner; Overview category widget.
- Expected response: card titled like "Spent by category" showing total spent for the month, a segmented horizontal progress bar (CSS/SVG preferred), and colored pills/list of categories with amount and share of total — mapped from real expense category totals for the selected month (not e-commerce product categories).
- State change: none.
- Visible/resulting evidence: category shares sum to ~100% of categorized spend; uncategorized handled if present in data model.
- Failure behavior: empty expenses → empty state; missing rates → rate prompt on amounts.
- Acceptance evidence: expenses in multiple categories appear as distinct segments/pills with correct proportions.

### R7 — Composition donut card

- Trigger: Overview render for selected month.
- Preconditions: overview figures available (may be zero).
- Actor/system: owner; Overview donut widget.
- Expected response: donut chart showing composition of **Earned / Spent / Saved** for the selected month (center total = earned when positive, or a clear "Total" of the three absolute shares — design must pick one coherent center label and stick to it). Uses **recharts** if needed.
- State change: none.
- Visible/resulting evidence: segments labeled Earned, Spent, Saved with percentages; finance semantics only.
- Failure behavior: all-zero or null → empty state; negative remaining does not invent negative donut slices — donut uses earned/spent/saved only.
- Acceptance evidence: known figures produce expected segment proportions; empty month handled gracefully.

### R8 — Half-month schedule card

- Trigger: Overview render for selected month.
- Preconditions: overview `perPeriod` H1/H2 figures.
- Actor/system: owner; Overview schedule widget.
- Expected response: card presenting half-month breakdown as a schedule-style list (not fake meetings): **H1 (1st–15th)** and **H2 (16th–end)** with key figures earned / spent / saved for each period. May include a simple period highlight (current half-month) using the coral accent.
- State change: none.
- Visible/resulting evidence: replaces the current plain table with a schedule-style card using the same data.
- Failure behavior: null figures → rate prompt or em dash per existing money patterns.
- Acceptance evidence: H1/H2 figures match `getOverview` perPeriod values.

### R9 — Projects progress bars card

- Trigger: Overview render.
- Preconditions: projects query data available (may be empty).
- Actor/system: owner; Overview projects widget.
- Expected response: horizontal bar card showing active purchase projects and **funded %** (from existing projects query), coral bar fills, percent aligned at end. Empty state when no active projects.
- State change: none.
- Visible/resulting evidence: bars match `fundedPercent` from projects data; completed projects omitted or clearly secondary.
- Failure behavior: null funded percent (missing rates) → show rate prompt or "—" without crashing.
- Acceptance evidence: project with known saved/cost shows correct %; empty list shows placeholder.

### R10 — CRC colón symbol on all money displays

- Trigger: any UI renders a monetary amount in CRC (or reporting currency).
- Preconditions: amount available (non-null).
- Actor/system: owner; `formatMinor` / `Money` and any ad-hoc amount rendering.
- Expected response: CRC amounts always display with **₡**; USD with `$`; MXN with `MX$`. No bare `$` for CRC. No UI incorrectly labels CRC totals as dollars. `RatesNote` may still say `$1 = ₡…` and `MX$1 = ₡…` for source currencies.
- State change: none (display correctness).
- Visible/resulting evidence: Overview and other pages show ₡ for default CRC reporting.
- Failure behavior: null amounts still use existing exchange-rate link.
- Acceptance evidence: audit of money displays / tests asserting `formatMinor` CRC prefix is ₡; no hardcoded `$` for CRC totals in UI strings.

### R11 — Responsive analytics layout

- Trigger: viewport is desktop (≥ md) or mobile (< md).
- Preconditions: Overview and shell rendered.
- Actor/system: owner; CSS / layout.
- Expected response: desktop — narrow sidebar + multi-column dashboard grid (KPI row; cashflow + category; donut + schedule + projects). Mobile — stacked cards, bottom Lucide nav, usable one-handed scrolling without horizontal overflow of primary content (charts may scroll within cards if needed).
- State change: none.
- Visible/resulting evidence: both breakpoints usable without broken nav or unreadable KPIs.
- Failure behavior: N/A.
- Acceptance evidence: manual or Playwright viewport checks at mobile and desktop widths.

### R12 — Approved dependencies only; no secret or data-model changes

- Trigger: implementation of this work item.
- Preconditions: human-approved spec.
- Actor/system: implementer; package.json; repository.
- Expected response: may add **lucide-react**; may add **recharts** only because Overview charts require it. No other new runtime dependencies. No schema/auth/money-math changes. No secrets or personal financial data committed.
- State change: package.json / lockfile only for approved deps.
- Visible/resulting evidence: dependency diff limited to approved packages; Prisma schema unchanged.
- Failure behavior: if charts can be done without recharts, recharts must not be added; if recharts is added, it must be used for the line and/or donut (and bars if not CSS).
- Acceptance evidence: `package.json` review; `git diff` shows no `.env` secrets; schema files untouched.

### R13 — Accessibility and financial privacy posture preserved

- Trigger: interaction with redesigned shell and Overview.
- Preconditions: authenticated session for financial pages.
- Actor/system: owner; UI.
- Expected response: icon-only controls have accessible names; charts have text titles/labels (and sensible empty states); financial pages remain behind existing auth; no financial amounts logged to the client console as debug dumps in production code paths introduced by this work.
- State change: none.
- Visible/resulting evidence: login still required; a11y names on nav icons.
- Failure behavior: N/A.
- Acceptance evidence: protected routes still redirect when logged out; spot-check `aria-label` on sidebar icons.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Match Revenue Analytics reference photo (shell, cards, coral accent) | R1, R3, R11 |
| Narrow left outline-icon sidebar + avatar/sign-out | R2 |
| Overview analytics composition (KPIs, cashflow, category, donut, schedule, bars) | R4, R5, R6, R7, R8, R9 |
| Luther domain mapping (not fake e-commerce KPIs) | R4–R9 |
| Default CRC / show ₡; fix dollar misuse | R10 |
| Lucide outline icons ("use ChatGPT for icons" → lucide-react) | R2, R12 |
| recharts only if charts needed | R5, R7, R9, R12 |
| Responsive desktop sidebar + mobile bottom nav | R2, R11 |
| No business-rule / schema / auth changes | R12, R13 |
| Consistent visual language on other pages | R3 |

## Assumptions

- Existing query modules (`getOverview`, expenses/categories, projects) are sufficient; small read-only aggregation helpers for category totals, cashflow series, and prior-month MoM are allowed without schema changes.
- Default reporting currency remains CRC as already configured in settings/seed; this work does not change the settings data model.
- "Last updated / refresh" may be implemented as a client navigation refresh or `router.refresh()` of the current Overview URL; no backend "last computed at" timestamp is required.
- The reference photo's fake meetings / Google Meet rows map only to H1/H2 schedule semantics (R8).
- Horizontal bars map to **projects funded %** (R9), not category plan vs actual (plan remains on the Plan page).

## Open questions

- None that block specification. Owner provided the photo and directed redesign of the dashboard and whole UI first; Excel workbook validation remains a separate concern outside this work item.
