# Review: Fixed Sidebar and Complete Dark Theme

- Work item: `specs/fixed-sidebar-dark-theme/`
- Branch: `feature/fixed-sidebar-dark-theme`
- Approved spec: `specs/fixed-sidebar-dark-theme/{requirements,design,tasks}.md`, human-approved 2026-07-20
- Implementer progress: `progress/current.md`, handoff **IMPLEMENTED**
- Review start: 2026-07-20
- Final verdict: **CHANGES_REQUESTED**

## Files inspected

- `app/(app)/layout.tsx`
- `components/nav.tsx`
- `components/theme-toggle.tsx`
- `app/globals.css`
- `tailwind.config.ts`
- Shared chart components under `components/charts/`
- Overview chart and panel components under `components/overview/`
- Route pages/forms listed by the approved design
- `package.json`, current worktree diff, and the required spec/progress documents

## Commands run

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS — `tsc --noEmit` completed successfully |
| `npm run lint` | PASS — ESLint completed successfully |
| `npm run test` | PASS — 6 files, 58 tests passed |
| `npm run build` | PASS — compiled, generated static pages, and finalized traces |
| `npm run test:e2e` | BLOCKED — after 114 seconds the process was still running and had emitted only the npm/Playwright command header; no test discovery, server startup, browser, or route output appeared. The stalled process was stopped. |
| IDE diagnostics for edited shell/theme files | PASS — no linter errors reported |

No authenticated manual viewport check was possible after the Playwright runner stalled.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — fixed desktop sidebar and one content scroll owner | PASS (static) | `app/(app)/layout.tsx` uses `md:h-dvh md:overflow-hidden` on the shell, `h-dvh` on the sidebar, and `md:h-dvh md:overflow-y-auto` on `main`; the sidebar has no independent overflow. Runtime long-page evidence is unavailable because e2e stalled. |
| R2 — mobile nav and ordinary scrolling | PASS (static) / UNVERIFIED (runtime) | Desktop-only shell rules are under `md`; mobile header, fixed `BottomNav`, More disclosure, and `pb-24` clearance remain present. No 375px/tablet browser check was obtained. |
| R3 — complete dark surfaces and typography | **FAIL** | Several route/overview/shared controls rely on light-only hover and text classes without explicit dark equivalents. Examples include `components/category-picker.tsx:84` (`hover:bg-stone-200`), `components/overview/half-month-schedule.tsx:37`, `components/overview/projects-progress.tsx:20-38`, and `components/overview/spent-by-category.tsx:38,44,69,76-81`. The global dark selectors do not cover Tailwind hover variants, and there is no complete semantic fallback for every listed surface. |
| R4 — accessible controls and interaction states | **FAIL** | Raw action buttons in `components/category-manager.tsx:122-135` have no visible focus styling and only light-theme hover classes. Similar category-picker chips at `components/category-picker.tsx:77-85` have no focus-visible treatment. This does not meet the required keyboard focus/hover coverage for shared controls. |
| R5 — readable charts, legends, tooltips, and empty states | PASS (static) / UNVERIFIED (runtime) | Shared Recharts components use `--chart-*` tokens and themed tooltip/legend/axis props; empty states are present. Narrow viewport and actual tooltip rendering could not be exercised because Playwright stalled. |
| R6 — theme-only localStorage persistence | PASS (code review) | `components/theme-toggle.tsx` uses only `luther-theme`, accepts only `"dark"` as dark, falls back to light, and catches storage failures. No other storage writes were found. |
| R7 — responsive layout and no accidental horizontal overflow | PASS (static) / UNVERIFIED (runtime) | Main uses `min-w-0 overflow-x-hidden`; Plan uses local `overflow-x-auto`; charts use bounded `min-w-0` containers. Required 375px/tablet/desktop route checks were not obtained. |
| R8 — financial, privacy, auth, schema, and dependency boundaries | **FAIL to certify on current worktree** | The current branch worktree contains modified `prisma/schema.prisma`, `lib/money.ts`, financial query/action/validation files, tests, and an untracked migration, plus other prior-work files. These changes are identified as unrelated in `progress/current.md`, but they are present in the branch worktree and prevent a clean final-diff certification for this review. |

