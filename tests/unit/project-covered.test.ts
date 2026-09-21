import { describe, expect, it } from "vitest";
import { leftoverProjectCovered } from "@/lib/project-covered";
import { computeWaterfall } from "@/lib/waterfall";

describe("leftoverProjectCovered", () => {
  it("uses leftover project take, not a lifetime lump (screenshot lock)", () => {
    const leftoverAfterSavings = 483_450;
    const waterfall = computeWaterfall({
      mainCashMinor: 1_611_500,
      remainingPlanningMinor: 0,
      projectAllocationPercent: 50,
    });
    expect(waterfall.postLifetimeMinor).toBe(leftoverAfterSavings);
    expect(waterfall.projectTakeMinor).toBe(241_725);

    const covered = leftoverProjectCovered({
      costMinor: 6_000_000,
      takeMinor: waterfall.projectTakeMinor,
    });
    expect(covered.coveredMinor).toBe(241_725);
    expect(covered.fundedPercent).toBe(4);
    expect(covered.affordableNow).toBe(false);
  });

  it("matches computeWaterfall project take when leftover changes", () => {
    const high = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 40_000,
      projectAllocationPercent: 50,
    });
    expect(high.leftoverMinor).toBe(60_000);
    expect(high.lifetimeTakeMinor).toBe(42_000);
    expect(high.postLifetimeMinor).toBe(18_000);
    expect(high.projectTakeMinor).toBe(9_000);

    const highCovered = leftoverProjectCovered({
      costMinor: 60_000,
      takeMinor: high.projectTakeMinor,
    });
    expect(highCovered.coveredMinor).toBe(9_000);
    expect(highCovered.fundedPercent).toBe(15);
    expect(highCovered.affordableNow).toBe(false);

    const none = computeWaterfall({
      mainCashMinor: 40_000,
      remainingPlanningMinor: 40_000,
      projectAllocationPercent: 50,
    });
    expect(none.projectTakeMinor).toBe(0);

    const zero = leftoverProjectCovered({
      costMinor: 60_000,
      takeMinor: none.projectTakeMinor,
    });
    expect(zero.coveredMinor).toBe(0);
    expect(zero.fundedPercent).toBe(0);
    expect(zero.affordableNow).toBe(false);
  });

  it("caps displayed covered at cost and marks affordable when take covers cost", () => {
    const covered = leftoverProjectCovered({
      costMinor: 10_000,
      takeMinor: 12_500,
    });
    expect(covered.coveredMinor).toBe(10_000);
    expect(covered.fundedPercent).toBe(100);
    expect(covered.affordableNow).toBe(true);
  });

  it("returns nulls when take is unavailable", () => {
    expect(leftoverProjectCovered({ costMinor: 6_000_000, takeMinor: null })).toEqual({
      coveredMinor: null,
      fundedPercent: null,
      affordableNow: false,
    });
  });

  it("does not invent a percent when cost is zero", () => {
    expect(leftoverProjectCovered({ costMinor: 0, takeMinor: 241_725 })).toEqual({
      coveredMinor: 241_725,
      fundedPercent: null,
      affordableNow: true,
    });
  });
});
