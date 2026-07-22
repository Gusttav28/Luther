/**
 * Percentage savings waterfall (R1–R3, R6).
 * All amounts are integer minor units. Percentage takes use floor so we never over-allocate.
 */

export const LIFETIME_SAVINGS_PERCENT = 70;
export const PROJECT_ALLOCATION_MAX_PERCENT = 70;
export const PROJECT_ALLOCATION_MIN_PERCENT = 1;

export type PeriodMode = "H1" | "H2" | "BOTH";

export interface WaterfallInput {
  plannedIncomeMinor: number;
  expensesMinor: number;
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

/** Compute leftover → 70% lifetime → post-lifetime → optional project take. */
export function computeWaterfall(input: WaterfallInput): WaterfallResult {
  const leftoverMinor = Math.max(0, input.plannedIncomeMinor - input.expensesMinor);
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
