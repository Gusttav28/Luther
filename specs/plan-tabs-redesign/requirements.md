# Requirements: Plan Month / Year / Totals redesign

- Work item: specs/plan-tabs-redesign/
- Outcome: The Plan screen matches the owner's new Month / Year / Totals screens on mobile and desktop, and parent categories (e.g. Subscriptions) act as a collapsible dropdown with their total beside the name.
- Branch: `cursor/plan-tabs-redesign-ef43`
- Status: Implementation
- Spec version: 2026-09-24
- Human approval: owner "go" 2026-09-24 on this exact spec package
- Owner input 2026-09-24: new Plan screenshots (Month, Year, Totals); both mobile and desktop; remove charts; parents start collapsed; keep a year switcher; Totals tab stays as shown.

## Problem

The Plan screen today is a 12-column matrix (desktop table, mobile Grid/Monthly toggle) with two charts on top. Subcategories only show as indented `·· name` rows. The owner wants the simpler tabbed layout from the screenshots, and wants to open a parent like Subscriptions to see Netflix, Spotify, Max, etc. with the parent's total shown next to it.

The owner's subscription services currently exist as separate main categories. There is no way to move an existing category under a parent, so the dropdown would be empty without one.

## In scope

- A header with a year switcher, the selected month's budget and spent amount.
- Month / Year / Totals tabs.
- Month pills Jan–Dec on the Month and Year tabs.
- Month tab: edit plan amounts per category for the selected month, with parents grouped as collapsible dropdowns.
- Year tab: per-category year total and 12 small month bars, read-only, parents grouped the same way.
- Totals tab: planned total per month with bars and a year total (as in the screenshot).
- "+ New category" at the bottom of the Month tab (existing create form, including "Under").
- Per-row category actions (rename, archive, delete) kept, plus a new "Move under" action to set or clear a category's parent.
- The same design on desktop, laid out for a wide screen.
- Remove the Planned vs actual and Allocation charts and the old matrix table / Grid view.

## Out of scope

- Schema changes. `Category.parentId` already exists; no migration.
- New npm packages.
- Changing how plan cells are stored (still per `categoryId`, per month, CRC input).
- Changing Overview, Expenses, savings, or projects behavior.
- Editing plan amounts from the Year or Totals tab.
- More than one level of subcategories.

## Definitions

- **Parent**: a category with `parentId` null. **Child**: a category whose `parentId` is a parent.
- **Group**: a parent plus its children. A parent with no children is a plain row.
- **Group plan (month m)**: the parent's own plan for m plus every child's plan for m, in reporting currency.
- **Group actual (month m)**: completed expenses in m on the parent plus its children, in reporting currency.
- **Month budget**: sum of every category's plan for the selected month (same as today's month column total).
- **Spent**: sum of every category's completed expenses in the selected month.

## Requirements

### R1 — Header and year switcher

- Trigger: open `/plan` (optionally `?year=`).
- Expected response: a year switcher (‹ year ›) above the header. The header shows "{MONTH} BUDGET" with the month budget and "SPENT" with the spent amount for the selected month, in reporting currency.
- State change: none.
- Failure behavior: when a USD↔CRC rate is missing, amounts that need it show the existing unavailable state from `Money` (no crash).
- Acceptance evidence: header values equal `columnTotals[m]` and the sum of `actual[m]` over rows.

### R2 — Tabs and month pills

- Trigger: tap Month, Year, or Totals; tap a month pill.
- Expected response: three tabs; Month is the default. Month pills (Jan–Dec, horizontally scrollable, selected pill highlighted) appear on Month and Year and are hidden on Totals. The selected month defaults to the current month for the current year, otherwise January. Selecting a pill updates the header and the tab content.
- State change: client state only.
- Acceptance evidence: UI walkthrough on mobile and desktop.

### R3 — Month tab with collapsible parents

- Trigger: Month tab.
- Expected response: one row per parent, sorted by name. A parent without children shows its name, "actual ₡x" and a plan input for the selected month (as in the screenshot). A parent with children shows a chevron, its name, and the group plan for the month beside it; it starts **collapsed**. Expanding shows a "General" row (the parent's own plan input and actual) and one row per child (name, actual, plan input). Plan inputs save the same way as today (blur or Enter). "+ New category" at the bottom opens the existing create form with "Under".
- Archived categories that still have plan cells show faded, with read-only amounts, like today.
- Acceptance evidence: helper test that group plan = parent + children for month m; UI walkthrough expanding Subscriptions.

### R4 — Year tab

- Trigger: Year tab.
- Expected response: one card per parent: name, year total on the right, and 12 bars labeled J F M A M J J A S O N D, with the selected month's letter highlighted. Bar height is relative to that card's largest month. Parents with children show the group total and group bars, start collapsed, and expand to show a card per child (and "General" for the parent's own plan). Read-only.
- Acceptance evidence: helper test for group year total and per-month group values; UI walkthrough.

### R5 — Totals tab

- Trigger: Totals tab.
- Expected response: one row per month Jan–Dec with a horizontal bar (relative to the largest month) and the planned total; the selected month is highlighted. A "YEAR TOTAL" card at the bottom shows the year's planned total. Matches the owner's screenshot.
- Acceptance evidence: values equal `columnTotals` and `grandTotal`.

### R6 — Move a category under a parent

- Trigger: "Move under" in a category's row actions.
- Preconditions: authenticated owner.
- Expected response: choose "Main category" or any other active parent. The category's `parentId` is updated. Its plan cells and expenses stay attached to it.
- Failure behavior: reject when the target is not a parent owned by the same user, when the target is the category itself, or when the category has children of its own (would create a second level). Show the error on the row.
- Acceptance evidence: action validates `{ id, userId }` and target `{ id, userId, parentId: null }`; blocked when the category has children.

### R7 — Desktop layout

- Trigger: `/plan` at desktop widths.
- Expected response: the same header, tabs, pills, and tab content, in a wide centered layout (Year cards may use two columns). The old table and charts are removed on desktop too.
- Acceptance evidence: UI walkthrough at 1280 px; 360 px has no horizontal page scroll (pills scroll inside their row).

### R8 — Auth, privacy, dependencies

- Expected response: `requireUserId` on the page and all actions; every Category / PlanCell / Expense query stays `userId`-scoped. No schema or migration. No new packages. No secrets.
- Acceptance evidence: diff review.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| New Month / Year / Totals screens | R1, R2, R3, R4, R5 |
| Subscriptions as a dropdown with its total next to it | R3, R4, R6 |
| Totals is fine as shown | R5 |
| Both mobile and desktop, desktop shown properly | R7 |
| Remove charts | R7 (and In scope) |
| Parents start collapsed | R3, R4 |
| Keep year switcher | R1 |
| Security / no schema | R8 |

## Assumptions

- "Subscription" in the owner's data becomes the parent once the owner moves Netflix, Spotify, Max, Youtube, and iCloud+ under it with R6. No data is moved automatically.
- Charts are removed on desktop too, since the new design replaces the desktop view.
- Plan input stays in CRC; displayed totals stay in reporting currency, as today.

## Open questions

- None blocking.
