# Review: Dashboard UI Redesign

- Work item: `specs/dashboard-ui-redesign/`
- Branch: `feature/dashboard-ui-redesign` (7 commits over `feature/finance-app-mvp`, HEAD `e1c6fac`, clean working tree)
- Approved spec: `specs/dashboard-ui-redesign/{requirements,design,tasks}.md`, version 2026-07-20, human-approved (owner "GO" 2026-07-20)
- Implementer progress: `progress/current.md` (handoff **IMPLEMENTED**, 2026-07-20)
- Review start: 2026-07-20, independent Reviewer agent (did not implement this work)
- Final verdict: **APPROVED**

## Files inspected

Spec package and progress log in full; then source verification (read, not trusted from the log):

- Tokens / shell: `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/(app)/layout.tsx`, `next.config.ts`
- Nav / icons: `components/nav.tsx`, `components/icons.ts`, `components/month-picker.tsx`
- Overview: `app/(app)/page.tsx`, `lib/queries/overview-dashboard.ts`, `components/overview/{kpi-cards,cashflow-chart,spent-by-category,composition-donut,half-month-schedule,projects-progress,overview-refresh}.tsx`
- Money (unchanged audit): `lib/money.ts`, `components/money.tsx`
- Other pages: `app/login/page.tsx`, `app/(app)/{income,expenses,plan,savings,balance,projects,settings}/page.tsx`
- Dependencies: `package.json` (+ lockfile diff vs base)
- Tests: `tests/unit/overview-dashboard.test.ts`, `tests/unit/money.test.ts` (CRC `₡`), `tests/e2e/smoke.spec.ts`, `tests/e2e/responsive.spec.ts`
- Hygiene: `.gitignore` / `git check-ignore`, tracked-file secret scan; confirmed no `prisma/`, `lib/auth*`, `middleware.ts`, or money-math diffs vs `feature/finance-app-mvp`

## Commands run

