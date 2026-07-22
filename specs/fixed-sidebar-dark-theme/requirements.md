# Requirements: Fixed Sidebar and Complete Dark Theme

- Work item: specs/fixed-sidebar-dark-theme/
- Outcome: Keep the authenticated desktop navigation visible while page content scrolls independently, and make every shared and route-level UI surface deliberately readable in dark mode without changing light mode or financial behavior.
- Branch: feature/fixed-sidebar-dark-theme
- Status: Specification
- Spec version: 2026-07-20

## Problem

The desktop app shell currently lays out the sidebar and main content together, so long pages can move the navigation out of view. Dark-mode support is also uneven: some shell, form, table, chart, empty-state, and interaction styles still inherit light-theme assumptions. The owner needs a stable desktop navigation frame and a complete, contrast-conscious dark presentation while preserving mobile navigation, existing data semantics, and client-only theme persistence.

## In scope

- Fixed or sticky desktop left sidebar with an independently scrolling main content region for Overview, Expenses, Plan, Savings, Balance, and Projects.
- Complete dark-theme treatment for shell surfaces, cards, panels, tables, borders, headings, body and muted text, labels, inputs, selects, buttons, links, navigation states, charts, empty states, hover states, and focus rings.
- Existing desktop-under-sidebar theme toggle behavior and client-only persistence of a validated light/dark preference.
- Responsive desktop/mobile breakpoint behavior, including usable mobile bottom navigation and More menu with normal content scrolling.
- Accessibility, contrast verification, keyboard focus/hover states, chart readability, and no horizontal overflow.
- Existing CSS, Tailwind, Recharts, and Lucide implementation mechanisms only.

## Out of scope

- Authentication, authorization, session behavior, route access, or sign-out behavior.
- Prisma/schema changes, financial queries, actions, calculations, currency sets, money conversion, rates, or persisted financial data.
- New dependencies, chart types unrelated to theme readability, or product/content redesign.
- Server-side theme profiles, cookies, database settings, or persistence of any financial value or identifier.
- Excel workbook validation; this remains unrelated pending work.

## Definitions

- **Desktop shell**: The `md`-and-up app layout containing the left `SideNav`, theme control, account/sign-out controls, and main content.
- **Independent content scroll**: The desktop main region owns vertical scrolling while the sidebar remains visible; the document must not expose competing vertical scroll containers.
- **Complete dark theme**: A deliberate dark variant for every in-scope visible surface and state, including contrast-safe text, controls, charts, empty states, hover, and focus treatment.
- **Theme preference**: Only `light` or `dark`, stored client-side under the existing theme boundary; no financial payload is persisted.
- **Mobile behavior**: The current mobile header, bottom navigation, More disclosure, and ordinary page/content scrolling below the desktop breakpoint.

## Requirements

### R1 — Keep the desktop sidebar fixed while content scrolls

- Trigger: An authenticated user opens any app route at the desktop breakpoint or wider and scrolls a long Overview, Expenses, Plan, Savings, Balance, or Projects page.
- Preconditions: The existing authenticated app shell and route navigation render successfully.
- Actor/system: `app/(app)/layout.tsx`, `SideNav`, and the desktop shell layout.
- Expected response: The left sidebar remains visible in a stable desktop position while the main content region scrolls vertically; navigation, theme toggle, account marker, and sign-out remain reachable without returning to the top.
- State change: Layout/scroll ownership only; no route, financial, or server state changes.
- Visible/resulting evidence: Exactly one intended vertical scrolling path is present on desktop; the sidebar does not scroll away and the main content does not sit beneath or overlap it.
- Failure behavior: If content is taller than the viewport, the content region remains scrollable without clipping, layout collapse, or a second accidental page/sidebar scrollbar.
- Acceptance evidence: Browser/manual checks at desktop width on all six named routes confirm persistent sidebar visibility, independent content scrolling, no overlap, and no double-scrollbar presentation.

### R2 — Preserve mobile navigation and ordinary mobile scrolling

