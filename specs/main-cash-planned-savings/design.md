# Design: Main cash leftover and Overview cards

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8, R9

## Goals

- One Main number: typed opening on Balance and Overview (R1).
- Overview third card **Planned expenses** = month remaining Planning; drop **From planned salary** (R2, R3).
- Leftover = `max(0, mainCash − remainingPlanning)`; 70% floor take; gate when Main cannot cover planned bills (R4, R5, R8).
- Materialize and Overview Saved / Overview Savings card / Balance Savings month lines share that take (R6, R7).
- No new packages or Prisma models (R9).

## Current system observations

- `lib/waterfall.ts` leftover = `max(0, received − charged − planning)`. `plannedSalaryTakeMinor` is display-only. **This item replaces leftover inputs** for take/materialize/Saved. Keep `percentOf` / 70 / floor. Prefer a new helper `leftoverAfterPlannedBills(mainCash, remainingPlanning)` and wire `computeWaterfall` (or a sibling) so received income is not the leftover base.
- `lib/queries/waterfall-scope.ts` — `getScopeAmounts` already has `planningExpensesMinor`. Add/load `mainCash` from MAIN opening or Settings starting (convert). `waterfallFromScope` must use Main + remaining Planning, not received + charged + planning.
- `lib/queries/accounts.ts` — `getDerivedAccounts` currently Main = Total cash − Savings. Change Overview Main to Main opening / starting. Overview Savings (account card) = month take. Keep `getLifetimeSavingsBalance` for Savings page.
- `components/overview/account-cards.tsx` — third card **From planned salary**. Change to **Planned expenses**; new hint.
- `app/(app)/page.tsx`, `components/overview/mobile-overview.tsx` — pass planned expenses instead of `savedFromPlannedMinor`.
- `lib/queries/overview.ts` — `saved` / `savedFromPlannedMinor` from old waterfall. Saved = new take; replace from-planned with remaining Planning for the cards.
- Materialize still `materializeHalfWaterfall` per H1/H2 unique key. Month take must be applied **once**: e.g. write full `lifetimeTake` on H1 waterfall row and `0` on H2 (sum = take). Do not run leftover independently on each half.
- Balance Savings card (`components/balance/account-section.tsx`) shows From main / From planned salary / This month. Replace with leftover-based take (and leftover/cannot-save if useful). No from-planned salary.
- Tests: `tests/unit/waterfall.test.ts` must switch to Main vs remaining Planning cases; remove received-100/planned-salary-50 as the Overview identity. `tests/unit/account-breakdown.test.ts` / aggregations Saved expectations update if they encode old leftover.
- No `package.json` changes. No Prisma schema change.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `lib/waterfall.ts` | Leftover from Main − remaining Planning; 70% of that leftover; gate ≤ 0. Keep floor `percentOf`. Stop using received/charged as leftover base for take. `plannedSalaryTakeMinor` unused on Overview (may remain unused or deleted if no callers). | R4, R5, R8 |
| `lib/queries/waterfall-scope.ts` | Pass mainCash + remaining Planning into waterfall; month BOTH leftover; H1/H2 materialize shares one month take (no double count). | R4, R5, R6, R8 |
| `lib/queries/accounts.ts` | Overview Main = opening/starting; Overview Savings card amount = month take; planned expenses = remaining Planning. | R1, R2, R5 |
| `lib/queries/overview.ts` | `saved` = new take; expose remaining Planning for cards; drop Overview from-planned. | R2, R3, R5, R6 |
| `lib/queries/overview-dashboard.ts` | Wire new account fields. | R1, R2, R3 |
| `components/overview/account-cards.tsx` | Labels Main / Savings / **Planned expenses**; hint about covering planned bills then 70%. | R1, R2, R3, R4 |
| `app/(app)/page.tsx` | Pass new props. | R1, R2, R3 |
| `components/overview/mobile-overview.tsx` | Same cards. | R1, R2, R3 |
| `components/balance/account-section.tsx` | Savings month lines without From planned salary; use new take. | R7 |
| `tests/unit/waterfall.test.ts` | Gate + 70% of leftover after planned bills; not 70% of Main. | R4, R5, R8 |
| `tests/unit/account-breakdown.test.ts` | Align with new take if it still asserts from-planned identity. | R5, R7 |
| `tests/unit/aggregations.test.ts` | Saved/remaining if they encode received leftover. | R5, R6 |
| `tests/unit/overview-dashboard.test.ts` | Fixture fields for new cards. | R1, R2, R3 |

## New files

None required. Optional: keep leftover helper in `waterfall.ts` only.

## Data and control flow

```
mainCash           = convert(MAIN.opening) or Settings starting
remainingPlanning  = getScopeAmounts(..., month, BOTH).planningExpensesMinor
leftover           = max(0, mainCash − remainingPlanning)
lifetimeTake       = percentOf(leftover, 70)
postLifetime       = leftover − lifetimeTake
```

Overview:

| Card | Value |
| --- | --- |
| Main account | mainCash |
| Savings account | lifetimeTake (viewed month) |
| Planned expenses | remainingPlanning |

Balance Main card stays typed opening (already). Running series / Current balance unchanged (received − charged from starting).

Materialize month:

```
take = lifetimeTake(month BOTH)
H1 waterfall upsert amount = take
H2 waterfall upsert amount = 0
```

(or equivalent so monthly waterfall sum = take).

Priority project take remains percent of `postLifetime` for the month (existing cap). Apply once for the month, same double-count rule.

## Validation and failure handling

- Null FX: do not invent leftover 0 vs null: if a needed conversion is missing, take is null and materialize skips.
- Empty Planning → remainingPlanning 0 → leftover = mainCash (can save 70% of Main).
- Negative Main opening allowed (existing); leftover still max(0, …).
- `safeMaterializeMonth` still swallows on mutation paths.

## Security, privacy, accessibility, and performance

- All loaders `userId`-scoped; Overview/Balance `requireUserId`.
- No amount logging.
- Labels visible text **Planned expenses**.
- Extra query: MAIN opening (already listed) + existing scope amounts.

## Dependencies

No new npm packages. No Prisma models. Reuse `percentOf`, `getScopeAmounts` planning leg, Settings starting, MAIN opening.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Leftover = received − charged − planning | **Rejected** | Owner: leftover from Main cash after planned expenses. |
| Leftover = Main − charged − planning (month) | Rejected | Charged already reflected in cash-on-hand the owner typed; subtracting again double-counts. |
| Overview Main = Total cash − Savings | Rejected | Shows ~297k vs typed 73,233. |
| Keep From planned salary | Rejected | Replaced by Planned expenses. |
| Overview Savings = lifetime balance | Rejected for the Overview card | Owner wants the 70% that can be saved now; lifetime stays on Savings page. |
| Apply leftover independently to H1 and H2 | Rejected | Would count Main twice. |
| Plan-matrix remaining instead of Planning expenses | Rejected | Same source as today’s planning reserve: expense `completed === false`. |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `getDerivedAccounts` / account cards Main = opening |
| R2 | Planned expenses from `planningExpensesMinor` |
| R3 | account-cards third label; Overview props |
| R4 | leftover max(0, main − planning); tests |
| R5 | percentOf 70; Overview Savings + Saved |
| R6 | materialize month take once |
| R7 | Balance Savings card |
| R8 | charged not in leftover helper |
| R9 | no new deps/schema; userId |
