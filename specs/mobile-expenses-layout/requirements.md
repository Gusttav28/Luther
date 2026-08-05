# Requirements: Mobile Expenses Layout and Add Sheet

- Work item: specs/mobile-expenses-layout/
- Outcome: On small viewports, redesign the Expenses screen to match the owner mobile references, move Add expense into a bottom-sheet modal, and add an external “N” control next to the mobile More dots (outside the dark pill) that opens that sheet.
- Branch: feature/mobile-expenses-layout
- Status: Specification
- Spec version: 2026-08-04

## Problem

On mobile, Expenses still presents the desktop-oriented inline “Add expense” card and denser table chrome. The owner wants a phone-first Expenses layout and a slide-up Add expense sheet (not an in-page accordion/card). A brand circle labeled **N**, placed next to the ⋯ More control but **outside** the floating dark nav pill, must open that sheet.

## In scope

- Mobile-only (`md` and below) Expenses presentation aligned with `reference-expenses-list.png` (title, circular month controls, Export, list card with filters / count / total / row chrome with PENDING·DONE).
- Hide the inline `AddExpenseForm` card on mobile Expenses; keep it on desktop (`md+`).
- Add expense bottom sheet matching `reference-add-expense-sheet.png`: dimmed backdrop, rounded top sheet, drag handle, title, close (X), form fields, primary submit.
- Mobile nav: circle with letter **N** outside the dark pill, adjacent to More; activates the Add expense sheet.
- Reuse existing create-expense action, validation, categories, currency rules, filters, export, and list row edit/complete/delete behaviors (restyle allowed).
- No new npm dependencies.

## Out of scope

- Desktop Expenses IA redesign beyond keeping the current inline add form + existing desktop widgets.
- Changing expense financial formulas, completion waterfall rules, Prisma schema, or auth.
- Redesigning Income or other routes’ add flows (unless required solely to share a generic sheet primitive).
- Replacing letter **N** with the user avatar initial (mock uses **N**).
- The mock’s separate green “+” over Category (category-create UX stays as today’s `CategoryPicker` behavior).
- Bottom pill primary destinations (Overview / Expenses / Income / More) beyond adding the external N control.

## Definitions

- **Mobile Expenses**: Authenticated `/expenses` below the `md` breakpoint.
- **Add expense sheet**: Modal bottom sheet containing the create-expense form.
- **N control**: Circular brand-colored control showing the letter `N`, outside the dark nav stadium, next to More.
- **References**: `specs/mobile-expenses-layout/reference-expenses-list.png`, `reference-add-expense-sheet.png`.

## Requirements

### R1 — Mobile Expenses layout; desktop unchanged

- Trigger: User opens `/expenses` at ~375px vs `md+`.
- Preconditions: Expenses data/load succeeds for the authenticated user.
- Actor/system: Expenses page + related mobile components.
- Expected response: Below `md`, Expenses follows the mobile list layout (header/title, circular month nav + Export, list card with category/half filters, count + total, restyled rows). At `md+`, current desktop structure remains (inline add card, composition donut grid, existing table chrome).
- State change: Presentation only.
- Visible/resulting evidence: Resize across `md` switches presentations; same expense data on both.
- Failure behavior: Prefer existing desktop widgets over a blank page if mobile chrome fails.
- Acceptance evidence: Manual check at ~375px and ≥768px.

### R2 — Inline Add expense hidden on mobile; available via sheet

- Trigger: Mobile Expenses renders; user opens Add expense sheet.
- Preconditions: Categories and default date available as today.
- Actor/system: `AddExpenseForm` (or sheet-adapted form) + sheet host.
- Expected response: Mobile does not show the in-page Add expense card. Sheet presents create fields needed for a valid expense (name, amount, date, currency, category—currency may remain even if the mock omits it). Submit uses existing `createExpenseAction`. Success closes the sheet and refreshes the list. Validation errors stay visible in the sheet.
- State change: Same create persistence as today; local open/close UI state.
- Visible/resulting evidence: Creating an expense on mobile works without the inline card.
- Failure behavior: Server/validation errors do not close the sheet until success (or explicit dismiss).
- Acceptance evidence: Add a valid expense on mobile; reject an invalid one with errors shown.

