import { describe, expect, it } from "vitest";
import {
  LIFETIME_SAVINGS_PERCENT,
  clampProjectPercent,
  computeWaterfall,
  percentOf,
} from "@/lib/waterfall";

describe("waterfall (R1–R3)", () => {
  it("computes leftover as planned income minus expenses", () => {
    const w = computeWaterfall({
      plannedIncomeMinor: 200_000_00,
      expensesMinor: 80_000_00,
      projectAllocationPercent: 50,
    });
    expect(w.leftoverMinor).toBe(120_000_00);
  });

  it("takes exactly 70% for lifetime with floor rounding", () => {
    expect(LIFETIME_SAVINGS_PERCENT).toBe(70);
    const w = computeWaterfall({
      plannedIncomeMinor: 200_000_00,
      expensesMinor: 0,
    });
    expect(w.lifetimeTakeMinor).toBe(percentOf(200_000_00, 70));
    expect(w.postLifetimeMinor).toBe(200_000_00 - w.lifetimeTakeMinor);
  });

  it("owner walkthrough: leftover 20_000 → lifetime 14_000 → post 6_000 → 50% project = 3_000", () => {
    // Values in whole CRC minor units where 1 CRC = 100 minor in app; use plain ints for clarity.
    const leftover = 20_000;
    const w = computeWaterfall({
      plannedIncomeMinor: leftover,
      expensesMinor: 0,
      projectAllocationPercent: 50,
    });
    expect(w.lifetimeTakeMinor).toBe(14_000);
    expect(w.postLifetimeMinor).toBe(6_000);
    expect(w.projectTakeMinor).toBe(3_000);
  });

  it("zero leftover yields zero takes", () => {
    const w = computeWaterfall({
      plannedIncomeMinor: 50_000,
      expensesMinor: 80_000,
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
      plannedIncomeMinor: 100_000,
      expensesMinor: 0,
      projectAllocationPercent: 99,
    });
    // leftover 100000 → lifetime 70000 → post 30000 → 70% = 21000
    expect(w.projectTakeMinor).toBe(21_000);
  });
});
