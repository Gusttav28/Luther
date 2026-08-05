# Requirements: Mobile Pill Navigation Bar

- Work item: specs/mobile-pill-nav/
- Outcome: On small viewports, replace the existing full-width bottom nav with a floating dark pill bar whose primary destinations are Overview, Expenses, and Income, with remaining routes under a More (⋯) menu, matching the approved visual reference.
- Branch: feature/mobile-pill-nav
- Status: Specification
- Spec version: 2026-08-04

## Problem

On responsive (mobile) widths, the authenticated bottom navigation currently shows Overview, Expenses, Plan, and More in a full-width bordered strip. The owner wants the primary mobile destinations to be Overview, Expenses, and Income, presented as a floating dark stadium/pill bar with a white active pill (icon + label) for the selected primary item, and a three-dots More control for Plan, Savings, Balance, Projects, and Settings. Desktop sidebar navigation must remain unchanged.

## In scope

- Mobile-only (`md:hidden` / below desktop breakpoint) redesign of `BottomNav`.
- Primary destinations: Overview (`/`), Expenses (`/expenses`), Income (`/income`).
- More (three-dots) disclosure listing Plan, Savings, Balance, Projects, and Settings.
- Visual treatment matching `specs/mobile-pill-nav/reference-pill-bar.png`: floating dark charcoal pill container, soft elevation shadow, inactive white outline icons, active white inner pill with dark icon + label.
- Sufficient bottom content padding so page content is not obscured by the floating bar.
- Keyboard focus, `aria` labeling, and dark/light theme readability for the new bar and More menu.
- Existing Lucide icons and Tailwind/CSS only; no new npm dependencies.

## Out of scope

- Desktop `SideNav` structure, order, or styling (except ensuring it is unaffected).
- Authentication, session, sign-out, or route guards.
- Financial queries, Prisma/schema, calculations, currency, or any persisted financial data.
- New routes, renaming routes, or changing URL paths.
- Changing which pages exist or their page-level UI beyond shell clearance for the bar.
- Brand redesign of the mobile header.
- Turbopack / iCloud / local-dev environment fixes.

## Definitions

- **Mobile breakpoint**: Viewports below the existing `md` Tailwind breakpoint used by the app shell (bottom nav visible; desktop sidebar hidden).
- **Primary items**: Overview, Expenses, Income — always visible in the floating pill bar.
- **More menu**: Disclosure opened by the three-dots control; contains Plan, Savings, Balance, Projects, Settings.
- **Active primary pill**: White rounded inner chip on the dark bar showing the active primary route’s Lucide icon and label.
- **Secondary active**: When the current route is a More destination, the More control is visually emphasized; primary items are not shown as active.

## Requirements

### R1 — Primary mobile destinations are Overview, Expenses, and Income

- Trigger: An authenticated user views any app route below the desktop breakpoint.
- Preconditions: Existing app shell and `BottomNav` render for authenticated sessions.
- Actor/system: `BottomNav` / mobile shell.
- Expected response: The floating bar exposes exactly three primary navigation links — Overview, Expenses, Income — in a stable, predictable order, plus a More control.
- State change: None beyond navigation on activation.
- Visible/resulting evidence: Plan is no longer a primary bottom-bar item; Income is a primary item; labels/icons identify Overview, Expenses, and Income.
- Failure behavior: Missing or broken links must not leave the user unable to reach primary routes via other existing means (desktop sidebar when available); on mobile, all three primary links must remain present.
- Acceptance evidence: Manual check at ~375px on `/`, `/expenses`, and `/income` shows those three as primary bar items.

### R2 — Remaining routes live under More (three dots)

- Trigger: User activates the More (⋯) control on mobile.
- Preconditions: Bottom bar is visible.
- Actor/system: `BottomNav` More disclosure.
- Expected response: A menu lists Plan, Savings, Balance, Projects, and Settings; choosing an item navigates and closes the menu; activating More again or navigating away closes it.
- State change: Local open/closed disclosure state only.
- Visible/resulting evidence: Secondary routes are reachable only via More (not as fourth/fifth primary icons); More uses a three-dots affordance.
- Failure behavior: Menu must not trap focus permanently; Escape or outside activation may close when practical; navigating via a menu link always closes the menu.
- Acceptance evidence: At ~375px, open More, visit each secondary route, confirm menu closes and destination loads.

