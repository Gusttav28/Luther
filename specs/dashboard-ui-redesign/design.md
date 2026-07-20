# Design: Dashboard UI Redesign

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13

## Goals

- Restyle the Luther shell and shared UI tokens to the Revenue Analytics reference aesthetic (R1, R3).
- Replace emoji/unicode navigation with Lucide outline icons in a narrow desktop sidebar and mobile bottom nav (R2, R11).
- Rebuild Overview as an analytics dashboard wired to real finance data with locked domain mappings (R4–R9).
- Guarantee CRC amounts display with ₡ (R10).
- Add only approved dependencies: lucide-react; recharts for line/donut/(optional) bars (R12).
- Preserve auth, schema, and money math; keep financial pages private (R12, R13).

## Current system observations

- Shell: `app/(app)/layout.tsx` — wide labeled sidebar (`w-56`), green `brand-*` tokens, emoji/unicode icons in `components/nav.tsx`, mobile bottom nav with 8 emoji items.
- Tokens: `app/globals.css` (`.card`, `.btn-*`, `.field-*`) and `tailwind.config.ts` green brand scale.
- Overview: `app/(app)/page.tsx` — 4 KPI cards + lifetime savings banner + H1/H2 table; uses `getOverview`, `Money`, `MonthPicker`.
- Money: `lib/money.ts` already maps `CRC → ₡`, `USD → $`, `MXN → MX$`; `components/money.tsx` `RatesNote` correctly uses `$1` / `MX$1` as source labels.
- Data available without schema changes:
  - `getOverview` → earned, spent, saved, remaining, perPeriod H1/H2, lifetimeSavingsBalance.
  - Expenses + categories → spent-by-category for a month.
  - `getProjectsView` → fundedPercent per project.
  - Prior month → second `getOverview` call for MoM deltas.
- No chart library today; no lucide-react.

## Locked domain mappings (reference → Luther)

| Reference widget | Luther mapping |
| --- | --- |
| KPI row (5) | Earned, Spent, Saved (month lifetime contributions), Remaining, Lifetime savings balance |
| Cashflow line chart | Selected-month cashflow series from income vs expenses (see Data flow) |
| Revenue by category | Spent by expense category (selected month) |
| Donut | Composition of Earned / Spent / Saved for selected month; center label **Earned** when earned ≠ null, else "—" |
| Sales calendar / meetings | Half-month schedule: H1 1st–15th, H2 16th–end with earned/spent/saved |
| Regional horizontal bars | Active projects funded % |

## Visual system

### Color tokens (replace green-primary brand)

| Token role | Direction |
| --- | --- |
| Page background | Light gray / off-white (e.g. `#F5F6F8`–`#F8F9FB`) |
| Card surface | `#FFFFFF`, soft shadow, ~12px radius, minimal/no harsh border |
| Accent (coral) | Muted coral/terracotta for active nav, primary buttons, chart strokes, bar fills (not purple) |
| Positive delta | Soft green |
| Negative delta | Coral/red |
| Text / labels | Neutral gray scale |

Update `tailwind.config.ts` `brand` scale to the coral family (or introduce `accent` and retarget components). Update `globals.css` component classes accordingly.

### Typography

- Clean modern sans-serif already available via Next/Tailwind stack (prefer Geist or existing app font if present; avoid decorative serif).
- KPI values: large, bold, tabular-nums.
- Card titles: medium weight, calm hierarchy like the reference header.

### Icons

- Dependency: **lucide-react** (approved).
- Suggested mapping (implementer may adjust names within Lucide):

