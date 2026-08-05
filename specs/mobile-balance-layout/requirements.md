# Requirements: Mobile Balance Layout

- Work item: specs/mobile-balance-layout/
- Outcome: On small viewports only, redesign Balance to match the owner mobile mock (unified starting/current summary, stacked Running balance and Income versus expenses charts, expandable half-month period list) while desktop Balance and balance math remain unchanged.
- Branch: feature/mobile-balance-layout
- Status: Specification
- Spec version: 2026-08-04

## Problem

On mobile, Balance still uses separate summary cards, side-by-side charts, and a wide period table. The owner supplied a phone-first layout with a single summary card, stacked analytics, and a tappable half-month list that expands to show Income / Expenses / Net.

## In scope

- Mobile-only (`md` and below) Balance presentation aligned with `reference-balance-standalone.html` / markup extract.
- Title “Balance”.
- One summary card: Starting balance with Edit affordance; Current balance (emphasis/color for negative as today).
- Stacked cards: Running balance (line) and Income versus expenses (bars), reusing existing `getBalanceSeries` chart data.
- “Running balance by half-month” card: period rows showing label + running balance; tap/expand reveals Income, Expenses, Net for that period.
- Desktop (`md+`) Balance unchanged.
- Reuse existing Money formatting, empty states, and rates note placement as appropriate on mobile.
- No new npm dependencies.

## Out of scope

- Desktop Balance redesign.
- Changing running-balance formulas, starting-balance storage schema, Prisma, or auth.
- Implementing a new Balance-page mutation for starting balance (mock inline edit); Edit continues to Settings unless a later SPEC_CHANGE adds Balance-local save.
- Bottom nav / N control changes from the mock chrome.
- New chart libraries or fonts (Space Grotesk in the mock is illustrative).

## Definitions

- **Mobile Balance**: Authenticated `/balance` below the `md` breakpoint.
- **Period row**: One half-month entry from `getBalanceSeries` rows.
- **References**: `specs/mobile-balance-layout/reference-balance-standalone.html`, `reference-balance-markup-extract.html`.

## Requirements

### R1 — Mobile Balance layout; desktop unchanged

- Trigger: User opens `/balance` at ~375px vs `md+`.
- Preconditions: `getBalanceSeries` succeeds for the authenticated user.
- Actor/system: Balance page + mobile presentation.
- Expected response: Below `md`, show stacked mobile layout (title, unified summary, two chart cards, expandable period list). At `md+`, keep current desktop structure (two summary cards, two-column charts, wide table).
- State change: Presentation / local expand state only.
- Visible/resulting evidence: Same starting/current balances and period figures across breakpoints.
- Failure behavior: Prefer existing desktop widgets over a blank page.
- Acceptance evidence: Manual check at ~375px and ≥768px.

### R2 — Unified starting / current summary card

- Trigger: Mobile Balance renders.
- Preconditions: `series.startingBalance` and `series.currentBalance` available.
- Actor/system: Mobile summary card.
- Expected response: One rounded card with two columns: Starting balance (value + Edit control) and Current balance (emphasized). Edit navigates to Settings (existing path) so starting balance remains editable there. Negative current balance remains visually distinct.
- State change: None on Balance (settings edit unchanged).
- Visible/resulting evidence: Values match desktop summary cards.
- Failure behavior: Null amounts use existing Money empty presentation.
- Acceptance evidence: Spot-check both figures vs desktop; Edit reaches Settings.

### R3 — Stacked Running balance and Income versus expenses charts

- Trigger: Mobile Balance renders with series rows.
- Preconditions: Chart row mapping from period series exists as today.
- Actor/system: Mobile chart cards (reuse LineChart / BarChart; add embedded/compact if needed).
- Expected response: Separate stacked cards titled “Running balance” and “Income versus expenses” with subtitles matching current meaning; empty states preserved.
- State change: None.
- Visible/resulting evidence: Same underlying points as desktop charts.
- Failure behavior: Existing empty copy when no income/expenses.
- Acceptance evidence: Compare empty and non-empty states to desktop.

### R4 — Expandable half-month period list

- Trigger: User taps a period row on Mobile Balance.
- Preconditions: `series.rows` available.
- Actor/system: Mobile period list (client expand state).
- Expected response: Card titled “Running balance by half-month” with helper text that periods can be expanded. Collapsed row shows period label and running balance. Expanded row reveals Income, Expenses, and Net for that period (same values as the desktop table). Multiple rows may expand independently. Empty list shows clear empty copy.
- State change: Local expand/collapse only.
- Visible/resulting evidence: Expanded figures match desktop table for the same period.
- Failure behavior: Empty state when no rows.
- Acceptance evidence: Expand/collapse several periods; spot-check Income/Expenses/Net/Balance.

### R5 — Security, privacy, dependencies

- Trigger: Implementation and use of Mobile Balance.
- Preconditions: App auth gate.
- Actor/system: Balance mobile UI.
- Expected response: No auth bypass; no new secrets; amounts only via existing display; no new npm dependencies; reference HTML stays under `specs/` and is not bundled to the client.
- State change: None beyond existing settings navigation.
- Visible/resulting evidence: `package.json` deps unchanged for this work.
- Failure behavior: N/A.
- Acceptance evidence: Diff review; logged-out users still redirected.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Responsive Balance from standalone HTML | R1–R4 |
| Desktop unchanged; no formula/deps expansion | R1, R5 |
| Edit starting balance without new Balance mutation | R2 |

## Assumptions

- Edit uses `/settings` rather than mock’s inline commit on Balance.
- Period labels use existing `periodLabel` (or equivalent) rather than mock short labels only; short labels may be used on chart axes if already available.
- Spec HTML (~500KB standalone) is design reference only.

## Open questions

- None blocking.