- Trigger: A user opens the app below the desktop breakpoint and navigates with the mobile header, bottom navigation, or More menu.
- Preconditions: Existing `BottomNav`, mobile header, and route links are available.
- Actor/system: Responsive app shell and navigation components.
- Expected response: The desktop fixed-sidebar behavior is not applied to mobile; content scrolls normally, the bottom bar remains usable, and More can open, close, and navigate without being clipped by the shell.
- State change: Existing local More disclosure state only.
- Visible/resulting evidence: No fixed desktop sidebar appears on mobile; content is reachable above the bottom bar; all existing mobile routes remain accessible.
- Failure behavior: Narrow viewports do not acquire horizontal overflow, hidden content, or a nested scroll trap.
- Acceptance evidence: Manual or browser checks at 375px and an intermediate tablet width cover scrolling, bottom navigation, More disclosure, route selection, and content clearance.

### R3 — Provide complete dark-theme surfaces and typography

- Trigger: The authenticated user selects dark mode through the sidebar theme toggle or reloads with a stored dark preference.
- Preconditions: The existing class-based theme mechanism is available; storage may be absent, invalid, or unavailable.
- Actor/system: `ThemeToggle`, app shell, global styles, shared components, and route-level UI.
- Expected response: Dark mode deliberately styles page background, sidebar/header, cards, panels, table rows/headers, borders/dividers, headings, body text, muted text, labels, links, badges, empty states, and all existing route content on Overview, Expenses, Plan, Savings, Balance, and Projects.
- State change: Document theme class/attribute and the existing client theme preference only.
- Visible/resulting evidence: No light-only white surface, low-contrast stone text, border, table background, or label remains unintentionally visible in dark mode; light mode retains its current appearance.
- Failure behavior: Missing or invalid preference falls back safely to light; inability to use storage does not block rendering or alter financial data.
- Acceptance evidence: A route-by-route dark/light visual inspection and computed-style/contrast review covers all listed surfaces and confirms no unintended light-mode regression.

### R4 — Make controls and interaction states accessible in both themes

- Trigger: A user focuses, hovers, activates, disables, or enters invalid data in a navigation item, link, input, select, button, menu item, or form control.
- Preconditions: The existing control/action is rendered.
- Actor/system: Shared CSS/Tailwind styles and route-level controls.
- Expected response: Text, control boundaries, placeholders, validation/error messages, hover states, disabled states, active navigation states, and keyboard focus rings remain visible and distinguishable in both themes; keyboard operation remains unchanged.
- State change: Existing control state only.
- Visible/resulting evidence: Focus is visibly indicated without relying only on color; active/hover states do not erase readable text; form controls and errors remain legible.
- Failure behavior: Contrast or focus treatment must not disappear against dark surfaces; any unsupported browser color-scheme behavior must not make controls unusable.
- Acceptance evidence: Keyboard traversal and focus checks across shell, navigation, More menu, theme toggle, representative forms, table controls, links, and buttons at both themes; contrast checks meet WCAG AA targets for normal text and controls where applicable.

### R5 — Keep charts, legends, tooltips, and empty states readable

- Trigger: A chart or chart empty state renders in light or dark mode on Overview, Plan, Savings, Balance, or Projects.
- Preconditions: Existing Recharts components receive populated, empty, or unavailable data.
- Actor/system: Shared chart components, chart theme tokens, and route chart consumers.
- Expected response: Axes, labels, grid lines, legends, tooltips, series colors, chart containers, center labels, and empty/unavailable messages use deliberate theme-aware styling and remain readable; exact financial values remain available through existing text/detail representations.
- State change: None.
- Visible/resulting evidence: Chart text and tooltip surfaces contrast against their backgrounds, series remain distinguishable without color alone, and empty states communicate no-data/unavailable conditions clearly.
- Failure behavior: Empty, zero, null, or unavailable data does not produce a blank illegible panel, fabricated value, clipped legend, or horizontal overflow.
- Acceptance evidence: Representative populated and empty chart checks in both themes, including narrow viewport checks for legends/tooltips and review of `--chart-*` tokens and Recharts props.

### R6 — Persist only the theme preference client-side

