/**
 * Percentage savings waterfall (received leftover after reserved Planning bills).
 * All amounts are integer minor units. Percentage takes use floor so we never over-allocate.
 */

export const LIFETIME_SAVINGS_PERCENT = 70;
export const PROJECT_ALLOCATION_MAX_PERCENT = 70;
export const PROJECT_ALLOCATION_MIN_PERCENT = 1;

export type PeriodMode = "H1" | "H2" | "BOTH";

export interface WaterfallInput {
  receivedIncomeMinor: number;
  chargedExpensesMinor: number;
  planningExpensesMinor: number;
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

export function leftoverAfterReserves(
  receivedIncomeMinor: number,
  chargedExpensesMinor: number,
  planningExpensesMinor: number
): number {
  return Math.max(0, receivedIncomeMinor - chargedExpensesMinor - planningExpensesMinor);
}

/** Compute leftover → 70% lifetime → post-lifetime → optional project take. */
export function computeWaterfall(input: WaterfallInput): WaterfallResult {
  const leftoverMinor = leftoverAfterReserves(
    input.receivedIncomeMinor,
    input.chargedExpensesMinor,
    input.planningExpensesMinor
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
 * Display-only — not materialized into the Savings account.
 */
export function plannedSalaryTakeMinor(input: {
  receivedIncomeMinor: number;
  plannedSalaryMinor: number;
  chargedExpensesMinor: number;
  planningExpensesMinor: number;
}): number {
  const actual = computeWaterfall({
    receivedIncomeMinor: input.receivedIncomeMinor,
    chargedExpensesMinor: input.chargedExpensesMinor,
    planningExpensesMinor: input.planningExpensesMinor,
  }).lifetimeTakeMinor;
  const combined = computeWaterfall({
    receivedIncomeMinor: input.receivedIncomeMinor + input.plannedSalaryMinor,
    chargedExpensesMinor: input.chargedExpensesMinor,
    planningExpensesMinor: input.planningExpensesMinor,
  }).lifetimeTakeMinor;
  return combined - actual;
}
