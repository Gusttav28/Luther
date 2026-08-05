# Tasks: Mobile Projects Layout, Add Sheet, and Details Expand

## Implementation checklist

- [ ] T1 — Add project sheet + sheet form variant
  - Files: `components/add-project-sheet.tsx`; `app/(app)/projects/project-forms.tsx`
  - Requirements: R6, R7
  - Preconditions: human-approved spec; branch `feature/mobile-projects-layout`
  - Expected evidence: Bottom sheet with backdrop/handle/title/close; create fields; success closes; errors stay; no new deps

- [ ] T2 — Mobile Projects layout + Details expand + Add trigger
  - Files: `app/(app)/projects/page.tsx`; `components/projects/mobile-projects.tsx`; `project-forms.tsx` (mobile card chrome); sheet wiring
  - Requirements: R1, R2, R3, R4, R5
  - Preconditions: T1 sheet usable
  - Expected evidence: Unified summary; funding progress list; All projects with + Add project opening sheet; Details/Hide details; inline form hidden below `md`; desktop unchanged; reorder/edit/complete/delete still work

- [ ] T3 — Handoff evidence
  - Files: `progress/current.md`
  - Requirements: R1–R7
  - Preconditions: T1–T2 complete
  - Expected evidence: Progress log + `IMPLEMENTED`

## Verification

- [ ] TV1 — Manual ~375px Projects
  - Covers: R1–R6
  - Expected result: Layout matches reference IA; + Add project opens sheet; Details expands fields; mutations work

- [ ] TV2 — Manual desktop Projects + deps
  - Covers: R1, R7
  - Expected result: Inline Add form + two KPI cards + Recharts chart remain; `package.json` deps unchanged

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R6, R7 |
| T2 | R1, R2, R3, R4, R5 |
| T3 | R1–R7 |
| TV1 | R1–R6 |
| TV2 | R1, R7 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
