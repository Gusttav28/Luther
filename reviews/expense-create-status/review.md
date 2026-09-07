# Review: Expense create status (Planning vs Already charged)

- Work item: `expense-create-status`
- Branch: `cursor/expense-create-status-ef43`
- Approved spec: `specs/expense-create-status/` version 2026-09-07 (owner GO on 2026-09-07)
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED`
- Review start: 2026-09-07
- Final verdict: APPROVED

## Files inspected

- `AGENTS.md`, `.agents/reviewer.md`, `reviews/_template/review.md`
- `specs/expense-create-status/{requirements,design,tasks}.md` (complete)
- `progress/current.md`
- Diff vs `main` (`git diff main...HEAD --name-only` and per-file diffs)
- Authorized implementation files:
  - `lib/validation.ts`
  - `tests/unit/validation.test.ts`
  - `app/(app)/expenses/actions.ts`
  - `app/(app)/expenses/expense-forms.tsx`
  - `progress/current.md`
- Out-of-scope / TV5 confirmation (unchanged vs `main`; current contents inspected):
  - `package.json`
  - `prisma/schema.prisma`
  - `components/add-expense-sheet.tsx`
  - `app/(app)/expenses/page.tsx`
  - `lib/queries/{expenses,plan,overview,balance,waterfall-scope}.ts`
- Spec package files on the branch (`specs/expense-create-status/*`) are the approved spec, not unauthorized implementation.

Implementation commits vs `main` (application/tests/progress only): `61007cb` (implement), `bb8393c` (types/menu-width polish). Spec package added in `7a4e61b`.

## Commands run

| Command | Result |
| --- | --- |
| `git diff main...HEAD --name-only` | PASS for scope. Changed paths: authorized implementation files + spec package + `progress/current.md`. No `package.json`, Prisma schema, spent-query, sheet-host, or Expenses page rewrites. |
| `git diff main...HEAD -- package.json prisma/schema.prisma` | PASS; empty. |
| `npx vitest run tests/unit/validation.test.ts` (official, `vitest.config.ts` `globalSetup`) | FAIL / environment: Prisma `db push` cannot reach Postgres at `127.0.0.1:5432` (`P1001`). No test file executed. |
| `npx vitest run tests/unit/validation.test.ts --config /tmp/vitest.validation-only.config.cjs` (throwaway config, no `globalSetup`; reviewer did not edit repo tests) | PASS; 1 file, **21 passed**. |
| Source inspection of spent queries / page totals | PASS; still `completed: true` / `e.completed` filters. |
| Source inspection of forbidden row copy (`Complete` / `Not complete` / `Done` / `Pending`) | PASS; absent from `ExpenseListRow` owner-facing strings. |
| Secrets scan of `git diff main...HEAD` | PASS; matches are spec/progress prose about “no secrets”, not credentials. |

TV1–TV3 were not run (no live app / owner session / `.env` in this environment). They remain owner-manual by spec design.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Create-time two-option control (sheet and desktop) | PASS (code) | Single `ExpenseStatusControl` is rendered after both sheet and card field stacks and before **Add expense**, so both `AddExpenseForm` variants share it (`expense-forms.tsx` ~248–262). Labels are exactly **Planning** and **Already charged**. Default `useState(false)` → Planning; hidden `name="completed"` is `"false"` / `"true"`. `role="group"` `aria-label="Expense status"` with `aria-pressed` on each `type="button"`. Date/amount/name/currency/category inputs are separate; the control does not write them. Sheet host `components/add-expense-sheet.tsx` unchanged. Manual ~375px / `md+` screenshots remain TV1. |
| R2 — Persist `completed` from the create-time choice | PASS (code + TV4 cases) | Dedicated `completedCreateSchema` + `parseCompletedCreate` (not on `expenseSchema`). Missing/`null`/`undefined`/empty → `false`. `"true"` → `true`; `"false"` → `false`; other strings fail (`"yes"`, `"1"`, `"TRUE"` covered). No `z.coerce.boolean()` on this parse. `createExpenseAction` writes `completed: completedParsed.data` after `requireUserId`; invalid `completed` returns `{ completed: "Choose Planning or Already charged" }` and does not `create`. `updateExpenseAction` `data` still omits `completed`. `copyExpensesMonthAction` still `completed: false`. Catch still `GENERIC_ERROR`. |
| R3 — Planning listed but not spent; Already charged counts as spent | PASS (code; persist-flag-only) | Spent query files were not rewritten. `getExpenses` lists all month rows (no `completed` filter on `findMany`); `totalMinor` adds only `if (r.completed)`. Expenses page still `filter((e) => e.completed)` for `displayTotal` / category segments. `plan.ts`, `overview.ts`, `balance.ts`, `waterfall-scope.ts` still `completed: true`. Runtime money-total check is TV1/TV2 (owner-manual). |
| R4 — Later flip via existing toggle, with matching labels | PASS (code) | `setExpenseCompletedAction` still used on desktop buttons and mobile ⋮. Badge: Planning / Already charged. Desktop meta: ` · Planning` when incomplete; no incomplete suffix when charged. Desktop button and mobile menu: **Already charged** (sets `"true"`) on Planning rows; **Planning** (sets `"false"`) on charged rows. No Complete / Not complete / Done / Pending on expense rows (`pendingLabel` is submit-pending copy only). `EditExpenseForm` has no status field and is not in the implementation diff. Visual opacity/brand highlight unchanged. |
| R5 — Security and privacy | PASS (code) | `createExpenseAction` and `setExpenseCompletedAction` call `requireUserId`. Create `data` includes `userId`. Toggle/update `where: { id, userId }`. `package.json` dependencies unchanged vs `main`. No Prisma schema change. No secrets, `.env`, or financial dumps in the diff. No new npm dependencies. |

## Design verdicts

- Create control matches the preferred income-period pattern: `role="group"`, `aria-pressed`, hidden `completed` input, labels **Planning** / **Already charged**, default Planning.
- Parse is a dedicated `completedCreateSchema` / `parseCompletedCreate` kept off `expenseSchema`, as preferred so update cannot clobber status.
- Mapping table is implemented: `"false"` → `completed: false` (listed, not spent); `"true"` → `completed: true` (listed, spent via existing aggregations).
- `copyExpensesMonthAction` left at `completed: false`. `EditExpenseForm` unchanged. No new files. Sheet host and Expenses page unchanged.
- Spent aggregations were not rewritten (rejected alternative honored).
- `z.coerce.boolean()` was not used on the create-time form string.
- No Prisma enum / new status field.
- Menu width `160` → `180` (`MENU_WIDTH` applied on the portaled ⋮ menu) is a layout fit for the longer **Already charged** label in an authorized file; not a spent-formula or schema change.
- Live UI at 375px / `md+` remains owner-manual (TV1–TV3).

## Task/checkpoint verdicts

- T1: PASS. `completedCreateSchema` / `parseCompletedCreate`; tests cover default Planning, true/false, invalid, and omitted `completed` on `expenseSchema`. No `z.coerce.boolean()`. Update path does not write `completed`.
- T2: PASS. `createExpenseAction` persists parsed `completed`; `requireUserId` + `userId` retained; copy still `false`; update/toggle write sets unchanged.
- T3: PASS. Control on both sheet and card variants; default Planning; hidden `"false"` / `"true"`; date independent; sheet host unchanged.
- T4: PASS. Row copy mapping matches R4/design; toggle still `setExpenseCompletedAction`; edit form unchanged.
- T5: PASS. `progress/current.md` records `IMPLEMENTED` for `expense-create-status`.
- TV1: NOT RUN — owner-manual; no live app / session in this environment.
- TV2: NOT RUN — owner-manual; same.
- TV3: NOT RUN — owner-manual; same.
- TV4: PASS with independent evidence. Official `npx vitest run tests/unit/validation.test.ts` failed in `globalSetup` (Postgres unreachable). Throwaway config skipping `globalSetup`: **21 passed**. Test cases in `tests/unit/validation.test.ts` match T1/R2.
- TV5: PASS by code review (auth, export-plan copy, aggregations, dependencies, no schema change, no secrets).

## Findings

No implementation defects against the approved spec. Remaining gaps are the spec’s owner-manual UI checks, not code divergence.

### INFO — TV1–TV3 not executed here (owner-manual remaining)

- Requirement/design/task: R1 (viewport evidence), R3 (live spent totals), R4 (live toggle); TV1, TV2, TV3
- File: N/A (environment)
- Lines: N/A
- Observed: This environment has no owner session, running app, or usable Postgres for the app. Reviewer did not invent browser evidence.
- Expected: Manual add Planning / Already charged on sheet + card; spent totals follow `completed`; row toggle labels and totals; forbidden copy absent in the running UI.
- Evidence: `progress/current.md` already recorded TV1–TV3 as not executed; reviewer confirmed no `.env` app runtime. Code for those behaviors is present and consistent with the spec.
- Required correction: None for the implementer. Owner should confirm TV1–TV3 on `/expenses` as specified.

### INFO — Official TV4 command cannot run against this environment’s database

- Requirement/design/task: TV4 / R2
- File: `vitest.config.ts` → `tests/global-setup.ts`
- Lines: globalSetup `prisma db push`
- Observed: Official command exited 1 with Prisma `P1001` (cannot reach `127.0.0.1:5432`). Tests never started.
- Expected: Documented `npx vitest run tests/unit/validation.test.ts` green in an environment with Postgres.
- Evidence: Independent rerun with throwaway config (no `globalSetup`): 21 passed. Test source covers the required parse cases.
- Required correction: None for this work item. Owner/CI with `DATABASE_URL` can run the official command; missing DB here is an environment limit, not missing test cases.

## Cleanup signal

- Durable spec package: `specs/expense-create-status/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/expense-create-status/review.md`
- Scratch context to reset: `/tmp/vitest.validation-only.config.cjs` (reviewer throwaway; not in the repo). No application code or tests were edited by the Reviewer.

APPROVED -> reviews/expense-create-status/review.md