## Design verdicts

- Desktop shell design is structurally aligned with the approved single-scroll-owner approach.
- Theme persistence remains within the approved client-only boundary.
- Chart tokenization is substantially implemented.
- Complete interaction-state normalization is incomplete: shared controls still bypass `.btn-*`, `.field-*`, or equivalent focus/theme classes.
- The review surface is not isolated to the governed work item because the branch/worktree contains unrelated financial/schema changes.

## Task/checkpoint verdicts

- T1: **PASS static**, runtime scroll evidence missing.
- T2: **CHANGES REQUESTED** — navigation/theme controls are mostly themed, but category and action controls lack complete focus/hover coverage.
- T3: **CHANGES REQUESTED** — global dark selectors do not establish complete coverage for hover variants and route-level panels.
- T4: **PASS static**, runtime chart/tooltip evidence missing.
- T5: **CHANGES REQUESTED** — multiple overview/shared components retain light-only interaction/surface assumptions.
- T6: **BLOCKED** — Playwright stalled before test discovery and no authenticated manual viewport checks were available.
- T7: **CHANGES REQUESTED for review isolation** — current worktree contains unrelated schema, currency, money, query/action, migration, and test changes.
- TV1–TV4: **PASS**.
- TV5: **BLOCKED** with exact evidence recorded above.
- TV6–TV8: **BLOCKED/UNVERIFIED** — no browser viewport, storage-exception, keyboard, contrast, or tooltip checks completed.
- TV9: **FAIL to certify** on the current mixed worktree.

## Findings

### High — Complete dark interaction coverage is missing

- Requirement/design/task: R3, R4, T2, T3, T5
- Files: `components/category-manager.tsx`, `components/category-picker.tsx`, `components/overview/half-month-schedule.tsx`, `components/overview/projects-progress.tsx`, `components/overview/spent-by-category.tsx`
- Observed: Light-only hover classes remain, and category-manager action buttons have no focus-visible classes. The broad `.dark` selectors in `app/globals.css` do not cover variant selectors such as `hover:bg-stone-200`.
- Expected: Every shared control and visible state remains deliberately readable and visibly focused in both themes.
- Evidence: Static source inspection; no browser run was available.
- Required correction: Normalize these controls/panels through semantic shared classes or explicit dark variants, add visible focus-visible treatment, and verify keyboard/contrast behavior in both themes.

### High — Governed diff is contaminated by unrelated financial/schema changes

- Requirement/design/task: R8, T7, TV9
- Files: `prisma/schema.prisma`, `lib/money.ts`, `lib/queries/expenses.ts`, `app/(app)/expenses/actions.ts`, `lib/validation.ts`, migration directory, financial tests, and other prior-work files
- Observed: `git status` shows these files modified/untracked on `feature/fixed-sidebar-dark-theme`; the diff changes currency sets, schema fields, expense fields, queries, actions, and validation.
- Expected: This work item changes only approved UI/layout/theme files and leaves schema, auth, currency, conversion, financial behavior, and dependencies untouched.
- Evidence: Current `git diff --name-status` and targeted diff show the changes. `progress/current.md` labels them pre-existing unrelated work, but the branch worktree is not isolated.
- Required correction: Review an isolated fixed-sidebar-dark-theme commit/worktree with unrelated changes removed or separately committed, then repeat the boundary review.

### Medium — Required browser evidence is unavailable

- Requirement/design/task: R1, R2, R3, R4, R5, R7, TV5–TV8
- File: `tests/e2e/` / local Playwright runner
- Observed: `npm run test:e2e` remained silent for 114 seconds after printing only `> playwright test`; it produced no test count, server startup, browser error, or route result and had to be stopped.
- Expected: Authenticated desktop/mobile route checks or documented manual replacements.
- Required correction: Resolve the runner/environment stall and collect the required desktop, mobile, theme, storage, focus, contrast, chart, and overflow evidence.

## Cleanup signal

- Durable spec package: present and human-approved under `specs/fixed-sidebar-dark-theme/`
- Durable progress evidence: present in `progress/current.md`
- Durable review report: this file
- Scratch context to reset: none

CHANGES_REQUESTED -> reviews/fixed-sidebar-dark-theme/review.md
