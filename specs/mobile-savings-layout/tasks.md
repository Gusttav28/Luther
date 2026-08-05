# Tasks: Mobile Lifetime Savings Layout and Record Sheet

## Implementation checklist

- [ ] T1 — Record sheet + sheet form variant
  - Files: `components/add-savings-sheet.tsx` (or savings-local); `app/(app)/savings/savings-forms.tsx`
  - Requirements: R5, R6
  - Preconditions: human-approved spec; branch `feature/mobile-savings-layout`
  - Expected evidence: Bottom sheet with backdrop/handle/title/close; date/amount/currency/note; create action; success closes; errors stay; no new deps

- [ ] T2 — Mobile Savings layout + History + Record trigger
  - Files: `app/(app)/savings/page.tsx`; `components/savings/mobile-savings.tsx`; sheet wiring
  - Requirements: R1, R2, R3, R4
  - Preconditions: T1 sheet usable with defaultDate
  - Expected evidence: Unified summary; stacked charts; History with + Record opening sheet; inline form hidden below `md`; desktop unchanged; edit/delete still work

- [ ] T3 — Handoff evidence
  - Files: `progress/current.md`
  - Requirements: R1–R6
  - Preconditions: T1–T2 complete
  - Expected evidence: Progress log + `IMPLEMENTED`

## Verification

- [ ] TV1 — Manual ~375px Savings
  - Covers: R1–R5
  - Expected result: Layout matches reference IA; + Record opens sheet; record succeeds; history actions work

- [ ] TV2 — Manual desktop Savings + deps
  - Covers: R1, R6
  - Expected result: Inline manual form + four KPI cards remain; `package.json` deps unchanged

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R5, R6 |
| T2 | R1, R2, R3, R4 |
| T3 | R1–R6 |
| TV1 | R1–R5 |
| TV2 | R1, R6 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