- Trigger: The user toggles the theme and later reloads or revisits the app.
- Preconditions: The authenticated app shell is rendered; browser storage can be valid, empty, malformed, or unavailable.
- Actor/system: `components/theme-toggle.tsx` and the document theme boundary.
- Expected response: The selected `light` or `dark` preference applies immediately and is restored on later client loads.
- State change: Only the existing theme preference key/value may be written to browser storage; no server, schema, or financial record changes occur.
- Visible/resulting evidence: Storage inspection shows only the documented theme preference; financial values, account identifiers, query results, and chart payloads are absent.
- Failure behavior: Invalid values resolve to light; storage exceptions are handled without blocking the app or leaking data.
- Acceptance evidence: Storage inspection covers toggle, reload, invalid value, empty storage, and unavailable-storage scenarios; code review confirms the storage boundary.

### R7 — Prevent horizontal overflow and preserve responsive layout

- Trigger: Any in-scope route or shared component renders at phone, tablet, or desktop width.
- Preconditions: Existing forms, tables, cards, charts, navigation, and long labels may be present.
- Actor/system: Shell, page layout, shared component, table, and chart styles.
- Expected response: Content remains reachable within the viewport; tables use intentional bounded overflow when their data requires it, while the shell, cards, charts, controls, and navigation do not create accidental page-wide horizontal scrolling.
- State change: None.
- Visible/resulting evidence: No clipped headings, buttons, legends, inputs, More menu, focus indicators, or chart content; desktop fixed sidebar and content width coexist without overlap.
- Failure behavior: Long labels or wide matrices remain usable through intentional local handling rather than clipping or causing nested/unbounded scroll containers.
- Acceptance evidence: Viewport checks at 375px, tablet, and desktop cover all six named routes, long tables, forms, charts, navigation, and focus-visible states.

### R8 — Preserve financial, privacy, and dependency boundaries

- Trigger: Any implementation for this work item is reviewed or exercised.
- Preconditions: Existing authenticated queries, actions, currency behavior, and approved dependencies are available.
- Actor/system: All changed UI/style files.
- Expected response: UI/layout/theme changes preserve authenticated user scoping, CRC/USD choices and conversion semantics, existing financial behavior, and current dependency set.
- State change: None to financial records, schema, auth, conversion, or dependency graph.
- Visible/resulting evidence: Existing amounts, rates, empty/missing-rate semantics, actions, and routes behave as before; no new package or storage payload is introduced.
- Failure behavior: No theme/layout fallback silently changes currency, calculations, authorization, or persisted data.
- Acceptance evidence: Diff review plus typecheck, lint, unit tests, production build, and browser/e2e checks (or documented manual checks if the local Playwright runner remains blocked) show only approved UI/theme behavior changed.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Fixed desktop sidebar; independent content scrolling; no double-scrollbars | R1, R7 |
| Preserve mobile bottom nav/More and normal mobile scrolling | R2, R7 |
| Complete dark theme across shell, content, controls, and states | R3, R4, R5 |
| Theme toggle under sidebar and client-only persistence | R6 |
| Accessibility, contrast, focus/hover, chart readability | R4, R5 |
| No horizontal overflow and responsive behavior | R2, R7 |
| No auth/schema/currency/conversion/financial behavior changes | R8 |
| Existing CSS/Tailwind/Recharts/Lucide; no dependencies | R8 |
| Excel workbook validation unrelated pending work | R8 |
| Required typecheck/lint/tests/build/browser or documented manual checks | R8 |

## Assumptions

- The existing `md` breakpoint remains the desktop/mobile boundary unless implementation evidence shows a smaller breakpoint is required for a safe shell.
- Existing chart components and the `luther-theme` client storage boundary remain the source of truth; the implementation may normalize their styles but must not broaden persistence.
- The current route components and data queries remain authoritative; this work does not require new financial aggregation.

## Open questions

- No behavior-blocking question is required for this specification.
- Human approval of this package is required before implementation.
- Excel workbook validation remains unrelated pending work and is not a prerequisite for this UI work item.
