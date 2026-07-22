# Tasks: Fixed Sidebar and Complete Dark Theme

## Implementation checklist

- [ ] T1 — Implement the desktop shell scroll contract with a stable fixed/stable sidebar and one independently scrolling main content region.
  - Files: `app/(app)/layout.tsx`
  - Requirements: R1, R2, R7, R8
  - Preconditions: Human approval of this specification; existing authenticated layout and mobile navigation remain the source of truth.
  - Expected evidence: At `md` and above the sidebar remains visible for long pages, main content owns the intended vertical scroll, no document/sidebar double-scrollbar appears, and below `md` normal mobile flow and bottom-nav clearance remain intact.

- [ ] T2 — Normalize desktop/mobile navigation and shell interaction states for both themes.
  - Files: `components/nav.tsx`, `components/theme-toggle.tsx`
  - Requirements: R2, R3, R4, R6, R7
  - Preconditions: T1 establishes the shell positioning and breakpoint contract.
  - Expected evidence: Desktop links, active/hover states, theme toggle, mobile bottom links, More disclosure, menu surface, keyboard focus, and labels remain readable and usable in both themes; `luther-theme` remains the only storage key.

- [ ] T3 — Establish complete semantic light/dark tokens and shared surface/control styles without changing the light baseline.
  - Files: `app/globals.css`, `tailwind.config.ts`
  - Requirements: R3, R4, R5, R7, R8
  - Preconditions: Existing `darkMode: "class"` and current light styles are reviewed before editing.
  - Expected evidence: Deliberate tokens/classes cover page and shell surfaces, cards, panels, borders/dividers, text/muted text, labels, links, inputs/selects, buttons, errors, tables, empty states, hover, disabled, and focus rings; no dependency or financial behavior changes occur.

- [ ] T4 — Complete theme-aware chart surfaces and chart interaction readability.
  - Files: `components/charts/bar-chart.tsx`, `components/charts/line-chart.tsx`, `components/charts/donut-chart.tsx`, `components/charts/project-progress-chart.tsx`
  - Requirements: R3, R4, R5, R7, R8
  - Preconditions: T3 establishes chart variables and semantic surface colors.
  - Expected evidence: Axes, grids, legends, tooltips, series, center labels, empty/unavailable panels, and chart containers are readable in light/dark themes, responsive at narrow widths, and do not change input values or currency formatting.

- [ ] T5 — Audit and update route-level pages and shared form/card components that bypass the semantic theme contract.
  - Files: `app/(app)/page.tsx`, `app/(app)/expenses/page.tsx`, `app/(app)/expenses/expense-forms.tsx`, `app/(app)/plan/page.tsx`, `app/(app)/plan/plan-forms.tsx`, `app/(app)/savings/page.tsx`, `app/(app)/savings/savings-forms.tsx`, `app/(app)/balance/page.tsx`, `app/(app)/projects/page.tsx`, `app/(app)/projects/project-forms.tsx`, `app/(app)/income/page.tsx`, `app/(app)/income/income-forms.tsx`, `app/(app)/settings/page.tsx`, `app/(app)/settings/settings-forms.tsx`, `components/category-manager.tsx`, `components/category-picker.tsx`, `components/month-picker.tsx`, `components/money.tsx`, `components/overview/cashflow-chart.tsx`, `components/overview/composition-donut.tsx`, `components/overview/half-month-schedule.tsx`, `components/overview/kpi-cards.tsx`, `components/overview/overview-refresh.tsx`, `components/overview/projects-progress.tsx`, `components/overview/spent-by-category.tsx`
  - Requirements: R3, R4, R5, R7, R8
  - Preconditions: T3 and T4 establish reusable styles; existing route actions and query data remain unchanged.
  - Expected evidence: Cards, panels, forms, selects, buttons, links, table headers/rows/sticky cells, labels, muted text, empty/error states, and controls are deliberately styled in dark mode and light mode remains unchanged; Plan’s wide matrix uses intentional local overflow only.

- [ ] T6 — Verify responsive layout, scroll ownership, focus behavior, and chart/table overflow across representative routes.
  - Files: All files changed in T1–T5; no new application files.
  - Requirements: R1, R2, R4, R5, R7
  - Preconditions: T1–T5 are complete and the app can render authenticated routes.
  - Expected evidence: Checks cover Overview, Expenses, Plan, Savings, Balance, and Projects at 375px, tablet, and desktop widths; sidebar persistence, one desktop scroll path, mobile More behavior, no horizontal overflow, focus-visible states, table handling, chart legends/tooltips, and content clearance are documented.

