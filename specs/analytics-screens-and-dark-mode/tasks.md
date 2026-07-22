# Tasks: Analytics screens, responsive navigation, and dark mode

## Implementation checklist

- [ ] T1 — Align the Add income form’s optional Label field with the existing field rhythm and phone stacking.
  - Files: `app/(app)/income/income-forms.tsx`, `app/(app)/income/page.tsx` if composition adjustment is required.
  - Requirements: R1, R6, R9.
  - Preconditions: Human approval of this specification.
  - Expected evidence: Label and control align with Period, Amount, and Currency; existing field names, actions, validation, and CRC/USD options are unchanged.

- [ ] T2 — Add shared theme-aware line, grouped-bar, and project-progress chart components.
  - Files: `components/charts/line-chart.tsx`, `components/charts/bar-chart.tsx`, `components/charts/project-progress-chart.tsx`, `components/charts/donut-chart.tsx`.
  - Requirements: R2, R3, R4, R5, R6, R7.
  - Preconditions: Recharts remains the approved chart dependency.
  - Expected evidence: Components expose titles/legends, responsive containers, readable tooltips, explicit empty/unavailable states, semantic theme colors, and no fabricated values.

- [ ] T3 — Add Category Plan analytics from existing matrix data.
  - Files: `app/(app)/plan/page.tsx`; only extend `lib/queries/plan.ts` if a server-side aggregate is needed without changing persisted schema.
  - Requirements: R2, R6, R9.
  - Preconditions: `getPlanMatrix` remains the source of PlanCell and actual expense values.
  - Expected evidence: Monthly planned-vs-actual bars and planned allocation composition render before the form/matrix; labels do not claim investment classification; nullable conversion behavior is preserved.

- [ ] T4 — Add Savings trend and signed contribution/withdrawal composition.
  - Files: `app/(app)/savings/page.tsx`; only extend `lib/queries/savings.ts` if aggregation cannot remain a pure derivation of returned rows.
  - Requirements: R3, R6, R9.
  - Preconditions: Existing `SavingsRow` signed amount semantics remain unchanged.
  - Expected evidence: Positive and negative rows are mapped honestly by date and reporting currency; no category chart or note-based inference is introduced; form/history remain available after charts.

- [ ] T5 — Add Balance trend and income-versus-expenses analytics.
  - Files: `app/(app)/balance/page.tsx`.
  - Requirements: R4, R6, R9.
  - Preconditions: `getBalanceSeries` remains authoritative for rows and nullable conversions.
  - Expected evidence: Running-balance line and income/expense comparison match table rows and appear before the table.

- [ ] T6 — Add Project summary visuals and responsive 3/2/1 card grid.
  - Files: `app/(app)/projects/page.tsx`, `app/(app)/projects/project-forms.tsx`.
  - Requirements: R5, R6, R9.
  - Preconditions: Existing `ProjectView` projection and action contracts remain unchanged.
  - Expected evidence: Project status/funding visuals derive only from existing counts/percentages; cards use one column on mobile, two on tablet, three on desktop; all actions and projections remain operable.

- [ ] T7 — Implement the client theme preference and integrate the desktop sidebar toggle.
  - Files: `components/theme-toggle.tsx`, `app/(app)/layout.tsx`, `app/globals.css`, `tailwind.config.ts`.
  - Requirements: R7, R10.
  - Preconditions: No server profile or authentication change is needed.
  - Expected evidence: Light/dark toggle works immediately, preference reloads, invalid/storage-failure cases fall back safely, and storage contains only the theme preference.

- [ ] T8 — Make charts and shared visual surfaces readable in both themes.
  - Files: `components/charts/donut-chart.tsx`, `components/charts/line-chart.tsx`, `components/charts/bar-chart.tsx`, `components/charts/project-progress-chart.tsx`, `app/globals.css`, `tailwind.config.ts`.
  - Requirements: R2, R3, R4, R5, R6, R7, R9.
  - Preconditions: T2 and T7 establish shared chart/theme contracts.
  - Expected evidence: Axis labels, grid, tooltip, legends, cards, inputs, tables, focus rings, empty states, and currency text pass contrast/readability checks without changing currency semantics.

