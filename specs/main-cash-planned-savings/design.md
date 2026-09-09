# Design: Main cash leftover and Overview cards

- Governing requirements: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10

## Goals

- One Main number: typed opening on Balance and Overview (R1). Charge events also write that number (R10).
- Overview third card **Planned expenses** = month remaining Planning; drop **From planned salary** (R2, R3).
- Leftover = `max(0, mainCash − remainingPlanning)`; 70% floor take; gate when Main cannot cover planned bills (R4, R5, R8).
- Materialize and Overview Saved / Overview Savings card / Balance Savings month lines share that take (R6, R7).
- Already charged subtracts the converted expense from stored Main; un-charge restores it (R10). Leftover must not subtract charged a second time (R8).
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
- `app/(app)/expenses/actions.ts` — create, `setExpenseCompletedAction`, update, and delete change expense rows and rematerialize, but they do **not** write Main. This item adds a converted cash delta to `Account.openingMinor` (`kind = MAIN`) and Settings `startingBalanceMinor`, reusing the same MAIN ↔ Settings sync as `updateMainOpeningAction`.
- `lib/money.ts` `convertMinor` is the conversion used for leftover; charge apply must use the same conversion into Main’s stored currency (MAIN `currency`, or Settings `startingBalanceCurrency` if no MAIN row).
- Tests: `tests/unit/waterfall.test.ts` must switch to Main vs remaining Planning cases; remove received-100/planned-salary-50 as the Overview identity. `tests/unit/account-breakdown.test.ts` / aggregations Saved expectations update if they encode old leftover. Add unit coverage for the Main cash delta helper (sign of charge / un-charge / amount delta).
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
| `lib/queries/main-cash.ts` (new helper file, or equivalent in `lib/queries/accounts.ts`) | Pure delta helper plus `applyMainCashDelta(userId, deltaMinorInMainCurrency)`: ensure MAIN row (create 0 if missing), add `deltaMinor` to `openingMinor` and Settings `startingBalanceMinor`, keep currencies in sync. | R1, R10 |
| `app/(app)/expenses/actions.ts` | On create-as-charged, Planning→charged, charged→Planning, delete charged, and amount/currency edit while charged: convert expense to Main currency, apply signed delta, then rematerialize. Prefer **no partial**: if convert fails, do not persist the expense status/amount change. Revalidate `/` and `/balance`. | R8, R10 |
| `tests/unit/waterfall.test.ts` | Gate + 70% of leftover after planned bills; not 70% of Main; leftover omits charged. | R4, R5, R8 |
| `tests/unit/account-breakdown.test.ts` | Align with new take if it still asserts from-planned identity. | R5, R7 |
| `tests/unit/aggregations.test.ts` | Saved/remaining if they encode received leftover. | R5, R6 |
| `tests/unit/overview-dashboard.test.ts` | Fixture fields for new cards. | R1, R2, R3 |
| `tests/unit/main-cash.test.ts` (or extend waterfall/account tests) | Charge −10000 on 7323300 → 6323300; un-charge restores; amount delta while charged. | R10 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `lib/queries/main-cash.ts` | Optional; Main opening delta + convert-into-Main-currency. May instead live in `lib/queries/accounts.ts` if that keeps the diff smaller. | R10 |
| `tests/unit/main-cash.test.ts` | Optional; only if the helper is extracted. | R10 |

## Data and control flow

```
mainCash           = convert(MAIN.opening) or Settings starting
remainingPlanning  = getScopeAmounts(..., month, BOTH).planningExpensesMinor
leftover           = max(0, mainCash − remainingPlanning)
lifetimeTake       = percentOf(leftover, 70)
postLifetime       = leftover − lifetimeTake
```

Charge apply (R10), signed `delta` in Main stored currency:

| Event | Delta on stored Main |
| --- | --- |
| Create as Already charged | − converted amount |
| Planning → Already charged | − converted amount |
| Already charged → Planning | + converted amount |
| Delete Already charged | + converted amount |
| Amount/currency change while charged | − newConverted + oldConverted |
| Create as Planning; delete Planning; amount change while Planning | 0 |

