# Review: Horizontal Lifetime Savings and Balance Layout

- Work item: `horizontal-savings-balance`
- Branch: `feature/horizontal-savings-balance`
- Approved spec: `specs/horizontal-savings-balance/` (human-approved per `progress/current.md`)
- Implementer progress: `progress/current.md`, handoff `IMPLEMENTED`
- Review start: 2026-07-20
- Final verdict: BLOCKED_REVIEW

## Files inspected

- `AGENTS.md`
- `.agents/reviewer.md`
- `specs/horizontal-savings-balance/{requirements,design,tasks}.md`
- `progress/current.md`
- `reviews/_template/review.md`
- `app/(app)/savings/page.tsx`
- `app/(app)/balance/page.tsx`
- `app/(app)/savings/savings-forms.tsx`
- `components/charts/{bar-chart,line-chart,donut-chart}.tsx`
- `package.json`
- Working-tree diff and changed-file status

The horizontal-layout handoff attributes this work item to the two route files plus the progress entry. The working tree also contains modifications from earlier work items; those were not attributed to this review item.

## Commands run

| Command | Result |
| --- | --- |
| `npm run lint` | PASS; exit 0, no output/errors |
| `npm run typecheck` (run concurrently with build) | INVALID RUN; `.next/types` files were unavailable while the build regenerated `.next` |
| `npm run typecheck` (rerun after build) | PASS; exit 0 |
| `npm run test` | PASS; 6 test files, 58 tests |
| `npm run build` | PASS; production compilation, type validation, static generation, and trace finalization completed |
| `npm run test:e2e` | BLOCKED; after 130 seconds the terminal contained only the npm/Playwright startup banner and no test progress or result. The owned runner was stopped. No route result was obtained. |
| IDE linter diagnostics for both changed route files | PASS; no errors |

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — Full available content width | PASS by source inspection | Both routes use `mx-auto max-w-7xl space-y-6`; neither retains `max-w-3xl`. |
| R2 — Horizontal Lifetime Savings composition | PASS by source inspection | Savings summary, analytics charts, and recording form are rendered before History; analytics uses `md:grid-cols-2`, and the form remains usable as a full-width upper section. |
| R3 — Horizontal Balance composition | PASS by source inspection | Balance summary and both charts render before the unchanged half-month table; chart rows are derived from the existing balance series values. |
| R4 — Preserve recording, editing, deletion, and history | PASS by source inspection | `AddSavingsForm`, `SavingsListRow`, edit/delete actions, fields, pending/error states, settings link, table columns, and row rendering remain present. Unit/build checks pass. |
| R5 — Intentional responsive breakpoints | PARTIAL / BLOCKED | `sm:grid-cols-2`, `md:grid-cols-2`, `min-w-0`, `ResponsiveContainer`, and table overflow behavior are present. Required real viewport/e2e confirmation could not be obtained because Playwright hung before producing test output. |
| R6 — Honest currency and chart states | PASS by source inspection | Existing `CRC`/`USD` props and `Money` formatting are retained; `MissingRateError` produces `Unavailable until rates are set.` and does not fabricate chart values. |
| R7 — Accessibility and usable structure | PARTIAL / BLOCKED | Semantic section labels, headings, form labels, table headers/row headers, keyboard-operable controls, text empty/unavailable states, and chart legends are present. Required keyboard/viewport smoke inspection was not completed because e2e was blocked. |
| R8 — Scope, privacy, and dependencies unchanged | PASS for the horizontal handoff scope | The handoff identifies only the two route layout files plus progress for this item. No horizontal-item changes to schema, auth, query/action, conversion, currency-set, dependency, storage, or chart-component files were identified. |

## Design verdicts

- Wide bounded containers and the analytics-first order match the design.
- Savings charts and recording form appear before detailed history.
- Balance charts appear before the unchanged detailed table.
- Responsive shrinking is addressed with explicit grid breakpoints and `min-w-0`.
- Existing chart props, `ResponsiveContainer`, legends, tooltip currency formatting, and empty/unavailable messages remain intact.
- No new files, dependencies, schema changes, or financial query/action changes are part of the horizontal-layout handoff.
- Manual desktop/tablet/375px and keyboard inspection remain unverified due the stalled e2e runner.

## Task/checkpoint verdicts

- T1: PASS by source inspection.
- T2: PASS by source inspection.
- T3: PASS; chart components were inspected and no horizontal-item chart changes were needed.
- T4: PASS by source inspection and successful unit/build checks.
- T5: PASS by source inspection for scope and currency boundaries.
- TV1: PASS.
- TV2: PASS on the serial rerun; the concurrent first attempt was invalid because build/type generation raced.
- TV3: PASS, 58 tests.
- TV4: PASS.
- TV5: BLOCKED by stalled Playwright runner.
- TV6: PASS by source inspection for missing-rate handling; runtime edge-case route exercise was not obtained.
- TV7: BLOCKED for required runtime keyboard/viewport inspection.
- TV8: PASS for the horizontal handoff scope; the worktree contains pre-existing modifications from earlier work items, which were not attributed to this item.

## Findings

### BLOCKER — End-to-end and viewport evidence unavailable

- Requirement/design/task: R5, R7; TV5, TV7
- File: N/A; local test runner
- Lines: N/A
- Observed: `npm run test:e2e` printed only `> luther@0.1.0 test:e2e` and `> playwright test`, then remained active for 130 seconds with no test progress, route result, or failure output. The runner was stopped after that interval.
- Expected: Authenticated Savings and Balance checks at wide desktop, tablet, and 375px mobile widths, including responsive overflow, focus, form, chart, and detail reachability evidence.
- Evidence: Terminal process metadata showed `running_for_ms: 130031`; output contained no lines beyond the startup banner.
- Required correction: Re-run the existing e2e/viewport and keyboard checks in a healthy local process environment and attach the resulting pass/fail evidence. No application-code correction is established by this review.

## Cleanup signal

- Durable spec package: `specs/horizontal-savings-balance/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/horizontal-savings-balance/review.md`
- Scratch context to reset: stalled Playwright process was stopped; no application code or tests were edited by the Reviewer.

BLOCKED_REVIEW -> reviews/horizontal-savings-balance/review.md
