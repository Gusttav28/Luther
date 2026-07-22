# Requirements: Horizontal Lifetime Savings and Balance Layout

- Work item: specs/horizontal-savings-balance/
- Outcome: Present Lifetime Savings and Balance as full-width, horizontally composed analytics pages while preserving every existing financial, recording, editing, and history behavior.
- Branch: feature/horizontal-savings-balance
- Status: Specification
- Spec version: 2026-07-20

## Problem

Lifetime Savings and Balance are constrained by narrow page shells, so useful metrics and analytics feel vertically stacked and underuse the browser width. The owner needs both pages to follow the wider analytics composition already used by Expenses/Plan while keeping existing data, forms, tables, actions, and currency semantics unchanged.

## In scope

- Full-width responsive page containers for Savings and Balance.
- Horizontal top compositions for metrics, charts, and the Savings recording form.
- Detailed Savings history and Balance table/history below the top composition.
- Responsive desktop, tablet, and mobile layouts using existing CSS/Tailwind and chart components.
- Accessibility, explicit empty/unavailable states, and preservation of current auth and financial boundaries.

## Out of scope

- New application features, persisted fields, schema migrations, or query/business-rule changes.
- Changes to CRC/USD currency sets, reporting-currency conversion, rates, money formatting, savings sign semantics, balance calculations, authentication, or authorization.
- New dependencies or replacement chart libraries.
- Changes to the unrelated analytics work item or earlier expense-domain changes.
- Excel workbook validation; this remains unrelated pending work.

## Definitions

- **Full-width page**: The route content uses the available app content width with an intentional wide maximum, rather than the current `max-w-3xl` constraint.
- **Top composition**: The page title, summary metrics, rate note, charts, and Savings recording form arranged in responsive grid/grouped sections before detailed records.
- **Detailed records**: Savings contribution history with its existing edit/delete controls and Balance’s existing half-month table.
- **Unavailable state**: The existing explicit chart message shown when required conversion rates are missing; unavailable values must not be represented as fabricated zeroes.
- **Reporting currency**: The configured CRC or USD display currency and current repository conversion behavior.

## Requirements

### R1 — Use the full available content width

- Trigger: An authenticated user opens `/savings` or `/balance`.
- Preconditions: The existing authenticated app shell and route data are available.
- Actor/system: Savings and Balance page layouts.
- Expected response: Each page uses a wide responsive content container consistent with the existing Expenses/Plan analytics presentation, without the current narrow `max-w-3xl` constraint.
- State change: None.
- Visible/resulting evidence: Summary and chart regions can occupy the available desktop content width; content remains bounded by an intentional wide maximum and does not create horizontal page overflow.
- Failure behavior: If the viewport is narrow, the layout collapses according to R5 rather than forcing a desktop-width canvas.
- Acceptance evidence: Source inspection and viewport checks show a wide container on both routes and no unintended horizontal overflow.

### R2 — Compose Lifetime Savings horizontally near the top

- Trigger: A user views Lifetime Savings.
- Preconditions: Savings data may contain positive contributions, negative withdrawals, mixed CRC/USD rows, no rows, or missing conversion rates.
- Actor/system: Savings page composition and existing chart components.
- Expected response: The lifetime balance and monthly total summary cards, rate note, contribution/withdrawal trend, contribution-versus-withdrawal chart, and recording form are grouped into responsive horizontal sections before detailed history.
- State change: None from viewing the page; recording actions remain the existing actions.
- Visible/resulting evidence: On wide screens, cards and charts sit in side-by-side columns with balanced use of space; the form is part of the upper composition rather than being separated by the history list.
- Failure behavior: Empty or unavailable charts retain explicit messages while neighboring cards/form remain usable.
- Acceptance evidence: Layout review confirms the intended top-to-bottom order and horizontal desktop composition without changing chart inputs.

### R3 — Compose Balance horizontally near the top

- Trigger: A user views Balance.
- Preconditions: The existing balance series may be empty or contain income, expenses, net, and running-balance rows.
- Actor/system: Balance page composition and existing chart components.
- Expected response: Starting balance and current balance metrics, rate note, running-balance chart, and income-versus-expenses chart form a horizontal analytics composition before the detailed table.
- State change: None.
- Visible/resulting evidence: On wide screens, the key metrics and both charts appear in side-by-side responsive regions; the half-month table remains below them.
- Failure behavior: Empty chart states remain explicit and the starting-balance settings link remains available.
- Acceptance evidence: Source and viewport checks confirm charts precede the table and use the same `getBalanceSeries` values as before.

### R4 — Preserve recording, editing, deletion, and detailed history behavior