Invariant: leftover inputs are **current** Main and remaining Planning only. After a ₡10,000 charge, Main is already ₡63,233; leftover does not subtract that ₡10,000 again.

Example (owner): Main ₡73,233.00, Area Service ₡10,000 Already charged, nothing else Planning → Main ₡63,233.00, Planned expenses ₡0, leftover = ₡63,233, take = 70% of ₡63,233. If unpaid Planning still ≥ Main, take stays 0.

Overview:

| Card | Value |
| --- | --- |
| Main account | mainCash (after charge apply) |
| Savings account | lifetimeTake (viewed month) |
| Planned expenses | remainingPlanning |

Balance Main card stays stored opening (already). Running series / Current balance unchanged (received − charged from starting). Series must **not** be the leftover formula.

Materialize month:

```
take = lifetimeTake(month BOTH)
H1 waterfall upsert amount = take
H2 waterfall upsert amount = 0
```

(or equivalent so monthly waterfall sum = take).

Priority project take remains percent of `postLifetime` for the month (existing cap). Apply once for the month, same double-count rule.

Do **not** on load or on first Main Edit walk historical `completed === true` expenses and subtract them.

## Validation and failure handling

- Null FX: do not invent leftover 0 vs null: if a needed conversion is missing, take is null and materialize skips.
- Charge apply FX: if expense currency ≠ Main currency and convert returns null, abort the mutation (do not mark charged / do not change amount) and return the existing generic error. No half-applied charge.
- Empty Planning → remainingPlanning 0 → leftover = mainCash (can save 70% of Main).
- Negative Main opening allowed (existing); leftover still max(0, …). Charge may drive Main negative; do not clamp unless an existing helper already does.
- If no MAIN row, create one at 0 (same currency as Settings starting, or reporting) so the first charge can apply, then subtract. Keep Settings starting in lockstep.
- `safeMaterializeMonth` still swallows on mutation paths **after** the Main write succeeds.

## Security, privacy, accessibility, and performance

- All loaders and expense actions `userId`-scoped; Overview/Balance `requireUserId`. Main write is `updateMany`/`update` by `userId` + `kind = MAIN` (never by id from the client for this path).
- No amount logging.
- Labels visible text **Planned expenses**.
- Extra query: MAIN opening (already listed) + existing scope amounts. Charge path: one extra MAIN + Settings read/write in the same request as the expense mutation.

## Dependencies

No new npm packages. No Prisma models. Reuse `percentOf`, `getScopeAmounts` planning leg, Settings starting, MAIN opening, `convertMinor`.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Leftover = received − charged − planning | **Rejected** | Owner: leftover from Main cash after planned expenses. |
| Leftover also subtracts this month’s charged | **Rejected** | Charge already reduced stored Main (R10); subtracting charged again double-counts (R8). |
| Charge does not change stored Main | **Rejected** | Owner: Area Service ₡10,000 charged must drop Main ₡73,233 → ₡63,233. |
| On first Edit of Main, subtract all historical charged | **Rejected** | Only new charge / un-charge / create-charged / delete-charged / amount-delta events. |
| Overview Main = Total cash − Savings | Rejected | Shows ~297k vs typed 73,233. |
| Keep From planned salary | Rejected | Replaced by Planned expenses. |
| Overview Savings = lifetime balance | Rejected for the Overview card | Owner wants the 70% that can be saved now; lifetime stays on Savings page. |
| Apply leftover independently to H1 and H2 | Rejected | Would count Main twice. |
| Plan-matrix remaining instead of Planning expenses | Rejected | Same source as today’s planning reserve: expense `completed === false`. |
| Clamp Main at 0 on charge | Rejected unless already the opening convention | Owner example can go 73,233 → 63,233; over-charge should still reduce Main. |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `getDerivedAccounts` / account cards Main = opening; charge events rewrite opening |
| R2 | Planned expenses from `planningExpensesMinor` |
| R3 | account-cards third label; Overview props |
| R4 | leftover max(0, main − planning); tests |
| R5 | percentOf 70; Overview Savings + Saved |
| R6 | materialize month take once |
| R7 | Balance Savings card |
| R8 | charged not in leftover helper |
| R9 | no new deps/schema; userId |
| R10 | expense actions + Main delta helper; no historical backfill |