### R3 — Floating dark pill visual matching the reference

- Trigger: Mobile bottom navigation renders.
- Preconditions: Authenticated layout below `md`.
- Actor/system: `BottomNav` styles.
- Expected response: The bar is a floating horizontal stadium/pill (fully rounded ends), dark charcoal/slate fill, soft drop shadow, horizontally centered with inset from screen edges and safe bottom spacing — not a full-bleed top-bordered strip. Inactive primary/More icons render as light/white strokes on the dark bar. The active primary item uses a contrasting white inner pill containing dark icon + short label (as in the reference’s “Search” chip pattern).
- State change: Visual/CSS only.
- Visible/resulting evidence: Appearance clearly matches `reference-pill-bar.png` structure (dark outer pill + white active chip + icon-only inactives); desktop sidebar unchanged.
- Failure behavior: If theme is dark, the bar and active chip remain distinguishable (adjust chip/bar contrast within existing token system without introducing new dependencies).
- Acceptance evidence: Visual comparison of mobile bar to the reference image in light mode; smoke check in dark mode for contrast.

### R4 — Active state semantics

- Trigger: Pathname matches a primary or secondary destination.
- Preconditions: User is on an authenticated app route on mobile.
- Actor/system: `BottomNav` active matching (existing `isActive` rules: `/` exact; other hrefs prefix match).
- Expected response: Exactly one primary item shows the white active pill when on Overview, Expenses, or Income. When on a More destination, no primary item is active; More is emphasized. When More is open, More may also show an open/emphasized state.
- State change: None (derived from pathname + local disclosure).
- Visible/resulting evidence: Active chip label matches the current primary route; visiting Plan does not mark Overview/Expenses/Income active.
- Failure behavior: Ambiguous paths must not mark multiple primaries active.
- Acceptance evidence: Navigate primary and secondary routes and confirm a single coherent active treatment.

### R5 — Content clearance and non-interference

- Trigger: User scrolls long pages on mobile with the floating bar present.
- Preconditions: App layout main content region exists.
- Actor/system: `app/(app)/layout.tsx` padding and `BottomNav` positioning.
- Expected response: Page content remains reachable above the floating bar (adequate bottom padding); the bar does not cover critical controls at rest; horizontal page overflow is not introduced; desktop layout/scroll behavior is unchanged.
- State change: Layout spacing only.
- Visible/resulting evidence: Last content on Overview/Expenses/Income is scrollable clear of the bar; no full-width border strip remains.
- Failure behavior: Prefer extra bottom padding over overlapping content.
- Acceptance evidence: Manual scroll of a tall page at ~375px; desktop `md+` check confirms no floating pill and unchanged sidebar.

### R6 — Accessibility and privacy boundary

- Trigger: Keyboard/pointer users operate primary links and More.
- Preconditions: Authenticated session.
- Actor/system: `BottomNav`.
- Expected response: Each control has an accessible name (`aria-label` and/or visible label); More exposes `aria-expanded` / `aria-controls`; focus rings remain visible; no financial amounts, account secrets, or PII are introduced into the nav UI beyond existing route labels.
- State change: Local disclosure only; no new persistence of financial or personal data.
- Visible/resulting evidence: Screen-reader-oriented names present; focus visible on tab.
- Failure behavior: Do not remove existing sign-out from the mobile header as part of this work.
- Acceptance evidence: Keyboard tab through bar + open More; confirm names and focus; confirm no new storage/network of financial payloads from nav.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Responsive button bar: Overview, Expenses, Income | R1, R4 |
| Design of photo (floating dark pill + white active chip) | R3, R4 |
| Other options under More three-dots | R2 |
| Content usable above bar; desktop unchanged | R5 |
| A11y / no financial leakage via nav | R6 |

## Assumptions

- Existing Lucide icons for Overview, Expenses, and Income remain appropriate; More uses `MoreHorizontal` or equivalent three-dots Lucide icon.
- Owner-approved visual reference is `specs/mobile-pill-nav/reference-pill-bar.png` (icons in the photo are illustrative; Luther uses its existing domain icons + labels).
- Tailwind `md` breakpoint remains the desktop/mobile shell split.
- No new npm packages are required or approved.

## Open questions

- None blocking. Secondary route order in More defaults to current `NAV_LINKS` order excluding the three primaries (Plan, Savings, Balance, Projects, Settings).
