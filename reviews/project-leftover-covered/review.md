# Review: Project leftover covered amount

- Work item: `project-leftover-covered`
- Branch: `cursor/project-leftover-covered-ef43`
- Approved spec: `specs/project-leftover-covered/` version 2026-09-21 (owner **GO** 2026-09-21 — leftover-covered display locked)
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED`
- Review start: 2026-09-21
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/_template/review.md`
- `specs/project-leftover-covered/{requirements,design,tasks}.md` (complete, version 2026-09-21)
- `progress/current.md`
- Diff vs `origin/main` (`git diff origin/main...HEAD --stat` / full diff)
- Authorized implementation files:
  - `lib/project-covered.ts` (new)
  - `lib/queries/projects.ts`
  - `lib/projections.ts` (comment only)
  - `app/(app)/projects/project-forms.tsx`
  - `components/projects/mobile-projects.tsx`
  - `components/charts/project-progress-chart.tsx`
  - `tests/unit/project-covered.test.ts` (new)
  - `vitest.waterfall.config.ts`
  - `progress/current.md`
- Consumers of view fields (unchanged UI plumbing; now leftover-backed):
  - `app/(app)/projects/page.tsx` (`requireUserId` + `getProjectsView`)
  - `lib/queries/overview-dashboard.ts` (Overview `getProjectsView`)
  - `components/overview/projects-progress.tsx` (`fundedPercent` bars)
- Out of scope / TV4 confirmation (unchanged vs `origin/main`):
  - `package.json` / `package-lock.json` (empty diff)
  - `prisma/schema.prisma` (empty diff)
  - `lib/waterfall.ts` (leftover formula not rewritten)
  - `lib/queries/waterfall-scope.ts` (`ProjectContribution` materialize still writes; unused for display)

Implementation commits vs `main`: `971e199` (coverage swap), `3c8dc42` (tests + no-DB suite include). Spec package is on the same branch.

Reviewer did not implement this work and did not edit application code or tests.

## Commands run

| Command | Result |
| --- | --- |
| `git diff origin/main...HEAD --stat` | PASS for scope. 12 files: authorized implementation + spec package + `progress/current.md`. No `package.json`, Prisma schema, leftover-formula, or contribution-table deletion. |
| `git diff origin/main...HEAD -- package.json package-lock.json prisma/schema.prisma` | PASS; empty (0 bytes). |
| `npx vitest run tests/unit/project-covered.test.ts tests/unit/waterfall.test.ts tests/unit/projections.test.ts --config vitest.waterfall.config.ts` (TV1) | PASS; 3 files, **19 passed**. |
| Grep: `projectContribution.groupBy` / contribution sums feeding `savedMinor` | PASS; no `groupBy` remains in `lib/queries/projects.ts`. Only materialize upsert + delete-on-project-remove remain (out of scope). |
| Secrets scan of `git diff origin/main...HEAD` | PASS; matches are spec/progress prose about “no secrets”, not credentials. |

TV2–TV3 were not run (owner/browser on a live household). Reviewer did not invent browser evidence.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Headline covered amount is leftover project take | PASS (code + TV1) | `getProjectsView` dropped the `ProjectContribution` `groupBy`. `savedMinor` is `leftoverProjectCovered(...).coveredMinor` from leftover take (`projects.ts` 122–149). Priority take is `waterfallFromScope(scope, allocation).projectTakeMinor` (`leftoverTakeReporting`, 43–50). Non-priority / completed take is `0`. Missing waterfall → `null`; `MissingRateError` on reporting→project convert → `null` (`takeInProjectCurrency` 59–65), not a coerced 0. TV1 screenshot lock: leftover after savings `483_450`, 50% allocation → covered `241_725` of `6_000_000` (₡2,417.25 of ₡60,000), not a lifetime lump. Mobile still renders `savedMinor` of cost (`project-forms.tsx` 340–341); desktop label is **Covered:** (531). |
| R2 — Percentage is covered ÷ cost | PASS (code + TV1) | Helper: `min(100, round(take / cost × 100))` (`project-covered.ts` 37). Cost ≤ 0 or null take → `fundedPercent` null (UI “—”). TV1: 241725 / 6000000 → **4%**; leftover-zero → **0%**; take 12500 / cost 10000 → **100%** cap. Card percent, bar width, Funding progress list (`mobile-projects.tsx` 68–82), desktop chart (`project-progress-chart.tsx` 10–12), and Overview `ProjectsProgress` all read `fundedPercent` from this view. |
| R3 — Covered amount moves when leftover moves | PASS (code + TV1 helper; TV3 not run live) | Covered is computed from the live month waterfall (`getScopeAmounts` + `waterfallFromScope`), same leftover → 70% savings → allocation % path as Savings. Helper test drives `computeWaterfall` then `leftoverProjectCovered`: leftover 60_000 → take 9_000 / 15%; leftover 0 (Main = Planning) → covered 0 / 0%. `lib/waterfall.ts` is not in the diff; TV1 waterfall suite still passes (formula unchanged). Live charge/Main movement is TV3 (owner/browser). |
| R4 — Affordable now and projection use leftover take | PASS (code + TV1) | `affordableNow` is `take >= cost` from the helper (`project-covered.ts` 38; wired at `projects.ts` 152). TV1: screenshot take < cost → not affordable; take 12_500 ≥ cost 10_000 → affordable. Projection input `savedMinor` is leftover take in reporting currency (`projects.ts` 104–109), not contribution totals. Simulator itself is comment-only (`projections.ts` 4–5, 16). Non-priority / completed take is 0; card still shows “Not priority — funding paused” / “Completed” (`project-forms.tsx` 301–304). |
| R5 — Auth, privacy, dependencies | PASS (code / TV4) | Projects page still `requireUserId` (`page.tsx` 39). `getProjectsView(userId)` keeps `prisma.project.findMany({ where: { userId } })` and `getScopeAmounts(userId, …)` / `getSettings(userId)` / optional `materializeMonthWaterfall(userId, …)`. `package.json` and `prisma/schema.prisma` unchanged vs `origin/main`. No secrets, `.env`, or financial dumps in the diff. No new npm packages. No new Prisma models. |

