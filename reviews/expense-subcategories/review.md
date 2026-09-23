# Review: Expense subcategories

- Work item: `expense-subcategories`
- Branch: `cursor/expense-subcategories-ef43`
- Approved spec: `specs/expense-subcategories/` version 2026-09-23 (owner request 2026-09-23)
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED`
- Review start: 2026-09-23
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/_template/review.md`
- `specs/expense-subcategories/{requirements,design,tasks}.md` (complete, version 2026-09-23)
- `progress/current.md` (handoff `IMPLEMENTED`)
- Diff vs `origin/main` (`git diff origin/main...HEAD` and per-file inspection)
- Authorized implementation files:
  - `prisma/schema.prisma`
  - `prisma/migrations/20260923021000_category_parent/migration.sql`
  - `lib/category-tree.ts`
  - `lib/category-resolve.ts`
  - `lib/validation.ts`
  - `lib/queries/{expenses,overview,overview-dashboard,plan}.ts`
  - `app/(app)/plan/actions.ts`
  - `app/(app)/expenses/{actions,page,expenses-table,expense-forms}.tsx`
  - `components/category-picker.tsx`
  - `app/(app)/plan/{page,plan-forms}.tsx`
  - `components/plan/mobile-plan.tsx`
  - `components/category-manager.tsx`
  - `tests/unit/category-tree.test.ts`
  - `vitest.waterfall.config.ts`
  - `progress/current.md`
- TV3 / out-of-scope confirmation:
  - `package.json` / `package-lock.json` unchanged vs `origin/main`
  - Prisma change is `Category.parentId` + self-relation + `(userId, parentId)` index only
  - leftover / savings / projects math files not in the implementation diff
- Spec package files on the branch (`specs/expense-subcategories/*`) are the approved spec, not unauthorized implementation.

Implementation commit vs `main`: `feb26ff` (Add one-level expense subcategories with a table dropdown).

`app/(app)/expenses/actions.ts` is not listed in the design file table; the change only forwards `parentId` into `resolveCategoryId` and is required for R3.

## Commands run

| Command | Result |
| --- | --- |
| `git diff --stat origin/main...HEAD` | PASS for scope. 25 files: authorized implementation + spec package + progress. No `package.json` / lockfile. |
| `git diff origin/main...HEAD -- package.json package-lock.json` | PASS; empty. |
| `git diff origin/main...HEAD -- prisma/schema.prisma` | PASS; only nullable `Category.parentId`, `CategoryTree` self-relation, `@@index([userId, parentId])`. Unique `(userId, name)` retained. |
| Secrets scan of `git diff origin/main...HEAD` | PASS; matches are spec/progress prose about “no secrets”, not credentials. |
| `npx vitest run tests/unit/category-tree.test.ts tests/unit/validation.test.ts --config vitest.waterfall.config.ts` (TV1) | PASS; 2 files, **31 passed**. |

TV2 was not run. It is owner/browser; this review does not invent browser evidence.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Parent/child category model | PASS (code + TV1) | `Category.parentId String?` with `CategoryTree` self-relation, `onDelete: Restrict`, `@@index([userId, parentId])`. Migration `20260923021000_category_parent` adds nullable `parentId` + FK + index only. Existing unique `(userId, name)` kept. Existing rows stay roots (`parentId` null). Helpers in `lib/category-tree.ts`: `rootsOf`, `childrenOf`, `categoryFilterIds`, `categoryPathLabel`, `rollupSpendToParents`. Parent lookup on write: `{ id, userId, parentId: null }` in `createCategoryAction` and `resolveCategoryId`. TV1: parent filter `[ai, sub, tv]`; child filter `["tv"]`; rollup 10+20+5 → Subscriptions 35. |
| R2 — Create and manage subcategories | PASS (code) | Plan `AddCategoryForm` has Under = Main category or a root (`plan-forms.tsx`, wired on desktop `page.tsx` and `mobile-plan.tsx`). `createCategoryAction` accepts `parentId`, scopes parent to same user + root, creates child. Rename/archive/delete stay `where: { id, userId }`. Delete parent with children returns `"Remove or archive subcategories first."`; delete child with expenses keeps the existing archive message. Plan rows carry `parentId` and sort parent-then-children (`lib/queries/plan.ts`). Child rows indent `·· name` on desktop and mobile. `CategoryManager` nests children (component unused elsewhere). No seeded Netflix/HBO/Cursor names. |
| R3 — Record an expense on parent or child | PASS (code) | `CategoryPicker`: parent select, then General (`categoryId` = parent) / child / New subcategory… (name + hidden `parentId`). New main category still creates a root (`parentId` empty). `expenseSchema` optional `parentId`. `createExpenseAction` / `updateExpenseAction` pass `parentId` into `resolveCategoryId`. Resolve with `parentId` looks up `{ id, userId, parentId: null }` then creates `{ userId, name, parentId }`; without `parentId` creates a root. Missing category still `"Choose or type a category name"`. Rows show `expense.categoryPath` (`Parent · Child` from `categoryPathLabel`). |
| R4 — Expenses table: general + subcategory dropdown | PASS (code + TV1; UI live = TV2) | `getExpenses` expands via `categoryFilterIds`. Parent → `[parent, ...children]`; child → `[child]`; All → no `categoryId` filter. Desktop: parent chips + chevron dropdown (`aria-expanded` / `aria-haspopup="listbox"`). Mobile: labeled `<select>` with `<optgroup>` per parent and `{name} (all)` = general. Table list/total use the same filtered `getExpenses` rows. TV2 owner walkthrough not run here. |
| R5 — Rolled-up composition | PASS (code + TV1) | Unfiltered Expenses donut: `rollupSpendToParents`. Parent-filtered donut: child slices plus `{parent} (general)`. Overview `spentByCategoryFromSnapshot` groups `parentId ?? categoryId`. TV1: parent 10 + child 20 + child 5 → parent slice 35; supermarket child 8 → parent 8. Leftover/savings/projects math files unchanged. |
| R6 — Auth, privacy, dependencies | PASS (diff) | Expenses/Plan pages and all changed actions call `requireUserId`. Category/Expense queries stay `userId`-scoped. Parent fetch requires `userId` and `parentId: null`. `package.json` unchanged. Schema change is `parentId` only. No secrets, `.env`, or financial dumps in the diff. No new npm packages. |

