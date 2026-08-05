# Requirements: Mobile Category Plan Layout

- Work item: specs/mobile-plan-layout/
- Outcome: On small viewports only, redesign Category plan to match the owner mobile references (circular year controls, Planned vs actual Trend/Allocation toggle, Monthly plan Grid/Monthly views) while desktop Plan and plan/expense semantics remain unchanged.
- Branch: feature/mobile-plan-layout
- Status: Specification
- Spec version: 2026-08-04

## Problem

On mobile, Category plan still presents desktop-oriented year controls, side-by-side charts, and a wide matrix that is hard to use on a phone. The owner wants a stacked mobile layout with touch-friendly year navigation, a single Planned vs actual card that toggles Trend vs Allocation, and a Monthly plan card that toggles Grid vs Monthly editing views—without changing desktop Plan or financial rules.

## In scope

- Mobile-only (`md` and below) Plan presentation aligned with `reference-plan-overview.png` and `reference-plan-monthly.png`.
- Circular previous/next year controls under the “Category plan” title.
- Planned vs actual card with segmented **Trend | Allocation** control:
  - Trend: monthly planned vs actual bar chart (reuse existing series data).
  - Allocation: category allocation chart (reuse existing donut/allocation segments).
- Monthly plan card with segmented **Grid | Monthly** control:
  - Grid: horizontally scrollable category × months matrix with plan inputs and actual sub-figures (existing cell semantics).
  - Monthly: circular month picker within the selected year; per-category rows (color dot, name, plan amount input, actual spend); month total footer.
- Preserve existing `getPlanMatrix`, `PlanCellInput` / `setPlanCellAction`, category add/rename/archive/delete capabilities (chrome may adapt; actions must remain reachable on mobile in a compact form).
- Desktop (`md+`) Plan layout unchanged.
- No new npm dependencies.

## Out of scope

- Desktop Plan redesign.
- Changing plan formulas, actual-spend derivation, reporting currency rules, Prisma schema, or auth.
- Redesigning other routes (Overview / Expenses / Income / nav).
- New chart libraries or fonts.

## Definitions

- **Mobile Plan**: Authenticated `/plan` below the `md` breakpoint.
- **Trend view**: Bar chart of monthly planned vs actual for the selected year.
- **Allocation view**: Category share of annual plan (existing allocation segments).
- **Grid view**: Year matrix of categories × months (scrollable on mobile).
- **Monthly view**: Single-month list editor for all categories in that month.
- **References**: `specs/mobile-plan-layout/reference-plan-overview.png`, `reference-plan-monthly.png`.

## Requirements

### R1 — Mobile Plan shell; desktop unchanged

- Trigger: User opens `/plan` at ~375px vs `md+`.
- Preconditions: Plan matrix loads for the authenticated user and year.
- Actor/system: Plan page + mobile presentation components.
- Expected response: Below `md`, show the mobile stacked layout (title, circular year controls, Planned vs actual card, Monthly plan card). At `md+`, keep the current desktop structure (dual charts, add-category, full table).
- State change: Presentation / local UI toggles only.
- Visible/resulting evidence: Same year matrix data on both breakpoints.
- Failure behavior: Prefer existing desktop widgets over a blank page.
- Acceptance evidence: Manual check at ~375px and ≥768px.

### R2 — Circular year navigation

- Trigger: User changes year on Mobile Plan.
- Preconditions: Year query param behavior exists (`?year=`).
- Actor/system: Mobile year controls.
- Expected response: Centered year label with circular prev/next controls; navigation updates the year while preserving plan data load for that year (same as today’s year links).
- State change: URL year (and derived matrix) only.
- Visible/resulting evidence: Year changes and charts/matrix refresh.
- Failure behavior: Disabled/pending state during navigation is acceptable.
- Acceptance evidence: Move year forward/back at ~375px.

### R3 — Planned vs actual: Trend / Allocation toggle

