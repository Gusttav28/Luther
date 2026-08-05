# Tasks: Mobile Income Layout and Add Sheet

## Implementation checklist

- [ ] T1 — Add income sheet + sheet form variant
  - Files: `components/add-income-sheet.tsx` (or income-local equivalent); `app/(app)/income/income-forms.tsx`
  - Requirements: R2, R3, R6
  - Preconditions: human-approved spec; branch `feature/mobile-income-layout`
  - Expected evidence: Bottom sheet with backdrop/handle/title/close; segmented H1/H2; amount/currency/label/planned; create action on submit; success closes; errors stay; no new deps

- [ ] T2 — Mobile Income layout + + FAB
  - Files: `app/(app)/income/page.tsx`; optional `components/income/mobile-income.tsx`; sheet/FAB wiring
  - Requirements: R1, R4, R5
  - Preconditions: T1 sheet usable with year/month
  - Expected evidence: Mobile shows summary strip + half-month schedule + circular month controls; inline add/donut hidden below `md`; + FAB opens sheet; desktop unchanged; edit/delete still work

- [ ] T3 — Handoff evidence
  - Files: `progress/current.md`
  - Requirements: R1–R6
  - Preconditions: T1–T2 complete
  - Expected evidence: Progress log + `IMPLEMENTED`

## Verification

- [ ] TV1 — Manual ~375px Income
  - Covers: R1, R2, R3, R4, R5
  - Expected result: Layout matches reference IA; + opens sheet; add succeeds; Current/empty states correct

- [ ] TV2 — Manual desktop Income
  - Covers: R1, R6
  - Expected result: Inline add + donut + totals remain; no FAB; `package.json` deps unchanged

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R2, R3, R6 |
| T2 | R1, R4, R5 |
| T3 | R1–R6 |
| TV1 | R1–R5 |
| TV2 | R1, R6 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