## Design verdicts

- One extra `Category.parentId` level; no new Prisma model; unique `(userId, name)` kept (duplicate “AI” under a second parent rejected at uniqueness, as specified).
- `lib/category-tree.ts` is the pure helper for roots, filter ids, path label, and rollup.
- `resolveCategoryId` / `createCategoryAction` reject a parent that is itself a child (`parentId: null` on the lookup).
- Delete parent with children uses the specified copy: “Remove or archive subcategories first.”
- Expenses table: parent chip = general; dropdown/optgroup for children; path label on rows.
- Donut default groups by root; parent filter may show children + General.
- Dropdown a11y: `aria-expanded` / `aria-haspopup`; mobile uses a labeled `<select>`.
- Categories loaded once per page for filter ids (no extra package; one extra column).
- Hardcoded vendor names rejected; placeholders are generic (`Food`, `AI`, `Subscriptions`) matching the spec’s examples, not seeded rows.
- `tests/unit/validation.test.ts` was listed in the design “if added”; `parentId` was added to `categorySchema` / `expenseSchema` but no new validation cases were added. Existing expense schema tests still pass (optional field). Not a functional miss versus T2/TV1.

## Task/checkpoint verdicts

- T1: PASS. Nullable FK + migration; tree helper; TV1 covers parent/child filter ids, path label, and parent+child rollup. Treating a child as a parent is rejected on write (`parentId: null` lookup) and in helpers (`categoryFilterIds(child)` = `[child]` only).
- T2: PASS. Create with same-user root `parentId`; omit `parentId` → root; delete parent with children errors; writes `userId`-scoped. `expenses/actions.ts` forwards `parentId` (justified extra file).
- T3: PASS. `getExpenses` uses `categoryFilterIds`; snapshot exposes `parentId` / `parentName`; spent-by-category rolls to parent; Plan rows carry `parentId` and sort parent then children.
- T4: PASS (code). Picker parent + General/child/new subcategory; table chip dropdown + mobile optgroups; path label; donut rollup / child slices when parent-filtered. Live click-through is TV2.
- T5: PASS (code). Add subcategory under a parent on desktop and mobile Plan; child rows indented. `CategoryManager` nests children.
- T6: PASS. `progress/current.md` records `IMPLEMENTED` for `expense-subcategories`.
- TV1: PASS. Independent rerun: **31 passed** (`category-tree` + existing `validation`).
- TV2: NOT RUN — owner/browser. Reviewer did not invent browser evidence.
- TV3: PASS. No new npm packages; schema is `parentId` only; no secrets; queries/actions stay `userId`-scoped; parent lookup requires same user and `parentId: null`.

## Findings

No implementation defects against the approved spec. Remaining gap is the spec’s owner-manual browser check (TV2), not code divergence.

### INFO — TV2 not executed (owner/browser)

- Requirement/design/task: R2–R4 / TV2
- File: N/A (environment)
- Lines: N/A
- Observed: No owner session or live UI walkthrough in this review. Code for create parent/children, general vs child filter, path label, dropdown, and optgroups is present and consistent with the spec.
- Expected: Browser: create Subscriptions → TV + AI; add expenses; parent filter shows both; child filter shows one; path label.
- Evidence: Implementer log lists TV2 as a post-deploy walkthrough. Reviewer did not invent browser evidence.
- Required correction: None for the implementer. Owner should confirm TV2 on `/expenses` as specified.

### INFO — No new `categorySchema` / `parentId` cases in `validation.test.ts`

- Requirement/design/task: Design file table for `tests/unit/validation.test.ts` (R2)
- File: `tests/unit/validation.test.ts`
- Lines: N/A (file unchanged vs `main`)
- Observed: `parentId` is optional on `categorySchema` and `expenseSchema`. Existing expense tests still pass. Design asked for parentId cases “if added”; tasks T2/TV1 do not require a new validation file.
- Expected: Optional unit coverage that omitted `parentId` creates a root-shaped payload and a provided `parentId` is accepted.
- Evidence: `git diff origin/main...HEAD -- tests/unit/validation.test.ts` empty; TV1 still 31 passed.
- Required correction: None. Optional follow-up only.

## Cleanup signal

- Durable spec package: `specs/expense-subcategories/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/expense-subcategories/review.md`
- Scratch context to reset: none. No application code or tests were edited by the Reviewer.

APPROVED -> reviews/expense-subcategories/review.md
