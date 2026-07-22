# Requirements: Analytics screens, responsive navigation, and dark mode

- Work item: specs/analytics-screens-and-dark-mode/
- Outcome: Extend the existing photo-inspired analytics experience across the finance screens while preserving current financial semantics and making the app usable on phone and desktop.
- Branch: feature/analytics-screens-and-dark-mode
- Status: Specification
- Spec version: 2026-07-20

## Problem

Plan, Savings, Balance, and Projects currently expose useful data primarily as forms, tables, or cards. The owner needs an analytics-first presentation with charts near the top, an aligned Income form, responsive project and navigation layouts, and a persistent light/dark theme preference. The implementation must use existing data honestly, preserve CRC/USD behavior, and avoid exposing financial values through client persistence.

## In scope

- Income optional-label field alignment.
- Recharts-based summary visuals for Plan, Savings, Balance, and Projects.
- Responsive project-card grid and intentional phone-width layouts.
- Desktop theme toggle below the sidebar navigation, with client-side persisted theme preference.
- Mobile bottom navigation limited to Overview, Expenses, and Plan, plus a More control for remaining routes.
- Existing Recharts and lucide-react only; no new dependency.
- Accessibility, empty states, missing-rate states, contrast, and responsive validation.

## Out of scope

- Email ingestion, AI, bank integrations, authentication changes, or unrelated finance logic.
- Changes to money conversion semantics, currency choices, or reintroduction of MXN.
- Persisting financial values in localStorage or any other browser storage.
- Excel workbook validation; this remains unrelated pending work.
- Automatic classification of categories as investments without explicit source data.

## Definitions

- **Reporting currency**: The user’s configured CRC or USD display currency, with current conversion and missing-rate behavior unchanged.
- **Planned allocation**: A PlanCell amount. In this work item it is intentionally not labeled as an investment unless the existing data provides that meaning.
- **Theme preference**: Only `light` or `dark`, stored client-side; no financial payload is persisted.
- **More menu**: A mobile-only disclosure control exposing Income, Savings, Balance, Projects, and Settings.

## Requirements

### R1 — Align the Income form fields

- Trigger: A user opens the Add income form at any supported viewport.
- Preconditions: The Income route and existing form behavior are available.
- Actor/system: Income form UI.
- Expected response: Period, Amount, Currency, and optional Label use the same label/control vertical rhythm and grid alignment; validation and submit behavior remain unchanged.
- State change: None beyond the existing income action.
- Visible/resulting evidence: The Label label and input align with the other field labels and controls in the same row at desktop widths and stack cleanly at phone widths.
- Failure behavior: Existing validation errors remain associated with their fields and do not create a misaligned row.
- Acceptance evidence: Responsive visual check at phone and desktop widths plus existing income action tests/type checks.

### R2 — Add honest Category Plan analytics

- Trigger: A user opens Category plan for a selected year.
- Preconditions: Existing PlanCell, Category, and Expense data may be empty or partially convertible.
- Actor/system: Plan route and chart data query/components.
- Expected response: Before the matrix, show (a) monthly planned versus actual spending and (b) planned allocation composition by category using existing PlanCell data. Labels must say planned allocation/plan, not investment, unless source data supports that distinction.
- State change: None from viewing charts.
- Visible/resulting evidence: Charts use the selected year, configured reporting currency, and current matrix values; empty and missing-rate states are explicit.
- Failure behavior: Missing conversion rates produce an understandable unavailable state for affected values rather than fabricated zeros; no chart is rendered from invented investment amounts.
- Acceptance evidence: Query/data mapping review demonstrates PlanCell totals and expense totals are the only inputs; charts appear before the matrix.

### R3 — Add honest Savings analytics

- Trigger: A user opens Savings.
- Preconditions: Savings contributions may include positive contributions, negative withdrawals, notes, or no rows.
- Actor/system: Savings route and chart data query/components.
- Expected response: Near the top, show a contribution trend over time and a contribution-versus-withdrawal composition. Do not show category composition because the current model has no savings category field.
- State change: None from viewing charts.
- Visible/resulting evidence: Trend aggregates existing dated rows; composition separates positive and negative amounts and uses the configured reporting currency.
- Failure behavior: Empty, all-zero, or missing-rate datasets show an explicit empty/unavailable state; no category data is inferred from notes.
- Acceptance evidence: Mapping review and fixtures/manual checks cover positive, negative, mixed-currency, empty, and missing-rate data.

### R4 — Add Balance analytics

- Trigger: A user opens Balance.
- Preconditions: Existing balance series may contain no rows or missing conversion rates.
- Actor/system: Balance route and chart components.
- Expected response: Before the detailed table, show a running balance trend and an income-versus-expenses comparison by existing half-month periods (or equivalent monthly grouping when the series is aggregated).
- State change: None from viewing charts.
- Visible/resulting evidence: Charts use `getBalanceSeries` rows and preserve the same income, expenses, net, and running-balance values as the table.
- Failure behavior: Empty series and unavailable converted values are clearly represented without changing current balance calculations.
- Acceptance evidence: Chart/table values are compared for representative H1/H2 data and empty/missing-rate states.

### R5 — Add Projects analytics and responsive grid

