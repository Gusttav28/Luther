# Tasks: Dashboard UI Redesign

## Implementation checklist

- [ ] T1 — Add approved dependencies
  - Files: `package.json`, package lockfile
  - Requirements: R12, R2, R5, R7
  - Preconditions: human-approved spec; on branch `feature/dashboard-ui-redesign`
  - Expected evidence: `lucide-react` and `recharts` listed in dependencies; no other new runtime deps

- [ ] T2 — Restyle design tokens and shared component classes
  - Files: `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx` (if font stack needs update)
  - Requirements: R1, R3
  - Preconditions: T1 optional (tokens independent of icons)
  - Expected evidence: coral accent brand scale; body background light gray; `.card` / `.btn-*` / `.field-*` match soft white-card aesthetic

- [ ] T3 — Redesign app shell: narrow Lucide sidebar + mobile bottom nav
  - Files: `app/(app)/layout.tsx`, `components/nav.tsx`, optional `components/icons.ts`
  - Requirements: R2, R11, R13
  - Preconditions: T1 (lucide-react)
  - Expected evidence: icon-only desktop sidebar with active coral state; Lucide bottom nav; `aria-label`s; sign-out/avatar at bottom; no emoji/unicode nav icons

- [ ] T4 — Add read-only Overview dashboard query helpers
  - Files: `lib/queries/overview.ts` and/or `lib/queries/overview-dashboard.ts`; reuse expenses/projects queries as needed
  - Requirements: R4, R5, R6, R9
  - Preconditions: none (no schema change)
  - Expected evidence: helpers for prior-month MoM inputs, spent-by-category totals, cashflow series points; projects still from `getProjectsView`

- [ ] T5 — Build Overview analytics widgets
  - Files: `components/overview/*` (kpi-cards, cashflow-chart, spent-by-category, composition-donut, half-month-schedule, projects-progress), `app/(app)/page.tsx`
  - Requirements: R4, R5, R6, R7, R8, R9, R11
  - Preconditions: T1–T4
  - Expected evidence: Overview shows 5 KPIs, cashflow line, category segments, earned/spent/saved donut, H1/H2 schedule, project funded bars; empty states; responsive grid

- [ ] T6 — Apply visual system to remaining pages
  - Files: income/expenses/plan/savings/balance/projects/settings pages + forms; `app/login/page.tsx`
  - Requirements: R3, R1
  - Preconditions: T2
  - Expected evidence: shared cards/buttons/fields; no dominant old green-primary look

- [ ] T7 — Audit and fix CRC / money display
  - Files: `lib/money.ts`, `components/money.tsx`, any UI with hardcoded currency strings
  - Requirements: R10
  - Preconditions: none
  - Expected evidence: CRC always prefixed with ₡ via `formatMinor` / `Money`; no bare `$` for CRC totals; RatesNote may keep `$1` / `MX$1` source labels

- [ ] T8 — Update tests / selectors broken by UI structure changes
  - Files: `tests/**` as needed
  - Requirements: R11, R12, R13
  - Preconditions: T3–T7
  - Expected evidence: existing relevant unit/e2e tests pass or are intentionally updated; auth redirect still covered

## Verification

- [ ] TV1 — Run `npm run typecheck`
  - Covers: T1–T8
  - Expected result: no TypeScript errors

- [ ] TV2 — Run `npm run lint`
  - Covers: T1–T8
  - Expected result: lint clean (or only pre-existing unrelated issues documented)

- [ ] TV3 — Run `npm test`
  - Covers: money formatting (R10), any updated unit tests
  - Expected result: suite passes; CRC format assertions include ₡

- [ ] TV4 — Manual or Playwright smoke: Overview desktop + mobile
  - Covers: R1, R2, R4–R9, R11
  - Expected result: analytics layout renders; Lucide nav works; empty and seeded data states OK

- [ ] TV5 — Manual spot-check: other routes + login + CRC symbol
  - Covers: R3, R10, R13
  - Expected result: consistent visual system; ₡ on CRC amounts; login still gates app

- [ ] TV6 — Diff review: dependencies and schema
  - Covers: R12
  - Expected result: only lucide-react + recharts added; Prisma schema / auth / money math unchanged; no secrets committed

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R12, R2, R5, R7 |
| T2 | R1, R3 |
| T3 | R2, R11, R13 |
| T4 | R4, R5, R6, R9 |
| T5 | R4, R5, R6, R7, R8, R9, R11 |
| T6 | R3, R1 |
| T7 | R10 |
| T8 | R11, R12, R13 |
| TV1–TV6 | R1–R13 (verification) |

## Final scope check

- [ ] Every requirement maps to at least one task.
- [ ] Every changed file is listed in the design.
- [ ] No unrelated cleanup or unapproved behavior is included.
- [ ] Required tests/checks are defined.
- [ ] No schema, auth, or money-math changes in scope.
- [ ] Dependencies limited to lucide-react and recharts.
