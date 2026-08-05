# Current implementation progress

- Work item: mobile-projects-layout (`specs/mobile-projects-layout/`)
- Branch: `feature/mobile-projects-layout`
- Spec package: 2026-08-04, human-approved (owner **GO** on 2026-08-04)
- Implementer session: 2026-08-04
- Handoff: **IMPLEMENTED**

## Files read

- `AGENTS.md`, `.agents/implementer.md`
- `specs/mobile-projects-layout/{requirements,design,tasks}.md` (complete)
- Existing projects page, project-forms, add-income/savings sheet patterns

## Files changed

### T1 — Add project sheet + sheet form variant

- `components/add-project-sheet.tsx` — bottom sheet (backdrop, handle, title, X)
- `app/(app)/projects/project-forms.tsx` — `AddProjectForm` `variant="sheet"` + `onSuccess`

### T2 — Mobile Projects layout + Details expand

- `components/projects/mobile-projects.tsx` — summary, funding progress list, All projects + Add trigger
- `app/(app)/projects/project-forms.tsx` — `ProjectCard` `variant="mobile"` with Details/Hide details
- `app/(app)/projects/page.tsx` — `md:hidden` mobile / `hidden md:block` desktop; inline Add hidden on mobile

### T3 — Handoff

- `progress/current.md` — this file

## Verification

- TV1–TV2: owner manual (~375px Add sheet + Details expand; desktop unchanged; no new deps)
- `package.json` dependencies unchanged

## Notes for Reviewer

- Funding progress on mobile is a percent bar list (reference), not Recharts
- Edit still swaps the card into the existing inline edit form when expanded
- Project math / waterfall unchanged; presentation-only mobile redesign
