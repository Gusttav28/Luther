# Tasks: Mobile Balance Layout

## Implementation checklist

- [ ] T1 — Mobile Balance shell + page split + summary
  - Files: `app/(app)/balance/page.tsx`; `components/balance/mobile-balance.tsx`
  - Requirements: R1, R2, R5
  - Preconditions: human-approved spec; branch `feature/mobile-balance-layout`
  - Expected evidence: `md:hidden` mobile / `hidden md:block` desktop; unified summary with Edit → Settings; values match desktop

- [ ] T2 — Stacked charts + expandable period list
  - Files: `components/balance/mobile-balance.tsx`; `components/charts/line-chart.tsx` (embedded/compact)
  - Requirements: R3, R4
  - Preconditions: T1 receives series/chartRows
  - Expected evidence: Running balance + Income vs expenses cards; period expand shows Income/Expenses/Net; empty states OK

- [ ] T3 — Handoff evidence
  - Files: `progress/current.md`
  - Requirements: R1–R5
  - Preconditions: T1–T2 complete
  - Expected evidence: Progress log + `IMPLEMENTED`

## Verification

- [ ] TV1 — Manual ~375px Balance
  - Covers: R2–R4
  - Expected result: Summary, charts, expand/collapse periods; Edit opens Settings

- [ ] TV2 — Manual desktop Balance + deps
  - Covers: R1, R5
  - Expected result: Desktop layout unchanged; `package.json` deps unchanged

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R2, R5 |
| T2 | R3, R4 |
| T3 | R1–R5 |
| TV1 | R2–R4 |
| TV2 | R1, R5 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
