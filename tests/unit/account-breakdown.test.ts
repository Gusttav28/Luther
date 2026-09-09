import { describe, expect, it } from "vitest";
import {
  computeWaterfall,
  plannedSalaryTakeMinor,
  savingsMonthBreakdownFromTakes,
} from "@/lib/waterfall";

describe("savings month breakdown composition (no second leftover)", () => {
  it("projectedSum equals fromMain + fromPlanned", () => {
    const fromMain = 56_000;
    const fromPlanned = 35_000;
    const breakdown = savingsMonthBreakdownFromTakes(fromMain, fromPlanned);
    expect(breakdown.projectedSum).toBe(fromMain + fromPlanned);
    expect(breakdown.projectedSum).toBe(91_000);
  });

  it("received 100 / planned 50 / charged 20 / planning 0 → 56, 91, 35", () => {
    const input = {
      receivedIncomeMinor: 100_000,
      plannedSalaryMinor: 50_000,
      chargedExpensesMinor: 20_000,
      planningExpensesMinor: 0,
    };
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
    const fromPlanned = plannedSalaryTakeMinor(input);
    const breakdown = savingsMonthBreakdownFromTakes(actual, fromPlanned);

    expect(actual).toBe(56_000);
    expect(combined).toBe(91_000);
    expect(fromPlanned).toBe(35_000);
    expect(breakdown.fromMain).toBe(actual);
    expect(breakdown.fromPlanned).toBe(fromPlanned);
    expect(breakdown.projectedSum).toBe(actual + fromPlanned);
    expect(breakdown.projectedSum).toBe(combined);
  });

  it("null legs stay null and do not coerce to 0", () => {
    expect(savingsMonthBreakdownFromTakes(null, 10).projectedSum).toBeNull();
    expect(savingsMonthBreakdownFromTakes(10, null).projectedSum).toBeNull();
    expect(savingsMonthBreakdownFromTakes(null, null).projectedSum).toBeNull();
  });
});
