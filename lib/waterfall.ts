/**
 * Percentage savings waterfall (Main cash after remaining Planning bills).
 * All amounts are integer minor units. Percentage takes use floor so we never over-allocate.
 */

export const LIFETIME_SAVINGS_PERCENT = 70;
export const PROJECT_ALLOCATION_MAX_PERCENT = 70;
export const PROJECT_ALLOCATION_MIN_PERCENT = 1;

export type PeriodMode = "H1" | "H2" | "BOTH";

export interface WaterfallInput {
  mainCashMinor: number;
  remainingPlanningMinor: number;
  /** Project allocation percent of post-lifetime leftover; clamped to 1–70 when computing take. */
  projectAllocationPercent?: number;
}

export interface WaterfallResult {
  leftoverMinor: number;
  lifetimeTakeMinor: number;
  postLifetimeMinor: number;
  projectTakeMinor: number;
}

export function clampProjectPercent(percent: number): number {
  if (!Number.isFinite(percent)) return PROJECT_ALLOCATION_MIN_PERCENT;
  return Math.min(
    PROJECT_ALLOCATION_MAX_PERCENT,
    Math.max(PROJECT_ALLOCATION_MIN_PERCENT, Math.trunc(percent))
  );
}

export function percentOf(amountMinor: number, percent: number): number {
  if (amountMinor <= 0 || percent <= 0) return 0;
  return Math.floor((amountMinor * percent) / 100);
}

/** Leftover after remaining Planning. Charged is not an input (already reduced Main). */
export function leftoverAfterPlannedBills(
  mainCashMinor: number,
  remainingPlanningMinor: number
): number {
  return Math.max(0, mainCashMinor - remainingPlanningMinor);
}

/** Compute leftover → 70% lifetime → post-lifetime → optional project take. */
export function computeWaterfall(input: WaterfallInput): WaterfallResult {
  const leftoverMinor = leftoverAfterPlannedBills(
    input.mainCashMinor,
    input.remainingPlanningMinor
  );
  const lifetimeTakeMinor = percentOf(leftoverMinor, LIFETIME_SAVINGS_PERCENT);
  const postLifetimeMinor = leftoverMinor - lifetimeTakeMinor;
  const projectTakeMinor =
    input.projectAllocationPercent === undefined
      ? 0
      : percentOf(postLifetimeMinor, clampProjectPercent(input.projectAllocationPercent));

  return {
    leftoverMinor,
    lifetimeTakeMinor,
    postLifetimeMinor,
    projectTakeMinor,
  };
}

/**
 * Extra lifetime take that would appear if planned salary were received.
 * Display-only on Savings — not used for Overview leftover or materialize.
 */
export function plannedSalaryTakeMinor(input: {
  receivedIncomeMinor: number;
  plannedSalaryMinor: number;
  chargedExpensesMinor: number;
  planningExpensesMinor: number;
}): number {
  const actualLeftover = Math.max(
    0,
    input.receivedIncomeMinor - input.chargedExpensesMinor - input.planningExpensesMinor
  );
  const combinedLeftover = Math.max(
    0,
    input.receivedIncomeMinor +
      input.plannedSalaryMinor -
      input.chargedExpensesMinor -
      input.planningExpensesMinor
  );
  return (
    percentOf(combinedLeftover, LIFETIME_SAVINGS_PERCENT) -
    percentOf(actualLeftover, LIFETIME_SAVINGS_PERCENT)
  );
}

/** Display composition only — does not recompute leftover. */
export function savingsMonthBreakdownFromTakes(
  fromMain: number | null,
  fromPlanned: number | null
): { fromMain: number | null; fromPlanned: number | null; projectedSum: number | null } {
  return {
    fromMain,
    fromPlanned,
    projectedSum: fromMain === null || fromPlanned === null ? null : fromMain + fromPlanned,
  };
}
