# Requirements: Main cash leftover and Overview cards

- Work item: specs/main-cash-planned-savings/
- Outcome: Overview and Balance Main show the cash the owner typed on Main. Savings is 70% of what remains after covering this month’s still-planned (not yet charged) expenses from that cash. If Main cannot cover those planned expenses, nothing can be saved.
- Branch: cursor/main-cash-planned-savings-ef43
- Status: Specification
- Spec version: 2026-09-09

## Problem

Overview **Main account** still uses derived cash (Total cash − Savings), so it shows a different figure than the amount the owner entered on Balance (e.g. ₡73,233.00). The 70% save still starts from **received salary − charged − planning**, not from the cash sitting in Main after upcoming planned bills. Gustavo wants one Main number (what he typed), a **Planned expenses** figure for the month (still to spend, not already charged), and to save 70% only when Main cash is higher than that remaining planned spend.

## In scope

- Overview **Main account** = Balance Main opening (the amount saved on the Main card / Settings starting when synced). Same number on Overview and Balance Main.
- Overview third card: **Planned expenses** = this month’s expenses that are still Planning (`completed === false`), i.e. planned to spend this month minus already charged.
- Remove Overview **From planned salary**.
- Leftover for the 70% lifetime take:

  ```
  remainingPlanning = this month’s Planning expenses (completed === false, period BOTH)
  leftover           = max(0, mainCash − remainingPlanning)
  lifetimeTake       = floor(70% of leftover)   // 0 if leftover is 0
  ```

- If Main cash ≤ remaining planned expenses, leftover and take are 0 (cannot save).
- `mainCash` is the Main opening in reporting currency (Settings starting if no MAIN row yet).
- Charged expenses (`completed === true`) are **not** subtracted again from Main for this leftover: Main is cash on hand as entered. Remaining Planning is the unpaid planned spend still ahead this month.
- Overview **Savings account** (this item) = that month’s `lifetimeTake` (what can be saved now), not Total cash − Main.
- Materialize the same month take into existing `SavingsContribution` waterfall rows so the Savings page lifetime still accumulates it.
- Monthly Overview **Saved** KPI uses this take.
- Balance Savings month lines use this leftover (no “From planned salary” on that card).
- Unit tests for the new leftover (cover the Planning gate and 70% of leftover, not of Main gross).
- `requireUserId` / `userId` scope; no secrets; no new npm packages; no new Prisma models.

## Out of scope

- Changing the 70% rate or making it editable.
- Removing income Planned checkbox or expense Planning / Already charged.
- Subtracting all-time charged expenses from Main for leftover (would double-count if Main is cash on hand).
- Auto-transfer into Custom / Prizes.
- Bank sync.
- Deleting Main/Savings.
- New `/accounts` route.
- New npm dependencies.

## Definitions

- **Main cash**: converted `Account` `kind=MAIN` `openingMinor`. If no MAIN row, Settings `startingBalanceMinor` (same value after the existing Main ↔ Settings sync). This is the amount the owner typed (e.g. ₡73,233.00).
- **Already charged (this month)**: `Expense.completed === true` in the viewed calendar month.
- **Remaining planned expenses (this month)**: `Expense.completed === false` in that month, period `BOTH`. Label **Planned expenses**. This is planned-to-spend-this-month minus already charged (uncharged Planning rows).
- **Leftover (locked for this item)**:

  ```
  leftover = max(0, mainCash − remainingPlanning)
  lifetimeTake = floor(70% of leftover)
  postLifetime = leftover − lifetimeTake
  ```

- **Cannot save**: leftover ≤ 0 (Main cannot cover remaining planned expenses).
- **Overview Savings (this item)**: `lifetimeTake` for the viewed month under the formula above.
- **Lifetime savings (Savings page)**: sum of `SavingsContribution` (unchanged store). Waterfall rows for a month must sum to that month’s `lifetimeTake`.

## Requirements

### R1 — Overview and Balance Main show the typed cash

- Trigger: Owner views Overview or Balance; or saves Main opening / Settings starting.
- Preconditions: Human-approved spec. MAIN opening ↔ Settings starting already implemented.
- Actor/system: Overview account cards; Balance Main card.
- Expected response: Both surfaces show **Main cash** (the saved opening). They must match when rates exist (same minor units in reporting currency, or Main’s own currency on Balance as today if opening currency is CRC/USD and reporting matches). Do not show Total cash − Savings as Overview Main.
- State change: None on read. Writes stay the existing opening ↔ Settings sync.
- Visible/resulting evidence: Enter ₡73,233.00 on Main → Overview Main and Balance Main show that amount (not ~₡297k derived cash).
- Failure behavior: No MAIN and starting 0 → show 0. Missing FX when opening currency ≠ reporting → Money “—” / set-rate, do not coerce to 0.
- Acceptance evidence: Code review `getDerivedAccounts` / Overview cards read MAIN opening (or Settings starting). Manual: Overview Main equals Balance Main.

### R2 — Overview Planned expenses is remaining Planning this month