| Route | Lucide icon |
| --- | --- |
| `/` Overview | `LayoutDashboard` |
| `/income` | `ArrowDownToLine` |
| `/expenses` | `ArrowUpFromLine` |
| `/plan` | `Grid2x2` |
| `/savings` | `PiggyBank` or `Landmark` |
| `/balance` | `Scale` |
| `/projects` | `Target` |
| `/settings` | `Settings` |
| Sign out / user | `LogOut` + avatar initial circle |

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `package.json` / lockfile | Add `lucide-react`; add `recharts` | R12, R2, R5, R7, R9 |
| `tailwind.config.ts` | Coral brand/accent palette; optional shadow/radius tokens | R1, R3 |
| `app/globals.css` | Restyle `.card`, `.btn-*`, `.field-*`, body background | R1, R3 |
| `app/layout.tsx` | Font/metadata tweaks if needed for sans stack | R1 |
| `app/(app)/layout.tsx` | Narrow icon sidebar shell; avatar/sign-out; mobile header polish | R1, R2, R11, R13 |
| `components/nav.tsx` | Lucide icons; icon-only desktop + labeled mobile; a11y names | R2, R11, R13 |
| `app/(app)/page.tsx` | Full analytics Overview composition | R4–R9, R11 |
| `components/money.tsx` | Ensure CRC display path unchanged except styling; audit RatesNote | R10 |
| `lib/money.ts` | Only if audit finds CRC symbol bugs; keep symbols as-is if correct | R10 |
| `app/(app)/income/page.tsx` (+ forms) | Apply shared visual tokens | R3 |
| `app/(app)/expenses/page.tsx` (+ forms) | Apply shared visual tokens | R3 |
| `app/(app)/plan/page.tsx` (+ forms) | Apply shared visual tokens | R3 |
| `app/(app)/savings/page.tsx` (+ forms) | Apply shared visual tokens | R3 |
| `app/(app)/balance/page.tsx` | Apply shared visual tokens | R3 |
| `app/(app)/projects/page.tsx` (+ forms) | Apply shared visual tokens | R3 |
| `app/(app)/settings/page.tsx` (+ forms) | Apply shared visual tokens | R3 |
| `app/login/page.tsx` | Match palette/cards/buttons | R3 |
| Existing tests touching UI copy/selectors | Update selectors if class/structure changes break them | R11, R12 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `components/icons.ts` (or inline in nav) | Shared Lucide icon map for routes | R2 |
| `components/overview/kpi-cards.tsx` | KPI row UI | R4 |
| `components/overview/cashflow-chart.tsx` | Client recharts line chart + empty state | R5 |
| `components/overview/spent-by-category.tsx` | Segmented bar + pills (CSS) | R6 |
| `components/overview/composition-donut.tsx` | Client recharts donut + empty state | R7 |
| `components/overview/half-month-schedule.tsx` | H1/H2 schedule card | R8 |
| `components/overview/projects-progress.tsx` | Horizontal funded-% bars (CSS or recharts) | R9 |
| `lib/queries/overview-dashboard.ts` (or extend `overview.ts`) | Read-only helpers: prior-month MoM, category spend series, cashflow series | R4, R5, R6 |

Exact file split may vary; design requires the responsibilities above to exist.

## Data and control flow

```
Overview page (RSC)
  ├─ getSettings(userId)
  ├─ getOverview(userId, year, month, reporting, rates)
  ├─ getOverview(userId, priorYear, priorMonth, ...)   // MoM only
  ├─ spentByCategory(userId, year, month, reporting, rates)
  ├─ cashflowSeries(userId, year, month, reporting, rates)
  └─ getProjectsView(userId, rates)
        │
        ▼
  Pass serializable props → client chart components (recharts)
  Money / RatesNote for amounts
```

### Cashflow series (R5)

Preferred coherent series for a personal-finance month:

1. Build chronological points for the selected month:
   - At minimum: **start**, **end of H1 (day 15)**, **end of month** — plotting cumulative earned, cumulative spent, and/or cumulative net (earned − spent).
   - Optional enrichment: daily cumulative net if expense/income dates support it without heavy queries.
2. Line chart: one coral primary series (cumulative net or remaining trajectory) plus optional second muted series (cumulative spent) if readable.
3. If all points are zero/null → empty state inside the card.

Do **not** invent weekday e-commerce cashflow.

### MoM deltas (R4)

