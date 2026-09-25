# Review: Plan Month / Year / Totals redesign

- Work item: `plan-tabs-redesign`
- Branch: `cursor/plan-tabs-redesign-ef43` (PR [#12](https://github.com/Gusttav28/Luther/pull/12)), 1 commit ahead of `main`, 0 behind
- Approved spec: `specs/plan-tabs-redesign/` version 2026-09-24 (owner "go" 2026-09-24)
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED`
- Review start: 2026-09-24
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/overview-category-select/review.md` (style reference)
- `specs/plan-tabs-redesign/{requirements,design,tasks}.md` (R1–R8, T1–T4, TV1–TV4)
- `progress/current.md` (handoff `IMPLEMENTED`)
- Diff vs `main` via `gh api repos/Gusttav28/Luther/compare/main...cursor/plan-tabs-redesign-ef43`
- Authorized implementation files:
  - `lib/plan-groups.ts` (new)
  - `tests/unit/plan-groups.test.ts` (new)
  - `vitest.waterfall.config.ts`
  - `lib/validation.ts`
  - `app/(app)/plan/actions.ts`
  - `app/(app)/plan/plan-forms.tsx`
  - `app/(app)/plan/page.tsx`
  - `components/plan/plan-board.tsx` (new)
  - `components/plan/mobile-plan.tsx` (removed)
  - `progress/current.md`
- Context (unchanged): `lib/queries/plan.ts` (`getPlanMatrix`), `components/money.tsx`

Review workspace: `/tmp/luther-check` (the iCloud repo hangs tools). Each of the 8 implementation files above was compared byte-for-byte against the branch via the GitHub contents API: all **SAME**.

Reviewer did not implement this work and did not edit application code or tests.

## Commands run

| Command | Result |
| --- | --- |
| `gh api …/compare/main...cursor/plan-tabs-redesign-ef43` (file list) | PASS for scope. 13 files: the 10 authorized implementation/progress entries above + 3 spec files. Matches the design file list exactly. |
| Same compare: `package.json`, `package-lock.json`, `prisma/schema.prisma`, `prisma/migrations/*` | PASS; none present in the diff. |
| Secrets scan of all patches (`secret|password|api_key|token|DATABASE_URL|sk-`) | PASS; only spec/progress prose ("no secrets", placeholder `DATABASE_URL` note). No `.env` or data dumps. |
| `DATABASE_URL=… DIRECT_URL=… npx vitest run --config vitest.waterfall.config.ts` (TV1) | PASS; 11 files, **82 passed** (includes 5 in `plan-groups.test.ts`). |
| `npx tsc --noEmit` (TV2) | PASS; exit 0, no output. |
| `npx eslint .` (TV2) | PASS; 0 errors, 1 warning in `components/balance/account-section.tsx:64` (`_breakdown` unused) — file not touched by this work. |
| `rg "mobile-plan|MobilePlan"` in `app/ components/ lib/ tests/` | PASS; no references remain. `components/plan/` contains only `plan-board.tsx`. |

TV3 (browser walkthrough at 360 px / 1280 px) was not run: it needs the owner's login. It is owner-pending, not failed.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Header and year switcher | PASS (code; live = TV3) | Year switcher: `‹` / `›` `Link`s to `/plan?year=${year∓1}` around "Plan {year}" (`plan-board.tsx` 276–283). Header "{MON} budget" = `<Money minor={budget}>` where `budget = matrix.columnTotals[monthIndex]` (253, 290–295). "Spent" = `sumNullable(matrix.rows.map(r => r.actual[monthIndex]))` (254, 297–301) — null when any row is missing a rate, which `Money` renders as its existing "Set exchange rate" link (`money.tsx` 17–22). Page loads settings + matrix after `requireUserId` (`page.tsx` 14–19). |
| R2 — Tabs and month pills | PASS (code; live = TV3) | Three `button aria-pressed` tabs, default `"month"` (`plan-board.tsx` 225, 305–321). Pills Jan–Dec in an `overflow-x-auto` row, selected pill `bg-brand-600`, rendered only when `tab !== "totals"` (323–346). Default month = current month when `year` is the current year, else January (222–223); reset when the year changes (232–235). Header and panels all read `monthIndex`. Selected pill is scrolled into view (237–242). |
| R3 — Month tab, collapsible parents | PASS (code + TV1; live = TV3) | `groupPlanRows` roots sorted by name, children by name (`plan-groups.ts` 37–58). Parent without children → `MonthRow` with name, "actual", and `PlanCellInput` (`plan-board.tsx` 357–368, 146–175). Parent with children → `GroupHeader` button (`aria-expanded`, chevron, name, `group.planned[monthIndex]`) (370–385, 178–218). `expanded` starts as an empty `Set` → collapsed (228). Expanded shows "General" (`row={group.root}`) then children (386–410). `PlanCellInput` unchanged save path (blur / Enter → `setPlanCellAction`) (`plan-forms.tsx` 92–100). Archived rows faded + line-through, amount read-only via `Money` (`plan-board.tsx` 148–163). "+ New category" opens `AddCategoryForm` with "Under" (418–436). TV1: group plan = parent + children (1 000 + 8 000 + 5 000 = 14 000). |
| R4 — Year tab | PASS (code + TV1; live = TV3) | One `li` per group; group header shows `group.total`, plain parent shows `Money` total (445–472). `YearBars` of 12 bars scaled to the card's `maxOf(values)`, letters J…D with the selected letter bold/brand (36–86). Groups start collapsed (shared `expanded`, 447) and expand to "General" + a card per child with `rowTotal` and bars (479–500). No inputs in this panel. TV1: group year total 22 000, null propagation, orphan child as own group. |
| R5 — Totals tab | PASS (code; live = TV3) | Rows iterate `matrix.columnTotals` with bar width relative to `maxOf(columnTotals)`; selected month highlighted (`plan-board.tsx` 255, 510–537). "Year total" card = `<Money minor={matrix.grandTotal}>` (538–543). Pills hidden on this tab (323). |
| R6 — Move a category under a parent | PASS (code) | `setCategoryParentAction` (`actions.ts` 68–108): `requireUserId` (74); schema `categoryMoveSchema` (`validation.ts` 116–123); category must match `{ id, userId }` (82–83); empty `parentId` → `null` (85); self-target rejected (87–89); target must match `{ id: parentId, userId, parentId: null }` (90–93); rejects when `count({ userId, parentId: id }) > 0` (94–97); write is `updateMany({ where: { id, userId } })` (101); revalidates `/plan` and `/expenses` like the other category actions (102–103). Only `parentId` changes — plan cells and expenses stay on the category. UI: `MoveCategoryForm` select "Main category" / "Under {parent}", excludes self, submits on change, shows `_form` error inline on the row (`plan-forms.tsx` 106–146); hidden for rows with children or archived rows (203–206). Parents list = active roots only (`plan-board.tsx` 245–251). |
| R7 — Desktop layout | PASS (code; 1280 px / 360 px live = TV3) | `page.tsx` renders only `PlanBoard` + currency/rates notes (21–32); no charts, no table, no `md:hidden` / `hidden md:*` wrapper, so mobile and desktop both get the board. Board is centered `mx-auto max-w-3xl` (275), Year cards `lg:grid-cols-2` (444). 360 px: pills scroll inside their row (`-mx-4 … overflow-x-auto`, 326); budget text `truncate` in `min-w-0` (288–293). |
| R8 — Auth, privacy, dependencies | PASS (diff) | `requireUserId` on the page and every action in `actions.ts` (19, 51, 74, 111, 127, 162, 201). New action queries are all `userId`-scoped (see R6). No new Prisma queries elsewhere; matrix query unchanged and scoped (`lib/queries/plan.ts`). No schema, migration, package, or lockfile changes. No secrets. |

## Design verdicts

- `groupPlanRows` matches the design: parents = `parentId === null`, children attach by `parentId`, a child whose parent is not in the matrix becomes its own group, `planned`/`actual` sum with null propagation, `total = sumNullable(planned)` (`plan-groups.ts` 22–58).
- One client board for mobile and desktop; state `tab`, `monthIndex`, `expanded: Set` as designed (`plan-board.tsx` 225–230).
- `setCategoryParentAction` follows the six design steps in order (`actions.ts` 68–108).
- Accessibility: tabs and pills are `button aria-pressed`; group headers are `button aria-expanded`; bars carry `role="img"` + `aria-label` with month and amount (`plan-board.tsx` 50–56).
- No invalid nesting: amounts inside buttons (group headers, Totals rows) use `PlainMoney` (plain text, "Rate needed" when null), so the `Money` settings `Link` is never inside a `<button>` (30–34, 215, 382, 531). `Money` is only used outside buttons.
- No extra queries: one matrix load; grouping is in memory (`useMemo`, 244).
- `PlanCellInput` gained `ariaLabel` and a placeholder; `inputClassName` now replaces the default size/radius/background. Its only consumer is `plan-board.tsx`.
- Extra files vs the design list: none.

## Task/checkpoint verdicts

- T1: PASS. Helper + 5 tests (parent+children month sum, year total, plain parent + sorting, null propagation, orphan child) + waterfall include.
- T2: PASS. Action, schema, and "Move under" UI; server rejects self / non-root or foreign target / category with children.
- T3: PASS (code). Header, tabs, pills, collapsed groups, Year bars, Totals bars + year total.
- T4: PASS. Page renders board only; `mobile-plan.tsx` removed with no leftover references; `requireUserId` kept.
- TV1: PASS. Independent rerun: 11 files, **82 passed**.
- TV2: PASS. `tsc` clean; `eslint` 0 errors (1 pre-existing warning outside scope).
- TV3: NOT RUN — owner-pending (needs owner login). No code evidence of a defect for the walkthrough steps.
- TV4: PASS by diff review.

## Findings

No blocking defects against the approved spec.

### LOW — Orphan child's "Move under" select cannot show or directly pick "Main category"

- Requirement/design/task: R6 / T2
- File: `app/(app)/plan/plan-forms.tsx`, `components/plan/plan-board.tsx`
- Lines: `plan-forms.tsx` 126–139; `plan-board.tsx` 245–251
- Observed: When a child's parent is archived and has no plan cells, the parent is not in the matrix, so it is not in `parents`. The child's select gets `defaultValue={parentId}` that matches no option, so the browser shows "Main category" as selected. Choosing "Main category" then fires no `change` event, so the owner has to pick another parent first (or unarchive the parent) to reach main.
- Expected: R6 — choose "Main category" or any other active parent.
- Evidence: `getPlanMatrix` drops archived categories without cells (`lib/queries/plan.ts` `.filter((c) => !c.archived || …)`); `groupPlanRows` shows such a child as its own group (TV1 orphan test). The server action itself handles `parentId: ""` correctly.
- Required correction: None for approval. Optional follow-up: add a disabled/placeholder option for an unknown current parent, or submit on "Main category" even when it appears selected.

### INFO — Move action does not reject an archived target

- Requirement/design/task: R6
- File: `app/(app)/plan/actions.ts`
- Lines: 90–92
- Observed: The target lookup requires `{ id, userId, parentId: null }` but not `archived: false`. The UI only lists active parents.
- Expected: R6 failure behavior only requires "a parent owned by the same user", which is met. Same rule as `createCategoryAction` (30–35).
- Required correction: None.

### INFO — Default month is computed from `new Date()` during render

- Requirement/design/task: R2
- File: `components/plan/plan-board.tsx`
- Lines: 222–223
- Observed: The server render and the browser can disagree on the current month near a month boundary (server time zone vs owner's UTC-6), which could cause a hydration mismatch for a few hours at month end.
- Evidence: Same pattern existed in the removed `mobile-plan.tsx` (lines 78–79 on `main`). Not a regression.
- Required correction: None.

### INFO — TV3 not executed (owner/browser)

- Requirement/design/task: R1–R7 / TV3
- File: N/A (environment)
- Observed: No owner session; walkthrough at 360 px and 1280 px (tabs, pills, expand Subscriptions, edit a plan cell, move a category under Subscriptions) not performed. Code for each step is present and consistent with the spec.
- Required correction: None for the implementer. Owner should confirm TV3 on the Vercel preview before completion.

### INFO — Pre-existing ESLint warning

- File: `components/balance/account-section.tsx`
- Lines: 64
- Observed: `_breakdown` unused (warning, not error). File not in this diff.
- Required correction: None for this work item.

## Required corrections

None.

## Cleanup signal

- Durable spec package: `specs/plan-tabs-redesign/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/plan-tabs-redesign/review.md`
- Scratch context to reset: `/tmp/luther-check` review copy. No application code or tests were edited by the Reviewer.

APPROVED -> reviews/plan-tabs-redesign/review.md
