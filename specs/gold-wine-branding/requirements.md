# Requirements: Gold & dark wine branding with lion mark

- Work item: specs/gold-wine-branding/
- Outcome: Luther brand palette becomes silver + dark green; lion mark is the logo and tab icon
- Branch: feature/fixed-sidebar-dark-theme (current UI branch)
- Status: Specification → Human Approval (owner requested "lets change" 2026-07-20)
- Spec version: 2026-07-20

## Problem

Branding should use silver and dark green, with the lion as the in-app logo and browser tab icon.

## In scope

- Replace brand color scale with dark wine + gold accents
- Add lion image as logo (sidebar, mobile header, login) and favicon/tab icon
- Preserve light/dark semantic surfaces and financial behavior

## Out of scope

- Schema, auth, currency, money math, new dependencies beyond static image assets

## Requirements

### R1 — Brand palette

- Expected response: Primary actions and surfaces use dark green; silver is the accent.
- Acceptance evidence: Tailwind brand tokens and UI buttons/links reflect dark green + silver.

### R2 — Lion logo

- Expected response: Sidebar mark, mobile header, and login hero show the provided lion image (not the letter “L”).
- Acceptance evidence: Image asset served from the app; accessible `alt` / `aria-label`.

### R3 — Tab icon

- Expected response: Browser tab uses the lion as favicon/icon.
- Acceptance evidence: Metadata or `app/icon` points at the lion asset.

### R4 — Theme compatibility

- Expected response: Light and dark modes remain readable with the new palette.
- Acceptance evidence: Cards/inputs still use semantic surface tokens; wine/gold contrast is sufficient for primary controls.

## Traceability

| Source | Requirement IDs |
| --- | --- |
| Owner request: gold + dark wine + lion logo/tab icon | R1, R2, R3, R4 |
