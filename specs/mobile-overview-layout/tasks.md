# Tasks: Mobile Overview Layout

## Implementation checklist

- [ ] T1 — Split Overview page into mobile vs desktop presentations
  - Files: `app/(app)/page.tsx`; `components/overview/mobile-overview.tsx` (new)
  - Requirements: R1, R8
  - Preconditions: human-approved spec; on branch `feature/mobile-overview-layout`
  - Expected evidence: Same dashboard data feeds both; `md:hidden` mobile stack and `hidden md:block` (or equivalent) desktop layout; desktop structure matches pre-change Overview

- [ ] T2 — Mobile circular month picker + compact refresh
  - Files: `components/month-picker.tsx`; `components/overview/overview-refresh.tsx`; wired from mobile overview header
  - Requirements: R2
  - Preconditions: T1 shell exists
  - Expected evidence: Mobile shows circular prev/label/next and circular refresh; rematerialize behavior unchanged; accessible names present; desktop controls remain usable

- [ ] T3 — Unified mobile KPI card
  - Files: `components/overview/kpi-cards.tsx` and/or mobile-specific KPI component used by `mobile-overview.tsx`
  - Requirements: R3
  - Preconditions: figures + mom available from page
  - Expected evidence: 2×2 Earned/Spent/Saved/Remaining with MoM; Lifetime balance footer row; values match desktop for same month

- [ ] T4 — Mobile Cashflow + Breakdown tabs + schedule + projects stack
  - Files: `components/overview/breakdown-tabs.tsx` (new); `cashflow-chart.tsx` / `spent-by-category.tsx` / `composition-donut.tsx` / `half-month-schedule.tsx` / `projects-progress.tsx` as needed for chrome reuse; `mobile-overview.tsx`
  - Requirements: R4, R5, R6, R7
  - Preconditions: T1 data wiring
  - Expected evidence: Cashflow card; Breakdown Category/Composition toggle with matching totals; H1/H2 side-by-side with Current badge; Projects funded + View all; empty states work

- [ ] T5 — Handoff evidence
  - Files: `progress/current.md`
  - Requirements: R1–R8
  - Preconditions: T1–T4 complete
  - Expected evidence: Progress log lists files, notes no new deps, records `IMPLEMENTED`

## Verification

- [ ] TV1 — Manual ~375px Overview walkthrough
  - Covers: R2–R7
  - Expected result: Header controls, KPI card, cashflow, breakdown tabs, half-month, projects match mock IA; month change + refresh work

- [ ] TV2 — Manual desktop ≥768px Overview
  - Covers: R1
  - Expected result: Prior desktop layout still present (5 KPI cells / multi-column grids)

- [ ] TV3 — Value parity spot-check
  - Covers: R3, R5, R6, R7, R8
  - Expected result: Same month’s KPI, category total, composition, H1/H2, project % match across mobile and desktop; `package.json` deps unchanged

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R8 |
| T2 | R2 |
| T3 | R3 |
| T4 | R4, R5, R6, R7 |
| T5 | R1–R8 |
| TV1 | R2–R7 |
| TV2 | R1 |
| TV3 | R3, R5, R6, R7, R8 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
