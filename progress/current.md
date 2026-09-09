# Current implementation progress

- Work item: received-savings-accounts (`specs/received-savings-accounts/`)
- Branch: `cursor/received-savings-accounts-ef43`
- Spec package: 2026-09-09, human-approved (owner **GO** on 2026-09-09; R11 planned-salary display same day)
- Implementer session: 2026-09-09
- Handoff: **IMPLEMENTED**

## Files read

- `AGENTS.md`, `.agents/implementer.md`
- `specs/received-savings-accounts/{requirements,design,tasks}.md` (complete, including R11)
- Waterfall, waterfall-scope, overview, savings, projects, balance, KPI/overview UI, savings copy

## Files changed

### T1 — Leftover math

- `lib/waterfall.ts` — received / charged / planning leftover; 70% of leftover; `plannedSalaryTakeMinor`
- `tests/unit/waterfall.test.ts` — reserve gate, not-gross-salary, from-planned subtract

### T2 — Scope loaders

- `lib/queries/waterfall-scope.ts` — received-only income; planning expenses; `waterfallFromScope` / `plannedTakeFromScope`; materialize uses new leftover

### T3 — Query consumers

- `lib/queries/overview.ts`, `savings.ts`, `projects.ts` — new scope fields

### T4 — Derived accounts

- `lib/queries/accounts.ts` — Main = Total cash − Savings; Total cash from `getBalanceSeries`
- `lib/queries/overview-dashboard.ts` — returns `accounts`

### T5 — Overview UI

- `components/overview/account-cards.tsx` — Main, Savings, From planned salary
- `app/(app)/page.tsx`, `components/overview/mobile-overview.tsx`, `kpi-cards.tsx` — accounts row; lifetime KPI removed

### T6 — Savings copy

- `app/(app)/savings/page.tsx`, `components/savings/mobile-savings.tsx` — received + reserved bills + From planned salary

### T7 / T8

- `tests/unit/aggregations.test.ts` — July Saved = 70% of received leftover; planned seed excluded
- `tests/unit/overview-dashboard.test.ts` — fixture fields for new OverviewFigures
- R11 wired on Overview + Savings

### T9 — this file

## Verification

- TV1: `npx vitest run tests/unit/waterfall.test.ts --config vitest.waterfall.config.ts` (run after this handoff)
- TV2: aggregations need Postgres (`tests/global-setup.ts`); not run if DATABASE_URL missing
- TV3–TV5: owner/browser on a live session
- TV6: no new deps; no schema change; `balance.ts` math unchanged

## Notes for Reviewer

- Actual Savings account / materialized take uses received leftover only
- **From planned salary** is display-only (`combinedTake − actualTake`)
- Main + Savings = Balance current balance