- For each of Earned / Spent / Saved / Remaining / Lifetime savings: if current and prior values are non-null and prior ≠ 0, show `((current - prior) / |prior|) * 100` with ↑/↓ and green/coral.
- Lifetime savings MoM compares lifetime balance now vs end of prior month computation (same `lifetimeSavingsBalance` after prior month's contributions — i.e. second overview call's lifetime balance is "as of now" still total lifetime; **prefer MoM only on the four monthly KPIs**, and for lifetime show absolute delta vs prior month's lifetime figure only if a true point-in-time prior balance is trivial — otherwise omit MoM on lifetime and show the value alone).
- Practical rule: MoM on **Earned, Spent, Saved, Remaining**; Lifetime card may omit % or show "balance" without fake YoY.

### Spent by category (R6)

- Aggregate expenses in the month by `categoryId` / name, convert with existing `sumInCurrency`.
- Segment widths = share of total spent; pills list name, `Money`, percent.
- Prefer pure CSS flex segments; no recharts required.

### Donut (R7)

- Segments: `|earned|`, `|spent|`, `|saved|` only when values are non-null and the sum of positives used for percentages is > 0.
- Use non-negative magnitudes for slice size (spent and saved are outflows/contributions; earned is inflow). Center text: formatted **Earned** (or "No data").
- Colors: distinct coral / muted coral / soft green (or gray) — not purple.

### Half-month schedule (R8)

- Two rows/cards: H1 and H2 from `overview.perPeriod`.
- Highlight current period with coral when viewing the current calendar month.
- No Google Meet / avatar meeting rows.

### Projects bars (R9)

- Active projects from `getProjectsView`, sorted by priority.
- Bar width = `fundedPercent` (0–100); cap display at 100%.
- Link name to `/projects` optionally.

### Currency (R10)

- Keep `CURRENCY_SYMBOLS.CRC = "₡"`.
- Grep UI for hardcoded `$` amount formatting outside RatesNote / USD entry fields; fix any CRC misuse.
- Entry forms that accept USD/MXN may still show those symbols for input currency — correct behavior.

## Validation and failure handling

- Missing exchange rates: continue using `Money` null → "Set exchange rate" link (R4–R9, R10).
- Empty charts/lists: dedicated empty copy inside cards (R5–R9).
- Chart client components must not throw on empty arrays — render empty state.
- No new API error surfaces; Overview remains a read of existing queries.

## Security, privacy, accessibility, and performance

- Auth middleware and `requireUserId` unchanged (R13).
- Do not commit secrets or seed personal financial data (R12).
- Icon-only sidebar links: `aria-label={label}` and visible focus rings (R2, R13).
- Charts: include visible card titles; tooltips ok; ensure color is not the only MoM signal (include ↑/↓ text) (R4, R13).
- Performance: Overview may add one extra overview query (prior month) and one category aggregation; keep queries server-side; client bundles only chart components (dynamic import optional).

## Dependencies

| Package | Decision | Reason |
| --- | --- | --- |
| `lucide-react` | **Approved** | Outline icon set for nav/shell (owner "ChatGPT icons" → Lucide) |
| `recharts` | **Approved** (required by this design for line + donut) | Lightweight React charts for Cashflow and Composition; horizontal project bars may stay CSS |
| Other new deps | **Prohibited** | Scope limit |

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Heroicons / Phosphor / custom SVG set | Rejected | Owner direction maps to Lucide; one approved set |
| Chart.js / Nivo / Visx | Rejected | Spec allows recharts only |
| Pure CSS/SVG for all charts | Rejected for line/donut | Smooth line + donut with tooltips matches reference; segmented category bar stays CSS |
| Category plan vs actual for bottom bars | Rejected | Projects funded % is clearer progress UX; plan stays on Plan page |
| Donut = H1 vs H2 income | Rejected | Earned/Spent/Saved composition better matches KPI story |
| Keep green brand palette | Rejected | Reference uses muted coral; owner asked to match photo |
| Pixel-perfect e-commerce clone | Rejected | Out of scope; finance semantics first |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | Visual system; `tailwind.config.ts`; `globals.css`; layout |
| R2 | `components/nav.tsx`; narrow sidebar in `app/(app)/layout.tsx`; lucide-react |
| R3 | Files to change — all feature pages + login retokened |
| R4 | Overview header + `kpi-cards`; MoM helpers |
| R5 | `cashflow-chart` + `cashflowSeries` helper; recharts |
| R6 | `spent-by-category` + category aggregation; CSS segments |
| R7 | `composition-donut`; recharts; Earned center |
| R8 | `half-month-schedule` from `perPeriod` |
| R9 | `projects-progress` from `getProjectsView` |
| R10 | `lib/money.ts` / `Money` audit; CRC ₡ |
| R11 | Responsive grid in Overview + shell breakpoints |
| R12 | Dependencies section; no schema/auth changes |
| R13 | a11y labels; auth preserved; no financial console dumps |
