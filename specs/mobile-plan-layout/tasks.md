# Tasks: Mobile Category Plan Layout

## Implementation checklist

- [ ] T1 — Mobile Plan shell + year controls + page split
  - Files: `app/(app)/plan/page.tsx`; `components/plan/mobile-plan.tsx`
  - Requirements: R1, R2, R7
  - Preconditions: human-approved spec; branch `feature/mobile-plan-layout`
  - Expected evidence: `md:hidden` mobile stack and `hidden md:block` desktop; circular year nav updates `?year=`

- [ ] T2 — Planned vs actual Trend / Allocation toggle
  - Files: `components/plan/mobile-plan.tsx`; optional `components/charts/bar-chart.tsx` compact/embedded
  - Requirements: R3
  - Preconditions: T1 receives planBars + allocations
  - Expected evidence: Segmented Trend/Allocation; values match desktop charts for the same year; empty states OK

- [ ] T3 — Monthly plan Grid + Monthly views + category add
  - Files: `components/plan/mobile-plan.tsx`; optional `mobile-monthly-list.tsx`; `plan-forms.tsx` as needed for compact chrome
  - Requirements: R4, R5, R6
  - Preconditions: matrix + PlanCellInput available
  - Expected evidence: Grid scrolls inside card and saves cells; Monthly month picker + rows + month total; add category works on mobile

- [ ] T4 — Handoff evidence
  - Files: `progress/current.md`
  - Requirements: R1–R7
  - Preconditions: T1–T3 complete
  - Expected evidence: Progress log + `IMPLEMENTED`

## Verification

- [ ] TV1 — Manual ~375px Plan
  - Covers: R2–R6
  - Expected result: Year nav, both chart modes, Grid edit, Monthly edit/total, add category

- [ ] TV2 — Manual desktop Plan + deps
  - Covers: R1, R7
  - Expected result: Desktop layout unchanged; `package.json` deps unchanged

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R2, R7 |
| T2 | R3 |
| T3 | R4, R5, R6 |
| T4 | R1–R7 |
| TV1 | R2–R6 |
| TV2 | R1, R7 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
