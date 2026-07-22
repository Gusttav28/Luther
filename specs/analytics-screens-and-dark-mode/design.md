# Design: Analytics screens, responsive navigation, and dark mode

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10

## Goals

- Put truthful, useful analytics before detailed controls on Plan, Savings, Balance, and Projects (R2–R6).
- Preserve the existing server-query, authenticated-user, currency, and action boundaries (R9–R10).
- Make the existing visual language readable in both themes and at phone widths (R6–R8).

## Current system observations

- `app/(app)/page.tsx` already establishes the analytics pattern with KPI cards, Recharts-based charts, empty states, and `RatesNote`.
- `getPlanMatrix` already returns monthly planned/actual arrays, totals, and nullable values after reporting-currency conversion.
- `SavingsContribution` has date, signed amount, currency, and optional note, but no category field.
- `getBalanceSeries` already returns income, expenses, net, and running balance per half-month period.
- `getProjectsView` already returns saved amount, funded percentage, completion, priority, affordability, and projection state.
- `SideNav` renders all desktop links and `BottomNav` currently renders all `NAV_LINKS`.
- Global colors are currently light-only Tailwind literals; the app shell is in `app/(app)/layout.tsx`.
- `Category` has only name/archived metadata. There is no investment, savings, or allocation type.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/income/income-forms.tsx` | Normalize Add income field wrappers/row alignment and responsive stacking; preserve action fields. | R1, R6, R9 |
| `app/(app)/income/page.tsx` | No financial behavior change; only adjust composition/layout if needed to keep aligned form and existing chart readable. | R1, R6 |
| `app/(app)/plan/page.tsx` | Build chart datasets from `getPlanMatrix`, render plan charts before Add category/matrix, retain year and currency behavior. | R2, R6, R9 |
| `app/(app)/savings/page.tsx` | Aggregate existing signed dated contributions for trend/composition and render charts before form/history. | R3, R6, R9 |
| `app/(app)/balance/page.tsx` | Map existing balance rows to trend and income/expense charts before the detailed table. | R4, R6, R9 |
| `app/(app)/projects/page.tsx` | Add top project summary/funding visuals and replace vertical list wrapper with responsive 3/2/1 grid. | R5, R6, R9 |
| `app/(app)/projects/project-forms.tsx` | Ensure card internals, edit form, progress, and actions fit grid widths and remain keyboard usable. | R5, R6, R8 |
| `components/nav.tsx` | Keep full desktop `SideNav`; make mobile bar exactly Overview/Expenses/Plan and add accessible More disclosure for other links. | R7, R8 |
| `components/icons.ts` | Add/use a menu/close or theme icon only if existing Lucide exports do not cover the controls; do not add a dependency. | R7, R8 |
| `app/(app)/layout.tsx` | Add the desktop-under-sidebar theme control and any minimal theme bootstrap needed by the client toggle; preserve auth/sign-out. | R7, R10 |
| `app/globals.css` | Define light/dark semantic surface, text, border, focus, chart-container, table, and empty-state styles. | R6, R7, R8 |
| `tailwind.config.ts` | Add semantic theme tokens/utilities and `darkMode: "class"` if needed by the chosen class-based implementation. | R6, R7 |
| `components/charts/donut-chart.tsx` | Replace hard-coded light-only text/empty surfaces with theme-aware semantic classes and accessible chart labeling. | R2, R3, R7 |
| `components/charts/line-chart.tsx` | New shared responsive Recharts line chart for Plan/Savings/Balance series, with nullable/missing-rate and empty states. | R2, R3, R4, R6, R7 |
| `components/charts/bar-chart.tsx` | New shared responsive Recharts bar chart for planned-vs-actual and income-vs-expenses comparisons. | R2, R4, R6, R7 |
| `components/charts/project-progress-chart.tsx` | New focused chart for per-project funded percentages/status derived from `ProjectsView`. | R5, R6, R7 |
| `components/theme-toggle.tsx` | New client-only light/dark toggle that validates localStorage input and persists only the theme value. | R7, R10 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `components/charts/line-chart.tsx` | Shared accessible line-chart shell and empty/unavailable handling. | R2, R3, R4, R6, R7 |
| `components/charts/bar-chart.tsx` | Shared accessible grouped-bar chart shell and empty/unavailable handling. | R2, R4, R6, R7 |
| `components/charts/project-progress-chart.tsx` | Project-specific funding-progress visualization without cross-currency summation. | R5, R6, R7 |
| `components/theme-toggle.tsx` | Client theme preference control and storage boundary. | R7, R10 |

No Prisma schema migration is required for this work item.

## Data and control flow

### Plan

1. `plan/page.tsx` calls the existing `getPlanMatrix(userId, year, reportingCurrency, rates)`.
2. Monthly planned values come from `matrix.columnTotals`; monthly actual values come from summing each row’s `actual[monthIdx]` with nullable propagation.
3. Planned allocation composition uses each row’s positive planned annual total (`row.rowTotal`) and category name.
4. Render grouped monthly planned-vs-actual bars and a category allocation donut before the category form and matrix.
5. Use “planned allocation” wording. Do not claim investment-only totals: `Category` has no type metadata, and actual values represent expenses only.

### Savings

1. `savings/page.tsx` calls existing `getSavings`, which returns all dated signed rows and the reporting-currency lifetime/month totals.
2. Aggregate rows by calendar month in reporting currency. Positive amounts form contributions; negative amounts form withdrawals using absolute magnitude for composition.
3. Render a contribution/withdrawal trend over the available date range and a two-segment contribution-versus-withdrawal donut before the form and history.
4. Do not group by note or infer categories. A future savings-category feature would require a separate schema/product decision.

### Balance

1. `balance/page.tsx` uses `series.rows` from `getBalanceSeries`.
2. Render a line for `runningBalance` keyed by `periodLabel(row.ref)`.
3. Render grouped bars for `income` and `expenses` using the same rows. Preserve nullable values and the configured reporting currency.
4. Keep starting/current cards and the detailed table; charts precede the table.

### Projects

1. `projects/page.tsx` uses `view.projects` from `getProjectsView`.
2. Render project status counts (active/completed) and a per-project funded-percent chart. Counts and percentages avoid summing unlike currencies.
3. Wrap `ProjectCard` items in a CSS grid: `grid-cols-1`, tablet `md:grid-cols-2`, desktop `lg:grid-cols-3` (or equivalent breakpoints matching the app’s responsive conventions).
4. Preserve project actions, priority ordering, saved/cost display, signed currency formatting, and projection text.

### Theme and navigation

1. `ThemeToggle` reads a validated `luther-theme` value after hydration, defaults to light, and toggles a `dark` class (or equivalent semantic root attribute) on `document.documentElement`.
2. Only `{ "theme": "light" | "dark" }` or a single theme string may be stored. No chart data, amounts, IDs, or query payloads enter storage.
3. The desktop app shell renders the toggle below `SideNav`; mobile can expose the same control through More only if needed, without adding another bottom-bar primary link.
4. `BottomNav` receives a fixed primary array of Overview, Expenses, and Plan. More opens the remaining five links as an accessible disclosure/menu, closes after selection, and exposes `aria-expanded`/`aria-controls`.
5. Recharts components use semantic CSS variables or theme-aware props for grid, tooltip, axis, and series colors. The chart container must have a textual title and a useful empty/unavailable message; tooltips are supplementary, not the only value representation.

## Validation and failure handling

- Query aggregation must use existing nullable conversion behavior. A `null` input must not be converted into zero merely to make a chart render.
- Empty datasets render the existing style of explicit empty state and preserve the page’s forms/tables.
- Mixed currencies use the configured reporting currency and current rates. Missing rates show “Unavailable until rates are set” (or equivalent) for the affected chart.
- Savings negative rows remain withdrawals; lifetime non-negative validation/actions are untouched.
- Chart labels must not rely on color alone. Provide legends/text labels, and preserve nearby tabular/detail data as the accessible source of exact values.
- Validate with `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`; use `npm run test:e2e` if the existing environment supports authenticated UI flows.
- Manually inspect 375px phone, tablet, and desktop widths for horizontal overflow, menu disclosure, chart legends/tooltips, form alignment, and project action reachability.
- Verify localStorage with valid, missing, invalid, and unavailable-storage cases; fallback must be light and non-blocking.

## Security, privacy, accessibility, and performance

- Keep `requireUserId()` and user-scoped query filters unchanged; no auth or authorization code is altered.
- Persist only the theme preference; never persist financial values or raw query results.
- Use semantic headings, labeled chart regions, keyboard-operable More and theme controls, visible focus styles, and `aria-expanded`/`aria-controls` for disclosure.
- Maintain contrast for text, controls, chart axes, grid lines, tooltip surfaces, badges, empty states, and focus rings in both themes.
- Use responsive containers and bounded chart heights; avoid rendering unbounded data or expensive new queries. Prefer deriving all chart series from already fetched page data.
- Do not introduce a Category type or Savings category migration. If investment-specific analytics become necessary, create a separate approved work item with explicit migration/backfill/privacy requirements.

## Dependencies

No new dependency is approved or needed. Use existing `recharts`, `lucide-react`, React client state, CSS/Tailwind, and existing query/action modules.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Add `Category.type` for expense/investment/other | Defer | Current request can be satisfied honestly with planned-allocation wording; migration/backfill would add scope and unsupported classification. |
| Add `SavingsContribution.category` | Defer | Current model cannot support truthful category charts; trend and signed contribution/withdrawal composition are useful without fake data. |
| Persist theme in a server profile/settings row | Reject | Adds schema/auth behavior and is unnecessary for the requested client preference. |
| Persist financial chart data in localStorage | Reject | Violates minimum-necessary privacy boundary and risks stale/sensitive browser data. |
| Render every mobile link in the bottom bar | Reject | Contradicts the three-primary-link requirement and creates poor phone ergonomics. |
| Add a charting dependency | Reject | Recharts is already approved and used by the app. |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `income-forms.tsx` field wrappers and responsive grid |
| R2 | Plan data/control flow, `plan/page.tsx`, bar/donut chart components, no schema migration |
| R3 | Savings data/control flow, `savings/page.tsx`, line/donut chart components, no category inference |
| R4 | Balance data/control flow, `balance/page.tsx`, line/bar chart components |
| R5 | Projects data/control flow, `projects/page.tsx`, `project-forms.tsx`, progress chart |
| R6 | Shared chart shells, page ordering, responsive and validation sections |
| R7 | Theme control, app shell, semantic CSS/Tailwind tokens, chart theming |
| R8 | `nav.tsx` mobile primary array and More disclosure |
| R9 | Currency/control-flow and nullable conversion requirements |
| R10 | Theme storage boundary, auth/query preservation, privacy controls |
