# Current implementation progress

- Work item: project-leftover-covered (`specs/project-leftover-covered/`)
- Branch: `cursor/project-leftover-covered-ef43`
- Spec package: 2026-09-21
- Human approval: owner **GO** 2026-09-21 (“Let’s work on this screen now”; leftover-covered display locked)
- Implementer session: 2026-09-21
- Handoff: **IMPLEMENTED**

## Outcome

Projects headline, Funding progress, Overview bars, and Affordable now use leftover project take (allocation % of leftover after the 70% savings take). Lifetime `ProjectContribution` sums are not the coverage number.

## Files read

- `AGENTS.md`, `.agents/implementer.md`
- `specs/project-leftover-covered/{requirements,design,tasks}.md`
- `lib/queries/projects.ts`, `lib/waterfall.ts`, `lib/queries/waterfall-scope.ts`, project cards / mobile / Overview progress

## Files changed

### T1 — Helper

- `lib/project-covered.ts` — `leftoverProjectCovered`
- `tests/unit/project-covered.test.ts` — screenshot lock (₡2,417.25 of ₡60,000 → 4%), leftover-zero, take > cost

### T2 — getProjectsView

- `lib/queries/projects.ts` — dropped contribution `groupBy`; `savedMinor` / `fundedPercent` / `affordableNow` from leftover take; projection input is leftover take
- `lib/projections.ts` — comment: savedMinor is leftover take

### T3 — Copy

- `app/(app)/projects/project-forms.tsx` — Covered label
- `components/projects/mobile-projects.tsx` — leftover-take caption
- `components/charts/project-progress-chart.tsx` — leftover-take caption

### T4 — this file

## Verification

- TV1: `npx vitest run tests/unit/project-covered.test.ts tests/unit/waterfall.test.ts tests/unit/projections.test.ts --config vitest.waterfall.config.ts` — **19 passed**. `project-covered` and `projections` added to that config include. Other files in the same config still fail to load without `DATABASE_URL` (pre-existing Prisma import); not required for this item.
- TV2–TV3: owner/browser on a live session (screenshot lock + leftover movement)
- TV4: no new deps; no schema; `userId` still on project/scope queries

## Notes for Reviewer

- `savedMinor` on the view is leftover covered (capped at cost), not lifetime contributions.
- Expected this month is still leftover take in reporting currency for the active priority project.
- Materialize may still write `ProjectContribution` rows; they are unused for these fields.