- Trigger: User toggles Trend vs Allocation on mobile.
- Preconditions: `planBars` and allocation segments already computed as today.
- Actor/system: Mobile Planned vs actual card (client toggle).
- Expected response: One card titled “Planned vs actual” with subtitle including year and reporting currency. Segmented Trend | Allocation control. Trend shows the existing planned/actual monthly bar chart (or equivalent Recharts presentation). Allocation shows the existing planned-allocation donut/segments. Toggle state is local UI only.
- State change: Local tab state only.
- Visible/resulting evidence: Figures match desktop charts for the same year.
- Failure behavior: Empty states use existing empty copy when no data.
- Acceptance evidence: Toggle both views; spot-check totals vs desktop.

### R4 — Monthly plan: Grid view

- Trigger: User selects Grid on Mobile Plan.
- Preconditions: Matrix rows and `PlanCellInput` available.
- Actor/system: Mobile Monthly plan card in Grid mode.
- Expected response: Horizontally scrollable matrix: sticky/leading category column, month columns with plan input (non-archived) and smaller actual figure below, row/column totals as practical on mobile (at least month column totals or row totals without inventing new math). Existing blur/Enter save behavior for plan cells is preserved. Page must not force full-page horizontal scroll—scroll is contained in the card.
- State change: Existing `setPlanCellAction` on edit.
- Visible/resulting evidence: Editing a cell updates plan amounts like desktop.
- Failure behavior: Archived categories remain non-editable as today.
- Acceptance evidence: Edit a cell in Grid; verify persistence after refresh.

### R5 — Monthly plan: Monthly view

- Trigger: User selects Monthly and changes months.
- Preconditions: Matrix data for the selected year.
- Actor/system: Mobile Monthly view.
- Expected response: Circular month prev/label/next within the selected year. List of categories with color marker, name, plan amount input for that month, and actual spend display. Footer shows month total (planned column total for that month using existing `columnTotals`). Month navigation is local or URL-assisted but must not break year selection.
- State change: Local selected month + existing plan cell saves.
- Visible/resulting evidence: Matches structure of `reference-plan-monthly.png`; amounts match matrix for that month.
- Failure behavior: Empty category list shows clear empty copy if no categories.
- Acceptance evidence: Switch months; edit a plan amount; month total updates.

### R6 — Category management still reachable on mobile

- Trigger: User needs to add/rename/archive/delete a category on mobile.
- Preconditions: Existing category actions.
- Actor/system: Compact mobile affordance (e.g. add-category control near Monthly plan; row actions via menu or inline).
- Expected response: Creating and managing categories remains possible on mobile without requiring desktop width. Semantics unchanged.
- State change: Existing category actions only.
- Visible/resulting evidence: Add a category on mobile; it appears in Grid and Monthly views.
- Failure behavior: Validation errors surface as today.
- Acceptance evidence: Add category on ~375px; confirm it appears.

### R7 — Security, privacy, dependencies

- Trigger: Implementation and use of Mobile Plan.
- Preconditions: App auth gate.
- Actor/system: Plan mobile UI.
- Expected response: No auth bypass; no new secrets; amounts only via existing display/actions; no new npm dependencies; reference PNGs stay under `specs/`.
- State change: None beyond existing plan/category mutations.
- Visible/resulting evidence: `package.json` deps unchanged for this work.
- Failure behavior: N/A.
- Acceptance evidence: Diff review; logged-out users still redirected.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Responsive Plan redesign from photos | R1–R5 |
| Trend / Allocation toggle | R3 |
| Grid / Monthly toggle | R4, R5 |
| Desktop unchanged; no financial/deps expansion | R1, R7 |
| Category management still works | R6 |

## Assumptions

- Default mobile toggles: Trend + Grid (matches first reference).
- Monthly view’s selected month defaults to the current calendar month when the selected year is the current year; otherwise January.
- Color dots in Monthly view may use `CHART_PALETTE` by category index.
- Add-category UI may be visually quieter than desktop but must exist on mobile (R6).

## Open questions

- None blocking.