- [ ] T7 — Confirm protected boundaries and exclude unrelated work from the implementation diff.
  - Files: `prisma/schema.prisma` (must remain unchanged), auth modules, query/action modules, `package.json` (must remain unchanged), and all final changed files.
  - Requirements: R6, R8
  - Preconditions: Completed implementation diff is available for review.
  - Expected evidence: No auth, schema, query, action, currency-set, money-conversion, financial-behavior, or dependency changes; browser storage contains only the validated theme preference; Excel validation remains untouched and recorded as pending unrelated work.

## Verification

- [ ] TV1 — Run `npm run typecheck`.
  - Covers: R1–R8, shell server/client boundaries, Tailwind class usage, navigation, chart props, and existing route types.
  - Expected result: TypeScript completes successfully with no new errors.

- [ ] TV2 — Run `npm run lint`.
  - Covers: R1–R8 and all changed TypeScript/TSX/CSS integration points.
  - Expected result: No new lint errors.

- [ ] TV3 — Run `npm run test`.
  - Covers: R8 and regression protection for existing financial formatting, query/action, conversion, and route logic.
  - Expected result: Existing unit tests pass without financial behavior changes.

- [ ] TV4 — Run `npm run build`.
  - Covers: R1–R8, production CSS/Tailwind compilation, authenticated shell server/client boundaries, chart imports, and route rendering.
  - Expected result: Production build succeeds.

- [ ] TV5 — Run the repository’s browser/e2e command (for example `npm run test:e2e`) when the local authenticated Playwright runner is available.
  - Covers: R1, R2, R3, R4, R5, R6, R7.
  - Expected result: Desktop long-page scrolling keeps the sidebar visible; mobile navigation/More works; theme toggle persists only the preference; representative forms, charts, empty states, and controls remain usable.

- [ ] TV6 — If the local Playwright runner remains blocked, document the blocker and perform manual authenticated viewport checks.
  - Covers: R1, R2, R3, R4, R5, R7.
  - Expected result: Inspect Overview, Expenses, Plan, Savings, Balance, and Projects at 375px, tablet, and desktop widths in both themes; record sidebar persistence, one desktop scrollbar, normal mobile scrolling, no horizontal overflow, focus/hover/active/disabled/error states, chart readability, and table behavior.

- [ ] TV7 — Exercise theme preference and browser-storage edge cases.
  - Covers: R3, R4, R6.
  - Expected result: Light/dark toggle applies immediately; valid value survives reload; missing/invalid value falls back to light; storage exceptions do not block rendering; storage contains no financial value, identifier, query payload, or chart data.

- [ ] TV8 — Perform an accessibility and contrast review.
  - Covers: R3, R4, R5, R7.
  - Expected result: WCAG AA target is met for normal text and applicable controls; focus indicators are visible; chart meaning is not color-only; legends/tooltips/empty states and controls remain readable in both themes.

- [ ] TV9 — Review the final diff and dependency/data boundaries.
  - Covers: R6, R8.
  - Expected result: Only approved UI/layout/theme files change; no auth/schema/currency/conversion/financial behavior/package changes appear; Excel workbook validation remains an unrelated pending item.

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R2, R7, R8 |
| T2 | R2, R3, R4, R6, R7 |
| T3 | R3, R4, R5, R7, R8 |
| T4 | R3, R4, R5, R7, R8 |
| T5 | R3, R4, R5, R7, R8 |
| T6 | R1, R2, R4, R5, R7 |
| T7 | R6, R8 |
| TV1 | R1–R8 |
| TV2 | R1–R8 |
| TV3 | R8 |
| TV4 | R1–R8 |
| TV5 | R1–R7 |
| TV6 | R1, R2, R3, R4, R5, R7 |
| TV7 | R3, R4, R6 |
| TV8 | R3, R4, R5, R7 |
| TV9 | R6, R8 |

## Final scope check

- [ ] Every requirement maps to at least one implementation task and verification check.
- [ ] Every expected changed file is listed in the design; no new application file is required.
- [ ] No unrelated cleanup, Excel validation, auth, schema, currency, conversion, financial behavior, or dependency change is included.
- [ ] Required typecheck, lint, unit-test, production-build, browser/e2e-or-documented-manual, storage, accessibility, contrast, responsive, and boundary checks are defined.
- [ ] Human owner approval is recorded before the Implementer begins.
