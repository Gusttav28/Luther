# Requirements: Mobile Lifetime Savings Layout and Record Sheet

- Work item: specs/mobile-savings-layout/
- Outcome: On small viewports only, redesign Lifetime savings to match the owner mobile references (unified summary card, stacked charts, History with + Record) and open manual record entry in a bottom sheet when + Record is activated.
- Branch: feature/mobile-savings-layout
- Status: Specification
- Spec version: 2026-08-04

## Problem

On mobile, Lifetime savings still uses a four-card KPI grid, side-by-side charts, and an inline “Manual adjustment” form. The owner wants a phone-first layout with a single summary card, stacked analytics, a History card headed by **+ Record**, and recording via a bottom sheet—without changing desktop Savings or the 70/30 waterfall semantics.

## In scope

- Mobile-only (`md` and below) Savings presentation aligned with `reference-savings-overview.png` and `reference-savings-history.png`.
- Unified summary card: Lifetime balance, Budget left, Lifetime take (70%), Left for projects (30%), plus the existing explainer copy inside/near the card.
- Stacked analytics cards: Contributions over time (bar) and Contributions vs withdrawals (donut), reusing existing series/totals.
- History card with green **+ Record** control; list rows keep note/date/amount and edit/delete (chrome may tighten for mobile).
- Hide inline `AddSavingsForm` on mobile; open it in a bottom sheet from + Record (fields: date, amount, currency, optional note; existing create action).
- Desktop (`md+`) Savings layout unchanged (inline form remains).
- No new npm dependencies.

## Out of scope

- Desktop Savings redesign.
- Changing lifetime 70% calculation, leftover/project split, Prisma schema, or auth.
- Redesigning other routes or bottom nav.
- New chart libraries or fonts.
- A separate visual for the Record sheet was not supplied; sheet follows the established Income/Expenses bottom-sheet pattern with existing savings form fields.

## Definitions

- **Mobile Savings**: Authenticated `/savings` below the `md` breakpoint.
- **Record sheet**: Bottom sheet hosting the manual savings create form.
- **+ Record**: History-header control that opens the Record sheet.
- **References**: `specs/mobile-savings-layout/reference-savings-overview.png`, `reference-savings-history.png`, `reference-savings-history-alt.png`.

## Requirements

### R1 — Mobile Savings layout; desktop unchanged

- Trigger: User opens `/savings` at ~375px vs `md+`.
- Preconditions: `getSavings` succeeds for the authenticated user.
- Actor/system: Savings page + mobile presentation.
- Expected response: Below `md`, show stacked mobile layout (title, unified summary card + explainer, two chart cards, History card). At `md+`, keep current desktop structure (four KPI cards, two-column charts, inline manual form, history).
- State change: Presentation only.
- Visible/resulting evidence: Same balances, chart totals, and history rows across breakpoints.
- Failure behavior: Prefer existing desktop widgets over a blank page.
- Acceptance evidence: Manual check at ~375px and ≥768px.

### R2 — Unified summary card

- Trigger: Mobile Savings renders.
- Preconditions: Summary figures from `getSavings` available.
- Actor/system: Mobile summary card.
- Expected response: One rounded card with a 2×2 grid of Lifetime balance, Budget left (after expenses), Lifetime take (70%), Left for projects (30%). Explainer text about automatic 70% and manual adjustments appears in/under the card (as in the reference).
- State change: None (display only).
- Visible/resulting evidence: Values match desktop KPI cards for the same data.
- Failure behavior: Null/unavailable amounts use existing Money empty presentation.
- Acceptance evidence: Spot-check four figures vs desktop.

### R3 — Stacked analytics cards

- Trigger: Mobile Savings renders with contribution history.
- Preconditions: Existing trend bars and contribution/withdrawal totals.
- Actor/system: Mobile chart cards (reuse `BarChart` / `DonutChart`, optionally embedded/compact).
- Expected response: “Contributions over time” and “Contributions vs withdrawals” appear as separate stacked cards with titles/subtitles matching current meaning; empty/unavailable rate states preserved.
- State change: None.
- Visible/resulting evidence: Same underlying series/totals as desktop charts.
- Failure behavior: Existing empty/unavailable messages.
- Acceptance evidence: Compare chart empty and non-empty months to desktop.

### R4 — History card with + Record

- Trigger: User views History on mobile.
- Preconditions: Contributions list available.
- Actor/system: Mobile History card + existing `SavingsListRow` (or restyled equivalent).
- Expected response: Card titled “History” with green **+ Record** in the header. Rows show note (or default lifetime-savings label when empty), date, amount, and edit/delete actions. Empty list shows clear empty copy.
- State change: Existing update/delete only.
- Visible/resulting evidence: Matches history reference structure; mutations still work.
- Failure behavior: Empty state does not invent rows.
- Acceptance evidence: Edit/delete a row on mobile; list updates.

### R5 — Record bottom sheet

- Trigger: User activates + Record on Mobile Savings.
- Preconditions: `createSavingsAction` and default date available.
- Actor/system: Record sheet + sheet variant of `AddSavingsForm`.
- Expected response: Bottom sheet slides up over a dimmed backdrop with handle, title (e.g. “Record” / “Manual adjustment”), close (X). Form includes date, amount (negative allowed for withdrawals), currency, optional note, and submit. Success closes the sheet and refreshes history. Validation errors remain in the sheet. Escape / backdrop / X closes without saving.
- State change: Same create persistence as today; local open/close UI state.
- Visible/resulting evidence: New contribution appears in History after success; inline form is not shown on mobile.
- Failure behavior: Invalid submit does not close the sheet.
- Acceptance evidence: Record a correction and a withdrawal (negative) on mobile.

### R6 — Security, privacy, dependencies

- Trigger: Implementation and use of Mobile Savings + Record sheet.
- Preconditions: App auth gate.
- Actor/system: Savings mobile UI.
- Expected response: No auth bypass; no new secrets; amounts only via existing display/actions; no new npm dependencies; reference PNGs stay under `specs/`.
- State change: None beyond existing savings mutations.
- Visible/resulting evidence: `package.json` deps unchanged for this work.
- Failure behavior: N/A.
- Acceptance evidence: Diff review; logged-out users still redirected.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Responsive Savings redesign from photos | R1–R4 |
| + Record opens bottom sheet | R4, R5 |
| Desktop unchanged; no formula/deps expansion | R1, R6 |

## Assumptions

- Default history note display may show the automatic lifetime-savings wording when `note` is empty (reference rows); stored note semantics unchanged.
- Sheet title may be “Record” or “Manual adjustment”; submit label remains “Record”.
- Chart titles may be shortened slightly for mobile density without changing meaning.

## Open questions

- None blocking.