- Trigger: A user opens Projects.
- Preconditions: Projects may be active, completed, or absent; existing projection rules remain authoritative.
- Actor/system: Projects route and project-card UI.
- Expected response: Show summary visuals at the top using existing project cost, saved, funded percentage, completion, priority, and projection data; render project cards in a responsive grid with 3 columns on desktop, 2 on tablet, and 1 on mobile.
- State change: None from viewing analytics/layout.
- Visible/resulting evidence: Existing actions, projection text, progress indicators, currency displays, and completed state remain readable and usable in every grid breakpoint.
- Failure behavior: No-project state remains clear; unavailable projections remain labeled as currently supported.
- Acceptance evidence: Responsive checks at desktop/tablet/phone widths and action smoke tests verify card controls remain operable.

### R6 — Keep analytics-first responsive page structure

- Trigger: Any in-scope page is rendered.
- Preconditions: The page has summary/chart data or an empty/unavailable state.
- Actor/system: Page layouts and shared chart components.
- Expected response: Charts and summary visuals appear near the top before detailed tables/forms; layouts collapse intentionally without horizontal overflow at phone widths.
- State change: None.
- Visible/resulting evidence: Plan charts precede the matrix; Savings and Balance charts precede forms/tables; Projects charts precede the form/cards.
- Failure behavior: Long labels, legends, tooltips, and controls remain reachable and do not clip critical information.
- Acceptance evidence: Manual or automated viewport checks cover each in-scope page.

### R7 — Provide persistent light and dark themes

- Trigger: An authenticated user changes the theme toggle below the desktop sidebar.
- Preconditions: User is in the app shell; browser storage may be unavailable or contain an invalid value.
- Actor/system: Client theme control and global styles/chart components.
- Expected response: Toggle switches between light and dark themes immediately; the preference is restored on later client loads.
- State change: Only the theme preference is written to localStorage (or equivalent client storage).
- Visible/resulting evidence: Shell, cards, inputs, tables, menus, empty states, focus indicators, and Recharts surfaces have readable contrast in both themes.
- Failure behavior: Invalid/missing storage falls back to light; storage failures do not block the app or affect financial data.
- Acceptance evidence: Theme toggle, reload persistence, storage-failure fallback, contrast, and chart rendering checks.

### R8 — Reduce mobile bottom navigation and add More

- Trigger: A user views the app at a phone-width viewport.
- Preconditions: Existing route links are available.
- Actor/system: Mobile navigation.
- Expected response: Bottom bar renders exactly Overview, Expenses, and Plan, plus a right-side More control. More opens the remaining Income, Savings, Balance, Projects, and Settings links.
- State change: More disclosure opens/closes locally; navigation follows existing routes.
- Visible/resulting evidence: Current route active state is clear, the menu is keyboard accessible, and all routes remain reachable without rendering all links in the bottom bar.
- Failure behavior: More closes on selection and does not trap focus or obscure page content.
- Acceptance evidence: DOM/render check confirms only three primary links in the bar; keyboard and phone-width interaction checks cover the menu.

### R9 — Preserve currency and financial semantics

- Trigger: Any chart, summary, layout, or theme change is rendered.
- Preconditions: Existing CRC/USD settings and rates are present or absent.
- Actor/system: All changed UI/query code.
- Expected response: Existing CRC (₡) and USD behavior, reporting-currency conversion, rate handling, and signed savings semantics remain unchanged; MXN is not introduced.
- State change: None to financial records or conversion rules.
- Visible/resulting evidence: Chart tooltips/labels use the configured currency and unavailable conversions remain unavailable.
- Failure behavior: No fallback silently changes currency or invents values.
- Acceptance evidence: Type/lint/tests plus targeted mixed-currency and missing-rate checks.

### R10 — Protect financial privacy and scope

- Trigger: Theme preference is changed or any in-scope page is used.
- Preconditions: Authenticated app behavior is unchanged.
- Actor/system: Client storage and server-rendered financial views.
- Expected response: No financial values, identifiers, or account data are written to browser storage; all financial queries remain scoped by the authenticated user; no auth/business-rule changes are made.
- State change: Theme key only may be persisted.
- Visible/resulting evidence: Storage inspection contains only the documented theme preference key/value.
- Failure behavior: Storage/API errors do not leak financial data or weaken authorization.
- Acceptance evidence: Code review confirms storage payload and user-scoped query boundaries; existing auth checks remain intact.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Income Label alignment | R1 |
| Plan charts and honest investment/plan mapping | R2, R6, R9 |
| Savings charts without fake categories | R3, R6, R9 |
| Balance trend and income/expense comparison | R4, R6, R9 |
| Projects charts and 3/2/1 responsive grid | R5, R6 |
| Charts before detail on every page | R6 |
| Light/dark toggle and persistence | R7, R10 |
| Three mobile links plus More | R8 |
| CRC/USD unchanged; no MXN | R9 |
| Security/privacy and scope boundaries | R9, R10 |
| Existing dependencies only | R6, R9 |

## Assumptions

- Existing Recharts and lucide-react remain approved dependencies.
- Existing query results are the authoritative financial inputs; chart aggregation may be added without changing persisted financial records.
- The owner accepts “planned allocation” as the bounded MVP wording for Plan data because the current Category model has no type metadata.

## Open questions

- No behavior-blocking question is required for this specification. A future work item may add explicit Category type metadata (expense, savings/investment, other allocation) if the owner needs investment-specific reporting; that migration is intentionally excluded here.
- Human approval of this package is required before implementation.
- Excel workbook validation remains unrelated pending work and is not a prerequisite for this UI work item.
