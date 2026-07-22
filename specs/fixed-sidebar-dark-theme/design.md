# Design: Fixed Sidebar and Complete Dark Theme

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8

## Goals

- Give the desktop app shell one explicit content scroll owner while keeping the sidebar and its controls visible (R1, R7).
- Extend the existing class-based theme into a deliberate semantic surface/text/control/chart system without changing the light visual baseline (R3–R5).
- Keep mobile navigation and ordinary scrolling outside the desktop shell contract (R2, R7).
- Preserve all auth, query, action, currency, storage, and dependency boundaries (R6, R8).

## Current system observations

- `app/(app)/layout.tsx` currently uses a `md:flex` shell with a non-fixed `aside` and a flexing `main`; the sidebar has the theme toggle below `SideNav`, account initial, and sign-out.
- `components/nav.tsx` already separates desktop `SideNav` from mobile `BottomNav`; the mobile bar is fixed and More is an in-component disclosure.
- `components/theme-toggle.tsx` already stores only `luther-theme`, accepts only the dark value as dark, toggles the document class, and safely catches storage failures.
- `app/globals.css` defines initial chart CSS variables, a few dark overrides, shared `.field-input`/button/card classes, and broad dark selectors, but route-level literals and some chart/interaction surfaces remain inconsistent.
- `tailwind.config.ts` already uses `darkMode: "class"` and existing Tailwind/Recharts/Lucide dependencies; adding a package is unnecessary.
- Representative pages use `.card`, `.field-label`, `.field-input`, `.btn-*`, `stone-*` literals, responsive forms, a horizontally bounded Plan table, and chart components with Recharts CSS variables.
- `components/charts/bar-chart.tsx`, `line-chart.tsx`, `donut-chart.tsx`, and `project-progress-chart.tsx` are shared theme/readability boundaries. Donut tooltip styling is partly tokenized; bar/line tooltips and legends need the same deliberate treatment.
- The existing analytics work item established the chart and mobile More patterns; this work item is limited to shell scrolling and complete theme coverage, not new analytics or navigation information architecture.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/layout.tsx` | Make the desktop shell viewport-height constrained with a fixed/stable sidebar and an explicitly scrolling main region; restore ordinary document flow below `md`; preserve auth, sign-out, toggle placement, and mobile header/bottom-nav composition. | R1, R2, R7, R8 |
| `components/nav.tsx` | Verify desktop nav, mobile bottom bar, and More states use semantic theme classes, visible focus/hover/active states, and no overflow/clipping under the shell contract. | R2, R3, R4, R7 |
| `components/theme-toggle.tsx` | Preserve the existing client-only key and behavior while tightening light/dark control contrast, focus, hover, and accessible labeling if needed. | R3, R4, R6 |
| `app/globals.css` | Establish semantic light/dark tokens and shared styles for surfaces, text, borders, dividers, controls, tables, links, errors, empty states, focus rings, and chart surfaces; keep light values unchanged. | R3, R4, R5, R7 |
| `tailwind.config.ts` | Add only the minimum semantic token/utilities needed by the chosen class-based CSS approach; retain `darkMode: "class"` and existing dependency-free configuration. | R3, R8 |
| `app/(app)/page.tsx` | Replace or supplement any light-only route-level classes so Overview cards, labels, links, empty states, and chart wrappers inherit deliberate dark styles. | R3, R4, R5, R7 |
| `app/(app)/expenses/page.tsx` | Theme route-level filters, list/table-like rows, empty states, and any literal white/light text while preserving expense behavior. | R3, R4, R7, R8 |
| `app/(app)/expenses/expense-forms.tsx` | Theme representative form, edit, validation, action, and row controls with usable dark inputs/buttons/focus states. | R3, R4, R7, R8 |
| `app/(app)/plan/page.tsx` | Theme matrix headers, sticky cells, dividers, totals, explanatory text, and local horizontal table handling without changing values or table semantics. | R3, R4, R5, R7, R8 |
| `app/(app)/plan/plan-forms.tsx` | Theme plan inputs, category actions, validation, and focus/hover states. | R3, R4, R7, R8 |
| `app/(app)/savings/page.tsx` | Theme summary cards, form/history/empty states, links, and route-level muted text. | R3, R4, R7, R8 |
| `app/(app)/savings/savings-forms.tsx` | Theme savings inputs, action buttons, validation, and history controls. | R3, R4, R7, R8 |
| `app/(app)/balance/page.tsx` | Theme balance cards, table headers/rows, unavailable/empty states, and explanatory text. | R3, R4, R5, R7, R8 |
| `app/(app)/projects/page.tsx` | Theme project summary, allocation panel, links, empty state, and responsive project layout without changing project behavior. | R3, R4, R7, R8 |
| `app/(app)/projects/project-forms.tsx` | Theme project cards, progress, forms, action buttons, badges, and focus/hover states. | R3, R4, R7, R8 |
| `app/(app)/income/page.tsx` | Theme route-level cards, empty/history states, and links if they do not already inherit shared semantics. | R3, R4, R7, R8 |
| `app/(app)/income/income-forms.tsx` | Theme income fields, selects, validation, and action controls. | R3, R4, R7, R8 |
| `app/(app)/settings/page.tsx` | Theme settings panels, labels, explanatory text, and links without changing settings behavior. | R3, R4, R7, R8 |
| `app/(app)/settings/settings-forms.tsx` | Theme settings inputs/selects/buttons and focus/error states. | R3, R4, R7, R8 |
| `components/category-manager.tsx` | Theme category panel, rows, inputs, action buttons, and empty/error states. | R3, R4, R7, R8 |
| `components/category-picker.tsx` | Theme picker input/menu/options, active/hover/focus states, and validation text. | R3, R4, R7, R8 |
| `components/month-picker.tsx` | Theme month controls, links/buttons, and focus/hover states. | R3, R4, R7, R8 |
| `components/money.tsx` | Only if needed to remove a light-only display class; preserve formatting and nullable/missing-rate semantics. | R3, R8 |
| `components/charts/bar-chart.tsx` | Use theme tokens/props for axes, grid, tooltip, legend, series, container, and empty state; preserve data and currency formatting. | R3, R5, R7, R8 |
| `components/charts/line-chart.tsx` | Apply the same complete chart surface/readability contract to line charts. | R3, R5, R7, R8 |
| `components/charts/donut-chart.tsx` | Complete center label, legend, tooltip, empty state, and surface styling in both themes. | R3, R5, R7, R8 |
| `components/charts/project-progress-chart.tsx` | Theme progress chart labels, legend/tooltip, empty state, and container. | R3, R5, R7, R8 |
| `components/overview/cashflow-chart.tsx` | Audit and theme overview cashflow chart surfaces and labels where route-level literals bypass shared styles. | R3, R4, R5, R7, R8 |
| `components/overview/composition-donut.tsx` | Audit and theme overview composition chart surfaces, labels, and empty states. | R3, R4, R5, R7, R8 |
| `components/overview/half-month-schedule.tsx` | Audit and theme overview schedule rows, labels, dividers, and empty states. | R3, R4, R7, R8 |
| `components/overview/kpi-cards.tsx` | Audit and theme overview KPI cards, values, labels, and muted text. | R3, R4, R5, R7, R8 |
| `components/overview/overview-refresh.tsx` | Audit and theme overview refresh control and focus/hover states. | R3, R4, R7, R8 |
| `components/overview/projects-progress.tsx` | Audit and theme overview project progress panel, labels, and empty states. | R3, R4, R5, R7, R8 |
| `components/overview/spent-by-category.tsx` | Audit and theme overview category panel, chart legend, labels, and empty states. | R3, R4, R5, R7, R8 |

No new files, schema migrations, route changes, query/action changes, or dependency changes are expected.

## Data and control flow

### Desktop shell and scroll ownership

1. `AppLayout` continues to authenticate and render the existing server/client boundaries.
2. At `md` and above, the outer shell occupies the viewport (`min-height`/`height` based on `dvh`) and prevents the document from becoming a competing vertical scroll owner.
3. The sidebar is positioned/styled as a fixed or equivalent full-height left rail with the existing width, z-order, and internal flex controls. Its theme toggle remains below `SideNav`.
4. The desktop `main` receives the sidebar offset, `min-width: 0`, and `overflow-y-auto` as the sole intended desktop content scroll owner. Preserve `overflow-x-hidden` or an equivalent bounded horizontal policy.
5. Below `md`, the fixed/viewport-constrained desktop declarations are removed or overridden: the header, normal-flow content, and fixed mobile `BottomNav` keep their current behavior, with bottom padding preserving content clearance.
6. The implementation must not apply both a page-level and main-level vertical overflow container, and must not make the sidebar an independently scrolling pane for this narrow navigation.

### Theme system and persistence

1. Keep `darkMode: "class"` and the existing `ThemeToggle` document-class boundary unless implementation evidence requires an equivalent root attribute.
2. Define semantic tokens for page/shell/card/elevated surfaces, primary/secondary/muted text, borders/dividers, links, focus rings, form controls, table headers/rows, errors, and chart grid/text/surface/border. Light token values must match the current rendered light baseline.
3. Prefer shared classes/tokens for repeated styles; route-level overrides are allowed where components have distinct interaction or data states.
4. Keep `luther-theme` as the only client persistence key. Validate values as `light`/`dark`, default safely to light, and catch storage failures. Do not add financial state to client storage or move theme state to auth/settings/database.
5. Theme-aware chart rendering uses CSS variables or explicit theme props for grid, axes, legend, tooltip, empty panels, and series. Labels and nearby detail lists/tables remain available so chart meaning is not color-only.

### Route and component coverage

1. Audit every listed file for literal `bg-white`, light-only `bg-stone-*`, `text-stone-*`, border, divide, placeholder, ring-offset, hover, active, disabled, and table/sticky-cell classes.
2. Normalize repeated controls through `.field-*`, `.btn-*`, `.card`, and semantic link/focus classes where that does not alter behavior.
3. Preserve `min-w-0`, local `overflow-x-auto` for the Plan matrix, bounded chart containers, truncation/wrapping decisions, and mobile bottom padding.
4. Keep all existing server actions, `requireUserId` boundaries, query inputs/outputs, currency labels, money formatting, and missing-rate/empty semantics unchanged.

## Validation and failure handling

- Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
- Use the local browser/e2e runner for authenticated route checks when available. If Playwright remains blocked, document the blocker and perform manual checks at 375px, tablet, and desktop widths on Overview, Expenses, Plan, Savings, Balance, and Projects.
- For desktop, inspect scroll ownership with long content: sidebar remains visible, main content scrolls, document does not independently scroll, no second scrollbar is introduced, and account/theme/sign-out controls remain reachable.
- For mobile, inspect normal page scrolling, bottom-nav content clearance, More open/close/navigation, and no fixed desktop rail.
- Exercise light/dark toggle, reload persistence, invalid storage, unavailable storage, keyboard tab/focus-visible states, hover/active/disabled/error states, and route transitions.
- Verify contrast for normal/small text, controls, borders where needed for component identification, focus rings, chart axes/grid/legend/tooltip, empty states, and status colors against both theme surfaces. WCAG AA is the target.
- Check chart populated/empty/unavailable states and long labels/legends at narrow widths; chart values and nearby detail values must remain truthful and readable.
- Review the final diff to confirm no `prisma/schema.prisma`, auth, query/action, money/conversion, currency-set, or package manifest changes.
- If a theme storage exception occurs, rendering must remain available and financial data must not be serialized or persisted.

## Security, privacy, accessibility, and performance

- Keep `auth`, `requireUserId`, user-scoped queries, and server actions unchanged.
- Persist only a validated theme string; never persist amounts, currencies, identifiers, query results, or chart data.
- Preserve semantic headings, landmark labels, form labels, table headers, `aria` state for More, keyboard operation, and visible focus indicators.
- Do not communicate active/error/chart meaning through color alone; use text, labels, legends, patterns, or existing detail data.
- Use a single desktop content scroll container and bounded responsive chart/table regions to avoid scroll traps and layout thrash.
- Avoid new queries, unbounded client data, or new runtime dependencies. Theme computation and CSS variables should remain lightweight.

## Dependencies

No new dependency is approved or needed. Use the current Tailwind class-based dark mode, CSS variables, CSS/Tailwind utilities, existing Recharts, existing Lucide icons, and existing React/Next.js behavior.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Leave the sidebar in normal flex flow | Reject | Long content can move navigation out of view, violating the core desktop requirement. |
| Make both the document and main scroll independently | Reject | Produces double-scrollbars and confusing scroll ownership. |
| Make the sidebar itself a second scrolling pane | Reject | The narrow navigation/control rail does not need a second scroll path and can create a scroll trap. |
| Use a sticky sidebar without constraining document overflow | Defer/reject for implementation | Sticky can be valid, but an explicit viewport shell plus one content scroll owner gives stronger evidence against double-scrollbars. |
| Patch only `.dark` page background selectors | Reject | Cards, controls, tables, charts, states, and interactions still inherit light assumptions. |
| Store theme on the server or in user settings | Reject | Adds schema/auth/privacy scope and violates client-only preference requirement. |
| Add a dark-theme or chart dependency | Reject | Existing CSS/Tailwind/Recharts/Lucide mechanisms are sufficient. |
| Change financial queries or data models to support styling | Reject | UI theme/layout must not alter financial behavior or schema. |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | Desktop shell and scroll ownership; `app/(app)/layout.tsx`; `components/nav.tsx` |
| R2 | Desktop/mobile override flow; `app/(app)/layout.tsx`; `components/nav.tsx` |
| R3 | Theme system, route/component coverage, `app/globals.css`, listed route and shared files |
| R4 | Shared controls, focus/hover/error coverage; `components/nav.tsx`; route forms; global styles |
| R5 | Theme-aware chart rendering and chart component files; validation chart checks |
| R6 | Theme system and persistence; `components/theme-toggle.tsx`; privacy controls |
| R7 | Scroll ownership, responsive bounds, Plan local table overflow, shell/page checks |
| R8 | Data/control preservation, dependency/security boundaries, diff review and required commands |
