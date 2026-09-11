import { describe, expect, it } from "vitest";
import { savingsCardHeadline } from "@/lib/queries/balance-months";
import {
  computeWaterfall,
  leftoverAfterPlannedBills,
  savingsMonthBreakdownFromTakes,
} from "@/lib/waterfall";

describe("savings month breakdown (Main leftover take)", () => {
  it("this-month take is 70% of Main after remaining Planning", () => {
    const take = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 40_000,
    }).lifetimeTakeMinor;
    const breakdown = savingsMonthBreakdownFromTakes(take, 0);
    expect(take).toBe(42_000);
    expect(breakdown.fromMain).toBe(42_000);
    expect(breakdown.projectedSum).toBe(42_000);
  });

  it("cannot-save when Planning covers Main", () => {
    expect(leftoverAfterPlannedBills(100_000, 120_000)).toBe(0);
    const take = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 120_000,
    }).lifetimeTakeMinor;
    expect(take).toBe(0);
  });

  it("Balance Savings headline is leftover take, not opening plus lifetime", () => {
    const take = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 40_000,
    }).lifetimeTakeMinor;
    expect(savingsCardHeadline(take)).toBe(42_000);
    expect(savingsCardHeadline(take)).not.toBe(0 + 250_000);
  });

  it("null legs stay null and do not coerce to 0", () => {
    expect(savingsMonthBreakdownFromTakes(null, 10).projectedSum).toBeNull();
    expect(savingsMonthBreakdownFromTakes(10, null).projectedSum).toBeNull();
    expect(savingsMonthBreakdownFromTakes(null, null).projectedSum).toBeNull();
  });
});
