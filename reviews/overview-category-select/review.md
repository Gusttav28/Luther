# Review: Overview breakdown category select

- Work item: `overview-category-select`
- Branch: `cursor/overview-category-select-ef43`
- Approved spec: `specs/overview-category-select/` version 2026-09-23 (owner request 2026-09-23 — selectable combination + long-press subcategory float)
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED`
- Review start: 2026-09-23
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/_template/review.md`
- `specs/overview-category-select/{requirements,design,tasks}.md` (complete, version 2026-09-23)
- `progress/current.md` (handoff `IMPLEMENTED`)
- Diff vs `origin/main` (`git diff origin/main...HEAD` and per-file inspection)
- Authorized implementation files:
  - `lib/category-spend.ts` (new)
  - `lib/queries/overview-dashboard.ts`
  - `components/overview/spent-by-category.tsx`
  - `tests/unit/category-spend.test.ts` (new)
  - `vitest.waterfall.config.ts`
  - `progress/current.md`
- Consumers of the dashboard payload (unchanged wiring; now receive `children` on each parent slice):
  - `app/(app)/page.tsx` (desktop `SpentByCategory` card)
  - `components/overview/mobile-overview.tsx` → `BreakdownTabs` Category tab (`variant="embedded"`)
- Out of scope / TV3 confirmation (unchanged vs `origin/main`):
  - `package.json` / `package-lock.json` (empty diff)
  - `prisma/schema.prisma` and `prisma/migrations` (empty diff)
  - leftover / savings / projects math (`lib/waterfall.ts`, `lib/queries/projects.ts`, `lib/projections.ts`)
  - Composition donut (`components/overview/composition-donut.tsx`, `BreakdownTabs` Composition tab)

Implementation commit vs `origin/main`: `e45bb65` (Let Overview Breakdown select categories and sum them). Spec package is on the same branch.

Reviewer did not implement this work and did not edit application code or tests.

## Commands run

| Command | Result |
| --- | --- |
| `git diff origin/main...HEAD --stat` | PASS for scope. 9 files: authorized implementation + spec package + `progress/current.md`. No `package.json`, Prisma schema, leftover-formula, or Composition files. |
| `git diff origin/main...HEAD -- package.json package-lock.json prisma/schema.prisma prisma/migrations` | PASS; empty. |
| Secrets scan of `git diff origin/main...HEAD` | PASS; only spec/progress prose about “no secrets”, not credentials. |
| `npx vitest run tests/unit/category-spend.test.ts --config vitest.waterfall.config.ts` (TV1) | PASS; 1 file, **6 passed**. |

TV2 was not run. It is owner/browser; this review does not invent browser evidence.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Tap selects; headline is the selected sum | PASS (code + TV1; live click-through = TV2) | Client-only `selectedIds` in `SpentByCategory` (`spent-by-category.tsx` 225–243). Toggle adds an id or removes it; empty selection uses `data.totalMinor`. Non-empty uses `selectedCategoryTotal` (`lib/category-spend.ts` 10–22), which returns null for empty (caller shows the full-month total), one slice, the sum of two, and null when any selected `amountMinor` is null (not coerced to 0). Headline is `headlineMinor` on mobile “Total spent” / “Selected” (`44–50`) and the desktop card header (`322–324`). Rows and chips are `<button aria-pressed={selected}>` with a selected ring (`148–185`). Shares stay full-month (`spentByCategoryFromSnapshot` 108–112); only the bar dims unselected slices. TV1: none / one (`35_00`) / two (`55_00`) / null-FX. |
| R2 — Press-and-hold shows subcategory spend | PASS (code + TV1 children; hold UI live = TV2) | `attachSubcategorySpend` lists General first when the parent leaf has spend, then `childrenOf` (name-sorted) with each child’s leaf total (`category-spend.ts` 40–58). `spentByCategoryFromSnapshot` builds leaf totals from snapshot expenses and attaches children (`overview-dashboard.ts` 78–89, 114–122). `getOverviewDashboard` loads `prisma.category.findMany({ where: { userId }, select: { id, name, parentId } })` and passes those nodes in (`241–244`, `267`). UI: `HOLD_MS = 500`; left-button / touch `pointerdown` starts the timer; `contextmenu` is prevented and inspects immediately; `inspectAt` sets `holdOpened` so the following `click` does not call `onToggle` (`151–173`). Pointer cancel/leave/up before 500ms clears the timer. Popover is `position: fixed` at the press point, `role="dialog"`, lists children or “No subcategories”; outside tap (full-screen closer) and Escape dismiss (`245–252`, `266–300`). Popover rows are read-only `<li>`s (no child select). TV1: Subscriptions → General `10_00`, AI `5_00`, TV `20_00`; parent with no kids → `[]`. |
| R3 — Auth, privacy, dependencies | PASS (diff) | Extra category query is `where: { userId }` only. Overview page still `requireUserId` before `getOverviewDashboard`. `package.json` / lockfile unchanged. No Prisma schema or migration in the diff. No secrets, `.env`, or financial dumps. No new npm packages. |