### R3 — Bottom-sheet presentation for Add expense

- Trigger: Sheet opens from N (R4) or an optional in-page mobile affordance if needed for a11y.
- Preconditions: Mobile viewport.
- Actor/system: Sheet UI.
- Expected response: Sheet slides up from the bottom over a dimmed backdrop; shows handle, “Add expense” title, close control; traps focus reasonably; Escape / backdrop / X closes without saving. Does not cover the entire UX with an unclosable overlay.
- State change: Local UI only until submit.
- Visible/resulting evidence: Matches structure of `reference-add-expense-sheet.png` (bottom sheet, not a centered dialog).
- Failure behavior: Close always available even if form is dirty (no forced save).
- Acceptance evidence: Open/close via X, backdrop, and Escape (where supported).

### R4 — N control outside pill opens the sheet

- Trigger: Authenticated mobile shell with bottom nav visible; user activates N.
- Preconditions: BottomNav (pill + More) already present from prior work.
- Actor/system: Mobile nav cluster + sheet open signal.
- Expected response: A circular control displaying **N** sits **outside** the dark pill, horizontally adjacent to More (typically to the right of the pill). It is not inside the charcoal stadium. Activating it opens the Add expense sheet. If the user is not on `/expenses`, navigate to `/expenses` (preserve year/month query when already present / use current month defaults) and open the sheet. Accessible name must describe the action (e.g. “Add expense”), not only the letter N.
- State change: Navigation if needed + sheet open state.
- Visible/resulting evidence: N is visually outside the pill; click opens sheet on Expenses.
- Failure behavior: If navigation fails, do not leave an unclosable overlay.
- Acceptance evidence: From Expenses and from Overview (mobile), N opens Add expense on Expenses.

### R5 — Mobile list filters, totals, and row semantics preserved

- Trigger: User filters by category / half-month and views rows on mobile.
- Preconditions: Existing filter query params and expense rows.
- Actor/system: Mobile list + existing filter navigation.
- Expected response: Category and half filters remain functional (chrome may match mock: category control + All / 1–15 / 16+). Count and reporting-currency total reflect the filtered set using existing rules (completed-only total semantics unchanged). Rows still expose status (pending/done), amount, and existing edit/complete/delete capabilities (may use a ⋮ menu pattern on mobile).
- State change: URL filter params as today; completion/edit/delete as today.
- Visible/resulting evidence: Filter + mutate behaviors match desktop outcomes for the same data.
- Failure behavior: Empty filtered states show clear copy.
- Acceptance evidence: Filter H1/H2/category; toggle completion; edit/delete still work on mobile.

### R6 — Security, privacy, dependencies

- Trigger: Implementation and use of mobile Expenses + N + sheet.
- Preconditions: App auth gate.
- Actor/system: Expenses mobile UI / nav.
- Expected response: No auth bypass; no new secrets; expense amounts only via existing display/actions; no new npm dependencies; reference PNGs stay under `specs/` only.
- State change: None beyond existing expense mutations.
- Visible/resulting evidence: `package.json` deps unchanged for this work.
- Failure behavior: N/A.
- Acceptance evidence: Diff review; logged-out users still redirected.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Redesign Expenses for responsive | R1, R5 |
| Add expense as bottom-sheet modal | R2, R3 |
| N circle next to dots, outside pill, opens sheet | R4 |
| Desktop / financial behavior preserved | R1, R2, R5, R6 |

## Assumptions

- Letter on the control is literal **N** (mock), not the signed-in user’s initial.
- N is shown on all mobile screens where the floating bottom nav appears (not Expenses-only), and routes to Expenses when needed before opening the sheet.
- Currency field remains in the sheet for financial correctness even if the mock’s 2×2 grid omits it.
- Owner did not answer the prior clarifying questions; these assumptions apply unless a SPEC_CHANGE is requested.

## Open questions

- None blocking under the assumptions above.
