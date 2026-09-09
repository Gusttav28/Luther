import { describe, expect, it } from "vitest";
import {
  LIFETIME_SAVINGS_PERCENT,
  clampProjectPercent,
  computeWaterfall,
  leftoverAfterPlannedBills,
  percentOf,
} from "@/lib/waterfall";

describe("waterfall (Main cash after remaining Planning bills)", () => {
  it("computes leftover as Main minus remaining Planning, ignoring received and charged", () => {
    expect(leftoverAfterPlannedBills(100_000, 40_000)).toBe(60_000);
    const w = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 40_000,
      projectAllocationPercent: 50,
    });
    expect(w.leftoverMinor).toBe(60_000);
    expect(w.lifetimeTakeMinor).toBe(42_000);
    expect(w.postLifetimeMinor).toBe(18_000);
  });

  it("canonical leftover: main 100_000 / planning 40_000 → take 42_000", () => {
    const w = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 40_000,
    });
    expect(w.leftoverMinor).toBe(60_000);
    expect(w.lifetimeTakeMinor).toBe(percentOf(60_000, 70));
    expect(w.lifetimeTakeMinor).toBe(42_000);
    expect(w.lifetimeTakeMinor).not.toBe(percentOf(100_000, 70));
  });

  it("blocks saving when remaining Planning ≥ Main", () => {
    const over = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 120_000,
      projectAllocationPercent: 70,
    });
    expect(over.leftoverMinor).toBe(0);
    expect(over.lifetimeTakeMinor).toBe(0);
    expect(over.postLifetimeMinor).toBe(0);
    expect(over.projectTakeMinor).toBe(0);

    const exact = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 100_000,
    });
    expect(exact.leftoverMinor).toBe(0);
    expect(exact.lifetimeTakeMinor).toBe(0);
  });

  it("takes 70% of leftover with floor rounding, not 70% of Main", () => {
    expect(LIFETIME_SAVINGS_PERCENT).toBe(70);
    const w = computeWaterfall({
      mainCashMinor: 73_233_00,
      remainingPlanningMinor: 20_000_00,
    });
    expect(w.leftoverMinor).toBe(53_233_00);
    expect(w.lifetimeTakeMinor).toBe(percentOf(53_233_00, 70));
    expect(w.lifetimeTakeMinor).not.toBe(percentOf(73_233_00, 70));
  });

  it("empty remaining Planning yields leftover = Main", () => {
    const w = computeWaterfall({
      mainCashMinor: 63_233_00,
      remainingPlanningMinor: 0,
      projectAllocationPercent: 50,
    });
    expect(w.leftoverMinor).toBe(63_233_00);
    expect(w.lifetimeTakeMinor).toBe(percentOf(63_233_00, 70));
  });

  it("leftover helper does not accept charged (signature is Main + Planning only)", () => {
    expect(leftoverAfterPlannedBills.length).toBe(2);
    expect(leftoverAfterPlannedBills(7_323_300, 0)).toBe(7_323_300);
    expect(leftoverAfterPlannedBills(6_323_300, 0)).toBe(6_323_300);
  });

  it("zero leftover yields zero takes", () => {
    const w = computeWaterfall({
      mainCashMinor: 50_000,
      remainingPlanningMinor: 80_000,
      projectAllocationPercent: 70,
    });
    expect(w.leftoverMinor).toBe(0);
    expect(w.lifetimeTakeMinor).toBe(0);
    expect(w.postLifetimeMinor).toBe(0);
    expect(w.projectTakeMinor).toBe(0);
  });

  it("clamps project percent to 1–70", () => {
    expect(clampProjectPercent(0)).toBe(1);
    expect(clampProjectPercent(71)).toBe(70);
    expect(clampProjectPercent(50.9)).toBe(50);
  });

  it("hard-caps project take at 70% of post-lifetime", () => {
    const w = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 0,
      projectAllocationPercent: 99,
    });
    expect(w.projectTakeMinor).toBe(21_000);
  });
});
