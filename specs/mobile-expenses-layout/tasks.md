# Tasks: Mobile Expenses Layout and Add Sheet

## Implementation checklist

- [ ] T1 — Add expense sheet + shared open state
  - Files: `components/add-expense-sheet.tsx` (and optional provider); `app/(app)/expenses/expense-forms.tsx`; wire from Expenses page
  - Requirements: R2, R3, R6
  - Preconditions: human-approved spec; branch `feature/mobile-expenses-layout`
  - Expected evidence: Bottom sheet with backdrop/handle/title/close; sheet form submits via existing create action; success closes sheet; errors remain; no new deps

- [ ] T2 — External N control on mobile nav
  - Files: `components/nav.tsx`; provider/layout wiring as needed
  - Requirements: R4
  - Preconditions: T1 open API available
  - Expected evidence: **N** circle outside dark pill beside More; `aria-label` Add expense; opens sheet on `/expenses`; from another route navigates to Expenses then opens

- [ ] T3 — Mobile Expenses page layout (hide inline add)
  - Files: `app/(app)/expenses/page.tsx`; `expenses-month-frame.tsx`; `expenses-table.tsx`; `expense-forms.tsx` (row chrome if needed)
  - Requirements: R1, R5
  - Preconditions: T1 sheet mountable with categories/defaultDate
  - Expected evidence: Mobile list layout per reference; inline add hidden below `md`; desktop inline add + donut retained; filters/count/total/row actions still work

- [ ] T4 — Handoff evidence
  - Files: `progress/current.md`
  - Requirements: R1–R6
  - Preconditions: T1–T3 complete
  - Expected evidence: Progress log + `IMPLEMENTED`

## Verification

- [ ] TV1 — Manual ~375px Expenses
  - Covers: R1, R2, R3, R5
  - Expected result: Mobile chrome; sheet add works; filters/status/edit still work; no inline add card

- [ ] TV2 — Manual N control
  - Covers: R4
  - Expected result: N outside pill; opens sheet from Expenses and from Overview (after nav)

- [ ] TV3 — Desktop Expenses + deps
  - Covers: R1, R6
  - Expected result: Desktop inline add + donut unchanged; `package.json` deps unchanged

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R2, R3, R6 |
| T2 | R4 |
| T3 | R1, R5 |
| T4 | R1–R6 |
| TV1 | R1, R2, R3, R5 |
| TV2 | R4 |
| TV3 | R1, R6 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