- Trigger: Overview for a calendar month.
- Preconditions: Expenses may mix Planning and Already charged.
- Actor/system: Overview account row, third card.
- Expected response: Label exactly **Planned expenses**. Value = converted sum of `completed === false` expenses in that month (`BOTH`). Already charged rows are excluded.
- State change: None.
- Visible/resulting evidence: Charge a Planning expense → Planned expenses drops; Main cash does not change. Empty Planning → 0.
- Failure behavior: Missing FX → null / set-rate.
- Acceptance evidence: Loader uses `planningExpensesMinor` from `getScopeAmounts(..., "BOTH")` (or equivalent `completed: false` month sum). No plan-cell matrix required.

### R3 — Remove From planned salary on Overview

- Trigger: Overview desktop and mobile account row.
- Expected response: Third card is **Planned expenses**, not **From planned salary**. `plannedSalaryTakeMinor` is not shown on Overview.
- State change: None.
- Visible/resulting evidence: No “From planned salary” label on `/`.
- Acceptance evidence: `account-cards.tsx` + Overview page/mobile props.

### R4 — Cannot save unless Main covers remaining planned expenses

- Trigger: Leftover / lifetime take / Overview Saved / materialize / Balance Savings month take.
- Expected response: If `mainCash ≤ remainingPlanning` (or remainingPlanning conversion null with main present still must not invent a take), leftover = 0 and lifetime take = 0.
- State change: Materialize writes 0 take when gated.
- Visible/resulting evidence: Main 100, remaining Planning 100 or 120 → take 0. Main 100, remaining Planning 40 → leftover 60.
- Failure behavior: Null FX on either leg → take null, skip materialize (existing skip).
- Acceptance evidence: Unit tests for the gate.

### R5 — 70% of leftover after planned expenses, not 70% of Main

- Trigger: Same as R4 when leftover > 0.
- Expected response: `lifetimeTake = floor(leftover * 70 / 100)` with existing `percentOf`. Not 70% of Main gross, not 70% of remaining Planning, not received-salary leftover.
- Canonical: main 100_000, remainingPlanning 40_000 → leftover 60_000 → take 42_000. postLifetime 18_000.
- State change: Materialize waterfall savings for that month sum to `lifetimeTake`.
- Visible/resulting evidence: Overview Savings card = that take for the viewed month. Overview Saved KPI = same take.
- Failure behavior: leftover 0 → take 0.
- Acceptance evidence: Unit tests; `computeWaterfall` / new helper uses Main and remaining Planning, not received income.

### R6 — Materialize and monthly Saved use the new leftover

- Trigger: Existing rematerialize (income/expense/settings/overview refresh) and Overview Saved.
- Expected response: Month `BOTH` leftover as R4–R5. Sum of H1+H2 waterfall `SavingsContribution` for that month equals `lifetimeTake` (implementation may put the full take on H1 and 0 on H2). Do not apply the full month leftover independently to both halves (would double-count Main).
- State change: Upsert waterfall contribution amounts.
- Visible/resulting evidence: After refresh, Savings page lifetime includes the new take; charging/adding Planning changes the take after rematerialize.
- Failure behavior: Existing `safeMaterializeMonth` swallow on settings/income/expense paths.
- Acceptance evidence: `materializeHalfWaterfall` / month materialize uses Main cash + remaining Planning; code review no double month take.

### R7 — Balance Savings card follows the same leftover

- Trigger: Balance Savings card when a SAVINGS row exists.
- Expected response: Month lines come from R4–R5 (take / leftover), not `plannedSalaryTakeMinor`. Do not show **From planned salary**. All-time Savings may remain opening + lifetime contributions.
- Acceptance evidence: `account-section.tsx` copy/labels; helpers reused not copied.

### R8 — Charged expenses do not reduce Main leftover a second time

- Trigger: Leftover compute.
- Expected response: Inputs are Main cash and remaining Planning only. `chargedExpensesMinor` is not subtracted from Main for this leftover.
- Acceptance evidence: Helper signature / unit tests omit charged from leftover.

### R9 — Auth, privacy, dependencies

- Trigger: All new/changed loaders and actions.
- Expected response: `requireUserId`; `userId` on queries; no secrets; `package.json` unchanged; no new Prisma models.
- Acceptance evidence: Diff review.

## Traceability

| Source request | Requirement IDs |
| --- | --- |
| Main shows the typed Balance amount on Overview | R1 |
| Planned expenses = month planned minus charged | R2, R8 |
| Remove different derived Main / From planned salary | R1, R3 |
| Save only if Main > remaining planned expenses | R4 |
| 70% of that leftover | R5, R6, R7 |
| Security / no new packages | R9 |

## Assumptions

- Remaining Planning is expense rows `completed === false`, not Plan-matrix cells (same as today’s planning reserve source).
- Main opening continues to sync with Settings starting (already built).
- Income Planned checkbox remains for Income UI; it is not an input to this leftover.

## Open questions

- None blocking. If Gustavo meant leftover = Main − (charged + planning) for the month, that would double-count charged whenever Main is cash already net of paid bills; this spec excludes that. Say so on GO if charged should also be subtracted.