## Design verdicts

- Preferred helper is implemented: `leftoverProjectCovered({ costMinor, takeMinor })` returns capped `coveredMinor`, percent, and `affordableNow`. No Prisma in the helper.
- `getProjectsView` matches the locked flow: leftover after Planning → 70% savings → allocation % of post-lifetime → convert reporting → project currency → helper. Contribution `groupBy` is gone.
- Invariant: for the active priority project, `expectedTakeMinor` is reporting-currency leftover take and `savedMinor` is that take in project currency, capped at cost. They diverge on FX miss (`savedMinor` null) or take > cost (display cap).
- Projection: `projectAffordability([{ costMinor: cost in reporting, savedMinor: take in reporting }], perHalf, nextPeriod)` — only the priority project, as specified. Multi-project simultaneous funding remains out of scope.
- `materializeMonthWaterfall` was not rewritten; `ProjectContribution` rows may still be written and are unused for these fields.
- Copy: desktop “Covered:” / “% covered”; Funding captions say leftover take, not “Saved percentage”.
- `vitest.waterfall.config.ts` includes `project-covered.test.ts` and `projections.test.ts`.
- No leftover-formula rewrite, no contribution-table deletion, no new deps/schema.
- Extra files vs the design list: none. Spec package + progress are expected.

## Task/checkpoint verdicts

- T1: PASS. `lib/project-covered.ts` + `tests/unit/project-covered.test.ts`. Screenshot lock 241_725 / 4% / not affordable; take 0 → 0 / 0%; take ≥ cost → capped + 100% + affordable; null take → nulls.
- T2: PASS. No contribution `groupBy` feeding display/projection. Priority take from `waterfallFromScope`. Non-priority / completed → 0. FX miss → null. Projection `savedMinor` is leftover take. `projections.ts` comment only.
- T3: PASS. Desktop “Covered:” (`project-forms.tsx` 531) and “% covered” (566). Mobile and desktop Funding captions: “Covered percentage by leftover take”.
- T4: PASS. `progress/current.md` records `IMPLEMENTED` for `project-leftover-covered`.
- TV1: PASS. Independent rerun: 3 files, 19 passed.
- TV2: NOT RUN — owner/browser screenshot lock on a live household. Reviewer did not invent browser evidence.
- TV3: NOT RUN — owner/browser leftover movement. Same.
- TV4: PASS by diff review (no new packages, no schema, no secrets, queries stay `userId`-scoped).

## Findings

No implementation defects against the approved spec. Remaining gaps are the spec’s owner-manual UI checks, not code divergence.

### INFO — TV2 not executed here (owner/browser screenshot lock)

- Requirement/design/task: R1, R2, R4 / TV2
- File: N/A (environment)
- Lines: N/A
- Observed: This environment has no owner session or running household app. Reviewer did not invent browser evidence.
- Expected: MSI Monitor shows leftover take of ₡60,000 and ~4%, not ₡109,647.15 / 100% / Affordable now.
- Evidence: TV1 helper lock is ₡2,417.25 of ₡60,000 → 4% and not affordable. Code wires that helper into `savedMinor` / `fundedPercent` / `affordableNow`. `progress/current.md` already recorded TV2 as owner/browser.
- Required correction: None for the implementer. Owner should confirm TV2 on a live session.

### INFO — TV3 not executed here (owner/browser leftover movement)

- Requirement/design/task: R3 / TV3
- File: N/A (environment)
- Lines: N/A
- Observed: No live Main / Planning / charge session in this review.
- Expected: Charge or leftover change moves covered amount the same way Savings take moves.
- Evidence: Covered is recomputed from the live waterfall on each `getProjectsView` read. Helper test: leftover 0 → covered 0 / 0%; leftover change follows `computeWaterfall.projectTakeMinor`. Waterfall formula files were not changed.
- Required correction: None for the implementer. Owner should confirm TV3 on a live session.

## Cleanup signal

- Durable spec package: `specs/project-leftover-covered/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/project-leftover-covered/review.md`
- Scratch context to reset: none. No application code or tests were edited by the Reviewer.

APPROVED -> reviews/project-leftover-covered/review.md