## Design verdicts

- Pure helpers live in `lib/category-spend.ts` (`selectedCategoryTotal`, `attachSubcategorySpend` / `SpendChild`). No Prisma in the helper.
- `CategorySpend.children` is `{ categoryId, name, amountMinor }[]`; General is first when the parent itself has a leaf total; a parent with no `parentId` children gets `[]`.
- Control flow matches the locked diagram: tap → toggle id; headline → empty selection uses `totalMinor`, else `selectedCategoryTotal`; hold / contextmenu → popover `{ category, x, y }` and does not toggle.
- `getOverviewDashboard` loads user categories in the existing `Promise.all` and passes them into `spentByCategoryFromSnapshot`. No extra network on tap/hold.
- Missing FX on a selected slice → selected total `null` → existing `Money` missing-rate UI (not a coerced 0).
- Category controls are `<button aria-pressed>`. Popover is `role="dialog"` with Escape + outside click.
- `vitest.waterfall.config.ts` includes `tests/unit/category-spend.test.ts`.
- No new npm packages. No Prisma model changes.
- Extra files vs the design list: none. Spec package + progress are expected.
- Composition tab / donut, leftover, savings, and projects files are not in the implementation diff.

## Task/checkpoint verdicts

- T1: PASS. `lib/category-spend.ts` + `tests/unit/category-spend.test.ts` + waterfall include. TV1 covers one / two / none / null selected totals and General + AI + TV children; no-subcategory parent → `[]`.
- T2: PASS. `spentByCategory.categories[].children` filled from `userId`-scoped categories + snapshot leaf totals. `CategorySpend` now requires `children`.
- T3: PASS (code). Selectable rows (embedded) and chips (card); headline follows selection; 500ms hold and `contextmenu` open a positioned popover; `holdOpened` blocks the click toggle. Live press-and-hold is TV2.
- T4: PASS. `progress/current.md` records `IMPLEMENTED` for `overview-category-select`.
- TV1: PASS. Independent rerun: **6 passed**.
- TV2: NOT RUN — owner/browser. Reviewer did not invent browser evidence.
- TV3: PASS by diff review (no new packages, no schema, category `findMany` is `userId`-scoped, no secrets).

## Findings

No implementation defects against the approved spec. Remaining gap is the spec’s owner-manual browser check (TV2), not code divergence.

### INFO — TV2 not executed (owner/browser)

- Requirement/design/task: R1, R2 / TV2
- File: N/A (environment)
- Lines: N/A
- Observed: No owner session or live Overview walkthrough in this review. Code for tap-to-select, selected headline, 500ms hold, context-menu popover, hold-does-not-toggle, and Escape/outside dismiss is present and consistent with the spec.
- Expected: Browser: tap one, tap two, deselect, long-press Subscriptions.
- Evidence: Implementer log lists TV2 as owner/browser. Reviewer did not invent browser evidence.
- Required correction: None for the implementer. Owner should confirm TV2 on Overview Breakdown (mobile Category tab and desktop Spent by category).

### INFO — Null headline uses existing Money missing-rate UI, not a literal “—”

- Requirement/design/task: R1 failure behavior
- File: `components/money.tsx`
- Lines: 17–22
- Observed: Spec says null amounts stay “—”. `selectedCategoryTotal` returns `null` (TV1). The headline renders `<Money minor={headlineMinor} />`, which already links to Settings (“Set exchange rate”) when `minor === null`. That is the app-wide missing-FX treatment; this work does not coerce 0.
- Expected: Selected total is null / not 0 when a selected slice is missing FX.
- Evidence: `lib/category-spend.ts` 16–18; TV1 “stays null when a selected slice is missing FX”.
- Required correction: None. Acceptance evidence for R1 is the unit tests, which pass.

## Cleanup signal

- Durable spec package: `specs/overview-category-select/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/overview-category-select/review.md`
- Scratch context to reset: none. No application code or tests were edited by the Reviewer.

APPROVED -> reviews/overview-category-select/review.md