- [ ] T9 — Restrict mobile bottom navigation and add the accessible More disclosure.
  - Files: `components/nav.tsx`, `components/icons.ts` if an existing icon export is insufficient.
  - Requirements: R7, R8.
  - Preconditions: Existing `NAV_LINKS` remains the desktop source of truth.
  - Expected evidence: Mobile bottom bar contains only Overview, Expenses, Plan, and More; More exposes Income, Savings, Balance, Projects, Settings, supports keyboard interaction, has active state, and closes after navigation. Desktop retains all links.

- [ ] T10 — Confirm no schema migration or dependency change is included.
  - Files: `prisma/schema.prisma` (must remain unchanged), `package.json` (must remain unchanged).
  - Requirements: R2, R3, R9, R10.
  - Preconditions: Review the completed implementation diff.
  - Expected evidence: No Category/Savings schema fields are added, no MXN or conversion changes appear, and no dependency is added.

## Verification

- [ ] TV1 — Run `npm run lint`.
  - Covers: R1–R10 and all changed TypeScript/CSS integration points.
  - Expected result: No new lint errors.

- [ ] TV2 — Run `npm run typecheck`.
  - Covers: Chart props, query-derived nullable values, navigation disclosure, and theme client boundary.
  - Expected result: TypeScript completes successfully.

- [ ] TV3 — Run `npm run test`.
  - Covers: Existing money, query, action, and projection behavior remains unchanged.
  - Expected result: Existing test suite passes.

- [ ] TV4 — Run `npm run build`.
  - Covers: Server/client boundaries, dynamic authenticated routes, CSS/Tailwind compilation, and Recharts imports.
  - Expected result: Production build succeeds.

- [ ] TV5 — Run `npm run test:e2e` when the authenticated test environment is available.
  - Covers: R1, R5, R7, R8 and route-level rendering/action reachability.
  - Expected result: Existing flows pass; theme and More interactions are keyboard and phone-width usable.

- [ ] TV6 — Perform responsive and accessibility inspection at 375px, tablet, and desktop widths.
  - Covers: R1, R2, R3, R4, R5, R6, R7, R8.
  - Expected result: Charts precede details, no horizontal overflow occurs, projects use 1/2/3 columns at the defined breakpoints, controls have visible focus, and chart information is not conveyed by color alone.

- [ ] TV7 — Exercise data edge cases with representative fixtures/manual data.
  - Covers: R2, R3, R4, R5, R9.
  - Expected result: Empty datasets, mixed CRC/USD, missing rates, negative savings withdrawals, completed projects, and unavailable projections show explicit states without invented values.

- [ ] TV8 — Inspect browser storage after theme changes and reload.
  - Covers: R7, R10.
  - Expected result: Only the documented light/dark preference is stored; no financial amount, identifier, or chart payload is present; invalid/unavailable storage does not block rendering.

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R6, R9 |
| T2 | R2, R3, R4, R5, R6, R7 |
| T3 | R2, R6, R9 |
| T4 | R3, R6, R9 |
| T5 | R4, R6, R9 |
| T6 | R5, R6, R9 |
| T7 | R7, R10 |
| T8 | R2, R3, R4, R5, R6, R7, R9 |
| T9 | R7, R8 |
| T10 | R2, R3, R9, R10 |
| TV1–TV8 | R1–R10 as listed above |

## Final scope check

- [ ] Every requirement maps to at least one implementation task and verification check.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup, Excel validation, schema migration, dependency, authentication, or money-conversion change is included.
- [ ] Required tests/checks are defined.
- [ ] Human owner approval is recorded before the Implementer begins.
