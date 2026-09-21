# Design: Project leftover covered amount

- Governing requirements: R1, R2, R3, R4, R5

## Goals

- Replace lifetime contribution funding with leftover project take on every Projects/Overview progress surface (R1, R2, R3).
- Drive affordability from that take (R4).
- No schema, no new packages, keep queries user-scoped (R5).

## Current system observations

- `computeWaterfall` on `main`: leftover = Main − remaining Planning; 70% savings; `projectTakeMinor` = allocation % of post-lifetime.
- `getProjectsView` already computes `expectedTakeMinor` = `waterfallFromScope(..., allocationPercent).projectTakeMinor` for the priority project.
- The same function still `groupBy`s `ProjectContribution` and sets `savedMinor` / `fundedPercent` / `affordableNow` from that lifetime sum. That produced ₡109,647.15 / ₡60,000 = 100%.
- `projectAffordability` is a pure simulator. It is fine; callers must pass leftover take as `savedMinor`, not contribution totals.
- UI reads `savedMinor` and `fundedPercent` in `ProjectCard` (mobile “X of Y” + %), `MobileProjects` funding list, `ProjectsProgress` (Overview), and `ProjectProgressChart`.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `lib/project-covered.ts` | New pure helper: covered display + percent + affordableNow from take and cost. | R1, R2, R3, R4 |
| `lib/queries/projects.ts` | Stop using contribution `groupBy` for display/projection. Set `savedMinor` / `fundedPercent` / `affordableNow` from leftover take (convert reporting → project currency). Projection input `savedMinor` = take in reporting currency. | R1, R2, R3, R4, R5 |
| `lib/projections.ts` | Comment only: past funding for the Projects screen is leftover take, not contribution rows. | R4 |
| `app/(app)/projects/project-forms.tsx` | Desktop “Saved:” label → “Covered:”. | R1 |
| `components/projects/mobile-projects.tsx` | Funding-progress caption: covered % from leftover, not lifetime saved. | R2 |
| `components/charts/project-progress-chart.tsx` | Same caption on desktop. | R2 |
| `tests/unit/project-covered.test.ts` | Helper tests including screenshot numbers and leftover-zero. | R1, R2, R3, R4 |
| `vitest.waterfall.config.ts` | Include the leftover-covered helper (and projections) in the no-DB suite. | R1–R4 |
| `progress/current.md` | Implementation log. | — |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `lib/project-covered.ts` | Pure leftover-covered display math (no Prisma). | R1–R4 |
| `tests/unit/project-covered.test.ts` | Unit coverage. | R1–R4 |
| `specs/project-leftover-covered/*` | This package. | — |

## Data and control flow

```
Main cash, remaining Planning
        → leftoverAfterPlannedBills
        → 70% savings take
        → postLifetime (Left after savings)
        → projectTake = percentOf(postLifetime, allocation 1–70)
        →
   priority + active: coveredTake = projectTake
   else:              coveredTake = 0
        → convert reporting → project currency (MissingRateError → null)
        → leftoverProjectCovered({ costMinor, takeMinor })
        → savedMinor (capped at cost), fundedPercent, affordableNow
        → ProjectCard / Funding progress / Overview bars
```

Invariant: for the active priority project, `expectedTakeMinor` (reporting) and `savedMinor` (project currency) are the same leftover take. They diverge only when currencies differ (converted) or FX is missing (`savedMinor` null).

Projection: `projectAffordability([{ costMinor: cost in reporting, savedMinor: take in reporting }], perHalf, nextPeriod)`.

Do not change `materializeMonthWaterfall`. Contribution rows may still be written; they are unused for these fields.

## Validation and failure handling

- `waterfallFromScope` null (missing Main or Planning FX) → `savedMinor` / `fundedPercent` / `expectedTakeMinor` null; no 0 coerced from failed conversion.
- Cost ≤ 0 → percent null; covered still shows take when take is known.
- Take > cost → display covered = cost; percent = 100; affordable now.
- Floor percent takes stay in `percentOf` / `computeWaterfall` (unchanged).

## Security, privacy, accessibility, and performance

- `getProjectsView` remains `userId`-scoped via existing Prisma `where: { userId }`.
- Page still uses `requireUserId`.
- No secrets. No new env. Dropping the contribution `groupBy` reduces a query.
- Progress bars keep existing text/% semantics (covered of cost).

## Dependencies

No new npm packages. No Prisma schema changes.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep lifetime as “saved” and leftover as “expected” only | Rejected | Owner sees 100% funded; they asked to show only leftover coverage. |
| Covered = full post-lifetime (30%) not allocation % | Rejected | Expected this month already uses allocation %; owner said same behavior as the calculated save/project take. |
| Delete contribution materialize | Out of scope | History rows can stay; they must not drive the headline. |
| Rename `savedMinor` on the view | Keep name | Minimize UI plumbing; document it as leftover covered. |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `leftoverProjectCovered` + `getProjectsView` sets `savedMinor` from `projectTakeMinor` |
| R2 | Helper percent; UI already renders `fundedPercent` |
| R3 | Same live waterfall as Savings; helper leftover-zero case |
| R4 | `affordableNow` and projection inputs from take |
| R5 | No new deps/schema; existing `userId` loaders |
