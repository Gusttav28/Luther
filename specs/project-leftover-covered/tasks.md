# Tasks: Project leftover covered amount

## Implementation checklist

- [ ] T1 — Pure leftover-covered helper
  - Files: `lib/project-covered.ts`, `tests/unit/project-covered.test.ts`
  - Requirements: R1, R2, R3, R4
  - Preconditions: Spec approved.
  - Expected evidence: `leftoverProjectCovered({ costMinor: 6_000_000, takeMinor: 241_725 })` → covered 241_725, percent 4, not affordable. Take 0 → 0 / 0%. Take ≥ cost → covered capped at cost, 100%, affordable. Null take → nulls.

- [ ] T2 — `getProjectsView` uses leftover take
  - Files: `lib/queries/projects.ts`, `lib/projections.ts` (comment)
  - Requirements: R1, R2, R3, R4, R5
  - Preconditions: T1.
  - Expected evidence: No contribution `groupBy` feeding `savedMinor` / `fundedPercent` / projection. Priority take from `waterfallFromScope`. Non-priority / completed → take 0. FX miss → null.

- [ ] T3 — Copy: covered, not lifetime saved
  - Files: `app/(app)/projects/project-forms.tsx`, `components/projects/mobile-projects.tsx`, `components/charts/project-progress-chart.tsx`
  - Requirements: R1, R2
  - Preconditions: T2.
  - Expected evidence: Desktop label “Covered”. Funding captions say leftover / covered, not “Saved percentage”.

- [ ] T4 — Implementation log
  - Files: `progress/current.md`
  - Requirements: all
  - Expected evidence: `IMPLEMENTED` handoff.

## Verification

- [ ] TV1 — `npx vitest run tests/unit/project-covered.test.ts tests/unit/waterfall.test.ts tests/unit/projections.test.ts --config vitest.waterfall.config.ts`
  - Covers: R1–R4 helper + leftover waterfall unchanged + projection simulator unchanged
  - Expected result: pass

- [ ] TV2 — Screenshot lock (owner / browser)
  - Covers: R1, R2, R4
  - Expected result: MSI Monitor shows leftover take of ₡60,000 and ~4%, not ₡109,647.15 / 100% / Affordable now

- [ ] TV3 — Leftover movement (owner / browser)
  - Covers: R3
  - Expected result: Charge or leftover change moves covered amount like Savings take

- [ ] TV4 — Diff hygiene
  - Covers: R5
  - Expected result: no new packages, no schema, no secrets, queries stay `userId`-scoped

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R2, R3, R4 |
| T2 | R1, R2, R3, R4, R5 |
| T3 | R1, R2 |
| T4 | R1–R5 |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No leftover-formula rewrite, no contribution-table deletion, no new deps.
- [ ] Required tests/checks are defined.
