# Design: Mobile Overview Layout

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8

## Goals

- Deliver a mobile-only Overview presentation matching the mock’s IA and card chrome (R1–R7).
- Reuse existing dashboard data and widgets’ semantics; avoid duplicate financial logic (R8).
- Leave desktop Overview structure intact (R1).

## Current system observations

- `app/(app)/page.tsx` — single layout: header + `KpiCards` (5 cells) + cashflow/category grid + composition / half-month / projects grid + `RatesNote`.
- Widgets: `components/overview/{kpi-cards,cashflow-chart,spent-by-category,composition-donut,half-month-schedule,projects-progress,overview-refresh}.tsx`.
- Month controls: `components/month-picker.tsx` (shared); refresh: `OverviewRefresh`.
- Data: `getOverviewDashboard` + `computeMomDeltas` — unchanged.
- Mock references under `specs/mobile-overview-layout/reference-overview-*.html`.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/page.tsx` | Branch mobile vs desktop presentation (`md:hidden` / `hidden md:block` or equivalent wrapper components). Wire same data props into both. | R1–R7 |
| `components/month-picker.tsx` | Optional `variant="pill" \| "default"` (or similar) for circular mobile controls; keep desktop default. | R2 |
| `components/overview/overview-refresh.tsx` | Optional compact circular icon-only variant for mobile header row. | R2 |
| `components/overview/kpi-cards.tsx` | Add mobile unified-card presentation **or** extract shared KPI bits and add `KpiCardsMobile`; desktop grid unchanged. | R3 |
| `components/overview/half-month-schedule.tsx` | Mobile side-by-side layout via responsive classes **or** small mobile wrapper; desktop list/card behavior preserved at `md+`. | R6 |
| `components/overview/projects-progress.tsx` | Minor responsive chrome if needed so mobile matches card density; semantics unchanged. | R7 |
| `components/overview/cashflow-chart.tsx` | Optional mobile density tweaks (padding/height); keep Recharts + same points. | R4 |
| `components/overview/spent-by-category.tsx` / `composition-donut.tsx` | Prefer reuse inside new Breakdown; avoid duplicating calc logic. May export inner views without outer card chrome. | R5 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `components/overview/mobile-overview.tsx` | Client or server composition of mobile Overview sections (header controls row, KPI card, cashflow, breakdown, schedule, projects). Preferred single entry used by `page.tsx` under `md:hidden`. | R1–R7 |
| `components/overview/breakdown-tabs.tsx` | Client Category / Composition segmented card for mobile Breakdown. | R5 |

(Exact filenames may vary slightly if implementer colocates; design requires these responsibilities.)

## Data and control flow

```
page.tsx (server)
  getOverviewDashboard + computeMomDeltas + settings
        │
        ├─► Desktop block (hidden on mobile): existing layout
        │
        └─► MobileOverview (visible below md)
              MonthPicker(variant) + OverviewRefresh(compact)
              KpiCards mobile unified card
              CashflowChart
              BreakdownTabs → SpentByCategory inner | CompositionDonut inner
              HalfMonthSchedule (side-by-side)
              ProjectsProgress
              RatesNote (optional shared)
```

- No new queries.
- Breakdown tab state: React `useState` in `breakdown-tabs.tsx` only.
- Refresh: existing `rematerializeOverviewAction`.

### Visual notes (from mock)

- Cards: ~20px radius, light border, white/surface-card background (map to existing `card` / tokens; strengthen radius on mobile if needed via utility classes).
- KPI micro-labels: uppercase, tracked, muted.
- Lifetime row: border-top separator inside KPI card.
- Breakdown segmented control: muted track, white active chip.
- Do not reimplement bottom nav from the mock.

## Validation and failure handling

- Empty states: keep widget empty copy.
- Pending month navigation / refresh: disable or show spin as today.
- Tab toggle has no failure mode beyond empty child views.

## Security, privacy, accessibility, and performance

- Page remains behind `requireUserId` / app layout auth.
- Accessible names on circular icon buttons (prev/next/refresh).
- Breakdown tabs: `role="tablist"` / `tab` / `tabpanel` or equivalent button semantics with clear selected state.
- No new dependencies; no new font loading.
- Avoid shipping the 500KB standalone HTML into the client bundle (spec asset only).

## Dependencies

- **No new npm dependencies.** Recharts, Lucide, Tailwind only.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| One responsive stylesheet tweaking existing grid only | Rejected | Mock changes IA (unified KPI, tabbed Breakdown, circular controls) |
| Replace Recharts with mock SVG | Rejected | Extra risk; existing chart data already correct |
| Add Space Grotesk | Rejected | New dependency/font; out of scope |
| Change composition to earned-vs-spent only | Rejected | Would alter product semantics vs current Overview |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `page.tsx` dual presentation |
| R2 | MonthPicker + OverviewRefresh variants; mobile header in MobileOverview |
| R3 | KPI mobile unified card |
| R4 | CashflowChart in mobile stack |
| R5 | `breakdown-tabs.tsx` + existing category/composition |
| R6 | Half-month responsive/side-by-side |
| R7 | ProjectsProgress in mobile stack |
| R8 | No new deps; auth unchanged; specs HTML not bundled |