- Trigger: A user records, edits, deletes, or reviews a Savings row, or reviews Balance history.
- Preconditions: Existing forms, server actions, authenticated queries, and detail components are available.
- Actor/system: Existing Savings forms/history and Balance table.
- Expected response: Layout changes leave all existing controls, field names, validation, pending states, edit/delete actions, table columns, ordering, and settings link behavior intact.
- State change: Only the existing user-requested financial action may change persisted data; layout rendering itself changes no data.
- Visible/resulting evidence: Savings users can record positive contributions and negative withdrawals, edit or delete rows, and see the resulting history; Balance users can inspect the same period, income, expense, net, and running-balance details.
- Failure behavior: Existing validation and action errors remain associated with the relevant form/control and remain visible after responsive layout changes.
- Acceptance evidence: Existing action/type/test checks and manual smoke tests cover recording, editing, deletion, and table/history reachability.

### R5 — Provide intentional responsive breakpoints

- Trigger: Either page is rendered at desktop, tablet, or mobile width.
- Preconditions: The top composition contains cards, charts, notes, and, for Savings, a recording form.
- Actor/system: Page grids and existing responsive chart/form surfaces.
- Expected response: Desktop uses wide multi-column regions, tablet uses two columns where content remains legible, and mobile uses one column in a readable order.
- State change: None.
- Visible/resulting evidence: Charts resize through `ResponsiveContainer`; forms and controls remain usable; detailed records can scroll only within their existing appropriate container when necessary.
- Failure behavior: Long labels, chart legends, controls, and table content do not cause the page itself to overflow horizontally or clip essential information.
- Acceptance evidence: Manual inspection covers representative desktop, tablet, and 375px mobile widths.

### R6 — Keep currency and chart states honest

- Trigger: A page renders summary values or chart data.
- Preconditions: Reporting currency is CRC or USD; rates may be present or missing.
- Actor/system: Existing page queries, conversion helpers, `Money`, `RatesNote`, and chart components.
- Expected response: The redesign preserves current CRC/USD behavior, configured reporting-currency formatting, signed savings semantics, balance calculations, and existing missing-rate handling.
- State change: None caused by layout.
- Visible/resulting evidence: Chart titles/subtitles and tooltips continue to identify the configured reporting currency; missing conversion rates show an explicit unavailable message such as “Unavailable until rates are set.”; no missing value is silently changed to zero.
- Failure behavior: No fallback currency, new currency option, fabricated chart data, or altered financial total may be introduced.
- Acceptance evidence: Code review and edge-case checks cover empty, mixed-currency, and missing-rate data without schema or conversion changes.

### R7 — Preserve accessibility and usable visual structure

- Trigger: A user navigates or reads either page with keyboard navigation, assistive technology, or a narrow viewport.
- Preconditions: Existing headings, chart sections, forms, table semantics, labels, and focus styles are available.
- Actor/system: Page markup, existing chart components, controls, and responsive CSS.
- Expected response: Semantic page/section headings, labeled chart regions, form labels, table headers, keyboard-operable controls, visible focus states, readable contrast, and non-color-only chart legends remain intact.
- State change: None beyond existing form actions.
- Visible/resulting evidence: The heading order matches the top composition; chart `aria-label` regions and text states remain available; form errors and action states are perceivable; Balance table headers and row labels remain semantic.
- Failure behavior: Responsive reordering must not detach labels from controls, hide essential messages, or make a control unreachable.
- Acceptance evidence: Keyboard/focus, semantic markup, contrast, and screen-reader-oriented inspection at desktop and mobile widths.

### R8 — Keep scope, privacy, and dependencies unchanged

- Trigger: The implementation is prepared for review.
- Preconditions: Human approval of this specification is required before implementation.
- Actor/system: Implementer and reviewer.
- Expected response: Only presentation/layout files and, if strictly necessary, existing chart/CSS presentation surfaces are changed; authenticated user scoping and minimum-necessary financial data handling remain unchanged.
- State change: No financial data is persisted by layout code; no browser storage is introduced.
- Visible/resulting evidence: The diff contains no schema, auth, money-conversion, currency-set, dependency, unrelated analytics, or expense-domain changes.
- Failure behavior: Any requested change outside this boundary is rejected as scope creep and requires a separate approved work item.
- Acceptance evidence: Diff review confirms no new dependency, no secrets/personal financial data, no Excel validation implementation, and no unrelated work.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Full available content width | R1 |
| Horizontal Lifetime Savings composition | R2 |
| Horizontal Balance composition | R3 |
| Preserve Savings recording/editing/history | R4 |
| Preserve Balance table/history behavior | R3, R4 |
| Desktop/tablet/mobile responsiveness | R5 |
| Honest CRC/USD and unavailable chart states | R6 |
| Accessibility | R7 |
| No financial logic/schema/auth/dependency changes | R6, R8 |
| Exclude unrelated analytics and expense work | R8 |
| Excel workbook validation remains pending | R8 |

## Assumptions

- The existing app shell supplies the available content width and its established wide-container convention is acceptable.
- Existing Recharts components already provide the required responsive chart behavior; no chart API redesign is needed.
- Existing Savings and Balance queries remain the authoritative sources for all displayed values.

## Open questions

- No behavior-blocking question is required for this specification.
- Human approval of this package is required before implementation.
- Excel workbook validation is unrelated pending work and is not a prerequisite for this layout work.
