# Requirements: Mobile Income Layout and Add Sheet

- Work item: specs/mobile-income-layout/
- Outcome: On small viewports only, redesign the Income screen to match the owner mobile references, hide the inline add form, and open Add income from a green “+” FAB as a bottom sheet.
- Branch: feature/mobile-income-layout
- Status: Specification
- Spec version: 2026-08-04

## Problem

On mobile, Income still uses the desktop inline “Add income” card and separate total cards. The owner wants a phone-first Income layout (summary strip + half-month schedule) and a slide-up Add income sheet opened by a floating “+” button—without changing desktop Income or financial semantics.

## In scope

- Mobile-only (`md` and below) Income presentation aligned with `reference-income-list.png`: title, “{Month} {Year} · N entries recorded”, circular month navigation, H1 / H2 / Month summary card, half-month schedule sections with Current badge when applicable, empty states.
- Hide inline `AddIncomeForm` and composition donut on mobile; keep them on desktop (`md+`).
- Mobile-only green circular “+” FAB that opens an Add income bottom sheet matching `reference-add-income-sheet.png` (handle, title, close, period H1/H2 control, amount, optional label, planned checkbox, submit).
- Reuse existing `createIncomeAction`, validation, edit/delete row behaviors, currency rules, and month query navigation (restyle allowed).
- No new npm dependencies.

## Out of scope

- Desktop Income redesign beyond preserving current inline add + donut + totals + lists.
- Changing income formulas, waterfall/materialize rules, Prisma schema, or auth.
- Expenses N control / expense sheet changes.
- Bottom pill nav destination changes.
- Adding Space Grotesk or other new fonts/packages.

## Definitions

- **Mobile Income**: Authenticated `/income` below the `md` breakpoint.
- **Add income sheet**: Bottom sheet hosting the create-income form.
- **+ FAB**: Fixed brand-colored circular control with a plus icon on Mobile Income only.
- **References**: `specs/mobile-income-layout/reference-income-list.png`, `reference-add-income-sheet.png`.

## Requirements

### R1 — Mobile Income layout; desktop unchanged

- Trigger: User opens `/income` at ~375px vs `md+`.
- Preconditions: Income month data loads for the authenticated user.
- Actor/system: Income page + mobile presentation components.
- Expected response: Below `md`, show the mobile layout (title, entry-count subtitle, circular month controls, three-column H1/H2/Month summary, half-month schedule card with H1/H2 entry lists or empty copy, Current badge on the active half when viewing the current calendar month). At `md+`, keep the current desktop structure (inline add, donut, three total cards, separate half lists).
- State change: Presentation only.
- Visible/resulting evidence: Same totals and entries across breakpoints for the same month.
- Failure behavior: Prefer existing desktop widgets over a blank page.
- Acceptance evidence: Manual check at ~375px and ≥768px.

### R2 — Inline add hidden on mobile; create via sheet

- Trigger: User adds income on mobile via the sheet.
- Preconditions: Year/month context available; create action exists.
- Actor/system: Sheet-hosted `AddIncomeForm` (or equivalent) + existing `createIncomeAction`.
- Expected response: Mobile does not show the in-page Add income card. Sheet collects period (H1/H2), amount, currency (retained even if mock omits it), optional label, and planned checkbox. Submit uses existing create action. Success closes the sheet and refreshes the list. Validation errors remain in the sheet.
- State change: Same create persistence as today; local sheet open/close.
- Visible/resulting evidence: New entry appears under the correct half after success.
- Failure behavior: Invalid submit does not close the sheet.
- Acceptance evidence: Add valid H1 and H2 entries on mobile; invalid amount shows error.

### R3 — Bottom-sheet presentation

- Trigger: Sheet opens from the + FAB (R4).
- Preconditions: Mobile viewport.
- Actor/system: Add income sheet UI.
- Expected response: Sheet slides up over a dimmed backdrop; shows drag handle, “Add income” title, close (X); period control uses a two-option segmented style (H1 / H2) per reference; Escape / backdrop / X closes without saving.
- State change: Local UI only until submit.
- Visible/resulting evidence: Matches structure of `reference-add-income-sheet.png`.
- Failure behavior: Close always available.
- Acceptance evidence: Open/close via +, X, backdrop, and Escape where supported.

### R4 — + FAB opens the sheet (mobile Income only)

- Trigger: User on Mobile Income activates the + control.
- Preconditions: Authenticated `/income` below `md`.
- Actor/system: Mobile Income FAB.
- Expected response: A fixed brand-colored circular “+” button appears on Mobile Income (typically bottom-end, clear of the floating nav pill). It does not appear on desktop or on other routes. Activating it opens the Add income sheet. Accessible name: “Add income”.
- State change: Sheet open state only.
- Visible/resulting evidence: + visible on mobile Income; opens sheet; absent at `md+`.
- Failure behavior: Do not leave an unclosable overlay.
- Acceptance evidence: Manual check that + only shows on mobile Income and opens the sheet.

### R5 — Schedule lists and mutations preserved

- Trigger: User views/edits/deletes income entries on mobile.
- Preconditions: Existing `IncomeEntryRow` behaviors.
- Actor/system: Half-month schedule lists on mobile.
- Expected response: Entries remain grouped by H1/H2; empty halves show clear empty copy; edit/delete (and planned display) remain available (chrome may be tightened for mobile). Totals in the summary strip use the same reporting-currency figures as today.
- State change: Existing update/delete actions only.
- Visible/resulting evidence: Mutating an entry updates lists/totals as on desktop.
- Failure behavior: Empty states never invent amounts.
- Acceptance evidence: Edit/delete an entry on mobile; totals update.

### R6 — Security, privacy, dependencies

- Trigger: Implementation and use of Mobile Income + sheet.
- Preconditions: App auth gate.
- Actor/system: Income mobile UI.
- Expected response: No auth bypass; no new secrets; amounts only via existing display/actions; no new npm dependencies; reference PNGs stay under `specs/`.
- State change: None beyond existing income mutations.
- Visible/resulting evidence: `package.json` deps unchanged for this work.
- Failure behavior: N/A.
- Acceptance evidence: Diff review; logged-out users still redirected.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Redesign Income for responsive | R1, R5 |
| + opens Add income bottom sheet | R2, R3, R4 |
| Mobile only; desktop unchanged | R1, R4 |
| Financial/auth/deps boundary | R2, R5, R6 |

## Assumptions

- Currency remains in the sheet for financial correctness even if the mock’s field list omits it.
- “Current” badge uses the same half-month notion as Overview (`currentPeriod`) when the viewed month is the current calendar month.
- Month total in the summary strip may use brand/accent emphasis per the mock.
- The + FAB is page-local to Income (not the nav **N** control).

## Open questions

- None blocking.
