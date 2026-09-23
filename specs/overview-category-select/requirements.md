# Requirements: Overview breakdown category select

- Work item: specs/overview-category-select/
- Outcome: On Overview Breakdown, tapping categories selects them and the headline shows the sum of the selection. Press-and-hold opens a small popover of that parent’s subcategories and their spend.
- Branch: cursor/overview-category-select-ef43
- Status: Specification
- Spec version: 2026-09-23
- Human approval: owner request 2026-09-23 — selectable combination + long-press subcategory float

## Problem

The Overview **Breakdown** square lists categories and always shows the **grand total** of every category. The owner wants to tap one category and see **only that amount**, tap another and **add** it, so they can compare combinations (Subscriptions + Supermarkets, etc.). They also want a **press-and-hold** on a parent to float a small panel of its **subcategories** and those amounts — the same parent/child model as expense subcategories.

## In scope

- Breakdown Category tab (mobile) and desktop Spent by category card.
- Tap / click a category: select it; headline = that category’s spent. Tap another: add its amount. Tap a selected category again: deselect it. No selection: headline is the full-month total.
- Visual selected state on the chip/row.
- Press-and-hold (~500ms) on a category: a small popover near the press lists subcategories (and General if spend sits on the parent) with amounts. Hold does **not** toggle selection.
- Subcategory list uses existing `parentId` children. No new schema, no new packages.
- Unit tests for selected-sum and child rollup.
- `userId` on any extra category load; no secrets.

## Out of scope

- Changing leftover / savings / projects math.
- Selecting individual subcategories in the popover (popover is read-only).
- Composition tab / donut.
- Navigating to `/expenses?category=` from the popover (not requested).

## Definitions

- **Parent slice**: one row/chip in Breakdown (already rolled up: Subscriptions includes TV + AI + General).
- **Selected total**: sum of `amountMinor` for currently selected parent slices. Null if any selected amount is null (missing FX).
- **General**: spend assigned to the parent itself, not a child.
- **Hold popover**: floating panel anchored to the press point.

## Requirements

### R1 — Tap selects; headline is the selected sum

- Trigger: Owner taps a category in Overview Breakdown (mobile rows or desktop chips).
- Expected response: That category is selected. Headline amount is that category’s spent, not the all-category total. A second tap on another category **adds** its amount. Tapping a selected category **removes** it. Empty selection restores the full-month total.
- State change: client-only selection set.
- Visible/resulting evidence: “Total spent” / header number updates. Selected rows/chips look selected (`aria-pressed`).
- Failure behavior: null amounts stay “—”; do not coerce 0.
- Acceptance evidence: `selectedCategoryTotal` unit tests (one, two, none, null).

### R2 — Press-and-hold shows subcategory spend

- Trigger: Pointer down on a category for ~500ms (also context-menu / right-click on desktop).
- Expected response: A compact popover near the press lists that parent’s subcategories and amounts. If the parent has General spend, include a General line. If it has no children, the popover says there are no subcategories. Hold does not change the selection set. Dismiss on outside tap / Escape.
- Visible/resulting evidence: e.g. Subscriptions → TV, AI, General with amounts.
- Acceptance evidence: data includes `children`; UI has a positioned popover; hold path does not toggle select.

### R3 — Auth, privacy, dependencies

- Extra category load is `userId`-scoped. No new npm packages. No schema change.
- Acceptance evidence: diff review.

## Traceability

| Source request | Requirement IDs |
| --- | --- |
| Select one category → show that amount | R1 |
| Select another → add to the previous total | R1 |
| Long-press → float subcategory expenses | R2 |
| Works with expense subcategories | R2 |
| Security / no new packages | R3 |

## Assumptions

- Selection is in-memory for the current page view (clears on navigation).
- Shares (%) stay versus the full-month total.
- Composition tab is unchanged.

## Open questions

None blocking.
