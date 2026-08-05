# Tasks: Mobile Pill Navigation Bar

## Implementation checklist

- [ ] T1 — Redefine mobile primary vs secondary destinations
  - Files: `components/nav.tsx` (optional tiny helper in `components/icons.ts` only if needed)
  - Requirements: R1, R2
  - Preconditions: human-approved spec; on branch `feature/mobile-pill-nav`
  - Expected evidence: Primary set is Overview `/`, Expenses `/expenses`, Income `/income`; secondary More list is Plan, Savings, Balance, Projects, Settings; `SideNav` still renders full `NAV_LINKS`

- [ ] T2 — Implement floating dark pill chrome and active white chip
  - Files: `components/nav.tsx`
  - Requirements: R3, R4
  - Preconditions: T1 destination sets decided
  - Expected evidence: Mobile bar is a centered floating `rounded-full` dark stadium with soft shadow; active primary shows white chip (icon + label); inactive primaries and closed More are light icons; visual structure aligns with `specs/mobile-pill-nav/reference-pill-bar.png`; dark mode remains readable

- [ ] T3 — Wire More (⋯) menu for secondary routes
  - Files: `components/nav.tsx`
  - Requirements: R2, R4, R6
  - Preconditions: T1 secondary list available
  - Expected evidence: Three-dots control toggles menu; links navigate and close menu; More emphasized when a secondary route is active or menu is open; `aria-expanded` / `aria-controls` present; accessible names on controls

- [ ] T4 — Ensure content clearance; leave desktop shell unchanged
  - Files: `app/(app)/layout.tsx`, `components/nav.tsx`
  - Requirements: R5
  - Preconditions: T2 positioning known
  - Expected evidence: Mobile main padding clears the floating bar (including safe-area if applied); no full-bleed border strip; at `md+`, no floating bar; sidebar/header/sign-out unchanged

- [ ] T5 — Handoff evidence
  - Files: `progress/current.md`
  - Requirements: R1–R6
  - Preconditions: T1–T4 complete
  - Expected evidence: Progress notes list files changed, manual checks run, and `IMPLEMENTED` handoff for Reviewer

## Verification

- [ ] TV1 — Manual mobile (~375px): primary destinations
  - Covers: R1, R3, R4
  - Expected result: Bar shows Overview, Expenses, Income + More; active white chip on each primary route; matches reference structure

- [ ] TV2 — Manual mobile: More menu
  - Covers: R2, R4, R6
  - Expected result: Plan, Savings, Balance, Projects, Settings reachable; menu closes after navigation; More emphasized on secondary routes; keyboard focus/names OK

- [ ] TV3 — Manual desktop (`md+`)
  - Covers: R5
  - Expected result: Floating pill absent; existing icon sidebar intact

- [ ] TV4 — Content clearance + no new deps
  - Covers: R5, R6
  - Expected result: Tall page content scrolls clear of the bar; `package.json` unchanged for dependencies; no financial data added to nav

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R2 |
| T2 | R3, R4 |
| T3 | R2, R4, R6 |
| T4 | R5 |
| T5 | R1–R6 |
| TV1 | R1, R3, R4 |
| TV2 | R2, R4, R6 |
| TV3 | R5 |
| TV4 | R5, R6 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