All commands re-run by the Reviewer on this machine (not copied from the implementer's log):

| Command | Result |
| --- | --- |
| `git status` / `git log --oneline feature/finance-app-mvp..HEAD` | On `feature/dashboard-ui-redesign`, clean tree, 7 commits |
| `npm run typecheck` | Pass, exit 0 |
| `npm run lint` | Pass, exit 0 |
| `npm test` (Vitest) | **59/59 tests passed** (6 files) |
| `rm -rf .next && npm run build` | Production build succeeded (jose Edge Runtime warnings only — pre-existing next-auth); Overview ~120 kB page chunk from recharts |
| `npx playwright test` | **6/6 e2e passed** (3 smoke incl. auth gate + login/logout; 3 responsive at 360 px / 1280 px) |
| `git diff … -- package.json` | Only `lucide-react` + `recharts` added to runtime deps |
| Schema/auth/money path review | No changes under `prisma/`, `lib/auth*`, `middleware.ts`, `lib/money.ts`, `components/money.tsx` |
| `git check-ignore` / secret grep | `.env` / `*.db` ignored; no secrets in tracked source |

Note: An initial parallel `build` + Playwright run corrupted `.next` and produced a false 404/`Html` build failure and flaky e2e. After a clean rebuild and sequential e2e re-run, both are green.

## Requirement verdicts

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| R1 — App shell matches reference aesthetic | **PASS** | Coral `brand` scale in `tailwind.config.ts:8–20` (`#d95a45` family); `surface` `#F5F6F8`; soft `shadow-card` / `rounded-card` 12px; `globals.css` restyles `.card` / `.btn-*` / `.field-*`; Geist via `app/layout.tsx`. No purple-primary or prior green-primary brand remnants (`rg` clean). |
| R2 — Narrow Lucide sidebar + bottom nav | **PASS** | `app/(app)/layout.tsx`: 72px icon sidebar, Luther mark, avatar + Lucide `LogOut` with `aria-label`. `components/icons.ts` maps all 8 routes to Lucide outline icons; `components/nav.tsx` icon-only desktop (`aria-label` + `title`) and labeled mobile bottom nav; active coral (`bg-brand-500` / `text-brand-600`). No emoji/unicode nav icons. |
| R3 — Consistent visual system on all pages | **PASS** | Login + income/expenses/plan/savings/balance/projects/settings use `page-title`, shared `.card` / coral buttons; savings/balance banners restyled to light cards. Spot-check confirms no dominant old green-primary look. |
| R4 — Overview header and KPI row | **PASS** | Header "Overview" + month picker + `OverviewRefresh` (`router.refresh()`). Five KPIs: Earned, Spent, Saved, Remaining, Lifetime savings (`app/(app)/page.tsx:60–70`, `kpi-cards.tsx`). MoM on four monthly KPIs via `computeMomDeltas`; lifetime omits % (design practical rule). Null amounts still use `Money` → "Set exchange rate". Unit tests cover MoM / prior-month. |
| R5 — Cashflow chart card | **PASS** | `getCashflowSeries` builds Start / H1 / End cumulative earned/spent/net; `CashflowChart` uses recharts `LineChart` (coral Net + muted Spent); empty state when series all zero/null. |
| R6 — Spent by category card | **PASS** | `getSpentByCategory` aggregates by category with shares; CSS segmented bar + pills with `Money` and %; empty state when no expenses. |
| R7 — Composition donut card | **PASS** | Recharts donut of \|earned\|/\|spent\|/\|saved\|; center labeled **Earned** with `formatMinor` or "—"; empty state when total ≤ 0; no negative slices; coral/green palette (not purple). |
| R8 — Half-month schedule card | **PASS** | H1 1st–15th / H2 16th–end from `overview.perPeriod`; coral highlight for current half-month when viewing current calendar month; earned/spent/saved via `Money`. |
| R9 — Projects progress bars | **PASS** | Active projects (`!completedAt`) from `getProjectsView` (already `orderBy: priority`); coral CSS bars capped at 100%; `—` when `fundedPercent` null; empty state; link to `/projects`. |
| R10 — CRC colón on money displays | **PASS** | `CURRENCY_SYMBOLS.CRC = "₡"` unchanged (`lib/money.ts:24–27`); `formatMinor` unit test asserts `₡5,000.00`; `RatesNote` correctly keeps `$1` / `MX$1` as source labels; no CRC misuse found; charts use `formatMinor` in tooltips. |
| R11 — Responsive analytics layout | **PASS** | Overview grids: KPI 2/3/5 cols; cashflow+category `lg:grid-cols-5`; donut+schedule+projects `lg:grid-cols-3`; shell sidebar/`BottomNav` breakpoints. Playwright responsive suite (360 + 1280) re-run, passed. |
| R12 — Approved deps only; no schema/auth/money-math | **PASS** | Runtime deps added: `lucide-react`, `recharts` only. Prisma schema, auth, middleware, and money math untouched in branch diff. No secrets committed. Recharts used for line + donut as designed. |
| R13 — A11y and privacy posture | **PASS** | Icon-only controls have `aria-label`s; charts have visible titles/empty states; MoM includes ↑/↓ text; `requireUserId` / layout `auth()` redirect unchanged; e2e confirms logged-out redirect; no financial `console.log` dumps in app code (only seed completion message). |

## Design verdicts

- Locked domain mappings (KPI row, cashflow, spent-by-category, Earned/Spent/Saved donut with Earned center, H1/H2 schedule, projects funded %) match the implemented Overview composition.
- Visual system (coral brand, surface background, soft white cards, Geist sans) matches the design token direction.
- File plan honored; extras (`overview-refresh.tsx`, `next.config.ts` `devIndicators.position`) are within "exact file split may vary" / shell polish and do not expand scope.
- Read-only aggregation helpers only; no schema or money-math changes.
- Dependencies limited to the two approved packages; recharts used for line + donut; category/project bars stay CSS.

## Task/checkpoint verdicts

- T1–T8: verified done (deps, tokens, shell/nav, query helpers, Overview widgets, page retokening, CRC audit, tests).
- TV1 typecheck: **re-run, clean**. TV2 lint: **re-run, clean**. TV3 unit: **re-run, 59/59**. TV4/TV5 e2e (responsive + smoke): **re-run, 6/6**. TV6 deps/schema: **re-run, pass**. Production build: **re-run after clean `.next`, succeeds**.

## Findings

No blocking findings. Non-blocking observations (no correction required):

### Info — KPI lifetime label slightly shortened

- Requirement/design/task: R4
- File: `app/(app)/page.tsx`
- Lines: 65–69
- Observed: Card label is "Lifetime savings" with subtitle "Lifetime balance" rather than the full phrase "Lifetime savings balance".
- Expected: Spec example wording "Lifetime savings balance".
- Evidence: Semantics and data source (`lifetimeSavingsBalance`) are correct; MoM correctly omitted on lifetime.
- Required correction: None.

### Info — Category segment min-width can slightly inflate tiny shares

- Requirement/design/task: R6
- File: `components/overview/spent-by-category.tsx`
- Lines: 49–50
- Observed: Segment width uses `Math.max(cat.share * 100, … 2)` so very small categories get a 2% visual floor; listed percentages remain exact.
- Expected: Shares sum to ~100% of categorized spend (visual bar may not be pixel-perfect).
- Evidence: Pill percentages use true `share`; empty/null handling intact.
- Required correction: None.

### Info — `next.config.ts` polish not listed in design file table

- Requirement/design/task: R2 / shell UX
- File: `next.config.ts`
- Lines: 6–7
- Observed: `devIndicators.position: "bottom-right"` to avoid covering sidebar sign-out.
- Expected: Design file table did not list this path; change is presentation-only and harmless.
- Evidence: Progress log documents the rationale.
- Required correction: None.

## Cleanup signal

- Durable spec package: `specs/dashboard-ui-redesign/`
- Durable progress evidence: `progress/current.md`
- Durable review report: `reviews/dashboard-ui-redesign/review.md`
- Scratch context to reset: none required for this work item
